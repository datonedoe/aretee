import { Card } from '../../types'
import { SRSEngine } from './engine'

export interface CardUpdate {
  card: Card
  date: Date
  interval: number
  ease: number
  difficulty?: number
  stability?: number
}

export class CardWriter {
  updateCardScheduling(
    content: string,
    card: Card,
    newDate: Date,
    newInterval: number,
    newEase: number,
    newDifficulty?: number,
    newStability?: number
  ): string {
    const lines = content.split('\n')

    if (card.lineStart < 0 || card.lineEnd >= lines.length) {
      throw new Error('Invalid line range for card')
    }

    const newMetadata = SRSEngine.formatSchedulingMetadata(
      newDate,
      newInterval,
      newEase,
      newDifficulty,
      newStability
    )
    const metadataPattern = /<!--SR:![^>]+-->/

    let metadataUpdated = false

    for (let lineIndex = card.lineStart; lineIndex <= card.lineEnd; lineIndex++) {
      const line = lines[lineIndex]

      if (metadataPattern.test(line)) {
        lines[lineIndex] = line.replace(metadataPattern, newMetadata)
        metadataUpdated = true
        break
      }
    }

    if (!metadataUpdated) {
      const lastLineIndex = card.lineEnd
      const lastLine = lines[lastLineIndex]

      if (lastLine.trim() === '') {
        lines.splice(lastLineIndex, 0, newMetadata)
      } else {
        lines[lastLineIndex] = lastLine + newMetadata
      }
    }

    return lines.join('\n')
  }

  updateMultipleCards(
    fileContents: Map<string, string>,
    updates: CardUpdate[]
  ): Map<string, string> {
    const cardsByFile = new Map<string, CardUpdate[]>()

    for (const update of updates) {
      const key = update.card.sourceFilePath
      if (!cardsByFile.has(key)) {
        cardsByFile.set(key, [])
      }
      cardsByFile.get(key)!.push(update)
    }

    const results = new Map<string, string>()

    for (const [filePath, fileUpdates] of cardsByFile) {
      const content = fileContents.get(filePath)
      if (!content) continue

      const lines = content.split('\n')

      const sortedUpdates = [...fileUpdates].sort((a, b) => b.card.lineEnd - a.card.lineEnd)

      for (const update of sortedUpdates) {
        const newMetadata = SRSEngine.formatSchedulingMetadata(
          update.date,
          update.interval,
          update.ease,
          update.difficulty,
          update.stability
        )

        const metadataPattern = /<!--SR:![^>]+-->/
        let metadataUpdated = false

        const lineEnd = Math.min(update.card.lineEnd, lines.length - 1)
        for (let lineIndex = update.card.lineStart; lineIndex <= lineEnd; lineIndex++) {
          const line = lines[lineIndex]
          if (metadataPattern.test(line)) {
            lines[lineIndex] = line.replace(metadataPattern, newMetadata)
            metadataUpdated = true
            break
          }
        }

        if (!metadataUpdated && update.card.lineEnd < lines.length) {
          const lastLine = lines[update.card.lineEnd]
          lines[update.card.lineEnd] = lastLine + newMetadata
        }
      }

      results.set(filePath, lines.join('\n'))
    }

    return results
  }
}
