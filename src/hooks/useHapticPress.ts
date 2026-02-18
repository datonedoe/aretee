/**
 * useHapticPress — Consistent haptic-wrapped press handlers
 * Avoids creating new closures on every render.
 */
import { useCallback, useRef } from 'react'
import { hapticLight, hapticMedium, hapticHeavy, hapticSelection } from '../services/haptics'

type HapticStyle = 'light' | 'medium' | 'heavy' | 'selection'

const hapticMap = {
  light: hapticLight,
  medium: hapticMedium,
  heavy: hapticHeavy,
  selection: hapticSelection,
} as const

/**
 * Wraps a press handler with haptic feedback.
 * Stable reference — won't cause re-renders.
 */
export function useHapticPress<T extends (...args: any[]) => any>(
  handler: T,
  style: HapticStyle = 'medium'
): T {
  const handlerRef = useRef(handler)
  handlerRef.current = handler

  return useCallback(
    ((...args: any[]) => {
      hapticMap[style]()
      return handlerRef.current(...args)
    }) as unknown as T,
    [style]
  )
}
