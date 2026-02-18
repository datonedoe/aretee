/**
 * AnimatedProgressBar — Smooth animated progress indicator for onboarding.
 * Fills smoothly between steps instead of jumping.
 */
import React, { useEffect } from 'react'
import { View } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated'
import { Colors, Spacing } from '../../utils/constants'

const STEPS = ['welcome', 'interests', 'goals', 'vault-setup', 'ready'] as const

interface AnimatedProgressBarProps {
  /** Current step index (0-based) or step name */
  currentStep: number | typeof STEPS[number]
}

function AnimatedProgressBarInner({ currentStep }: AnimatedProgressBarProps) {
  const stepIndex =
    typeof currentStep === 'number'
      ? currentStep
      : STEPS.indexOf(currentStep as typeof STEPS[number])

  const progress = useSharedValue(0)

  useEffect(() => {
    // Progress from 0 to 1 based on step (0 = first step active, 4 = last)
    const target = (stepIndex + 1) / STEPS.length
    progress.value = withSpring(target, {
      damping: 20,
      stiffness: 90,
      mass: 0.8,
    })
  }, [stepIndex])

  const fillStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }))

  return (
    <View
      style={{
        flexDirection: 'row',
        gap: 6,
        marginBottom: Spacing.lg,
      }}
    >
      {STEPS.map((step, i) => (
        <View
          key={step}
          style={{
            flex: 1,
            height: 4,
            borderRadius: 2,
            backgroundColor: Colors.surface,
            overflow: 'hidden',
          }}
        >
          {i <= stepIndex && (
            <Animated.View
              style={[
                {
                  height: '100%',
                  borderRadius: 2,
                  backgroundColor: Colors.primary,
                },
                // Only animate the current step segment
                i === stepIndex
                  ? {
                      width: '100%',
                    }
                  : { width: '100%' },
              ]}
            />
          )}
        </View>
      ))}
    </View>
  )
}

export const AnimatedProgressBar = React.memo(AnimatedProgressBarInner)
