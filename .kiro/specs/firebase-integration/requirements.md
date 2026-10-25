# Requirements Document

## Introduction

This document specifies the requirements for integrating Firebase services into the ChoosePure React Native (Expo SDK 52) mobile application. The integration covers six Firebase service areas: Authentication (email and phone number), Push Notifications (FCM), Feature Flags and A/B Testing (Remote Config), App Analytics and Funnel Tracking (Firebase Analytics), Crash Reporting (Crashlytics), and Real-time Vote Count Updates (Firestore). The existing JWT-based authentication with the ChoosePure backend API will be preserved and augmented with Firebase Authentication as the identity provider. The app targets both iOS and Android platforms with bundle identifier `in.choosepure.app`.

## Glossary

- **App**: The ChoosePure React Native mobile application built with Expo SDK 52
- **Firebase_SDK**: The React Native Firebase (`@react-native-firebase/*`) library suite configured for Expo managed workflow via config plugins
- **Auth_Service**: The Firebase Authentication module responsible for user identity management via email/password and phone number sign-in methods
- **Backend_API**: The existing ChoosePure REST API at `https://api.choosepure.in` that manages user data, polling, and business logic
- **Auth_Context**: The React context provider (`AuthContext.js`) that manages authentication state, login, registration, and logout across the App
- **FCM_Service**: Firebase Cloud Messaging service that delivers push notifications to iOS and Android devices
- **Remote_Config_Service**: Firebase Remote Config service that provides feature flags and A/B test parameters to the App at runtime
- **Analytics_Service**: Firebase Analytics service that tracks user events, screen views, and conversion funnels within the App
- **Crashlytics_Service**: Firebase Crashlytics service that captures, reports, and groups crash and non-fatal error data from the App
- **Firestore_Service**: Firebase Cloud Firestore service that provides real-time document synchronization for vote count data
- **OTP_Screen**: The screen where users enter a one-time password received via SMS for phone number verification
- **Notification_Token**: The unique device token issued by FCM that identifies a device for push notification delivery
- **Feature_Flag**: A key-value pair stored in Remote_Config_Service that controls the availability or behavior of a feature in the App
- **Polling_Screen**: The existing screen (`PollingScreen.js`) that displays products and their vote counts for user voting

## Requirements

### Requirement 1: Firebase SDK Setup and Configuration

**User Story:** As a developer, I want Firebase SDK properly configured in the Expo managed workflow, so that all Firebase services are available on both iOS and Android platforms.

#### Acceptance Criteria

1. THE Firebase_SDK SHALL be configured using Expo config plugins in `app.json` with the `@react-native-firebase/app` plugin for both iOS and Android platforms
2. THE App SHALL load Firebase configuration from platform-specific files (`google-services.json` for Android and `GoogleService-Info.plist` for iOS) placed in the project root
3. THE Firebase_SDK SHALL initialize successfully before any Firebase service is accessed by the App
4. IF the Firebase_SDK fails to initialize, THEN THE App SHALL log the initialization error via Crashlytics_Service fallback and continue operating with existing Backend_API functionality

### Requirement 2: Email and Password Authentication

**User Story:** As a user, I want to sign up and sign in using my email and password through Firebase, so that I have a secure and consistent authentication experience.

#### Acceptance Criteria

1. WHEN a user submits the registration form with valid name, email, phone, pincode, and password, THE Auth_Service SHALL create a new Firebase user account with the provided email and password
2. WHEN the Auth_Service successfully creates a Firebase user account, THE Auth_Context SHALL send the Firebase ID token to the Backend_API to create or link the corresponding backend user record and receive a JWT token
3. WHEN a user submits the login form with valid email and password, THE Auth_Service SHALL authenticate the user against Firebase and obtain a Firebase ID token
4. WHEN the Auth_Service successfully authenticates a user, THE Auth_Context SHALL exchange the Firebase ID token with the Backend_API for a JWT token and store the JWT token in AsyncStorage
5. IF the Auth_Service returns an authentication error during login, THEN THE Login_Screen SHALL display the specific error message returned by Firebase (invalid credentials, user not found, or account disabled)
6. IF the Auth_Service returns an error during registration, THEN THE Register_Screen SHALL display the specific error message returned by Firebase (email already in use, weak password, or invalid email)
7. WHEN a user initiates logout, THE Auth_Context SHALL sign out from both the Auth_Service and the Backend_API, and remove the JWT token from AsyncStorage

### Requirement 3: Phone Number Authentication

**User Story:** As a user, I want to sign up and sign in using my mobile phone number with OTP verification, so that I can access the app without needing an email account.

#### Acceptance Criteria

1. WHEN a user enters a valid phone number and requests OTP verification, THE Auth_Service SHALL send an SMS verification code to the provided phone number
2. WHEN the Auth_Service sends an SMS verification code, THE App SHALL navigate the user to the OTP_Screen to enter the received code
3. WHEN a user submits a valid OTP on the OTP_Screen, THE Auth_Service SHALL verify the code and authenticate the user with a Firebase credential
4. WHEN the Auth_Service successfully verifies the phone number, THE Auth_Context SHALL exchange the Firebase ID token with the Backend_API for a JWT token and store the JWT token in AsyncStorage
5. IF the user enters an incorrect OTP, THEN THE OTP_Screen SHALL display an error message indicating the code is invalid and allow the user to retry
6. IF the SMS verification code expires, THEN THE OTP_Screen SHALL allow the user to request a new verification code
7. THE OTP_Screen SHALL display a countdown timer showing the remaining validity period of the current verification code
8. WHILE the Auth_Service is sending the SMS verification code, THE App SHALL display a loading indicator and disable the send button to prevent duplicate requests

