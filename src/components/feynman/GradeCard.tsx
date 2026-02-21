import { useEffect, useRef } from 'react'
import { View, Text, ScrollView, Animated } from 'react-native'
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
  const barWidth = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const delay = 200 + index * 150
    setTimeout(() => {
      Animated.spring(barWidth, {
        toValue: score,
        damping: 15,
        stiffness: 100,
        mass: 0.8,
        useNativeDriver: false,
      }).start()
    }, delay)
  }, [score, index, barWidth])

  const animatedBarWidth = barWidth.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp',
  })

  const { label, icon, description } = DIMENSION_LABELS[dimension]
  const color = getScoreColor(score)

  return (
    <View style={{ marginBottom: Spacing.md }}>
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
          <Text style={{ color: Colors.text, fontSize: 14, fontWeight: '600' }}>
            {label}
          </Text>
          <Text style={{ color: Colors.textSecondary, fontSize: 11 }}>
            {description}
          </Text>
        </View>
        <Text style={{ color, fontSize: 16, fontWeight: '700' }}>
          {score}
        </Text>
      </View>

      <View
        style={{
          height: 8,
          backgroundColor: Colors.surfaceLight,
          borderRadius: 4,
          overflow: 'hidden',
        }}
      >
        <Animated.View
          style={{
            height: '100%',
            backgroundColor: color,
            borderRadius: 4,
            width: animatedBarWidth,
          }}
        />
      </View>

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
  const overallScale = useRef(new Animated.Value(0)).current
  const overallOpacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    setTimeout(() => {
      Animated.parallel([
        Animated.spring(overallScale, {
          toValue: 1,
          damping: 12,
          stiffness: 150,
          useNativeDriver: true,
        }),
        Animated.timing(overallOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start()
    }, 100)
  }, [overallScale, overallOpacity])

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
        style={{
          alignItems: 'center',
          marginBottom: Spacing.lg,
          transform: [{ scale: overallScale }],
          opacity: overallOpacity,
        }}
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
          <Text style={{ color: overallColor, fontSize: 36, fontWeight: '800' }}>
            {grade.overall}
          </Text>
          <Text style={{ color: overallColor, fontSize: 12, fontWeight: '600', opacity: 0.8 }}>
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
            <Text style={{ color: Colors.primary, fontSize: 14, fontWeight: '700' }}>
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
