import { useState, useRef, useCallback } from 'react'
import { View, Text, TextInput, Pressable, Platform } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors, Spacing, BorderRadius } from '../../utils/constants'
import {
  isSpeechRecognitionAvailable,
  startListening,
  stopListening,
} from '../../services/speech/recognition'

interface ExplainInputProps {
  concept: string
  onSubmit: (explanation: string) => void
  disabled?: boolean
}

export function ExplainInput({
  concept,
  onSubmit,
  disabled,
}: ExplainInputProps) {
  const [text, setText] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [partialTranscript, setPartialTranscript] = useState('')
  const inputRef = useRef<TextInput>(null)
  const voiceAvailable = isSpeechRecognitionAvailable()

  const handleSubmit = () => {
    const trimmed = text.trim()
    if (!trimmed || disabled) return
    onSubmit(trimmed)
  }

  const handleVoiceToggle = useCallback(() => {
    if (isRecording) {
      stopListening()
      setIsRecording(false)
      setPartialTranscript('')
    } else {
      setIsRecording(true)
      startListening({
        onResult: (transcript) => {
          setText((prev) => (prev ? prev + ' ' + transcript : transcript))
          setPartialTranscript('')
        },
        onPartial: (transcript) => {
          setPartialTranscript(transcript)
        },
        onEnd: () => {
          setIsRecording(false)
          setPartialTranscript('')
        },
        onError: () => {
          setIsRecording(false)
          setPartialTranscript('')
        },
      })
    }
  }, [isRecording])

  const wordCount = text.trim().split(/\s+/).filter(Boolean).length

  return (
    <View style={{ flex: 1 }}>
      {/* Concept card */}
      <View
        style={{
          backgroundColor: Colors.surface,
          borderRadius: BorderRadius.lg,
          padding: Spacing.lg,
          marginHorizontal: Spacing.md,
          marginTop: Spacing.md,
          borderWidth: 1,
          borderColor: Colors.primary + '40',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
          <Ionicons name="bulb-outline" size={16} color={Colors.accent} />
          <Text
            style={{
              color: Colors.textSecondary,
              fontSize: 12,
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}
          >
            Explain this concept
          </Text>
        </View>
        <Text
          style={{
            color: Colors.text,
            fontSize: 18,
            fontWeight: '700',
            marginTop: Spacing.sm,
            lineHeight: 26,
          }}
        >
          {concept}
        </Text>
        <Text
          style={{
            color: Colors.textSecondary,
            fontSize: 13,
            marginTop: Spacing.sm,
            fontStyle: 'italic',
          }}
        >
          Explain as if to a 12-year-old. Use simple words, examples, and analogies.
        </Text>
      </View>

      {/* Text input area */}
      <View
        style={{
          flex: 1,
          marginHorizontal: Spacing.md,
          marginTop: Spacing.md,
          marginBottom: Spacing.sm,
        }}
      >
        <TextInput
          ref={inputRef}
          value={text}
          onChangeText={setText}
          placeholder="Start explaining in your own words..."
          placeholderTextColor={Colors.textSecondary}
          multiline
          textAlignVertical="top"
          editable={!disabled}
          style={[
            {
              flex: 1,
              backgroundColor: Colors.surface,
              borderRadius: BorderRadius.lg,
              padding: Spacing.lg,
              color: Colors.text,
              fontSize: 16,
              lineHeight: 24,
              borderWidth: 1,
              borderColor: isRecording ? Colors.error + '60' : Colors.border,
            },
            Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : undefined,
          ]}
        />

        {/* Partial transcript indicator */}
        {partialTranscript ? (
          <Text
            style={{
              color: Colors.textSecondary,
              fontSize: 12,
              fontStyle: 'italic',
              marginTop: 4,
              paddingHorizontal: Spacing.xs,
            }}
          >
            Hearing: {partialTranscript}
          </Text>
        ) : null}

        {/* Word count + voice button */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: Spacing.sm,
          }}
        >
          <Text
            style={{
              color: wordCount >= 20 ? Colors.success : Colors.textSecondary,
              fontSize: 12,
            }}
          >
            {wordCount} words {wordCount < 20 && '(aim for 20+)'}
          </Text>

          {voiceAvailable && (
            <Pressable
              onPress={handleVoiceToggle}
              disabled={disabled}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
                backgroundColor: isRecording ? Colors.error + '20' : Colors.surface,
                paddingHorizontal: Spacing.md,
                paddingVertical: Spacing.xs,
                borderRadius: BorderRadius.full,
                borderWidth: 1,
                borderColor: isRecording ? Colors.error + '40' : Colors.border,
              }}
            >
              <Ionicons
                name={isRecording ? 'stop-circle' : 'mic-outline'}
                size={16}
                color={isRecording ? Colors.error : Colors.textSecondary}
              />
              <Text
                style={{
                  color: isRecording ? Colors.error : Colors.textSecondary,
                  fontSize: 12,
                  fontWeight: '600',
                }}
              >
                {isRecording ? 'Stop' : 'Voice'}
              </Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* Submit button */}
      <View
        style={{
          paddingHorizontal: Spacing.md,
          paddingBottom: Spacing.md,
        }}
      >
        <Pressable
          onPress={handleSubmit}
          disabled={!text.trim() || disabled}
          style={{
            backgroundColor:
              text.trim() && !disabled ? Colors.primary : Colors.surfaceLight,
            paddingVertical: Spacing.md,
            borderRadius: BorderRadius.md,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: Spacing.sm,
          }}
        >
          <Ionicons
            name="checkmark-circle"
            size={20}
            color={text.trim() && !disabled ? '#fff' : Colors.textSecondary}
          />
          <Text
            style={{
              color: text.trim() && !disabled ? '#fff' : Colors.textSecondary,
              fontSize: 16,
              fontWeight: '700',
            }}
          >
            Submit Explanation
          </Text>
        </Pressable>
      </View>
    </View>
  )
}
