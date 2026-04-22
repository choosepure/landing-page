---
inclusion: manual
---

# ChoosePure PRD v2 Reference

This file references the full Product Requirements Document (PRD v2) for ChoosePure.
The PRD covers: Website, Open Food Facts integration, Mobile App, and Backend API.

## Key PRD Sections for Implementation

### Already Implemented (Existing)
- User registration with referral support (Section 6.1)
- Google OAuth sign-in (Section 6.1)
- Purity Wall / Dashboard with report cards (Section 6.2)
- Voting & paid votes via Razorpay (Section 6.3)
- Product suggestions & upvoting (Section 6.3)
- Subscription via Razorpay ₹299/mo (Section 6.4)
- Referral program with free months (Section 6.4)
- Pincode collection at registration (Section 6.5)
- Community trust layer: methodology, team, testimonials (Section 6.6)
- Admin panel for managing all of the above
- Mobile app scaffolding (React Native/Expo)
- Razorpay webhook endpoint

### Not Yet Implemented (PRD Gaps)
1. **Open Food Facts Integration** (Section 7) — P0
   - Backend proxy: GET /api/off/product/:barcode with Redis cache
   - Product Lookup page: choosepure.in/product-lookup
   - Report detail OFF enrichment (Nutri-Score, NOVA, additives)
   - Purity Wall filters: Nutri-Score grade, NOVA group

2. **Annual Subscription Plan** (Section 6.4) — P1
   - ₹2,499/year option (save ~30%)
   - Currently only monthly ₹299

3. **Pincode-Level Alerts** (Section 6.5) — P1
   - Email alerts when new report published for user's pincode area
   - Frequency control (1/day or 1/week)

4. **Report Enhancements** (Section 6.2) — P1
   - Grid/list toggle view
   - Filters: Category, Verdict, Date
   - Sort: Most recent, Most voted, Alphabetical
   - Search by product name or brand
   - Downloadable PDF reports for Premium
   - Related reports section

5. **Dual Auth Backend** (Section 10.1) — P0
   - Bearer token support alongside cookies for mobile app
   - JWT returned in response body on login/register

6. **Mobile App Barcode Scanner** (Section 9) — P0
   - MLKit barcode scanning
   - Layered result card (ChoosePure + OFF data)
   - Scan history (last 50 scans)

7. **Nomination Flow** (Section 6.3) — P1
   - Team review before nominations appear on ballot
   - Email notification when nomination approved

8. **Email Verification** (Section 6.1) — P1
   - Required before voting or accessing Premium content

9. **Mobile OTP Login** (Section 6.1) — P2
   - Alternative to email/password

10. **Onboarding Flow** (Section 8, Req 4) — P1
    - 3-step welcome screens for new users

## Score Bands (from PRD)
- 90-100: Excellent (Grade A) — Dark Green
- 80-89: Good (Grade B+) — Blue
- 70-79: Acceptable (Grade B) — Brown
- 50-69: Caution (Grade C) — Amber
- 0-49: Concern (Grade D/F) — Red

## Membership Tiers
| Feature | Free (₹0) | Premium (₹299/mo or ₹2,499/yr) |
|---------|-----------|-------------------------------|
| Headline verdict | Yes | Yes |
| Basic pros & cons | Yes | Yes |
| Vote once per cycle | 1x weight | 2x weight |
| Open Food Facts data | Yes | Yes |
| Purity Score | 1st report only | All reports |
| Full lab parameter table | No | Yes |
| Lab methodology detail | No | Yes |
| Downloadable PDF | No | Yes |
| Pincode-level alerts | No | Yes |
| Priority nomination | No | Yes |
| Free monthly vote | No | Yes |
| Early access to reports | No | Yes |
