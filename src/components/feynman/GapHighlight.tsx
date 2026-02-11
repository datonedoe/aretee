import { View, Text, Pressable } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors, Spacing, BorderRadius } from '../../utils/constants'

interface GapHighlightProps {
  gaps: string[]
  followUp: string
  onAnswerFollowUp: () => void
  onDone: () => void
  hasFollowUp: boolean
}

export function GapHighlight({
  gaps,
  followUp,
  onAnswerFollowUp,
  onDone,
  hasFollowUp,
}: GapHighlightProps) {
  return (
    <View style={{ padding: Spacing.md, gap: Spacing.md }}>
      {/* Knowledge gaps */}
      {gaps.length > 0 && (
        <View
          style={{
            backgroundColor: Colors.warning + '10',
            borderRadius: BorderRadius.lg,
            padding: Spacing.lg,
            borderWidth: 1,
            borderColor: Colors.warning + '30',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
            <Ionicons name="alert-circle" size={18} color={Colors.warning} />
            <Text
              style={{
                color: Colors.warning,
                fontSize: 15,
                fontWeight: '700',
              }}
            >
              Knowledge Gaps
            </Text>
          </View>

          {gaps.map((gap, index) => (
            <View
              key={index}
              style={{
                flexDirection: 'row',
                alignItems: 'flex-start',
                gap: Spacing.sm,
                marginTop: Spacing.sm,
              }}
            >
              <Text style={{ color: Colors.warning, fontSize: 14, marginTop: 1 }}>
                {'\u2022'}
              </Text>
              <Text
                style={{
                  color: Colors.text,
                  fontSize: 14,
                  lineHeight: 20,
                  flex: 1,
                }}
              >
                {gap}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Follow-up question */}
      <View
        style={{
          backgroundColor: Colors.accent + '10',
          borderRadius: BorderRadius.lg,
          padding: Spacing.lg,
          borderWidth: 1,
          borderColor: Colors.accent + '30',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
          <Ionicons name="help-circle" size={18} color={Colors.accent} />
          <Text
            style={{
              color: Colors.accent,
              fontSize: 15,
              fontWeight: '700',
            }}
          >
            Follow-up Question
          </Text>
        </View>
        <Text
          style={{
            color: Colors.text,
            fontSize: 15,
            lineHeight: 22,
            marginTop: Spacing.sm,
          }}
        >
          {followUp}
        </Text>
      </View>

      {/* Action buttons */}
      <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
        {!hasFollowUp && (
          <Pressable
            onPress={onAnswerFollowUp}
            style={{
              flex: 1,
              backgroundColor: Colors.accent,
              paddingVertical: Spacing.md,
              borderRadius: BorderRadius.md,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: Spacing.sm,
            }}
          >
            <Ionicons name="chatbubble-ellipses" size={18} color="#000" />
            <Text style={{ color: '#000', fontSize: 15, fontWeight: '700' }}>
              Answer Follow-up
            </Text>
          </Pressable>
        )}
        <Pressable
          onPress={onDone}
          style={{
            flex: hasFollowUp ? 1 : undefined,
            backgroundColor: Colors.surface,
            paddingVertical: Spacing.md,
            paddingHorizontal: hasFollowUp ? undefined : Spacing.xl,
            borderRadius: BorderRadius.md,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: Spacing.sm,
            borderWidth: 1,
            borderColor: Colors.border,
          }}
        >
          <Text style={{ color: Colors.text, fontSize: 15, fontWeight: '600' }}>
            Done
          </Text>
        </Pressable>
      </View>
    </View>
  )
}
