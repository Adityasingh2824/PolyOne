const { ethers } = require('ethers')
require('dotenv').config()

// Contract addresses from environment
const CONTRACT_ADDRESSES = {
  CHAIN_FACTORY: process.env.CHAIN_FACTORY_ADDRESS || process.env.NEXT_PUBLIC_CHAIN_FACTORY_ADDRESS || '',
  VALIDATOR_REGISTRY: process.env.VALIDATOR_REGISTRY_ADDRESS || process.env.NEXT_PUBLIC_VALIDATOR_REGISTRY_ADDRESS || '',
  BRIDGE: process.env.BRIDGE_ADDRESS || process.env.NEXT_PUBLIC_BRIDGE_ADDRESS || '',
  BILLING: process.env.BILLING_ADDRESS || process.env.NEXT_PUBLIC_BILLING_ADDRESS || '',
}

// Contract ABIs (minimal interfaces for backend)
const POLYONE_CHAIN_FACTORY_ABI = [
  "function createChain(string memory _name, string memory _chainType, string memory _rollupType, string memory _gasToken, uint256 _validators, string memory _rpcUrl, string memory _explorerUrl) external returns (uint256)",
  "function getChain(uint256 _chainId) external view returns (tuple(uint256 id, address owner, string name, string chainType, string rollupType, string gasToken, uint256 validators, uint256 createdAt, bool isActive, string rpcUrl, string explorerUrl, uint8 status))",
  "function getUserChains(address _user) external view returns (uint256[])",
  "function getTotalChains() external view returns (uint256)",
  "function pauseChain(uint256 _chainId) external",
  "function resumeChain(uint256 _chainId) external",
  "function upgradeChain(uint256 _chainId, string memory _newVersion) external",
  "function scaleChain(uint256 _chainId, uint256 _newValidatorCount) external",
  "function deleteChain(uint256 _chainId) external",
  "event ChainCreated(uint256 indexed chainId, address indexed owner, string name, string chainType, string rollupType)",
  "event ChainStatusUpdated(uint256 indexed chainId, uint8 oldStatus, uint8 newStatus)"
]

const VALIDATOR_REGISTRY_ABI = [
  "function registerValidator(uint256 _chainId, string memory _name, address _validatorAddress, bytes memory _publicKey) external returns (uint256)",
  "function updateValidatorStatus(uint256 _validatorId, uint8 _status) external",
  "function stakeValidator(uint256 _validatorId, uint256 _amount) external payable",
  "function withdrawStake(uint256 _validatorId, uint256 _amount) external",
  "function distributeRewards(uint256 _validatorId, uint256 _amount) external",
  "function slashValidator(uint256 _validatorId, uint256 _slashAmount, string memory _reason) external",
  "function getValidator(uint256 _validatorId) external view returns (tuple(uint256 id, address owner, uint256 chainId, string name, address validatorAddress, bytes publicKey, uint8 status, uint256 stakeAmount, uint256 rewardsEarned, uint256 totalBlocksProduced, uint256 missedBlocks, uint256 uptimePercentage, uint256 activatedAt, uint256 deactivatedAt, uint256 slashedAt))",
  "function getChainValidators(uint256 _chainId) external view returns (uint256[])",
  "event ValidatorRegistered(uint256 indexed validatorId, uint256 indexed chainId, address indexed owner, string name)"
]

const POLYONE_BRIDGE_ABI = [
  "function deposit(address _token, uint256 _amount, uint256 _destinationChainId, address _receiver) external payable returns (uint256)",
  "function claim(uint256 _transactionId, bytes memory _merkleProof) external",
  "function getTransaction(uint256 _transactionId) external view returns (tuple(uint256 id, address sender, address receiver, address tokenAddress, uint256 amount, uint256 sourceChainId, uint256 destinationChainId, uint8 status, uint256 createdAt, uint256 completedAt, bytes merkleProof))",
  "function getBridgeFee(uint256 _amount, uint256 _sourceChainId, uint256 _destinationChainId) external view returns (uint256)"
]

const POLYONE_BILLING_ABI = [
  "function subscribe(uint256 _planId, bool _autoRenew) external payable returns (uint256)",
  "function cancelSubscription(uint256 _subscriptionId) external",
  "function getSubscription(uint256 _subscriptionId) external view returns (tuple(uint256 id, address subscriber, uint256 planId, uint256 startTime, uint256 endTime, bool isActive, bool autoRenew))",
  "function getInvoice(uint256 _invoiceId) external view returns (tuple(uint256 id, uint256 subscriptionId, address subscriber, string invoiceNumber, uint256 subtotal, uint256 tax, uint256 discount, uint256 total, uint256 amountDue, uint256 amountPaid, uint256 periodStart, uint256 periodEnd, uint256 dueDate, uint256 paidAt, bool isPaid, uint256 createdAt))"
]

/**
 * Get provider instance
 */
function getProvider() {
  const rpcUrl = process.env.POLYGON_AMOY_RPC_URL || process.env.POLYGON_RPC_URL || 'https://rpc-amoy.polygon.technology'
  return new ethers.JsonRpcProvider(rpcUrl)
}

/**
 * Get signer instance (for admin operations)
 */
function getSigner() {
  if (!process.env.PRIVATE_KEY) {
    throw new Error('PRIVATE_KEY not configured in environment')
  }
  const provider = getProvider()
  return new ethers.Wallet(process.env.PRIVATE_KEY, provider)
}

/**
 * Get contract instance
 */
function getContract(address, abi, providerOrSigner) {
  if (!address) {
    throw new Error('Contract address not configured')
  }
  return new ethers.Contract(address, abi, providerOrSigner)
}

/**
 * Get ChainFactory contract instance
 */
function getChainFactoryContract(useSigner = false) {
  const address = CONTRACT_ADDRESSES.CHAIN_FACTORY
  if (!address) {
    throw new Error('CHAIN_FACTORY_ADDRESS not configured')
  }
  const providerOrSigner = useSigner ? getSigner() : getProvider()
  return getContract(address, POLYONE_CHAIN_FACTORY_ABI, providerOrSigner)
}

/**
 * Get ValidatorRegistry contract instance
 */
function getValidatorRegistryContract(useSigner = false) {
  const address = CONTRACT_ADDRESSES.VALIDATOR_REGISTRY
  if (!address) {
    throw new Error('VALIDATOR_REGISTRY_ADDRESS not configured')
  }
  const providerOrSigner = useSigner ? getSigner() : getProvider()
  return getContract(address, VALIDATOR_REGISTRY_ABI, providerOrSigner)
}

/**
 * Get Bridge contract instance
 */
function getBridgeContract(useSigner = false) {
  const address = CONTRACT_ADDRESSES.BRIDGE
  if (!address) {
    throw new Error('BRIDGE_ADDRESS not configured')
  }
  const providerOrSigner = useSigner ? getSigner() : getProvider()
  return getContract(address, POLYONE_BRIDGE_ABI, providerOrSigner)
}

/**
 * Get Billing contract instance
 */
function getBillingContract(useSigner = false) {
  const address = CONTRACT_ADDRESSES.BILLING
  if (!address) {
    throw new Error('BILLING_ADDRESS not configured')
  }
  const providerOrSigner = useSigner ? getSigner() : getProvider()
  return getContract(address, POLYONE_BILLING_ABI, providerOrSigner)
}

module.exports = {
  getProvider,
  getSigner,
  getContract,
  getChainFactoryContract,
  getValidatorRegistryContract,
  getBridgeContract,
  getBillingContract,
  CONTRACT_ADDRESSES,
}

