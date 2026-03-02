/**
 * Stripe Integration Service
 * 
 * Provides Stripe payment processing for subscriptions, checkout, and webhooks.
 * Set STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET in your environment.
 */

const config = require('../config/env');

let stripe = null;

// Initialize Stripe only if configured
function getStripe() {
  if (stripe) return stripe;

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return null;
  }

  try {
    const Stripe = require('stripe');
    stripe = new Stripe(secretKey, { apiVersion: '2024-12-18.acacia' });
    console.log('Stripe initialized successfully');
    return stripe;
  } catch (error) {
    console.warn('Stripe initialization failed:', error.message);
    return null;
  }
}

function isConfigured() {
  return !!process.env.STRIPE_SECRET_KEY;
}

/**
 * Create or retrieve a Stripe customer for a user
 */
async function getOrCreateCustomer(userId, email, name) {
  const s = getStripe();
  if (!s) throw new Error('Stripe is not configured');

  // Search for existing customer by metadata
  const existing = await s.customers.list({
    email,
    limit: 1,
  });

  if (existing.data.length > 0) {
    return existing.data[0];
  }

  // Create new customer
  return await s.customers.create({
    email,
    name,
    metadata: { polyone_user_id: userId },
  });
}

/**
 * Create a Stripe Checkout session for a subscription plan
 */
async function createCheckoutSession({ userId, email, name, planId, priceAmount, planName, successUrl, cancelUrl }) {
  const s = getStripe();
  if (!s) throw new Error('Stripe is not configured');

  const customer = await getOrCreateCustomer(userId, email, name);

  const session = await s.checkout.sessions.create({
    customer: customer.id,
    payment_method_types: ['card'],
    mode: 'subscription',
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `PolyOne ${planName} Plan`,
            description: `Subscription to PolyOne ${planName} plan`,
          },
          unit_amount: Math.round(priceAmount * 100), // cents
          recurring: { interval: 'month' },
        },
        quantity: 1,
      },
    ],
    metadata: {
      polyone_user_id: userId,
      polyone_plan_id: planId,
    },
    success_url: successUrl || `${config.FRONTEND_URL}/dashboard/billing?session_id={CHECKOUT_SESSION_ID}&status=success`,
    cancel_url: cancelUrl || `${config.FRONTEND_URL}/dashboard/billing?status=cancelled`,
  });

  return session;
}

/**
 * Cancel a Stripe subscription
 */
async function cancelSubscription(stripeSubscriptionId) {
  const s = getStripe();
  if (!s) throw new Error('Stripe is not configured');

  return await s.subscriptions.cancel(stripeSubscriptionId);
}

/**
 * Retrieve a Stripe subscription
 */
async function getSubscription(stripeSubscriptionId) {
  const s = getStripe();
  if (!s) throw new Error('Stripe is not configured');

  return await s.subscriptions.retrieve(stripeSubscriptionId);
}

/**
 * Construct and verify a Stripe webhook event
 */
function constructWebhookEvent(rawBody, signature) {
  const s = getStripe();
  if (!s) throw new Error('Stripe is not configured');

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) throw new Error('STRIPE_WEBHOOK_SECRET is not configured');

  return s.webhooks.constructEvent(rawBody, signature, webhookSecret);
}

module.exports = {
  isConfigured,
  getStripe,
  getOrCreateCustomer,
  createCheckoutSession,
  cancelSubscription,
  getSubscription,
  constructWebhookEvent,
};
