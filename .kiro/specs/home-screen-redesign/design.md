# Design Document — Home Screen Redesign

## Overview

This document describes the implementation plan for the ChoosePure Home screen redesign. The changes are surgical and targeted: eight requirements touching six files. There is no architectural upheaval — no new navigation stacks, no new state-management libraries, no changes to API contracts beyond one new endpoint for user vote data.

The work falls into four buckets:

1. **Token migration** — pull `NutriGradeBadge` off its local `GRADE_COLORS` constant and onto `scoreTokens.js`.
2. **Component tweaks** — `ProductCard` name wrapping, `DashboardScreen` load-more chip styling.
3. **New component** — `VotingModule` inserted above `PopularProductsSection`.
4. **Wiring changes** — `PopularProductsSection` `onGradesResolved` callback, `MainTabs.js` header suppression, `DashboardScreen` caption logic.

---

## Architecture

No structural changes to the navigation graph or data layer. All changes live within the `HomeTabStack` and the components it renders.

```
MainTabs
└── HomeTabStack
    └── DashboardHome (DashboardScreen)          ← headerShown: false (new)
        ├── Header + Search Card                  ← no change
        ├── Latest Testing Reports (FlatList)     ← no change
        ├── Check Nutri-Score (Dropdown + FlatList)
        │   └── Load More chip                    ← styled (Req 7)
        ├── VotingModule                          ← NEW (Req 5)
        │   ├── CloseToTestedSubModule
        │   └── PersonalVotingSummarySubModule
        └── PopularProductsSection                ← onGradesResolved prop (Req 8)
            └── caption (conditional)             ← rendered by DashboardScreen
```

---

## Component Changes

### `MainTabs.js`
**File:** `mobile app/src/navigation/MainTabs.js`

**Change:** Inside `HomeTabStack`, the `DashboardHome` screen currently has `options={{ title: 'Home' }}`. This causes React Navigation to render a stack header bar above `DashboardScreen`'s own header content — a visible duplicate "Home" title above the ChoosePure wordmark.

**Fix:** Change the `options` prop to `headerShown: false`:

```js
// Before
<HomeStack.Screen
  name="DashboardHome"
  component={DashboardScreen}
  options={{ title: 'Home' }}
/>

// After
<HomeStack.Screen
  name="DashboardHome"
  component={DashboardScreen}
  options={{ headerShown: false }}
/>
```

`stackScreenOptions` (shared across all stack screens) already has `elevation: 0` and `shadowOpacity: 0`, so toggling `headerShown: false` on just this one screen is safe and will not affect `ReportDetail`, `AllReports`, or any other pushed screen in `HomeTabStack`.

---

### `NutriGradeBadge.js`
**File:** `mobile app/src/components/NutriGradeBadge.js`

**Change:** The component currently maintains a local `GRADE_COLORS` constant that diverges from `scoreTokens.js`. For example, Grade D in `GRADE_COLORS` is `#E89B3C` while `NUTRI_SCORE_TOKENS.D.color` is `#EF6C00`. This violates Req 2's single-source-of-truth rule.

**Fix:** Remove `GRADE_COLORS`, import `getNutriScoreToken` from `scoreTokens.js`, and derive colors from the token:

```js
// Remove this:
const GRADE_COLORS = {
  A: { bg: '#1E8449', text: '#FFFFFF' },
  ...
};

// Add this import:
import { getNutriScoreToken } from '../utils/scoreTokens';

// Update getNutriGradeColor:
export function getNutriGradeColor(grade) {
  const token = getNutriScoreToken(grade);
  // Determine text color: dark grades (C has amber bg) need dark text
  const darkTextGrades = ['C'];
  return {
    bg: token.color,
    text: darkTextGrades.includes((grade || '').toUpperCase()) ? '#1A201A' : '#FFFFFF',
  };
}
```

