import { StreakData, DailyLogEntry, DEFAULT_STREAK_DATA } from '../../types'
import { ReviewResponse } from '../../types'
import { format, differenceInCalendarDays, parseISO } from 'date-fns'
import { getStorageService } from '../platform'

const STREAK_STORAGE_KEY = 'streakData'

export class StreakService {
  async loadStreak(): Promise<StreakData> {
    const storage = getStorageService()
    const data = await storage.get<StreakData>(STREAK_STORAGE_KEY)
    return data ?? { ...DEFAULT_STREAK_DATA }
  }

  async saveStreak(data: StreakData): Promise<void> {
    const storage = getStorageService()
    await storage.set(STREAK_STORAGE_KEY, data)
  }

  async recordReview(response: ReviewResponse): Promise<StreakData> {
    const data = await this.loadStreak()
    const today = format(new Date(), 'yyyy-MM-dd')

    // Find or create today's log entry
    let todayEntry = data.dailyLog.find((e) => e.date === today)
    if (!todayEntry) {
      todayEntry = { date: today, cards: 0, again: 0, hard: 0, good: 0, easy: 0 }
      data.dailyLog.push(todayEntry)
    }

    // Update counts
    todayEntry.cards++
    switch (response) {
      case ReviewResponse.Again: todayEntry.again++; break
      case ReviewResponse.Hard: todayEntry.hard++; break
      case ReviewResponse.Good: todayEntry.good++; break
      case ReviewResponse.Easy: todayEntry.easy++; break
    }

    // Update streak
    data.summary.totalReviews++
    this.updateStreakSummary(data, today)

    // Keep only last 90 days of daily log
    if (data.dailyLog.length > 90) {
      data.dailyLog = data.dailyLog.slice(-90)
    }

    await this.saveStreak(data)
    return data
  }

  private updateStreakSummary(data: StreakData, today: string): void {
    const lastReview = data.summary.lastReviewDate

    if (!lastReview) {
      // First ever review
      data.summary.currentStreak = 1
      data.summary.longestStreak = 1
    } else {
      const daysSinceLastReview = differenceInCalendarDays(
        parseISO(today),
        parseISO(lastReview)
      )

      if (daysSinceLastReview === 0) {
        // Same day, streak unchanged
      } else if (daysSinceLastReview === 1) {
        // Consecutive day
        data.summary.currentStreak++
      } else if (daysSinceLastReview === 2 && data.summary.freezesRemaining > 0) {
        // Missed one day but have a freeze
        data.summary.freezesRemaining--
        data.summary.currentStreak++
      } else {
        // Streak broken
        data.summary.currentStreak = 1
        data.summary.freezesRemaining = data.summary.freezesMax
      }
    }

    if (data.summary.currentStreak > data.summary.longestStreak) {
      data.summary.longestStreak = data.summary.currentStreak
    }

    data.summary.lastReviewDate = today
  }

  getDaysSinceLastReview(data: StreakData): number | null {
    if (!data.summary.lastReviewDate) return null
    return differenceInCalendarDays(
      new Date(),
      parseISO(data.summary.lastReviewDate)
    )
  }

  isComeback(data: StreakData): boolean {
    const days = this.getDaysSinceLastReview(data)
    return days !== null && days >= 7
  }
}
