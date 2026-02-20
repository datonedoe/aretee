/**
 * Lightweight react-native stub for Vitest.
 * Prevents Vite/Rollup from parsing RN's Flow-typed index.js.
 * Individual tests override via vi.mock('react-native', ...) as needed.
 */

export const Platform = {
  OS: 'ios' as const,
  select: <T>(obj: { ios?: T; android?: T; web?: T; default?: T }): T | undefined =>
    obj.ios ?? obj.default,
}

export const View = 'View'
export const Text = 'Text'
export const Pressable = 'Pressable'
export const FlatList = 'FlatList'
export const ActivityIndicator = 'ActivityIndicator'
export const ScrollView = 'ScrollView'
export const KeyboardAvoidingView = 'KeyboardAvoidingView'
export const TextInput = 'TextInput'
export const Alert = { alert: () => {} }
export const Linking = { openURL: async () => {} }
export const Animated = {
  Value: class {
    constructor(public _value: number) {}
  },
  timing: () => ({ start: (cb?: () => void) => cb?.() }),
  spring: () => ({ start: (cb?: () => void) => cb?.() }),
  View: 'Animated.View',
  Text: 'Animated.Text',
  createAnimatedComponent: (c: unknown) => c,
}
export const StyleSheet = {
  create: <T extends Record<string, unknown>>(styles: T): T => styles,
}
export const Dimensions = {
  get: () => ({ width: 375, height: 812, scale: 3, fontScale: 1 }),
}

export default {
  Platform,
  View,
  Text,
  Pressable,
  FlatList,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  TextInput,
  Alert,
  Linking,
  Animated,
  StyleSheet,
  Dimensions,
}
