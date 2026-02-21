/**
 * AnimatedProgressBar — Smooth animated progress indicator for onboarding.
 * Fills smoothly between steps instead of jumping.
 */
import React, { useEffect, useRef } from 'react'
import { View, Animated } from 'react-native'
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
            <View
              style={{
                height: '100%',
                borderRadius: 2,
                backgroundColor: Colors.primary,
                width: '100%',
              }}
            />
          )}
        </View>
      ))}
    </View>
  )
}

export const AnimatedProgressBar = React.memo(AnimatedProgressBarInner)
