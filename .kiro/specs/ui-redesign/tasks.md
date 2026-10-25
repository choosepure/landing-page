# Implementation Plan: UI Redesign

## Overview

This plan converts the ChoosePure mobile app from its current visual style to the new design system defined in the `react-handoff/` package. Work proceeds in layers: dependencies → tokens → shared components → navigation → screen restyling → new screens → final integration. Each task references the handoff JSX files as the visual source of truth and the updated `theme/index.js` as the token source. All existing business logic (Firebase, auth, payments, scanning) is preserved untouched.

## Tasks

- [x] 1. Install new dependencies
  - Run `npx expo install react-native-svg expo-linear-gradient` in the `mobile app/` directory
  - Verify both packages appear in `package.json` dependencies
  - Verify the app still compiles after installation
  - _Requirements: 17.1, 17.2, 17.3_

- [x] 2. Update theme and design tokens
  - [x] 2.1 Update `src/theme/index.js` with new design token system
    - Replace existing `colors` object with full brand greens (primary `#226342`, primaryLight, primaryLighter, primarySoft, green100, green50, green25), surface colors (background `#F5F7F4`, cardBackground), text colors (text `#1A201A`, textSecondary `#6B7268`, textDim `#9B9F97`), border colors (border `#ECEAE4`, borderSoft `#F4F2EC`), semantic colors (error `#D14E36`, success `#1E8449`, warning `#F4C430`), Nutri-Score colors (nutriA–nutriE), and safety score tier colors (scoreGood/Mid/Bad with backgrounds)
    - Add `fonts.display` mapped to `Inter_700Bold`
    - Add `fontSize` object with keys `2xs`(10), `xs`(11), `sm`(13), `base`(14), `md`(15), `lg`(17), `xl`(19), `2xl`(22), `3xl`(26), `4xl`(32)
    - Add `lineHeight` object matching the design document
    - Update `borderRadius` to `sm`(8), `md`(10), `lg`(14), `xl`(18), `2xl`(24)
    - Add `shadow` object with `card`, `elev`, and `pop` presets containing valid RN shadow properties
    - Preserve existing keys (`colors.primary`, `colors.background`, `fonts.regular`, `spacing`) for backward compatibility
    - Reference: `react-handoff/tailwind.config.js` and `react-handoff/tokens/index.js`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

  - [ ]* 2.2 Write property tests for theme tokens — Property 1: color tokens match specification
    - **Property 1: Theme color tokens match specification**
    - For any color token key in the expected set, verify `theme.colors[key]` equals the hex value from the design document
    - **Validates: Requirement 1.1**

  - [ ]* 2.3 Write property tests for theme tokens — Property 2: fontSize tokens match specification
    - **Property 2: Theme fontSize tokens match specification**
    - For any fontSize key in the expected set, verify `theme.fontSize[key]` equals the specified numeric value
    - **Validates: Requirement 1.3**

  - [ ]* 2.4 Write property tests for theme tokens — Property 3: shadow presets contain valid RN shadow properties
    - **Property 3: Theme shadow presets contain valid React Native shadow properties**
    - For any shadow preset key in (`card`, `elev`, `pop`), verify the object contains `shadowColor`, `shadowOffset`, `shadowOpacity`, `shadowRadius`, and `elevation` with correct types
    - **Validates: Requirement 1.5**

  - [ ]* 2.5 Write property test for font family exclusivity — Property 13
    - **Property 13: Font family exclusivity**
    - For any key in `theme.fonts`, verify the value is a string starting with `"Inter_"`
    - **Validates: Requirement 15.3**

