# Requirements Document

## Introduction

The Product Purity Wall is a subscription-gated page on ChoosePure (choosepure.in) that displays lab-tested product results as a grid of product cards. Non-subscribed users see one unlocked card and the rest blurred/locked, with a persuasive modal prompting them to subscribe at ₹299 via Razorpay. Subscribed users see all results unlocked with filters, status badges, and access to deep-dive report pages with expert commentary and PDF downloads. An admin interface allows managing test reports, scores, and commentary.

## Glossary

- **Purity_Wall**: The public-facing page that displays a grid of product cards with lab test results, accessible at `/purity-wall`
- **Product_Card**: A UI component displaying a product's image, brand name, category, and purity score
- **Purity_Score**: A numeric rating from 0 to 10 (one decimal) representing the lab test result for a product
- **Locked_Card**: A Product_Card where the Purity_Score is blurred and detailed data is inaccessible to non-subscribed users
- **Unlocked_Card**: A Product_Card where the Purity_Score and full lab analysis are visible
- **Subscription_Modal**: A modal dialog shown when a non-subscribed user clicks a Locked_Card, prompting payment
- **Deep_Dive_Page**: A detailed report page for a single product showing test parameter breakdowns, expert commentary, and PDF download
- **Test_Report**: A data record containing a product's lab test parameters, Purity_Score, status badges, and expert commentary
- **Status_Badge**: A label on a Product_Card indicating recency or alert level (e.g., "Recent Test", "Top Rated", "Alert: High Lead Found")
- **Subscription_Status**: A field on the User document with values `free` or `subscribed`
- **Admin_Panel**: The existing admin interface at `admin.html` extended with test report management capabilities
- **API_Server**: The Node.js/Express backend at `api.choosepure.in` serving all endpoints
- **User**: A registered individual with an account in the users collection, authenticated via JWT cookie
- **Visitor**: An unauthenticated individual browsing the Purity_Wall

## Requirements

### Requirement 1: Display Product Purity Wall Grid

**User Story:** As a visitor, I want to see a grid of lab-tested product cards, so that I can browse available purity results at a glance.

#### Acceptance Criteria

1. WHEN a visitor navigates to the Purity_Wall page, THE API_Server SHALL return a list of published Test_Reports ordered by creation date (newest first)
2. THE Purity_Wall SHALL render each Test_Report as a Product_Card displaying the product image, brand name, and category
3. THE Purity_Wall SHALL display Product_Cards in a responsive grid layout with a minimum card width of 300px
4. WHEN no published Test_Reports exist, THE Purity_Wall SHALL display an empty state message indicating no results are available yet

### Requirement 2: Non-Subscribed User Card Locking

**User Story:** As a non-subscribed user, I want to see the first product card unlocked and the rest locked, so that I get a preview of the data quality before subscribing.

#### Acceptance Criteria

1. WHEN a non-subscribed User or Visitor views the Purity_Wall, THE Purity_Wall SHALL display the first Product_Card as an Unlocked_Card with the Purity_Score visible and a "View Full Lab Analysis" button
2. WHEN a non-subscribed User or Visitor views the Purity_Wall, THE Purity_Wall SHALL display all Product_Cards after the first as Locked_Cards with the product image visible but the Purity_Score blurred and a 🔒 icon overlay
3. WHEN a non-subscribed User or Visitor views the Purity_Wall, THE Purity_Wall SHALL display the header text "See how your milk compares"
4. WHEN a non-subscribed User or Visitor views the Purity_Wall, THE Purity_Wall SHALL display filter and search controls in a disabled (grayed out) state

### Requirement 3: Subscription Prompt Modal

**User Story:** As a non-subscribed user, I want to see a compelling reason to subscribe when I click a locked card, so that I understand the value of the data behind the paywall.

#### Acceptance Criteria

1. WHEN a non-subscribed User clicks a Locked_Card, THE Purity_Wall SHALL display the Subscription_Modal
2. THE Subscription_Modal SHALL display a risk-based prompt containing the locked product's brand name, the number of contaminants found in that category, and a social proof count of existing subscribers
3. THE Subscription_Modal SHALL display an "Unlock Now for ₹299" call-to-action button
4. WHEN a Visitor (not logged in) clicks the "Unlock Now for ₹299" button, THE Purity_Wall SHALL prompt the Visitor to sign in or register before proceeding to payment
5. WHEN a logged-in non-subscribed User clicks the "Unlock Now for ₹299" button, THE Purity_Wall SHALL initiate the Razorpay payment flow

### Requirement 4: Subscription Payment via Razorpay

**User Story:** As a non-subscribed user, I want to pay ₹299 to unlock all product data, so that I can access the full purity results for my family's safety.

#### Acceptance Criteria

1. WHEN a User initiates a subscription payment, THE API_Server SHALL create a Razorpay order for ₹299 (29900 paise) with the User's email and name as prefill data
2. WHEN Razorpay returns a successful payment response, THE API_Server SHALL verify the payment signature using HMAC-SHA256 with the Razorpay webhook secret
3. WHEN payment verification succeeds, THE API_Server SHALL update the User's Subscription_Status from `free` to `subscribed` and record the payment transaction details (Razorpay order ID, payment ID, amount, timestamp)
4. WHEN payment verification succeeds, THE Purity_Wall SHALL reload to show the subscribed user view without requiring a manual page refresh
5. IF payment verification fails, THEN THE API_Server SHALL return an error response and the User's Subscription_Status SHALL remain `free`
6. IF the Razorpay checkout is dismissed or cancelled by the User, THEN THE Purity_Wall SHALL display a cancellation message and the Subscription_Modal SHALL remain accessible

