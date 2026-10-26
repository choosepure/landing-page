# Store Privacy Disclosures — ChoosePure

Derived from the mobile app code (not assumptions). Use these to fill the store
privacy forms. iOS App Privacy (App Store Connect) should match the
`ios.privacyManifests` block in `mobile-app/app.json`.

## Where each data type comes from (code evidence)

- **Email, Name, Phone** — collected at register / Firebase auth and sent to the
  backend (`/api/user/firebase-auth`, `/api/user/profile`); email+name also sent
  to Mixpanel via `identify()` (product analytics).
- **User ID** — backend `_id` used as the analytics identifier (Firebase + Mixpanel).
- **Photos (label images)** — `LabelScannerScreen` uploads captured/selected
  photos as multipart `FormData` to `/api/v1/scans`.
- **Purchase history** — subscription/vote payments via Razorpay; the backend
  stores payment records (`/api/subscription/*`, payment_attempts). The app does
  not store card data (handled by Razorpay).
- **Product interaction / usage + screen views** — Firebase Analytics + Mixpanel.
- **Crash data** — Firebase Crashlytics.
- **Device push token** — `/api/user/fcm-token` (app functionality, not advertising).

## Platform difference (important)

- **Meta (Facebook) ad measurement is ANDROID-ONLY.** The Meta adapter forwards
  events (via our backend Conversions API) to Facebook for ad measurement. It is
  DISABLED on iOS (no ATT prompt shipped). So "Data shared with third parties for
  advertising" applies to the **Android** build only.
- iOS: `NSPrivacyTracking = false`, no tracking domains. Mixpanel/Firebase are
  first-party product analytics (no IDFA, no Google Ads linking — verified:
  no `google-mobile-ads` plugin, no AdMob, Mixpanel not configured with IDFA).

---

## Google Play Console — Data Safety (paste-ready summary)

**Does the app collect or share user data?** Yes.
**Is data encrypted in transit?** Yes (HTTPS to api.choosepure.in).
**Can users request deletion?** Yes — in-app request + web deletion URL (see Task 8).

### Data COLLECTED
| Data type | Collected | Shared | Purpose | Ephemeral? |
|---|---|---|---|---|
| Email address | Yes | Mixpanel (analytics) | Account mgmt, Analytics | No |
| Name | Yes | Mixpanel (analytics) | Account mgmt, Analytics | No |
| Phone number | Yes | No | Account mgmt | No |
| User IDs | Yes | Mixpanel, Firebase, **Meta (Android)** | Analytics, Advertising (Meta) | No |
| Photos | Yes | No | App functionality (label analysis) | No |
| Purchase history | Yes | No | App functionality | No |
| App interactions / screen views | Yes | Mixpanel, Firebase, **Meta (Android)** | Analytics, Advertising (Meta) | No |
| Crash logs / diagnostics | Yes | Firebase (Crashlytics) | Analytics / app stability | No |

### Data SHARED with third parties
- **Meta / Facebook (Android only):** app events + user/product-interaction data,
  for **advertising / ad measurement**. Declare under "Data shared" →
  purpose "Advertising or marketing."
- **Mixpanel:** email, name, user id, product interaction — purpose "Analytics."
- **Firebase (Google):** analytics + crash diagnostics + user id — "Analytics."
- **Razorpay:** payment processing is handled in Razorpay's own flow (card data
  not collected by the app); disclose per Razorpay's processor role as needed.

### Security practices
- Encrypted in transit: Yes.
- Account deletion available: Yes (in-app + web URL).
- Committed to Play Families policy: per your audience declaration.
