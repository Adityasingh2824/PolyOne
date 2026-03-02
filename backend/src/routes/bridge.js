const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../services/database');
const { body, validationResult } = require('express-validator');

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

// Get bridge transaction history (from DB)
router.get('/transactions', authenticate, async (req, res) => {
  try {
    const { chainId, status, limit = 50, offset = 0 } = req.query;
    
    // Query bridge transactions from database
    let transactions = [];
    try {
      transactions = await db.getBridgeTransactions(req.userId, {
        chainId,
        status,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }) || [];
    } catch (dbError) {
      console.warn('DB bridge query failed, returning empty:', dbError.message);
    }
    
    res.json({
      transactions,
      total: transactions.length,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Error fetching bridge transactions:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create bridge transaction (deposit/withdraw)
router.post('/transaction', authenticate, [
  body('source_chain_id').notEmpty().withMessage('Source chain ID is required'),
  body('destination_chain_id').notEmpty().withMessage('Destination chain ID is required'),
  body('token_address').notEmpty().withMessage('Token address is required'),
  body('amount').isFloat({ min: 0.000001 }).withMessage('Amount must be greater than 0'),
  body('recipient_address').notEmpty().withMessage('Recipient address is required'),
  body('tx_type').isIn(['deposit', 'withdraw']).withMessage('Transaction type must be deposit or withdraw')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const {
      source_chain_id,
      destination_chain_id,
      token_address,
      amount,
      recipient_address,
      tx_type
    } = req.body;

    // Verify user owns source chain
    const sourceChain = await db.getChainById(source_chain_id);
    if (!sourceChain || sourceChain.user_id !== req.userId) {
      return res.status(403).json({ message: 'Access denied to source chain' });
    }

    // Look up destination chain for network ID
    let destNetworkId = 0;
    try {
      const destChain = await db.getChainById(destination_chain_id);
      destNetworkId = destChain?.chain_id || 0;
    } catch { /* ignore */ }

    // Create bridge transaction record
    const transactionData = {
      id: require('uuid').v4(),
      user_id: req.userId,
      source_chain_id,
      destination_chain_id,
      source_chain_network_id: sourceChain.chain_id || 0,
      destination_chain_network_id: destNetworkId,
      tx_type,
      status: 'pending',
      token_address,
      amount: amount.toString(),
      amount_formatted: amount,
      sender_address: req.body.sender_address || req.userId,
      recipient_address,
      created_at: new Date().toISOString()
    };

    // Persist to database
    let transaction = transactionData;
    try {
      transaction = await db.createBridgeTransaction(transactionData) || transactionData;
    } catch (dbError) {
      console.warn('Failed to persist bridge transaction to DB:', dbError.message);
    }

    // TODO: Initiate actual bridge deposit/withdrawal via polygonBridge service here
    // const bridgeResult = await polygonBridge.initiateBridgeTransfer(transaction);

    res.status(201).json({
      message: 'Bridge transaction initiated',
      transaction
    });
  } catch (error) {
    console.error('Error creating bridge transaction:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get bridge fee information
router.get('/fees', authenticate, async (req, res) => {
  try {
    const { source_chain_id, destination_chain_id, token_address, amount } = req.query;

    // Calculate bridge fees
    const baseFee = 0.001; // 0.1%
    const minFee = 0.0001;
    const maxFee = 1.0;
    
    const calculatedFee = Math.max(
      minFee,
      Math.min(maxFee, parseFloat(amount || 0) * baseFee)
    );

    res.json({
      baseFeePercentage: baseFee * 100,
      calculatedFee,
      minFee,
      maxFee,
      estimatedGasFee: 0.0005, // Mock gas fee
      totalCost: calculatedFee + 0.0005
    });
  } catch (error) {
    console.error('Error calculating bridge fees:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get supported tokens for bridging
router.get('/tokens/:chainId', authenticate, async (req, res) => {
  try {
    const chainId = req.params.chainId;
    const chain = await db.getChainById(chainId);
    
    if (!chain) {
      return res.status(404).json({ message: 'Chain not found' });
    }

    if (chain.user_id !== req.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // In production, this would query bridge_tokens table
    const tokens = [
      {
        address: '0x0000000000000000000000000000000000000000',
        symbol: chain.gas_token || 'POL',
        name: chain.gas_token || 'Polygon Token',
        decimals: 18,
        is_native: true,
        bridge_fee_percentage: 0.001
      }
    ];

    res.json({ tokens });
  } catch (error) {
    console.error('Error fetching bridge tokens:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Bridge security monitoring
router.get('/security/:chainId', authenticate, async (req, res) => {
  try {
    const chainId = req.params.chainId;
    const chain = await db.getChainById(chainId);
    
    if (!chain) {
      return res.status(404).json({ message: 'Chain not found' });
    }

    if (chain.user_id !== req.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Mock security metrics
    const securityMetrics = {
      total_transactions: 0,
      suspicious_transactions: 0,
      failed_transactions: 0,
      average_confirmation_time: 0,
      last_24h_volume: 0,
      risk_score: 'low',
      alerts: []
    };

    res.json({ securityMetrics });
  } catch (error) {
    console.error('Error fetching bridge security:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ========== L2 Bridge Adapters (Arbitrum, Optimism, Base, Polygon) ==========
const l2Adapters = require('../services/l2BridgeAdapters');

// List available L2 adapters
router.get('/l2/adapters', authenticate, (req, res) => {
  try {
    const adapters = l2Adapters.getL2Adapters();
    res.json({ adapters });
  } catch (error) {
    console.error('Error listing L2 adapters:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get bridge status for appchain <-> L2
router.get('/l2/status', authenticate, async (req, res) => {
  try {
    const { chainId, l2 } = req.query;
    if (!chainId || !l2) {
      return res.status(400).json({ message: 'chainId and l2 are required (l2: polygon, arbitrum, optimism, base)' });
    }
    const chain = await db.getChainById(chainId);
    if (!chain || chain.user_id !== req.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }
    const status = await l2Adapters.getL2BridgeStatus(chainId, l2);
    res.json(status);
  } catch (error) {
    console.error('Error fetching L2 bridge status:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Setup bridge config for appchain to L2
router.post('/l2/setup', authenticate, [
  body('chain_id').notEmpty().withMessage('Chain ID is required'),
  body('l2').isIn(['polygon', 'arbitrum', 'optimism', 'base']).withMessage('l2 must be polygon, arbitrum, optimism, or base')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }
    const { chain_id, l2 } = req.body;
    const chain = await db.getChainById(chain_id);
    if (!chain || chain.user_id !== req.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }
    const chainConfig = {
      chainId: chain.chain_id,
      rpcUrl: chain.rpc_url,
      name: chain.name,
      bridgeAddress: chain.bridge_address || '0x...',
      gasToken: chain.gas_token
    };
    const result = await l2Adapters.setupL2Bridge(chain_id, chainConfig, l2);
    res.json(result);
  } catch (error) {
    console.error('Error setting up L2 bridge:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Initiate bridge transfer to L2
router.post('/l2/transfer', authenticate, [
  body('chain_id').notEmpty().withMessage('Chain ID is required'),
  body('l2').isIn(['polygon', 'arbitrum', 'optimism', 'base']).withMessage('l2 must be polygon, arbitrum, optimism, or base'),
  body('amount').isFloat({ min: 0.000001 }).withMessage('Amount must be greater than 0'),
  body('recipient').notEmpty().withMessage('Recipient address is required'),
  body('token').optional(),
  body('private_key').optional()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }
    const { chain_id, l2, amount, recipient, token, private_key } = req.body;
    const chain = await db.getChainById(chain_id);
    if (!chain || chain.user_id !== req.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }
    const transferData = {
      amount: String(amount),
      token: token || 'ETH',
      recipient,
      privateKey: private_key || process.env.BRIDGE_RELAYER_PRIVATE_KEY
    };
    if (!transferData.privateKey) {
      return res.status(400).json({ message: 'private_key or BRIDGE_RELAYER_PRIVATE_KEY required for transfer' });
    }
    const result = await l2Adapters.bridgeToL2(chain_id, l2, transferData);
    res.json(result);
  } catch (error) {
    console.error('Error bridging to L2:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;



























