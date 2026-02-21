import { useEffect, useRef } from 'react'
import { View, Text, Animated } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors, Spacing, BorderRadius } from '../../utils/constants'
import { AchievementDefinition, RARITY_COLORS } from '../../types'
import { hapticSuccess } from '../../services/haptics'

interface AchievementToastProps {
  achievement: AchievementDefinition
  onDismiss: () => void
}

export function AchievementToast({ achievement, onDismiss }: AchievementToastProps) {
  const rarityColor = RARITY_COLORS[achievement.rarity]
  const translateY = useRef(new Animated.Value(-200)).current

  useEffect(() => {
    hapticSuccess()

    // Slide in from top
    Animated.spring(translateY, {
      toValue: 0,
      damping: 15,
      stiffness: 150,
      useNativeDriver: true,
    }).start()

    // Auto-dismiss after 4s (slide out)
    const timer = setTimeout(() => {
      Animated.timing(translateY, {
        toValue: -200,
        duration: 300,
        useNativeDriver: true,
      }).start(() => onDismiss())
    }, 4000)

    return () => clearTimeout(timer)
  }, [])

  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: 60,
        left: Spacing.lg,
        right: Spacing.lg,
        zIndex: 200,
        transform: [{ translateY }],
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
