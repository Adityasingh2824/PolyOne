const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('../services/database');
const contracts = require('../services/contracts');

// Middleware to verify JWT (optional for development)
const authenticate = (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      if (process.env.NODE_ENV === 'development') {
        req.userId = req.query.userId || req.body.walletAddress || 'dev-user';
        return next();
      }
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      req.userId = req.query.userId || req.body.walletAddress || 'dev-user';
      return next();
    }
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Get all subscription plans
router.get('/plans', authenticate, async (req, res) => {
  try {
    const plans = await db.getSubscriptionPlans();
    
    // If no plans in database, return default plans
    if (!plans || plans.length === 0) {
      const defaultPlans = [
        {
          id: '1',
          name: 'Starter',
          price: 29,
          duration: 30, // days
          features: ['3 Chains', 'Basic Support', '10 Validators'],
          popular: false,
          isActive: true
        },
        {
          id: '2',
          name: 'Professional',
          price: 99,
          duration: 30,
          features: ['10 Chains', 'Priority Support', '50 Validators', 'Advanced Analytics'],
          popular: true,
          isActive: true
        },
        {
          id: '3',
          name: 'Enterprise',
          price: 299,
          duration: 30,
          features: ['Unlimited Chains', '24/7 Support', 'Unlimited Validators', 'Custom Features'],
          popular: false,
          isActive: true
        }
      ];
      return res.json({ data: defaultPlans });
    }

    res.json({ data: plans });
  } catch (error) {
    console.error('Error fetching plans:', error);
    res.status(500).json({ message: 'Failed to fetch plans', error: error.message });
  }
});

// Get user's subscriptions
router.get('/subscriptions', authenticate, async (req, res) => {
  try {
    const subscriptions = await db.getUserSubscriptions(req.userId);
    res.json({ data: subscriptions || [] });
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    res.status(500).json({ message: 'Failed to fetch subscriptions', error: error.message });
  }
});

// Subscribe to a plan
router.post('/subscribe', authenticate, async (req, res) => {
  try {
    const { planId, autoRenew = true } = req.body;

    if (!planId) {
      return res.status(400).json({ message: 'Plan ID is required' });
    }

    // Get plan details
    const plan = await db.getSubscriptionPlanById(planId);
    if (!plan) {
      return res.status(404).json({ message: 'Plan not found' });
    }

    // Check if user already has an active subscription
    const existingSubscriptions = await db.getUserSubscriptions(req.userId);
    const activeSubscription = existingSubscriptions?.find(
      sub => sub.status === 'active' && sub.isActive
    );

    if (activeSubscription) {
      return res.status(400).json({ 
        message: 'You already have an active subscription. Please cancel it first.' 
      });
    }

    // Create subscription
    const subscriptionId = uuidv4();
    const startTime = Math.floor(Date.now() / 1000);
    const endTime = startTime + (plan.duration * 24 * 60 * 60); // duration in seconds

    const subscription = {
      id: subscriptionId,
      userId: req.userId,
      planId: planId,
      status: 'active',
      startTime: startTime,
      endTime: endTime,
      autoRenew: autoRenew,
      isActive: true,
      createdAt: new Date().toISOString()
    };

    // Save to database
    await db.createSubscription(subscription);

    // If smart contract is available, create on-chain subscription
    try {
      const walletAddress = req.body.walletAddress || req.query.walletAddress;
      if (walletAddress && contracts.billing) {
        await contracts.billing.subscribe(
          walletAddress,
          planId,
          autoRenew
        );
      }
    } catch (contractError) {
      console.warn('Failed to create on-chain subscription:', contractError);
      // Continue even if on-chain creation fails
    }

    res.json({ 
      message: 'Subscription created successfully',
      data: subscription 
    });
  } catch (error) {
    console.error('Error creating subscription:', error);
    res.status(500).json({ message: 'Failed to create subscription', error: error.message });
  }
});

// Cancel subscription
router.post('/subscriptions/:subscriptionId/cancel', authenticate, async (req, res) => {
  try {
    const { subscriptionId } = req.params;

    const subscription = await db.getSubscriptionById(subscriptionId);
    if (!subscription) {
      return res.status(404).json({ message: 'Subscription not found' });
    }

    if (subscription.userId !== req.userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    await db.cancelSubscription(subscriptionId);

    res.json({ message: 'Subscription cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    res.status(500).json({ message: 'Failed to cancel subscription', error: error.message });
  }
});

// Get user's invoices
router.get('/invoices', authenticate, async (req, res) => {
  try {
    const invoices = await db.getUserInvoices(req.userId);
    res.json({ data: invoices || [] });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ message: 'Failed to fetch invoices', error: error.message });
  }
});

// Pay invoice
router.post('/invoices/:invoiceId/pay', authenticate, async (req, res) => {
  try {
    const { invoiceId } = req.params;

    const invoice = await db.getInvoiceById(invoiceId);
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    if (invoice.userId !== req.userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    if (invoice.status === 'paid' || invoice.isPaid) {
      return res.status(400).json({ message: 'Invoice is already paid' });
    }

    // Update invoice status
    await db.payInvoice(invoiceId);

    // If smart contract is available, mark invoice as paid on-chain
    try {
      const walletAddress = req.body.walletAddress || req.query.walletAddress;
      if (walletAddress && contracts.billing) {
        await contracts.billing.payInvoice(invoiceId);
      }
    } catch (contractError) {
      console.warn('Failed to update on-chain invoice:', contractError);
      // Continue even if on-chain update fails
    }

    res.json({ message: 'Invoice paid successfully' });
  } catch (error) {
    console.error('Error paying invoice:', error);
    res.status(500).json({ message: 'Failed to pay invoice', error: error.message });
  }
});

// Get payment history
router.get('/payments', authenticate, async (req, res) => {
  try {
    const payments = await db.getUserPaymentHistory(req.userId);
    res.json({ data: payments || [] });
  } catch (error) {
    console.error('Error fetching payment history:', error);
    res.status(500).json({ message: 'Failed to fetch payment history', error: error.message });
  }
});

// Get usage records
router.get('/usage', authenticate, async (req, res) => {
  try {
    const usage = await db.getUserUsageRecords(req.userId);
    res.json({ data: usage || [] });
  } catch (error) {
    console.error('Error fetching usage records:', error);
    res.status(500).json({ message: 'Failed to fetch usage records', error: error.message });
  }
});

module.exports = router;



