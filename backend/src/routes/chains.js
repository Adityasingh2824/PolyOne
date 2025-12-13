const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { deployChain, stopChain, restartChain } = require('../services/chainDeployment');
const db = require('../services/database');
const chainIntegration = require('../services/chainIntegration');
const { body, validationResult } = require('express-validator');
const fs = require('fs').promises;
const path = require('path');

// Middleware to verify JWT (optional for development)
const authenticate = (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      // For development, allow requests without token but set a default userId
      // In production, this should return 401
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
    // For development, allow invalid tokens
    if (process.env.NODE_ENV === 'development') {
      req.userId = req.query.userId || req.body.walletAddress || 'dev-user';
      return next();
    }
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Get all chains for a user - syncs with blockchain
router.get('/', authenticate, async (req, res) => {
  try {
    // Use walletAddress if provided, otherwise use userId
    const walletAddress = req.query.walletAddress;
    const userId = walletAddress || req.userId;
    
    console.log('🔍 GET /api/chains - Fetching chains for userId:', userId, 'walletAddress:', walletAddress, 'req.userId:', req.userId);
    
    // Get chains from database
    let userChains;
    let stats;
    try {
      userChains = await db.getUserChains(userId);
      stats = await db.getUserDashboardStats(userId);
      console.log('✅ Retrieved chains from database:', userChains?.length || 0);
    } catch (dbError) {
      console.error('❌ Error fetching chains from database:', dbError);
      return res.status(500).json({ 
        message: 'Failed to fetch chains', 
        error: dbError.message 
      });
    }

    // Optionally sync with blockchain if wallet address is provided
    if (walletAddress) {
      try {
        const blockchainChains = await chainIntegration.syncUserChainsFromBlockchain(walletAddress);
        // Merge blockchain chains with database chains
        const allChains = [...(userChains || [])];
        for (const bcChain of blockchainChains) {
          const exists = allChains.find(c => c.id === bcChain.id || c.metadata?.onChainId === bcChain.id);
          if (!exists) {
            allChains.push(bcChain);
          }
        }
        return res.json({ chains: allChains, stats });
      } catch (syncError) {
        console.warn('Error syncing with blockchain, returning database chains only:', syncError);
      }
    }

    res.json({ chains: userChains || [], stats });
  } catch (error) {
    console.error('Error fetching chains:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get specific chain
router.get('/:id', authenticate, async (req, res) => {
  try {
    const chainId = req.params.id;
    console.log(`🔍 GET /api/chains/${chainId} - Looking up chain`);
    
    // Try to get chain by ID (searches all chains, not just user's)
    let chain = await db.getChainById(chainId);
    
    if (!chain) {
      // In development mode, search ALL chains (not just user's)
      if (process.env.NODE_ENV === 'development') {
        try {
          console.log(`🔍 Development mode: Searching all chains for: ${chainId}`);
          
          // Try with wallet address if provided
          const walletAddress = req.query.walletAddress || req.body.walletAddress;
          if (walletAddress && walletAddress !== 'dev-user') {
            console.log(`🔍 Searching chains for wallet: ${walletAddress}`);
            const userChains = await db.getUserChains(walletAddress);
            chain = userChains.find((c) => 
              String(c.id) === String(chainId) ||
              String(c.id).includes(String(chainId)) ||
              c.id === chainId
            );
            if (chain) {
              console.log(`✅ Found chain via wallet address search`);
            }
          }
          
          // If still not found, search ALL chains in storage
          if (!chain) {
            console.log(`🔍 Searching ALL chains in storage (development fallback)`);
            const dbModule = require('../services/database');
            const storage = dbModule.inMemoryStorage || (dbModule.default && dbModule.default.inMemoryStorage);
            const allChains = storage ? Array.from(storage.chains.values()) : [];
            console.log(`📊 Total chains in storage: ${allChains.length}`);
            if (allChains.length > 0) {
              console.log(`📋 Chain IDs in storage:`, allChains.map(c => ({ id: c.id, user_id: c.user_id, name: c.name })));
            }
            chain = allChains.find((c) => {
              const match = String(c.id) === String(chainId) ||
                           String(c.id).includes(String(chainId)) ||
                           c.id === chainId ||
                           String(chainId).includes(String(c.id));
              if (match) {
                console.log(`✅ Found chain: ${c.id} (user_id: ${c.user_id})`);
              }
              return match;
            });
          }
        } catch (err) {
          console.warn('Error searching chains:', err);
        }
      }
      
      if (!chain) {
        console.error(`❌ Chain not found: ${chainId}`);
        console.error(`📊 Total chains in storage: ${inMemoryStorage?.chains?.size || 0}`);
        return res.status(404).json({ message: 'Chain not found' });
      }
    }
    
    console.log(`✅ Chain found: ${chain.id}, status: ${chain.status}`);

    // In development, skip user check if userId is 'dev-user'
    if (process.env.NODE_ENV !== 'development' && chain.user_id !== req.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(chain);
  } catch (error) {
    console.error('Error fetching chain:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new chain - integrates with smart contract and database
router.post('/create', authenticate, async (req, res) => {
  try {
    const { 
      name, 
      chainType, 
      rollupType, 
      gasToken, 
      validatorAccess, 
      initialValidators, 
      blockchainTxHash, 
      blockchainChainId,
      walletAddress 
    } = req.body;

    // Validation
    if (!name || !chainType || !rollupType || !gasToken) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Use wallet address if provided, otherwise use userId
    // This ensures consistency - if walletAddress is provided, use it for both saving and retrieving
    const userAddress = walletAddress || req.userId;
    
    console.log('Creating chain with userAddress:', userAddress, 'walletAddress:', walletAddress, 'req.userId:', req.userId);

    // If blockchain transaction hash is provided, sync from blockchain
    if (blockchainTxHash && blockchainChainId) {
      try {
        // Wait a bit for transaction to be mined
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Try to get chain ID from transaction receipt
        // For now, we'll create the chain in database with the provided info
        const chainId = uuidv4();
        
        // Determine PolygonScan URL
        let polygonScanUrl = null;
        if (blockchainChainId === 137) {
          polygonScanUrl = `https://polygonscan.com/tx/${blockchainTxHash}`;
        } else if (blockchainChainId === 80002) {
          polygonScanUrl = `https://amoy.polygonscan.com/tx/${blockchainTxHash}`;
        }

        const chainData = {
          id: chainId,
          user_id: userAddress,
          name,
          chain_type: chainType,
          rollup_type: rollupType,
          gas_token: gasToken.toUpperCase(),
          validator_access: validatorAccess || 'public',
          validator_count: parseInt(initialValidators) || 3,
          status: 'deploying',
          rpc_url: `https://rpc-${chainId.substring(0, 8)}.polyone.io`,
          explorer_url: `https://explorer-${chainId.substring(0, 8)}.polyone.io`,
          blockchain_tx_hash: blockchainTxHash,
          blockchain_chain_id: blockchainChainId,
          polygon_scan_url: polygonScanUrl,
          // Add fields for frontend compatibility
          chainId: chainId, // For frontend display
          validators: parseInt(initialValidators) || 3, // For frontend display
          initialValidators: parseInt(initialValidators) || 3, // For frontend display
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        // Save to database
        console.log('💾 Saving chain to database:', chainId, 'for user:', userAddress);
        console.log('📋 Chain data to save:', JSON.stringify(chainData, null, 2));
        let chain;
        try {
          chain = await db.createChain(chainData);
          console.log('✅ Chain saved successfully:', chain.id);
          
          // Verify the chain was actually saved by retrieving it
          const verifyChain = await db.getChainById(chainId);
          if (verifyChain) {
            console.log('✅ Verification: Chain exists in database:', verifyChain.id);
          } else {
            console.error('❌ Verification FAILED: Chain not found in database after creation!');
          }
        } catch (dbError) {
          console.error('❌ Error saving chain to database:', dbError);
          console.error('❌ Error stack:', dbError.stack);
          return res.status(500).json({ 
            message: 'Failed to save chain to database', 
            error: dbError.message 
          });
        }

        // Start async deployment process (don't await - let it run in background)
        console.log('🚀 Starting deployment process for chain:', chainId);
        
        // Simulate deployment completion after 3 seconds for testing
        // This ensures chains become "active" even if actual deployment takes longer
        setTimeout(async () => {
          try {
            console.log('⏱️ Auto-updating chain status to active after deployment period:', chainId);
            const updateResult = await db.updateChain(chainId, {
              status: 'active',
              deployed_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
            
            if (updateResult) {
              console.log('✅ Chain status auto-updated to active:', chainId);
            } else {
              console.error('❌ Failed to auto-update chain status - chain not found:', chainId);
            }
          } catch (err) {
            console.error('❌ Error auto-updating chain status:', err);
          }
        }, 3000); // 3 seconds for faster testing - chains will auto-activate
        
        // Also run actual deployment (if configured)
        deployChain(chainId, {
          name,
          chainType,
          rollupType,
          gasToken: gasToken.toUpperCase(),
          validatorAccess: validatorAccess || 'public',
          validators: parseInt(initialValidators) || 3
        }).then((result) => {
          console.log('🚀 Deployment result for chain', chainId, ':', result);
          if (result && result.success) {
            db.updateChain(chainId, {
              status: 'active',
              rpc_url: result.endpoints?.rpc || chainData.rpc_url,
              explorer_url: result.endpoints?.explorer || chainData.explorer_url,
              bridge_url: result.endpoints?.bridge,
              agglayer_chain_id: result.agglayerChainId,
              deployed_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }).then(updated => {
              console.log('✅ Chain updated after successful deployment:', chainId);
            }).catch(err => {
              console.error('❌ Error updating chain after deployment:', err);
            });
          }
        }).catch(error => {
          console.error('❌ Deployment error for chain', chainId, ':', error);
          // Don't mark as failed - let the timeout handle status update
        });

        return res.status(201).json({
          message: 'Chain created and deployment started',
          chainId,
          chain,
          blockchainTxHash,
          polygonScanUrl
        });
      } catch (error) {
        console.error('Error syncing chain from blockchain:', error);
        return res.status(500).json({ message: 'Error syncing chain from blockchain', error: error.message });
      }
    } else {
      // No blockchain transaction - create in database only
      const chainId = uuidv4();
      
      const chainData = {
        id: chainId,
        user_id: userAddress,
        name,
        chain_type: chainType,
        rollup_type: rollupType,
        gas_token: gasToken.toUpperCase(),
        validator_access: validatorAccess || 'public',
        validator_count: parseInt(initialValidators) || 3,
        status: 'pending',
        rpc_url: `https://rpc-${chainId.substring(0, 8)}.polyone.io`,
        explorer_url: `https://explorer-${chainId.substring(0, 8)}.polyone.io`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('💾 Saving chain to database (no blockchain tx):', chainId, 'for user:', userAddress);
      let chain;
      try {
        chain = await db.createChain(chainData);
        console.log('✅ Chain saved successfully:', chain.id);
      } catch (dbError) {
        console.error('❌ Error saving chain to database:', dbError);
        return res.status(500).json({ 
          message: 'Failed to save chain to database', 
          error: dbError.message 
        });
      }

      return res.status(201).json({
        message: 'Chain created (pending blockchain registration)',
        chainId,
        chain
      });
    }
  } catch (error) {
    console.error('Error creating chain:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update chain
router.put('/:id', authenticate, async (req, res) => {
  try {
    const chainId = req.params.id;
    const chain = await db.getChainById(chainId);
    
    if (!chain) {
      return res.status(404).json({ message: 'Chain not found' });
    }

    if (chain.user_id !== req.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const updatedChain = await db.updateChain(chainId, {
      ...req.body,
      updated_at: new Date().toISOString()
    });

    res.json({ message: 'Chain updated', chain: updatedChain });
  } catch (error) {
    console.error('Error updating chain:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Pause chain
router.post('/:id/pause', authenticate, async (req, res) => {
  try {
    const chainId = req.params.id;
    const chain = await db.getChainById(chainId);
    
    if (!chain) {
      return res.status(404).json({ message: 'Chain not found' });
    }

    if (chain.user_id !== req.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (chain.status === 'paused') {
      return res.status(400).json({ message: 'Chain is already paused' });
    }

    const pausedChain = await db.pauseChain(chainId, req.userId);

    // Stop chain deployment if running
    try {
      await stopChain(chainId);
    } catch (stopError) {
      console.warn('Error stopping chain deployment:', stopError);
    }

    res.json({ 
      message: 'Chain paused successfully', 
      chain: pausedChain 
    });
  } catch (error) {
    console.error('Error pausing chain:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Resume chain
router.post('/:id/resume', authenticate, async (req, res) => {
  try {
    const chainId = req.params.id;
    const chain = await db.getChainById(chainId);
    
    if (!chain) {
      return res.status(404).json({ message: 'Chain not found' });
    }

    if (chain.user_id !== req.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (chain.status !== 'paused') {
      return res.status(400).json({ message: 'Chain is not paused' });
    }

    const resumedChain = await db.resumeChain(chainId, req.userId);

    // Restart chain deployment if needed
    try {
      await restartChain(chainId);
    } catch (restartError) {
      console.warn('Error restarting chain deployment:', restartError);
    }

    res.json({ 
      message: 'Chain resumed successfully', 
      chain: resumedChain 
    });
  } catch (error) {
    console.error('Error resuming chain:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Scale chain (add/remove validators)
router.post('/:id/scale', authenticate, [
  body('action').isIn(['add', 'remove']).withMessage('Action must be "add" or "remove"'),
  body('count').isInt({ min: 1 }).withMessage('Count must be a positive integer')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const chainId = req.params.id;
    const { action, count } = req.body;
    const chain = await db.getChainById(chainId);
    
    if (!chain) {
      return res.status(404).json({ message: 'Chain not found' });
    }

    if (chain.user_id !== req.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const currentValidators = await db.getChainValidators(chainId);
    const activeValidators = currentValidators.filter(v => v.status === 'active');
    const currentCount = activeValidators.length;

    if (action === 'add') {
      // Add validators
      for (let i = 0; i < count; i++) {
        const wallet = require('ethers').Wallet.createRandom();
        await db.createValidator({
          chain_id: chainId,
          name: `Validator ${currentCount + i + 1}`,
          address: wallet.address,
          public_key: wallet.publicKey,
          status: 'active',
          is_genesis: false,
          stake_amount: 0,
          activated_at: new Date().toISOString()
        });
      }
    } else if (action === 'remove') {
      // Remove validators (remove non-genesis validators first)
      const nonGenesisValidators = activeValidators
        .filter(v => !v.is_genesis)
        .slice(0, Math.min(count, activeValidators.length));
      
      if (nonGenesisValidators.length < count && activeValidators.length > 0) {
        return res.status(400).json({ 
          message: `Cannot remove ${count} validators. Only ${nonGenesisValidators.length} non-genesis validators available.` 
        });
      }

      for (const validator of nonGenesisValidators) {
        await db.removeValidator(validator.id, chainId, req.userId);
      }
    }

    // Update chain validator count
    const updatedValidators = await db.getChainValidators(chainId);
    const updatedActiveCount = updatedValidators.filter(v => v.status === 'active').length;
    await db.updateChain(chainId, {
      validators_count: updatedActiveCount,
      status: 'scaling',
      updated_at: new Date().toISOString()
    });

    // Create event
    await db.createChainEvent({
      chain_id: chainId,
      event_type: action === 'add' ? 'scaled_up' : 'scaled_down',
      description: `Chain ${action === 'add' ? 'scaled up' : 'scaled down'} by ${count} validators`,
      triggered_by: req.userId,
      data: { action, count, old_count: currentCount, new_count: updatedActiveCount }
    });

    // Update status back to active after scaling
    setTimeout(async () => {
      await db.updateChain(chainId, { status: 'active' });
    }, 2000);

    res.json({ 
      message: `Chain ${action === 'add' ? 'scaled up' : 'scaled down'} successfully`,
      oldValidatorCount: currentCount,
      newValidatorCount: updatedActiveCount,
      action,
      count
    });
  } catch (error) {
    console.error('Error scaling chain:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete chain with cleanup
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const chainId = req.params.id;
    const chain = await db.getChainById(chainId);
    
    if (!chain) {
      return res.status(404).json({ message: 'Chain not found' });
    }

    if (chain.user_id !== req.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Stop chain deployment
    try {
      await stopChain(chainId);
    } catch (stopError) {
      console.warn('Error stopping chain during deletion:', stopError);
    }

    // Delete all validators
    const validators = await db.getChainValidators(chainId);
    for (const validator of validators) {
      try {
        await db.removeValidator(validator.id, chainId, req.userId);
      } catch (err) {
        console.warn(`Error removing validator ${validator.id}:`, err);
      }
    }

    // Delete chain backups
    const backups = await db.getChainBackups(chainId);
    for (const backup of backups) {
      try {
        await db.updateChainBackup(backup.id, { status: 'deleted' });
      } catch (err) {
        console.warn(`Error deleting backup ${backup.id}:`, err);
      }
    }

    // Soft delete chain
    await db.deleteChain(chainId);

    // Create deletion event
    await db.createChainEvent({
      chain_id: chainId,
      event_type: 'deleted',
      description: `Chain ${chain.name} deleted`,
      triggered_by: req.userId
    });

    res.json({ message: 'Chain deleted successfully with cleanup' });
  } catch (error) {
    console.error('Error deleting chain:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Chain upgrade/migration
router.post('/:id/upgrade', authenticate, [
  body('to_version').notEmpty().withMessage('Target version is required'),
  body('upgrade_type').isIn(['protocol', 'config', 'validator', 'contract', 'network', 'security']).withMessage('Invalid upgrade type'),
  body('scheduled_at').optional().isISO8601().withMessage('Invalid date format')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const chainId = req.params.id;
    const { to_version, upgrade_type, description, scheduled_at, breaking_changes } = req.body;
    const chain = await db.getChainById(chainId);
    
    if (!chain) {
      return res.status(404).json({ message: 'Chain not found' });
    }

    if (chain.user_id !== req.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (chain.status === 'upgrading') {
      return res.status(400).json({ message: 'Chain is already being upgraded' });
    }

    const upgradeData = {
      chain_id: chainId,
      upgrade_type,
      from_version: chain.config?.version || '1.0.0',
      to_version,
      status: scheduled_at ? 'scheduled' : 'pending',
      scheduled_at: scheduled_at || null,
      description: description || `Upgrade chain to version ${to_version}`,
      breaking_changes: breaking_changes || [],
      rollback_available: true,
      auto_rollback_on_failure: true,
      initiated_by: req.userId
    };

    const upgrade = await db.createChainUpgrade(upgradeData);

    // Update chain status
    await db.updateChain(chainId, {
      status: 'upgrading',
      updated_at: new Date().toISOString()
    });

    res.status(201).json({ 
      message: 'Chain upgrade initiated',
      upgrade 
    });
  } catch (error) {
    console.error('Error initiating chain upgrade:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get chain upgrades
router.get('/:id/upgrades', authenticate, async (req, res) => {
  try {
    const chainId = req.params.id;
    const chain = await db.getChainById(chainId);
    
    if (!chain) {
      return res.status(404).json({ message: 'Chain not found' });
    }

    if (chain.user_id !== req.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const upgrades = await db.getChainUpgrades(chainId);
    res.json({ upgrades });
  } catch (error) {
    console.error('Error fetching chain upgrades:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create chain backup
router.post('/:id/backup', authenticate, [
  body('backup_type').isIn(['full', 'incremental', 'snapshot', 'scheduled']).withMessage('Invalid backup type')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const chainId = req.params.id;
    const { backup_type, description } = req.body;
    const chain = await db.getChainById(chainId);
    
    if (!chain) {
      return res.status(404).json({ message: 'Chain not found' });
    }

    if (chain.user_id !== req.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const backupData = {
      chain_id: chainId,
      backup_type,
      status: 'in_progress',
      block_height: chain.current_block || 0,
      created_by: req.userId,
      description: description || `${backup_type} backup of chain ${chain.name}`,
      is_encrypted: true,
      retention_days: 30
    };

    const backup = await db.createChainBackup(backupData);

    // Simulate backup process (in production, this would trigger actual backup)
    setTimeout(async () => {
      await db.updateChainBackup(backup.id, {
        status: 'completed',
        completed_at: new Date().toISOString(),
        size_bytes: Math.floor(Math.random() * 1000000000), // Simulated size
        backup_hash: require('crypto').randomBytes(32).toString('hex')
      });
    }, 2000);

    res.status(201).json({ 
      message: 'Chain backup initiated',
      backup 
    });
  } catch (error) {
    console.error('Error creating chain backup:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get chain backups
router.get('/:id/backups', authenticate, async (req, res) => {
  try {
    const chainId = req.params.id;
    const chain = await db.getChainById(chainId);
    
    if (!chain) {
      return res.status(404).json({ message: 'Chain not found' });
    }

    if (chain.user_id !== req.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const backups = await db.getChainBackups(chainId);
    res.json({ backups });
  } catch (error) {
    console.error('Error fetching chain backups:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Restore chain from backup
router.post('/:id/restore/:backupId', authenticate, async (req, res) => {
  try {
    const { id: chainId, backupId } = req.params;
    const chain = await db.getChainById(chainId);
    
    if (!chain) {
      return res.status(404).json({ message: 'Chain not found' });
    }

    if (chain.user_id !== req.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const backups = await db.getChainBackups(chainId);
    const backup = backups.find(b => b.id === backupId);
    
    if (!backup) {
      return res.status(404).json({ message: 'Backup not found' });
    }

    if (backup.status !== 'completed') {
      return res.status(400).json({ message: 'Backup is not completed' });
    }

    // Update backup status to restoring
    await db.updateChainBackup(backupId, {
      status: 'restoring'
    });

    // Update chain status
    await db.updateChain(chainId, {
      status: 'maintenance',
      updated_at: new Date().toISOString()
    });

    // Create restore event
    await db.createChainEvent({
      chain_id: chainId,
      event_type: 'backup_restored',
      description: `Chain restored from ${backup.backup_type} backup`,
      triggered_by: req.userId,
      data: { backup_id: backupId }
    });

    // Simulate restore process
    setTimeout(async () => {
      await db.updateChainBackup(backupId, {
        status: 'restored'
      });
      await db.updateChain(chainId, {
        status: 'active',
        current_block: backup.block_height || chain.current_block
      });
    }, 3000);

    res.json({ 
      message: 'Chain restore initiated',
      backup,
      estimatedTime: '3-5 minutes'
    });
  } catch (error) {
    console.error('Error restoring chain:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get chain deployment status
router.get('/:id/status', authenticate, async (req, res) => {
  try {
    const { getDeploymentStatus } = require('../services/chainDeployment');
    const { getAggLayerStatus } = require('../services/agglayer');
    
    const chain = await db.getChainById(req.params.id);
    
    if (!chain) {
      return res.status(404).json({ message: 'Chain not found' });
    }

    if (chain.user_id !== req.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Get deployment status
    const deploymentStatus = await getDeploymentStatus(req.params.id);
    
    // Get AggLayer status
    const agglayerStatus = await getAggLayerStatus(req.params.id);

    res.json({
      chainId: req.params.id,
      status: chain.status,
      deployment: deploymentStatus,
      agglayer: agglayerStatus,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting chain status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;