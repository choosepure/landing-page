import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { theme } from '../theme';

/**
 * Reusable button with 5 variants and 3 sizes.
 *
 * Variants: primary | secondary | ghost | danger | outline
 * Sizes:    sm | md | lg
 *
 * Usage:
 *   <Button variant="primary" size="lg" fullWidth onPress={handleSubmit}>
 *     Sign In
 *   </Button>
 */
export default function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  onPress,
  children,
}) {
  const variantStyle = variantStyles[variant] || variantStyles.primary;
  const sizeStyle = sizeStyles[size] || sizeStyles.md;
  const textColor = variantTextColors[variant] || variantTextColors.primary;

  return (
    <TouchableOpacity
      style={[
        styles.base,
        variantStyle,
        sizeStyle,
        fullWidth && styles.fullWidth,
        disabled && styles.disabled,
      ]}
      activeOpacity={0.85}
      onPress={onPress}
      disabled={disabled}
    >
      {typeof children === 'string' ? (
        <Text
          style={[
            styles.text,
            { color: textColor, fontSize: sizeTextSizes[size] || sizeTextSizes.md },
          ]}
        >
          {children}
        </Text>
      ) : (
        children
      )}
    </TouchableOpacity>
  );
}

const variantStyles = StyleSheet.create({
  primary: {
    backgroundColor: theme.colors.primary,
  },
  secondary: {
    backgroundColor: theme.colors.green50,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  danger: {
    backgroundColor: theme.colors.error,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
});

const variantTextColors = {
  primary: '#FFFFFF',
  secondary: theme.colors.primary,
  ghost: theme.colors.primary,
  danger: '#FFFFFF',
  outline: theme.colors.primary,
};

const sizeStyles = StyleSheet.create({
  sm: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.md, // 10
  },
  md: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: theme.borderRadius.lg, // 14
  },
  lg: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: theme.borderRadius.lg, // 14
  },
});

const sizeTextSizes = {
  sm: theme.fontSize.sm,   // 13
  md: theme.fontSize.base,  // 14
  lg: theme.fontSize.base,  // 14
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontFamily: theme.fonts.semiBold,
  },
});