The text-color logic for Grade C (dark text on amber `#E8A33D`) is preserved via the explicit `darkTextGrades` check. All other grades remain white text, consistent with current behavior and the `scoreTokens.js` color values.

`displayGrade` logic remains: fall back to rendering `'C'` for unknown grades (the existing `GRADE_COLORS[grade] ? grade : 'C'` guard becomes `NUTRI_SCORE_TOKENS[grade] ? grade : 'C'`).

The exported `getNutriGradeColor` function keeps the same signature `(grade) => { bg, text }` so any callers (e.g. `PopularProductsSection`) don't break.

**PopularProductsSection note:** `PopularProductsSection` currently has its own local `NUTRISCORE_COLORS` object and renders a raw `<View>` badge instead of using `NutriGradeBadge`. As part of Req 2, replace that local object with calls to `getNutriScoreToken` from `scoreTokens.js`, and replace the inline badge with `<NutriGradeBadge>` to get consistent rendering across the app.

---

### `ProductCard.js`
**File:** `mobile app/src/components/ProductCard.js`

**Change (Req 3.1 / 3.2):** The `name` `<Text>` currently has `numberOfLines={2}` already set — confirmed in the existing source. Verify `ellipsizeMode="tail"` is explicit (React Native defaults to `"tail"` but the prop should be made explicit for clarity):

```js
<Text
  style={styles.name}
  numberOfLines={2}
  ellipsizeMode="tail"     // make explicit
>
  {name}
</Text>
```

No functional change is expected here since `"tail"` is the default, but explicitness prevents accidental drift.

**Change (Req 3.4 — row alignment in PopularProductsSection):** The `cardBody` style in `PopularProductsSection` needs a `minHeight` so all cards in the horizontal row align regardless of how much name text they contain. This change lives in `PopularProductsSection.js`, not `ProductCard.js`:

```js
cardBody: {
  padding: 10,
  minHeight: 72,   // sufficient for 2 lines of name + brand + badge
},
```

---

### `PopularProductsSection.js`
**File:** `mobile app/src/components/PopularProductsSection.js`

**Change 1 — Token migration (Req 2):** Remove local `NUTRISCORE_COLORS` const. Replace the inline `<View style={[styles.nutriBadge, { backgroundColor: NUTRISCORE_COLORS[...] }]}>` badge with `<NutriGradeBadge>`:

```js
// Remove:
const NUTRISCORE_COLORS = { A: '#1E8449', ... };

// Add import:
import NutriGradeBadge from './NutriGradeBadge';

// In renderProduct, replace:
{item.nutriscoreGrade ? (
  <View style={[styles.nutriBadge, { backgroundColor: NUTRISCORE_COLORS[item.nutriscoreGrade] || '#9E9E9E' }]}>
    <Text style={styles.nutriText}>{item.nutriscoreGrade}</Text>
  </View>
) : null}

// With:
{item.nutriscoreGrade ? (
  <NutriGradeBadge grade={item.nutriscoreGrade} size={28} />
) : null}
```

Remove `styles.nutriBadge` and `styles.nutriText` from the StyleSheet as they become unused.

**Change 2 — `onGradesResolved` callback (Req 8):** After products load, extract the unique `nutriscoreGrade` values and pass them up to the parent via a new optional `onGradesResolved` prop:

```js
export default function PopularProductsSection({ onProductPress, onGradesResolved }) {
  const { products, loading, error } = usePopularProducts();

  useEffect(() => {
    if (!loading && products.length > 0 && onGradesResolved) {
      const grades = products
        .map((p) => p.nutriscoreGrade)
        .filter(Boolean)
        .map((g) => g.toUpperCase());
      onGradesResolved(grades);
    }
  }, [products, loading, onGradesResolved]);
  // ...
}
```

The callback fires once products have loaded. `DashboardScreen` will use these grades to decide whether to render the cautionary caption.

**Change 3 — `cardBody` minHeight (Req 3.4):**

