# Requirements Document

## Introduction

This feature introduces a referral program for the ChoosePure web application to drive subscription growth through a referral loop. Each registered user receives a unique referral code (format: CP-XXXX). When a new user signs up using a referral code and subscribes, both the referrer and the referee receive one free month of subscription. The referral dashboard on the purity wall page provides visibility into referral activity and earned rewards.

## Glossary

- **Referral_System**: The backend module responsible for generating referral codes, tracking referral relationships, validating referral eligibility, and granting rewards.
- **Referral_Dashboard**: The frontend UI section on the purity wall page that displays referral statistics and the user's referral code/link.
- **Referrer**: A registered ChoosePure user who shares a referral code or link to invite new users.
- **Referee**: A new user who signs up using a referral code or link.
- **Referral_Code**: A unique alphanumeric identifier in the format CP-XXXX assigned to each registered user (where XXXX is 4 uppercase alphanumeric characters).
- **Referral_Link**: A URL in the format `https://choosepure.in/signup?ref=CP-XXXX` that pre-fills the referral code during signup.
- **Reward**: One free month of subscription credit granted to both the referrer and referee upon the referee's first subscription activation.
- **Free_Month**: A stackable subscription credit that extends the user's subscription expiry date by one calendar month.
- **Subscription_Expiry**: The date on which a user's subscription access ends, extended by free months when rewards are granted.

## Requirements

### Requirement 1: Referral Code Generation

**User Story:** As a registered user, I want a unique referral code automatically assigned to my account, so that I can share it with others to invite them to ChoosePure.

#### Acceptance Criteria

1. WHEN a new user completes registration, THE Referral_System SHALL generate a unique Referral_Code in the format CP-XXXX (where XXXX consists of 4 uppercase alphanumeric characters) and store it in the user's document.
2. THE Referral_System SHALL ensure each generated Referral_Code is unique across all users in the database.
3. IF a Referral_Code collision occurs during generation, THEN THE Referral_System SHALL regenerate the code until a unique code is produced.
4. WHEN a registered user who does not have a Referral_Code logs in, THE Referral_System SHALL generate and assign a Referral_Code to that user (backfill for existing users).

### Requirement 2: Referral Link and Sharing

**User Story:** As a registered user, I want a shareable referral link, so that I can easily invite friends to sign up for ChoosePure.

#### Acceptance Criteria

1. THE Referral_Dashboard SHALL display the user's Referral_Code and the corresponding Referral_Link in the format `https://choosepure.in/signup?ref={referral_code}`.
2. WHEN the user clicks the copy button next to the Referral_Link, THE Referral_Dashboard SHALL copy the Referral_Link to the clipboard and display a confirmation message.
3. WHEN a visitor opens a Referral_Link, THE Referral_System SHALL extract the referral code from the `ref` query parameter and pre-fill it in the signup form.

### Requirement 3: Referral Code Application During Signup

**User Story:** As a new user signing up via a referral link, I want the referral code to be applied to my account, so that both the referrer and I can earn rewards when I subscribe.

#### Acceptance Criteria

1. WHEN a new user submits the registration form with a valid Referral_Code, THE Referral_System SHALL store the referrer's user ID in the referee's `referred_by` field.
2. WHEN a new user submits the registration form with a valid Referral_Code, THE Referral_System SHALL create a referral record with status "pending" linking the referrer and referee.
3. IF a new user submits a Referral_Code that does not match any existing user, THEN THE Referral_System SHALL reject the referral code and return an error message "Invalid referral code".
4. IF a new user submits a Referral_Code that belongs to the same email or phone number being registered, THEN THE Referral_System SHALL reject the referral code and return an error message "Cannot use own referral code".
5. THE Referral_System SHALL allow registration to proceed without a Referral_Code (the referral code field is optional).

### Requirement 4: Reward Triggering on Subscription Activation

**User Story:** As a referrer, I want to receive a free month of subscription when my referred user subscribes, so that I am rewarded for bringing new subscribers.

#### Acceptance Criteria

