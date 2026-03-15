# Requirements Document

## Introduction

This feature adds product polling and payment capabilities to the ChoosePure platform. Admins can add products for community voting through the existing admin panel. Users on the public website can cast votes for products they want tested, with the ability to cast multiple votes. After voting, users complete payment via Razorpay, where the total amount is calculated as the number of votes multiplied by an admin-defined minimum amount per vote. The feature integrates with the existing Node.js/Express backend (api.choosepure.in), MongoDB Atlas database (choosepure_db), and the static frontend hosted on Vercel (choosepure.in).

## Glossary

- **Admin_Panel**: The existing authenticated admin interface (admin.html) used to manage the ChoosePure platform, protected by JWT authentication.
- **Polling_Page**: The public-facing page on choosepure.in where users view products available for voting and cast their votes.
- **Product**: A packaged food item added by an admin that is available for community voting to determine testing priority.
- **Vote**: A single unit of support cast by a user for a product. Users can cast multiple votes for the same product in a single transaction.
- **Minimum_Amount**: The per-vote price in INR set by the admin when creating a product. The total payment equals the number of votes multiplied by this amount.
- **Razorpay_Gateway**: The existing Razorpay payment integration (rzp_live keys already configured) used to process vote payments.
- **Vote_Transaction**: A record in the database capturing a user's vote submission, including the product voted for, number of votes, payment details, and user information.
- **Server**: The existing Node.js/Express backend running on Render (api.choosepure.in) that handles API requests.
- **Database**: The MongoDB Atlas instance (choosepure_db) used for persistent storage.

## Requirements

### Requirement 1: Admin Product Creation

**User Story:** As an admin, I want to add products available for voting, so that the community can decide which products get tested next.

#### Acceptance Criteria

1. WHEN the admin navigates to the Admin_Panel, THE Admin_Panel SHALL display a "Product Polling" management section with a form to add new products.
2. WHEN the admin submits a new product, THE Server SHALL require a product name, product image URL, description, and Minimum_Amount (in INR).
3. WHEN the admin submits a valid product creation form, THE Server SHALL store the Product in the Database with the provided details, an initial vote count of zero, a created timestamp, and an active status.
4. IF the admin submits a product creation form with missing required fields, THEN THE Server SHALL return a descriptive validation error identifying the missing fields.
5. WHEN a product is created successfully, THE Admin_Panel SHALL display a success confirmation and refresh the product list.

### Requirement 2: Admin Product Management

**User Story:** As an admin, I want to manage existing polling products, so that I can control which products are visible to users and update their details.

#### Acceptance Criteria

1. WHEN the admin navigates to the Product Polling section, THE Admin_Panel SHALL display a list of all products with their name, image, description, Minimum_Amount, total vote count, and status.
2. WHEN the admin toggles a product's status, THE Server SHALL update the Product status between active and inactive in the Database.
3. WHILE a Product has an inactive status, THE Polling_Page SHALL NOT display that Product to users.
4. WHEN the admin deletes a product, THE Server SHALL remove the Product from the Database after confirmation.

### Requirement 3: Public Product Listing

**User Story:** As a user, I want to see all products available for voting, so that I can choose which products I want tested.

#### Acceptance Criteria

1. WHEN a user visits the Polling_Page, THE Polling_Page SHALL display all active products with their name, image, description, Minimum_Amount per vote, and total vote count.
2. THE Server SHALL provide a public API endpoint that returns all active products sorted by total vote count in descending order.
3. WHEN the product list is loading, THE Polling_Page SHALL display a loading indicator.
4. IF the Server returns an error when fetching products, THEN THE Polling_Page SHALL display a user-friendly error message with a retry option.

### Requirement 4: Vote Casting

**User Story:** As a user, I want to cast one or more votes for a product, so that I can support testing of products I care about.

#### Acceptance Criteria

1. WHEN a user selects a product to vote for, THE Polling_Page SHALL display a vote quantity selector allowing the user to choose between 1 and 50 votes.
2. WHEN the user changes the vote quantity, THE Polling_Page SHALL display the calculated total amount as vote quantity multiplied by the product's Minimum_Amount.
3. THE Polling_Page SHALL require the user to provide their name, email address, and phone number before proceeding to payment.
4. IF the user provides an invalid email format or a phone number that is not exactly 10 digits, THEN THE Polling_Page SHALL display a specific validation error for the invalid field.

### Requirement 5: Razorpay Payment Processing

**User Story:** As a user, I want to pay for my votes securely via Razorpay, so that my votes are counted after successful payment.

#### Acceptance Criteria

1. WHEN the user submits the vote form with valid details, THE Server SHALL create a Razorpay order with the calculated total amount (vote quantity multiplied by Minimum_Amount) in INR.
2. WHEN the Razorpay order is created, THE Polling_Page SHALL open the Razorpay checkout modal pre-filled with the user's name, email, and phone number.
3. WHEN the Razorpay payment is completed successfully, THE Polling_Page SHALL send the payment verification details (razorpay_order_id, razorpay_payment_id, razorpay_signature) to the Server.
4. WHEN the Server receives payment verification details, THE Server SHALL verify the payment signature using the Razorpay webhook secret to confirm authenticity.
5. WHEN payment verification succeeds, THE Server SHALL create a Vote_Transaction record in the Database containing the product ID, user details, vote count, payment amount, Razorpay order ID, Razorpay payment ID, and a timestamp.
6. WHEN payment verification succeeds, THE Server SHALL increment the Product's total vote count by the number of votes purchased.
7. IF payment verification fails, THEN THE Server SHALL return an error response and SHALL NOT increment the vote count.
8. WHEN the payment is successful, THE Polling_Page SHALL display a success message with the number of votes cast and the updated total vote count for the product.
9. IF the user closes the Razorpay checkout modal without completing payment, THEN THE Polling_Page SHALL display a message indicating that the payment was cancelled and votes were not recorded.

### Requirement 6: Vote Transaction Tracking (Admin)

**User Story:** As an admin, I want to view all vote transactions, so that I can track payments and voting activity.

#### Acceptance Criteria

1. WHEN the admin navigates to the Product Polling section, THE Admin_Panel SHALL display a list of recent Vote_Transactions showing user name, email, product name, vote count, amount paid, payment ID, and timestamp.
2. THE Admin_Panel SHALL display summary statistics including total votes cast across all products and total revenue collected.

### Requirement 7: Analytics Tracking

**User Story:** As an admin, I want voting and payment events tracked in analytics, so that I can measure engagement and conversion.

#### Acceptance Criteria

1. WHEN a user views the Polling_Page, THE Polling_Page SHALL fire a page view event to GA4, Meta Pixel, and Mixpanel.
2. WHEN a user initiates a vote payment, THE Polling_Page SHALL fire a custom event with the product name, vote count, and amount to GA4, Meta Pixel, and Mixpanel.
3. WHEN a payment is completed successfully, THE Polling_Page SHALL fire a purchase/conversion event with the transaction value to GA4, Meta Pixel, and Mixpanel.
