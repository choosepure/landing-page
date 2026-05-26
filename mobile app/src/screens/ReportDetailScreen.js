import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { theme } from '../theme';
import apiClient from '../api/client';
import ScoreHero from '../components/report/ScoreHero';
import MetadataGrid from '../components/report/MetadataGrid';
import CategoryScoreCard from '../components/report/CategoryScoreCard';
import StatsRow from '../components/report/StatsRow';
import TestParameterSection from '../components/report/TestParameterSection';
import ParentSummary from '../components/report/ParentSummary';
import RecommendationCard from '../components/report/RecommendationCard';
import ComparisonTable from '../components/report/ComparisonTable';

export default function ReportDetailScreen({ route, navigation }) {
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
      if (e.response?.status === 403) {
        setError('subscription_required');
      } else if (e.response?.status === 401) {
        setError('login_required');
      } else {
        setError('Failed to load report. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [reportId]);

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

  // Loading state
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  // Error states
  if (error) {
    if (error === 'subscription_required') {
      return (
        <View style={styles.center}>
          <Text style={styles.lockIcon}>🔒</Text>
          <Text style={styles.errorHeading}>Subscription Required</Text>
          <Text style={styles.errorDescription}>
            Subscribe to ChoosePure to access full test reports with detailed lab results.
          </Text>
          <TouchableOpacity
            style={styles.subscribeBtn}
            onPress={() => navigation.navigate('Profile', { screen: 'Subscription' })}
          >
            <Text style={styles.subscribeBtnText}>Subscribe — ₹299/month</Text>
          </TouchableOpacity>
        </View>
      );
    }
    if (error === 'login_required') {
      return (
        <View style={styles.center}>
          <Text style={styles.lockIcon}>🔑</Text>
          <Text style={styles.errorHeading}>Login Required</Text>
          <Text style={styles.errorDescription}>
            Please log in to view test reports.
          </Text>
        </View>
      );
    }
    // Generic error
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={fetchReport}>
          <Text style={styles.retryBtnText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!report) return null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Score Hero - always shown */}
      <ScoreHero
        productName={report.productName}
        brandName={report.brandName}
        purityScore={report.purityScore}
        scoreVerdict={report.scoreVerdict}
      />

      {/* Metadata Grid - always shown, handles null fields internally */}
      <View style={styles.section}>
        <MetadataGrid
          labName={report.labName}
          labReportNumber={report.labReportNumber}
          reportDate={report.reportDate}
          batchCode={report.batchCode}
          sampleCondition={report.sampleCondition}
          totalParametersTested={report.totalParametersTested}
          origin={report.origin}
          shelfLife={report.shelfLife}
        />
      </View>

      {/* Category Scores */}
      {report.categoryScores && report.categoryScores.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Score by Category</Text>
          {report.categoryScores.map((cat, index) => (
            <CategoryScoreCard
              key={index}
              categoryName={cat.categoryName}
              score={cat.score}
              description={cat.description}
            />
          ))}
        </View>
      )}

      {/* Stats Row */}
      {report.stats && (
        <View style={styles.section}>
          <StatsRow
            totalParameters={report.stats.totalParameters}
            passCount={report.stats.passCount}
            contextNotes={report.stats.contextNotes}
            safetyConcerns={report.stats.safetyConcerns}
          />
        </View>
      )}

      {/* Parent Summary */}
      {report.parentSummary && report.parentSummary.length > 0 && (
        <View style={styles.section}>
          <ParentSummary summary={report.parentSummary} />
        </View>
      )}

      {/* Test Parameters */}
      {report.testParameters && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Test Parameters</Text>
          {Object.entries(report.testParameters).map(([categoryName, parameters]) => (
            <TestParameterSection
              key={categoryName}
              categoryName={categoryName}
              parameters={parameters}
            />
          ))}
        </View>
      )}

      {/* Expert Commentary */}
      {report.expertCommentary && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Expert Commentary</Text>
          <Text style={styles.bodyText}>{report.expertCommentary}</Text>
        </View>
      )}

      {/* Methodology */}
      {report.methodology && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Methodology</Text>
          <Text style={styles.bodyText}>{report.methodology}</Text>
        </View>
      )}

      {/* Recommendations */}
      {report.recommendations && report.recommendations.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recommendations</Text>
          {report.recommendations.map((rec, index) => (
            <RecommendationCard
              key={index}
              severity={rec.severity}
              title={rec.title}
              description={rec.description}
            />
          ))}
        </View>
      )}

      {/* Comparison Table */}
      {report.comparisons && report.comparisons.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How It Compares</Text>
          <ComparisonTable
            comparisons={report.comparisons}
            currentProductName={report.productName}
          />
        </View>
      )}

      {/* PDF Download Button */}
      {(report.pdfUrl || reportId) && (
        <TouchableOpacity
          style={styles.downloadBtn}
          onPress={handleDownloadPdf}
          disabled={downloading}
        >
          {downloading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.downloadBtnText}>📄 Download PDF Report</Text>
          )}
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xl * 2,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  lockIcon: {
    fontSize: 48,
    marginBottom: theme.spacing.md,
  },
  errorHeading: {
    fontFamily: theme.fonts.bold,
    fontSize: theme.fontSize['2xl'],
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  errorDescription: {
    fontFamily: theme.fonts.regular,
    fontSize: theme.fontSize.base,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
  },
  subscribeBtn: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  subscribeBtnText: {
    color: '#fff',
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSize.md,
  },
  errorText: {
    color: theme.colors.error,
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSize.base,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  retryBtn: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
  },
  retryBtnText: {
    color: '#fff',
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSize.base,
  },
  section: {
    marginTop: theme.spacing.lg,
  },
  sectionTitle: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSize.lg,
    color: theme.colors.primary,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  bodyText: {
    fontFamily: theme.fonts.regular,
    fontSize: theme.fontSize.base,
    color: theme.colors.text,
    lineHeight: 22,
  },
  downloadBtn: {
    marginTop: theme.spacing.xl,
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  downloadBtnText: {
    color: '#fff',
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSize.md,
  },
});
