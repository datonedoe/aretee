import React, { useCallback, useEffect, useState } from 'react'
import { View, Text, Pressable, ScrollView } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  FadeInDown,
} from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { Colors, Spacing, BorderRadius } from '../../src/utils/constants'
import { useOnboardingStore } from '../../src/stores/onboardingStore'
import { AnimatedProgressBar } from '../../src/components/onboarding/AnimatedProgressBar'
import {
  hapticLight,
  hapticMedium,
  hapticSuccess,
  hapticError,
} from '../../src/services/haptics'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

/**
 * Placement quiz questions — one per interest area.
 * Each has 3 difficulty tiers. The user's score determines initial card difficulty.
 */
const PLACEMENT_QUESTIONS = [
  {
    id: 'vocab',
    category: '🌍 Vocabulary',
    question: 'What does "ubiquitous" mean?',
    options: [
      { text: 'Very rare', correct: false },
      { text: 'Found everywhere', correct: true },
      { text: 'Difficult to see', correct: false },
      { text: 'Moving quickly', correct: false },
    ],
  },
  {
    id: 'logic',
    category: '🧠 Logic',
    question: 'If all roses are flowers, and some flowers fade quickly, which must be true?',
    options: [
      { text: 'All roses fade quickly', correct: false },
      { text: 'Some roses fade quickly', correct: false },
      { text: 'None of the above necessarily', correct: true },
      { text: 'No roses fade quickly', correct: false },
    ],
  },
  {
    id: 'math',
    category: '📐 Math',
    question: 'What is the derivative of x²?',
    options: [
      { text: 'x', correct: false },
      { text: '2x', correct: true },
      { text: 'x²', correct: false },
      { text: '2', correct: false },
    ],
  },
  {
    id: 'science',
    category: '🔬 Science',
    question: 'Which particle has no electric charge?',
    options: [
      { text: 'Proton', correct: false },
      { text: 'Electron', correct: false },
      { text: 'Neutron', correct: true },
      { text: 'Photon', correct: false },
    ],
  },
  {
    id: 'general',
    category: '✨ General',
    question: 'The Socratic method primarily involves:',
    options: [
      { text: 'Lecturing with slides', correct: false },
      { text: 'Asking probing questions', correct: true },
      { text: 'Memorizing facts', correct: false },
      { text: 'Writing essays', correct: false },
    ],
  },
]

