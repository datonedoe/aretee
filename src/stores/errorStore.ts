import { create } from 'zustand'
import { ErrorEvent, ErrorPattern, ErrorCategory, UserErrorProfile } from '../types/errors'
import { Card, Deck } from '../types'
import { ErrorProfileManager } from '../services/errors/profile'
import { ErrorClassifier } from '../services/errors/classifier'
import { isDemoMode, getDemoErrorEvents } from '../utils/demo-data'

const profileManager = new ErrorProfileManager()
const demoClassifier = new ErrorClassifier()

interface ErrorState {
  profile: UserErrorProfile | null
  isLoading: boolean
  error: string | null

  loadProfile: () => Promise<void>
  recordError: (event: ErrorEvent) => Promise<void>
  getTargetedPractice: (decks: Deck[], limit?: number) => Promise<Card[]>
  getTopWeaknesses: (limit?: number) => ErrorPattern[]
  getErrorStats: () => {
    totalErrors: number
    errorRate: number
    topCategory: ErrorCategory | null
  }
}

export const useErrorStore = create<ErrorState>((set, get) => ({
  profile: null,
  isLoading: false,
  error: null,

  loadProfile: async () => {
    set({ isLoading: true, error: null })
    try {
      // Demo mode: build profile from mock error events
      if (isDemoMode()) {
        const events = getDemoErrorEvents()
        const patterns = demoClassifier.classifyBatch(events)
        const profile: UserErrorProfile = {
          userId: 'demo',
          patterns,
          topWeaknesses: patterns.slice(0, 5).map((p) => p.category),
          lastUpdated: new Date(),
          totalErrors: events.length,
          totalReviews: 42,
          errorRate: events.length / 42,
        }
        set({ profile, isLoading: false })
        return
      }
      await profileManager.load()
      const profile = await profileManager.getProfile()
      set({ profile, isLoading: false })
    } catch (err) {
      set({ error: String(err), isLoading: false })
    }
  },

  recordError: async (event: ErrorEvent) => {
    try {
      await profileManager.recordError(event)
      const profile = await profileManager.getProfile()
      set({ profile })
    } catch (err) {
      set({ error: String(err) })
    }
  },

  getTargetedPractice: async (decks: Deck[], limit?: number) => {
    return profileManager.getTargetedPracticeCards(decks, limit)
  },

  getTopWeaknesses: (limit?: number) => {
    const { profile } = get()
    if (!profile) return []
    return profile.patterns.slice(0, limit ?? 5)
  },

  getErrorStats: () => {
    const { profile } = get()
    if (!profile) {
      return { totalErrors: 0, errorRate: 0, topCategory: null }
    }
    return {
      totalErrors: profile.totalErrors,
      errorRate: profile.errorRate,
      topCategory: profile.topWeaknesses[0] ?? null,
    }
  },
}))
