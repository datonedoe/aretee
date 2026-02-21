import { useEffect, useRef } from 'react'
import { View, Text, Pressable, Animated, Easing } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors, Spacing, BorderRadius } from '../../utils/constants'

interface InsightRevealProps {
  xpEarned: number
  onDismiss: () => void
}

export function InsightReveal({ xpEarned, onDismiss }: InsightRevealProps) {
  const scale = useRef(new Animated.Value(0.3)).current
  const opacity = useRef(new Animated.Value(0)).current
  const glowOpacity = useRef(new Animated.Value(0)).current
  const bulbScale = useRef(new Animated.Value(0)).current

  useEffect(() => {
    // Backdrop fade in
    Animated.timing(opacity, {
      toValue: 1,
      duration: 300,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start()

    // Card spring in
    Animated.spring(scale, {
      toValue: 1,
      damping: 12,
      stiffness: 200,
      mass: 0.5,
      useNativeDriver: true,
    }).start()

    // Bulb pulse (delayed)
    setTimeout(() => {
      Animated.sequence([
        Animated.spring(bulbScale, {
          toValue: 1.3,
          damping: 8,
          stiffness: 300,
          useNativeDriver: true,
        }),
        Animated.spring(bulbScale, {
          toValue: 1,
          damping: 15,
          stiffness: 200,
          useNativeDriver: true,
        }),
      ]).start()
    }, 200)

    // Glow pulse (delayed)
    setTimeout(() => {
      Animated.sequence([
        Animated.timing(glowOpacity, { toValue: 0.8, duration: 400, useNativeDriver: true }),
        Animated.timing(glowOpacity, { toValue: 0.3, duration: 600, useNativeDriver: true }),
        Animated.timing(glowOpacity, { toValue: 0.6, duration: 400, useNativeDriver: true }),
        Animated.timing(glowOpacity, { toValue: 0.3, duration: 600, useNativeDriver: true }),
      ]).start()
    }, 300)
  }, [scale, opacity, glowOpacity, bulbScale])

  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 100,
        opacity,
      }}
    >
      <Animated.View
        style={{
          backgroundColor: Colors.surface,
          borderRadius: BorderRadius.xl,
          padding: Spacing.xl,
          alignItems: 'center',
          width: '85%',
          maxWidth: 360,
          borderWidth: 1,
          borderColor: Colors.accent + '40',
          transform: [{ scale }],
        }}
      >
        {/* Glow ring */}
        <Animated.View
          style={{
            position: 'absolute',
            top: -20,
            width: 100,
            height: 100,
            borderRadius: 50,
            backgroundColor: Colors.accent + '20',
            opacity: glowOpacity,
          }}
        />

        {/* Bulb icon */}
        <Animated.View
          style={{
            width: 72,
            height: 72,
            borderRadius: 36,
            backgroundColor: Colors.accent + '20',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: Spacing.lg,
            transform: [{ scale: bulbScale }],
          }}
        >
          <Ionicons name="bulb" size={36} color={Colors.accent} />
        </Animated.View>

        <Text
          style={{
            color: Colors.accent,
            fontSize: 22,
            fontWeight: '800',
            marginBottom: Spacing.xs,
          }}
        >
          Insight Reached!
        </Text>

        <Text
          style={{
            color: Colors.textSecondary,
            fontSize: 14,
            textAlign: 'center',
            marginBottom: Spacing.lg,
            lineHeight: 20,
          }}
        >
          You discovered the answer through your own reasoning. This understanding runs
          deeper than memorization.
        </Text>

        {/* XP reward */}
        <View
          style={{
            backgroundColor: Colors.primary + '20',
            borderRadius: BorderRadius.md,
            paddingHorizontal: Spacing.lg,
            paddingVertical: Spacing.sm,
            flexDirection: 'row',
            alignItems: 'center',
            gap: Spacing.sm,
            marginBottom: Spacing.lg,
            borderWidth: 1,
            borderColor: Colors.primary + '40',
          }}
        >
          <Ionicons name="star" size={20} color={Colors.accent} />
          <Text style={{ color: Colors.accent, fontSize: 20, fontWeight: '800' }}>
            +{xpEarned} XP
          </Text>
        </View>

        <Pressable
          onPress={onDismiss}
          style={{
            backgroundColor: Colors.primary,
            paddingHorizontal: Spacing.xl,
            paddingVertical: Spacing.md,
            borderRadius: BorderRadius.md,
            width: '100%',
            alignItems: 'center',
          }}
        >
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>
            Continue
          </Text>
        </Pressable>
      </Animated.View>
    </Animated.View>
  )
}
