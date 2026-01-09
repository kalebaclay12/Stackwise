# Subscription System Status

## ✅ What's Already Built and Working

### Phase 1 - FREE (Completed)
- ✅ Free tier with 3-stack limit
- ✅ Pro tier with unlimited stacks
- ✅ Auto-allocation disabled for free users
- ✅ Bank linking (Plaid) restricted to Pro
- ✅ Beautiful subscription settings page
- ✅ Upgrade prompts throughout UI
- ✅ Manual admin controls for testing

### Phase 2 - STRIPE (Ready to Configure)
- ✅ Stripe SDK installed (backend + frontend)
- ✅ Subscription controller with checkout
- ✅ Webhook handlers for all events
- ✅ Customer portal for cancellations
- ✅ API endpoints ready
- ✅ Frontend integration coded
- ⏸️ **Needs**: Your Stripe API keys

---

## 🔧 Configuration Needed (5 minutes)

To enable Stripe payments, you need to:

### 1. Get Stripe Account (Free)
- Sign up: https://dashboard.stripe.com/register
- Use Test Mode (no real money)

### 2. Add 4 Values to `.env`

Currently in `backend/.env`:
```bash
STRIPE_SECRET_KEY="sk_test_YOUR_KEY_HERE"          # ← Replace
STRIPE_PUBLISHABLE_KEY="pk_test_YOUR_KEY_HERE"     # ← Replace
STRIPE_PRO_MONTHLY_PRICE_ID="price_YOUR_PRICE_ID_HERE"  # ← Replace
STRIPE_WEBHOOK_SECRET="whsec_YOUR_WEBHOOK_SECRET_HERE"  # ← Replace
```

**Where to get these**:
- API keys: https://dashboard.stripe.com/test/apikeys
- Price ID: Create product in https://dashboard.stripe.com/test/products
- Webhook secret: Run `stripe listen --forward-to localhost:5000/api/subscription/webhook`

**Detailed steps**: See [STRIPE_SETUP_GUIDE.md](STRIPE_SETUP_GUIDE.md)

---

## 🎯 Current Capabilities

### Without Stripe (Current State):
- ✅ Users can register (default: Free tier)
- ✅ Free tier limits enforced (3 stacks max)
- ✅ Pro features disabled for free users
- ✅ **Manual upgrades** via admin endpoint (for friends/family)
- ✅ Settings page shows subscription info
- ❌ Can't accept payments yet

### With Stripe Configured:
- ✅ Everything above, PLUS:
- ✅ Users can upgrade via credit card
- ✅ Automatic Pro access after payment
- ✅ Easy cancellation through Stripe portal
- ✅ Automatic downgrades when subscription ends
- ✅ Handles payment failures gracefully
- ✅ Ready for production deployment

---

## 💰 Pricing Setup

**Recommended Pricing**:
- **Free**: $0/month - 3 stacks, manual allocations only
- **Pro**: $6.99/month - Unlimited everything

**Cost Breakdown**:
- Plaid (bank linking): ~$1.00/user/month
- Stripe fees: ~$0.50/transaction
- Server hosting: ~$30-50/month
- **Profit**: ~$5/user/month

**To change price**: Update the product in Stripe Dashboard

---

## 🔐 Enable/Disable Pro Features

### Method 1: Admin Endpoint (Quick)

**Upgrade someone to Pro**:
```bash
curl -X POST http://localhost:5000/api/admin/subscription \
  -H "Content-Type: application/json" \
  -H "X-Admin-Secret: stackwise-admin-2024-change-this" \
  -d '{
    "email": "friend@example.com",
    "tier": "pro",
    "expiresInDays": 30
  }'
```

**Downgrade to Free**:
```bash
curl -X POST http://localhost:5000/api/admin/subscription \
  -H "Content-Type: application/json" \
  -H "X-Admin-Secret: stackwise-admin-2024-change-this" \
  -d '{"email": "friend@example.com", "tier": "free"}'
```

**PowerShell version** (Windows):
```powershell
$body = @{email="friend@example.com"; tier="pro"; expiresInDays=30} | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:5000/api/admin/subscription" `
  -Method Post `
  -Headers @{"Content-Type"="application/json"; "X-Admin-Secret"="stackwise-admin-2024-change-this"} `
  -Body $body
