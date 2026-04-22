import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Text } from 'react-native';
import { theme } from '../theme';

// Placeholder screens — replaced once real screens are created
import DashboardScreen from '../screens/DashboardScreen';
import PollingScreen from '../screens/PollingScreen';
import SuggestionScreen from '../screens/SuggestionScreen';
import ReferralScreen from '../screens/ReferralScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ReportDetailScreen from '../screens/ReportDetailScreen';
import SubscriptionScreen from '../screens/SubscriptionScreen';
import VisionScreen from '../screens/VisionScreen';
import ScannerScreen from '../screens/ScannerScreen';
import ResultCardScreen from '../screens/ResultCardScreen';
import ScanHistoryScreen from '../screens/ScanHistoryScreen';

const Tab = createBottomTabNavigator();
const DashStack = createStackNavigator();
const ProfileStack = createStackNavigator();
const ScanStack = createStackNavigator();

const stackScreenOptions = {
  headerStyle: { backgroundColor: theme.colors.background, elevation: 0, shadowOpacity: 0 },
  headerTintColor: theme.colors.primary,
  headerTitleStyle: { fontFamily: theme.fonts.semiBold, color: theme.colors.text },
};

function DashboardStackScreen() {
  return (
    <DashStack.Navigator screenOptions={stackScreenOptions}>
      <DashStack.Screen name="DashboardHome" component={DashboardScreen} options={{ title: 'Purity Dashboard' }} />
      <DashStack.Screen name="ReportDetail" component={ReportDetailScreen} options={{ title: 'Report' }} />
      <DashStack.Screen name="Subscription" component={SubscriptionScreen} options={{ title: 'Subscription' }} />
    </DashStack.Navigator>
  );
}

function ProfileStackScreen() {
  return (
    <ProfileStack.Navigator screenOptions={stackScreenOptions}>
      <ProfileStack.Screen name="ProfileHome" component={ProfileScreen} options={{ title: 'Profile' }} />
      <ProfileStack.Screen name="Vision" component={VisionScreen} options={{ title: 'Our Vision' }} />
      <ProfileStack.Screen name="ProfileSubscription" component={SubscriptionScreen} options={{ title: 'Subscription' }} />
    </ProfileStack.Navigator>
  );
}

function ScannerStackScreen() {
  return (
    <ScanStack.Navigator screenOptions={stackScreenOptions}>
      <ScanStack.Screen name="ScannerHome" component={ScannerScreen} options={{ title: 'Scan Product' }} />
      <ScanStack.Screen name="ResultCard" component={ResultCardScreen} options={{ title: 'Product Details' }} />
      <ScanStack.Screen name="ScanHistory" component={ScanHistoryScreen} options={{ title: 'Scan History' }} />
      <ScanStack.Screen name="ScanReportDetail" component={ReportDetailScreen} options={{ title: 'Lab Report' }} />
    </ScanStack.Navigator>
  );
}

function TabIcon({ label, focused }) {
  const icons = { Dashboard: '🏠', Scan: '📷', Polling: '🗳️', Suggestions: '💡', Referral: '🎁', Profile: '👤' };
  return <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>{icons[label] || '•'}</Text>;
}

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarLabelStyle: { fontFamily: theme.fonts.medium, fontSize: 11 },
        tabBarStyle: { backgroundColor: theme.colors.cardBackground, borderTopColor: theme.colors.border },
        tabBarIcon: ({ focused }) => <TabIcon label={route.name} focused={focused} />,
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardStackScreen} />
      <Tab.Screen name="Scan" component={ScannerStackScreen} />
      <Tab.Screen name="Polling" component={PollingScreen} />
      <Tab.Screen name="Suggestions" component={SuggestionScreen} />
      <Tab.Screen name="Referral" component={ReferralScreen} />
      <Tab.Screen name="Profile" component={ProfileStackScreen} />
    </Tab.Navigator>
  );
}
