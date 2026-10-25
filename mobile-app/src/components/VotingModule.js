import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { theme } from '../theme';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import { filterCloseToTested } from '../utils/voteFilters';

// Re-export the pure filter for backwards compatibility with existing callers.
export { filterCloseToTested };

/**
 * VotingModule — shows "close to being tested" products and personal vote summary.
 *
 * Renders null when there are no close-to-tested products AND
 * the user has no votes recorded.
 *
 * @param {{ onProductPress: (productId: string) => void }} props
 */
export default function VotingModule({ onProductPress }) {
  const { user } = useAuth();

  const [closeToTested, setCloseToTested] = useState([]);
  const [myVotes, setMyVotes] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      try {
        // Fetch 1 — "Close to being tested" products
        const res = await apiClient.get('/api/products?status=active');
        const all = res.data.products || [];
        const filtered = filterCloseToTested(all);
        if (!cancelled) setCloseToTested(filtered);
      } catch {
        // If product fetch fails, closeToTested stays empty
      }

      // Fetch 2 — Personal vote summary
      try {
        const votesRes = await apiClient.get('/api/user/my-votes');
        if (!cancelled) setMyVotes(votesRes.data);
      } catch {
        // Fallback to user.votesCount from useAuth
        if (!cancelled) {
          setMyVotes({ totalVotes: user?.votesCount ?? 0, products: [] });
        }
      }

      if (!cancelled) setLoading(false);
    }

    fetchData();

    return () => {
      cancelled = true;
    };
  }, []);

  // Null guard — nothing to show
  if (!loading && closeToTested.length === 0 && (!myVotes || myVotes.totalVotes === 0)) {
    return null;
  }

  // Loading state
  if (loading) {
    return (
      <View
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: theme.spacing.lg,
        }}
      >
        <ActivityIndicator color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Section header */}
      <Text style={styles.sectionTitle}>Help Choose What Gets Tested</Text>
      <Text style={styles.subCaption}>Products need 600 votes to trigger a lab test</Text>

      {/* Close to Being Tested */}
      {closeToTested.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.subHeader}>Close to Being Tested</Text>
          {closeToTested.map((product) => (
            <TouchableOpacity
              key={product._id}
              style={styles.productRow}
              onPress={() => onProductPress && onProductPress(product._id)}
              activeOpacity={0.7}
            >
              <Text style={styles.productName}>{product.productName || product.name}</Text>
              <Text style={styles.votesChip}>{product.totalVotes} / 600 votes</Text>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${Math.min((product.totalVotes / 600) * 100, 100)}%` },
                  ]}
                />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Your Contribution */}
      {myVotes && myVotes.totalVotes > 0 && (
        <View style={styles.card}>
          <Text style={styles.subHeader}>Your Contribution</Text>
          <Text style={styles.contributionText}>
            {myVotes.totalVotes} vote{myVotes.totalVotes === 1 ? '' : 's'} cast
          </Text>
          {myVotes.products && myVotes.products.length > 0 &&
            myVotes.products.map((p) => (
              <Text key={p._id} style={styles.votedProductName}>
                • {p.productName || p.name}
              </Text>
            ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: theme.spacing.lg, marginBottom: theme.spacing.md },
  sectionTitle: { fontFamily: theme.fonts.bold, fontSize: theme.fontSize.xl, color: theme.colors.text, marginBottom: 2 },
  subCaption: { fontFamily: theme.fonts.regular, fontSize: theme.fontSize.xs, color: theme.colors.textSecondary, marginBottom: theme.spacing.sm },
  card: { backgroundColor: theme.colors.cardBackground, borderRadius: theme.borderRadius.lg, padding: theme.spacing.md, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1 },
  subHeader: { fontFamily: theme.fonts.semiBold, fontSize: theme.fontSize.md, color: theme.colors.text, marginBottom: 8 },
  productRow: { marginBottom: 12 },
  productName: { fontFamily: theme.fonts.medium, fontSize: theme.fontSize.sm, color: theme.colors.text, marginBottom: 2 },
  votesChip: { fontFamily: theme.fonts.semiBold, fontSize: theme.fontSize.xs, color: theme.colors.primary, marginBottom: 4 },
  progressTrack: { height: 6, borderRadius: 3, backgroundColor: theme.colors.green50 },
  progressFill: { height: 6, borderRadius: 3, backgroundColor: theme.colors.primary },
  contributionText: { fontFamily: theme.fonts.regular, fontSize: theme.fontSize.sm, color: theme.colors.text, marginBottom: 4 },
  votedProductName: { fontFamily: theme.fonts.regular, fontSize: theme.fontSize.xs, color: theme.colors.textSecondary },
});
