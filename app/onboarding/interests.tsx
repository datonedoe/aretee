import React, { useCallback, useEffect } from 'react'
import { View, Text, Pressable, ScrollView } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  FadeInDown,
} from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { Colors, Spacing, BorderRadius } from '../../src/utils/constants'
import { useOnboardingStore, INTEREST_OPTIONS } from '../../src/stores/onboardingStore'
import { AnimatedProgressBar } from '../../src/components/onboarding/AnimatedProgressBar'
import { hapticLight, hapticMedium } from '../../src/services/haptics'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

export default function InterestsScreen() {
  const router = useRouter()
  const { interests, setInterests, setStep } = useOnboardingStore()

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

  const toggleInterest = useCallback(
    (id: string) => {
      hapticLight()
      if (interests.includes(id)) {
        setInterests(interests.filter((i) => i !== id))
      } else {
        setInterests([...interests, id])
      }
    },
    [interests, setInterests]
  )

  const handleNext = useCallback(() => {
    hapticMedium()
    setStep('goals')
    router.push('/onboarding/goals')
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
        <AnimatedProgressBar currentStep="interests" />

        <Text style={{ color: Colors.text, fontSize: 28, fontWeight: '800' }}>
          What do you want to learn?
        </Text>
        <Text
          style={{
            color: Colors.textSecondary,
            fontSize: 15,
            marginTop: Spacing.xs,
            lineHeight: 22,
          }}
        >
          Pick as many as you like. This helps us personalize your experience.
        </Text>
      </Animated.View>

      {/* Interest Grid */}
      <ScrollView
        contentContainerStyle={{
          padding: Spacing.lg,
          paddingTop: Spacing.sm,
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: Spacing.sm,
        }}
        showsVerticalScrollIndicator={false}
      >
        {INTEREST_OPTIONS.map((option, index) => {
          const isSelected = interests.includes(option.id)
          return (
            <AnimatedPressable
              key={option.id}
              entering={FadeInDown.delay(index * 60).springify().damping(18)}
              onPress={() => toggleInterest(option.id)}
              style={({ pressed }) => ({
                width: '48%',
                backgroundColor: isSelected ? Colors.primary + '20' : Colors.surface,
                borderRadius: BorderRadius.lg,
                padding: Spacing.md,
                borderWidth: 2,
                borderColor: isSelected ? Colors.primary : Colors.border,
                opacity: pressed ? 0.85 : 1,
                transform: [{ scale: pressed ? 0.97 : 1 }],
              })}
            >
              <Text style={{ fontSize: 28 }}>{option.icon}</Text>
              <Text
                style={{
                  color: isSelected ? Colors.primary : Colors.text,
                  fontSize: 16,
                  fontWeight: '700',
                  marginTop: Spacing.xs,
                }}
              >
                {option.label}
              </Text>
              <Text
                style={{
                  color: Colors.textSecondary,
                  fontSize: 12,
                  marginTop: 2,
                }}
              >
                {option.description}
              </Text>
              {isSelected && (
                <View
                  style={{
                    position: 'absolute',
                    top: 10,
                    right: 10,
                    width: 22,
                    height: 22,
                    borderRadius: 11,
                    backgroundColor: Colors.primary,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Ionicons name="checkmark" size={14} color="#fff" />
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
            backgroundColor: interests.length > 0 ? Colors.primary : Colors.surface,
            paddingVertical: Spacing.md + 2,
            borderRadius: BorderRadius.md,
            alignItems: 'center',
            opacity: pressed ? 0.85 : 1,
          })}
        >
          <Text
            style={{
              color: interests.length > 0 ? '#fff' : Colors.textSecondary,
              fontSize: 17,
              fontWeight: '700',
            }}
          >
            {interests.length > 0 ? `Continue (${interests.length} selected)` : 'Skip for now'}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  )
}
