import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import apiClient from '../api/client';
import { theme } from '../theme';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  async function handleSubmit() {
    setError('');
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }
    setLoading(true);
    try {
      const res = await apiClient.post('/api/user/forgot-password', { email: email.trim().toLowerCase() });
      if (res.data.success) {
        setSent(true);
      } else {
        setError(res.data.message || 'Something went wrong');
      }
    } catch (e) {
      setError(e.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <View style={styles.container}>
        <Text style={styles.heading}>Check your email</Text>
        <Text style={styles.description}>
          If an account exists for {email}, we've sent a password reset link. Please check your inbox and spam folder.
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.container}>
        <Text style={styles.heading}>Forgot Password</Text>
        <Text style={styles.description}>Enter your email and we'll send you a link to reset your password.</Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          placeholderTextColor={theme.colors.textSecondary}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          accessibilityLabel="Email input"
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
          accessibilityRole="button"
          accessibilityLabel="Send reset link"
        >
          {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>Send Reset Link</Text>}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: theme.colors.background },
  container: { flex: 1, justifyContent: 'center', paddingHorizontal: theme.spacing.xl },
  heading: { fontFamily: theme.fonts.bold, fontSize: 24, color: theme.colors.text, textAlign: 'center', marginBottom: theme.spacing.sm },
  description: { fontFamily: theme.fonts.regular, fontSize: 15, color: theme.colors.textSecondary, textAlign: 'center', marginBottom: theme.spacing.lg, lineHeight: 22 },
  label: { fontFamily: theme.fonts.medium, fontSize: 14, color: theme.colors.text, marginBottom: theme.spacing.xs },
  input: { fontFamily: theme.fonts.regular, fontSize: 15, color: theme.colors.text, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.borderRadius.sm, paddingVertical: 12, paddingHorizontal: 16, backgroundColor: theme.colors.cardBackground },
  button: { backgroundColor: theme.colors.primary, paddingVertical: 14, borderRadius: theme.borderRadius.sm, alignItems: 'center', marginTop: theme.spacing.lg },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { fontFamily: theme.fonts.semiBold, fontSize: 16, color: '#FFFFFF' },
  error: { fontFamily: theme.fonts.regular, fontSize: 13, color: theme.colors.error, textAlign: 'center', marginBottom: theme.spacing.sm },
});
