import { useEffect } from 'react'
import { View, Text, Pressable, Dimensions } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  withDelay,
  runOnJS,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated'
import { Ionicons } from '@expo/vector-icons'
import { Colors, Spacing, BorderRadius } from '../../utils/constants'
import { getLevelForXP, LEVEL_DEFINITIONS } from '../../services/gamification'

interface LevelUpCelebrationProps {
  newLevel: number
  onDismiss: () => void
}

const { width: SCREEN_WIDTH } = Dimensions.get('window')

export function LevelUpCelebration({ newLevel, onDismiss }: LevelUpCelebrationProps) {
  const levelDef = LEVEL_DEFINITIONS.find((d) => d.level === newLevel) ??
    LEVEL_DEFINITIONS[0]

  const badgeScale = useSharedValue(0)
  const titleOpacity = useSharedValue(0)
  const unlockOpacity = useSharedValue(0)
  const glowOpacity = useSharedValue(0)

  useEffect(() => {
    // Sequence: glow → badge pops in → title fades in → unlock fades in
    glowOpacity.value = withSequence(
      withTiming(0.6, { duration: 300 }),
      withTiming(0.2, { duration: 1000 })
    )
    badgeScale.value = withDelay(
      200,
      withSpring(1, { damping: 8, stiffness: 150, mass: 0.8 })
    )
    titleOpacity.value = withDelay(500, withTiming(1, { duration: 400 }))
    unlockOpacity.value = withDelay(800, withTiming(1, { duration: 400 }))
  }, [])

  const animatedBadge = useAnimatedStyle(() => ({
    transform: [{ scale: badgeScale.value }],
  }))

  const animatedTitle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
  }))

  const animatedUnlock = useAnimatedStyle(() => ({
    opacity: unlockOpacity.value,
  }))

  const animatedGlow = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }))

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(200)}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 100,
      }}
    >
      <Pressable
        onPress={onDismiss}
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          width: '100%',
        }}
      >
        {/* Glow effect */}
        <Animated.View
          style={[
            {
              position: 'absolute',
              width: 300,
              height: 300,
              borderRadius: 150,
              backgroundColor: Colors.primary,
            },
            animatedGlow,
          ]}
        />

        {/* Badge */}
        <Animated.View
          style={[
            {
              width: 120,
              height: 120,
              borderRadius: 60,
              backgroundColor: Colors.primary + '30',
              borderWidth: 3,
              borderColor: Colors.primary,
              justifyContent: 'center',
              alignItems: 'center',
            },
            animatedBadge,
          ]}
        >
          <Ionicons name="star" size={56} color={Colors.accent} />
        </Animated.View>

        {/* Level text */}
        <Animated.View style={[{ alignItems: 'center', marginTop: Spacing.lg }, animatedTitle]}>
          <Text style={{ color: Colors.accent, fontSize: 16, fontWeight: '600', letterSpacing: 2 }}>
            LEVEL UP
          </Text>
          <Text style={{ color: Colors.text, fontSize: 40, fontWeight: '900', marginTop: 4 }}>
            Level {levelDef.level}
          </Text>
          <Text style={{ color: Colors.primary, fontSize: 20, fontWeight: '600', marginTop: 4 }}>
            {levelDef.title}
          </Text>
        </Animated.View>

        {/* Unlock text */}
        {levelDef.unlock ? (
          <Animated.View
            style={[
              {
                marginTop: Spacing.xl,
                backgroundColor: Colors.surface,
                paddingHorizontal: Spacing.lg,
                paddingVertical: Spacing.md,
                borderRadius: BorderRadius.md,
                borderWidth: 1,
                borderColor: Colors.accent + '40',
              },
              animatedUnlock,
            ]}
          >
            <Text style={{ color: Colors.textSecondary, fontSize: 12, textAlign: 'center' }}>
              UNLOCKED
            </Text>
            <Text style={{ color: Colors.accent, fontSize: 16, fontWeight: '600', textAlign: 'center', marginTop: 4 }}>
              {levelDef.unlock}
            </Text>
          </Animated.View>
        ) : null}

        <Animated.View style={[{ marginTop: Spacing.xxl }, animatedUnlock]}>
          <Text style={{ color: Colors.textSecondary, fontSize: 13 }}>
            Tap to continue
          </Text>
        </Animated.View>
      </Pressable>
    </Animated.View>
  )
}
