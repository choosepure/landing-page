/**
 * Bug #16 follow-up — scan history must not leak across users even when the
 * session ends via the 401 interceptor reset path (which does NOT clear
 * history), not just via explicit logout().
 *
 * Scenario:
 *   1. User A logs in and scans a product → history has A's scan, owner = A.
 *   2. A's token expires → a 401 triggers the auth-failure handler
 *      (resetAuth). This path intentionally does not clear scan history.
 *   3. User B logs in on the same device.
 *   => B must NOT see A's scan. The login owner-reconcile clears it.
 *
 * This FAILS before `reconcileScanHistoryOwner` is wired into the login paths.
 */
import React from 'react';
import { render, waitFor, act } from '@testing-library/react-native';
import { Text } from 'react-native';

// --- In-memory AsyncStorage (mock-prefixed for jest.mock hoisting) --------
let mockStore = {};
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn((k) => Promise.resolve(k in mockStore ? mockStore[k] : null)),
  setItem: jest.fn((k, v) => { mockStore[k] = v; return Promise.resolve(); }),
  removeItem: jest.fn((k) => { delete mockStore[k]; return Promise.resolve(); }),
  multiRemove: jest.fn((keys) => { keys.forEach((k) => { delete mockStore[k]; }); return Promise.resolve(); }),
}));

// --- Controllable apiClient: capture the auth-failure handler + queue POST responses
let mockAuthFailureHandler = null;
const mockPost = jest.fn();
jest.mock('../../api/client', () => ({
  __esModule: true,
  default: {
    post: (...args) => mockPost(...args),
    get: jest.fn(() => Promise.resolve({ data: {} })),
  },
  setAuthFailureHandler: (h) => { mockAuthFailureHandler = h; },
}));

jest.mock('../../services/firebase/auth', () => ({
  signInWithEmail: jest.fn(() => Promise.reject({ code: 'auth/user-not-found' })),
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
import { getScanHistory, saveScanRecord, SCAN_HISTORY_KEY } from '../scanHistory';

function Harness({ authRef }) {
  const auth = useAuth();
  authRef.current = auth;
  return <Text>ready</Text>;
}

// Direct-backend login response (Firebase is mocked to miss, so AuthContext
// falls back to apiClient.post('/api/user/login')).
function loginResponse(userId, email) {
  return { data: { success: true, token: `jwt-${userId}`, user: { _id: userId, email } } };
}

describe('bug #16 follow-up: history isolated when session ends via 401 path', () => {
  beforeEach(() => {
    mockStore = {};
    mockPost.mockReset();
    mockAuthFailureHandler = null;
  });

  it("user B does not see user A's scan after a 401 reset", async () => {
    const authRef = { current: null };
    render(
      <AuthProvider>
        <Harness authRef={authRef} />
      </AuthProvider>
    );
    await waitFor(() => expect(authRef.current).not.toBeNull());

    // 1. User A logs in.
    mockPost.mockResolvedValueOnce(loginResponse('userA', 'a@example.com'));
    await act(async () => {
      await authRef.current.login('a@example.com', 'pw');
    });

    // A scans a product.
    await act(async () => {
      await saveScanRecord('8901234567890', { name: "A's Snack" });
    });
    expect(await getScanHistory()).toHaveLength(1);

    // 2. A's token expires → 401 interceptor fires the auth-failure handler.
    //    This path does NOT clear scan history (that's the whole point).
    expect(typeof mockAuthFailureHandler).toBe('function');
    await act(async () => {
      await mockAuthFailureHandler();
    });

    // 3. User B logs in on the same device.
    mockPost.mockResolvedValueOnce(loginResponse('userB', 'b@example.com'));
    await act(async () => {
      await authRef.current.login('b@example.com', 'pw');
    });

    // B must not inherit A's scan history.
    expect(await getScanHistory()).toEqual([]);
  });
});
