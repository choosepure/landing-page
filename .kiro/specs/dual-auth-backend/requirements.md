# Requirements Document

## Introduction

ChoosePure's backend currently uses httpOnly cookies (user_token) for user authentication on the web platform. The React Native mobile app cannot use httpOnly cookies because mobile WebView and native HTTP clients do not share the browser cookie jar. This feature formalizes and hardens dual authentication support so that every authenticated endpoint accepts both a Bearer token in the Authorization header and the existing httpOnly cookie, with clearly defined priority rules. The login, register, and Google auth endpoints must return the JWT in the response body so the Mobile_App can persist it in AsyncStorage. The goal is to allow the web and mobile clients to coexist against the same backend without any breaking changes to the existing web flow.

## Glossary

- **Backend**: The Node.js/Express server (server.js) that serves the ChoosePure REST API
- **Auth_Middleware**: The `authenticateUser` middleware function that extracts and verifies a JWT from incoming requests
- **Subscribed_Auth_Middleware**: The `authenticateSubscribedUser` middleware that delegates to Auth_Middleware and additionally checks subscription status
- **Bearer_Token**: A JWT sent in the HTTP Authorization header using the scheme `Authorization: Bearer <token>`
- **Cookie_Token**: A JWT stored in the httpOnly cookie named `user_token`, set by the Backend on login or registration
- **Token_Store**: AsyncStorage on the mobile device where the JWT is persisted after login or registration
- **Mobile_App**: The React Native (Expo) application that authenticates via Bearer_Token
- **Web_Client**: The browser-based ChoosePure frontend that authenticates via Cookie_Token
- **JWT_Payload**: The decoded token body containing `id`, `email`, and `role` fields
- **CORS_Config**: The Express CORS middleware configuration controlling which origins may make credentialed requests

## Requirements

### Requirement 1: Bearer Token Extraction in Auth Middleware

**User Story:** As a mobile app user, I want the backend to accept my JWT in the Authorization header, so that I can access authenticated endpoints without cookies.

#### Acceptance Criteria

1. WHEN an incoming request contains an Authorization header with the value `Bearer <token>`, THE Auth_Middleware SHALL extract the token string after the `Bearer ` prefix
2. WHEN an incoming request does not contain an Authorization header but contains a `user_token` cookie, THE Auth_Middleware SHALL extract the token from the cookie
3. WHEN an incoming request contains both an Authorization header with a Bearer_Token and a `user_token` cookie, THE Auth_Middleware SHALL use the Bearer_Token and ignore the Cookie_Token
4. WHEN an incoming request contains neither an Authorization header nor a `user_token` cookie, THE Auth_Middleware SHALL respond with HTTP 401 and a JSON body containing `{ success: false, message: "Authentication required" }`
5. WHEN the extracted token fails JWT verification (expired, malformed, or invalid signature), THE Auth_Middleware SHALL respond with HTTP 401 and a JSON body containing `{ success: false, message: "Authentication required" }`
6. WHEN the extracted token passes JWT verification but the decoded user does not exist in the users collection, THE Auth_Middleware SHALL respond with HTTP 401

### Requirement 2: Subscribed User Auth Middleware Compatibility

**User Story:** As a subscribed mobile user, I want to access premium endpoints (report detail, PDF download) using my Bearer token, so that I get the same experience as web subscribers.

#### Acceptance Criteria

1. THE Subscribed_Auth_Middleware SHALL delegate token extraction and verification to the Auth_Middleware, inheriting Bearer_Token and Cookie_Token support
2. WHEN the Auth_Middleware succeeds but the user's subscriptionStatus is neither "subscribed" nor "cancelled", THE Subscribed_Auth_Middleware SHALL respond with HTTP 403 and a JSON body containing `{ success: false, message: "Subscription required" }`
3. WHEN the Auth_Middleware succeeds and the user is a subscriber, THE Subscribed_Auth_Middleware SHALL call the next middleware

### Requirement 3: JWT in Login Response Body

**User Story:** As a mobile app developer, I want the login endpoint to return the JWT in the response body, so that the Mobile_App can store it in the Token_Store.

#### Acceptance Criteria

1. WHEN a user successfully authenticates via POST /api/user/login, THE Backend SHALL include a `token` field containing the signed JWT string in the JSON response body
2. WHEN a user successfully authenticates via POST /api/user/login, THE Backend SHALL also set the `user_token` httpOnly cookie with the same JWT (preserving existing web behavior)
3. THE JWT returned by POST /api/user/login SHALL contain the fields `id`, `email`, and `role` in its payload and SHALL have an expiry of 7 days

### Requirement 4: JWT in Registration Response Body

