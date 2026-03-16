# Requirements Document

## Introduction

This feature adds user registration and sign-in to the ChoosePure polling page (polling.html). Currently, the polling page allows anonymous users to vote on products (with Razorpay payment), suggest products for testing, and upvote suggestions. After this feature, users must register and sign in before performing these actions. Product browsing remains public. The feature reuses the existing `users` collection in MongoDB, distinguishing regular users from admins via a `role` field. Authenticated user details (name, email, phone) auto-fill in the vote modal and suggestion form. The backend is Node.js/Express on Render (api.choosepure.in), the frontend is vanilla JS served statically, and JWT tokens stored in httpOnly cookies handle session management.

## Glossary

- **Polling_Page**: The public-facing page (polling.html) on choosepure.in where users view products, vote, suggest products, and upvote suggestions.
- **Server**: The existing Node.js/Express backend running on Render (api.choosepure.in) that handles API requests.
- **Database**: The MongoDB Atlas instance (choosepure_db) used for persistent storage.
- **Users_Collection**: The existing MongoDB collection (`users`) that stores both admin and regular user accounts, distinguished by the `role` field.
- **Auth_Modal**: A modal dialog on the Polling_Page that presents registration and sign-in forms to unauthenticated users.
- **User_Session**: A JWT token stored in an httpOnly cookie (`user_token`) that identifies an authenticated regular user across requests.
- **Authenticated_User**: A user who has a valid User_Session with `role: "user"` in the Users_Collection.
- **Registration_Form**: The form within the Auth_Modal where new users provide their name, email, phone number, and password to create an account.
- **Sign_In_Form**: The form within the Auth_Modal where existing users provide their email and password to authenticate.
- **Auth_Header**: A UI element in the Polling_Page header that displays the user's name when authenticated, or a "Sign In" link when not authenticated.

## Requirements

### Requirement 1: User Registration

**User Story:** As a visitor, I want to register an account on the polling page, so that I can vote on products, suggest products, and upvote suggestions.

#### Acceptance Criteria

1. WHEN a visitor submits the Registration_Form with a valid name, email, phone number, and password, THE Server SHALL create a new user document in the Users_Collection with the provided name, email, phone, a bcrypt-hashed password, `role` set to `"user"`, and a `createdAt` timestamp.
2. IF a visitor submits the Registration_Form with an email that already exists in the Users_Collection, THEN THE Server SHALL return a 400 response indicating the email is already registered.
3. IF a visitor submits the Registration_Form with a missing name, email, phone, or password, THEN THE Server SHALL return a 400 response identifying the missing fields.
4. IF a visitor submits the Registration_Form with an email that does not match a valid email format, THEN THE Server SHALL return a 400 response indicating the email is invalid.
5. IF a visitor submits the Registration_Form with a phone number that is not exactly 10 digits, THEN THE Server SHALL return a 400 response indicating the phone number is invalid.
6. IF a visitor submits the Registration_Form with a password shorter than 8 characters, THEN THE Server SHALL return a 400 response indicating the password must be at least 8 characters.
7. WHEN registration succeeds, THE Server SHALL generate a JWT token containing the user's ID, email, and role, set it as an httpOnly cookie named `user_token` with a 7-day expiry, and return the user's name and email in the response.
8. WHEN registration succeeds, THE Polling_Page SHALL close the Auth_Modal, update the Auth_Header to display the user's name, and enable voting, suggesting, and upvoting actions.

### Requirement 2: User Sign-In

**User Story:** As a registered user, I want to sign in on the polling page, so that I can access voting, suggesting, and upvoting features.

#### Acceptance Criteria

