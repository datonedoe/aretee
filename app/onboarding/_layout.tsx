import { Stack } from 'expo-router'
import { Colors } from '../../src/utils/constants'

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background },
        animation: 'slide_from_right',
        gestureEnabled: true,
      }}
    >
      <Stack.Screen name="welcome" options={{ animation: 'fade' }} />
      <Stack.Screen name="interests" />
      <Stack.Screen name="goals" />
      <Stack.Screen name="vault-setup" />
      <Stack.Screen name="ready" options={{ animation: 'fade', gestureEnabled: false }} />
    </Stack>
  )
}
