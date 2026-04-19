# Requirements Document

## Introduction

This feature adds Google Sign-In and Registration to the ChoosePure web application as an alternative authentication method alongside the existing email/password flow. Users can click a "Sign in with Google" button in the auth modals on both the landing page (index.html) and the dashboard page (purity-wall.html) to authenticate using their Google account. First-time Google users are auto-registered with their Google profile information (name and email). Since Google does not provide phone number or pincode, these fields are collected later or treated as optional for Google-authenticated users. The feature uses Google Identity Services (GIS) on the frontend and verifies Google ID tokens on the backend. After successful Google authentication, the existing JWT cookie-based session (`user_token`) is used, keeping the experience consistent with email/password auth. Referral codes remain functional with Google sign-in.

## Glossary

- **Server**: The existing Node.js/Express backend running on Render (api.choosepure.in) that handles API requests.
- **Database**: The MongoDB Atlas instance (choosepure_db) used for persistent storage.
- **Users_Collection**: The existing MongoDB collection (`users`) that stores user accounts with fields including name, email, phone, pincode, password, role, referral_code, and auth_provider.
- **Auth_Modal**: The modal dialog on the Landing_Page and Dashboard_Page that presents registration and sign-in forms to unauthenticated users.
- **Landing_Page**: The public-facing landing page (index.html) on choosepure.in.
- **Dashboard_Page**: The purity dashboard page (purity-wall.html) on choosepure.in.
- **Google_Identity_Services**: The Google Identity Services (GIS) JavaScript library that renders the "Sign in with Google" button and returns a Google ID token upon successful authentication.
- **Google_ID_Token**: A JWT issued by Google containing the user's profile information (name, email, email_verified, sub) after successful Google authentication.
- **Google_Auth_Endpoint**: The backend API endpoint (`POST /api/user/google-auth`) that receives and verifies a Google_ID_Token and returns a session.
- **User_Session**: A JWT token stored in an httpOnly cookie (`user_token`) that identifies an authenticated regular user across requests.
- **Authenticated_User**: A user who has a valid User_Session with `role: "user"` in the Users_Collection.
- **Auth_Provider_Field**: A field (`auth_provider`) on the user document in the Users_Collection that indicates how the user registered, with values `"email"` or `"google"`.
- **Google_Client_ID**: The OAuth 2.0 client ID obtained from the Google Cloud Console, used to initialize Google_Identity_Services on the frontend and verify Google_ID_Tokens on the backend.

## Requirements

### Requirement 1: Google Sign-In Button in Auth Modals

**User Story:** As a visitor, I want to see a "Sign in with Google" button in the auth modal, so that I can authenticate quickly using my Google account.

#### Acceptance Criteria

1. THE Auth_Modal on the Landing_Page SHALL display a "Sign in with Google" button above the email/password form fields in both the Sign In and Register tabs.
2. THE Auth_Modal on the Dashboard_Page SHALL display a "Sign in with Google" button above the email/password form fields in both the Sign In and Register tabs.
3. THE "Sign in with Google" button SHALL be rendered using the Google_Identity_Services JavaScript library with the standard Google branding.
4. THE Landing_Page SHALL load the Google_Identity_Services library (`https://accounts.google.com/gsi/client`) in the page head.
5. THE Dashboard_Page SHALL load the Google_Identity_Services library (`https://accounts.google.com/gsi/client`) in the page head.
6. THE "Sign in with Google" button SHALL be visually separated from the email/password form by a horizontal divider with the text "or".

### Requirement 2: Google ID Token Verification on Backend

**User Story:** As a platform operator, I want the server to verify Google ID tokens, so that only legitimate Google-authenticated users gain access.

#### Acceptance Criteria

1. WHEN the Server receives a POST request to the Google_Auth_Endpoint with a `credential` field, THE Server SHALL verify the Google_ID_Token by fetching Google's public keys from `https://oauth2.googleapis.com/tokeninfo` or using the `google-auth-library` npm package.
2. WHEN the Google_ID_Token is valid and the `aud` claim matches the Google_Client_ID, THE Server SHALL extract the user's email, name, and `sub` (Google user ID) from the token payload.
3. IF the Google_ID_Token is invalid, expired, or the `aud` claim does not match the Google_Client_ID, THEN THE Server SHALL return a 401 response with the message "Invalid Google token".
4. IF the Google_ID_Token does not contain a verified email (`email_verified` is false or missing), THEN THE Server SHALL return a 400 response with the message "Google account email is not verified".

