export interface StreakSummary {
  currentStreak: number
  longestStreak: number
  lastReviewDate: string | null
  freezesRemaining: number
  freezesMax: number
  totalReviews: number
}

export interface DailyLogEntry {
  date: string
  cards: number
  again: number
  hard: number
  good: number
  easy: number
}

export interface StreakData {
  summary: StreakSummary
  dailyLog: DailyLogEntry[]
}

export const DEFAULT_STREAK_DATA: StreakData = {
  summary: {
    currentStreak: 0,
    longestStreak: 0,
    lastReviewDate: null,
    freezesRemaining: 2,
    freezesMax: 2,
    totalReviews: 0,
  },
  dailyLog: [],
}
