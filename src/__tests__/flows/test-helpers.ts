/**
 * Shared helpers and mocks for flow tests.
 * Import this AFTER vi.mock() calls in each test file.
 */
import { Card, CardState, SyncStatus } from '../../types'

export function makeCard(overrides: Partial<Card> = {}): Card {
  return {
    id: `card-${Math.random().toString(36).slice(2)}`,
    question: 'What is 2+2?',
    answer: '4',
    sourceFilePath: '/vault/math.md',
    lineStart: 0,
    lineEnd: 1,
    nextReviewDate: new Date(2020, 0, 1), // past date = due
    interval: 0,
    ease: 250,
    reviewCount: 0,
    syncStatus: SyncStatus.Synced,
    lastModified: new Date(),
    deckId: 'deck1',
    difficulty: 0,
    stability: 0,
    retrievability: 0,
    elapsed_days: 0,
    scheduled_days: 0,
    last_review: null,
    reps: 0,
    lapses: 0,
    state: CardState.New,
    responseTimeMs: null,
    ...overrides,
  }
}

export function makeDeck(id: string, name: string, cards: Card[]) {
  return {
    id,
    name,
    folderPath: `/vault/${name}`,
    lastScanned: new Date(),
    cards,
  }
}
