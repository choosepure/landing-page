# Requirements Document

## Introduction

This feature defines the complete MongoDB Atlas collection schema for storing food safety test reports in the ChoosePure platform. The `test_reports` collection must capture all report data — metadata, scoring, detailed lab test parameters, expert content, comparison data, and admin/system fields — so that reports can be stored, queried, and served via the existing REST API (`GET /api/reports`, `GET /api/reports/:id`) to the mobile app and web frontend.

## Glossary

- **Report_Collection**: The `test_reports` MongoDB collection in the `choosepure_db` database on MongoDB Atlas that stores all test report documents.
- **Report_Document**: A single document within the Report_Collection representing one complete food safety test report for a product batch.
- **Test_Parameter**: An individual lab measurement within a report (e.g., a specific pesticide residue level), including the result value and regulatory limits.
- **Category_Score**: A sub-score for a specific testing category (e.g., Pesticide Residues, Heavy Metals) that contributes to the overall purity score.
- **Admin_API**: The authenticated admin endpoints (`/api/admin/reports`) used to create and manage reports.
- **Public_API**: The public-facing endpoints (`/api/reports`, `/api/reports/:id`) that serve report data to the mobile app and web.
- **Purity_Score**: A numeric score from 0 to 100 representing the overall safety rating of a tested product.
- **FSSAI_Limit**: The maximum permissible limit set by the Food Safety and Standards Authority of India.
- **EU_Limit**: The maximum permissible limit set by European Union food safety regulations.
- **US_FDA_Limit**: The maximum permissible limit set by the United States Food and Drug Administration.

## Requirements

### Requirement 1: Report Metadata Storage

**User Story:** As an admin, I want to store complete report metadata for each test report, so that users can identify the product, lab, and testing context.

#### Acceptance Criteria

1. THE Report_Document SHALL contain a `productName` field of type String that stores the full product name.
2. THE Report_Document SHALL contain a `brandName` field of type String that stores the manufacturer or brand name.
3. THE Report_Document SHALL contain a `category` field of type String that stores the product category and sub-category (e.g., "Milk · Organic").
4. THE Report_Document SHALL contain a `batchCode` field of type String that stores the batch or lot identifier of the tested sample.
5. THE Report_Document SHALL contain a `labName` field of type String that stores the name and accreditation of the testing laboratory.
6. THE Report_Document SHALL contain a `labReportNumber` field of type String that stores the official lab report reference number.
7. THE Report_Document SHALL contain a `reportDate` field of type Date that stores the date the lab report was issued.
8. THE Report_Document SHALL contain a `testDate` field of type Date that stores the date the lab testing was performed.
9. THE Report_Document SHALL contain a `sampleCondition` field of type String that stores the condition and quantity of the sample at time of testing.
10. THE Report_Document SHALL contain a `totalParametersTested` field of type Number that stores the total count of parameters analyzed.
11. THE Report_Document SHALL contain an `origin` field of type String that stores the geographic origin of the product (e.g., "Palladam, Tamil Nadu").
12. THE Report_Document SHALL contain a `shelfLife` field of type String that stores the product shelf life information.
13. THE Report_Document SHALL contain a `barcode` field of type String that stores the 13-digit EAN barcode when available.
14. THE Report_Document SHALL contain an `imageUrl` field of type String that stores the URL of the product image.

### Requirement 2: Purity Scoring Storage

**User Story:** As a parent using the app, I want to see the purity score and category-level breakdown, so that I can quickly assess product safety.

#### Acceptance Criteria

1. THE Report_Document SHALL contain a `purityScore` field of type Number constrained between 0 and 100 inclusive.
2. THE Report_Document SHALL contain a `scoreVerdict` field of type String that stores the human-readable verdict (e.g., "Outstanding", "Excellent", "Good", "Moderate", "Concern").
3. THE Report_Document SHALL contain a `scoreFormula` field of type String that stores the explanation of how the purity score was calculated.
4. THE Report_Document SHALL contain a `categoryScores` field of type Array where each element is an object containing `categoryName` (String), `score` (Number), and `description` (String).
5. WHEN a `purityScore` value is provided, THE Admin_API SHALL validate that the value is a number between 0 and 100 inclusive before storing.
6. THE Report_Document SHALL store `categoryScores` entries for categories including Pesticide Residues, Antibiotics and Veterinary Drug Residues, Heavy Metals and Mycotoxins, Adulterants and Additives, Nutrition Quality, Processing Level, and Microbiology as applicable to the product.

### Requirement 3: Detailed Test Parameters Storage

**User Story:** As a subscribed user, I want to view every individual lab test result with regulatory limits, so that I can understand exactly what was tested and how the product performed.

#### Acceptance Criteria

