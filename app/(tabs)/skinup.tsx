import React, { useEffect } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useSkinUPStore } from '../../src/stores/skinupStore'
import { PoolBalance } from '../../src/components/skinup/PoolBalance'
import { DrainTimerComponent } from '../../src/components/skinup/DrainTimer'

export default function SkinUPScreen() {
  const router = useRouter()
  const { pool, drainState, isLoading, error, loadPool, pausePool, resumePool, seedDemo, resetPool } = useSkinUPStore()

  useEffect(() => {
    loadPool()
  }, [])

  const handlePause = async () => {
    if (!pool) return
    if (pool.status === 'paused') {
      await resumePool()
    } else {
      Alert.alert(
        '⏸️ Emergency Pause',
        `You have ${pool.maxPauses - pool.pauseCount} pauses remaining. Use wisely!`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Pause Drain',
            style: 'destructive',
            onPress: async () => {
              const success = await pausePool()
              if (!success) {
                Alert.alert('Cannot Pause', error || 'Pause limit reached or cooldown active.')
              }
            },
          },
        ]
      )
    }
  }

  const handleReset = () => {
    Alert.alert(
      'Reset Pool',
      'This will delete the current pool. For demo purposes only.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset', style: 'destructive', onPress: resetPool },
      ]
    )
  }

  // No active pool — show setup CTA
  if (!pool || pool.status === 'inactive') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView style={styles.container} contentContainerStyle={styles.centeredContent}>
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>💀</Text>
            <Text style={styles.emptyTitle}>Skin in the Game</Text>
            <Text style={styles.emptySubtitle}>
              Put real money on the line. Miss your reviews and it drains to charity.
              {'\n\n'}No excuses. No refunds. Pure accountability.
            </Text>

            <TouchableOpacity
              style={styles.setupButton}
              onPress={() => router.push('/skinup/setup')}
              activeOpacity={0.8}
            >
              <Ionicons name="wallet" size={20} color="#FFF" />
              <Text style={styles.setupButtonText}>Set Up SkinUP</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.demoButton}
              onPress={seedDemo}
              activeOpacity={0.7}
            >
              <Text style={styles.demoButtonText}>Try Demo Pool</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>💀 SkinUP</Text>
          <TouchableOpacity onPress={handleReset}>
            <Ionicons name="refresh" size={22} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* Pool Balance */}
        <PoolBalance
          currentBalance={pool.currentBalance}
          depositAmount={pool.depositAmount}
          status={pool.status}
        />

        {/* Drain Timer */}
        {(pool.status === 'active' || pool.status === 'paused') && (
          <DrainTimerComponent
            state={drainState}
            drainRate={pool.drainRate}
          />
        )}

        {/* Drained status */}
        {pool.status === 'drained' && (
          <View style={styles.drainedCard}>
            <Text style={styles.drainedIcon}>💸</Text>
            <Text style={styles.drainedTitle}>Pool Drained</Text>
            <Text style={styles.drainedSubtitle}>
              ${(pool.drainedTotal / 100).toFixed(2)} donated to {pool.selectedOrgName}
            </Text>
          </View>
        )}

        {/* Completed status */}
        {pool.status === 'completed' && (
          <View style={styles.completedCard}>
            <Text style={styles.completedIcon}>🏆</Text>
            <Text style={styles.completedTitle}>Pool Complete!</Text>
            <Text style={styles.completedSubtitle}>
              You kept your commitment. ${(pool.currentBalance / 100).toFixed(2)} saved.
            </Text>
          </View>
        )}

        {/* Donation target */}
        <View style={styles.orgCard}>
          <Text style={styles.orgLabel}>Drains to</Text>
          <View style={styles.orgRow}>
            <View style={styles.orgIconCircle}>
              <Text style={styles.orgIconText}>{pool.selectedOrgName.charAt(0)}</Text>
            </View>
            <View>
              <Text style={styles.orgName}>{pool.selectedOrgName}</Text>
              <Text style={styles.orgSlug}>via Every.org</Text>
            </View>
          </View>
        </View>

        {/* Emergency Pause */}
        {(pool.status === 'active' || pool.status === 'paused') && (
          <TouchableOpacity
            style={[
              styles.pauseButton,
              pool.status === 'paused' && styles.resumeButton,
            ]}
            onPress={handlePause}
            activeOpacity={0.8}
          >
            <Ionicons
              name={pool.status === 'paused' ? 'play' : 'pause'}
              size={20}
              color={pool.status === 'paused' ? '#10B981' : '#F59E0B'}
            />
            <Text style={[
              styles.pauseButtonText,
              pool.status === 'paused' && styles.resumeButtonText,
            ]}>
              {pool.status === 'paused' ? 'Resume Drain' : 'Emergency Pause'}
            </Text>
            <Text style={styles.pauseCount}>
              {pool.maxPauses - pool.pauseCount} left
            </Text>
          </TouchableOpacity>
        )}

        {/* Stats */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>${(pool.drainedTotal / 100).toFixed(2)}</Text>
            <Text style={styles.statLabel}>Total Drained</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{pool.pauseCount}/{pool.maxPauses}</Text>
            <Text style={styles.statLabel}>Pauses Used</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>${(pool.drainRate / 100).toFixed(2)}</Text>
            <Text style={styles.statLabel}>Per Minute</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0D0D1A',
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  centeredContent: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    color: '#E8E8F0',
    fontSize: 28,
    fontWeight: '800',
  },
  // Empty state
  emptyState: {
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    color: '#E8E8F0',
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 12,
  },
  emptySubtitle: {
    color: '#9CA3AF',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    maxWidth: 300,
  },
  setupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#6C3CE1',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginBottom: 12,
  },
  setupButtonText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '700',
  },
  demoButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  demoButtonText: {
    color: '#6C3CE1',
    fontSize: 15,
    fontWeight: '600',
  },
  // Org card
  orgCard: {
    backgroundColor: '#1A1A2E',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  orgLabel: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 10,
  },
  orgRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  orgIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#6C3CE1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orgIconText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  orgName: {
    color: '#E8E8F0',
    fontSize: 15,
    fontWeight: '600',
  },
  orgSlug: {
    color: '#6B7280',
    fontSize: 12,
  },
  // Pause button
  pauseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderWidth: 1,
    borderColor: '#F59E0B',
    borderRadius: 12,
    paddingVertical: 14,
    marginBottom: 16,
  },
  resumeButton: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: '#10B981',
  },
  pauseButtonText: {
    color: '#F59E0B',
    fontSize: 16,
    fontWeight: '700',
  },
  resumeButtonText: {
    color: '#10B981',
  },
  pauseCount: {
    color: '#6B7280',
    fontSize: 12,
  },
  // Stats
  statsCard: {
    flexDirection: 'row',
    backgroundColor: '#1A1A2E',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#2D2D44',
  },
  statValue: {
    color: '#E8E8F0',
    fontSize: 18,
    fontWeight: '700',
  },
  statLabel: {
    color: '#6B7280',
    fontSize: 11,
    marginTop: 4,
  },
  // Drained
  drainedCard: {
    backgroundColor: 'rgba(244, 63, 94, 0.1)',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F43F5E',
  },
  drainedIcon: { fontSize: 40, marginBottom: 8 },
  drainedTitle: { color: '#F43F5E', fontSize: 20, fontWeight: '800' },
  drainedSubtitle: { color: '#9CA3AF', fontSize: 14, marginTop: 4, textAlign: 'center' },
  // Completed
  completedCard: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  completedIcon: { fontSize: 40, marginBottom: 8 },
  completedTitle: { color: '#10B981', fontSize: 20, fontWeight: '800' },
  completedSubtitle: { color: '#9CA3AF', fontSize: 14, marginTop: 4, textAlign: 'center' },
})
