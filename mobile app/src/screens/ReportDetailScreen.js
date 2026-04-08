import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { theme } from '../theme';
import apiClient from '../api/client';

export default function ReportDetailScreen({ route }) {
  const { reportId } = route.params;
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);

  const fetchReport = async () => {
    try {
      setError(null);
      setLoading(true);
      const res = await apiClient.get(`/api/reports/${reportId}`);
      setReport(res.data.report || res.data);
    } catch (e) {
      setError('Failed to load report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReport(); }, [reportId]);

  const handleDownloadPdf = async () => {
    try {
      setDownloading(true);
      const fileUri = FileSystem.cacheDirectory + `report-${reportId}.pdf`;
      const res = await FileSystem.downloadAsync(
        `https://api.choosepure.in/api/reports/${reportId}/pdf`,
        fileUri
      );
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(res.uri);
      } else {
        Alert.alert('Sharing not available', 'Sharing is not supported on this device.');
      }
    } catch (e) {
      Alert.alert('Download Failed', 'Could not download the PDF. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={fetchReport}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!report) return null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.productName}>{report.productName}</Text>
      <Text style={styles.brandName}>{report.brandName}</Text>

      {/* Purity Score Circle */}
      <View style={styles.scoreCircle}>
        <Text style={styles.scoreValue}>{report.purityScore ?? '—'}</Text>
        <Text style={styles.scoreLabel}>Purity Score</Text>
      </View>

      {/* Test Parameters */}
      {report.testParameters && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Test Parameters</Text>
          {Object.entries(report.testParameters).map(([key, value]) => (
            <View key={key} style={styles.paramRow}>
              <Text style={styles.paramKey}>{key}</Text>
              <Text style={styles.paramValue}>{typeof value === 'object' ? JSON.stringify(value) : String(value)}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Expert Commentary */}
      {report.expertCommentary ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Expert Commentary</Text>
          <Text style={styles.bodyText}>{report.expertCommentary}</Text>
        </View>
      ) : null}

      {/* Methodology */}
      {report.methodology ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Methodology</Text>
          <Text style={styles.bodyText}>{report.methodology}</Text>
        </View>
      ) : null}

      {/* Details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Details</Text>
        {report.batchCode ? <DetailRow label="Batch Code" value={report.batchCode} /> : null}
        {report.shelfLife ? <DetailRow label="Shelf Life" value={report.shelfLife} /> : null}
        {report.testDate ? <DetailRow label="Test Date" value={report.testDate} /> : null}
      </View>

      {/* PDF Download */}
      <TouchableOpacity
        style={styles.downloadBtn}
        onPress={handleDownloadPdf}
        disabled={downloading}
      >
        {downloading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.downloadText}>📄 Download PDF Report</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

function DetailRow({ label, value }) {
  return (
    <View style={styles.paramRow}>
      <Text style={styles.paramKey}>{label}</Text>
      <Text style={styles.paramValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.lg, paddingBottom: theme.spacing.xl * 2 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: theme.spacing.lg },
  productName: { fontFamily: theme.fonts.bold, fontSize: 22, color: theme.colors.text },
  brandName: { fontFamily: theme.fonts.regular, fontSize: 15, color: theme.colors.textSecondary, marginTop: 2 },
  scoreCircle: {
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center', alignItems: 'center',
    alignSelf: 'center', marginVertical: theme.spacing.lg,
  },
  scoreValue: { color: '#fff', fontFamily: theme.fonts.bold, fontSize: 32 },
  scoreLabel: { color: '#ffffffcc', fontFamily: theme.fonts.regular, fontSize: 12, marginTop: 2 },
  section: {
    marginTop: theme.spacing.lg,
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
  },
  sectionTitle: { fontFamily: theme.fonts.semiBold, fontSize: 16, color: theme.colors.primary, marginBottom: theme.spacing.sm },
  bodyText: { fontFamily: theme.fonts.regular, fontSize: 14, color: theme.colors.text, lineHeight: 22 },
  paramRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: theme.spacing.xs, borderBottomWidth: 0.5, borderBottomColor: theme.colors.border,
  },
  paramKey: { fontFamily: theme.fonts.medium, fontSize: 13, color: theme.colors.textSecondary, flex: 1 },
  paramValue: { fontFamily: theme.fonts.regular, fontSize: 13, color: theme.colors.text, flex: 1, textAlign: 'right' },
  downloadBtn: {
    marginTop: theme.spacing.xl,
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  downloadText: { color: '#fff', fontFamily: theme.fonts.semiBold, fontSize: 15 },
  errorText: { color: theme.colors.error, fontFamily: theme.fonts.medium, fontSize: 14, textAlign: 'center', marginBottom: theme.spacing.md },
  retryBtn: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
  },
  retryText: { color: '#fff', fontFamily: theme.fonts.semiBold, fontSize: 14 },
});
