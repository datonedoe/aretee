import { View, Text } from 'react-native'
import { Colors, Spacing, BorderRadius } from '../../utils/constants'

interface CardProgressProps {
  current: number
  total: number
}

export function CardProgress({ current, total }: CardProgressProps) {
  const progress = total > 0 ? current / total : 0

  return (
    <View style={{ width: '100%', gap: Spacing.xs }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={{ color: Colors.textSecondary, fontSize: 13 }}>
          {current} of {total}
        </Text>
        <Text style={{ color: Colors.textSecondary, fontSize: 13 }}>
          {Math.round(progress * 100)}%
        </Text>
      </View>
      <View
        style={{
          height: 4,
          backgroundColor: Colors.surfaceLight,
          borderRadius: BorderRadius.full,
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            height: '100%',
            width: `${progress * 100}%`,
            backgroundColor: Colors.primary,
            borderRadius: BorderRadius.full,
          }}
        />
      </View>
    </View>
  )
}
