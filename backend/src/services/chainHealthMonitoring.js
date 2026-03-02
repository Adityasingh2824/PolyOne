const winston = require('winston');
const db = require('./database');
const { ethers } = require('ethers');
const axios = require('axios');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/health-monitoring.log' })
  ]
});

class ChainHealthMonitoringService {
  constructor() {
    this.healthChecks = new Map(); // chainId -> health check interval
    this.healthStatus = new Map(); // chainId -> current health status
    this.uptimeTracking = new Map(); // chainId -> uptime data
    this.incidents = new Map(); // chainId -> array of incidents
    this.alertRules = new Map(); // chainId -> alert rules
    this.recoveryActions = new Map(); // chainId -> recovery actions
    
    // Default health check interval (5 minutes)
    this.defaultCheckInterval = 5 * 60 * 1000;
    
    // Default alert thresholds
    this.defaultThresholds = {
      tps: { min: 100, max: 10000 },
      blockTime: { max: 5 }, // seconds
      uptime: { min: 99 }, // percentage
      validators: { min: 1 },
      responseTime: { max: 2000 }, // milliseconds
      errorRate: { max: 1 } // percentage
    };
  }

  /**
   * Start monitoring a chain
   */
  async startMonitoring(chainId, config = {}) {
    if (this.healthChecks.has(chainId)) {
      logger.warn(`Health monitoring already running for chain ${chainId}`);
      return;
    }

    logger.info(`Starting health monitoring for chain ${chainId}`);
    
    const checkInterval = config.interval || this.defaultCheckInterval;
    const thresholds = { ...this.defaultThresholds, ...config.thresholds };
    
    // Store configuration
    this.alertRules.set(chainId, thresholds);
    
    // Initialize health status
    this.healthStatus.set(chainId, {
      status: 'unknown',
      lastCheck: null,
      consecutiveFailures: 0,
      uptime: 100,
      metrics: {}
    });
    
    // Initialize uptime tracking
    this.uptimeTracking.set(chainId, {
      startTime: new Date(),
      totalUptime: 0,
      totalDowntime: 0,
      lastStatus: 'unknown',
      statusChanges: []
    });
    
    // Perform initial health check
    await this.performHealthCheck(chainId);
    
    // Schedule periodic health checks
    const intervalId = setInterval(async () => {
      await this.performHealthCheck(chainId);
    }, checkInterval);
    
    this.healthChecks.set(chainId, intervalId);
    
    logger.info(`Health monitoring started for chain ${chainId} (interval: ${checkInterval}ms)`);
  }

  /**
   * Stop monitoring a chain
   */
  stopMonitoring(chainId) {
    const intervalId = this.healthChecks.get(chainId);
    if (intervalId) {
      clearInterval(intervalId);
      this.healthChecks.delete(chainId);
      logger.info(`Stopped health monitoring for chain ${chainId}`);
    }
  }

