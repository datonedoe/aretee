import { useEffect, useCallback, useState, useMemo } from 'react'
import { View, Text, FlatList, Pressable, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useDeckStore } from '../../src/stores/deckStore'
import { useSettingsStore } from '../../src/stores/settingsStore'
import { useErrorStore } from '../../src/stores/errorStore'
import { useInterleavingStore } from '../../src/stores/interleavingStore'
import { getFileService } from '../../src/services/platform'
import { enableDemoMode } from '../../src/utils/demo-data'
import { Colors, Spacing, BorderRadius } from '../../src/utils/constants'
import { isCardDue } from '../../src/types'
import { MicroChallengeCard } from '../../src/components/interleaving/MicroChallengeCard'
import { DeckListItem } from '../../src/components/cards/DeckListItem'
import { hapticMedium, hapticLight } from '../../src/services/haptics'

export default function FlashScreen() {
  const router = useRouter()
  const { decks, isLoading, error, loadDecksFromVault } = useDeckStore()
  const { vaultPath, setVaultPath, isLoaded } = useSettingsStore()
  const { loadProfile } = useErrorStore()
  const {
    pendingChallenges,
    loadMicroSchedule,
    generateChallenges,
    completeMicroChallenge,
  } = useInterleavingStore()
  const [activeMicroChallenge, setActiveMicroChallenge] = useState<typeof pendingChallenges[0] | null>(null)

  useEffect(() => {
    if (isLoaded && vaultPath) {
      loadDecksFromVault(vaultPath)
      loadProfile()
    }
  }, [isLoaded, vaultPath, loadDecksFromVault, loadProfile])

  // Load micro-challenge schedule when decks are available
  useEffect(() => {
    if (decks.length > 0) {
      loadMicroSchedule().then(() => {
        generateChallenges(decks)
      })
    }
  }, [decks.length]) // eslint-disable-line react-hooks/exhaustive-deps

  // Show next pending challenge
  useEffect(() => {
    if (pendingChallenges.length > 0 && !activeMicroChallenge) {
      setActiveMicroChallenge(pendingChallenges[0])
    }
  }, [pendingChallenges, activeMicroChallenge])

  const handleMicroComplete = useCallback(
    async (id: string) => {
      await completeMicroChallenge(id)
      setActiveMicroChallenge(null)
    },
    [completeMicroChallenge]
  )

  const handleMicroDismiss = useCallback(() => {
    setActiveMicroChallenge(null)
  }, [])

  const handleBlendedSession = useCallback(() => {
    router.push('/review/blended')
  }, [router])

  const handlePickFolder = useCallback(async () => {
    const fileService = getFileService()
    const path = await fileService.pickFolder()
    if (path) {
      await setVaultPath(path)
    }
  }, [setVaultPath])

  const handleTryDemo = useCallback(async () => {
    enableDemoMode()
    await setVaultPath('/demo')
  }, [setVaultPath])

  const handleReviewDeck = useCallback(
    (deckId: string) => {
      router.push(`/review/${deckId}`)
    },
    [router]
  )

  const handleReviewAll = useCallback(() => {
    router.push('/review/all')
  }, [router])

  const handleSocratic = useCallback(
    (deckId: string) => {
      const deck = decks.find((d) => d.id === deckId)
      if (!deck || deck.cards.length === 0) return
      // Pick a random card from the deck
      const card = deck.cards[Math.floor(Math.random() * deck.cards.length)]
      router.push(`/review/socratic?cardId=${card.id}&deckId=${deckId}`)
    },
    [decks, router]
  )

  const handleFeynman = useCallback(
    (deckId: string) => {
      const deck = decks.find((d) => d.id === deckId)
      if (!deck || deck.cards.length === 0) return
      const card = deck.cards[Math.floor(Math.random() * deck.cards.length)]
      router.push(`/review/feynman?cardId=${card.id}&deckId=${deckId}`)
    },
    [decks, router]
  )

  if (!isLoaded) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    )
  }

  if (!vaultPath) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl }}>
          <Ionicons name="folder-open-outline" size={64} color={Colors.textSecondary} />
          <Text
            style={{
              color: Colors.text,
              fontSize: 22,
              fontWeight: '700',
              marginTop: Spacing.lg,
              textAlign: 'center',
            }}
          >
            Select Your Vault
          </Text>
          <Text
            style={{
              color: Colors.textSecondary,
              fontSize: 15,
              marginTop: Spacing.sm,
              textAlign: 'center',
              lineHeight: 22,
            }}
          >
            Choose your Obsidian vault folder to load flashcards.
          </Text>
          <Pressable
            onPress={handlePickFolder}
            style={{
              backgroundColor: Colors.primary,
              paddingHorizontal: Spacing.xl,
              paddingVertical: Spacing.md,
              borderRadius: BorderRadius.md,
              marginTop: Spacing.xl,
            }}
          >
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>
              Choose Folder
            </Text>
          </Pressable>
          <Pressable
            onPress={handleTryDemo}
            style={{
              backgroundColor: Colors.surface,
              paddingHorizontal: Spacing.xl,
              paddingVertical: Spacing.md,
              borderRadius: BorderRadius.md,
              marginTop: Spacing.md,
              borderWidth: 1,
              borderColor: Colors.accent + '40',
            }}
          >
            <Text style={{ color: Colors.accent, fontSize: 16, fontWeight: '600' }}>
              Try Demo
            </Text>
          </Pressable>
          <Text
            style={{
              color: Colors.textSecondary,
              fontSize: 12,
              marginTop: Spacing.sm,
              textAlign: 'center',
            }}
          >
            3 sample decks · Spanish, Mandarin, Quant
          </Text>
        </View>
      </SafeAreaView>
    )
  }

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={{ color: Colors.textSecondary, marginTop: Spacing.md, fontSize: 15 }}>
            Loading cards...
          </Text>
        </View>
      </SafeAreaView>
    )
  }

  if (error) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl }}>
          <Ionicons name="alert-circle-outline" size={48} color={Colors.error} />
          <Text style={{ color: Colors.error, fontSize: 16, marginTop: Spacing.md, textAlign: 'center' }}>
            {error}
          </Text>
          <Pressable
            onPress={handlePickFolder}
            style={{
              backgroundColor: Colors.surface,
              paddingHorizontal: Spacing.lg,
              paddingVertical: Spacing.md,
              borderRadius: BorderRadius.md,
              marginTop: Spacing.lg,
              borderWidth: 1,
              borderColor: Colors.border,
            }}
          >
            <Text style={{ color: Colors.text, fontSize: 14 }}>Try Another Folder</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    )
  }

  // Memoize expensive per-deck due counts
  const deckDueCounts = useMemo(
    () => new Map(decks.map((d) => [d.id, d.cards.filter(isCardDue).length])),
    [decks]
  )
  const totalDue = useMemo(
    () => Array.from(deckDueCounts.values()).reduce((a, b) => a + b, 0),
    [deckDueCounts]
  )
  const totalCards = useMemo(
    () => decks.reduce((sum, d) => sum + d.cards.length, 0),
    [decks]
  )

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      {/* Header */}
      <View style={{ padding: Spacing.lg, paddingBottom: Spacing.sm }}>
        <Text style={{ color: Colors.text, fontSize: 28, fontWeight: '800' }}>
          Flash Mode
        </Text>
        <Text style={{ color: Colors.textSecondary, fontSize: 14, marginTop: Spacing.xs }}>
          {totalDue} cards due across {decks.length} decks
        </Text>
      </View>

      {/* Review All Button */}
      {totalDue > 0 && (
        <View style={{ paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm, gap: Spacing.sm }}>
          <Pressable
            onPress={() => { hapticMedium(); handleReviewAll() }}
            style={{
              backgroundColor: Colors.primary,
              paddingVertical: Spacing.md,
              borderRadius: BorderRadius.md,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: Spacing.sm,
            }}
          >
            <Ionicons name="flash" size={20} color="#fff" />
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>
              Review All ({totalDue})
            </Text>
          </Pressable>
          {/* Blended Session Button (Sprint 10) */}
          <Pressable
            onPress={() => { hapticMedium(); handleBlendedSession() }}
            style={{
              backgroundColor: Colors.accent + '15',
              paddingVertical: Spacing.md,
              borderRadius: BorderRadius.md,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: Spacing.sm,
              borderWidth: 1,
              borderColor: Colors.accent + '40',
            }}
          >
            <Ionicons name="shuffle" size={20} color={Colors.accent} />
            <Text style={{ color: Colors.accent, fontSize: 16, fontWeight: '700' }}>
              Blended Session
            </Text>
            <Text style={{ color: Colors.accent + '80', fontSize: 12 }}>
              ⚡🏛️🧠
            </Text>
          </Pressable>
        </View>
      )}

      {/* Deck List */}
      <FlatList
        data={decks}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: Spacing.lg, paddingTop: Spacing.sm, gap: Spacing.sm }}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={true}
        renderItem={({ item: deck }) => (
          <DeckListItem
            deck={deck}
            dueCount={deckDueCounts.get(deck.id) ?? 0}
            onReview={handleReviewDeck}
            onSocratic={handleSocratic}
            onFeynman={handleFeynman}
          />
        )}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingTop: Spacing.xxl }}>
            <Ionicons name="documents-outline" size={48} color={Colors.textSecondary} />
            <Text style={{ color: Colors.textSecondary, fontSize: 16, marginTop: Spacing.md, textAlign: 'center' }}>
              No flashcards found in vault.
            </Text>
            <Text style={{ color: Colors.textSecondary, fontSize: 13, marginTop: Spacing.xs, textAlign: 'center' }}>
              Add cards using :: or ? separators in your markdown files.
            </Text>
          </View>
        }
      />

      {/* Settings shortcut */}
      <View
        style={{
          paddingHorizontal: Spacing.lg,
          paddingBottom: Spacing.md,
          alignItems: 'center',
        }}
      >
        <Pressable
          onPress={handlePickFolder}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
        >
          <Ionicons name="folder-outline" size={14} color={Colors.textSecondary} />
          <Text style={{ color: Colors.textSecondary, fontSize: 12 }}>
            Change vault folder
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  )
}
