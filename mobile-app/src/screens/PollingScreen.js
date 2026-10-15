import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Modal, TextInput,
  StyleSheet, ActivityIndicator, RefreshControl, Alert, Image,
} from 'react-native';
import { theme } from '../theme';
import apiClient from '../api/client';
import { logVoteCast } from '../services/firebase/analytics';
import { useRealtimeVotes } from '../hooks/useRealtimeVotes';
import { useFeatureFlag } from '../hooks/useFeatureFlag';
import Card from '../components/Card';
import Button from '../components/Button';
import Icon from '../components/Icon';

export default function PollingScreen() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [voting, setVoting] = useState(false);
  const [suggestion, setSuggestion] = useState('');

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

  useEffect(() => {
    fetchProducts().finally(() => setLoading(false));
  }, [fetchProducts]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchProducts();
    setRefreshing(false);
  }, [fetchProducts]);

  const openVoteModal = (product) => {
    setSelectedProduct(product);
    setModalVisible(true);
  };

  // Voting is free — each user may vote once per product.
  const castVote = async () => {
    if (!selectedProduct) return;
    try {
      setVoting(true);
      const res = await apiClient.post('/api/polls/vote', {
        productId: selectedProduct._id,
      });
      setModalVisible(false);
      await fetchProducts();
      try { logVoteCast(selectedProduct._id, 1); } catch (e) { /* analytics should never break user flow */ }
      Alert.alert('Thank you!', 'Your vote has been recorded.');
    } catch (e) {
      // 409 means the user has already voted for this product.
      if (e?.response?.status === 409 || e?.response?.data?.alreadyVoted) {
        setModalVisible(false);
        Alert.alert('Already voted', `You've already voted for ${selectedProduct.name}. Thanks for your support!`);
      } else {
        Alert.alert('Error', e?.response?.data?.message || 'Could not record your vote. Please try again.');
      }
    } finally {
      setVoting(false);
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
            <Text style={styles.modalSubtitle}>
              Voting is free — you can cast one vote per product.
            </Text>
            <Button variant="primary" fullWidth onPress={castVote} disabled={voting}>
              {voting ? <ActivityIndicator color="#fff" /> : 'Cast My Vote'}
            </Button>
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