1. WHEN a referee's subscription payment is verified successfully AND the referee has a "pending" referral record, THE Referral_System SHALL update the referral record status from "pending" to "completed" and set `reward_granted` to true.
2. WHEN a referral record status changes to "completed", THE Referral_System SHALL create a reward record for the referrer with `reward_type` "referral", `months` 1, and `source` set to the referee's user ID.
3. WHEN a referral record status changes to "completed", THE Referral_System SHALL create a reward record for the referee with `reward_type` "referral_signup", `months` 1, and `source` set to the referrer's user ID.
4. WHEN a reward record is created for a user, THE Referral_System SHALL extend the user's Subscription_Expiry by one calendar month.
5. IF the referee's referral record already has status "completed", THEN THE Referral_System SHALL not grant duplicate rewards.

### Requirement 5: Free Month Stacking

**User Story:** As a user who has earned multiple referral rewards, I want my free months to stack, so that my subscription is extended by the total number of free months earned.

#### Acceptance Criteria

1. WHEN a user earns multiple Free_Month rewards, THE Referral_System SHALL add each Free_Month to the user's Subscription_Expiry cumulatively.
2. THE Referral_System SHALL store the total count of free months earned in the user's document as `freeMonthsEarned`.
3. WHEN the Subscription_Expiry is extended, THE Referral_System SHALL calculate the new expiry date by adding one month to the current Subscription_Expiry date (not the current date).

### Requirement 6: Referral Dashboard

**User Story:** As a registered user, I want to see my referral statistics on the purity wall dashboard, so that I can track my referral activity and rewards.

#### Acceptance Criteria

1. THE Referral_Dashboard SHALL display the total number of users invited by the referrer (total referral records).
2. THE Referral_Dashboard SHALL display the number of successful subscriptions from referrals (referral records with status "completed").
3. THE Referral_Dashboard SHALL display the total number of Free_Months earned by the user.
4. THE Referral_Dashboard SHALL display the number of pending referrals (referral records with status "pending").
5. WHEN the user has zero referrals, THE Referral_Dashboard SHALL display a prompt encouraging the user to share the Referral_Link.

### Requirement 7: Abuse Prevention

**User Story:** As a platform operator, I want to prevent abuse of the referral program, so that rewards are only granted for legitimate referrals.

#### Acceptance Criteria

1. THE Referral_System SHALL allow a referee to use only one Referral_Code during signup (no multiple referral codes per account).
2. THE Referral_System SHALL reject a Referral_Code during signup if the email address is already registered in the users collection.
3. THE Referral_System SHALL reject a Referral_Code during signup if the phone number is already registered in the users collection.
4. IF a user attempts to register with a phone number that matches an existing user's phone number, THEN THE Referral_System SHALL return an error message "This phone number is already registered".
5. THE Referral_System SHALL grant referral rewards only once per referee (one reward per referrer-referee pair).

### Requirement 8: Referral Data Model

**User Story:** As a developer, I want a well-defined data model for referrals and rewards, so that referral tracking and reward granting are reliable and queryable.

#### Acceptance Criteria

1. THE Referral_System SHALL store referral records in a `referrals` collection with fields: `referrer_user_id` (ObjectId), `referee_user_id` (ObjectId), `status` (string: "pending" or "completed"), `reward_granted` (boolean), `created_at` (Date), and `completed_at` (Date or null).
2. THE Referral_System SHALL store reward records in a `rewards` collection with fields: `user_id` (ObjectId), `reward_type` (string), `months` (number), `source` (ObjectId referencing the other party), and `created_at` (Date).
3. THE Referral_System SHALL add `referral_code` (string) and `referred_by` (ObjectId or null) fields to user documents in the `users` collection.
4. THE Referral_System SHALL create a unique index on the `referral_code` field in the `users` collection.
5. THE Referral_System SHALL create an index on `referrer_user_id` in the `referrals` collection for efficient dashboard queries.
6. THE Referral_System SHALL create an index on `referee_user_id` in the `referrals` collection for efficient reward lookup.

### Requirement 9: Admin Referral Visibility

**User Story:** As an admin, I want to view referral program activity, so that I can monitor program health and detect abuse.

#### Acceptance Criteria

1. WHEN an admin requests the referral overview, THE Referral_System SHALL return the total number of referral records, the count of completed referrals, and the total free months granted.
2. WHEN an admin requests the referral list, THE Referral_System SHALL return referral records with referrer name, referee name, status, reward status, and creation date.
