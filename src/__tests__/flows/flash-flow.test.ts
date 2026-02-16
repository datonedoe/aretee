/**
 * Flash Flow Integration Test
 *
 * Simulates the main flashcard review flow through the stores:
 * 1. Load decks → see deck list with due counts
 * 2. Start a review session for a deck
 * 3. Flip card (show answer)
 * 4. Answer with a response button
 * 5. Progress through cards
 * 6. Session ends when all cards reviewed
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock platform services
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
import { ReviewResponse, CardState, isCardDue } from '../../types'
import { makeCard, makeDeck } from './test-helpers'

describe('Flash Flow: Full Review Session', () => {
  beforeEach(() => {
    useReviewStore.setState({ session: null })
    useDeckStore.setState({ decks: [], isLoading: false, error: null })
    useSettingsStore.setState({
      vaultPath: '/test/vault',
      isLoaded: true,
      desiredRetention: 0.9,
    })
  })

  it('shows deck list with due counts', () => {
    const dueCard = makeCard({ id: 'c1', nextReviewDate: new Date(2020, 0, 1) })
    const futureCard = makeCard({ id: 'c2', nextReviewDate: new Date(2099, 0, 1) })
    const deck = makeDeck('d1', 'Math', [dueCard, futureCard])

    useDeckStore.setState({ decks: [deck] })

    const decks = useDeckStore.getState().decks
    expect(decks).toHaveLength(1)
    expect(decks[0].name).toBe('Math')
    expect(decks[0].cards).toHaveLength(2)

    const dueCount = decks[0].cards.filter(isCardDue).length
    expect(dueCount).toBe(1)
  })

  it('navigates into a deck and starts review session', () => {
    const cards = [
      makeCard({ id: 'c1', question: 'What is 2+2?', answer: '4' }),
      makeCard({ id: 'c2', question: 'What is 3+3?', answer: '6' }),
    ]
    const deck = makeDeck('d1', 'Math', cards)
    useDeckStore.setState({ decks: [deck] })

    // Simulate: user taps on deck → app starts review with due cards
    const dueCards = deck.cards.filter(isCardDue)
    useReviewStore.getState().startSession('d1', dueCards, 'Math')

    const session = useReviewStore.getState().session
    expect(session).not.toBeNull()
    expect(session!.deckName).toBe('Math')
    expect(session!.cards).toHaveLength(2)
    expect(session!.currentIndex).toBe(0)
    expect(session!.isFlipped).toBe(false)
  })

  it('flipping card shows answer', () => {
    const card = makeCard({ question: 'Capital of France?', answer: 'Paris' })
    useReviewStore.getState().startSession('d1', [card], 'Geography')

    // Card starts face-up (question visible)
    expect(useReviewStore.getState().session!.isFlipped).toBe(false)

    // User taps "Show Answer"
    useReviewStore.getState().flipCard()

    expect(useReviewStore.getState().session!.isFlipped).toBe(true)
    expect(useReviewStore.getState().session!.cardShownAt).not.toBeNull()
  })

  it('answering a card advances to the next card', async () => {
    const cards = [
      makeCard({ id: 'c1', question: 'Q1', answer: 'A1', deckId: 'd1' }),
      makeCard({ id: 'c2', question: 'Q2', answer: 'A2', deckId: 'd1' }),
    ]
    const deck = makeDeck('d1', 'Test', cards)
    useDeckStore.setState({ decks: [deck] })
    useReviewStore.getState().startSession('d1', cards, 'Test')

    // Flip and answer first card
    useReviewStore.getState().flipCard()
    await useReviewStore.getState().answerCard(ReviewResponse.Good)

    const session = useReviewStore.getState().session!
    expect(session.currentIndex).toBe(1)
    expect(session.isFlipped).toBe(false) // reset for next card
    expect(session.results).toHaveLength(1)
    expect(session.results[0].response).toBe(ReviewResponse.Good)

    // Current card should now be c2
    const current = useReviewStore.getState().getCurrentCard()
    expect(current).not.toBeNull()
    expect(current!.question).toBe('Q2')
  })

  it('full session: review all cards then end', async () => {
    const cards = [
      makeCard({ id: 'c1', question: 'Q1', deckId: 'd1' }),
      makeCard({ id: 'c2', question: 'Q2', deckId: 'd1' }),
      makeCard({ id: 'c3', question: 'Q3', deckId: 'd1' }),
    ]
    const deck = makeDeck('d1', 'Test', cards)
    useDeckStore.setState({ decks: [deck] })
    useReviewStore.getState().startSession('d1', cards, 'Test')

    // Answer all three cards
    for (let i = 0; i < 3; i++) {
      useReviewStore.getState().flipCard()
      await useReviewStore.getState().answerCard(ReviewResponse.Good)
    }

    // After last card, getCurrentCard returns null → app navigates to results
    expect(useReviewStore.getState().getCurrentCard()).toBeNull()

    // Progress shows all done
    const progress = useReviewStore.getState().getProgress()
    expect(progress.current).toBe(3)
    expect(progress.total).toBe(3)

    // End session and verify results
    const ended = useReviewStore.getState().endSession()
    expect(ended).not.toBeNull()
    expect(ended!.results).toHaveLength(3)
    expect(ended!.results.every((r) => r.response === ReviewResponse.Good)).toBe(true)
  })

  it('different response types are tracked correctly', async () => {
    const cards = [
      makeCard({ id: 'c1', deckId: 'd1' }),
      makeCard({ id: 'c2', deckId: 'd1' }),
      makeCard({ id: 'c3', deckId: 'd1' }),
      makeCard({ id: 'c4', deckId: 'd1' }),
    ]
    const deck = makeDeck('d1', 'Test', cards)
    useDeckStore.setState({ decks: [deck] })
    useReviewStore.getState().startSession('d1', cards, 'Test')

    const responses = [
      ReviewResponse.Again,
      ReviewResponse.Hard,
      ReviewResponse.Good,
      ReviewResponse.Easy,
    ]

    for (const response of responses) {
      useReviewStore.getState().flipCard()
      await useReviewStore.getState().answerCard(response)
    }

    const ended = useReviewStore.getState().endSession()!
    expect(ended.results[0].response).toBe(ReviewResponse.Again)
    expect(ended.results[1].response).toBe(ReviewResponse.Hard)
    expect(ended.results[2].response).toBe(ReviewResponse.Good)
    expect(ended.results[3].response).toBe(ReviewResponse.Easy)
  })

  it('review all decks combines due cards', () => {
    const card1 = makeCard({ id: 'c1', deckId: 'd1', nextReviewDate: new Date(2020, 0, 1) })
    const card2 = makeCard({ id: 'c2', deckId: 'd2', nextReviewDate: new Date(2020, 0, 1) })
    const futureCard = makeCard({ id: 'c3', deckId: 'd2', nextReviewDate: new Date(2099, 0, 1) })

    useDeckStore.setState({
      decks: [
        makeDeck('d1', 'Math', [card1]),
        makeDeck('d2', 'Science', [card2, futureCard]),
      ],
    })

    const allDue = useDeckStore.getState().getAllDueCards()
    expect(allDue).toHaveLength(2)

    // Start "Review All" session
    useReviewStore.getState().startSession('all', allDue, 'All Decks')
    const session = useReviewStore.getState().session!
    expect(session.deckId).toBe('all')
    expect(session.deckName).toBe('All Decks')
    expect(session.cards).toHaveLength(2)
  })
})
