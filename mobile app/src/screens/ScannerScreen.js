import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Linking,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  AppState,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useNetInfo } from '@react-native-community/netinfo';
import { theme } from '../theme';
import apiClient from '../api/client';
import OfflineBanner from '../components/OfflineBanner';
import Icon from '../components/Icon';
import { logScanProduct } from '../services/firebase/analytics';

/**
 * Validate a barcode string for EAN-13 format.
 */
export function validateBarcode(input) {
  if (!/^\d+$/.test(input)) {
    return { valid: false, error: 'Barcode must contain only numbers' };
  }
  if (input.length !== 13) {
    return { valid: false, error: 'Please enter a valid 13-digit barcode' };
  }
  return { valid: true, error: null };
}

// Recent scan placeholder colors matching the handoff
const RECENT_SCAN_COLORS = ['#F4D03F', '#E8DCC4', '#D14E36', '#E5D5BE'];

export default function ScannerScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [manualBarcode, setManualBarcode] = useState('');
  const [loading, setLoading] = useState(false);
  const [lookupBarcode, setLookupBarcode] = useState('');
  const [error, setError] = useState(null);
  const [manualError, setManualError] = useState(null);
  const [permissionRequested, setPermissionRequested] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const netInfo = useNetInfo();
  const isOffline = netInfo.isConnected === false;

  // Re-check permission when app comes back from settings
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active' && permission && !permission.granted) {
        // Re-request to refresh the permission status
        requestPermission();
      }
    });
    return () => subscription.remove();
  }, [permission, requestPermission]);

  // Auto-request permission on first mount
  useEffect(() => {
    if (permission && !permission.granted && !permissionRequested) {
      setPermissionRequested(true);
      requestPermission();
    }
  }, [permission, permissionRequested, requestPermission]);

  function handleBarcodeScanned({ type, data }) {
    if (data.length !== 13 || !/^\d{13}$/.test(data)) return;
    setScanned(true);
    lookupProduct(data);
  }

  async function lookupProduct(barcode) {
    setLoading(true);
    setLookupBarcode(barcode);
    setError(null);
    try {
      const res = await apiClient.get(`/api/off/product/${barcode}`);
      if (res.data.found) {
        try { logScanProduct(barcode); } catch (e) { /* analytics should never break user flow */ }
        navigation.navigate('ResultCard', { product: res.data.product, barcode });
      } else {
        setError('Product not found in Open Food Facts database');
      }
    } catch (e) {
      if (e.response?.status === 504) {
        setError('Lookup timed out. Please try again.');
      } else {
        setError('Network error. Please check your connection.');
      }
    } finally {
      setLoading(false);
      setScanned(false);
    }
  }

  function handleManualSubmit() {
    setManualError(null);
    const result = validateBarcode(manualBarcode.trim());
    if (!result.valid) {
      setManualError(result.error);
      return;
    }
    lookupProduct(manualBarcode.trim());
  }

  function handleScanAgain() {
    setError(null);
    setScanned(false);
  }

  async function handleRequestPermission() {
    const result = await requestPermission();
    if (!result.granted && result.canAskAgain === false) {
      // User permanently denied — open settings
      Linking.openSettings();
    }
  }

  // Loading permission state
  if (!permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.colors.primarySoft} />
      </View>
    );
  }

  const cameraGranted = permission.granted;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <OfflineBanner />

      {/* Dark header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Scan Product</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('DashboardHome')}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Icon name="close" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        bounces={false}
      >
        {/* Camera or permission request */}
        {cameraGranted ? (
          <View style={styles.cameraContainer}>
            <CameraView
              style={styles.camera}
              facing="back"
              onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
              barcodeScannerSettings={{ barcodeTypes: ['ean13'] }}
            />

            {/* Flash and Gallery buttons */}
            <View style={styles.actionButtonsRow}>
              <TouchableOpacity style={styles.circleButton} activeOpacity={0.8}>
                <Icon name="flash" size={20} color={theme.colors.text} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.circleButton} activeOpacity={0.8}>
                <Icon name="image" size={18} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            {/* Green corner brackets viewfinder */}
            <View style={styles.viewfinderOverlay}>
              <View style={styles.viewfinderFrame}>
                {/* Top-left corner */}
                <View style={[styles.corner, styles.cornerTopLeft]} />
                {/* Top-right corner */}
                <View style={[styles.corner, styles.cornerTopRight]} />
                {/* Bottom-left corner */}
                <View style={[styles.corner, styles.cornerBottomLeft]} />
                {/* Bottom-right corner */}
                <View style={[styles.corner, styles.cornerBottomRight]} />
              </View>
              <Text style={styles.scanHint}>Position barcode within frame</Text>
            </View>
          </View>
        ) : (
          <View style={styles.deniedContainer}>
            <Icon name="scan" size={48} color={theme.colors.primarySoft} />
            <Text style={styles.deniedTitle}>Camera Permission Needed</Text>
            <Text style={styles.deniedText}>
              We need camera access to scan product barcodes. You can also enter barcodes manually below.
            </Text>
            <TouchableOpacity
              style={styles.grantButton}
              onPress={handleRequestPermission}
              activeOpacity={0.8}
            >
              <Text style={styles.grantButtonText}>
                {permission.canAskAgain === false ? 'Open Settings' : 'Allow Camera Access'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Error display */}
        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.scanAgainButton}
              onPress={handleScanAgain}
              activeOpacity={0.8}
            >
              <Text style={styles.scanAgainButtonText}>Scan Again</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Bottom white section */}
        <View style={styles.bottomSection}>
          {/* Recent Scans */}
          <Text style={styles.recentScansLabel}>Recent Scans</Text>
          <View style={styles.recentScansRow}>
            {RECENT_SCAN_COLORS.map((color, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.recentScanThumb, { backgroundColor: color }]}
                onPress={() => navigation.navigate('ScanHistory')}
                activeOpacity={0.8}
              />
            ))}
          </View>

          {/* Manual barcode entry — always visible */}
          <View style={styles.manualEntrySection}>
            <Text style={styles.manualEntryLabel}>Enter barcode manually</Text>
            <View style={styles.manualEntryRow}>
              <TextInput
                style={styles.input}
                placeholder="13-digit barcode number"
                placeholderTextColor={theme.colors.textDim}
                value={manualBarcode}
                onChangeText={(text) => {
                  setManualBarcode(text);
                  if (manualError) setManualError(null);
                }}
                keyboardType="numeric"
                maxLength={13}
                returnKeyType="done"
                onSubmitEditing={handleManualSubmit}
              />
              <TouchableOpacity
                style={[
                  styles.lookupButton,
                  (isOffline || loading) && styles.lookupButtonDisabled,
                ]}
                onPress={handleManualSubmit}
                disabled={isOffline || loading}
                activeOpacity={0.8}
              >
                <Text style={styles.lookupButtonText}>Search</Text>
              </TouchableOpacity>
            </View>
            {manualError ? (
              <Text style={styles.manualErrorText}>{manualError}</Text>
            ) : null}
          </View>
        </View>
      </ScrollView>

      {/* Loading overlay */}
      {loading ? (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Looking up {lookupBarcode}...</Text>
        </View>
      ) : null}
    </KeyboardAvoidingView>
  );
}

