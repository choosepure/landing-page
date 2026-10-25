# Requirements Document

## Introduction

This document defines the requirements for the ChoosePure mobile app UI redesign. The redesign converts 14 screens from a React + Tailwind CSS handoff package into React Native `StyleSheet.create` code, introduces a refreshed design token system, a shared component library with SVG icons, 4 new screens, and a restructured 4-tab navigation. The redesign is visual-only — all existing business logic (authentication, API calls, Firebase services, payments) remains unchanged.

## Glossary

- **Theme**: The centralized design token object (`src/theme/index.js`) containing colors, fonts, spacing, border radii, and shadows used across all screens
- **Handoff**: The React + Tailwind CSS reference package (`react-handoff/`) providing the target visual designs
- **Icon_Component**: The SVG-based icon component (`src/components/Icon.js`) rendering 33 named icons via `react-native-svg`
- **Button_Component**: The reusable button component supporting 5 visual variants and 3 sizes
- **Card_Component**: The white surface wrapper component with standard shadow and border
- **Input_Component**: The form input component with optional icons and label
- **ScoreBadge_Component**: The circular safety-score badge (0-100) with color-tiered backgrounds
- **NutriGradeBadge_Component**: The square A-E Nutri-Score badge with grade-specific colors
- **ProductCard_Component**: The horizontal product list row with image, text, and badge
- **Dropdown_Component**: The expandable option picker for filtering
- **CustomTabBar_Component**: The custom bottom tab bar with SVG icons replacing the default tab bar
- **MainTabs**: The bottom tab navigator providing the app's primary navigation structure
- **StyleSheet**: React Native's `StyleSheet.create` API for defining component styles
- **LinearGradient**: The `expo-linear-gradient` component for rendering gradient backgrounds

## Requirements

### Requirement 1: Design Token System

**User Story:** As a developer, I want a centralized theme object with all design tokens, so that I can apply consistent styling across all screens without hardcoding values.

#### Acceptance Criteria

1. THE Theme SHALL export a `colors` object containing all brand greens (primary `#226342`, primaryLight `#2D7A52`, primaryLighter `#3D8862`, primarySoft `#5DA47B`, green100, green50, green25), surface colors (background `#F5F7F4`, cardBackground `#FFFFFF`), text colors (text `#1A201A`, textSecondary `#6B7268`, textDim `#9B9F97`), border colors (border `#ECEAE4`, borderSoft `#F4F2EC`), semantic colors (error `#D14E36`, success `#1E8449`, warning `#F4C430`), Nutri-Score colors (nutriA through nutriE), and safety score tier colors (scoreGood, scoreMid, scoreBad with backgrounds)
2. THE Theme SHALL export a `fonts` object mapping `regular` to `Inter_400Regular`, `medium` to `Inter_500Medium`, `semiBold` to `Inter_600SemiBold`, `bold` to `Inter_700Bold`, and `display` to `Inter_700Bold`
3. THE Theme SHALL export a `fontSize` object with values for keys `2xs` (10), `xs` (11), `sm` (13), `base` (14), `md` (15), `lg` (17), `xl` (19), `2xl` (22), `3xl` (26), `4xl` (32)
4. THE Theme SHALL export a `borderRadius` object with values for keys `sm` (8), `md` (10), `lg` (14), `xl` (18), `2xl` (24)
5. THE Theme SHALL export a `shadow` object with `card`, `elev`, and `pop` presets containing valid React Native shadow properties
6. THE Theme SHALL maintain backward compatibility by preserving existing token keys (`colors.primary`, `colors.background`, `fonts.regular`, `spacing.xs/sm/md/lg/xl`) so that unreferenced screens continue to compile

### Requirement 2: SVG Icon Component

**User Story:** As a developer, I want a single Icon component that renders any of the 33 named SVG icons, so that I can replace emoji icons and use consistent iconography throughout the app.

#### Acceptance Criteria

1. THE Icon_Component SHALL render SVG icons using `react-native-svg` for the following 33 names: `home`, `scan`, `scan-corners`, `flask`, `tag`, `user`, `clock`, `search`, `arrow-left`, `arrow-right`, `chevron-right`, `chevron-down`, `check`, `check-circle`, `close`, `eye`, `mail`, `phone`, `flash`, `image`, `info`, `shield-check`, `leaf`, `gift`, `star`, `plus`, `bell`, `lock`, `help`, `logout`, `share`, `sliders`, `warn-tri`
2. THE Icon_Component SHALL accept `name` (string), `size` (number, default 20), `color` (string, default theme text color), and `strokeWidth` (number, default 1.7) props
3. THE Icon_Component SHALL use a 24x24 viewBox scaled to the provided `size` for all icons
4. IF the Icon_Component receives an unknown `name` prop, THEN THE Icon_Component SHALL return null without crashing
5. THE Icon_Component SHALL render stroke-based icons with `stroke={color}` and `fill="none"`, and fill-based icons (`star`, `leaf`, `flash`, `check-circle`) with `fill={color}`

