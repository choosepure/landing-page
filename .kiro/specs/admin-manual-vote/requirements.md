# Requirements Document

## Introduction

This feature adds the ability for authenticated admins to manually cast votes for any active product directly from the Admin_Panel without requiring a Razorpay payment. This supports scenarios such as offline payments, promotional vote grants, corrections, or community engagement campaigns. The manual vote bypasses the existing Razorpay payment flow but still records a Vote_Transaction in the Database for full auditability. The feature integrates with the existing Node.js/Express backend (api.choosepure.in), the Admin_Panel (admin.html), and the MongoDB Atlas database (choosepure_db), following the same patterns established by the product-polling-payment feature.

## Glossary

- **Admin_Panel**: The existing authenticated admin interface (admin.html) used to manage the ChoosePure platform, protected by JWT-based authentication via the `authenticateAdmin` middleware.
- **Server**: The existing Node.js/Express backend running on Render (api.choosepure.in) that handles API requests.
- **Database**: The MongoDB Atlas instance (choosepure_db) used for persistent storage.
- **Product**: A packaged food item stored in the `products` collection that is available for community voting.
- **Vote_Transaction**: A record in the `vote_transactions` collection capturing a vote submission, including the product voted for, number of votes, voter details, and metadata.
- **Manual_Vote**: A vote cast by an admin on behalf of a user without requiring Razorpay payment processing. The transaction is recorded with a zero payment amount and flagged as an admin-initiated manual vote.

## Requirements

### Requirement 1: Admin Manual Vote Form

**User Story:** As an admin, I want to see a manual vote form in the Polling section of the Admin Panel, so that I can cast votes for a product on behalf of a user without payment.

#### Acceptance Criteria

1. WHEN the admin navigates to the Polling tab in the Admin_Panel, THE Admin_Panel SHALL display a "Cast Manual Vote" form within the Product Polling section.
2. THE Admin_Panel SHALL provide a product selector in the manual vote form that lists all active products by name.
3. THE Admin_Panel SHALL provide a vote count input field that accepts integer values between 1 and 50.
4. THE Admin_Panel SHALL provide input fields for the voter's name, email address, and phone number.
5. THE Admin_Panel SHALL provide an optional "Reason" text field for the admin to document why the manual vote is being cast.

### Requirement 2: Manual Vote Form Validation

**User Story:** As an admin, I want the manual vote form to validate my inputs before submission, so that I do not accidentally submit incomplete or invalid data.

#### Acceptance Criteria

1. IF the admin submits the manual vote form without selecting a product, THEN THE Admin_Panel SHALL display a validation error stating that a product selection is required.
2. IF the admin submits the manual vote form with a vote count outside the range of 1 to 50, THEN THE Admin_Panel SHALL display a validation error stating that the vote count must be between 1 and 50.
3. IF the admin submits the manual vote form without providing a voter name, THEN THE Admin_Panel SHALL display a validation error stating that the voter name is required.
4. IF the admin submits the manual vote form with an email address that does not match a valid email format, THEN THE Admin_Panel SHALL display a validation error for the email field.
5. IF the admin submits the manual vote form with a phone number that is not exactly 10 digits, THEN THE Admin_Panel SHALL display a validation error for the phone field.

### Requirement 3: Server-Side Manual Vote Processing

**User Story:** As an admin, I want the server to process manual votes securely, so that votes are recorded accurately and only authorized admins can cast them.

#### Acceptance Criteria

1. THE Server SHALL expose a POST endpoint at `/api/admin/polls/manual-vote` protected by the `authenticateAdmin` middleware.
2. WHEN the Server receives a valid manual vote request, THE Server SHALL create a Vote_Transaction record in the Database containing the product ID, product name, voter name, voter email, voter phone, vote count, a zero amount, the admin identifier, the reason (if provided), an `isManualVote` flag set to true, a status of "completed", and a creation timestamp.
3. WHEN the Server successfully creates the Vote_Transaction record, THE Server SHALL increment the Product's `totalVotes` field by the submitted vote count.
4. WHEN the manual vote is processed successfully, THE Server SHALL return a success response containing the updated total vote count for the product.
5. IF the Server receives a manual vote request with missing or invalid fields, THEN THE Server SHALL return a descriptive validation error identifying the invalid fields without modifying vote counts.
6. IF the Server receives a manual vote request for a product that does not exist or is inactive, THEN THE Server SHALL return an error response stating that the product was not found or is not active.

### Requirement 4: Manual Vote Confirmation and Feedback

**User Story:** As an admin, I want to see confirmation after casting a manual vote, so that I know the vote was recorded successfully.

#### Acceptance Criteria

1. WHEN the Server returns a success response for a manual vote, THE Admin_Panel SHALL display a success message showing the number of votes cast and the product name.
2. WHEN the Server returns a success response for a manual vote, THE Admin_Panel SHALL refresh the products list and the vote transactions list to reflect the updated data.
3. WHEN the Server returns a success response for a manual vote, THE Admin_Panel SHALL clear the manual vote form fields.
4. IF the Server returns an error response for a manual vote, THEN THE Admin_Panel SHALL display the error message returned by the Server.

### Requirement 5: Manual Vote Identification in Transaction History

**User Story:** As an admin, I want to distinguish manual votes from paid votes in the transaction history, so that I can track which votes were cast manually.

#### Acceptance Criteria

1. WHEN the admin views the vote transactions list in the Admin_Panel, THE Admin_Panel SHALL display a visual indicator (such as a badge or label) on transactions that were cast as manual votes.
2. THE Server SHALL include the `isManualVote` flag and the `reason` field when returning vote transaction records to the Admin_Panel.
3. WHEN a manual vote transaction includes a reason, THE Admin_Panel SHALL display the reason text alongside the transaction record.

### Requirement 6: Manual Vote Summary Statistics

**User Story:** As an admin, I want the polling summary statistics to accurately reflect manual votes, so that I have a complete picture of all voting activity.

#### Acceptance Criteria

1. THE Server SHALL include manual vote transactions in the total votes count returned in the polling summary statistics.
2. THE Server SHALL NOT include manual vote transactions (which have zero amount) in the total revenue calculation, so that revenue figures reflect only paid transactions.