**User Story:** As a mobile app developer, I want the registration endpoint to return the JWT in the response body, so that the Mobile_App can store it immediately after sign-up.

#### Acceptance Criteria

1. WHEN a user successfully registers via POST /api/user/register, THE Backend SHALL include a `token` field containing the signed JWT string in the JSON response body
2. WHEN a user successfully registers via POST /api/user/register, THE Backend SHALL also set the `user_token` httpOnly cookie with the same JWT (preserving existing web behavior)
3. THE JWT returned by POST /api/user/register SHALL contain the fields `id`, `email`, and `role` in its payload and SHALL have an expiry of 7 days

### Requirement 5: JWT in Google Auth Response Body

**User Story:** As a mobile app developer, I want the Google auth endpoint to return the JWT in the response body, so that the Mobile_App can store it after Google sign-in.

#### Acceptance Criteria

1. WHEN a user successfully authenticates or registers via POST /api/user/google-auth, THE Backend SHALL include a `token` field containing the signed JWT string in the JSON response body
2. WHEN a user successfully authenticates or registers via POST /api/user/google-auth, THE Backend SHALL also set the `user_token` httpOnly cookie with the same JWT (preserving existing web behavior)

### Requirement 6: Optional Auth on Reports List Endpoint

**User Story:** As a mobile user browsing reports, I want the reports list to recognize my Bearer token, so that I see purity scores on all reports when I am subscribed.

#### Acceptance Criteria

1. WHEN a request to GET /api/reports includes an Authorization header with a valid Bearer_Token for a subscribed user, THE Backend SHALL include the purityScore field on all report objects in the response
2. WHEN a request to GET /api/reports includes a `user_token` cookie with a valid JWT for a subscribed user but no Authorization header, THE Backend SHALL include the purityScore field on all report objects in the response
3. WHEN a request to GET /api/reports includes both an Authorization header and a `user_token` cookie, THE Backend SHALL use the Bearer_Token for the subscription check
4. WHEN a request to GET /api/reports has no valid token (neither header nor cookie), THE Backend SHALL include the purityScore field only on the first report (the free sample report) and omit it from all other reports
5. WHEN a request to GET /api/reports includes a token that fails verification, THE Backend SHALL treat the request as unauthenticated and include the purityScore only on the first report

### Requirement 7: CORS Configuration for Mobile Clients

**User Story:** As a mobile app developer, I want the backend CORS policy to not block requests from the mobile app, so that API calls succeed from React Native.

#### Acceptance Criteria

1. THE CORS_Config SHALL continue to allow credentialed requests from the existing web origins (https://choosepure.in, https://www.choosepure.in, http://localhost:3000)
2. THE Backend SHALL accept requests from React Native clients that do not send an Origin header (native HTTP clients bypass CORS)
3. THE CORS_Config SHALL not reject requests that lack an Origin header, so that mobile native requests are not blocked

### Requirement 8: Logout Behavior for Dual Auth

**User Story:** As a user, I want the logout endpoint to clear my web session cookie, so that logging out on the web works correctly regardless of how mobile sessions are managed.

#### Acceptance Criteria

1. WHEN POST /api/user/logout is called, THE Backend SHALL clear the `user_token` httpOnly cookie
2. WHEN POST /api/user/logout is called, THE Backend SHALL respond with `{ success: true, message: "Logged out successfully" }`
3. THE Mobile_App SHALL handle logout locally by removing the JWT from the Token_Store (the Backend does not need to invalidate Bearer tokens server-side since JWTs are stateless)

### Requirement 9: Consistent Auth Across All Authenticated Endpoints

**User Story:** As a mobile user, I want every authenticated endpoint to accept my Bearer token, so that I can use all features from the mobile app.

#### Acceptance Criteria

1. THE Auth_Middleware used by the following endpoints SHALL accept both Bearer_Token and Cookie_Token: GET /api/user/me, PUT /api/user/profile, POST /api/polls/vote, POST /api/polls/verify-payment, GET /api/user/referral-stats, GET /api/polls/free-vote-status, POST /api/polls/free-vote, POST /api/suggestions, POST /api/suggestions/:id/upvote, POST /api/subscription/create-order, POST /api/subscription/verify-payment, POST /api/subscription/cancel
2. THE Subscribed_Auth_Middleware used by the following endpoints SHALL accept both Bearer_Token and Cookie_Token: GET /api/reports/:id, GET /api/reports/:id/pdf
3. WHEN any authenticated endpoint receives a valid Bearer_Token, THE Backend SHALL populate req.user with the same fields (id, email, name, phone, subscriptionStatus, referral_code, freeMonthsEarned, subscriptionExpiry, auth_provider) as when a Cookie_Token is used
