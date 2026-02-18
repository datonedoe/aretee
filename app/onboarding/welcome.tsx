import { useCallback, useEffect } from 'react'
import { View, Text, Pressable } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  withSequence,
} from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { Colors, Spacing, BorderRadius } from '../../src/utils/constants'
import { useOnboardingStore } from '../../src/stores/onboardingStore'
import { hapticMedium } from '../../src/services/haptics'

export default function WelcomeScreen() {
  const router = useRouter()
  const setStep = useOnboardingStore((s) => s.setStep)

  // Animations
  const fadeValue = useSharedValue(0)
  const slideValue = useSharedValue(40)
  const logoScaleValue = useSharedValue(0.5)
  const buttonFadeValue = useSharedValue(0)

  useEffect(() => {
    // Phase 1: logo spring + fade in (together)
    logoScaleValue.value = withSpring(1, { damping: 7, stiffness: 50 })
    fadeValue.value = withTiming(1, { duration: 600 })

    // Phase 2: slide content + button fade (delayed to start after phase 1)
    slideValue.value = withDelay(600, withTiming(0, { duration: 400 }))
    buttonFadeValue.value = withDelay(600, withTiming(1, { duration: 400 }))
  }, [])

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScaleValue.value }],
    opacity: fadeValue.value,
  }))

  const featuresStyle = useAnimatedStyle(() => ({
    opacity: fadeValue.value,
    transform: [{ translateY: slideValue.value }],
  }))

  const buttonStyle = useAnimatedStyle(() => ({
    opacity: buttonFadeValue.value,
  }))

  const handleNext = useCallback(() => {
    hapticMedium()
    setStep('interests')
    router.push('/onboarding/interests')
  }, [setStep, router])

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
        {/* Logo / Brand */}
        <Animated.View
          style={[
            { alignItems: 'center' },
            logoStyle,
          ]}
        >
          <View
            style={{
              width: 120,
              height: 120,
              borderRadius: 30,
              backgroundColor: Colors.primary + '20',
              justifyContent: 'center',
              alignItems: 'center',
              borderWidth: 2,
              borderColor: Colors.primary + '40',
            }}
          >
            <Ionicons name="flash" size={56} color={Colors.primary} />
          </View>

          <Text
            style={{
              color: Colors.text,
              fontSize: 42,
              fontWeight: '900',
              marginTop: Spacing.lg,
              letterSpacing: -1,
            }}
          >
            Aretee
          </Text>

          <Text
            style={{
              color: Colors.accent,
              fontSize: 16,
              fontWeight: '600',
              marginTop: Spacing.xs,
              letterSpacing: 3,
              textTransform: 'uppercase',
            }}
          >
            Remember Everything
          </Text>
        </Animated.View>

        {/* Features */}
        <Animated.View
          style={[
            {
              marginTop: Spacing.xxl,
              gap: Spacing.md,
              width: '100%',
              maxWidth: 320,
            },
            featuresStyle,
          ]}
        >
          {[
            { icon: 'flash' as const, text: 'Spaced repetition that actually works' },
            { icon: 'school' as const, text: 'AI-powered Socratic & Feynman modes' },
            { icon: 'headset' as const, text: 'Learn while you listen' },
            { icon: 'skull' as const, text: 'Put skin in the game' },
          ].map((item, i) => (
            <View
              key={item.icon}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: Spacing.md,
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: BorderRadius.sm,
                  backgroundColor: Colors.surface,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Ionicons name={item.icon} size={20} color={Colors.primary} />
              </View>
              <Text
                style={{
                  color: Colors.textSecondary,
                  fontSize: 15,
                  flex: 1,
                }}
              >
                {item.text}
              </Text>
            </View>
          ))}
        </Animated.View>

        {/* CTA */}
        <Animated.View
          style={[
            {
              width: '100%',
              maxWidth: 320,
              marginTop: Spacing.xxl,
            },
            buttonStyle,
          ]}
        >
          <Pressable
            onPress={handleNext}
            style={({ pressed }) => ({
              backgroundColor: Colors.primary,
              paddingVertical: Spacing.md + 2,
              borderRadius: BorderRadius.md,
              alignItems: 'center',
              opacity: pressed ? 0.85 : 1,
              transform: [{ scale: pressed ? 0.98 : 1 }],
            })}
          >
            <Text
              style={{
                color: '#fff',
                fontSize: 18,
                fontWeight: '700',
              }}
            >
              Get Started
            </Text>
          </Pressable>

          <Text
            style={{
              color: Colors.textSecondary,
              fontSize: 13,
              textAlign: 'center',
              marginTop: Spacing.md,
            }}
          >
            Takes less than a minute
          </Text>
        </Animated.View>
      </View>
    </SafeAreaView>
  )
}
