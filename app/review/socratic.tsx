import { useEffect, useRef, useCallback, useState } from 'react'
import {
  View,
  Text,
  FlatList,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useDeckStore } from '../../src/stores/deckStore'
import { useSocraticStore } from '../../src/stores/socraticStore'
import { DialogueBubble } from '../../src/components/socratic/DialogueBubble'
import { ThinkingPrompt } from '../../src/components/socratic/ThinkingPrompt'
import { InsightReveal } from '../../src/components/socratic/InsightReveal'
import { Colors, Spacing, BorderRadius } from '../../src/utils/constants'
import type { SocraticMessage } from '../../src/services/ai'

export default function SocraticScreen() {
  const { cardId, deckId } = useLocalSearchParams<{
    cardId: string
    deckId: string
  }>()
  const router = useRouter()
  const flatListRef = useRef<FlatList<SocraticMessage>>(null)

  const { getDeck } = useDeckStore()
  const {
    session,
    isStreaming,
    streamingText,
    error,
    insightJustReached,
    xpAwarded,
    startSession,
    sendReply,
    endSession,
    clearInsightFlag,
  } = useSocraticStore()

  const [showInsight, setShowInsight] = useState(false)

  // Start session on mount
  useEffect(() => {
    if (!cardId || !deckId) return

    const deck = getDeck(deckId)
    if (!deck) return

    const card = deck.cards.find((c) => c.id === cardId)
    if (!card) return

    startSession(card)
  }, [cardId, deckId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Show insight modal when detected
  useEffect(() => {
    if (insightJustReached) {
      setShowInsight(true)
    }
  }, [insightJustReached])

  // Scroll to bottom on new messages
  useEffect(() => {
    if (session?.messages.length) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true })
      }, 100)
    }
  }, [session?.messages.length, streamingText])

  const handleSend = useCallback(
    (message: string) => {
      sendReply(message)
    },
    [sendReply]
  )

  const handleEnd = useCallback(() => {
    endSession()
    router.back()
  }, [endSession, router])

  const handleDismissInsight = useCallback(() => {
    setShowInsight(false)
    clearInsightFlag()
  }, [clearInsightFlag])

  if (!session) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
        <View
          style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
        >
          <Text style={{ color: Colors.textSecondary, fontSize: 16 }}>
            Starting Socratic session...
          </Text>
        </View>
      </SafeAreaView>
    )
  }

  // Build the messages list, adding streaming message if active
  const displayMessages: SocraticMessage[] = [...session.messages]
  if (isStreaming && streamingText) {
    displayMessages.push({
      role: 'assistant',
      content: streamingText,
      timestamp: new Date(),
    })
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      {/* Insight celebration overlay */}
      {showInsight && (
        <InsightReveal xpEarned={xpAwarded} onDismiss={handleDismissInsight} />
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
        <Pressable onPress={handleEnd} hitSlop={8}>
          <Ionicons name="close" size={24} color={Colors.textSecondary} />
        </Pressable>

        <View
          style={{
            flex: 1,
            marginLeft: Spacing.md,
          }}
        >
          <Text
            style={{
              color: Colors.text,
              fontSize: 16,
              fontWeight: '700',
            }}
          >
            Socratic Mode
          </Text>
          <Text
            style={{
              color: Colors.textSecondary,
              fontSize: 12,
              marginTop: 2,
            }}
            numberOfLines={1}
          >
            {session.card.question}
          </Text>
        </View>

        {/* Exchange counter */}
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
          <Ionicons name="chatbubbles-outline" size={14} color={Colors.primary} />
          <Text
            style={{
              color: Colors.primary,
              fontSize: 13,
              fontWeight: '600',
            }}
          >
            {session.exchangeCount}
          </Text>
        </View>
      </View>

      {/* Card context banner */}
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
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
          <Ionicons name="help-circle-outline" size={16} color={Colors.primary} />
          <Text
            style={{
              color: Colors.textSecondary,
              fontSize: 12,
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}
          >
            Exploring
          </Text>
        </View>
        <Text
          style={{
            color: Colors.text,
            fontSize: 14,
            marginTop: Spacing.xs,
            lineHeight: 20,
          }}
          numberOfLines={2}
        >
          {session.card.question}
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
          contentContainerStyle={{
            paddingVertical: Spacing.md,
          }}
          renderItem={({ item, index }) => (
            <DialogueBubble
              role={item.role}
              content={item.content}
              isInsight={item.isInsight}
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
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: Colors.primary + '30',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Ionicons name="school" size={16} color={Colors.primary} />
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
                    Socrates is thinking...
                  </Text>
                </View>
              </View>
            ) : null
          }
        />

        {/* Error message */}
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
        {session.insightReached ? (
          <View
            style={{
              padding: Spacing.md,
              backgroundColor: Colors.surface,
              borderTopWidth: 1,
              borderTopColor: Colors.border,
              alignItems: 'center',
              gap: Spacing.sm,
            }}
          >
            <Text
              style={{
                color: Colors.accent,
                fontSize: 14,
                fontWeight: '600',
              }}
            >
              Insight reached! Well done.
            </Text>
            <Pressable
              onPress={handleEnd}
              style={{
                backgroundColor: Colors.primary,
                paddingHorizontal: Spacing.xl,
                paddingVertical: Spacing.sm,
                borderRadius: BorderRadius.md,
              }}
            >
              <Text
                style={{ color: '#fff', fontSize: 15, fontWeight: '600' }}
              >
                End Session
              </Text>
            </Pressable>
          </View>
        ) : (
          <ThinkingPrompt onSend={handleSend} disabled={isStreaming} />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
