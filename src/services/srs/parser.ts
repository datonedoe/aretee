import { ParsedCard } from '../../types'
import { SRSEngine } from './engine'

export class CardParser {
  parseCards(content: string, _sourceFilePath?: string): ParsedCard[] {
    const cards: ParsedCard[] = []

    cards.push(...this.parseMultilineCards(content))
    cards.push(...this.parseInlineCards(content))
    cards.push(...this.parseClozeCards(content))

    return cards
  }

  private parseMultilineCards(content: string): ParsedCard[] {
    const cards: ParsedCard[] = []
    const lines = content.split('\n')

    let i = 0
    while (i < lines.length) {
      const trimmedLine = lines[i].trim()

      if (trimmedLine === '?' || trimmedLine === '??') {
        const isBidirectional = trimmedLine === '??'

        const questionLines: string[] = []
        let questionStart = i - 1

        while (questionStart >= 0) {
          const prevLine = lines[questionStart].trim()
          if (prevLine === '') break
          questionLines.unshift(lines[questionStart])
          questionStart--
        }

        const answerLines: string[] = []
        let answerEnd = i + 1

        while (answerEnd < lines.length) {
          const nextLine = lines[answerEnd]
          const trimmed = nextLine.trim()

          if (trimmed === '' && answerEnd > i + 1) break
          if (trimmed === '') {
            answerEnd++
            continue
          }

          if (trimmed.startsWith('<!--SR:')) {
            answerLines.push(nextLine)
            answerEnd++
            break
          }

          answerLines.push(nextLine)
          answerEnd++
        }

        if (questionLines.length > 0 && answerLines.length > 0) {
          let question = questionLines.join('\n').trim()
          let answer = answerLines.join('\n').trim()

          const scheduling = this.extractAndRemoveScheduling(answer)
          if (scheduling) {
            answer = scheduling.text
          }

          const card: ParsedCard = {
            question,
            answer,
            lineStart: questionStart + 1,
            lineEnd: answerEnd - 1,
            nextReviewDate: scheduling?.date ?? null,
            interval: scheduling?.interval ?? null,
            ease: scheduling?.ease ?? null,
            isBidirectional,
          }
          cards.push(card)

          if (isBidirectional) {
            const reverseCard: ParsedCard = {
              question: answer,
              answer: question,
              lineStart: questionStart + 1,
              lineEnd: answerEnd - 1,
              nextReviewDate: scheduling?.date ?? null,
              interval: scheduling?.interval ?? null,
              ease: scheduling?.ease ?? null,
              isBidirectional: true,
            }
            cards.push(reverseCard)
          }
        }

        i = answerEnd
      } else {
        i++
      }
    }

    return cards
  }

  private parseInlineCards(content: string): ParsedCard[] {
    const cards: ParsedCard[] = []
    const lines = content.split('\n')

    const triplePattern = /^(.+?):::(.+?)(?:<!--SR:![\d-]+,\d+,\d+-->)?$/
    const doublePattern = /^(.+?)::([^:].+?)(?:<!--SR:![\d-]+,\d+,\d+-->)?$/

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const line = lines[lineIndex]
      const trimmedLine = line.trim()

      if (trimmedLine === '' || trimmedLine.startsWith('#')) continue

      const tripleMatch = this.matchInlineCard(trimmedLine, triplePattern)
      if (tripleMatch) {
        const scheduling = SRSEngine.parseSchedulingMetadata(trimmedLine)
        const card: ParsedCard = {
          question: tripleMatch.question,
          answer: tripleMatch.answer,
          lineStart: lineIndex,
          lineEnd: lineIndex,
          nextReviewDate: scheduling?.date ?? null,
          interval: scheduling?.interval ?? null,
          ease: scheduling?.ease ?? null,
          isBidirectional: true,
        }
        cards.push(card)

        const reverseCard: ParsedCard = {
          question: tripleMatch.answer,
          answer: tripleMatch.question,
          lineStart: lineIndex,
          lineEnd: lineIndex,
          nextReviewDate: scheduling?.date ?? null,
          interval: scheduling?.interval ?? null,
          ease: scheduling?.ease ?? null,
          isBidirectional: true,
        }
        cards.push(reverseCard)
        continue
      }

      const doubleMatch = this.matchInlineCard(trimmedLine, doublePattern)
      if (doubleMatch) {
        const scheduling = SRSEngine.parseSchedulingMetadata(trimmedLine)
        const card: ParsedCard = {
          question: doubleMatch.question,
          answer: doubleMatch.answer,
          lineStart: lineIndex,
          lineEnd: lineIndex,
          nextReviewDate: scheduling?.date ?? null,
          interval: scheduling?.interval ?? null,
          ease: scheduling?.ease ?? null,
          isBidirectional: false,
        }
        cards.push(card)
      }
    }

    return cards
  }

  private matchInlineCard(line: string, pattern: RegExp): { question: string; answer: string } | null {
    const match = line.match(pattern)
    if (!match) return null

    const question = match[1].trim()
    let answer = match[2].trim()

    const metaPattern = /<!--SR:.*-->$/
    answer = answer.replace(metaPattern, '').trim()

    return { question, answer }
  }

  private parseClozeCards(content: string): ParsedCard[] {
    const cards: ParsedCard[] = []
    const lines = content.split('\n')

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const line = lines[lineIndex]
      const trimmedLine = line.trim()

      if (trimmedLine === '' || trimmedLine.startsWith('#')) continue

      interface ClozeMatch {
        text: string
        type: 'highlight' | 'curly'
      }
      const clozeMatches: ClozeMatch[] = []

      let highlightMatch
      const highlightRegex = /==[^=]+==/g
      while ((highlightMatch = highlightRegex.exec(trimmedLine)) !== null) {
        const text = highlightMatch[0]
        const innerText = text.slice(2, -2)
        clozeMatches.push({ text: innerText, type: 'highlight' })
      }

      let curlyMatch
      const curlyRegex = /\{\{[^}]+\}\}/g
      while ((curlyMatch = curlyRegex.exec(trimmedLine)) !== null) {
        const text = curlyMatch[0]
        const innerText = text.slice(2, -2)
        clozeMatches.push({ text: innerText, type: 'curly' })
      }

      for (const clozeMatch of clozeMatches) {
        let questionLine = trimmedLine

        const clozeText = clozeMatch.type === 'highlight'
          ? `==${clozeMatch.text}==`
          : `{{${clozeMatch.text}}}`
        questionLine = questionLine.replace(clozeText, '[...]')

        questionLine = questionLine.replace(/==/g, '')
        questionLine = questionLine.replace(/\{\{/g, '')
        questionLine = questionLine.replace(/\}\}/g, '')

        questionLine = questionLine.replace(/<!--SR:.*-->/, '').trim()

        const scheduling = SRSEngine.parseSchedulingMetadata(trimmedLine)

        const card: ParsedCard = {
          question: questionLine,
          answer: clozeMatch.text,
          lineStart: lineIndex,
          lineEnd: lineIndex,
          nextReviewDate: scheduling?.date ?? null,
          interval: scheduling?.interval ?? null,
          ease: scheduling?.ease ?? null,
          isBidirectional: false,
        }
        cards.push(card)
      }
    }

    return cards
  }

  private extractAndRemoveScheduling(text: string): { text: string; date: Date; interval: number; ease: number } | null {
    const scheduling = SRSEngine.parseSchedulingMetadata(text)
    if (!scheduling) return null

    const cleanText = text.replace(/<!--SR:.*-->/, '').trim()

    return {
      text: cleanText,
      date: scheduling.date,
      interval: scheduling.interval,
      ease: scheduling.ease,
    }
  }
}