### Requirement 3: Auto-Registration for New Google Users

**User Story:** As a new visitor signing in with Google for the first time, I want to be automatically registered, so that I do not have to fill out a separate registration form.

#### Acceptance Criteria

1. WHEN the Server verifies a valid Google_ID_Token and no user with the same email exists in the Users_Collection, THE Server SHALL create a new user document with the name and email from the Google token, `auth_provider` set to `"google"`, `google_id` set to the Google `sub` claim, `role` set to `"user"`, `phone` set to `null`, `pincode` set to `null`, `password` set to `null`, `subscriptionStatus` set to `"free"`, a generated `referral_code`, and a `createdAt` timestamp.
2. WHEN auto-registration succeeds, THE Server SHALL generate a JWT token containing the user's ID, email, and role, set it as an httpOnly cookie named `user_token` with a 7-day expiry, and return the user's name, email, subscription status, and referral code in the response.
3. WHEN auto-registration succeeds, THE Server SHALL include an `isNewUser: true` flag in the response so the frontend can track the registration event.

### Requirement 4: Google Sign-In for Existing Users

**User Story:** As a returning user, I want to sign in with Google, so that I can access my existing account without entering a password.

#### Acceptance Criteria

1. WHEN the Server verifies a valid Google_ID_Token and a user with the same email already exists in the Users_Collection with `auth_provider` set to `"google"`, THE Server SHALL generate a JWT token, set the `user_token` cookie, update the `last_login` timestamp, and return the user's profile in the response.
2. WHEN the Server verifies a valid Google_ID_Token and a user with the same email already exists in the Users_Collection with `auth_provider` set to `"email"`, THE Server SHALL return a 409 response with the message "This email is registered with email/password. Please sign in with your password." to prevent account confusion.
3. WHEN sign-in succeeds for an existing Google user, THE Server SHALL include an `isNewUser: false` flag in the response.

### Requirement 5: Referral Code Support for Google Sign-In

**User Story:** As a visitor who received a referral link, I want the referral code to be applied when I sign in with Google for the first time, so that my referrer gets credit.

#### Acceptance Criteria

1. WHEN the Google_Auth_Endpoint receives a `referral_code` parameter alongside the Google_ID_Token, THE Server SHALL validate the referral code against the Users_Collection.
2. WHEN a valid referral code is provided and the Google user is being auto-registered, THE Server SHALL set `referred_by` to the referrer's user ID and create a referral record in the referrals collection with `status` set to `"pending"`.
3. IF the referral code is invalid, THEN THE Server SHALL proceed with registration without a referral and omit the referral record.
4. IF the referral code belongs to the same email as the Google user, THEN THE Server SHALL ignore the referral code to prevent self-referral.
5. WHEN the Google user already exists in the Users_Collection, THE Server SHALL ignore the referral code parameter.

### Requirement 6: Frontend Google Auth Flow

**User Story:** As a visitor, I want the Google sign-in process to be seamless, so that I am authenticated and the page updates without a full reload.

#### Acceptance Criteria

1. WHEN Google_Identity_Services returns a credential (Google_ID_Token) after the user selects a Google account, THE Landing_Page SHALL send a POST request to the Google_Auth_Endpoint with the credential and any pending referral code.
2. WHEN Google_Identity_Services returns a credential after the user selects a Google account, THE Dashboard_Page SHALL send a POST request to the Google_Auth_Endpoint with the credential and any pending referral code.
3. WHEN the Google_Auth_Endpoint returns a successful response, THE Auth_Modal SHALL close and the page SHALL update the auth header to display the user's name, matching the existing email/password sign-in behavior.
4. IF the Google_Auth_Endpoint returns an error response, THEN THE Auth_Modal SHALL display the error message in the error area of the currently active form tab.
5. WHILE the Google auth request is in progress, THE Auth_Modal SHALL display a loading state on the Google button area to indicate processing.

