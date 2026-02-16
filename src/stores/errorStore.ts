import { create } from 'zustand'
import { ErrorEvent, ErrorPattern, ErrorCategory, UserErrorProfile } from '../types/errors'
import { Card, Deck } from '../types'
import { ErrorProfileManager } from '../services/errors/profile'

const profileManager = new ErrorProfileManager()

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
