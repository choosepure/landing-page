# Requirements Document

## Introduction

ChoosePure is an independent food purity testing platform for parents. This document specifies requirements for a React Native mobile application (iOS and Android) that mirrors the existing web platform features. The Mobile_App connects to the existing backend at api.choosepure.in via REST APIs, using Bearer token authentication instead of the web's httpOnly cookie approach. The app is built with Expo (managed workflow), React Navigation, and follows ChoosePure brand guidelines.

## Glossary

- **Mobile_App**: The React Native (Expo) application targeting iOS and Android platforms
- **API_Client**: The HTTP client module within the Mobile_App responsible for making REST API calls to the Backend with Bearer token headers
- **Backend**: The existing Node.js/Express server at api.choosepure.in providing REST API endpoints
- **Auth_Module**: The authentication subsystem handling login, registration, token storage, and session management
- **Token_Store**: AsyncStorage-based persistent storage for JWT access tokens on the device
- **Navigation_Router**: The React Navigation stack and tab navigator managing screen transitions
- **Dashboard_Screen**: The main Purity Dashboard screen displaying test report cards and subscription status
- **Report_Detail_Screen**: The screen showing full test report data including test parameters, purity score, and expert commentary
- **Polling_Screen**: The screen where users view active products and cast votes
- **Suggestion_Screen**: The screen where users submit and upvote product suggestions
- **Subscription_Module**: The subsystem handling Razorpay subscription creation and payment verification via the React Native Razorpay SDK
- **Referral_Screen**: The screen displaying the user's referral code, share link, and referral statistics
- **Profile_Screen**: The screen showing user information, subscription management, and sign-out
- **Vision_Screen**: The static informational screen about ChoosePure's mission
- **Onboarding_Screen**: The welcome screen shown to first-time users before authentication
- **Deep_Link_Handler**: The module that processes incoming deep links for referral codes (choosepure.in/purity-wall?ref=CP-XXXXX)
- **Razorpay_SDK**: The react-native-razorpay library used for in-app payment processing
- **Purity_Score**: A numeric value between 0 and 100 representing the purity rating of a tested product
- **Free_Vote**: A complimentary monthly vote available to subscribed users
- **Subscriber**: A user whose subscriptionStatus is "subscribed" or "cancelled" (with active expiry)

## Requirements

### Requirement 1: Token-Based Authentication

**User Story:** As a mobile user, I want to sign in with my email and password, so that I can access my ChoosePure account on my phone.

#### Acceptance Criteria

1. WHEN a user submits valid credentials on the login form, THE Auth_Module SHALL send a POST request to /api/user/login and store the returned JWT token in the Token_Store
2. WHEN a user submits the registration form with name, email, phone, pincode, and password, THE Auth_Module SHALL send a POST request to /api/user/register and store the returned JWT token in the Token_Store
3. THE API_Client SHALL include the JWT token from the Token_Store as a Bearer token in the Authorization header of every authenticated API request
4. WHEN the Backend returns a 401 status code, THE Auth_Module SHALL clear the Token_Store and redirect the user to the login screen
5. WHEN the Mobile_App launches, THE Auth_Module SHALL check the Token_Store for an existing token and validate it by calling GET /api/user/me
6. IF the token validation call to /api/user/me fails, THEN THE Auth_Module SHALL clear the Token_Store and display the login screen
7. WHEN a user taps the sign-out button, THE Auth_Module SHALL call POST /api/user/logout, clear the Token_Store, and navigate to the login screen

### Requirement 2: User Registration with Referral Support

**User Story:** As a new user, I want to register with an optional referral code, so that both the referrer and I can earn subscription rewards.

#### Acceptance Criteria

