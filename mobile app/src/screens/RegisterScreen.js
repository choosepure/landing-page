import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { validateRegistrationForm } from '../utils/validation';
import { theme } from '../theme';

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
      setServerError(e.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function renderField(label, value, setter, placeholder, opts = {}) {
    const fieldKey = opts.fieldKey || label.toLowerCase();
    return (
      <>
        <Text style={styles.label}>{label}</Text>
        <TextInput
          style={[styles.input, errors[fieldKey] && styles.inputError]}
          value={value}
          onChangeText={(t) => { setter(t); setErrors((prev) => ({ ...prev, [fieldKey]: null })); }}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textSecondary}
          keyboardType={opts.keyboardType || 'default'}
          autoCapitalize={opts.autoCapitalize || 'none'}
          secureTextEntry={opts.secure || false}
          accessibilityLabel={`${label} input`}
        />
        {errors[fieldKey] ? <Text style={styles.fieldError}>{errors[fieldKey]}</Text> : null}
      </>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {serverError ? <Text style={styles.error}>{serverError}</Text> : null}

        {renderField('Name', name, setName, 'Your full name', { fieldKey: 'name', autoCapitalize: 'words' })}
        {renderField('Email', email, setEmail, 'you@example.com', { fieldKey: 'email', keyboardType: 'email-address' })}
        {renderField('Phone', phone, setPhone, '10-digit phone number', { fieldKey: 'phone', keyboardType: 'phone-pad' })}
        {renderField('Pincode', pincode, setPincode, '6-digit pincode', { fieldKey: 'pincode', keyboardType: 'number-pad' })}
        {renderField('Password', password, setPassword, 'Minimum 8 characters', { fieldKey: 'password', secure: true })}

        <Text style={styles.label}>Referral Code (optional)</Text>
        <TextInput
          style={styles.input}
          value={referralCode}
          onChangeText={setReferralCode}
          placeholder="e.g. CP-ABCDE"
          placeholderTextColor={theme.colors.textSecondary}
          autoCapitalize="characters"
          accessibilityLabel="Referral code input"
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleRegister}
          disabled={loading}
          accessibilityRole="button"
          accessibilityLabel="Create account"
        >
          {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>Create Account</Text>}
        </TouchableOpacity>

        <View style={styles.row}>
          <Text style={styles.rowText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')} accessibilityRole="link">
            <Text style={styles.linkBold}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: theme.colors.background },
  container: { flexGrow: 1, paddingHorizontal: theme.spacing.xl, paddingVertical: theme.spacing.md },
  label: { fontFamily: theme.fonts.medium, fontSize: 14, color: theme.colors.text, marginBottom: theme.spacing.xs, marginTop: theme.spacing.sm },
  input: { fontFamily: theme.fonts.regular, fontSize: 15, color: theme.colors.text, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.borderRadius.sm, paddingVertical: 12, paddingHorizontal: 16, backgroundColor: theme.colors.cardBackground },
  inputError: { borderColor: theme.colors.error },
  fieldError: { fontFamily: theme.fonts.regular, fontSize: 12, color: theme.colors.error, marginTop: 2 },
  error: { fontFamily: theme.fonts.regular, fontSize: 13, color: theme.colors.error, textAlign: 'center', marginBottom: theme.spacing.sm, backgroundColor: '#FDE8E8', padding: theme.spacing.sm, borderRadius: theme.borderRadius.sm },
  button: { backgroundColor: theme.colors.primary, paddingVertical: 14, borderRadius: theme.borderRadius.sm, alignItems: 'center', marginTop: theme.spacing.lg },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { fontFamily: theme.fonts.semiBold, fontSize: 16, color: '#FFFFFF' },
  row: { flexDirection: 'row', justifyContent: 'center', marginTop: theme.spacing.md, marginBottom: theme.spacing.xl },
  rowText: { fontFamily: theme.fonts.regular, fontSize: 14, color: theme.colors.textSecondary },
  linkBold: { fontFamily: theme.fonts.semiBold, fontSize: 14, color: theme.colors.primary },
});
