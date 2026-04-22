# Requirements Document

## Introduction

ChoosePure is an independent food purity testing platform. The existing React Native (Expo) mobile app provides authentication, a purity dashboard, polling, suggestions, subscriptions, referrals, and profile management. The backend already exposes Open Food Facts (OFF) proxy endpoints for barcode lookup and text search, and a reports endpoint that can include barcode fields linking reports to OFF products.

This feature adds a barcode scanner to the mobile app, allowing users to scan EAN-13 barcodes on food products using the device camera, view a layered result card combining ChoosePure lab data with OFF nutritional data, maintain a local scan history, and manually enter barcodes when camera scanning is impractical. The scanner integrates with the existing OFF proxy endpoints and reports API — no backend changes are required.

## Glossary

- **Scanner_Screen**: The screen containing the camera viewfinder for barcode scanning, the manual entry input, and the scan trigger controls
- **Barcode_Scanner**: The Expo-compatible camera barcode scanning module (expo-camera or expo-barcode-scanner) used to detect EAN-13 barcodes from the device camera feed
- **Result_Card_Screen**: The screen displaying the layered product result after a successful barcode lookup, combining ChoosePure lab data and OFF data
- **Scan_History_Screen**: The screen displaying the user's locally stored list of previously scanned products
- **Scan_History_Store**: The AsyncStorage-based local storage holding the last 50 scanned product records on the device
- **OFF_Proxy**: The existing backend API layer at `/api/off/product/:barcode` that returns normalised Open Food Facts product data
- **Reports_API**: The existing backend endpoint at `GET /api/reports` that returns published ChoosePure test reports, some of which include a `barcode` field
- **Nutri_Score**: A letter grade from A to E assigned by Open Food Facts indicating overall nutritional quality (A is best, E is worst)
- **NOVA_Group**: A classification from 1 to 4 assigned by Open Food Facts indicating the degree of food processing (1 is unprocessed, 4 is ultra-processed)
- **Additive_Badge**: A UI element displaying an E-number additive with a colour-coded risk level (low, moderate, high, unknown)
- **Manual_Entry_Input**: A text input field on the Scanner_Screen that accepts a 13-digit EAN-13 barcode typed by the user
- **Mobile_App**: The existing React Native (Expo) mobile application
- **API_Client**: The existing Axios HTTP client module at `src/api/client.js` with Bearer token interceptor
- **Navigation_Router**: The existing React Navigation bottom tab and stack navigator system
- **ReportDetailScreen**: The existing screen that displays full ChoosePure test report details

## Requirements

### Requirement 1: Camera Barcode Scanning

**User Story:** As a mobile user, I want to scan a food product's barcode using my phone camera, so that I can quickly look up its nutritional and purity data without typing.

#### Acceptance Criteria

1. WHEN the user navigates to the Scanner_Screen, THE Barcode_Scanner SHALL request camera permission from the device operating system
2. WHEN camera permission is granted, THE Barcode_Scanner SHALL display a live camera viewfinder with a visible scan area overlay
3. WHEN the Barcode_Scanner detects an EAN-13 barcode in the camera viewfinder, THE Scanner_Screen SHALL extract the 13-digit barcode string and initiate a product lookup
4. WHEN a barcode is detected, THE Barcode_Scanner SHALL pause scanning to prevent duplicate detections until the current lookup completes or the user dismisses the result
5. IF the user denies camera permission, THEN THE Scanner_Screen SHALL display a message explaining that camera access is required for scanning and provide a button to open device settings
6. IF the user denies camera permission, THEN THE Scanner_Screen SHALL display the Manual_Entry_Input as the primary interaction method

### Requirement 2: Manual Barcode Entry

**User Story:** As a mobile user, I want to type a barcode number manually, so that I can look up a product when camera scanning is not working or the barcode is damaged.

#### Acceptance Criteria

1. THE Scanner_Screen SHALL display a Manual_Entry_Input field that accepts numeric input
2. WHEN the user enters exactly 13 digits into the Manual_Entry_Input and submits, THE Scanner_Screen SHALL initiate a product lookup using the entered barcode
3. WHEN the user submits a value in the Manual_Entry_Input that is not exactly 13 digits, THE Scanner_Screen SHALL display a validation error message stating "Please enter a valid 13-digit barcode"
4. WHEN the user submits a value in the Manual_Entry_Input that contains non-numeric characters, THE Scanner_Screen SHALL display a validation error message stating "Barcode must contain only numbers"

