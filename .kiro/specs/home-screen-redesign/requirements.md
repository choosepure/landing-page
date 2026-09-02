# Requirements Document

## Introduction

This spec covers a redesign of the ChoosePure mobile app Home screen in response to a UI/UX audit conducted on the current build. The audit identified seven structural issues plus two minor items spanning scoring-system legibility, information architecture, content truncation, and engagement design. This document translates that feedback into implementable requirements.

Scope is limited to the Home screen (`Home` tab) as rendered by `DashboardScreen.js`: header/greeting, search bar, "Latest Testing Reports" section, "Check Nutri-Score" section, "Popular Products" section, and bottom navigation. Score-detail, scan, vote, and subscription flows are referenced only where the Home screen links into them.

The app uses React Native 0.76, Expo 52, React Navigation (bottom tabs + stack), Inter font, and the ChoosePure brand token system defined in `mobile app/src/theme/index.js` and `mobile app/src/utils/scoreTokens.js`.

## Glossary

- **Home_Screen**: The screen rendered by `DashboardScreen.js`, accessible via the `Home` tab in `MainTabs.js`.
- **Lab_Score**: A 0–100 numeric score derived from laboratory testing of a physical product sample. Rendered by `ScoreBadge.js` as a circle.
- **Nutri_Score**: An A–E letter grade representing a product's nutritional quality as defined by the Open Food Facts Nutri-Score algorithm. Rendered by `NutriGradeBadge.js` as a rounded square.
- **Score_Token_System**: The shared token file at `mobile app/src/utils/scoreTokens.js` that defines score-to-band-to-color mappings for both Lab_Score and Nutri_Score.
- **Lab_Score_Band**: One of four named ranges within the Lab_Score scale: Poor (0–40), Moderate (41–60), Good (61–80), Excellent (81–100), each mapped to a distinct color.
- **ProductCard**: The `ProductCard.js` component that renders a horizontal row comprising a product image, name, brand, meta text, and an optional score badge.
- **PopularProductsSection**: The `PopularProductsSection.js` component rendered at the bottom of the Home_Screen scroll view.
- **NutriGradeList**: The `NutriGradeListScreen.js` screen reached via "View All" in the "Check Nutri-Score" section.
- **Voting_Trigger**: The threshold of 600 votes at which a product becomes eligible for lab testing.
- **Voting_Module**: A Home_Screen UI module that surfaces products close to the Voting_Trigger and encourages users to vote.
- **Info_Icon**: The `(i)` button rendered by `Icon` component adjacent to section headers in `DashboardScreen.js`.
- **Design_Token_File**: `mobile app/src/utils/scoreTokens.js`, the single authoritative source for score-to-color mappings.

---

## Requirements

### Requirement 1: Visually Distinguish Lab Score from Nutri-Score

**User Story:** As a user browsing the Home feed, I want the lab-test score and the Nutri-Score to look and read as clearly different things, so that I do not mistake one rating system for the other.

#### Acceptance Criteria

1. WHEN the Home_Screen renders the "Latest Testing Reports" section, THE Home_Screen SHALL display each result using the `ScoreBadge` component, which uses a circle shape, a numeric value, and a "Lab Score" caption — visually distinct from the `NutriGradeBadge` component's rounded-square shape, letter grade, and A–E label.
2. WHEN a Lab_Score circle is rendered, THE `ScoreBadge` component SHALL display the caption "Lab Score" directly below the circle so the badge cannot be interpreted as a letter-grade equivalent.
3. WHEN a user taps the Lab_Score circle on the Home_Screen, THE Home_Screen SHALL surface a short explanation of what the Lab_Score measures and how it differs from the Nutri_Score, either via the existing `(i)` info sheet for "Latest Testing Reports" or an inline tooltip.
4. WHEN a user taps the Nutri_Score badge on the Home_Screen, THE Home_Screen SHALL surface a short explanation of what the Nutri_Score measures and how it differs from the Lab_Score, either via the existing `(i)` info sheet for "Check Nutri-Score" or an inline tooltip.
5. IF both a Lab_Score and a Nutri_Score exist for the same product, THEN THE product detail view SHALL display both scores with their distinct labels and component shapes, and SHALL NOT merge them into a single visual indicator.

---

### Requirement 2: Consistent, Semantically Correct Color Scale for Lab Scores

**User Story:** As a user scanning scores at a glance, I want the color of a lab-test score to consistently signal good, moderate, or poor quality, so that I can compare products without reading every number.

#### Acceptance Criteria

1. WHEN the system renders a Lab_Score circle, THE `ScoreBadge` component SHALL map the score to a color using the Lab_Score_Band thresholds defined in the Design_Token_File: 0–40 → Poor (`#D64545`), 41–60 → Moderate (`#E8A33D`), 61–80 → Good (`#7CB342`), 81–100 → Excellent (`#2E7D32`).
2. WHEN two Lab_Scores fall within the same Lab_Score_Band, THE `ScoreBadge` component SHALL render both circles in the same band color, regardless of the exact numeric difference between them.
3. IF a color hex value is defined in the Lab_Score portion of the Design_Token_File, THEN THE `NutriGradeBadge` component SHALL NOT reuse that exact color value for a different Nutri_Score grade's background.
4. THE Design_Token_File (`scoreTokens.js`) SHALL serve as the single shared source of truth for both Lab_Score band colors and Nutri_Score grade colors, and both `ScoreBadge` and `NutriGradeBadge` SHALL import their colors exclusively from this file rather than from local constants.

---

### Requirement 3: Full Product Name Legibility

**User Story:** As a user comparing products, I want to read full product names on the Home feed, so that I can tell products apart without opening each one.

#### Acceptance Criteria

