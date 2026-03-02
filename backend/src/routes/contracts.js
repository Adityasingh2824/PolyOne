const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../services/database');
const { body, validationResult } = require('express-validator');
const fs = require('fs').promises;
const path = require('path');

// Middleware to verify JWT (optional for development)
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

// Get contract templates
router.get('/templates', async (req, res) => {
  try {
    // Path from backend/src/routes to root/config
    const templatesPath = path.join(__dirname, '../../../config/contract-templates.json');
    
    // Check if file exists
    try {
      await fs.access(templatesPath);
    } catch (accessError) {
      console.error('❌ Contract templates file not found at:', templatesPath);
      console.error('❌ Current working directory:', process.cwd());
      console.error('❌ __dirname:', __dirname);
      return res.status(500).json({
        success: false,
        error: { 
          message: 'Contract templates file not found',
          details: process.env.NODE_ENV === 'development' ? `Path: ${templatesPath}` : undefined
        }
      });
    }
    
    const templatesData = await fs.readFile(templatesPath, 'utf-8');
    const parsed = JSON.parse(templatesData);
    const templates = parsed.templates || parsed || [];
    
    if (!Array.isArray(templates)) {
      console.error('❌ Templates data is not an array:', typeof templates);
      return res.status(500).json({
        success: false,
        error: { 
          message: 'Invalid templates file format',
          details: process.env.NODE_ENV === 'development' ? 'Templates must be an array' : undefined
        }
      });
    }
    
    const { category, search, tag } = req.query;
    
    let filteredTemplates = templates;
    
    if (category) {
      filteredTemplates = filteredTemplates.filter(t => t.category === category);
    }
    
    if (tag) {
      filteredTemplates = filteredTemplates.filter(t => 
        t.tags && t.tags.includes(tag)
      );
    }
    
    if (search) {
      const searchLower = search.toLowerCase();
      filteredTemplates = filteredTemplates.filter(t =>
        t.name.toLowerCase().includes(searchLower) ||
        t.description.toLowerCase().includes(searchLower)
      );
    }
    
    console.log(`✅ Loaded ${filteredTemplates.length} contract templates (from ${templates.length} total)`);
    res.json({
      success: true,
      templates: filteredTemplates,
      total: filteredTemplates.length
    });
  } catch (error) {
    console.error('❌ Error loading contract templates:', error);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({
      success: false,
      error: { 
        message: 'Failed to load contract templates',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      }
    });
  }
});

// Get single template by ID
router.get('/templates/:id', async (req, res) => {
  try {
    // Path from backend/src/routes to root/config
    const templatesPath = path.join(__dirname, '../../../config/contract-templates.json');
    const templatesData = await fs.readFile(templatesPath, 'utf-8');
    const { templates } = JSON.parse(templatesData);
    
    const template = templates.find(t => t.id === req.params.id);
    
    if (!template) {
      return res.status(404).json({
        success: false,
        error: { message: 'Template not found' }
      });
    }
    
    res.json({
      success: true,
      template
    });
  } catch (error) {
    console.error('Error loading template:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to load template' }
    });
  }
});

// Get all deployed contracts for a user
router.get('/', authenticate, async (req, res) => {
  try {
    const walletAddress = req.query.walletAddress || req.userId;
    
    const { data: contracts, error } = await db
      .from('deployed_contracts')
      .select('*')
      .eq('owner_address', walletAddress)
      .order('deployed_at', { ascending: false });
    
    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({
        success: false,
        error: { message: 'Failed to fetch contracts' }
      });
    }
    
    res.json({
      success: true,
      contracts: contracts || [],
      total: contracts?.length || 0
    });
  } catch (error) {
    console.error('Error fetching contracts:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch contracts' }
    });
  }
});

// Get single contract by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { data: contract, error } = await db
      .from('deployed_contracts')
      .select('*')
      .eq('id', req.params.id)
      .single();
    
    if (error || !contract) {
      return res.status(404).json({
        success: false,
        error: { message: 'Contract not found' }
      });
    }
    
    res.json({
      success: true,
      contract
    });
  } catch (error) {
    console.error('Error fetching contract:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch contract' }
    });
  }
});

