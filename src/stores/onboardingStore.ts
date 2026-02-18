import { create } from 'zustand'
import { getStorageService } from '../services/platform'

export type OnboardingStep = 'welcome' | 'interests' | 'goals' | 'vault-setup' | 'ready'

export interface OnboardingState {
  /** Whether the user has completed onboarding */
  hasCompleted: boolean
  /** Current step in the onboarding flow */
  currentStep: OnboardingStep
  /** Selected learning interests */
  interests: string[]
  /** Selected learning goals */
  goals: string[]
  /** Whether the store has loaded from storage */
  isLoaded: boolean

  loadOnboarding: () => Promise<void>
  setStep: (step: OnboardingStep) => void
  setInterests: (interests: string[]) => void
  setGoals: (goals: string[]) => void
  completeOnboarding: () => Promise<void>
  resetOnboarding: () => Promise<void>
}

const ONBOARDING_KEY = 'onboarding_state'

export const INTEREST_OPTIONS = [
  { id: 'languages', icon: '🌍', label: 'Languages', description: 'Spanish, Mandarin, and more' },
  { id: 'science', icon: '🔬', label: 'Science', description: 'Physics, chemistry, biology' },
  { id: 'math', icon: '📐', label: 'Mathematics', description: 'Algebra, calculus, stats' },
  { id: 'history', icon: '📜', label: 'History', description: 'World history, civilizations' },
  { id: 'coding', icon: '💻', label: 'Programming', description: 'CS fundamentals, algorithms' },
  { id: 'medicine', icon: '🏥', label: 'Medicine', description: 'Anatomy, pharmacology' },
  { id: 'finance', icon: '📊', label: 'Finance', description: 'Accounting, markets, quant' },
  { id: 'music', icon: '🎵', label: 'Music', description: 'Theory, ear training' },
  { id: 'art', icon: '🎨', label: 'Art & Design', description: 'Art history, design principles' },
  { id: 'philosophy', icon: '🧠', label: 'Philosophy', description: 'Ethics, logic, metaphysics' },
] as const

export const GOAL_OPTIONS = [
  { id: 'daily-habit', icon: '🔥', label: 'Build a daily habit', description: 'Learn something every day' },
  { id: 'exam-prep', icon: '📝', label: 'Prepare for exams', description: 'Ace tests and certifications' },
  { id: 'career', icon: '💼', label: 'Career growth', description: 'Level up professional skills' },
  { id: 'curiosity', icon: '✨', label: 'Pure curiosity', description: 'Learn for the love of it' },
  { id: 'deep-mastery', icon: '🏆', label: 'Deep mastery', description: 'Become an expert in a field' },
  { id: 'retention', icon: '🧲', label: 'Remember more', description: 'Stop forgetting what you learn' },
] as const

interface SavedOnboarding {
  hasCompleted: boolean
  interests: string[]
  goals: string[]
}

export const useOnboardingStore = create<OnboardingState>((set, get) => ({
  hasCompleted: false,
  currentStep: 'welcome',
  interests: [],
  goals: [],
  isLoaded: false,

  loadOnboarding: async () => {
    const storage = getStorageService()
    const saved = await storage.get<SavedOnboarding>(ONBOARDING_KEY)
    if (saved) {
      set({
        hasCompleted: saved.hasCompleted,
        interests: saved.interests ?? [],
        goals: saved.goals ?? [],
        isLoaded: true,
      })
    } else {
      set({ isLoaded: true })
    }
  },

  setStep: (step) => set({ currentStep: step }),

  setInterests: (interests) => set({ interests }),

  setGoals: (goals) => set({ goals }),

  completeOnboarding: async () => {
    const { interests, goals } = get()
    const storage = getStorageService()
    const data: SavedOnboarding = { hasCompleted: true, interests, goals }
    await storage.set(ONBOARDING_KEY, data)
    set({ hasCompleted: true, currentStep: 'ready' })
  },

  resetOnboarding: async () => {
    const storage = getStorageService()
    await storage.delete(ONBOARDING_KEY)
    set({
      hasCompleted: false,
      currentStep: 'welcome',
      interests: [],
      goals: [],
    })
  },
}))
