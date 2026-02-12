import { describe, it, expect } from 'vitest'
import { CardParser } from '../services/srs/parser'
import { SRSEngine } from '../services/srs/engine'

const parser = new CardParser()

describe('CardParser', () => {
  describe('inline cards (::)', () => {
    it('parses a simple inline card', () => {
      const cards = parser.parseCards('What is 2+2::It equals 4')
      const inline = cards.filter(c => !c.isBidirectional)
      expect(inline.length).toBe(1)
      expect(inline[0].question).toBe('What is 2+2')
      expect(inline[0].answer).toBe('It equals 4')
    })

    it('parses inline card with scheduling metadata', () => {
      const cards = parser.parseCards('Question::Answer<!--SR:!2026-02-15,3,250-->')
      const inline = cards.filter(c => !c.isBidirectional)
      expect(inline.length).toBe(1)
      expect(inline[0].interval).toBe(3)
      expect(inline[0].ease).toBe(250)
    })
  })

  describe('bidirectional cards (:::)', () => {
    it('creates 2 cards from a bidirectional card', () => {
      const cards = parser.parseCards('Term A:::Term B')
      expect(cards.length).toBe(2)
      expect(cards[0].question).toBe('Term A')
      expect(cards[0].answer).toBe('Term B')
      expect(cards[1].question).toBe('Term B')
      expect(cards[1].answer).toBe('Term A')
      expect(cards[0].isBidirectional).toBe(true)
    })
  })

  describe('cloze deletions', () => {
    it('parses highlight cloze (==...==)', () => {
      const cards = parser.parseCards('The ==delta== of an ATM option is 0.5')
      expect(cards.length).toBe(1)
      expect(cards[0].answer).toBe('delta')
      expect(cards[0].question).toContain('[...]')
      expect(cards[0].question).not.toContain('==')
    })

    it('parses curly brace cloze ({{...}})', () => {
      const cards = parser.parseCards('A {{straddle}} is an options strategy')
      expect(cards.length).toBe(1)
      expect(cards[0].answer).toBe('straddle')
      expect(cards[0].question).toContain('[...]')
    })

    it('creates multiple cloze cards from one line', () => {
      const cards = parser.parseCards('The ==cat== sat on the ==mat==')
      expect(cards.length).toBe(2)
    })
  })

  describe('multiline cards', () => {
    it('parses a multiline card with ? separator', () => {
      const content = `What is gravity?\n?\nThe force of attraction between masses.`
      const cards = parser.parseCards(content)
      expect(cards.length).toBe(1)
      expect(cards[0].question).toBe('What is gravity?')
      expect(cards[0].answer).toBe('The force of attraction between masses.')
    })

    it('parses bidirectional multiline card with ?? separator', () => {
      const content = `Term A\n??\nTerm B`
      const cards = parser.parseCards(content)
      expect(cards.length).toBe(2)
      expect(cards[0].isBidirectional).toBe(true)
    })

    it('parses multiline card with scheduling metadata', () => {
      const content = `Question here\n?\nAnswer here\n<!--SR:!2026-02-15,3,250,5.00,10.00-->`
      const cards = parser.parseCards(content)
      expect(cards.length).toBe(1)
      expect(cards[0].interval).toBe(3)
      expect(cards[0].difficulty).toBe(5.0)
      expect(cards[0].stability).toBe(10.0)
    })
  })

  describe('scheduling metadata parsing', () => {
    it('parses SM-2 format (3 fields)', () => {
      const result = SRSEngine.parseSchedulingMetadata('<!--SR:!2026-02-15,3,250-->')
      expect(result).not.toBeNull()
      expect(result!.interval).toBe(3)
      expect(result!.ease).toBe(250)
      expect(result!.difficulty).toBeUndefined()
      expect(result!.stability).toBeUndefined()
    })

    it('parses FSRS format (5 fields)', () => {
      const result = SRSEngine.parseSchedulingMetadata('<!--SR:!2026-02-15,3,250,5.00,10.00-->')
      expect(result).not.toBeNull()
      expect(result!.interval).toBe(3)
      expect(result!.ease).toBe(250)
      expect(result!.difficulty).toBe(5.0)
      expect(result!.stability).toBe(10.0)
    })

    it('returns null for non-matching text', () => {
      expect(SRSEngine.parseSchedulingMetadata('no metadata here')).toBeNull()
    })
  })
})
