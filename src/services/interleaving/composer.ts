import { Card, Deck, CardState, isCardDue } from '../../types'
import { ErrorPattern, ErrorCategory } from '../../types/errors'
import {
  SessionSegment,
  SessionSegmentMode,
  InterleavingConfig,
  DEFAULT_INTERLEAVING_CONFIG,
} from '../../types/interleaving'

/**
 * Session Composer: builds interleaved, multi-mode study sessions.
 *
 * Principles (from research):
 * 1. Interleave topics — never drill one deck in isolation
 * 2. Mix difficulty — alternate easy/hard for desirable difficulty
 * 3. Mode switching — Flash → Socratic → Feynman based on card state
 * 4. Weakness targeting — prioritize cards matching error patterns
 */
export class SessionComposer {
  /**
   * Compose a blended session from available decks and error patterns.
   */
  compose(
    decks: Deck[],
    errorPatterns: ErrorPattern[],
    config: InterleavingConfig = DEFAULT_INTERLEAVING_CONFIG
  ): SessionSegment[] {
    // 1. Gather all due cards across decks
    const allDueCards = this.gatherDueCards(decks, config.crossDeckMixing)

    if (allDueCards.length === 0) return []

    // 2. Split into weakness-targeted and general pools
    const weakCardIds = this.getWeakCardIds(errorPatterns)
    const weakCards = allDueCards.filter((c) => weakCardIds.has(c.id))
    const generalCards = allDueCards.filter((c) => !weakCardIds.has(c.id))

    // 3. Select cards for session with weakness focus
    const sessionCards = this.selectCards(
      weakCards,
      generalCards,
      config.sessionSize,
      config.weaknessFocus
    )

    // 4. Interleave: reorder for difficulty variation and deck mixing
    const interleaved = this.interleave(sessionCards, config.difficultySpread)

    // 5. Assign modes to each card
    const segments = interleaved.map((card) =>
      this.assignMode(card, errorPatterns, config.enabledModes)
    )

    return segments
  }

  /**
   * Gather all due cards, optionally across multiple decks.
   */
  private gatherDueCards(decks: Deck[], crossDeck: boolean): Card[] {
    const activeDeck = crossDeck ? decks : decks.slice(0, 1)
    const due: Card[] = []

    for (const deck of activeDeck) {
      for (const card of deck.cards) {
        if (isCardDue(card)) {
          due.push(card)
        }
      }
    }

    return due
  }

  /**
   * Get card IDs associated with the user's top error patterns.
   */
  private getWeakCardIds(patterns: ErrorPattern[]): Set<string> {
    const ids = new Set<string>()
    for (const pattern of patterns.slice(0, 5)) {
      for (const cardId of pattern.relatedCardIds) {
        ids.add(cardId)
      }
    }
    return ids
  }

  /**
   * Select cards from weak and general pools with the configured ratio.
   */
  private selectCards(
    weakCards: Card[],
    generalCards: Card[],
    sessionSize: number,
    weaknessFocus: number
  ): Card[] {
    const weakTarget = Math.min(
      Math.round(sessionSize * weaknessFocus),
      weakCards.length
    )
    const generalTarget = Math.min(
      sessionSize - weakTarget,
      generalCards.length
    )

    // Prioritize weak cards by highest difficulty
    const sortedWeak = [...weakCards]
      .sort((a, b) => b.difficulty - a.difficulty)
      .slice(0, weakTarget)

    // General cards: mix of overdue (sorted by how overdue) and new
    const sortedGeneral = [...generalCards]
      .sort((a, b) => {
        const aOverdue = Date.now() - new Date(a.nextReviewDate).getTime()
        const bOverdue = Date.now() - new Date(b.nextReviewDate).getTime()
        return bOverdue - aOverdue
      })
      .slice(0, generalTarget)

    return [...sortedWeak, ...sortedGeneral]
  }

