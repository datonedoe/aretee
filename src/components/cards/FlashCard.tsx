import { View, Text, Pressable } from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  interpolate,
} from 'react-native-reanimated'
import { Colors, Spacing, BorderRadius } from '../../utils/constants'

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
}

export function FlashCard({ question, answer, isFlipped, onFlip }: FlashCardProps) {
  const rotation = useSharedValue(0)

  const frontStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(rotation.value, [0, 1], [0, 180])
    return {
      transform: [{ perspective: 1200 }, { rotateY: `${rotateY}deg` }],
      backfaceVisibility: 'hidden' as const,
    }
  })

  const backStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(rotation.value, [0, 1], [180, 360])
    return {
      transform: [{ perspective: 1200 }, { rotateY: `${rotateY}deg` }],
      backfaceVisibility: 'hidden' as const,
    }
  })

  // Sync animation with prop
  if (isFlipped && rotation.value < 0.5) {
    rotation.value = withSpring(1, SPRING_CONFIG)
  } else if (!isFlipped && rotation.value > 0.5) {
    rotation.value = withSpring(0, SPRING_CONFIG)
  }

  return (
    <Pressable onPress={onFlip} style={{ flex: 1, width: '100%' }}>
      <View style={{ flex: 1, width: '100%' }}>
        {/* Front - Question */}
        <Animated.View
          style={[
            {
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
            },
            frontStyle,
          ]}
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
          <Text
            style={{
              color: Colors.text,
              fontSize: 20,
              fontWeight: '500',
              textAlign: 'center',
              lineHeight: 30,
            }}
          >
            {question}
          </Text>
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
          style={[
            {
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
            },
            backStyle,
          ]}
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
          <Text
            style={{
              color: Colors.text,
              fontSize: 20,
              fontWeight: '500',
              textAlign: 'center',
              lineHeight: 30,
            }}
          >
            {answer}
          </Text>
        </Animated.View>
      </View>
    </Pressable>
  )
}
