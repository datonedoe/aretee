import { useCallback } from 'react'
import { Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { Colors } from '../../src/utils/constants'
import { MiniPlayer } from '../../src/components/audio/MiniPlayer'

export default function TabLayout() {
  const router = useRouter()

  const handleExpandPlayer = useCallback(() => {
    router.push('/audio/player')
  }, [router])

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: Colors.surface,
            borderTopColor: Colors.border,
            borderTopWidth: 1,
            height: 85,
            paddingBottom: 30,
            paddingTop: 8,
          },
          tabBarActiveTintColor: Colors.primary,
          tabBarInactiveTintColor: Colors.textSecondary,
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Flash',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="flash" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="listen"
          options={{
            title: 'Listen',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="headset" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="skinup"
          options={{
            title: 'SkinUP',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="skull" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="person" size={size} color={color} />
            ),
          }}
        />
      </Tabs>
      <MiniPlayer onExpand={handleExpandPlayer} />
    </>
  )
}
