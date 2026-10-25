/**
 * Bug #16 test — scan history must be cleared on logout.
 *
 * Scan history is stored under a single global AsyncStorage key
 * (`scan_history`), not namespaced per user. Without clearing it on logout,
 * the next user to sign in on the same device sees the previous user's scans.
 *
 * This test drives `AuthContext.logout()` with all native dependencies mocked
 * and an in-memory AsyncStorage, then asserts `getScanHistory()` resolves to
 * `[]`. It FAILS before `clearScanHistory()` is wired into logout.
 */
import React from 'react';
import { render, waitFor, act } from '@testing-library/react-native';
import { Text } from 'react-native';

// --- In-memory AsyncStorage ----------------------------------------------
// (must be `mock`-prefixed to be referenced inside a jest.mock factory)
let mockStore = {};
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn((k) => Promise.resolve(k in mockStore ? mockStore[k] : null)),
  setItem: jest.fn((k, v) => { mockStore[k] = v; return Promise.resolve(); }),
  removeItem: jest.fn((k) => { delete mockStore[k]; return Promise.resolve(); }),
  multiRemove: jest.fn((keys) => { keys.forEach((k) => { delete mockStore[k]; }); return Promise.resolve(); }),
}));

// --- Mock everything else logout()/the provider touches ------------------
jest.mock('../../api/client', () => ({
  __esModule: true,
  default: { post: jest.fn(() => Promise.resolve({ data: {} })), get: jest.fn(() => Promise.resolve({ data: {} })) },
  setAuthFailureHandler: jest.fn(),
}));
jest.mock('../../services/firebase/auth', () => ({
  signInWithEmail: jest.fn(),
  signUpWithEmail: jest.fn(),
  signOut: jest.fn(() => Promise.resolve()),
  signInWithPhone: jest.fn(),
  confirmOTP: jest.fn(),
}));
jest.mock('../../services/firebase/googleSignIn', () => ({ signInWithGoogle: jest.fn() }));
jest.mock('../../services/firebase/analytics', () => ({ logLogin: jest.fn(), logSignUp: jest.fn(), setUserId: jest.fn() }));
jest.mock('../../services/firebase/crashlytics', () => ({ setCrashlyticsUserId: jest.fn(), recordAPIError: jest.fn() }));
jest.mock('../../services/analytics', () => ({ trackEvent: jest.fn(), identify: jest.fn(), reset: jest.fn() }));

import { AuthProvider, useAuth } from '../../context/AuthContext';
import { getScanHistory, SCAN_HISTORY_KEY } from '../scanHistory';

// Harness that exposes logout() to the test via a ref.
function Harness({ authRef }) {
  const auth = useAuth();
  authRef.current = auth;
  return <Text>ready</Text>;
}

describe('bug #16: scan history cleared on logout', () => {
  beforeEach(() => {
    mockStore = {};
  });

  it('getScanHistory() resolves to [] after logout runs', async () => {
    // Seed a previous user's scan history.
    mockStore[SCAN_HISTORY_KEY] = JSON.stringify([
      { barcode: '8901234567890', productName: 'Old User Snack', scannedAt: new Date().toISOString() },
    ]);
    expect(await getScanHistory()).toHaveLength(1);

    const authRef = { current: null };
    render(
      <AuthProvider>
        <Harness authRef={authRef} />
      </AuthProvider>
    );

    await waitFor(() => expect(authRef.current).not.toBeNull());

    await act(async () => {
      await authRef.current.logout();
    });

    expect(await getScanHistory()).toEqual([]);
  });
});
