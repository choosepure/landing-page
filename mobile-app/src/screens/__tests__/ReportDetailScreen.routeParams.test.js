/**
 * Bug #4 render test — ReportDetailScreen with undefined route.params.
 *
 * Reaching this screen without a reportId must NOT crash and must NOT fire a
 * network request. It short-circuits into a "Report not found" state.
 */
import React from 'react';
import { render } from '@testing-library/react-native';

const mockGet = jest.fn();
jest.mock('../../api/client', () => ({
  __esModule: true,
  default: { get: (...args) => mockGet(...args) },
}));
jest.mock('../../services/analytics', () => ({
  trackEvent: jest.fn(),
}));
jest.mock('expo-file-system', () => ({ cacheDirectory: '/tmp/', downloadAsync: jest.fn() }));
jest.mock('expo-sharing', () => ({ isAvailableAsync: jest.fn(), shareAsync: jest.fn() }));
// expo-linear-gradient ships untranspiled ESM; mock it so the report
// sub-components can be imported under Jest's react-native preset.
jest.mock('expo-linear-gradient', () => ({ LinearGradient: 'LinearGradient' }));

import ReportDetailScreen from '../ReportDetailScreen';

function makeNavigation(overrides = {}) {
  return {
    goBack: jest.fn(),
    navigate: jest.fn(),
    canGoBack: jest.fn(() => true),
    ...overrides,
  };
}

describe('ReportDetailScreen — bug #4: undefined route.params', () => {
  beforeEach(() => mockGet.mockClear());

  it('renders "Report not found" without throwing when route.params is undefined', () => {
    const { getByText } = render(
      <ReportDetailScreen navigation={makeNavigation()} route={{}} />
    );
    expect(getByText('Report not found')).toBeTruthy();
  });

  it('does not fire a network request when reportId is missing', () => {
    render(<ReportDetailScreen navigation={makeNavigation()} route={{}} />);
    expect(mockGet).not.toHaveBeenCalled();
  });

  it('shows a Go back action when navigation can go back', () => {
    const { getByText } = render(
      <ReportDetailScreen navigation={makeNavigation({ canGoBack: () => true })} route={{}} />
    );
    expect(getByText('Go back')).toBeTruthy();
  });
});
