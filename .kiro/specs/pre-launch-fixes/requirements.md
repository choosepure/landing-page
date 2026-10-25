# Pre-Launch Fixes — Requirements

Scope: a focused set of pre-launch bug fixes and one store-compliance gap for the ChoosePure React Native / Expo app (`mobile-app/`), derived from the platform audit. Only the items below are in scope.

Audit note: original finding #1 was re-verified and **downgraded** — `useSafeAreaInsets()` already returns real insets inside screens because React Navigation's stack/tab views wrap content in `SafeAreaProviderCompat`. The residual issue is only the missing top-level `SafeAreaProvider` (first-frame flicker + components rendered outside the navigators). Finding #17 (stale `cancelled`) and others remain as audited but are **out of scope** for this spec.

## In scope

| Ref | Title |
|-----|-------|
| #1  | Install a top-level `SafeAreaProvider` (first-paint + out-of-navigator components) |
| #4  | Guard `route.params` destructuring against missing params (crash via deep link / notification) |
| #5  | Gate deep-link / notification navigation on navigation readiness |
| #7  | Fix or remove the dead Flash & Gallery buttons in the scanner |
| #8  | Remove the non-functional "Continue with Apple" button (defer real Apple auth) |
| #16 | Make scan history per-user (clear/namespace on logout) — privacy on shared devices |
| C2  | Add iOS `PrivacyInfo.xcprivacy` / `ios.privacyManifests` for Firebase / Mixpanel / Meta + required-reason APIs |
| C4  | Verify Android 16 KB page-size alignment (verification only — no code fix) |

## Requirements

### Requirement 1 — Top-level safe-area provider (#1)
**User story:** As a user on a notched iPhone or Android device, I want headers, banners, and the first app frame to respect the safe area so content is never clipped by the notch or status bar.

#### Acceptance Criteria
1. WHEN the app launches, THE app SHALL render its tree inside a `SafeAreaProvider` seeded with `initialWindowMetrics` so the first frame uses correct insets.
2. WHEN `OfflineBanner` or `NotificationBanner` is shown, THE banner SHALL respect the top safe-area inset rather than a hardcoded status-bar padding.
3. The change SHALL NOT regress existing `useSafeAreaInsets()` consumers (`DashboardScreen`, `LoginScreen`).

### Requirement 2 — Guard route params (#4)
**User story:** As a user tapping a deep link or push notification, I don't want the app to crash if the target screen is opened without expected params.

#### Acceptance Criteria
1. WHEN `OTPScreen`, `ResultCardScreen`, or `ReportDetailScreen` is rendered with `route.params` undefined or missing required keys, THE screen SHALL NOT throw.
2. WHEN a required param is missing, THE screen SHALL render a safe fallback (error/empty state) or navigate back, not a white screen.
3. A unit test SHALL assert that reading params with the guard helper returns safe defaults for undefined `route.params`.

### Requirement 3 — Gate navigation on readiness (#5)
**User story:** As a user opening the app from a notification or deep link on a cold start, I want to reliably land on the correct screen.

#### Acceptance Criteria
1. WHEN a deep link or initial/opened notification resolves a navigation target before the navigation container is ready, THE app SHALL defer the navigation until `navigationRef.isReady()` is true.
2. WHEN navigation is already ready, THE target SHALL be navigated to immediately.
3. A Maestro flow SHALL launch the app via a deep link and assert the correct screen appears.

### Requirement 4 — Scanner Flash & Gallery buttons (#7)
**User story:** As a user on the scanner, I don't want to see buttons that do nothing.

#### Acceptance Criteria
1. The Flash and Gallery controls SHALL either perform their action (torch toggle / image picker) or be removed.
2. IF implemented, torch toggle SHALL be guarded for platform/hardware availability.
3. A Maestro flow SHALL open the scanner and assert the buttons behave (toggle state or are absent).

### Requirement 5 — Remove Apple button (#8)
**User story:** As a user, I don't want a sign-in option that doesn't work.

#### Acceptance Criteria
1. The "Continue with Apple" button SHALL be removed from `LoginScreen` until real Apple authentication is implemented.
2. Removal SHALL NOT affect Google sign-in or email/phone flows.
3. Note recorded: Apple Guideline 4.8 may require Sign in with Apple while Google sign-in is offered; real Apple auth is tracked separately (out of scope here).

### Requirement 6 — Per-user scan history (#16)
**User story:** As someone sharing a device, I don't want the next user to see my scan history after I log out.

#### Acceptance Criteria
1. WHEN a user logs out, THE app SHALL clear locally stored scan history (or namespace it per user id so another account cannot read it).
2. WHEN a different user logs in, THEY SHALL NOT see the previous user's scans.
3. A unit test SHALL assert that logout clears scan history (or that reads are namespaced per user).

### Requirement 7 — iOS privacy manifest (C2)
**User story:** As the publisher, I need the iOS build to include a privacy manifest so Apple accepts the submission.

#### Acceptance Criteria
1. THE app SHALL declare `ios.privacyManifests` in `app.json` with `NSPrivacyAccessedAPITypes` covering the required-reason APIs the app/SDKs use (UserDefaults, file timestamps, etc.) with valid reason codes.
2. THE manifest SHALL declare collected data types consistent with the App Privacy questionnaire (analytics identifiers, email, phone).
3. Verification SHALL confirm Firebase pods ship their own bundled manifests (no action if present).

### Requirement 8 — Android 16 KB verification (C4)
**User story:** As the publisher, I need to confirm the Android build meets Google Play's 16 KB page-size requirement.

#### Acceptance Criteria
1. A production `.aab`/`.apk` SHALL be inspected to confirm all `lib/*/*.so` are 16 KB-aligned.
2. IF any native library fails alignment, THE failing dependency SHALL be documented with an upgrade/replacement recommendation.
3. This requirement is verification-only; no app code change is expected unless a failure is found.
