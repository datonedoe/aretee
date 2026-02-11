import { ReviewResponse, ReviewResult } from '../../types'
import { DEFAULT_EASE, MINIMUM_EASE, FUZZ_FACTOR } from '../../utils/constants'
import { formatDate, addDaysToDate, parseDate } from '../../utils/dates'

export class SRSEngine {
  static readonly defaultEase = DEFAULT_EASE
  static readonly minimumEase = MINIMUM_EASE
  static readonly fuzzFactor = FUZZ_FACTOR

  static calculateNextReview(
    currentInterval: number,
    currentEase: number,
    response: ReviewResponse,
    reviewCount: number,
    applyFuzz: boolean = true
  ): ReviewResult {
    let newEase = currentEase
    let newInterval: number

    switch (response) {
      case ReviewResponse.Again:
        newEase = this.defaultEase
        newInterval = 1
        break

      case ReviewResponse.Hard:
        newEase = Math.max(this.minimumEase, currentEase - 20)
        newInterval = Math.max(1, Math.floor(currentInterval * 0.5))
        break

      case ReviewResponse.Good:
        if (reviewCount === 0) {
          newInterval = 1
        } else if (reviewCount === 1) {
          newInterval = 6
        } else {
          newInterval = Math.floor(currentInterval * (currentEase / 100))
        }
        break

      case ReviewResponse.Easy:
        newEase = currentEase + 20
        if (reviewCount === 0) {
          newInterval = 4
        } else if (reviewCount === 1) {
          newInterval = 10
        } else {
          newInterval = Math.floor(currentInterval * (currentEase / 100) * 1.3)
        }
        break
    }

    if (applyFuzz) {
      newInterval = this.applyFuzz(newInterval)
    }

    newInterval = Math.max(1, newInterval)

    const nextReviewDate = addDaysToDate(new Date(), newInterval)

    return {
      nextReviewDate,
      newInterval,
      newEase,
    }
  }

  private static applyFuzz(interval: number): number {
    if (interval <= 4) return interval

    const fuzzRange = interval * this.fuzzFactor
    const minInterval = interval - fuzzRange
    const maxInterval = interval + fuzzRange

    return Math.floor(Math.random() * (maxInterval - minInterval + 1) + minInterval)
  }

  static formatSchedulingMetadata(date: Date, interval: number, ease: number): string {
    const dateString = formatDate(date)
    return `<!--SR:!${dateString},${interval},${ease}-->`
  }

  static parseSchedulingMetadata(text: string): { date: Date; interval: number; ease: number } | null {
    const pattern = /<!--SR:!(\d{4}-\d{2}-\d{2}),(\d+),(\d+)-->/
    const match = text.match(pattern)

    if (!match) return null

    const [, dateString, intervalStr, easeStr] = match
    const date = parseDate(dateString)

    if (!date) return null

    const interval = parseInt(intervalStr, 10)
    const ease = parseInt(easeStr, 10)

    return { date, interval, ease }
  }

  static getPreviewIntervals(
    currentInterval: number,
    currentEase: number,
    reviewCount: number
  ): Record<ReviewResponse, number> {
    const results: Record<ReviewResponse, number> = {} as Record<ReviewResponse, number>

    for (const response of Object.values(ReviewResponse)) {
      const result = this.calculateNextReview(currentInterval, currentEase, response, reviewCount, false)
      results[response] = result.newInterval
    }

    return results
  }
}
