# Meta Pixel Setup Guide

## What is Meta Pixel?
Meta Pixel (formerly Facebook Pixel) is a tracking code that helps you measure the effectiveness of your advertising by understanding the actions people take on your website.

## How to Get Your Meta Pixel ID

1. Go to [Meta Events Manager](https://business.facebook.com/events_manager)
2. Click on "Connect Data Sources" and select "Web"
3. Select "Meta Pixel" and click "Connect"
4. Name your pixel (e.g., "ChoosePure Website")
5. Copy your Pixel ID (it will be a 15-16 digit number)

## How to Add Your Pixel ID to the Website

1. Open `index.html`
2. Find these two lines (around line 8-9):
   ```javascript
   fbq('init', 'YOUR_PIXEL_ID'); // Replace YOUR_PIXEL_ID with your actual Meta Pixel ID
   ```
   and
   ```html
   src="https://www.facebook.com/tr?id=YOUR_PIXEL_ID&ev=PageView&noscript=1"/>
   ```

3. Replace `YOUR_PIXEL_ID` with your actual Pixel ID in BOTH places
   
   Example:
   ```javascript
   fbq('init', '1234567890123456');
   ```
   and
   ```html
   src="https://www.facebook.com/tr?id=1234567890123456&ev=PageView&noscript=1"/>
   ```

4. Save the file and deploy

## Events Being Tracked

### Standard Events (Meta Pixel)
1. **PageView** - Automatically tracked when someone visits the page
2. **Lead** - Tracked when someone successfully submits the waitlist form
3. **InitiateCheckout** - Tracked when someone clicks "Join the Waitlist" CTA button

### Custom Events (Meta Pixel)
- Various engagement events (scroll depth, social clicks, etc.)

### Google Analytics 4 Events
All events are also tracked in Google Analytics 4 for comprehensive analytics.

## Testing Your Pixel

1. Install [Meta Pixel Helper](https://chrome.google.com/webstore/detail/meta-pixel-helper/) Chrome extension
2. Visit your website
3. Click the extension icon - it should show your Pixel ID and events being fired
4. Test the form submission to verify the "Lead" event fires

## Viewing Your Data

1. Go to [Meta Events Manager](https://business.facebook.com/events_manager)
2. Select your Pixel
3. View the "Overview" tab to see events in real-time
4. Use "Test Events" feature to verify tracking is working

## Important Notes

- It may take 15-30 minutes for events to appear in Meta Events Manager
- Make sure your Pixel is active and not in "Test" mode for production
- You can create Custom Conversions based on these events for ad optimization
- The pixel respects user privacy and GDPR compliance

## Support

If you need help:
- [Meta Pixel Documentation](https://www.facebook.com/business/help/952192354843755)
- [Meta Pixel Troubleshooting](https://www.facebook.com/business/help/1733952080230787)
