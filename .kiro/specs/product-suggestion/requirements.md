# Requirements Document

## Introduction

This feature adds a product suggestion capability to the ChoosePure polling page. Users visiting the polling page can suggest a product they want independently tested. Suggestions are submitted via a form on the existing polling.html page and stored in a new MongoDB collection. Admins can view, review, and manage all submitted suggestions from the existing admin panel (admin.html) within the Product Polling section. Optionally, an admin can promote a suggestion into a polling product. The feature integrates with the existing Node.js/Express backend (api.choosepure.in), MongoDB Atlas database (choosepure_db), and the static frontend pages.

## Glossary

- **Polling_Page**: The existing public-facing page (polling.html) on choosepure.in where users view products available for voting and cast their votes.
- **Admin_Panel**: The existing authenticated admin interface (admin.html) used to manage the ChoosePure platform, protected by JWT authentication via the authenticateAdmin middleware.
- **Server**: The existing Node.js/Express backend running on Render (api.choosepure.in) that handles API requests.
- **Database**: The MongoDB Atlas instance (choosepure_db) used for persistent storage.
- **Suggestion**: A user-submitted request to have a specific product independently tested, containing the product name, a reason for testing, and the submitter's contact information.
- **Suggestion_Form**: The UI form on the Polling_Page where users enter product suggestion details.
- **Suggestions_Collection**: The MongoDB collection (`product_suggestions`) that stores all submitted product suggestions.

## Requirements

### Requirement 1: Product Suggestion Submission

**User Story:** As a user, I want to suggest a product for testing on the polling page, so that ChoosePure can consider testing products the community cares about.

#### Acceptance Criteria

1. WHEN a user visits the Polling_Page, THE Polling_Page SHALL display a Suggestion_Form section below the product grid with fields for product name, reason for suggesting, user name, user email, and user phone number.
2. WHEN the user submits the Suggestion_Form with all required fields filled, THE Server SHALL store the Suggestion in the Suggestions_Collection with the submitted details, a "pending" status, and a created timestamp.
3. IF the user submits the Suggestion_Form with a missing product name, THEN THE Polling_Page SHALL display a validation error indicating the product name is required.
4. IF the user submits the Suggestion_Form with a missing user name, THEN THE Polling_Page SHALL display a validation error indicating the name is required.
5. IF the user submits the Suggestion_Form with an invalid email format, THEN THE Polling_Page SHALL display a validation error indicating a valid email is required.
6. IF the user submits the Suggestion_Form with a phone number that is not exactly 10 digits, THEN THE Polling_Page SHALL display a validation error indicating a valid 10-digit phone number is required.
7. WHEN the Suggestion is stored successfully, THE Polling_Page SHALL display a success message confirming the suggestion was submitted.
8. IF the Server returns an error when storing the Suggestion, THEN THE Polling_Page SHALL display an error message indicating the submission failed and the user should try again.

### Requirement 2: Server-Side Suggestion Validation

**User Story:** As a platform operator, I want the server to validate suggestion submissions, so that only well-formed data is stored in the database.

#### Acceptance Criteria

1. WHEN the Server receives a suggestion submission, THE Server SHALL require product name, user name, user email, and user phone as mandatory fields.
2. IF the Server receives a suggestion with a missing required field, THEN THE Server SHALL return a 400 response identifying the missing fields.
3. IF the Server receives a suggestion with an email that does not match a valid email format, THEN THE Server SHALL return a 400 response indicating the email is invalid.
4. IF the Server receives a suggestion with a phone number that is not exactly 10 digits, THEN THE Server SHALL return a 400 response indicating the phone number is invalid.
5. WHEN all validation passes, THE Server SHALL store the Suggestion in the Suggestions_Collection with status set to "pending" and createdAt set to the current timestamp.

### Requirement 3: Admin View of Suggestions

**User Story:** As an admin, I want to see all product suggestions submitted by users, so that I can evaluate which products the community wants tested.

#### Acceptance Criteria

1. WHEN the admin navigates to the Product Polling section of the Admin_Panel, THE Admin_Panel SHALL display a "Product Suggestions" subsection listing all suggestions.
2. THE Admin_Panel SHALL display each Suggestion with the product name, reason, submitter name, submitter email, submitter phone, status, and submission date.
3. THE Admin_Panel SHALL sort suggestions by submission date in descending order, showing the most recent suggestions first.
4. THE Server SHALL provide an authenticated admin API endpoint that returns all suggestions from the Suggestions_Collection.

### Requirement 4: Admin Suggestion Status Management

**User Story:** As an admin, I want to update the status of a suggestion, so that I can track which suggestions have been reviewed, approved, or rejected.

#### Acceptance Criteria

1. THE Admin_Panel SHALL display a status indicator for each Suggestion showing one of: "pending", "reviewed", or "rejected".
2. WHEN the admin changes a Suggestion's status, THE Server SHALL update the Suggestion's status in the Suggestions_Collection and set an updatedAt timestamp.
3. IF the admin attempts to update the status of a Suggestion that does not exist, THEN THE Server SHALL return a 404 response indicating the suggestion was not found.

### Requirement 5: Admin Suggestion Deletion

**User Story:** As an admin, I want to delete a suggestion, so that I can remove spam or irrelevant submissions.

#### Acceptance Criteria

1. WHEN the admin clicks delete on a Suggestion, THE Admin_Panel SHALL display a confirmation prompt before proceeding.
2. WHEN the admin confirms deletion, THE Server SHALL remove the Suggestion from the Suggestions_Collection.
3. IF the admin attempts to delete a Suggestion that does not exist, THEN THE Server SHALL return a 404 response indicating the suggestion was not found.
4. WHEN the deletion is successful, THE Admin_Panel SHALL remove the Suggestion from the displayed list and show a success confirmation.
