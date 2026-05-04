import React, { Component } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { theme } from '../theme';
import { recordError, logMessage } from '../services/firebase/crashlytics';

/**
 * React error boundary that catches JavaScript errors in its subtree,
 * reports them to Firebase Crashlytics as non-fatal exceptions, and
 * renders a fallback UI with a retry option.
 *
 * Must be a class component — React does not support error boundaries
 * as function components.
 *
 * Requirement: 7.6
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    const componentStack = errorInfo?.componentStack || '';

    // Record the error as a non-fatal Crashlytics exception with the
    // component stack trace passed as context.
    recordError(error, componentStack);

    // Add a breadcrumb log describing the caught error.
    logMessage(
      `ErrorBoundary caught: ${error?.message || 'Unknown error'}`,
    );
  }

  handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container} accessibilityRole="alert">
          <Text style={styles.icon} accessibilityElementsHidden>
            ⚠️
          </Text>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.description}>
            An unexpected error occurred. Please try again.
          </Text>
          <TouchableOpacity
            style={styles.button}
            onPress={this.handleRetry}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Try Again"
            accessibilityHint="Resets the error and reloads the content"
          >
            <Text style={styles.buttonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  icon: {
    fontSize: 48,
    marginBottom: theme.spacing.md,
  },
  title: {
    fontFamily: theme.fonts.semiBold,
    fontSize: 20,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  description: {
    fontFamily: theme.fonts.regular,
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: theme.spacing.lg,
  },
  button: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: theme.borderRadius.sm,
  },
  buttonText: {
    fontFamily: theme.fonts.semiBold,
    fontSize: 15,
    color: '#FFFFFF',
  },
});
