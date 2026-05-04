import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient, { setAuthFailureHandler } from '../api/client';
import { signInWithEmail, signUpWithEmail, signOut as firebaseSignOut, signInWithPhone, confirmOTP } from '../services/firebase/auth';
import { logLogin, logSignUp, setUserId } from '../services/firebase/analytics';
import { setCrashlyticsUserId } from '../services/firebase/crashlytics';

const AuthContext = createContext(null);

/**
 * Exchange a Firebase ID token with the backend for a JWT.
 *
 * @param {string} idToken  Firebase ID token obtained after sign-in / sign-up.
 * @param {object} [additionalData]  Extra fields sent during registration
 *   (e.g. { name, phone, pincode, referral_code }).
 * @returns {Promise<object>} The backend response data ({ success, token, user }).
 */
async function exchangeFirebaseToken(idToken, additionalData = {}) {
  const payload = { idToken, ...additionalData };
  const res = await apiClient.post('/api/user/firebase-auth', payload);

  if (res.data.success && res.data.token) {
    await AsyncStorage.setItem('jwt_token', res.data.token);
  }

  return res.data;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const resetAuth = useCallback(async () => {
    setUser(null);
    await AsyncStorage.removeItem('jwt_token');
    try { await firebaseSignOut(); } catch (_) { /* Firebase may not be initialised */ }
  }, []);

  useEffect(() => {
    setAuthFailureHandler(resetAuth);
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const token = await AsyncStorage.getItem('jwt_token');
      if (!token) { setIsLoading(false); return; }
      const res = await apiClient.get('/api/user/me');
      if (res.data.success && res.data.user) {
        setUser(res.data.user);
      } else {
        await AsyncStorage.removeItem('jwt_token');
      }
    } catch (e) {
      await AsyncStorage.removeItem('jwt_token');
    } finally {
      setIsLoading(false);
    }
  }

  async function login(email, password) {
    // 1. Authenticate with Firebase → get ID token
    const { idToken } = await signInWithEmail(email, password);

    // 2. Exchange Firebase ID token with backend for JWT
    const data = await exchangeFirebaseToken(idToken);

    if (data.success) {
      setUser(data.user);
      try {
        logLogin('email');
        setUserId(data.user._id);
      } catch (e) {
        // Analytics should never break the auth flow
      }
      try {
        setCrashlyticsUserId(data.user._id);
      } catch (e) {
        // Crashlytics should never break the auth flow
      }
    }

    return data;
  }

  async function register(name, email, phone, pincode, password, referralCode) {
    // 1. Create Firebase user → get ID token
    const { idToken } = await signUpWithEmail(email, password);

    // 2. Exchange Firebase ID token with backend, passing additional user data
    const additionalData = { name, phone, pincode };
    if (referralCode) additionalData.referral_code = referralCode;

    const data = await exchangeFirebaseToken(idToken, additionalData);

    if (data.success) {
      setUser(data.user);
      try {
        logSignUp('email');
        setUserId(data.user._id);
      } catch (e) {
        // Analytics should never break the auth flow
      }
      try {
        setCrashlyticsUserId(data.user._id);
      } catch (e) {
        // Crashlytics should never break the auth flow
      }
    }

    return data;
  }

  async function logout() {
    try { await apiClient.post('/api/user/logout'); } catch (e) {}
    try { await firebaseSignOut(); } catch (e) {}
    try { setUserId(null); } catch (e) {}
    try { setCrashlyticsUserId(''); } catch (e) {}
    await AsyncStorage.removeItem('jwt_token');
    setUser(null);
  }

  async function loginWithPhone(phoneNumber) {
    const confirmation = await signInWithPhone(phoneNumber);
    return confirmation;
  }

  async function confirmPhoneOTP(idToken) {
    const data = await exchangeFirebaseToken(idToken);
    if (data.success) {
      setUser(data.user);
      try {
        logLogin('phone');
        setUserId(data.user._id);
      } catch (e) {
        // Analytics should never break the auth flow
      }
      try {
        setCrashlyticsUserId(data.user._id);
      } catch (e) {
        // Crashlytics should never break the auth flow
      }
    }
    return data;
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated: !!user, login, register, logout, checkAuth, loginWithPhone, confirmPhoneOTP }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
