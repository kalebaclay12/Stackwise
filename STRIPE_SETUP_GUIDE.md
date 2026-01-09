# Stripe Setup Guide - Phase 2

This guide explains how to set up Stripe payments for Stackwise Pro subscriptions.

## Overview

Stripe integration is **already coded** but requires configuration. Here's what we built:

✅ Backend subscription controller with Stripe SDK
✅ Checkout session creation
✅ Customer portal for cancellations
✅ Webhook handlers for subscription events
✅ Frontend API integration ready

**What you need**: Stripe account + configuration

---

## Step 1: Create Stripe Account

1. Go to https://dashboard.stripe.com/register
2. Sign up for a free account
3. You'll start in **Test Mode** (perfect for development)

---

## Step 2: Get Your API Keys

1. Go to https://dashboard.stripe.com/test/apikeys
2. Copy your **Publishable key** (starts with `pk_test_`)
3. Click "Reveal test key" for **Secret key** (starts with `sk_test_`)

**Update `.env` file**:
```bash
STRIPE_SECRET_KEY="sk_test_YOUR_ACTUAL_KEY_HERE"
STRIPE_PUBLISHABLE_KEY="pk_test_YOUR_ACTUAL_KEY_HERE"
```

---

## Step 3: Create Pro Subscription Product

### In Stripe Dashboard:

1. Go to https://dashboard.stripe.com/test/products
2. Click **"+ Add product"**
3. Fill in:
   - **Name**: `Stackwise Pro`
   - **Description**: `Unlimited stacks, auto-allocation, and bank linking`
   - **Pricing model**: `Standard pricing`
   - **Price**: `$6.99`
   - **Billing period**: `Monthly`
   - **Currency**: `USD`
4. Click **"Save product"**
5. **Copy the Price ID** (looks like `price_1ABC123...`)

**Update `.env` file**:
```bash
STRIPE_PRO_MONTHLY_PRICE_ID="price_YOUR_PRICE_ID_HERE"
```

---

## Step 4: Set Up Webhooks (for automatic subscription updates)

### Local Development (Using Stripe CLI):

1. **Install Stripe CLI**: https://stripe.com/docs/stripe-cli

   **Windows**:
   ```bash
   scoop install stripe
   ```
   Or download from: https://github.com/stripe/stripe-cli/releases

2. **Login to Stripe**:
   ```bash
   stripe login
   ```

3. **Forward webhooks to localhost**:
   ```bash
   stripe listen --forward-to localhost:5000/api/subscription/webhook
   ```

4. **Copy the webhook signing secret** (looks like `whsec_...`)

**Update `.env` file**:
```bash
STRIPE_WEBHOOK_SECRET="whsec_YOUR_WEBHOOK_SECRET_HERE"
```

### Production (When deploying):

1. Go to https://dashboard.stripe.com/test/webhooks
2. Click **"+ Add endpoint"**
3. Enter your endpoint URL: `https://yourdomain.com/api/subscription/webhook`
4. Select events to listen to:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy the **Signing secret**

---

## Step 5: Test the Integration

### Current Configuration Check:

```bash
# In backend/.env, you should have:
STRIPE_SECRET_KEY="sk_test_..." ✓
STRIPE_PUBLISHABLE_KEY="pk_test_..." ✓
STRIPE_PRO_MONTHLY_PRICE_ID="price_..." ✓
STRIPE_WEBHOOK_SECRET="whsec_..." ✓
FRONTEND_URL="http://localhost:3001" ✓
```

### Test Upgrade Flow:

1. **Start servers** (backend + frontend)
2. **Open app**: http://localhost:3001
3. **Go to Settings** → Subscription tab
4. **Click "Upgrade to Pro"**
5. You'll be redirected to Stripe Checkout
6. **Use test card**: `4242 4242 4242 4242`
   - Expiry: Any future date
   - CVC: Any 3 digits
   - ZIP: Any 5 digits
7. Complete payment
8. You'll be redirected back to app
9. **Verify**: You should now have Pro tier!

### Test Cancellation Flow:

1. **In Settings** → Subscription tab
2. **Click "Cancel Subscription"** (or "Manage Subscription")
3. You'll be redirected to Stripe Customer Portal
4. Cancel your subscription
5. **Verify**: Status shows "cancelled" but Pro features remain until period end

---

## How Stripe Webhooks Work

When events happen in Stripe (payment, cancellation, etc.), Stripe sends HTTP requests to your webhook endpoint.

### Events We Handle:

| Event | What Happens |
|-------|-------------|
| `checkout.session.completed` | User upgraded to Pro immediately |
| `customer.subscription.updated` | Status changes (active → cancelled, etc.) |
| `customer.subscription.deleted` | User downgraded to Free |
| `invoice.payment_succeeded` | Payment confirmed, keep Pro active |
| `invoice.payment_failed` | Mark as `past_due`, user keeps access temporarily |

### Webhook Security:

Stripe signs each webhook with a secret. Our code verifies this signature to ensure requests are legitimate.

```typescript
// This happens automatically in subscription.controller.ts
const sig = req.headers['stripe-signature'];
const event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
```

---

## Stripe Test Cards

