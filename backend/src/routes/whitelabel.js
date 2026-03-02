const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../services/database');
const { body, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');

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

// Get white-label settings for organization
router.get('/:orgId', authenticate, async (req, res) => {
  try {
    const { orgId } = req.params;
    const settings = await db.getWhiteLabelSettings(orgId);
    
    if (!settings) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    res.json({ settings });
  } catch (error) {
    console.error('Error fetching white-label settings:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update white-label settings
router.put('/:orgId', authenticate, [
  body('branding.logo').optional().isURL().withMessage('Logo must be a valid URL'),
  body('branding.favicon').optional().isURL().withMessage('Favicon must be a valid URL'),
  body('branding.companyName').optional().trim().isLength({ min: 1 }),
  body('branding.supportEmail').optional().isEmail().withMessage('Support email must be valid'),
  body('colors.primary').optional().matches(/^#[0-9A-Fa-f]{6}$/).withMessage('Primary color must be a valid hex color'),
  body('colors.secondary').optional().matches(/^#[0-9A-Fa-f]{6}$/).withMessage('Secondary color must be a valid hex color'),
  body('colors.accent').optional().matches(/^#[0-9A-Fa-f]{6}$/).withMessage('Accent color must be a valid hex color'),
  body('domain').optional().isFQDN().withMessage('Domain must be a valid FQDN'),
  body('termsOfService').optional().isURL().withMessage('Terms of service must be a valid URL'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { orgId } = req.params;
    const { branding, colors, domain, termsOfService, customCss } = req.body;

    // Verify user has access to organization
    const org = await db.getOrganizationById(orgId);
    if (!org) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    if (org.owner_id !== req.userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Build update object
    const updates = {
      updated_at: new Date().toISOString()
    };

    if (branding) {
      if (branding.logo !== undefined) updates.logo_url = branding.logo;
      if (branding.favicon !== undefined) updates.favicon_url = branding.favicon;
      if (branding.companyName !== undefined) updates.name = branding.companyName;
      if (branding.supportEmail !== undefined) updates.support_email = branding.supportEmail;
    }

    if (colors) {
      if (colors.primary !== undefined) updates.primary_color = colors.primary;
      if (colors.secondary !== undefined) updates.secondary_color = colors.secondary;
      if (colors.accent !== undefined) updates.accent_color = colors.accent;
      if (colors.background !== undefined) updates.background_color = colors.background;
    }

    if (domain !== undefined) updates.custom_domain = domain;
    if (termsOfService !== undefined) updates.terms_of_service_url = termsOfService;
    if (customCss !== undefined) updates.custom_css = customCss;

    const updated = await db.updateOrganization(orgId, updates);

    res.json({
      message: 'White-label settings updated successfully',
      settings: await db.getWhiteLabelSettings(orgId)
    });
  } catch (error) {
    console.error('Error updating white-label settings:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get white-label settings by domain (public endpoint)
router.get('/domain/:domain', async (req, res) => {
  try {
    const { domain } = req.params;
    const org = await db.getOrganizationByDomain(domain);
    
    if (!org) {
      return res.status(404).json({ message: 'Organization not found for this domain' });
    }

    const settings = await db.getWhiteLabelSettings(org.id);
    res.json({ settings });
  } catch (error) {
    console.error('Error fetching white-label settings by domain:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Upload logo/favicon (placeholder - in production, integrate with S3/Cloudinary)
router.post('/:orgId/upload', authenticate, async (req, res) => {
  try {
    const { orgId } = req.params;
    const { type, url } = req.body; // type: 'logo' | 'favicon'

    if (!['logo', 'favicon'].includes(type)) {
      return res.status(400).json({ message: 'Invalid upload type' });
    }

    if (!url || !url.match(/^https?:\/\/.+/)) {
      return res.status(400).json({ message: 'Invalid URL' });
    }

    // Verify user has access
    const org = await db.getOrganizationById(orgId);
    if (!org || org.owner_id !== req.userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const updates = type === 'logo' 
      ? { logo_url: url }
      : { favicon_url: url };

    await db.updateOrganization(orgId, updates);

    res.json({
      message: `${type} uploaded successfully`,
      url
    });
  } catch (error) {
    console.error('Error uploading asset:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;






















