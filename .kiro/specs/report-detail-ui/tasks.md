# Tasks: Report Detail UI

## Task 1: Create Score Color Utility Functions

Create utility functions for mapping scores and statuses to theme colors.

### Files to create
- `mobile app/src/utils/scoreColors.js`

### Requirements addressed
- Requirement 1 (criteria 1.4-1.7), Requirement 3 (criteria 3.3-3.5), Requirement 5 (criteria 5.7-5.9), Requirement 8 (criteria 8.3-8.5)

### Steps
- [x] 1.1 Create `src/utils/scoreColors.js` with `getScoreColor(score)` returning theme colors based on purity score ranges (≥90: primary, 70-89: scoreGood, 40-69: warning, <40: error)
- [x] 1.2 Add `getCategoryScoreColor(score)` returning colors based on category score ranges (≥90: primary green, 70-89: #1976D2 blue, <70: warning)
- [x] 1.3 Add `getStatusColor(status)` mapping "Pass" → success, "Fail" → error, "Context" → warning
- [x] 1.4 Add `getSeverityColor(severity)` mapping "critical" → error, "recommended" → warning, "positive" → success

---

## Task 2: Create ScoreHero Component

Create the score hero section showing product name, brand, purity score circle, and verdict.

### Files to create
- `mobile app/src/components/report/ScoreHero.js`

### Requirements addressed
- Requirement 1 (criteria 1.1-1.7)

### Steps
- [x] 2.1 Create `src/components/report/ScoreHero.js` rendering productName as bold heading, brandName as secondary text, purity score circle with color from getScoreColor, scoreVerdict text below

---

## Task 3: Create MetadataGrid Component

Create the metadata grid showing lab info, batch, dates, and other report context.

### Files to create
- `mobile app/src/components/report/MetadataGrid.js`

### Requirements addressed
- Requirement 2 (criteria 2.1-2.3)

### Steps
- [x] 3.1 Create `src/components/report/MetadataGrid.js` rendering a 2-column grid of key-value pairs, omitting null/empty fields (labName, labReportNumber, reportDate, batchCode, sampleCondition, totalParametersTested, origin, shelfLife)

---

## Task 4: Create CategoryScoreCard Component

Create the category score card with colored score badge.

### Files to create
- `mobile app/src/components/report/CategoryScoreCard.js`

### Requirements addressed
- Requirement 3 (criteria 3.1-3.6)

### Steps
- [x] 4.1 Create `src/components/report/CategoryScoreCard.js` with colored score badge using getCategoryScoreColor, categoryName, and description

---

## Task 5: Create StatsRow Component

Create the stats summary row with metric chips.

### Files to create
- `mobile app/src/components/report/StatsRow.js`

### Requirements addressed
- Requirement 4 (criteria 4.1-4.4)

### Steps
- [x] 5.1 Create `src/components/report/StatsRow.js` with horizontal metric chips (totalParameters, passCount, contextNotes, safetyConcerns) applying error color when safetyConcerns > 0 and warning color when contextNotes > 0

---

## Task 6: Create TestParameterSection Component

Create the expandable test parameter section with status badges and limit details.

### Files to create
- `mobile app/src/components/report/TestParameterSection.js`

### Requirements addressed
- Requirement 5 (criteria 5.1-5.9)

### Steps
- [x] 6.1 Create `src/components/report/TestParameterSection.js` with tappable header (category name + chevron), expand/collapse via LayoutAnimation defaulting to collapsed, parameter rows with StatusBadge using getStatusColor, and parameter detail expansion showing limits

---

## Task 7: Create ParentSummary Component

Create the "What Parents Should Know" green gradient card.

### Files to create
- `mobile app/src/components/report/ParentSummary.js`

### Requirements addressed
- Requirement 6 (criteria 6.1-6.2)

### Steps
- [x] 7.1 Create `src/components/report/ParentSummary.js` with expo-linear-gradient green gradient background, "What Parents Should Know" heading, and white summary text

---

## Task 8: Create RecommendationCard Component

Create the recommendation card with severity-tagged pills.

### Files to create
- `mobile app/src/components/report/RecommendationCard.js`

### Requirements addressed
- Requirement 8 (criteria 8.1-8.5)

### Steps
- [x] 8.1 Create `src/components/report/RecommendationCard.js` with severity tag pill using getSeverityColor, bold title, and description text

---

## Task 9: Create ComparisonTable Component

Create the product comparison table with highlighted current product.

### Files to create
- `mobile app/src/components/report/ComparisonTable.js`

### Requirements addressed
- Requirement 9 (criteria 9.1-9.3)

### Steps
- [x] 9.1 Create `src/components/report/ComparisonTable.js` with header row, data rows (productName, score, rating badge), and highlighted current product row

---

## Task 10: Rewrite ReportDetailScreen Container

Rewrite the main screen to compose all sub-components with data fetching and error handling.

### Files to modify
- `mobile app/src/screens/ReportDetailScreen.js`

### Requirements addressed
- Requirement 10 (criteria 10.1-10.4), Requirement 11 (criteria 11.1-11.5), Requirement 12 (criteria 12.1)

### Steps
- [x] 10.1 Rewrite `src/screens/ReportDetailScreen.js` container with data fetching, loading spinner, error states (403 subscription CTA, 401 login required, generic error + retry), and ScrollView composing all sub-components with conditional rendering
- [x] 10.2 Implement PDF download using expo-file-system and expo-sharing with loading/disabled state and error alert
