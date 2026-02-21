/**
 * Sprint 12: Chat bubble for conversation mode.
 * Distinct from Socratic bubbles — shows character avatar and name.
 */

import { useEffect, useRef } from 'react'
import { View, Text, Animated } from 'react-native'
import { Colors, Spacing, BorderRadius } from '../../utils/constants'
import { Character } from '../../types/conversation'

interface ConversationBubbleProps {
  role: 'user' | 'character'
  content: string
  character?: Character
  isStreaming?: boolean
  index: number
}

export function ConversationBubble({
  role,
  content,
  character,
  isStreaming,
  index,
}: ConversationBubbleProps) {
  const isUser = role === 'user'
  const opacity = useRef(new Animated.Value(0)).current
  const translateY = useRef(new Animated.Value(20)).current

  useEffect(() => {
    const delay = Math.min(index * 40, 150)
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
      {/* Character avatar */}
      {!isUser && (
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: Colors.primary + '25',
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: Spacing.sm,
            marginTop: 4,
          }}
        >
          <Text style={{ fontSize: 18 }}>
            {character?.avatarEmoji ?? '🗣️'}
          </Text>
        </View>
      )}

      <View style={{ maxWidth: '75%' }}>
        {/* Character name label */}
        {!isUser && character && (
          <Text
            style={{
              color: Colors.textSecondary,
              fontSize: 11,
              fontWeight: '600',
              marginBottom: 2,
              marginLeft: 4,
            }}
          >
            {character.name}
          </Text>
        )}

        <View
          style={{
            backgroundColor: isUser ? Colors.primary : Colors.surface,
            borderRadius: BorderRadius.lg,
            borderTopLeftRadius: isUser ? BorderRadius.lg : 4,
            borderTopRightRadius: isUser ? 4 : BorderRadius.lg,
            padding: Spacing.md,
            borderWidth: isUser ? 0 : 1,
            borderColor: Colors.border,
          }}
        >
          <Text
            style={{
              color: isUser ? '#FFFFFF' : Colors.text,
              fontSize: 15,
              lineHeight: 22,
            }}
          >
            {content}
            {isStreaming && (
              <Text style={{ color: Colors.textSecondary }}>▋</Text>
            )}
          </Text>
        </View>
      </View>
    </Animated.View>
  )
}
