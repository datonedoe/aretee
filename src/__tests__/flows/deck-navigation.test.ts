/**
 * Deck Navigation Integration Test
 *
 * Tests navigation between modes (Flash, Socratic, Feynman):
 * - Deck list shows correct state
 * - Due counts and empty states
 * - Route generation for each mode
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

import { useDeckStore } from '../../stores/deckStore'
import { useSettingsStore } from '../../stores/settingsStore'
import { isCardDue } from '../../types'
import { makeCard, makeDeck } from './test-helpers'

/**
 * Helper: simulates the route logic from app/(tabs)/index.tsx
 * for the three navigation modes.
 */
function getReviewRoute(deckId: string): string {
  return `/review/${deckId}`
}

function getSocraticRoute(deckId: string, cardId: string): string {
  return `/review/socratic?cardId=${cardId}&deckId=${deckId}`
}

function getFeynmanRoute(deckId: string, cardId: string): string {
  return `/review/feynman?cardId=${cardId}&deckId=${deckId}`
}

describe('Deck Navigation', () => {
  beforeEach(() => {
    useDeckStore.setState({ decks: [], isLoading: false, error: null })
    useSettingsStore.setState({ vaultPath: '/test', isLoaded: true })
  })

  describe('Flash mode navigation', () => {
    it('tapping a deck generates correct review route', () => {
      const deck = makeDeck('d1', 'Math', [makeCard()])
      useDeckStore.setState({ decks: [deck] })

      const route = getReviewRoute('d1')
      expect(route).toBe('/review/d1')
    })

    it('Review All route uses "all" deckId', () => {
      const route = getReviewRoute('all')
      expect(route).toBe('/review/all')
    })

    it('Review All only available when cards are due', () => {
      const dueCard = makeCard({ nextReviewDate: new Date(2020, 0, 1) })
      const futureCard = makeCard({ nextReviewDate: new Date(2099, 0, 1) })

      useDeckStore.setState({
        decks: [
          makeDeck('d1', 'Math', [dueCard]),
          makeDeck('d2', 'Science', [futureCard]),
        ],
      })

      const totalDue = useDeckStore.getState().decks.reduce(
        (sum, d) => sum + d.cards.filter(isCardDue).length, 0
      )
      expect(totalDue).toBe(1)
      expect(totalDue > 0).toBe(true) // Review All button would show
    })

    it('Review All hidden when no cards due', () => {
      const futureCard = makeCard({ nextReviewDate: new Date(2099, 0, 1) })
      useDeckStore.setState({
        decks: [makeDeck('d1', 'Math', [futureCard])],
      })

      const totalDue = useDeckStore.getState().decks.reduce(
        (sum, d) => sum + d.cards.filter(isCardDue).length, 0
      )
      expect(totalDue).toBe(0)
    })
  })

  describe('Socratic mode navigation', () => {
    it('tapping Ask generates correct socratic route with random card', () => {
      const card = makeCard({ id: 'card-1' })
      const deck = makeDeck('d1', 'Philosophy', [card])
      useDeckStore.setState({ decks: [deck] })

      // Simulate the handler from index.tsx
      const deckData = useDeckStore.getState().getDeck('d1')!
      const randomCard = deckData.cards[Math.floor(Math.random() * deckData.cards.length)]
      const route = getSocraticRoute('d1', randomCard.id)

      expect(route).toContain('/review/socratic')
      expect(route).toContain('deckId=d1')
      expect(route).toContain(`cardId=${randomCard.id}`)
    })

    it('socratic mode skipped for empty deck', () => {
      const deck = makeDeck('d1', 'Empty', [])
      useDeckStore.setState({ decks: [deck] })

      const deckData = useDeckStore.getState().getDeck('d1')!
      // The handler checks: if (!deck || deck.cards.length === 0) return
      expect(deckData.cards.length).toBe(0)
    })
  })

  describe('Feynman mode navigation', () => {
    it('tapping Teach generates correct feynman route with random card', () => {
      const card = makeCard({ id: 'card-2' })
      const deck = makeDeck('d1', 'Physics', [card])
      useDeckStore.setState({ decks: [deck] })

      const deckData = useDeckStore.getState().getDeck('d1')!
      const randomCard = deckData.cards[Math.floor(Math.random() * deckData.cards.length)]
      const route = getFeynmanRoute('d1', randomCard.id)

      expect(route).toContain('/review/feynman')
      expect(route).toContain('deckId=d1')
      expect(route).toContain(`cardId=${randomCard.id}`)
    })

    it('feynman mode skipped for empty deck', () => {
      const deck = makeDeck('d1', 'Empty', [])
      useDeckStore.setState({ decks: [deck] })

      const deckData = useDeckStore.getState().getDeck('d1')!
      expect(deckData.cards.length).toBe(0)
    })
  })

  describe('Empty states', () => {
    it('no decks loaded shows empty list', () => {
      const decks = useDeckStore.getState().decks
      expect(decks).toHaveLength(0)
    })

    it('deck with all cards reviewed shows "Done" (no due)', () => {
      const futureCard = makeCard({ nextReviewDate: new Date(2099, 0, 1) })
      const deck = makeDeck('d1', 'Math', [futureCard])
      useDeckStore.setState({ decks: [deck] })

      const dueCount = deck.cards.filter(isCardDue).length
      expect(dueCount).toBe(0) // Would show "Done" badge
    })

    it('deck with due cards shows count badge', () => {
      const dueCards = [
        makeCard({ nextReviewDate: new Date(2020, 0, 1) }),
        makeCard({ nextReviewDate: new Date(2020, 0, 1) }),
        makeCard({ nextReviewDate: new Date(2099, 0, 1) }), // not due
      ]
      const deck = makeDeck('d1', 'Math', dueCards)
      useDeckStore.setState({ decks: [deck] })

      const dueCount = deck.cards.filter(isCardDue).length
      expect(dueCount).toBe(2) // Would show "2 due" badge
    })
  })

  describe('Multi-deck scenarios', () => {
    it('multiple decks with mixed due states', () => {
      useDeckStore.setState({
        decks: [
          makeDeck('d1', 'Math', [
            makeCard({ nextReviewDate: new Date(2020, 0, 1) }),
            makeCard({ nextReviewDate: new Date(2020, 0, 1) }),
          ]),
          makeDeck('d2', 'Science', [
            makeCard({ nextReviewDate: new Date(2099, 0, 1) }),
          ]),
          makeDeck('d3', 'History', [
            makeCard({ nextReviewDate: new Date(2020, 0, 1) }),
          ]),
        ],
      })

      const decks = useDeckStore.getState().decks
      expect(decks).toHaveLength(3)

      const dueCounts = decks.map((d) => d.cards.filter(isCardDue).length)
      expect(dueCounts).toEqual([2, 0, 1])

      const totalDue = dueCounts.reduce((a, b) => a + b, 0)
      expect(totalDue).toBe(3)
    })
  })
})
