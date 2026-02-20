import { useCallback } from 'react'
import { Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { Colors } from '../../src/utils/constants'
import { MiniPlayer } from '../../src/components/audio/MiniPlayer'
import { hapticSelection } from '../../src/services/haptics'

export default function TabLayout() {
  const router = useRouter()

  const handleExpandPlayer = useCallback(() => {
    router.push('/audio/player')
  }, [router])

  return (
    <>
      <Tabs
        screenListeners={{
          tabPress: () => hapticSelection(),
        }}
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: Colors.surface,
            borderTopColor: Colors.border,
            borderTopWidth: 1,
            height: 85,
            paddingBottom: 30,
            paddingTop: 8,
            maxWidth: 768,
            alignSelf: 'center',
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
          name="immerse"
          options={{
            title: 'Immerse',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="earth" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="converse"
          options={{
            title: 'Converse',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="chatbubble-ellipses" size={size} color={color} />
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
          name="analytics"
          options={{
            title: 'Analytics',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="stats-chart" size={size} color={color} />
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
