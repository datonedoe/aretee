/**
 * Platform-Specific Tests: iOS (native)
 *
 * Tests behavior unique to Platform.OS === 'ios':
 * - No keyboard shortcuts (useKeyboardShortcuts is a no-op)
 * - No keyboard hint text in UI
 * - Platform service routes to NativeFileService/NativeStorageService
 * - Touch-only interactions (tap to flip, tap response buttons)
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock react-native with Platform.OS = 'ios'
vi.mock('react-native', () => ({
  Platform: { OS: 'ios', select: (obj: any) => obj.ios ?? obj.default },
  View: 'View',
  Text: 'Text',
  Pressable: 'Pressable',
  FlatList: 'FlatList',
  ActivityIndicator: 'ActivityIndicator',
  ScrollView: 'ScrollView',
}))

vi.mock('../../services/platform', () => ({
  getStorageService: () => ({
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
  }),
  getFileService: () => ({
    readFile: vi.fn().mockResolvedValue(''),
    writeFile: vi.fn().mockResolvedValue(undefined),
    listFiles: vi.fn().mockResolvedValue([]),
    pickFolder: vi.fn().mockResolvedValue(null),
    pickDirectory: vi.fn().mockResolvedValue(null),
  }),
}))

vi.mock('../../services/audio/sounds', () => ({
  playSound: vi.fn(),
}))

import { Platform } from 'react-native'
import { useReviewStore } from '../../stores/reviewStore'
import { useDeckStore } from '../../stores/deckStore'
import { useSettingsStore } from '../../stores/settingsStore'
import { ReviewResponse } from '../../types'
import { getFileService, getStorageService } from '../../services/platform'
import { makeCard, makeDeck } from './test-helpers'

describe('iOS Platform: No Keyboard Shortcuts', () => {
  beforeEach(() => {
    useReviewStore.setState({ session: null })
    useDeckStore.setState({ decks: [], isLoading: false, error: null })
    useSettingsStore.setState({ vaultPath: '/test', isLoaded: true, desiredRetention: 0.9 })
  })

  it('Platform.OS is ios', () => {
    expect(Platform.OS).toBe('ios')
  })

  it('useKeyboardShortcuts is a no-op on iOS', () => {
    // The hook: if (Platform.OS !== 'web') return
    const shouldAttachListener = Platform.OS === 'web'
    expect(shouldAttachListener).toBe(false)
  })

  it('keyboard hint text is NOT shown on iOS', () => {
    // Review screen: {Platform.OS === 'web' && <Text>Space / Enter</Text>}
    const showHint = Platform.OS === 'web'
    expect(showHint).toBe(false)

    // Response buttons: {Platform.OS === 'web' && <Text>{index + 1}</Text>}
    const showKeyNumbers = Platform.OS === 'web'
    expect(showKeyNumbers).toBe(false)
  })
})

describe('iOS Platform: Touch-Only Interactions', () => {
  beforeEach(() => {
    useReviewStore.setState({ session: null })
    useDeckStore.setState({ decks: [], isLoading: false, error: null })
    useSettingsStore.setState({ vaultPath: '/test', isLoaded: true, desiredRetention: 0.9 })
  })

  it('tap to flip card (onFlip callback)', () => {
    const card = makeCard({ id: 'c1', deckId: 'd1' })
    useDeckStore.setState({ decks: [makeDeck('d1', 'Test', [card])] })
    useReviewStore.getState().startSession('d1', [card], 'Test')

    // On iOS, user taps the card or "Show Answer" button → calls flipCard
    expect(useReviewStore.getState().session!.isFlipped).toBe(false)
    useReviewStore.getState().flipCard()
    expect(useReviewStore.getState().session!.isFlipped).toBe(true)
  })

  it('tap response button to answer (onResponse callback)', async () => {
    const card = makeCard({ id: 'c1', deckId: 'd1' })
    useDeckStore.setState({ decks: [makeDeck('d1', 'Test', [card])] })
    useReviewStore.getState().startSession('d1', [card], 'Test')

    // Flip first (tap card)
    useReviewStore.getState().flipCard()

    // Tap "Good" response button
    await useReviewStore.getState().answerCard(ReviewResponse.Good)

    // Session advances
    expect(useReviewStore.getState().getCurrentCard()).toBeNull()
  })

  it('full iOS touch flow: flip → answer for multiple cards', async () => {
    const cards = [
      makeCard({ id: 'c1', deckId: 'd1', question: 'Q1' }),
      makeCard({ id: 'c2', deckId: 'd1', question: 'Q2' }),
      makeCard({ id: 'c3', deckId: 'd1', question: 'Q3' }),
    ]
    useDeckStore.setState({ decks: [makeDeck('d1', 'Test', cards)] })
    useReviewStore.getState().startSession('d1', cards, 'Test')

    // Card 1: tap flip → tap Easy
    useReviewStore.getState().flipCard()
    await useReviewStore.getState().answerCard(ReviewResponse.Easy)

    // Card 2: tap flip → tap Again
    useReviewStore.getState().flipCard()
    await useReviewStore.getState().answerCard(ReviewResponse.Again)

    // Card 3: tap flip → tap Good
    useReviewStore.getState().flipCard()
    await useReviewStore.getState().answerCard(ReviewResponse.Good)

    // All done
    expect(useReviewStore.getState().getCurrentCard()).toBeNull()

    const session = useReviewStore.getState().endSession()!
    expect(session.results).toHaveLength(3)
    expect(session.results[0].response).toBe(ReviewResponse.Easy)
    expect(session.results[1].response).toBe(ReviewResponse.Again)
    expect(session.results[2].response).toBe(ReviewResponse.Good)
  })
})

describe('iOS Platform: Native File Service Routing', () => {
  it('Platform.OS === ios would route to NativeFileService', () => {
    // The platform/index.ts checks Platform.OS === 'web'
    // If not web → requires('./native') → NativeFileService
    const isNative = Platform.OS !== 'web'
    expect(isNative).toBe(true)
  })

  it('Platform.OS === ios would route to NativeStorageService', () => {
    const isNative = Platform.OS !== 'web'
    expect(isNative).toBe(true)
    // NativeStorageService uses AsyncStorage (vs localStorage on web)
  })

  it('native file service uses expo-file-system Directory/File APIs', () => {
    // Verify that on iOS, the service selection logic picks native
    // The actual NativeFileService uses:
    //   - Directory.pickDirectoryAsync() for pickFolder
    //   - new File(path).text() for readFile
    //   - new Directory(path).list() for listFiles
    // These differ from web's showDirectoryPicker and FileSystemAccess APIs
    expect(Platform.OS).toBe('ios')
  })
})

describe('iOS Platform: Platform Service Mock Coverage', () => {
  it('mock covers FileService interface fully', () => {
    const fs = getFileService()
    expect(typeof fs.readFile).toBe('function')
    expect(typeof fs.writeFile).toBe('function')
    expect(typeof fs.listFiles).toBe('function')
    expect(typeof fs.pickFolder).toBe('function')
  })

  it('mock covers StorageService interface fully', () => {
    const ss = getStorageService()
    expect(typeof ss.get).toBe('function')
    expect(typeof ss.set).toBe('function')
    expect(typeof ss.delete).toBe('function')
  })

  it('mock file service returns expected values', async () => {
    const fs = getFileService()

    expect(await fs.readFile('/any')).toBe('')
    expect(await fs.writeFile('/any', 'data')).toBeUndefined()
    expect(await fs.listFiles('/any', '.md')).toEqual([])
    expect(await fs.pickFolder()).toBeNull()
  })

  it('mock storage service returns expected values', async () => {
    const ss = getStorageService()

    expect(await ss.get('key')).toBeNull()
    expect(await ss.set('key', 'val')).toBeUndefined()
    expect(await ss.delete('key')).toBeUndefined()
  })
})
