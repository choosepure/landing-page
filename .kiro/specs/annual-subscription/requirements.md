# Requirements Document

## Introduction

ChoosePure currently offers a single Premium subscription plan at ₹299/month via Razorpay. This feature introduces an Annual Subscription Plan at ₹2,499/year (~30% savings over monthly billing) alongside the existing monthly plan. Users will be able to choose between monthly and annual billing when subscribing. The backend, frontend subscription modal, and landing page pricing section all need to support plan selection, and the user's subscription record must track which plan they are on. The refund policy differs by plan: pro-rata for annual, no refund for monthly.

## Glossary

- **Subscription_Service**: The backend API layer (Node.js/Express) that creates Razorpay subscriptions, verifies payments, and manages user subscription state in MongoDB.
- **Subscription_Modal**: The client-side modal on purity-wall.html that presents plan options and initiates the Razorpay checkout flow.
- **Pricing_Section**: The membership pricing cards on index.html that display Free vs Premium plan details.
- **Plan_Toggle**: A UI control within the Subscription_Modal and Pricing_Section that lets users switch between Monthly and Annual billing views.
- **User_Record**: The MongoDB document in the users collection that stores subscription status, plan type, and Razorpay subscription ID.
- **Subscription_Transaction**: The MongoDB document in the subscription_transactions collection that records each payment event.
- **Razorpay_Plan**: A billing plan object configured in Razorpay (one for monthly at ₹299, one for annual at ₹2,499).
- **Grace_Period**: A 3-day window after a failed recurring payment during which the user retains Premium access before being downgraded.
- **Invoice_Email**: An email sent to the user after each successful subscription charge containing payment details.

## Requirements

### Requirement 1: Plan Selection in Subscription Modal

**User Story:** As a user viewing the subscription modal, I want to choose between Monthly (₹299/month) and Annual (₹2,499/year) plans, so that I can pick the billing cycle that suits me.

#### Acceptance Criteria

1. WHEN the Subscription_Modal opens, THE Plan_Toggle SHALL display two options: "Monthly ₹299/month" and "Annual ₹2,499/year".
2. WHEN the Subscription_Modal opens, THE Plan_Toggle SHALL default to the Annual option as the pre-selected choice.
3. WHILE the Annual option is selected, THE Subscription_Modal SHALL display a "Save ~30%" badge adjacent to the annual price.
4. WHEN the user selects a plan option in the Plan_Toggle, THE Subscription_Modal SHALL update the subscribe button text to reflect the selected plan price.
5. WHEN the user clicks the subscribe button with the Monthly option selected, THE Subscription_Modal SHALL initiate the Razorpay checkout with the monthly Razorpay_Plan.
6. WHEN the user clicks the subscribe button with the Annual option selected, THE Subscription_Modal SHALL initiate the Razorpay checkout with the annual Razorpay_Plan.

### Requirement 2: Landing Page Pricing Display

**User Story:** As a visitor on the landing page, I want to see both Monthly and Annual pricing options, so that I understand the value of the annual plan before signing up.

#### Acceptance Criteria

1. THE Pricing_Section SHALL display the Premium card with a Plan_Toggle showing both Monthly (₹299/month) and Annual (₹2,499/year) options.
2. WHILE the Annual option is selected in the Pricing_Section Plan_Toggle, THE Pricing_Section SHALL display the annual price (₹2,499/year) and a "Save ~30%" badge.
3. WHILE the Monthly option is selected in the Pricing_Section Plan_Toggle, THE Pricing_Section SHALL display the monthly price (₹299/month) without a savings badge.

### Requirement 3: Backend Plan Selection on Order Creation

**User Story:** As a subscribing user, I want the backend to create the correct Razorpay subscription based on my chosen plan, so that I am billed at the correct amount and interval.

#### Acceptance Criteria

1. WHEN the Subscription_Service receives a create-order request with plan parameter set to "monthly", THE Subscription_Service SHALL create a Razorpay subscription using the RAZORPAY_PLAN_ID environment variable.
2. WHEN the Subscription_Service receives a create-order request with plan parameter set to "annual", THE Subscription_Service SHALL create a Razorpay subscription using the RAZORPAY_ANNUAL_PLAN_ID environment variable.
3. IF the Subscription_Service receives a create-order request with a plan parameter value other than "monthly" or "annual", THEN THE Subscription_Service SHALL return a 400 status with an error message "Invalid plan type".
4. IF the Subscription_Service receives a create-order request without a plan parameter, THEN THE Subscription_Service SHALL default to the "monthly" plan for backward compatibility.

### Requirement 4: User Record Plan Tracking

**User Story:** As a system operator, I want each user's subscription record to track which plan they are on, so that billing, renewals, and support queries reference the correct plan.

#### Acceptance Criteria