```js
cardBody: {
  padding: 10,
  minHeight: 72,
},
```

**Change 4 — Section title area (Req 8.3):** The section title and caption are now rendered by `DashboardScreen` (see below) rather than internally, so `PopularProductsSection` no longer needs to own the `<Text style={styles.sectionTitle}>Popular Products</Text>` element. Two options:

- **Option A (preferred):** Keep the title inside `PopularProductsSection` and accept an optional `caption` prop that renders below it.
- **Option B:** Hoist the entire section header to `DashboardScreen`.

Option A keeps the component self-contained and avoids scattering layout into the parent. Add a `caption` prop:

```js
export default function PopularProductsSection({ onProductPress, onGradesResolved, caption }) {
  // ...
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Popular Products</Text>
      {caption ? (
        <Text style={styles.caption}>{caption}</Text>
      ) : null}
      {/* FlatList ... */}
    </View>
  );
}

// In StyleSheet:
caption: {
  fontFamily: theme.fonts.regular,
  fontSize: theme.fontSize.xs,
  color: theme.colors.textSecondary,
  paddingHorizontal: theme.spacing.lg,
  marginBottom: theme.spacing.sm,
  fontStyle: 'italic',
},
```

`DashboardScreen` computes whether a caption is needed and passes it down as a string or `null`.

---

### `DashboardScreen.js`
**File:** `mobile app/src/screens/DashboardScreen.js`

**Change 1 — Load More chip (Req 7):** Replace the bare `loadMoreButton`/`loadMoreText` styles with a proper pill chip. The current code:

```js
<TouchableOpacity style={styles.loadMoreButton} onPress={loadMoreNutriProducts}>
  <Text style={styles.loadMoreText}>Load more products</Text>
</TouchableOpacity>
```

Replace with:

```js
<TouchableOpacity
  style={styles.loadMoreChip}
  onPress={loadMoreNutriProducts}
  activeOpacity={0.75}
>
  {nutriLoadingMore ? (
    <ActivityIndicator size="small" color={theme.colors.primary} />
  ) : (
    <Text style={styles.loadMoreChipText}>Load more products</Text>
  )}
</TouchableOpacity>
```

New styles (replacing the old `loadMoreButton` / `loadMoreText`):

```js
loadMoreChip: {
  alignSelf: 'center',
  paddingVertical: 10,
  paddingHorizontal: 24,
  borderRadius: theme.borderRadius.lg,        // 14
  borderWidth: 1.5,
  borderColor: theme.colors.primary,
  backgroundColor: theme.colors.green50,      // #EDF3EE
  marginTop: 8,
  marginBottom: 28,
  minWidth: 140,
  alignItems: 'center',
},
loadMoreChipText: {
  fontFamily: theme.fonts.semiBold,
  fontSize: theme.fontSize.sm,
  color: theme.colors.primary,
},
```

The `ActivityIndicator` already imported at the top of `DashboardScreen.js` is used here. The guard `!nutriHasMore || nutriLoadingMore || nutriLoading` in `loadMoreNutriProducts` already debounces duplicate fetches.

**Change 2 — VotingModule insertion (Req 5):** Add new state and position the module above `PopularProductsSection` in the scroll view:

```js
// New state in DashboardScreen:
const [popularGrades, setPopularGrades] = useState([]);
```

In the JSX, just before `<PopularProductsSection>`:

```js
<VotingModule
  onProductPress={(productId) =>
    navigation.navigate('Polling', { productId })
  }
/>
```

Then `<PopularProductsSection>` with the new props:

```js
<PopularProductsSection
  onProductPress={(product) => {
    if (product.barcode) {
      navigation.navigate('ProductDetail', { barcode: product.barcode, product });
    }
  }}
  onGradesResolved={setPopularGrades}
  caption={
    popularGrades.some((g) => ['C', 'D', 'E'].includes(g))
      ? "Popular doesn't always mean healthy — check before you buy"
      : null
  }
/>
```

