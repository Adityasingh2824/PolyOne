const axios = require('axios');
const winston = require('winston');
const { ethers } = require('ethers');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/bridge.log' })
  ]
});

/**
 * Polygon PoS Bridge Service
 * Handles cross-chain token transfers between appchains and Polygon PoS
 */

const POLYGON_POS_RPC = process.env.POLYGON_POS_RPC || 'https://polygon-rpc.com';
const POLYGON_POS_TESTNET_RPC = process.env.POLYGON_POS_TESTNET_RPC || 'https://rpc-amoy.polygon.technology';
const BRIDGE_CONTRACT = process.env.POLYGON_BRIDGE_CONTRACT || '0x...';

/**
 * Setup bridge connection between appchain and Polygon PoS
 * @param {string} chainId - Appchain identifier
 * @param {object} chainConfig - Chain configuration
 * @returns {Promise<object>} Bridge setup result
 */
async function setupPolygonBridge(chainId, chainConfig) {
  logger.info(`Setting up Polygon PoS bridge for chain ${chainId}`);
  
  try {
    const bridgeConfig = {
      chainId,
      sourceChain: {
        chainId: chainConfig.chainId,
        rpcUrl: chainConfig.rpcUrl,
        name: chainConfig.name
      },
      destinationChain: {
        chainId: 80002, // Polygon Amoy testnet
        rpcUrl: POLYGON_POS_TESTNET_RPC,
        name: 'Polygon Amoy'
      },
      bridgeAddress: chainConfig.bridgeAddress || '0x...',
      polygonBridgeAddress: BRIDGE_CONTRACT,
      supportedTokens: [chainConfig.gasToken, 'MATIC', 'ETH'],
      minBridgeAmount: '0.01',
      maxBridgeAmount: '1000000',
      bridgeFee: '0.001',
      confirmationBlocks: 12
    };

    // Save bridge configuration
    const fs = require('fs').promises;
    const path = require('path');
    const chainDir = path.join(process.cwd(), 'chains', chainId);
    await fs.mkdir(chainDir, { recursive: true });
    await fs.writeFile(
      path.join(chainDir, 'bridge-config.json'),
      JSON.stringify(bridgeConfig, null, 2)
    );

    logger.info(`Bridge configuration created for chain ${chainId}`);
    
    return {
      success: true,
      bridgeConfig,
      endpoints: {
        bridgeUrl: `https://bridge-${chainId.substring(0, 8)}.polyone.io`,
        polygonPosRpc: POLYGON_POS_TESTNET_RPC,
        appchainRpc: chainConfig.rpcUrl
      }
    };
  } catch (error) {
    logger.error(`Failed to setup bridge for chain ${chainId}:`, error);
    throw error;
  }
}

/**
 * Initiate a bridge transfer from appchain to Polygon PoS
 * @param {string} chainId - Appchain identifier
 * @param {object} transferData - Transfer details
 * @returns {Promise<object>} Transfer result
 */
async function bridgeToPolygon(chainId, transferData) {
  logger.info(`Initiating bridge transfer from ${chainId} to Polygon PoS`);
  
  try {
    const { amount, token, recipient, privateKey } = transferData;
    
    // Get bridge configuration
    const fs = require('fs').promises;
    const path = require('path');
    const chainDir = path.join(process.cwd(), 'chains', chainId);
    const bridgeConfigPath = path.join(chainDir, 'bridge-config.json');
    
    let bridgeConfig;
    try {
      const configData = await fs.readFile(bridgeConfigPath, 'utf8');
      bridgeConfig = JSON.parse(configData);
    } catch {
      throw new Error('Bridge configuration not found');
    }

    // Connect to appchain
    const appchainProvider = new ethers.JsonRpcProvider(bridgeConfig.sourceChain.rpcUrl);
    const wallet = new ethers.Wallet(privateKey, appchainProvider);

    // Bridge contract ABI (simplified)
    const bridgeABI = [
      "function bridgeTokens(address token, uint256 amount, address recipient, uint256 destinationChainId) external returns (bytes32)",
      "function getBridgeFee(uint256 amount) external view returns (uint256)"
    ];

    const bridgeContract = new ethers.Contract(bridgeConfig.bridgeAddress, bridgeABI, wallet);

    // Get bridge fee
    const bridgeFee = await bridgeContract.getBridgeFee(ethers.parseEther(amount));

    // Approve token transfer (if ERC20)
    if (token !== 'MATIC') {
      const tokenABI = ["function approve(address spender, uint256 amount) external returns (bool)"];
      const tokenContract = new ethers.Contract(token, tokenABI, wallet);
      const approveTx = await tokenContract.approve(
        bridgeConfig.bridgeAddress,
        ethers.parseEther(amount)
      );
      await approveTx.wait();
    }

    // Execute bridge transfer
    const bridgeTx = await bridgeContract.bridgeTokens(
      token === 'MATIC' ? ethers.ZeroAddress : token,
      ethers.parseEther(amount),
      recipient,
      bridgeConfig.destinationChain.chainId
    );

    const receipt = await bridgeTx.wait();

    return {
      success: true,
      txHash: receipt.transactionHash,
      bridgeId: receipt.logs[0]?.topics[1] || `bridge-${Date.now()}`,
      amount,
      token,
      recipient,
      status: 'pending',
      estimatedConfirmation: receipt.blockNumber + bridgeConfig.confirmationBlocks
    };
  } catch (error) {
    logger.error(`Bridge transfer failed: ${error.message}`);
    throw error;
  }
}