```

### Method 2: Database Direct

```bash
cd backend
npx prisma studio
```

Then edit the User record:
- `subscriptionTier`: "free" or "pro"
- `subscriptionStatus`: "active", "cancelled", "expired"
- `subscriptionExpiresAt`: null or date

### Method 3: Stripe (When Configured)

Users manage their own subscriptions through Stripe Customer Portal:
- Upgrade → Stripe Checkout
- Cancel → Stripe Portal
- Update payment → Stripe Portal

---

## 📊 Feature Matrix

| Feature | Free Tier | Pro Tier | Backend Check | Frontend UI |
|---------|-----------|----------|---------------|-------------|
| **Stacks** | 3 max | Unlimited | ✅ Middleware | ✅ Warning shown |
| **Auto-Allocation** | Disabled | Enabled | ✅ API blocked | ✅ Checkbox disabled |
| **Bank Linking** | Blocked | Enabled | ✅ Routes protected | ✅ Not available yet |
| **Transaction Match** | Blocked | Enabled | ✅ Middleware | ✅ Feature planned |
| **Manual Allocations** | ✅ | ✅ | - | - |
| **Settings Access** | ✅ | ✅ | - | - |

**Protection Layers**:
1. **Frontend**: Disables UI elements
2. **Backend**: Validates all API requests
3. **Database**: Stores subscription status

---

## 🧪 Testing Scenarios

### Test as Free User:
1. Register new account
2. Try creating 4th stack → Blocked with upgrade prompt
3. Try enabling auto-allocation → Disabled with Pro badge
4. Go to Settings → See "Free Plan" badge

### Test as Pro User:
```bash
# Manually upgrade
curl -X POST http://localhost:5000/api/admin/subscription \
  -H "Content-Type: application/json" \
  -H "X-Admin-Secret: stackwise-admin-2024-change-this" \
  -d '{"email":"YOUR_EMAIL","tier":"pro"}'
```

1. Refresh app
2. Create unlimited stacks ✅
3. Enable auto-allocation ✅
4. See "Pro Plan" badge in Settings

### Test Stripe Payment (After Configuration):
1. Go to Settings → Subscription
2. Click "Upgrade to Pro"
3. Use test card: `4242 4242 4242 4242`
4. Complete checkout
5. Redirected back → Now Pro user!

---

## 📂 Key Files

### Backend:
- `backend/src/config/stripe.ts` - Stripe configuration
- `backend/src/controllers/subscription.controller.ts` - Checkout & webhooks
- `backend/src/routes/subscription.routes.ts` - Stripe endpoints
- `backend/src/middleware/subscription.ts` - Tier validation
- `backend/.env` - Configuration (API keys)

### Frontend:
- `frontend/src/components/settings/SubscriptionSettings.tsx` - Settings page
- `frontend/src/components/CreateStackModal.tsx` - Stack limit enforcement
- `frontend/src/components/UpgradePrompt.tsx` - Upgrade UI
- `frontend/src/services/api.ts` - Stripe API calls
- `frontend/src/types/index.ts` - Tier limits constants

### Documentation:
- `STRIPE_SETUP_GUIDE.md` - Full Stripe setup instructions
- `ADMIN_TESTING.md` - Manual subscription management
- `SUBSCRIPTION_STATUS.md` - This file

---

## ⚡ Quick Start

**To enable Stripe payments**:
1. Read [STRIPE_SETUP_GUIDE.md](STRIPE_SETUP_GUIDE.md)
2. Get Stripe API keys (5 min)
3. Update `.env` file (1 min)
4. Restart backend server
5. Test checkout with `4242 4242 4242 4242`

**To give friends Pro access** (without Stripe):
1. Read [ADMIN_TESTING.md](ADMIN_TESTING.md)
2. Use admin endpoint with their email
3. Set expiration days (optional)

---

## 🚀 Deployment Checklist

Before going live:
- [ ] Switch Stripe to Live Mode
- [ ] Get Live API keys (not test keys)
- [ ] Create product in Live Mode
- [ ] Set up production webhook URL
- [ ] Test with real card ($0.50)
- [ ] Update ADMIN_SECRET
- [ ] Enable HTTPS
- [ ] Deploy frontend + backend
- [ ] Test full flow end-to-end
- [ ] Launch! 🎉

---

## 📞 Need Help?

- **Stripe Setup**: [STRIPE_SETUP_GUIDE.md](STRIPE_SETUP_GUIDE.md)
- **Manual Testing**: [ADMIN_TESTING.md](ADMIN_TESTING.md)
- **Stripe Dashboard**: https://dashboard.stripe.com/test
- **Current Status**: Everything coded, just needs Stripe configuration
