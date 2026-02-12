import { Card, CardState } from '../../types'

/**
 * Migrate SM-2 cards to FSRS parameters.
 * Maps ease + interval to approximate FSRS stability and difficulty.
 * Preserves all existing review history.
 */
export function migrateCardToFSRS(card: Card): Partial<Card> {
  // If already migrated (has non-zero stability), skip
  if (card.stability > 0) return {}

  // New cards that have never been reviewed
  if (card.reviewCount === 0 && card.interval === 0) {
    return {
      state: CardState.New,
      difficulty: 0,
      stability: 0,
      retrievability: 0,
      elapsed_days: 0,
      scheduled_days: 0,
      last_review: null,
      reps: 0,
      lapses: 0,
    }
  }

  // Map SM-2 ease (130-350+) to FSRS difficulty (1-10)
  // ease 250 = average → difficulty ~5
  // ease 130 = hard → difficulty ~9
  // ease 350+ = easy → difficulty ~2
  const ease = card.ease || 250
  const difficulty = Math.min(10, Math.max(1, 5 + (250 - ease) / 30))

  // Map interval to stability (they're roughly equivalent in FSRS at 90% retention)
  const stability = Math.max(0.1, card.interval)

  // Estimate state from review history
  let state: CardState
  if (card.interval <= 1) {
    state = CardState.Learning
  } else {
    state = CardState.Review
  }

  return {
    difficulty,
    stability,
    retrievability: 0, // Will be recalculated on next review
    elapsed_days: card.interval,
    scheduled_days: card.interval,
    last_review: card.lastModified,
    reps: card.reviewCount,
    lapses: 0,
    state,
  }
}

/**
 * Migrate all cards in a deck to FSRS parameters.
 */
export function migrateDeckToFSRS(cards: Card[]): Map<string, Partial<Card>> {
  const updates = new Map<string, Partial<Card>>()

  for (const card of cards) {
    const fsrsUpdates = migrateCardToFSRS(card)
    if (Object.keys(fsrsUpdates).length > 0) {
      updates.set(card.id, fsrsUpdates)
    }
  }

  return updates
}
