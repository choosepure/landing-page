import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { theme } from '../theme';
import { useAuth } from '../context/AuthContext';

export default function ProfileScreen({ navigation }) {
  const { user, logout } = useAuth();

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.name?.charAt(0)?.toUpperCase() || '?'}</Text>
        </View>
        <Text style={styles.name}>{user?.name || 'User'}</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      <View style={styles.infoCard}>
        <InfoRow label="Phone" value={user?.phone || '—'} />
        <InfoRow label="Status" value={user?.subscriptionStatus === 'subscribed' ? 'Subscribed' : 'Free'} />
        <InfoRow label="Referral Code" value={user?.referral_code || '—'} />
        {user?.freeMonthsEarned ? <InfoRow label="Free Months" value={String(user.freeMonthsEarned)} /> : null}
        {user?.subscriptionExpiry ? (
          <InfoRow label="Expires" value={new Date(user.subscriptionExpiry).toLocaleDateString()} />
        ) : null}
      </View>

      <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('ProfileSubscription')}>
        <Text style={styles.menuText}>Manage Subscription</Text>
        <Text style={styles.menuArrow}>›</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Vision')}>
        <Text style={styles.menuText}>Our Vision</Text>
        <Text style={styles.menuArrow}>›</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}

function InfoRow({ label, value }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background, padding: theme.spacing.lg },
  header: { alignItems: 'center', marginBottom: theme.spacing.lg },
  avatar: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: theme.colors.primary,
    justifyContent: 'center', alignItems: 'center', marginBottom: theme.spacing.sm,
  },
  avatarText: { color: '#fff', fontFamily: theme.fonts.bold, fontSize: 28 },
  name: { fontFamily: theme.fonts.semiBold, fontSize: 20, color: theme.colors.text },
  email: { fontFamily: theme.fonts.regular, fontSize: 14, color: theme.colors.textSecondary, marginTop: 2 },
  infoCard: {
    backgroundColor: theme.colors.cardBackground, borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md, marginBottom: theme.spacing.md,
    elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 2,
  },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: theme.spacing.sm, borderBottomWidth: 0.5, borderBottomColor: theme.colors.border,
  },
  infoLabel: { fontFamily: theme.fonts.medium, fontSize: 14, color: theme.colors.textSecondary },
  infoValue: { fontFamily: theme.fonts.regular, fontSize: 14, color: theme.colors.text },
  menuItem: {
    backgroundColor: theme.colors.cardBackground, borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md, marginBottom: theme.spacing.sm,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 2,
  },
  menuText: { fontFamily: theme.fonts.medium, fontSize: 15, color: theme.colors.text },
  menuArrow: { fontFamily: theme.fonts.regular, fontSize: 22, color: theme.colors.textSecondary },
  signOutBtn: {
    marginTop: theme.spacing.lg, borderWidth: 1.5, borderColor: theme.colors.error,
    paddingVertical: theme.spacing.md, borderRadius: theme.borderRadius.md, alignItems: 'center',
  },
  signOutText: { color: theme.colors.error, fontFamily: theme.fonts.semiBold, fontSize: 15 },
});
