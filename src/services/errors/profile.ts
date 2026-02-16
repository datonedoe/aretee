import { getStorageService } from '../platform'
import { ErrorEvent, ErrorPattern, ErrorCategory, UserErrorProfile } from '../../types/errors'
import { Card, Deck } from '../../types'
import { ErrorClassifier } from './classifier'

const STORAGE_KEY_EVENTS = '@aretee/error-events'
const STORAGE_KEY_PROFILE = '@aretee/error-profile'
const MAX_EVENTS = 500

export class ErrorProfileManager {
  private classifier = new ErrorClassifier()
  private events: ErrorEvent[] = []
  private profile: UserErrorProfile | null = null
  private loaded = false

  async load(): Promise<void> {
    if (this.loaded) return
    const storage = getStorageService()
    const storedEvents = await storage.get<ErrorEvent[]>(STORAGE_KEY_EVENTS)
    const storedProfile = await storage.get<UserErrorProfile>(STORAGE_KEY_PROFILE)
    this.events = storedEvents ?? []
    this.profile = storedProfile ?? null
    this.loaded = true
  }

  async recordError(event: ErrorEvent): Promise<void> {
    await this.load()
    this.events.push(event)
    if (this.events.length > MAX_EVENTS) {
      this.events = this.events.slice(-MAX_EVENTS)
    }
    await this.rebuildProfile()
    await this.save()
  }

  async getProfile(): Promise<UserErrorProfile> {
    await this.load()
    if (!this.profile) {
      await this.rebuildProfile()
    }
    return this.profile!
  }

  async getTopWeaknesses(limit: number = 5): Promise<ErrorPattern[]> {
    const profile = await this.getProfile()
    return profile.patterns.slice(0, limit)
  }

  async getTargetedPracticeCards(decks: Deck[], limit: number = 10): Promise<Card[]> {
    const profile = await this.getProfile()
    const weakCardIds = new Set<string>()

    for (const pattern of profile.patterns.slice(0, 3)) {
      for (const cardId of pattern.relatedCardIds) {
        weakCardIds.add(cardId)
      }
    }

    const cards: Card[] = []
    for (const deck of decks) {
      for (const card of deck.cards) {
        if (weakCardIds.has(card.id) && cards.length < limit) {
          cards.push(card)
        }
      }
    }
    return cards
  }

  async getErrorHistory(cardId?: string): Promise<ErrorEvent[]> {
    await this.load()
    if (cardId) {
      return this.events.filter((e) => e.cardId === cardId)
    }
    return [...this.events]
  }

  async getReductionStats(): Promise<{ category: ErrorCategory; reduction: number }[]> {
    const profile = await this.getProfile()
    return profile.patterns.map((p) => ({
      category: p.category,
      reduction: p.reductionRate,
    }))
  }

  private async rebuildProfile(): Promise<void> {
    const patterns = this.classifier.classifyBatch(this.events)
    const totalErrors = this.events.length

    this.profile = {
      userId: 'default',
      patterns,
      topWeaknesses: patterns.slice(0, 5).map((p) => p.category),
      lastUpdated: new Date(),
      totalErrors,
      totalReviews: totalErrors,
      errorRate: 0,
    }
  }

  private async save(): Promise<void> {
    const storage = getStorageService()
    await storage.set(STORAGE_KEY_EVENTS, this.events)
    if (this.profile) {
      await storage.set(STORAGE_KEY_PROFILE, this.profile)
    }
  }
}
