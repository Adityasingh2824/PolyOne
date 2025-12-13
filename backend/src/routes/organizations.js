const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../services/database');
const { body, validationResult } = require('express-validator');

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

// Create organization/team
router.post('/', authenticate, [
  body('name').trim().isLength({ min: 2 }).withMessage('Organization name must be at least 2 characters'),
  body('slug').optional().trim().isLength({ min: 2 }),
  body('description').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { name, slug, description } = req.body;

    // In production, this would create organization in database
    // const organization = await db.createOrganization({
    //   name,
    //   slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
    //   description,
    //   owner_id: req.userId
    // });

    const organization = {
      id: require('uuid').v4(),
      name,
      slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
      description,
      owner_id: req.userId,
      created_at: new Date().toISOString()
    };

    res.status(201).json({
      message: 'Organization created successfully',
      organization
    });
  } catch (error) {
    console.error('Error creating organization:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get user's organizations
router.get('/', authenticate, async (req, res) => {
  try {
    // In production, this would query organizations table
    // const organizations = await db.getUserOrganizations(req.userId);
    const organizations = [];

    res.json({ organizations });
  } catch (error) {
    console.error('Error fetching organizations:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get organization members
router.get('/:orgId/members', authenticate, async (req, res) => {
  try {
    const { orgId } = req.params;

    // In production, this would query organization_members table
    // const members = await db.getOrganizationMembers(orgId);
    const members = [];

    res.json({ members });
  } catch (error) {
    console.error('Error fetching organization members:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add member to organization
router.post('/:orgId/members', authenticate, [
  body('user_id').isUUID().withMessage('Invalid user ID'),
  body('role').isIn(['owner', 'admin', 'member', 'viewer', 'billing']).withMessage('Invalid role')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { orgId } = req.params;
    const { user_id, role } = req.body;

    // In production, this would add member to organization_members table
    // const member = await db.addOrganizationMember({
    //   organization_id: orgId,
    //   user_id,
    //   role,
    //   invited_by: req.userId
    // });

    const member = {
      id: require('uuid').v4(),
      organization_id: orgId,
      user_id,
      role,
      status: 'active',
      joined_at: new Date().toISOString()
    };

    res.status(201).json({
      message: 'Member added successfully',
      member
    });
  } catch (error) {
    console.error('Error adding member:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Remove member from organization
router.delete('/:orgId/members/:memberId', authenticate, async (req, res) => {
  try {
    const { orgId, memberId } = req.params;

    // In production, this would remove member from organization_members table
    // await db.removeOrganizationMember(memberId);

    res.json({ message: 'Member removed successfully' });
  } catch (error) {
    console.error('Error removing member:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;