### Requirement 3: Button Component

**User Story:** As a developer, I want a reusable Button component with multiple variants and sizes, so that I can create consistent interactive elements across all screens.

#### Acceptance Criteria

1. THE Button_Component SHALL support 5 variants: `primary` (bg `#226342`, white text), `secondary` (bg `#EDF3EE`, green-800 text), `ghost` (transparent bg, green-800 text), `danger` (bg `#D14E36`, white text), and `outline` (transparent bg, green-800 text, green-800 1px border)
2. THE Button_Component SHALL support 3 sizes: `sm` (paddingH 12, paddingV 8, fontSize 13, borderRadius 10), `md` (paddingH 16, paddingV 12, fontSize 14, borderRadius 14), `lg` (paddingH 20, paddingV 16, fontSize 14, borderRadius 14)
3. WHEN the `disabled` prop is true, THE Button_Component SHALL reduce opacity to 0.5 and prevent press events
4. WHEN the `fullWidth` prop is true, THE Button_Component SHALL stretch to fill its parent container width

### Requirement 4: Card Component

**User Story:** As a developer, I want a Card wrapper component with standard styling, so that I can create consistent content surfaces across screens.

#### Acceptance Criteria

1. THE Card_Component SHALL render with white background, borderRadius 14, 1px border in color `#ECEAE4`, and the `card` shadow preset
2. WHEN the `onPress` prop is provided, THE Card_Component SHALL render as a touchable element with activeOpacity 0.8

### Requirement 5: Input Component

**User Story:** As a developer, I want a styled Input component with icon support, so that I can build consistent form fields across auth and search screens.

#### Acceptance Criteria

1. THE Input_Component SHALL render a label (uppercase, letter-spacing, 10px font size) above the text input field when a `label` prop is provided
2. THE Input_Component SHALL render a left icon inside the input field when a `leftIcon` prop is provided
3. THE Input_Component SHALL render a right icon inside the input field when a `rightIcon` prop is provided, and trigger `onRightIconPress` when tapped
4. WHEN the `error` prop contains a string, THE Input_Component SHALL display the error text below the input and apply error border styling

### Requirement 6: ScoreBadge Component

**User Story:** As a developer, I want a ScoreBadge component that displays safety scores with color-coded tiers, so that users can quickly assess product safety at a glance.

#### Acceptance Criteria

1. THE ScoreBadge_Component SHALL render a circular badge displaying the numeric score (0-100) with tier-based background and foreground colors
2. THE ScoreBadge_Component SHALL apply tier colors: scores 90-100 use bg `#D9E8DD` fg `#2D6B4F`, scores 80-89 use bg `#DCEAF4` fg `#2C5F87`, scores 70-79 use bg `#F0E5D5` fg `#8B6F3D`, scores 0-69 use bg `#F4DDD4` fg `#A8482E`
3. THE ScoreBadge_Component SHALL accept a `size` prop (default 44) controlling the badge width and height

### Requirement 7: NutriGradeBadge Component

**User Story:** As a developer, I want a NutriGradeBadge component that displays letter grades with appropriate colors, so that users can identify product nutrition quality.

#### Acceptance Criteria

1. THE NutriGradeBadge_Component SHALL render a square badge displaying the grade letter (A-E) with grade-specific background and text colors
2. THE NutriGradeBadge_Component SHALL apply colors: A uses bg `#1E8449` text white, B uses bg `#7CB342` text white, C uses bg `#F4C430` text `#1A201A`, D uses bg `#E89B3C` text white, E uses bg `#D14E36` text white
3. IF the NutriGradeBadge_Component receives an invalid grade, THEN THE NutriGradeBadge_Component SHALL fall back to Grey colors

### Requirement 8: ProductCard Component

**User Story:** As a developer, I want a ProductCard component for displaying products in lists, so that product information is presented consistently across Home, Discover, History, and NutriGradeList screens.

#### Acceptance Criteria

