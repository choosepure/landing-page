---
inclusion: fileMatch
fileMatchPattern: 'mobile-app/**'
---

# Mobile Quality Standards (ChoosePure App)

Applies to the React Native / Expo app in `mobile-app/` (Android + iOS). Follow these when adding or changing any screen, component, or native integration.

## Stack (keep in sync with `mobile-app/package.json` and `app.json`)

- **Expo SDK 53** · React Native 0.79.6 · React 19 · Node ≥ 20.19.4
- **Auth:** Firebase Auth (`@react-native-firebase/auth` v24) — email/password, phone OTP, Google Sign-In (`@react-native-google-signin/google-signin`). JWT from backend stored in AsyncStorage (`jwt_token`).
- **Firebase (v24):** app, analytics, crashlytics, messaging (push), firestore, remote-config
- **Navigation:** `@react-navigation` v7 (native + stack + bottom-tabs)
- **Networking:** `axios` via `src/api/client.js` (base `https://api.choosepure.in`, Bearer token interceptor, 401 → auth reset)
- **Key libs:** `expo-camera` (label scanning), `expo-image-picker`, `react-native-safe-area-context`, `react-native-screens`, `react-native-svg`, `@react-native-community/netinfo` (offline), `react-native-razorpay` (payments), `mixpanel-react-native`
- **Bundle ID / package:** `in.choosepure.app` (both platforms)
- **Testing:** Jest (`preset: react-native`) + `@testing-library/react-native` + `fast-check`. Run `npm test` from `mobile-app/`.

## Platform rules (non-negotiable)

- **Android back button:** every screen/modal that can be dismissed must handle hardware back (`BackHandler` or navigation default). Never leave a flow where back exits the app unexpectedly or traps the user.
- **iOS safe areas / notch:** use `react-native-safe-area-context` (`SafeAreaView` / `useSafeAreaInsets`). Never hardcode top/bottom padding for status bar, notch, or home indicator.
- **Keyboard avoidance:** any screen with text input uses `KeyboardAvoidingView` (`behavior="padding"` iOS / `"height"` Android) and `keyboardShouldPersistTaps="handled"` on scroll views.
- **Runtime permissions:** always request at point of use with rationale, and handle denial gracefully (fallback UI + link to Settings). Camera is required for label scanning — never assume it's granted.
- **Low-end Android (2–3 GB RAM, common in India):** avoid heavy re-renders and large in-memory images; use `FlatList` (not `.map` in ScrollView) for lists with `keyExtractor` + stable keys; compress/resize images from the picker; avoid unnecessary animations/large bundles. Test on a low-RAM profile.

## Required screen states

Every screen that loads or submits data must explicitly handle all four:

1. **Loading** — spinner/skeleton while fetching; never a blank screen.
2. **Empty** — clear message + next action when there's no data.
3. **Error** — user-friendly message + retry; never show raw errors or a frozen screen.
4. **Offline** — detect via `@react-native-community/netinfo`; show an offline banner/state and recover when connectivity returns.

## Platform-specific APIs

- Never call a platform-only API (e.g. `Linking.openSettings`, iOS/Android-only props, native modules) without a `Platform.OS` check or a cross-platform fallback.
- Prefer `Platform.select({ ios, android })` over scattered `if (Platform.OS === ...)` where it reads cleaner.

## Testing

- **Every bug fix must include a test that fails before the fix and passes after.** Add it with the fix in the same change; reference the bug in the test name.
- Add tests for new features (happy path + at least one edge/error case). Use `@testing-library/react-native`; `fast-check` for property-based logic (scoring, validation, parsing).
- Keep tests runnable with `npm test` from `mobile-app/`.
