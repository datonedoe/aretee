import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock platform services before any service imports
vi.mock('../services/platform', () => ({
  getStorageService: () => ({
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
  }),
  getFileService: () => ({
    readFile: vi.fn().mockResolvedValue(''),
    writeFile: vi.fn().mockResolvedValue(undefined),
    listFiles: vi.fn().mockResolvedValue([]),
    pickDirectory: vi.fn().mockResolvedValue(null),
  }),
}))

import { SessionComposer } from '../services/interleaving/composer'
import { MicroChallengeScheduler } from '../services/interleaving/micro'
import { Card, Deck, CardState, SyncStatus } from '../types'
import { ErrorPattern, ErrorCategory } from '../types/errors'
import {
  SessionSegmentMode,
  InterleavingConfig,
  DEFAULT_INTERLEAVING_CONFIG,
  MicroChallengeType,
} from '../types/interleaving'

// --- Helpers ---

function mockCard(overrides: Partial<Card> = {}): Card {
  const now = new Date()
  return {
    id: `card-${Math.random().toString(36).slice(2, 8)}`,
    question: 'Test question',
    answer: 'Test answer with multiple words here',
    sourceFilePath: '/test/card.md',
    lineStart: 1,
    lineEnd: 3,
    nextReviewDate: new Date(now.getTime() - 3600000), // 1 hour overdue
    interval: 4,
    ease: 250,
    reviewCount: 3,
    syncStatus: SyncStatus.Synced,
    lastModified: now,
    deckId: 'deck-1',
    difficulty: 3,
    stability: 4,
    retrievability: 0.9,
    elapsed_days: 1,
    scheduled_days: 4,
    last_review: new Date(now.getTime() - 86400000),
    reps: 3,
    lapses: 0,
    state: CardState.Review,
    responseTimeMs: 5000,
    ...overrides,
  }
}

function mockDeck(name: string, cardCount: number, deckId?: string): Deck {
  const id = deckId ?? `deck-${name.toLowerCase().replace(/\s/g, '-')}`
  const cards = Array.from({ length: cardCount }, (_, i) =>
    mockCard({
      id: `${id}-card-${i}`,
      deckId: id,
      difficulty: 1 + (i % 10),
      question: `Question ${i} from ${name}`,
      answer: `Answer ${i} with some detail here`,
    })
  )
  return { id, name, folderPath: `/test/${name}`, lastScanned: new Date(), cards }
}

function mockErrorPattern(overrides: Partial<ErrorPattern> = {}): ErrorPattern {
  return {
    category: ErrorCategory.PlainForgetting,
    count: 5,
    firstSeen: new Date(Date.now() - 7 * 86400000),
    lastSeen: new Date(),
    trend: 'stable' as const,
    relatedCardIds: [],
    reductionRate: 0,
    ...overrides,
  }
}

// --- SessionComposer Tests ---

