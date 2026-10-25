# Tasks: Test Report Collection

## Task 1: Add New Collection Indexes

Update the `connectToDatabase()` function in `server.js` to create the additional indexes required for the expanded schema.

### Files to modify
- `server.js`

### Requirements addressed
- Requirement 8: Collection Indexing for Query Performance (criteria 8.1–8.5)

### Steps
- [x] 1.1 Add a sparse index on `{ barcode: 1 }` after the existing `test_reports` index creation block
- [x] 1.2 Add an index on `{ brandName: 1 }` for brand filtering
- [x] 1.3 Add a unique sparse index on `{ labReportNumber: 1 }` to prevent duplicate lab reports
- [x] 1.4 Verify the existing indexes (`{ published: 1, createdAt: -1 }` and `{ category: 1 }`) are still present

---

## Task 2: Update POST /api/admin/reports to Accept All Fields

Extend the report creation endpoint to accept, validate, and store all new schema fields with appropriate defaults.

### Files to modify
- `server.js`

### Requirements addressed
- Requirement 1: Report Metadata Storage (criteria 1.1–1.14)
- Requirement 2: Purity Scoring Storage (criteria 2.1–2.6)
- Requirement 3: Detailed Test Parameters Storage (criteria 3.1–3.4)
- Requirement 4: Content and Commentary Storage (criteria 4.1–4.4)
- Requirement 5: Statistical Summary Storage (criteria 5.1–5.2)
- Requirement 6: Product Comparison Storage (criteria 6.1–6.2)
- Requirement 7: Admin and System Fields (criteria 7.1–7.9)
- Requirement 9: Data Validation on Insert (criteria 9.1–9.4)

### Steps
- [x] 2.1 Destructure all new fields from `req.body`: `labName`, `labReportNumber`, `reportDate`, `sampleCondition`, `totalParametersTested`, `origin`, `scoreVerdict`, `scoreFormula`, `categoryScores`, `parentSummary`, `recommendations`, `stats`, `comparisons`, `isPremium`, `pdfUrl`
- [x] 2.2 Keep existing required field validation for `productName`, `brandName`, `category`, `imageUrl`, `purityScore`, `testParameters`
- [x] 2.3 Add the new fields to the report document object with defaults: `labName` (empty string), `labReportNumber` (null), `reportDate` (null), `sampleCondition` (empty string), `totalParametersTested` (null), `origin` (empty string), `scoreVerdict` (empty string), `scoreFormula` (empty string), `categoryScores` (empty array), `parentSummary` (empty string), `recommendations` (empty array), `stats` (null), `comparisons` (empty array), `isPremium` (false), `pdfUrl` (empty string)
- [x] 2.4 Parse `reportDate` as a Date object when provided (similar to existing `testDate` handling)
- [x] 2.5 Ensure `published` defaults to `true` and `isPremium` defaults to `false` when not specified

---

## Task 3: Update PUT /api/admin/reports/:id for Partial Updates

Extend the report update endpoint to handle all new fields with proper validation and partial update semantics.

### Files to modify
- `server.js`

### Requirements addressed
- Requirement 9: Data Validation on Insert and Update (criteria 9.5)

### Steps
- [x] 3.1 Add all new fields to the list of accepted update fields in the PUT handler
- [x] 3.2 Apply the same validation rules (barcode format, purityScore range) to fields provided in the update body
- [x] 3.3 Parse date fields (`reportDate`, `testDate`) as Date objects when provided in the update
- [x] 3.4 Ensure `updatedAt` is always set to `new Date()` on every update operation

---

## Task 4: Update GET /api/reports List Response

Extend the public reports list endpoint to include additional fields in the mapped response for richer list cards in the mobile app.

### Files to modify
- `server.js`

### Requirements addressed
- Requirement 1: Report Metadata Storage (criteria 1.5, 1.10)
- Requirement 2: Purity Scoring Storage (criteria 2.2)

### Steps
- [x] 4.1 Add `labName`, `totalParametersTested`, and `scoreVerdict` to the `base` object in the reports list mapping
- [x] 4.2 Add `isPremium` to the mapped response so the mobile app can show lock indicators
- [x] 4.3 Verify the existing fields (`productName`, `brandName`, `category`, `imageUrl`, `statusBadges`, `reportUrl`, `purityScore`) remain in the response

---

## Task 5: Handle labReportNumber Uniqueness Errors

Add error handling for the unique index constraint on `labReportNumber` so that duplicate lab reports return a clear error message.

### Files to modify
- `server.js`

### Requirements addressed
- Requirement 8: Collection Indexing (criteria 8.5)
- Requirement 9: Data Validation (criteria 9.4)

### Steps
- [x] 5.1 In the POST `/api/admin/reports` handler, catch MongoDB duplicate key errors (error code 11000) on `labReportNumber`
- [x] 5.2 Return a 409 Conflict status with a message indicating a report with that lab report number already exists
- [x] 5.3 In the PUT handler, catch the same duplicate key error and return a 409 response
