const winston = require('winston');
const db = require('./database');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/upgrade-rollback.log' })
  ]
});

/**
 * Perform rollback for a chain upgrade: revert chain version to from_version and mark upgrade as rolled_back.
 * @param {string} upgradeId - Upgrade record ID
 * @param {string} chainId - Chain ID (must match upgrade.chain_id)
 * @returns {Promise<{ success: boolean, upgrade?: object, chain?: object, error?: string }>}
 */
async function performRollback(upgradeId, chainId) {
  try {
    const upgrade = await db.getChainUpgradeById(upgradeId);
    if (!upgrade) {
      return { success: false, error: 'Upgrade not found' };
    }
    if (upgrade.chain_id !== chainId) {
      return { success: false, error: 'Upgrade does not belong to this chain' };
    }
    if (upgrade.status === 'rolled_back') {
      return { success: false, error: 'Upgrade already rolled back' };
    }
    if (upgrade.rollback_available === false) {
      return { success: false, error: 'Rollback not available for this upgrade' };
    }

    const chain = await db.getChainById(chainId);
    if (!chain) {
      return { success: false, error: 'Chain not found' };
    }

    const rolledBackAt = new Date().toISOString();

    await db.updateChainUpgrade(upgradeId, {
      status: 'rolled_back',
      rolled_back_at: rolledBackAt
    });

    const currentConfig = chain.config && typeof chain.config === 'object' ? chain.config : {};
    await db.updateChain(chainId, {
      status: 'active',
      config: { ...currentConfig, version: upgrade.from_version },
      updated_at: rolledBackAt
    });

    await db.createChainEvent({
      chain_id: chainId,
      event_type: 'upgrade_rolled_back',
      description: `Upgrade rolled back to version ${upgrade.from_version}`,
      data: { upgrade_id: upgradeId, from_version: upgrade.from_version, to_version: upgrade.to_version },
      triggered_by: 'system'
    });

    logger.info(`Rollback completed for upgrade ${upgradeId} on chain ${chainId} -> version ${upgrade.from_version}`);

    const updatedUpgrade = await db.getChainUpgradeById(upgradeId);
    const updatedChain = await db.getChainById(chainId);
    return { success: true, upgrade: updatedUpgrade, chain: updatedChain };
  } catch (error) {
    logger.error(`Rollback failed for upgrade ${upgradeId}:`, error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  performRollback
};
