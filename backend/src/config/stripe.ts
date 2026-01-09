import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('Warning: STRIPE_SECRET_KEY not found in environment variables. Stripe features will not work.');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
  apiVersion: '2025-12-15.clover',
});

// Stripe Price IDs (you'll get these after creating products in Stripe Dashboard)
export const STRIPE_PRICES = {
  PRO_MONTHLY: process.env.STRIPE_PRO_MONTHLY_PRICE_ID || '',
};

export const STRIPE_CONFIG = {
  // Product names
  PRODUCTS: {
    PRO: 'Stackwise Pro',
  },

  // Pricing
  PRICES: {
    PRO_MONTHLY: 6.99, // $6.99/month
  },

  // Success/Cancel URLs (for Stripe Checkout)
  URLS: {
    SUCCESS: process.env.FRONTEND_URL + '/settings?subscription=success',
    CANCEL: process.env.FRONTEND_URL + '/settings?subscription=cancelled',
  },
};
