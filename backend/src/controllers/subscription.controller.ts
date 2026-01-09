import { Response, NextFunction } from 'express';
import { stripe, STRIPE_PRICES, STRIPE_CONFIG } from '../config/stripe';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middleware/auth';

// Create Stripe Checkout Session for Pro subscription
export const createCheckoutSession = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user already has an active subscription
    if (user.subscriptionTier === 'pro' && user.subscriptionStatus === 'active') {
      return res.status(400).json({ message: 'You already have an active Pro subscription' });
    }

    // Create or retrieve Stripe customer
    let customerId = user.customerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          userId: user.id,
          name: `${user.firstName} ${user.lastName}`,
        },
      });
      customerId = customer.id;

      // Save customer ID to database
      await prisma.user.update({
        where: { id: userId },
        data: { customerId },
      });
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: STRIPE_PRICES.PRO_MONTHLY,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: STRIPE_CONFIG.URLS.SUCCESS,
      cancel_url: STRIPE_CONFIG.URLS.CANCEL,
      metadata: {
        userId: user.id,
      },
    });

    res.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    next(error);
  }
};

// Create Customer Portal session (for managing subscription/cancellation)
export const createPortalSession = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.customerId) {
      return res.status(400).json({ message: 'No Stripe customer found' });
    }

    // Create portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: user.customerId,
      return_url: STRIPE_CONFIG.URLS.SUCCESS,
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('Stripe portal error:', error);
    next(error);
  }
};

// Handle Stripe webhooks
export const handleWebhook = async (req: any, res: Response, next: NextFunction) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET not configured');
    return res.status(500).json({ message: 'Webhook secret not configured' });
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as any;
        await handleCheckoutComplete(session);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as any;
        await handleSubscriptionUpdated(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as any;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as any;
        await handlePaymentSucceeded(invoice);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as any;
        await handlePaymentFailed(invoice);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    next(error);
  }
};

// Webhook helper functions
async function handleCheckoutComplete(session: any) {
  const userId = session.metadata?.userId;
  const customerId = session.customer;
  const subscriptionId = session.subscription;

  if (!userId) {
    console.error('No userId in session metadata');
    return;
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      subscriptionTier: 'pro',
      subscriptionStatus: 'active',
      customerId: customerId,
      subscriptionId: subscriptionId,
      subscriptionExpiresAt: null, // Active subscription, no expiration
    },
  });

  console.log(`User ${userId} upgraded to Pro via checkout`);
}

async function handleSubscriptionUpdated(subscription: any) {
  const customerId = subscription.customer;

  const user = await prisma.user.findFirst({
    where: { customerId },
  });

  if (!user) {
    console.error(`No user found for customer ${customerId}`);
    return;
  }

  // Determine status
  let status = 'active';
  if (subscription.status === 'past_due') {
    status = 'past_due';
  } else if (subscription.status === 'canceled' || subscription.cancel_at_period_end) {
    status = 'cancelled';
  }

  // Get expiration date if cancelled
  let expiresAt = null;
  if (subscription.cancel_at_period_end) {
    expiresAt = new Date(subscription.current_period_end * 1000);
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      subscriptionStatus: status,
      subscriptionExpiresAt: expiresAt,
    },
  });

  console.log(`Subscription updated for user ${user.id}: ${status}`);
}

async function handleSubscriptionDeleted(subscription: any) {
  const customerId = subscription.customer;

  const user = await prisma.user.findFirst({
    where: { customerId },
  });

  if (!user) {
    console.error(`No user found for customer ${customerId}`);
    return;
  }

  // Downgrade to free tier
  await prisma.user.update({
    where: { id: user.id },
    data: {
      subscriptionTier: 'free',
      subscriptionStatus: 'active',
      subscriptionId: null,
      subscriptionExpiresAt: null,
    },
  });

  console.log(`User ${user.id} downgraded to Free tier`);
}

async function handlePaymentSucceeded(invoice: any) {
  const customerId = invoice.customer;

  const user = await prisma.user.findFirst({
    where: { customerId },
  });

  if (!user) return;

  // Ensure user is still Pro and active
  await prisma.user.update({
    where: { id: user.id },
    data: {
      subscriptionStatus: 'active',
      subscriptionExpiresAt: null,
    },
  });

  console.log(`Payment succeeded for user ${user.id}`);
}

async function handlePaymentFailed(invoice: any) {
  const customerId = invoice.customer;

  const user = await prisma.user.findFirst({
    where: { customerId },
  });

  if (!user) return;

  // Mark as past due
  await prisma.user.update({
    where: { id: user.id },
    data: {
      subscriptionStatus: 'past_due',
    },
  });

  console.log(`Payment failed for user ${user.id} - marked as past_due`);
}