  /**
   * Reorder cards for interleaving:
   * - Avoid consecutive same-deck cards
   * - Alternate difficulty levels
   */
  private interleave(cards: Card[], difficultySpread: number): Card[] {
    if (cards.length <= 2) return cards

    // Sort by difficulty for initial ordering
    const sorted = [...cards].sort((a, b) => a.difficulty - b.difficulty)

    // Riffle shuffle: alternate from low and high difficulty ends
    const result: Card[] = []
    let lo = 0
    let hi = sorted.length - 1
    let fromLow = true

    while (lo <= hi) {
      if (fromLow) {
        result.push(sorted[lo])
        lo++
      } else {
        result.push(sorted[hi])
        hi--
      }
      fromLow = !fromLow
    }

    // Post-pass: break up consecutive same-deck cards
    return this.breakDeckRuns(result)
  }

  /**
   * Swap adjacent same-deck cards to avoid runs of the same deck.
   */
  private breakDeckRuns(cards: Card[]): Card[] {
    const result = [...cards]
    for (let i = 1; i < result.length; i++) {
      if (result[i].deckId === result[i - 1].deckId) {
        // Look ahead for a different-deck card to swap with
        for (let j = i + 1; j < result.length; j++) {
          if (result[j].deckId !== result[i - 1].deckId) {
            const temp = result[i]
            result[i] = result[j]
            result[j] = temp
            break
          }
        }
      }
    }
    return result
  }

  /**
   * Assign a learning mode to a card based on its state and error history.
   *
   * Rules:
   * - New cards → Flash (introduce via simple Q&A)
   * - High lapse cards → Socratic (guided dialogue to build understanding)
   * - Cards with ConceptualGap errors → Feynman (force explanation)
   * - Mature cards → Flash (quick recall check)
   * - Cards with PartialRecall → Socratic (probe the gaps)
   * - Everything else → weighted random from enabled modes, biased toward Flash
   */
  private assignMode(
    card: Card,
    errorPatterns: ErrorPattern[],
    enabledModes: SessionSegmentMode[]
  ): SessionSegment {
    // Find if this card has specific error patterns
    const cardErrors = errorPatterns.filter((p) =>
      p.relatedCardIds.includes(card.id)
    )
    const primaryError = cardErrors[0]

    // New cards → Flash
    if (card.state === CardState.New) {
      return {
        card,
        mode: SessionSegmentMode.Flash,
        reason: 'New card — introducing via flashcard',
      }
    }

    // ConceptualGap → Feynman (force them to explain it)
    if (
      primaryError?.category === ErrorCategory.ConceptualGap &&
      enabledModes.includes(SessionSegmentMode.Feynman)
    ) {
      return {
        card,
        mode: SessionSegmentMode.Feynman,
        reason: 'Conceptual gap detected — explain to understand',
      }
    }

    // High lapses or PartialRecall → Socratic
    if (
      (card.lapses >= 3 ||
        primaryError?.category === ErrorCategory.PartialRecall ||
        primaryError?.category === ErrorCategory.L1Interference) &&
      enabledModes.includes(SessionSegmentMode.Socratic)
    ) {
      return {
        card,
        mode: SessionSegmentMode.Socratic,
        reason:
          card.lapses >= 3
            ? `${card.lapses} lapses — guided dialogue to rebuild understanding`
            : `${primaryError?.category} — probing with questions`,
      }
    }

    // Mature cards → Flash (quick check)
    if (card.state === CardState.Review && card.stability > 10) {
      return {
        card,
        mode: SessionSegmentMode.Flash,
        reason: 'Mature card — quick recall check',
      }
    }

    // Default: weighted random, biased toward Flash
    const mode = this.weightedRandomMode(enabledModes)
    return {
      card,
      mode,
      reason: 'Interleaved mode selection',
    }
  }

  /**
   * Weighted random mode selection: Flash 60%, Socratic 25%, Feynman 15%
   */
  private weightedRandomMode(
    enabledModes: SessionSegmentMode[]
  ): SessionSegmentMode {
    const weights: Record<SessionSegmentMode, number> = {
      [SessionSegmentMode.Flash]: 60,
      [SessionSegmentMode.Socratic]: 25,
      [SessionSegmentMode.Feynman]: 15,
    }

    const available = enabledModes.map((m) => ({
      mode: m,
      weight: weights[m],
    }))
    const totalWeight = available.reduce((sum, a) => sum + a.weight, 0)
    let random = Math.random() * totalWeight

    for (const { mode, weight } of available) {
      random -= weight
      if (random <= 0) return mode
    }

    return enabledModes[0]
  }
}
