import { useEffect, useRef } from 'react'
import { View, Text, Animated } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors, Spacing, BorderRadius } from '../../utils/constants'

interface DialogueBubbleProps {
  role: 'user' | 'assistant'
  content: string
  isInsight?: boolean
  isStreaming?: boolean
  index: number
}

export function DialogueBubble({
  role,
  content,
  isInsight,
  isStreaming,
  index,
}: DialogueBubbleProps) {
  const isUser = role === 'user'
  const opacity = useRef(new Animated.Value(0)).current
  const translateY = useRef(new Animated.Value(20)).current

  useEffect(() => {
    const delay = Math.min(index * 50, 200)
    Animated.parallel([
      Animated.spring(opacity, {
        toValue: 1,
        damping: 20,
        stiffness: 200,
        delay,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        damping: 20,
        stiffness: 200,
        delay,
        useNativeDriver: true,
      }),
    ]).start()
  }, [index, opacity, translateY])

  return (
    <Animated.View
      style={{
        flexDirection: 'row',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        marginBottom: Spacing.sm,
        paddingHorizontal: Spacing.md,
        opacity,
        transform: [{ translateY }],
      }}
    >
      {/* Socrates avatar */}
      {!isUser && (
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: isInsight ? Colors.accent + '30' : Colors.primary + '30',
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: Spacing.sm,
            marginTop: 4,
          }}
        >
          <Ionicons
            name={isInsight ? 'bulb' : 'school'}
            size={16}
            color={isInsight ? Colors.accent : Colors.primary}
          />
        </View>
      )}

      <View
        style={{
          maxWidth: '75%',
          backgroundColor: isUser
            ? Colors.primary
            : isInsight
              ? Colors.accent + '15'
              : Colors.surface,
          borderRadius: BorderRadius.lg,
          borderTopLeftRadius: isUser ? BorderRadius.lg : 4,
          borderTopRightRadius: isUser ? 4 : BorderRadius.lg,
          padding: Spacing.md,
          borderWidth: isInsight ? 1 : 0,
          borderColor: isInsight ? Colors.accent + '40' : undefined,
        }}
      >
        <Text
          style={{
            color: isUser
              ? '#FFFFFF'
              : isInsight
                ? Colors.accent
                : Colors.text,
            fontSize: 15,
            lineHeight: 22,
          }}
        >
          {content}
          {isStreaming && (
            <Text style={{ color: Colors.textSecondary }}>|</Text>
          )}
        </Text>
      </View>
    </Animated.View>
  )
}
