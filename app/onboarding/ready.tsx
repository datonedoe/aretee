import { useEffect, useCallback } from 'react'
import { View, Text, Pressable } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  withSequence,
} from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { Colors, Spacing, BorderRadius } from '../../src/utils/constants'
import { useOnboardingStore } from '../../src/stores/onboardingStore'
import { hapticCelebration, hapticMedium } from '../../src/services/haptics'
import { playSound } from '../../src/services/audio/sounds'

const FEATURES = [
  { icon: 'flash' as const, label: 'Flash Mode', desc: 'Spaced repetition cards' },
  { icon: 'school' as const, label: 'Socratic Mode', desc: 'AI dialogue learning' },
  { icon: 'mic' as const, label: 'Feynman Mode', desc: 'Explain to learn' },
  { icon: 'headset' as const, label: 'Audio Mode', desc: 'Podcasts from your cards' },
  { icon: 'earth' as const, label: 'Immersion Feed', desc: 'TikTok-style learning' },
  { icon: 'skull' as const, label: 'SkinUP', desc: 'Put money on the line' },
] as const

export default function ReadyScreen() {
  const router = useRouter()
  const { interests, goals } = useOnboardingStore()

  // Animations
  const checkScaleValue = useSharedValue(0)
  const titleFadeValue = useSharedValue(0)
  const featuresFadeValue = useSharedValue(0)
  const featuresSlideValue = useSharedValue(30)
  const buttonFadeValue = useSharedValue(0)

  useEffect(() => {
    hapticCelebration()
    playSound('levelUp')

    // Phase 1: Check mark pops in (spring ~400ms)
    checkScaleValue.value = withSpring(1, { damping: 6, stiffness: 60 })

    // Phase 2: Title fades in (delayed after spring settles)
    titleFadeValue.value = withDelay(400, withTiming(1, { duration: 400 }))

    // Phase 3: Features slide up (delayed after title)
    featuresFadeValue.value = withDelay(800, withTiming(1, { duration: 500 }))
    featuresSlideValue.value = withDelay(800, withTiming(0, { duration: 500 }))

    // Phase 4: Button appears
    buttonFadeValue.value = withDelay(1300, withTiming(1, { duration: 300 }))
  }, [])

  const checkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScaleValue.value }],
  }))

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleFadeValue.value,
  }))

  const featuresStyle = useAnimatedStyle(() => ({
    opacity: featuresFadeValue.value,
    transform: [{ translateY: featuresSlideValue.value }],
  }))

  const buttonStyle = useAnimatedStyle(() => ({
    opacity: buttonFadeValue.value,
  }))

  const handleStart = useCallback(() => {
    hapticMedium()
    router.replace('/(tabs)')
  }, [router])

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          padding: Spacing.xl,
        }}
      >
        {/* Success checkmark */}
        <Animated.View
          style={[
            { alignItems: 'center' },
            checkStyle,
          ]}
        >
          <View
            style={{
              width: 100,
              height: 100,
              borderRadius: 50,
              backgroundColor: Colors.success + '20',
              justifyContent: 'center',
              alignItems: 'center',
              borderWidth: 3,
              borderColor: Colors.success + '60',
            }}
          >
            <Ionicons name="checkmark" size={52} color={Colors.success} />
          </View>
        </Animated.View>

        {/* Title */}
        <Animated.View style={[{ alignItems: 'center', marginTop: Spacing.lg }, titleStyle]}>
          <Text
            style={{
              color: Colors.text,
              fontSize: 32,
              fontWeight: '900',
              textAlign: 'center',
            }}
          >
            You're all set!
          </Text>
          <Text
            style={{
              color: Colors.textSecondary,
              fontSize: 15,
              textAlign: 'center',
              marginTop: Spacing.sm,
              lineHeight: 22,
              maxWidth: 300,
            }}
          >
            {interests.length > 0
              ? `${interests.length} interest${interests.length > 1 ? 's' : ''} · ${goals.length} goal${goals.length !== 1 ? 's' : ''} · Ready to learn`
              : 'Your learning journey starts now'}
          </Text>
        </Animated.View>

        {/* Feature grid */}
        <Animated.View
          style={[
            {
              marginTop: Spacing.xl,
              width: '100%',
              maxWidth: 340,
            },
            featuresStyle,
          ]}
        >
          <Text
            style={{
              color: Colors.textSecondary,
              fontSize: 12,
              fontWeight: '600',
              letterSpacing: 2,
              textTransform: 'uppercase',
              marginBottom: Spacing.md,
            }}
          >
            Your toolkit
          </Text>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm }}>
            {FEATURES.map((f) => (
              <View
                key={f.label}
                style={{
                  width: '48%',
                  backgroundColor: Colors.surface,
                  borderRadius: BorderRadius.md,
                  padding: Spacing.md,
                  borderWidth: 1,
                  borderColor: Colors.border,
                }}
              >
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: BorderRadius.sm,
                    backgroundColor: Colors.primary + '20',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Ionicons name={f.icon} size={16} color={Colors.primary} />
                </View>
                <Text
                  style={{
                    color: Colors.text,
                    fontSize: 13,
                    fontWeight: '700',
                    marginTop: Spacing.xs,
                  }}
                >
                  {f.label}
                </Text>
                <Text
                  style={{
                    color: Colors.textSecondary,
                    fontSize: 11,
                    marginTop: 1,
                  }}
                >
                  {f.desc}
                </Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* CTA */}
        <Animated.View
          style={[
            {
              width: '100%',
              maxWidth: 340,
              marginTop: Spacing.xl,
            },
            buttonStyle,
          ]}
        >
          <Pressable
            onPress={handleStart}
            style={({ pressed }) => ({
              backgroundColor: Colors.primary,
              paddingVertical: Spacing.md + 4,
              borderRadius: BorderRadius.md,
              alignItems: 'center',
              opacity: pressed ? 0.85 : 1,
              transform: [{ scale: pressed ? 0.98 : 1 }],
              shadowColor: Colors.primary,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.4,
              shadowRadius: 12,
              elevation: 8,
            })}
          >
            <Text
              style={{
                color: '#fff',
                fontSize: 18,
                fontWeight: '800',
                letterSpacing: 0.5,
              }}
            >
              Start Learning
            </Text>
          </Pressable>
        </Animated.View>
      </View>
    </SafeAreaView>
  )
}