/**
 * Get bridge status and pending transfers
 * @param {string} chainId - Appchain identifier
 * @returns {Promise<object>} Bridge status
 */
async function getBridgeStatus(chainId) {
  try {
    const fs = require('fs').promises;
    const path = require('path');
    const chainDir = path.join(process.cwd(), 'chains', chainId);
    const bridgeConfigPath = path.join(chainDir, 'bridge-config.json');
    
    let bridgeConfig;
    try {
      const configData = await fs.readFile(bridgeConfigPath, 'utf8');
      bridgeConfig = JSON.parse(configData);
    } catch {
      return {
        connected: false,
        error: 'Bridge configuration not found'
      };
    }

    // Check connectivity to both chains
    const appchainProvider = new ethers.JsonRpcProvider(bridgeConfig.sourceChain.rpcUrl);
    const polygonProvider = new ethers.JsonRpcProvider(bridgeConfig.destinationChain.rpcUrl);

    const [appchainBlock, polygonBlock] = await Promise.all([
      appchainProvider.getBlockNumber().catch(() => null),
      polygonProvider.getBlockNumber().catch(() => null)
    ]);

    return {
      connected: appchainBlock !== null && polygonBlock !== null,
      appchain: {
        chainId: bridgeConfig.sourceChain.chainId,
        latestBlock: appchainBlock,
        connected: appchainBlock !== null
      },
      polygonPos: {
        chainId: bridgeConfig.destinationChain.chainId,
        latestBlock: polygonBlock,
        connected: polygonBlock !== null
      },
      bridgeAddress: bridgeConfig.bridgeAddress,
      supportedTokens: bridgeConfig.supportedTokens,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    logger.error(`Failed to get bridge status: ${error.message}`);
    return {
      connected: false,
      error: error.message
    };
  }
}

/**
 * Get bridge transaction history
 * @param {string} chainId - Appchain identifier
 * @param {number} limit - Number of transactions to retrieve
 * @returns {Promise<array>} Bridge transactions
 */
async function getBridgeTransactions(chainId, limit = 20) {
  try {
    // Get bridge configuration
    const fs = require('fs').promises;
    const path = require('path');
    const chainDir = path.join(process.cwd(), 'chains', chainId);
    const bridgeConfigPath = path.join(chainDir, 'bridge-config.json');
    
    let bridgeConfig;
    try {
      const configData = await fs.readFile(bridgeConfigPath, 'utf8');
      bridgeConfig = JSON.parse(configData);
    } catch {
      logger.warn(`Bridge configuration not found for chain ${chainId}`);
      return [];
    }

    // Query bridge contract events
    if (bridgeConfig.bridgeAddress && bridgeConfig.bridgeAddress !== '0x...') {
      try {
        const provider = new ethers.JsonRpcProvider(bridgeConfig.sourceChain.rpcUrl);
        const bridgeABI = [
          "event BridgeTransfer(address indexed from, address indexed to, uint256 amount, bytes32 indexed txHash)",
          "function getBridgeHistory(uint256 limit) external view returns (tuple(address from, address to, uint256 amount, bytes32 txHash, uint256 timestamp)[])"
        ];
        
        const bridgeContract = new ethers.Contract(bridgeConfig.bridgeAddress, bridgeABI, provider);
        
        // Try to get history from contract if available
        try {
          const history = await bridgeContract.getBridgeHistory(limit);
          return history.map((tx, i) => ({
            id: `bridge-tx-${chainId}-${i}`,
            txHash: tx.txHash,
            amount: ethers.formatEther(tx.amount),
            token: 'MATIC',
            from: tx.from,
            to: tx.to,
            status: 'completed',
            timestamp: new Date(Number(tx.timestamp) * 1000).toISOString()
          }));
        } catch {
          // If getBridgeHistory not available, query events
          const filter = bridgeContract.filters.BridgeTransfer();
          const events = await bridgeContract.queryFilter(filter, -limit);
          
          return events.map((event, i) => ({
            id: `bridge-tx-${chainId}-${i}`,
            txHash: event.transactionHash,
            amount: ethers.formatEther(event.args.amount),
            token: 'MATIC',
            from: event.args.from,
            to: event.args.to,
            status: 'completed',
            timestamp: new Date().toISOString()
          }));
        }
      } catch (contractError) {
        logger.warn(`Failed to query bridge contract: ${contractError.message}`);
        // Return empty array instead of simulated data
        return [];
      }
    }
    
    // No bridge contract configured
    return [];
  } catch (error) {
    logger.error(`Failed to get bridge transactions: ${error.message}`);
    return [];
  }
}

module.exports = {
  setupPolygonBridge,
  bridgeToPolygon,
  getBridgeStatus,
  getBridgeTransactions
};
















