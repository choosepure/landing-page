import fc from 'fast-check';
import {
  getScoreColor,
  getCategoryScoreColor,
  getStatusColor,
  getSeverityColor,
} from '../scoreColors';
import { theme } from '../../theme';

// --- Unit Tests ---

describe('getScoreColor', () => {
  it('returns primary for score 90', () => {
    expect(getScoreColor(90)).toBe(theme.colors.primary);
  });

  it('returns primary for score 100', () => {
    expect(getScoreColor(100)).toBe(theme.colors.primary);
  });

  it('returns scoreGood for score 70', () => {
    expect(getScoreColor(70)).toBe(theme.colors.scoreGood);
  });

  it('returns scoreGood for score 89', () => {
    expect(getScoreColor(89)).toBe(theme.colors.scoreGood);
  });

  it('returns warning for score 40', () => {
    expect(getScoreColor(40)).toBe(theme.colors.warning);
  });

  it('returns warning for score 69', () => {
    expect(getScoreColor(69)).toBe(theme.colors.warning);
  });

  it('returns error for score 39', () => {
    expect(getScoreColor(39)).toBe(theme.colors.error);
  });

  it('returns error for score 0', () => {
    expect(getScoreColor(0)).toBe(theme.colors.error);
  });
});

describe('getCategoryScoreColor', () => {
  it('returns primary for score 90', () => {
    expect(getCategoryScoreColor(90)).toBe(theme.colors.primary);
  });

  it('returns primary for score 100', () => {
    expect(getCategoryScoreColor(100)).toBe(theme.colors.primary);
  });

  it('returns blue for score 70', () => {
    expect(getCategoryScoreColor(70)).toBe('#1976D2');
  });

  it('returns blue for score 89', () => {
    expect(getCategoryScoreColor(89)).toBe('#1976D2');
  });

  it('returns warning for score 69', () => {
    expect(getCategoryScoreColor(69)).toBe(theme.colors.warning);
  });

  it('returns warning for score 0', () => {
    expect(getCategoryScoreColor(0)).toBe(theme.colors.warning);
  });
});

describe('getStatusColor', () => {
  it('returns success for "Pass"', () => {
    expect(getStatusColor('Pass')).toBe(theme.colors.success);
  });

  it('returns error for "Fail"', () => {
    expect(getStatusColor('Fail')).toBe(theme.colors.error);
  });

  it('returns warning for "Context"', () => {
    expect(getStatusColor('Context')).toBe(theme.colors.warning);
  });

  it('returns textSecondary for unknown status', () => {
    expect(getStatusColor('Unknown')).toBe(theme.colors.textSecondary);
  });

  it('returns textSecondary for empty string', () => {
    expect(getStatusColor('')).toBe(theme.colors.textSecondary);
  });
});

describe('getSeverityColor', () => {
  it('returns error for "critical"', () => {
    expect(getSeverityColor('critical')).toBe(theme.colors.error);
  });

  it('returns warning for "recommended"', () => {
    expect(getSeverityColor('recommended')).toBe(theme.colors.warning);
  });

  it('returns success for "positive"', () => {
    expect(getSeverityColor('positive')).toBe(theme.colors.success);
  });

  it('returns textSecondary for unknown severity', () => {
    expect(getSeverityColor('unknown')).toBe(theme.colors.textSecondary);
  });

  it('returns textSecondary for empty string', () => {
    expect(getSeverityColor('')).toBe(theme.colors.textSecondary);
  });
});

// --- Property-Based Tests ---

/**
 * Feature: report-detail-ui, Property 1: Purity score color mapping is consistent with defined ranges
 * Validates: Requirements 1.4, 1.5, 1.6, 1.7
 */
describe('Property 1: getScoreColor maps scores to correct colors', () => {
  it('returns primary for scores >= 90', () => {
    fc.assert(
      fc.property(fc.integer({ min: 90, max: 100 }), (score) => {
        expect(getScoreColor(score)).toBe(theme.colors.primary);
      }),
      { numRuns: 100 }
    );
  });

  it('returns scoreGood for scores 70-89', () => {
    fc.assert(
      fc.property(fc.integer({ min: 70, max: 89 }), (score) => {
        expect(getScoreColor(score)).toBe(theme.colors.scoreGood);
      }),
      { numRuns: 100 }
    );
  });

  it('returns warning for scores 40-69', () => {
    fc.assert(
      fc.property(fc.integer({ min: 40, max: 69 }), (score) => {
        expect(getScoreColor(score)).toBe(theme.colors.warning);
      }),
      { numRuns: 100 }
    );
  });

  it('returns error for scores < 40', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 39 }), (score) => {
        expect(getScoreColor(score)).toBe(theme.colors.error);
      }),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: report-detail-ui, Property 2: Category score color mapping is consistent with defined ranges
 * Validates: Requirements 3.3, 3.4, 3.5
 */
describe('Property 2: getCategoryScoreColor maps scores to correct colors', () => {
  it('returns primary for scores >= 90', () => {
    fc.assert(
      fc.property(fc.integer({ min: 90, max: 100 }), (score) => {
        expect(getCategoryScoreColor(score)).toBe(theme.colors.primary);
      }),
      { numRuns: 100 }
    );
  });

  it('returns blue for scores 70-89', () => {
    fc.assert(
      fc.property(fc.integer({ min: 70, max: 89 }), (score) => {
        expect(getCategoryScoreColor(score)).toBe('#1976D2');
      }),
      { numRuns: 100 }
    );
  });

  it('returns warning for scores < 70', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 69 }), (score) => {
        expect(getCategoryScoreColor(score)).toBe(theme.colors.warning);
      }),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: report-detail-ui, Property 5: Status badge color mapping is consistent with status values
 * Validates: Requirements 5.7, 5.8, 5.9
 */
describe('Property 5: getStatusColor maps statuses to correct colors', () => {
  it('maps all valid statuses to their correct colors', () => {
    const statusMap = {
      Pass: theme.colors.success,
      Fail: theme.colors.error,
      Context: theme.colors.warning,
    };

    fc.assert(
      fc.property(
        fc.constantFrom('Pass', 'Fail', 'Context'),
        (status) => {
          expect(getStatusColor(status)).toBe(statusMap[status]);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('returns textSecondary for any non-valid status string', () => {
    fc.assert(
      fc.property(
        fc.string().filter((s) => !['Pass', 'Fail', 'Context'].includes(s)),
        (status) => {
          expect(getStatusColor(status)).toBe(theme.colors.textSecondary);
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: report-detail-ui, Property 6: Severity tag color mapping is consistent with severity values
 * Validates: Requirements 8.3, 8.4, 8.5
 */
describe('Property 6: getSeverityColor maps severities to correct colors', () => {
  it('maps all valid severities to their correct colors', () => {
    const severityMap = {
      critical: theme.colors.error,
      recommended: theme.colors.warning,
      positive: theme.colors.success,
    };

    fc.assert(
      fc.property(
        fc.constantFrom('critical', 'recommended', 'positive'),
        (severity) => {
          expect(getSeverityColor(severity)).toBe(severityMap[severity]);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('returns textSecondary for any non-valid severity string', () => {
    fc.assert(
      fc.property(
        fc.string().filter((s) => !['critical', 'recommended', 'positive'].includes(s)),
        (severity) => {
          expect(getSeverityColor(severity)).toBe(theme.colors.textSecondary);
        }
      ),
      { numRuns: 100 }
    );
  });
});
