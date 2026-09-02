# Implementation Plan: Home Screen Redesign

## Overview

Surgical, targeted changes across six files (plus one new component and one new backend endpoint). The work is organized into independent parallel tracks that converge at the `DashboardScreen` wiring step. Property-based tests validate the four correctness properties defined in the design document.

---

## Tasks

- [x] 1. Remove duplicate stack header in MainTabs
  - [x] 1.1 Change `DashboardHome` screen options from `{{ title: 'Home' }}` to `{{ headerShown: false }}`
    - File: `mobile app/src/navigation/MainTabs.js`
    - Locate `HomeStack.Screen name="DashboardHome"` and update its `options` prop
    - Verify no other screens in `HomeTabStack` are affected (`stackScreenOptions` shared config must remain unchanged)
    - _Requirements: 6.1, 6.2_

- [x] 2. Migrate NutriGradeBadge to scoreTokens
  - [x] 2.1 Remove local `GRADE_COLORS` const and wire to `getNutriScoreToken`
    - File: `mobile app/src/components/NutriGradeBadge.js`
    - Remove the local `GRADE_COLORS` constant entirely
    - Add `import { getNutriScoreToken } from '../utils/scoreTokens'`
    - Rewrite `getNutriGradeColor(grade)` to derive `{ bg, text }` from the token: `bg = token.color`, `text = darkTextGrades.includes(grade) ? '#1A201A' : '#FFFFFF'` (Grade C requires dark text on amber `#E8A33D`)
    - Update `displayGrade` fallback guard from `GRADE_COLORS[grade] ? grade : 'C'` to `NUTRI_SCORE_TOKENS[grade] ? grade : 'C'` (import `NUTRI_SCORE_TOKENS` from `scoreTokens`)
    - Exported function signature `getNutriGradeColor(grade): { bg, text }` must remain unchanged
    - _Requirements: 2.3, 2.4_

  - [ ]* 2.2 Write property test for score token color band-correctness (Property 2)
    - File: `mobile app/src/utils/__tests__/scoreTokens.test.js`
    - **Property 2: Score token color is band-correct**
    - **Validates: Requirements 2.1, 2.2**
    - Using `fast-check`, assert that for any `score` in 0–100, `getLabScoreToken(score).color` returns the expected hex: 0–40 → `#D64545`, 41–60 → `#E8A33D`, 61–80 → `#7CB342`, 81–100 → `#2E7D32`
    - Also assert that two scores in the same band return the same color
    - Run minimum 100 iterations (`numRuns: 100`)

- [x] 3. Add explicit ellipsizeMode to ProductCard name text
  - [x] 3.1 Make `ellipsizeMode="tail"` explicit on the name `<Text>` element
    - File: `mobile app/src/components/ProductCard.js`
    - Locate the `<Text style={styles.name} numberOfLines={2}>` element and add `ellipsizeMode="tail"` prop explicitly
    - No functional change expected (React Native defaults to `"tail"`), but explicitness prevents accidental drift
    - _Requirements: 3.1, 3.2_

