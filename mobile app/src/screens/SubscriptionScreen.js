import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import RazorpayCheckout from 'react-native-razorpay';
import { theme } from '../theme';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';

const RAZORPAY_KEY = 'rzp_live_TteiJ3iAXxD93r';

function isSubscriber(user) {
  if (!user) return false;
  if (user.subscriptionStatus === 'subscribed') return true;
  if (user.subscriptionStatus === 'cancelled' && user.subscriptionExpiry) {
    return new Date(user.subscriptionExpiry) > new Date();
  }
  return false;
}

export default function SubscriptionScreen({ navigation }) {
  const { user, checkAuth } = useAuth();
  const [loading, setLoading] = useState(false);
  const subscribed = isSubscriber(user);

  const handleSubscribe = async () => {
    try {
      setLoading(true);
      const res = await apiClient.post('/api/subscription/create-order');
      const { subscriptionId } = res.data;

      const options = {
        key: RAZORPAY_KEY,
        subscription_id: subscriptionId,
        name: 'ChoosePure',
        description: 'Monthly Subscription — ₹299',
        prefill: { email: user?.email, contact: user?.phone },
        theme: { color: theme.colors.primary },
      };

      const paymentData = await RazorpayCheckout.open(options);

      await apiClient.post('/api/subscription/verify-payment', {
        razorpay_subscription_id: paymentData.razorpay_subscription_id,
        razorpay_payment_id: paymentData.razorpay_payment_id,
        razorpay_signature: paymentData.razorpay_signature,
      });

      await checkAuth();
      Alert.alert('Subscribed!', 'Welcome to ChoosePure Premium.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      if (e?.error?.code !== 'PAYMENT_CANCELLED') {
        Alert.alert('Payment Failed', 'Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (subscribed) {
    return (
      <View style={styles.container}>
        <View style={styles.statusCard}>
          <Text style={styles.statusIcon}>✅</Text>
          <Text style={styles.statusTitle}>Active Subscription</Text>
          <Text style={styles.statusDetail}>Status: {user.subscriptionStatus}</Text>
          {user.subscriptionExpiry && (
            <Text style={styles.statusDetail}>
              Expires: {new Date(user.subscriptionExpiry).toLocaleDateString()}
            </Text>
          )}
          {user.freeMonthsEarned ? (
            <Text style={styles.statusDetail}>Free months earned: {user.freeMonthsEarned}</Text>
          ) : null}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.promoCard}>
        <Text style={styles.promoTitle}>ChoosePure Premium</Text>
        <Text style={styles.promoPrice}>₹299 / month</Text>
        <Text style={styles.promoFeature}>✓ Unlock all purity scores</Text>
        <Text style={styles.promoFeature}>✓ Full test report access</Text>
        <Text style={styles.promoFeature}>✓ 1 free vote per month</Text>
        <Text style={styles.promoFeature}>✓ Support independent testing</Text>
      </View>
      <TouchableOpacity style={styles.subscribeBtn} onPress={handleSubscribe} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.subscribeBtnText}>Subscribe Now</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background, padding: theme.spacing.lg, justifyContent: 'center' },
  statusCard: {
    backgroundColor: theme.colors.cardBackground, borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg, alignItems: 'center',
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3,
  },
  statusIcon: { fontSize: 40, marginBottom: theme.spacing.sm },
  statusTitle: { fontFamily: theme.fonts.semiBold, fontSize: 20, color: theme.colors.primary },
  statusDetail: { fontFamily: theme.fonts.regular, fontSize: 14, color: theme.colors.textSecondary, marginTop: theme.spacing.xs },
  promoCard: {
    backgroundColor: theme.colors.cardBackground, borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3,
  },
  promoTitle: { fontFamily: theme.fonts.bold, fontSize: 22, color: theme.colors.text, textAlign: 'center' },
  promoPrice: { fontFamily: theme.fonts.semiBold, fontSize: 28, color: theme.colors.primary, textAlign: 'center', marginVertical: theme.spacing.md },
  promoFeature: { fontFamily: theme.fonts.regular, fontSize: 15, color: theme.colors.text, marginTop: theme.spacing.xs, paddingLeft: theme.spacing.sm },
  subscribeBtn: {
    backgroundColor: theme.colors.primary, paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md, alignItems: 'center', marginTop: theme.spacing.lg,
  },
  subscribeBtnText: { color: '#fff', fontFamily: theme.fonts.bold, fontSize: 17 },
});