1. THE ProductCard_Component SHALL render a horizontal row containing a 56x56 rounded image placeholder, a text column (name, brand, meta), and an optional badge (ScoreBadge or NutriGradeBadge) on the right
2. WHEN a `score` prop is provided, THE ProductCard_Component SHALL render a ScoreBadge on the right side
3. WHEN a `grade` prop is provided, THE ProductCard_Component SHALL render a NutriGradeBadge on the right side
4. WHEN the `onPress` prop is provided, THE ProductCard_Component SHALL be tappable and invoke the callback

### Requirement 9: Dropdown Component

**User Story:** As a developer, I want a Dropdown component for filtering options, so that users can select categories or grades on the Home and NutriGradeList screens.

#### Acceptance Criteria

1. THE Dropdown_Component SHALL display the currently selected value with a chevron-down icon
2. WHEN the user taps the Dropdown_Component, THE Dropdown_Component SHALL expand to show all available options
3. WHEN the user selects an option, THE Dropdown_Component SHALL collapse, update the displayed value, and invoke the `onChange` callback with the selected value

### Requirement 10: Custom Tab Bar

**User Story:** As a developer, I want a custom bottom tab bar with SVG icons, so that the navigation matches the redesigned visual style with 4 tabs.

#### Acceptance Criteria

1. THE CustomTabBar_Component SHALL render exactly 4 tabs: Home (icon `home`), Scan (icon `scan`), History (icon `clock`), Profile (icon `user`)
2. THE CustomTabBar_Component SHALL highlight the active tab with color `#226342` and strokeWidth 2, and render inactive tabs with color `#6B7268` and strokeWidth 1.7
3. THE CustomTabBar_Component SHALL display a text label below each icon using the Inter medium font at 11px

### Requirement 11: Navigation Restructure

**User Story:** As a user, I want a simplified 4-tab navigation (Home, Scan, History, Profile), so that I can access the main features with fewer taps.

#### Acceptance Criteria

1. THE MainTabs SHALL provide exactly 4 bottom tabs: Home, Scan, History, and Profile
2. THE MainTabs Home tab stack SHALL include routes for DashboardHome, ProductDetail, LabReport, Discover, NutriGradeList, and Polling (VoteScreen)
3. THE MainTabs Scan tab stack SHALL include routes for ScannerHome, ResultCard, ProductDetail, and ScanHistory
4. THE MainTabs Profile tab stack SHALL include routes for ProfileHome, Subscription, and Referral
5. THE MainTabs History tab stack SHALL navigate directly to ScanHistoryScreen as its root
6. WHEN the user navigates between tabs, THE MainTabs SHALL use the CustomTabBar_Component instead of the default bottom tab bar

### Requirement 12: Screen Restyling — Auth Screens

**User Story:** As a user, I want the authentication screens (Onboarding, Login, Register, OTP) to match the new visual design, so that the app feels modern and cohesive from first launch.

#### Acceptance Criteria

1. WHEN the OnboardingScreen renders, THE OnboardingScreen SHALL display slide content with animated dot indicators (active: width 24 green-700, inactive: width 8 green-100) on a green-50 background
2. WHEN the LoginScreen renders, THE LoginScreen SHALL display an email/mobile tab switcher, card-wrapped form fields with icon inputs, social login buttons (Google, Apple) using the outline Button variant, and a "Forgot password?" link
3. WHEN the RegisterScreen renders, THE RegisterScreen SHALL display a card-wrapped form with icon inputs (user, mail, phone, lock+eye) and terms/privacy text
4. WHEN the OTPScreen renders, THE OTPScreen SHALL display 6 individual digit input fields, a mail icon in a green circle, card-wrapped instruction text, and a resend timer
5. THE auth screens SHALL preserve all existing authentication logic (Firebase auth, OTP verification, password reset) without modification

### Requirement 13: Screen Restyling — Main Screens

**User Story:** As a user, I want the main app screens (Home, Scanner, Plans, Referral, Vote, Profile) to match the new visual design, so that the experience is consistent throughout the app.

#### Acceptance Criteria