### Requirement 4: Push Notification Services

**User Story:** As a user, I want to receive push notifications about voting reminders, new reports, and important updates, so that I stay engaged with the app.

#### Acceptance Criteria

1. WHEN the App launches for the first time after installation, THE FCM_Service SHALL request notification permission from the user on both iOS and Android
2. WHEN the user grants notification permission, THE App SHALL retrieve the Notification_Token from FCM_Service and send the token to the Backend_API for storage
3. WHEN the App receives a push notification while in the foreground, THE App SHALL display the notification as an in-app banner without interrupting the current user flow
4. WHEN the user taps a push notification, THE App SHALL navigate to the relevant screen based on the notification payload data
5. IF the Notification_Token is refreshed by FCM_Service, THEN THE App SHALL send the updated token to the Backend_API
6. THE App SHALL configure the iOS notification presentation options to display alerts, badges, and sounds when notifications arrive in the foreground
7. WHEN the App launches, THE FCM_Service SHALL check for and process any notification that caused the app to open from a terminated state

### Requirement 5: Feature Flags and A/B Testing

**User Story:** As a product manager, I want to control feature availability and run A/B tests remotely, so that I can roll out features gradually and measure their impact.

#### Acceptance Criteria

1. WHEN the App launches, THE Remote_Config_Service SHALL fetch the latest feature flag values from Firebase Remote Config with a minimum fetch interval of 12 hours for production builds
2. THE Remote_Config_Service SHALL provide default values for all Feature_Flags so the App functions correctly when the device is offline or before the first fetch completes
3. WHEN a Feature_Flag value is fetched and activated, THE App SHALL apply the new value without requiring an app restart
4. THE App SHALL expose a `useFeatureFlag` hook that components use to read Feature_Flag values, accepting a flag key and returning the current value
5. IF the Remote_Config_Service fails to fetch updated values, THEN THE App SHALL continue using the most recently fetched values or the default values

### Requirement 6: App Analytics and Funnel Tracking

**User Story:** As a product manager, I want to track user behavior, screen views, and conversion funnels, so that I can make data-driven decisions about the app.

#### Acceptance Criteria

1. WHEN a user navigates to a new screen, THE Analytics_Service SHALL log a screen view event with the screen name and screen class
2. WHEN a user completes registration, THE Analytics_Service SHALL log a `sign_up` event with the authentication method (email or phone)
3. WHEN a user completes login, THE Analytics_Service SHALL log a `login` event with the authentication method (email or phone)
4. WHEN a user casts a vote on the Polling_Screen, THE Analytics_Service SHALL log a `vote_cast` custom event with the product identifier and vote count
5. WHEN a user completes a payment via Razorpay, THE Analytics_Service SHALL log a `purchase` event with the transaction amount and currency
6. WHEN a user scans a product barcode, THE Analytics_Service SHALL log a `scan_product` custom event with the barcode value
7. THE Analytics_Service SHALL set the Firebase user ID to match the Backend_API user identifier when a user is authenticated, enabling cross-platform user analysis

### Requirement 7: Crash Reporting

**User Story:** As a developer, I want automatic crash reports and non-fatal error logging, so that I can identify and fix issues affecting users.

#### Acceptance Criteria

1. THE Crashlytics_Service SHALL automatically capture and report unhandled JavaScript exceptions and native crashes on both iOS and Android
2. WHEN a user is authenticated, THE Crashlytics_Service SHALL associate crash reports with the user identifier from the Backend_API to enable user-level crash analysis
3. THE Crashlytics_Service SHALL capture custom log messages added by the App at error boundaries and critical code paths
4. WHEN a non-fatal error occurs during API calls to the Backend_API, THE Crashlytics_Service SHALL record the error with the API endpoint and HTTP status code as custom attributes
5. THE Crashlytics_Service SHALL be disabled in development builds and enabled in preview and production builds
6. IF a JavaScript error is caught by a React error boundary, THEN THE Crashlytics_Service SHALL record the error as a non-fatal exception with the component stack trace

### Requirement 8: Real-time Vote Count Updates

**User Story:** As a user, I want to see vote counts update in real-time on the polling screen, so that I can see the impact of my vote and follow live voting activity.

#### Acceptance Criteria

1. WHILE the Polling_Screen is visible, THE Firestore_Service SHALL maintain an active real-time listener on the vote count documents for all displayed products
2. WHEN a vote count document is updated in Firestore, THE Polling_Screen SHALL reflect the new vote count within 2 seconds without requiring a manual refresh
3. WHEN the Polling_Screen is no longer visible (user navigates away), THE App SHALL unsubscribe from the Firestore real-time listener to conserve device resources and reduce Firestore read costs
4. IF the Firestore_Service real-time connection is lost, THEN THE Polling_Screen SHALL display the most recently received vote counts and show an indicator that real-time updates are temporarily unavailable
5. WHEN the Polling_Screen is first loaded, THE App SHALL fetch initial vote counts from the Backend_API and then attach the Firestore real-time listener for subsequent updates
6. THE Firestore_Service SHALL use the product identifier as the document key in the vote count collection to ensure consistent mapping between Backend_API data and Firestore documents
