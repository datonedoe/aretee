import { randomUUID } from 'expo-crypto'
import { Card, Deck, isCardDue } from '../../types'
import {
  MicroChallenge,
  MicroChallengeType,
  QuietHoursConfig,
  DEFAULT_QUIET_HOURS,
} from '../../types/interleaving'
import { getStorageService } from '../platform'

const STORAGE_KEY_SCHEDULE = '@aretee/micro-schedule'
const STORAGE_KEY_QUIET_HOURS = '@aretee/quiet-hours'

/**
 * Micro-Challenge Scheduler: generates 30-second review challenges
 * timed to FSRS review schedule for push notification delivery.
 *
 * Challenge types:
 * - QuickRecall: "What does X mean?" (5-10 sec)
 * - FillTheGap: "Complete: ¿Cómo ___?" (10 sec)
 * - ListeningSnap: 10-sec audio clip recognition (future)
 * - CulturalMicro: "Did you know?" one-liner (5 sec)
 */
export class MicroChallengeScheduler {
  private quietHours: QuietHoursConfig = DEFAULT_QUIET_HOURS
  private scheduledChallenges: MicroChallenge[] = []

  async load(): Promise<void> {
    const storage = getStorageService()
    const stored = await storage.get<MicroChallenge[]>(STORAGE_KEY_SCHEDULE)
    const quietConfig = await storage.get<QuietHoursConfig>(STORAGE_KEY_QUIET_HOURS)
    this.scheduledChallenges = stored ?? []
    this.quietHours = quietConfig ?? DEFAULT_QUIET_HOURS
  }

  /**
   * Generate micro-challenges for the next N hours based on FSRS schedule.
   */
  generateChallenges(
    decks: Deck[],
    hoursAhead: number = 8,
    maxChallenges: number = 10
  ): MicroChallenge[] {
    const now = new Date()
    const cutoff = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000)

    // Find cards due within the window
    const upcomingCards: { card: Card; dueAt: Date }[] = []
    for (const deck of decks) {
      for (const card of deck.cards) {
        const dueDate = new Date(card.nextReviewDate)
        if (dueDate >= now && dueDate <= cutoff) {
          upcomingCards.push({ card, dueAt: dueDate })
        }
      }
    }

    // Also include currently overdue cards
    for (const deck of decks) {
      for (const card of deck.cards) {
        if (isCardDue(card) && upcomingCards.length < maxChallenges * 2) {
          upcomingCards.push({ card, dueAt: now })
        }
      }
    }

    // Sort by due date
    upcomingCards.sort(
      (a, b) => a.dueAt.getTime() - b.dueAt.getTime()
    )

    // Generate challenges, respecting quiet hours
    const challenges: MicroChallenge[] = []
    for (const { card, dueAt } of upcomingCards) {
      if (challenges.length >= maxChallenges) break

      const scheduledTime = this.adjustForQuietHours(dueAt)
      if (!scheduledTime) continue

      const challenge = this.createChallenge(card, scheduledTime)
      challenges.push(challenge)
    }

