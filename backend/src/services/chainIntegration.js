const { getChainFactoryContract } = require('./contracts');
const db = require('./database');
const { ethers } = require('ethers');

/**
 * Sync on-chain chain data with database
 */
async function syncChainFromBlockchain(chainId, userAddress) {
  try {
    const contract = getChainFactoryContract(false); // Read-only
    if (!contract) {
      throw new Error('ChainFactory contract not configured');
    }

    // Get chain data from smart contract
    const chainData = await contract.getChain(chainId);
    
    if (!chainData || chainData.id === 0n) {
      throw new Error('Chain not found on blockchain');
    }

    // Convert BigInt values to numbers/strings
    const chainInfo = {
      id: chainId.toString(),
      user_id: userAddress.toLowerCase(),
      name: chainData.name,
      chain_type: chainData.chainType,
      rollup_type: chainData.rollupType,
      gas_token: chainData.gasToken,
      validator_count: Number(chainData.validators),
      status: getStatusFromChainData(chainData),
      rpc_url: chainData.rpcUrl,
      explorer_url: chainData.explorerUrl,
      bridge_url: chainData.bridgeUrl || null,
      agglayer_chain_id: chainData.agglayerChainId ? Number(chainData.agglayerChainId) : null,
      deployed_at: chainData.deployedAt && Number(chainData.deployedAt) > 0 
        ? new Date(Number(chainData.deployedAt) * 1000).toISOString() 
        : null,
      created_at: chainData.createdAt && Number(chainData.createdAt) > 0
        ? new Date(Number(chainData.createdAt) * 1000).toISOString()
        : new Date().toISOString(),
      updated_at: new Date().toISOString(),
      blockchain_tx_hash: null, // Will be set from events
      blockchain_chain_id: null, // Will be set from events
      metadata: {
        onChainId: chainId.toString(),
        owner: chainData.owner,
        createdAt: Number(chainData.createdAt),
        isActive: chainData.isActive
      }
    };

    // Check if chain exists in database
    const existingChain = await db.getChainById(chainId.toString());
    
    if (existingChain) {
      // Update existing chain
      await db.updateChain(chainId.toString(), chainInfo);
      return { ...existingChain, ...chainInfo };
    } else {
      // Create new chain in database
      const newChain = await db.createChain(chainInfo);
      return newChain;
    }
  } catch (error) {
    console.error('Error syncing chain from blockchain:', error);
    throw error;
  }
}

/**
 * Get user's chains from blockchain and sync with database
 */
async function syncUserChainsFromBlockchain(userAddress) {
  try {
    const contract = getChainFactoryContract(false);
    if (!contract) {
      console.warn('ChainFactory contract not configured, skipping blockchain sync');
      return [];
    }

    // Get chain IDs from smart contract
    const chainIds = await contract.getUserChains(userAddress);
    
    if (!chainIds || chainIds.length === 0) {
      return [];
    }

    // Sync each chain
    const syncedChains = [];
    for (const chainId of chainIds) {
      try {
        const chain = await syncChainFromBlockchain(chainId, userAddress);
        syncedChains.push(chain);
      } catch (error) {
        console.error(`Error syncing chain ${chainId}:`, error);
        // Continue with other chains
      }
    }

    return syncedChains;
  } catch (error) {
    console.error('Error syncing user chains from blockchain:', error);
    return [];
  }
}

/**
 * Create chain on blockchain and in database
 */
async function createChainOnBlockchain(chainData, signer) {
  try {
    const contract = getChainFactoryContract(true); // Use signer for write operations
    if (!contract) {
      throw new Error('ChainFactory contract not configured');
    }

    // Connect contract with signer
    const contractWithSigner = contract.connect(signer);

    // Call createChain on smart contract
    const tx = await contractWithSigner.createChain(
      chainData.name,
      chainData.chainType,
      chainData.rollupType,
      chainData.gasToken,
      chainData.validators,
      chainData.rpcUrl,
      chainData.explorerUrl
    );

    // Wait for transaction
    const receipt = await tx.wait();

    // Get chain ID from event
    const chainCreatedEvent = receipt.logs.find(log => {
      try {
        const parsed = contract.interface.parseLog(log);
        return parsed && parsed.name === 'ChainCreated';
      } catch {
        return false;
      }
    });

    if (!chainCreatedEvent) {
      throw new Error('ChainCreated event not found in transaction receipt');
    }

    const parsedEvent = contract.interface.parseLog(chainCreatedEvent);
    const onChainChainId = parsedEvent.args.chainId;

    return {
      txHash: receipt.hash,
      chainId: onChainChainId.toString(),
      blockNumber: receipt.blockNumber
    };
  } catch (error) {
    console.error('Error creating chain on blockchain:', error);
    throw error;
  }
}

/**
 * Get chain status from smart contract data
 */
function getStatusFromChainData(chainData) {
  // Map smart contract status enum to database status
  if (chainData.status !== undefined) {
    const statusMap = {
      0: 'deploying',
      1: 'active',
      2: 'paused',
      3: 'upgrading',
      4: 'maintenance',
      5: 'failed',
      6: 'deleted'
    };
    return statusMap[Number(chainData.status)] || 'unknown';
  }
  
  // Fallback to isActive
  return chainData.isActive ? 'active' : 'inactive';
}

/**
 * Update chain status on blockchain
 */
async function updateChainStatusOnBlockchain(chainId, action, signer) {
  try {
    const contract = getChainFactoryContract(true);
    if (!contract) {
      throw new Error('ChainFactory contract not configured');
    }

    const contractWithSigner = contract.connect(signer);
    let tx;

    switch (action) {
      case 'pause':
        tx = await contractWithSigner.pauseChain(chainId);
        break;
      case 'resume':
        tx = await contractWithSigner.resumeChain(chainId);
        break;
      case 'delete':
        tx = await contractWithSigner.deleteChain(chainId);
        break;
      default:
        throw new Error(`Unknown action: ${action}`);
    }

    const receipt = await tx.wait();
    return {
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber
    };
  } catch (error) {
    console.error(`Error ${action}ing chain on blockchain:`, error);
    throw error;
  }
}

/**
 * Get chain from blockchain
 */
async function getChainFromBlockchain(chainId) {
  try {
    const contract = getChainFactoryContract(false);
    if (!contract) {
      throw new Error('ChainFactory contract not configured');
    }

    const chainData = await contract.getChain(chainId);
    
    if (!chainData || chainData.id === 0n) {
      return null;
    }

    return {
      id: chainId.toString(),
      name: chainData.name,
      chainType: chainData.chainType,
      rollupType: chainData.rollupType,
      gasToken: chainData.gasToken,
      validators: Number(chainData.validators),
      status: getStatusFromChainData(chainData),
      rpcUrl: chainData.rpcUrl,
      explorerUrl: chainData.explorerUrl,
      owner: chainData.owner,
      createdAt: Number(chainData.createdAt),
      isActive: chainData.isActive
    };
  } catch (error) {
    console.error('Error getting chain from blockchain:', error);
    throw error;
  }
}

module.exports = {
  syncChainFromBlockchain,
  syncUserChainsFromBlockchain,
  createChainOnBlockchain,
  updateChainStatusOnBlockchain,
  getChainFromBlockchain,
  getStatusFromChainData
};

