const winston = require('winston');
const { ethers } = require('ethers');
const fs = require('fs').promises;
const path = require('path');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/l2-bridge.log' })
  ]
});

/**
 * L2 network configurations for bridge adapters
 * Chain IDs and public RPCs for major Layer-2 ecosystems
 */
const L2_NETWORKS = {
  polygon: {
    id: 'polygon',
    chainId: 80002,
    chainIdMainnet: 137,
    rpcUrl: process.env.POLYGON_POS_TESTNET_RPC || 'https://rpc-amoy.polygon.technology',
    rpcUrlMainnet: process.env.POLYGON_POS_RPC || 'https://polygon-rpc.com',
    name: 'Polygon Amoy',
    nameMainnet: 'Polygon PoS',
    symbol: 'MATIC'
  },
  arbitrum: {
    id: 'arbitrum',
    chainId: 42161,
    rpcUrl: process.env.ARBITRUM_RPC || 'https://arb1.arbitrum.io/rpc',
    name: 'Arbitrum One',
    symbol: 'ETH'
  },
  optimism: {
    id: 'optimism',
    chainId: 10,
    rpcUrl: process.env.OPTIMISM_RPC || 'https://mainnet.optimism.io',
    name: 'OP Mainnet',
    symbol: 'ETH'
  },
  base: {
    id: 'base',
    chainId: 8453,
    rpcUrl: process.env.BASE_RPC || 'https://mainnet.base.org',
    name: 'Base',
    symbol: 'ETH'
  }
};

/**
 * Setup bridge config for appchain to a specific L2
 * @param {string} chainId - Appchain identifier
 * @param {object} chainConfig - Chain configuration (rpcUrl, name, chainId, etc.)
 * @param {string} l2NetworkId - One of: polygon, arbitrum, optimism, base
 */
async function setupL2Bridge(chainId, chainConfig, l2NetworkId) {
  const l2 = L2_NETWORKS[l2NetworkId];
  if (!l2) {
    throw new Error(`Unknown L2 network: ${l2NetworkId}. Supported: ${Object.keys(L2_NETWORKS).join(', ')}`);
  }

  logger.info(`Setting up ${l2.name} bridge for chain ${chainId}`);

  const bridgeConfig = {
    chainId,
    l2NetworkId: l2.id,
    sourceChain: {
      chainId: chainConfig.chainId,
      rpcUrl: chainConfig.rpcUrl,
      name: chainConfig.name
    },
    destinationChain: {
      chainId: l2.chainId,
      rpcUrl: l2.rpcUrl,
      name: l2.name
    },
    bridgeAddress: chainConfig.bridgeAddress || '0x...',
    l2BridgeAddress: process.env[`${l2NetworkId.toUpperCase()}_BRIDGE_CONTRACT`] || '0x...',
    supportedTokens: [chainConfig.gasToken, l2.symbol, 'ETH'].filter(Boolean),
    minBridgeAmount: '0.01',
    maxBridgeAmount: '1000000',
    bridgeFee: '0.001',
    confirmationBlocks: 12
  };

  const chainDir = path.join(process.cwd(), 'chains', chainId);
  await fs.mkdir(chainDir, { recursive: true });
  const configPath = path.join(chainDir, `bridge-config-${l2NetworkId}.json`);
  await fs.writeFile(configPath, JSON.stringify(bridgeConfig, null, 2));

  logger.info(`Bridge config created for ${l2.name}: ${configPath}`);

  return {
    success: true,
    bridgeConfig,
    l2Network: l2,
    endpoints: {
      bridgeUrl: `https://bridge-${l2NetworkId}-${chainId.substring(0, 8)}.polyone.io`,
      l2Rpc: l2.rpcUrl,
      appchainRpc: chainConfig.rpcUrl
    }
  };
}

/**
 * Get bridge status between appchain and an L2
 * @param {string} chainId - Appchain identifier
 * @param {string} l2NetworkId - polygon, arbitrum, optimism, base
 */