  /**
   * Perform a health check on a chain
   */
  async performHealthCheck(chainId) {
    try {
      logger.debug(`Performing health check for chain ${chainId}`);
      
      const chain = await db.getChainById(chainId);
      if (!chain) {
        logger.warn(`Chain ${chainId} not found for health check`);
        return;
      }

      // Check if chain is active
      if (chain.status !== 'active' && chain.status !== 'deploying') {
        logger.debug(`Chain ${chainId} is not active (status: ${chain.status}), skipping health check`);
        return;
      }

      const healthData = {
        timestamp: new Date().toISOString(),
        chainId,
        checks: {}
      };

      // 1. RPC Endpoint Check
      const rpcCheck = await this.checkRpcEndpoint(chain);
      healthData.checks.rpc = rpcCheck;

      // 2. Block Production Check
      const blockCheck = await this.checkBlockProduction(chain);
      healthData.checks.blocks = blockCheck;

      // 3. Validator Status Check
      const validatorCheck = await this.checkValidators(chainId);
      healthData.checks.validators = validatorCheck;

      // 4. Performance Metrics Check
      const performanceCheck = await this.checkPerformanceMetrics(chain);
      healthData.checks.performance = performanceCheck;

      // 5. Network Connectivity Check
      const networkCheck = await this.checkNetworkConnectivity(chain);
      healthData.checks.network = networkCheck;

      // Determine overall health status
      const overallStatus = this.determineHealthStatus(healthData.checks);
      healthData.status = overallStatus.status;
      healthData.score = overallStatus.score;
      healthData.issues = overallStatus.issues;

      // Update health status
      const currentStatus = this.healthStatus.get(chainId) || {};
      const wasHealthy = currentStatus.status === 'healthy';
      const isHealthy = overallStatus.status === 'healthy';

      this.healthStatus.set(chainId, {
        ...currentStatus,
        status: overallStatus.status,
        lastCheck: new Date().toISOString(),
        consecutiveFailures: isHealthy ? 0 : (currentStatus.consecutiveFailures || 0) + 1,
        metrics: healthData.checks,
        score: overallStatus.score,
        issues: overallStatus.issues || []
      });

      // Save health check to database
      try {
        await db.createHealthCheck(chainId, {
          status: overallStatus.status,
          score: overallStatus.score,
          checks: healthData.checks,
          issues: overallStatus.issues,
          severity: overallStatus.severity
        });
      } catch (dbError) {
        logger.warn('Failed to save health check to database:', dbError.message);
      }

      // Update uptime tracking
      this.updateUptimeTracking(chainId, isHealthy);
      
      // Save uptime tracking to database
      try {
        const uptimeData = this.uptimeTracking.get(chainId);
        if (uptimeData) {
          await db.updateUptimeTracking(chainId, uptimeData);
        }
      } catch (dbError) {
        logger.warn('Failed to save uptime tracking to database:', dbError.message);
      }

      // Check for alerts
      await this.checkAlerts(chainId, healthData);

      // Auto-recovery if needed
      if (!isHealthy && (currentStatus.consecutiveFailures || 0) >= 2) {
        await this.attemptAutoRecovery(chainId, healthData);
        // Auto-rollback for failed upgrades: if health remains unhealthy, check for recent completed upgrade with auto_rollback_on_failure
        await this.tryAutoRollbackForFailedUpgrade(chainId);
      }

      // Log incident if status changed
      if (wasHealthy !== isHealthy) {
        await this.logIncident(chainId, {
          type: isHealthy ? 'resolved' : 'detected',
          severity: overallStatus.severity || 'warning',
          title: isHealthy ? 'Chain Health Restored' : 'Chain Health Degraded',
          description: isHealthy 
            ? 'Chain health has been restored to normal levels' 
            : `Chain health degraded: ${overallStatus.issues.join(', ')}`,
          healthData
        });
      }

      logger.info(`Health check completed for chain ${chainId}: ${overallStatus.status} (score: ${overallStatus.score})`);
      
      // Save health check to database
      try {
        await db.createHealthCheck(chainId, healthData);
      } catch (dbError) {
        logger.warn('Failed to save health check to database:', dbError.message);
      }
      
      // Update uptime tracking in database
      if (uptimeData) {
        try {
          await db.updateUptimeTracking(chainId, uptimeData);
        } catch (dbError) {
          logger.warn('Failed to update uptime tracking in database:', dbError.message);
        }
      }
      
      return healthData;
    } catch (error) {
      logger.error(`Error performing health check for chain ${chainId}:`, error);
      
      // Update status to indicate check failure
      const currentStatus = this.healthStatus.get(chainId) || {};
      this.healthStatus.set(chainId, {
        ...currentStatus,
        status: 'error',
        lastCheck: new Date().toISOString(),
        consecutiveFailures: (currentStatus.consecutiveFailures || 0) + 1,
        error: error.message
      });
      
      throw error;
    }
  }

