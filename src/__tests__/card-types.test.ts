import { describe, it, expect } from 'vitest'
import { Card, CardState, isCardDue, createCard, ParsedCard } from '../types/card'
import { SyncStatus } from '../types/enums'

describe('isCardDue', () => {
  const makeCard = (nextReviewDate: Date): Card => ({
    id: 'test',
    question: 'Q',
    answer: 'A',
    sourceFilePath: '/test.md',
    lineStart: 0,
    lineEnd: 1,
    nextReviewDate,
    interval: 1,
    ease: 250,
    reviewCount: 0,
    syncStatus: SyncStatus.Synced,
    lastModified: new Date(),
    deckId: 'deck1',
    difficulty: 5,
    stability: 1,
    retrievability: 0.9,
    elapsed_days: 0,
    scheduled_days: 1,
    last_review: null,
    reps: 0,
    lapses: 0,
    state: CardState.New,
    responseTimeMs: null,
  })

  it('card with past date is due', () => {
    const card = makeCard(new Date(2020, 0, 1))
    expect(isCardDue(card)).toBe(true)
  })

  it('card with future date is not due', () => {
    const card = makeCard(new Date(2099, 0, 1))
    expect(isCardDue(card)).toBe(false)
  })

  it('card with today/now is due (<=)', () => {
    const card = makeCard(new Date())
    expect(isCardDue(card)).toBe(true)
  })
})

describe('createCard', () => {
  const baseParsed: ParsedCard = {
    question: 'What is 2+2?',
    answer: '4',
    lineStart: 0,
    lineEnd: 1,
    nextReviewDate: null,
    interval: null,
    ease: null,
    difficulty: null,
    stability: null,
    isBidirectional: false,
  }

  it('assigns correct defaults for null fields', () => {
    const card = createCard(baseParsed, '/test.md', 'deck1')
    expect(card.question).toBe('What is 2+2?')
    expect(card.answer).toBe('4')
    expect(card.interval).toBe(0)
    expect(card.ease).toBe(250)
    expect(card.difficulty).toBe(0)
    expect(card.stability).toBe(0)
    expect(card.state).toBe(CardState.New)
    expect(card.reps).toBe(0)
    expect(card.lapses).toBe(0)
    expect(card.last_review).toBeNull()
    expect(card.responseTimeMs).toBeNull()
    expect(card.syncStatus).toBe(SyncStatus.Synced)
    expect(card.deckId).toBe('deck1')
    expect(card.sourceFilePath).toBe('/test.md')
  })

  it('uses parsed values when present', () => {
    const parsed: ParsedCard = {
      ...baseParsed,
      nextReviewDate: new Date(2026, 5, 1),
      interval: 10,
      ease: 300,
      difficulty: 7.5,
      stability: 15.2,
    }
    const card = createCard(parsed, '/test.md', 'deck2')
    expect(card.interval).toBe(10)
    expect(card.ease).toBe(300)
    expect(card.difficulty).toBe(7.5)
    expect(card.stability).toBe(15.2)
    expect(card.nextReviewDate.getFullYear()).toBe(2026)
  })

  it('generates unique IDs', () => {
    const card1 = createCard(baseParsed, '/a.md', 'd1')
    const card2 = createCard(baseParsed, '/b.md', 'd2')
    expect(card1.id).not.toBe(card2.id)
  })

  it('reviewCount starts at 0', () => {
    const card = createCard(baseParsed, '/test.md', 'deck1')
    expect(card.reviewCount).toBe(0)
  })
})