**Change 3 — Import VotingModule:**

```js
import VotingModule from '../components/VotingModule';
```

---

### `ScoreBadge.js`
**File:** `mobile app/src/components/ScoreBadge.js`

No changes required. Already compliant: circle shape, numeric value, "Lab Score" caption, reads from `getLabScoreToken`. Req 1 and Req 2 are satisfied as-is for this component.

---

### `scoreTokens.js`
**File:** `mobile app/src/utils/scoreTokens.js`

No changes required. Already exports `LAB_SCORE_BANDS`, `getLabScoreToken`, `NUTRI_SCORE_TOKENS`, `getNutriScoreToken`. It is the correct single source of truth.

---

## New Components

### `VotingModule`
**File (new):** `mobile app/src/components/VotingModule.js`

#### Purpose

Surfaces the voting feature on the home screen to drive engagement toward the 600-vote testing threshold. Renders two sub-modules:

1. **Close to Being Tested** — up to 5 products currently in the range `totalVotes >= 540 && totalVotes < 600`, sorted descending by `totalVotes`.
2. **Personal Voting Summary** — total votes cast by the signed-in user, and the products they voted for (from `GET /api/user/my-votes` or fallback `votesCount` field on `/api/user/me`).

#### Props

| Prop | Type | Required | Description |
|---|---|---|---|
| `onProductPress` | `(productId: string) => void` | Yes | Called when user taps a product row; should call `navigation.navigate('Polling', { productId })` |

#### Internal state

```js
const [closeToTested, setCloseToTested] = useState([]);   // filtered products
const [myVotes, setMyVotes] = useState(null);              // { totalVotes, products }
const [loading, setLoading] = useState(true);
```

#### Data fetching

```js
// "Close to being tested" — client-side filter on active products
const res = await apiClient.get('/api/products?status=active');
const all = res.data.products || [];
const filtered = all
  .filter((p) => p.totalVotes >= 540 && p.totalVotes < 600)
  .sort((a, b) => b.totalVotes - a.totalVotes)
  .slice(0, 5);
setCloseToTested(filtered);

// Personal voting summary
try {
  const votesRes = await apiClient.get('/api/user/my-votes');
  setMyVotes(votesRes.data);
} catch {
  // Fallback: use votesCount from /api/user/me (already available via useAuth)
  setMyVotes({ totalVotes: user?.votesCount ?? 0, products: [] });
}
```

#### Render structure

```
VotingModule container (View)
├── Section header: "Help Choose What Gets Tested"
│   └── sub-caption: "Products need 600 votes to trigger a lab test"
│
├── [if closeToTested.length > 0]
│   ├── Sub-header: "Close to Being Tested"
│   └── closeToTested.map → VoteProgressRow
│       ├── Product name
│       ├── Vote count chip: "{totalVotes} / 600 votes"
│       └── Progress bar (filled = totalVotes / 600)
│
└── [if myVotes && myVotes.totalVotes > 0]
    ├── Sub-header: "Your Contribution"
    └── "You've cast {myVotes.totalVotes} vote{s}"
        └── [if myVotes.products.length > 0] compact product name list
```

If `closeToTested` is empty and `myVotes` has no data, the module renders `null` to avoid showing an empty card.

#### Styles (use theme tokens)

```js
container: {
  marginTop: theme.spacing.lg,
  marginBottom: theme.spacing.md,
},
sectionTitle: {
  fontFamily: theme.fonts.bold,
  fontSize: theme.fontSize.xl,
  color: theme.colors.text,
  marginBottom: 2,
},
subCaption: {
  fontFamily: theme.fonts.regular,
  fontSize: theme.fontSize.xs,
  color: theme.colors.textSecondary,
  marginBottom: theme.spacing.sm,
},
card: {
  backgroundColor: theme.colors.cardBackground,
  borderRadius: theme.borderRadius.lg,   // 14
  padding: theme.spacing.md,             // 16
  marginBottom: 10,
  ...theme.shadow.card,
},
progressBarTrack: {
  height: 6,
  borderRadius: 3,
  backgroundColor: theme.colors.green50,
  marginTop: 6,
},
progressBarFill: {
  height: 6,
  borderRadius: 3,
  backgroundColor: theme.colors.primary,
},
votesChip: {
  fontFamily: theme.fonts.semiBold,
  fontSize: theme.fontSize.xs,
  color: theme.colors.primary,
},
```