1. THE Auth_Module SHALL validate that the name field is non-empty, the email matches a valid email format, the phone is exactly 10 digits, the pincode is exactly 6 digits, and the password is at least 8 characters before submitting the registration request
2. WHEN a referral code is provided during registration, THE Auth_Module SHALL include the referral_code field in the POST /api/user/register request body
3. WHEN the Deep_Link_Handler detects a referral link (choosepure.in/purity-wall?ref=CP-XXXXX), THE Mobile_App SHALL pre-fill the referral code field on the registration screen
4. IF the Backend returns a validation error during registration, THEN THE Auth_Module SHALL display the specific error message returned by the Backend (duplicate email, duplicate phone, invalid referral code)
5. WHEN registration succeeds, THE Auth_Module SHALL navigate the user to the Dashboard_Screen

### Requirement 3: Password Recovery

**User Story:** As a user who forgot my password, I want to request a password reset email, so that I can regain access to my account.

#### Acceptance Criteria

1. WHEN a user submits their email on the forgot password form, THE Auth_Module SHALL send a POST request to /api/user/forgot-password with the email
2. WHEN the forgot password request succeeds, THE Auth_Module SHALL display a confirmation message stating that a reset link has been sent if the email exists
3. WHEN a user opens a password reset deep link, THE Mobile_App SHALL navigate to a reset password form and extract the token from the link
4. WHEN a user submits a new password (minimum 8 characters) with the reset token, THE Auth_Module SHALL send a POST request to /api/user/reset-password
5. IF the reset token is invalid or expired, THEN THE Auth_Module SHALL display an error message and prompt the user to request a new reset link

### Requirement 4: Onboarding Experience

**User Story:** As a first-time user, I want to see a welcome screen explaining ChoosePure, so that I understand the platform before signing up.

#### Acceptance Criteria

1. WHEN the Mobile_App launches for the first time (no token in Token_Store and onboarding not previously completed), THE Onboarding_Screen SHALL display a series of informational slides about ChoosePure's mission and features
2. WHEN the user completes or skips the onboarding, THE Mobile_App SHALL persist the onboarding completion flag in AsyncStorage and navigate to the login screen
3. WHEN the Mobile_App launches after onboarding has been completed, THE Mobile_App SHALL skip the Onboarding_Screen

### Requirement 5: Purity Dashboard

**User Story:** As a signed-in user, I want to see all published test reports as cards on the dashboard, so that I can browse product purity results.

#### Acceptance Criteria

1. WHEN the Dashboard_Screen loads, THE Dashboard_Screen SHALL fetch published reports from GET /api/reports and display them as scrollable cards showing product name, brand name, category, image, and status badges
2. THE Dashboard_Screen SHALL display the Purity_Score on the first report card (Akshayakalpa, free for all users) regardless of subscription status
3. WHILE the user is not a Subscriber, THE Dashboard_Screen SHALL hide the Purity_Score on all report cards except the first one and display a lock indicator
4. WHILE the user is a Subscriber, THE Dashboard_Screen SHALL display the Purity_Score on all report cards
5. THE Dashboard_Screen SHALL display the user's current subscription status (free or subscribed) in a visible section
6. WHEN the user pulls down on the report list, THE Dashboard_Screen SHALL refresh the reports data from the Backend

### Requirement 6: Test Report Detail View

**User Story:** As a subscriber, I want to view the full details of a test report, so that I can understand the purity analysis of a product.

#### Acceptance Criteria

1. WHEN a Subscriber taps on a report card, THE Report_Detail_Screen SHALL fetch the full report from GET /api/reports/:id and display all fields including test parameters, purity score, expert commentary, methodology, batch code, shelf life, and test date
2. WHEN a non-subscribed user taps on a locked report card, THE Mobile_App SHALL display a prompt directing the user to the Subscription_Module
3. WHEN a Subscriber taps the download button on the Report_Detail_Screen, THE Mobile_App SHALL fetch the PDF from GET /api/reports/:id/pdf and open a share sheet or save the file to the device
4. IF the report fetch fails, THEN THE Report_Detail_Screen SHALL display an error message with a retry option

### Requirement 7: Product Polling with Paid Votes

**User Story:** As a user, I want to vote for products I want tested, so that ChoosePure prioritizes testing based on community demand.

#### Acceptance Criteria

