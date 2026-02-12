import React, { useEffect, useRef } from 'react'
import { View, Text, StyleSheet, Animated } from 'react-native'

interface PoolBalanceProps {
  currentBalance: number   // cents
  depositAmount: number    // cents
  status: string
}

export function PoolBalance({ currentBalance, depositAmount, status }: PoolBalanceProps) {
  const animatedWidth = useRef(new Animated.Value(1)).current
  const pulseAnim = useRef(new Animated.Value(1)).current

  const percentage = depositAmount > 0 ? currentBalance / depositAmount : 0
  const dollars = (currentBalance / 100).toFixed(2)
  const originalDollars = (depositAmount / 100).toFixed(2)

  const isLow = percentage < 0.25
  const isCritical = percentage < 0.1

  useEffect(() => {
    Animated.timing(animatedWidth, {
      toValue: percentage,
      duration: 800,
      useNativeDriver: false,
    }).start()
  }, [percentage])

  useEffect(() => {
    if (status === 'active' && !isCritical) return
    if (isCritical && status === 'active') {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 0.6, duration: 500, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        ])
      )
      pulse.start()
      return () => pulse.stop()
    }
  }, [isCritical, status])

  const barColor = isCritical ? '#F43F5E' : isLow ? '#F59E0B' : '#6C3CE1'

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>Pool Balance</Text>
        <Text style={[styles.status, status === 'paused' && styles.statusPaused]}>
          {status.toUpperCase()}
        </Text>
      </View>

      <Animated.View style={{ opacity: isCritical ? pulseAnim : 1 }}>
        <Text style={[styles.amount, isCritical && styles.amountCritical]}>
          ${dollars}
        </Text>
      </Animated.View>

      <Text style={styles.original}>of ${originalDollars} deposited</Text>

      <View style={styles.barContainer}>
        <Animated.View
          style={[
            styles.barFill,
            {
              backgroundColor: barColor,
              width: animatedWidth.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      </View>

      <Text style={styles.percentage}>
        {(percentage * 100).toFixed(1)}% remaining
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1A1A2E',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '600',
  },
  status: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  statusPaused: {
    color: '#F59E0B',
  },
  amount: {
    color: '#E8E8F0',
    fontSize: 42,
    fontWeight: '800',
    letterSpacing: -1,
  },
  amountCritical: {
    color: '#F43F5E',
  },
  original: {
    color: '#6B7280',
    fontSize: 13,
    marginBottom: 16,
  },
  barContainer: {
    height: 8,
    backgroundColor: '#2D2D44',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  percentage: {
    color: '#9CA3AF',
    fontSize: 12,
    textAlign: 'right',
  },
})
