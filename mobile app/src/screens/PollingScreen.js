import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Modal, TextInput,
  StyleSheet, ActivityIndicator, RefreshControl, Alert, Image,
} from 'react-native';
import RazorpayCheckout from 'react-native-razorpay';
import { theme } from '../theme';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import { logVoteCast } from '../services/firebase/analytics';
import { useRealtimeVotes } from '../hooks/useRealtimeVotes';
import { useFeatureFlag } from '../hooks/useFeatureFlag';
import Card from '../components/Card';
import Button from '../components/Button';
import Icon from '../components/Icon';

const RAZORPAY_KEY = 'rzp_live_TteiJ3iAXxD93r';

function isSubscriber(user) {
  if (!user) return false;
  if (user.subscriptionStatus === 'subscribed') return true;
  if (user.subscriptionStatus === 'cancelled' && user.subscriptionExpiry) {
    return new Date(user.subscriptionExpiry) > new Date();
  }
  return false;
}

export default function PollingScreen() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [voteCount, setVoteCount] = useState('1');
  const [paying, setPaying] = useState(false);
  const [freeVoteEligible, setFreeVoteEligible] = useState(false);
  const [freeVoting, setFreeVoting] = useState(false);
  const [suggestion, setSuggestion] = useState('');

  const subscribed = isSubscriber(user);

  const realtimeEnabled = useFeatureFlag('polling_realtime_enabled', true);

  const productIds = useMemo(
    () => products.map((p) => p._id),
    [products],
  );

  const { voteCounts, isConnected } = useRealtimeVotes(
    realtimeEnabled ? productIds : [],
  );

  const fetchProducts = useCallback(async () => {
    try {
      const res = await apiClient.get('/api/polls/products');
      const data = res.data.products || res.data || [];
      setProducts(data.sort((a, b) => (b.totalVotes || 0) - (a.totalVotes || 0)));
    } catch (e) {
      Alert.alert('Error', 'Failed to load products.');
    }
  }, []);

  const checkFreeVote = useCallback(async () => {
    if (!subscribed) return;
    try {
      const res = await apiClient.get('/api/polls/free-vote-status');
      setFreeVoteEligible(res.data.eligible || false);
    } catch (e) { /* ignore */ }
  }, [subscribed]);

  useEffect(() => {
    Promise.all([fetchProducts(), checkFreeVote()]).finally(() => setLoading(false));
  }, [fetchProducts, checkFreeVote]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchProducts(), checkFreeVote()]);
    setRefreshing(false);
  }, [fetchProducts, checkFreeVote]);

  const openVoteModal = (product) => {
    setSelectedProduct(product);
    setVoteCount('1');
    setModalVisible(true);
  };

  const handlePaidVote = async () => {
    if (!selectedProduct) return;
    const count = parseInt(voteCount, 10);
    if (!count || count < 1) { Alert.alert('Invalid', 'Enter a valid vote count.'); return; }
    try {
      setPaying(true);
      const res = await apiClient.post('/api/polls/vote', {
        productId: selectedProduct._id,
        voteCount: count,
      });
      const { orderId, amount, currency } = res.data;
      const options = {
        key: RAZORPAY_KEY,
        order_id: orderId,
        amount,
        currency: currency || 'INR',
        name: 'ChoosePure',
        description: `${count} vote(s) for ${selectedProduct.name}`,
        prefill: { email: user?.email, contact: user?.phone },
        theme: { color: theme.colors.primary },
      };
      const paymentData = await RazorpayCheckout.open(options);
      await apiClient.post('/api/polls/verify-payment', {
        razorpay_order_id: orderId,
        razorpay_payment_id: paymentData.razorpay_payment_id,
        razorpay_signature: paymentData.razorpay_signature,
      });
      setModalVisible(false);
      await fetchProducts();
      try { logVoteCast(selectedProduct._id, count); } catch (e) { /* analytics should never break user flow */ }
      Alert.alert('Success', 'Your vote has been recorded!');
    } catch (e) {
      if (e?.error?.code !== 'PAYMENT_CANCELLED') {
        Alert.alert('Payment Failed', 'Something went wrong. Please try again.');
      }
    } finally {
      setPaying(false);
    }
  };

  const handleFreeVote = async () => {
    if (!selectedProduct) return;
    try {
      setFreeVoting(true);
      await apiClient.post('/api/polls/free-vote', { productId: selectedProduct._id });
      setModalVisible(false);
      setFreeVoteEligible(false);
      await fetchProducts();
      try { logVoteCast(selectedProduct._id, 1); } catch (e) { /* analytics should never break user flow */ }
      Alert.alert('Success', 'Free vote cast!');
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Could not cast free vote.');
    } finally {
      setFreeVoting(false);
    }
  };

  // Track which products the user has voted on in this session (for toggle UI)
  const [votedProducts, setVotedProducts] = useState({});

  const handleQuickVote = (product) => {
    if (votedProducts[product._id]) {
      // Already voted — toggle off visually (no API undo)
      setVotedProducts((prev) => ({ ...prev, [product._id]: false }));
    } else {
      // Open modal for vote flow
      openVoteModal(product);
    }
  };

  const handleSubmitSuggestion = () => {
    if (!suggestion.trim()) return;
    // Placeholder — could wire to an API
    Alert.alert('Thanks!', 'Your suggestion has been submitted.');
    setSuggestion('');
  };

  const renderProduct = ({ item }) => {
    const displayVotes =
      realtimeEnabled && voteCounts[item._id] !== undefined
        ? voteCounts[item._id]
        : item.totalVotes || 0;

    const isVoted = !!votedProducts[item._id];

    return (
      <Card style={styles.productCard}>
        <View style={styles.productRow}>
          <View style={styles.productInfo}>
            <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.productVotes}>{displayVotes.toLocaleString()} votes</Text>
          </View>
          <Button
            variant={isVoted ? 'secondary' : 'primary'}
            size="sm"
            onPress={() => openVoteModal(item)}
          >
            {isVoted ? 'Voted' : 'Vote'}
          </Button>
        </View>
      </Card>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {realtimeEnabled && !isConnected && (
        <View style={styles.realtimeBanner}>
          <Text style={styles.realtimeBannerText}>Live updates paused</Text>
        </View>
      )}
      <FlatList
        data={products}
        keyExtractor={(item) => item._id}
        renderItem={renderProduct}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
        }
        ListHeaderComponent={
          <Card style={styles.explanationCard}>
            <Text style={styles.explanationText}>
              Every month we test a new category. Your votes decide what we test next.
            </Text>
          </Card>
        }
        ListFooterComponent={
          <Card style={styles.suggestCard}>
            <Text style={styles.suggestLabel}>SUGGEST A CATEGORY</Text>
            <TextInput
              style={styles.suggestInput}
              placeholder="What would you like us to test?"
              placeholderTextColor={theme.colors.textDim}
              value={suggestion}
              onChangeText={setSuggestion}
            />
            <View style={styles.suggestBtnWrap}>
              <Button variant="primary" fullWidth onPress={handleSubmitSuggestion}>
                Submit
              </Button>
            </View>
          </Card>
        }
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyText}>No products to vote on yet.</Text>
          </View>
        }
      />

      {/* Vote modal — preserved from original */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Vote for {selectedProduct?.name}</Text>
            <Text style={styles.modalSubtitle}>How many votes?</Text>
            <TextInput
              style={styles.modalInput}
              keyboardType="number-pad"
              value={voteCount}
              onChangeText={setVoteCount}
              placeholder="1"
              placeholderTextColor={theme.colors.textDim}
            />
            <Button variant="primary" fullWidth onPress={handlePaidVote} disabled={paying}>
              {paying ? <ActivityIndicator color="#fff" /> : 'Pay & Vote'}
            </Button>
            {subscribed && freeVoteEligible && (
              <View style={styles.freeVoteWrap}>
                <Button variant="outline" fullWidth onPress={handleFreeVote} disabled={freeVoting}>
                  {freeVoting ? <ActivityIndicator color={theme.colors.primary} /> : 'Use Free Vote'}
                </Button>
              </View>
            )}
            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  list: {
    padding: 20,
    paddingBottom: 40,
  },

  /* Explanation card */
  explanationCard: {
    padding: 16,
    marginBottom: theme.spacing.md,
  },
  explanationText: {
    fontFamily: theme.fonts.regular,
    fontSize: theme.fontSize.base,
    color: theme.colors.text,
    lineHeight: theme.lineHeight.base,
  },

  /* Product cards */
  productCard: {
    padding: 16,
    marginBottom: 10,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontFamily: theme.fonts.bold,
    fontSize: theme.fontSize.base,
    color: theme.colors.text,
  },
  productVotes: {
    fontFamily: theme.fonts.regular,
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },

  /* Suggest card */
  suggestCard: {
    padding: 16,
    marginTop: 6,
  },
  suggestLabel: {
    fontFamily: theme.fonts.bold,
    fontSize: theme.fontSize['2xs'],
    color: theme.colors.textSecondary,
    letterSpacing: 4,
    marginBottom: 8,
  },
  suggestInput: {
    backgroundColor: theme.colors.cardBackground,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontFamily: theme.fonts.regular,
    fontSize: theme.fontSize.base,
    color: theme.colors.text,
  },
  suggestBtnWrap: {
    marginTop: 12,
  },

  /* Empty */
  emptyWrap: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: theme.colors.textSecondary,
    fontFamily: theme.fonts.regular,
    fontSize: theme.fontSize.base,
  },

  /* Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.cardBackground,
    borderTopLeftRadius: theme.borderRadius.lg,
    borderTopRightRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  modalTitle: {
    fontFamily: theme.fonts.semiBold,
    fontSize: 18,
    color: theme.colors.text,
  },
  modalSubtitle: {
    fontFamily: theme.fonts.regular,
    fontSize: theme.fontSize.base,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.sm,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontFamily: theme.fonts.regular,
    fontSize: 16,
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.md,
    color: theme.colors.text,
  },
  freeVoteWrap: {
    marginTop: theme.spacing.sm,
  },
  cancelBtn: {
    alignItems: 'center',
    marginTop: theme.spacing.md,
  },
  cancelText: {
    color: theme.colors.textSecondary,
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSize.base,
  },

  /* Realtime banner */
  realtimeBanner: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
  },
  realtimeBannerText: {
    fontFamily: theme.fonts.regular,
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
});
