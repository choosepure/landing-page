import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  FlatList,
  Alert,
  ActivityIndicator,
  StyleSheet,
  Platform,
  Linking,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { theme } from '../theme';
import apiClient from '../api/client';
import Icon from '../components/Icon';

const MAX_IMAGES = 3;
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const UPLOAD_TIMEOUT_MS = 15000; // 15 seconds
const ACCEPTED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];

export default function LabelScannerScreen({ navigation }) {
  const [images, setImages] = useState([]);
  const [cameraPermission, setCameraPermission] = useState(null); // null, 'granted', 'denied'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Request camera permission on mount
  useEffect(() => {
    requestCameraPermission();
  }, []);

  async function requestCameraPermission() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    setCameraPermission(status === 'granted' ? 'granted' : 'denied');
  }

  function validateImage(asset) {
    // Check file size
    if (asset.fileSize && asset.fileSize > MAX_FILE_SIZE_BYTES) {
      Alert.alert(
        'Image Too Large',
        'The selected image exceeds the 10 MB size limit. Please choose a smaller image.'
      );
      return false;
    }

    // Check mime type if available
    if (asset.mimeType && !ACCEPTED_MIME_TYPES.includes(asset.mimeType.toLowerCase())) {
      Alert.alert(
        'Unsupported Format',
        'Please select an image in JPEG, PNG, WEBP, or HEIC format.'
      );
      return false;
    }

    return true;
  }

  function addImage(asset) {
    if (images.length >= MAX_IMAGES) {
      Alert.alert('Maximum Images', 'You can select up to 3 images per scan.');
      return;
    }

    if (!validateImage(asset)) return;

    setImages((prev) => [...prev, asset]);
    setError(null);
  }

  async function handleCapturePhoto() {
    if (cameraPermission !== 'granted') {
      Alert.alert(
        'Camera Access Required',
        'Please grant camera permission to capture photos.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ]
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.9,
      allowsEditing: false,
      exif: false,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      addImage(result.assets[0]);
    }
  }

  async function handlePickFromGallery() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Gallery Access Required',
        'Please grant photo library access to select images.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ]
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.9,
      allowsEditing: false,
      exif: false,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      addImage(result.assets[0]);
    }
  }

  function removeImage(index) {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleScanLabel() {
    if (images.length === 0) return;

    setLoading(true);
    setError(null);

    const formData = new FormData();
    images.forEach((img, i) => {
      formData.append('images', {
        uri: img.uri,
        type: img.mimeType || 'image/jpeg',
        name: `label_${i}.${getExtension(img.mimeType || 'image/jpeg')}`,
      });
    });

    // Create an AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), UPLOAD_TIMEOUT_MS);

    try {
      const response = await apiClient.post('/api/v1/scans', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        signal: controller.signal,
        timeout: UPLOAD_TIMEOUT_MS,
      });

      clearTimeout(timeoutId);
      setLoading(false);

      // Navigate to result screen with scan data
      navigation.navigate('LabelResult', { scanData: response.data });
    } catch (err) {
      clearTimeout(timeoutId);
      setLoading(false);

      if (err.name === 'AbortError' || err.code === 'ECONNABORTED') {
        setError('Upload timed out. Please check your connection and try again.');
      } else if (!err.response) {
        setError('Network error. Please check your connection and try again.');
      } else {
        const message = err.response?.data?.error?.message || 'Upload failed. Please try again.';
        setError(message);
      }
    }
  }

  function getExtension(mimeType) {
    const map = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/heic': 'heic',
      'image/heif': 'heif',
    };
    return map[mimeType] || 'jpg';
  }

  function renderThumbnail({ item, index }) {
    return (
      <View style={styles.thumbnailWrapper}>
        <Image source={{ uri: item.uri }} style={styles.thumbnail} />
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => removeImage(index)}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.removeButtonText}>✕</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Loading overlay
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFFFFF" />
        <Text style={styles.loadingText}>Analysing label…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Icon name="arrow-left" size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scan Label</Text>
        <View style={{ width: 20 }} />
      </View>

      {/* Camera permission denied message */}
      {cameraPermission === 'denied' && (
        <View style={styles.permissionBanner}>
          <Text style={styles.permissionText}>
            Camera access is required to capture label photos.
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

      {/* Camera viewfinder area with overlay guide */}
      {cameraPermission === 'granted' && (
        <View style={styles.viewfinderArea}>
          <View style={styles.overlayGuide}>
            {/* Corner brackets for label framing */}
            <View style={[styles.corner, styles.cornerTopLeft]} />
            <View style={[styles.corner, styles.cornerTopRight]} />
            <View style={[styles.corner, styles.cornerBottomLeft]} />
            <View style={[styles.corner, styles.cornerBottomRight]} />
            <Text style={styles.guideText}>Position food label within frame</Text>
          </View>
        </View>
      )}

      {/* Spacer when camera is denied */}
      {cameraPermission === 'denied' && <View style={styles.spacer} />}

      {/* Action buttons: Camera + Gallery */}
      <View style={styles.actionRow}>
        {cameraPermission === 'granted' && (
          <TouchableOpacity
            style={styles.captureButton}
            onPress={handleCapturePhoto}
            activeOpacity={0.8}
            disabled={images.length >= MAX_IMAGES}
          >
            <Icon name="scan" size={22} color="#FFFFFF" />
            <Text style={styles.captureButtonText}>Capture</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.galleryButton}
          onPress={handlePickFromGallery}
          activeOpacity={0.8}
          disabled={images.length >= MAX_IMAGES}
        >
          <Icon name="image" size={22} color={theme.colors.primary} />
          <Text style={styles.galleryButtonText}>Gallery</Text>
        </TouchableOpacity>
      </View>

      {/* Image count indicator */}
      {images.length > 0 && (
        <Text style={styles.imageCount}>
          {images.length} of {MAX_IMAGES} images selected
        </Text>
      )}

      {/* Thumbnails */}
      {images.length > 0 && (
        <FlatList
          data={images}
          renderItem={renderThumbnail}
          keyExtractor={(_, index) => `thumb-${index}`}
          horizontal
          style={styles.thumbnailList}
          contentContainerStyle={styles.thumbnailListContent}
          showsHorizontalScrollIndicator={false}
        />
      )}

      {/* Error message with retry */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={handleScanLabel}
            activeOpacity={0.8}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Scan Label submission button */}
      {images.length > 0 && !error && (
        <View style={styles.submitContainer}>
          <TouchableOpacity
            style={styles.scanButton}
            onPress={handleScanLabel}
            activeOpacity={0.8}
          >
            <Text style={styles.scanButtonText}>Scan Label</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const CORNER_SIZE = 40;
const CORNER_BORDER_WIDTH = 3;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F2419',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#0F2419',
  },
  headerTitle: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSize.lg,
    color: '#FFFFFF',
  },

  // Permission denied banner
  permissionBanner: {
    backgroundColor: 'rgba(209, 78, 54, 0.15)',
    marginHorizontal: 20,
    marginTop: 12,
    padding: 16,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  permissionText: {
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSize.base,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
  },
  settingsButton: {
    backgroundColor: theme.colors.primarySoft,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: theme.borderRadius.lg,
  },
  settingsButtonText: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSize.base,
    color: '#FFFFFF',
  },

  // Camera viewfinder area
  viewfinderArea: {
    flex: 1,
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: theme.borderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 260,
  },
  overlayGuide: {
    width: 280,
    height: 200,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  guideText: {
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSize.base,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginTop: 20,
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
    borderColor: '#1F6B4E',
    borderTopLeftRadius: 8,
  },
  cornerTopRight: {
    top: 0,
    right: 0,
    borderTopWidth: CORNER_BORDER_WIDTH,
    borderRightWidth: CORNER_BORDER_WIDTH,
    borderColor: '#1F6B4E',
    borderTopRightRadius: 8,
  },
  cornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: CORNER_BORDER_WIDTH,
    borderLeftWidth: CORNER_BORDER_WIDTH,
    borderColor: '#1F6B4E',
    borderBottomLeftRadius: 8,
  },
  cornerBottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: CORNER_BORDER_WIDTH,
    borderRightWidth: CORNER_BORDER_WIDTH,
    borderColor: '#1F6B4E',
    borderBottomRightRadius: 8,
  },

  spacer: {
    flex: 1,
  },

  // Action buttons
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  captureButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1F6B4E',
    paddingVertical: 14,
    borderRadius: theme.borderRadius.lg,
  },
  captureButtonText: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSize.md,
    color: '#FFFFFF',
  },
  galleryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FAFAF7',
    paddingVertical: 14,
    borderRadius: theme.borderRadius.lg,
  },
  galleryButtonText: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSize.md,
    color: theme.colors.primary,
  },

  // Image count
  imageCount: {
    fontFamily: theme.fonts.regular,
    fontSize: theme.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    marginBottom: 8,
  },

  // Thumbnails
  thumbnailList: {
    maxHeight: 90,
    marginBottom: 16,
  },
  thumbnailListContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  thumbnailWrapper: {
    position: 'relative',
  },
  thumbnail: {
    width: 72,
    height: 72,
    borderRadius: theme.borderRadius.md,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  removeButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: theme.colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  // Error
  errorContainer: {
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 14,
    backgroundColor: 'rgba(209, 78, 54, 0.15)',
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  errorText: {
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSize.base,
    color: theme.colors.error,
    textAlign: 'center',
    marginBottom: 10,
  },
  retryButton: {
    backgroundColor: theme.colors.error,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: theme.borderRadius.lg,
  },
  retryButtonText: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSize.base,
    color: '#FFFFFF',
  },

  // Submit button
  submitContainer: {
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  scanButton: {
    backgroundColor: '#1F6B4E',
    paddingVertical: 16,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
  },
  scanButtonText: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSize.lg,
    color: '#FFFFFF',
  },

  // Loading overlay
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0F2419',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSize.md,
    color: '#FFFFFF',
    marginTop: 16,
  },
});
