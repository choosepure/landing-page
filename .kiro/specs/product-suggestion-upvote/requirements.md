# Requirements Document

## Introduction

This feature adds a product suggestion and upvoting capability to the ChoosePure polling page (polling.html). Users visiting the polling page can suggest a product they want independently tested by providing a product name, category/type, and reason. Submitted suggestions are displayed publicly on the polling page so other users can see and upvote them (no payment required, simple one-click upvote). Admins can view all suggestions with upvote counts in the existing admin panel (admin.html), manage suggestion statuses (approve/reject), and convert approved suggestions into actual poll products. The feature integrates with the existing Node.js/Express backend (api.choosepure.in), MongoDB Atlas database (choosepure_db), and the static frontend pages hosted on Vercel.

## Glossary

- **Polling_Page**: The existing public-facing page (polling.html) on choosepure.in where users view products available for voting and cast their votes.
- **Admin_Panel**: The existing authenticated admin interface (admin.html) used to manage the ChoosePure platform, protected by JWT authentication via the authenticateAdmin middleware.
- **Server**: The existing Node.js/Express backend running on Render (api.choosepure.in) that handles API requests.
- **Database**: The MongoDB Atlas instance (choosepure_db) used for persistent storage.
- **Suggestion**: A user-submitted request to have a specific product independently tested, containing the product name, category, reason for testing, and the submitter's basic information.
- **Suggestion_Form**: The UI form on the Polling_Page where users enter product suggestion details.
- **Suggestions_Collection**: The MongoDB collection (`product_suggestions`) that stores all submitted product suggestions.
- **Upvote**: A single unit of support cast by a user for a Suggestion, tracked by browser fingerprint to limit duplicate upvotes. No payment is required.
- **Category**: A text label describing the type of product being suggested (e.g., "Milk", "Ghee", "Honey", "Baby Food").

## Requirements

### Requirement 1: Product Suggestion Submission

**User Story:** As a user, I want to suggest a product for testing on the polling page, so that ChoosePure can consider testing products the community cares about.

#### Acceptance Criteria

1. WHEN a user visits the Polling_Page, THE Polling_Page SHALL display a "Suggest a Product" section below the product voting grid with a Suggestion_Form containing fields for product name, category/type, reason for suggesting, user name, and user email.
2. WHEN the user submits the Suggestion_Form with all required fields filled, THE Server SHALL store the Suggestion in the Suggestions_Collection with the submitted details, an upvote count of zero, a "pending" status, and a createdAt timestamp.
3. IF the user submits the Suggestion_Form with a missing product name, THEN THE Polling_Page SHALL display a validation error indicating the product name is required.
4. IF the user submits the Suggestion_Form with a missing user name, THEN THE Polling_Page SHALL display a validation error indicating the name is required.
5. IF the user submits the Suggestion_Form with an invalid email format, THEN THE Polling_Page SHALL display a validation error indicating a valid email is required.
6. WHEN the Suggestion is stored successfully, THE Polling_Page SHALL display a success message confirming the suggestion was submitted and refresh the suggestions list.
7. IF the Server returns an error when storing the Suggestion, THEN THE Polling_Page SHALL display an error message indicating the submission failed and the user should try again.

### Requirement 2: Server-Side Suggestion Validation

**User Story:** As a platform operator, I want the server to validate suggestion submissions, so that only well-formed data is stored in the database.

#### Acceptance Criteria

1. WHEN the Server receives a suggestion submission, THE Server SHALL require product name, category, user name, and user email as mandatory fields.
2. IF the Server receives a suggestion with a missing required field, THEN THE Server SHALL return a 400 response identifying the missing fields.
3. IF the Server receives a suggestion with an email that does not match a valid email format, THEN THE Server SHALL return a 400 response indicating the email is invalid.
4. WHEN all validation passes, THE Server SHALL store the Suggestion in the Suggestions_Collection with status set to "pending", upvotes set to 0, and createdAt set to the current timestamp.

### Requirement 3: Public Suggestions Display

**User Story:** As a user, I want to see product suggestions from other users, so that I can discover what the community wants tested and support those ideas.

#### Acceptance Criteria

1. WHEN a user visits the Polling_Page, THE Polling_Page SHALL display a list of approved suggestions below the Suggestion_Form, showing each suggestion's product name, category, reason, submitter first name, upvote count, and submission date.
2. THE Server SHALL provide a public API endpoint that returns all suggestions with status "approved", sorted by upvote count in descending order.
3. WHILE a Suggestion has a "pending" or "rejected" status, THE Polling_Page SHALL NOT display that Suggestion to users.
4. WHEN the suggestions list is loading, THE Polling_Page SHALL display a loading indicator.
5. IF the Server returns an error when fetching suggestions, THEN THE Polling_Page SHALL display a user-friendly error message.

