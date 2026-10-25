import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { theme } from '../theme';
import Icon from './Icon';

/**
 * Form input with optional label, left/right icons, and error state.
 *
 * Usage:
 *   <Input label="Email" leftIcon="mail" placeholder="you@example.com" />
 *   <Input
 *     label="Password"
 *     leftIcon="lock"
 *     rightIcon="eye"
 *     onRightIconPress={toggleVisibility}
 *     secureTextEntry={!visible}
 *   />
 *   <Input error="This field is required" placeholder="Name" />
 */
export default function Input({
  label,
  leftIcon,
  rightIcon,
  onRightIconPress,
  error,
  style,
  ...rest
}) {
  const hasLeftIcon = !!leftIcon;
  const hasRightIcon = !!rightIcon;

  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label.toUpperCase()}</Text> : null}

      <View style={styles.inputWrapper}>
        {hasLeftIcon && (
          <View style={styles.leftIconContainer}>
            <Icon
              name={leftIcon}
              size={18}
              color={theme.colors.textSecondary}
            />
          </View>
        )}

        <TextInput
          style={[
            styles.input,
            hasLeftIcon && styles.inputWithLeftIcon,
            hasRightIcon && styles.inputWithRightIcon,
            error ? styles.inputError : null,
            style,
          ]}
          placeholderTextColor={theme.colors.textDim}
          {...rest}
        />

        {hasRightIcon && (
          onRightIconPress ? (
            <TouchableOpacity
              style={styles.rightIconContainer}
              onPress={onRightIconPress}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Icon
                name={rightIcon}
                size={18}
                color={theme.colors.textSecondary}
              />
            </TouchableOpacity>
          ) : (
            <View style={styles.rightIconContainer}>
              <Icon
                name={rightIcon}
                size={18}
                color={theme.colors.textSecondary}
              />
            </View>
          )
        )}
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
  label: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSize['2xs'],  // 10
    color: theme.colors.textSecondary,
    letterSpacing: 4,
    marginBottom: 6,
  },
  inputWrapper: {
    position: 'relative',
    justifyContent: 'center',
  },
  input: {
    backgroundColor: theme.colors.cardBackground,
    borderWidth: 1,
    borderColor: theme.colors.border,  // #ECEAE4
    borderRadius: theme.borderRadius.md, // 10
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontFamily: theme.fonts.regular,
    fontSize: theme.fontSize.base,     // 14
    color: '#1A201A',
  },
  inputWithLeftIcon: {
    paddingLeft: 40,
  },
  inputWithRightIcon: {
    paddingRight: 40,
  },
  inputError: {
    borderColor: theme.colors.error,
  },
  leftIconContainer: {
    position: 'absolute',
    left: 12,
    zIndex: 1,
  },
  rightIconContainer: {
    position: 'absolute',
    right: 12,
    zIndex: 1,
  },
  errorText: {
    fontFamily: theme.fonts.regular,
    fontSize: 11,
    color: theme.colors.error,
    marginTop: 4,
  },
});
