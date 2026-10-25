import { theme } from '../theme';

/**
 * Returns a color based on purity score ranges.
 * ≥90: primary green, 70-89: scoreGood, 40-69: warning, <40: error
 */
export function getScoreColor(score) {
  if (score >= 90) return theme.colors.primary;
  if (score >= 70) return theme.colors.scoreGood;
  if (score >= 40) return theme.colors.warning;
  return theme.colors.error;
}

/**
 * Returns a color based on category score ranges.
 * ≥90: primary green, 70-89: blue, <70: warning
 */
export function getCategoryScoreColor(score) {
  if (score >= 90) return theme.colors.primary;
  if (score >= 70) return '#1976D2';
  return theme.colors.warning;
}

/**
 * Returns a color based on test parameter status.
 * "Pass" → success, "Fail" → error, "Context" → warning
 */
export function getStatusColor(status) {
  switch (status) {
    case 'Pass':
      return theme.colors.success;
    case 'Fail':
      return theme.colors.error;
    case 'Context':
      return theme.colors.warning;
    default:
      return theme.colors.textSecondary;
  }
}

/**
 * Returns a color based on recommendation severity.
 * "critical" → error, "recommended" → warning, "positive" → success
 */
export function getSeverityColor(severity) {
  switch (severity) {
    case 'critical':
      return theme.colors.error;
    case 'recommended':
      return theme.colors.warning;
    case 'positive':
      return theme.colors.success;
    default:
      return theme.colors.textSecondary;
  }
}
