import { describe, it, expect } from 'vitest'
import { ErrorClassifier } from '../services/errors/classifier'
import { ErrorCategory, ErrorEvent } from '../types/errors'
import { Card, Deck, ReviewResponse, CardState, SyncStatus } from '../types'

function mockCard(overrides: Partial<Card> = {}): Card {
  return {
    id: 'card-1',
    question: 'Test question',
    answer: 'Test answer',
    sourceFilePath: '/test/card.md',
    lineStart: 1,
    lineEnd: 3,
    nextReviewDate: new Date(),
    interval: 4,
    ease: 250,
    reviewCount: 3,
    syncStatus: SyncStatus.Synced,
    lastModified: new Date(),
    deckId: 'deck-1',
    difficulty: 3,
    stability: 4,
    retrievability: 0.9,
    elapsed_days: 1,
    scheduled_days: 4,
    last_review: new Date(Date.now() - 86400000),
    reps: 3,
    lapses: 0,
    state: CardState.Review,
    responseTimeMs: 5000,
    ...overrides,
  }
}

function mockDeck(name: string, cards: Card[] = []): Deck {
  return {
    id: 'deck-1',
    name,
    folderPath: '/test/deck',
    lastScanned: new Date(),
    cards,
  }
}

function mockErrorEvent(overrides: Partial<ErrorEvent> = {}): ErrorEvent {
  return {
    id: 'event-1',
    cardId: 'card-1',
    deckId: 'deck-1',
    category: ErrorCategory.PlainForgetting,
    timestamp: new Date(),
    responseTimeMs: 5000,
    confidence: 0.7,
    ...overrides,
  }
}