### Requirement 3: Product Lookup via OFF Proxy

**User Story:** As a mobile user, I want the app to fetch product data from the backend after scanning, so that I can see nutritional information about the scanned product.

#### Acceptance Criteria

1. WHEN a barcode is obtained (from camera scan or manual entry), THE API_Client SHALL send a GET request to `/api/off/product/:barcode` to fetch OFF product data
2. WHILE the product lookup is in progress, THE Scanner_Screen SHALL display a loading indicator
3. WHEN the OFF_Proxy returns a product (`found: true`), THE Mobile_App SHALL navigate to the Result_Card_Screen with the product data
4. WHEN the OFF_Proxy returns `found: false`, THE Scanner_Screen SHALL display a message stating "Product not found in Open Food Facts database" with an option to scan another product
5. IF the product lookup request fails due to a network error, THEN THE Scanner_Screen SHALL display an error message with a retry option
6. IF the OFF_Proxy returns a 504 timeout, THEN THE Scanner_Screen SHALL display a message stating "Lookup timed out. Please try again." with a retry option

### Requirement 4: ChoosePure Report Cross-Referencing

**User Story:** As a mobile user, I want to see if ChoosePure has tested the product I scanned, so that I can access independent lab results alongside the OFF data.

#### Acceptance Criteria

1. WHEN a barcode lookup succeeds, THE Mobile_App SHALL check the locally cached reports list for a report whose barcode field matches the scanned barcode
2. WHEN a matching ChoosePure report is found, THE Result_Card_Screen SHALL display a "ChoosePure Lab Report" section at the top of the result card showing the product name, purity score (if available to the user), and status badges from the report
3. WHEN a matching ChoosePure report is found, THE Result_Card_Screen SHALL display a "View Full Report" button that navigates to the ReportDetailScreen with the matching report ID
4. WHEN no matching ChoosePure report is found, THE Result_Card_Screen SHALL display only the OFF data sections without a ChoosePure section

### Requirement 5: Layered Result Card — OFF Data Display

**User Story:** As a mobile user, I want to see detailed nutritional data from Open Food Facts for the scanned product, so that I can make informed food choices.

#### Acceptance Criteria

