import React, { useState } from 'react';
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
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useNetInfo } from '@react-native-community/netinfo';
import { theme } from '../theme';
import apiClient from '../api/client';
import OfflineBanner from '../components/OfflineBanner';

/**
 * Validate a barcode string for EAN-13 format.
 * @param {string} input - The barcode string to validate
 * @returns {{ valid: boolean, error: string|null }}
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

export default function ScannerScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [manualBarcode, setManualBarcode] = useState('');
  const [loading, setLoading] = useState(false);
  const [lookupBarcode, setLookupBarcode] = useState('');
  const [error, setError] = useState(null);
  const [manualError, setManualError] = useState(null);
  const netInfo = useNetInfo();
  const isOffline = netInfo.isConnected === false;

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

  // Loading permission state
  if (!permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
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

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Camera or denied state */}
        {cameraGranted ? (
          <View style={styles.cameraContainer}>
            <CameraView
              style={styles.camera}
              facing="back"
              onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
              barcodeScannerSettings={{ barcodeTypes: ['ean13'] }}
            />
            <View style={styles.scanOverlay}>
              <View style={styles.scanFrame} />
            </View>
          </View>
        ) : (
          <View style={styles.deniedContainer}>
            <Text style={styles.deniedTitle}>Camera Access Required</Text>
            <Text style={styles.deniedText}>
              Camera access is needed to scan barcodes. You can still enter barcodes manually.
            </Text>
            <TouchableOpacity
              style={styles.settingsButton}
              onPress={() => Linking.openSettings()}
              activeOpacity={0.8}
            >
              <Text style={styles.settingsButtonText}>Open Settings</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* History button */}
        <TouchableOpacity
          style={styles.historyButton}
          onPress={() => navigation.navigate('ScanHistory')}
          activeOpacity={0.8}
        >
          <Text style={styles.historyButtonText}>📋 History</Text>
        </TouchableOpacity>

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

        {/* Manual entry */}
        <View style={styles.manualSection}>
          <Text style={styles.manualTitle}>Or enter barcode manually</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter 13-digit barcode"
            placeholderTextColor={theme.colors.textSecondary}
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
          {manualError ? (
            <Text style={styles.manualErrorText}>{manualError}</Text>
          ) : null}
          <TouchableOpacity
            style={[
              styles.lookupButton,
              (isOffline || loading) && styles.lookupButtonDisabled,
            ]}
            onPress={handleManualSubmit}
            disabled={isOffline || loading}
            activeOpacity={0.8}
          >
            <Text style={styles.lookupButtonText}>Look Up</Text>
          </TouchableOpacity>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: theme.spacing.xl,
  },
  cameraContainer: {
    height: 300,
    overflow: 'hidden',
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  scanOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: 220,
    height: 220,
    borderWidth: 2,
    borderColor: '#fff',
    borderRadius: theme.borderRadius.sm,
    backgroundColor: 'transparent',
  },
  deniedContainer: {
    padding: theme.spacing.lg,
    alignItems: 'center',
    backgroundColor: theme.colors.cardBackground,
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  deniedTitle: {
    fontFamily: theme.fonts.semiBold,
    fontSize: 18,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  deniedText: {
    fontFamily: theme.fonts.regular,
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: theme.spacing.md,
  },
  settingsButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm + 4,
    borderRadius: theme.borderRadius.sm,
  },
  settingsButtonText: {
    color: '#fff',
    fontFamily: theme.fonts.semiBold,
    fontSize: 14,
  },
  historyButton: {
    alignSelf: 'flex-end',
    marginRight: theme.spacing.md,
    marginTop: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs + 2,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.cardBackground,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  historyButtonText: {
    fontFamily: theme.fonts.medium,
    fontSize: 14,
    color: theme.colors.text,
  },
  errorContainer: {
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.md,
    padding: theme.spacing.md,
    backgroundColor: '#FFEBEE',
    borderRadius: theme.borderRadius.sm,
    alignItems: 'center',
  },
  errorText: {
    fontFamily: theme.fonts.medium,
    fontSize: 14,
    color: theme.colors.error,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  scanAgainButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
  },
  scanAgainButtonText: {
    color: '#fff',
    fontFamily: theme.fonts.semiBold,
    fontSize: 14,
  },
  manualSection: {
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.lg,
  },
  manualTitle: {
    fontFamily: theme.fonts.semiBold,
    fontSize: 16,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  input: {
    backgroundColor: theme.colors.cardBackground,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm + 4,
    fontFamily: theme.fonts.regular,
    fontSize: 16,
    color: theme.colors.text,
    letterSpacing: 1,
  },
  manualErrorText: {
    fontFamily: theme.fonts.regular,
    fontSize: 13,
    color: theme.colors.error,
    marginTop: theme.spacing.xs,
  },
  lookupButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.sm + 4,
    borderRadius: theme.borderRadius.sm,
    alignItems: 'center',
    marginTop: theme.spacing.sm,
  },
  lookupButtonDisabled: {
    opacity: 0.5,
  },
  lookupButtonText: {
    color: '#fff',
    fontFamily: theme.fonts.semiBold,
    fontSize: 16,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontFamily: theme.fonts.medium,
    fontSize: 14,
    marginTop: theme.spacing.sm,
  },
});
