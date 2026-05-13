import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { theme } from '../theme';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import Icon from '../components/Icon';

const SUBJECT_OPTIONS = [
  'General Inquiry',
  'Report Issue',
  'Subscription Help',
  'Account Problem',
  'Feature Request',
  'Other',
];

export default function HelpCenterScreen({ navigation }) {
  const { user } = useAuth();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit() {
    if (!message.trim()) {
      Alert.alert('Error', 'Please enter your message');
      return;
    }

    setLoading(true);
    try {
      const res = await apiClient.post('/api/feedback', {
        name: user?.name || 'App User',
        email: user?.email || '',
        phone: user?.phone || '',
        message: subject ? `[${subject}] ${message.trim()}` : message.trim(),
        source: 'mobile_app',
      });

      if (res.data.success) {
        setSubmitted(true);
      } else {
        Alert.alert('Error', res.data.message || 'Failed to send message');
      }
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function handleSendAnother() {
    setSubject('');
    setMessage('');
    setSubmitted(false);
  }

  if (submitted) {
    return (
      <View style={styles.container}>
        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <Icon name="check" size={32} color={theme.colors.primary} />
          </View>
          <Text style={styles.successTitle}>Message Sent!</Text>
          <Text style={styles.successBody}>
            Thank you for reaching out. Our team will review your message and get back to you at {user?.email || 'your email'}.
          </Text>
          <View style={styles.successActions}>
            <Button variant="primary" size="lg" fullWidth onPress={handleSendAnother}>
              Send Another Message
            </Button>
            <View style={styles.spacerSm} />
            <Button variant="secondary" size="lg" fullWidth onPress={() => navigation.goBack()}>
              Back to Profile
            </Button>
          </View>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header info */}
        <Card style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Icon name="mail" size={20} color={theme.colors.primary} />
            <View style={styles.infoText}>
              <Text style={styles.infoTitle}>Contact Us</Text>
              <Text style={styles.infoBody}>
                Have a question, issue, or suggestion? Send us a message and we'll get back to you within 24 hours.
              </Text>
            </View>
          </View>
        </Card>

        {/* User info (read-only) */}
        <Text style={styles.sectionLabel}>YOUR DETAILS</Text>
        <Card style={styles.card}>
          <Input
            label="Name"
            leftIcon="user"
            value={user?.name || 'User'}
            editable={false}
            style={styles.disabledInput}
          />
          <View style={styles.spacer} />
          <Input
            label="Email"
            leftIcon="mail"
            value={user?.email || ''}
            editable={false}
            style={styles.disabledInput}
          />
        </Card>

        {/* Subject */}
        <Text style={styles.sectionLabel}>SUBJECT (OPTIONAL)</Text>
        <Card style={styles.card}>
          <View style={styles.subjectGrid}>
            {SUBJECT_OPTIONS.map((option) => (
              <Button
                key={option}
                variant={subject === option ? 'primary' : 'secondary'}
                size="sm"
                onPress={() => setSubject(subject === option ? '' : option)}
              >
                {option}
              </Button>
            ))}
          </View>
        </Card>

        {/* Message */}
        <Text style={styles.sectionLabel}>YOUR MESSAGE</Text>
        <Card style={styles.card}>
          <Input
            label="Message"
            value={message}
            onChangeText={setMessage}
            placeholder="Describe your issue, question, or feedback..."
            multiline
            numberOfLines={6}
            style={styles.messageInput}
            textAlignVertical="top"
          />
        </Card>

        {/* Submit */}
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onPress={handleSubmit}
          disabled={loading || !message.trim()}
        >
          {loading ? <ActivityIndicator color="#fff" /> : 'Send Message'}
        </Button>

        <Text style={styles.disclaimer}>
          Your name and email will be shared with our support team so we can respond to you.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },

  /* Info card */
  infoCard: {
    padding: 16,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
  },
  infoTitle: {
    fontFamily: theme.fonts.bold,
    fontSize: theme.fontSize.lg,
    color: theme.colors.text,
    marginBottom: 4,
  },
  infoBody: {
    fontFamily: theme.fonts.regular,
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },

  /* Sections */
  sectionLabel: {
    fontFamily: theme.fonts.bold,
    fontSize: theme.fontSize['2xs'],
    color: theme.colors.textSecondary,
    letterSpacing: 4,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  card: {
    padding: 16,
    marginBottom: 16,
  },
  spacer: { height: 12 },
  spacerSm: { height: 10 },
  disabledInput: { opacity: 0.5 },

  /* Subject grid */
  subjectGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  /* Message input */
  messageInput: {
    minHeight: 120,
    paddingTop: 12,
  },

  /* Disclaimer */
  disclaimer: {
    fontFamily: theme.fonts.regular,
    fontSize: theme.fontSize.xs,
    color: theme.colors.textDim,
    textAlign: 'center',
    marginTop: 12,
  },

  /* Success state */
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  successIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: theme.colors.green100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  successTitle: {
    fontFamily: theme.fonts.bold,
    fontSize: theme.fontSize['2xl'],
    color: theme.colors.text,
    marginBottom: 12,
  },
  successBody: {
    fontFamily: theme.fonts.regular,
    fontSize: theme.fontSize.base,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  successActions: {
    width: '100%',
  },
});
