import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  Animated,
  StyleSheet,
  Pressable,
} from 'react-native';
import { theme } from '../theme';
import Card from './Card';
import Icon from './Icon';

/**
 * Expandable dropdown picker. Displays the selected value with a chevron;
 * tapping opens a modal overlay with the full options list.
 *
 * Usage:
 *   <Dropdown
 *     label="Filter by grade"
 *     value={grade}
 *     options={[
 *       { value: 'A', label: 'Grade A · Excellent', meta: '342 products' },
 *       { value: 'B', label: 'Grade B · Good', meta: '528 products' },
 *     ]}
 *     onChange={setGrade}
 *     renderLeft={(option) => <NutriGradeBadge grade={option.value} size={28} />}
 *   />
 */
export default function Dropdown({
  label,
  value,
  options = [],
  onChange,
  renderLeft,
  renderOption,
}) {
  const [open, setOpen] = useState(false);
  const rotation = useRef(new Animated.Value(0)).current;

  const active = options.find((o) => o.value === value) || options[0];

  const toggleOpen = useCallback(() => {
    const toOpen = !open;
    setOpen(toOpen);
    Animated.timing(rotation, {
      toValue: toOpen ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [open, rotation]);

  const handleSelect = useCallback(
    (optionValue) => {
      onChange?.(optionValue);
      setOpen(false);
      Animated.timing(rotation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    },
    [onChange, rotation],
  );

  const chevronRotation = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const renderItem = useCallback(
    ({ item }) => {
      const isSelected = item.value === value;
      return (
        <TouchableOpacity
          style={[
            styles.option,
            isSelected && styles.optionSelected,
          ]}
          onPress={() => handleSelect(item.value)}
          activeOpacity={0.7}
          accessibilityRole="menuitem"
          accessibilityState={{ selected: isSelected }}
        >
          {renderOption ? renderOption(item) : null}
          <View style={styles.optionTextColumn}>
            <Text style={styles.optionLabel}>{item.label}</Text>
            {item.meta ? (
              <Text style={styles.optionMeta}>{item.meta}</Text>
            ) : null}
          </View>
          {isSelected && (
            <Icon
              name="check"
              size={16}
              color={theme.colors.primaryLight}
              strokeWidth={2.5}
            />
          )}
        </TouchableOpacity>
      );
    },
    [value, handleSelect, renderOption],
  );

  return (
    <View>
      {/* Trigger */}
      <Card onPress={toggleOpen} style={styles.trigger}>
        <View style={styles.triggerRow}>
          {renderLeft ? renderLeft(active) : null}
          <View style={styles.triggerTextColumn}>
            {label ? <Text style={styles.label}>{label}</Text> : null}
            <View style={styles.activeRow}>
              <Text style={styles.activeLabel} numberOfLines={1}>
                {active?.label}
              </Text>
              {active?.meta ? (
                <Text style={styles.activeMeta}> ({active.meta})</Text>
              ) : null}
            </View>
          </View>
          <Animated.View style={{ transform: [{ rotate: chevronRotation }] }}>
            <Icon
              name="chevron-down"
              size={20}
              color={theme.colors.textSecondary}
            />
          </Animated.View>
        </View>
      </Card>

      {/* Options modal */}
      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={toggleOpen}
      >
        <Pressable style={styles.backdrop} onPress={toggleOpen}>
          <View style={styles.modalContent}>
            <FlatList
              data={options}
              keyExtractor={(item) => String(item.value)}
              renderItem={renderItem}
              bounces={false}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  trigger: {
    padding: 12,
  },
  triggerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  triggerTextColumn: {
    flex: 1,
    minWidth: 0,
  },
  label: {
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSize['2xs'],
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 2,
  },
  activeRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  activeLabel: {
    fontFamily: theme.fonts.bold,
    fontSize: theme.fontSize.base,
    color: theme.colors.text,
    flexShrink: 1,
  },
  activeMeta: {
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSize.base,
    color: theme.colors.textSecondary,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modalContent: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
    maxHeight: 400,
    ...theme.shadow.pop,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderSoft,
    backgroundColor: theme.colors.cardBackground,
  },
  optionSelected: {
    backgroundColor: theme.colors.green50,
  },
  optionTextColumn: {
    flex: 1,
  },
  optionLabel: {
    fontFamily: theme.fonts.bold,
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
  },
  optionMeta: {
    fontFamily: theme.fonts.regular,
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
  },
});
