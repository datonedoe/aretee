import { useEffect, useCallback } from 'react'
import { View, Text, Pressable } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useDeckStore } from '../../src/stores/deckStore'
import { useErrorStore } from '../../src/stores/errorStore'
import { useReviewStore } from '../../src/stores/reviewStore'
import { useInterleavingStore } from '../../src/stores/interleavingStore'
import { FlashCard } from '../../src/components/cards/FlashCard'
import { ResponseButtons } from '../../src/components/cards/ResponseButtons'
import { SessionModeIndicator } from '../../src/components/interleaving/SessionModeIndicator'
import { SessionSegmentMode, ReviewResponse } from '../../src/types'
import { useSettingsStore } from '../../src/stores/settingsStore'
import { Colors, Spacing, BorderRadius } from '../../src/utils/constants'

export default function BlendedReviewScreen() {
  const router = useRouter()
  const { decks } = useDeckStore()
  const { profile } = useErrorStore()
  const { desiredRetention } = useSettingsStore()
  const {
    segments,
    currentSegmentIndex,
    isSessionActive,
    composeSession,
    startSession,
    advanceSegment,
    getCurrentSegment,
    getProgress,
    endSession,
  } = useInterleavingStore()
  const {
    session: reviewSession,
    startSession: startReviewSession,
    flipCard,
    answerCard,
  } = useReviewStore()

  // Compose and start session on mount
  useEffect(() => {
    const errorPatterns = profile?.patterns ?? []
    composeSession(decks, errorPatterns)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (segments.length > 0 && !isSessionActive) {
      startSession()
    }
  }, [segments, isSessionActive, startSession])

  // When segment changes, start a mini review session for the current card
  const currentSegment = getCurrentSegment()
  useEffect(() => {
    if (currentSegment) {
      startReviewSession(
        currentSegment.card.deckId,
        [currentSegment.card],
        `Blended — ${currentSegment.mode}`
      )
    }
  }, [currentSegmentIndex, isSessionActive]) // eslint-disable-line react-hooks/exhaustive-deps

  const progress = getProgress()

  const handleResponse = useCallback(
    async (response: ReviewResponse) => {
      await answerCard(response)
      advanceSegment()

      const nextSegment = useInterleavingStore.getState().getCurrentSegment()
      if (!nextSegment) {
        router.replace('/results')
      }
    },
    [answerCard, advanceSegment, router]
  )

  const handleFlip = useCallback(() => {
    flipCard()
  }, [flipCard])

  if (segments.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl }}>
          <Ionicons name="shuffle-outline" size={64} color={Colors.textSecondary} />
          <Text style={{ color: Colors.text, fontSize: 20, fontWeight: '700', marginTop: Spacing.lg, textAlign: 'center' }}>
            No cards due
          </Text>
          <Text style={{ color: Colors.textSecondary, fontSize: 14, marginTop: Spacing.sm, textAlign: 'center' }}>
            All caught up! Come back when cards are due for review.
          </Text>
          <Pressable onPress={() => router.back()} style={{ marginTop: Spacing.xl }}>
            <Text style={{ color: Colors.primary, fontSize: 15, fontWeight: '600' }}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    )
  }

  if (!currentSegment || !isSessionActive) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: Colors.textSecondary }}>Loading session...</Text>
        </View>
      </SafeAreaView>
    )
  }

  const card = currentSegment.card
  const isFlipped = reviewSession?.isFlipped ?? false

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, gap: Spacing.sm }}>
        <Pressable onPress={() => { endSession(); router.back() }}>
          <Ionicons name="close" size={24} color={Colors.textSecondary} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={{ color: Colors.text, fontSize: 16, fontWeight: '700' }}>
            Blended Session
          </Text>
        </View>
      </View>

      {/* Mode Indicator (Sprint 10) */}
      <SessionModeIndicator segment={currentSegment} progress={progress} />

      {/* Card */}
      <View style={{ flex: 1, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md }}>
        {currentSegment.mode === SessionSegmentMode.Flash ? (
          <FlashCard
            question={card.question}
            answer={card.answer}
            isFlipped={isFlipped}
            onFlip={handleFlip}
          />
        ) : currentSegment.mode === SessionSegmentMode.Socratic ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <View style={{
              backgroundColor: Colors.surface,
              borderRadius: BorderRadius.lg,
              padding: Spacing.xl,
              borderWidth: 1,
              borderColor: Colors.accent + '40',
              width: '100%',
            }}>
              <Text style={{ color: Colors.accent, fontSize: 14, fontWeight: '700', marginBottom: Spacing.sm }}>
                🏛️ Socratic Mode
              </Text>
              <Text style={{ color: Colors.text, fontSize: 18, fontWeight: '600', marginBottom: Spacing.md }}>
                {card.question}
              </Text>
              <Text style={{ color: Colors.textSecondary, fontSize: 14, lineHeight: 22 }}>
                Think about this carefully. What do you know? What connections can you make?
              </Text>
              {isFlipped && (
                <View style={{ marginTop: Spacing.lg, paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.border }}>
                  <Text style={{ color: Colors.success, fontSize: 14, fontWeight: '600', marginBottom: Spacing.xs }}>
                    Key insight:
                  </Text>
                  <Text style={{ color: Colors.text, fontSize: 16 }}>{card.answer}</Text>
                </View>
              )}
            </View>
            {!isFlipped && (
              <Pressable onPress={handleFlip} style={{ marginTop: Spacing.lg }}>
                <Text style={{ color: Colors.accent, fontSize: 15, fontWeight: '600' }}>
                  Reveal insight →
                </Text>
              </Pressable>
            )}
          </View>
        ) : (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <View style={{
              backgroundColor: Colors.surface,
              borderRadius: BorderRadius.lg,
              padding: Spacing.xl,
              borderWidth: 1,
              borderColor: Colors.warning + '40',
              width: '100%',
            }}>
              <Text style={{ color: Colors.warning, fontSize: 14, fontWeight: '700', marginBottom: Spacing.sm }}>
                🧠 Feynman Mode
              </Text>
              <Text style={{ color: Colors.text, fontSize: 18, fontWeight: '600', marginBottom: Spacing.md }}>
                Explain: {card.question}
              </Text>
              <Text style={{ color: Colors.textSecondary, fontSize: 14, lineHeight: 22 }}>
                Explain this concept as if teaching a 12-year-old. Use simple words and analogies.
              </Text>
              {isFlipped && (
                <View style={{ marginTop: Spacing.lg, paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.border }}>
                  <Text style={{ color: Colors.success, fontSize: 14, fontWeight: '600', marginBottom: Spacing.xs }}>
                    Reference answer:
                  </Text>
                  <Text style={{ color: Colors.text, fontSize: 16 }}>{card.answer}</Text>
                </View>
              )}
            </View>
            {!isFlipped && (
              <Pressable onPress={handleFlip} style={{ marginTop: Spacing.lg }}>
                <Text style={{ color: Colors.warning, fontSize: 15, fontWeight: '600' }}>
                  Show reference →
                </Text>
              </Pressable>
            )}
          </View>
        )}
      </View>

      {/* Response Buttons */}
      <View style={{ paddingHorizontal: Spacing.lg, paddingBottom: Spacing.lg }}>
        {isFlipped ? (
          <ResponseButtons
            currentInterval={card.interval}
            currentEase={card.ease}
            reviewCount={card.reviewCount}
            onResponse={handleResponse}
            currentDifficulty={card.difficulty}
            currentStability={card.stability}
            currentState={card.state}
            lastReview={card.last_review}
            currentLapses={card.lapses}
            desiredRetention={desiredRetention}
          />
        ) : (
          <Pressable
            onPress={handleFlip}
            style={{
              backgroundColor: Colors.primary,
              paddingVertical: Spacing.md,
              borderRadius: BorderRadius.md,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>
              Show Answer
            </Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  )
}