---

## Data Flow

```
DashboardScreen mounts
├── fetchReports()  →  /api/reports
├── fetchNutriProducts(grade, page)  →  /api/off/nutriscore?grade=…
└── [VotingModule mounts]
    ├── GET /api/products?status=active  →  client-filter [540, 600)  →  closeToTested[]
    └── GET /api/user/my-votes  →  myVotes  (fallback: user.votesCount)

PopularProductsSection mounts
└── GET /api/products/popular  →  products[]
    └── onGradesResolved(grades[])  →  DashboardScreen.setPopularGrades
        └── popularGrades.some(C/D/E) ?  caption  :  null
```

State ownership:

| State | Owner | Consumed By |
|---|---|---|
| `popularGrades` | `DashboardScreen` | caption prop → `PopularProductsSection` |
| `closeToTested` | `VotingModule` | internal render |
| `myVotes` | `VotingModule` | internal render |
| `nutriLoadingMore` | `DashboardScreen` | load-more chip |

---

## Navigation Changes

### `HomeTabStack` in `MainTabs.js`

| Screen | Before | After |
|---|---|---|
| `DashboardHome` | `options={{ title: 'Home' }}` | `options={{ headerShown: false }}` |

All other screens in `HomeTabStack` (`ReportDetail`, `AllReports`, `ProductDetail`, etc.) retain their existing `title` options and inherit `stackScreenOptions` unchanged.

### `Polling` screen (already registered)

`PollingScreen` is already registered in `HomeTabStack` at `name="Polling"`. `VotingModule` uses `navigation.navigate('Polling', { productId })` which matches this registration. No new screen registration needed.

---

## Token / Color Changes

### `NutriGradeBadge` — before vs after

| Grade | Before (`GRADE_COLORS`) | After (`NUTRI_SCORE_TOKENS`) |
|---|---|---|
| A | `#1E8449` | `#2E7D32` |
| B | `#7CB342` | `#7CB342` ✓ |
| C | `#F4C430` | `#E8A33D` |
| D | `#E89B3C` | `#EF6C00` |
| E | `#D14E36` | `#D64545` |

Grades B and E are close enough that the visual change is minimal. Grades A, C, and D shift more noticeably — A moves to a slightly darker forest green, C from yellow to amber, D from tan-orange to a stronger orange. All changes align with the semantic color scale defined in `scoreTokens.js`.

### `PopularProductsSection` — local `NUTRISCORE_COLORS` removed

The local `NUTRISCORE_COLORS` object inside `PopularProductsSection.js` is removed entirely. `NutriGradeBadge` (now backed by `scoreTokens.js`) is used directly, so there is a single rendering path for Nutri-Score grade badges across the app.

---

## API Requirements

### Existing endpoints (no change)

| Endpoint | Used By | Notes |
|---|---|---|
| `GET /api/reports` | `DashboardScreen` | Unchanged |
| `GET /api/off/nutriscore?grade=X&page=N&page_size=10` | `DashboardScreen` | Unchanged |
| `GET /api/products/popular` | `PopularProductsSection` | Unchanged |
| `GET /api/products?status=active` | `VotingModule` | Already exists; client-side filters `[540, 600)` |

### New endpoint needed (Req 5.3)

**`GET /api/user/my-votes`**

Expected response shape:

