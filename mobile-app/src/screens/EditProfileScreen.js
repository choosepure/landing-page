import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { theme } from '../theme';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';

export default function EditProfileScreen({ navigation }) {
  const { user, checkAuth } = useAuth();

  // Profile fields
  const [name, setName] = useState(user?.name || '');
  const [email] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [pincode, setPincode] = useState(user?.pincode || '');
  const [profileLoading, setProfileLoading] = useState(false);

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const hasExistingPassword = user?.hasPassword !== false;

  async function handleSaveProfile() {
    if (!name.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }
    if (phone && !/^[0-9]{10}$/.test(phone)) {
      Alert.alert('Error', 'Please enter a valid 10-digit phone number');
      return;
    }
    if (pincode && !/^[0-9]{6}$/.test(pincode)) {
      Alert.alert('Error', 'Please enter a valid 6-digit pincode');
      return;
    }

    setProfileLoading(true);
    try {
      const payload = {};
      if (name.trim() !== (user?.name || '')) payload.name = name.trim();
      if (phone.trim() !== (user?.phone || '')) payload.phone = phone.trim();
      if (pincode.trim() !== (user?.pincode || '')) payload.pincode = pincode.trim();

      if (Object.keys(payload).length === 0) {
        Alert.alert('No Changes', 'Nothing to update.');
        setProfileLoading(false);
        return;
      }

      await apiClient.put('/api/user/profile', payload);
      await checkAuth();
      Alert.alert('Success', 'Profile updated successfully');
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to update profile');
    } finally {
      setProfileLoading(false);
    }
  }

  async function handleChangePassword() {
    if (hasExistingPassword && !currentPassword) {
      Alert.alert('Error', 'Please enter your current password');
      return;
    }
    if (!newPassword) {
      Alert.alert('Error', 'Please enter a new password');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Error', 'New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    setPasswordLoading(true);
    try {
      const payload = { newPassword };
      if (hasExistingPassword) {
        payload.currentPassword = currentPassword;
      }

      await apiClient.post('/api/user/change-password', payload);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      Alert.alert('Success', 'Password updated successfully');
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Profile Info Section */}
      <Text style={styles.sectionTitle}>PERSONAL INFO</Text>
      <Card style={styles.card}>
        <Input
          label="Full Name"
          leftIcon="user"
          value={name}
          onChangeText={setName}
          placeholder="Your name"
          autoCapitalize="words"
        />
        <View style={styles.spacer} />
        <Input
          label="Email"
          leftIcon="mail"
          value={email}
          editable={false}
          placeholder="Email (cannot be changed)"
          style={styles.disabledInput}
        />
        <View style={styles.spacer} />
        <Input
          label="Phone"
          leftIcon="phone"
          value={phone}
          onChangeText={setPhone}
          placeholder="10-digit phone number"
          keyboardType="phone-pad"
          maxLength={10}
        />
        <View style={styles.spacer} />
        <Input
          label="Pincode"
          leftIcon="map-pin"
          value={pincode}
          onChangeText={setPincode}
          placeholder="6-digit pincode"
          keyboardType="number-pad"
          maxLength={6}
        />
      </Card>

      <Button
        variant="primary"
        size="lg"
        fullWidth
        onPress={handleSaveProfile}
        disabled={profileLoading}
      >
        {profileLoading ? <ActivityIndicator color="#fff" /> : 'Save Profile'}
      </Button>

      {/* Password Section */}
      <Text style={[styles.sectionTitle, styles.sectionTitleSpaced]}>
        {hasExistingPassword ? 'CHANGE PASSWORD' : 'SET PASSWORD'}
      </Text>
      <Card style={styles.card}>
        {hasExistingPassword && (
          <>
            <Input
              label="Current Password"
              leftIcon="lock"
              rightIcon={showCurrentPassword ? 'eye-off' : 'eye'}
              onRightIconPress={() => setShowCurrentPassword(!showCurrentPassword)}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="Enter current password"
              secureTextEntry={!showCurrentPassword}
            />
            <View style={styles.spacer} />
          </>
        )}
        <Input
          label="New Password"
          leftIcon="lock"
          rightIcon={showNewPassword ? 'eye-off' : 'eye'}
          onRightIconPress={() => setShowNewPassword(!showNewPassword)}
          value={newPassword}
          onChangeText={setNewPassword}
          placeholder="At least 6 characters"
          secureTextEntry={!showNewPassword}
        />
        <View style={styles.spacer} />
        <Input
          label="Confirm New Password"
          leftIcon="lock"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="Re-enter new password"
          secureTextEntry={!showNewPassword}
        />
      </Card>

      <Button
        variant="primary"
        size="lg"
        fullWidth
        onPress={handleChangePassword}
        disabled={passwordLoading}
      >
        {passwordLoading ? (
          <ActivityIndicator color="#fff" />
        ) : hasExistingPassword ? (
          'Change Password'
        ) : (
          'Set Password'
        )}
      </Button>

      <View style={styles.bottomPad} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: 20, paddingBottom: 40 },
  card: { padding: 20, marginBottom: 16 },
  spacer: { height: 16 },
  disabledInput: { opacity: 0.5 },
  sectionTitle: {
    fontFamily: theme.fonts.bold,
    fontSize: theme.fontSize['2xs'],
    color: theme.colors.textSecondary,
    letterSpacing: 4,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  sectionTitleSpaced: {
    marginTop: 32,
  },
  bottomPad: { height: 20 },
});