1. WHEN the HomeScreen (DashboardScreen) renders, THE HomeScreen SHALL display a search bar card with scan-corners icon, a "Latest Testing Reports" section with ProductCard list, a "Check Nutri-score" section with Dropdown grade filter and ProductCard list, an avatar button linking to profile, and greeting text
2. WHEN the ScannerScreen renders, THE ScannerScreen SHALL display a dark-themed viewfinder with green corner brackets, flash/gallery buttons, recent scan thumbnails, and a manual barcode entry link
3. WHEN the PlansScreen (SubscriptionScreen) renders, THE PlansScreen SHALL display a star icon in a green circle, 3 plan cards (Monthly/Yearly/Family) with radio selection, a "Best value" badge on yearly, a perks checklist with check icons, and a "Start Free Trial" CTA button
4. WHEN the ReferralScreen renders, THE ReferralScreen SHALL display a green gradient earnings banner with gift icon, a referral code box with dashed border and copy button, a 3-step "How it works" section with numbered circles, and a recent activity list
5. WHEN the VoteScreen (PollingScreen) renders, THE VoteScreen SHALL display suggestion cards with vote/voted toggle buttons, a "Suggest a category" input card, and an explanation card
6. WHEN the ProfileScreen renders, THE ProfileScreen SHALL display an avatar with gradient background, name/email/subscription badge, 3-column stats (Scans/Saved/Referrals), grouped menu sections (Account, Subscription, Support) with icons and chevrons, and a sign-out option in red
7. THE restyled screens SHALL preserve all existing business logic (API calls, state management, Firebase analytics, Razorpay payments) without modification

### Requirement 14: New Screens

**User Story:** As a user, I want new screens (ProductDetail, LabReport, Discover, NutriGradeList) that provide deeper product information and discovery, so that I can make informed purchasing decisions.

#### Acceptance Criteria

1. WHEN the ProductDetailScreen renders, THE ProductDetailScreen SHALL display a gradient hero with product image placeholder, a ScoreBadge (64px) with label, 3-column quick stats (Nutri/NOVA/Eco), collapsible info sections (Ingredients, Allergens, Certifications), and a "View Full Lab Report" button
2. WHEN the LabReportScreen renders, THE LabReportScreen SHALL display a product summary card, a green gradient score banner with check icon, 3 test panels (Heavy Metals, Pesticide, Microbiological) with pass/fail rows, and a certified lab partner card
3. WHEN the DiscoverScreen renders, THE DiscoverScreen SHALL display a search bar, horizontal scrollable category pills, a product list with scores, and a filter icon in the header
4. WHEN the NutriGradeListScreen renders, THE NutriGradeListScreen SHALL display a 5-column grade pill selector, a search bar with clear button, category pills, a filtered product list with grade badges, and a result count text
5. WHEN the user taps "View Full Lab Report" on ProductDetailScreen, THE ProductDetailScreen SHALL navigate to LabReportScreen with the product ID

### Requirement 15: Styling Standards

**User Story:** As a developer, I want all screens to follow consistent styling patterns, so that the codebase remains maintainable and visually coherent.

#### Acceptance Criteria

1. THE app SHALL use `StyleSheet.create` for all component styles with no inline Tailwind, NativeWind, or CSS
2. THE app SHALL reference the Theme object for all color, font, spacing, borderRadius, and shadow values instead of hardcoding them
3. THE app SHALL use the Inter font family exclusively — `Inter_400Regular`, `Inter_500Medium`, `Inter_600SemiBold`, `Inter_700Bold` — with no other font families
4. THE app SHALL use `FlatList` with `keyExtractor` for all scrollable product lists instead of `ScrollView` with `.map()`

### Requirement 16: Backward Compatibility

**User Story:** As a user, I want all existing features (barcode scanning, authentication, payments, notifications, analytics) to continue working after the redesign, so that no functionality is lost.

#### Acceptance Criteria

1. THE app SHALL preserve all existing Firebase integrations (auth, analytics, crashlytics, messaging, remote config, firestore) without modification
2. THE app SHALL preserve the existing Razorpay payment flow without modification
3. THE app SHALL preserve the existing barcode scanning functionality (expo-camera) without modification
4. THE app SHALL preserve the existing deep linking and notification handling without modification
5. THE app SHALL continue to load Inter fonts via `@expo-google-fonts/inter` in App.js without adding new font dependencies
6. IF the `expo-linear-gradient` package is unavailable at runtime, THEN THE app SHALL fall back to a solid background color for gradient sections without crashing

### Requirement 17: Dependencies

**User Story:** As a developer, I want only the minimum new dependencies added, so that the app bundle size and maintenance burden remain low.

#### Acceptance Criteria

1. THE app SHALL add `react-native-svg` (Expo-compatible version) as a production dependency for SVG icon rendering
2. THE app SHALL add `expo-linear-gradient` (Expo-compatible version) as a production dependency for gradient backgrounds
3. THE app SHALL NOT add any CSS-in-JS libraries, Tailwind/NativeWind, or third-party icon libraries
