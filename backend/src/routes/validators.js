const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('../services/database');
const { body, validationResult } = require('express-validator');
const { ethers } = require('ethers');

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

// Get all validators for a chain
router.get('/chain/:chainId', authenticate, async (req, res) => {
  try {
    const chain = await db.getChainById(req.params.chainId);
    
    if (!chain) {
      return res.status(404).json({ message: 'Chain not found' });
    }

    if (chain.user_id !== req.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const validators = await db.getChainValidators(req.params.chainId);

    res.json({ validators });
  } catch (error) {
    console.error('Error fetching validators:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add new validator
router.post('/chain/:chainId/add', authenticate, async (req, res) => {
  try {
    const { name, stakeAmount = 0 } = req.body;
    const chain = await db.getChainById(req.params.chainId);
    
    if (!chain) {
      return res.status(404).json({ message: 'Chain not found' });
    }

    if (chain.user_id !== req.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (!name) {
      return res.status(400).json({ message: 'Validator name is required' });
    }

    // Generate validator keys
    const wallet = ethers.Wallet.createRandom();
    
    const validatorData = {
      chain_id: req.params.chainId,
      name,
      address: wallet.address,
      public_key: wallet.publicKey,
      private_key_encrypted: wallet.privateKey, // In production, this should be properly encrypted
      status: 'active',
      is_genesis: false,
      stake_amount: parseFloat(stakeAmount) || 0,
      rewards_earned: 0,
      total_blocks_produced: 0,
      missed_blocks: 0,
      uptime_percentage: 100.00,
      activated_at: new Date().toISOString()
    };

    const validator = await db.createValidator(validatorData);

    // Update chain validator count
    const currentValidators = await db.getChainValidators(req.params.chainId);
    const activeValidators = currentValidators.filter(v => v.status === 'active');
    await db.updateChain(req.params.chainId, {
      validators_count: activeValidators.length
    });

    res.status(201).json({ 
      message: 'Validator added successfully', 
      validator: {
        ...validator,
        private_key_encrypted: undefined // Don't send private key in response
      }
    });
  } catch (error) {
    console.error('Error adding validator:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Remove validator
router.post('/chain/:chainId/remove/:validatorId', authenticate, async (req, res) => {
  try {
    const chain = await db.getChainById(req.params.chainId);
    
    if (!chain) {
      return res.status(404).json({ message: 'Chain not found' });
    }

    if (chain.user_id !== req.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const validator = await db.updateValidator(req.params.validatorId, {
      status: 'removed',
      deactivated_at: new Date().toISOString()
    });

    if (!validator) {
      return res.status(404).json({ message: 'Validator not found' });
    }

    await db.createChainEvent({
      chain_id: req.params.chainId,
      event_type: 'validator_removed',
      description: `Validator ${validator.name} removed`,
      triggered_by: req.userId,
      data: { validator_id: req.params.validatorId, validator_address: validator.address }
    });

    // Update chain validator count
    const currentValidators = await db.getChainValidators(req.params.chainId);
    const activeValidators = currentValidators.filter(v => v.status === 'active');
    await db.updateChain(req.params.chainId, {
      validators_count: activeValidators.length
    });

    res.json({ 
      message: 'Validator removed successfully', 
      validator 
    });
  } catch (error) {
    console.error('Error removing validator:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update validator stake
router.post('/:validatorId/stake', authenticate, async (req, res) => {
  try {
    const { amount, action = 'add' } = req.body; // action: 'add' or 'withdraw'
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid stake amount' });
    }

    const validators = await db.getChainValidators(req.params.validatorId);
    const validator = validators.find(v => v.id === req.params.validatorId);
    
    if (!validator) {
      return res.status(404).json({ message: 'Validator not found' });
    }

    const chain = await db.getChainById(validator.chain_id);
    
    if (chain.user_id !== req.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const currentStake = parseFloat(validator.stake_amount) || 0;
    let newStake = currentStake;

    if (action === 'add') {
      newStake = currentStake + parseFloat(amount);
    } else if (action === 'withdraw') {
      newStake = Math.max(0, currentStake - parseFloat(amount));
    } else {
      return res.status(400).json({ message: 'Invalid action. Use "add" or "withdraw"' });
    }

    const updatedValidator = await db.updateValidator(req.params.validatorId, {
      stake_amount: newStake
    });

    await db.createChainEvent({
      chain_id: validator.chain_id,
      event_type: 'validator_staked',
      description: `Validator ${validator.name} stake ${action === 'add' ? 'increased' : 'decreased'} by ${amount}`,
      triggered_by: req.userId,
      data: { 
        validator_id: req.params.validatorId,
        action,
        amount,
        old_stake: currentStake,
        new_stake: newStake
      }
    });

    res.json({ 
      message: `Stake ${action === 'add' ? 'added' : 'withdrawn'} successfully`,
      validator: updatedValidator,
      oldStake: currentStake,
      newStake: newStake
    });
  } catch (error) {
    console.error('Error updating stake:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Distribute rewards to validator
router.post('/:validatorId/distribute-rewards', authenticate, async (req, res) => {
  try {
    const { amount } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid reward amount' });
    }

    const validators = await db.getChainValidators(req.params.validatorId);
    const validator = validators.find(v => v.id === req.params.validatorId);
    
    if (!validator) {
      return res.status(404).json({ message: 'Validator not found' });
    }

    const chain = await db.getChainById(validator.chain_id);
    
    if (chain.user_id !== req.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const currentRewards = parseFloat(validator.rewards_earned) || 0;
    const newRewards = currentRewards + parseFloat(amount);

    const updatedValidator = await db.updateValidator(req.params.validatorId, {
      rewards_earned: newRewards
    });

    await db.createChainEvent({
      chain_id: validator.chain_id,
      event_type: 'validator_rewarded',
      description: `Validator ${validator.name} received ${amount} rewards`,
      triggered_by: req.userId,
      data: { 
        validator_id: req.params.validatorId,
        amount,
        old_rewards: currentRewards,
        new_rewards: newRewards
      }
    });

    res.json({ 
      message: 'Rewards distributed successfully',
      validator: updatedValidator,
      rewardsAdded: amount,
      totalRewards: newRewards
    });
  } catch (error) {
    console.error('Error distributing rewards:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get validator performance
router.get('/:validatorId/performance', authenticate, async (req, res) => {
  try {
    const validators = await db.getChainValidators(req.params.validatorId);
    const validator = validators.find(v => v.id === req.params.validatorId);
    
    if (!validator) {
      return res.status(404).json({ message: 'Validator not found' });
    }

    const chain = await db.getChainById(validator.chain_id);
    
    if (chain.user_id !== req.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Calculate performance metrics
    const totalBlocks = validator.total_blocks_produced + validator.missed_blocks;
    const successRate = totalBlocks > 0 
      ? ((validator.total_blocks_produced / totalBlocks) * 100).toFixed(2)
      : 100;

    const performance = {
      validator_id: validator.id,
      name: validator.name,
      address: validator.address,
      status: validator.status,
      uptime_percentage: validator.uptime_percentage,
      stake_amount: validator.stake_amount,
      rewards_earned: validator.rewards_earned,
      total_blocks_produced: validator.total_blocks_produced,
      missed_blocks: validator.missed_blocks,
      success_rate: successRate,
      is_genesis: validator.is_genesis,
      activated_at: validator.activated_at,
      last_active_at: validator.last_active_at
    };

    res.json({ performance });
  } catch (error) {
    console.error('Error fetching validator performance:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Slash validator
router.post('/:validatorId/slash', authenticate, async (req, res) => {
  try {
    const { percentage, reason } = req.body;
    
    if (!percentage || percentage <= 0 || percentage > 100) {
      return res.status(400).json({ message: 'Invalid slash percentage. Must be between 1 and 100' });
    }

    // Get validator by ID directly instead of querying chain validators
    const validator = await db.getValidatorById(req.params.validatorId);
    
    if (!validator) {
      return res.status(404).json({ message: 'Validator not found' });
    }

    const chain = await db.getChainById(validator.chain_id);
    
    if (chain.user_id !== req.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (validator.is_genesis) {
      return res.status(400).json({ message: 'Cannot slash genesis validator' });
    }

    const currentStake = parseFloat(validator.stake_amount) || 0;
    const slashAmount = currentStake * (parseFloat(percentage) / 100);
    const newStake = currentStake - slashAmount;

    // Update validator with slashed status and reduced stake
    const updatedValidator = await db.updateValidator(req.params.validatorId, {
      stake_amount: newStake,
      status: percentage >= 100 ? 'slashed' : validator.status,
      slashed_at: new Date().toISOString()
    });

    // Log the slashing event
    await db.createChainEvent({
      chain_id: validator.chain_id,
      event_type: 'validator_slashed',
      description: `Validator ${validator.name} slashed by ${percentage}%`,
      triggered_by: req.userId,
      data: { 
        validator_id: req.params.validatorId,
        percentage,
        reason,
        old_stake: currentStake,
        slash_amount: slashAmount,
        new_stake: newStake
      }
    });

    res.json({ 
      message: `Validator slashed by ${percentage}%`,
      validator: updatedValidator,
      slashDetails: {
        percentage,
        reason,
        slashedAmount: slashAmount,
        oldStake: currentStake,
        newStake: newStake
      }
    });
  } catch (error) {
    console.error('Error slashing validator:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update validator status (activate/deactivate)
router.post('/:validatorId/status', authenticate, async (req, res) => {
  try {
    const { status } = req.body; // 'active' or 'inactive'
    
    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Use "active" or "inactive"' });
    }

    const validators = await db.getChainValidators(req.params.validatorId);
    const validator = validators.find(v => v.id === req.params.validatorId);
    
    if (!validator) {
      return res.status(404).json({ message: 'Validator not found' });
    }

    const chain = await db.getChainById(validator.chain_id);
    
    if (chain.user_id !== req.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const updates = { status };
    
    if (status === 'active') {
      updates.activated_at = new Date().toISOString();
    } else {
      updates.deactivated_at = new Date().toISOString();
    }

    const updatedValidator = await db.updateValidator(req.params.validatorId, updates);

    await db.createChainEvent({
      chain_id: validator.chain_id,
      event_type: status === 'active' ? 'validator_activated' : 'validator_deactivated',
      description: `Validator ${validator.name} ${status === 'active' ? 'activated' : 'deactivated'}`,
      triggered_by: req.userId,
      data: { validator_id: req.params.validatorId }
    });

    res.json({ 
      message: `Validator ${status === 'active' ? 'activated' : 'deactivated'} successfully`,
      validator: updatedValidator
    });
  } catch (error) {
    console.error('Error updating validator status:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

