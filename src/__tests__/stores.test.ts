import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock platform services before any store imports
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

// Mock audio sounds (uses expo-av)
vi.mock('../services/audio/sounds', () => ({
  playSound: vi.fn(),
}))

import { useReviewStore } from '../stores/reviewStore'
import { useDeckStore } from '../stores/deckStore'
import { useSettingsStore } from '../stores/settingsStore'
import { useImmersionStore } from '../stores/immersionStore'
import { Card, CardState, SyncStatus, ReviewResponse } from '../types'

function makeCard(overrides: Partial<Card> = {}): Card {
  return {
    id: `card-${Math.random()}`,
    question: 'Test Q',
    answer: 'Test A',
    sourceFilePath: '/test.md',
    lineStart: 0,
    lineEnd: 1,
    nextReviewDate: new Date(),
    interval: 0,
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
    ...overrides,
  }
}

// --- ReviewStore ---
describe('ReviewStore', () => {
  beforeEach(() => {
    useReviewStore.setState({ session: null })
  })

  it('startSession initializes session correctly', () => {
    const cards = [makeCard(), makeCard()]
    useReviewStore.getState().startSession('d1', cards, 'Test Deck')
    const session = useReviewStore.getState().session
    expect(session).not.toBeNull()
    expect(session!.deckId).toBe('d1')
    expect(session!.deckName).toBe('Test Deck')
    expect(session!.cards).toHaveLength(2)
    expect(session!.currentIndex).toBe(0)
    expect(session!.isFlipped).toBe(false)
    expect(session!.results).toHaveLength(0)
    expect(session!.cardShownAt).toBeNull()
  })

  it('startSession with empty cards', () => {
    useReviewStore.getState().startSession('d1', [], 'Empty')
    const session = useReviewStore.getState().session
    expect(session!.cards).toHaveLength(0)
  })

  it('flipCard toggles isFlipped', () => {
    useReviewStore.getState().startSession('d1', [makeCard()], 'Test')
    expect(useReviewStore.getState().session!.isFlipped).toBe(false)
    useReviewStore.getState().flipCard()
    expect(useReviewStore.getState().session!.isFlipped).toBe(true)
    expect(useReviewStore.getState().session!.cardShownAt).not.toBeNull()
  })

  it('flipCard is no-op when no session', () => {
    useReviewStore.getState().flipCard()
    expect(useReviewStore.getState().session).toBeNull()
  })

  it('getCurrentCard returns null when no session', () => {
    expect(useReviewStore.getState().getCurrentCard()).toBeNull()
  })

  it('getCurrentCard returns first card', () => {
    const card = makeCard({ question: 'Unique Q' })
    useReviewStore.getState().startSession('d1', [card], 'Test')
    const current = useReviewStore.getState().getCurrentCard()
    expect(current).not.toBeNull()
    expect(current!.question).toBe('Unique Q')
  })

  it('getCurrentCard returns null when past last card', () => {
    const card = makeCard()
    useReviewStore.getState().startSession('d1', [card], 'Test')
    // Manually advance past the end
    useReviewStore.setState((s) => ({
      session: s.session ? { ...s.session, currentIndex: 1 } : null,
    }))
    expect(useReviewStore.getState().getCurrentCard()).toBeNull()
  })

  it('getProgress returns {0,0} when no session', () => {
    const progress = useReviewStore.getState().getProgress()
    expect(progress).toEqual({ current: 0, total: 0 })
  })

  it('getProgress returns correct values', () => {
    useReviewStore.getState().startSession('d1', [makeCard(), makeCard(), makeCard()], 'Test')
    const progress = useReviewStore.getState().getProgress()
    expect(progress).toEqual({ current: 0, total: 3 })
  })

  it('endSession returns session and clears state', () => {
    useReviewStore.getState().startSession('d1', [makeCard()], 'Test')
    const returned = useReviewStore.getState().endSession()
    expect(returned).not.toBeNull()
    expect(returned!.deckId).toBe('d1')
    expect(useReviewStore.getState().session).toBeNull()
  })

  it('endSession returns null when no session', () => {
    const returned = useReviewStore.getState().endSession()
    expect(returned).toBeNull()
  })
})

// --- DeckStore ---
describe('DeckStore', () => {
  beforeEach(() => {
    useDeckStore.setState({ decks: [], isLoading: false, error: null })
  })

  it('getDueCards returns empty for unknown deckId', () => {
    const due = useDeckStore.getState().getDueCards('nonexistent')
    expect(due).toEqual([])
  })

  it('getDeck returns undefined for unknown deckId', () => {
    expect(useDeckStore.getState().getDeck('nonexistent')).toBeUndefined()
  })

  it('updateCard updates the correct card', () => {
    const card = makeCard({ id: 'c1', question: 'Old Q' })
    useDeckStore.setState({
      decks: [{ id: 'd1', name: 'Test', folderPath: '/test', lastScanned: new Date(), cards: [card] }],
    })
    useDeckStore.getState().updateCard('d1', 'c1', { question: 'New Q' })
    const updated = useDeckStore.getState().getDeck('d1')!.cards[0]
    expect(updated.question).toBe('New Q')
  })

  it('updateCard with unknown deckId is no-op', () => {
    const card = makeCard({ id: 'c1' })
    useDeckStore.setState({
      decks: [{ id: 'd1', name: 'Test', folderPath: '/test', lastScanned: new Date(), cards: [card] }],
    })
    // Should not throw
    useDeckStore.getState().updateCard('nonexistent', 'c1', { question: 'New' })
    expect(useDeckStore.getState().getDeck('d1')!.cards[0].question).toBe('Test Q')
  })

  it('updateCard with unknown cardId is no-op', () => {
    const card = makeCard({ id: 'c1' })
    useDeckStore.setState({
      decks: [{ id: 'd1', name: 'Test', folderPath: '/test', lastScanned: new Date(), cards: [card] }],
    })
    useDeckStore.getState().updateCard('d1', 'nonexistent', { question: 'New' })
    expect(useDeckStore.getState().getDeck('d1')!.cards[0].question).toBe('Test Q')
  })

  it('getAllDueCards returns cards across decks', () => {
    const dueCard = makeCard({ id: 'due', nextReviewDate: new Date(2020, 0, 1) })
    const futureCard = makeCard({ id: 'future', nextReviewDate: new Date(2099, 0, 1) })
    useDeckStore.setState({
      decks: [
        { id: 'd1', name: 'A', folderPath: '/a', lastScanned: new Date(), cards: [dueCard] },
        { id: 'd2', name: 'B', folderPath: '/b', lastScanned: new Date(), cards: [futureCard] },
      ],
    })
    const allDue = useDeckStore.getState().getAllDueCards()
    expect(allDue).toHaveLength(1)
    expect(allDue[0].id).toBe('due')
  })
})