```json
{
  "totalVotes": 12,
  "products": [
    { "_id": "abc123", "productName": "Amul Butter", "totalVotes": 580 }
  ]
}
```

If the endpoint is not available at implementation time, `VotingModule` falls back to `user.votesCount` from `useAuth()` (populated from `/api/user/me`). In the fallback case, `myVotes.products` is empty, so the product name list in the personal summary is omitted. The total vote count is still shown.

Fallback logic:

```js
try {
  const r = await apiClient.get('/api/user/my-votes');
  setMyVotes(r.data);
} catch {
  setMyVotes({ totalVotes: user?.votesCount ?? 0, products: [] });
}
```

---

## Components and Interfaces

### Modified Components

#### `NutriGradeBadge`
```
Props (unchanged):
  grade: 'A' | 'B' | 'C' | 'D' | 'E'
  size?: number  (default 40)

Exported function (unchanged signature):
  getNutriGradeColor(grade: string): { bg: string, text: string }

Internal change:
  GRADE_COLORS const → removed
  Color source: getNutriScoreToken(grade) from scoreTokens.js
```

#### `PopularProductsSection`
```
Props (new):
  onProductPress: (product: Product) => void   // existing
  onGradesResolved?: (grades: string[]) => void // NEW — fires after load
  caption?: string | null                       // NEW — rendered below section title

Internal exports (unchanged):
  usePopularProducts(): { products, loading, error, refetch }
```

#### `ProductCard`
```
Props (unchanged):
  name: string
  brand?: string
  meta?: string
  score?: number        // 0-100 → renders ScoreBadge
  grade?: string        // A-E → renders NutriGradeBadge
  imageUrl?: string
  imageColors?: string[]
  onPress?: () => void

Change: ellipsizeMode="tail" made explicit on name Text element
```

#### `DashboardScreen`
```
New state:
  popularGrades: string[]   // set via onGradesResolved callback

New import:
  VotingModule from '../components/VotingModule'

Updated JSX in scroll view:
  … existing sections …
  <VotingModule onProductPress={(productId) => navigate('Polling', { productId })} />
  <PopularProductsSection
    onProductPress={…}
    onGradesResolved={setPopularGrades}
    caption={popularGrades.some(g => ['C','D','E'].includes(g)) ? "…" : null}
  />

Updated load-more chip: styled pill with ActivityIndicator while nutriLoadingMore
```

### New Components

#### `VotingModule`
```
File: mobile app/src/components/VotingModule.js

Props:
  onProductPress: (productId: string) => void

Internal state:
  closeToTested: Product[]    // products with totalVotes in [540, 600)
  myVotes: MyVotes | null     // { totalVotes: number, products: Product[] }
  loading: boolean

Renders null if closeToTested is empty AND myVotes.totalVotes === 0
```

---

## Data Models

### `Product` (from `GET /api/products/popular` and `GET /api/products?status=active`)
```js
{
  _id: string,
  productName: string,
  brand?: string,
  imageUrl?: string,
  barcode?: string,
  nutriscoreGrade?: 'A' | 'B' | 'C' | 'D' | 'E',
  totalVotes?: number,       // used by VotingModule for close-to-tested filter
  status?: string,           // 'active' | 'tested' | …
}
```

### `MyVotes` (from `GET /api/user/my-votes` — new endpoint)
```js
{
  totalVotes: number,
  products: Array<{
    _id: string,
    productName: string,
    totalVotes: number,
  }>
}
```

Fallback shape when endpoint unavailable (derived from `user.votesCount` in auth context):
```js
{
  totalVotes: number,  // user.votesCount ?? 0
  products: [],        // empty — product list not shown in fallback
}
```

### `PopularGrades` (internal DashboardScreen state)
```js
// Derived by PopularProductsSection after products load
string[]  // e.g. ['A', 'B', 'C', 'A']
// Used to compute caption visibility:
// caption shown iff grades.some(g => ['C','D','E'].includes(g))
```

