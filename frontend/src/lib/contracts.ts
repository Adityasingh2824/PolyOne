import { ethers } from 'ethers'

// Contract addresses from environment variables
export const CONTRACT_ADDRESSES = {
  CHAIN_FACTORY: process.env.NEXT_PUBLIC_CHAIN_FACTORY_ADDRESS || '',
  VALIDATOR_REGISTRY: process.env.NEXT_PUBLIC_VALIDATOR_REGISTRY_ADDRESS || '',
  BRIDGE: process.env.NEXT_PUBLIC_BRIDGE_ADDRESS || '',
  BILLING: process.env.NEXT_PUBLIC_BILLING_ADDRESS || '',
}

// PolyOneChainFactory ABI (minimal interface for frontend)
export const POLYONE_CHAIN_FACTORY_ABI = [
  // Chain creation
  "function createChain(string memory _name, string memory _chainType, string memory _rollupType, string memory _gasToken, uint256 _validators, string memory _rpcUrl, string memory _explorerUrl) external returns (uint256)",
  "function createChainWithConfig(string memory _name, string memory _chainType, string memory _rollupType, string memory _gasToken, uint256 _validators, string memory _rpcUrl, string memory _explorerUrl, tuple(uint256 maxTps, uint256 blockGasLimit, uint256 blockTime, uint256 finalityPeriod) _config) external returns (uint256)",
  
  // Chain queries
  "function getChain(uint256 _chainId) external view returns (tuple(uint256 id, address owner, string name, string chainType, string rollupType, string gasToken, uint256 validators, uint256 createdAt, bool isActive, string rpcUrl, string explorerUrl, uint8 status))",
  "function getUserChains(address _user) external view returns (uint256[])",
  "function getTotalChains() external view returns (uint256)",
  
  // Chain management
  "function pauseChain(uint256 _chainId) external",
  "function resumeChain(uint256 _chainId) external",
  "function upgradeChain(uint256 _chainId, string memory _newVersion) external",
  "function scaleChain(uint256 _chainId, uint256 _newValidatorCount) external",
  "function deleteChain(uint256 _chainId) external",
  
  // Events
  "event ChainCreated(uint256 indexed chainId, address indexed owner, string name, string chainType, string rollupType)",
  "event ChainStatusUpdated(uint256 indexed chainId, uint8 oldStatus, uint8 newStatus)",
  "event ChainUpgraded(uint256 indexed chainId, string newVersion)",
  "event ChainScaled(uint256 indexed chainId, uint256 oldValidatorCount, uint256 newValidatorCount)",
  "event ChainDeleted(uint256 indexed chainId, address indexed owner)"
]

// ValidatorRegistry ABI
export const VALIDATOR_REGISTRY_ABI = [
  "function registerValidator(uint256 _chainId, string memory _name, address _validatorAddress, bytes memory _publicKey) external returns (uint256)",
  "function updateValidatorStatus(uint256 _validatorId, uint8 _status) external",
  "function stakeValidator(uint256 _validatorId, uint256 _amount) external payable",
  "function withdrawStake(uint256 _validatorId, uint256 _amount) external",
  "function distributeRewards(uint256 _validatorId, uint256 _amount) external",
  "function slashValidator(uint256 _validatorId, uint256 _slashAmount, string memory _reason) external",
  "function getValidator(uint256 _validatorId) external view returns (tuple(uint256 id, address owner, uint256 chainId, string name, address validatorAddress, bytes publicKey, uint8 status, uint256 stakeAmount, uint256 rewardsEarned, uint256 totalBlocksProduced, uint256 missedBlocks, uint256 uptimePercentage, uint256 activatedAt, uint256 deactivatedAt, uint256 slashedAt))",
  "function getChainValidators(uint256 _chainId) external view returns (uint256[])",
  "event ValidatorRegistered(uint256 indexed validatorId, uint256 indexed chainId, address indexed owner, string name)",
  "event ValidatorStatusUpdated(uint256 indexed validatorId, uint8 oldStatus, uint8 newStatus)",
  "event ValidatorStaked(uint256 indexed validatorId, uint256 amount)",
  "event ValidatorRewardsDistributed(uint256 indexed validatorId, uint256 amount)",
  "event ValidatorSlashed(uint256 indexed validatorId, uint256 slashAmount, string reason)"
]

