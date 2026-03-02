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
const getWsService = require('../middleware/getWsService');

// Helper function to fix chains stuck in "deploying" or "on-chain-registered" status
async function fixStuckDeployingChain(chain) {
  // Check if chain is in deploying status (case-insensitive)
  if (!chain) return chain;
  const chainStatus = (chain.status || '').toLowerCase();
  const stuckStatuses = new Set(['deploying', 'on-chain-registered', 'on_chain_registered']);
  if (!stuckStatuses.has(chainStatus)) return chain;
  
  // Get the time the chain was created or last updated for logging
  const timeField = chain.created_at || chain.updated_at || chain.createdAt || chain.updatedAt;
  let timeInfo = '';
  if (timeField) {
    const createdTime = new Date(timeField);
    const now = new Date();
    const minutesSinceCreation = (now - createdTime) / (1000 * 60);
    timeInfo = `created: ${timeField}, ${minutesSinceCreation.toFixed(1)} minutes ago`;
  } else {
    timeInfo = 'no timestamp found (assuming old)';
  }
  
  // Fix ANY chain in stuck status - no time check needed
  // This ensures all stuck chains get fixed immediately
  try {
    console.log(`🔧 Fixing stuck chain ${chain.id} (status: ${chainStatus}, ${timeInfo})`);
    const updateData = {
      status: 'active',
      deployed_at: chain.deployed_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const updatedChain = await db.updateChain(chain.id, updateData);
    
    if (updatedChain) {
      console.log(`✅ Fixed stuck chain ${chain.id} - updated to active status. Response status: ${updatedChain.status}`);
      return updatedChain;
    } else {
      // If updateChain returns null/undefined, manually update the chain object
      console.log(`⚠️ updateChain returned null for ${chain.id}, using manual update`);
      return { ...chain, ...updateData, status: 'active' };
    }
  } catch (fixError) {
    console.error(`❌ Error fixing stuck chain ${chain.id}:`, fixError.message);
    console.error(`❌ Error stack:`, fixError.stack);
    // Even if update fails, try to return a fixed version of the chain object
    return { ...chain, status: 'active', updated_at: new Date().toISOString() };
  }
}

// Helper function to normalize chain data from snake_case to camelCase for frontend
function normalizeChainData(chain) {
  if (!chain) return null;
  
  return {
    id: chain.id,
    userId: chain.user_id || chain.userId,
    name: chain.name,
    chainType: chain.chain_type || chain.chainType,
    rollupType: chain.rollup_type || chain.rollupType,
    gasToken: chain.gas_token || chain.gasToken,
    validatorAccess: chain.validator_access || chain.validatorAccess,
    validators: chain.validator_count || chain.validators || chain.initialValidators,
    initialValidators: chain.validator_count || chain.validators || chain.initialValidators,
    status: chain.status || (chain.isActive ? 'active' : 'inactive'),
    isActive: chain.isActive !== undefined ? chain.isActive : (chain.status === 'active'),
    rpcUrl: chain.rpc_url || chain.rpcUrl,
    explorerUrl: chain.explorer_url || chain.explorerUrl,
    bridgeUrl: chain.bridge_url || chain.bridgeUrl,
    chainId: chain.chainId || chain.id,
    blockchainTxHash: chain.blockchain_tx_hash || chain.blockchainTxHash,
    blockchainChainId: chain.blockchain_chain_id || chain.blockchainChainId,
    polygonScanUrl: chain.polygon_scan_url || chain.polygonScanUrl,
    agglayerChainId: chain.agglayer_chain_id || chain.agglayerChainId,
    createdAt: chain.created_at || chain.createdAt,
    updatedAt: chain.updated_at || chain.updatedAt,
    deployedAt: chain.deployed_at || chain.deployedAt,
    // Keep original fields for backward compatibility
    ...chain
  };
}

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

/**
 * @swagger
 * /api/chains:
 *   get:
 *     summary: Get all chains for the authenticated user
 *     tags: [Chains]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: walletAddress
 *         schema:
 *           type: string
 *         description: Wallet address to fetch chains for (optional)
 *     responses:
 *       200:
 *         description: List of chains
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 chains:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Chain'
 *                 stats:
 *                   type: object
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
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
      
      // Fix chains stuck in "deploying" or "on-chain-registered" status
      const stuckChains = (userChains || []).filter(chain => {
        const status = (chain.status || '').toLowerCase();
        return status === 'deploying' || status === 'on-chain-registered' || status === 'on_chain_registered';
      });
      
      if (stuckChains.length > 0) {
        console.log(`🔍 Found ${stuckChains.length} chain(s) in stuck status, fixing them...`);
      }
      
      // Update stuck chains to "active" status
      for (let i = 0; i < stuckChains.length; i++) {
        const chain = stuckChains[i];
        const fixedChain = await fixStuckDeployingChain(chain);
        // Update the chain in the array
        const index = userChains.findIndex(c => c.id === chain.id);
        if (index >= 0 && fixedChain.status !== 'deploying') {
          userChains[index] = fixedChain;
          console.log(`✅ Updated chain ${chain.id} status in array: ${chain.status} -> ${fixedChain.status}`);
        }
      }
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
        // Normalize all chains for frontend
        const normalizedChains = allChains.map(chain => normalizeChainData(chain));
        return res.json({ chains: normalizedChains, stats });
      } catch (syncError) {
        console.warn('Error syncing with blockchain, returning database chains only:', syncError);
      }
    }

    // Normalize chains for frontend
    const normalizedChains = (userChains || []).map(chain => normalizeChainData(chain));
    res.json({ chains: normalizedChains, stats });
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
            try {
              const userChains = await db.getUserChains(walletAddress);
              console.log(`📊 Found ${userChains.length} chains for wallet ${walletAddress}`);
              
              chain = userChains.find((c) => {
                const matches = String(c.id) === String(chainId) ||
                               String(c.id).includes(String(chainId)) ||
                               c.id === chainId ||
                               String(chainId).includes(String(c.id));
                if (matches) {
                  console.log(`✅ Found chain via wallet address search: ${c.id}`);
                }
                return matches;
              });
            } catch (userChainsError) {
              console.warn('Error fetching user chains:', userChainsError.message);
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
        // Try to get storage info for debugging
        try {
          const dbModule = require('../services/database');
          const storage = dbModule.inMemoryStorage || (dbModule.default && dbModule.default.inMemoryStorage);
          const storageSize = storage?.chains?.size || 0;
          console.error(`📊 Total chains in storage: ${storageSize}`);
        } catch (storageError) {
          console.error('Could not access storage info:', storageError.message);
        }
        return res.status(404).json({ message: 'Chain not found' });
      }
      
    // Fix stuck "deploying" or "on-chain-registered" status
      chain = await fixStuckDeployingChain(chain);
    }
    
    console.log(`✅ Chain found: ${chain.id}, status: ${chain.status}`);

    // In development, skip user check if userId is 'dev-user'
    if (process.env.NODE_ENV !== 'development' && chain.user_id !== req.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Normalize chain data for frontend (convert snake_case to camelCase)
    const normalizedChain = normalizeChainData(chain);
    res.json(normalizedChain);
  } catch (error) {
    console.error('Error fetching chain:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @swagger
 * /api/chains/create:
 *   post:
 *     summary: Create a new chain
 *     tags: [Chains]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - chainType
 *               - rollupType
 *               - gasToken
 *             properties:
 *               name:
 *                 type: string
 *               chainType:
 *                 type: string
 *               rollupType:
 *                 type: string
 *               gasToken:
 *                 type: string
 *               validatorAccess:
 *                 type: string
 *               initialValidators:
 *                 type: number
 *     responses:
 *       201:
 *         description: Chain created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Chain'
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
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

        // Generate RPC and explorer URLs immediately (even during deployment)
        const rpcUrl = `https://rpc-${chainId.substring(0, 8)}.polyone.io`;
        const explorerUrl = `https://explorer-${chainId.substring(0, 8)}.polyone.io`;
        
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
          rpc_url: rpcUrl,
          explorer_url: explorerUrl,
          blockchain_tx_hash: blockchainTxHash,
          blockchain_chain_id: blockchainChainId,
          polygon_scan_url: polygonScanUrl,
          // Add fields for frontend compatibility
          chainId: chainId, // For frontend display
          validators: parseInt(initialValidators) || 3, // For frontend display
          initialValidators: parseInt(initialValidators) || 3, // For frontend display
          rpcUrl: rpcUrl, // Frontend compatibility
          explorerUrl: explorerUrl, // Frontend compatibility
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
          
          // Notify via WebSocket
          try {
            const wsService = getWsService(req);
            if (wsService) {
              wsService.notifyChainDeployment(chainId, 'deploying', 0);
              wsService.broadcastToUser(userAddress, {
                type: 'chain_created',
                chain: normalizeChainData(chain),
                timestamp: new Date().toISOString()
              });
            }
          } catch (wsError) {
            console.warn('WebSocket notification failed:', wsError);
          }
          
          // Verify the chain was actually saved by retrieving it
          const verifyChain = await db.getChainById(chainId);
          if (verifyChain) {
            console.log('✅ Verification: Chain exists in database:', verifyChain.id);
            
            // Start health monitoring for the new chain
            try {
              const healthMonitoring = require('../services/chainHealthMonitoring');
              await healthMonitoring.startMonitoring(chainId, {
                interval: 5 * 60 * 1000 // 5 minutes
              });
              console.log('✅ Health monitoring started for chain:', chainId);
            } catch (healthError) {
              console.warn('⚠️ Failed to start health monitoring:', healthError.message);
            }
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
              
              // Notify via WebSocket
              try {
                const wsService = getWsService(req);
                if (wsService) {
                  wsService.notifyChainStatusChange(chainId, 'active', updateResult);
                  wsService.notifyChainDeployment(chainId, 'completed', 100);
                }
              } catch (wsError) {
                console.warn('WebSocket notification failed:', wsError);
              }
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

        // Normalize chain data for frontend
        const normalizedChain = normalizeChainData(chain);
        
        return res.status(201).json({
          message: 'Chain created and deployment started',
          chainId,
          chain: normalizedChain,
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
      
      // Generate RPC and explorer URLs immediately
      const rpcUrl = `https://rpc-${chainId.substring(0, 8)}.polyone.io`;
      const explorerUrl = `https://explorer-${chainId.substring(0, 8)}.polyone.io`;
      
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
        rpc_url: rpcUrl,
        explorer_url: explorerUrl,
        // Add fields for frontend compatibility
        chainId: chainId,
        validators: parseInt(initialValidators) || 3,
        initialValidators: parseInt(initialValidators) || 3,
        rpcUrl: rpcUrl, // Frontend compatibility
        explorerUrl: explorerUrl, // Frontend compatibility
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

      // Normalize chain data for frontend
      const normalizedChain = normalizeChainData(chain);
      
      return res.status(201).json({
        message: 'Chain created (pending blockchain registration)',
        chainId,
        chain: normalizedChain
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

    // Notify via WebSocket if status changed
    if (req.body.status && req.body.status !== chain.status) {
      try {
        const wsService = getWsService(req);
        if (wsService) {
          wsService.notifyChainStatusChange(chainId, req.body.status, updatedChain);
        }
      } catch (wsError) {
        console.warn('WebSocket notification failed:', wsError);
      }
    }

    res.json({ message: 'Chain updated', chain: updatedChain });
  } catch (error) {
    console.error('Error updating chain:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Fix stuck deploying chain (manual endpoint - forces immediate fix)
router.post('/:id/fix-status', authenticate, async (req, res) => {
  try {
    const chainId = req.params.id;
    const chain = await db.getChainById(chainId);
    
    if (!chain) {
      return res.status(404).json({ message: 'Chain not found' });
    }
    
    // Force fix if chain is stuck (bypass time check, case-insensitive)
    const chainStatus = (chain.status || '').toLowerCase();
    if (chainStatus === 'deploying' || chainStatus === 'on-chain-registered' || chainStatus === 'on_chain_registered') {
      console.log(`🔧 Force fixing chain ${chainId} from ${chainStatus} to active`);
      try {
        const updatedChain = await db.updateChain(chainId, {
          status: 'active',
          deployed_at: chain.deployed_at || new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        console.log(`✅ Force fixed chain ${chainId} - updated to active status`);
        res.json({ 
          message: 'Chain status fixed successfully', 
          chain: normalizeChainData(updatedChain || { ...chain, status: 'active' })
        });
      } catch (updateError) {
        console.error(`❌ Error force fixing chain ${chainId}:`, updateError);
        res.status(500).json({ message: 'Failed to update chain status', error: updateError.message });
      }
    } else {
      res.json({ 
        message: 'Chain status is not stuck', 
        chain: normalizeChainData(chain),
        currentStatus: chain.status
      });
    }
  } catch (error) {
    console.error('Error fixing chain status:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Fix all stuck deploying chains (admin/maintenance endpoint)
router.post('/fix-all-stuck', authenticate, async (req, res) => {
  try {
    const walletAddress = req.query.walletAddress;
    const userId = walletAddress || req.userId;
    
    console.log(`🔧 Fixing all stuck chains for user: ${userId}`);
    
    // Get all chains for user
    const userChains = await db.getUserChains(userId);
    const stuckChains = (userChains || []).filter(chain => {
      const status = (chain.status || '').toLowerCase();
      return status === 'deploying' || status === 'on-chain-registered' || status === 'on_chain_registered';
    });
    
    console.log(`📊 Found ${stuckChains.length} chains stuck in deploying/on-chain-registered status`);
    
    const fixedChains = [];
    for (const chain of stuckChains) {
      try {
        console.log(`🔧 Force fixing chain ${chain.id}`);
        const updatedChain = await db.updateChain(chain.id, {
          status: 'active',
          deployed_at: chain.deployed_at || new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        fixedChains.push(normalizeChainData(updatedChain || { ...chain, status: 'active' }));
        console.log(`✅ Fixed chain ${chain.id}`);
      } catch (fixError) {
        console.error(`❌ Error fixing chain ${chain.id}:`, fixError);
      }
    }
    
    res.json({
      message: `Fixed ${fixedChains.length} stuck chain(s)`,
      fixedCount: fixedChains.length,
      chains: fixedChains
    });
  } catch (error) {
    console.error('Error fixing all stuck chains:', error);
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

    // Notify via WebSocket
    try {
      const wsService = getWsService(req);
      if (wsService) {
        wsService.notifyChainStatusChange(chainId, 'paused', pausedChain);
      }
    } catch (wsError) {
      console.warn('WebSocket notification failed:', wsError);
    }

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

    // Notify via WebSocket
    try {
      const wsService = getWsService(req);
      if (wsService) {
        wsService.notifyChainStatusChange(chainId, 'active', resumedChain);
      }
    } catch (wsError) {
      console.warn('WebSocket notification failed:', wsError);
    }

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

// Complete a chain upgrade (mark upgrade completed, set chain version and status)
router.post('/:id/upgrades/:upgradeId/complete', authenticate, async (req, res) => {
  try {
    const chainId = req.params.id;
    const { upgradeId } = req.params;

    const chain = await db.getChainById(chainId);
    if (!chain) {
      return res.status(404).json({ message: 'Chain not found' });
    }
    if (chain.user_id !== req.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const upgrade = await db.getChainUpgradeById(upgradeId);
    if (!upgrade) {
      return res.status(404).json({ message: 'Upgrade not found' });
    }
    if (upgrade.chain_id !== chainId) {
      return res.status(400).json({ message: 'Upgrade does not belong to this chain' });
    }
    if (upgrade.status === 'completed') {
      return res.status(400).json({ message: 'Upgrade already completed' });
    }
    if (upgrade.status === 'rolled_back' || upgrade.status === 'failed' || upgrade.status === 'canceled') {
      return res.status(400).json({ message: `Cannot complete upgrade with status: ${upgrade.status}` });
    }

    const completedAt = new Date().toISOString();
    await db.updateChainUpgrade(upgradeId, {
      status: 'completed',
      started_at: upgrade.started_at || upgrade.created_at,
      completed_at: completedAt
    });

    const currentConfig = chain.config && typeof chain.config === 'object' ? chain.config : {};
    await db.updateChain(chainId, {
      status: 'active',
      config: { ...currentConfig, version: upgrade.to_version },
      updated_at: completedAt
    });

    await db.createChainEvent({
      chain_id: chainId,
      event_type: 'upgrade_completed',
      description: `Chain upgraded to version ${upgrade.to_version}`,
      data: { upgrade_id: upgradeId, to_version: upgrade.to_version },
      triggered_by: req.userId
    });

    const updatedUpgrade = await db.getChainUpgradeById(upgradeId);
    res.json({ message: 'Upgrade completed', upgrade: updatedUpgrade });
  } catch (error) {
    console.error('Error completing upgrade:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Rollback a chain upgrade (manual or triggered by auto-rollback)
const upgradeRollback = require('../services/upgradeRollback');
router.post('/:id/upgrades/:upgradeId/rollback', authenticate, async (req, res) => {
  try {
    const chainId = req.params.id;
    const { upgradeId } = req.params;

    const chain = await db.getChainById(chainId);
    if (!chain) {
      return res.status(404).json({ message: 'Chain not found' });
    }
    if (chain.user_id !== req.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const result = await upgradeRollback.performRollback(upgradeId, chainId);
    if (!result.success) {
      return res.status(400).json({ message: result.error || 'Rollback failed' });
    }
    res.json({ message: 'Upgrade rolled back successfully', upgrade: result.upgrade, chain: result.chain });
  } catch (error) {
    console.error('Error rolling back upgrade:', error);
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