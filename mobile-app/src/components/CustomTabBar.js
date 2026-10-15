import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import Icon from './Icon';
import { theme } from '../theme';

const TABS = [
  { route: 'Home', icon: 'home', label: 'Home' },
  { route: 'Scan', icon: 'scan', label: 'Scan' },
  { route: 'Vote', icon: 'star', label: 'Vote' },
  { route: 'History', icon: 'clock', label: 'History' },
  { route: 'Profile', icon: 'user', label: 'Profile' },
];

const ACTIVE_COLOR = '#226342';
const INACTIVE_COLOR = '#6B7268';

export default function CustomTabBar({ state, descriptors, navigation }) {
  return (
    <View style={styles.tabBar}>
      {TABS.map((tab, index) => {
        const isFocused = state.index === index;
        const routeKey = state.routes[index]?.key;
        const descriptor = routeKey ? descriptors[routeKey] : undefined;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: routeKey,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(tab.route);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: routeKey,
          });
        };

        return (
          <TouchableOpacity
            key={tab.route}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={descriptor?.options?.tabBarAccessibilityLabel || tab.label}
            onPress={onPress}
            onLongPress={onLongPress}
            style={styles.tabItem}
          >
            <Icon
              name={tab.icon}
              size={24}
              color={isFocused ? ACTIVE_COLOR : INACTIVE_COLOR}
              strokeWidth={isFocused ? 2 : 1.7}
            />
            <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderSoft,
    paddingBottom: Platform.OS === 'ios' ? 34 : 0,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 4,
  },
  tabLabel: {
    fontFamily: theme.fonts.medium,
    fontSize: 11,
    color: INACTIVE_COLOR,
  },
  tabLabelActive: {
    color: ACTIVE_COLOR,
  },
});