- [ ] 4. Update PopularProductsSection — token migration, callback, caption, minHeight
  - [x] 4.1 Remove local `NUTRISCORE_COLORS` and replace inline badge with `NutriGradeBadge`
    - File: `mobile app/src/components/PopularProductsSection.js`
    - Remove the local `NUTRISCORE_COLORS` constant
    - Add `import NutriGradeBadge from './NutriGradeBadge'`
    - In `renderProduct`, replace the raw `<View style={[styles.nutriBadge, { backgroundColor: NUTRISCORE_COLORS[...] }]}>` + `<Text>` pattern with `<NutriGradeBadge grade={item.nutriscoreGrade} size={28} />`
    - Remove `styles.nutriBadge` and `styles.nutriText` from the StyleSheet (now unused)
    - Dependency: Task 2.1 must be complete (NutriGradeBadge must be reading from scoreTokens)
    - _Requirements: 2.3, 2.4_

  - [ ] 4.2 Add `onGradesResolved` callback prop
    - File: `mobile app/src/components/PopularProductsSection.js`
    - Add optional `onGradesResolved` prop to the component signature
    - Add a `useEffect` that fires after products load: extract `nutriscoreGrade` from each product, filter out falsy values, uppercase them, and call `onGradesResolved(grades)` if the prop is provided
    - Effect dependencies: `[products, loading, onGradesResolved]`
    - _Requirements: 8.3, 8.4_

  - [~] 4.3 Add `caption` prop and `cardBody` minHeight
    - File: `mobile app/src/components/PopularProductsSection.js`
    - Add optional `caption` prop to the component signature
    - Render `<Text style={styles.caption}>{caption}</Text>` below the section title when `caption` is non-null
    - Add `styles.caption` to StyleSheet: `fontFamily: theme.fonts.regular`, `fontSize: theme.fontSize.xs`, `color: theme.colors.textSecondary`, `paddingHorizontal: theme.spacing.lg`, `marginBottom: theme.spacing.sm`, `fontStyle: 'italic'`
    - Add `minHeight: 72` to `styles.cardBody` so all cards in a horizontal row stay vertically aligned
    - _Requirements: 3.4, 8.3, 8.4_

  - [ ]* 4.4 Write property test for cautionary caption visibility (Property 4)
    - File: `mobile app/src/components/__tests__/PopularProductsSection.test.js`
    - **Property 4: Cautionary caption visibility follows grade set**
    - **Validates: Requirements 8.3, 8.4**
    - Extract or import the pure `shouldShowCaption(grades)` helper (the caption logic from `DashboardScreen`)
    - Using `fast-check`, assert: for any array of grade strings drawn from `['A','B','C','D','E']`, `shouldShowCaption(grades)` returns `true` iff at least one grade is `C`, `D`, or `E`, and returns `false` when all grades are `A` or `B` (or array is empty)
    - Run minimum 100 iterations

- [x] 5. Create VotingModule component
  - [x] 5.1 Scaffold VotingModule with internal state and data fetching
    - File: `mobile app/src/components/VotingModule.js` (new file)
    - Define props: `onProductPress: (productId: string) => void`
    - Define internal state: `closeToTested` (array), `myVotes` (object or null), `loading` (boolean)
    - Implement data fetch 1 on mount: `GET /api/products?status=active` via `apiClient`, client-filter to `totalVotes >= 540 && totalVotes < 600`, sort descending by `totalVotes`, slice to 5 results
    - Implement data fetch 2 on mount: `GET /api/user/my-votes` via `apiClient`; on failure, fall back to `{ totalVotes: user?.votesCount ?? 0, products: [] }` using `useAuth()`
    - Export pure function `filterCloseToTested(products)` for testability (used in Task 8)
    - Render `null` when `closeToTested` is empty AND `myVotes.totalVotes === 0`
    - _Requirements: 5.1, 5.2, 5.3_

  - [x] 5.2 Build VotingModule render structure and styles
    - File: `mobile app/src/components/VotingModule.js`
    - Section header: "Help Choose What Gets Tested" + sub-caption "Products need 600 votes to trigger a lab test"
    - "Close to Being Tested" sub-module (when `closeToTested.length > 0`): sub-header text, map products to a `VoteProgressRow` showing product name, vote count chip `"{totalVotes} / 600 votes"`, and a progress bar (`filled = totalVotes / 600`)
    - "Your Contribution" sub-module (when `myVotes.totalVotes > 0`): sub-header text, "You've cast {n} vote(s)" text, compact product name list (when `myVotes.products.length > 0`)
    - Tapping any product row calls `onProductPress(product._id)`
    - Apply all styles using theme tokens (see design.md Styles section): `container`, `sectionTitle`, `subCaption`, `card`, `progressBarTrack`, `progressBarFill`, `votesChip`
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [ ]* 5.3 Write property test for filterCloseToTested (Property 3)
    - File: `mobile app/src/components/__tests__/VotingModule.test.js`
    - **Property 3: "Close to Tested" filter correctness**
    - **Validates: Requirements 5.2**
    - Import `filterCloseToTested` from `VotingModule`
    - Using `fast-check`, generate arbitrary arrays of product objects with `totalVotes` in 0–800
    - Assert: all returned products have `totalVotes >= 540 && totalVotes < 600`
    - Assert: result length is at most 5
    - Assert: result is sorted descending by `totalVotes`
    - Run minimum 100 iterations

