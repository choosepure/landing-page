# Deployment Guide

## Render Deployment

### Step 1: Configure Render Service

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository: `choosepure/landing-page`

### Step 2: Configure Settings

**Important:** Set these values in Render:

- **Name**: choosepure-landing
- **Region**: Singapore (or closest to your users)
- **Branch**: main
- **Root Directory**: `.` (leave empty or use dot)
- **Runtime**: Node
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Plan**: Free

### Step 3: Add Environment Variables

Go to "Environment" tab and add:

```
NODE_ENV=production
DATABASE_URL=your_database_url
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
ADMIN_EMAIL=admin@choosepure.in
WHATSAPP_GROUP_LINK=your_whatsapp_link
```

### Step 4: Add PostgreSQL Database

1. Click "New +" → "PostgreSQL"
2. Name it `choosepure-db`
3. Copy the "Internal Database URL"
4. Add it as `DATABASE_URL` in your web service environment variables

### Step 5: Deploy

Click "Create Web Service" and wait for deployment to complete.

---

## Vercel Deployment

### Step 1: Install Vercel CLI (Optional)

```bash
npm i -g vercel
```

### Step 2: Deploy via Dashboard

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New..." → "Project"
3. Import `choosepure/landing-page` from GitHub
4. Configure:
   - **Framework Preset**: Other
   - **Root Directory**: `./`
   - **Build Command**: Leave empty
   - **Output Directory**: Leave empty

### Step 3: Add Environment Variables

Add these in Vercel project settings:

```
NODE_ENV=production
DATABASE_URL=your_database_url
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
ADMIN_EMAIL=admin@choosepure.in
WHATSAPP_GROUP_LINK=your_whatsapp_link
```

### Step 4: Database Options for Vercel

Since Vercel is serverless, use one of these:

**Option 1: Vercel Postgres (Recommended)**
```bash
vercel postgres create
```

**Option 2: Supabase (Free)**
1. Create account at [Supabase](https://supabase.com)
2. Create new project
3. Get connection string from Settings → Database
4. Add as `DATABASE_URL`

**Option 3: PlanetScale (Free)**
1. Create account at [PlanetScale](https://planetscale.com)
2. Create database
3. Get connection string
4. Update server.js to use MySQL instead of PostgreSQL

### Step 5: Deploy

Click "Deploy" and wait for completion.

---

## Railway Deployment (Alternative)

### Quick Deploy

1. Go to [Railway](https://railway.app)
2. Click "New Project" → "Deploy from GitHub repo"
3. Select `choosepure/landing-page`
4. Railway will auto-detect Node.js
5. Add PostgreSQL: Click "New" → "Database" → "Add PostgreSQL"
6. Add environment variables in "Variables" tab
7. Deploy automatically happens

---

## Troubleshooting

### Error: "Root directory does not exist"

**Solution**: In Render settings, set Root Directory to `.` or leave it empty.

### Error: "Module not found"

**Solution**: Make sure `package.json` is in the root directory and run:
```bash
npm install
```

### Error: "Database connection failed"

**Solution**: 
1. Verify `DATABASE_URL` is set correctly
2. Check if database allows external connections
3. For Render, use "Internal Database URL" not "External"

### Error: "Email sending failed"

**Solution**:
1. Use Gmail App Password, not regular password
2. Enable "Less secure app access" or use App Password
3. Verify `EMAIL_USER` and `EMAIL_PASSWORD` are correct

### Error: "Port already in use"

**Solution**: The platform will set the PORT automatically. Update server.js:
```javascript
const PORT = process.env.PORT || 3000;
```

---

## Post-Deployment Checklist

- [ ] Test form submission
- [ ] Verify email delivery (user + admin)
- [ ] Check database entries
- [ ] Test WhatsApp link
- [ ] Verify all environment variables
- [ ] Check error logs
- [ ] Test on mobile devices
- [ ] Set up custom domain (optional)

---

## Custom Domain Setup

### Render
1. Go to Settings → Custom Domain
2. Add your domain
3. Update DNS records as shown

### Vercel
1. Go to Settings → Domains
2. Add your domain
3. Update DNS records as shown

---

## Monitoring

### Render
- View logs: Dashboard → Logs tab
- Monitor metrics: Dashboard → Metrics tab

### Vercel
- View logs: Project → Deployments → Click deployment → Logs
- Monitor analytics: Project → Analytics

---

## Support

If you encounter issues:
1. Check deployment logs
2. Verify environment variables
3. Test database connection
4. Contact support: admin@choosepure.in
