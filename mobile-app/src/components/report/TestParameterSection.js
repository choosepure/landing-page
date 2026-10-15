import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  LayoutAnimation,
  UIManager,
  Platform,
  StyleSheet,
} from 'react-native';
import { theme } from '../../theme';
import { getStatusColor } from '../../utils/scoreColors';

// Enable LayoutAnimation on Android
if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

/**
 * Expandable test parameter section with status badges and limit details.
 */
export default function TestParameterSection({ categoryName, parameters }) {
  const [expanded, setExpanded] = useState(false);
  const [expandedParam, setExpandedParam] = useState(null);

  const toggleSection = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((prev) => !prev);
  };

  const toggleParam = (index) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedParam((prev) => (prev === index ? null : index));
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.header}
        onPress={toggleSection}
        activeOpacity={0.7}
      >
        <View style={styles.headerLeft}>
          <Text style={styles.categoryName}>{categoryName}</Text>
          <Text style={styles.paramCount}>
            {parameters.length} parameter{parameters.length !== 1 ? 's' : ''}
          </Text>
        </View>
        <Text style={styles.chevron}>{expanded ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.parameterList}>
          {parameters.map((param, index) => (
            <View key={index}>
              <TouchableOpacity
                style={styles.paramRow}
                onPress={() => toggleParam(index)}
                activeOpacity={0.7}
              >
                <Text style={styles.paramName} numberOfLines={1}>
                  {param.parameterName}
                </Text>
                <View style={styles.paramRight}>
                  <Text style={styles.paramResult}>
                    {param.result} {param.unit}
                  </Text>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(param.status) },
                    ]}
                  >
                    <Text style={styles.statusText}>{param.status}</Text>
                  </View>
                </View>
              </TouchableOpacity>

              {expandedParam === index && (
                <View style={styles.limitDetails}>
                  <View style={styles.limitRow}>
                    <Text style={styles.limitLabel}>FSSAI Limit</Text>
                    <Text style={styles.limitValue}>{param.fssaiLimit}</Text>
                  </View>
                  <View style={styles.limitRow}>
                    <Text style={styles.limitLabel}>EU Limit</Text>
                    <Text style={styles.limitValue}>{param.euLimit}</Text>
                  </View>
                  <View style={styles.limitRow}>
                    <Text style={styles.limitLabel}>US FDA Limit</Text>
                    <Text style={styles.limitValue}>{param.usFdaLimit}</Text>
                  </View>
                </View>
              )}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
  },
  headerLeft: {
    flex: 1,
  },
  categoryName: {
    fontSize: theme.fontSize.base,
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.text,
  },
  paramCount: {
    fontSize: theme.fontSize.xs,
    fontFamily: theme.fonts.regular,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  chevron: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.sm,
  },
  parameterList: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.md,
  },
  paramRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderSoft,
  },
  paramName: {
    flex: 1,
    fontSize: theme.fontSize.sm,
    fontFamily: theme.fonts.regular,
    color: theme.colors.text,
    marginRight: theme.spacing.sm,
  },
  paramRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paramResult: {
    fontSize: theme.fontSize.sm,
    fontFamily: theme.fonts.medium,
    color: theme.colors.text,
    marginRight: theme.spacing.sm,
  },
  statusBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 3,
    borderRadius: theme.borderRadius.sm,
  },
  statusText: {
    fontSize: theme.fontSize.xs,
    fontFamily: theme.fonts.medium,
    color: '#FFFFFF',
  },
  limitDetails: {
    backgroundColor: theme.colors.green25,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  limitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  limitLabel: {
    fontSize: theme.fontSize.xs,
    fontFamily: theme.fonts.medium,
    color: theme.colors.textSecondary,
  },
  limitValue: {
    fontSize: theme.fontSize.xs,
    fontFamily: theme.fonts.regular,
    color: theme.colors.text,
  },
});
