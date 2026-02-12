import { ReviewResponse, ReviewResult, CardState } from '../../types'
import { FSRS_PARAMS, DEFAULT_DESIRED_RETENTION } from '../../utils/constants'
import { formatDate, addDaysToDate, parseDate } from '../../utils/dates'

/**
 * FSRS-5 SRS Engine
 *
 * Three-component memory model: Difficulty (D), Stability (S), Retrievability (R)
 * Based on the FSRS-5 algorithm with 19 default parameters.
 */
export class SRSEngine {
  // Legacy defaults kept for backward compat
  static readonly defaultEase = 250
  static readonly minimumEase = 130
  static readonly fuzzFactor = 0.05

  private static w = FSRS_PARAMS

  /** Retrievability: probability of recall after t days with stability S */
  static retrievability(elapsedDays: number, stability: number): number {
    if (stability <= 0) return 0
    const factor = 19 / 81 // FSRS decay constant
    return Math.pow(1 + (factor * elapsedDays) / stability, -1)
  }

  /** Initial stability for each rating (w[0..3]) */
  private static initStability(rating: number): number {
    return Math.max(0.1, this.w[rating - 1])
  }

  /** Initial difficulty for a rating */
  private static initDifficulty(rating: number): number {
    return this.clampDifficulty(this.w[4] - Math.exp(this.w[5] * (rating - 1)) + 1)
  }

  /** Mean reversion for difficulty */
  private static meanReversion(init: number, current: number): number {
    return this.w[7] * init + (1 - this.w[7]) * current
  }

  /** Next difficulty after a review */
  private static nextDifficulty(d: number, rating: number): number {
    const newD = d - this.w[6] * (rating - 3)
    return this.clampDifficulty(this.meanReversion(this.initDifficulty(4), newD))
  }

  private static clampDifficulty(d: number): number {
    return Math.min(10, Math.max(1, d))
  }

  /** Short-term stability (for learning/relearning steps) */
  private static shortTermStability(s: number, rating: number): number {
    return s * Math.exp(this.w[17] * (rating - 3 + this.w[18]))
  }

  /** Next stability after a successful recall */
  private static nextRecallStability(
    d: number,
    s: number,
    r: number,
    rating: number
  ): number {
    const hardPenalty = rating === 2 ? this.w[15] : 1
    const easyBonus = rating === 4 ? this.w[16] : 1
    return (
      s *
      (1 +
        Math.exp(this.w[8]) *
          (11 - d) *
          Math.pow(s, -this.w[9]) *
          (Math.exp((1 - r) * this.w[10]) - 1) *
          hardPenalty *
          easyBonus)
    )
  }

  /** Next stability after a lapse (forgetting) */
  private static nextForgetStability(
    d: number,
    s: number,
    r: number
  ): number {
    return (
      this.w[11] *
      Math.pow(d, -this.w[12]) *
      (Math.pow(s + 1, this.w[13]) - 1) *
      Math.exp((1 - r) * this.w[14])
    )
  }

  /** Convert desired retention to interval in days */
  private static nextInterval(s: number, desiredRetention: number): number {
    const factor = 19 / 81
    const interval = (s / factor) * (Math.pow(desiredRetention, -1) - 1)
    return Math.max(1, Math.round(interval))
  }

  /**
   * Main FSRS review calculation
   */
  static calculateNextReview(
    currentInterval: number,
    currentEase: number,
    response: ReviewResponse,
    reviewCount: number,
    applyFuzz: boolean = true,
    // FSRS params
    currentDifficulty: number = 0,
    currentStability: number = 0,
    currentState: CardState = CardState.New,
    lastReview: Date | null = null,
    currentLapses: number = 0,
    desiredRetention: number = DEFAULT_DESIRED_RETENTION,
    responseTimeMs: number | null = null
  ): ReviewResult {
    const rating = this.responseToRating(response)
    const now = new Date()
    const elapsedDays =
      lastReview != null
        ? Math.max(0, (now.getTime() - new Date(lastReview).getTime()) / (1000 * 60 * 60 * 24))
        : 0

    let newDifficulty: number
    let newStability: number
    let newState: CardState
    let newLapses = currentLapses
    let scheduledDays: number

    if (currentState === CardState.New) {
      // First review ever
      newDifficulty = this.initDifficulty(rating)
      newStability = this.initStability(rating)

      // Apply response time weighting to difficulty
      if (responseTimeMs != null) {
        newDifficulty = this.adjustDifficultyByResponseTime(newDifficulty, responseTimeMs, rating)
      }

      if (rating === 1) {
        newState = CardState.Learning
        newLapses += 1
      } else {
        newState = CardState.Review
      }
    } else if (
      currentState === CardState.Learning ||
      currentState === CardState.Relearning
    ) {
      // In learning/relearning steps
      newDifficulty = this.nextDifficulty(currentDifficulty, rating)

      if (responseTimeMs != null) {
        newDifficulty = this.adjustDifficultyByResponseTime(newDifficulty, responseTimeMs, rating)
      }

      if (rating === 1) {
        // Again → stay in learning/relearning
        newStability = this.initStability(1)
        newState =
          currentState === CardState.Learning
            ? CardState.Learning
            : CardState.Relearning
        newLapses += 1
      } else {
        // Graduated
        newStability = this.shortTermStability(currentStability > 0 ? currentStability : this.initStability(rating), rating)
        newState = CardState.Review
      }
    } else {
      // Review state — the main FSRS logic
      const r = this.retrievability(elapsedDays, currentStability)
      newDifficulty = this.nextDifficulty(currentDifficulty, rating)

      if (responseTimeMs != null) {
        newDifficulty = this.adjustDifficultyByResponseTime(newDifficulty, responseTimeMs, rating)
      }

      if (rating === 1) {
        // Lapse
        newStability = this.nextForgetStability(
          currentDifficulty,
          currentStability,
          r
        )
        newState = CardState.Relearning
        newLapses += 1
      } else {
        // Successful recall
        newStability = this.nextRecallStability(
          currentDifficulty,
          currentStability,
          r,
          rating
        )
        newState = CardState.Review
      }
    }

    // Calculate interval from stability
    if (newState === CardState.Learning || newState === CardState.Relearning) {
      // Short intervals for learning
      const learningIntervals: Record<number, number> = { 1: 0, 2: 1, 3: 1, 4: 2 }
      scheduledDays = learningIntervals[rating] ?? 1
    } else {
      scheduledDays = this.nextInterval(newStability, desiredRetention)
    }

    if (applyFuzz && scheduledDays > 2) {
      scheduledDays = this.applyFuzz(scheduledDays)
    }

    scheduledDays = Math.max(1, scheduledDays)

    const retrievability =
      currentStability > 0
        ? this.retrievability(elapsedDays, currentStability)
        : 0

    const nextReviewDate = addDaysToDate(now, scheduledDays)

    // Compute legacy ease from difficulty (for backward compat with markdown format)
    const newEase = Math.round(250 + (5 - newDifficulty) * 30)

    return {
      nextReviewDate,
      newInterval: scheduledDays,
      newEase,
      newDifficulty,
      newStability,
      retrievability,
      elapsed_days: Math.round(elapsedDays),
      scheduled_days: scheduledDays,
      state: newState,
      lapses: newLapses,
    }
  }

