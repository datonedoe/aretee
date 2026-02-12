import { create } from 'zustand'
import {
  ImmersionItem,
  ContentType,
  FeedInteraction,
  FeedInteractionRecord,
  CONTENT_TYPES,
} from '../types/immersion'
import { generateImmersionItem, generateBatch } from '../services/immersion/api'

const INTERACTION_WINDOW = 20 // last N interactions for calibration
const DEFAULT_DIFFICULTY = 5
const DIFFICULTY_STEP = 0.3

interface ImmersionState {
  feedItems: ImmersionItem[]
  currentIndex: number
  isLoading: boolean
  isGenerating: boolean
  error: string | null

  // Calibration
  difficulty: number
  interactions: FeedInteractionRecord[]
  language: string
  region: string | null

  // Word tracking
  learnedWords: Array<{ word: string; meaning: string; addedAt: number }>
  selectedWord: { word: string; translation: string; partOfSpeech: string; example: string } | null
  isTranslating: boolean
  showTranslation: boolean

  // Actions
  loadFeed: (contentType?: ContentType) => Promise<void>
  generateMore: (contentType?: ContentType) => Promise<void>
  recordInteraction: (itemId: string, interaction: FeedInteraction) => void
  nextItem: () => void
  prevItem: () => void
  setLanguage: (lang: string) => void
  setRegion: (region: string | null) => void
  addLearnedWord: (word: string, meaning: string) => void
  setSelectedWord: (
    word: { word: string; translation: string; partOfSpeech: string; example: string } | null
  ) => void
  setIsTranslating: (v: boolean) => void
  setShowTranslation: (v: boolean) => void
  getCalibrationStats: () => { tooEasy: number; tooHard: number; engaged: number }
}

export const useImmersionStore = create<ImmersionState>((set, get) => ({
  feedItems: [],
  currentIndex: 0,
  isLoading: false,
  isGenerating: false,
  error: null,
  difficulty: DEFAULT_DIFFICULTY,
  interactions: [],
  language: 'es',
  region: null,
  learnedWords: [],
  selectedWord: null,
  isTranslating: false,
  showTranslation: false,

  loadFeed: async (contentType) => {
    const state = get()
    set({ isLoading: true, error: null })
    try {
      const ct = contentType ?? CONTENT_TYPES[Math.floor(Math.random() * CONTENT_TYPES.length)]
      const items = await generateBatch(
        {
          difficulty_level: Math.round(state.difficulty),
          content_type: ct,
          language: state.language,
          region: state.region ?? undefined,
        },
        5
      )
      set({ feedItems: items, currentIndex: 0, isLoading: false })
    } catch (err) {
      set({ isLoading: false, error: err instanceof Error ? err.message : 'Failed to load feed' })
    }
  },

  generateMore: async (contentType) => {
    const state = get()
    set({ isGenerating: true })
    try {
      const ct = contentType ?? CONTENT_TYPES[Math.floor(Math.random() * CONTENT_TYPES.length)]
      const item = await generateImmersionItem({
        difficulty_level: Math.round(state.difficulty),
        content_type: ct,
        language: state.language,
        region: state.region ?? undefined,
      })
      set((s) => ({
        feedItems: [...s.feedItems, item],
        isGenerating: false,
      }))
    } catch {
      set({ isGenerating: false })
    }
  },

  recordInteraction: (itemId, interaction) => {
    const record: FeedInteractionRecord = {
      itemId,
      interaction,
      timestamp: Date.now(),
    }

    set((s) => {
      const newInteractions = [...s.interactions, record].slice(-INTERACTION_WINDOW)

      // Recalculate difficulty via moving average
      let adjustment = 0
      const recent = newInteractions.slice(-10)
      for (const r of recent) {
        if (r.interaction === 'too_easy') adjustment -= DIFFICULTY_STEP
        else if (r.interaction === 'too_hard') adjustment += DIFFICULTY_STEP
      }

      const avgAdjustment = recent.length > 0 ? adjustment / recent.length : 0
      const newDifficulty = Math.max(1, Math.min(10, s.difficulty + avgAdjustment))

      return {
        interactions: newInteractions,
        difficulty: newDifficulty,
      }
    })
  },

  nextItem: () => {
    set((s) => {
      const next = s.currentIndex + 1
      // Generate more if near end
      if (next >= s.feedItems.length - 2) {
        get().generateMore()
      }
      return {
        currentIndex: Math.min(next, s.feedItems.length - 1),
        showTranslation: false,
        selectedWord: null,
      }
    })
  },

  prevItem: () => {
    set((s) => ({
      currentIndex: Math.max(0, s.currentIndex - 1),
      showTranslation: false,
      selectedWord: null,
    }))
  },

  setLanguage: (lang) => set({ language: lang }),
  setRegion: (region) => set({ region }),

  addLearnedWord: (word, meaning) => {
    set((s) => ({
      learnedWords: [...s.learnedWords, { word, meaning, addedAt: Date.now() }],
    }))
  },

  setSelectedWord: (word) => set({ selectedWord: word }),
  setIsTranslating: (v) => set({ isTranslating: v }),
  setShowTranslation: (v) => set({ showTranslation: v }),

  getCalibrationStats: () => {
    const { interactions } = get()
    const recent = interactions.slice(-INTERACTION_WINDOW)
    return {
      tooEasy: recent.filter((r) => r.interaction === 'too_easy').length,
      tooHard: recent.filter((r) => r.interaction === 'too_hard').length,
      engaged: recent.filter((r) => r.interaction === 'engaged').length,
    }
  },
}))
