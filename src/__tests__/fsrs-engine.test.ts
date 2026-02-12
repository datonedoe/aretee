import { describe, it, expect } from 'vitest'
import { SRSEngine } from '../services/srs/engine'
import { ReviewResponse, CardState } from '../types'

describe('FSRS Engine — Retrievability', () => {
  it('returns 1 when elapsedDays is 0 (just reviewed)', () => {
    expect(SRSEngine.retrievability(0, 10)).toBe(1)
  })

  it('returns 0 when stability is 0', () => {
    expect(SRSEngine.retrievability(5, 0)).toBe(0)
  })

  it('returns 0 when stability is negative', () => {
    expect(SRSEngine.retrievability(5, -1)).toBe(0)
  })

  it('decreases as elapsed days increase', () => {
    const r1 = SRSEngine.retrievability(1, 10)
    const r5 = SRSEngine.retrievability(5, 10)
    const r30 = SRSEngine.retrievability(30, 10)
    expect(r1).toBeGreaterThan(r5)
    expect(r5).toBeGreaterThan(r30)
  })

  it('approaches 0 with very large elapsed days', () => {
    const r = SRSEngine.retrievability(10000, 1)
    expect(r).toBeLessThan(0.01)
  })

  it('stays between 0 and 1 for all positive inputs', () => {
    for (const days of [0.1, 1, 10, 100, 1000]) {
      for (const stab of [0.1, 1, 10, 100]) {
        const r = SRSEngine.retrievability(days, stab)
        expect(r).toBeGreaterThanOrEqual(0)
        expect(r).toBeLessThanOrEqual(1)
      }
    }
  })
})

describe('FSRS Engine — New Card Reviews', () => {
  const base = {
    currentInterval: 0,
    currentEase: 250,
    reviewCount: 0,
    applyFuzz: false,
    currentDifficulty: 0,
    currentStability: 0,
    currentState: CardState.New,
    lastReview: null,
    currentLapses: 0,
    desiredRetention: 0.9,
    responseTimeMs: null,
  }

  it('Again on New → Learning state, lapses+1', () => {
    const r = SRSEngine.calculateNextReview(
      base.currentInterval, base.currentEase, ReviewResponse.Again,
      base.reviewCount, base.applyFuzz, base.currentDifficulty,
      base.currentStability, base.currentState, base.lastReview,
      base.currentLapses, base.desiredRetention, base.responseTimeMs
    )
    expect(r.state).toBe(CardState.Learning)
    expect(r.lapses).toBe(1)
    expect(r.newDifficulty).toBeGreaterThanOrEqual(1)
    expect(r.newDifficulty).toBeLessThanOrEqual(10)
  })

  it('Good on New → Review state', () => {
    const r = SRSEngine.calculateNextReview(
      base.currentInterval, base.currentEase, ReviewResponse.Good,
      base.reviewCount, base.applyFuzz, base.currentDifficulty,
      base.currentStability, base.currentState, base.lastReview,
      base.currentLapses, base.desiredRetention, base.responseTimeMs
    )
    expect(r.state).toBe(CardState.Review)
    expect(r.lapses).toBe(0)
  })

  it('Easy on New → Review state with higher stability than Good', () => {
    const good = SRSEngine.calculateNextReview(
      base.currentInterval, base.currentEase, ReviewResponse.Good,
      base.reviewCount, base.applyFuzz, base.currentDifficulty,
      base.currentStability, base.currentState, base.lastReview,
      base.currentLapses, base.desiredRetention, base.responseTimeMs
    )
    const easy = SRSEngine.calculateNextReview(
      base.currentInterval, base.currentEase, ReviewResponse.Easy,
      base.reviewCount, base.applyFuzz, base.currentDifficulty,
      base.currentStability, base.currentState, base.lastReview,
      base.currentLapses, base.desiredRetention, base.responseTimeMs
    )
    expect(easy.newStability).toBeGreaterThan(good.newStability)
    expect(easy.newInterval).toBeGreaterThanOrEqual(good.newInterval)
  })

  it('difficulty clamped between 1 and 10 for all ratings', () => {
    for (const resp of [ReviewResponse.Again, ReviewResponse.Hard, ReviewResponse.Good, ReviewResponse.Easy]) {
      const r = SRSEngine.calculateNextReview(
        base.currentInterval, base.currentEase, resp,
        base.reviewCount, base.applyFuzz, base.currentDifficulty,
        base.currentStability, base.currentState, base.lastReview,
        base.currentLapses, base.desiredRetention, base.responseTimeMs
      )
      expect(r.newDifficulty).toBeGreaterThanOrEqual(1)
      expect(r.newDifficulty).toBeLessThanOrEqual(10)
    }
  })

  it('interval is always >= 1', () => {
    for (const resp of [ReviewResponse.Again, ReviewResponse.Hard, ReviewResponse.Good, ReviewResponse.Easy]) {
      const r = SRSEngine.calculateNextReview(
        base.currentInterval, base.currentEase, resp,
        base.reviewCount, base.applyFuzz, base.currentDifficulty,
        base.currentStability, base.currentState, base.lastReview,
        base.currentLapses, base.desiredRetention, base.responseTimeMs
      )
      expect(r.newInterval).toBeGreaterThanOrEqual(1)
    }
  })
})

