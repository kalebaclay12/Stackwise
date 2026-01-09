# Deployment Guide - Stackwise Beta

Deploy your app to the web so friends & family can test it!

**Stack**:
- **Frontend**: Vercel (React app)
- **Backend**: Railway (Node.js API + SQLite database)

Both are free for beta testing!

---

## 🚀 Quick Start

### Prerequisites

- [ ] GitHub account
- [ ] Code pushed to GitHub repository
- [ ] 30 minutes of time

### Overview

1. Deploy backend to Railway (10 min)
2. Deploy frontend to Vercel (5 min)
3. Connect them together (5 min)
4. Test everything works (10 min)

---

## Part 1: Deploy Backend to Railway

### Step 1: Create Railway Account

1. Go to https://railway.app
2. Click "Login" → "Login with GitHub"
3. Authorize Railway to access your GitHub

### Step 2: Create New Project

1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Select your Stackwise repository
4. Railway will detect it's a Node.js project

### Step 3: Configure Backend Service

1. **Root Directory**: Click "Settings" → Set root directory to `backend`
2. **Build Command**: Should auto-detect (`npm install`)
3. **Start Command**: Should auto-detect (`npm start`)

If not auto-detected, set manually:
- **Build Command**: `npm install && npx prisma generate`
- **Start Command**: `npm start`

### Step 4: Add Environment Variables

In Railway project → **Variables** tab, add these:

```bash
# Database
DATABASE_URL=file:./stackwise.db

# Server
NODE_ENV=production
PORT=5000

# Secrets (CHANGE THESE!)
JWT_SECRET=<generate-strong-secret-here>
ADMIN_SECRET=<generate-strong-secret-here>

# Beta Mode
BETA_MODE=true

# Frontend URL (we'll update this after deploying frontend)
FRONTEND_URL=https://your-frontend-url.vercel.app

# Stripe (optional for now)
STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE
STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
STRIPE_PRO_MONTHLY_PRICE_ID=price_YOUR_PRICE_ID_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE

# Plaid
PLAID_CLIENT_ID=69522644168aa50020a8b980
PLAID_SECRET=1f4ded76ec9bf3f5ffe4d8d0fd963d
PLAID_ENV=sandbox
```

**Generate strong secrets**:
```powershell
# Run this in PowerShell to generate secrets
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Step 5: Deploy

1. Click "Deploy"
2. Wait for build to complete (2-3 minutes)
3. Railway will show you a URL like: `https://stackwise-backend-production.up.railway.app`

### Step 6: Generate Public Domain

1. In Railway project → Click on your service
2. Go to "Settings" tab
3. Scroll to "Networking"
4. Click "Generate Domain"
5. Copy the URL (e.g., `https://stackwise-backend-production.up.railway.app`)

**Save this URL** - you'll need it for the frontend!

### Step 7: Run Database Migration

Railway's SQLite database is created automatically. To initialize it:

1. Go to Railway project → Click your service
2. Click "..." menu → "View Logs"
3. Verify Prisma generated successfully
4. If you see errors, check logs and environment variables

---

## Part 2: Deploy Frontend to Vercel

### Step 1: Create Vercel Account

1. Go to https://vercel.com
2. Click "Sign Up" → "Continue with GitHub"
3. Authorize Vercel to access your GitHub

### Step 2: Import Project

1. Click "Add New..." → "Project"
2. Import your Stackwise repository
3. Vercel will auto-detect it's a React app

### Step 3: Configure Build Settings

**Framework Preset**: Vite

**Root Directory**: `frontend`

**Build & Development Settings**:
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### Step 4: Add Environment Variables

In "Environment Variables" section, add:

```bash
VITE_API_URL=https://your-railway-backend-url.up.railway.app/api
```

**Replace** `your-railway-backend-url.up.railway.app` with the Railway URL from Part 1, Step 6.

**Important**: Include `/api` at the end!

### Step 5: Deploy

1. Click "Deploy"
2. Wait for build (2-3 minutes)
3. Vercel will show you a URL like: `https://stackwise-abc123.vercel.app`

### Step 6: Test Frontend

1. Click the Vercel URL
2. You should see Stackwise login page
3. Try to register a new account
4. If it works → Success! 🎉
5. If not → Check the browser console for errors

---

## Part 3: Connect Frontend & Backend

### Update Backend FRONTEND_URL

1. Go back to Railway
2. Go to your backend service → "Variables"
3. Find `FRONTEND_URL`
4. Update it to your Vercel URL: `https://stackwise-abc123.vercel.app`
5. Click "Save"
6. Railway will automatically redeploy

### Enable CORS for Frontend

Your backend should already have CORS enabled (via `cors()` middleware). Verify in `backend/src/server.ts`:

```typescript
app.use(cors());
```

If you want to restrict CORS to only your frontend:

```typescript
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3001',
  credentials: true
}));
```

---

## Part 4: Test Everything

### 1. Test Registration

1. Go to your Vercel URL
2. Click "Create Account"
3. Fill in:
   - Email: `test@example.com`
   - Password: `password123`
   - Name: `Test User`
4. Click "Sign Up"
5. Should log you in automatically ✅

### 2. Test Auto-Pro Feature

1. Check if you have unlimited stacks
2. Try to create a stack with auto-allocation
3. Both should work because `BETA_MODE=true` ✅

### 3. Test Admin Endpoints

```powershell
# Replace with your Railway URL
$backendUrl = "https://your-railway-url.up.railway.app"
$adminSecret = "your-admin-secret-here"

# Get all users
curl -X GET "$backendUrl/api/admin/users" `
  -H "X-Admin-Secret: $adminSecret"