- [x] 6. Add backend `/api/user/my-votes` endpoint
  - [x] 6.1 Implement authenticated `GET /api/user/my-votes` in `server.js`
    - File: `server.js`
    - Add a new authenticated route `GET /api/user/my-votes`
    - Query the `vote_transactions` collection where `userId === req.user.id`
    - Return `{ totalVotes: count, products: [ { _id, productName, totalVotes } ] }` where products are the distinct voted-on items
    - Ensure the route is protected by the existing auth middleware (same pattern as other authenticated routes)
    - Can be built in parallel with all frontend tasks (Tasks 1–5)
    - _Requirements: 5.3_

- [ ] 7. Wire everything together in DashboardScreen
  - [~] 7.1 Add VotingModule import and `popularGrades` state
    - File: `mobile app/src/screens/DashboardScreen.js`
    - Add `import VotingModule from '../components/VotingModule'`
    - Add `const [popularGrades, setPopularGrades] = useState([])` to the component's state declarations
    - Dependency: Task 5 (VotingModule component must exist)
    - _Requirements: 5.1, 8.3_

  - [~] 7.2 Insert VotingModule and update PopularProductsSection props in JSX
    - File: `mobile app/src/screens/DashboardScreen.js`
    - Insert `<VotingModule onProductPress={(productId) => navigation.navigate('Polling', { productId })} />` in the ScrollView/scroll content, positioned directly above `<PopularProductsSection>`
    - Update `<PopularProductsSection>` to pass `onGradesResolved={setPopularGrades}` and `caption={popularGrades.some(g => ['C','D','E'].includes(g)) ? "Popular doesn't always mean healthy — check before you buy" : null}`
    - Dependency: Tasks 4.2, 4.3, 5.1, 5.2
    - _Requirements: 5.1, 6.3, 8.3, 8.4_

  - [~] 7.3 Replace load-more button with styled chip
    - File: `mobile app/src/screens/DashboardScreen.js`
    - Locate the existing `<TouchableOpacity style={styles.loadMoreButton}>` element
    - Replace with a styled pill chip: `<TouchableOpacity style={styles.loadMoreChip} onPress={loadMoreNutriProducts} activeOpacity={0.75}>`
    - Inside, render `<ActivityIndicator size="small" color={theme.colors.primary} />` when `nutriLoadingMore` is true, otherwise `<Text style={styles.loadMoreChipText}>Load more products</Text>`
    - Add new styles `loadMoreChip` and `loadMoreChipText` to the StyleSheet (see design.md for exact token values: `borderRadius: theme.borderRadius.lg`, `borderColor: theme.colors.primary`, `backgroundColor: theme.colors.green50`, etc.)
    - Remove old `loadMoreButton` and `loadMoreText` style entries
    - _Requirements: 7.1, 7.3_

- [~] 8. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. Write remaining property-based tests
  - [ ]* 9.1 Write property test for Lab Score caption always present (Property 1)
    - File: `mobile app/src/utils/__tests__/scoreTokens.test.js`
    - **Property 1: Lab Score caption always present**
    - **Validates: Requirements 1.2**
    - Using `fast-check` with `@testing-library/react-native`, assert that for any integer `score` in 0–100, rendering `<ScoreBadge score={score} />` produces a component tree containing the text `"Lab Score"`
    - Run minimum 100 iterations

- [~] 10. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Task 6 (backend endpoint) is fully independent and can be built in parallel with all frontend tasks
- Tasks 1, 3, and 6 are single-file, zero-dependency changes — good candidates for a first commit
- Task 2.1 must complete before Task 4.1 (PopularProductsSection imports NutriGradeBadge)
- Tasks 4 and 5 must both be complete before Task 7 (DashboardScreen wiring)
- Property tests use `fast-check` (already in `devDependencies`); no new test infrastructure needed
- The `shouldShowCaption` helper referenced in Task 4.4's property test is the pure caption logic extracted from `DashboardScreen`; it may need to be exported from a shared utils file or tested inline depending on implementation choice

---

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "2.1", "3.1", "5.1", "6.1"] },
    { "id": 1, "tasks": ["2.2", "4.1", "5.2"] },
    { "id": 2, "tasks": ["4.2", "4.3", "5.3"] },
    { "id": 3, "tasks": ["4.4", "7.1"] },
    { "id": 4, "tasks": ["7.2", "7.3"] },
    { "id": 5, "tasks": ["9.1"] }
  ]
}
```