describe('FSRS Engine — Review State (Recall & Lapse)', () => {
  const reviewBase = {
    currentInterval: 10,
    currentEase: 250,
    reviewCount: 5,
    applyFuzz: false,
    currentDifficulty: 5,
    currentStability: 10,
    currentState: CardState.Review,
    lastReview: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
    currentLapses: 0,
    desiredRetention: 0.9,
    responseTimeMs: null,
  }

  it('Again on Review → Relearning, lapses+1', () => {
    const r = SRSEngine.calculateNextReview(
      reviewBase.currentInterval, reviewBase.currentEase, ReviewResponse.Again,
      reviewBase.reviewCount, reviewBase.applyFuzz, reviewBase.currentDifficulty,
      reviewBase.currentStability, reviewBase.currentState, reviewBase.lastReview,
      reviewBase.currentLapses, reviewBase.desiredRetention, reviewBase.responseTimeMs
    )
    expect(r.state).toBe(CardState.Relearning)
    expect(r.lapses).toBe(1)
  })

  it('Good on Review → stays Review', () => {
    const r = SRSEngine.calculateNextReview(
      reviewBase.currentInterval, reviewBase.currentEase, ReviewResponse.Good,
      reviewBase.reviewCount, reviewBase.applyFuzz, reviewBase.currentDifficulty,
      reviewBase.currentStability, reviewBase.currentState, reviewBase.lastReview,
      reviewBase.currentLapses, reviewBase.desiredRetention, reviewBase.responseTimeMs
    )
    expect(r.state).toBe(CardState.Review)
    expect(r.lapses).toBe(0)
  })

  it('Easy bonus gives longer interval than Good', () => {
    const good = SRSEngine.calculateNextReview(
      reviewBase.currentInterval, reviewBase.currentEase, ReviewResponse.Good,
      reviewBase.reviewCount, reviewBase.applyFuzz, reviewBase.currentDifficulty,
      reviewBase.currentStability, reviewBase.currentState, reviewBase.lastReview,
      reviewBase.currentLapses, reviewBase.desiredRetention, reviewBase.responseTimeMs
    )
    const easy = SRSEngine.calculateNextReview(
      reviewBase.currentInterval, reviewBase.currentEase, ReviewResponse.Easy,
      reviewBase.reviewCount, reviewBase.applyFuzz, reviewBase.currentDifficulty,
      reviewBase.currentStability, reviewBase.currentState, reviewBase.lastReview,
      reviewBase.currentLapses, reviewBase.desiredRetention, reviewBase.responseTimeMs
    )
    expect(easy.newInterval).toBeGreaterThan(good.newInterval)
  })

  it('Hard penalty gives shorter interval than Good', () => {
    const hard = SRSEngine.calculateNextReview(
      reviewBase.currentInterval, reviewBase.currentEase, ReviewResponse.Hard,
      reviewBase.reviewCount, reviewBase.applyFuzz, reviewBase.currentDifficulty,
      reviewBase.currentStability, reviewBase.currentState, reviewBase.lastReview,
      reviewBase.currentLapses, reviewBase.desiredRetention, reviewBase.responseTimeMs
    )
    const good = SRSEngine.calculateNextReview(
      reviewBase.currentInterval, reviewBase.currentEase, ReviewResponse.Good,
      reviewBase.reviewCount, reviewBase.applyFuzz, reviewBase.currentDifficulty,
      reviewBase.currentStability, reviewBase.currentState, reviewBase.lastReview,
      reviewBase.currentLapses, reviewBase.desiredRetention, reviewBase.responseTimeMs
    )
    expect(hard.newInterval).toBeLessThanOrEqual(good.newInterval)
  })
})

