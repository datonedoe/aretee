import { useEffect } from 'react'
import { Platform } from 'react-native'

export function useKeyboardShortcuts(onKeyPress: (key: string) => void) {
  useEffect(() => {
    if (Platform.OS !== 'web') return

    const handler = (e: KeyboardEvent) => {
      // Ignore when typing in inputs
      const target = e.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return
      }

      onKeyPress(e.key)
    }

    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onKeyPress])
}
