import { useEffect, useCallback, useState } from 'react'
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useAudioStore } from '../../src/stores/audioStore'
import { useDeckStore } from '../../src/stores/deckStore'
import { EpisodeCard } from '../../src/components/audio/EpisodeCard'
import { Colors, Spacing, BorderRadius } from '../../src/utils/constants'
import { isCardDue } from '../../src/types'

export default function ListenScreen() {
  const router = useRouter()
  const {
    episodes,
    isLoadingEpisodes,
    isGenerating,
    generateError,
    playback,
    loadEpisodes,
    generateNewEpisode,
    deleteEpisode,
    playEpisode,
    pause,
    resume,
  } = useAudioStore()

  const { decks } = useDeckStore()
  const [showGenerateHelp, setShowGenerateHelp] = useState(false)

  useEffect(() => {
    loadEpisodes()
  }, [loadEpisodes])

  const handleGenerateFromDue = useCallback(async () => {
    // Collect due/weak cards across all decks
    const weakCards = decks.flatMap((deck) =>
      deck.cards
        .filter((c) => isCardDue(c) || c.ease < 250)
        .map((c) => ({ question: c.question, answer: c.answer }))
    )

    if (weakCards.length === 0) {
      if (Platform.OS === 'web') {
        alert('No due or weak cards found. Review some cards first!')
      } else {
        Alert.alert('No Cards', 'No due or weak cards found. Review some cards first!')
      }
      return
    }

    // Take up to 8 cards for a good episode length
    const selected = weakCards.slice(0, 8)
    const title = `Review Session — ${new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })}`

    try {
      await generateNewEpisode(title, selected)
    } catch {
      // Error is tracked in store
    }
  }, [decks, generateNewEpisode])

  const handleGenerateFromDeck = useCallback(
    async (deckId: string) => {
      const deck = decks.find((d) => d.id === deckId)
      if (!deck || deck.cards.length === 0) return

      const selected = deck.cards
        .slice(0, 8)
        .map((c) => ({ question: c.question, answer: c.answer }))

      try {
        await generateNewEpisode(deck.name, selected)
      } catch {
        // Error is tracked in store
      }
    },
    [decks, generateNewEpisode]
  )

  const handlePlay = useCallback(
    (episodeId: string) => {
      if (playback.currentEpisodeId === episodeId && playback.isPlaying) {
        pause()
      } else if (playback.currentEpisodeId === episodeId) {
        resume()
      } else {
        playEpisode(episodeId)
      }
    },
    [playback, pause, resume, playEpisode]
  )

  const handleDelete = useCallback(
    (episodeId: string) => {
      if (Platform.OS === 'web') {
        if (confirm('Delete this episode?')) {
          deleteEpisode(episodeId)
        }
      } else {
        Alert.alert('Delete Episode', 'Are you sure?', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: () => deleteEpisode(episodeId) },
        ])
      }
    },
    [deleteEpisode]
  )

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      {/* Header */}
      <View style={{ padding: Spacing.lg, paddingBottom: Spacing.sm }}>
        <Text style={{ color: Colors.text, fontSize: 28, fontWeight: '800' }}>
          Audio Mode
        </Text>
        <Text
          style={{
            color: Colors.textSecondary,
            fontSize: 14,
            marginTop: Spacing.xs,
          }}
        >
          AI-generated podcasts from your cards
        </Text>
      </View>

      {/* Generate button */}
      <View style={{ paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md, gap: Spacing.sm }}>
        <Pressable
          onPress={handleGenerateFromDue}
          disabled={isGenerating}
          style={{
            backgroundColor: isGenerating ? Colors.surfaceLight : Colors.primary,
            paddingVertical: Spacing.md,
            borderRadius: BorderRadius.md,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: Spacing.sm,
            opacity: isGenerating ? 0.7 : 1,
          }}
        >
          {isGenerating ? (
            <>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={{ color: '#fff', fontSize: 15, fontWeight: '600' }}>
                Generating episode...
              </Text>
            </>
          ) : (
            <>
              <Ionicons name="sparkles" size={18} color="#fff" />
              <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700' }}>
                Generate from Due Cards
              </Text>
            </>
          )}
        </Pressable>

        {/* Generate from specific deck */}
        <Pressable
          onPress={() => setShowGenerateHelp(!showGenerateHelp)}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
          }}
        >
          <Ionicons
            name={showGenerateHelp ? 'chevron-up' : 'chevron-down'}
            size={14}
            color={Colors.textSecondary}
          />
          <Text style={{ color: Colors.textSecondary, fontSize: 12 }}>
            Or generate from a specific deck
          </Text>
        </Pressable>

        {showGenerateHelp && (
          <View style={{ gap: Spacing.xs }}>
            {decks.map((deck) => (
              <Pressable
                key={deck.id}
                onPress={() => handleGenerateFromDeck(deck.id)}
                disabled={isGenerating}
                style={{
                  backgroundColor: Colors.surface,
                  borderRadius: BorderRadius.md,
                  paddingHorizontal: Spacing.md,
                  paddingVertical: Spacing.sm,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderWidth: 1,
                  borderColor: Colors.border,
                }}
              >
                <Text style={{ color: Colors.text, fontSize: 14 }}>{deck.name}</Text>
                <Text style={{ color: Colors.textSecondary, fontSize: 12 }}>
                  {deck.cards.length} cards
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>

      {/* Error */}
      {generateError && (
        <View
          style={{
            backgroundColor: Colors.error + '15',
            marginHorizontal: Spacing.lg,
            marginBottom: Spacing.sm,
            padding: Spacing.md,
            borderRadius: BorderRadius.md,
            borderWidth: 1,
            borderColor: Colors.error + '30',
          }}
        >
          <Text style={{ color: Colors.error, fontSize: 13 }}>{generateError}</Text>
        </View>
      )}

      {/* Episodes list */}
      {isLoadingEpisodes ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={episodes}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            padding: Spacing.lg,
            paddingTop: Spacing.sm,
            gap: Spacing.sm,
          }}
          renderItem={({ item }) => (
            <EpisodeCard
              episode={item}
              isPlaying={playback.isPlaying}
              isCurrent={playback.currentEpisodeId === item.id}
              onPlay={() => handlePlay(item.id)}
              onDelete={() => handleDelete(item.id)}
            />
          )}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', paddingTop: Spacing.xxl }}>
              <Ionicons name="headset-outline" size={48} color={Colors.textSecondary} />
              <Text
                style={{
                  color: Colors.textSecondary,
                  fontSize: 16,
                  marginTop: Spacing.md,
                  textAlign: 'center',
                }}
              >
                No episodes yet
              </Text>
              <Text
                style={{
                  color: Colors.textSecondary,
                  fontSize: 13,
                  marginTop: Spacing.xs,
                  textAlign: 'center',
                  paddingHorizontal: Spacing.xl,
                }}
              >
                Generate your first podcast episode from your flashcards!
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  )
}
