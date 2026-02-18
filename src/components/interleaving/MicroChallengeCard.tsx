import { useState, useEffect, useRef } from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated'
import { MicroChallenge, MicroChallengeType } from '../../types/interleaving'
import { Colors, Spacing, BorderRadius } from '../../utils/constants'

const TYPE_CONFIG: Record<
  MicroChallengeType,
  { emoji: string; label: string; color: string }
> = {
  [MicroChallengeType.QuickRecall]: {
    emoji: '⚡',
    label: 'Quick Recall',
    color: Colors.primary,
  },
  [MicroChallengeType.FillTheGap]: {
    emoji: '📝',
    label: 'Fill the Gap',
    color: Colors.accent,
  },
  [MicroChallengeType.ListeningSnap]: {
    emoji: '🎧',
    label: 'Listening Snap',
    color: Colors.warning,
  },
  [MicroChallengeType.PictureDescribe]: {
    emoji: '🖼️',
    label: 'Picture Describe',
    color: Colors.success,
  },
  [MicroChallengeType.CulturalMicro]: {
    emoji: '💡',
    label: 'Cultural Micro',
    color: '#E879F9',
  },
}

interface MicroChallengeCardProps {
  challenge: MicroChallenge
  onComplete: (challengeId: string) => void
  onDismiss: () => void
}

export function MicroChallengeCard({
  challenge,
  onComplete,
  onDismiss,
}: MicroChallengeCardProps) {
  const [revealed, setRevealed] = useState(false)
  const [timeLeft, setTimeLeft] = useState(challenge.timeLimit)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const slideAnim = useSharedValue(-100)
  const opacityAnim = useSharedValue(0)

  const config = TYPE_CONFIG[challenge.type]

  // Slide-in animation
  useEffect(() => {
    slideAnim.value = withSpring(0, {
      damping: 15,
      stiffness: 60,
      mass: 1,
    })
    opacityAnim.value = withTiming(1, { duration: 300 })
  }, [])

  const containerAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: slideAnim.value }],
    opacity: opacityAnim.value,
  }))

  // Countdown timer
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  const handleReveal = () => {
    setRevealed(true)
    if (timerRef.current) clearInterval(timerRef.current)
  }

  const handleGotIt = () => {
    onComplete(challenge.id)
  }

  const progressPct = (timeLeft / challenge.timeLimit) * 100
  const timerColor =
    timeLeft <= 3 ? Colors.error : timeLeft <= 5 ? Colors.warning : config.color

  return (
    <Animated.View
      style={[
        styles.container,
        { borderColor: config.color + '60' },
        containerAnimStyle,
      ]}
    >
      {/* Timer bar */}
      <View style={styles.timerBar}>
        <View
          style={[
            styles.timerFill,
            { width: `${progressPct}%`, backgroundColor: timerColor },
          ]}
        />
      </View>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.emoji}>{config.emoji}</Text>
          <Text style={[styles.typeLabel, { color: config.color }]}>
            {config.label}
          </Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={[styles.timer, { color: timerColor }]}>{timeLeft}s</Text>
          <Pressable onPress={onDismiss} hitSlop={8}>
            <Text style={styles.dismiss}>✕</Text>
          </Pressable>
        </View>
      </View>

      {/* Prompt */}
      <Text style={styles.prompt}>{challenge.prompt}</Text>

      {/* Answer / Reveal */}
      {revealed ? (
        <View style={styles.answerContainer}>
          <Text style={styles.answerLabel}>Answer:</Text>
          <Text style={styles.answerText}>{challenge.expectedAnswer}</Text>
          <Pressable
            onPress={handleGotIt}
            style={[styles.actionButton, { backgroundColor: config.color }]}
          >
            <Text style={styles.actionButtonText}>✓ Got it</Text>
          </Pressable>
        </View>
      ) : (
        <Pressable
          onPress={handleReveal}
          style={[styles.revealButton, { borderColor: config.color + '60' }]}
        >
          <Text style={[styles.revealButtonText, { color: config.color }]}>
            Reveal Answer
          </Text>
        </Pressable>
      )}
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  timerBar: {
    height: 3,
    backgroundColor: Colors.surfaceLight,
  },
  timerFill: {
    height: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  emoji: {
    fontSize: 18,
  },
  typeLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  timer: {
    fontSize: 14,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  dismiss: {
    color: Colors.textSecondary,
    fontSize: 16,
  },
  prompt: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: '600',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    lineHeight: 22,
  },
  answerContainer: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    gap: Spacing.xs,
  },
  answerLabel: {
    color: Colors.success,
    fontSize: 12,
    fontWeight: '700',
  },
  answerText: {
    color: Colors.text,
    fontSize: 15,
    lineHeight: 22,
  },
  actionButton: {
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  revealButton: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
  },
  revealButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
})
