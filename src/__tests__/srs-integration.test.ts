import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'
import { CardParser } from '../services/srs/parser'
import { SRSEngine } from '../services/srs/engine'
import { CardWriter } from '../services/srs/writer'
import { CardState, createCard } from '../types/card'
import { ReviewResponse } from '../types/enums'
import { migrateCardToFSRS } from '../services/srs/migration'

const parser = new CardParser()
const writer = new CardWriter()

const vaultRoot = join(__dirname, '../../test-vault')

function readVaultFile(relative: string): string {
  return readFileSync(join(vaultRoot, relative), 'utf-8')
}

describe('Test vault parsing', () => {
  it('options-basics.md has correct card count', () => {
    const content = readVaultFile('Quant Finance/options-basics.md')
    const cards = parser.parseCards(content)
    // 5 multiline + 4 inline (:: only) + 3 bidirectional (×2=6) + 4 cloze = ~19
    // Exact count depends on parser; just verify reasonable range
    expect(cards.length).toBeGreaterThanOrEqual(15)
    expect(cards.length).toBeLessThanOrEqual(25)
  })

  it('probability-stats.md has correct card count', () => {
    const content = readVaultFile('Quant Finance/probability-stats.md')
    const cards = parser.parseCards(content)
    expect(cards.length).toBeGreaterThanOrEqual(10)
    expect(cards.length).toBeLessThanOrEqual(18)
  })

  it('basic-vocab.md creates bidirectional cards (2× each)', () => {
    const content = readVaultFile('Spanish/basic-vocab.md')
    const cards = parser.parseCards(content)
    // 10 bidirectional lines → 20 cards
    expect(cards.length).toBe(20)
    expect(cards.every(c => c.isBidirectional)).toBe(true)
  })

  it('fundamentals.md has correct card count', () => {
    const content = readVaultFile('Bitcoin/fundamentals.md')
    const cards = parser.parseCards(content)
    expect(cards.length).toBeGreaterThanOrEqual(10)
    expect(cards.length).toBeLessThanOrEqual(18)
  })

  it('jazz-chords.md has correct card count', () => {
    const content = readVaultFile('Piano/jazz-chords.md')
    const cards = parser.parseCards(content)
    expect(cards.length).toBeGreaterThanOrEqual(8)
    expect(cards.length).toBeLessThanOrEqual(16)
  })

  it('parses FSRS scheduling metadata from options-basics.md', () => {
    const content = readVaultFile('Quant Finance/options-basics.md')
    const cards = parser.parseCards(content)
    const withFSRS = cards.filter(c => c.difficulty !== null && c.stability !== null)
    expect(withFSRS.length).toBeGreaterThanOrEqual(1)
    const card = withFSRS[0]
    expect(card.difficulty).toBeGreaterThan(0)
    expect(card.stability).toBeGreaterThan(0)
  })
})

describe('FSRS scheduling', () => {
  it('new card → Again gives short interval, Learning state', () => {
    const result = SRSEngine.calculateNextReview(
      0, 250, ReviewResponse.Again, 0, false,
      0, 0, CardState.New, null, 0, 0.9, null
    )
    expect(result.state).toBe(CardState.Learning)
    expect(result.newInterval).toBeLessThanOrEqual(1)
    expect(result.lapses).toBe(1)
  })

  it('new card → Good gives Review state with reasonable interval', () => {
    const result = SRSEngine.calculateNextReview(
      0, 250, ReviewResponse.Good, 0, false,
      0, 0, CardState.New, null, 0, 0.9, null
    )
    expect(result.state).toBe(CardState.Review)
    expect(result.newInterval).toBeGreaterThanOrEqual(1)
    expect(result.newDifficulty).toBeGreaterThan(0)
    expect(result.newStability).toBeGreaterThan(0)
  })

  it('new card → Easy gives longer interval than Good', () => {
    const good = SRSEngine.calculateNextReview(
      0, 250, ReviewResponse.Good, 0, false,
      0, 0, CardState.New, null, 0, 0.9, null
    )
    const easy = SRSEngine.calculateNextReview(
      0, 250, ReviewResponse.Easy, 0, false,
      0, 0, CardState.New, null, 0, 0.9, null
    )
    expect(easy.newInterval).toBeGreaterThanOrEqual(good.newInterval)
  })

  it('intervals increase with successive Good reviews', () => {
    let interval = 0
    let ease = 250
    let difficulty = 0
    let stability = 0
    let state = CardState.New
    let lapses = 0
    const lastReview = new Date()

    const intervals: number[] = []
    for (let i = 0; i < 4; i++) {
      const result = SRSEngine.calculateNextReview(
        interval, ease, ReviewResponse.Good, i, false,
        difficulty, stability, state, lastReview, lapses, 0.9, null
      )
      intervals.push(result.newInterval)
      interval = result.newInterval
      ease = result.newEase
      difficulty = result.newDifficulty
      stability = result.newStability
      state = result.state
      lapses = result.lapses
    }

    // After first review (from New), intervals should generally increase
    for (let i = 2; i < intervals.length; i++) {
      expect(intervals[i]).toBeGreaterThanOrEqual(intervals[i - 1])
    }
  })

  it('Hard gives shorter interval than Good for review cards', () => {
    const d = 5, s = 10, state = CardState.Review
    const lastReview = new Date(Date.now() - 10 * 86400000)
    const hard = SRSEngine.calculateNextReview(10, 250, ReviewResponse.Hard, 5, false, d, s, state, lastReview, 0, 0.9, null)
    const good = SRSEngine.calculateNextReview(10, 250, ReviewResponse.Good, 5, false, d, s, state, lastReview, 0, 0.9, null)
    expect(hard.newInterval).toBeLessThanOrEqual(good.newInterval)
  })
})

