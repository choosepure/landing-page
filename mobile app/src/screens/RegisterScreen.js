import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { mapFirebaseAuthError } from '../services/firebase/auth';
import { validateRegistrationForm } from '../utils/validation';
import { theme } from '../theme';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import Icon from '../components/Icon';

export default function RegisterScreen({ navigation, route }) {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [pincode, setPincode] = useState('');
  const [password, setPassword] = useState('');
  const [referralCode, setReferralCode] = useState(route.params?.referralCode || '');
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleRegister() {
    setServerError('');
    const validation = validateRegistrationForm({ name, email, phone, pincode, password });
    const hasErrors = Object.values(validation).some(Boolean);
    setErrors(validation);
    if (hasErrors) return;

    setLoading(true);
    try {
      const result = await register(name.trim(), email.trim().toLowerCase(), phone.trim(), pincode.trim(), password, referralCode.trim() || undefined);
      if (!result.success) {
        setServerError(result.message || 'Registration failed');
      }
    } catch (e) {
      if (e.code) {
        setServerError(mapFirebaseAuthError(e));
      } else {
        setServerError(e.response?.data?.message || 'Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  function clearFieldError(fieldKey) {
    setErrors((prev) => ({ ...prev, [fieldKey]: null }));
  }

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
          <Text style={styles.headerTitle}>Create Account</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Logo card */}
        <Card style={styles.logoCard}>
          <Text style={styles.logoText}>ChoosePure</Text>
          <Text style={styles.logoSubtitle}>Start your journey to natural living</Text>
        </Card>

        {/* Form card */}
        <Card style={styles.formCard}>
          {serverError ? <Text style={styles.error}>{serverError}</Text> : null}

          <Input
            label="Full Name"
            leftIcon="user"
            value={name}
            onChangeText={(t) => { setName(t); clearFieldError('name'); }}
            placeholder="Sarah Johnson"
            autoCapitalize="words"
            error={errors.name}
            accessibilityLabel="Full name input"
          />

          <View style={styles.fieldSpacer} />

          <Input
            label="Email Address"
            leftIcon="mail"
            value={email}
            onChangeText={(t) => { setEmail(t); clearFieldError('email'); }}
            placeholder="sarah@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            error={errors.email}
            accessibilityLabel="Email input"
          />

          <View style={styles.fieldSpacer} />

          <Input
            label="Mobile Number"
            leftIcon="phone"
            value={phone}
            onChangeText={(t) => { setPhone(t); clearFieldError('phone'); }}
            placeholder="+1 555 0123"
            keyboardType="phone-pad"
            error={errors.phone}
            accessibilityLabel="Mobile number input"
          />

          <View style={styles.fieldSpacer} />

          <Input
            label="Password"
            leftIcon="lock"
            rightIcon="eye"
            onRightIconPress={() => setShowPassword(!showPassword)}
            value={password}
            onChangeText={(t) => { setPassword(t); clearFieldError('password'); }}
            placeholder="At least 8 characters"
            secureTextEntry={!showPassword}
            error={errors.password}
            accessibilityLabel="Password input"
          />

          <View style={styles.fieldSpacer} />

          <Input
            label="Pincode"
            leftIcon="tag"
            value={pincode}
            onChangeText={(t) => { setPincode(t); clearFieldError('pincode'); }}
            placeholder="6-digit pincode"
            keyboardType="number-pad"
            error={errors.pincode}
            accessibilityLabel="Pincode input"
          />

          <View style={styles.fieldSpacer} />

          <Input
            label="Referral Code (optional)"
            value={referralCode}
            onChangeText={setReferralCode}
            placeholder="e.g. CP-ABCDE"
            autoCapitalize="characters"
            accessibilityLabel="Referral code input"
          />
        </Card>

        {/* Terms text */}
        <Text style={styles.termsText}>
          By creating an account, you agree to our{' '}
          <Text style={styles.termsLink}>Terms</Text> and{' '}
          <Text style={styles.termsLink}>Privacy Policy</Text>.
        </Text>

        {/* Create Account button */}
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            'Create Account'
          )}
        </Button>

        {/* Sign in link */}
        <View style={styles.signInRow}>
          <Text style={styles.signInText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')} accessibilityRole="link">
            <Text style={styles.signInLink}>Sign in</Text>
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
    fontSize: 36,
    color: theme.colors.primary,
    marginBottom: theme.spacing.sm,
  },
  logoSubtitle: {
    fontFamily: theme.fonts.regular,
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
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

  // Terms text
  termsText: {
    fontFamily: theme.fonts.regular,
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  termsLink: {
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.primary,
  },

  // Sign in link
  signInRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  signInText: {
    fontFamily: theme.fonts.regular,
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  signInLink: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
  },
});
