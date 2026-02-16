/**
 * Review Session Integration Test
 *
 * Full end-to-end review session through stores:
 * - Start session with multiple cards
 * - Answer each with different responses
 * - Verify FSRS scheduling produces correct intervals
 * - Verify gamification hooks fire (XP, profile tracking)
 * - Session ends correctly with accurate results
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('../../services/platform', () => ({
  getStorageService: () => ({
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
  }),
  getFileService: () => ({
    readFile: vi.fn().mockResolvedValue(''),
    writeFile: vi.fn().mockResolvedValue(undefined),
    listFiles: vi.fn().mockResolvedValue([]),
    pickFolder: vi.fn().mockResolvedValue(null),
    pickDirectory: vi.fn().mockResolvedValue(null),
  }),
}))

vi.mock('../../services/audio/sounds', () => ({
  playSound: vi.fn(),
}))

import { useReviewStore } from '../../stores/reviewStore'
import { useDeckStore } from '../../stores/deckStore'
import { useSettingsStore } from '../../stores/settingsStore'
import { useProfileStore } from '../../stores/profileStore'
import { ReviewResponse, CardState } from '../../types'
import { SRSEngine } from '../../services/srs/engine'
import { makeCard, makeDeck } from './test-helpers'

describe('Review Session: FSRS Scheduling Integration', () => {
  beforeEach(() => {
    useReviewStore.setState({ session: null })
    useDeckStore.setState({ decks: [], isLoading: false, error: null })
    useSettingsStore.setState({
      vaultPath: '/test',
      isLoaded: true,
      desiredRetention: 0.9,
      fuzzEnabled: true,
    })
  })

  it('new card answered Good gets initial FSRS scheduling', async () => {
    const card = makeCard({
      id: 'c1',
      deckId: 'd1',
      state: CardState.New,
      difficulty: 0,
      stability: 0,
    })
    const deck = makeDeck('d1', 'Test', [card])
    useDeckStore.setState({ decks: [deck] })
    useReviewStore.getState().startSession('d1', [card], 'Test')

    useReviewStore.getState().flipCard()
    await useReviewStore.getState().answerCard(ReviewResponse.Good)

    // Check FSRS result was applied to the card in deck store
    const updatedCard = useDeckStore.getState().getDeck('d1')!.cards[0]
    expect(updatedCard.difficulty).toBeGreaterThan(0) // initialized
    expect(updatedCard.stability).toBeGreaterThan(0) // initialized
    expect(updatedCard.reviewCount).toBe(1)
    expect(updatedCard.reps).toBe(1)
    expect(updatedCard.last_review).not.toBeNull()
    expect(updatedCard.state).toBe(CardState.Review) // Good on new → Review
  })

  it('new card answered Again stays in Learning with lapse', async () => {
    const card = makeCard({
      id: 'c1',
      deckId: 'd1',
      state: CardState.New,
    })
    const deck = makeDeck('d1', 'Test', [card])
    useDeckStore.setState({ decks: [deck] })
    useReviewStore.getState().startSession('d1', [card], 'Test')

    useReviewStore.getState().flipCard()
    await useReviewStore.getState().answerCard(ReviewResponse.Again)

    const updatedCard = useDeckStore.getState().getDeck('d1')!.cards[0]
    expect(updatedCard.state).toBe(CardState.Learning)
    expect(updatedCard.lapses).toBe(1)
  })

  it('different responses produce different intervals', () => {
    // Test FSRS engine directly for a review-state card
    const responses = [
      ReviewResponse.Again,
      ReviewResponse.Hard,
      ReviewResponse.Good,
      ReviewResponse.Easy,
    ]

    const results = responses.map((r) =>
      SRSEngine.calculateNextReview(
        10, 250, r, 5, false,
        5.0, 10.0, CardState.Review,
        new Date(Date.now() - 10 * 86400000), // last review 10 days ago
        0, 0.9, null
      )
    )

    // Again should produce shortest interval
    expect(results[0].newInterval).toBeLessThan(results[1].newInterval)
    // Easy should produce longest interval
    expect(results[3].newInterval).toBeGreaterThan(results[2].newInterval)

    // Again should cause lapse
    expect(results[0].lapses).toBe(1)
    expect(results[0].state).toBe(CardState.Relearning)

    // Good/Easy should stay in Review
    expect(results[2].state).toBe(CardState.Review)
    expect(results[3].state).toBe(CardState.Review)
  })

  it('multiple cards with mixed responses produce correct session results', async () => {
    const cards = [
      makeCard({ id: 'c1', deckId: 'd1', question: 'Easy Q' }),
      makeCard({ id: 'c2', deckId: 'd1', question: 'Hard Q' }),
      makeCard({ id: 'c3', deckId: 'd1', question: 'Again Q' }),
      makeCard({ id: 'c4', deckId: 'd1', question: 'Good Q' }),
    ]
    const deck = makeDeck('d1', 'Mixed', cards)
    useDeckStore.setState({ decks: [deck] })
    useReviewStore.getState().startSession('d1', cards, 'Mixed')

    const responses = [
      ReviewResponse.Easy,
      ReviewResponse.Hard,
      ReviewResponse.Again,
      ReviewResponse.Good,
    ]

    for (const response of responses) {
      useReviewStore.getState().flipCard()
      await useReviewStore.getState().answerCard(response)
    }

    // All cards reviewed
    expect(useReviewStore.getState().getCurrentCard()).toBeNull()

    const session = useReviewStore.getState().endSession()!
    expect(session.results).toHaveLength(4)
    expect(session.results.map((r) => r.response)).toEqual(responses)

    // Each result has a valid reviewResult with FSRS data
    for (const result of session.results) {
      expect(result.reviewResult).toBeDefined()
      expect(result.reviewResult.newDifficulty).toBeGreaterThan(0)
      expect(result.reviewResult.newStability).toBeGreaterThan(0)
      expect(result.reviewResult.newInterval).toBeGreaterThanOrEqual(0)
    }

    // Verify deck store was updated for each card
    const updatedDeck = useDeckStore.getState().getDeck('d1')!
    for (const card of updatedDeck.cards) {
      expect(card.reviewCount).toBe(1)
      expect(card.reps).toBe(1)
    }
  })
})

describe('Review Session: Gamification Integration', () => {
  beforeEach(() => {
    useReviewStore.setState({ session: null })
    useDeckStore.setState({ decks: [], isLoading: false, error: null })
    useSettingsStore.setState({
      vaultPath: '/test',
      isLoaded: true,
      desiredRetention: 0.9,
    })
    // Reset profile tracking
    useProfileStore.getState().resetSessionTracking()
  })

  it('answering cards tracks XP in profile store', async () => {
    const card = makeCard({ id: 'c1', deckId: 'd1' })
    const deck = makeDeck('d1', 'Test', [card])
    useDeckStore.setState({ decks: [deck] })
    useReviewStore.getState().startSession('d1', [card], 'Test')

    const xpBefore = useProfileStore.getState().sessionXP

    useReviewStore.getState().flipCard()
    await useReviewStore.getState().answerCard(ReviewResponse.Good)
    // onCardReviewed is fire-and-forget in answerCard, wait for it
    await vi.waitFor(() => {
      expect(useProfileStore.getState().sessionXP).toBeGreaterThan(xpBefore)
    })
  })

  it('session tracks deck IDs reviewed', async () => {
    const card = makeCard({ id: 'c1', deckId: 'd1' })
    const deck = makeDeck('d1', 'Test', [card])
    useDeckStore.setState({ decks: [deck] })
    useReviewStore.getState().startSession('d1', [card], 'Test')

    useReviewStore.getState().flipCard()
    await useReviewStore.getState().answerCard(ReviewResponse.Easy)

    await vi.waitFor(() => {
      const decksReviewed = useProfileStore.getState().sessionDecksReviewed
      expect(decksReviewed.has('d1')).toBe(true)
    })
  })

  it('Again responses are tracked for gamification', async () => {
    const card = makeCard({ id: 'c1', deckId: 'd1' })
    const deck = makeDeck('d1', 'Test', [card])
    useDeckStore.setState({ decks: [deck] })
    useReviewStore.getState().startSession('d1', [card], 'Test')

    useReviewStore.getState().flipCard()
    await useReviewStore.getState().answerCard(ReviewResponse.Again)

    await vi.waitFor(() => {
      expect(useProfileStore.getState().sessionAgainCount).toBeGreaterThanOrEqual(1)
    })
  })
})

describe('Review Session: Session Lifecycle', () => {
  beforeEach(() => {
    useReviewStore.setState({ session: null })
    useDeckStore.setState({ decks: [], isLoading: false, error: null })
    useSettingsStore.setState({
      vaultPath: '/test',
      isLoaded: true,
      desiredRetention: 0.9,
    })
  })

  it('session records startedAt timestamp', () => {
    const before = Date.now()
    useReviewStore.getState().startSession('d1', [makeCard()], 'Test')
    const after = Date.now()

    const session = useReviewStore.getState().session!
    const startTime = session.startedAt.getTime()
    expect(startTime).toBeGreaterThanOrEqual(before)
    expect(startTime).toBeLessThanOrEqual(after)
  })

  it('response time is tracked per card', async () => {
    const card = makeCard({ id: 'c1', deckId: 'd1' })
    const deck = makeDeck('d1', 'Test', [card])
    useDeckStore.setState({ decks: [deck] })
    useReviewStore.getState().startSession('d1', [card], 'Test')

    useReviewStore.getState().flipCard()

    // Small delay to ensure measurable response time
    await new Promise((r) => setTimeout(r, 10))

    await useReviewStore.getState().answerCard(ReviewResponse.Good)

    const session = useReviewStore.getState().endSession()!
    expect(session.results[0].responseTimeMs).not.toBeNull()
    expect(session.results[0].responseTimeMs!).toBeGreaterThanOrEqual(0)
  })

  it('endSession returns null when no session exists', () => {
    expect(useReviewStore.getState().endSession()).toBeNull()
  })

  it('endSession clears session state', () => {
    useReviewStore.getState().startSession('d1', [makeCard()], 'Test')
    expect(useReviewStore.getState().session).not.toBeNull()

    useReviewStore.getState().endSession()
    expect(useReviewStore.getState().session).toBeNull()
  })

  it('results screen computes accuracy from responses', async () => {
    const cards = [
      makeCard({ id: 'c1', deckId: 'd1' }),
      makeCard({ id: 'c2', deckId: 'd1' }),
      makeCard({ id: 'c3', deckId: 'd1' }),
      makeCard({ id: 'c4', deckId: 'd1' }),
    ]
    const deck = makeDeck('d1', 'Test', cards)
    useDeckStore.setState({ decks: [deck] })
    useReviewStore.getState().startSession('d1', cards, 'Test')

    // 1 Again, 1 Hard, 1 Good, 1 Easy
    const responses = [
      ReviewResponse.Again,
      ReviewResponse.Hard,
      ReviewResponse.Good,
      ReviewResponse.Easy,
    ]
    for (const r of responses) {
      useReviewStore.getState().flipCard()
      await useReviewStore.getState().answerCard(r)
    }

    const session = useReviewStore.getState().endSession()!

    // Simulate results screen accuracy calculation
    const counts = { again: 0, hard: 0, good: 0, easy: 0 }
    for (const r of session.results) {
      switch (r.response) {
        case ReviewResponse.Again: counts.again++; break
        case ReviewResponse.Hard: counts.hard++; break
        case ReviewResponse.Good: counts.good++; break
        case ReviewResponse.Easy: counts.easy++; break
      }
    }

    expect(counts).toEqual({ again: 1, hard: 1, good: 1, easy: 1 })

    const accuracy = Math.round(
      ((counts.good + counts.easy) / session.results.length) * 100
    )
    expect(accuracy).toBe(50) // 2 out of 4
  })
})
