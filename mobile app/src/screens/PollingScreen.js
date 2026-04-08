import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Modal, TextInput,
  StyleSheet, ActivityIndicator, RefreshControl, Alert, Image,
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

  const subscribed = isSubscriber(user);

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
      Alert.alert('Success', 'Free vote cast!');
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Could not cast free vote.');
    } finally {
      setFreeVoting(false);
    }
  };

  const renderProduct = ({ item }) => (
    <TouchableOpacity style={styles.card} onPress={() => openVoteModal(item)} activeOpacity={0.8}>
      {item.imageUrl ? (
        <Image source={{ uri: item.imageUrl }} style={styles.cardImage} />
      ) : null}
      <View style={styles.cardBody}>
        <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.brandText}>{item.brand} · {item.category}</Text>
        <View style={styles.voteRow}>
          <Text style={styles.voteCount}>{item.totalVotes || 0}</Text>
          <Text style={styles.voteLabel}> votes</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={theme.colors.primary} /></View>;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={products}
        keyExtractor={(item) => item._id}
        renderItem={renderProduct}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
        ListEmptyComponent={<View style={styles.center}><Text style={styles.emptyText}>No products to vote on yet.</Text></View>}
      />

      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Vote for {selectedProduct?.name}</Text>
            <Text style={styles.modalSubtitle}>How many votes?</Text>
            <TextInput
              style={styles.input}
              keyboardType="number-pad"
              value={voteCount}
              onChangeText={setVoteCount}
              placeholder="1"
            />
            <TouchableOpacity style={styles.payBtn} onPress={handlePaidVote} disabled={paying}>
              {paying ? <ActivityIndicator color="#fff" /> : <Text style={styles.payBtnText}>Pay & Vote</Text>}
            </TouchableOpacity>
            {subscribed && freeVoteEligible && (
              <TouchableOpacity style={styles.freeBtn} onPress={handleFreeVote} disabled={freeVoting}>
                {freeVoting ? <ActivityIndicator color={theme.colors.primary} /> : <Text style={styles.freeBtnText}>Use Free Vote</Text>}
              </TouchableOpacity>
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
  container: { flex: 1, backgroundColor: theme.colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: theme.spacing.lg },
  list: { padding: theme.spacing.md, paddingBottom: theme.spacing.xl },
  card: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
    overflow: 'hidden',
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3,
  },
  cardImage: { width: '100%', height: 120, backgroundColor: theme.colors.border },
  cardBody: { padding: theme.spacing.md },
  productName: { fontFamily: theme.fonts.semiBold, fontSize: 16, color: theme.colors.text },
  brandText: { fontFamily: theme.fonts.regular, fontSize: 13, color: theme.colors.textSecondary, marginTop: 2 },
  voteRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: theme.spacing.sm },
  voteCount: { fontFamily: theme.fonts.bold, fontSize: 20, color: theme.colors.primary },
  voteLabel: { fontFamily: theme.fonts.regular, fontSize: 13, color: theme.colors.textSecondary },
  emptyText: { color: theme.colors.textSecondary, fontFamily: theme.fonts.regular, fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: theme.colors.cardBackground,
    borderTopLeftRadius: theme.borderRadius.lg, borderTopRightRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg, paddingBottom: theme.spacing.xl,
  },
  modalTitle: { fontFamily: theme.fonts.semiBold, fontSize: 18, color: theme.colors.text },
  modalSubtitle: { fontFamily: theme.fonts.regular, fontSize: 14, color: theme.colors.textSecondary, marginTop: theme.spacing.sm },
  input: {
    borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.sm, fontFamily: theme.fonts.regular, fontSize: 16,
    marginTop: theme.spacing.sm, color: theme.colors.text,
  },
  payBtn: {
    backgroundColor: theme.colors.primary, paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.sm, alignItems: 'center', marginTop: theme.spacing.md,
  },
  payBtnText: { color: '#fff', fontFamily: theme.fonts.semiBold, fontSize: 15 },
  freeBtn: {
    borderWidth: 1.5, borderColor: theme.colors.primary, paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm, alignItems: 'center', marginTop: theme.spacing.sm,
  },
  freeBtnText: { color: theme.colors.primary, fontFamily: theme.fonts.semiBold, fontSize: 15 },
  cancelBtn: { alignItems: 'center', marginTop: theme.spacing.md },
  cancelText: { color: theme.colors.textSecondary, fontFamily: theme.fonts.medium, fontSize: 14 },
});
