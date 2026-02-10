# ChoosePure Landing Page

Landing page with waitlist functionality for ChoosePure.

## Features

- ✅ Waitlist form with validation
- ✅ Data stored in PostgreSQL database
- ✅ Automatic email to user with WhatsApp community link
- ✅ Admin notification email for new signups
- ✅ WhatsApp community integration
- ✅ Professional, responsive design

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Database Setup (PostgreSQL)

Install PostgreSQL if you haven't already, then create a database:

```bash
createdb choosepure
```

The server will automatically create the required table on first run.

### 3. Environment Configuration

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Edit `.env` with your actual values:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/choosepure
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-specific-password
ADMIN_EMAIL=admin@choosepure.in
WHATSAPP_GROUP_LINK=https://chat.whatsapp.com/your-invite-link
```

### 4. Email Setup (Gmail)

For Gmail, you need to:
1. Enable 2-factor authentication
2. Generate an App Password: https://myaccount.google.com/apppasswords
3. Use the app password in `EMAIL_PASSWORD`

### 5. WhatsApp Community Setup

Create a WhatsApp group and get the invite link:
1. Create a WhatsApp group
2. Go to Group Info → Invite via link
3. Copy the link and add it to `.env`

### 6. Run the Server

Development mode (with auto-reload):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

The server will run on `http://localhost:3000`

## Alternative Database Options

### Using MySQL instead of PostgreSQL

Install MySQL driver:
```bash
npm install mysql2
```

Update `server.js` to use MySQL connection.

### Using MongoDB

Install MongoDB driver:
```bash
npm install mongodb mongoose
```

Update `server.js` to use MongoDB connection.

### Using a Cloud Database

- **Supabase** (PostgreSQL): Free tier available
- **PlanetScale** (MySQL): Free tier available
- **MongoDB Atlas**: Free tier available

## Deployment Options

### Vercel
1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel`
3. Add environment variables in Vercel dashboard

### Heroku
1. Install Heroku CLI
2. Create app: `heroku create choosepure`
3. Add PostgreSQL: `heroku addons:create heroku-postgresql:mini`
4. Set env vars: `heroku config:set EMAIL_USER=...`
5. Deploy: `git push heroku main`

### Railway
1. Connect GitHub repo
2. Add PostgreSQL database
3. Set environment variables
4. Deploy automatically

## API Endpoints

### POST /api/waitlist
Submit waitlist form

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+919876543210",
  "pincode": "560001"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully joined the waitlist!",
  "whatsappLink": "https://chat.whatsapp.com/..."
}
```

### GET /api/health
Health check endpoint

## Security Considerations

1. Add rate limiting to prevent spam
2. Add CAPTCHA for production
3. Validate and sanitize all inputs
4. Use HTTPS in production
5. Keep `.env` file secure and never commit it

## Support

For issues or questions, contact: admin@choosepure.in