1. WHEN the Subscription_Service verifies a successful payment for a monthly plan, THE Subscription_Service SHALL set the User_Record subscriptionPlan field to "monthly".
2. WHEN the Subscription_Service verifies a successful payment for an annual plan, THE Subscription_Service SHALL set the User_Record subscriptionPlan field to "annual".
3. WHEN the Subscription_Service verifies a successful payment, THE Subscription_Transaction SHALL include a plan field recording "monthly" or "annual".
4. WHEN the Subscription_Service verifies a successful payment for a monthly plan, THE Subscription_Transaction SHALL record the amount as 299.
5. WHEN the Subscription_Service verifies a successful payment for an annual plan, THE Subscription_Transaction SHALL record the amount as 2499.

### Requirement 5: Grace Period on Failed Payments

**User Story:** As a subscribed user whose payment fails on renewal, I want a 3-day grace period before losing Premium access, so that I have time to update my payment method.

#### Acceptance Criteria

1. WHEN the Subscription_Service receives a subscription.charged webhook event that fails, THE Subscription_Service SHALL set a graceDeadline on the User_Record to 3 calendar days from the failure timestamp.
2. WHILE the current date is before the graceDeadline on the User_Record, THE Subscription_Service SHALL continue to treat the user as "subscribed" for access control purposes.
3. WHEN the current date passes the graceDeadline and no successful payment has been received, THE Subscription_Service SHALL update the User_Record subscriptionStatus to "expired".
4. WHEN a successful payment is received during the Grace_Period, THE Subscription_Service SHALL remove the graceDeadline from the User_Record and maintain subscriptionStatus as "subscribed".

### Requirement 6: Invoice Email After Each Charge

**User Story:** As a subscribed user, I want to receive an invoice email after each successful charge, so that I have a record of my payments.

#### Acceptance Criteria

1. WHEN the Subscription_Service processes a successful subscription.charged webhook event, THE Subscription_Service SHALL send an Invoice_Email to the user's registered email address.
2. THE Invoice_Email SHALL include the payment amount, payment date, plan type (Monthly or Annual), Razorpay payment ID, and next billing date.
3. IF the Invoice_Email fails to send, THEN THE Subscription_Service SHALL log the failure without affecting the subscription activation.

### Requirement 7: Refund Policy Differentiation

**User Story:** As a user requesting a refund, I want the refund policy to reflect my plan type, so that annual subscribers receive pro-rata refunds and monthly subscribers understand that no refund applies.

#### Acceptance Criteria

1. THE Subscription_Service SHALL enforce a no-refund policy for monthly plan subscriptions.
2. WHEN an annual plan subscriber requests a refund, THE Subscription_Service SHALL calculate a pro-rata refund based on the number of unused full months remaining in the annual billing cycle.
3. THE refund-policy.html page SHALL document both the monthly no-refund policy and the annual pro-rata refund policy.

### Requirement 8: Razorpay Annual Plan Configuration

**User Story:** As a system operator, I want a separate Razorpay plan configured for annual billing, so that the system can create annual subscriptions through the Razorpay API.

#### Acceptance Criteria

1. THE Subscription_Service SHALL read the annual plan ID from the RAZORPAY_ANNUAL_PLAN_ID environment variable.
2. WHEN the RAZORPAY_ANNUAL_PLAN_ID environment variable is not set, THE Subscription_Service SHALL log a warning at startup indicating that annual subscriptions are unavailable.
3. WHEN a user attempts to subscribe to the annual plan and RAZORPAY_ANNUAL_PLAN_ID is not configured, THE Subscription_Service SHALL return a 503 status with the message "Annual plan is currently unavailable".

### Requirement 9: Subscription Modal Plan-Aware Text

**User Story:** As a user going through the checkout flow, I want all modal text and button labels to reflect my selected plan, so that I am confident about what I am purchasing.

#### Acceptance Criteria

1. WHILE the Monthly option is selected, THE Subscription_Modal SHALL display the subscribe button as "Subscribe for ₹299/month".
2. WHILE the Annual option is selected, THE Subscription_Modal SHALL display the subscribe button as "Subscribe for ₹2,499/year".
3. WHILE the Monthly option is selected, THE Subscription_Modal SHALL display the note text as "MONTHLY ACCESS • CANCEL ANYTIME".
4. WHILE the Annual option is selected, THE Subscription_Modal SHALL display the note text as "ANNUAL ACCESS • SAVE ~30%".
5. WHEN a payment is cancelled or fails during checkout, THE Subscription_Modal SHALL restore the subscribe button text matching the currently selected plan option.

### Requirement 10: User Profile Plan Visibility

**User Story:** As a subscribed user, I want to see which plan I am on (Monthly or Annual) in my profile and header area, so that I know my current billing arrangement.

#### Acceptance Criteria

1. WHEN the Subscription_Service returns user profile data via the /api/user/me endpoint, THE Subscription_Service SHALL include the subscriptionPlan field in the response.
2. WHILE a user is subscribed, THE purity-wall.html header area SHALL display the user's current plan type (Monthly or Annual) alongside the subscription status.