// Save deployed contract
router.post('/', authenticate, [
  body('name').notEmpty().withMessage('Contract name is required'),
  body('address').isEthereumAddress().withMessage('Valid contract address is required'),
  body('chainId').isInt().withMessage('Valid chain ID is required'),
  body('abi').isArray().withMessage('ABI must be an array')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: { message: 'Validation failed', details: errors.array() }
      });
    }
    
    const walletAddress = req.body.walletAddress || req.userId;
    const {
      name,
      address,
      chainId,
      abi,
      templateId,
      constructorArgs,
      txHash,
      blockNumber,
      isUpgradeable,
      proxyAddress
    } = req.body;
    
    const { data: contract, error } = await db
      .from('deployed_contracts')
      .insert({
        owner_address: walletAddress,
        name,
        address: address.toLowerCase(),
        chain_id: chainId,
        abi: JSON.stringify(abi),
        template_id: templateId || null,
        constructor_args: constructorArgs ? JSON.stringify(constructorArgs) : null,
        tx_hash: txHash || null,
        block_number: blockNumber || null,
        is_upgradeable: isUpgradeable || false,
        proxy_address: proxyAddress ? proxyAddress.toLowerCase() : null,
        deployed_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({
        success: false,
        error: { message: 'Failed to save contract' }
      });
    }
    
    res.json({
      success: true,
      contract
    });
  } catch (error) {
    console.error('Error saving contract:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to save contract' }
    });
  }
});

// Update contract (e.g., after upgrade)
router.patch('/:id', authenticate, async (req, res) => {
  try {
    const { name, abi, proxyAddress, implementationAddress } = req.body;
    
    const updateData = {};
    if (name) updateData.name = name;
    if (abi) updateData.abi = JSON.stringify(abi);
    if (proxyAddress) updateData.proxy_address = proxyAddress.toLowerCase();
    if (implementationAddress) updateData.address = implementationAddress.toLowerCase();
    
    const { data: contract, error } = await db
      .from('deployed_contracts')
      .update(updateData)
      .eq('id', req.params.id)
      .select()
      .single();
    
    if (error || !contract) {
      return res.status(404).json({
        success: false,
        error: { message: 'Contract not found or update failed' }
      });
    }
    
    res.json({
      success: true,
      contract
    });
  } catch (error) {
    console.error('Error updating contract:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to update contract' }
    });
  }
});

// Delete contract
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { error } = await db
      .from('deployed_contracts')
      .delete()
      .eq('id', req.params.id);
    
    if (error) {
      return res.status(500).json({
        success: false,
        error: { message: 'Failed to delete contract' }
      });
    }
    
    res.json({
      success: true,
      message: 'Contract deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting contract:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to delete contract' }
    });
  }
});

// Save ABI (standalone)
router.post('/abis', authenticate, [
  body('name').notEmpty().withMessage('ABI name is required'),
  body('abi').isArray().withMessage('ABI must be an array')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: { message: 'Validation failed', details: errors.array() }
      });
    }
    
    const walletAddress = req.body.walletAddress || req.userId;
    const { name, abi, description } = req.body;
    
    const { data: savedAbi, error } = await db
      .from('saved_abis')
      .insert({
        owner_address: walletAddress,
        name,
        abi: JSON.stringify(abi),
        description: description || null,
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({
        success: false,
        error: { message: 'Failed to save ABI' }
      });
    }
    
    res.json({
      success: true,
      abi: savedAbi
    });
  } catch (error) {
    console.error('Error saving ABI:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to save ABI' }
    });
  }
});

// Get saved ABIs
router.get('/abis/list', authenticate, async (req, res) => {
  try {
    const walletAddress = req.query.walletAddress || req.userId;
    
    const { data: abis, error } = await db
      .from('saved_abis')
      .select('*')
      .eq('owner_address', walletAddress)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({
        success: false,
        error: { message: 'Failed to fetch ABIs' }
      });
    }
    
    res.json({
      success: true,
      abis: abis || [],
      total: abis?.length || 0
    });
  } catch (error) {
    console.error('Error fetching ABIs:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch ABIs' }
    });
  }
});

module.exports = router;

























