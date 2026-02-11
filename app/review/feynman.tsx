import { useEffect, useCallback, useState } from 'react'
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useDeckStore } from '../../src/stores/deckStore'
import { useFeynmanStore } from '../../src/stores/feynmanStore'
import { ExplainInput } from '../../src/components/feynman/ExplainInput'
import { GradeCard } from '../../src/components/feynman/GradeCard'
import { GapHighlight } from '../../src/components/feynman/GapHighlight'
import { Colors, Spacing, BorderRadius } from '../../src/utils/constants'

export default function FeynmanScreen() {
  const { cardId, deckId } = useLocalSearchParams<{
    cardId: string
    deckId: string
  }>()
  const router = useRouter()

  const { getDeck } = useDeckStore()
  const {
    session,
    phase,
    isGrading,
    error,
    xpAwarded,
    startSession,
    submitExplanation,
    submitFollowUp,
    goToFollowUp,
    endSession,
  } = useFeynmanStore()

  // Start session on mount
  useEffect(() => {
    if (!cardId || !deckId) return

    const deck = getDeck(deckId)
    if (!deck) return

    const card = deck.cards.find((c) => c.id === cardId)
    if (!card) return

    startSession(card)
  }, [cardId, deckId]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmitExplanation = useCallback(
    (explanation: string) => {
      submitExplanation(explanation)
    },
    [submitExplanation]
  )

  const handleSubmitFollowUp = useCallback(
    (answer: string) => {
      submitFollowUp(answer)
    },
    [submitFollowUp]
  )

  const handleEnd = useCallback(() => {
    endSession()
    router.back()
  }, [endSession, router])

  const handleAnswerFollowUp = useCallback(() => {
    goToFollowUp()
  }, [goToFollowUp])

  if (!session) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
        <View
          style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
        >
          <Text style={{ color: Colors.textSecondary, fontSize: 16 }}>
            Starting Feynman session...
          </Text>
        </View>
      </SafeAreaView>
    )
  }

  const currentGrade = phase === 'followUpResults' ? session.followUpGrade : session.grade
  const showResults = phase === 'results' || phase === 'followUpResults'
  const showExplain = phase === 'explain'
  const showFollowUp = phase === 'followUp'
  const showGrading = phase === 'grading' || phase === 'followUpGrading'

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: Spacing.lg,
          paddingVertical: Spacing.sm,
          borderBottomWidth: 1,
          borderBottomColor: Colors.border,
        }}
      >
        <Pressable onPress={handleEnd} hitSlop={8}>
          <Ionicons name="close" size={24} color={Colors.textSecondary} />
        </Pressable>

        <View
          style={{
            flex: 1,
            marginLeft: Spacing.md,
          }}
        >
          <Text
            style={{
              color: Colors.text,
              fontSize: 16,
              fontWeight: '700',
            }}
          >
            Feynman Mode
          </Text>
          <Text
            style={{
              color: Colors.textSecondary,
              fontSize: 12,
              marginTop: 2,
            }}
            numberOfLines={1}
          >
            {session.card.question}
          </Text>
        </View>

        {/* Phase indicator */}
        <View
          style={{
            backgroundColor: Colors.surface,
            borderRadius: BorderRadius.full,
            paddingHorizontal: Spacing.md,
            paddingVertical: Spacing.xs,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <Ionicons
            name={showResults ? 'analytics' : 'create-outline'}
            size={14}
            color={Colors.accent}
          />
          <Text
            style={{
              color: Colors.accent,
              fontSize: 13,
              fontWeight: '600',
            }}
          >
            {showExplain || showFollowUp
              ? 'Explain'
              : showGrading
                ? 'Grading...'
                : 'Results'}
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {/* Error message */}
        {error && (
          <View
            style={{
              backgroundColor: Colors.error + '15',
              marginHorizontal: Spacing.md,
              marginTop: Spacing.sm,
              padding: Spacing.md,
              borderRadius: BorderRadius.md,
              borderWidth: 1,
              borderColor: Colors.error + '30',
            }}
          >
            <Text style={{ color: Colors.error, fontSize: 13 }}>{error}</Text>
          </View>
        )}

        {/* Explain phase */}
        {showExplain && (
          <ExplainInput
            concept={session.card.question}
            onSubmit={handleSubmitExplanation}
            disabled={isGrading}
          />
        )}

        {/* Follow-up phase */}
        {showFollowUp && session.grade && (
          <ExplainInput
            concept={session.grade.followUp}
            onSubmit={handleSubmitFollowUp}
            disabled={isGrading}
          />
        )}

        {/* Grading spinner */}
        {showGrading && (
          <View
            style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              gap: Spacing.md,
            }}
          >
            <ActivityIndicator size="large" color={Colors.accent} />
            <Text
              style={{
                color: Colors.textSecondary,
                fontSize: 16,
              }}
            >
              Evaluating your explanation...
            </Text>
            <Text
              style={{
                color: Colors.textSecondary,
                fontSize: 13,
                fontStyle: 'italic',
              }}
            >
              Checking accuracy, simplicity, completeness & analogies
            </Text>
          </View>
        )}

        {/* Results phase */}
        {showResults && currentGrade && (
          <View style={{ flex: 1 }}>
            <GradeCard grade={currentGrade} xpEarned={xpAwarded} />
            <GapHighlight
              gaps={currentGrade.gaps}
              followUp={currentGrade.followUp}
              onAnswerFollowUp={handleAnswerFollowUp}
              onDone={handleEnd}
              hasFollowUp={phase === 'followUpResults'}
            />
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
