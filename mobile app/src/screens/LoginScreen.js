import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { mapFirebaseAuthError, signInWithPhone } from '../services/firebase/auth';
import { theme } from '../theme';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import Icon from '../components/Icon';

export default function LoginScreen({ navigation }) {
  const { login, loginWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [tab, setTab] = useState('email');
  const [showPassword, setShowPassword] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleGoogleSignIn() {
    setError('');
    setGoogleLoading(true);
    try {
      const result = await loginWithGoogle();
      if (!result.success) {
        setError(result.message || 'Google sign-in failed');
      }
    } catch (e) {
      if (e.code === 'SIGN_IN_CANCELLED') {
        // User cancelled — do nothing
        return;
      }
      setError(e.message || 'Something went wrong with Google Sign-In');
    } finally {
      setGoogleLoading(false);
    }
  }

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
      if (e.code) {
        setError(mapFirebaseAuthError(e));
      } else {
        setError(e.response?.data?.message || 'Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handlePhoneSignIn() {
    setError('');
    const digits = phoneNumber.replace(/[^0-9]/g, '');
    if (digits.length !== 10) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }
    setPhoneLoading(true);
    try {
      const confirmation = await signInWithPhone(digits);
      navigation.navigate('OTP', { phoneNumber: digits, confirmation });
    } catch (e) {
      if (e.code) {
        setError(mapFirebaseAuthError(e));
      } else {
        setError(e.message || 'Something went wrong. Please try again.');
      }
    } finally {
      setPhoneLoading(false);
    }
  }

  const isSubmitting = tab === 'email' ? loading : phoneLoading;

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Icon name="arrow-left" size={20} color={theme.colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Welcome Back</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Logo card */}
        <Card style={styles.logoCard}>
          <Text style={styles.logoText}>ChoosePure</Text>
          <Text style={styles.logoSubtitle}>Sign in to continue your pure journey</Text>
        </Card>

        {/* Tab switcher */}
        <View style={styles.tabContainer}>
          {[
            ['email', 'Email'],
            ['mobile', 'Mobile Number'],
          ].map(([id, label]) => (
            <TouchableOpacity
              key={id}
              style={[styles.tabButton, tab === id && styles.tabButtonActive]}
              onPress={() => { setTab(id); setError(''); }}
              accessibilityRole="tab"
              accessibilityState={{ selected: tab === id }}
              accessibilityLabel={label}
            >
              <Text style={[styles.tabText, tab === id && styles.tabTextActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Form card */}
        <Card style={styles.formCard}>
          {error ? <Text style={styles.error}>{error}</Text> : null}

          {tab === 'email' ? (
            <>
              <Input
                label="Email Address"
                leftIcon="mail"
                value={email}
                onChangeText={setEmail}
                placeholder="sarah@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                accessibilityLabel="Email input"
              />
              <View style={styles.fieldSpacer} />
              <Input
                label="Password"
                leftIcon="lock"
                rightIcon="eye"
                onRightIconPress={() => setShowPassword(!showPassword)}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                secureTextEntry={!showPassword}
                accessibilityLabel="Password input"
              />
              <TouchableOpacity
                onPress={() => navigation.navigate('ForgotPassword')}
                style={styles.forgotContainer}
                accessibilityRole="link"
              >
                <Text style={styles.forgotText}>Forgot password?</Text>
              </TouchableOpacity>
            </>
          ) : (
            <Input
              label="Mobile Number"
              leftIcon="phone"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              placeholder="10-digit phone number"
              keyboardType="phone-pad"
              maxLength={10}
              accessibilityLabel="Phone number input"
            />
          )}
        </Card>

        {/* Sign In button */}
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onPress={tab === 'email' ? handleLogin : handlePhoneSignIn}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            'Sign In'
          )}
        </Button>

        {/* OR divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Social login buttons */}
        <View style={styles.socialContainer}>
          <Button variant="outline" fullWidth onPress={handleGoogleSignIn} disabled={googleLoading}>
            {googleLoading ? <ActivityIndicator color={theme.colors.primary} /> : 'Continue with Google'}
          </Button>
          {Platform.OS === 'ios' && (
            <>
              <View style={styles.socialSpacer} />
              <Button variant="outline" fullWidth>
                Continue with Apple
              </Button>
            </>
          )}
        </View>

        {/* Register link */}
        <View style={styles.registerRow}>
          <Text style={styles.registerText}>New to Choosepure? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')} accessibilityRole="link">
            <Text style={styles.registerLink}>Create account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: theme.spacing.lg,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: theme.spacing.xs,
    paddingBottom: 12,
  },
  headerTitle: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSize.lg,
    color: theme.colors.primary,
  },
  headerSpacer: {
    width: 36,
  },

  // Logo card
  logoCard: {
    padding: theme.spacing.lg,
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  logoText: {
    fontFamily: theme.fonts.bold,
    fontSize: theme.fontSize['2xl'],
    color: theme.colors.primary,
    marginBottom: 12,
  },
  logoSubtitle: {
    fontFamily: theme.fonts.regular,
    fontSize: theme.fontSize.base,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },

  // Tab switcher
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.md,
    padding: 4,
    marginBottom: theme.spacing.md,
    ...theme.shadow.card,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: theme.borderRadius.sm,
    alignItems: 'center',
  },
  tabButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  tabText: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSize.base,
    color: theme.colors.textSecondary,
  },
  tabTextActive: {
    color: '#FFFFFF',
  },

  // Form card
  formCard: {
    padding: 20,
    marginBottom: 20,
  },
  fieldSpacer: {
    height: theme.spacing.md,
  },
  error: {
    fontFamily: theme.fonts.regular,
    fontSize: theme.fontSize.sm,
    color: theme.colors.error,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  forgotContainer: {
    marginTop: theme.spacing.md,
  },
  forgotText: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
  },

  // Divider
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.border,
  },
  dividerText: {
    fontFamily: theme.fonts.regular,
    fontSize: theme.fontSize.xs,
    color: theme.colors.textDim,
  },

  // Social login
  socialContainer: {
    gap: theme.spacing.sm,
  },
  socialSpacer: {
    height: theme.spacing.sm,
  },

  // Register link
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: theme.spacing.lg,
  },
  registerText: {
    fontFamily: theme.fonts.regular,
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  registerLink: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
  },
});