const CORNER_SIZE = 32;
const CORNER_BORDER_WIDTH = 3;
const VIEWFINDER_WIDTH = 240;
const VIEWFINDER_HEIGHT = 208;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#0D0D0D',
  },
  headerTitle: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSize.lg,
    color: theme.colors.primarySoft,
  },

  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },

  // Camera / Viewfinder
  cameraContainer: {
    flex: 1,
    minHeight: 400,
    position: 'relative',
    backgroundColor: '#1A1208',
  },
  camera: {
    ...StyleSheet.absoluteFillObject,
  },

  // Flash / Gallery action buttons
  actionButtonsRow: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  circleButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Viewfinder overlay with corner brackets
  viewfinderOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewfinderFrame: {
    width: VIEWFINDER_WIDTH,
    height: VIEWFINDER_HEIGHT,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE,
  },
  cornerTopLeft: {
    top: 0,
    left: 0,
    borderTopWidth: CORNER_BORDER_WIDTH,
    borderLeftWidth: CORNER_BORDER_WIDTH,
    borderColor: theme.colors.primarySoft,
    borderTopLeftRadius: theme.borderRadius.sm,
  },
  cornerTopRight: {
    top: 0,
    right: 0,
    borderTopWidth: CORNER_BORDER_WIDTH,
    borderRightWidth: CORNER_BORDER_WIDTH,
    borderColor: theme.colors.primarySoft,
    borderTopRightRadius: theme.borderRadius.sm,
  },
  cornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: CORNER_BORDER_WIDTH,
    borderLeftWidth: CORNER_BORDER_WIDTH,
    borderColor: theme.colors.primarySoft,
    borderBottomLeftRadius: theme.borderRadius.sm,
  },
  cornerBottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: CORNER_BORDER_WIDTH,
    borderRightWidth: CORNER_BORDER_WIDTH,
    borderColor: theme.colors.primarySoft,
    borderBottomRightRadius: theme.borderRadius.sm,
  },
  scanHint: {
    color: '#FFFFFF',
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSize.base,
    marginTop: 24,
    textAlign: 'center',
  },

  // Permission denied
  deniedContainer: {
    flex: 1,
    minHeight: 300,
    padding: theme.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0D0D0D',
  },
  deniedTitle: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSize.lg,
    color: '#FFFFFF',
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  deniedText: {
    fontFamily: theme.fonts.regular,
    fontSize: theme.fontSize.base,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: theme.spacing.lg,
  },
  grantButton: {
    backgroundColor: theme.colors.primarySoft,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: 12,
    borderRadius: theme.borderRadius.lg,
    width: '100%',
    alignItems: 'center',
  },
  grantButtonText: {
    color: '#FFFFFF',
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSize.md,
  },

  // Error
  errorContainer: {
    marginHorizontal: 20,
    marginTop: theme.spacing.md,
    padding: theme.spacing.md,
    backgroundColor: 'rgba(209, 78, 54, 0.15)',
    borderRadius: theme.borderRadius.sm,
    alignItems: 'center',
  },
  errorText: {
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSize.base,
    color: theme.colors.error,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  scanAgainButton: {
    backgroundColor: theme.colors.primarySoft,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
  },
  scanAgainButtonText: {
    color: '#FFFFFF',
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSize.base,
  },

  // Bottom white section
  bottomSection: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  recentScansLabel: {
    fontFamily: theme.fonts.regular,
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: 10,
  },
  recentScansRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  recentScanThumb: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.md,
  },

  // Manual entry — always visible
  manualEntrySection: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: 14,
    paddingBottom: 20,
  },
  manualEntryLabel: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSize.base,
    color: theme.colors.text,
    marginBottom: 10,
  },
  manualEntryRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  input: {
    flex: 1,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 12,
    fontFamily: theme.fonts.regular,
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    letterSpacing: 1,
  },
  manualErrorText: {
    fontFamily: theme.fonts.regular,
    fontSize: theme.fontSize.sm,
    color: theme.colors.error,
    marginTop: theme.spacing.xs,
  },
  lookupButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lookupButtonDisabled: {
    opacity: 0.5,
  },
  lookupButtonText: {
    color: '#FFFFFF',
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSize.base,
  },

  // Loading overlay
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSize.base,
    marginTop: theme.spacing.sm,
  },
});