### `ScoreToken` (from `scoreTokens.js`)
```js
{
  band: 'poor' | 'moderate' | 'good' | 'excellent',
  color: string,   // hex color for badge background
  label: string,   // human-readable band name
}
```

### `NutriToken` (from `scoreTokens.js`)
```js
{
  band: 'poor' | 'moderate' | 'good' | 'excellent',
  color: string,   // hex color for badge background
  label: string,   // grade letter 'A'–'E'
}
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Lab Score caption always present

*For any* numeric score value in the range 0–100, rendering `ScoreBadge` with that score should produce a component tree that contains the text "Lab Score" as a caption.

**Validates: Requirements 1.2**

### Property 2: Score token color is band-correct

*For any* numeric score value in the range 0–100, calling `getLabScoreToken(score)` should return a color that matches the expected band: scores 0–40 return `#D64545`, 41–60 return `#E8A33D`, 61–80 return `#7CB342`, 81–100 return `#2E7D32`. Two scores in the same band must return the same color.

**Validates: Requirements 2.1, 2.2**

### Property 3: "Close to Tested" filter correctness

*For any* array of product objects with arbitrary `totalVotes` values, the `filterCloseToTested` function should return only and exactly the products where `totalVotes >= 540 && totalVotes < 600`, sorted descending by `totalVotes`, with a maximum of 5 results.

**Validates: Requirements 5.2**

### Property 4: Cautionary caption visibility follows grade set

*For any* array of resolved Nutri-Score grade strings, the caption "Popular doesn't always mean healthy — check before you buy" should be visible when at least one grade is C, D, or E, and absent when all grades are A or B (or the array is empty).

**Validates: Requirements 8.3, 8.4**

---

## Error Handling

| Scenario | Component | Behavior |
|---|---|---|
| `GET /api/products?status=active` fails | `VotingModule` | Hides "Close to Being Tested" sub-module; personal summary still shows if vote data loaded |
| `GET /api/user/my-votes` fails | `VotingModule` | Falls back to `user.votesCount` from auth context; product list hidden |
| Both VotingModule fetches fail | `VotingModule` | Module renders `null`; no error banner shown on home screen |
| `GET /api/products/popular` fails | `PopularProductsSection` | Existing `errorText` style renders error message; `onGradesResolved` never called; caption not shown |
| `onGradesResolved` never called (load error) | `DashboardScreen` | `popularGrades` stays `[]`; caption not shown (safe default) |
| Nutri paginated fetch fails | `DashboardScreen` | Existing empty-state handling; load-more chip not shown if `nutriHasMore` is false |

---

## Testing Strategy

### Unit Tests

- `NutriGradeBadge` renders the correct background color for each grade A–E using `scoreTokens.js` values (not the old `GRADE_COLORS` values).
- `ProductCard` has `numberOfLines={2}` and `ellipsizeMode="tail"` on the name `<Text>`.
- `DashboardScreen` load-more chip renders `ActivityIndicator` when `nutriLoadingMore` is `true`.
- `DashboardScreen` renders `VotingModule` before `PopularProductsSection` in the component tree.
- `VotingModule` renders `null` when both `closeToTested` is empty and `myVotes.totalVotes === 0`.
- `VotingModule` calls `onProductPress(productId)` with the correct product id when a product row is tapped.

### Property-Based Tests

