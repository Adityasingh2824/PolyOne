const winston = require('winston');
const { ethers } = require('ethers');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/liquidity.log' })
  ]
});

const SHARED_LIQUIDITY_CONTRACT = process.env.SHARED_LIQUIDITY_CONTRACT || null;
const RPC_URL = process.env.POLYGON_AMOY_RPC || process.env.RPC_URL || 'https://rpc-amoy.polygon.technology';

const POOL_ABI = [
  'function getPoolBalance(address _token, uint256 _destinationChainId) external view returns (uint256 totalDeposited, uint256 totalUsed, uint256 available)',
  'function getPoolId(address _token, uint256 _destinationChainId) external pure returns (bytes32)'
];

/**
 * Get shared liquidity pool balance from contract (if deployed)
 * @param {string} tokenAddress - Token contract address
 * @param {number} destinationChainId - Destination chain ID
 * @returns {Promise<{ totalDeposited: string, totalUsed: string, available: string } | null>}
 */
async function getPoolBalance(tokenAddress, destinationChainId) {
  if (!SHARED_LIQUIDITY_CONTRACT) {
    logger.debug('Shared liquidity contract not configured');
    return null;
  }
  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const contract = new ethers.Contract(SHARED_LIQUIDITY_CONTRACT, POOL_ABI, provider);
    const [totalDeposited, totalUsed, available] = await contract.getPoolBalance(tokenAddress, destinationChainId);
    return {
      totalDeposited: totalDeposited.toString(),
      totalUsed: totalUsed.toString(),
      available: available.toString()
    };
  } catch (error) {
    logger.warn(`Failed to get pool balance: ${error.message}`);
    return null;
  }
}

/**
 * List known shared liquidity pools (from config or return empty with contract status)
 */
function getPoolsConfig() {
  const pools = process.env.SHARED_LIQUIDITY_POOLS ? JSON.parse(process.env.SHARED_LIQUIDITY_POOLS) : [];
  return {
    contractAddress: SHARED_LIQUIDITY_CONTRACT,
    pools: Array.isArray(pools) ? pools : []
  };
}

module.exports = {
  getPoolBalance,
  getPoolsConfig,
  isContractConfigured: () => !!SHARED_LIQUIDITY_CONTRACT
};
