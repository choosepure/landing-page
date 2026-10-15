import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { signInWithPhone, confirmOTP, mapFirebaseAuthError } from '../services/firebase/auth';
import { getPhoneConfirmation, setPhoneConfirmation, clearPhoneConfirmation } from '../utils/phoneAuthState';
import { theme } from '../theme';
import Card from '../components/Card';
import Button from '../components/Button';
import Icon from '../components/Icon';

const OTP_LENGTH = 6;
const COUNTDOWN_SECONDS = 60;

export default function OTPScreen({ navigation, route }) {
  const { phoneNumber } = route.params;
  const { confirmPhoneOTP } = useAuth();

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const [confirmationObj, setConfirmationObj] = useState(() => getPhoneConfirmation());
  const [focusedIndex, setFocusedIndex] = useState(-1);

  const inputRefs = useRef([]);
  const timerRef = useRef(null);

  // -----------------------------------------------------------------------
  // Countdown timer
  // -----------------------------------------------------------------------
  const startCountdown = useCallback(() => {
    setCountdown(COUNTDOWN_SECONDS);

    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          timerRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    startCountdown();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [startCountdown]);

  // -----------------------------------------------------------------------
  // OTP input handlers
  // -----------------------------------------------------------------------
  function handleDigitChange(index, value) {
    if (!/^\d?$/.test(value)) return;
    const next = [...otp];
    next[index] = value;
    setOtp(next);
    if (error) setError('');
    // Auto-advance to next input when a digit is entered
    if (value && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyPress(index, e) {
    // Move to previous input on backspace when current input is empty
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  // -----------------------------------------------------------------------
  // Verify OTP
  // -----------------------------------------------------------------------
  async function handleVerify() {
    setError('');
    const otpString = otp.join('');

    if (otpString.length !== OTP_LENGTH) {
      setError('Please enter the full 6-digit code.');
      return;
    }

    setVerifyLoading(true);
    try {
      const { idToken } = await confirmOTP(confirmationObj, otpString);
      // Hand off to AuthContext for backend token exchange
      await confirmPhoneOTP(idToken);
    } catch (e) {
      if (e.code) {
        setError(mapFirebaseAuthError(e));
      } else {
        setError(e.message || 'Verification failed. Please try again.');
      }
    } finally {
      setVerifyLoading(false);
    }
  }

  // -----------------------------------------------------------------------
  // Resend OTP
  // -----------------------------------------------------------------------
  async function handleResend() {
    setError('');
    setOtp(['', '', '', '', '', '']);
    setResendLoading(true);
    try {
      const newConfirmation = await signInWithPhone(phoneNumber);
      setConfirmationObj(newConfirmation);
      setPhoneConfirmation(newConfirmation);
      startCountdown();
    } catch (e) {
      if (e.code) {
        setError(mapFirebaseAuthError(e));
      } else {
        setError(e.message || 'Failed to resend code. Please try again.');
      }
    } finally {
      setResendLoading(false);
    }
  }

  // -----------------------------------------------------------------------
  // Helpers
  // -----------------------------------------------------------------------
  const isResendDisabled = countdown > 0 || resendLoading;
  const isVerifyDisabled = otp.some((d) => !d) || verifyLoading;

  function formatCountdown(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------
  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
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
          <Text style={styles.headerTitle}>Verify Phone</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Instruction card */}
        <Card style={styles.instructionCard}>
          <View style={styles.iconCircle}>
            <Icon name="mail" size={28} color={theme.colors.primaryLight} />
          </View>
          <Text style={styles.cardTitle}>Check your inbox</Text>
          <Text style={styles.cardDescription}>
            We sent a 6-digit code to{'\n'}
            <Text style={styles.phoneHighlight}>{phoneNumber}</Text>
          </Text>
        </Card>

        {/* Error message */}
        {error ? <Text style={styles.error}>{error}</Text> : null}

        {/* 6 individual digit inputs */}
        <View style={styles.otpRow}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              style={[
                styles.digitInput,
                focusedIndex === index && styles.digitInputFocused,
              ]}
              value={digit}
              onChangeText={(value) => handleDigitChange(index, value)}
              onKeyPress={(e) => handleKeyPress(index, e)}
              onFocus={() => setFocusedIndex(index)}
              onBlur={() => setFocusedIndex(-1)}
              inputMode="numeric"
              keyboardType="number-pad"
              maxLength={1}
              textContentType="oneTimeCode"
              autoFocus={index === 0}
              accessibilityLabel={`Digit ${index + 1} of verification code`}
            />
          ))}
        </View>

        {/* Verify button */}
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onPress={handleVerify}
          disabled={isVerifyDisabled}
        >
          {verifyLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            'Verify & Continue'
          )}
        </Button>

        {/* Resend link */}
        <View style={styles.resendRow}>
          <Text style={styles.resendText}>Didn't receive code? </Text>
          {resendLoading ? (
            <ActivityIndicator size="small" color={theme.colors.primary} />
          ) : (
            <TouchableOpacity
              onPress={handleResend}
              disabled={isResendDisabled}
              accessibilityRole="button"
              accessibilityLabel="Resend verification code"
            >
              <Text
                style={[
                  styles.resendLink,
                  isResendDisabled && styles.resendLinkDisabled,
                ]}
              >
                Resend{countdown > 0 ? ` (${formatCountdown(countdown)})` : ''}
              </Text>
            </TouchableOpacity>
          )}
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

  // Instruction card
  instructionCard: {
    padding: theme.spacing.lg,
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.green100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontFamily: theme.fonts.bold,
    fontSize: theme.fontSize['2xl'],
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  cardDescription: {
    fontFamily: theme.fonts.regular,
    fontSize: theme.fontSize.base,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: theme.lineHeight.base,
  },
  phoneHighlight: {
    fontFamily: theme.fonts.bold,
    color: theme.colors.text,
  },

  // Error
  error: {
    fontFamily: theme.fonts.regular,
    fontSize: theme.fontSize.sm,
    color: theme.colors.error,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },

  // OTP digit inputs
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: theme.spacing.lg,
  },
  digitInput: {
    width: 48,
    height: 56,
    textAlign: 'center',
    fontSize: theme.fontSize['2xl'],
    fontFamily: theme.fonts.bold,
    color: theme.colors.text,
    backgroundColor: theme.colors.cardBackground,
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
  },
  digitInputFocused: {
    borderColor: theme.colors.primaryLight,
  },

  // Resend
  resendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  resendText: {
    fontFamily: theme.fonts.regular,
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  resendLink: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
  },
  resendLinkDisabled: {
    color: theme.colors.textSecondary,
  },
});
