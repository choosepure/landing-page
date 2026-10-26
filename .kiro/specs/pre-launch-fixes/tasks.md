# Pre-Launch Fixes — Tasks

Work one task at a time and STOP after each for review. Follow the `mobile-quality` steering rule: write the failing test first where testable, then make it pass. Run `npm test` from `mobile-app/` for unit tests.

Verification approach (updated): #5 and #7 use **manual verification** (adb / simctl) and are launch-blocking; Maestro is a separate, non-blocking setup task at the end.

- [ ] 1. (#4) Guard `route.params` destructuring
  - Write failing unit test `src/utils/__tests__/routeParams.test.js`: `getParams(route, defaults)` returns defaults when `route.params` is undefined, merges when partial, passes through when present.
  - Create `src/utils/routeParams.js` with `getParams` / `requireParam`.
  - Apply in `OTPScreen.js`, `ResultCardScreen.js`, `ReportDetailScreen.js`; render existing error/empty state (or goBack) when a required param is missing.
  - Run `npm test` → green. STOP for review.
  - _Requirements: 2_

- [ ] 2. (#16) Per-user scan history cleared on logout
  - Write failing unit test `src/utils/__tests__/scanHistory.logout.test.js`: after the logout clear path runs, `getScanHistory()` resolves to `[]` (mock AsyncStorage).
  - Call `clearScanHistory()` inside `AuthContext.logout()` (and on login-as-different-user if feasible).
  - Run `npm test` → green. STOP for review.
  - _Requirements: 6_

- [ ] 3. (#17) ResultCardScreen stale cancel flag
  - Write failing unit test `src/utils/__tests__/cancelFlag.test.js` (or a focused test) proving the current pattern: when the cancel flag is passed **by value** to an async helper and flipped after an await, the helper still sees the stale value. Extract a tiny helper (e.g. a `makeCancelToken()` returning `{ cancelled: false }` object or a ref) so cancellation is read **live**, and the test asserts the helper reports cancelled after the token is flipped mid-flight.
  - Refactor `ResultCardScreen.js` to share one live cancel token across `init()` and `crossReferenceReport()` (pass the token object/ref, not the boolean), so no `setState` runs after unmount.
  - Run `npm test` → green. STOP for review.
  - _Requirements: 2 (crash/stale-state hardening)_

- [ ] 4. (#8) Remove the non-functional "Continue with Apple" button
  - Remove the iOS Apple button block in `LoginScreen.js` and any orphaned styles.
  - Optional RTL render test asserting the button text is absent; verify Google/email/phone unaffected.
  - STOP for review.
  - _Requirements: 5_

- [ ] 5. (#1) Top-level SafeAreaProvider + banner insets
  - Wrap `App.js` tree in `<SafeAreaProvider initialMetrics={initialWindowMetrics}>`.
  - Replace hardcoded `STATUS_BAR_PADDING` in `NotificationBanner.js` (and `OfflineBanner` top inset) with `useSafeAreaInsets().top`.
  - Layout-only → MANUAL device checklist (no unit test): iPhone 15/16 Pro (Dynamic Island), iPhone 13/14 (notch), iPhone SE (small), Pixel (punch-hole + gesture nav), a tall 20:9 budget Android, and one device with a bottom gesture bar. Verify header not clipped, no first-frame inset jump, banners clear the notch/status bar.
  - STOP for review.
  - _Requirements: 1_

- [ ] 6. (#5) Gate deep-link / notification navigation on readiness
  - Add a pending-target queue + `navigateWhenReady()` in `App.js`; flush in `onNavigationReady`; update `useDeepLink` and notification handlers to use it.
  - MANUAL verification (from a fully killed app):
    - Android: `adb shell am start -W -a android.intent.action.VIEW -d "choosepure://user/reset-password?token=TEST123" in.choosepure.app` → app cold-starts and lands on ResetPassword.
    - Android referral: `adb shell am start -a android.intent.action.VIEW -d "choosepure://purity-wall?ref=CP-ABCDE" in.choosepure.app` → Register prefilled with referral.
    - iOS simulator: `xcrun simctl openurl booted "choosepure://user/reset-password?token=TEST123"` (app killed) → lands on ResetPassword.
    - Repeat each with the app already open (warm) to confirm both paths.
  - STOP for review.
  - _Requirements: 3_

- [ ] 7. (#7) Scanner flash toggle (gallery removed)
  - Implement torch toggle: `enableTorch` state on `CameraView`, toggled by the flash button; render only when `facing === 'back'`; guard for availability.
  - REMOVE the Gallery button for launch (expo-camera can't scan a barcode from a gallery image; a dead/placeholder button is worse than none).
  - MANUAL verification: open scanner on a physical device (torch needs real hardware) → tap flash, confirm torch turns on/off and icon reflects state; confirm no Gallery button remains; confirm no crash on a device without a torch.
  - STOP for review.
  - _Requirements: 4_

- [x] 8. (C1) Verify backend account deletion + Google Play web deletion URL — **DONE** (commit a8501f3 + web flow). Shared `performAccountDeletion` helper: immediate Razorpay cancel (hard-failure aborts + alerts + retries, max 3), Firebase `auth().deleteUser` (user-not-found = success; other errors abort), cascade delete (rewards/referrals/vote_transactions/label_scans), anonymise-and-retain feedback + payment records (subscription_transactions, payment_attempts). Hourly auto-job (Render only, query-based catch-up). Token invalidation is automatic (authenticateUser 401s once the user doc is gone — no deny-list needed). Web deletion URL live: **https://choosepure.in/delete-account** (email → signed-token confirmation link → confirm-button POST creates the pending request; no enumeration; rate-limited). Privacy/refund policy updated (commit 34c95cd).
  - Verify (code read, done in design): `DELETE /api/admin/deletion-requests/:id/account` actually deletes the user (`usersCollection.deleteOne`) and cascades to subscription_transactions, payment_attempts, rewards, referrals, vote_transactions, label_scans. Confirm no residual PII remains in other collections (feedback stores name/email with `userId` — decide delete vs anonymize).
  - Document the gap: user endpoint only creates a `pending` request; deletion is admin-mediated within 24 hrs (acceptable for Apple 5.1.1(v); acceptable for Google Play if disclosed).
  - **Additional checks (verification only, no code change yet):**
    - (a) **Timeframe disclosure** — check the app: does ProfileScreen's deletion flow actually tell the user the deletion will happen within 24 hrs (or whatever SLA), or does it just say "request submitted"? Note the exact copy and whether it matches store-listing claims.
    - (b) **Subscription cancellation** — does `DELETE /api/admin/deletion-requests/:id/account` cancel any active Razorpay subscription for that user before/while deleting? Check for a `razorpay.subscriptions.cancel(...)` call (or equivalent) in the deletion path. If missing, a deleted user could keep getting charged — flag as a required fix.
    - (c) **Token invalidation** — after deletion, is the user's JWT invalidated/unusable? Determine how tokens are validated (stateless JWT vs server-side session/allowlist). If stateless with no deny-list, the existing token stays valid until expiry even though the account is gone — document the window and whether a deny-list or short expiry is needed.
  - **Proposal (document only, do NOT implement in this task):** add an **automatic deletion job** that processes `deletion_requests` with `status: 'pending'` older than 24 hrs — runs the same cascade delete + subscription cancel + token invalidation, flips status to `completed`, and logs the result. Keep the existing admin "Delete account" button as a **manual override** for immediate deletion. Run as a scheduled job (cron / setInterval on the server / external scheduler); design it idempotent and safe to re-run. Record this in design.md as a follow-up task to be approved separately.
  - Google Play requirement: provide a **web-based deletion URL** (reachable without installing the app) in the Play Console Data Safety form. Action: add a public page/endpoint (e.g. `https://choosepure.in/delete-account`) that lets a user submit email → creates the same `pending` request, and document it. (Backend/website task — note here, implement under website work if approved.)
  - STOP for review.
  - _Requirements: 7 (compliance)_

- [ ] 9. (C2) Document required-reason APIs & tracking domains, THEN write the iOS privacy manifest
  - FIRST produce the inventory (in design.md, below) of required-reason APIs and tracking domains per dependency:
    - **AsyncStorage** (`@react-native-async-storage/async-storage`) → UserDefaults API → reason `CA92.1` (access info from same app only). Not tracking.
    - **Firebase** (`@react-native-firebase/*` v24: app, analytics, crashlytics, messaging, firestore, remote-config) → UserDefaults `CA92.1`; System boot time `35F9.1`; Disk space `E174.1`; File timestamp `C617.1`. Firebase pods ship their own `PrivacyInfo.xcprivacy` — verify, don't duplicate. Analytics collects device/usage + identifiers.
    - **Mixpanel** (`mixpanel-react-native`) → UserDefaults `CA92.1`; System boot time `35F9.1`. Collects product-interaction/analytics + device id. Tracking domain: `api.mixpanel.com` / `api-js.mixpanel.com`.
    - **Meta** (custom pixel via `src/services/analytics/meta.js`, HTTP to Graph API — no FB SDK) → confirm which domains are hit; likely `graph.facebook.com`. If used for cross-app tracking, list under `NSPrivacyTracking: true` + `NSPrivacyTrackingDomains`.
    - **expo-file-system / expo-image-picker / expo-clipboard** → file timestamp `C617.1`, disk space `E174.1` if used.
  - THEN add `ios.privacyManifests` to `app.json`: `NSPrivacyAccessedAPITypes` with the reason codes above; `NSPrivacyCollectedDataTypes` (email, phone, device id, product interaction) matching the App Privacy answers; `NSPrivacyTracking`/`NSPrivacyTrackingDomains` per Meta/Mixpanel reality.
  - Verify prebuild generates app-level `PrivacyInfo.xcprivacy`.
  - STOP for review.
  - _Requirements: 7_

- [ ] 10. (C4) Verify Android 16 KB page-size alignment (verification only)
  - On a production `.aab`, check `lib/*/*.so` for 16 KB alignment; document failures (suspect `react-native-razorpay`) with upgrade/replace advice. No code change unless a failure is found.
  - STOP for review.
  - _Requirements: 8_

- [ ] 11. (Non-blocking) Set up Maestro E2E
  - Add Maestro (`.maestro/` dir, install docs) and author flows for the deep-link cold start (#5) and scanner controls (#7) so these become automated regressions.
  - NOT a launch blocker — do after the above. STOP for review.
  - _Requirements: 3, 4 (automation follow-up)_

- [ ] 12. (OTA) Enable EAS Update in the next store build
  - Currently NOT OTA-ready: `expo-updates` is not installed (absent from `package.json` and `node_modules/`), `app.json` has no `updates` block and no `runtimeVersion`, and `eas.json` has no `channel`. The live build (2.2.1 / vc43) therefore cannot receive OTA updates.
  - Install the module (SDK 53-matched): `npx expo install expo-updates`.
  - Configure `app.json` → `expo`:
    - `"updates": { "url": "https://u.expo.dev/f735d7c1-0935-46b3-ac19-5b0c945db8db" }` (uses the existing EAS projectId).
    - `"runtimeVersion": { "policy": "fingerprint" }` — fingerprint policy so the runtime version is derived from the native fingerprint; an OTA update only lands on binaries with a matching native fingerprint, preventing JS-native mismatches after native changes.
  - Add a `production` channel in `eas.json` so production builds subscribe to that update track, e.g. `"production": { "autoIncrement": true, "channel": "production" }` (add `preview`/`development` channels if staged OTA is wanted).
  - Alternatively run `eas update:configure` to apply the above and validate the project.
  - IMPORTANT: OTA ships JS/asset changes only and takes effect only in a NEW store build that embeds `expo-updates` with the fingerprint runtimeVersion. Native changes still require a full rebuild. After the new build ships, publish with `eas update --branch production --message "..."`.
  - Verify prebuild/build embeds the update config and that `runtimeVersion` resolves consistently between the binary and published updates.
  - STOP for review.
  - _Requirements: 7 (release/ops) — do not implement yet_

## Post-launch backlog (not launch blockers)

These came out of the referral/sharing and privacy review. Track separately; none block the store submission.

- [ ] **Play Install Referrer for referral attribution.** Today the referral link (`https://choosepure.in/purity-wall?ref=CP-XXXXX`) opens the website, which reads `?ref=` for web sign-up. If the invitee instead installs the Android app and signs up there, referral credit is LOST (no deferred deep link / install attribution). Integrate Google Play Install Referrer API so the `ref` survives install→first-launch and is applied to app sign-up. (iOS equivalent is harder — consider a "enter referral code" field as a fallback.)
- [ ] **Referral link in report PDF footer.** Reports are shared as a downloaded PDF (`/api/reports/:id/pdf`) with no link back. Add the user's referral link (or a plain app link) to the PDF footer so shared reports drive referrals/installs.
- [ ] **App Links / Universal Links for report sharing.** There is no `https://` deep link that opens a report in the app, and no verified App Links (Android `assetlinks.json`) / Universal Links (iOS `apple-app-site-association` + `associatedDomains`). Add these so report/referral `https://choosepure.in/...` links open the installed app instead of the website.
- [ ] **iOS ATT + Meta (only if running iOS Meta ad campaigns).** Meta analytics is disabled on iOS (no ATT prompt). If iOS Meta campaigns are ever needed, add `expo-tracking-transparency`, show the ATT prompt, re-enable the Meta adapter on iOS, and flip `NSPrivacyTracking` to true with `graph.facebook.com` (or the backend forwarding domain) listed in `NSPrivacyTrackingDomains`.

## Legal review before launch (not code — needs legal sign-off)

- [ ] **(1) Children's age threshold (DPDP vs COPPA).** privacy-policy.html §9 currently says "under 13" (COPPA framing). India's DPDP Act treats **under-18** as children requiring verifiable parental consent. Since the audience is India-focused, legal must decide 13 vs 18. If 18: we also need a parental-consent mechanism, which is a product change, not just a copy edit. Left as "under 13" pending this review.
- [ ] **(2) Cross-border data storage disclosure.** Personal data is processed/stored outside India; the policy should disclose where and the basis for transfer. Known infrastructure regions:
    - **Render (backend `choosepure-landing`): Singapore** (`render.yaml` → `region: singapore`). The Node server + request processing run here.
    - **MongoDB Atlas: region UNCONFIRMED from code.** The SRV host is `<cluster>.1bcpf42.mongodb.net`; the Atlas region is NOT encoded in the hostname and must be confirmed in the Atlas dashboard (Project → Cluster → Configuration). Likely Singapore/Mumbai — VERIFY before writing the disclosure.
    - **Third-party processors** (also cross-border): Firebase/Google, Mixpanel (US), Mailgun (US/EU), Meta (US), Razorpay (India). Each stores data under its own region/policy.
    - Action: once Atlas region is confirmed, add a "Where your data is stored / international transfers" clause to privacy-policy.html naming the regions and the transfer basis. If any India-resident data-localisation requirement applies (e.g. payment data under RBI rules — Razorpay handles this), confirm compliance with legal.