async function getL2BridgeStatus(chainId, l2NetworkId) {
  const l2 = L2_NETWORKS[l2NetworkId];
  if (!l2) {
    return { connected: false, error: `Unknown L2: ${l2NetworkId}` };
  }

  const configPath = path.join(process.cwd(), 'chains', chainId, `bridge-config-${l2NetworkId}.json`);
  let bridgeConfig;
  try {
    const data = await fs.readFile(configPath, 'utf8');
    bridgeConfig = JSON.parse(data);
  } catch {
    return {
      connected: false,
      error: 'Bridge configuration not found',
      l2NetworkId,
      l2Name: l2.name
    };
  }

  try {
    const appchainProvider = new ethers.JsonRpcProvider(bridgeConfig.sourceChain.rpcUrl);
    const l2Provider = new ethers.JsonRpcProvider(bridgeConfig.destinationChain.rpcUrl);

    const [appchainBlock, l2Block] = await Promise.all([
      appchainProvider.getBlockNumber().catch(() => null),
      l2Provider.getBlockNumber().catch(() => null)
    ]);

    return {
      connected: appchainBlock !== null && l2Block !== null,
      appchain: {
        chainId: bridgeConfig.sourceChain.chainId,
        latestBlock: appchainBlock,
        connected: appchainBlock !== null
      },
      l2: {
        id: l2NetworkId,
        name: l2.name,
        chainId: l2.chainId,
        latestBlock: l2Block,
        connected: l2Block !== null
      },
      bridgeAddress: bridgeConfig.bridgeAddress,
      supportedTokens: bridgeConfig.supportedTokens,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    logger.error(`Failed to get ${l2NetworkId} bridge status: ${error.message}`);
    return {
      connected: false,
      error: error.message,
      l2NetworkId,
      l2Name: l2.name
    };
  }
}

/**
 * Initiate bridge transfer from appchain to L2
 * @param {string} chainId - Appchain identifier
 * @param {string} l2NetworkId - polygon, arbitrum, optimism, base
 * @param {object} transferData - { amount, token, recipient, privateKey }
 */
async function bridgeToL2(chainId, l2NetworkId, transferData) {
  const l2 = L2_NETWORKS[l2NetworkId];
  if (!l2) {
    throw new Error(`Unknown L2 network: ${l2NetworkId}`);
  }

  const configPath = path.join(process.cwd(), 'chains', chainId, `bridge-config-${l2NetworkId}.json`);
  let bridgeConfig;
  try {
    const data = await fs.readFile(configPath, 'utf8');
    bridgeConfig = JSON.parse(data);
  } catch {
    throw new Error(`Bridge configuration not found for ${l2.name}. Run setup first.`);
  }

  const { amount, token, recipient, privateKey } = transferData;
  const appchainProvider = new ethers.JsonRpcProvider(bridgeConfig.sourceChain.rpcUrl);
  const wallet = new ethers.Wallet(privateKey, appchainProvider);

  const bridgeABI = [
    'function bridgeTokens(address token, uint256 amount, address recipient, uint256 destinationChainId) external returns (bytes32)',
    'function getBridgeFee(uint256 amount) external view returns (uint256)'
  ];

  const bridgeContract = new ethers.Contract(bridgeConfig.bridgeAddress, bridgeABI, wallet);
  const fee = await bridgeContract.getBridgeFee(ethers.parseEther(amount));

  if (token !== l2.symbol && token !== 'ETH') {
    const tokenABI = ['function approve(address spender, uint256 amount) external returns (bool)'];
    const tokenContract = new ethers.Contract(token, tokenABI, wallet);
    await (await tokenContract.approve(bridgeConfig.bridgeAddress, ethers.parseEther(amount))).wait();
  }

  const tx = await bridgeContract.bridgeTokens(
    token === l2.symbol || token === 'ETH' ? ethers.ZeroAddress : token,
    ethers.parseEther(amount),
    recipient,
    l2.chainId
  );
  const receipt = await tx.wait();

  return {
    success: true,
    txHash: receipt.hash,
    l2NetworkId,
    l2Name: l2.name,
    destinationChainId: l2.chainId,
    amount,
    recipient,
    bridgeId: receipt.logs[0]?.topics[1] || `bridge-${Date.now()}`,
    confirmationBlocks: bridgeConfig.confirmationBlocks
  };
}

/**
 * List available L2 adapters
 */
function getL2Adapters() {
  return Object.entries(L2_NETWORKS).map(([id, n]) => ({
    id,
    name: n.name,
    chainId: n.chainId,
    symbol: n.symbol
  }));
}

module.exports = {
  L2_NETWORKS,
  setupL2Bridge,
  getL2BridgeStatus,
  bridgeToL2,
  getL2Adapters
};
