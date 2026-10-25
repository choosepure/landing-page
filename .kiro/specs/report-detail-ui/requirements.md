# Requirements Document

## Introduction

Redesign the Report Detail screen in the ChoosePure mobile app (React Native + Expo SDK 52) to replace raw JSON rendering of test parameters with a polished, structured UI. The new screen will match the quality and information hierarchy of the existing HTML report pages, presenting lab test data in an accessible, scannable format with expandable sections, status badges, score breakdowns, and actionable insights.

## Glossary

- **Report_Detail_Screen**: The mobile app screen that displays a full test report for a product, accessed via navigation with a `reportId` parameter
- **Test_Parameter**: A single lab measurement within a category, containing parameterName, result, unit, fssaiLimit, euLimit, usFdaLimit, and status
- **Category_Section**: A collapsible group of test parameters organized by category (e.g., Microbiology, Heavy Metals, Pesticides)
- **Purity_Score_Circle**: A circular badge displaying the numeric purity score (0–100) with the score verdict text
- **Status_Badge**: A colored pill label indicating Pass, Fail, or Context status for a test parameter
- **Category_Score_Card**: A card displaying a category name, numeric score, and description
- **Stats_Summary**: A row of metric chips showing totalParameters, passCount, contextNotes, and safetyConcerns
- **Recommendation_Card**: A list item displaying severity tag, title, and description for a recommendation
- **Comparison_Row**: A table row showing a competing product's name, score, and rating badge
- **PDF_Download_Button**: A button that downloads and shares the report PDF via the device share sheet

## Requirements

### Requirement 1: Score Hero Section

**User Story:** As a parent, I want to see the product name, brand, purity score, and verdict prominently at the top of the report, so that I can immediately understand the overall safety rating.

#### Acceptance Criteria

1. THE Report_Detail_Screen SHALL display the productName in bold heading text and brandName in secondary text at the top of the screen
2. THE Report_Detail_Screen SHALL display the purityScore inside a Purity_Score_Circle with the numeric value and "/100" label
3. THE Report_Detail_Screen SHALL display the scoreVerdict text below the Purity_Score_Circle
4. WHEN the purityScore is 90 or above, THE Purity_Score_Circle SHALL use the theme primary green color as background
5. WHEN the purityScore is between 70 and 89, THE Purity_Score_Circle SHALL use the theme scoreGood color as background
6. WHEN the purityScore is between 40 and 69, THE Purity_Score_Circle SHALL use the theme warning color as background
7. WHEN the purityScore is below 40, THE Purity_Score_Circle SHALL use the theme error color as background

### Requirement 2: Report Metadata Grid

**User Story:** As a user, I want to see key report metadata (lab name, batch code, report date, sample condition, total parameters tested, origin) in a structured grid, so that I can verify the report's provenance.

#### Acceptance Criteria

1. THE Report_Detail_Screen SHALL display a metadata grid section below the score hero
2. THE Report_Detail_Screen SHALL display labName, labReportNumber, reportDate, batchCode, sampleCondition, totalParametersTested, origin, and shelfLife as labeled key-value pairs in the metadata grid
3. WHEN a metadata field value is null or empty, THE Report_Detail_Screen SHALL omit that field from the grid

### Requirement 3: Category Score Breakdown

**User Story:** As a parent, I want to see how the product scored in each testing category, so that I can identify specific areas of strength or concern.

#### Acceptance Criteria

