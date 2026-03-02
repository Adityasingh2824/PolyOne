const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');
const db = require('../services/database');

// Middleware to verify JWT
const authenticate = (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

const SUPPORTED_EVENTS = [
  'chain.created', 'chain.deployed', 'chain.paused', 'chain.resumed', 'chain.deleted',
  'chain.upgraded', 'chain.failed',
  'validator.added', 'validator.removed', 'validator.slashed',
  'bridge.initiated', 'bridge.completed', 'bridge.failed',
  'billing.subscription.created', 'billing.subscription.cancelled', 'billing.invoice.paid',
  'health.incident.detected', 'health.incident.resolved',
];

/**
 * POST /api/webhooks
 * Register a new webhook endpoint.
 */
router.post('/', authenticate, [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('url').isURL().withMessage('Valid URL is required'),
  body('events').isArray({ min: 1 }).withMessage('At least one event is required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { name, url, events, chain_id } = req.body;

    // Validate events
    const invalidEvents = events.filter(e => !SUPPORTED_EVENTS.includes(e));
    if (invalidEvents.length > 0) {
      return res.status(400).json({
        message: `Invalid events: ${invalidEvents.join(', ')}`,
        supported_events: SUPPORTED_EVENTS,
      });
    }

    // Generate signing secret
    const secret = 'whsec_' + crypto.randomBytes(24).toString('hex');

    const webhookData = {
      id: uuidv4(),
      user_id: req.userId,
      name,
      url,
      secret,
      events,
      chain_id: chain_id || null,
      is_active: true,
      retry_count: 3,
      timeout_seconds: 30,
      consecutive_failures: 0,
    };

    const saved = await db.createWebhook(webhookData);

    res.status(201).json({
      message: 'Webhook created. Save the secret - it will not be shown again.',
      webhook: {
        id: saved.id,
        name: saved.name,
        url: saved.url,
        events: saved.events,
        secret,
        is_active: saved.is_active,
        created_at: saved.created_at,
      },
    });
  } catch (error) {
    console.error('Error creating webhook:', error);
    res.status(500).json({ message: 'Failed to create webhook', error: error.message });
  }
});

/**
 * GET /api/webhooks
 * List all webhooks for the authenticated user.
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const webhooks = await db.getWebhooksByUser(req.userId);
    // Don't expose secrets
    const sanitized = webhooks.map(({ secret, ...rest }) => rest);
    res.json({ data: sanitized, supported_events: SUPPORTED_EVENTS });
  } catch (error) {
    console.error('Error listing webhooks:', error);
    res.status(500).json({ message: 'Failed to list webhooks', error: error.message });
  }
});

/**
 * PUT /api/webhooks/:id
 * Update a webhook.
 */
router.put('/:id', authenticate, async (req, res) => {
  try {
    const webhook = await db.getWebhookById(req.params.id);
    if (!webhook || webhook.user_id !== req.userId) {
      return res.status(404).json({ message: 'Webhook not found' });
    }

    const { name, url, events, is_active } = req.body;
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (url !== undefined) updates.url = url;
    if (events !== undefined) updates.events = events;
    if (is_active !== undefined) updates.is_active = is_active;

    const updated = await db.updateWebhook(req.params.id, updates);
    const { secret, ...safe } = updated;
    res.json({ message: 'Webhook updated', webhook: safe });
  } catch (error) {
    console.error('Error updating webhook:', error);
    res.status(500).json({ message: 'Failed to update webhook', error: error.message });
  }
});

/**
 * DELETE /api/webhooks/:id
 * Delete a webhook.
 */
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const deleted = await db.deleteWebhook(req.params.id, req.userId);
    if (!deleted) {
      return res.status(404).json({ message: 'Webhook not found' });
    }
    res.json({ message: 'Webhook deleted' });
  } catch (error) {
    console.error('Error deleting webhook:', error);
    res.status(500).json({ message: 'Failed to delete webhook', error: error.message });
  }
});

// ============================================================================
// Webhook Delivery Utility (used by other services to fire events)
// ============================================================================

const axios = require('axios');

/**
 * Deliver a webhook event to all subscribers.
 * Call this from services when events happen (e.g. chain deployed, bridge completed).
 */
async function deliverWebhookEvent(eventType, payload) {
  try {
    const webhooks = await db.getActiveWebhooksForEvent(eventType);
    if (!webhooks || webhooks.length === 0) return;

    const deliveryPromises = webhooks.map(async (webhook) => {
      const timestamp = Math.floor(Date.now() / 1000);
      const body = JSON.stringify({ event: eventType, timestamp, data: payload });
      const signature = crypto.createHmac('sha256', webhook.secret).update(body).digest('hex');

      try {
        const response = await axios.post(webhook.url, body, {
          headers: {
            'Content-Type': 'application/json',
            'X-PolyOne-Signature': signature,
            'X-PolyOne-Event': eventType,
            'X-PolyOne-Timestamp': timestamp.toString(),
          },
          timeout: (webhook.timeout_seconds || 30) * 1000,
        });

        // Reset consecutive failures on success
        await db.updateWebhook(webhook.id, { consecutive_failures: 0, last_triggered_at: new Date().toISOString(), last_delivery_status: 'success' });
        return { webhookId: webhook.id, status: 'success', statusCode: response.status };
      } catch (err) {
        const failures = (webhook.consecutive_failures || 0) + 1;
        const updates = { consecutive_failures: failures, last_triggered_at: new Date().toISOString(), last_delivery_status: 'failed' };
        // Disable webhook after 10 consecutive failures
        if (failures >= 10) updates.is_active = false;
        await db.updateWebhook(webhook.id, updates);
        return { webhookId: webhook.id, status: 'failed', error: err.message };
      }
    });

    return await Promise.allSettled(deliveryPromises);
  } catch (error) {
    console.error('Error delivering webhook event:', error);
  }
}

module.exports = router;
module.exports.deliverWebhookEvent = deliverWebhookEvent;
