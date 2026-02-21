import '../global.css'

import { useEffect, useState } from 'react'
import { Stack, useRouter, useSegments } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { View, ActivityIndicator } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { useSettingsStore } from '../src/stores/settingsStore'
import { useProfileStore } from '../src/stores/profileStore'
import { useOnboardingStore } from '../src/stores/onboardingStore'
import { Colors } from '../src/utils/constants'
import { isDemoMode } from '../src/utils/demo-data'

// Enable demo mode in dev builds when EXPO_PUBLIC_DEMO is set
if (__DEV__ && process.env.EXPO_PUBLIC_DEMO === '1') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { enableDemoMode } = require('../src/utils/demo-data')
  enableDemoMode()
}

function OnboardingGate({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const segments = useSegments()
  const { hasCompleted, isLoaded, loadOnboarding } = useOnboardingStore()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    loadOnboarding().then(() => setReady(true))
  }, [loadOnboarding])

  useEffect(() => {
    if (!ready) return

    const inOnboarding = segments[0] === 'onboarding'
    const inTabs = segments[0] === '(tabs)'

    // Skip onboarding if already completed (or demo mode)
    if (inOnboarding && (hasCompleted || isDemoMode())) {
      router.replace('/(tabs)')
      return
    }

    // Redirect to onboarding if not completed and not already there
    if (!inOnboarding && !inTabs && !hasCompleted && !isDemoMode()) {
      router.replace('/onboarding/welcome')
      return
    }
  }, [ready, hasCompleted, segments])

  if (!ready) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: Colors.background,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    )
  }

  return <>{children}</>
}

export default function RootLayout() {
  const loadSettings = useSettingsStore((s) => s.loadSettings)
  const loadProfile = useProfileStore((s) => s.loadProfile)

  useEffect(() => {
    loadSettings()
    loadProfile()
  }, [loadSettings, loadProfile])

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={{ flex: 1, backgroundColor: Colors.background }}>
        <StatusBar style="light" />
        <OnboardingGate>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: Colors.background },
              animation: 'slide_from_right',
            }}
          />
        </OnboardingGate>
      </View>
    </GestureHandlerRootView>
  )
}