1. THE Result_Card_Screen SHALL display the product name, brand, and product image from the OFF data
2. WHEN the product has a Nutri-Score grade, THE Result_Card_Screen SHALL display a colour-coded Nutri-Score badge using the colours: A (#1F6B4E), B (#85BB65), C (#FFB703), D (#E67E22), E (#D62828) with white bold text
3. WHEN the product has a NOVA group, THE Result_Card_Screen SHALL display the NOVA group number alongside a descriptive label: 1 "Unprocessed or minimally processed", 2 "Processed culinary ingredients", 3 "Processed foods", 4 "Ultra-processed food and drink products"
4. WHEN the product has ingredients data, THE Result_Card_Screen SHALL display the full ingredients list in a dedicated section
5. WHEN the product has additives, THE Result_Card_Screen SHALL display each additive as an Additive_Badge showing the E-number and name, colour-coded by risk level: low (green background #E8F5E9, dark green text #2E7D32), moderate (amber background #FFF8E1, dark amber text #E65100), high (red background #FFEBEE, dark red text #C62828), unknown (grey background #F5F5F5, grey text #6B6B6B)
6. WHEN the product has allergen data, THE Result_Card_Screen SHALL display the allergens in a visible list
7. WHEN the product has nutrition-per-100g data, THE Result_Card_Screen SHALL display a nutrition facts table showing energy, fat, saturated fat, carbohydrates, sugars, proteins, salt, and fibre
8. THE Result_Card_Screen SHALL display the attribution text "Data from Open Food Facts (openfoodfacts.org) under ODbL licence" at the bottom of the OFF data section

### Requirement 6: Scan History

**User Story:** As a mobile user, I want to see a history of products I have scanned, so that I can revisit product information without scanning again.

#### Acceptance Criteria

1. WHEN a product lookup succeeds (OFF returns `found: true`), THE Scan_History_Store SHALL save the scan record containing the barcode, product name, brand, Nutri-Score grade, NOVA group, product image URL, whether a ChoosePure report was matched, and the scan timestamp
2. THE Scan_History_Store SHALL retain a maximum of 50 scan records, removing the oldest record when a new scan would exceed the limit
3. WHEN the user navigates to the Scan_History_Screen, THE Scan_History_Screen SHALL display all stored scan records sorted by scan timestamp in descending order (most recent first)
4. WHEN the user taps a scan record in the Scan_History_Screen, THE Mobile_App SHALL navigate to the Result_Card_Screen and re-fetch the product data from the OFF_Proxy using the stored barcode
5. WHEN the user taps a clear history button, THE Scan_History_Store SHALL remove all stored scan records and THE Scan_History_Screen SHALL display an empty state message
6. WHEN the Scan_History_Store contains no records, THE Scan_History_Screen SHALL display an empty state message stating "No scans yet. Scan a product to get started."

### Requirement 7: Navigation Integration

**User Story:** As a mobile user, I want to access the barcode scanner from the main navigation, so that I can quickly scan products from anywhere in the app.

#### Acceptance Criteria

1. THE Navigation_Router SHALL add a Scanner tab to the bottom tab navigator positioned between the Dashboard tab and the Polling tab
2. THE Scanner tab SHALL use a barcode/scan icon and the label "Scan"
3. THE Scanner tab stack SHALL include the Scanner_Screen, Result_Card_Screen, Scan_History_Screen, and a nested ReportDetailScreen for navigating to matched ChoosePure reports
4. THE Scanner_Screen SHALL include a button or link to navigate to the Scan_History_Screen

### Requirement 8: Brand Theming Compliance

**User Story:** As a user, I want the scanner screens to match the ChoosePure brand, so that the experience feels consistent with the rest of the app.

#### Acceptance Criteria

1. THE Scanner_Screen, Result_Card_Screen, and Scan_History_Screen SHALL use Deep Leaf Green (#1F6B4E) as the primary colour for buttons, headers, and active elements
2. THE Scanner_Screen, Result_Card_Screen, and Scan_History_Screen SHALL use Pure Ivory (#FAFAF7) as the background colour
3. THE Scanner_Screen, Result_Card_Screen, and Scan_History_Screen SHALL use the Inter font family for all text elements
4. THE Result_Card_Screen SHALL use card styling consistent with the existing app: white background, 1px solid #E0E0E0 border, 12px border radius, and subtle shadow

### Requirement 9: Error and Edge Case Handling

**User Story:** As a mobile user, I want clear feedback when something goes wrong during scanning or lookup, so that I understand what happened and what to do next.

#### Acceptance Criteria

1. IF the Barcode_Scanner detects a barcode that is not in EAN-13 format, THEN THE Scanner_Screen SHALL ignore the detection and continue scanning
2. IF the device does not have a camera, THEN THE Scanner_Screen SHALL hide the camera viewfinder and display only the Manual_Entry_Input
3. WHILE the device has no network connectivity, THE Scanner_Screen SHALL display a banner indicating that an internet connection is required for product lookup
4. WHEN the user scans the same barcode that is already the most recent entry in the Scan_History_Store, THE Scan_History_Store SHALL update the timestamp of the existing entry instead of creating a duplicate

### Requirement 10: Scan History Serialisation

**User Story:** As a developer, I want scan history to be reliably stored and retrieved from AsyncStorage, so that data is not lost or corrupted between app sessions.

#### Acceptance Criteria

1. THE Scan_History_Store SHALL serialise scan records to JSON before writing to AsyncStorage and deserialise from JSON when reading
2. FOR ALL valid scan history arrays, serialising to JSON and then deserialising SHALL produce an array equivalent to the original (round-trip property)
3. IF AsyncStorage returns null or invalid JSON for the scan history key, THEN THE Scan_History_Store SHALL treat the history as an empty array and continue without error
4. THE Scan_History_Store SHALL use the AsyncStorage key `scan_history` for persisting scan records