// --- SettingsStore ---
describe('SettingsStore', () => {
  it('has correct defaults', () => {
    const state = useSettingsStore.getState()
    expect(state.desiredRetention).toBe(0.9)
    expect(state.fuzzEnabled).toBe(true)
    expect(state.dailyNewLimit).toBe(20)
    expect(state.vaultPath).toBeNull()
  })

  it('setDesiredRetention clamps below minimum (0.7)', async () => {
    await useSettingsStore.getState().setDesiredRetention(0.5)
    expect(useSettingsStore.getState().desiredRetention).toBe(0.7)
  })

  it('setDesiredRetention clamps above maximum (0.97)', async () => {
    await useSettingsStore.getState().setDesiredRetention(0.99)
    expect(useSettingsStore.getState().desiredRetention).toBe(0.97)
  })

  it('setDesiredRetention accepts valid value', async () => {
    await useSettingsStore.getState().setDesiredRetention(0.85)
    expect(useSettingsStore.getState().desiredRetention).toBe(0.85)
  })
})

// --- ImmersionStore ---
describe('ImmersionStore', () => {
  beforeEach(() => {
    useImmersionStore.setState({
      feedItems: [],
      currentIndex: 0,
      difficulty: 5,
      interactions: [],
      language: 'es',
      region: null,
      learnedWords: [],
      selectedWord: null,
      isTranslating: false,
      showTranslation: false,
    })
  })

  it('recordInteraction too_hard increases difficulty', () => {
    const before = useImmersionStore.getState().difficulty
    useImmersionStore.getState().recordInteraction('item1', 'too_hard')
    const after = useImmersionStore.getState().difficulty
    expect(after).toBeGreaterThan(before)
  })

  it('recordInteraction too_easy decreases difficulty', () => {
    const before = useImmersionStore.getState().difficulty
    useImmersionStore.getState().recordInteraction('item1', 'too_easy')
    const after = useImmersionStore.getState().difficulty
    expect(after).toBeLessThan(before)
  })

  it('difficulty clamps to [1, 10]', () => {
    // Set difficulty very low then push it lower
    useImmersionStore.setState({ difficulty: 1.1 })
    for (let i = 0; i < 50; i++) {
      useImmersionStore.getState().recordInteraction(`item${i}`, 'too_easy')
    }
    expect(useImmersionStore.getState().difficulty).toBeGreaterThanOrEqual(1)

    // Set difficulty very high then push higher
    useImmersionStore.setState({ difficulty: 9.9, interactions: [] })
    for (let i = 0; i < 50; i++) {
      useImmersionStore.getState().recordInteraction(`item${i}`, 'too_hard')
    }
    expect(useImmersionStore.getState().difficulty).toBeLessThanOrEqual(10)
  })

  it('nextItem increments currentIndex', () => {
    useImmersionStore.setState({
      feedItems: [
        { id: '1' } as any,
        { id: '2' } as any,
        { id: '3' } as any,
      ],
      currentIndex: 0,
    })
    useImmersionStore.getState().nextItem()
    expect(useImmersionStore.getState().currentIndex).toBe(1)
  })

  it('prevItem does not go below 0', () => {
    useImmersionStore.setState({ currentIndex: 0 })
    useImmersionStore.getState().prevItem()
    expect(useImmersionStore.getState().currentIndex).toBe(0)
  })

  it('nextItem at end does not exceed array length', () => {
    useImmersionStore.setState({
      feedItems: [{ id: '1' } as any],
      currentIndex: 0,
    })
    useImmersionStore.getState().nextItem()
    expect(useImmersionStore.getState().currentIndex).toBe(0)
  })

  it('setLanguage updates language', () => {
    useImmersionStore.getState().setLanguage('ja')
    expect(useImmersionStore.getState().language).toBe('ja')
  })

  it('addLearnedWord appends to list', () => {
    useImmersionStore.getState().addLearnedWord('hola', 'hello')
    expect(useImmersionStore.getState().learnedWords).toHaveLength(1)
    expect(useImmersionStore.getState().learnedWords[0].word).toBe('hola')
  })

  it('getCalibrationStats counts interactions', () => {
    useImmersionStore.getState().recordInteraction('1', 'too_easy')
    useImmersionStore.getState().recordInteraction('2', 'too_hard')
    useImmersionStore.getState().recordInteraction('3', 'engaged')
    const stats = useImmersionStore.getState().getCalibrationStats()
    expect(stats.tooEasy).toBe(1)
    expect(stats.tooHard).toBe(1)
    expect(stats.engaged).toBe(1)
  })
})
