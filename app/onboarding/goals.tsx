import React, { useCallback, useEffect } from 'react'
import { View, Text, Pressable, ScrollView } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  FadeInDown,
} from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { Colors, Spacing, BorderRadius } from '../../src/utils/constants'
import { useOnboardingStore, GOAL_OPTIONS } from '../../src/stores/onboardingStore'
import { AnimatedProgressBar } from '../../src/components/onboarding/AnimatedProgressBar'
import { hapticLight, hapticMedium } from '../../src/services/haptics'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

export default function GoalsScreen() {
  const router = useRouter()
  const { goals, setGoals, setStep } = useOnboardingStore()

  const fadeValue = useSharedValue(0)
  const slideValue = useSharedValue(30)

  useEffect(() => {
    fadeValue.value = withTiming(1, { duration: 500 })
    slideValue.value = withTiming(0, { duration: 500 })
  }, [])

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: fadeValue.value,
    transform: [{ translateY: slideValue.value }],
  }))

  const toggleGoal = useCallback(
    (id: string) => {
      hapticLight()
      if (goals.includes(id)) {
        setGoals(goals.filter((g) => g !== id))
      } else {
        setGoals([...goals, id])
      }
    },
    [goals, setGoals]
  )

  const handleNext = useCallback(() => {
    hapticMedium()
    setStep('vault-setup')
    router.push('/onboarding/vault-setup')
  }, [setStep, router])

  const handleBack = useCallback(() => {
    router.back()
  }, [router])

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      {/* Header */}
      <Animated.View
        style={[
          {
            padding: Spacing.lg,
            paddingBottom: Spacing.sm,
          },
          animatedStyle,
        ]}
      >
        <Pressable
          onPress={handleBack}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: Spacing.md }}
        >
          <Ionicons name="chevron-back" size={20} color={Colors.textSecondary} />
          <Text style={{ color: Colors.textSecondary, fontSize: 15 }}>Back</Text>
        </Pressable>

        {/* Progress */}
        <AnimatedProgressBar currentStep="goals" />

        <Text style={{ color: Colors.text, fontSize: 28, fontWeight: '800' }}>
          What's your goal?
        </Text>
        <Text
          style={{
            color: Colors.textSecondary,
            fontSize: 15,
            marginTop: Spacing.xs,
            lineHeight: 22,
          }}
        >
          We'll tune the experience to match your learning style.
        </Text>
      </Animated.View>

      {/* Goal List */}
      <ScrollView
        contentContainerStyle={{
          padding: Spacing.lg,
          paddingTop: Spacing.sm,
          gap: Spacing.sm,
        }}
        showsVerticalScrollIndicator={false}
      >
        {GOAL_OPTIONS.map((option, index) => {
          const isSelected = goals.includes(option.id)
          return (
            <AnimatedPressable
              key={option.id}
              entering={FadeInDown.delay(index * 80).springify().damping(18)}
              onPress={() => toggleGoal(option.id)}
              style={({ pressed }) => ({
                backgroundColor: isSelected ? Colors.primary + '20' : Colors.surface,
                borderRadius: BorderRadius.lg,
                padding: Spacing.lg,
                borderWidth: 2,
                borderColor: isSelected ? Colors.primary : Colors.border,
                flexDirection: 'row',
                alignItems: 'center',
                gap: Spacing.md,
                opacity: pressed ? 0.85 : 1,
                transform: [{ scale: pressed ? 0.98 : 1 }],
              })}
            >
              <Text style={{ fontSize: 32 }}>{option.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    color: isSelected ? Colors.primary : Colors.text,
                    fontSize: 17,
                    fontWeight: '700',
                  }}
                >
                  {option.label}
                </Text>
                <Text
                  style={{
                    color: Colors.textSecondary,
                    fontSize: 13,
                    marginTop: 2,
                  }}
                >
                  {option.description}
                </Text>
              </View>
              {isSelected && (
                <View
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 13,
                    backgroundColor: Colors.primary,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Ionicons name="checkmark" size={16} color="#fff" />
                </View>
              )}
            </AnimatedPressable>
          )
        })}
      </ScrollView>

      {/* Footer */}
      <View
        style={{
          padding: Spacing.lg,
          paddingTop: Spacing.sm,
          borderTopWidth: 1,
          borderTopColor: Colors.border,
        }}
      >
        <Pressable
          onPress={handleNext}
          style={({ pressed }) => ({
            backgroundColor: goals.length > 0 ? Colors.primary : Colors.surface,
            paddingVertical: Spacing.md + 2,
            borderRadius: BorderRadius.md,
            alignItems: 'center',
            opacity: pressed ? 0.85 : 1,
          })}
        >
          <Text
            style={{
              color: goals.length > 0 ? '#fff' : Colors.textSecondary,
              fontSize: 17,
              fontWeight: '700',
            }}
          >
            {goals.length > 0 ? 'Continue' : 'Skip for now'}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  )
}
