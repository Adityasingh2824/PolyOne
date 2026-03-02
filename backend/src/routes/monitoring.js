const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../services/database');
const healthMonitoring = require('../services/chainHealthMonitoring');

// Middleware to verify JWT
const authenticate = (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      if (process.env.NODE_ENV === 'development') {
        req.userId = req.query.userId || 'dev-user';
        return next();
      }
      return res.status(401).json({ message: 'No token provided' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      req.userId = req.query.userId || 'dev-user';
      return next();
    }
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Get chain metrics - uses real health monitoring service when available
router.get('/:chainId/metrics', authenticate, async (req, res) => {
  try {
    const { chainId } = req.params;

    // Try to get real data from health monitoring service
    const healthStatus = healthMonitoring.getHealthStatus(chainId);
    const chain = await db.getChainById(chainId);

    if (healthStatus && healthStatus.metrics) {
      const m = healthStatus.metrics;
      return res.json({
        timestamp: healthStatus.lastCheck || new Date().toISOString(),
        tps: m.tps || chain?.tps || 0,
        blockTime: m.avg_block_time || m.blockTime || chain?.avg_block_time || 0,
        gasPrice: m.gasPrice || 0,
        activeValidators: m.active_validators || m.activeValidators || chain?.validators_count || 0,
        currentBlock: m.current_block || m.currentBlock || chain?.current_block || 0,
        pendingTransactions: m.pending_transactions || 0,
        uptime: chain?.uptime || healthStatus.score || 100,
        healthScore: healthStatus.score || 0,
        healthStatus: healthStatus.status || 'unknown',
        source: 'health_monitoring'
      });
    }

    // Fallback: use chain data from DB
    if (chain) {
      return res.json({
        timestamp: new Date().toISOString(),
        tps: chain.tps || 0,
        blockTime: chain.avg_block_time || 0,
        gasPrice: 0,
        activeValidators: chain.validators_count || 0,
        currentBlock: chain.current_block || 0,
        pendingTransactions: 0,
        uptime: chain.uptime || 100,
        healthScore: 0,
        healthStatus: chain.status || 'unknown',
        source: 'database'
      });
    }

    // Last resort: minimal response
    res.json({
      timestamp: new Date().toISOString(),
      tps: 0,
      blockTime: 0,
      gasPrice: 0,
      activeValidators: 0,
      currentBlock: 0,
      pendingTransactions: 0,
      uptime: 0,
      healthScore: 0,
      healthStatus: 'unknown',
      source: 'none'
    });
  } catch (error) {
    console.error('Error fetching metrics:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get chain analytics - uses real data from health monitoring history
router.get('/:chainId/analytics', authenticate, async (req, res) => {
  try {
    const { chainId } = req.params;
    const chain = await db.getChainById(chainId);

    // Try to get real history from health monitoring
    let history = [];
    try {
      history = healthMonitoring.getHealthHistory(chainId) || [];
    } catch { /* ignore */ }

    if (history.length > 0) {
      const data = history.slice(-24).map(entry => ({
        timestamp: entry.timestamp || entry.checked_at || new Date().toISOString(),
        transactions: entry.checks?.performance?.totalTransactions || chain?.transactions || 0,
        tps: entry.checks?.performance?.tps || chain?.tps || 0,
        blockTime: entry.checks?.blockProduction?.blockTime || chain?.avg_block_time || 0,
        gasUsed: 0,
        healthScore: entry.score || 0
      }));
      return res.json({ data, period: '24h', source: 'health_monitoring' });
    }

    // Fallback: generate from chain DB data (not random)
    const now = new Date();
    const data = [];
    for (let i = 23; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);
      data.push({
        timestamp: timestamp.toISOString(),
        transactions: chain?.transactions ? Math.round(chain.transactions / 24) : 0,
        tps: chain?.tps || 0,
        blockTime: chain?.avg_block_time || 0,
        gasUsed: 0,
        healthScore: 0
      });
    }

    res.json({ data, period: '24h', source: 'database' });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get chain logs
router.get('/:chainId/logs', authenticate, async (req, res) => {
  try {
    const { chainId } = req.params;
    const { level = 'all', limit = 50 } = req.query;

    // Try to get real incidents/events from health monitoring
    let incidents = [];
    try {
      incidents = healthMonitoring.getIncidents(chainId) || [];
    } catch { /* ignore */ }

    if (incidents.length > 0) {
      const logs = incidents.slice(0, parseInt(limit)).map((inc, i) => ({
        id: inc.id || `inc-${i}`,
        timestamp: inc.detected_at || inc.created_at || new Date().toISOString(),
        level: inc.severity || 'info',
        message: inc.title || inc.description || 'Health incident',
        source: 'health_monitoring'
      }));

      if (level !== 'all') {
        return res.json({
          logs: logs.filter(l => l.level === level),
          total: logs.filter(l => l.level === level).length
        });
      }
      return res.json({ logs, total: logs.length });
    }

    // No logs available
    res.json({ logs: [], total: 0 });
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
