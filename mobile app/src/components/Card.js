import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { theme } from '../theme';

/**
 * White surface card with standard shadow and border.
 * Renders as TouchableOpacity when `onPress` is provided, otherwise View.
 *
 * Usage:
 *   <Card style={{ padding: 20 }}>
 *     <Text>Content</Text>
 *   </Card>
 *
 *   <Card onPress={handleTap} style={{ padding: 16 }}>
 *     <Text>Tappable card</Text>
 *   </Card>
 */
export default function Card({ children, style, onPress }) {
  if (onPress) {
    return (
      <TouchableOpacity
        style={[styles.card, style]}
        onPress={onPress}
        activeOpacity={0.8}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.lg, // 14
    borderWidth: 1,
    borderColor: theme.colors.border,    // #ECEAE4
    ...theme.shadow.card,
  },
});