  /** Adjust difficulty based on response latency */
  private static adjustDifficultyByResponseTime(
    difficulty: number,
    responseTimeMs: number,
    rating: number
  ): number {
    if (rating === 1) return difficulty // "Again" — don't adjust

    // Median expected response time ~8 seconds
    const medianMs = 8000
    const ratio = responseTimeMs / medianMs

    // Slow correct answers (ratio > 1) increase difficulty slightly
    // Fast correct answers (ratio < 1) decrease difficulty slightly
    const adjustment = Math.log(ratio) * 0.3
    return this.clampDifficulty(difficulty + adjustment)
  }

  private static responseToRating(response: ReviewResponse): number {
    switch (response) {
      case ReviewResponse.Again:
        return 1
      case ReviewResponse.Hard:
        return 2
      case ReviewResponse.Good:
        return 3
      case ReviewResponse.Easy:
        return 4
    }
  }

  private static applyFuzz(interval: number): number {
    if (interval <= 2) return interval
    const fuzzRange = Math.max(1, Math.round(interval * this.fuzzFactor))
    const minInterval = interval - fuzzRange
    const maxInterval = interval + fuzzRange
    return Math.floor(Math.random() * (maxInterval - minInterval + 1) + minInterval)
  }

  /**
   * Extended markdown format: <!--SR:!date,interval,ease,difficulty,stability-->
   * Falls back to legacy format if only 3 fields present.
   */
  static formatSchedulingMetadata(
    date: Date,
    interval: number,
    ease: number,
    difficulty?: number,
    stability?: number
  ): string {
    const dateString = formatDate(date)
    if (difficulty != null && stability != null) {
      return `<!--SR:!${dateString},${interval},${ease},${difficulty.toFixed(2)},${stability.toFixed(2)}-->`
    }
    return `<!--SR:!${dateString},${interval},${ease}-->`
  }

  static parseSchedulingMetadata(
    text: string
  ): { date: Date; interval: number; ease: number; difficulty?: number; stability?: number } | null {
    // Extended format with FSRS fields
    const extPattern = /<!--SR:!(\d{4}-\d{2}-\d{2}),(\d+),(\d+),([\d.]+),([\d.]+)-->/
    const extMatch = text.match(extPattern)
    if (extMatch) {
      const [, dateString, intervalStr, easeStr, diffStr, stabStr] = extMatch
      const date = parseDate(dateString)
      if (!date) return null
      return {
        date,
        interval: parseInt(intervalStr, 10),
        ease: parseInt(easeStr, 10),
        difficulty: parseFloat(diffStr),
        stability: parseFloat(stabStr),
      }
    }

    // Legacy format
    const pattern = /<!--SR:!(\d{4}-\d{2}-\d{2}),(\d+),(\d+)-->/
    const match = text.match(pattern)
    if (!match) return null

    const [, dateString, intervalStr, easeStr] = match
    const date = parseDate(dateString)
    if (!date) return null

    return {
      date,
      interval: parseInt(intervalStr, 10),
      ease: parseInt(easeStr, 10),
    }
  }

  /**
   * Get preview intervals for all responses (used by ResponseButtons)
   */
  static getPreviewIntervals(
    currentInterval: number,
    currentEase: number,
    reviewCount: number,
    currentDifficulty: number = 0,
    currentStability: number = 0,
    currentState: CardState = CardState.New,
    lastReview: Date | null = null,
    currentLapses: number = 0,
    desiredRetention: number = DEFAULT_DESIRED_RETENTION
  ): Record<ReviewResponse, number> {
    const results = {} as Record<ReviewResponse, number>

    for (const response of Object.values(ReviewResponse)) {
      const result = this.calculateNextReview(
        currentInterval,
        currentEase,
        response,
        reviewCount,
        false,
        currentDifficulty,
        currentStability,
        currentState,
        lastReview,
        currentLapses,
        desiredRetention,
        null
      )
      results[response] = result.newInterval
    }

    return results
  }
}