- [x] 3. Create Icon component
  - [x] 3.1 Create `src/components/Icon.js` with all 33 SVG icons
    - Port all 33 icon definitions from `react-handoff/components/Icon.jsx` to React Native using `react-native-svg` (`Svg`, `Path`, `Circle`, `Rect`)
    - Accept props: `name` (string), `size` (number, default 20), `color` (string, default `theme.colors.text`), `strokeWidth` (number, default 1.7)
    - Use 24x24 viewBox scaled to `size` for all icons
    - Render stroke icons with `stroke={color}` and `fill="none"`, fill icons (`star`, `leaf`, `flash`, `check-circle`) with `fill={color}`
    - Return `null` for unknown icon names
    - Wrap with `React.memo` for performance
    - Icon names: `home`, `scan`, `scan-corners`, `flask`, `tag`, `user`, `clock`, `search`, `arrow-left`, `arrow-right`, `chevron-right`, `chevron-down`, `check`, `check-circle`, `close`, `eye`, `mail`, `phone`, `flash`, `image`, `info`, `shield-check`, `leaf`, `gift`, `star`, `plus`, `bell`, `lock`, `help`, `logout`, `share`, `sliders`, `warn-tri`
    - Reference: `react-handoff/components/Icon.jsx`
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [ ]* 3.2 Write property test for Icon — Property 4: renders for all valid icon names
    - **Property 4: Icon renders for all valid icon names**
    - For any icon name in the set of 33 valid names, verify the Icon component returns a non-null rendered element
    - **Validates: Requirement 2.1**

  - [ ]* 3.3 Write property test for Icon — Property 5: returns null for invalid icon names
    - **Property 5: Icon returns null for invalid icon names**
    - For any arbitrary string not in the valid set, verify the Icon component returns null without throwing
    - **Validates: Requirement 2.4**

  - [ ]* 3.4 Write property test for Icon — Property 6: size scaling produces correct dimensions
    - **Property 6: Icon size scaling produces correct dimensions**
    - For any valid icon name and any positive numeric size, verify the rendered SVG has `width` and `height` equal to `size` and `viewBox` equal to `"0 0 24 24"`
    - **Validates: Requirements 2.2, 2.3**

- [x] 4. Create Button component
  - [x] 4.1 Create `src/components/Button.js` with 5 variants and 3 sizes
    - Implement `primary`, `secondary`, `ghost`, `danger`, `outline` variants with correct background, text color, and border per design spec
    - Implement `sm`, `md`, `lg` sizes with correct padding, fontSize, and borderRadius
    - Support `fullWidth`, `disabled` (opacity 0.5, no press), and `onPress` props
    - Use `TouchableOpacity` as the base pressable element
    - Reference: `react-handoff/components/Button.jsx`
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [ ]* 4.2 Write property test for Button — Property 7: variant style correctness
    - **Property 7: Button variant style correctness**
    - For any variant in (`primary`, `secondary`, `ghost`, `danger`, `outline`), verify the Button renders with the specified backgroundColor, text color, and border properties
    - **Validates: Requirement 3.1**

  - [ ]* 4.3 Write property test for Button — Property 8: size dimension correctness
    - **Property 8: Button size dimension correctness**
    - For any size in (`sm`, `md`, `lg`), verify the Button renders with the specified paddingHorizontal, paddingVertical, fontSize, and borderRadius
    - **Validates: Requirement 3.2**

