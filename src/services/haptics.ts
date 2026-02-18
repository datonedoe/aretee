/**
 * Haptic feedback service for Aretee
 * Provides consistent haptic patterns throughout the app.
 * Falls back silently on web or unsupported platforms.
 */
import { Platform } from 'react-native'

type ImpactStyle = 'light' | 'medium' | 'heavy'
type NotificationType = 'success' | 'warning' | 'error'

// Lazy-load expo-haptics only on native
let Haptics: typeof import('expo-haptics') | null = null

async function getHaptics() {
  if (Platform.OS === 'web') return null
  if (!Haptics) {
    try {
      Haptics = await import('expo-haptics')
    } catch {
      return null
    }
  }
  return Haptics
}

/** Light tap — button presses, selections */
export async function hapticLight() {
  const h = await getHaptics()
  h?.impactAsync(h.ImpactFeedbackStyle.Light)
}

/** Medium tap — card flips, tab switches */
export async function hapticMedium() {
  const h = await getHaptics()
  h?.impactAsync(h.ImpactFeedbackStyle.Medium)
}

/** Heavy tap — major actions, confirmations */
export async function hapticHeavy() {
  const h = await getHaptics()
  h?.impactAsync(h.ImpactFeedbackStyle.Heavy)
}

/** Success notification — correct answer, achievement unlocked */
export async function hapticSuccess() {
  const h = await getHaptics()
  h?.notificationAsync(h.NotificationFeedbackType.Success)
}

/** Warning notification — streak at risk, time running out */
export async function hapticWarning() {
  const h = await getHaptics()
  h?.notificationAsync(h.NotificationFeedbackType.Warning)
}

/** Error notification — wrong answer, failed action */
export async function hapticError() {
  const h = await getHaptics()
  h?.notificationAsync(h.NotificationFeedbackType.Error)
}

/** Selection change — scrolling through options, toggles */
export async function hapticSelection() {
  const h = await getHaptics()
  h?.selectionAsync()
}

/** Impact with custom style */
export async function hapticImpact(style: ImpactStyle = 'medium') {
  const h = await getHaptics()
  if (!h) return
  const map = {
    light: h.ImpactFeedbackStyle.Light,
    medium: h.ImpactFeedbackStyle.Medium,
    heavy: h.ImpactFeedbackStyle.Heavy,
  }
  h.impactAsync(map[style])
}

/** Notification with custom type */
export async function hapticNotification(type: NotificationType = 'success') {
  const h = await getHaptics()
  if (!h) return
  const map = {
    success: h.NotificationFeedbackType.Success,
    warning: h.NotificationFeedbackType.Warning,
    error: h.NotificationFeedbackType.Error,
  }
  h.notificationAsync(map[type])
}

/**
 * Celebration pattern — level up, big achievement
 * Rapid succession of impacts for a "burst" feel
 */
export async function hapticCelebration() {
  const h = await getHaptics()
  if (!h) return
  h.impactAsync(h.ImpactFeedbackStyle.Heavy)
  setTimeout(() => h.impactAsync(h.ImpactFeedbackStyle.Medium), 100)
  setTimeout(() => h.impactAsync(h.ImpactFeedbackStyle.Light), 200)
  setTimeout(() => h.notificationAsync(h.NotificationFeedbackType.Success), 350)
}