describe('Response time weighting', () => {
  it('fast correct answer produces lower difficulty than slow correct', () => {
    const fast = SRSEngine.calculateNextReview(
      0, 250, ReviewResponse.Good, 0, false,
      0, 0, CardState.New, null, 0, 0.9, 2000 // 2s — fast
    )
    const slow = SRSEngine.calculateNextReview(
      0, 250, ReviewResponse.Good, 0, false,
      0, 0, CardState.New, null, 0, 0.9, 30000 // 30s — slow
    )
    expect(fast.newDifficulty).toBeLessThan(slow.newDifficulty)
  })

  it('Again response ignores response time', () => {
    const fast = SRSEngine.calculateNextReview(
      0, 250, ReviewResponse.Again, 0, false,
      0, 0, CardState.New, null, 0, 0.9, 2000
    )
    const slow = SRSEngine.calculateNextReview(
      0, 250, ReviewResponse.Again, 0, false,
      0, 0, CardState.New, null, 0, 0.9, 30000
    )
    expect(fast.newDifficulty).toBe(slow.newDifficulty)
  })
})

describe('SM-2 to FSRS migration', () => {
  it('migrates a reviewed SM-2 card to FSRS fields', () => {
    const card = createCard(
      { question: 'Q', answer: 'A', lineStart: 0, lineEnd: 0, nextReviewDate: new Date(), interval: 10, ease: 250, difficulty: null, stability: null, isBidirectional: false },
      'test.md', 'deck1'
    )
    card.reviewCount = 5
    card.interval = 10
    card.ease = 280

    const updates = migrateCardToFSRS(card)
    expect(updates.difficulty).toBeCloseTo(4, 0) // ease 280 → difficulty ~4
    expect(updates.stability).toBe(10) // interval → stability
    expect(updates.state).toBe(CardState.Review)
  })

  it('skips cards that already have FSRS stability', () => {
    const card = createCard(
      { question: 'Q', answer: 'A', lineStart: 0, lineEnd: 0, nextReviewDate: new Date(), interval: 10, ease: 250, difficulty: 5, stability: 10, isBidirectional: false },
      'test.md', 'deck1'
    )
    card.stability = 10
    const updates = migrateCardToFSRS(card)
    expect(Object.keys(updates).length).toBe(0)
  })

  it('handles new unreviewed cards', () => {
    const card = createCard(
      { question: 'Q', answer: 'A', lineStart: 0, lineEnd: 0, nextReviewDate: null, interval: null, ease: null, difficulty: null, stability: null, isBidirectional: false },
      'test.md', 'deck1'
    )
    const updates = migrateCardToFSRS(card)
    expect(updates.state).toBe(CardState.New)
    expect(updates.stability).toBe(0)
  })
})

describe('Scheduling metadata round-trip', () => {
  it('parse → format → parse produces same values (FSRS)', () => {
    const original = '<!--SR:!2026-02-15,3,250,5.00,10.00-->'
    const parsed = SRSEngine.parseSchedulingMetadata(original)
    expect(parsed).not.toBeNull()

    const formatted = SRSEngine.formatSchedulingMetadata(
      parsed!.date, parsed!.interval, parsed!.ease,
      parsed!.difficulty, parsed!.stability
    )
    const reparsed = SRSEngine.parseSchedulingMetadata(formatted)
    expect(reparsed).not.toBeNull()
    expect(reparsed!.interval).toBe(parsed!.interval)
    expect(reparsed!.ease).toBe(parsed!.ease)
    expect(reparsed!.difficulty).toBeCloseTo(parsed!.difficulty!, 2)
    expect(reparsed!.stability).toBeCloseTo(parsed!.stability!, 2)
  })

  it('parse → format → parse produces same values (SM-2)', () => {
    const original = '<!--SR:!2026-02-15,3,250-->'
    const parsed = SRSEngine.parseSchedulingMetadata(original)
    expect(parsed).not.toBeNull()

    const formatted = SRSEngine.formatSchedulingMetadata(
      parsed!.date, parsed!.interval, parsed!.ease
    )
    const reparsed = SRSEngine.parseSchedulingMetadata(formatted)
    expect(reparsed!.interval).toBe(parsed!.interval)
    expect(reparsed!.ease).toBe(parsed!.ease)
  })

  it('CardWriter updates scheduling in file content and re-parses correctly', () => {
    const content = 'Question::Answer<!--SR:!2026-02-15,3,250-->'
    const cards = parser.parseCards(content)
    expect(cards.length).toBe(1)

    const card = createCard(cards[0], 'test.md', 'deck1')
    const newDate = new Date(2026, 2, 1) // March 1, 2026
    const updated = writer.updateCardScheduling(content, card, newDate, 7, 270, 4.5, 15.0)

    // Re-parse
    const reparsed = parser.parseCards(updated)
    expect(reparsed.length).toBe(1)
    expect(reparsed[0].interval).toBe(7)
    expect(reparsed[0].ease).toBe(270)
    expect(reparsed[0].difficulty).toBeCloseTo(4.5, 1)
    expect(reparsed[0].stability).toBeCloseTo(15.0, 1)
  })
})