- [x] 5. Create Card and Input components
  - [x] 5.1 Create `src/components/Card.js`
    - White background, borderRadius 14, 1px border `#ECEAE4`, `card` shadow preset
    - Render as `TouchableOpacity` with activeOpacity 0.8 when `onPress` is provided, otherwise `View`
    - Accept `children` and optional `style` override
    - Reference: `react-handoff/components/Card.jsx`
    - _Requirements: 4.1, 4.2_

  - [x] 5.2 Create `src/components/Input.js`
    - Render uppercase label (letter-spacing, 10px) above TextInput when `label` prop provided
    - Support `leftIcon` and `rightIcon` props rendering Icon component inside the input field
    - Support `onRightIconPress` callback on right icon tap
    - Show error text below input with error border when `error` prop is set
    - Forward all standard TextInput props
    - Reference: `react-handoff/components/Input.jsx`
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 6. Create score and product display components
  - [x] 6.1 Create `src/components/ScoreBadge.js`
    - Render circular badge with numeric score (0-100) and tier-based colors
    - Tier logic: ≥90 green (bg `#D9E8DD`, fg `#2D6B4F`), ≥80 blue (bg `#DCEAF4`, fg `#2C5F87`), ≥70 amber (bg `#F0E5D5`, fg `#8B6F3D`), <70 red (bg `#F4DDD4`, fg `#A8482E`)
    - Accept `score` (number) and `size` (default 44) props
    - Export `scoreTier()` helper function for reuse
    - Reference: `react-handoff/components/ScoreBadge.jsx`
    - _Requirements: 6.1, 6.2, 6.3_

  - [ ]* 6.2 Write property test for ScoreBadge — Property 9: tier color boundaries
    - **Property 9: ScoreBadge tier color boundaries**
    - For any integer score 0-100 and any positive size, verify `scoreTier(score)` returns the correct tier colors at boundaries (green ≥90, blue 80-89, amber 70-79, red 0-69)
    - **Validates: Requirements 6.1, 6.2, 6.3**

  - [x] 6.3 Create `src/components/NutriGradeBadge.js`
    - Render square badge with grade letter (A-E) and grade-specific colors
    - Color mapping: A→`#1E8449` white, B→`#7CB342` white, C→`#F4C430` dark, D→`#E89B3C` white, E→`#D14E36` white
    - Fall back to Grade C colors for invalid grades
    - Accept `grade` (string) and `size` (default 40) props
    - Export `getNutriGradeColor()` helper function for reuse
    - Reference: `react-handoff/components/NutriGradeBadge.jsx`
    - _Requirements: 7.1, 7.2, 7.3_

  - [ ]* 6.4 Write property test for NutriGradeBadge — Property 10: color correctness for valid grades
    - **Property 10: NutriGradeBadge color correctness for valid grades**
    - For any grade in (`A`, `B`, `C`, `D`, `E`), verify `getNutriGradeColor(grade)` returns the specified background and text color pair
    - **Validates: Requirements 7.1, 7.2**

  - [ ]* 6.5 Write property test for NutriGradeBadge — Property 11: invalid grade fallback
    - **Property 11: NutriGradeBadge invalid grade fallback**
    - For any string not in (`A`, `B`, `C`, `D`, `E`), verify the component falls back to Grade C colors
    - **Validates: Requirement 7.3**

  - [x] 6.6 Create `src/components/ProductCard.js`
    - Render horizontal row: 56x56 rounded image placeholder (LinearGradient or solid color), text column (name, brand, meta), optional badge on right
    - Render ScoreBadge when `score` prop provided, NutriGradeBadge when `grade` prop provided
    - Make tappable via `onPress` prop
    - Use Card component as wrapper
    - Reference: `react-handoff/components/ProductCard.jsx`
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

  - [x] 6.7 Create `src/components/Dropdown.js`
    - Display selected value with chevron-down icon
    - Expand to show options on tap, collapse on selection
    - Invoke `onChange` callback with selected value
    - Support `renderLeft` and `renderOption` custom renderers
    - Reference: `react-handoff/components/Dropdown.jsx`
    - _Requirements: 9.1, 9.2, 9.3_

- [x] 7. Checkpoint — Verify shared components
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Update navigation structure and custom tab bar
  - [x] 8.1 Create `src/components/CustomTabBar.js`
    - Render exactly 4 tabs: Home (icon `home`), Scan (icon `scan`), History (icon `clock`), Profile (icon `user`)
    - Active tab: color `#226342`, strokeWidth 2; inactive: color `#6B7268`, strokeWidth 1.7
    - Display text label below each icon using Inter medium font at 11px
    - Accept `state`, `descriptors`, `navigation` props from `@react-navigation/bottom-tabs`
    - Reference: `react-handoff/components/TabBar.jsx`
    - _Requirements: 10.1, 10.2, 10.3_

  - [ ]* 8.2 Write property test for CustomTabBar — Property 12: active/inactive state styling
    - **Property 12: CustomTabBar active/inactive state styling**
    - For any tab index in (0, 1, 2, 3), verify the active tab renders with color `#226342` and strokeWidth 2, while inactive tabs render with color `#6B7268` and strokeWidth 1.7
    - **Validates: Requirement 10.2**

  - [x] 8.3 Restructure `src/navigation/MainTabs.js` from 6 tabs to 4 tabs
    - Replace 6-tab layout (Dashboard, Scan, Polling, Suggestions, Referral, Profile) with 4-tab layout (Home, Scan, History, Profile)
    - HomeTab stack: DashboardHome → ProductDetail, LabReport, Discover, NutriGradeList, VoteScreen (Polling)
    - ScanTab stack: ScannerHome → ResultCard → ProductDetail, ScanHistory
    - HistoryTab: ScanHistoryScreen as root
    - ProfileTab stack: ProfileHome → Subscription, Referral
    - Use CustomTabBar component via `tabBar` prop instead of default tab bar
    - Update `stackScreenOptions` to use new theme tokens
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6_

