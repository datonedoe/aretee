import { useEffect, useCallback } from 'react'
import { View, Text, FlatList, Pressable, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useDeckStore } from '../../src/stores/deckStore'
import { useSettingsStore } from '../../src/stores/settingsStore'
import { getFileService } from '../../src/services/platform'
import { Colors, Spacing, BorderRadius } from '../../src/utils/constants'
import { isCardDue } from '../../src/types'

export default function FlashScreen() {
  const router = useRouter()
  const { decks, isLoading, error, loadDecksFromVault } = useDeckStore()
  const { vaultPath, setVaultPath, isLoaded } = useSettingsStore()

  useEffect(() => {
    if (isLoaded && vaultPath) {
      loadDecksFromVault(vaultPath)
    }
  }, [isLoaded, vaultPath, loadDecksFromVault])

  const handlePickFolder = useCallback(async () => {
    const fileService = getFileService()
    const path = await fileService.pickFolder()
    if (path) {
      await setVaultPath(path)
    }
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

  const totalDue = decks.reduce((sum, d) => sum + d.cards.filter(isCardDue).length, 0)
  const totalCards = decks.reduce((sum, d) => sum + d.cards.length, 0)

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
        <View style={{ paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md }}>
          <Pressable
            onPress={handleReviewAll}
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
        </View>
      )}

      {/* Deck List */}
      <FlatList
        data={decks}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: Spacing.lg, paddingTop: Spacing.sm, gap: Spacing.sm }}
        renderItem={({ item: deck }) => {
          const dueCount = deck.cards.filter(isCardDue).length
          return (
            <Pressable
              onPress={() => handleReviewDeck(deck.id)}
              style={{
                backgroundColor: Colors.surface,
                borderRadius: BorderRadius.lg,
                padding: Spacing.lg,
                borderWidth: 1,
                borderColor: dueCount > 0 ? Colors.primary + '40' : Colors.border,
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: Colors.text, fontSize: 16, fontWeight: '600' }}>
                    {deck.name}
                  </Text>
                  <Text style={{ color: Colors.textSecondary, fontSize: 13, marginTop: 4 }}>
                    {deck.cards.length} cards total
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  {dueCount > 0 ? (
                    <View
                      style={{
                        backgroundColor: Colors.primary,
                        borderRadius: BorderRadius.full,
                        paddingHorizontal: 12,
                        paddingVertical: 4,
                      }}
                    >
                      <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>
                        {dueCount} due
                      </Text>
                    </View>
                  ) : (
                    <View
                      style={{
                        backgroundColor: Colors.success + '20',
                        borderRadius: BorderRadius.full,
                        paddingHorizontal: 12,
                        paddingVertical: 4,
                      }}
                    >
                      <Text style={{ color: Colors.success, fontSize: 13, fontWeight: '600' }}>
                        Done
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </Pressable>
          )
        }}
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