// PolyOneBridge ABI
export const POLYONE_BRIDGE_ABI = [
  "function deposit(address _token, uint256 _amount, uint256 _destinationChainId, address _receiver) external payable returns (uint256)",
  "function claim(uint256 _transactionId, bytes memory _merkleProof) external",
  "function getTransaction(uint256 _transactionId) external view returns (tuple(uint256 id, address sender, address receiver, address tokenAddress, uint256 amount, uint256 sourceChainId, uint256 destinationChainId, uint8 status, uint256 createdAt, uint256 completedAt, bytes merkleProof))",
  "function getBridgeFee(uint256 _amount, uint256 _sourceChainId, uint256 _destinationChainId) external view returns (uint256)",
  "event DepositInitiated(uint256 indexed transactionId, address indexed sender, address indexed receiver, address tokenAddress, uint256 amount, uint256 sourceChainId, uint256 destinationChainId)",
  "event ClaimCompleted(uint256 indexed transactionId, address indexed receiver, uint256 amount)"
]

// PolyOneBilling ABI
export const POLYONE_BILLING_ABI = [
  "function subscribe(uint256 _planId, bool _autoRenew) external payable returns (uint256)",
  "function cancelSubscription(uint256 _subscriptionId) external",
  "function renewSubscription(uint256 _subscriptionId) external payable",
  "function payInvoice(uint256 _invoiceId) external payable",
  "function getSubscription(uint256 _subscriptionId) external view returns (tuple(uint256 id, address subscriber, uint256 planId, uint256 startTime, uint256 endTime, bool isActive, bool autoRenew))",
  "function getInvoice(uint256 _invoiceId) external view returns (tuple(uint256 id, uint256 subscriptionId, address subscriber, string invoiceNumber, uint256 subtotal, uint256 tax, uint256 discount, uint256 total, uint256 amountDue, uint256 amountPaid, uint256 periodStart, uint256 periodEnd, uint256 dueDate, uint256 paidAt, bool isPaid, uint256 createdAt))",
  "event Subscribed(uint256 indexed subscriptionId, address indexed subscriber, uint256 planId, uint256 startTime, uint256 endTime)",
  "event SubscriptionCancelled(uint256 indexed subscriptionId, address indexed subscriber)",
  "event InvoicePaid(uint256 indexed invoiceId, uint256 amountPaid, uint256 paidAt)"
]

// Legacy ChainFactory ABI (for backward compatibility)
export const LEGACY_CHAIN_FACTORY_ABI = [
  "function createChain(string _name, string _chainType, string _rollupType, string _gasToken, uint256 _validators, string _rpcUrl, string _explorerUrl) external returns (uint256)",
  "function getChain(uint256 _chainId) external view returns (tuple(uint256 id, address owner, string name, string chainType, string rollupType, string gasToken, uint256 validators, uint256 createdAt, bool isActive, string rpcUrl, string explorerUrl))",
  "function getUserChains(address _user) external view returns (uint256[])",
  "function getTotalChains() external view returns (uint256)",
  "event ChainCreated(uint256 indexed chainId, address indexed owner, string name, string chainType, string rollupType)"
]

/**
 * Get contract instance
 */
export function getContract(
  address: string,
  abi: string[],
  provider: ethers.Provider | ethers.Signer
): ethers.Contract {
  return new ethers.Contract(address, abi, provider)
}

/**
 * Get PolyOneChainFactory contract instance
 */
export function getChainFactoryContract(
  provider: ethers.Provider | ethers.Signer
): ethers.Contract | null {
  const address = CONTRACT_ADDRESSES.CHAIN_FACTORY
  if (!address) return null
  return getContract(address, POLYONE_CHAIN_FACTORY_ABI, provider)
}

/**
 * Get ValidatorRegistry contract instance
 */
export function getValidatorRegistryContract(
  provider: ethers.Provider | ethers.Signer
): ethers.Contract | null {
  const address = CONTRACT_ADDRESSES.VALIDATOR_REGISTRY
  if (!address) return null
  return getContract(address, VALIDATOR_REGISTRY_ABI, provider)
}

/**
 * Get PolyOneBridge contract instance
 */
export function getBridgeContract(
  provider: ethers.Provider | ethers.Signer
): ethers.Contract | null {
  const address = CONTRACT_ADDRESSES.BRIDGE
  if (!address) return null
  return getContract(address, POLYONE_BRIDGE_ABI, provider)
}

/**
 * Get PolyOneBilling contract instance
 */
export function getBillingContract(
  provider: ethers.Provider | ethers.Signer
): ethers.Contract | null {
  const address = CONTRACT_ADDRESSES.BILLING
  if (!address) return null
  return getContract(address, POLYONE_BILLING_ABI, provider)
}