describe('SessionComposer', () => {
  const composer = new SessionComposer()

  it('returns empty segments when no cards are due', () => {
    const deck = mockDeck('Empty', 0)
    const result = composer.compose([deck], [])
    expect(result).toEqual([])
  })

  it('returns empty segments when all cards are in the future', () => {
    const futureCard = mockCard({
      nextReviewDate: new Date(Date.now() + 86400000 * 30),
    })
    const deck: Deck = {
      id: 'deck-future',
      name: 'Future',
      folderPath: '/test',
      lastScanned: new Date(),
      cards: [futureCard],
    }
    const result = composer.compose([deck], [])
    expect(result).toEqual([])
  })

  it('composes a session with the configured session size', () => {
    const deck = mockDeck('Spanish', 30)
    const config: InterleavingConfig = {
      ...DEFAULT_INTERLEAVING_CONFIG,
      sessionSize: 10,
    }
    const result = composer.compose([deck], [], config)
    expect(result.length).toBeLessThanOrEqual(10)
    expect(result.length).toBeGreaterThan(0)
  })

  it('assigns valid modes to all segments', () => {
    const deck = mockDeck('Math', 15)
    const result = composer.compose([deck], [])
    for (const segment of result) {
      expect(Object.values(SessionSegmentMode)).toContain(segment.mode)
      expect(segment.reason).toBeTruthy()
      expect(segment.card).toBeDefined()
    }
  })

  it('assigns Flash mode to new cards', () => {
    const newCard = mockCard({ state: CardState.New, reps: 0 })
    const deck: Deck = {
      id: 'deck-new',
      name: 'New Cards',
      folderPath: '/test',
      lastScanned: new Date(),
      cards: [newCard],
    }
    const result = composer.compose([deck], [])
    expect(result.length).toBe(1)
    expect(result[0].mode).toBe(SessionSegmentMode.Flash)
  })

  it('assigns Socratic mode to high-lapse cards', () => {
    const lapseCard = mockCard({ lapses: 5, difficulty: 3 })
    const deck: Deck = {
      id: 'deck-lapse',
      name: 'Lapse Cards',
      folderPath: '/test',
      lastScanned: new Date(),
      cards: [lapseCard],
    }
    const result = composer.compose([deck], [])
    expect(result.length).toBe(1)
    expect(result[0].mode).toBe(SessionSegmentMode.Socratic)
  })

  it('assigns Feynman mode to cards with ConceptualGap errors', () => {
    const card = mockCard({ id: 'gap-card' })
    const deck: Deck = {
      id: 'deck-gap',
      name: 'Gap Deck',
      folderPath: '/test',
      lastScanned: new Date(),
      cards: [card],
    }
    const pattern = mockErrorPattern({
      category: ErrorCategory.ConceptualGap,
      relatedCardIds: ['gap-card'],
    })
    const result = composer.compose([deck], [pattern])
    expect(result.length).toBe(1)
    expect(result[0].mode).toBe(SessionSegmentMode.Feynman)
  })

  it('prioritizes weakness-targeted cards', () => {
    const weakCard = mockCard({ id: 'weak-1', difficulty: 8, deckId: 'deck-mix' })
    const normalCard = mockCard({ id: 'normal-1', difficulty: 2, deckId: 'deck-mix' })
    const deck: Deck = {
      id: 'deck-mix',
      name: 'Mixed',
      folderPath: '/test',
      lastScanned: new Date(),
      cards: [weakCard, normalCard],
    }
    const pattern = mockErrorPattern({
      relatedCardIds: ['weak-1'],
    })
    const config: InterleavingConfig = {
      ...DEFAULT_INTERLEAVING_CONFIG,
      sessionSize: 2,
      weaknessFocus: 0.5,
    }
    const result = composer.compose([deck], [pattern], config)
    const cardIds = result.map((s) => s.card.id)
    expect(cardIds).toContain('weak-1')
  })

  it('mixes cards from multiple decks when crossDeckMixing is enabled', () => {
    const deck1 = mockDeck('Spanish', 5, 'deck-es')
    const deck2 = mockDeck('Mandarin', 5, 'deck-zh')
    const config: InterleavingConfig = {
      ...DEFAULT_INTERLEAVING_CONFIG,
      sessionSize: 8,
      crossDeckMixing: true,
    }
    const result = composer.compose([deck1, deck2], [], config)
    const deckIds = new Set(result.map((s) => s.card.deckId))
    expect(deckIds.size).toBe(2)
  })

  it('avoids consecutive same-deck cards when possible', () => {
    const deck1 = mockDeck('Spanish', 5, 'deck-es')
    const deck2 = mockDeck('Mandarin', 5, 'deck-zh')
    const config: InterleavingConfig = {
      ...DEFAULT_INTERLEAVING_CONFIG,
      sessionSize: 10,
      crossDeckMixing: true,
    }
    const result = composer.compose([deck1, deck2], [], config)

    let consecutiveRuns = 0
    for (let i = 1; i < result.length; i++) {
      if (result[i].card.deckId === result[i - 1].card.deckId) {
        consecutiveRuns++
      }
    }
    // Allow some, but significantly fewer than without interleaving
    expect(consecutiveRuns).toBeLessThan(result.length / 2)
  })

  it('respects enabledModes configuration', () => {
    const deck = mockDeck('Test', 10)
    const config: InterleavingConfig = {
      ...DEFAULT_INTERLEAVING_CONFIG,
      sessionSize: 10,
      enabledModes: [SessionSegmentMode.Flash],
    }
    const result = composer.compose([deck], [], config)
    for (const segment of result) {
      expect(segment.mode).toBe(SessionSegmentMode.Flash)
    }
  })
})

