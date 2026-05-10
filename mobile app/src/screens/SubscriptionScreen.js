import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import RazorpayCheckout from 'react-native-razorpay';
import { theme } from '../theme';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import { logPurchase } from '../services/firebase/analytics';
import Card from '../components/Card';
import Button from '../components/Button';
import Icon from '../components/Icon';

const RAZORPAY_KEY = 'rzp_live_TteiJ3iAXxD93r';

const PLANS = [
  {
    id: 'monthly',
    title: 'Monthly',
    price: '₹299',
    period: '/month',
    blurb: 'Cancel anytime',
  },
  {
    id: 'annual',
    title: 'Annual',
    price: '₹2,499',
    period: '/year',
    blurb: 'Save ~30% · Best value',
    featured: true,
  },
];

const PERKS = [
  'Access to all current & future lab reports',
  '1 free vote every month to decide what gets tested',
  'Option to buy additional votes for products you care about',
  'Full detailed test results with expert commentary',
  'Cancel anytime — no hassle, no hidden conditions',
];

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
  const [picked, setPicked] = useState('annual');
  const subscribed = isSubscriber(user);

  const handleSubscribe = async () => {
    try {
      setLoading(true);
      const res = await apiClient.post('/api/subscription/create-order', { plan: picked });
      const { type, subscriptionId, orderId, key, amount } = res.data;

      let options;
      if (type === 'subscription') {
        // Monthly recurring subscription
        options = {
          key: key || RAZORPAY_KEY,
          subscription_id: subscriptionId,
          name: 'ChoosePure',
          description: 'Monthly Subscription — ₹299/month',
          prefill: { email: user?.email, contact: user?.phone },
          theme: { color: theme.colors.primary },
        };
      } else {
        // Annual one-time payment
        options = {
          key: key || RAZORPAY_KEY,
          order_id: orderId,
          amount: amount,
          currency: 'INR',
          name: 'ChoosePure',
          description: 'Annual Plan — ₹2,499/year',
          prefill: { email: user?.email, contact: user?.phone },
          theme: { color: theme.colors.primary },
        };
      }

      const paymentData = await RazorpayCheckout.open(options);

      await apiClient.post('/api/subscription/verify-payment', {
        razorpay_subscription_id: paymentData.razorpay_subscription_id,
        razorpay_order_id: paymentData.razorpay_order_id || orderId,
        razorpay_payment_id: paymentData.razorpay_payment_id,
        razorpay_signature: paymentData.razorpay_signature,
        plan: picked,
      });

      const purchaseAmount = picked === 'annual' ? 2499 : 299;
      try { logPurchase(purchaseAmount, 'INR'); } catch (e) {}

      await checkAuth();
      Alert.alert('Subscribed!', 'Welcome to ChoosePure Premium.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      if (e?.error?.code !== 'PAYMENT_CANCELLED') {
        Alert.alert('Payment Failed', e?.response?.data?.message || 'Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (subscribed) {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Card style={styles.activeCard}>
            <View style={styles.iconCircle}>
              <Icon name="star" size={28} color={theme.colors.primaryLight} />
            </View>
            <Text style={styles.activeTitle}>Active Subscription</Text>
            <Text style={styles.activeDetail}>Status: {user.subscriptionStatus}</Text>
            {user.subscriptionExpiry && (
              <Text style={styles.activeDetail}>
                Expires: {new Date(user.subscriptionExpiry).toLocaleDateString()}
              </Text>
            )}
            {user.freeMonthsEarned ? (
              <Text style={styles.activeDetail}>Free months earned: {user.freeMonthsEarned}</Text>
            ) : null}
          </Card>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <Card style={styles.heroCard}>
          <View style={styles.iconCircle}>
            <Icon name="star" size={28} color={theme.colors.primaryLight} />
          </View>
          <Text style={styles.heroTitle}>Go Premium</Text>
          <Text style={styles.heroSubtitle}>Unlock the full Choosepure experience</Text>
        </Card>

        {/* Plan cards */}
        <View style={styles.plansContainer}>
          {PLANS.map((p) => {
            const sel = picked === p.id;
            return (
              <TouchableOpacity
                key={p.id}
                activeOpacity={0.8}
                onPress={() => setPicked(p.id)}
                style={[
                  styles.planCard,
                  sel && styles.planCardSelected,
                ]}
              >
                {p.featured && (
                  <View style={styles.bestValueBadge}>
                    <Text style={styles.bestValueText}>Best value</Text>
                  </View>
                )}
                <View style={styles.planRow}>
                  <View style={styles.planInfo}>
                    <Text style={styles.planTitle}>{p.title}</Text>
                    <Text style={styles.planBlurb}>{p.blurb}</Text>
                  </View>
                  <View style={styles.planPriceCol}>
                    <Text style={styles.planPrice}>{p.price}</Text>
                    <Text style={styles.planPeriod}>{p.period}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Perks */}
        <Card style={styles.perksCard}>
          <Text style={styles.perksLabel}>INCLUDES</Text>
          {PERKS.map((perk) => (
            <View key={perk} style={styles.perkRow}>
              <Icon name="check" size={18} color={theme.colors.primaryLight} strokeWidth={2.5} />
              <Text style={styles.perkText}>{perk}</Text>
            </View>
          ))}
        </Card>

        {/* CTA */}
        <Button variant="primary" size="lg" fullWidth onPress={handleSubscribe} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.ctaText}>Start Free Trial</Text>
          )}
        </Button>
        <Text style={styles.trialNote}>7-day free trial · Cancel anytime</Text>
      </ScrollView>
    </View>
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

  /* Hero */
  heroCard: {
    padding: 20,
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.green100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  heroTitle: {
    fontFamily: theme.fonts.bold,
    fontSize: theme.fontSize['2xl'],
    color: theme.colors.text,
    marginBottom: 4,
  },
  heroSubtitle: {
    fontFamily: theme.fonts.regular,
    fontSize: theme.fontSize.base,
    color: theme.colors.textSecondary,
  },

  /* Plans */
  plansContainer: {
    gap: 12,
    marginBottom: 20,
  },
  planCard: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 16,
    ...theme.shadow.card,
  },
  planCardSelected: {
    borderWidth: 2,
    borderColor: theme.colors.primaryLight,
    ...theme.shadow.elev,
  },
  bestValueBadge: {
    position: 'absolute',
    top: -10,
    left: 16,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  bestValueText: {
    fontFamily: theme.fonts.bold,
    fontSize: theme.fontSize['2xs'],
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  planRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  planInfo: {
    flex: 1,
  },
  planTitle: {
    fontFamily: theme.fonts.bold,
    fontSize: theme.fontSize.base,
    color: theme.colors.text,
  },
  planBlurb: {
    fontFamily: theme.fonts.regular,
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  planPriceCol: {
    alignItems: 'flex-end',
  },
  planPrice: {
    fontFamily: theme.fonts.bold,
    fontSize: theme.fontSize['2xl'],
    color: theme.colors.text,
  },
  planPeriod: {
    fontFamily: theme.fonts.regular,
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
  },

  /* Perks */
  perksCard: {
    padding: 16,
    marginBottom: 20,
  },
  perksLabel: {
    fontFamily: theme.fonts.bold,
    fontSize: theme.fontSize['2xs'],
    color: theme.colors.textSecondary,
    letterSpacing: 4,
    marginBottom: 10,
  },
  perkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 8,
  },
  perkText: {
    fontFamily: theme.fonts.regular,
    fontSize: theme.fontSize.base,
    color: theme.colors.text,
    flex: 1,
  },

  /* CTA */
  ctaText: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSize.base,
    color: '#FFFFFF',
  },
  trialNote: {
    fontFamily: theme.fonts.regular,
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: 12,
  },

  /* Active subscription */
  activeCard: {
    padding: 20,
    alignItems: 'center',
  },
  activeTitle: {
    fontFamily: theme.fonts.semiBold,
    fontSize: 20,
    color: theme.colors.primary,
  },
  activeDetail: {
    fontFamily: theme.fonts.regular,
    fontSize: theme.fontSize.base,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
});