Use the [fast-check](https://github.com/dubzzz/fast-check) library (already available in the JS ecosystem; install via `npm install --save-dev fast-check`). Each property runs a minimum of 100 iterations.

**Property 1 — Lab Score caption always present**
Tag: `Feature: home-screen-redesign, Property 1: Lab Score caption always present`

```js
fc.assert(
  fc.property(fc.integer({ min: 0, max: 100 }), (score) => {
    const { getByText } = render(<ScoreBadge score={score} />);
    expect(getByText('Lab Score')).toBeTruthy();
  }),
  { numRuns: 100 }
);
```

**Property 2 — Score token color is band-correct**
Tag: `Feature: home-screen-redesign, Property 2: Score token color is band-correct`

```js
const EXPECTED = [
  { min: 0,  max: 40,  color: '#D64545' },
  { min: 41, max: 60,  color: '#E8A33D' },
  { min: 61, max: 80,  color: '#7CB342' },
  { min: 81, max: 100, color: '#2E7D32' },
];
fc.assert(
  fc.property(fc.integer({ min: 0, max: 100 }), (score) => {
    const token = getLabScoreToken(score);
    const expected = EXPECTED.find((b) => score >= b.min && score <= b.max);
    expect(token.color).toBe(expected.color);
  }),
  { numRuns: 100 }
);
```

**Property 3 — "Close to Tested" filter correctness**
Tag: `Feature: home-screen-redesign, Property 3: Close to Tested filter correctness`

```js
fc.assert(
  fc.property(
    fc.array(fc.record({ _id: fc.uuid(), totalVotes: fc.integer({ min: 0, max: 800 }) })),
    (products) => {
      const result = filterCloseToTested(products);
      // All results must be in [540, 600)
      result.forEach((p) => {
        expect(p.totalVotes).toBeGreaterThanOrEqual(540);
        expect(p.totalVotes).toBeLessThan(600);
      });
      // At most 5 results
      expect(result.length).toBeLessThanOrEqual(5);
      // Sorted descending
      for (let i = 0; i < result.length - 1; i++) {
        expect(result[i].totalVotes).toBeGreaterThanOrEqual(result[i + 1].totalVotes);
      }
    }
  ),
  { numRuns: 100 }
);
```

`filterCloseToTested` is extracted as a pure function from `VotingModule` to make it directly testable.

**Property 4 — Cautionary caption visibility follows grade set**
Tag: `Feature: home-screen-redesign, Property 4: Cautionary caption visibility follows grade set`

```js
const ALL_GRADES = ['A', 'B', 'C', 'D', 'E'];
fc.assert(
  fc.property(fc.array(fc.constantFrom(...ALL_GRADES)), (grades) => {
    const hasLowGrade = grades.some((g) => ['C', 'D', 'E'].includes(g));
    const captionText = shouldShowCaption(grades)
      ? "Popular doesn't always mean healthy — check before you buy"
      : null;
    if (hasLowGrade) {
      expect(captionText).not.toBeNull();
    } else {
      expect(captionText).toBeNull();
    }
  }),
  { numRuns: 100 }
);
```

`shouldShowCaption` is the pure function extracted from the `caption` prop computation in `DashboardScreen`.

---

## Non-Goals

The following are explicitly out of scope for this spec:

- **PollingScreen UX changes.** `VotingModule` navigates to the existing `PollingScreen` with a `productId` param. The voting flow itself is unchanged.
- **ProductDetail score display.** Req 1.5 mentions showing both Lab Score and Nutri-Score on the detail view. That screen (`ProductDetailScreen.js`) is not modified here; the requirement is satisfied at the data/navigation level by passing full product data through navigation params.
- **Scan tab changes.** The search bar already has no scan icon (Req 4 confirmed no-op). `ScannerScreen` already has the title "Scan Product" in `ScanTabStack`.
- **Info icon visual affordance changes.** The existing `styles.infoButton` pattern already uses `theme.colors.green50` background with `activeOpacity`. No changes to the info button component or style are needed; the requirement is already met.
- **Pull-to-refresh for VotingModule.** The existing `onRefresh` in `DashboardScreen` does not call `VotingModule`'s refetch. Adding that is a follow-up.
- **Infinite scroll replacement of Load More button.** The design retains the explicit tap-to-load pattern. Infinite scroll is a separate product decision.
- **Backend changes to `GET /api/products/popular`.** The `nutriscoreGrade` field is assumed to already exist on the response objects. If it does not, that is a separate backend task.
