const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const sharedLiquidity = require('../services/sharedLiquidity');

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

/**
 * GET /api/liquidity/pools
 * List shared liquidity pools and contract status
 */
router.get('/pools', authenticate, async (req, res) => {
  try {
    const config = sharedLiquidity.getPoolsConfig();
    res.json({
      contractConfigured: sharedLiquidity.isContractConfigured(),
      contractAddress: config.contractAddress,
      pools: config.pools,
      description: 'Shared liquidity primitives reduce capital fragmentation across appchains'
    });
  } catch (error) {
    console.error('Error fetching liquidity pools:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * GET /api/liquidity/pools/balance
 * Query params: token_address, destination_chain_id
 * Get pool balance for (token, destination chain)
 */
router.get('/pools/balance', authenticate, async (req, res) => {
  try {
    const { token_address, destination_chain_id } = req.query;
    if (!token_address || !destination_chain_id) {
      return res.status(400).json({ message: 'token_address and destination_chain_id are required' });
    }
    const destinationChainId = parseInt(destination_chain_id, 10);
    if (isNaN(destinationChainId)) {
      return res.status(400).json({ message: 'destination_chain_id must be a number' });
    }
    const balance = await sharedLiquidity.getPoolBalance(token_address, destinationChainId);
    if (!balance) {
      return res.json({
        configured: false,
        message: 'Shared liquidity contract not configured or pool not found'
      });
    }
    res.json({
      configured: true,
      tokenAddress: token_address,
      destinationChainId,
      ...balance
    });
  } catch (error) {
    console.error('Error fetching pool balance:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
