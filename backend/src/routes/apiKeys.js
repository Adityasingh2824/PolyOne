const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');
const db = require('../services/database');
const { hashApiKey, generateApiKey } = require('../middleware/apiKeyAuth');

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

/**
 * POST /api/api-keys
 * Create a new API key. Returns the raw key ONCE; it is not stored.
 */
router.post('/', authenticate, [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('scopes').optional().isArray(),
  body('expires_in_days').optional().isInt({ min: 1, max: 365 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { name, scopes, expires_in_days } = req.body;
    const rawKey = generateApiKey();
    const keyHash = hashApiKey(rawKey);
    const keyPrefix = rawKey.slice(0, 10);

    const expiresAt = expires_in_days
      ? new Date(Date.now() + expires_in_days * 24 * 60 * 60 * 1000).toISOString()
      : null;

    const keyData = {
      id: uuidv4(),
      user_id: req.userId,
      name,
      key_prefix: keyPrefix,
      key_hash: keyHash,
      scopes: scopes || [],
      is_active: true,
      expires_at: expiresAt,
      rate_limit_per_minute: 60,
      rate_limit_per_day: 10000,
    };

    const saved = await db.createApiKey(keyData);

    res.status(201).json({
      message: 'API key created. Save it now - it will not be shown again.',
      key: rawKey,
      id: saved.id,
      name: saved.name,
      prefix: keyPrefix,
      scopes: saved.scopes,
      expires_at: saved.expires_at,
      created_at: saved.created_at,
    });
  } catch (error) {
    console.error('Error creating API key:', error);
    res.status(500).json({ message: 'Failed to create API key', error: error.message });
  }
});

/**
 * GET /api/api-keys
 * List all API keys for the authenticated user (hash is never returned).
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const keys = await db.getApiKeysByUser(req.userId);
    res.json({ data: keys });
  } catch (error) {
    console.error('Error listing API keys:', error);
    res.status(500).json({ message: 'Failed to list API keys', error: error.message });
  }
});

/**
 * DELETE /api/api-keys/:id
 * Revoke an API key.
 */
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const result = await db.revokeApiKey(req.params.id, req.userId);
    if (!result) {
      return res.status(404).json({ message: 'API key not found' });
    }
    res.json({ message: 'API key revoked successfully' });
  } catch (error) {
    console.error('Error revoking API key:', error);
    res.status(500).json({ message: 'Failed to revoke API key', error: error.message });
  }
});

module.exports = router;
