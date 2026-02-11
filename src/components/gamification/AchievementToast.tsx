import { useEffect } from 'react'
import { View, Text } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withTiming,
  runOnJS,
  SlideInUp,
  SlideOutUp,
} from 'react-native-reanimated'
import { Ionicons } from '@expo/vector-icons'
import { Colors, Spacing, BorderRadius } from '../../utils/constants'
import { AchievementDefinition, RARITY_COLORS } from '../../types'

interface AchievementToastProps {
  achievement: AchievementDefinition
  onDismiss: () => void
}

export function AchievementToast({ achievement, onDismiss }: AchievementToastProps) {
  const rarityColor = RARITY_COLORS[achievement.rarity]

  useEffect(() => {
    const timer = setTimeout(onDismiss, 4000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <Animated.View
      entering={SlideInUp.springify().damping(15).stiffness(150)}
      exiting={SlideOutUp.duration(300)}
      style={{
        position: 'absolute',
        top: 60,
        left: Spacing.lg,
        right: Spacing.lg,
        zIndex: 200,
      }}
    >
      <View
        style={{
          backgroundColor: Colors.surface,
          borderRadius: BorderRadius.lg,
          padding: Spacing.md,
          flexDirection: 'row',
          alignItems: 'center',
          gap: Spacing.md,
          borderWidth: 1,
          borderColor: rarityColor + '60',
          shadowColor: rarityColor,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 12,
          elevation: 8,
        }}
      >
        {/* Icon */}
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: rarityColor + '20',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Ionicons
            name={achievement.icon as keyof typeof Ionicons.glyphMap}
            size={24}
            color={rarityColor}
          />
        </View>

        {/* Text */}
        <View style={{ flex: 1 }}>
          <Text style={{ color: Colors.textSecondary, fontSize: 11, fontWeight: '600', letterSpacing: 1 }}>
            ACHIEVEMENT UNLOCKED
          </Text>
          <Text style={{ color: Colors.text, fontSize: 15, fontWeight: '700', marginTop: 2 }}>
            {achievement.name}
          </Text>
          <Text style={{ color: rarityColor, fontSize: 12, marginTop: 1 }}>
            {achievement.rarity} — {achievement.description}
          </Text>
        </View>
      </View>
    </Animated.View>
  )
}
