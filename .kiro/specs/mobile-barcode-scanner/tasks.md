# Implementation Plan: Mobile Barcode Scanner

## Overview

Add a barcode scanning feature to the ChoosePure React Native (Expo) mobile app. Users scan EAN-13 barcodes via the device camera or enter them manually, view a layered result card combining ChoosePure lab data with Open Food Facts nutritional data, and browse a local scan history. All code lives in `mobile app/`. No backend changes needed. New dependency: `expo-camera ~16.0.0`.

## Tasks

- [x] 1. Add expo-camera dependency and plugin configuration
  - [x] 1.1 Add `expo-camera` ~16.0.0 to `mobile app/package.json` dependencies
    - _Requirements: 1.1, 1.2_
  - [x] 1.2 Add the `expo-camera` plugin entry to `mobile app/app.json` under `expo.plugins` with `cameraPermission` message and `recordAudioAndroid: false`
    - _Requirements: 1.1_

- [x] 2. Implement scan history store and display components
  - [x] 2.1 Create `mobile app/src/utils/scanHistory.js` with pure utility functions
    - Implement `SCAN_HISTORY_KEY = 'scan_history'` and `MAX_RECORDS = 50`
    - Implement `serializeScanHistory(records)` — JSON.stringify wrapper
    - Implement `deserializeScanHistory(json)` — returns `[]` for null, invalid JSON, or non-array results
    - Implement `addRecord(history, newRecord)` — deduplicates if barcode matches most recent entry (updates timestamp), otherwise prepends; caps at 50 records
    - Implement `createScanRecord(barcode, product)` — maps OFF product fields to ScanRecord shape with ISO 8601 timestamp
    - Implement `getScanHistory()` — reads from AsyncStorage, deserializes
    - Implement `saveScanRecord(barcode, product)` — reads current history, calls addRecord, writes back
    - Implement `clearScanHistory()` — removes the key from AsyncStorage
    - Export pure functions (`serializeScanHistory`, `deserializeScanHistory`, `addRecord`, `createScanRecord`) for testing
    - _Requirements: 6.1, 6.2, 9.4, 10.1, 10.2, 10.3, 10.4_
  - [ ]* 2.2 Write property test: Barcode validation correctness (Property 1)
    - **Property 1: Barcode validation correctness**
    - Generate random strings (empty, short, long, numeric, alphanumeric, special chars) and verify `validateBarcode` returns correct result based on length and character content
    - Test file: `mobile app/src/__tests__/scanner.property.test.js`
    - **Validates: Requirements 1.3, 2.2, 2.3, 2.4**
  - [ ]* 2.3 Write property test: History cap and deduplication (Property 7)
    - **Property 7: History cap and deduplication**
    - Generate random histories (0–50 records) and new records; verify `addRecord` maintains cap of 50 and handles dedup correctly
    - Test file: `mobile app/src/__tests__/scanner.property.test.js`
    - **Validates: Requirements 6.2, 9.4**
  - [ ]* 2.4 Write property test: History sort order invariant (Property 8)
    - **Property 8: History sort order invariant**
    - Generate random sequences of `addRecord` calls; verify resulting array is always sorted by `scannedAt` descending
    - Test file: `mobile app/src/__tests__/scanner.property.test.js`
    - **Validates: Requirements 6.3**
  - [ ]* 2.5 Write property test: Scan history JSON round-trip (Property 9)
    - **Property 9: Scan history JSON round-trip**
    - Generate random arrays of ScanRecord objects; verify `deserializeScanHistory(serializeScanHistory(records))` produces deeply equal result
    - Test file: `mobile app/src/__tests__/scanner.property.test.js`
    - **Validates: Requirements 10.2**
  - [ ]* 2.6 Write property test: Invalid JSON deserializes to empty array (Property 10)
    - **Property 10: Invalid JSON deserializes to empty array**
    - Generate random non-JSON strings, null, undefined, empty string, partial JSON; verify `deserializeScanHistory` returns `[]` without throwing
    - Test file: `mobile app/src/__tests__/scanner.property.test.js`
    - **Validates: Requirements 10.3**
  - [ ]* 2.7 Write property test: ScanRecord creation from OFF product (Property 6)
    - **Property 6: ScanRecord creation from OFF product**
    - Generate random OFF product objects with varying field values; verify `createScanRecord` output contains all required fields correctly mapped
    - Test file: `mobile app/src/__tests__/scanner.property.test.js`
    - **Validates: Requirements 6.1**