### Requirement 4: Suggestion Upvoting

**User Story:** As a user, I want to upvote product suggestions from other users, so that popular product requests rise to the top and get noticed by the ChoosePure team.

#### Acceptance Criteria

1. THE Polling_Page SHALL display an upvote button next to each approved Suggestion.
2. WHEN a user clicks the upvote button on a Suggestion, THE Server SHALL increment the Suggestion's upvote count by one in the Suggestions_Collection.
3. WHEN the upvote is recorded successfully, THE Polling_Page SHALL update the displayed upvote count for that Suggestion without a full page reload.
4. THE Polling_Page SHALL store a record of upvoted suggestion IDs in the browser's localStorage to visually indicate which suggestions the current user has already upvoted.
5. WHILE a Suggestion's ID exists in the browser's localStorage upvote record, THE Polling_Page SHALL display the upvote button in a visually distinct "already upvoted" state.
6. IF the Server returns an error when recording the upvote, THEN THE Polling_Page SHALL display a brief error notification and revert the upvote count display.

### Requirement 5: Admin View of Suggestions

**User Story:** As an admin, I want to see all product suggestions with their upvote counts, so that I can evaluate which products the community wants tested.

#### Acceptance Criteria

1. WHEN the admin navigates to the Product Polling section of the Admin_Panel, THE Admin_Panel SHALL display a "Product Suggestions" subsection listing all suggestions regardless of status.
2. THE Admin_Panel SHALL display each Suggestion with the product name, category, reason, submitter name, submitter email, status, upvote count, and submission date.
3. THE Admin_Panel SHALL sort suggestions by submission date in descending order, showing the most recent suggestions first.
4. THE Server SHALL provide an authenticated admin API endpoint that returns all suggestions from the Suggestions_Collection.

### Requirement 6: Admin Suggestion Status Management

**User Story:** As an admin, I want to approve or reject suggestions, so that I can control which suggestions are visible to the public and track review progress.

#### Acceptance Criteria

1. THE Admin_Panel SHALL display a status indicator for each Suggestion showing one of: "pending", "approved", or "rejected".
2. WHEN the admin changes a Suggestion's status to "approved", THE Server SHALL update the Suggestion's status in the Suggestions_Collection and set an updatedAt timestamp, making the Suggestion visible on the Polling_Page.
3. WHEN the admin changes a Suggestion's status to "rejected", THE Server SHALL update the Suggestion's status in the Suggestions_Collection and set an updatedAt timestamp, hiding the Suggestion from the Polling_Page.
4. IF the admin attempts to update the status of a Suggestion that does not exist, THEN THE Server SHALL return a 404 response indicating the suggestion was not found.

### Requirement 7: Admin Suggestion Deletion

**User Story:** As an admin, I want to delete a suggestion, so that I can remove spam or irrelevant submissions.

#### Acceptance Criteria

1. WHEN the admin clicks delete on a Suggestion, THE Admin_Panel SHALL display a confirmation prompt before proceeding.
2. WHEN the admin confirms deletion, THE Server SHALL remove the Suggestion from the Suggestions_Collection.
3. IF the admin attempts to delete a Suggestion that does not exist, THEN THE Server SHALL return a 404 response indicating the suggestion was not found.
4. WHEN the deletion is successful, THE Admin_Panel SHALL remove the Suggestion from the displayed list and show a success confirmation.

### Requirement 8: Convert Suggestion to Poll Product

**User Story:** As an admin, I want to convert an approved suggestion into an actual poll product, so that the community can start voting and funding the testing of that product.

#### Acceptance Criteria

1. THE Admin_Panel SHALL display a "Convert to Product" button for each Suggestion with "approved" status.
2. WHEN the admin clicks "Convert to Product", THE Admin_Panel SHALL display a form pre-filled with the suggestion's product name and category, and additional fields for image URL, description, and minimum amount per vote.
3. WHEN the admin submits the conversion form with valid data, THE Server SHALL create a new Product in the products collection using the provided details, with an initial vote count of zero and active status.
4. WHEN the Product is created successfully from a Suggestion, THE Server SHALL update the Suggestion's status to "converted" in the Suggestions_Collection.
5. WHILE a Suggestion has a "converted" status, THE Admin_Panel SHALL display the Suggestion with a "converted" badge and disable the "Convert to Product" button.
6. IF the conversion form is submitted with missing required fields, THEN THE Server SHALL return a 400 response identifying the missing fields.