- [x] 9. Restyle auth screens
  - [x] 9.1 Restyle `src/screens/OnboardingScreen.js`
    - Convert to match `react-handoff/screens/OnboardingScreen.jsx`
    - Add slide content with animated dot indicators (active: width 24 green-700, inactive: width 8 green-100)
    - Use green-50 background
    - Apply theme tokens for all colors, fonts, spacing
    - Preserve existing navigation logic
    - _Requirements: 12.1, 15.1, 15.2, 15.3_

  - [x] 9.2 Restyle `src/screens/LoginScreen.js`
    - Convert to match `react-handoff/screens/LoginScreen.jsx`
    - Add email/mobile tab switcher
    - Use Card-wrapped form fields with Input component (icon inputs)
    - Add social login buttons (Google, Apple) using outline Button variant
    - Add "Forgot password?" link inside card
    - Preserve all existing Firebase auth logic
    - _Requirements: 12.2, 12.5, 15.1, 15.2, 15.3_

  - [x] 9.3 Restyle `src/screens/RegisterScreen.js`
    - Convert to match `react-handoff/screens/SignupScreen.jsx`
    - Card-wrapped form with icon inputs (user, mail, phone, lock+eye)
    - Add terms/privacy text and logo card at top
    - Preserve existing registration logic
    - _Requirements: 12.3, 12.5, 15.1, 15.2, 15.3_

  - [x] 9.4 Restyle `src/screens/OTPScreen.js`
    - Convert to match `react-handoff/screens/OTPScreen.jsx`
    - Replace single TextInput with 6 individual digit input fields
    - Add mail icon in green circle, card-wrapped instruction text
    - Add resend timer
    - Preserve existing OTP verification logic
    - _Requirements: 12.4, 12.5, 15.1, 15.2, 15.3_

- [x] 10. Checkpoint — Verify auth flow
  - Ensure all tests pass, ask the user if questions arise.

- [x] 11. Restyle main screens
  - [x] 11.1 Restyle `src/screens/DashboardScreen.js` (HomeScreen)
    - Convert to match `react-handoff/screens/HomeScreen.jsx`
    - Add search bar card with scan-corners icon
    - Add "Latest Testing Reports" section with ProductCard list using FlatList
    - Add "Check Nutri-score" section with Dropdown grade filter and ProductCard list
    - Add avatar button linking to profile, greeting text
    - Use theme tokens for all styling
    - Preserve existing API calls and data fetching
    - _Requirements: 13.1, 13.7, 15.1, 15.2, 15.3, 15.4_

  - [x] 11.2 Restyle `src/screens/ScannerScreen.js`
    - Convert to match `react-handoff/screens/ScannerScreen.jsx`
    - Dark-themed viewfinder with green corner brackets (scan-corners icon or custom SVG)
    - Flash/gallery buttons, recent scan thumbnails, manual barcode entry link
    - Preserve existing expo-camera barcode scanning logic
    - _Requirements: 13.2, 13.7, 15.1, 15.2, 15.3, 16.3_

  - [x] 11.3 Restyle `src/screens/SubscriptionScreen.js` (PlansScreen)
    - Convert to match `react-handoff/screens/PlansScreen.jsx`
    - Star icon in green circle, 3 plan cards (Monthly/Yearly/Family) with radio selection
    - "Best value" badge on yearly plan, perks checklist with check icons
    - "Start Free Trial" CTA button using primary Button variant
    - Preserve existing Razorpay payment flow
    - _Requirements: 13.3, 13.7, 15.1, 15.2, 15.3, 16.2_

  - [x] 11.4 Restyle `src/screens/ReferralScreen.js`
    - Convert to match `react-handoff/screens/ReferralScreen.jsx`
    - Green gradient earnings banner with gift icon (use LinearGradient or solid fallback)
    - Referral code box with dashed border and copy button
    - 3-step "How it works" with numbered circles, recent activity list
    - Preserve existing referral logic
    - _Requirements: 13.4, 13.7, 15.1, 15.2, 15.3_

  - [x] 11.5 Restyle `src/screens/PollingScreen.js` (VoteScreen)
    - Convert to match `react-handoff/screens/VoteScreen.jsx`
    - Suggestion cards with vote/voted toggle buttons
    - "Suggest a category" input card, explanation card at top
    - Preserve existing polling/voting logic
    - _Requirements: 13.5, 13.7, 15.1, 15.2, 15.3_

  - [x] 11.6 Restyle `src/screens/ProfileScreen.js`
    - Convert to match `react-handoff/screens/ProfileScreen.jsx`
    - Avatar with gradient background, name/email/subscription badge
    - 3-column stats (Scans/Saved/Referrals)
    - Grouped menu sections (Account, Subscription, Support) with icons and chevrons
    - Sign-out option in red using danger text color
    - Preserve existing profile data fetching and auth logic
    - _Requirements: 13.6, 13.7, 15.1, 15.2, 15.3_

