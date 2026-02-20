/**
 * Sprint 12: Conversation screen — chat with an AI character.
 * Streaming responses, branch detection, register coaching, duration tracking.
 */

import { useEffect, useRef, useCallback, useState, useMemo } from 'react'
import {
  View,
  Text,
  FlatList,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  TextInput,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { Colors, Spacing, BorderRadius } from '../../src/utils/constants'
import { ConversationBubble } from '../../src/components/conversation/ConversationBubble'
import { useConversationStore } from '../../src/stores/conversationStore'
import { getScenario } from '../../src/services/ai/scenarios'
import {
  hapticLight,
  hapticMedium,
  hapticSuccess,
} from '../../src/services/haptics'
import type { ConversationMessage } from '../../src/types/conversation'

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export default function ConversationScreen() {
  const { scenarioId } = useLocalSearchParams<{ scenarioId: string }>()
  const router = useRouter()
  const flatListRef = useRef<FlatList<ConversationMessage>>(null)
  const inputRef = useRef<TextInput>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const {
    session,
    isStreaming,
    streamingText,
    error,
    durationGoalReached,
    start,
    sendMessage,
    endSession,
    clearSession,
  } = useConversationStore()

  const [inputText, setInputText] = useState('')
  const [elapsed, setElapsed] = useState(0)
  const [showGoalToast, setShowGoalToast] = useState(false)

  // Start session on mount
  useEffect(() => {
    if (!scenarioId) return

    const scenario = getScenario(scenarioId)
    if (!scenario) return

    const character = scenario.characters[0]
    if (!character) return

    start(scenario, character)

    // Start timer
    timerRef.current = setInterval(() => {
      setElapsed((e) => e + 1)
    }, 1000)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [scenarioId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Duration goal toast
  useEffect(() => {
    if (durationGoalReached) {
      hapticSuccess()
      setShowGoalToast(true)
      const t = setTimeout(() => setShowGoalToast(false), 3000)
      return () => clearTimeout(t)
    }
  }, [durationGoalReached])

  // Scroll to bottom on new messages
  useEffect(() => {
    if (session?.messages.length) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true })
      }, 100)
    }
  }, [session?.messages.length, streamingText])

  const handleSend = useCallback(() => {
    const text = inputText.trim()
    if (!text || isStreaming) return
    hapticLight()
    setInputText('')
    sendMessage(text)
  }, [inputText, isStreaming, sendMessage])

  const handleEnd = useCallback(async () => {
    hapticMedium()
    if (timerRef.current) clearInterval(timerRef.current)
    await endSession()
    router.push('/conversation/review')
  }, [endSession, router])

  const handleBack = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    clearSession()
    router.back()
  }, [clearSession, router])

  // Build display messages
  const displayMessages: ConversationMessage[] = useMemo(() => {
    if (!session) return []
    const msgs = [...session.messages]
    if (isStreaming && streamingText) {
      msgs.push({
        role: 'character',
        content: streamingText,
        timestamp: new Date(),
        characterId: session.activeCharacter.id,
      })
    }
    return msgs
  }, [session, isStreaming, streamingText])

  if (!session) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
        <View
          style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
        >
          <Text style={{ color: Colors.textSecondary, fontSize: 16 }}>
            Loading conversation...
          </Text>
        </View>
      </SafeAreaView>
    )
  }

  const { activeCharacter, scenario } = session
  const userMessageCount = session.messages.filter(
    (m) => m.role === 'user'
  ).length

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      {/* Duration goal toast */}
      {showGoalToast && durationGoalReached && (
        <View
          style={{
            position: 'absolute',
            top: 100,
            left: Spacing.lg,
            right: Spacing.lg,
            backgroundColor: Colors.success + '20',
            borderRadius: BorderRadius.lg,
            padding: Spacing.md,
            borderWidth: 1,
            borderColor: Colors.success + '40',
            zIndex: 100,
            alignItems: 'center',
          }}
        >
          <Text
            style={{
              color: Colors.success,
              fontSize: 15,
              fontWeight: '700',
            }}
          >
            🎉 {durationGoalReached} minute milestone reached!
          </Text>
        </View>
      )}

      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: Spacing.lg,
          paddingVertical: Spacing.sm,
          borderBottomWidth: 1,
          borderBottomColor: Colors.border,
        }}
      >
        <Pressable onPress={handleBack} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color={Colors.textSecondary} />
        </Pressable>

        {/* Character info */}
        <View
          style={{
            flex: 1,
            marginLeft: Spacing.sm,
            flexDirection: 'row',
            alignItems: 'center',
            gap: Spacing.sm,
          }}
        >
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: Colors.primary + '25',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 18 }}>
              {activeCharacter.avatarEmoji}
            </Text>
          </View>
          <View>
            <Text
              style={{
                color: Colors.text,
                fontSize: 16,
                fontWeight: '700',
              }}
            >
              {activeCharacter.name}
            </Text>
            <Text
              style={{
                color: Colors.textSecondary,
                fontSize: 11,
              }}
              numberOfLines={1}
            >
              {scenario.title}
            </Text>
          </View>
        </View>

        {/* Timer */}
        <View
          style={{
            backgroundColor: Colors.surface,
            borderRadius: BorderRadius.full,
            paddingHorizontal: Spacing.md,
            paddingVertical: Spacing.xs,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <Ionicons name="time-outline" size={14} color={Colors.accent} />
          <Text
            style={{
              color: Colors.accent,
              fontSize: 13,
              fontWeight: '600',
              fontVariant: ['tabular-nums'],
            }}
          >
            {formatDuration(elapsed)}
          </Text>
        </View>
      </View>

      {/* Scenario context banner */}
      <View
        style={{
          backgroundColor: Colors.surface,
          marginHorizontal: Spacing.md,
          marginTop: Spacing.sm,
          borderRadius: BorderRadius.md,
          padding: Spacing.md,
          borderWidth: 1,
          borderColor: Colors.border,
        }}
      >
        <Text
          style={{
            color: Colors.textSecondary,
            fontSize: 13,
            lineHeight: 18,
          }}
          numberOfLines={2}
        >
          {scenario.settingEmoji} {scenario.description}
        </Text>
      </View>

      {/* Messages */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={flatListRef}
          data={displayMessages}
          keyExtractor={(_, index) => `msg-${index}`}
          contentContainerStyle={{ paddingVertical: Spacing.md }}
          renderItem={({ item, index }) => (
            <ConversationBubble
              role={item.role}
              content={item.content}
              character={
                item.role === 'character' ? activeCharacter : undefined
              }
              isStreaming={
                isStreaming && index === displayMessages.length - 1
              }
              index={index}
            />
          )}
          ListFooterComponent={
            isStreaming && !streamingText ? (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: Spacing.md,
                  gap: Spacing.sm,
                  marginBottom: Spacing.sm,
                }}
              >
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: Colors.primary + '25',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ fontSize: 18 }}>
                    {activeCharacter.avatarEmoji}
                  </Text>
                </View>
                <View
                  style={{
                    backgroundColor: Colors.surface,
                    borderRadius: BorderRadius.lg,
                    borderTopLeftRadius: 4,
                    paddingHorizontal: Spacing.md,
                    paddingVertical: Spacing.sm,
                  }}
                >
                  <Text
                    style={{
                      color: Colors.textSecondary,
                      fontSize: 14,
                      fontStyle: 'italic',
                    }}
                  >
                    {activeCharacter.name} is typing...
                  </Text>
                </View>
              </View>
            ) : null
          }
        />

        {/* Error */}
        {error && (
          <View
            style={{
              backgroundColor: Colors.error + '15',
              marginHorizontal: Spacing.md,
              padding: Spacing.md,
              borderRadius: BorderRadius.md,
              borderWidth: 1,
              borderColor: Colors.error + '30',
            }}
          >
            <Text style={{ color: Colors.error, fontSize: 13 }}>
              {error}
            </Text>
          </View>
        )}

        {/* Input area */}
        <View
          style={{
            padding: Spacing.md,
            borderTopWidth: 1,
            borderTopColor: Colors.border,
            backgroundColor: Colors.background,
          }}
        >
          {/* End & Review button (visible after 2+ user messages) */}
          {userMessageCount >= 2 && (
            <Pressable
              onPress={handleEnd}
              style={{
                alignSelf: 'center',
                marginBottom: Spacing.sm,
                paddingHorizontal: Spacing.md,
                paddingVertical: Spacing.xs,
              }}
            >
              <Text
                style={{
                  color: Colors.accent,
                  fontSize: 13,
                  fontWeight: '600',
                }}
              >
                End & Review →
              </Text>
            </Pressable>
          )}

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'flex-end',
              gap: Spacing.sm,
            }}
          >
            <TextInput
              ref={inputRef}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Respond in Spanish..."
              placeholderTextColor={Colors.textSecondary}
              multiline
              maxLength={500}
              style={{
                flex: 1,
                backgroundColor: Colors.surface,
                borderRadius: BorderRadius.lg,
                paddingHorizontal: Spacing.md,
                paddingTop: Spacing.sm + 2,
                paddingBottom: Spacing.sm + 2,
                color: Colors.text,
                fontSize: 15,
                maxHeight: 100,
                borderWidth: 1,
                borderColor: Colors.border,
              }}
              editable={!isStreaming}
              onSubmitEditing={handleSend}
              blurOnSubmit={false}
            />
            <Pressable
              onPress={handleSend}
              disabled={!inputText.trim() || isStreaming}
              style={({ pressed }) => ({
                width: 42,
                height: 42,
                borderRadius: 21,
                backgroundColor:
                  inputText.trim() && !isStreaming
                    ? Colors.primary
                    : Colors.surface,
                justifyContent: 'center',
                alignItems: 'center',
                opacity: pressed ? 0.8 : 1,
              })}
            >
              <Ionicons
                name="send"
                size={18}
                color={
                  inputText.trim() && !isStreaming
                    ? '#fff'
                    : Colors.textSecondary
                }
              />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
