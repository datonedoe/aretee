import { ReviewResponse } from '../../types'

export const XP_RULES = {
  REVIEW_CARD: 10,
  EASY_BONUS: 5,
  COMPLETE_DECK: 50,
  STREAK_BASE: 25, // multiplied by streak_day
  COMPLETE_QUEST: 200,
  PERFECT_DAY: 500,
  COMEBACK_BONUS: 50, // first review after 7+ day gap
  LISTEN_EPISODE: 75,
} as const

export function calculateReviewXP(response: ReviewResponse): number {
  let xp = XP_RULES.REVIEW_CARD
  if (response === ReviewResponse.Easy) {
    xp += XP_RULES.EASY_BONUS
  }
  return xp
}

export function calculateDeckCompleteXP(): number {
  return XP_RULES.COMPLETE_DECK
}

export function calculateStreakXP(streakDay: number): number {
  return XP_RULES.STREAK_BASE * streakDay
}

export function calculateComebackXP(): number {
  return XP_RULES.COMEBACK_BONUS
}