Use these cards in **Test Mode** only:

| Card Number | Result |
|-------------|--------|
| `4242 4242 4242 4242` | Successful payment |
| `4000 0000 0000 0002` | Card declined |
| `4000 0000 0000 9995` | Insufficient funds |
| `4000 0025 0000 3155` | Requires authentication (3D Secure) |

**Important**: These only work in Test Mode. Real cards will be rejected.

---

## Going Live (Production)

When ready to accept real payments:

1. **Complete Stripe verification** (business info, bank account)
2. **Switch to Live Mode** in Stripe Dashboard
3. **Get Live API keys** (start with `sk_live_` and `pk_live_`)
4. **Create product again** in Live Mode (new Price ID)
5. **Update .env** with live keys
6. **Set up production webhook** endpoint
7. **Test with real card** (charge yourself $0.50 to test)
8. **Enable production** 🚀

---

## Pricing Strategy Recommendations

### Suggested Pricing:

- **Free**: $0/month - 3 stacks, manual only
- **Pro**: $6.99/month or $69/year - Everything unlimited

### Why $6.99/month?

- **Plaid costs**: $0.75-1.50 per user/month
- **Stripe fees**: 2.9% + $0.30 per transaction
- **Server costs**: ~$20-50/month (estimated)
- **Profit margin**: $4-5 per user after costs

### Alternative Pricing:

- **Monthly**: $6.99/month ($83.88/year)
- **Annual**: $59/year ($4.92/month) - save 40%

Annual plans reduce payment processing fees and improve retention.

---

## Enable/Disable Pro Features Manually

### Quick Toggle (For Testing):

```bash
# Upgrade user to Pro (permanent)
curl -X POST http://localhost:5000/api/admin/subscription \
  -H "Content-Type: application/json" \
  -H "X-Admin-Secret: stackwise-admin-2024-change-this" \
  -d '{"email":"user@example.com","tier":"pro"}'

# Downgrade to Free
curl -X POST http://localhost:5000/api/admin/subscription \
  -H "Content-Type: application/json" \
  -H "X-Admin-Secret: stackwise-admin-2024-change-this" \
  -d '{"email":"user@example.com","tier":"free"}'

# Give 30-day trial
curl -X POST http://localhost:5000/api/admin/subscription \
  -H "Content-Type: application/json" \
  -H "X-Admin-Secret: stackwise-admin-2024-change-this" \
  -d '{"email":"user@example.com","tier":"pro","expiresInDays":30}'
```

### Database Direct (Advanced):

```bash
# Connect to database
cd backend
npx prisma studio

# Find user, update fields:
# - subscriptionTier: "free" or "pro"
# - subscriptionStatus: "active", "cancelled", "past_due", "expired"
# - subscriptionExpiresAt: null or future date
```

---

## Feature Gating Summary

### What's Automatically Restricted:

| Feature | Free | Pro | Enforced By |
|---------|------|-----|-------------|
| **Stack Creation** | Max 3 | Unlimited | Frontend + Backend middleware |
| **Auto-Allocation** | ❌ | ✅ | UI disabled + Backend blocks API |
| **Bank Linking** | ❌ | ✅ | Backend blocks all Plaid routes |
| **Transaction Matching** | ❌ | ✅ | Backend middleware |

### Code Locations:

**Backend Enforcement**:
- `backend/src/middleware/subscription.ts` - All tier checks
- `backend/src/routes/account.routes.ts:87` - Stack limit check
- `backend/src/routes/stack.routes.ts:77` - Auto-allocation check
- `backend/src/routes/plaid.routes.ts:37-44` - Pro-only routes

**Frontend UI**:
- `frontend/src/components/CreateStackModal.tsx:125-139` - Stack limit warning
- `frontend/src/components/CreateStackModal.tsx:355-379` - Auto-allocation disabled
- `frontend/src/components/settings/SubscriptionSettings.tsx` - Full tier comparison

---

## Troubleshooting

### "Webhook signature verification failed"

**Solution**: Make sure `STRIPE_WEBHOOK_SECRET` matches the one from `stripe listen` output.

### "No such price: price_..."

**Solution**: Verify `STRIPE_PRO_MONTHLY_PRICE_ID` matches the Price ID from Stripe Dashboard.

### "Customer not found"

**Solution**: User hasn't completed checkout yet. `customerId` is set during checkout.

### Checkout redirects but subscription doesn't activate

**Solution**: Check webhook is running (`stripe listen`) and backend logs show webhook received.

---

## Next Steps

1. ✅ Get Stripe API keys
2. ✅ Create Pro product ($6.99/month)
3. ✅ Set up webhook forwarding
4. ✅ Update `.env` with all values
5. ✅ Test checkout flow
6. ✅ Test cancellation flow
7. ✅ Launch! 🚀

---

## Support

- **Stripe Docs**: https://stripe.com/docs
- **Stripe Test Mode**: https://dashboard.stripe.com/test
- **Webhook Testing**: `stripe listen --forward-to localhost:5000/api/subscription/webhook`
- **Admin Manual Override**: See [ADMIN_TESTING.md](ADMIN_TESTING.md)
