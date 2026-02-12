import { useEffect, useCallback } from 'react'
import { View, Text, Pressable, Platform } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useDeckStore } from '../../src/stores/deckStore'
import { useReviewStore } from '../../src/stores/reviewStore'
import { useSettingsStore } from '../../src/stores/settingsStore'
import { FlashCard } from '../../src/components/cards/FlashCard'
import { ResponseButtons } from '../../src/components/cards/ResponseButtons'
import { CardProgress } from '../../src/components/cards/CardProgress'
import { useKeyboardShortcuts } from '../../src/hooks/useKeyboardShortcuts'
import { ReviewResponse, ResponseKeyBindings, isCardDue } from '../../src/types'
import { SRSEngine } from '../../src/services/srs/engine'
import { Colors, Spacing, BorderRadius } from '../../src/utils/constants'

export default function ReviewScreen() {
  const { deckId } = useLocalSearchParams<{ deckId: string }>()
  const router = useRouter()
  const { decks, getAllDueCards, getDeck } = useDeckStore()
  const { desiredRetention } = useSettingsStore()
  const {
    session,
    startSession,
    flipCard,
    answerCard,
    getCurrentCard,
    getProgress,
  } = useReviewStore()

  useEffect(() => {
    if (!deckId) return

    let cards
    let deckName: string

    if (deckId === 'all') {
      cards = getAllDueCards()
      deckName = 'All Decks'
    } else {
      const deck = getDeck(deckId)
      if (!deck) return
      cards = deck.cards.filter(isCardDue)
      deckName = deck.name
    }

    if (cards.length > 0) {
      startSession(deckId, cards, deckName)
    }
  }, [deckId, decks.length]) // eslint-disable-line react-hooks/exhaustive-deps

  const currentCard = getCurrentCard()
  const progress = getProgress()

  const handleResponse = useCallback(
    async (response: ReviewResponse) => {
      await answerCard(response)

      const nextCard = useReviewStore.getState().getCurrentCard()
      if (!nextCard) {
        router.replace('/results')
      }
    },
    [answerCard, router]
  )

  const handleKeyPress = useCallback(
    (key: string) => {
      if (!session || !currentCard) return

      if (key === ' ' || key === 'Enter') {
        if (!session.isFlipped) {
          flipCard()
        }
        return
      }

      if (session.isFlipped && ResponseKeyBindings[key]) {
        handleResponse(ResponseKeyBindings[key])
      }
    },
    [session, currentCard, flipCard, handleResponse]
  )

  useKeyboardShortcuts(handleKeyPress)

  if (!session || !currentCard) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: Colors.textSecondary, fontSize: 16 }}>
            No cards due for review.
          </Text>
          <Pressable
            onPress={() => router.back()}
            style={{ marginTop: Spacing.lg }}
          >
            <Text style={{ color: Colors.primary, fontSize: 15, fontWeight: '600' }}>
              Go Back
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    )
  }

  // Calculate current retrievability for display
  const elapsedDays =
    currentCard.last_review != null
      ? Math.max(
          0,
          (Date.now() - new Date(currentCard.last_review).getTime()) / (1000 * 60 * 60 * 24)
        )
      : 0
  const retrievability =
    currentCard.stability > 0
      ? SRSEngine.retrievability(elapsedDays, currentCard.stability)
      : 0

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: Spacing.lg,
          paddingVertical: Spacing.sm,
          gap: Spacing.sm,
        }}
      >
        <Pressable onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={Colors.textSecondary} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <CardProgress current={progress.current} total={progress.total} />
        </View>
      </View>

      {/* Deck name + FSRS info */}
      <View style={{ paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm }}>
        <Text style={{ color: Colors.textSecondary, fontSize: 13 }}>
          {session.deckName}
        </Text>
        {currentCard.stability > 0 && (
          <View
            style={{
              flexDirection: 'row',
              gap: Spacing.md,
              marginTop: Spacing.xs,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name="shield-checkmark-outline" size={12} color={Colors.accent} />
              <Text style={{ color: Colors.accent, fontSize: 11 }}>
                S: {currentCard.stability.toFixed(1)}d
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name="analytics-outline" size={12} color={retrievability > 0.85 ? Colors.success : retrievability > 0.7 ? Colors.warning : Colors.error} />
              <Text
                style={{
                  color: retrievability > 0.85 ? Colors.success : retrievability > 0.7 ? Colors.warning : Colors.error,
                  fontSize: 11,
                }}
              >
                R: {Math.round(retrievability * 100)}%
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Card */}
      <View style={{ flex: 1, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md }}>
        <FlashCard
          question={currentCard.question}
          answer={currentCard.answer}
          isFlipped={session.isFlipped}
          onFlip={flipCard}
        />
      </View>

      {/* Response Buttons */}
      <View style={{ paddingHorizontal: Spacing.lg, paddingBottom: Spacing.lg }}>
        {session.isFlipped ? (
          <ResponseButtons
            currentInterval={currentCard.interval}
            currentEase={currentCard.ease}
            reviewCount={currentCard.reviewCount}
            onResponse={handleResponse}
            currentDifficulty={currentCard.difficulty}
            currentStability={currentCard.stability}
            currentState={currentCard.state}
            lastReview={currentCard.last_review}
            currentLapses={currentCard.lapses}
            desiredRetention={desiredRetention}
          />
        ) : (
          <Pressable
            onPress={flipCard}
            style={{
              backgroundColor: Colors.primary,
              paddingVertical: Spacing.md,
              borderRadius: 12,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>
              Show Answer
            </Text>
            {Platform.OS === 'web' && (
              <Text style={{ color: '#ffffff80', fontSize: 11, marginTop: 2 }}>
                Space / Enter
              </Text>
            )}
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  )
}