- [x] 3. Implement reusable display components
  - [x] 3.1 Create `mobile app/src/components/NutriScoreBadge.js`
    - Implement `getNutriScoreColor(grade)` — maps a/b/c/d/e (case-insensitive) to hex colours, returns null for invalid input
    - Render a colour-coded badge with white bold letter for the grade
    - Use theme fonts and spacing
    - _Requirements: 5.2, 8.1, 8.3_
  - [x] 3.2 Create `mobile app/src/components/NovaGroupLabel.js`
    - Implement `getNovaLabel(group)` — maps 1/2/3/4 to descriptive labels, returns null for invalid input
    - Render the NOVA group number alongside the descriptive label
    - Use theme fonts and spacing
    - _Requirements: 5.3, 8.1, 8.3_
  - [x] 3.3 Create `mobile app/src/components/AdditiveBadge.js`
    - Implement `getAdditiveColors(risk)` — maps low/moderate/high/unknown to bg/text colour pairs, defaults to unknown
    - Render E-number and name with risk-coloured background
    - Use theme fonts and spacing
    - _Requirements: 5.5, 8.1, 8.3_
  - [x] 3.4 Create `mobile app/src/components/NutritionTable.js`
    - Render a per-100g nutrition facts table: energy, fat, saturated fat, carbohydrates, sugars, proteins, salt, fibre
    - Use theme fonts, spacing, and card styling
    - _Requirements: 5.7, 8.1, 8.3, 8.4_
  - [ ]* 3.5 Write property test: Nutri-Score colour mapping (Property 2)
    - **Property 2: Nutri-Score colour mapping**
    - Generate random Nutri-Score grades from {a,b,c,d,e,null,undefined,'x','Z'}; verify `getNutriScoreColor` returns correct colour or null
    - Test file: `mobile app/src/__tests__/scanner.property.test.js`
    - **Validates: Requirements 5.2**
  - [ ]* 3.6 Write property test: NOVA group label mapping (Property 3)
    - **Property 3: NOVA group label mapping**
    - Generate random NOVA groups from {1,2,3,4,null,undefined,0,5,99}; verify `getNovaLabel` returns correct label or null
    - Test file: `mobile app/src/__tests__/scanner.property.test.js`
    - **Validates: Requirements 5.3**
  - [ ]* 3.7 Write property test: Additive risk colour mapping (Property 4)
    - **Property 4: Additive risk colour mapping**
    - Generate random risk levels from {low,moderate,high,unknown} plus random invalid strings; verify `getAdditiveColors` returns correct colour pair or defaults to unknown
    - Test file: `mobile app/src/__tests__/scanner.property.test.js`
    - **Validates: Requirements 5.5**

