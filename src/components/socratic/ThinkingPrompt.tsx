import { useState, useRef, useEffect } from 'react'
import { View, TextInput, Pressable, Platform, KeyboardAvoidingView } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors, Spacing, BorderRadius } from '../../utils/constants'

interface ThinkingPromptProps {
  onSend: (message: string) => void
  disabled?: boolean
  placeholder?: string
}

export function ThinkingPrompt({
  onSend,
  disabled,
  placeholder = 'Share your thinking...',
}: ThinkingPromptProps) {
  const [text, setText] = useState('')
  const inputRef = useRef<TextInput>(null)

  const handleSend = () => {
    const trimmed = text.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setText('')
  }

  const handleKeyPress = (e: { nativeEvent: { key: string } }) => {
    // Submit on Enter (without Shift) on web
    if (Platform.OS === 'web' && e.nativeEvent.key === 'Enter') {
      // Check for shift key — React Native Web passes shiftKey on the native event
      const nativeEvent = e.nativeEvent as Record<string, unknown>
      if (!nativeEvent.shiftKey) {
        e.nativeEvent.key = '' // prevent newline
        handleSend()
      }
    }
  }

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'flex-end',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        backgroundColor: Colors.surface,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
        gap: Spacing.sm,
      }}
    >
      <TextInput
        ref={inputRef}
        value={text}
        onChangeText={setText}
        onKeyPress={handleKeyPress}
        placeholder={placeholder}
        placeholderTextColor={Colors.textSecondary}
        multiline
        maxLength={2000}
        editable={!disabled}
        style={[
          {
            flex: 1,
            backgroundColor: Colors.background,
            borderRadius: BorderRadius.md,
            paddingHorizontal: Spacing.md,
            paddingVertical: Spacing.sm,
            color: Colors.text,
            fontSize: 15,
            maxHeight: 120,
            minHeight: 40,
          },
          Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : undefined,
        ]}
      />

      <Pressable
        onPress={handleSend}
        disabled={!text.trim() || disabled}
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor:
            text.trim() && !disabled ? Colors.primary : Colors.surfaceLight,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Ionicons
          name="send"
          size={18}
          color={text.trim() && !disabled ? '#fff' : Colors.textSecondary}
        />
      </Pressable>
    </View>
  )
}
