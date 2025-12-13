const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../services/database');
const { body, validationResult } = require('express-validator');
const fs = require('fs').promises;
const path = require('path');

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

// Get transaction analytics
router.get('/transactions/:chainId', authenticate, async (req, res) => {
  try {
    const { chainId } = req.params;
    const { period = 'daily', startDate, endDate } = req.query;
    
    const chain = await db.getChainById(chainId);
    if (!chain || chain.user_id !== req.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // In production, this would query transaction_analytics table
    const analytics = {
      period,
      total_transactions: chain.transactions || 0,
      successful_transactions: chain.transactions || 0,
      failed_transactions: 0,
      pending_transactions: 0,
      total_value_transferred: 0,
      avg_transaction_value: 0,
      total_gas_used: 0,
      avg_gas_used: 0,
      unique_senders: 0,
      unique_receivers: 0,
      contract_deployments: 0,
      contract_calls: 0
    };

    res.json({ analytics });
  } catch (error) {
    console.error('Error fetching transaction analytics:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get gas analytics
router.get('/gas/:chainId', authenticate, async (req, res) => {
  try {
    const { chainId } = req.params;
    const { period = 'daily' } = req.query;
    
    const chain = await db.getChainById(chainId);
    if (!chain || chain.user_id !== req.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // In production, this would query gas_analytics table
    const gasAnalytics = {
      period,
      avg_gas_price: 0,
      min_gas_price: 0,
      max_gas_price: 0,
      median_gas_price: 0,
      total_gas_used: 0,
      avg_gas_limit: 0,
      gas_utilization_percentage: 0,
      slow_gas_price: 0,
      standard_gas_price: 0,
      fast_gas_price: 0,
      instant_gas_price: 0
    };

    res.json({ gasAnalytics });
  } catch (error) {
    console.error('Error fetching gas analytics:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get user activity reports
router.get('/activity', authenticate, async (req, res) => {
  try {
    const { period = 'monthly', startDate, endDate } = req.query;

    // In production, this would query user_activity_analytics table
    const activity = {
      period,
      logins_count: 0,
      api_calls_count: 0,
      dashboard_views: 0,
      chains_created: 0,
      chains_deleted: 0,
      chains_paused: 0,
      validators_added: 0,
      validators_removed: 0,
      bridge_deposits: 0,
      bridge_withdrawals: 0,
      bridge_volume: 0
    };

    res.json({ activity });
  } catch (error) {
    console.error('Error fetching user activity:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get chain performance reports
router.get('/performance/:chainId', authenticate, async (req, res) => {
  try {
    const { chainId } = req.params;
    const { period = 'daily' } = req.query;
    
    const chain = await db.getChainById(chainId);
    if (!chain || chain.user_id !== req.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // In production, this would query chain_performance_analytics table
    const performance = {
      period,
      blocks_produced: chain.total_blocks || 0,
      avg_block_time_ms: chain.avg_block_time || 0,
      tps_avg: chain.tps || 0,
      tps_max: chain.tps || 0,
      tps_min: 0,
      uptime_percentage: chain.uptime || 100,
      downtime_minutes: 0,
      incidents_count: 0,
      cpu_usage_avg: 0,
      memory_usage_avg: 0,
      storage_used_gb: chain.storage_used_gb || 0,
      bandwidth_used_gb: chain.bandwidth_used_gb || 0,
      peer_count_avg: 0,
      latency_avg_ms: 0
    };

    res.json({ performance });
  } catch (error) {
    console.error('Error fetching chain performance:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Export analytics data
router.post('/export', authenticate, [
  body('export_type').isIn(['transactions', 'gas_analytics', 'performance', 'user_activity', 'full_report']).withMessage('Invalid export type'),
  body('format').isIn(['csv', 'pdf', 'json', 'xlsx']).withMessage('Invalid format'),
  body('chain_id').optional().isUUID().withMessage('Invalid chain ID'),
  body('date_from').isISO8601().withMessage('Invalid start date'),
  body('date_to').isISO8601().withMessage('Invalid end date')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { export_type, format, chain_id, date_from, date_to } = req.body;

    // Create export record
    const exportData = {
      user_id: req.userId,
      chain_id: chain_id || null,
      export_type,
      format,
      date_from,
      date_to,
      status: 'processing',
      created_at: new Date().toISOString()
    };

    // In production, this would save to analytics_exports table and process asynchronously
    const exportRecord = {
      id: require('uuid').v4(),
      ...exportData
    };

    // Simulate export generation
    setTimeout(async () => {
      // In production, generate actual file
      const fileName = `export_${exportRecord.id}.${format}`;
      // Save file and update export record with file URL
    }, 1000);

    res.status(201).json({
      message: 'Export initiated',
      export: exportRecord,
      estimatedTime: '1-2 minutes'
    });
  } catch (error) {
    console.error('Error initiating export:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;