// --- MicroChallengeScheduler Tests ---

describe('MicroChallengeScheduler', () => {
  it('generates challenges for due cards', () => {
    const scheduler = new MicroChallengeScheduler()
    const deck = mockDeck('Spanish', 5)
    const challenges = scheduler.generateChallenges([deck], 8, 5)
    expect(challenges.length).toBeGreaterThan(0)
    expect(challenges.length).toBeLessThanOrEqual(5)
  })

  it('generates challenges with valid structure', () => {
    const scheduler = new MicroChallengeScheduler()
    const deck = mockDeck('Math', 3)
    const challenges = scheduler.generateChallenges([deck])
    for (const challenge of challenges) {
      expect(challenge.id).toBeTruthy()
      expect(challenge.prompt).toBeTruthy()
      expect(challenge.expectedAnswer).toBeTruthy()
      expect(challenge.timeLimit).toBeGreaterThan(0)
      expect(challenge.scheduledFor).toBeInstanceOf(Date)
      expect(Object.values(MicroChallengeType)).toContain(challenge.type)
    }
  })

  it('respects maxChallenges limit', () => {
    const scheduler = new MicroChallengeScheduler()
    const deck = mockDeck('Big Deck', 50)
    const challenges = scheduler.generateChallenges([deck], 24, 3)
    expect(challenges.length).toBeLessThanOrEqual(3)
  })

  it('returns empty when no cards are due', () => {
    const scheduler = new MicroChallengeScheduler()
    const futureCard = mockCard({
      nextReviewDate: new Date(Date.now() + 86400000 * 30),
    })
    const deck: Deck = {
      id: 'deck-future',
      name: 'Future',
      folderPath: '/test',
      lastScanned: new Date(),
      cards: [futureCard],
    }
    const challenges = scheduler.generateChallenges([deck], 1, 5)
    expect(challenges.length).toBe(0)
  })

  it('generates QuickRecall for high-stability cards', () => {
    const scheduler = new MicroChallengeScheduler()
    const card = mockCard({ stability: 20 })
    const deck: Deck = {
      id: 'deck-stable',
      name: 'Stable',
      folderPath: '/test',
      lastScanned: new Date(),
      cards: [card],
    }
    const challenges = scheduler.generateChallenges([deck])
    if (challenges.length > 0) {
      expect(challenges[0].type).toBe(MicroChallengeType.QuickRecall)
    }
  })

  it('getPending returns only past-due challenges', () => {
    const scheduler = new MicroChallengeScheduler()
    const deck = mockDeck('Test', 5)
    scheduler.generateChallenges([deck], 8, 5)
    const pending = scheduler.getPending()
    const now = new Date()
    for (const challenge of pending) {
      expect(new Date(challenge.scheduledFor).getTime()).toBeLessThanOrEqual(
        now.getTime()
      )
    }
  })

  it('getQuietHours returns default config', () => {
    const scheduler = new MicroChallengeScheduler()
    const qh = scheduler.getQuietHours()
    expect(qh.enabled).toBe(true)
    expect(qh.startHour).toBe(22)
    expect(qh.endHour).toBe(8)
  })
})
