import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { theme } from '../theme';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setError('');
    if (!email.trim() || !password) {
      setError('Please enter email and password');
      return;
    }
    setLoading(true);
    try {
      const result = await login(email.trim().toLowerCase(), password);
      if (!result.success) {
        setError(result.message || 'Login failed');
      }
    } catch (e) {
      setError(e.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>ChoosePure</Text>
        </View>
        <Text style={styles.heading}>Sign In</Text>
        <Text style={styles.subheading}>Welcome back</Text>

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

        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="Enter your password"
          placeholderTextColor={theme.colors.textSecondary}
          secureTextEntry
          accessibilityLabel="Password input"
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
          accessibilityRole="button"
          accessibilityLabel="Sign in"
        >
          {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>Sign In</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')} accessibilityRole="link">
          <Text style={styles.link}>Forgot password?</Text>
        </TouchableOpacity>

        <View style={styles.row}>
          <Text style={styles.rowText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')} accessibilityRole="link">
            <Text style={styles.linkBold}>Register</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: theme.colors.background },
  container: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: theme.spacing.xl, paddingVertical: theme.spacing.xl },
  logoContainer: { width: 80, height: 80, borderRadius: 40, backgroundColor: theme.colors.primary, justifyContent: 'center', alignItems: 'center', alignSelf: 'center', marginBottom: theme.spacing.lg },
  logoText: { fontFamily: theme.fonts.bold, fontSize: 13, color: '#FFFFFF' },
  heading: { fontFamily: theme.fonts.bold, fontSize: 28, color: theme.colors.text, textAlign: 'center' },
  subheading: { fontFamily: theme.fonts.regular, fontSize: 15, color: theme.colors.textSecondary, textAlign: 'center', marginBottom: theme.spacing.lg },
  label: { fontFamily: theme.fonts.medium, fontSize: 14, color: theme.colors.text, marginBottom: theme.spacing.xs, marginTop: theme.spacing.md },
  input: { fontFamily: theme.fonts.regular, fontSize: 15, color: theme.colors.text, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.borderRadius.sm, paddingVertical: 12, paddingHorizontal: 16, backgroundColor: theme.colors.cardBackground },
  button: { backgroundColor: theme.colors.primary, paddingVertical: 14, borderRadius: theme.borderRadius.sm, alignItems: 'center', marginTop: theme.spacing.lg },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { fontFamily: theme.fonts.semiBold, fontSize: 16, color: '#FFFFFF' },
  error: { fontFamily: theme.fonts.regular, fontSize: 13, color: theme.colors.error, textAlign: 'center', marginBottom: theme.spacing.sm },
  link: { fontFamily: theme.fonts.medium, fontSize: 14, color: theme.colors.primary, textAlign: 'center', marginTop: theme.spacing.md },
  linkBold: { fontFamily: theme.fonts.semiBold, fontSize: 14, color: theme.colors.primary },
  row: { flexDirection: 'row', justifyContent: 'center', marginTop: theme.spacing.md },
  rowText: { fontFamily: theme.fonts.regular, fontSize: 14, color: theme.colors.textSecondary },
});
