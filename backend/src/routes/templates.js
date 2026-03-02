const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const templatesService = require('../services/templates');
const db = require('../services/database');
const { body, validationResult } = require('express-validator');
const { deployChain } = require('../services/chainDeployment');

// Normalize chain data for frontend (same as chains.js)
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
    templateId: chain.template_id || chain.templateId,
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
    if (process.env.NODE_ENV === 'development') {
      req.userId = req.query.userId || req.body.walletAddress || 'dev-user';
      return next();
    }
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Get all templates (marketplace) - No auth required for browsing
router.get('/', async (req, res) => {
  try {
    const { 
      category, 
      isOfficial, 
      isCommunity, 
      search, 
      minRating,
      sortBy = 'recommended' // recommended, rating, deployments, newest
    } = req.query;

    const filters = {
      category,
      isOfficial: isOfficial === 'true' ? true : isOfficial === 'false' ? false : undefined,
      isCommunity: isCommunity === 'true' ? true : isCommunity === 'false' ? false : undefined,
      search,
      minRating: minRating ? parseFloat(minRating) : undefined
    };

    const templates = await templatesService.getAllTemplates(filters);

    res.json({
      templates: templates || [],
      total: templates?.length || 0,
      filters: {
        category: category || 'all',
        isOfficial: isOfficial || 'all',
        isCommunity: isCommunity || 'all',
        search: search || '',
        minRating: minRating || 0
      }
    });
  } catch (error) {
    console.error('Error fetching templates:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      message: 'Server error', 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Failed to load templates' 
    });
  }
});

