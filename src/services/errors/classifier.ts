import { randomUUID } from 'expo-crypto'
import { Card, Deck, ReviewResponse } from '../../types'
import { ErrorCategory, ErrorEvent, ErrorPattern } from '../../types/errors'

/** Language-related deck name patterns */
const LANGUAGE_DECK_PATTERNS = [
  /spanish/i, /mandarin/i, /chinese/i, /french/i, /german/i,
  /japanese/i, /korean/i, /italian/i, /portuguese/i, /russian/i,
  /arabic/i, /hindi/i, /dutch/i, /swedish/i, /lang/i, /vocab/i,
]

/** Common false-friend patterns across languages */
const FALSE_FRIEND_PATTERNS = [
  /actually|actuel/i, /sensible|sensible/i, /embarazada|embarrass/i,
  /regalo|regal/i, /fabric|fábrica/i, /attend|atender/i,
]

/** Register-related keywords */
const REGISTER_KEYWORDS = [
  /formal|informal/i, /polite|casual/i, /honorific/i,
  /tú|usted/i, /tu|vous/i, /du|sie/i, /敬語/i,
]

function isLanguageDeck(deck: Deck): boolean {
  return LANGUAGE_DECK_PATTERNS.some((pattern) => pattern.test(deck.name))
}

function hasFalseFriendSignals(card: Card): boolean {
  const text = `${card.question} ${card.answer}`
  return FALSE_FRIEND_PATTERNS.some((pattern) => pattern.test(text))
}

function hasRegisterSignals(card: Card): boolean {
  const text = `${card.question} ${card.answer}`
  return REGISTER_KEYWORDS.some((pattern) => pattern.test(text))
}

export class ErrorClassifier {
  /**
   * Classify a single review into an ErrorEvent.
   * Uses heuristics based on card state, response time, deck context, and content signals.
   */
  classify(
    card: Card,
    response: ReviewResponse,
    responseTimeMs: number | null,
    deckContext: Deck
  ): ErrorEvent {
    const isLangDeck = isLanguageDeck(deckContext)
    const { category, subcategory, confidence } = this.determineCategory(
      card,
      response,
      responseTimeMs,
      isLangDeck
    )

    return {
      id: randomUUID(),
      cardId: card.id,
      deckId: card.deckId,
      category,
      subcategory,
      timestamp: new Date(),
      responseTimeMs,
      context: card.question,
      correction: card.answer,
      confidence,
    }
  }

  private determineCategory(
    card: Card,
    response: ReviewResponse,
    responseTimeMs: number | null,
    isLangDeck: boolean
  ): { category: ErrorCategory; subcategory?: string; confidence: number } {
    // Heuristic 1: Long response time + Hard (eventually got it) → PartialRecall
    if (
      responseTimeMs !== null &&
      responseTimeMs > 15000 &&
      response === ReviewResponse.Hard
    ) {
      return { category: ErrorCategory.PartialRecall, confidence: 0.8 }
    }

    // Heuristic 2: High lapse count → PlainForgetting or ConceptualGap
    if (card.lapses > 3) {
      // If difficulty is very high, likely a conceptual gap
      if (card.difficulty > 7) {
        return { category: ErrorCategory.ConceptualGap, confidence: 0.75 }
      }
      return { category: ErrorCategory.PlainForgetting, confidence: 0.8 }
    }

    // Heuristic 3: Short response time + Again → ConceptualGap (guessed wrong confidently)
    if (
      responseTimeMs !== null &&
      responseTimeMs < 3000 &&
      response === ReviewResponse.Again
    ) {
      return { category: ErrorCategory.ConceptualGap, confidence: 0.7 }
    }

    // Language-specific heuristics
    if (isLangDeck) {
      // Check for false friend signals
      if (hasFalseFriendSignals(card)) {
        return { category: ErrorCategory.FalseFriend, confidence: 0.65 }
      }

      // Check for register-related content
      if (hasRegisterSignals(card)) {
        return {
          category: ErrorCategory.RegisterMismatch,
          subcategory: 'formality',
          confidence: 0.6,
        }
      }

      // General language lapse → L1 Interference is most common
      if (response === ReviewResponse.Again) {
        return { category: ErrorCategory.L1Interference, confidence: 0.55 }
      }

      // Hard on language card with moderate response time
      if (response === ReviewResponse.Hard) {
        return { category: ErrorCategory.PartialRecall, confidence: 0.6 }
      }
    }

    // Heuristic 4: Card with some reps but still failing → Overgeneralization
    if (card.reps > 2 && card.lapses > 1 && response === ReviewResponse.Again) {
      return { category: ErrorCategory.Overgeneralization, confidence: 0.5 }
    }

    // Heuristic 5: Moderate response time + Again → PartialRecall
    if (
      responseTimeMs !== null &&
      responseTimeMs > 8000 &&
      response === ReviewResponse.Again
    ) {
      return { category: ErrorCategory.PartialRecall, confidence: 0.6 }
    }

    // Default: PlainForgetting for Again, PartialRecall for Hard
    if (response === ReviewResponse.Again) {
      return { category: ErrorCategory.PlainForgetting, confidence: 0.5 }
    }

    return { category: ErrorCategory.PartialRecall, confidence: 0.5 }
  }