describe('ErrorClassifier', () => {
  const classifier = new ErrorClassifier()

  describe('classify', () => {
    it('classifies long response time + Hard as PartialRecall', () => {
      const card = mockCard()
      const deck = mockDeck('Math')
      const event = classifier.classify(card, ReviewResponse.Hard, 20000, deck)
      expect(event.category).toBe(ErrorCategory.PartialRecall)
      expect(event.confidence).toBeGreaterThanOrEqual(0.7)
    })

    it('classifies high lapses + high difficulty as ConceptualGap', () => {
      const card = mockCard({ lapses: 5, difficulty: 8 })
      const deck = mockDeck('Physics')
      const event = classifier.classify(card, ReviewResponse.Again, 5000, deck)
      expect(event.category).toBe(ErrorCategory.ConceptualGap)
    })

    it('classifies high lapses + low difficulty as PlainForgetting', () => {
      const card = mockCard({ lapses: 5, difficulty: 3 })
      const deck = mockDeck('History')
      const event = classifier.classify(card, ReviewResponse.Again, 5000, deck)
      expect(event.category).toBe(ErrorCategory.PlainForgetting)
    })

    it('classifies fast wrong answer as ConceptualGap', () => {
      const card = mockCard({ lapses: 0 })
      const deck = mockDeck('Science')
      const event = classifier.classify(card, ReviewResponse.Again, 1500, deck)
      expect(event.category).toBe(ErrorCategory.ConceptualGap)
    })

    it('classifies language deck + false friend signals as FalseFriend', () => {
      const card = mockCard({
        question: 'What does "embarazada" mean?',
        answer: 'Pregnant (not embarrassed)',
        lapses: 0,
      })
      const deck = mockDeck('Spanish Vocab')
      const event = classifier.classify(card, ReviewResponse.Again, 8000, deck)
      expect(event.category).toBe(ErrorCategory.FalseFriend)
    })

    it('classifies language deck + register signals as RegisterMismatch', () => {
      const card = mockCard({
        question: 'When to use tú vs usted?',
        answer: 'tú = informal, usted = formal',
        lapses: 0,
      })
      const deck = mockDeck('Spanish Vocab')
      const event = classifier.classify(card, ReviewResponse.Again, 8000, deck)
      expect(event.category).toBe(ErrorCategory.RegisterMismatch)
    })

    it('classifies language deck + Again as L1Interference by default', () => {
      const card = mockCard({ lapses: 0 })
      const deck = mockDeck('Mandarin Basics')
      const event = classifier.classify(card, ReviewResponse.Again, 8000, deck)
      expect(event.category).toBe(ErrorCategory.L1Interference)
    })

    it('classifies repeated reps with lapses as Overgeneralization', () => {
      const card = mockCard({ reps: 5, lapses: 2 })
      const deck = mockDeck('Math')
      const event = classifier.classify(card, ReviewResponse.Again, 8000, deck)
      expect(event.category).toBe(ErrorCategory.Overgeneralization)
    })

    it('defaults Again to PlainForgetting for non-language cards', () => {
      const card = mockCard({ reps: 1, lapses: 0 })
      const deck = mockDeck('Quant Finance')
      const event = classifier.classify(card, ReviewResponse.Again, 10000, deck)
      expect(event.category).toBe(ErrorCategory.PartialRecall)
    })

    it('defaults Hard to PartialRecall', () => {
      const card = mockCard({ lapses: 0 })
      const deck = mockDeck('Biology')
      const event = classifier.classify(card, ReviewResponse.Hard, 5000, deck)
      expect(event.category).toBe(ErrorCategory.PartialRecall)
    })

    it('populates all ErrorEvent fields correctly', () => {
      const card = mockCard()
      const deck = mockDeck('Test Deck')
      const event = classifier.classify(card, ReviewResponse.Again, 5000, deck)
      expect(event.id).toBeDefined()
      expect(event.cardId).toBe(card.id)
      expect(event.deckId).toBe(card.deckId)
      expect(event.timestamp).toBeInstanceOf(Date)
      expect(event.responseTimeMs).toBe(5000)
      expect(event.context).toBe(card.question)
      expect(event.correction).toBe(card.answer)
      expect(event.confidence).toBeGreaterThan(0)
      expect(event.confidence).toBeLessThanOrEqual(1)
    })
  })

  describe('classifyBatch', () => {
    it('returns empty array for no events', () => {
      const result = classifier.classifyBatch([])
      expect(result).toEqual([])
    })

    it('groups events by category', () => {
      const events: ErrorEvent[] = [
        mockErrorEvent({ id: '1', category: ErrorCategory.PlainForgetting }),
        mockErrorEvent({ id: '2', category: ErrorCategory.PlainForgetting }),
        mockErrorEvent({ id: '3', category: ErrorCategory.ConceptualGap }),
      ]
      const patterns = classifier.classifyBatch(events)
      expect(patterns).toHaveLength(2)
      const forgetting = patterns.find((p) => p.category === ErrorCategory.PlainForgetting)
      expect(forgetting?.count).toBe(2)
    })

    it('sorts patterns by count descending', () => {
      const events: ErrorEvent[] = [
        mockErrorEvent({ id: '1', category: ErrorCategory.ConceptualGap }),
        mockErrorEvent({ id: '2', category: ErrorCategory.PlainForgetting }),
        mockErrorEvent({ id: '3', category: ErrorCategory.PlainForgetting }),
        mockErrorEvent({ id: '4', category: ErrorCategory.PlainForgetting }),
      ]
      const patterns = classifier.classifyBatch(events)
      expect(patterns[0].category).toBe(ErrorCategory.PlainForgetting)
      expect(patterns[0].count).toBe(3)
    })

    it('aggregates subcategories separately', () => {
      const events: ErrorEvent[] = [
        mockErrorEvent({ id: '1', category: ErrorCategory.RegisterMismatch, subcategory: 'formality' }),
        mockErrorEvent({ id: '2', category: ErrorCategory.RegisterMismatch, subcategory: 'politeness' }),
      ]
      const patterns = classifier.classifyBatch(events)
      expect(patterns).toHaveLength(2)
    })

    it('collects unique related card IDs', () => {
      const events: ErrorEvent[] = [
        mockErrorEvent({ id: '1', cardId: 'card-a', category: ErrorCategory.PlainForgetting }),
        mockErrorEvent({ id: '2', cardId: 'card-a', category: ErrorCategory.PlainForgetting }),
        mockErrorEvent({ id: '3', cardId: 'card-b', category: ErrorCategory.PlainForgetting }),
      ]
      const patterns = classifier.classifyBatch(events)
      const forgetting = patterns.find((p) => p.category === ErrorCategory.PlainForgetting)
      expect(forgetting?.relatedCardIds).toHaveLength(2)
      expect(forgetting?.relatedCardIds).toContain('card-a')
      expect(forgetting?.relatedCardIds).toContain('card-b')
    })
  })

  describe('detectTrend', () => {
    it('returns stable for fewer than 4 events', () => {
      const events: ErrorEvent[] = [
        mockErrorEvent({ id: '1', timestamp: new Date(2026, 0, 1) }),
        mockErrorEvent({ id: '2', timestamp: new Date(2026, 0, 2) }),
      ]
      const pattern = classifier.classifyBatch(events)[0]
      const trend = classifier.detectTrend(pattern, events)
      expect(trend).toBe('stable')
    })

    it('returns improving when second half has fewer errors relative to time', () => {
      const baseTime = new Date(2026, 0, 1).getTime()
      const day = 86400000
      // First half: 4 events in 2 days (dense)
      // Second half: 2 events in 4 days (sparse)
      const events: ErrorEvent[] = [
        mockErrorEvent({ id: '1', timestamp: new Date(baseTime) }),
        mockErrorEvent({ id: '2', timestamp: new Date(baseTime + day * 0.5) }),
        mockErrorEvent({ id: '3', timestamp: new Date(baseTime + day * 1) }),
        mockErrorEvent({ id: '4', timestamp: new Date(baseTime + day * 1.5) }),
        mockErrorEvent({ id: '5', timestamp: new Date(baseTime + day * 3) }),
        mockErrorEvent({ id: '6', timestamp: new Date(baseTime + day * 7) }),
      ]
      const pattern = classifier.classifyBatch(events)[0]
      const trend = classifier.detectTrend(pattern, events)
      expect(trend).toBe('improving')
    })

    it('returns worsening when second half has more errors relative to time', () => {
      const baseTime = new Date(2026, 0, 1).getTime()
      const day = 86400000
      // First half: 2 events spread over 4 days (sparse)
      // Second half: 4 events in 1 day (dense)
      const events: ErrorEvent[] = [
        mockErrorEvent({ id: '1', timestamp: new Date(baseTime) }),
        mockErrorEvent({ id: '2', timestamp: new Date(baseTime + day * 4) }),
        mockErrorEvent({ id: '3', timestamp: new Date(baseTime + day * 5) }),
        mockErrorEvent({ id: '4', timestamp: new Date(baseTime + day * 5.1) }),
        mockErrorEvent({ id: '5', timestamp: new Date(baseTime + day * 5.2) }),
        mockErrorEvent({ id: '6', timestamp: new Date(baseTime + day * 5.5) }),
      ]
      const pattern = classifier.classifyBatch(events)[0]
      const trend = classifier.detectTrend(pattern, events)
      expect(trend).toBe('worsening')
    })
  })
})
