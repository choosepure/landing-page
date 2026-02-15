# Google Analytics Setup for ChoosePure

## Step 1: Create Google Analytics Account

1. Go to https://analytics.google.com/
2. Click "Start measuring"
3. Enter Account name: "ChoosePure"
4. Click "Next"

## Step 2: Create Property

1. Property name: "ChoosePure Website"
2. Reporting time zone: India
3. Currency: Indian Rupee (INR)
4. Click "Next"

## Step 3: Business Information

1. Industry: Health & Fitness
2. Business size: Small
3. Select how you plan to use Google Analytics
4. Click "Create"

## Step 4: Set up Data Stream

1. Choose platform: "Web"
2. Website URL: https://choosepure.in
3. Stream name: "ChoosePure Main Site"
4. Click "Create stream"

## Step 5: Get Measurement ID

1. You'll see your Measurement ID (format: G-XXXXXXXXXX)
2. Copy this ID

## Step 6: Update Website

1. Open `index.html`
2. Find this line (appears twice):
   ```javascript
   gtag('config', 'G-XXXXXXXXXX', {
   ```
3. Replace `G-XXXXXXXXXX` with your actual Measurement ID
4. Also update this line:
   ```html
   <script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
   ```

## Step 7: Deploy and Verify

1. Commit and push changes
2. Wait for deployment
3. Visit your website
4. In Google Analytics, go to Reports → Realtime
5. You should see yourself as an active user

## Events Being Tracked

### Automatic Events
- **page_view**: Every page load
- **scroll_depth**: 25%, 50%, 75%, 100% scroll
- **session_start**: New user sessions

### Custom Events
- **cta_click**: When users click CTA buttons
  - join_waitlist_hero
  - join_waitlist_sticky
  - how_it_works

- **form_submit_success**: Successful waitlist signup
- **form_submit_error**: Failed form submission
- **share_click**: Share button clicked
- **share_success**: Successful share
- **share_cancelled**: User cancelled share
- **whatsapp_redirect**: Auto-redirect to WhatsApp

## Viewing Analytics

### Traffic Sources
1. Go to Reports → Acquisition → Traffic acquisition
2. See where users are coming from (Google, Direct, Social, etc.)

### User Behavior
1. Go to Reports → Engagement → Pages and screens
2. See which pages users visit most

### Conversions
1. Go to Reports → Engagement → Events
2. See all tracked events
3. Mark important events as conversions (like form_submit_success)

### Real-time Data
1. Go to Reports → Realtime
2. See current active users and their actions

## Setting Up Conversions

1. Go to Admin → Events
2. Find "form_submit_success"
3. Toggle "Mark as conversion"
4. This will track waitlist signups as conversions

## UTM Parameters for Campaign Tracking

When sharing links, add UTM parameters to track campaigns:

```
https://choosepure.in?utm_source=whatsapp&utm_medium=social&utm_campaign=launch
https://choosepure.in?utm_source=instagram&utm_medium=social&utm_campaign=launch
https://choosepure.in?utm_source=email&utm_medium=email&utm_campaign=newsletter
```

These will show up in Traffic acquisition reports.

## Privacy Considerations

- Google Analytics is GDPR compliant
- No personal data is collected
- Users can opt-out via browser settings
- Consider adding a cookie consent banner if required
