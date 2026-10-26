/**
 * Bug #8 — the non-functional "Continue with Apple" button (no onPress) was
 * removed from LoginScreen. This asserts it's gone while Google/email/phone
 * sign-in remain present.
 */
import React from 'react';
import { render } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ login: jest.fn(), loginWithGoogle: jest.fn() }),
}));
jest.mock('../../services/firebase/auth', () => ({
  mapFirebaseAuthError: (e) => e.message,
  signInWithPhone: jest.fn(),
}));
jest.mock('../../utils/phoneAuthState', () => ({ setPhoneConfirmation: jest.fn() }));

import LoginScreen from '../LoginScreen';

const metrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

function renderLogin() {
  const navigation = { navigate: jest.fn(), goBack: jest.fn() };
  return render(
    <SafeAreaProvider initialMetrics={metrics}>
      <LoginScreen navigation={navigation} />
    </SafeAreaProvider>
  );
}

describe('LoginScreen — bug #8: Apple button removed', () => {
  it('does not render a "Continue with Apple" button', () => {
    const { queryByText } = renderLogin();
    expect(queryByText(/Continue with Apple/i)).toBeNull();
  });

  it('still renders Google sign-in', () => {
    const { getByText } = renderLogin();
    expect(getByText(/Continue with Google/i)).toBeTruthy();
  });

  it('still renders the email Sign In action', () => {
    const { getAllByText } = renderLogin();
    expect(getAllByText(/Sign In/i).length).toBeGreaterThan(0);
  });
});