1. WHEN a user submits the Sign_In_Form with a valid email and password, THE Server SHALL verify the password against the bcrypt hash stored in the Users_Collection for the matching user with `role: "user"`.
2. WHEN sign-in credentials are valid, THE Server SHALL generate a JWT token containing the user's ID, email, and role, set it as an httpOnly cookie named `user_token` with a 7-day expiry, and return the user's name, email, and phone in the response.
3. IF a user submits the Sign_In_Form with an email that does not exist in the Users_Collection with `role: "user"`, THEN THE Server SHALL return a 401 response with the message "Invalid credentials".
4. IF a user submits the Sign_In_Form with an incorrect password, THEN THE Server SHALL return a 401 response with the message "Invalid credentials".
5. IF a user submits the Sign_In_Form with a missing email or password, THEN THE Server SHALL return a 400 response indicating the missing fields.
6. WHEN sign-in succeeds, THE Polling_Page SHALL close the Auth_Modal, update the Auth_Header to display the user's name, and enable voting, suggesting, and upvoting actions.

### Requirement 3: Session Persistence and Verification

**User Story:** As a registered user, I want to remain signed in when I revisit the polling page, so that I do not have to sign in every time.

#### Acceptance Criteria

1. WHEN a user visits the Polling_Page, THE Polling_Page SHALL send a request to the Server to check the validity of the `user_token` cookie.
2. WHEN the `user_token` cookie contains a valid JWT, THE Server SHALL return the authenticated user's name, email, and phone from the Users_Collection.
3. IF the `user_token` cookie is missing or contains an invalid or expired JWT, THEN THE Server SHALL return a 401 response.
4. WHEN session verification succeeds, THE Polling_Page SHALL update the Auth_Header to display the user's name and enable voting, suggesting, and upvoting actions without showing the Auth_Modal.
5. WHEN session verification fails, THE Polling_Page SHALL display the Auth_Header with a "Sign In" link and disable voting, suggesting, and upvoting actions.

### Requirement 4: User Sign-Out

**User Story:** As a signed-in user, I want to sign out from the polling page, so that I can end my session.

#### Acceptance Criteria

1. WHILE a user is authenticated, THE Auth_Header SHALL display a "Sign Out" option next to the user's name.
2. WHEN the user clicks "Sign Out", THE Server SHALL clear the `user_token` cookie.
3. WHEN sign-out completes, THE Polling_Page SHALL update the Auth_Header to show the "Sign In" link and disable voting, suggesting, and upvoting actions.

### Requirement 5: Authentication Gate for Protected Actions

**User Story:** As a platform operator, I want to require authentication before users can vote, suggest, or upvote, so that actions are tied to identified users.

#### Acceptance Criteria

1. WHEN an unauthenticated visitor clicks a "Vote for This Product" button, THE Polling_Page SHALL open the Auth_Modal instead of the vote modal.
2. WHEN an unauthenticated visitor clicks the "Submit Suggestion" button, THE Polling_Page SHALL open the Auth_Modal instead of submitting the suggestion form.
3. WHEN an unauthenticated visitor clicks an upvote button on a suggestion, THE Polling_Page SHALL open the Auth_Modal instead of recording the upvote.
4. WHEN the user completes authentication through the Auth_Modal, THE Polling_Page SHALL automatically proceed with the action the user originally attempted.
5. THE Polling_Page SHALL continue to display all products and approved suggestions to unauthenticated visitors for browsing.

### Requirement 6: Auth Modal UI

**User Story:** As a visitor, I want a clear and accessible sign-in/register interface on the polling page, so that I can easily create an account or sign in.

#### Acceptance Criteria

