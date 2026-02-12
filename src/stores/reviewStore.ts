import { create } from 'zustand'
import { Card, ReviewResponse, ReviewResult, SyncStatus, CardState } from '../types'
import { SRSEngine } from '../services/srs/engine'
import { CardWriter } from '../services/srs/writer'
import { getFileService } from '../services/platform'
import { useDeckStore } from './deckStore'
import { useProfileStore } from './profileStore'
import { useSettingsStore } from './settingsStore'

interface ReviewSession {
  deckId: string
  deckName: string
  cards: Card[]
  currentIndex: number
  isFlipped: boolean
  results: ReviewSessionResult[]
  startedAt: Date
  cardShownAt: number | null
}

interface ReviewSessionResult {
  cardId: string
  response: ReviewResponse
  reviewResult: ReviewResult
  responseTimeMs: number | null
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
    useProfileStore.getState().resetSessionTracking()
    set({
      session: {
        deckId,
        deckName,
        cards: [...cards],
        currentIndex: 0,
        isFlipped: false,
        results: [],
        startedAt: new Date(),
        cardShownAt: null,
      },
    })
  },

  flipCard: () => {
    set((state) => {
      if (!state.session) return state
      return {
        session: {
          ...state.session,
          isFlipped: !state.session.isFlipped,
          // Record when the answer was shown (for response time tracking)
          cardShownAt: !state.session.isFlipped ? Date.now() : state.session.cardShownAt,
        },
      }
    })
  },

  answerCard: async (response: ReviewResponse) => {
    const { session } = get()
    if (!session) return

    const card = session.cards[session.currentIndex]
    if (!card) return

    // Calculate response time (time from flip to answer)
    const responseTimeMs = session.cardShownAt != null ? Date.now() - session.cardShownAt : null

    const { desiredRetention } = useSettingsStore.getState()

    // Calculate new scheduling with FSRS
    const reviewResult = SRSEngine.calculateNextReview(
      card.interval,
      card.ease,
      response,
      card.reviewCount,
      true,
      card.difficulty,
      card.stability,
      card.state,
      card.last_review,
      card.lapses,
      desiredRetention,
      responseTimeMs
    )

    const cardUpdates: Partial<Card> = {
      nextReviewDate: reviewResult.nextReviewDate,
      interval: reviewResult.newInterval,
      ease: reviewResult.newEase,
      reviewCount: card.reviewCount + 1,
      syncStatus: SyncStatus.Synced,
      lastModified: new Date(),
      difficulty: reviewResult.newDifficulty,
      stability: reviewResult.newStability,
      retrievability: reviewResult.retrievability,
      elapsed_days: reviewResult.elapsed_days,
      scheduled_days: reviewResult.scheduled_days,
      last_review: new Date(),
      reps: card.reps + 1,
      lapses: reviewResult.lapses,
      state: reviewResult.state,
      responseTimeMs,
    }

    // Write back to file
    try {
      const fileService = getFileService()
      const content = await fileService.readFile(card.sourceFilePath)
      const updatedContent = cardWriter.updateCardScheduling(
        content,
        card,
        reviewResult.nextReviewDate,
        reviewResult.newInterval,
        reviewResult.newEase,
        reviewResult.newDifficulty,
        reviewResult.newStability
      )
      await fileService.writeFile(card.sourceFilePath, updatedContent)

      useDeckStore.getState().updateCard(session.deckId, card.id, cardUpdates)
    } catch {
      useDeckStore.getState().updateCard(session.deckId, card.id, {
        ...cardUpdates,
        syncStatus: SyncStatus.PendingSync,
      })
    }

    // Track gamification
    useProfileStore.getState().onCardReviewed(response, session.deckId)

    const result: ReviewSessionResult = {
      cardId: card.id,
      response,
      reviewResult,
      responseTimeMs,
    }

    set((state) => {
      if (!state.session) return state
      const nextIndex = state.session.currentIndex + 1

      return {
        session: {
          ...state.session,
          currentIndex: nextIndex,
          isFlipped: false,
          cardShownAt: null,
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
