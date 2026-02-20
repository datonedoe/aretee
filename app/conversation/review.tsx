/**
 * Sprint 12: Post-conversation review screen.
 * Score breakdown, corrections, new vocab, tips, XP earned.
 */

import { useCallback, useEffect } from 'react'
import { View, Text, ScrollView, Pressable } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { Colors, Spacing, BorderRadius } from '../../src/utils/constants'
import { useConversationStore } from '../../src/stores/conversationStore'
import { hapticMedium, hapticSuccess } from '../../src/services/haptics'

function ScoreBar({
  label,
  score,
  color,
}: {
  label: string
  score: number
  color: string
}) {
  return (
    <View style={{ marginBottom: Spacing.md }}>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginBottom: 4,
        }}
      >
        <Text
          style={{
            color: Colors.textSecondary,
            fontSize: 13,
            fontWeight: '600',
          }}
        >
          {label}
        </Text>
        <Text
          style={{
            color: Colors.text,
            fontSize: 13,
            fontWeight: '700',
          }}
        >
          {score}
        </Text>
      </View>
      <View
        style={{
          height: 8,
          backgroundColor: Colors.surface,
          borderRadius: 4,
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            height: '100%',
            width: `${score}%`,
            backgroundColor: color,
            borderRadius: 4,
          }}
        />
      </View>
    </View>
  )
}

function getScoreColor(score: number): string {
  if (score >= 80) return Colors.success
  if (score >= 60) return Colors.accent
  if (score >= 40) return Colors.warning
  return Colors.error
}

function getScoreLabel(score: number): string {
  if (score >= 90) return 'Excellent'
  if (score >= 75) return 'Great'
  if (score >= 60) return 'Good'
  if (score >= 40) return 'Developing'
  return 'Keep practicing'
}