1. THE Auth_Modal SHALL display two tabs: "Sign In" and "Register", with "Sign In" selected by default.
2. THE Sign_In_Form SHALL contain fields for email and password, and a "Sign In" submit button.
3. THE Registration_Form SHALL contain fields for full name, email, phone number, and password, and a "Register" submit button.
4. WHEN the Server returns a validation or authentication error, THE Auth_Modal SHALL display the error message below the relevant form.
5. WHILE a form submission is in progress, THE Auth_Modal SHALL disable the submit button and display a loading indicator.
6. THE Auth_Modal SHALL use the existing ChoosePure brand styling: Deep Leaf Green (#1F6B4E) for primary buttons, Pure Ivory (#FAFAF7) background, Inter font, and consistent border-radius and spacing matching the existing Polling_Page design.

### Requirement 7: Auto-Fill User Details in Forms

**User Story:** As a signed-in user, I want my name, email, and phone to be pre-filled in the vote modal and suggestion form, so that I do not have to re-enter my information.

#### Acceptance Criteria

1. WHILE a user is authenticated, THE Polling_Page SHALL pre-fill the vote modal's name, email, and phone fields with the Authenticated_User's stored details.
2. WHILE a user is authenticated, THE Polling_Page SHALL pre-fill the suggestion form's name and email fields with the Authenticated_User's stored details.
3. WHILE a user is authenticated, THE Polling_Page SHALL make the pre-filled name and email fields read-only in both the vote modal and suggestion form.
4. WHILE a user is authenticated, THE Polling_Page SHALL allow the user to edit the phone field in the vote modal if needed.

### Requirement 8: Server-Side Authentication Middleware for Public Endpoints

**User Story:** As a platform operator, I want the server to verify user authentication on vote, suggestion, and upvote endpoints, so that only authenticated users can perform these actions.

#### Acceptance Criteria

1. WHEN the Server receives a request to the vote creation endpoint (`POST /api/polls/vote`), THE Server SHALL verify the `user_token` cookie contains a valid JWT with `role: "user"` before processing the request.
2. WHEN the Server receives a request to the suggestion submission endpoint (`POST /api/suggestions`), THE Server SHALL verify the `user_token` cookie contains a valid JWT with `role: "user"` before processing the request.
3. WHEN the Server receives a request to the upvote endpoint (`POST /api/suggestions/:id/upvote`), THE Server SHALL verify the `user_token` cookie contains a valid JWT with `role: "user"` before processing the request.
4. IF the `user_token` cookie is missing or invalid on a protected endpoint, THEN THE Server SHALL return a 401 response with the message "Authentication required".
5. WHEN authentication succeeds on a protected endpoint, THE Server SHALL attach the authenticated user's ID and email to the request for use in downstream processing.

### Requirement 9: User Password Reset

**User Story:** As a registered user, I want to reset my password if I forget it, so that I can regain access to my account.

#### Acceptance Criteria

1. THE Sign_In_Form SHALL display a "Forgot Password?" link below the password field.
2. WHEN the user clicks "Forgot Password?", THE Auth_Modal SHALL display a password reset form with an email field and a "Send Reset Link" button.
3. WHEN the user submits a valid email, THE Server SHALL generate a JWT reset token with a 1-hour expiry, store it in the user's document in the Users_Collection, and send a password reset email to the user via Mailgun from `support@choosepure.in`.
4. THE Server SHALL always return a success response regardless of whether the email exists, to prevent email enumeration.
5. WHEN the user clicks the reset link in the email, THE Server SHALL serve a password reset page where the user can enter a new password.
6. WHEN the user submits a new password of at least 8 characters with a valid reset token, THE Server SHALL update the user's password hash in the Users_Collection and clear the reset token.
7. IF the reset token is expired or invalid, THEN THE Server SHALL return a 400 response indicating the token is invalid or expired.

### Requirement 10: Analytics Tracking for Auth Events

**User Story:** As a platform operator, I want authentication events tracked in analytics, so that I can measure registration and sign-in engagement.

#### Acceptance Criteria

1. WHEN a user completes registration, THE Polling_Page SHALL fire a "User Registered" event to GA4, Meta Pixel, and Mixpanel with the registration method.
2. WHEN a user completes sign-in, THE Polling_Page SHALL fire a "User Signed In" event to GA4, Meta Pixel, and Mixpanel.
3. WHEN a user signs out, THE Polling_Page SHALL fire a "User Signed Out" event to Mixpanel.