1. THE Report_Detail_Screen SHALL display a "Score by Category" section containing one Category_Score_Card per entry in the categoryScores array
2. THE Category_Score_Card SHALL display the category score as a numeric value inside a colored rounded square
3. WHEN the category score is 90 or above, THE Category_Score_Card SHALL use the theme primary green as the score badge background
4. WHEN the category score is between 70 and 89, THE Category_Score_Card SHALL use a blue color (#1976D2) as the score badge background
5. WHEN the category score is below 70, THE Category_Score_Card SHALL use the theme warning color as the score badge background
6. THE Category_Score_Card SHALL display the categoryName and description text beside the score badge

### Requirement 4: Stats Summary

**User Story:** As a user, I want to see a quick summary of total parameters tested, pass count, context notes, and safety concerns, so that I can gauge overall compliance at a glance.

#### Acceptance Criteria

1. THE Report_Detail_Screen SHALL display a Stats_Summary section with metric chips for totalParameters, passCount, contextNotes, and safetyConcerns from the stats object
2. THE Stats_Summary SHALL display each metric as a large numeric value with a descriptive label below it
3. WHEN safetyConcerns is greater than zero, THE Stats_Summary SHALL display the safetyConcerns chip with the theme error color
4. WHEN contextNotes is greater than zero, THE Stats_Summary SHALL display the contextNotes chip with the theme warning color

### Requirement 5: Expandable Test Parameters by Category

**User Story:** As a parent, I want to browse detailed test parameters organized by category with expand/collapse functionality, so that I can drill into specific results without being overwhelmed by data.

#### Acceptance Criteria

1. THE Report_Detail_Screen SHALL display a "Test Parameters" section with one Category_Section per key in the testParameters object
2. THE Category_Section SHALL display the category name as a header with a chevron icon indicating expand/collapse state
3. WHEN the user taps a Category_Section header, THE Category_Section SHALL toggle between expanded and collapsed states
4. THE Category_Section SHALL default to collapsed state on initial render
5. WHEN a Category_Section is expanded, THE Report_Detail_Screen SHALL display each Test_Parameter as a row showing parameterName, result with unit, and a Status_Badge
6. WHEN the user taps a Test_Parameter row, THE Report_Detail_Screen SHALL display a detail view showing fssaiLimit, euLimit, and usFdaLimit values for that parameter
7. WHEN a Test_Parameter status is "Pass", THE Status_Badge SHALL display green background with "Pass" text
8. WHEN a Test_Parameter status is "Fail", THE Status_Badge SHALL display red background with "Fail" text
9. WHEN a Test_Parameter status is "Context", THE Status_Badge SHALL display amber/warning background with "Context" text

### Requirement 6: Parent Summary Section

**User Story:** As a parent, I want to read a plain-language summary of what the report means for my family, so that I can make informed purchasing decisions without needing scientific expertise.

#### Acceptance Criteria

1. WHEN the parentSummary field is present and non-empty, THE Report_Detail_Screen SHALL display a "What Parents Should Know" section with the parentSummary text
2. THE "What Parents Should Know" section SHALL use a visually distinct card style with the theme primary green gradient background and white text

### Requirement 7: Expert Commentary Section

**User Story:** As a user, I want to read expert analysis of the test results, so that I can understand the scientific context behind the numbers.

#### Acceptance Criteria

1. WHEN the expertCommentary field is present and non-empty, THE Report_Detail_Screen SHALL display an "Expert Commentary" section with the expertCommentary text
2. THE "Expert Commentary" section SHALL display the text in a standard card with readable line height

### Requirement 8: Recommendations Section

**User Story:** As a parent, I want to see actionable recommendations with severity indicators, so that I know what steps to take based on the report findings.

#### Acceptance Criteria

1. WHEN the recommendations array is present and non-empty, THE Report_Detail_Screen SHALL display a "Recommendations" section with one Recommendation_Card per entry
2. THE Recommendation_Card SHALL display a severity tag, title in bold, and description text
3. WHEN the severity is "critical", THE Recommendation_Card SHALL display the severity tag with red background
4. WHEN the severity is "recommended", THE Recommendation_Card SHALL display the severity tag with amber/warning background
5. WHEN the severity is "positive", THE Recommendation_Card SHALL display the severity tag with green background

### Requirement 9: Product Comparison Table

**User Story:** As a user, I want to see how this product compares to similar products, so that I can make relative purchasing decisions.

#### Acceptance Criteria

1. WHEN the comparisons array is present and non-empty, THE Report_Detail_Screen SHALL display a "How It Compares" section with a table of Comparison_Rows
2. THE Comparison_Row SHALL display productName, score, and a rating badge
3. THE Report_Detail_Screen SHALL visually highlight the current product row in the comparison table

### Requirement 10: PDF Download

**User Story:** As a user, I want to download the full PDF report to share with others, so that I can provide the complete lab documentation when needed.

#### Acceptance Criteria

1. WHEN the pdfUrl field is present, THE Report_Detail_Screen SHALL display a PDF_Download_Button
2. WHEN the user taps the PDF_Download_Button, THE Report_Detail_Screen SHALL download the PDF file and open the device share sheet
3. WHILE the PDF is downloading, THE PDF_Download_Button SHALL display a loading indicator and be disabled
4. IF the PDF download fails, THEN THE Report_Detail_Screen SHALL display an error alert with a retry option

### Requirement 11: Loading and Error States

**User Story:** As a user, I want clear feedback when the report is loading or when an error occurs, so that I understand the current state of the screen.

#### Acceptance Criteria

1. WHILE the report data is loading, THE Report_Detail_Screen SHALL display a centered loading spinner with the theme primary color
2. WHEN the API returns a 403 status, THE Report_Detail_Screen SHALL display a subscription-required message with a subscribe button
3. WHEN the API returns a 401 status, THE Report_Detail_Screen SHALL display a login-required message
4. IF the API returns any other error, THEN THE Report_Detail_Screen SHALL display the error message with a retry button
5. WHEN the user taps the retry button, THE Report_Detail_Screen SHALL re-fetch the report data

### Requirement 12: Methodology Section

**User Story:** As a user, I want to understand the testing methodology used, so that I can assess the rigor of the lab analysis.

#### Acceptance Criteria

1. WHEN the methodology field is present and non-empty, THE Report_Detail_Screen SHALL display a "Methodology" section with the methodology text in a standard card
