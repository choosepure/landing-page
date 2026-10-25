/**
 * Bug #4 render test — OTPScreen with undefined route.params.
 *
 * Reaching this screen without a phoneNumber (cold-start deep link, restored
 * nav state) must NOT crash. It renders a "Session expired" fallback and, when
 * there is nothing to go back to, navigates to Login so the user isn't stuck.
 */
import React from 'react';
import { render } from '@testing-library/react-native';

// Mock the auth context so importing the screen doesn't pull in Firebase native.
jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ confirmPhoneOTP: jest.fn() }),
}));
jest.mock('../../services/firebase/auth', () => ({
  signInWithPhone: jest.fn(),
  confirmOTP: jest.fn(),
  mapFirebaseAuthError: (e) => e.message,
}));
jest.mock('../../utils/phoneAuthState', () => ({
  getPhoneConfirmation: () => null,
  setPhoneConfirmation: jest.fn(),
  clearPhoneConfirmation: jest.fn(),
}));

import OTPScreen from '../OTPScreen';

function makeNavigation(overrides = {}) {
  return {
    goBack: jest.fn(),
    navigate: jest.fn(),
    canGoBack: jest.fn(() => true),
    ...overrides,
  };
}

describe('OTPScreen — bug #4: undefined route.params', () => {
  it('renders the fallback without throwing when route.params is undefined', () => {
    const navigation = makeNavigation();
    const { getByText } = render(
      <OTPScreen navigation={navigation} route={{}} />
    );
    expect(getByText('Session expired')).toBeTruthy();
  });

  it('calls goBack when a screen is available to return to', () => {
    const navigation = makeNavigation({ canGoBack: jest.fn(() => true) });
    render(<OTPScreen navigation={navigation} route={{}} />);
    expect(navigation.goBack).toHaveBeenCalled();
    expect(navigation.navigate).not.toHaveBeenCalled();
  });

  it('navigates to Login on a cold-start deep link (cannot go back)', () => {
    const navigation = makeNavigation({ canGoBack: jest.fn(() => false) });
    render(<OTPScreen navigation={navigation} route={{}} />);
    expect(navigation.navigate).toHaveBeenCalledWith('Login');
    expect(navigation.goBack).not.toHaveBeenCalled();
  });

  it('does not render the fallback when a phoneNumber is present', () => {
    const navigation = makeNavigation();
    const { queryByText } = render(
      <OTPScreen navigation={navigation} route={{ params: { phoneNumber: '+919876543210' } }} />
    );
    expect(queryByText('Session expired')).toBeNull();
  });
});
