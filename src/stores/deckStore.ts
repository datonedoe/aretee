import { create } from 'zustand'
import { Card, Deck, ParsedCard, createCard, isCardDue } from '../types'
import { CardParser } from '../services/srs/parser'
import { getFileService } from '../services/platform'
import { randomUUID } from 'expo-crypto'
import { isDemoMode, getDemoDecks } from '../utils/demo-data'

interface DeckState {
  decks: Deck[]
  isLoading: boolean
  error: string | null

  loadDecksFromVault: (vaultPath: string) => Promise<void>
  getDueCards: (deckId: string) => Card[]
  getAllDueCards: () => Card[]
  getDeck: (deckId: string) => Deck | undefined
  updateCard: (deckId: string, cardId: string, updates: Partial<Card>) => void
}

const parser = new CardParser()

export const useDeckStore = create<DeckState>((set, get) => ({
  decks: [],
  isLoading: false,
  error: null,

  loadDecksFromVault: async (vaultPath: string) => {
    set({ isLoading: true, error: null })

    // Demo mode: load mock data
    if (isDemoMode()) {
      set({ decks: getDemoDecks(), isLoading: false })
      return
    }

    try {
      const fileService = getFileService()
      const files = await fileService.listFiles(vaultPath, '.md')

      // Group files by parent folder to create decks
      const folderGroups = new Map<string, string[]>()

      for (const file of files) {
        // Get the relative path and extract the folder name
        const relativePath = file.replace(vaultPath + '/', '').replace(vaultPath, '')
        const parts = relativePath.split('/')
        const folderName = parts.length > 1 ? parts.slice(0, -1).join('/') : 'Root'

        if (!folderGroups.has(folderName)) {
          folderGroups.set(folderName, [])
        }
        folderGroups.get(folderName)!.push(file)
      }

      const decks: Deck[] = []

      for (const [folderName, folderFiles] of folderGroups) {
        const deckId = randomUUID()
        const cards: Card[] = []

        for (const filePath of folderFiles) {
          try {
            const content = await fileService.readFile(filePath)
            const parsed: ParsedCard[] = parser.parseCards(content, filePath)

            for (const p of parsed) {
              cards.push(createCard(p, filePath, deckId))
            }
          } catch {
            // Skip files that can't be read
          }
        }

        if (cards.length > 0) {
          decks.push({
            id: deckId,
            name: folderName,
            folderPath: `${vaultPath}/${folderName}`,
            lastScanned: new Date(),
            cards,
          })
        }
      }

      set({ decks, isLoading: false })
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to load decks',
        isLoading: false,
      })
    }
  },

  getDueCards: (deckId: string) => {
    const deck = get().decks.find((d) => d.id === deckId)
    if (!deck) return []
    return deck.cards.filter(isCardDue)
  },

  getAllDueCards: () => {
    return get().decks.flatMap((deck) => deck.cards.filter(isCardDue))
  },

  getDeck: (deckId: string) => {
    return get().decks.find((d) => d.id === deckId)
  },

  updateCard: (deckId: string, cardId: string, updates: Partial<Card>) => {
    set((state) => ({
      decks: state.decks.map((deck) => {
        if (deck.id !== deckId) return deck
        return {
          ...deck,
          cards: deck.cards.map((card) => {
            if (card.id !== cardId) return card
            return { ...card, ...updates }
          }),
        }
      }),
    }))
  },
}))
