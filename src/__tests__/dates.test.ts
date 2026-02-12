import { describe, it, expect } from 'vitest'
import {
  formatDate,
  parseDate,
  addDaysToDate,
  formatInterval,
  formatRelativeDate,
  getDaysDifference,
} from '../utils/dates'

describe('formatDate', () => {
  it('formats as YYYY-MM-DD', () => {
    const d = new Date(2026, 1, 12) // Feb 12, 2026
    expect(formatDate(d)).toBe('2026-02-12')
  })

  it('pads single-digit months and days', () => {
    const d = new Date(2026, 0, 5) // Jan 5
    expect(formatDate(d)).toBe('2026-01-05')
  })
})

describe('parseDate', () => {
  it('parses valid YYYY-MM-DD', () => {
    const d = parseDate('2026-02-12')
    expect(d).not.toBeNull()
    expect(d!.getFullYear()).toBe(2026)
    expect(d!.getMonth()).toBe(1) // 0-indexed
    expect(d!.getDate()).toBe(12)
  })

  it('returns null for invalid format', () => {
    expect(parseDate('not-a-date')).toBeNull()
    expect(parseDate('2026/02/12')).toBeNull()
    expect(parseDate('02-12-2026')).toBeNull()
  })

  it('returns null for empty string', () => {
    expect(parseDate('')).toBeNull()
  })

  it('returns null for partial date', () => {
    expect(parseDate('2026-02')).toBeNull()
  })
})

describe('addDaysToDate', () => {
  it('adds positive days', () => {
    const base = new Date(2026, 1, 12)
    const result = addDaysToDate(base, 10)
    expect(result.getDate()).toBe(22)
  })

  it('adds negative days (subtracts)', () => {
    const base = new Date(2026, 1, 12)
    const result = addDaysToDate(base, -5)
    expect(result.getDate()).toBe(7)
  })

  it('handles month overflow', () => {
    const base = new Date(2026, 0, 30) // Jan 30
    const result = addDaysToDate(base, 5)
    expect(result.getMonth()).toBe(1) // February
    expect(result.getDate()).toBe(4)
  })

  it('handles zero days', () => {
    const base = new Date(2026, 1, 12)
    const result = addDaysToDate(base, 0)
    expect(result.getDate()).toBe(12)
  })
})

describe('formatInterval', () => {
  it('0 → Now', () => {
    expect(formatInterval(0)).toBe('Now')
  })

  it('1 → 1d', () => {
    expect(formatInterval(1)).toBe('1d')
  })

  it('29 → 29d', () => {
    expect(formatInterval(29)).toBe('29d')
  })

  it('30 → 1mo', () => {
    expect(formatInterval(30)).toBe('1mo')
  })

  it('60 → 2mo', () => {
    expect(formatInterval(60)).toBe('2mo')
  })

  it('365 → 1y', () => {
    expect(formatInterval(365)).toBe('1y')
  })

  it('730 → 2y', () => {
    expect(formatInterval(730)).toBe('2y')
  })
})

describe('formatRelativeDate', () => {
  it('today → Today', () => {
    expect(formatRelativeDate(new Date())).toBe('Today')
  })

  it('tomorrow → Tomorrow', () => {
    const tomorrow = addDaysToDate(new Date(), 1)
    expect(formatRelativeDate(tomorrow)).toBe('Tomorrow')
  })

  it('yesterday → Yesterday', () => {
    const yesterday = addDaysToDate(new Date(), -1)
    expect(formatRelativeDate(yesterday)).toBe('Yesterday')
  })

  it('3 days ahead → In 3 days', () => {
    const future = addDaysToDate(new Date(), 3)
    expect(formatRelativeDate(future)).toBe('In 3 days')
  })

  it('3 days ago → 3 days ago', () => {
    const past = addDaysToDate(new Date(), -3)
    expect(formatRelativeDate(past)).toBe('3 days ago')
  })
})

describe('getDaysDifference', () => {
  it('same date → 0', () => {
    const d = new Date(2026, 1, 12)
    expect(getDaysDifference(d, d)).toBe(0)
  })

  it('10 days apart → 10', () => {
    const d1 = new Date(2026, 1, 22)
    const d2 = new Date(2026, 1, 12)
    expect(getDaysDifference(d1, d2)).toBe(10)
  })

  it('negative when d1 < d2', () => {
    const d1 = new Date(2026, 1, 12)
    const d2 = new Date(2026, 1, 22)
    expect(getDaysDifference(d1, d2)).toBe(-10)
  })
})
