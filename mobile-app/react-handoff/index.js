// Choosepure handoff barrel — central export for ergonomic imports
//
// Usage:
//   import { HomeScreen, Button, NUTRI_GRADES } from './choosepure'

// Tokens
export * from './tokens';

// Atoms / molecules
export { default as Button }          from './components/Button';
export { default as Card }            from './components/Card';
export { default as Input }           from './components/Input';
export { default as Icon }            from './components/Icon';
export { default as ScoreBadge }      from './components/ScoreBadge';
export { default as NutriGradeBadge } from './components/NutriGradeBadge';
export { default as StatusBar }       from './components/StatusBar';
export { default as TabBar, TAB_PRESETS } from './components/TabBar';
export { default as PhoneFrame }      from './components/PhoneFrame';
export { default as ProductCard }     from './components/ProductCard';
export { default as Dropdown }        from './components/Dropdown';

// Screens
export { default as OnboardingScreen }    from './screens/OnboardingScreen';
export { default as LoginScreen }         from './screens/LoginScreen';
export { default as SignupScreen }        from './screens/SignupScreen';
export { default as OTPScreen }           from './screens/OTPScreen';
export { default as HomeScreen }          from './screens/HomeScreen';
export { default as ScannerScreen }       from './screens/ScannerScreen';
export { default as ProductDetailScreen } from './screens/ProductDetailScreen';
export { default as LabReportScreen }     from './screens/LabReportScreen';
export { default as DiscoverScreen }      from './screens/DiscoverScreen';
export { default as NutriGradeListScreen } from './screens/NutriGradeListScreen';
export { default as PlansScreen }         from './screens/PlansScreen';
export { default as ReferralScreen }      from './screens/ReferralScreen';
export { default as ProfileScreen }       from './screens/ProfileScreen';
export { default as VoteScreen }          from './screens/VoteScreen';
