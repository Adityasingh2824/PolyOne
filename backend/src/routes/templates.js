const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const templatesService = require('../services/templates');
const db = require('../services/database');
const { body, validationResult } = require('express-validator');
const { deployChain } = require('../services/chainDeployment');

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

    // Create chain using existing chain creation logic
    const chainId = require('uuid').v4();
    
    const chainData = {
      id: chainId,
      user_id: userAddress,
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

    // Save to database
    const chain = await db.createChain(chainData);

    // Increment template deployment count
    await templatesService.incrementDeploymentCount(templateId);

    // Start deployment if transaction hash provided
    if (blockchainTxHash) {
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
        }
      }).catch(error => {
        console.error('Deployment error:', error);
      });
    }

    res.status(201).json({
      message: 'Chain deployed from template successfully',
      chain,
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

