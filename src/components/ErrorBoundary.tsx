/**
 * ErrorBoundary — Catches unhandled JS errors in the component tree
 * and displays a recovery UI instead of crashing the app.
 */
import React, { Component, ErrorInfo, ReactNode } from 'react'
import { View, Text, Pressable, ScrollView } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors, Spacing, BorderRadius } from '../utils/constants'

interface ErrorBoundaryProps {
  children: ReactNode
  /** Optional fallback component to render instead of the default */
  fallback?: ReactNode
  /** Called when an error is caught */
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo })
    this.props.onError?.(error, errorInfo)

    // Log to console in dev
    if (__DEV__) {
      console.error('ErrorBoundary caught:', error, errorInfo)
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <View
          style={{
            flex: 1,
            backgroundColor: Colors.background,
            justifyContent: 'center',
            alignItems: 'center',
            padding: Spacing.xl,
          }}
        >
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: Colors.error + '20',
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: Spacing.lg,
            }}
          >
            <Ionicons name="warning" size={40} color={Colors.error} />
          </View>

          <Text
            style={{
              color: Colors.text,
              fontSize: 22,
              fontWeight: '800',
              textAlign: 'center',
            }}
          >
            Something went wrong
          </Text>
          <Text
            style={{
              color: Colors.textSecondary,
              fontSize: 14,
              textAlign: 'center',
              marginTop: Spacing.sm,
              lineHeight: 20,
              maxWidth: 300,
            }}
          >
            An unexpected error occurred. You can try again or restart the app.
          </Text>

          {__DEV__ && this.state.error && (
            <ScrollView
              style={{
                maxHeight: 120,
                marginTop: Spacing.lg,
                width: '100%',
              }}
              contentContainerStyle={{
                backgroundColor: Colors.surface,
                borderRadius: BorderRadius.md,
                padding: Spacing.md,
              }}
            >
              <Text
                style={{
                  color: Colors.error,
                  fontSize: 12,
                  fontFamily: 'monospace',
                }}
              >
                {this.state.error.message}
              </Text>
            </ScrollView>
          )}

          <Pressable
            onPress={this.handleReset}
            style={({ pressed }) => ({
              backgroundColor: Colors.primary,
              paddingHorizontal: Spacing.xl,
              paddingVertical: Spacing.md,
              borderRadius: BorderRadius.md,
              marginTop: Spacing.xl,
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>
              Try Again
            </Text>
          </Pressable>
        </View>
      )
    }

    return this.props.children
  }
}
