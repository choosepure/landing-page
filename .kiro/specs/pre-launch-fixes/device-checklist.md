# Pre-launch device verification checklist

Run on the internal-testing build (native build — NOT Expo Go; deep links and
torch need a real dev/preview build). Scheme: `choosepure://`. Android package:
`in.choosepure.app`.

Prereqs:
- Android: device/emulator connected (`adb devices` shows it).
- iOS: simulator booted (`xcrun simctl list devices | grep Booted`) or a real device via Xcode.

---

## Android

### #1 Safe areas / banners
- [ ] Header not clipped on a punch-hole + gesture-nav device (e.g. Pixel).
- [ ] Tall 20:9 budget Android: no clipping, banner spacing correct.
- [ ] Device with a bottom gesture bar: bottom layout unaffected (only top insets changed).
- [ ] No first-frame inset "jump" on cold launch (top-level SafeAreaProvider + initialWindowMetrics).
- [ ] **Double-gap check:** with the offline banner visible (toggle airplane mode) on a normal tab screen AND on the Scanner screen, confirm there is NOT a doubled top gap (banner inset + header inset). If doubled, apply the inset only when the banner is the topmost element.

### #5 Deep links / notification navigation
- [ ] Cold start (app killed): lands on Reset Password with token.
  ```
  adb shell am force-stop in.choosepure.app
  adb shell am start -a android.intent.action.VIEW -d "choosepure://user/reset-password?token=COLDSTART123" in.choosepure.app
  ```
- [ ] Cold start referral → Register prefilled:
  ```
  adb shell am force-stop in.choosepure.app
  adb shell am start -a android.intent.action.VIEW -d "choosepure://purity-wall?ref=CP-ABCDE" in.choosepure.app
  ```
- [ ] Warm (app already open): navigates immediately.
  ```
  adb shell am start -a android.intent.action.VIEW -d "choosepure://user/reset-password?token=WARM456" in.choosepure.app
  ```
- [ ] Malformed (missing token): opens normally, stays on default screen, no crash.
  ```
  adb shell am start -a android.intent.action.VIEW -d "choosepure://user/reset-password" in.choosepure.app
  ```
- [ ] **FCM report notification (cold start):** send a data push `{ "type": "report", "targetId": "<real-report-id>" }`, kill the app, tap the notification → cold-starts and lands on the report (ReportDetail). (Reports have no URL deep link; this is the only way to test the notification path.)
- [ ] **FCM report notification, missing id:** send `{ "type": "report" }` (no targetId) → opens ReportDetail and shows the "Report not found" fallback (#4), no crash.

### #7 Scanner flash (needs real hardware — torch)
- [ ] Open Scanner, tap the flash button → torch turns ON, icon turns green/active.
- [ ] Tap again → torch turns OFF, icon returns to default.
- [ ] Navigate away from Scanner with torch on → torch turns OFF automatically.
- [ ] Gallery button is GONE (only the flash button remains).
- [ ] On a device without a torch (rare) → no crash when tapping flash.

### #8 Apple button
- [ ] Login screen shows Google + email + phone; NO "Continue with Apple" button (Apple button is iOS-only anyway, but confirm it's gone there).

### #16 Scan-history isolation
- [ ] Log in as user A, scan a couple of products (History shows them).
- [ ] Log out. Log in as user B → History is EMPTY (A's scans not visible).
- [ ] (401 path) If A's token expires and B logs in, B still sees empty history.

### Account deletion
- [ ] In-app: Profile → Request account deletion → confirm dialog shows the 24-hour notice → on confirm, user is signed out.
- [ ] Web flow: open `https://choosepure.in/delete-account`, submit the account email → receive confirmation email → open the link → a page with a "Confirm account deletion" BUTTON appears (nothing deleted yet) → tap the button → success message; a pending request is created (deleted within 24h / by admin).
- [ ] Web flow, unknown email: submitting a non-existent email shows the SAME "if an account exists…" message (no enumeration) and sends no email.

---

## iOS

### #1 Safe areas / banners
- [ ] iPhone 15/16 Pro (Dynamic Island): header not clipped; push banner + offline banner clear the Dynamic Island.
- [ ] iPhone 13/14 (notch): banners sit below the notch.
- [ ] iPhone SE (no notch): banners use the ~24px minimum, no oversized gap.
- [ ] No first-frame inset jump on cold launch.
- [ ] **Double-gap check:** offline banner on a normal screen AND on Scanner — no doubled top gap.

### #5 Deep links / notification navigation
- [ ] Cold start (app terminated): lands on Reset Password with token.
  ```
  xcrun simctl terminate booted in.choosepure.app
  xcrun simctl openurl booted "choosepure://user/reset-password?token=COLDSTART123"
  ```
- [ ] Cold start referral → Register prefilled:
  ```
  xcrun simctl terminate booted in.choosepure.app
  xcrun simctl openurl booted "choosepure://purity-wall?ref=CP-ABCDE"
  ```
- [ ] Warm (app open): navigates immediately.
  ```
  xcrun simctl openurl booted "choosepure://user/reset-password?token=WARM456"
  ```
- [ ] Malformed (missing token): opens normally, stays on default screen, no crash.
  ```
  xcrun simctl openurl booted "choosepure://user/reset-password"
  ```
- [ ] FCM report notification cold start + missing-id fallback (same as Android; needs a real device for push).

### #7 Scanner flash (needs a real iPhone — torch)
- [ ] Flash button toggles torch on/off; icon reflects state.
- [ ] Leaving Scanner turns the torch off.
- [ ] Gallery button is gone.

### #8 Apple button
- [ ] Login screen: Google + email + phone only; NO "Continue with Apple".

### #16 Scan-history isolation
- [ ] A logs in + scans → History populated; log out; B logs in → History empty.

### Account deletion
- [ ] In-app request → signed out with 24h notice.
- [ ] Web flow confirm-button path works (same as Android).

### Meta disabled on iOS (privacy / C2)
- [ ] With a network proxy (e.g. Charles/Proxyman), confirm the iOS app makes NO requests to Facebook/Meta endpoints (`graph.facebook.com`) and does not POST to `/api/analytics/events` for Meta. Firebase + Mixpanel analytics may still fire. (On Android, Meta IS expected to fire — disclosed in Play Data Safety.)
