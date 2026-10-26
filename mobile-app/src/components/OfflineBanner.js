import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import NetInfo from '@react-native-community/netinfo';
import { theme } from '../theme';

export default function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);
  // Bug #1: honor the top safe-area inset so the banner clears the status
  // bar/notch when it renders at the very top of the screen.
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOffline(!state.isConnected);
    });
    return () => unsubscribe();
  }, []);

  if (!isOffline) return null;

  return (
    <View style={[styles.banner, { paddingTop: insets.top + 8 }]}>
      <Text style={styles.text}>No internet connection</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: theme.colors.error,
    paddingVertical: 8,
    alignItems: 'center',
  },
  text: {
    color: '#fff',
    fontFamily: theme.fonts.medium,
    fontSize: 13,
  },
});
