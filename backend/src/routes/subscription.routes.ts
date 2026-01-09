import { Router } from 'express';
import { createCheckoutSession, createPortalSession, handleWebhook } from '../controllers/subscription.controller';
import { authenticate } from '../middleware/auth';
import express from 'express';

const router = Router();

// Create Stripe Checkout Session
router.post('/create-checkout-session', authenticate, createCheckoutSession);

// Create Customer Portal Session (for cancellation/management)
router.post('/create-portal-session', authenticate, createPortalSession);

// Stripe webhook endpoint (must use raw body for signature verification)
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  handleWebhook
);

export default router;