export default function PlacementScreen() {
  const router = useRouter()
  const { setStep } = useOnboardingStore()

  const [currentQ, setCurrentQ] = useState(0)
  const [score, setScore] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [isRevealed, setIsRevealed] = useState(false)
  const [isComplete, setIsComplete] = useState(false)

  const fadeValue = useSharedValue(0)
  const slideValue = useSharedValue(30)
  const resultScaleValue = useSharedValue(0)

  useEffect(() => {
    fadeValue.value = withTiming(1, { duration: 500 })
    slideValue.value = withTiming(0, { duration: 500 })
  }, [])

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: fadeValue.value,
    transform: [{ translateY: slideValue.value }],
  }))

  const resultStyle = useAnimatedStyle(() => ({
    transform: [{ scale: resultScaleValue.value }],
    opacity: resultScaleValue.value,
  }))

  const question = PLACEMENT_QUESTIONS[currentQ]

  const handleSelect = useCallback(
    (index: number) => {
      if (isRevealed) return
      hapticLight()
      setSelectedAnswer(index)
    },
    [isRevealed]
  )

  const handleConfirm = useCallback(() => {
    if (selectedAnswer === null) return

    const correct = question.options[selectedAnswer].correct
    if (correct) {
      hapticSuccess()
      setScore((s) => s + 1)
    } else {
      hapticError()
    }

    setIsRevealed(true)

    // Auto-advance after brief delay
    setTimeout(() => {
      if (currentQ < PLACEMENT_QUESTIONS.length - 1) {
        setCurrentQ((q) => q + 1)
        setSelectedAnswer(null)
        setIsRevealed(false)
      } else {
        setIsComplete(true)
        resultScaleValue.value = withSpring(1, { damping: 8, stiffness: 80 })
        hapticSuccess()
      }
    }, 1200)
  }, [selectedAnswer, question, currentQ, resultScaleValue])

  const handleNext = useCallback(() => {
    hapticMedium()
    setStep('vault-setup')
    router.push('/onboarding/vault-setup')
  }, [setStep, router])

  const handleSkip = useCallback(() => {
    hapticLight()
    setStep('vault-setup')
    router.push('/onboarding/vault-setup')
  }, [setStep, router])

  const handleBack = useCallback(() => {
    router.back()
  }, [router])

  // Determine level label from score
  const getLevel = () => {
    if (score >= 4) return { label: 'Advanced', color: Colors.primary, icon: '🏆' as const }
    if (score >= 2) return { label: 'Intermediate', color: Colors.accent, icon: '📚' as const }
    return { label: 'Beginner', color: Colors.success, icon: '🌱' as const }
  }

  // Completion screen
  if (isComplete) {
    const level = getLevel()
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
          <Animated.View style={[{ alignItems: 'center' }, resultStyle]}>
            <Text style={{ fontSize: 64 }}>{level.icon}</Text>
            <Text
              style={{
                color: Colors.text,
                fontSize: 28,
                fontWeight: '900',
                marginTop: Spacing.lg,
              }}
            >
              {level.label}
            </Text>
            <Text
              style={{
                color: Colors.textSecondary,
                fontSize: 15,
                marginTop: Spacing.sm,
                textAlign: 'center',
                lineHeight: 22,
              }}
            >
              {score}/{PLACEMENT_QUESTIONS.length} correct — we'll calibrate your
              experience accordingly.
            </Text>
          </Animated.View>

          <View style={{ width: '100%', maxWidth: 320, marginTop: Spacing.xxl }}>
            <Pressable
              onPress={handleNext}
              style={({ pressed }) => ({
                backgroundColor: Colors.primary,
                paddingVertical: Spacing.md + 2,
                borderRadius: BorderRadius.md,
                alignItems: 'center',
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <Text
                style={{ color: '#fff', fontSize: 17, fontWeight: '700' }}
              >
                Continue
              </Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <Animated.View
        style={[{ flex: 1, padding: Spacing.lg }, animatedStyle]}
      >
        {/* Back + Progress */}
        <Pressable
          onPress={handleBack}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            marginBottom: Spacing.md,
          }}
        >
          <Ionicons
            name="chevron-back"
            size={20}
            color={Colors.textSecondary}
          />
          <Text style={{ color: Colors.textSecondary, fontSize: 15 }}>
            Back
          </Text>
        </Pressable>

        <AnimatedProgressBar currentStep={3} />

        {/* Question counter */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Text
            style={{ color: Colors.text, fontSize: 28, fontWeight: '800' }}
          >
            Quick quiz
          </Text>
          <Text style={{ color: Colors.textSecondary, fontSize: 14 }}>
            {currentQ + 1}/{PLACEMENT_QUESTIONS.length}
          </Text>
        </View>
        <Text
          style={{
            color: Colors.textSecondary,
            fontSize: 15,
            marginTop: Spacing.xs,
            lineHeight: 22,
          }}
        >
          Helps us calibrate your starting difficulty. No pressure!
        </Text>

        {/* Category badge */}
        <View
          style={{
            backgroundColor: Colors.surface,
            borderRadius: BorderRadius.full,
            paddingHorizontal: Spacing.md,
            paddingVertical: Spacing.xs,
            alignSelf: 'flex-start',
            marginTop: Spacing.lg,
          }}
        >
          <Text
            style={{
              color: Colors.primary,
              fontSize: 13,
              fontWeight: '600',
            }}
          >
            {question.category}
          </Text>
        </View>

        {/* Question */}
        <Text
          style={{
            color: Colors.text,
            fontSize: 20,
            fontWeight: '600',
            marginTop: Spacing.md,
            lineHeight: 28,
          }}
        >
          {question.question}
        </Text>

        {/* Options */}
        <ScrollView
          style={{ marginTop: Spacing.lg }}
          contentContainerStyle={{ gap: Spacing.sm }}
          showsVerticalScrollIndicator={false}
        >
          {question.options.map((option, index) => {
            const isSelected = selectedAnswer === index
            const isCorrect = option.correct
            let bgColor: string = Colors.surface
            let borderColor: string = Colors.border
            let textColor: string = Colors.text

            if (isRevealed) {
              if (isCorrect) {
                bgColor = Colors.success + '20'
                borderColor = Colors.success
                textColor = Colors.success
              } else if (isSelected && !isCorrect) {
                bgColor = Colors.error + '20'
                borderColor = Colors.error
                textColor = Colors.error
              }
            } else if (isSelected) {
              bgColor = Colors.primary + '20'
              borderColor = Colors.primary
              textColor = Colors.primary
            }

            return (
              <AnimatedPressable
                key={index}
                entering={FadeInDown.delay(index * 80)
                  .springify()
                  .damping(18)}
                onPress={() => handleSelect(index)}
                style={({ pressed }) => ({
                  backgroundColor: bgColor,
                  borderRadius: BorderRadius.lg,
                  padding: Spacing.lg,
                  borderWidth: 2,
                  borderColor,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: Spacing.md,
                  opacity: pressed && !isRevealed ? 0.85 : 1,
                })}
              >
                <View
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    backgroundColor: isSelected
                      ? borderColor
                      : Colors.surfaceLight,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Text
                    style={{
                      color: isSelected ? '#fff' : Colors.textSecondary,
                      fontSize: 13,
                      fontWeight: '700',
                    }}
                  >
                    {String.fromCharCode(65 + index)}
                  </Text>
                </View>
                <Text
                  style={{
                    color: textColor,
                    fontSize: 16,
                    fontWeight: '600',
                    flex: 1,
                  }}
                >
                  {option.text}
                </Text>
                {isRevealed && isCorrect && (
                  <Ionicons
                    name="checkmark-circle"
                    size={22}
                    color={Colors.success}
                  />
                )}
                {isRevealed && isSelected && !isCorrect && (
                  <Ionicons
                    name="close-circle"
                    size={22}
                    color={Colors.error}
                  />
                )}
              </AnimatedPressable>
            )
          })}
        </ScrollView>

        {/* Footer */}
        <View
          style={{
            paddingTop: Spacing.md,
            borderTopWidth: 1,
            borderTopColor: Colors.border,
            flexDirection: 'row',
            gap: Spacing.sm,
          }}
        >
          <Pressable
            onPress={handleSkip}
            style={({ pressed }) => ({
              flex: 1,
              backgroundColor: Colors.surface,
              paddingVertical: Spacing.md + 2,
              borderRadius: BorderRadius.md,
              alignItems: 'center',
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <Text
              style={{
                color: Colors.textSecondary,
                fontSize: 15,
                fontWeight: '600',
              }}
            >
              Skip Quiz
            </Text>
          </Pressable>
          {!isRevealed && (
            <Pressable
              onPress={handleConfirm}
              disabled={selectedAnswer === null}
              style={({ pressed }) => ({
                flex: 2,
                backgroundColor:
                  selectedAnswer !== null ? Colors.primary : Colors.surface,
                paddingVertical: Spacing.md + 2,
                borderRadius: BorderRadius.md,
                alignItems: 'center',
                opacity:
                  pressed && selectedAnswer !== null
                    ? 0.85
                    : selectedAnswer !== null
                      ? 1
                      : 0.5,
              })}
            >
              <Text
                style={{
                  color:
                    selectedAnswer !== null ? '#fff' : Colors.textSecondary,
                  fontSize: 15,
                  fontWeight: '700',
                }}
              >
                Confirm
              </Text>
            </Pressable>
          )}
        </View>
      </Animated.View>
    </SafeAreaView>
  )
}