1. WHEN the Polling_Screen loads, THE Polling_Screen SHALL fetch active products from GET /api/polls/products and display them sorted by total votes in descending order
2. WHEN a user selects a product and vote count, THE Polling_Screen SHALL initiate a Razorpay payment by calling POST /api/polls/vote to create an order
3. WHEN the Razorpay_SDK returns a successful payment, THE Polling_Screen SHALL send the payment details to POST /api/polls/verify-payment and update the displayed vote count
4. IF the Razorpay payment is cancelled or fails, THEN THE Polling_Screen SHALL display an appropriate error message and allow the user to retry
5. WHILE the user is a Subscriber, THE Polling_Screen SHALL check GET /api/polls/free-vote-status and display a free vote option if eligible
6. WHEN a Subscriber casts a free vote, THE Polling_Screen SHALL send a POST request to /api/polls/free-vote and update the displayed vote count

### Requirement 8: Product Suggestions and Upvoting

**User Story:** As a user, I want to suggest products for testing and upvote other suggestions, so that the community can influence which products get tested.

#### Acceptance Criteria

1. WHEN the Suggestion_Screen loads, THE Suggestion_Screen SHALL fetch approved suggestions from GET /api/suggestions and display them sorted by upvotes in descending order
2. WHEN a user submits a suggestion with product name and category (reason is optional), THE Suggestion_Screen SHALL send a POST request to /api/suggestions
3. WHEN a user taps the upvote button on a suggestion, THE Suggestion_Screen SHALL send a POST request to /api/suggestions/:id/upvote and update the displayed upvote count
4. IF a user attempts to upvote a suggestion they have already upvoted, THEN THE Suggestion_Screen SHALL display a message indicating the user has already upvoted
5. IF the suggestion submission fails due to missing fields, THEN THE Suggestion_Screen SHALL display the validation error from the Backend

### Requirement 9: Subscription via Razorpay

**User Story:** As a free user, I want to subscribe to ChoosePure for ₹299/month, so that I can access all test reports and subscriber benefits.

#### Acceptance Criteria

1. WHEN a free user taps the subscribe button, THE Subscription_Module SHALL call POST /api/subscription/create-order to create a Razorpay subscription
2. WHEN the Razorpay_SDK returns a successful subscription payment, THE Subscription_Module SHALL send the subscription details (razorpay_subscription_id, razorpay_payment_id, razorpay_signature) to POST /api/subscription/verify-payment
3. WHEN subscription verification succeeds, THE Subscription_Module SHALL update the local user state to reflect subscriptionStatus as "subscribed" and navigate the user back to the Dashboard_Screen
4. IF the subscription payment fails or is cancelled, THEN THE Subscription_Module SHALL display an error message and allow the user to retry
5. WHILE the user is already subscribed, THE Subscription_Module SHALL display the current subscription status and expiry date instead of the subscribe button

### Requirement 10: Referral Program

**User Story:** As a subscribed user, I want to share my referral code with friends, so that we both earn free subscription months.

#### Acceptance Criteria

1. WHEN the Referral_Screen loads, THE Referral_Screen SHALL fetch referral statistics from GET /api/user/referral-stats and display the referral code, referral link, total invited count, completed count, pending count, and free months earned
2. WHEN the user taps the share button, THE Referral_Screen SHALL open the device's native share sheet with the referral link (https://choosepure.in/purity-wall?ref=CP-XXXXX)
3. WHEN the user taps the copy button, THE Referral_Screen SHALL copy the referral code to the device clipboard and display a confirmation message
4. THE Referral_Screen SHALL display a statistics dashboard showing the breakdown of pending and completed referrals

### Requirement 11: Profile and Settings

**User Story:** As a user, I want to view and manage my account information, so that I can see my profile details and subscription status.

#### Acceptance Criteria

1. WHEN the Profile_Screen loads, THE Profile_Screen SHALL display the user's name, email, phone, subscription status, referral code, free months earned, and subscription expiry date from the cached user data
2. WHEN the user taps the sign-out button, THE Profile_Screen SHALL trigger the Auth_Module sign-out flow
3. WHEN the user taps the manage subscription option, THE Profile_Screen SHALL navigate to the Subscription_Module screen
4. THE Profile_Screen SHALL provide a link to the Vision_Screen

