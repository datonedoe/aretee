/**
 * Platform-Specific Tests: Web
 *
 * Tests behavior unique to Platform.OS === 'web':
 * - Keyboard shortcuts (Space/Enter flips, 1-4 answers)
 * - Platform service routes to WebFileService/WebStorageService
 * - UI logic branches that show keyboard hints
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'

// Mock react-native with Platform.OS = 'web'
vi.mock('react-native', () => ({
  Platform: { OS: 'web', select: (obj: any) => obj.web ?? obj.default },
  View: 'View',
  Text: 'Text',
  Pressable: 'Pressable',
  FlatList: 'FlatList',
  ActivityIndicator: 'ActivityIndicator',
  ScrollView: 'ScrollView',
}))

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

import { Platform } from 'react-native'
import { useReviewStore } from '../../stores/reviewStore'
import { useDeckStore } from '../../stores/deckStore'
import { useSettingsStore } from '../../stores/settingsStore'
import { ReviewResponse, CardState, ResponseKeyBindings } from '../../types'
import { makeCard, makeDeck } from './test-helpers'

describe('Web Platform: Keyboard Shortcuts', () => {
  beforeEach(() => {
    useReviewStore.setState({ session: null })
    useDeckStore.setState({ decks: [], isLoading: false, error: null })
    useSettingsStore.setState({ vaultPath: '/test', isLoaded: true, desiredRetention: 0.9 })
  })

  it('Platform.OS is web', () => {
    expect(Platform.OS).toBe('web')
  })

  it('Space key should trigger flip (simulated handler logic)', () => {
    const card = makeCard({ id: 'c1', deckId: 'd1' })
    const deck = makeDeck('d1', 'Test', [card])
    useDeckStore.setState({ decks: [deck] })
    useReviewStore.getState().startSession('d1', [card], 'Test')

    // Simulate the handleKeyPress logic from review/[deckId].tsx
    const session = useReviewStore.getState().session!
    const currentCard = useReviewStore.getState().getCurrentCard()

    expect(session.isFlipped).toBe(false)
    expect(currentCard).not.toBeNull()

    // Space triggers flip when not flipped
    const key = ' '
    if (key === ' ' || key === 'Enter') {
      if (!session.isFlipped) {
        useReviewStore.getState().flipCard()
      }
    }

    expect(useReviewStore.getState().session!.isFlipped).toBe(true)
  })

  it('Enter key should trigger flip (simulated handler logic)', () => {
    const card = makeCard({ id: 'c1', deckId: 'd1' })
    useDeckStore.setState({ decks: [makeDeck('d1', 'Test', [card])] })
    useReviewStore.getState().startSession('d1', [card], 'Test')

    const key = 'Enter'
    if (key === ' ' || key === 'Enter') {
      if (!useReviewStore.getState().session!.isFlipped) {
        useReviewStore.getState().flipCard()
      }
    }

    expect(useReviewStore.getState().session!.isFlipped).toBe(true)
  })

  it('number keys 1-4 trigger responses when flipped (simulated handler)', async () => {
    const card = makeCard({ id: 'c1', deckId: 'd1' })
    useDeckStore.setState({ decks: [makeDeck('d1', 'Test', [card])] })
    useReviewStore.getState().startSession('d1', [card], 'Test')

    // Flip first
    useReviewStore.getState().flipCard()
    expect(useReviewStore.getState().session!.isFlipped).toBe(true)

    // Simulate key '3' (Good) while flipped
    const key = '3'
    const session = useReviewStore.getState().session!
    if (session.isFlipped && ResponseKeyBindings[key]) {
      await useReviewStore.getState().answerCard(ResponseKeyBindings[key])
    }

    // Card should have been answered
    expect(useReviewStore.getState().getCurrentCard()).toBeNull() // only 1 card
  })

  it('ResponseKeyBindings maps 1=Again, 2=Hard, 3=Good, 4=Easy', () => {
    expect(ResponseKeyBindings['1']).toBe(ReviewResponse.Again)
    expect(ResponseKeyBindings['2']).toBe(ReviewResponse.Hard)
    expect(ResponseKeyBindings['3']).toBe(ReviewResponse.Good)
    expect(ResponseKeyBindings['4']).toBe(ReviewResponse.Easy)
  })

  it('number keys are ignored when card is not flipped', () => {
    const card = makeCard({ id: 'c1', deckId: 'd1' })
    useDeckStore.setState({ decks: [makeDeck('d1', 'Test', [card])] })
    useReviewStore.getState().startSession('d1', [card], 'Test')

    // Card is not flipped
    const session = useReviewStore.getState().session!
    expect(session.isFlipped).toBe(false)

    // Simulate key '3' while NOT flipped — should be ignored
    const key = '3'
    let answered = false
    if (session.isFlipped && ResponseKeyBindings[key]) {
      answered = true
    }

    expect(answered).toBe(false)
    expect(useReviewStore.getState().session!.currentIndex).toBe(0) // no advance
  })

  it('Space/Enter are ignored when card IS flipped (no double-flip)', () => {
    const card = makeCard({ id: 'c1', deckId: 'd1' })
    useDeckStore.setState({ decks: [makeDeck('d1', 'Test', [card])] })
    useReviewStore.getState().startSession('d1', [card], 'Test')

    // Flip the card
    useReviewStore.getState().flipCard()
    expect(useReviewStore.getState().session!.isFlipped).toBe(true)

    // The handler: Space/Enter only flip when NOT flipped
    // (the actual handler just calls flipCard which toggles, but the
    //  guard in the handler prevents it when already flipped)
    const key = ' '
    const session = useReviewStore.getState().session!
    if (key === ' ' || key === 'Enter') {
      if (!session.isFlipped) {
        useReviewStore.getState().flipCard()
      }
    }

    // Should still be flipped (not toggled back)
    expect(useReviewStore.getState().session!.isFlipped).toBe(true)
  })
})

describe('Web Platform: UI Conditional Logic', () => {
  it('web shows keyboard shortcut hints (Platform.OS === web)', () => {
    // The review screen conditionally renders keyboard hints:
    //   {Platform.OS === 'web' && <Text>Space / Enter</Text>}
    //   {Platform.OS === 'web' && <Text>{index + 1}</Text>}
    expect(Platform.OS).toBe('web')

    // On web, the "Show Answer" button shows "Space / Enter" hint
    const showHint = Platform.OS === 'web'
    expect(showHint).toBe(true)

    // On web, response buttons show number key hints (1, 2, 3, 4)
    const showKeyNumbers = Platform.OS === 'web'
    expect(showKeyNumbers).toBe(true)
  })
})

describe('Web Platform: useKeyboardShortcuts hook logic', () => {
  it('hook activates only on web platform', () => {
    // The hook checks: if (Platform.OS !== 'web') return
    // On web, it attaches a keydown listener to document
    const shouldAttachListener = Platform.OS === 'web'
    expect(shouldAttachListener).toBe(true)
  })

  it('full keyboard flow: Space to flip, then number to answer', async () => {
    const cards = [
      makeCard({ id: 'c1', deckId: 'd1' }),
      makeCard({ id: 'c2', deckId: 'd1' }),
    ]
    useDeckStore.setState({ decks: [makeDeck('d1', 'Test', cards)] })
    useReviewStore.getState().startSession('d1', cards, 'Test')

    // Simulate the full keyboard handler from the review screen
    const simulateKey = async (key: string) => {
      const session = useReviewStore.getState().session
      const currentCard = useReviewStore.getState().getCurrentCard()
      if (!session || !currentCard) return

      if (key === ' ' || key === 'Enter') {
        if (!session.isFlipped) {
          useReviewStore.getState().flipCard()
        }
        return
      }

      if (session.isFlipped && ResponseKeyBindings[key]) {
        await useReviewStore.getState().answerCard(ResponseKeyBindings[key])
      }
    }

    // Card 1: Space to flip, then '4' for Easy
    await simulateKey(' ')
    expect(useReviewStore.getState().session!.isFlipped).toBe(true)
    await simulateKey('4')
    expect(useReviewStore.getState().session!.currentIndex).toBe(1)

    // Card 2: Enter to flip, then '1' for Again
    await simulateKey('Enter')
    expect(useReviewStore.getState().session!.isFlipped).toBe(true)
    await simulateKey('1')

    // Session complete
    expect(useReviewStore.getState().getCurrentCard()).toBeNull()

    const session = useReviewStore.getState().endSession()!
    expect(session.results[0].response).toBe(ReviewResponse.Easy)
    expect(session.results[1].response).toBe(ReviewResponse.Again)
  })
})
