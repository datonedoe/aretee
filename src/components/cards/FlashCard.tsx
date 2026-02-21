import { memo, useEffect, useRef } from 'react'
import { View, Text, Pressable, Animated } from 'react-native'
import { Colors, Spacing, BorderRadius } from '../../utils/constants'
import { hapticMedium } from '../../services/haptics'
import { MathText } from './MathText'

interface FlashCardProps {
  question: string
  answer: string
  isFlipped: boolean
  onFlip: () => void
}

const SPRING_CONFIG = {
  damping: 20,
  stiffness: 200,
  mass: 0.5,
  useNativeDriver: true,
}

export const FlashCard = memo(function FlashCard({ question, answer, isFlipped, onFlip }: FlashCardProps) {
  const rotation = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.spring(rotation, {
      toValue: isFlipped ? 1 : 0,
      ...SPRING_CONFIG,
    }).start()
  }, [isFlipped, rotation])

  const frontRotation = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  })

  const backRotation = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['180deg', '360deg'],
  })

  return (
    <Pressable onPress={() => { hapticMedium(); onFlip() }} style={{ flex: 1, width: '100%' }}>
      <View style={{ flex: 1, width: '100%' }}>
        {/* Front - Question */}
        <Animated.View
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            backgroundColor: Colors.surface,
            borderRadius: BorderRadius.lg,
            padding: Spacing.xl,
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: 1,
            borderColor: Colors.border,
            backfaceVisibility: 'hidden',
            transform: [{ perspective: 1200 }, { rotateY: frontRotation }],
          }}
        >
          <Text
            style={{
              color: Colors.textSecondary,
              fontSize: 12,
              fontWeight: '600',
              letterSpacing: 1,
              textTransform: 'uppercase',
              marginBottom: Spacing.md,
            }}
          >
            Question
          </Text>
          <MathText text={question} fontSize={20} color={Colors.text} textAlign="center" />
          <Text
            style={{
              color: Colors.textSecondary,
              fontSize: 12,
              marginTop: Spacing.xl,
            }}
          >
            Tap to reveal answer
          </Text>
        </Animated.View>

        {/* Back - Answer */}
        <Animated.View
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            backgroundColor: Colors.surface,
            borderRadius: BorderRadius.lg,
            padding: Spacing.xl,
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: 1,
            borderColor: Colors.primary + '60',
            backfaceVisibility: 'hidden',
            transform: [{ perspective: 1200 }, { rotateY: backRotation }],
          }}
        >
          <Text
            style={{
              color: Colors.accent,
              fontSize: 12,
              fontWeight: '600',
              letterSpacing: 1,
              textTransform: 'uppercase',
              marginBottom: Spacing.md,
            }}
          >
            Answer
          </Text>
          <MathText text={answer} fontSize={20} color={Colors.text} textAlign="center" />
        </Animated.View>
      </View>
    </Pressable>
  )
})
