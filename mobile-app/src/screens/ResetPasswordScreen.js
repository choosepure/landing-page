import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import apiClient from '../api/client';
import { theme } from '../theme';

export default function ResetPasswordScreen({ navigation, route }) {
  const token = route.params?.token || '';
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleReset() {
    setError('');
    if (!password || password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (!token) {
      setError('Invalid reset link. Please request a new one.');
      return;
    }
    setLoading(true);
    try {
      const res = await apiClient.post('/api/user/reset-password', { token, password });
      if (res.data.success) {
        setSuccess(true);
      } else {
        setError(res.data.message || 'Failed to reset password');
      }
    } catch (e) {
      const msg = e.response?.data?.message || 'Something went wrong. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <View style={styles.container}>
        <Text style={styles.heading}>Password Reset</Text>
        <Text style={styles.description}>Your password has been reset successfully. You can now sign in with your new password.</Text>
        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Login')} accessibilityRole="button">
          <Text style={styles.buttonText}>Go to Sign In</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.container}>
        <Text style={styles.heading}>Reset Password</Text>
        <Text style={styles.description}>Enter your new password below.</Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Text style={styles.label}>New Password</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="Minimum 8 characters"
          placeholderTextColor={theme.colors.textSecondary}
          secureTextEntry
          accessibilityLabel="New password input"
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleReset}
          disabled={loading}
          accessibilityRole="button"
          accessibilityLabel="Reset password"
        >
          {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>Reset Password</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')} accessibilityRole="link">
          <Text style={styles.link}>Request a new reset link</Text>
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
  link: { fontFamily: theme.fonts.medium, fontSize: 14, color: theme.colors.primary, textAlign: 'center', marginTop: theme.spacing.md },
});
