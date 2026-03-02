const crypto = require('crypto');
const db = require('../services/database');

/**
 * API Key Authentication Middleware
 * 
 * Supports:
 *   - X-API-Key header
 *   - Authorization: ApiKey <key>
 * 
 * On success, sets req.userId, req.apiKeyId, and req.apiKeyScopes.
 * Falls through to next middleware if no API key is present (so JWT auth can try).
 */
async function apiKeyAuth(req, res, next) {
  const apiKey = req.headers['x-api-key'] || extractApiKeyFromAuth(req.headers.authorization);
  
  if (!apiKey) {
    return next(); // No API key - let other auth middleware handle it
  }

  try {
    // Hash the key and look up in DB
    const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');
    const keyRecord = await db.getApiKeyByHash(keyHash);

    if (!keyRecord) {
      return res.status(401).json({ message: 'Invalid API key' });
    }

    // Check expiration
    if (keyRecord.expires_at && new Date(keyRecord.expires_at) < new Date()) {
      return res.status(401).json({ message: 'API key has expired' });
    }

    // Set user context
    req.userId = keyRecord.user_id;
    req.apiKeyId = keyRecord.id;
    req.apiKeyScopes = keyRecord.scopes || [];

    // Update last_used_at (fire and forget)
    db.updateApiKeyLastUsed?.(keyRecord.id).catch(() => {});

    next();
  } catch (error) {
    console.error('API key auth error:', error);
    return res.status(500).json({ message: 'API key authentication failed' });
  }
}

function extractApiKeyFromAuth(authHeader) {
  if (!authHeader) return null;
  if (authHeader.startsWith('ApiKey ')) return authHeader.slice(7);
  return null;
}

/**
 * Hash a raw API key for storage
 */
function hashApiKey(rawKey) {
  return crypto.createHash('sha256').update(rawKey).digest('hex');
}

/**
 * Generate a new API key (prefix + random bytes)
 */
function generateApiKey() {
  const prefix = 'pk_';
  const randomPart = crypto.randomBytes(32).toString('hex');
  return prefix + randomPart;
}

module.exports = { apiKeyAuth, hashApiKey, generateApiKey };