1. THE Report_Document SHALL contain a `testParameters` field of type Object where each key is a category name (e.g., "Microbiology", "Heavy Metals", "Pesticides", "Antibiotics", "Nutrition", "Adulterants") and each value is an Array of test parameter objects.
2. THE Report_Document SHALL store each test parameter object with the fields: `parameterName` (String), `result` (String), `unit` (String), `fssaiLimit` (String), `euLimit` (String), `usFdaLimit` (String), and `status` (String).
3. THE Report_Document SHALL constrain the `status` field of each test parameter to one of the values: "Pass", "Fail", "Context", or "NA".
4. WHEN a report is created via the Admin_API, THE Admin_API SHALL validate that `testParameters` is a non-empty object containing at least one category with at least one parameter entry.

### Requirement 4: Content and Commentary Storage

**User Story:** As a parent, I want to read expert commentary and recommendations, so that I can make informed decisions about the product.

#### Acceptance Criteria

1. THE Report_Document SHALL contain an `expertCommentary` field of type String that stores the expert analysis text.
2. THE Report_Document SHALL contain a `methodology` field of type String that stores the testing methodology description.
3. THE Report_Document SHALL contain a `parentSummary` field of type String that stores the "What Parents Should Know" summary text.
4. THE Report_Document SHALL contain a `recommendations` field of type Array where each element is an object containing `severity` (String), `title` (String), and `description` (String).

### Requirement 5: Statistical Summary Storage

**User Story:** As a user viewing a report, I want to see a quick statistical overview of test results, so that I can understand the pass/fail distribution at a glance.

#### Acceptance Criteria

1. THE Report_Document SHALL contain a `stats` field of type Object containing `totalParameters` (Number), `passCount` (Number), `contextNotes` (Number), and `safetyConcerns` (Number).
2. WHEN a report is created or updated, THE Admin_API SHALL accept the `stats` object and store it in the Report_Document.

### Requirement 6: Product Comparison Storage

**User Story:** As a user, I want to see how a product compares to similar products, so that I can make relative purchasing decisions.

#### Acceptance Criteria

1. THE Report_Document SHALL contain a `comparisons` field of type Array where each element is an object containing `productName` (String), `score` (Number), and `rating` (String).
2. WHEN no comparison data is available, THE Report_Document SHALL store an empty array for the `comparisons` field.

### Requirement 7: Admin and System Fields

**User Story:** As an admin, I want system-managed fields for publication control and audit tracking, so that I can manage report lifecycle and access control.

#### Acceptance Criteria

1. THE Report_Document SHALL contain a `published` field of type Boolean that controls whether the report is visible to public API consumers.
2. THE Report_Document SHALL contain an `isPremium` field of type Boolean that indicates whether a subscription is required to view the full report.
3. THE Report_Document SHALL contain a `pdfUrl` field of type String that stores the URL to the pre-generated PDF version of the report when available.
4. THE Report_Document SHALL contain a `reportUrl` field of type String that stores the URL path to the web-based HTML report page.
5. THE Report_Document SHALL contain a `statusBadges` field of type Array of Strings that stores display badges (e.g., "FSSAI Compliant", "Organic Certified").
6. THE Report_Document SHALL contain a `createdAt` field of type Date that is automatically set when the document is first inserted.
7. THE Report_Document SHALL contain an `updatedAt` field of type Date that is automatically set on every insert or update operation.
8. WHEN a report is created without specifying `published`, THE Admin_API SHALL default the value to `true`.
9. WHEN a report is created without specifying `isPremium`, THE Admin_API SHALL default the value to `false`.

### Requirement 8: Collection Indexing for Query Performance

**User Story:** As a developer, I want proper indexes on the collection, so that API queries for published reports, category filtering, and lookups by barcode are performant.

#### Acceptance Criteria

1. THE Report_Collection SHALL have a compound index on `{ published: 1, createdAt: -1 }` to support listing published reports in reverse chronological order.
2. THE Report_Collection SHALL have an index on `{ category: 1 }` to support filtering reports by product category.
3. THE Report_Collection SHALL have a sparse index on `{ barcode: 1 }` to support lookups by product barcode when the field is present.
4. THE Report_Collection SHALL have an index on `{ brandName: 1 }` to support filtering reports by brand.
5. THE Report_Collection SHALL have a unique sparse index on `{ labReportNumber: 1 }` to prevent duplicate lab reports from being stored.

### Requirement 9: Data Validation on Insert and Update

**User Story:** As an admin, I want the API to validate report data before storing, so that the collection maintains data integrity.

#### Acceptance Criteria

1. WHEN a report is created, THE Admin_API SHALL require `productName`, `brandName`, `category`, `imageUrl`, `purityScore`, and `testParameters` fields to be present and non-empty.
2. WHEN a `barcode` field is provided, THE Admin_API SHALL validate that it contains exactly 13 digits.
3. WHEN a `purityScore` is provided, THE Admin_API SHALL validate that it is a number between 0 and 100 inclusive.
4. IF a required field is missing during report creation, THEN THE Admin_API SHALL return a 400 status code with a message listing the missing fields.
5. WHEN a report is updated via `PUT /api/admin/reports/:id`, THE Admin_API SHALL validate any provided fields using the same rules as creation and update only the fields included in the request body.
