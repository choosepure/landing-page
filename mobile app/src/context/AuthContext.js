import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient, { setAuthFailureHandler } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const resetAuth = useCallback(() => {
    setUser(null);
    AsyncStorage.removeItem('jwt_token');
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
    const res = await apiClient.post('/api/user/login', { email, password });
    if (res.data.success) {
      if (res.data.token) await AsyncStorage.setItem('jwt_token', res.data.token);
      setUser(res.data.user);
    }
    return res.data;
  }

  async function register(name, email, phone, pincode, password, referralCode) {
    const body = { name, email, phone, pincode, password };
    if (referralCode) body.referral_code = referralCode;
    const res = await apiClient.post('/api/user/register', body);
    if (res.data.success) {
      if (res.data.token) await AsyncStorage.setItem('jwt_token', res.data.token);
      setUser(res.data.user);
    }
    return res.data;
  }

  async function logout() {
    try { await apiClient.post('/api/user/logout'); } catch (e) {}
    await AsyncStorage.removeItem('jwt_token');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated: !!user, login, register, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