  /**
   * Aggregate a list of ErrorEvents into ErrorPatterns.
   * Groups by category+subcategory and computes stats.
   */
  classifyBatch(events: ErrorEvent[]): ErrorPattern[] {
    if (events.length === 0) return []

    const groups = new Map<string, ErrorEvent[]>()

    for (const event of events) {
      const key = event.subcategory
        ? `${event.category}::${event.subcategory}`
        : event.category
      const existing = groups.get(key) ?? []
      existing.push(event)
      groups.set(key, existing)
    }

    const patterns: ErrorPattern[] = []

    for (const [key, groupEvents] of groups) {
      const sorted = [...groupEvents].sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      )
      const first = sorted[0]
      const last = sorted[sorted.length - 1]

      const [category, subcategory] = key.includes('::')
        ? (key.split('::') as [ErrorCategory, string])
        : [key as ErrorCategory, undefined]

      const cardIds = [...new Set(groupEvents.map((e) => e.cardId))]
      const reductionRate = this.computeReductionRate(sorted)

      const pattern: ErrorPattern = {
        category,
        subcategory,
        count: groupEvents.length,
        firstSeen: new Date(first.timestamp),
        lastSeen: new Date(last.timestamp),
        trend: this.detectTrendFromEvents(sorted),
        relatedCardIds: cardIds,
        reductionRate,
      }

      patterns.push(pattern)
    }

    return patterns.sort((a, b) => b.count - a.count)
  }

  /**
   * Detect whether an error pattern is improving, stable, or worsening
   * by comparing the first half vs second half of recent events.
   */
  detectTrend(
    pattern: ErrorPattern,
    recentEvents: ErrorEvent[]
  ): 'improving' | 'stable' | 'worsening' {
    const relevant = recentEvents.filter(
      (e) =>
        e.category === pattern.category &&
        (pattern.subcategory === undefined || e.subcategory === pattern.subcategory)
    )

    return this.detectTrendFromEvents(relevant)
  }

  private detectTrendFromEvents(
    events: ErrorEvent[]
  ): 'improving' | 'stable' | 'worsening' {
    if (events.length < 4) return 'stable'

    const midpoint = Math.floor(events.length / 2)
    const firstHalf = events.slice(0, midpoint)
    const secondHalf = events.slice(midpoint)

    // Compare error rates: count per time unit
    const firstSpanMs =
      new Date(firstHalf[firstHalf.length - 1].timestamp).getTime() -
      new Date(firstHalf[0].timestamp).getTime()
    const secondSpanMs =
      new Date(secondHalf[secondHalf.length - 1].timestamp).getTime() -
      new Date(secondHalf[0].timestamp).getTime()

    // Avoid division by zero — use count ratio if spans are very small
    if (firstSpanMs < 1000 || secondSpanMs < 1000) {
      if (secondHalf.length < firstHalf.length) return 'improving'
      if (secondHalf.length > firstHalf.length) return 'worsening'
      return 'stable'
    }

    const firstRate = firstHalf.length / firstSpanMs
    const secondRate = secondHalf.length / secondSpanMs

    const ratio = secondRate / firstRate

    if (ratio < 0.7) return 'improving'
    if (ratio > 1.3) return 'worsening'
    return 'stable'
  }

  private computeReductionRate(sortedEvents: ErrorEvent[]): number {
    if (sortedEvents.length < 2) return 0

    // Compare last 5 vs previous 5
    const windowSize = Math.min(5, Math.floor(sortedEvents.length / 2))
    if (windowSize < 1) return 0

    const recent = sortedEvents.slice(-windowSize)
    const earlier = sortedEvents.slice(
      Math.max(0, sortedEvents.length - windowSize * 2),
      sortedEvents.length - windowSize
    )

    if (earlier.length === 0) return 0

    // Reduction = (earlier - recent) / earlier * 100
    const reduction = ((earlier.length - recent.length) / earlier.length) * 100
    return Math.round(reduction)
  }
}