- [x] 4. Checkpoint
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implement ScannerScreen
  - [x] 5.1 Create `mobile app/src/screens/ScannerScreen.js`
    - Import `CameraView` and `useCameraPermissions` from `expo-camera`
    - Implement permission handling: loading state, denied state (explanation + "Open Settings" button via `Linking.openSettings()`), granted state (camera viewfinder)
    - Configure `CameraView` with `facing="back"`, `barcodeScannerSettings: { barcodeTypes: ['ean13'] }`, and `onBarcodeScanned` toggled via `scanned` state flag
    - Implement `handleBarcodeScanned({ type, data })` — validates 13-digit numeric, sets scanned flag, calls `lookupProduct`
    - Implement `validateBarcode(input)` — returns `{ valid, error }` with specific error messages for non-numeric and wrong-length inputs
    - Implement manual entry input with numeric keyboard and submit button
    - Implement `lookupProduct(barcode)` — calls `apiClient.get(/api/off/product/${barcode})`, handles found/not-found/504/network-error states
    - Show `ActivityIndicator` overlay during lookup with barcode text
    - Show `OfflineBanner` at top; disable scan/lookup buttons when offline (use `@react-native-community/netinfo`)
    - Add history navigation button to access ScanHistoryScreen
    - Use theme colours (primary #1F6B4E, background #FAFAF7), Inter fonts, and existing component patterns
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 7.4, 8.1, 8.2, 8.3, 9.1, 9.2, 9.3_

- [x] 6. Implement ResultCardScreen
  - [x] 6.1 Create `mobile app/src/screens/ResultCardScreen.js`
    - Receive `product` (OFF data) and `barcode` via navigation params
    - If `product` is null (navigated from history), re-fetch from OFF proxy using barcode
    - On mount, save scan record via `saveScanRecord(barcode, product)`
    - Implement `crossReferenceReport(barcode)` — fetches `GET /api/reports`, finds matching report by barcode field
    - Layout sections top to bottom: ChoosePure Lab Report (conditional), product header (name/brand/image), NutriScoreBadge, NovaGroupLabel, ingredients, AdditiveBadge list, allergens, NutritionTable, attribution text
    - "View Full Report" button navigates to ReportDetailScreen (ScanReportDetail) with report ID
    - Handle missing product image with "No Image" placeholder (same pattern as DashboardScreen)
    - Show `ActivityIndicator` while fetching reports for cross-reference
    - Use card styling: white background, 1px #E0E0E0 border, 12px border radius, subtle shadow
    - Use theme colours, Inter fonts
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 6.1, 8.1, 8.2, 8.3, 8.4_
  - [ ]* 6.2 Write property test: Report cross-reference by barcode (Property 5)
    - **Property 5: Report cross-reference by barcode**
    - Generate random arrays of report objects (0–20 reports, some with barcode fields, some without) and random 13-digit barcodes; verify cross-reference returns correct match or null
    - Test file: `mobile app/src/__tests__/scanner.property.test.js`
    - **Validates: Requirements 4.1**

- [x] 7. Implement ScanHistoryScreen
  - [x] 7.1 Create `mobile app/src/screens/ScanHistoryScreen.js`
    - Use `useFocusEffect` to reload history from `getScanHistory()` each time screen is focused
    - Render FlatList of scan records showing product name, brand, Nutri-Score badge, timestamp
    - Tapping a record navigates to ResultCard with `{ barcode: record.barcode, product: null }` to trigger re-fetch
    - Implement "Clear History" button that calls `clearScanHistory()` and resets state
    - Show empty state message "No scans yet. Scan a product to get started." when no records
    - Records displayed in descending timestamp order (already sorted by store)
    - Use theme colours, Inter fonts, card styling
    - _Requirements: 6.3, 6.4, 6.5, 6.6, 8.1, 8.2, 8.3_

- [x] 8. Wire navigation — update MainTabs.js
  - [x] 8.1 Update `mobile app/src/navigation/MainTabs.js`
    - Import ScannerScreen, ResultCardScreen, ScanHistoryScreen
    - Create `ScanStack` stack navigator and `ScannerStackScreen` function with screens: ScannerHome, ResultCard, ScanHistory, ScanReportDetail (ReportDetailScreen)
    - Add `Scan` tab between Dashboard and Polling in the Tab.Navigator
    - Update `TabIcon` icons map to include `Scan: '📷'`
    - _Requirements: 7.1, 7.2, 7.3_

- [x] 9. Final checkpoint
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document (Properties 1–10)
- Unit tests validate specific examples and edge cases
- All property tests go in `mobile app/src/__tests__/scanner.property.test.js` using `fast-check` (already in devDependencies)
- The existing `ReportDetailScreen` is reused within the scanner stack — no new implementation needed for it