### Requirement 12: Vision Page

**User Story:** As a user, I want to read about ChoosePure's mission and team, so that I understand the platform's purpose.

#### Acceptance Criteria

1. THE Vision_Screen SHALL display ChoosePure's mission statement, team information, and core values as static content
2. THE Vision_Screen SHALL be accessible from the Profile_Screen and the Onboarding_Screen

### Requirement 13: Navigation Structure

**User Story:** As a user, I want intuitive navigation between all screens, so that I can easily access any feature of the app.

#### Acceptance Criteria

1. THE Navigation_Router SHALL implement a bottom tab navigator with tabs for Dashboard, Polling, Suggestions, Referral, and Profile
2. THE Navigation_Router SHALL implement a stack navigator for authentication screens (Login, Register, Forgot Password, Reset Password)
3. WHILE the user is not authenticated, THE Navigation_Router SHALL display only the authentication stack and the Onboarding_Screen
4. WHILE the user is authenticated, THE Navigation_Router SHALL display the bottom tab navigator with all main screens
5. THE Navigation_Router SHALL support deep linking for referral URLs and password reset URLs

### Requirement 14: Brand Theming

**User Story:** As a user, I want the app to reflect the ChoosePure brand, so that the experience feels consistent with the web platform.

#### Acceptance Criteria

1. THE Mobile_App SHALL use Deep Leaf Green (#1F6B4E) as the primary color for buttons, headers, and active tab indicators
2. THE Mobile_App SHALL use Pure Ivory (#FAFAF7) as the background color for all screens
3. THE Mobile_App SHALL use Grain Brown (#8A6E4B) as the accent color for secondary elements and highlights
4. THE Mobile_App SHALL use the Inter font family for all text elements
5. THE Mobile_App SHALL display the ChoosePure logo on the Onboarding_Screen and in the authentication screen headers

### Requirement 15: Backend Auth Compatibility

**User Story:** As a developer, I want the backend to support both cookie-based and token-based authentication, so that the web and mobile apps can coexist.

#### Acceptance Criteria

1. THE Backend authenticateUser middleware SHALL check for a JWT token in the Authorization header (Bearer scheme) in addition to the existing user_token cookie
2. WHEN both an Authorization header and a cookie are present, THE Backend SHALL prioritize the Authorization header token
3. THE Backend login and register endpoints SHALL return the JWT token in the response body (in addition to setting the cookie) so the Mobile_App can store it in the Token_Store
4. THE Backend /api/reports endpoint SHALL check for a JWT token in the Authorization header in addition to the cookie for the optional subscription check

### Requirement 16: Offline and Error Handling

**User Story:** As a mobile user, I want clear feedback when the network is unavailable or an error occurs, so that I understand the app's state.

#### Acceptance Criteria

1. WHEN the device has no network connectivity, THE Mobile_App SHALL display an offline banner indicating that the app requires an internet connection
2. IF an API request fails due to a network error, THEN THE API_Client SHALL display a user-friendly error message with a retry option
3. IF an API request fails due to a server error (5xx), THEN THE API_Client SHALL display a generic error message and log the error details
4. WHILE the Mobile_App is loading data from the Backend, THE Mobile_App SHALL display loading indicators (skeleton screens or spinners)

### Requirement 17: Deep Linking

**User Story:** As a user, I want to open referral and password reset links directly in the app, so that I have a seamless experience.

#### Acceptance Criteria

1. WHEN the Mobile_App receives a deep link matching choosepure.in/purity-wall?ref=CP-XXXXX, THE Deep_Link_Handler SHALL extract the referral code and navigate to the registration screen with the code pre-filled
2. WHEN the Mobile_App receives a deep link matching choosepure.in/user/reset-password?token=XXXXX, THE Deep_Link_Handler SHALL extract the token and navigate to the reset password screen
3. IF the Mobile_App is not installed when a deep link is tapped, THEN the link SHALL fall back to the web version (handled by universal links / app links configuration)
