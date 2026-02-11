import { useEffect } from 'react'
import { View, Text, ScrollView } from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withDelay,
  withTiming,
} from 'react-native-reanimated'
import { Ionicons } from '@expo/vector-icons'
import { Colors, Spacing, BorderRadius } from '../../utils/constants'
import type { FeynmanGrade } from '../../services/ai/feynman'

interface GradeCardProps {
  grade: FeynmanGrade
  xpEarned: number
}

const DIMENSION_LABELS = {
  accuracy: { label: 'Accuracy', icon: 'checkmark-circle' as const, description: 'Factual correctness' },
  simplicity: { label: 'Simplicity', icon: 'happy' as const, description: 'Easy to understand' },
  completeness: { label: 'Completeness', icon: 'layers' as const, description: 'Key points covered' },
  analogies: { label: 'Analogies', icon: 'color-wand' as const, description: 'Examples & comparisons' },
}

function getScoreColor(score: number): string {
  if (score >= 80) return Colors.success
  if (score >= 60) return Colors.accent
  if (score >= 40) return Colors.warning
  return Colors.error
}

function getOverallLabel(score: number): string {
  if (score >= 90) return 'Excellent!'
  if (score >= 80) return 'Great job!'
  if (score >= 70) return 'Good work'
  if (score >= 60) return 'Getting there'
  if (score >= 40) return 'Keep practicing'
  return 'Needs work'
}

function ScoreBar({
  dimension,
  score,
  feedback,
  index,
}: {
  dimension: keyof typeof DIMENSION_LABELS
  score: number
  feedback: string
  index: number
}) {
  const barWidth = useSharedValue(0)

  useEffect(() => {
    barWidth.value = withDelay(
      200 + index * 150,
      withSpring(score, { damping: 15, stiffness: 100, mass: 0.8 })
    )
  }, [score, index, barWidth])

  const animatedBarStyle = useAnimatedStyle(() => ({
    width: `${barWidth.value}%`,
  }))

  const { label, icon, description } = DIMENSION_LABELS[dimension]
  const color = getScoreColor(score)

  return (
    <View
      style={{
        marginBottom: Spacing.md,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 6,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Ionicons name={icon} size={14} color={color} />
          <Text
            style={{
              color: Colors.text,
              fontSize: 14,
              fontWeight: '600',
            }}
          >
            {label}
          </Text>
          <Text
            style={{
              color: Colors.textSecondary,
              fontSize: 11,
            }}
          >
            {description}
          </Text>
        </View>
        <Text
          style={{
            color,
            fontSize: 16,
            fontWeight: '700',
          }}
        >
          {score}
        </Text>
      </View>

      {/* Bar background */}
      <View
        style={{
          height: 8,
          backgroundColor: Colors.surfaceLight,
          borderRadius: 4,
          overflow: 'hidden',
        }}
      >
        <Animated.View
          style={[
            {
              height: '100%',
              backgroundColor: color,
              borderRadius: 4,
            },
            animatedBarStyle,
          ]}
        />
      </View>

      {/* Feedback */}
      {feedback ? (
        <Text
          style={{
            color: Colors.textSecondary,
            fontSize: 13,
            marginTop: 4,
            lineHeight: 18,
          }}
        >
          {feedback}
        </Text>
      ) : null}
    </View>
  )
}

export function GradeCard({ grade, xpEarned }: GradeCardProps) {
  const overallScale = useSharedValue(0)
  const overallOpacity = useSharedValue(0)

  useEffect(() => {
    overallScale.value = withDelay(100, withSpring(1, { damping: 12, stiffness: 150 }))
    overallOpacity.value = withDelay(100, withTiming(1, { duration: 400 }))
  }, [overallScale, overallOpacity])

  const overallAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: overallScale.value }],
    opacity: overallOpacity.value,
  }))

  const overallColor = getScoreColor(grade.overall)

  return (
    <ScrollView
      contentContainerStyle={{
        padding: Spacing.md,
        paddingBottom: Spacing.xxl,
      }}
    >
      {/* Overall score circle */}
      <Animated.View
        style={[
          {
            alignItems: 'center',
            marginBottom: Spacing.lg,
          },
          overallAnimStyle,
        ]}
      >
        <View
          style={{
            width: 120,
            height: 120,
            borderRadius: 60,
            borderWidth: 4,
            borderColor: overallColor,
            backgroundColor: overallColor + '15',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Text
            style={{
              color: overallColor,
              fontSize: 36,
              fontWeight: '800',
            }}
          >
            {grade.overall}
          </Text>
          <Text
            style={{
              color: overallColor,
              fontSize: 12,
              fontWeight: '600',
              opacity: 0.8,
            }}
          >
            / 100
          </Text>
        </View>
        <Text
          style={{
            color: Colors.text,
            fontSize: 18,
            fontWeight: '700',
            marginTop: Spacing.sm,
          }}
        >
          {getOverallLabel(grade.overall)}
        </Text>
        {xpEarned > 0 && (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              marginTop: Spacing.xs,
              backgroundColor: Colors.primary + '20',
              paddingHorizontal: Spacing.md,
              paddingVertical: Spacing.xs,
              borderRadius: BorderRadius.full,
            }}
          >
            <Ionicons name="flash" size={14} color={Colors.primary} />
            <Text
              style={{
                color: Colors.primary,
                fontSize: 14,
                fontWeight: '700',
              }}
            >
              +{xpEarned} XP
            </Text>
          </View>
        )}
      </Animated.View>

      {/* Dimension scores */}
      <View
        style={{
          backgroundColor: Colors.surface,
          borderRadius: BorderRadius.lg,
          padding: Spacing.lg,
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
          Score Breakdown
        </Text>
        <ScoreBar dimension="accuracy" score={grade.accuracy.score} feedback={grade.accuracy.feedback} index={0} />
        <ScoreBar dimension="simplicity" score={grade.simplicity.score} feedback={grade.simplicity.feedback} index={1} />
        <ScoreBar dimension="completeness" score={grade.completeness.score} feedback={grade.completeness.feedback} index={2} />
        <ScoreBar dimension="analogies" score={grade.analogies.score} feedback={grade.analogies.feedback} index={3} />
      </View>
    </ScrollView>
  )
}