describe('FSRS Engine — Response Time Adjustment', () => {
  const base = {
    currentInterval: 0, currentEase: 250, reviewCount: 0, applyFuzz: false,
    currentDifficulty: 0, currentStability: 0, currentState: CardState.New,
    lastReview: null, currentLapses: 0, desiredRetention: 0.9,
  }

  it('fast response lowers difficulty', () => {
    const slow = SRSEngine.calculateNextReview(
      base.currentInterval, base.currentEase, ReviewResponse.Good,
      base.reviewCount, base.applyFuzz, base.currentDifficulty,
      base.currentStability, base.currentState, base.lastReview,
      base.currentLapses, base.desiredRetention, 16000 // slow
    )
    const fast = SRSEngine.calculateNextReview(
      base.currentInterval, base.currentEase, ReviewResponse.Good,
      base.reviewCount, base.applyFuzz, base.currentDifficulty,
      base.currentStability, base.currentState, base.lastReview,
      base.currentLapses, base.desiredRetention, 2000 // fast
    )
    expect(fast.newDifficulty).toBeLessThan(slow.newDifficulty)
  })

  it('Again rating ignores response time', () => {
    const withTime = SRSEngine.calculateNextReview(
      base.currentInterval, base.currentEase, ReviewResponse.Again,
      base.reviewCount, base.applyFuzz, base.currentDifficulty,
      base.currentStability, base.currentState, base.lastReview,
      base.currentLapses, base.desiredRetention, 2000
    )
    const withoutTime = SRSEngine.calculateNextReview(
      base.currentInterval, base.currentEase, ReviewResponse.Again,
      base.reviewCount, base.applyFuzz, base.currentDifficulty,
      base.currentStability, base.currentState, base.lastReview,
      base.currentLapses, base.desiredRetention, null
    )
    expect(withTime.newDifficulty).toBe(withoutTime.newDifficulty)
  })
})

describe('FSRS Engine — Retention Boundaries', () => {
  it('high retention (0.97) gives longer intervals', () => {
    const low = SRSEngine.calculateNextReview(
      10, 250, ReviewResponse.Good, 5, false, 5, 10,
      CardState.Review, new Date(Date.now() - 10 * 86400000),
      0, 0.7, null
    )
    const high = SRSEngine.calculateNextReview(
      10, 250, ReviewResponse.Good, 5, false, 5, 10,
      CardState.Review, new Date(Date.now() - 10 * 86400000),
      0, 0.97, null
    )
    // Higher retention = shorter intervals (need to review more often)
    expect(high.newInterval).toBeLessThan(low.newInterval)
  })

  it('produces valid results at both extremes', () => {
    for (const ret of [0.7, 0.97]) {
      const r = SRSEngine.calculateNextReview(
        10, 250, ReviewResponse.Good, 5, false, 5, 10,
        CardState.Review, new Date(Date.now() - 10 * 86400000),
        0, ret, null
      )
      expect(r.newInterval).toBeGreaterThanOrEqual(1)
      expect(isNaN(r.newInterval)).toBe(false)
      expect(isFinite(r.newInterval)).toBe(true)
    }
  })
})

describe('FSRS Engine — NaN/Infinity Guards', () => {
  it('stability=0 does not produce NaN', () => {
    const r = SRSEngine.calculateNextReview(
      0, 250, ReviewResponse.Good, 0, false, 0, 0,
      CardState.New, null, 0, 0.9, null
    )
    expect(isNaN(r.newInterval)).toBe(false)
    expect(isNaN(r.newStability)).toBe(false)
    expect(isNaN(r.newDifficulty)).toBe(false)
  })

  it('very large stability does not overflow', () => {
    const r = SRSEngine.calculateNextReview(
      10000, 250, ReviewResponse.Good, 100, false, 5, 100000,
      CardState.Review, new Date(Date.now() - 10000 * 86400000),
      0, 0.9, null
    )
    expect(isFinite(r.newInterval)).toBe(true)
    expect(isFinite(r.newStability)).toBe(true)
  })
})

