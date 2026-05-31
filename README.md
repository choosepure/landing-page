# ChoosePure

Food safety and transparency platform for parents. We independently test packaged foods in FSSAI-accredited labs and publish purity reports.

## Project Structure

```
choosepure/
├── server.js                    # Backend API (Express + MongoDB)
├── package.json                 # Server dependencies
├── .env                         # Environment variables (not committed)
│
├── *.html                       # Website pages (served by Express)
├── public/                      # Static assets (images, favicon)
├── email-templates/             # HTML email templates
│
├── mobile app/                  # React Native / Expo mobile app
│   ├── App.js                   # Entry point
│   ├── app.json                 # Expo config
│   ├── package.json             # Mobile dependencies
│   └── src/                     # App source code
│       ├── api/                 # API client (axios)
│       ├── components/          # Reusable UI components
│       ├── context/             # Auth context
│       ├── hooks/               # Custom hooks
│       ├── navigation/          # React Navigation setup
│       ├── screens/             # App screens
│       ├── services/            # Firebase services
│       ├── theme/               # Design tokens
│       └── utils/               # Utility functions
│
└── docs/                        # Documentation
    ├── DEPLOYMENT.md
    ├── ANALYTICS_SETUP.md
    ├── META_PIXEL_SETUP.md
    └── create-admin.js          # One-time admin creation script
```

## Tech Stack

- **Backend**: Node.js, Express, MongoDB Atlas
- **Website**: Vanilla HTML/CSS/JS
- **Mobile App**: React Native + Expo SDK 52
- **Services**: Firebase (Auth, FCM, Crashlytics), Razorpay, Mailgun
- **Analytics**: Google Analytics 4, Mixpanel, Meta Pixel

## Quick Start

### Backend

```bash
npm install
npm run dev        # Development (nodemon)
npm start          # Production
```

### Mobile App

```bash
cd "mobile app"
npm install
npx expo start --dev-client
```

### Environment Variables

See `.env.example` for required variables:
- `MONGO_URL` — MongoDB Atlas connection string
- `SECRET_KEY` — JWT signing secret
- `FIREBASE_SERVICE_ACCOUNT` — Firebase Admin SDK JSON
- `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` — Payment gateway
- `MAILGUN_API_KEY` / `MAILGUN_DOMAIN` — Email service

## API Endpoints

| Prefix | Description |
|--------|-------------|
| `/api/user/*` | User auth, profile, referrals |
| `/api/admin/*` | Admin dashboard APIs |
| `/api/reports/*` | Test report listing and detail |
| `/api/polls/*` | Product voting |
| `/api/subscription/*` | Razorpay subscription management |
| `/api/suggestions/*` | Product suggestions |
| `/api/health` | Health check |

## Deployment

- **Backend**: Render (auto-deploys from `main` branch)
- **Mobile App**: EAS Build (Expo Application Services)
- **Domain**: choosepure.in / api.choosepure.in

See `docs/DEPLOYMENT.md` for detailed instructions.