    this.scheduledChallenges = challenges
    return challenges
  }

  /**
   * Get pending challenges that haven't been delivered yet.
   */
  getPending(): MicroChallenge[] {
    const now = new Date()
    return this.scheduledChallenges.filter(
      (c) => new Date(c.scheduledFor) <= now
    )
  }

  /**
   * Mark a challenge as completed (remove from schedule).
   */
  async complete(challengeId: string): Promise<void> {
    this.scheduledChallenges = this.scheduledChallenges.filter(
      (c) => c.id !== challengeId
    )
    await this.save()
  }

  async setQuietHours(config: QuietHoursConfig): Promise<void> {
    this.quietHours = config
    const storage = getStorageService()
    await storage.set(STORAGE_KEY_QUIET_HOURS, config)
  }

  getQuietHours(): QuietHoursConfig {
    return { ...this.quietHours }
  }

  /**
   * Create a micro-challenge from a card.
   * Selects challenge type based on card content.
   */
  private createChallenge(card: Card, scheduledFor: Date): MicroChallenge {
    const type = this.selectChallengeType(card)
    const { prompt, expectedAnswer } = this.buildChallengeContent(card, type)

    return {
      id: randomUUID(),
      type,
      card,
      prompt,
      expectedAnswer,
      timeLimit: this.getTimeLimit(type),
      scheduledFor,
    }
  }

  /**
   * Select challenge type based on card characteristics.
   */
  private selectChallengeType(card: Card): MicroChallengeType {
    // Cards with high stability → quick recall (they should know this)
    if (card.stability > 15) {
      return MicroChallengeType.QuickRecall
    }

    // Cards with gaps/blanks in the answer → fill the gap
    if (card.answer.includes('...') || card.answer.includes('___')) {
      return MicroChallengeType.FillTheGap
    }

    // Low reps → quick recall to reinforce
    if (card.reps < 3) {
      return MicroChallengeType.QuickRecall
    }

    // Default: alternate between quick recall and fill the gap
    return Math.random() > 0.5
      ? MicroChallengeType.QuickRecall
      : MicroChallengeType.FillTheGap
  }

  /**
   * Build prompt and expected answer for a challenge type.
   */
  private buildChallengeContent(
    card: Card,
    type: MicroChallengeType
  ): { prompt: string; expectedAnswer: string } {
    switch (type) {
      case MicroChallengeType.QuickRecall:
        return {
          prompt: `⚡ Quick recall: ${card.question}`,
          expectedAnswer: card.answer,
        }

      case MicroChallengeType.FillTheGap: {
        // Create a gap from the answer
        const words = card.answer.split(' ')
        if (words.length >= 3) {
          const gapIndex = Math.floor(words.length / 2)
          const gapWord = words[gapIndex]
          const gapped = words
            .map((w, i) => (i === gapIndex ? '___' : w))
            .join(' ')
          return {
            prompt: `📝 Fill the gap: ${card.question}\n${gapped}`,
            expectedAnswer: gapWord,
          }
        }
        return {
          prompt: `📝 What's the answer? ${card.question}`,
          expectedAnswer: card.answer,
        }
      }

      case MicroChallengeType.ListeningSnap:
        return {
          prompt: `🎧 Listen and identify: ${card.question}`,
          expectedAnswer: card.answer,
        }

      case MicroChallengeType.PictureDescribe:
        return {
          prompt: `🖼️ Describe: ${card.question}`,
          expectedAnswer: card.answer,
        }

      case MicroChallengeType.CulturalMicro:
        return {
          prompt: `💡 Did you know? ${card.question}`,
          expectedAnswer: card.answer,
        }
    }
  }

  /**
   * Time limit in seconds per challenge type.
   */
  private getTimeLimit(type: MicroChallengeType): number {
    switch (type) {
      case MicroChallengeType.QuickRecall:
        return 10
      case MicroChallengeType.FillTheGap:
        return 15
      case MicroChallengeType.ListeningSnap:
        return 15
      case MicroChallengeType.PictureDescribe:
        return 20
      case MicroChallengeType.CulturalMicro:
        return 10
    }
  }

  /**
   * Adjust a scheduled time to respect quiet hours.
   * Returns null if the time can't be reasonably adjusted.
   */
  private adjustForQuietHours(time: Date): Date | null {
    if (!this.quietHours.enabled) return time

    const hour = time.getHours()
    const { startHour, endHour } = this.quietHours

    // Check if time falls within quiet hours
    const inQuiet =
      startHour > endHour
        ? hour >= startHour || hour < endHour // Wraps midnight (e.g., 22-8)
        : hour >= startHour && hour < endHour // Same day range

    if (!inQuiet) return time

    // Push to end of quiet hours
    const adjusted = new Date(time)
    if (hour >= startHour) {
      // Past start → push to next day's endHour
      adjusted.setDate(adjusted.getDate() + 1)
    }
    adjusted.setHours(endHour, 0, 0, 0)
    return adjusted
  }

  private async save(): Promise<void> {
    const storage = getStorageService()
    await storage.set(STORAGE_KEY_SCHEDULE, this.scheduledChallenges)
  }
}