  /**
   * Check RPC endpoint availability
   */
  async checkRpcEndpoint(chain) {
    const startTime = Date.now();
    try {
      if (!chain.rpc_url) {
        return { status: 'error', message: 'RPC URL not configured', responseTime: null };
      }

      // Try to call a simple RPC method
      const provider = new ethers.JsonRpcProvider(chain.rpc_url);
      const blockNumber = await provider.getBlockNumber();
      const responseTime = Date.now() - startTime;

      return {
        status: 'healthy',
        blockNumber,
        responseTime,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      return {
        status: 'unhealthy',
        error: error.message,
        responseTime,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Check block production
   */
  async checkBlockProduction(chain) {
    try {
      if (!chain.rpc_url) {
        return { status: 'error', message: 'RPC URL not configured' };
      }

      const provider = new ethers.JsonRpcProvider(chain.rpc_url);
      const currentBlock = await provider.getBlockNumber();
      const currentBlockData = await provider.getBlock(currentBlock);
      const previousBlockData = await provider.getBlock(currentBlock - 1);

      if (!currentBlockData || !previousBlockData) {
        return { status: 'unhealthy', message: 'Could not fetch block data' };
      }

      const blockTime = currentBlockData.timestamp - previousBlockData.timestamp;
      const expectedBlockTime = (chain.block_time || 2) * 1000; // Convert to milliseconds
      const blockTimeVariance = Math.abs(blockTime - expectedBlockTime);

      return {
        status: blockTimeVariance < expectedBlockTime * 0.5 ? 'healthy' : 'warning',
        currentBlock,
        blockTime: blockTime / 1000, // Convert to seconds
        expectedBlockTime: expectedBlockTime / 1000,
        variance: blockTimeVariance / 1000,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Check validator status
   */
  async checkValidators(chainId) {
    try {
      const validators = await db.getChainValidators(chainId);
      const activeValidators = validators.filter(v => v.status === 'active');
      const totalValidators = validators.length;

      const thresholds = this.alertRules.get(chainId) || this.defaultThresholds;
      const minValidators = thresholds.validators?.min || 1;

      return {
        status: activeValidators.length >= minValidators ? 'healthy' : 'warning',
        total: totalValidators,
        active: activeValidators.length,
        inactive: totalValidators - activeValidators.length,
        minRequired: minValidators,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Check performance metrics
   */
  async checkPerformanceMetrics(chain) {
    try {
      if (!chain.rpc_url) {
        return { status: 'error', message: 'RPC URL not configured' };
      }

      const provider = new ethers.JsonRpcProvider(chain.rpc_url);
      
      // Get recent blocks to calculate TPS
      const currentBlock = await provider.getBlockNumber();
      const blocksToCheck = Math.min(10, currentBlock);
      let totalTransactions = 0;
      let totalTime = 0;

      for (let i = 0; i < blocksToCheck; i++) {
        try {
          const block = await provider.getBlock(currentBlock - i, true);
          if (block && block.transactions) {
            totalTransactions += block.transactions.length;
            if (i > 0) {
              const prevBlock = await provider.getBlock(currentBlock - i + 1);
              if (prevBlock) {
                totalTime += block.timestamp - prevBlock.timestamp;
              }
            }
          }
        } catch (err) {
          // Skip blocks that can't be fetched
        }
      }

      const avgBlockTime = totalTime / (blocksToCheck - 1);
      const tps = avgBlockTime > 0 ? totalTransactions / (avgBlockTime * blocksToCheck) : 0;

      const thresholds = this.alertRules.get(chain.id) || this.defaultThresholds;
      const minTps = thresholds.tps?.min || 100;
      const maxBlockTime = thresholds.blockTime?.max || 5;

      return {
        status: tps >= minTps && avgBlockTime <= maxBlockTime * 1000 ? 'healthy' : 'warning',
        tps: tps.toFixed(2),
        avgBlockTime: (avgBlockTime / 1000).toFixed(2),
        totalTransactions,
        blocksChecked: blocksToCheck,
        thresholds: { minTps, maxBlockTime },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Check network connectivity
   */
  async checkNetworkConnectivity(chain) {
    try {
      if (!chain.rpc_url) {
        return { status: 'error', message: 'RPC URL not configured' };
      }

      const startTime = Date.now();
      const provider = new ethers.JsonRpcProvider(chain.rpc_url);
      
      // Try multiple operations
      await Promise.all([
        provider.getBlockNumber(),
        provider.getNetwork()
      ]);
      
      const responseTime = Date.now() - startTime;
      const thresholds = this.alertRules.get(chain.id) || this.defaultThresholds;
      const maxResponseTime = thresholds.responseTime?.max || 2000;

      return {
        status: responseTime <= maxResponseTime ? 'healthy' : 'warning',
        responseTime,
        maxResponseTime,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Determine overall health status from individual checks
   */
  determineHealthStatus(checks) {
    const issues = [];
    let score = 100;
    let severity = 'info';

    // RPC check
    if (checks.rpc?.status === 'unhealthy') {
      issues.push('RPC endpoint unavailable');
      score -= 30;
      severity = 'critical';
    } else if (checks.rpc?.status === 'error') {
      issues.push('RPC endpoint error');
      score -= 20;
      severity = 'error';
    } else if (checks.rpc?.responseTime > 2000) {
      issues.push('RPC response time high');
      score -= 10;
      severity = severity === 'info' ? 'warning' : severity;
    }

    // Block production check
    if (checks.blocks?.status === 'unhealthy') {
      issues.push('Block production stopped');
      score -= 25;
      severity = 'critical';
    } else if (checks.blocks?.status === 'warning') {
      issues.push('Block time variance high');
      score -= 10;
      severity = severity === 'info' ? 'warning' : severity;
    }

    // Validator check
    if (checks.validators?.status === 'warning') {
      issues.push(`Low validator count (${checks.validators.active}/${checks.validators.minRequired})`);
      score -= 15;
      severity = severity === 'info' ? 'warning' : severity;
    } else if (checks.validators?.status === 'error') {
      issues.push('Validator check failed');
      score -= 10;
      severity = severity === 'info' ? 'error' : severity;
    }

    // Performance check
    if (checks.performance?.status === 'warning') {
      issues.push('Performance below threshold');
      score -= 10;
      severity = severity === 'info' ? 'warning' : severity;
    } else if (checks.performance?.status === 'error') {
      issues.push('Performance check failed');
      score -= 5;
    }

    // Network check
    if (checks.network?.status === 'unhealthy') {
      issues.push('Network connectivity issues');
      score -= 20;
      severity = severity === 'info' ? 'error' : severity;
    } else if (checks.network?.status === 'warning') {
      issues.push('Network response time high');
      score -= 5;
      severity = severity === 'info' ? 'warning' : severity;
    }

    const status = score >= 90 ? 'healthy' : score >= 70 ? 'warning' : score >= 50 ? 'degraded' : 'unhealthy';

    return { status, score, issues, severity };
  }

  /**
   * Update uptime tracking
   */
  updateUptimeTracking(chainId, isHealthy) {
    const tracking = this.uptimeTracking.get(chainId);
    if (!tracking) return;

    const now = new Date();
    const lastStatus = tracking.lastStatus;
    const lastChangeTime = tracking.statusChanges.length > 0 
      ? new Date(tracking.statusChanges[tracking.statusChanges.length - 1].timestamp)
      : tracking.startTime;

    const timeSinceLastChange = (now - lastChangeTime) / 1000; // seconds

    if (lastStatus !== (isHealthy ? 'healthy' : 'unhealthy')) {
      // Status changed
      if (lastStatus === 'healthy') {
        tracking.totalUptime += timeSinceLastChange;
      } else if (lastStatus === 'unhealthy') {
        tracking.totalDowntime += timeSinceLastChange;
      }

      tracking.statusChanges.push({
        timestamp: now.toISOString(),
        from: lastStatus,
        to: isHealthy ? 'healthy' : 'unhealthy'
      });
    } else {
      // Status unchanged, update totals
      if (isHealthy) {
        tracking.totalUptime += timeSinceLastChange;
      } else {
        tracking.totalDowntime += timeSinceLastChange;
      }
    }

    tracking.lastStatus = isHealthy ? 'healthy' : 'unhealthy';
    tracking.lastUpdate = now.toISOString();

    // Calculate uptime percentage
    const totalTime = tracking.totalUptime + tracking.totalDowntime;
    tracking.uptimePercentage = totalTime > 0 
      ? (tracking.totalUptime / totalTime) * 100 
      : 100;

    this.uptimeTracking.set(chainId, tracking);
  }

  /**
   * Check for alerts based on thresholds
   */
  async checkAlerts(chainId, healthData) {
    const thresholds = this.alertRules.get(chainId) || this.defaultThresholds;
    const alerts = [];

    // Check TPS
    if (healthData.checks.performance?.tps) {
      const tps = parseFloat(healthData.checks.performance.tps);
      if (tps < thresholds.tps.min) {
        alerts.push({
          type: 'performance',
          severity: 'warning',
          message: `TPS below threshold: ${tps.toFixed(2)} < ${thresholds.tps.min}`,
          metric: 'tps',
          value: tps,
          threshold: thresholds.tps.min
        });
      }
    }

    // Check block time
    if (healthData.checks.blocks?.blockTime) {
      const blockTime = parseFloat(healthData.checks.blocks.blockTime);
      if (blockTime > thresholds.blockTime.max) {
        alerts.push({
          type: 'performance',
          severity: 'warning',
          message: `Block time above threshold: ${blockTime.toFixed(2)}s > ${thresholds.blockTime.max}s`,
          metric: 'blockTime',
          value: blockTime,
          threshold: thresholds.blockTime.max
        });
      }
    }

    // Check validators
    if (healthData.checks.validators?.active !== undefined) {
      if (healthData.checks.validators.active < thresholds.validators.min) {
        alerts.push({
          type: 'validators',
          severity: 'error',
          message: `Active validators below minimum: ${healthData.checks.validators.active} < ${thresholds.validators.min}`,
          metric: 'validators',
          value: healthData.checks.validators.active,
          threshold: thresholds.validators.min
        });
      }
    }

    // Check response time
    if (healthData.checks.rpc?.responseTime) {
      if (healthData.checks.rpc.responseTime > thresholds.responseTime.max) {
        alerts.push({
          type: 'network',
          severity: 'warning',
          message: `RPC response time high: ${healthData.checks.rpc.responseTime}ms > ${thresholds.responseTime.max}ms`,
          metric: 'responseTime',
          value: healthData.checks.rpc.responseTime,
          threshold: thresholds.responseTime.max
        });
      }
    }

    // Send alerts if any
    if (alerts.length > 0) {
      await this.sendAlerts(chainId, alerts);
    }

    return alerts;
  }

  /**
   * Send alerts (notifications, webhooks, etc.)
   */
  async sendAlerts(chainId, alerts) {
    try {
      const chain = await db.getChainById(chainId);
      if (!chain) return;

      // Create notifications for each alert
      for (const alert of alerts) {
        await db.createNotification({
          user_id: chain.user_id,
          type: 'alert',
          title: `Chain Health Alert: ${chain.name}`,
          message: alert.message,
          severity: alert.severity,
          data: {
            chainId,
            alertType: alert.type,
            metric: alert.metric,
            value: alert.value,
            threshold: alert.threshold
          }
        });
      }

      // TODO: Send webhooks, emails, etc.
      logger.info(`Sent ${alerts.length} alerts for chain ${chainId}`);
    } catch (error) {
      logger.error(`Error sending alerts for chain ${chainId}:`, error);
    }
  }

  /**
   * Try to auto-rollback a recently completed upgrade if health is degraded and upgrade has auto_rollback_on_failure.
   * Called when consecutive health failures >= 2.
   */
  async tryAutoRollbackForFailedUpgrade(chainId) {
    try {
      const upgrade = await db.getLatestCompletedUpgradeForAutoRollback(chainId, 24 * 60); // 24 hours
      if (!upgrade) return;

      const upgradeRollback = require('./upgradeRollback');
      const result = await upgradeRollback.performRollback(upgrade.id, chainId);
      if (result.success) {
        logger.info(`Auto-rollback executed for chain ${chainId}, upgrade ${upgrade.id} (health degraded after upgrade)`);
        await this.logIncident(chainId, {
          type: 'rollback_executed',
          severity: 'warning',
          title: 'Upgrade auto-rolled back',
          description: `Health degraded after upgrade to ${upgrade.to_version}. Rolled back to ${upgrade.from_version}.`,
          healthData: { upgradeId: upgrade.id }
        });
      }
    } catch (error) {
      logger.error(`Error attempting auto-rollback for chain ${chainId}:`, error);
    }
  }

  /**
   * Attempt auto-recovery
   */
  async attemptAutoRecovery(chainId, healthData) {
    logger.info(`Attempting auto-recovery for chain ${chainId}`);
    
    try {
      const chain = await db.getChainById(chainId);
      if (!chain) return;

      const recoveryActions = [];

      // 1. If RPC is down, try to restart
      if (healthData.checks.rpc?.status === 'unhealthy') {
        recoveryActions.push({
          action: 'restart_rpc',
          description: 'RPC endpoint unavailable, attempting restart'
        });
        // TODO: Implement actual restart logic
      }

      // 2. If validators are low, try to add more
      if (healthData.checks.validators?.active < healthData.checks.validators?.minRequired) {
        recoveryActions.push({
          action: 'scale_validators',
          description: `Low validator count, attempting to scale up`
        });
        // TODO: Implement validator scaling
      }

      // 3. If performance is degraded, try to optimize
      if (healthData.checks.performance?.status === 'warning') {
        recoveryActions.push({
          action: 'optimize_performance',
          description: 'Performance degraded, attempting optimization'
        });
        // TODO: Implement performance optimization
      }

      if (recoveryActions.length > 0) {
        await this.logIncident(chainId, {
          type: 'recovery_attempted',
          severity: 'info',
          description: 'Auto-recovery actions initiated',
          recoveryActions,
          healthData
        });

        // Store recovery actions
        this.recoveryActions.set(chainId, {
          timestamp: new Date().toISOString(),
          actions: recoveryActions,
          status: 'pending'
        });
      }

      logger.info(`Auto-recovery attempted for chain ${chainId}: ${recoveryActions.length} actions`);
    } catch (error) {
      logger.error(`Error attempting auto-recovery for chain ${chainId}:`, error);
    }
  }

  /**
   * Log an incident
   */
  async logIncident(chainId, incidentData) {
    try {
      const chain = await db.getChainById(chainId);
      if (!chain) return;

      const incident = {
        id: require('uuid').v4(),
        chain_id: chainId,
        type: incidentData.type,
        severity: incidentData.severity || 'info',
        description: incidentData.description,
        status: 'open',
        detected_at: new Date().toISOString(),
        resolved_at: incidentData.type === 'resolved' ? new Date().toISOString() : null,
        data: incidentData.healthData || incidentData.recoveryActions || {},
        created_at: new Date().toISOString()
      };

      // Store in memory
      if (!this.incidents.has(chainId)) {
        this.incidents.set(chainId, []);
      }
      this.incidents.get(chainId).push(incident);

      // Save incident to database
      try {
        await db.createHealthIncident(chainId, incident);
      } catch (dbError) {
        logger.warn('Failed to save incident to database:', dbError.message);
      }
      
      // Create chain event
      try {
        await db.createChainEvent({
          chain_id: chainId,
          event_type: 'health_incident',
          description: incidentData.description,
          data: incident,
          triggered_by: 'system'
        });
      } catch (eventError) {
        logger.warn('Failed to create chain event:', eventError.message);
      }

      // Create notification
      await db.createNotification({
        user_id: chain.user_id,
        type: 'incident',
        title: `Chain Incident: ${chain.name}`,
        message: incidentData.description,
        severity: incidentData.severity,
        data: { incidentId: incident.id, chainId }
      });

      logger.info(`Incident logged for chain ${chainId}: ${incident.type} - ${incidentData.severity}`);
      
      return incident;
    } catch (error) {
      logger.error(`Error logging incident for chain ${chainId}:`, error);
      throw error;
    }
  }

  /**
   * Get health status for a chain
   */
  getHealthStatus(chainId) {
    return this.healthStatus.get(chainId) || null;
  }

  /**
   * Get uptime data for a chain
   */
  getUptimeData(chainId) {
    return this.uptimeTracking.get(chainId) || null;
  }

  /**
   * Get incidents for a chain
   */
  getIncidents(chainId, limit = 50) {
    const incidents = this.incidents.get(chainId) || [];
    return incidents.slice(0, limit);
  }

  /**
   * Get all monitored chains
   */
  getMonitoredChains() {
    return Array.from(this.healthChecks.keys());
  }

  /**
   * Update alert thresholds for a chain
   */
  updateAlertThresholds(chainId, thresholds) {
    const current = this.alertRules.get(chainId) || this.defaultThresholds;
    this.alertRules.set(chainId, { ...current, ...thresholds });
    logger.info(`Updated alert thresholds for chain ${chainId}`);
  }

  /**
   * Get alert thresholds for a chain
   */
  getAlertThresholds(chainId) {
    return this.alertRules.get(chainId) || this.defaultThresholds;
  }
}

// Create singleton instance
const healthMonitoringService = new ChainHealthMonitoringService();

// Auto-start monitoring for active chains on service initialization
async function initializeMonitoring() {
  try {
    const db = require('./database');
    // This would be called on server startup
    // For now, chains will be monitored when they're created or when explicitly started
    logger.info('Chain health monitoring service initialized');
  } catch (error) {
    logger.error('Error initializing health monitoring:', error);
  }
}

// Export singleton instance (already created above at line 843)
module.exports = healthMonitoringService;
module.exports.ChainHealthMonitoringService = ChainHealthMonitoringService; // For testing



