/**
 * Bug #4 render test — ResultCardScreen with undefined route.params.
 *
 * Reaching this screen without a barcode or product must NOT crash and must
 * NOT fire a network request. It falls through to the empty state.
 */
import React from 'react';
import { render } from '@testing-library/react-native';

const mockGet = jest.fn();
jest.mock('../../api/client', () => ({
  __esModule: true,
  default: { get: (...args) => mockGet(...args) },
}));
jest.mock('../../utils/scanHistory', () => ({
  saveScanRecord: jest.fn(),
}));

import ResultCardScreen from '../ResultCardScreen';

function makeNavigation(overrides = {}) {
  return {
    goBack: jest.fn(),
    navigate: jest.fn(),
    canGoBack: jest.fn(() => true),
    ...overrides,
  };
}

describe('ResultCardScreen — bug #4: undefined route.params', () => {
  beforeEach(() => mockGet.mockClear());

  it('renders the empty state without throwing when route.params is undefined', () => {
    const { getByText } = render(
      <ResultCardScreen navigation={makeNavigation()} route={{}} />
    );
    expect(getByText('Product data not available.')).toBeTruthy();
  });

  it('does not fire a network request when barcode and product are both missing', () => {
    render(<ResultCardScreen navigation={makeNavigation()} route={{}} />);
    expect(mockGet).not.toHaveBeenCalled();
  });
});
