import { create } from 'zustand'
import { Card, ReviewResponse, ReviewResult, SyncStatus } from '../types'
import { SRSEngine } from '../services/srs/engine'
import { CardWriter } from '../services/srs/writer'
import { getFileService } from '../services/platform'
import { useDeckStore } from './deckStore'

interface ReviewSession {
  deckId: string
  deckName: string
  cards: Card[]
  currentIndex: number
  isFlipped: boolean
  results: ReviewSessionResult[]
  startedAt: Date
}

interface ReviewSessionResult {
  cardId: string
  response: ReviewResponse
  reviewResult: ReviewResult
}

interface ReviewState {
  session: ReviewSession | null

  startSession: (deckId: string, cards: Card[], deckName: string) => void
  flipCard: () => void
  answerCard: (response: ReviewResponse) => Promise<void>
  getCurrentCard: () => Card | null
  getProgress: () => { current: number; total: number }
  endSession: () => ReviewSession | null
}

const cardWriter = new CardWriter()

export const useReviewStore = create<ReviewState>((set, get) => ({
  session: null,

  startSession: (deckId, cards, deckName) => {
    set({
      session: {
        deckId,
        deckName,
        cards: [...cards],
        currentIndex: 0,
        isFlipped: false,
        results: [],
        startedAt: new Date(),
      },
    })
  },

  flipCard: () => {
    set((state) => {
      if (!state.session) return state
      return {
        session: { ...state.session, isFlipped: !state.session.isFlipped },
      }
    })
  },

  answerCard: async (response: ReviewResponse) => {
    const { session } = get()
    if (!session) return

    const card = session.cards[session.currentIndex]
    if (!card) return

    // Calculate new scheduling
    const reviewResult = SRSEngine.calculateNextReview(
      card.interval,
      card.ease,
      response,
      card.reviewCount
    )

    // Write back to file
    try {
      const fileService = getFileService()
      const content = await fileService.readFile(card.sourceFilePath)
      const updatedContent = cardWriter.updateCardScheduling(
        content,
        card,
        reviewResult.nextReviewDate,
        reviewResult.newInterval,
        reviewResult.newEase
      )
      await fileService.writeFile(card.sourceFilePath, updatedContent)

      // Update card in deck store
      useDeckStore.getState().updateCard(session.deckId, card.id, {
        nextReviewDate: reviewResult.nextReviewDate,
        interval: reviewResult.newInterval,
        ease: reviewResult.newEase,
        reviewCount: card.reviewCount + 1,
        syncStatus: SyncStatus.Synced,
        lastModified: new Date(),
      })
    } catch {
      // Mark as pending sync if write fails
      useDeckStore.getState().updateCard(session.deckId, card.id, {
        nextReviewDate: reviewResult.nextReviewDate,
        interval: reviewResult.newInterval,
        ease: reviewResult.newEase,
        reviewCount: card.reviewCount + 1,
        syncStatus: SyncStatus.PendingSync,
        lastModified: new Date(),
      })
    }

    const result: ReviewSessionResult = {
      cardId: card.id,
      response,
      reviewResult,
    }

    set((state) => {
      if (!state.session) return state
      const nextIndex = state.session.currentIndex + 1

      return {
        session: {
          ...state.session,
          currentIndex: nextIndex,
          isFlipped: false,
          results: [...state.session.results, result],
        },
      }
    })
  },

  getCurrentCard: () => {
    const { session } = get()
    if (!session || session.currentIndex >= session.cards.length) return null
    return session.cards[session.currentIndex]
  },

  getProgress: () => {
    const { session } = get()
    if (!session) return { current: 0, total: 0 }
    return { current: session.currentIndex, total: session.cards.length }
  },

  endSession: () => {
    const { session } = get()
    set({ session: null })
    return session
  },
}))