1. WHEN a ProductCard renders a product name, THE `ProductCard` component SHALL allow the name to wrap across up to 2 lines (`numberOfLines={2}`) before truncating.
2. IF a product name still exceeds 2 lines after wrapping, THEN THE `ProductCard` component SHALL truncate with an ellipsis only after the second line (`ellipsizeMode="tail"` with `numberOfLines={2}`).
3. WHEN a product name is truncated, THE Home_Screen SHALL make the full product name available on the product detail view without requiring navigation steps beyond tapping the card.
4. WHEN the ProductCard layout is updated to accommodate 2-line names, THE `ProductCard` component SHALL maintain consistent card height within any given horizontal scroll row in the PopularProductsSection, so all cards in a row remain vertically aligned.

---

### Requirement 4: Differentiated Scan Entry Points

**User Story:** As a user, I want it to be clear what the search-bar scan icon does versus the bottom-nav "Scan" tab, so that I pick the right one the first time.

#### Acceptance Criteria

1. WHEN the Home_Screen renders the search bar card, THE Home_Screen SHALL NOT include a barcode/scan icon within the search row, as the `Scan` bottom-navigation tab in `MainTabs.js` serves as the single barcode-scan entry point.
2. WHEN a user opens the `Scan` tab for the first time in a session, THE `ScannerScreen` SHALL display its purpose in its screen header (e.g., "Scan Product").
3. IF a separate label-scan entry point is required on the Home_Screen in a future iteration, THEN THE Home_Screen SHALL give it a distinct icon and an accessible `accessibilityLabel` describing its specific purpose, differentiating it from the barcode scan.

---

### Requirement 5: Home Feed Nudges Toward Voting

**User Story:** As a user, I want the Home screen to actively invite me to vote for products, so that I understand voting drives lab testing and I am motivated to participate.

#### Acceptance Criteria

1. WHEN the Home_Screen loads, THE Home_Screen SHALL display at least one Voting_Module promoting the voting feature, positioned above the PopularProductsSection in the scroll view.
2. WHEN a product's current vote count is within a configurable threshold percentage of the Voting_Trigger (600 votes), THE Home_Screen SHALL surface that product in a "Close to Being Tested" sub-module within the Voting_Module, showing the current vote count and the number of votes remaining to reach 600.
3. IF a signed-in user has cast at least one vote in any session, THEN THE Home_Screen SHALL display a personal voting summary sub-module showing the user's total votes cast and the products they have voted for.
4. WHEN a user taps a product within the Voting_Module, THE Home_Screen SHALL navigate directly to that product's vote action screen (the `PollingScreen` pre-filtered to that product).

---

### Requirement 6: Remove Redundant Page Title

**User Story:** As a user, I want the Home screen's vertical space used efficiently, so that I see more useful content without extra scrolling.

#### Acceptance Criteria

1. WHEN the Home tab is active, THE Home_Screen SHALL NOT render a separate "Home" page title element above the ChoosePure wordmark in the header.
2. WHEN the stack screen `options={{ title: 'Home' }}` in `MainTabs.js` would produce a visible header bar above the `DashboardScreen` content, THE `HomeTabStack` navigator SHALL set `headerShown: false` for the `DashboardHome` screen so only the in-screen ChoosePure wordmark is displayed.
3. WHEN vertical space is freed by removing the redundant title, THE Home_Screen SHALL use that space to position the Voting_Module (from Requirement 5) higher in the scroll view, reducing the scroll distance a user must travel to reach it.

---

### Requirement 7: Upgrade "Load More Products" Interaction

**User Story:** As a user browsing the Nutri-Score list, I want loading more products to feel consistent with the rest of the app's card-based, tappable UI, so the experience does not feel unfinished.

#### Acceptance Criteria

1. WHEN the end of the paginated Nutri-Score product list is reached and more products are available, THE Home_Screen SHALL render a styled "Load more products" chip or button component consistent with the app's design system (using `theme` typography, `theme.colors.primary`, and `theme.borderRadius`) rather than a plain unstyled text element.
2. IF infinite scroll is implemented instead of a manual button, THEN THE Home_Screen SHALL display an `ActivityIndicator` while the next page fetches, and SHALL debounce or guard the fetch call so that rapid re-scrolling does not trigger duplicate fetch requests for the same page.
3. IF a manual "Load more" button is retained, THEN THE Home_Screen SHALL display a loading state on the button itself (e.g., replacing button text with an `ActivityIndicator`) while `nutriLoadingMore` is `true`, so the user receives immediate visual feedback that the fetch is in progress.

---

### Requirement 8: Info Icon Affordance and Popular Products Framing

**User Story:** As a user, I want to know at a glance whether an (i) icon is tappable, and understand why low-scoring products appear under "Popular Products."

#### Acceptance Criteria

1. WHEN an Info_Icon is rendered next to a section header on the Home_Screen, THE Home_Screen SHALL render it with a visible tap affordance — specifically a circular background using `theme.colors.green50` and a ripple or `activeOpacity` press state — consistent with the existing `styles.infoButton` pattern applied to both the "Latest Testing Reports" and "Check Nutri-Score" info buttons.
2. WHEN a user taps the Info_Icon adjacent to a section header, THE Home_Screen SHALL open a methodology explanation relevant to that specific section (reports tooltip for "Latest Testing Reports", Nutri-Score/Nova/Eco explanation for "Check Nutri-Score").
3. WHEN the PopularProductsSection includes products with a Nutri_Score grade of C, D, or E, THE Home_Screen SHALL display a one-line caption beneath the "Popular Products" section heading that clarifies the section's intent (e.g., "Popular doesn't always mean healthy — check before you buy").
4. THE caption described in Acceptance Criterion 8.3 SHALL be treated as a required element whenever any product with a Nutri_Score grade of C, D, or E is present in the PopularProductsSection, not as an optional UI enhancement.