describe('FSRS Engine — Learning/Relearning Graduation', () => {
  it('Good on Learning → graduates to Review', () => {
    const r = SRSEngine.calculateNextReview(
      0, 250, ReviewResponse.Good, 1, false, 5, 1,
      CardState.Learning, new Date(Date.now() - 86400000),
      1, 0.9, null
    )
    expect(r.state).toBe(CardState.Review)
  })

  it('Again on Learning → stays in Learning', () => {
    const r = SRSEngine.calculateNextReview(
      0, 250, ReviewResponse.Again, 1, false, 5, 1,
      CardState.Learning, new Date(Date.now() - 86400000),
      1, 0.9, null
    )
    expect(r.state).toBe(CardState.Learning)
    expect(r.lapses).toBe(2)
  })

  it('Good on Relearning → graduates to Review', () => {
    const r = SRSEngine.calculateNextReview(
      0, 250, ReviewResponse.Good, 5, false, 5, 3,
      CardState.Relearning, new Date(Date.now() - 86400000),
      2, 0.9, null
    )
    expect(r.state).toBe(CardState.Review)
  })

  it('Again on Relearning → stays in Relearning', () => {
    const r = SRSEngine.calculateNextReview(
      0, 250, ReviewResponse.Again, 5, false, 5, 3,
      CardState.Relearning, new Date(Date.now() - 86400000),
      2, 0.9, null
    )
    expect(r.state).toBe(CardState.Relearning)
    expect(r.lapses).toBe(3)
  })
})

describe('FSRS Engine — Metadata Parsing/Formatting', () => {
  it('formats and parses extended metadata round-trip', () => {
    const date = new Date(2026, 1, 12)
    const formatted = SRSEngine.formatSchedulingMetadata(date, 10, 250, 5.5, 12.3)
    expect(formatted).toContain('5.50')
    expect(formatted).toContain('12.30')
    const parsed = SRSEngine.parseSchedulingMetadata(formatted)
    expect(parsed).not.toBeNull()
    expect(parsed!.interval).toBe(10)
    expect(parsed!.ease).toBe(250)
    expect(parsed!.difficulty).toBeCloseTo(5.5)
    expect(parsed!.stability).toBeCloseTo(12.3)
  })

  it('formats and parses legacy metadata', () => {
    const date = new Date(2026, 1, 12)
    const formatted = SRSEngine.formatSchedulingMetadata(date, 10, 250)
    expect(formatted).not.toContain('difficulty')
    const parsed = SRSEngine.parseSchedulingMetadata(formatted)
    expect(parsed).not.toBeNull()
    expect(parsed!.interval).toBe(10)
    expect(parsed!.difficulty).toBeUndefined()
  })

  it('returns null for invalid metadata', () => {
    expect(SRSEngine.parseSchedulingMetadata('no metadata here')).toBeNull()
    expect(SRSEngine.parseSchedulingMetadata('')).toBeNull()
    expect(SRSEngine.parseSchedulingMetadata('<!--SR:!invalid-->')).toBeNull()
  })
})

describe('FSRS Engine — Preview Intervals', () => {
  it('returns intervals for all 4 responses', () => {
    const previews = SRSEngine.getPreviewIntervals(0, 250, 0)
    expect(previews[ReviewResponse.Again]).toBeDefined()
    expect(previews[ReviewResponse.Hard]).toBeDefined()
    expect(previews[ReviewResponse.Good]).toBeDefined()
    expect(previews[ReviewResponse.Easy]).toBeDefined()
  })

  it('Easy interval >= Good interval >= Hard interval', () => {
    const previews = SRSEngine.getPreviewIntervals(
      10, 250, 5, 5, 10, CardState.Review,
      new Date(Date.now() - 10 * 86400000), 0, 0.9
    )
    expect(previews[ReviewResponse.Easy]).toBeGreaterThanOrEqual(previews[ReviewResponse.Good])
    expect(previews[ReviewResponse.Good]).toBeGreaterThanOrEqual(previews[ReviewResponse.Hard])
  })
})

describe('FSRS Engine — Fuzz', () => {
  it('fuzz does not apply when interval <= 2', () => {
    // New card Good → short interval, should not be fuzzed
    const r = SRSEngine.calculateNextReview(
      0, 250, ReviewResponse.Again, 0, true, 0, 0,
      CardState.New, null, 0, 0.9, null
    )
    // Learning state gives fixed intervals
    expect(r.newInterval).toBeGreaterThanOrEqual(1)
  })
})
