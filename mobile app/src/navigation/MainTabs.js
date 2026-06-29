import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { theme } from '../theme';
import CustomTabBar from '../components/CustomTabBar';

// Existing screens
import DashboardScreen from '../screens/DashboardScreen';
import ScannerScreen from '../screens/ScannerScreen';
import ResultCardScreen from '../screens/ResultCardScreen';
import ScanHistoryScreen from '../screens/ScanHistoryScreen';
import ReportDetailScreen from '../screens/ReportDetailScreen';
import ProfileScreen from '../screens/ProfileScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import HelpCenterScreen from '../screens/HelpCenterScreen';
import LegalScreen from '../screens/LegalScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import SubscriptionScreen from '../screens/SubscriptionScreen';
import ReferralScreen from '../screens/ReferralScreen';
import VisionScreen from '../screens/VisionScreen';
import PollingScreen from '../screens/PollingScreen';

// New placeholder screens (replaced in task 13)
import ProductDetailScreen from '../screens/ProductDetailScreen';
import AllReportsScreen from '../screens/AllReportsScreen';
import LabReportScreen from '../screens/LabReportScreen';
import DiscoverScreen from '../screens/DiscoverScreen';
import NutriGradeListScreen from '../screens/NutriGradeListScreen';

// Label scanner screens
import LabelScannerScreen from '../screens/LabelScannerScreen';
import LabelResultScreen from '../screens/LabelResultScreen';

const Tab = createBottomTabNavigator();
const HomeStack = createStackNavigator();
const ScanStack = createStackNavigator();
const VoteStack = createStackNavigator();
const HistoryStack = createStackNavigator();
const ProfileStack = createStackNavigator();

const stackScreenOptions = {
  headerStyle: {
    backgroundColor: theme.colors.background,
    elevation: 0,
    shadowOpacity: 0,
    borderBottomWidth: 0,
  },
  headerTintColor: theme.colors.primary,
  headerTitleStyle: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSize.lg,
    color: theme.colors.text,
  },
};

function HomeTabStack() {
  return (
    <HomeStack.Navigator screenOptions={stackScreenOptions}>
      <HomeStack.Screen
        name="DashboardHome"
        component={DashboardScreen}
        options={{ title: 'Home' }}
      />
      <HomeStack.Screen
        name="ReportDetail"
        component={ReportDetailScreen}
        options={{ title: 'Test Report' }}
      />
      <HomeStack.Screen
        name="AllReports"
        component={AllReportsScreen}
        options={{ title: 'All Reports' }}
      />
      <HomeStack.Screen
        name="ProductDetail"
        component={ProductDetailScreen}
        options={{ title: 'Product Detail' }}
      />
      <HomeStack.Screen
        name="LabReport"
        component={LabReportScreen}
        options={{ title: 'Lab Report' }}
      />
      <HomeStack.Screen
        name="Discover"
        component={DiscoverScreen}
        options={{ title: 'Discover' }}
      />
      <HomeStack.Screen
        name="NutriGradeList"
        component={NutriGradeListScreen}
        options={{ title: 'Nutri-Score' }}
      />
      <HomeStack.Screen
        name="Polling"
        component={PollingScreen}
        options={{ title: 'Vote' }}
      />
    </HomeStack.Navigator>
  );
}

function ScanTabStack() {
  return (
    <ScanStack.Navigator screenOptions={stackScreenOptions}>
      <ScanStack.Screen
        name="ScannerHome"
        component={ScannerScreen}
        options={{ title: 'Scan Product' }}
      />
      <ScanStack.Screen
        name="ResultCard"
        component={ResultCardScreen}
        options={{ title: 'Product Details' }}
      />
      <ScanStack.Screen
        name="ScanHistory"
        component={ScanHistoryScreen}
        options={{ title: 'Scan History' }}
      />
      <ScanStack.Screen
        name="ScanReportDetail"
        component={ReportDetailScreen}
        options={{ title: 'Lab Report' }}
      />
      <ScanStack.Screen
        name="LabelScanner"
        component={LabelScannerScreen}
        options={{ title: 'Scan Label' }}
      />
      <ScanStack.Screen
        name="LabelResult"
        component={LabelResultScreen}
        options={{ title: 'Label Analysis' }}
      />
    </ScanStack.Navigator>
  );
}

function VoteTabStack() {
  return (
    <VoteStack.Navigator screenOptions={stackScreenOptions}>
      <VoteStack.Screen
        name="VoteHome"
        component={PollingScreen}
        options={{ title: 'Vote' }}
      />
    </VoteStack.Navigator>
  );
}

function HistoryTabStack() {
  return (
    <HistoryStack.Navigator screenOptions={stackScreenOptions}>
      <HistoryStack.Screen
        name="ScanHistoryHome"
        component={ScanHistoryScreen}
        options={{ title: 'History' }}
      />
      <HistoryStack.Screen
        name="ResultCard"
        component={ResultCardScreen}
        options={{ title: 'Product Details' }}
      />
    </HistoryStack.Navigator>
  );
}

function ProfileTabStack() {
  return (
    <ProfileStack.Navigator screenOptions={stackScreenOptions}>
      <ProfileStack.Screen
        name="ProfileHome"
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
      <ProfileStack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{ title: 'Edit Profile' }}
      />
      <ProfileStack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ title: 'Notifications' }}
      />
      <ProfileStack.Screen
        name="HelpCenter"
        component={HelpCenterScreen}
        options={{ title: 'Help Center' }}
      />
      <ProfileStack.Screen
        name="Legal"
        component={LegalScreen}
        options={{ title: 'Legal' }}
      />
      <ProfileStack.Screen
        name="ProfileSubscription"
        component={SubscriptionScreen}
        options={{ title: 'Subscription' }}
      />
      <ProfileStack.Screen
        name="Referral"
        component={ReferralScreen}
        options={{ title: 'Referral' }}
      />
      <ProfileStack.Screen
        name="Vision"
        component={VisionScreen}
        options={{ title: 'Our Vision' }}
      />
    </ProfileStack.Navigator>
  );
}

export default function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home" component={HomeTabStack} />
      <Tab.Screen name="Scan" component={ScanTabStack} />
      <Tab.Screen name="Vote" component={VoteTabStack} />
      <Tab.Screen name="History" component={HistoryTabStack} />
      <Tab.Screen name="Profile" component={ProfileTabStack} />
    </Tab.Navigator>
  );
}
