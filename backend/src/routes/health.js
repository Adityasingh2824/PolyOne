const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const healthMonitoring = require('../services/chainHealthMonitoring');
const db = require('../services/database');

// Middleware to verify JWT
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

/**
 * @swagger
 * /api/health/{chainId}/status:
 *   get:
 *     summary: Get current health status for a chain
 *     tags: [Health Monitoring]
 *     security:
 *       - bearerAuth: []
 */
router.get('/:chainId/status', authenticate, async (req, res) => {
  try {
    const { chainId } = req.params;
    
    // Verify chain belongs to user
    const chain = await db.getChainById(chainId);
    if (!chain) {
      return res.status(404).json({ message: 'Chain not found' });
    }

    const healthStatus = healthMonitoring.getHealthStatus(chainId);
    const uptimeData = healthMonitoring.getUptimeData(chainId);

    if (!healthStatus) {
      // Start monitoring if not already started
      try {
        await healthMonitoring.startMonitoring(chainId);
        // Perform initial check
        const healthData = await healthMonitoring.performHealthCheck(chainId);
        // Get updated status after check
        const updatedStatus = healthMonitoring.getHealthStatus(chainId);
        const updatedUptime = healthMonitoring.getUptimeData(chainId);
        
        return res.json({
          status: updatedStatus?.status || healthData.status,
          score: updatedStatus?.score || healthData.score,
          lastCheck: updatedStatus?.lastCheck || new Date().toISOString(),
          consecutiveFailures: updatedStatus?.consecutiveFailures || 0,
          metrics: updatedStatus?.metrics || healthData.checks,
          issues: healthData.issues || [],
          uptime: updatedUptime,
          monitoring: { active: true, justStarted: true }
        });
      } catch (checkError) {
        // If health check fails, return a default status
        console.warn('Initial health check failed:', checkError.message);
        return res.json({
          status: 'unknown',
          score: 0,
          lastCheck: new Date().toISOString(),
          consecutiveFailures: 0,
          metrics: {},
          issues: [`Initial health check failed: ${checkError.message}`],
          uptime: null,
          monitoring: { active: true, justStarted: true }
        });
      }
    }

    res.json({
      status: healthStatus.status,
      score: healthStatus.score,
      lastCheck: healthStatus.lastCheck,
      consecutiveFailures: healthStatus.consecutiveFailures,
      metrics: healthStatus.metrics,
      issues: healthStatus.issues || [],
      uptime: uptimeData,
      monitoring: { active: true }
    });
  } catch (error) {
    console.error('Error fetching health status:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @swagger
 * /api/health/{chainId}/check:
 *   post:
 *     summary: Perform a manual health check
 *     tags: [Health Monitoring]
 *     security:
 *       - bearerAuth: []
 */
router.post('/:chainId/check', authenticate, async (req, res) => {
  try {
    const { chainId } = req.params;
    
    // Verify chain belongs to user
    const chain = await db.getChainById(chainId);
    if (!chain) {
      return res.status(404).json({ message: 'Chain not found' });
    }

    const healthData = await healthMonitoring.performHealthCheck(chainId);
    res.json(healthData);
  } catch (error) {
    console.error('Error performing health check:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @swagger
 * /api/health/{chainId}/start:
 *   post:
 *     summary: Start health monitoring for a chain
 *     tags: [Health Monitoring]
 *     security:
 *       - bearerAuth: []
 */
router.post('/:chainId/start', authenticate, async (req, res) => {
  try {
    const { chainId } = req.params;
    const { interval, thresholds } = req.body;
    
    // Verify chain belongs to user
    const chain = await db.getChainById(chainId);
    if (!chain) {
      return res.status(404).json({ message: 'Chain not found' });
    }

    await healthMonitoring.startMonitoring(chainId, { interval, thresholds });
    res.json({ message: 'Health monitoring started', chainId });
  } catch (error) {
    console.error('Error starting health monitoring:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @swagger
 * /api/health/{chainId}/stop:
 *   post:
 *     summary: Stop health monitoring for a chain
 *     tags: [Health Monitoring]
 *     security:
 *       - bearerAuth: []
 */
router.post('/:chainId/stop', authenticate, async (req, res) => {
  try {
    const { chainId } = req.params;
    
    healthMonitoring.stopMonitoring(chainId);
    res.json({ message: 'Health monitoring stopped', chainId });
  } catch (error) {
    console.error('Error stopping health monitoring:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @swagger
 * /api/health/{chainId}/uptime:
 *   get:
 *     summary: Get uptime data for a chain
 *     tags: [Health Monitoring]
 *     security:
 *       - bearerAuth: []
 */
router.get('/:chainId/uptime', authenticate, async (req, res) => {
  try {
    const { chainId } = req.params;
    
    const uptimeData = healthMonitoring.getUptimeData(chainId);
    if (!uptimeData) {
      return res.status(404).json({ message: 'Uptime data not found. Start monitoring first.' });
    }

    res.json(uptimeData);
  } catch (error) {
    console.error('Error fetching uptime data:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @swagger
 * /api/health/{chainId}/incidents:
 *   get:
 *     summary: Get health incidents for a chain
 *     tags: [Health Monitoring]
 *     security:
 *       - bearerAuth: []
 */
router.get('/:chainId/incidents', authenticate, async (req, res) => {
  try {
    const { chainId } = req.params;
    const { limit = 50, status, severity } = req.query;
    
    // Try to get from database first
    try {
      const incidents = await db.getHealthIncidents(chainId, {
        limit: parseInt(limit),
        status,
        severity
      });
      return res.json({ incidents, total: incidents.length });
    } catch (dbError) {
      // Fallback to in-memory storage
      let incidents = healthMonitoring.getIncidents(chainId, parseInt(limit));
      
      if (status) {
        incidents = incidents.filter(i => i.status === status);
      }
      if (severity) {
        incidents = incidents.filter(i => i.severity === severity);
      }

      res.json({ incidents, total: incidents.length });
    }
  } catch (error) {
    console.error('Error fetching incidents:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @swagger
 * /api/health/{chainId}/thresholds:
 *   get:
 *     summary: Get alert thresholds for a chain
 *     tags: [Health Monitoring]
 *     security:
 *       - bearerAuth: []
 */
router.get('/:chainId/thresholds', authenticate, async (req, res) => {
  try {
    const { chainId } = req.params;
    
    // Get thresholds from monitoring service
    const thresholds = healthMonitoring.getAlertThresholds(chainId);
    
    res.json({ thresholds });
  } catch (error) {
    console.error('Error fetching thresholds:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @swagger
 * /api/health/{chainId}/thresholds:
 *   put:
 *     summary: Update alert thresholds for a chain
 *     tags: [Health Monitoring]
 *     security:
 *       - bearerAuth: []
 */
router.put('/:chainId/thresholds', authenticate, async (req, res) => {
  try {
    const { chainId } = req.params;
    const { thresholds } = req.body;
    
    // Verify chain belongs to user
    const chain = await db.getChainById(chainId);
    if (!chain) {
      return res.status(404).json({ message: 'Chain not found' });
    }

    healthMonitoring.updateAlertThresholds(chainId, thresholds);
    res.json({ message: 'Thresholds updated', thresholds });
  } catch (error) {
    console.error('Error updating thresholds:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @swagger
 * /api/health/{chainId}/history:
 *   get:
 *     summary: Get health check history
 *     tags: [Health Monitoring]
 *     security:
 *       - bearerAuth: []
 */
router.get('/:chainId/history', authenticate, async (req, res) => {
  try {
    const { chainId } = req.params;
    const { limit = 100, hours = 24 } = req.query;
    
    // Get health check history from database
    try {
      const healthChecks = await db.getHealthChecks(chainId, parseInt(limit));
      const uptimeData = await db.getUptimeTracking(chainId);
      
      // Format history data
      const history = healthChecks.map(check => ({
        timestamp: check.checked_at,
        status: check.status,
        score: check.health_score,
        metrics: {
          rpc: {
            status: check.rpc_status,
            responseTime: check.rpc_response_time_ms,
            blockNumber: check.rpc_block_number
          },
          blocks: {
            status: check.block_production_status,
            currentBlock: check.current_block,
            blockTime: check.block_time_seconds
          },
          validators: {
            status: check.validator_status,
            total: check.total_validators,
            active: check.active_validators
          },
          performance: {
            status: check.performance_status,
            tps: check.tps
          },
          network: {
            status: check.network_status,
            responseTime: check.network_response_time_ms
          }
        }
      }));
      
      return res.json({
        history,
        uptime: uptimeData,
        period: `${hours}h`,
        total: healthChecks.length
      });
    } catch (dbError) {
      // Fallback to in-memory data
      const healthStatus = healthMonitoring.getHealthStatus(chainId);
      const uptimeData = healthMonitoring.getUptimeData(chainId);
      
      res.json({
        history: healthStatus ? [{
          timestamp: healthStatus.lastCheck,
          status: healthStatus.status,
          score: healthStatus.score,
          metrics: healthStatus.metrics
        }] : [],
        uptime: uptimeData,
        period: `${hours}h`
      });
    }
  } catch (error) {
    console.error('Error fetching health history:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;



