import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { theme } from '../theme';
import { getScanHistory, clearScanHistory } from '../utils/scanHistory';
import NutriScoreBadge from '../components/NutriScoreBadge';

/**
 * Format an ISO 8601 timestamp as a readable string.
 * If the date is today, show "Today HH:MM AM/PM".
 * Otherwise show "Mon DD, YYYY" format.
 */
function formatTimestamp(isoString) {
  if (!isoString) return '';
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return '';

    const now = new Date();
    const isToday =
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate();

    if (isToday) {
      const hours = date.getHours();
      const minutes = date.getMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12;
      const displayMinutes = minutes < 10 ? `0${minutes}` : minutes;
      return `Today ${displayHours}:${displayMinutes} ${ampm}`;
    }

    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];
    const month = months[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    return `${month} ${day}, ${year}`;
  } catch {
    return '';
  }
}

export default function ScanHistoryScreen({ navigation }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      async function loadHistory() {
        setLoading(true);
        const records = await getScanHistory();
        if (!cancelled) {
          setHistory(records);
          setLoading(false);
        }
      }

      loadHistory();

      return () => {
        cancelled = true;
      };
    }, [])
  );

  function handleRecordPress(record) {
    navigation.navigate('ResultCard', { barcode: record.barcode, product: null });
  }

  function handleClearHistory() {
    Alert.alert(
      'Clear Scan History',
      'Are you sure you want to clear all scan history?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await clearScanHistory();
            setHistory([]);
          },
        },
      ]
    );
  }

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => handleRecordPress(item)}
      activeOpacity={0.8}
    >
      <View style={styles.cardContent}>
        <View style={styles.cardLeft}>
          <Text style={styles.productName} numberOfLines={1}>
            {item.productName || 'Unknown Product'}
          </Text>
          <Text style={styles.brandName} numberOfLines={1}>
            {item.brand || 'Unknown Brand'}
          </Text>
          <View style={styles.metaRow}>
            <Text style={styles.timestamp}>{formatTimestamp(item.scannedAt)}</Text>
            {item.hasChoosePureReport && (
              <View style={styles.labTestedBadge}>
                <Text style={styles.labTestedText}>Lab Tested</Text>
              </View>
            )}
          </View>
        </View>
        {item.nutriScore ? (
          <View style={styles.cardRight}>
            <NutriScoreBadge grade={item.nutriScore} />
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={history}
        keyExtractor={(item, index) => `${item.barcode}-${index}`}
        renderItem={renderItem}
        contentContainerStyle={
          history.length === 0 ? styles.emptyContainer : styles.list
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              No scans yet. Scan a product to get started.
            </Text>
          </View>
        }
      />
      {history.length > 0 && (
        <TouchableOpacity
          style={styles.clearButton}
          onPress={handleClearHistory}
          activeOpacity={0.8}
        >
          <Text style={styles.clearButtonText}>Clear History</Text>
        </TouchableOpacity>
      )}
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
    backgroundColor: theme.colors.background,
  },
  list: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xl + 60,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  emptyState: {
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: theme.fonts.regular,
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },

  /* Card */
  card: {
    backgroundColor: theme.colors.cardBackground,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardLeft: {
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  cardRight: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  productName: {
    fontFamily: theme.fonts.bold,
    fontSize: 15,
    color: theme.colors.text,
  },
  brandName: {
    fontFamily: theme.fonts.regular,
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.xs,
    gap: theme.spacing.sm,
  },
  timestamp: {
    fontFamily: theme.fonts.regular,
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  labTestedBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
  },
  labTestedText: {
    fontFamily: theme.fonts.medium,
    fontSize: 11,
    color: theme.colors.success,
  },

  /* Clear button */
  clearButton: {
    position: 'absolute',
    bottom: theme.spacing.lg,
    left: theme.spacing.md,
    right: theme.spacing.md,
    backgroundColor: theme.colors.error,
    paddingVertical: theme.spacing.sm + 4,
    borderRadius: theme.borderRadius.sm,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  clearButtonText: {
    color: '#fff',
    fontFamily: theme.fonts.semiBold,
    fontSize: 15,
  },
});