### Requirement 7: Google Client ID Configuration

**User Story:** As a platform operator, I want the Google Client ID stored as an environment variable, so that it can be configured per environment without code changes.

#### Acceptance Criteria

1. THE Server SHALL read the Google_Client_ID from the `GOOGLE_CLIENT_ID` environment variable.
2. THE Server SHALL expose an endpoint (`GET /api/config/google-client-id`) that returns the Google_Client_ID so the frontend can initialize Google_Identity_Services dynamically.
3. IF the `GOOGLE_CLIENT_ID` environment variable is not set, THEN THE Server SHALL return a 503 response from the Google_Auth_Endpoint with the message "Google authentication is not configured".
4. THE Landing_Page and Dashboard_Page SHALL fetch the Google_Client_ID from the Server configuration endpoint and use it to initialize Google_Identity_Services.

### Requirement 8: Optional Profile Completion for Google Users

**User Story:** As a Google-authenticated user, I want to be prompted to complete my profile with phone and pincode, so that my details are available for voting and other features.

#### Acceptance Criteria

1. WHEN a Google-authenticated user has `phone` set to `null` in the Users_Collection, THE Dashboard_Page SHALL display a non-blocking banner prompting the user to complete their profile.
2. WHEN the user submits phone and pincode through the profile completion prompt, THE Server SHALL validate the phone as exactly 10 digits and the pincode as exactly 6 digits before updating the user document.
3. IF the phone number is already registered to another user in the Users_Collection, THEN THE Server SHALL return a 400 response with the message "This phone number is already registered".
4. THE Server SHALL provide a `PUT /api/user/profile` endpoint protected by the `authenticateUser` middleware that accepts phone and pincode fields for updating the user document.
5. WHILE a Google-authenticated user has `phone` set to `null`, THE Dashboard_Page SHALL still allow the user to browse reports and access subscription features.

### Requirement 9: Password-Related UI Adjustments for Google Users

**User Story:** As a Google-authenticated user, I want the interface to reflect that I do not have a password, so that I am not confused by password-related options.

#### Acceptance Criteria

1. WHEN a Google-authenticated user views the Dashboard_Page, THE Dashboard_Page SHALL hide the "Forgot Password?" link since the user does not have a password.
2. THE Server SHALL include the `auth_provider` field in the `/api/user/me` response so the frontend can determine the authentication method.
3. IF a user with `auth_provider` set to `"google"` requests a password reset via the forgot-password endpoint, THEN THE Server SHALL return a 400 response with the message "This account uses Google sign-in. Please sign in with Google."

### Requirement 10: Analytics Tracking for Google Auth Events

**User Story:** As a platform operator, I want Google authentication events tracked in analytics, so that I can measure Google sign-in adoption alongside email/password auth.

#### Acceptance Criteria

1. WHEN a new user completes auto-registration via Google, THE Landing_Page and Dashboard_Page SHALL fire a "User Registered" event to GA4, Meta Pixel, and Mixpanel with the method set to `"google"`.
2. WHEN an existing user signs in via Google, THE Landing_Page and Dashboard_Page SHALL fire a "User Signed In" event to GA4, Meta Pixel, and Mixpanel with the method set to `"google"`.
3. IF the Google sign-in flow fails with an error from the Google_Auth_Endpoint, THEN THE Landing_Page and Dashboard_Page SHALL fire a "Google Auth Failed" event to Mixpanel with the error message.

### Requirement 11: Account Linking Prevention

**User Story:** As a platform operator, I want to prevent accidental account merging, so that users with email/password accounts do not inadvertently create duplicate accounts via Google.

#### Acceptance Criteria

1. THE Users_Collection SHALL maintain a unique index on the `email` field, preventing two user documents with the same email.
2. WHEN a Google sign-in attempt matches an existing email with `auth_provider` set to `"email"`, THE Server SHALL reject the sign-in and return a clear message directing the user to sign in with their password.
3. WHEN a Google sign-in attempt matches an existing email with `auth_provider` set to `"google"`, THE Server SHALL proceed with the sign-in and update the `last_login` timestamp.