### Requirement 5: Subscribed User Full Access View

**User Story:** As a subscribed user, I want to see all product scores and filters unlocked, so that I can explore and compare products freely.

#### Acceptance Criteria

1. WHEN a subscribed User views the Purity_Wall, THE Purity_Wall SHALL display all Product_Cards as Unlocked_Cards with Purity_Scores visible
2. WHEN a subscribed User views the Purity_Wall, THE Purity_Wall SHALL display Status_Badges on each Product_Card where applicable (e.g., "Recent Test", "Top Rated", "Alert: High Lead Found")
3. WHEN a subscribed User views the Purity_Wall, THE Purity_Wall SHALL display the header text "Your Purity Dashboard"
4. WHEN a subscribed User views the Purity_Wall, THE Purity_Wall SHALL enable the filter and search controls
5. WHEN a subscribed User clicks a Product_Card, THE Purity_Wall SHALL navigate to the Deep_Dive_Page for that product
6. WHEN a subscribed User views the Purity_Wall, THE Purity_Wall SHALL display a "Download PDF Report" call-to-action

### Requirement 6: Filter and Search for Subscribed Users

**User Story:** As a subscribed user, I want to filter and search products by category or name, so that I can quickly find the products I care about.

#### Acceptance Criteria

1. WHEN a subscribed User types in the search input, THE Purity_Wall SHALL filter the displayed Product_Cards to those whose brand name or category contains the search text (case-insensitive)
2. WHEN a subscribed User selects a category filter, THE Purity_Wall SHALL display only Product_Cards belonging to the selected category
3. WHEN a subscribed User clears all filters, THE Purity_Wall SHALL display all published Product_Cards

### Requirement 7: Deep-Dive Report Page

**User Story:** As a subscribed user, I want to view a detailed breakdown of a product's test results with expert commentary, so that I can make an informed decision about the product's safety.

#### Acceptance Criteria

1. WHEN a subscribed User navigates to the Deep_Dive_Page for a product, THE API_Server SHALL return the full Test_Report including all test parameters, Purity_Score, Status_Badges, and expert commentary
2. THE Deep_Dive_Page SHALL display each test parameter with its measured value and acceptable range
3. THE Deep_Dive_Page SHALL display Dr. Aman Mann's commentary for the product
4. WHEN a subscribed User clicks "Download PDF Report" on the Deep_Dive_Page, THE API_Server SHALL generate and return a PDF file containing the full Test_Report data
5. IF a non-subscribed User or Visitor attempts to access the Deep_Dive_Page directly via URL, THEN THE Purity_Wall SHALL redirect the user to the Purity_Wall page with the Subscription_Modal displayed

### Requirement 8: Admin Test Report Management

**User Story:** As an admin, I want to add and manage product test reports, so that I can publish lab results for users to view.

#### Acceptance Criteria

1. WHEN an authenticated admin accesses the Admin_Panel, THE Admin_Panel SHALL display a "Test Reports" management section
2. THE Admin_Panel SHALL provide a form to create a new Test_Report with fields: product name, brand name, category, product image URL, Purity_Score (0-10), test parameters (name, measured value, acceptable range, status), expert commentary text, and Status_Badges
3. WHEN an admin submits a valid Test_Report form, THE API_Server SHALL save the Test_Report to the database and make it available on the Purity_Wall
4. THE Admin_Panel SHALL display a list of all existing Test_Reports with options to edit or delete each report
5. WHEN an admin edits a Test_Report, THE API_Server SHALL update the corresponding record and the changes SHALL be reflected on the Purity_Wall
6. WHEN an admin deletes a Test_Report, THE API_Server SHALL remove the record and the Product_Card SHALL no longer appear on the Purity_Wall

### Requirement 9: User Subscription Status on Registration

**User Story:** As a system operator, I want all new users to default to free subscription status, so that the paywall is enforced from the start.

#### Acceptance Criteria

1. WHEN a new User registers, THE API_Server SHALL set the User's Subscription_Status to `free`
2. THE API_Server SHALL include the User's Subscription_Status in the response of the `/api/user/me` endpoint
3. WHEN the Purity_Wall page loads, THE Purity_Wall SHALL check the User's Subscription_Status to determine which view (locked or unlocked) to render

### Requirement 10: Purity Score Display Formatting

**User Story:** As a user, I want purity scores displayed consistently with clear visual indicators, so that I can quickly assess product safety.

#### Acceptance Criteria

1. THE Product_Card SHALL display the Purity_Score using the Roboto Mono font in the format "X.X/10"
2. WHEN a Purity_Score is 7.0 or above, THE Product_Card SHALL display the score with the Deep Leaf Green color (#1F6B4E)
3. WHEN a Purity_Score is between 4.0 and 6.9 (inclusive), THE Product_Card SHALL display the score with the Warning Amber color (#FFB703)
4. WHEN a Purity_Score is below 4.0, THE Product_Card SHALL display the score with the Fail Red color (#D62828)
