import React from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';

// Global error handler
if (typeof ErrorUtils !== 'undefined') {
  const defaultHandler = ErrorUtils.getGlobalHandler();
  ErrorUtils.setGlobalHandler((error, isFatal) => {
    Alert.alert('App Error', String(error));
    if (defaultHandler) defaultHandler(error, isFatal);
  });
}

export default function App() {
  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <Text style={styles.title}>ChoosePure</Text>
      <Text style={styles.subtitle}>Lab | Verified | Trusted</Text>
      <Text style={styles.info}>App is working! v2</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAF7',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1F6B4E',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#8A6E4B',
    marginBottom: 24,
  },
  info: {
    fontSize: 14,
    color: '#666',
  },
});