// Get template by ID - No auth required
router.get('/:templateId', async (req, res) => {
  try {
    const { templateId } = req.params;
    const template = await templatesService.getTemplateById(templateId);

    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }

    // Get reviews if authenticated
    let reviews = [];
    if (req.headers.authorization) {
      try {
        const token = req.headers.authorization.replace('Bearer ', '');
        jwt.verify(token, process.env.JWT_SECRET);
        reviews = await templatesService.getTemplateReviews(templateId);
      } catch (e) {
        // Not authenticated, skip reviews
      }
    }

    res.json({ template, reviews: reviews || [] });
  } catch (error) {
    console.error('Error fetching template:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get templates by category
router.get('/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const templates = await templatesService.getTemplatesByCategory(category);

    res.json({
      category,
      templates,
      total: templates.length
    });
  } catch (error) {
    console.error('Error fetching templates by category:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create community template
router.post('/', authenticate, [
  body('name').trim().isLength({ min: 3 }).withMessage('Name must be at least 3 characters'),
  body('description').trim().isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
  body('category').isIn(['gaming', 'defi', 'nft', 'enterprise', 'general', 'privacy']).withMessage('Invalid category'),
  body('config').isObject().withMessage('Config is required'),
  body('config.chainType').isIn(['public', 'private', 'permissioned']).withMessage('Invalid chain type'),
  body('config.rollupType').isIn(['zk-rollup', 'optimistic-rollup', 'validium']).withMessage('Invalid rollup type'),
  body('tags').optional().isArray().withMessage('Tags must be an array')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const templateData = {
      name: req.body.name,
      description: req.body.description,
      category: req.body.category,
      config: req.body.config,
      tags: req.body.tags || [],
      icon: req.body.icon || '🔗',
      pricing: req.body.pricing || {
        setupFee: 0,
        monthlyHosting: 0,
        validatorCost: 0
      }
    };

    const template = await templatesService.createCommunityTemplate(templateData, req.userId);

    res.status(201).json({
      message: 'Template submitted for review',
      template
    });
  } catch (error) {
    console.error('Error creating template:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Rate and review template
router.post('/:templateId/rate', authenticate, [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('review').optional().trim().isLength({ max: 1000 }).withMessage('Review must be less than 1000 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { templateId } = req.params;
    const { rating, review } = req.body;

    const template = await templatesService.getTemplateById(templateId);
    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }

    const result = await templatesService.rateTemplate(templateId, req.userId, rating, review);

    res.json({
      message: 'Rating submitted successfully',
      ...result
    });
  } catch (error) {
    console.error('Error rating template:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get template reviews
router.get('/:templateId/reviews', async (req, res) => {
  try {
    const { templateId } = req.params;
    const { limit = 10 } = req.query;

    const template = await templatesService.getTemplateById(templateId);
    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }

    const reviews = await templatesService.getTemplateReviews(templateId, parseInt(limit));

    res.json({ reviews, total: reviews.length });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// One-click deployment from template
router.post('/:templateId/deploy', authenticate, [
  body('name').trim().isLength({ min: 3 }).withMessage('Chain name must be at least 3 characters'),
  body('gasToken').optional().isString().withMessage('Gas token must be a string'),
  body('initialValidators').optional().isInt({ min: 1, max: 100 }).withMessage('Validators must be between 1 and 100'),
  body('walletAddress').optional().isString().withMessage('Wallet address must be a string')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { templateId } = req.params;
    const { name, gasToken, initialValidators, walletAddress, blockchainTxHash, blockchainChainId } = req.body;

    // Get template
    const template = await templatesService.getTemplateById(templateId);
    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }

    // Merge template config with user overrides
    const chainConfig = {
      ...template.config,
      name,
      gasToken: gasToken || template.config.gasToken || 'POL',
      initialValidators: initialValidators || template.config.initialValidators || 3,
      validatorAccess: template.config.validatorAccess || 'public',
      chainType: template.config.chainType,
      rollupType: template.config.rollupType
    };

    // Use wallet address if provided, otherwise use userId
    const userAddress = walletAddress || req.userId;
    
    console.log('📝 Template deployment - User address:', userAddress, 'Wallet address:', walletAddress, 'req.userId:', req.userId);

    // Create chain using existing chain creation logic
    const chainId = require('uuid').v4();
    
    const chainData = {
      id: chainId,
      user_id: userAddress, // Store with wallet address or userId
      userId: userAddress, // Also store as userId for frontend compatibility
      name,
      chain_type: chainConfig.chainType,
      rollup_type: chainConfig.rollupType,
      gas_token: chainConfig.gasToken.toUpperCase(),
      validator_access: chainConfig.validatorAccess,
      validator_count: parseInt(chainConfig.initialValidators),
      status: blockchainTxHash ? 'deploying' : 'pending',
      rpc_url: `https://rpc-${chainId.substring(0, 8)}.polyone.io`,
      explorer_url: `https://explorer-${chainId.substring(0, 8)}.polyone.io`,
      blockchain_tx_hash: blockchainTxHash || null,
      blockchain_chain_id: blockchainChainId || null,
      template_id: templateId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    console.log('📋 Chain data to be saved:', JSON.stringify(chainData, null, 2));

    // Save to database
    let chain;
    try {
      chain = await db.createChain(chainData);
      console.log('✅ Chain created in database:', chainId);
      console.log('📋 Created chain data:', JSON.stringify(chain, null, 2));
      
      // Verify the chain was actually saved by retrieving it (with retries)
      let verifyChain = null;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          verifyChain = await db.getChainById(chainId);
          if (verifyChain) {
            console.log(`✅ Verification (attempt ${attempt + 1}): Chain exists in database:`, verifyChain.id);
            // Use the verified chain to ensure we have the latest data
            chain = verifyChain;
            
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
            
            break;
          }
        } catch (verifyError) {
          console.warn(`⚠️ Verification attempt ${attempt + 1} failed:`, verifyError.message);
        }
        
        // Wait a bit before retrying
        if (attempt < 2) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      if (!verifyChain && !chain) {
        console.error('❌ Chain could not be created or verified');
        return res.status(500).json({ 
          message: 'Chain created but could not be verified', 
          error: 'Database verification failed'
        });
      }
    } catch (dbError) {
      console.error('❌ Error creating chain in database:', dbError);
      console.error('❌ Error stack:', dbError.stack);
      return res.status(500).json({ 
        message: 'Failed to create chain in database', 
        error: dbError.message 
      });
    }

    // Increment template deployment count
    try {
      await templatesService.incrementDeploymentCount(templateId);
    } catch (countError) {
      console.warn('⚠️ Failed to increment deployment count:', countError);
      // Non-critical, continue
    }

    // Start deployment if transaction hash provided
    if (blockchainTxHash) {
      // Deploy asynchronously (don't wait for it)
      deployChain(chainId, {
        name,
        chainType: chainConfig.chainType,
        rollupType: chainConfig.rollupType,
        gasToken: chainConfig.gasToken.toUpperCase(),
        validatorAccess: chainConfig.validatorAccess,
        validators: parseInt(chainConfig.initialValidators)
      }).then((result) => {
        if (result && result.success) {
          db.updateChain(chainId, {
            status: 'active',
            rpc_url: result.endpoints?.rpc || chainData.rpc_url,
            explorer_url: result.endpoints?.explorer || chainData.explorer_url,
            deployed_at: new Date().toISOString()
          }).catch(err => console.error('Error updating chain after deployment:', err));
        } else {
          // Update status to indicate deployment failed
          db.updateChain(chainId, {
            status: 'failed'
          }).catch(err => console.error('Error updating chain status:', err));
        }
      }).catch(error => {
        console.error('Deployment error:', error);
        // Update status to indicate deployment failed
        db.updateChain(chainId, {
          status: 'failed'
        }).catch(err => console.error('Error updating chain status:', err));
      });
    } else {
      // Even without blockchain transaction, mark as pending for manual deployment
      console.log('ℹ️ Chain created without blockchain transaction. Status: pending');
    }

    // Ensure we have a valid chain object
    if (!chain) {
      console.error('❌ No chain object available after creation');
      return res.status(500).json({ 
        message: 'Chain created but could not be retrieved',
        error: 'Chain object is null'
      });
    }

    // Normalize chain data for frontend
    const normalizedChain = normalizeChainData(chain);
    
    // Ensure the chain ID is present
    if (!normalizedChain || !normalizedChain.id) {
      console.error('❌ Normalized chain missing ID:', normalizedChain);
      return res.status(500).json({ 
        message: 'Chain created but ID is missing',
        error: 'Chain ID not found in response'
      });
    }

    console.log('✅ Returning chain to frontend:', normalizedChain.id);

    res.status(201).json({
      success: true,
      message: 'Chain created from template successfully',
      chain: normalizedChain,
      chainId: normalizedChain.id, // Explicitly include chainId for frontend
      template: {
        id: template.id,
        name: template.name,
        category: template.category
      }
    });
  } catch (error) {
    console.error('Error deploying from template:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get popular templates
router.get('/popular', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const templates = await templatesService.getAllTemplates();
    
    // Sort by deployments and rating
    const popular = templates
      .sort((a, b) => {
        const aScore = (a.stats?.deployments || 0) * 0.7 + (a.stats?.rating || 0) * 0.3;
        const bScore = (b.stats?.deployments || 0) * 0.7 + (b.stats?.rating || 0) * 0.3;
        return bScore - aScore;
      })
      .slice(0, parseInt(limit));

    res.json({ templates: popular, total: popular.length });
  } catch (error) {
    console.error('Error fetching popular templates:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get featured templates (official recommended)
router.get('/featured', async (req, res) => {
  try {
    const templates = await templatesService.getAllTemplates({ 
      isOfficial: true,
      recommended: true 
    });

    res.json({ templates, total: templates.length });
  } catch (error) {
    console.error('Error fetching featured templates:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

