import { useEffect } from 'react'
import { View, Text, Pressable } from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  withDelay,
  withTiming,
  Easing,
} from 'react-native-reanimated'
import { Ionicons } from '@expo/vector-icons'
import { Colors, Spacing, BorderRadius } from '../../utils/constants'

interface InsightRevealProps {
  xpEarned: number
  onDismiss: () => void
}

export function InsightReveal({ xpEarned, onDismiss }: InsightRevealProps) {
  const scale = useSharedValue(0.3)
  const opacity = useSharedValue(0)
  const glowOpacity = useSharedValue(0)
  const bulbScale = useSharedValue(0)

  useEffect(() => {
    // Backdrop fade in
    opacity.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.quad) })

    // Card spring in
    scale.value = withSpring(1, { damping: 12, stiffness: 200, mass: 0.5 })

    // Bulb pulse
    bulbScale.value = withDelay(
      200,
      withSequence(
        withSpring(1.3, { damping: 8, stiffness: 300 }),
        withSpring(1, { damping: 15, stiffness: 200 })
      )
    )

    // Glow pulse
    glowOpacity.value = withDelay(
      300,
      withSequence(
        withTiming(0.8, { duration: 400 }),
        withTiming(0.3, { duration: 600 }),
        withTiming(0.6, { duration: 400 }),
        withTiming(0.3, { duration: 600 })
      )
    )
  }, [scale, opacity, glowOpacity, bulbScale])

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }))

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  const bulbStyle = useAnimatedStyle(() => ({
    transform: [{ scale: bulbScale.value }],
  }))

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }))

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 100,
        },
        backdropStyle,
      ]}
    >
      <Animated.View
        style={[
          {
            backgroundColor: Colors.surface,
            borderRadius: BorderRadius.xl,
            padding: Spacing.xl,
            alignItems: 'center',
            width: '85%',
            maxWidth: 360,
            borderWidth: 1,
            borderColor: Colors.accent + '40',
          },
          cardStyle,
        ]}
      >
        {/* Glow ring */}
        <Animated.View
          style={[
            {
              position: 'absolute',
              top: -20,
              width: 100,
              height: 100,
              borderRadius: 50,
              backgroundColor: Colors.accent + '20',
            },
            glowStyle,
          ]}
        />

        {/* Bulb icon */}
        <Animated.View
          style={[
            {
              width: 72,
              height: 72,
              borderRadius: 36,
              backgroundColor: Colors.accent + '20',
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: Spacing.lg,
            },
            bulbStyle,
          ]}
        >
          <Ionicons name="bulb" size={36} color={Colors.accent} />
        </Animated.View>

        <Text
          style={{
            color: Colors.accent,
            fontSize: 22,
            fontWeight: '800',
            marginBottom: Spacing.xs,
          }}
        >
          Insight Reached!
        </Text>

        <Text
          style={{
            color: Colors.textSecondary,
            fontSize: 14,
            textAlign: 'center',
            marginBottom: Spacing.lg,
            lineHeight: 20,
          }}
        >
          You discovered the answer through your own reasoning. This understanding runs
          deeper than memorization.
        </Text>

        {/* XP reward */}
        <View
          style={{
            backgroundColor: Colors.primary + '20',
            borderRadius: BorderRadius.md,
            paddingHorizontal: Spacing.lg,
            paddingVertical: Spacing.sm,
            flexDirection: 'row',
            alignItems: 'center',
            gap: Spacing.sm,
            marginBottom: Spacing.lg,
            borderWidth: 1,
            borderColor: Colors.primary + '40',
          }}
        >
          <Ionicons name="star" size={20} color={Colors.accent} />
          <Text style={{ color: Colors.accent, fontSize: 20, fontWeight: '800' }}>
            +{xpEarned} XP
          </Text>
        </View>

        <Pressable
          onPress={onDismiss}
          style={{
            backgroundColor: Colors.primary,
            paddingHorizontal: Spacing.xl,
            paddingVertical: Spacing.md,
            borderRadius: BorderRadius.md,
            width: '100%',
            alignItems: 'center',
          }}
        >
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>
            Continue
          </Text>
        </Pressable>
      </Animated.View>
    </Animated.View>
  )
}
