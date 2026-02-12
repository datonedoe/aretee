import React, { useState, useEffect } from 'react'
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import { EveryOrgOrganization } from '../../types/skinup'
import { DonationService } from '../../services/skinup/donations'

interface OrgSelectorProps {
  selectedOrg: EveryOrgOrganization | null
  onSelect: (org: EveryOrgOrganization) => void
}

export function OrgSelector({ selectedOrg, onSelect }: OrgSelectorProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<EveryOrgOrganization[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const timer = setTimeout(async () => {
      setIsLoading(true)
      const orgs = await DonationService.searchOrgs(query)
      setResults(orgs)
      setIsLoading(false)
    }, 300)
    return () => clearTimeout(timer)
  }, [query])

  if (selectedOrg) {
    return (
      <View style={styles.selectedContainer}>
        <View style={styles.selectedIcon}>
          <Text style={styles.selectedIconText}>
            {selectedOrg.name.charAt(0)}
          </Text>
        </View>
        <View style={styles.selectedInfo}>
          <Text style={styles.selectedName}>{selectedOrg.name}</Text>
          <Text style={styles.selectedCategory}>{selectedOrg.category}</Text>
        </View>
        <TouchableOpacity onPress={() => onSelect(null as any)} style={styles.changeButton}>
          <Text style={styles.changeText}>Change</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Choose a charity</Text>
      <Text style={styles.sublabel}>Your drained funds go here via Every.org</Text>

      <TextInput
        style={styles.searchInput}
        placeholder="Search organizations..."
        placeholderTextColor="#6B7280"
        value={query}
        onChangeText={setQuery}
        autoCapitalize="none"
      />

      {isLoading ? (
        <ActivityIndicator color="#6C3CE1" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.slug}
          scrollEnabled={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.orgItem}
              onPress={() => onSelect(item)}
              activeOpacity={0.7}
            >
              <View style={styles.orgIcon}>
                <Text style={styles.orgIconText}>{item.name.charAt(0)}</Text>
              </View>
              <View style={styles.orgInfo}>
                <Text style={styles.orgName}>{item.name}</Text>
                <Text style={styles.orgDesc} numberOfLines={1}>{item.description}</Text>
                <View style={styles.orgMeta}>
                  <Text style={styles.orgCategory}>{item.category}</Text>
                  {item.location && <Text style={styles.orgLocation}>📍 {item.location}</Text>}
                </View>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No organizations found</Text>
          }
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    color: '#E8E8F0',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  sublabel: {
    color: '#6B7280',
    fontSize: 13,
    marginBottom: 16,
  },
  searchInput: {
    backgroundColor: '#1A1A2E',
    borderRadius: 12,
    padding: 14,
    color: '#E8E8F0',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#2D2D44',
    marginBottom: 12,
  },
  orgItem: {
    flexDirection: 'row',
    backgroundColor: '#1A1A2E',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    alignItems: 'center',
  },
  orgIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#6C3CE1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  orgIconText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
  orgInfo: {
    flex: 1,
  },
  orgName: {
    color: '#E8E8F0',
    fontSize: 15,
    fontWeight: '600',
  },
  orgDesc: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 2,
  },
  orgMeta: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  orgCategory: {
    color: '#6C3CE1',
    fontSize: 11,
    fontWeight: '600',
  },
  orgLocation: {
    color: '#6B7280',
    fontSize: 11,
  },
  emptyText: {
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 20,
  },
  selectedContainer: {
    flexDirection: 'row',
    backgroundColor: '#1A1A2E',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#6C3CE1',
  },
  selectedIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#6C3CE1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  selectedIconText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
  selectedInfo: {
    flex: 1,
  },
  selectedName: {
    color: '#E8E8F0',
    fontSize: 16,
    fontWeight: '600',
  },
  selectedCategory: {
    color: '#6C3CE1',
    fontSize: 12,
  },
  changeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  changeText: {
    color: '#6C3CE1',
    fontSize: 14,
    fontWeight: '600',
  },
})
