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

// Middleware to check admin role
const requireAdmin = async (req, res, next) => {
  try {
    const user = await db.getUserById(req.userId);
    if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
      return res.status(403).json({ message: 'Admin access required' });
    }
    next();
  } catch (error) {
    res.status(500).json({ message: 'Error checking permissions' });
  }
};

// Get user profile
router.get('/profile', authenticate, async (req, res) => {
  try {
    const user = await db.getUserById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Remove sensitive data
    const { password_hash, two_factor_secret, ...profile } = user;
    res.json({ profile });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update user profile
router.put('/profile', authenticate, [
  body('first_name').optional().trim().isLength({ min: 1 }),
  body('last_name').optional().trim(),
  body('company').optional().trim(),
  body('bio').optional().trim(),
  body('timezone').optional().isString(),
  body('locale').optional().isLength({ min: 2, max: 10 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const updates = req.body;
    const updatedUser = await db.updateUser(req.userId, {
      ...updates,
      updated_at: new Date().toISOString()
    });

    // Log activity
    // await db.createActivityLog({
    //   user_id: req.userId,
    //   action: 'profile_updated',
    //   resource_type: 'user',
    //   resource_id: req.userId
    // });

    const { password_hash, two_factor_secret, ...profile } = updatedUser;
    res.json({ message: 'Profile updated successfully', profile });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update user role (admin only)
router.put('/:userId/role', authenticate, requireAdmin, [
  body('role').isIn(['user', 'admin', 'viewer', 'super_admin']).withMessage('Invalid role')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { userId } = req.params;
    const { role } = req.body;

    const user = await db.getUserById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const updatedUser = await db.updateUser(userId, {
      role,
      updated_at: new Date().toISOString()
    });

    // Log activity
    // await db.createActivityLog({
    //   user_id: req.userId,
    //   action: 'role_updated',
    //   resource_type: 'user',
    //   resource_id: userId,
    //   metadata: { old_role: user.role, new_role: role }
    // });

    res.json({ message: 'User role updated successfully', user: updatedUser });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get user permissions for a chain
router.get('/:userId/permissions/:chainId', authenticate, async (req, res) => {
  try {
    const { userId, chainId } = req.params;

    // Check if requester is admin or the user themselves
    const requester = await db.getUserById(req.userId);
    if (requester.id !== userId && requester.role !== 'admin' && requester.role !== 'super_admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const chain = await db.getChainById(chainId);
    if (!chain) {
      return res.status(404).json({ message: 'Chain not found' });
    }

    // In production, this would query organization_members or user_permissions table
    const permissions = {
      user_id: userId,
      chain_id: chainId,
      permissions: chain.user_id === userId ? ['read', 'write', 'admin'] : ['read'],
      can_read: true,
      can_write: chain.user_id === userId,
      can_admin: chain.user_id === userId
    };

    res.json({ permissions });
  } catch (error) {
    console.error('Error fetching permissions:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update user permissions for a chain (admin or chain owner only)
router.put('/:userId/permissions/:chainId', authenticate, [
  body('permissions').isArray().withMessage('Permissions must be an array'),
  body('permissions.*').isIn(['read', 'write', 'admin']).withMessage('Invalid permission')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { userId, chainId } = req.params;
    const { permissions } = req.body;

    const requester = await db.getUserById(req.userId);
    const chain = await db.getChainById(chainId);

    if (!chain) {
      return res.status(404).json({ message: 'Chain not found' });
    }

    // Check if requester is admin or chain owner
    if (requester.role !== 'admin' && requester.role !== 'super_admin' && chain.user_id !== req.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // In production, this would update organization_members or user_permissions table
    // await db.updateUserPermissions(userId, chainId, permissions);

    res.json({ 
      message: 'Permissions updated successfully',
      permissions: {
        user_id: userId,
        chain_id: chainId,
        permissions
      }
    });
  } catch (error) {
    console.error('Error updating permissions:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get activity logs
router.get('/activity-logs', authenticate, async (req, res) => {
  try {
    const { limit = 50, offset = 0, action, resource_type } = req.query;

    // In production, this would query activity_logs table
    // const logs = await db.getActivityLogs({
    //   user_id: req.userId,
    //   limit: parseInt(limit),
    //   offset: parseInt(offset),
    //   action,
    //   resource_type
    // });

    const logs = [];

    res.json({
      logs,
      total: logs.length,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all users (admin only)
router.get('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { limit = 50, offset = 0, role, search } = req.query;

    // In production, this would query users table with filters
    // const users = await db.getUsers({
    //   limit: parseInt(limit),
    //   offset: parseInt(offset),
    //   role,
    //   search
    // });

    const users = [];

    res.json({
      users,
      total: users.length,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;


