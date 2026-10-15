import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput, Modal,
  StyleSheet, ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { theme } from '../theme';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = ['Milk', 'Ghee', 'Butter', 'Paneer', 'Curd', 'Honey', 'Oil', 'Spices', 'Other'];

export default function SuggestionScreen() {
  const { user } = useAuth();
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [productName, setProductName] = useState('');
  const [category, setCategory] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchSuggestions = useCallback(async () => {
    try {
      const res = await apiClient.get('/api/suggestions');
      const data = res.data.suggestions || res.data || [];
      setSuggestions(data.sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0)));
    } catch (e) {
      Alert.alert('Error', 'Failed to load suggestions.');
    }
  }, []);

  useEffect(() => { fetchSuggestions().finally(() => setLoading(false)); }, [fetchSuggestions]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchSuggestions();
    setRefreshing(false);
  }, [fetchSuggestions]);

  const handleSubmit = async () => {
    if (!productName.trim()) { Alert.alert('Required', 'Product name is required.'); return; }
    if (!category) { Alert.alert('Required', 'Please select a category.'); return; }
    try {
      setSubmitting(true);
      await apiClient.post('/api/suggestions', {
        productName: productName.trim(),
        category,
        reason: reason.trim() || undefined,
      });
      setProductName('');
      setCategory('');
      setReason('');
      setModalVisible(false);
      await fetchSuggestions();
      Alert.alert('Success', 'Suggestion submitted!');
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to submit suggestion.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpvote = async (id) => {
    // Optimistic update
    setSuggestions((prev) =>
      prev.map((s) => s._id === id ? { ...s, upvotes: (s.upvotes || 0) + 1 } : s)
    );
    try {
      await apiClient.post(`/api/suggestions/${id}/upvote`);
    } catch (e) {
      // Rollback
      setSuggestions((prev) =>
        prev.map((s) => s._id === id ? { ...s, upvotes: (s.upvotes || 0) - 1 } : s)
      );
      const msg = e.response?.data?.message || 'Could not upvote.';
      Alert.alert('Upvote', msg);
    }
  };

  const renderSuggestion = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardBody}>
        <Text style={styles.productName}>{item.productName}</Text>
        <Text style={styles.categoryText}>{item.category}</Text>
        {item.reason ? <Text style={styles.reasonText}>{item.reason}</Text> : null}
      </View>
      <TouchableOpacity style={styles.upvoteBtn} onPress={() => handleUpvote(item._id)}>
        <Text style={styles.upvoteIcon}>👍</Text>
        <Text style={styles.upvoteCount}>{item.upvotes || 0}</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={theme.colors.primary} /></View>;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={suggestions}
        keyExtractor={(item) => item._id}
        renderItem={renderSuggestion}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
        ListEmptyComponent={<View style={styles.center}><Text style={styles.emptyText}>No suggestions yet. Be the first!</Text></View>}
      />
      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Text style={styles.fabText}>+ Suggest</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Suggest a Product</Text>
            <TextInput style={styles.input} placeholder="Product Name" value={productName} onChangeText={setProductName} placeholderTextColor={theme.colors.textSecondary} />
            <Text style={styles.label}>Category</Text>
            <View style={styles.categoryRow}>
              {CATEGORIES.map((c) => (
                <TouchableOpacity key={c} style={[styles.categoryChip, category === c && styles.categoryChipActive]} onPress={() => setCategory(c)}>
                  <Text style={[styles.chipText, category === c && styles.chipTextActive]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput style={[styles.input, styles.textArea]} placeholder="Reason (optional)" value={reason} onChangeText={setReason} multiline numberOfLines={3} placeholderTextColor={theme.colors.textSecondary} />
            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={submitting}>
              {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Submit</Text>}
            </TouchableOpacity>
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
  list: { padding: theme.spacing.md, paddingBottom: 80 },
  card: {
    backgroundColor: theme.colors.cardBackground, borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm, flexDirection: 'row', alignItems: 'center',
    padding: theme.spacing.md, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 2,
  },
  cardBody: { flex: 1 },
  productName: { fontFamily: theme.fonts.semiBold, fontSize: 15, color: theme.colors.text },
  categoryText: { fontFamily: theme.fonts.regular, fontSize: 12, color: theme.colors.accent, marginTop: 2 },
  reasonText: { fontFamily: theme.fonts.regular, fontSize: 12, color: theme.colors.textSecondary, marginTop: 4 },
  upvoteBtn: { alignItems: 'center', paddingLeft: theme.spacing.md },
  upvoteIcon: { fontSize: 20 },
  upvoteCount: { fontFamily: theme.fonts.semiBold, fontSize: 14, color: theme.colors.primary, marginTop: 2 },
  emptyText: { color: theme.colors.textSecondary, fontFamily: theme.fonts.regular, fontSize: 14 },
  fab: {
    position: 'absolute', bottom: theme.spacing.lg, right: theme.spacing.lg,
    backgroundColor: theme.colors.primary, paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg, elevation: 4,
  },
  fabText: { color: '#fff', fontFamily: theme.fonts.semiBold, fontSize: 15 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: theme.colors.cardBackground,
    borderTopLeftRadius: theme.borderRadius.lg, borderTopRightRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg, paddingBottom: theme.spacing.xl,
  },
  modalTitle: { fontFamily: theme.fonts.semiBold, fontSize: 18, color: theme.colors.text, marginBottom: theme.spacing.md },
  label: { fontFamily: theme.fonts.medium, fontSize: 13, color: theme.colors.textSecondary, marginTop: theme.spacing.sm, marginBottom: theme.spacing.xs },
  input: {
    borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.sm, fontFamily: theme.fonts.regular, fontSize: 15, color: theme.colors.text,
  },
  textArea: { marginTop: theme.spacing.sm, textAlignVertical: 'top', minHeight: 70 },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  categoryChip: {
    paddingHorizontal: theme.spacing.sm, paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm, borderWidth: 1, borderColor: theme.colors.border,
  },
  categoryChipActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  chipText: { fontFamily: theme.fonts.medium, fontSize: 12, color: theme.colors.textSecondary },
  chipTextActive: { color: '#fff' },
  submitBtn: {
    backgroundColor: theme.colors.primary, paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.sm, alignItems: 'center', marginTop: theme.spacing.md,
  },
  submitText: { color: '#fff', fontFamily: theme.fonts.semiBold, fontSize: 15 },
  cancelBtn: { alignItems: 'center', marginTop: theme.spacing.md },
  cancelText: { color: theme.colors.textSecondary, fontFamily: theme.fonts.medium, fontSize: 14 },
});