export default function ReviewScreen() {
  const router = useRouter()
  const { session, review, isGeneratingReview, requestReview, clearSession } =
    useConversationStore()

  // Generate review if not already done
  useEffect(() => {
    if (!review && session && !isGeneratingReview) {
      requestReview()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleTryAgain = useCallback(() => {
    hapticMedium()
    if (session) {
      const scenarioId = session.scenario.id
      clearSession()
      router.replace(`/conversation/${scenarioId}`)
    }
  }, [session, clearSession, router])

  const handleNewScenario = useCallback(() => {
    hapticMedium()
    clearSession()
    router.replace('/(tabs)/converse')
  }, [clearSession, router])

  const handleDone = useCallback(() => {
    hapticSuccess()
    clearSession()
    router.replace('/(tabs)/converse')
  }, [clearSession, router])

  // Loading state
  if (isGeneratingReview || !review) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
        <View
          style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
        >
          <Text style={{ fontSize: 48, marginBottom: Spacing.lg }}>🔍</Text>
          <Text
            style={{
              color: Colors.text,
              fontSize: 18,
              fontWeight: '700',
            }}
          >
            Analyzing your conversation...
          </Text>
          <Text
            style={{
              color: Colors.textSecondary,
              fontSize: 14,
              marginTop: Spacing.sm,
            }}
          >
            Checking fluency, accuracy, and register
          </Text>
        </View>
      </SafeAreaView>
    )
  }

  const overallColor = getScoreColor(review.overallScore)
  const xp = session?.xpEarned ?? 0
  const duration = session?.duration ?? 0
  const durationMin = Math.floor(duration / 60)
  const durationSec = duration % 60

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <ScrollView
        contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 120 }}
      >
        {/* Overall score */}
        <View style={{ alignItems: 'center', marginBottom: Spacing.xl }}>
          <View
            style={{
              width: 100,
              height: 100,
              borderRadius: 50,
              backgroundColor: overallColor + '20',
              borderWidth: 3,
              borderColor: overallColor,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                color: overallColor,
                fontSize: 32,
                fontWeight: '900',
              }}
            >
              {review.overallScore}
            </Text>
          </View>
          <Text
            style={{
              color: Colors.text,
              fontSize: 22,
              fontWeight: '800',
              marginTop: Spacing.md,
            }}
          >
            {getScoreLabel(review.overallScore)}
          </Text>

          {/* Stats row */}
          <View
            style={{
              flexDirection: 'row',
              gap: Spacing.xl,
              marginTop: Spacing.md,
            }}
          >
            <View style={{ alignItems: 'center' }}>
              <Text
                style={{
                  color: Colors.accent,
                  fontSize: 16,
                  fontWeight: '700',
                }}
              >
                +{xp} XP
              </Text>
              <Text
                style={{
                  color: Colors.textSecondary,
                  fontSize: 11,
                }}
              >
                earned
              </Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text
                style={{
                  color: Colors.text,
                  fontSize: 16,
                  fontWeight: '700',
                }}
              >
                {durationMin}:{durationSec.toString().padStart(2, '0')}
              </Text>
              <Text
                style={{
                  color: Colors.textSecondary,
                  fontSize: 11,
                }}
              >
                duration
              </Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text
                style={{
                  color: Colors.text,
                  fontSize: 16,
                  fontWeight: '700',
                }}
              >
                {session?.messages.filter((m) => m.role === 'user').length ?? 0}
              </Text>
              <Text
                style={{
                  color: Colors.textSecondary,
                  fontSize: 11,
                }}
              >
                messages
              </Text>
            </View>
          </View>
        </View>

        {/* Score breakdown */}
        <View
          style={{
            backgroundColor: Colors.surface,
            borderRadius: BorderRadius.lg,
            padding: Spacing.lg,
            marginBottom: Spacing.lg,
            borderWidth: 1,
            borderColor: Colors.border,
          }}
        >
          <Text
            style={{
              color: Colors.text,
              fontSize: 16,
              fontWeight: '700',
              marginBottom: Spacing.md,
            }}
          >
            Breakdown
          </Text>
          <ScoreBar
            label="Fluency"
            score={review.fluency}
            color={getScoreColor(review.fluency)}
          />
          <ScoreBar
            label="Accuracy"
            score={review.accuracy}
            color={getScoreColor(review.accuracy)}
          />
          <ScoreBar
            label="Register"
            score={review.registerAppropriateness}
            color={getScoreColor(review.registerAppropriateness)}
          />
          <ScoreBar
            label="Vocab Range"
            score={review.vocabRange}
            color={getScoreColor(review.vocabRange)}
          />
        </View>

        {/* Corrections */}
        {review.corrections.length > 0 && (
          <View
            style={{
              backgroundColor: Colors.surface,
              borderRadius: BorderRadius.lg,
              padding: Spacing.lg,
              marginBottom: Spacing.lg,
              borderWidth: 1,
              borderColor: Colors.border,
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: Spacing.sm,
                marginBottom: Spacing.md,
              }}
            >
              <Ionicons name="pencil" size={16} color={Colors.warning} />
              <Text
                style={{
                  color: Colors.text,
                  fontSize: 16,
                  fontWeight: '700',
                }}
              >
                Corrections
              </Text>
            </View>
            {review.corrections.map((c, i) => (
              <View
                key={i}
                style={{
                  marginBottom: i < review.corrections.length - 1 ? Spacing.md : 0,
                  paddingBottom: i < review.corrections.length - 1 ? Spacing.md : 0,
                  borderBottomWidth:
                    i < review.corrections.length - 1 ? 1 : 0,
                  borderBottomColor: Colors.border,
                }}
              >
                <Text
                  style={{
                    color: Colors.error,
                    fontSize: 14,
                    textDecorationLine: 'line-through',
                  }}
                >
                  {c.original}
                </Text>
                <Text
                  style={{
                    color: Colors.success,
                    fontSize: 14,
                    fontWeight: '600',
                    marginTop: 2,
                  }}
                >
                  → {c.corrected}
                </Text>
                <Text
                  style={{
                    color: Colors.textSecondary,
                    fontSize: 12,
                    marginTop: 4,
                    lineHeight: 18,
                  }}
                >
                  {c.explanation}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* New vocab */}
        {review.newVocab.length > 0 && (
          <View
            style={{
              backgroundColor: Colors.surface,
              borderRadius: BorderRadius.lg,
              padding: Spacing.lg,
              marginBottom: Spacing.lg,
              borderWidth: 1,
              borderColor: Colors.border,
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: Spacing.sm,
                marginBottom: Spacing.md,
              }}
            >
              <Ionicons name="book" size={16} color={Colors.primary} />
              <Text
                style={{
                  color: Colors.text,
                  fontSize: 16,
                  fontWeight: '700',
                }}
              >
                New Vocabulary
              </Text>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm }}>
              {review.newVocab.map((word, i) => (
                <View
                  key={i}
                  style={{
                    backgroundColor: Colors.primary + '15',
                    paddingHorizontal: Spacing.md,
                    paddingVertical: Spacing.xs + 2,
                    borderRadius: BorderRadius.full,
                    borderWidth: 1,
                    borderColor: Colors.primary + '30',
                  }}
                >
                  <Text
                    style={{
                      color: Colors.primary,
                      fontSize: 14,
                      fontWeight: '600',
                    }}
                  >
                    {word}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Tips */}
        {review.tips.length > 0 && (
          <View
            style={{
              backgroundColor: Colors.surface,
              borderRadius: BorderRadius.lg,
              padding: Spacing.lg,
              marginBottom: Spacing.lg,
              borderWidth: 1,
              borderColor: Colors.border,
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: Spacing.sm,
                marginBottom: Spacing.md,
              }}
            >
              <Ionicons name="bulb" size={16} color={Colors.accent} />
              <Text
                style={{
                  color: Colors.text,
                  fontSize: 16,
                  fontWeight: '700',
                }}
              >
                Tips
              </Text>
            </View>
            {review.tips.map((tip, i) => (
              <View
                key={i}
                style={{
                  flexDirection: 'row',
                  gap: Spacing.sm,
                  marginBottom: i < review.tips.length - 1 ? Spacing.sm : 0,
                }}
              >
                <Text style={{ color: Colors.accent, fontSize: 14 }}>•</Text>
                <Text
                  style={{
                    color: Colors.textSecondary,
                    fontSize: 14,
                    lineHeight: 20,
                    flex: 1,
                  }}
                >
                  {tip}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Action buttons */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: Spacing.lg,
          paddingBottom: Spacing.xxl,
          backgroundColor: Colors.background,
          borderTopWidth: 1,
          borderTopColor: Colors.border,
          flexDirection: 'row',
          gap: Spacing.sm,
        }}
      >
        <Pressable
          onPress={handleTryAgain}
          style={({ pressed }) => ({
            flex: 1,
            backgroundColor: Colors.surface,
            paddingVertical: Spacing.md + 2,
            borderRadius: BorderRadius.md,
            alignItems: 'center',
            opacity: pressed ? 0.85 : 1,
            borderWidth: 1,
            borderColor: Colors.border,
          })}
        >
          <Text
            style={{
              color: Colors.text,
              fontSize: 15,
              fontWeight: '600',
            }}
          >
            Try Again
          </Text>
        </Pressable>
        <Pressable
          onPress={handleNewScenario}
          style={({ pressed }) => ({
            flex: 1,
            backgroundColor: Colors.surface,
            paddingVertical: Spacing.md + 2,
            borderRadius: BorderRadius.md,
            alignItems: 'center',
            opacity: pressed ? 0.85 : 1,
            borderWidth: 1,
            borderColor: Colors.border,
          })}
        >
          <Text
            style={{
              color: Colors.text,
              fontSize: 15,
              fontWeight: '600',
            }}
          >
            New Scenario
          </Text>
        </Pressable>
        <Pressable
          onPress={handleDone}
          style={({ pressed }) => ({
            flex: 1,
            backgroundColor: Colors.primary,
            paddingVertical: Spacing.md + 2,
            borderRadius: BorderRadius.md,
            alignItems: 'center',
            opacity: pressed ? 0.85 : 1,
          })}
        >
          <Text
            style={{
              color: '#fff',
              fontSize: 15,
              fontWeight: '700',
            }}
          >
            Done
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  )
}