# Should return your test user
```

### 4. Test CSV Import

1. Download [sample-bank-statement.csv](sample-bank-statement.csv)
2. In the app → Create local account
3. Click "Import CSV"
4. Upload the sample file
5. Verify transactions appear ✅

### 5. Test Transaction Matching

1. Create stacks: "Groceries", "Gas", "Entertainment"
2. Click "Review Matches"
3. Confirm or reject suggested matches
4. Verify stack balances update ✅

---

## 🎉 You're Live!

Your app is now deployed at:
- **Frontend**: `https://stackwise-abc123.vercel.app`
- **Backend**: `https://stackwise-backend-xyz.up.railway.app`

### Share with Beta Testers

Send them:
1. **URL**: `https://stackwise-abc123.vercel.app`
2. **Instructions**: "Register with your email - you'll automatically get Pro access!"

### Monitor Beta Testing

**View all beta testers**:
```powershell
curl -X GET https://your-railway-url.up.railway.app/api/admin/users `
  -H "X-Admin-Secret: your-admin-secret"
```

**Reset someone's password**:
```powershell
curl -X POST https://your-railway-url.up.railway.app/api/admin/reset-password `
  -H "X-Admin-Secret: your-admin-secret" `
  -H "Content-Type: application/json" `
  -d '{\"email\":\"friend@example.com\",\"newPassword\":\"NewPassword123\"}'
```

See [BETA_ADMIN_GUIDE.md](BETA_ADMIN_GUIDE.md) for full admin commands.

---

## 🔧 Troubleshooting

### Frontend can't connect to backend

**Symptom**: Login fails with network error

**Fix**:
1. Check `VITE_API_URL` in Vercel environment variables
2. Verify it includes `/api` at the end
3. Redeploy frontend after fixing

### CORS errors

**Symptom**: Browser console shows CORS error

**Fix**:
1. Update `FRONTEND_URL` in Railway to match Vercel URL exactly
2. Verify `app.use(cors())` is in `backend/src/server.ts`
3. Redeploy backend

### Database not working

**Symptom**: Errors about database or Prisma

**Fix**:
1. Check Railway logs for Prisma errors
2. Verify `DATABASE_URL=file:./stackwise.db` in Railway variables
3. Verify build command includes `npx prisma generate`

### Admin endpoints return "Unauthorized"

**Symptom**: Admin commands fail with 403

**Fix**:
1. Verify `X-Admin-Secret` header matches `ADMIN_SECRET` in Railway
2. Check for typos in admin secret
3. Verify admin routes are loaded (check Railway logs on startup)

### Rate limiting too strict

**Symptom**: "Too many requests" errors

**Fix**:
1. Edit `backend/src/routes/auth.routes.ts`
2. Increase `max` values in rate limiters
3. Push to GitHub → Railway auto-deploys

---

## 💰 Costs

### Free Tier Limits

**Railway**:
- ✅ **Free**: $5 credit per month
- ✅ **Enough for**: ~500 hours of runtime (beta testing)
- ⚠️ **Upgrade to Hobby**: $5/month for more usage

**Vercel**:
- ✅ **Free**: 100 GB bandwidth per month
- ✅ **Enough for**: Unlimited beta testing
- ✅ **No credit card required**

**Total Cost for Beta**: **$0-5/month** 🎉

### Going Public (Future)

When you launch publicly:
- **Railway Hobby**: $5/month (includes credits for database + API)
- **Vercel Pro**: $20/month (custom domain, analytics, etc.)
- **Total**: ~$25/month

Or migrate backend to cheaper hosting (Render, Fly.io) for ~$10/month total.

---

## 🔄 Updating After Deployment

### Code Changes

**Backend**:
1. Push to GitHub
2. Railway auto-deploys from main branch
3. Check logs to verify deployment

**Frontend**:
1. Push to GitHub
2. Vercel auto-deploys from main branch
3. Visit URL to see changes

### Environment Variable Changes

**Backend** (Railway):
1. Go to project → Variables
2. Update variable
3. Railway redeploys automatically

**Frontend** (Vercel):
1. Go to project → Settings → Environment Variables
2. Update variable
3. Go to Deployments → Redeploy latest

---

## 📊 Monitoring

### View Logs

**Railway**:
- Click service → View Logs
- Real-time logs of API requests
- Check for errors

**Vercel**:
- Click deployment → View Function Logs
- See build errors
- Runtime logs (limited on free tier)

### Check Uptime

- **Railway**: Dashboard shows service status
- **Vercel**: Dashboard shows deployment status
- Set up UptimeRobot.com (free) to monitor both URLs

---

## 🚀 Next Steps

After successful deployment:

1. ✅ **Test with yourself first** - Use the app for 1-2 days
2. ✅ **Invite 2-3 close friends** - Get initial feedback
3. ✅ **Monitor for issues** - Check logs daily
4. ✅ **Iterate on feedback** - Fix bugs, improve UX
5. ✅ **Expand beta** - Invite more friends & family
6. ✅ **Prepare for launch** - Follow production security checklist

See [SECURITY_STATUS.md](SECURITY_STATUS.md) for production readiness checklist.

---

## 🆘 Support

**Deployment Issues**:
- Railway Docs: https://docs.railway.app
- Vercel Docs: https://vercel.com/docs

**App Issues**:
- Check Railway logs for backend errors
- Check browser console for frontend errors
- Review [BETA_ADMIN_GUIDE.md](BETA_ADMIN_GUIDE.md) for admin commands

---

**Congratulations! Your app is live! 🎉**

Share the URL with your beta testers and start collecting feedback!