- [x] 12. Checkpoint — Verify main screens and navigation
  - Ensure all tests pass, ask the user if questions arise.

- [x] 13. Create new screens
  - [x] 13.1 Create `src/screens/ProductDetailScreen.js`
    - Build from `react-handoff/screens/ProductDetailScreen.jsx`
    - Gradient hero with product image placeholder (LinearGradient with solid fallback)
    - ScoreBadge (64px) with label
    - 3-column quick stats (Nutri/NOVA/Eco)
    - Collapsible info sections (Ingredients, Allergens, Certifications)
    - "View Full Lab Report" button navigating to LabReport with product ID
    - Accept `product` route param from navigation
    - _Requirements: 14.1, 14.5, 15.1, 15.2, 15.3, 16.6_

  - [x] 13.2 Create `src/screens/LabReportScreen.js`
    - Build from `react-handoff/screens/LabReportScreen.jsx`
    - Product summary card at top
    - Green gradient score banner with check icon (LinearGradient with solid fallback)
    - 3 test panels (Heavy Metals, Pesticide, Microbiological) with pass/fail rows
    - Certified lab partner card at bottom
    - Accept `productId` route param from navigation
    - _Requirements: 14.2, 15.1, 15.2, 15.3, 16.6_

  - [x] 13.3 Create `src/screens/DiscoverScreen.js`
    - Build from `react-handoff/screens/DiscoverScreen.jsx`
    - Search bar with Input component
    - Horizontal scrollable category pills (FlatList horizontal)
    - Product list with scores using FlatList and ProductCard
    - Filter icon in header
    - _Requirements: 14.3, 15.1, 15.2, 15.3, 15.4_

  - [x] 13.4 Create `src/screens/NutriGradeListScreen.js`
    - Build from `react-handoff/screens/NutriGradeListScreen.jsx`
    - 5-column grade pill selector (A-E) with NutriGradeBadge colors
    - Search bar with clear button using Input component
    - Category pills (horizontal FlatList)
    - Filtered product list with grade badges using FlatList and ProductCard
    - Result count text
    - _Requirements: 14.4, 15.1, 15.2, 15.3, 15.4_

- [x] 14. Final integration and cleanup
  - [x] 14.1 Wire new screens into navigation stacks
    - Add ProductDetailScreen, LabReportScreen, DiscoverScreen, NutriGradeListScreen to HomeTab stack in MainTabs.js
    - Add ProductDetailScreen to ScanTab stack
    - Verify all navigation routes match the design document's route mapping table
    - Verify navigation from ProductDetail → LabReport works with product ID param
    - _Requirements: 11.2, 11.3, 14.5_

  - [x] 14.2 Verify backward compatibility
    - Confirm all Firebase integrations (auth, analytics, crashlytics, messaging, remote config, firestore) still function
    - Confirm Razorpay payment flow still functions
    - Confirm barcode scanning (expo-camera) still functions
    - Confirm deep linking and notification handling still function
    - Confirm Inter fonts load correctly in App.js without new font dependencies
    - Confirm LinearGradient falls back to solid color when unavailable
    - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5, 16.6_

- [x] 15. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation after each major phase
- Property tests validate the 13 correctness properties defined in the design document using `fast-check` (already in devDependencies)
- Unit tests validate specific examples and edge cases
- All handoff JSX files in `react-handoff/` serve as the visual reference — convert Tailwind classes to `StyleSheet.create` using the theme object
- The `font-display` (Fraunces) references in the handoff are mapped to `Inter_700Bold` throughout
- Existing business logic (Firebase, auth, payments, scanning) must not be modified during restyling
