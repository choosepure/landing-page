# Pre-Launch Fixes — Design

Targeted fixes in `mobile-app/`. Each is small and isolated. Testing follows the `mobile-quality` steering rule: a failing-first test where testable (unit for #4/#16, Maestro for #5/#7), and a manual device checklist for the layout-only fix (#1).

## #1 — Top-level SafeAreaProvider
- **Change:** In `App.js`, import `SafeAreaProvider` and `initialWindowMetrics` from `react-native-safe-area-context`; wrap the app (around `AuthProvider` / `NavigationContainer`, and crucially outside it so `NotificationBanner` is covered) in `<SafeAreaProvider initialMetrics={initialWindowMetrics}>`.
- **Banners:** `NotificationBanner` and `OfflineBanner` use `useSafeAreaInsets().top` instead of the hardcoded `STATUS_BAR_PADDING`.
- **Why safe:** React Navigation already nests its own compat provider; a top-level provider is the documented pattern and simply supplies correct initial insets (no double-provider problem — the compat checks context first).
- **Testing:** layout-only → manual device checklist (no unit test). Devices: iPhone with Dynamic Island (15/16 Pro), notched iPhone (13/14), small iPhone SE; Android with punch-hole + gesture nav (Pixel), tall 20:9 budget device, and a device with a bottom gesture bar. Verify: header not clipped, no first-frame jump, banners clear the status bar/notch.

## #4 — Guard route.params
- **New helper:** `src/utils/routeParams.js` → `getParams(route, defaults = {})` returning `{ ...defaults, ...(route?.params || {}) }`; plus a `requireParam(route, key)` that returns `undefined` safely.
- **Apply in:** `OTPScreen` (`phoneNumber`), `ResultCardScreen` (`barcode`, `product`), `ReportDetailScreen` (`reportId`). When a required value is missing, render the screen's existing error/empty state (or `navigation.goBack()`), never crash.
- **Testing:** unit test `src/utils/__tests__/routeParams.test.js` — **failing first** (helper doesn't exist). Covers: `route.params` undefined → defaults; partial params → merged; present params → passthrough.

## #5 — Gate navigation on readiness
- **Change:** Add a small pending-target queue in `App.js`. Deep-link (`useDeepLink`) and notification handlers push a target; a `navigateWhenReady(target)` helper checks `navigationRef.current?.isReady()` and either navigates now or stores it; `onNavigationReady` flushes the queue. `useDeepLink` accepts a ready check or the same helper.
- **Testing:** Maestro flow `.maestro/deeplink-cold-start.yaml` — launch app with a `choosepure://` deep link from a cold start, assert the target screen renders. (Setup note: Maestro is not yet installed; task includes adding a `.maestro/` dir and documenting `maestro test` usage. The flow is written to fail until the readiness gate exists.)

## #7 — Scanner Flash & Gallery buttons
- **Decision:** Implement, not remove (both are expected scanner affordances).
  - Flash: `CameraView` `enableTorch` state toggled by the flash button; only render when `facing === 'back'`.
  - Gallery: `expo-image-picker` (already a dep) to pick an image — but barcode-from-image isn't supported by `expo-camera`, so Gallery will route to the existing manual-entry / label-scan flow rather than pretend to scan. If that's undesirable, fall back to **removing** both.
- **Testing:** Maestro flow `.maestro/scanner-controls.yaml` — open scanner, tap flash (assert no crash / state toggles), tap gallery (assert picker or route). Fails until `onPress` handlers exist.

## #8 — Remove Apple button
- **Change:** Delete the `Platform.OS === 'ios'` "Continue with Apple" block in `LoginScreen.js` (and the now-unused `socialSpacer` if orphaned).
- **Testing:** code review + existing login still renders; no new test required (pure removal). A light RTL render test may assert the button text is absent.

## #16 — Per-user scan history
- **Change:** Namespace the AsyncStorage key by user id (`scan_history:<userId>`), OR clear `scan_history` inside `AuthContext.logout()`. Chosen approach: **clear on logout** (simplest, matches existing global reads) and additionally clear on login as a different user. `scanHistory.js` gets an exported `clearScanHistory()` (already exists) called from `logout()`.
- **Testing:** unit test `src/utils/__tests__/scanHistory.logout.test.js` (or extend AuthContext test) — **failing first**: assert that after `logout()`, `getScanHistory()` returns `[]`. Since `logout` has many side effects, the test targets the scan-history clearing unit directly (mock AsyncStorage).

## C2 — iOS privacy manifest
- **Change:** Add `ios.privacyManifests` to `app.json`:
  - `NSPrivacyAccessedAPITypes`: UserDefaults (`CA92.1`), File timestamp (`C617.1`), System boot time (`35F9.1`) and Disk space (`E174.1`) if used by deps.
  - `NSPrivacyCollectedDataTypes`: analytics identifiers, email address, phone number (linked to identity, used for analytics/app-functionality) to match the App Privacy answers.
  - `NSPrivacyTracking`: set per actual tracking (Meta pixel = tracking true likely).
- **Testing:** verification — prebuild and confirm `PrivacyInfo.xcprivacy` is generated in the iOS project; confirm Firebase pods include their own manifests. No unit test.

## C4 — Android 16 KB verification (no code change)
- **Action:** On a production build, extract the `.aab`, and for each `lib/arm64-v8a/*.so` run an alignment check (`check-elf-alignment.sh` from Android, or `objdump -p | grep LOAD` for `align 2**14`). Document any lib not 16 KB-aligned (suspect: `react-native-razorpay`).
- **Testing:** verification only; produce a short findings note.
