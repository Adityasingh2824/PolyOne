// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title PolyOneBridge
 * @dev Smart contract for cross-chain token bridging
 * Features: Deposit, claim, multi-token support, fee management, security monitoring
 */
contract PolyOneBridge is AccessControl, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;
    using Counters for Counters.Counter;

    // Roles
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    bytes32 public constant RELAYER_ROLE = keccak256("RELAYER_ROLE");

    // Bridge transaction status
    enum BridgeStatus {
        Pending,
        Initiated,
        Processing,
        ReadyToClaim,
        Claimed,
        Completed,
        Failed,
        Refunded
    }

    // Transaction type
    enum TransactionType {
        Deposit,
        Withdraw,
        Claim,
        Transfer
    }

    // Supported token struct
    struct SupportedToken {
        address tokenAddress;
        address wrappedAddress;
        string symbol;
        string name;
        uint8 decimals;
        uint256 minAmount;
        uint256 maxAmount;
        uint256 dailyLimit;
        uint256 dailyTransferred;
        uint256 lastResetTime;
        uint256 bridgeFeePercentage; // basis points (e.g., 10 = 0.1%)
        bool isActive;
        bool isNative;
    }

    // Bridge transaction struct
    struct BridgeTransaction {
        uint256 id;
        TransactionType txType;
        BridgeStatus status;
        address sender;
        address recipient;
        address token;
        uint256 amount;
        uint256 fee;
        uint256 sourceChainId;
        uint256 destinationChainId;
        bytes32 depositHash;
        bytes32 claimHash;
        bytes32 merkleRoot;
        uint256 depositCount;
        uint256 createdAt;
        uint256 completedAt;
        string errorMessage;
    }

    // Global exit root struct for ZK proofs
    struct GlobalExitRoot {
        bytes32 mainnetExitRoot;
        bytes32 rollupExitRoot;
        uint256 timestamp;
    }

    // State variables
    Counters.Counter private _transactionIds;
    Counters.Counter private _depositCount;

    mapping(uint256 => BridgeTransaction) public transactions;
    mapping(address => uint256[]) public userTransactions;
    mapping(address => SupportedToken) public supportedTokens;
    address[] public tokenList;
    
    mapping(bytes32 => bool) public processedDeposits;
    mapping(bytes32 => bool) public processedClaims;
    mapping(uint256 => GlobalExitRoot) public globalExitRoots;
    
    mapping(uint256 => bool) public supportedDestinationChains;
    mapping(uint256 => address) public destinationBridgeContracts;

    // Fee configuration
    uint256 public baseBridgeFee = 10; // 0.1% in basis points
    uint256 public minBridgeFee = 0.001 ether;
    uint256 public maxBridgeFee = 10 ether;
    address public feeCollector;
    uint256 public collectedFees;

    // Security configuration
    uint256 public depositCooldown = 1 minutes;
    mapping(address => uint256) public lastDeposit;
    uint256 public maxPendingTransactions = 100;
    uint256 public currentPendingCount;

    // Events
    event TokenAdded(
        address indexed token,
        string symbol,
        uint256 minAmount,
        uint256 maxAmount,
        uint256 timestamp
    );

    event TokenUpdated(
        address indexed token,
        uint256 minAmount,
        uint256 maxAmount,
        bool isActive,
        uint256 timestamp
    );

    event TokenRemoved(
        address indexed token,
        uint256 timestamp
    );

    event DepositInitiated(
        uint256 indexed transactionId,
        address indexed sender,
        address indexed token,
        uint256 amount,
        uint256 destinationChainId,
        bytes32 depositHash,
        uint256 timestamp
    );

    event DepositConfirmed(
        uint256 indexed transactionId,
        bytes32 merkleRoot,
        uint256 depositCount,
        uint256 timestamp
    );

    event ClaimInitiated(
        uint256 indexed transactionId,
        address indexed recipient,
        address indexed token,
        uint256 amount,
        uint256 sourceChainId,
        uint256 timestamp
    );

    event ClaimCompleted(
        uint256 indexed transactionId,
        address indexed recipient,
        uint256 amount,
        uint256 timestamp
    );

    event TransactionFailed(
        uint256 indexed transactionId,
        string reason,
        uint256 timestamp
    );

    event TransactionRefunded(
        uint256 indexed transactionId,
        address indexed recipient,
        uint256 amount,
        uint256 timestamp
    );

    event GlobalExitRootUpdated(
        bytes32 mainnetExitRoot,
        bytes32 rollupExitRoot,
        uint256 timestamp
    );

    event FeesCollected(
        address indexed collector,
        uint256 amount,
        uint256 timestamp
    );

    event DestinationChainUpdated(
        uint256 indexed chainId,
        bool supported,
        address bridgeContract,
        uint256 timestamp
    );

    // Modifiers
    modifier validToken(address _token) {
        require(supportedTokens[_token].isActive, "Token not supported");
        _;
    }

    modifier validDestination(uint256 _chainId) {
        require(supportedDestinationChains[_chainId], "Destination chain not supported");
        _;
    }

    modifier cooldownPassed() {
        require(
            block.timestamp >= lastDeposit[msg.sender] + depositCooldown,
            "Cooldown not passed"
        );
        _;
    }

    constructor(address _feeCollector) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(OPERATOR_ROLE, msg.sender);
        _grantRole(RELAYER_ROLE, msg.sender);
        
        feeCollector = _feeCollector;
    }

    // ============================================================
    // TOKEN MANAGEMENT
    // ============================================================

    /**
     * @dev Add a supported token
     */
    function addSupportedToken(
        address _token,
        address _wrappedAddress,
        string memory _symbol,
        string memory _name,
        uint8 _decimals,
        uint256 _minAmount,
        uint256 _maxAmount,
        uint256 _dailyLimit,
        uint256 _bridgeFeePercentage,
        bool _isNative
    ) external onlyRole(ADMIN_ROLE) {
        require(_token != address(0), "Invalid token address");
        require(!supportedTokens[_token].isActive, "Token already added");
        require(_minAmount < _maxAmount, "Invalid amount range");
        require(_bridgeFeePercentage <= 1000, "Fee too high"); // Max 10%

        SupportedToken storage token = supportedTokens[_token];
        token.tokenAddress = _token;
        token.wrappedAddress = _wrappedAddress;
        token.symbol = _symbol;
        token.name = _name;
        token.decimals = _decimals;
        token.minAmount = _minAmount;
        token.maxAmount = _maxAmount;
        token.dailyLimit = _dailyLimit;
        token.bridgeFeePercentage = _bridgeFeePercentage;
        token.isActive = true;
        token.isNative = _isNative;
        token.lastResetTime = block.timestamp;

        tokenList.push(_token);

        emit TokenAdded(_token, _symbol, _minAmount, _maxAmount, block.timestamp);
    }

    /**
     * @dev Update a supported token
     */
    function updateSupportedToken(
        address _token,
        uint256 _minAmount,
        uint256 _maxAmount,
        uint256 _dailyLimit,
        uint256 _bridgeFeePercentage,
        bool _isActive
    ) external onlyRole(ADMIN_ROLE) {
        require(supportedTokens[_token].tokenAddress != address(0), "Token not found");

        SupportedToken storage token = supportedTokens[_token];
        token.minAmount = _minAmount;
        token.maxAmount = _maxAmount;
        token.dailyLimit = _dailyLimit;
        token.bridgeFeePercentage = _bridgeFeePercentage;
        token.isActive = _isActive;

        emit TokenUpdated(_token, _minAmount, _maxAmount, _isActive, block.timestamp);
    }

    /**
     * @dev Remove a supported token
     */
    function removeSupportedToken(address _token) external onlyRole(ADMIN_ROLE) {
        require(supportedTokens[_token].isActive, "Token not active");
        
        supportedTokens[_token].isActive = false;

        emit TokenRemoved(_token, block.timestamp);
    }

    // ============================================================
    // DEPOSIT (Source Chain)
    // ============================================================

    /**
     * @dev Initiate a deposit to bridge tokens
     */
    function deposit(
        address _token,
        uint256 _amount,
        uint256 _destinationChainId,
        address _recipient
    ) 
        external 
        payable 
        whenNotPaused 
        nonReentrant 
        validToken(_token) 
        validDestination(_destinationChainId)
        cooldownPassed
        returns (uint256) 
    {
        require(_amount > 0, "Amount must be positive");
        require(_recipient != address(0), "Invalid recipient");
        require(currentPendingCount < maxPendingTransactions, "Too many pending transactions");

        SupportedToken storage token = supportedTokens[_token];
        require(_amount >= token.minAmount, "Amount below minimum");
        require(_amount <= token.maxAmount, "Amount above maximum");

        // Check and update daily limit
        _checkAndUpdateDailyLimit(_token, _amount);

        // Calculate fee
        uint256 fee = calculateBridgeFee(_token, _amount);
        uint256 netAmount = _amount - fee;

        // Transfer tokens from user
        IERC20(_token).safeTransferFrom(msg.sender, address(this), _amount);

        // Create transaction
        _transactionIds.increment();
        uint256 transactionId = _transactionIds.current();
        
        _depositCount.increment();
        uint256 depositNum = _depositCount.current();

        bytes32 depositHash = keccak256(abi.encodePacked(
            transactionId,
            msg.sender,
            _recipient,
            _token,
            _amount,
            block.chainid,
            _destinationChainId,
            block.timestamp
        ));

        BridgeTransaction storage transaction = transactions[transactionId];
        transaction.id = transactionId;
        transaction.txType = TransactionType.Deposit;
        transaction.status = BridgeStatus.Initiated;
        transaction.sender = msg.sender;
        transaction.recipient = _recipient;
        transaction.token = _token;
        transaction.amount = netAmount;
        transaction.fee = fee;
        transaction.sourceChainId = block.chainid;
        transaction.destinationChainId = _destinationChainId;
        transaction.depositHash = depositHash;
        transaction.depositCount = depositNum;
        transaction.createdAt = block.timestamp;

        userTransactions[msg.sender].push(transactionId);
        lastDeposit[msg.sender] = block.timestamp;
        currentPendingCount++;
        collectedFees += fee;

        emit DepositInitiated(
            transactionId,
            msg.sender,
            _token,
            netAmount,
            _destinationChainId,
            depositHash,
            block.timestamp
        );

        return transactionId;
    }

    /**
     * @dev Deposit native token (ETH/MATIC)
     */
    function depositNative(
        uint256 _destinationChainId,
        address _recipient
    ) 
        external 
        payable 
        whenNotPaused 
        nonReentrant 
        validDestination(_destinationChainId)
        cooldownPassed
        returns (uint256) 
    {
        require(msg.value > 0, "Amount must be positive");
        require(_recipient != address(0), "Invalid recipient");

        // Calculate fee
        uint256 fee = (msg.value * baseBridgeFee) / 10000;
        if (fee < minBridgeFee) fee = minBridgeFee;
        if (fee > maxBridgeFee) fee = maxBridgeFee;
        
        uint256 netAmount = msg.value - fee;
        require(netAmount > 0, "Amount too small after fee");

        // Create transaction
        _transactionIds.increment();
        uint256 transactionId = _transactionIds.current();
        
        _depositCount.increment();
        uint256 depositNum = _depositCount.current();

        bytes32 depositHash = keccak256(abi.encodePacked(
            transactionId,
            msg.sender,
            _recipient,
            address(0), // Native token
            msg.value,
            block.chainid,
            _destinationChainId,
            block.timestamp
        ));

        BridgeTransaction storage transaction = transactions[transactionId];
        transaction.id = transactionId;
        transaction.txType = TransactionType.Deposit;
        transaction.status = BridgeStatus.Initiated;
        transaction.sender = msg.sender;
        transaction.recipient = _recipient;
        transaction.token = address(0);
        transaction.amount = netAmount;
        transaction.fee = fee;
        transaction.sourceChainId = block.chainid;
        transaction.destinationChainId = _destinationChainId;
        transaction.depositHash = depositHash;
        transaction.depositCount = depositNum;
        transaction.createdAt = block.timestamp;

        userTransactions[msg.sender].push(transactionId);
        lastDeposit[msg.sender] = block.timestamp;
        currentPendingCount++;
        collectedFees += fee;

        emit DepositInitiated(
            transactionId,
            msg.sender,
            address(0),
            netAmount,
            _destinationChainId,
            depositHash,
            block.timestamp
        );

        return transactionId;
    }

    /**
     * @dev Confirm deposit with merkle root (called by relayer)
     */
    function confirmDeposit(
        uint256 _transactionId,
        bytes32 _merkleRoot
    ) external onlyRole(RELAYER_ROLE) {
        BridgeTransaction storage transaction = transactions[_transactionId];
        require(transaction.status == BridgeStatus.Initiated, "Invalid status");

        transaction.merkleRoot = _merkleRoot;
        transaction.status = BridgeStatus.ReadyToClaim;

        emit DepositConfirmed(_transactionId, _merkleRoot, transaction.depositCount, block.timestamp);
    }

    // ============================================================
    // CLAIM (Destination Chain)
    // ============================================================

    /**
     * @dev Claim bridged tokens on destination chain
     */
    function claim(
        uint256 _transactionId,
        bytes32[] calldata _merkleProof,
        bytes32 _depositHash,
        address _token,
        uint256 _amount,
        address _recipient
    ) external whenNotPaused nonReentrant {
        require(!processedClaims[_depositHash], "Already claimed");
        require(_recipient != address(0), "Invalid recipient");
        require(_amount > 0, "Invalid amount");

        // Verify merkle proof
        bytes32 leaf = keccak256(abi.encodePacked(
            _transactionId,
            _depositHash,
            _token,
            _amount,
            _recipient
        ));

        BridgeTransaction storage transaction = transactions[_transactionId];
        require(
            MerkleProof.verify(_merkleProof, transaction.merkleRoot, leaf),
            "Invalid merkle proof"
        );

        processedClaims[_depositHash] = true;
        transaction.status = BridgeStatus.Claimed;
        transaction.completedAt = block.timestamp;

        // Transfer tokens to recipient
        if (_token == address(0)) {
            // Native token
            payable(_recipient).transfer(_amount);
        } else {
            IERC20(_token).safeTransfer(_recipient, _amount);
        }

        currentPendingCount--;

        emit ClaimCompleted(_transactionId, _recipient, _amount, block.timestamp);
    }

    /**
     * @dev Emergency claim without proof (admin only)
     */
    function emergencyClaim(
        uint256 _transactionId,
        address _token,
        uint256 _amount,
        address _recipient
    ) external onlyRole(ADMIN_ROLE) nonReentrant {
        BridgeTransaction storage transaction = transactions[_transactionId];
        require(transaction.status != BridgeStatus.Claimed, "Already claimed");
        require(transaction.status != BridgeStatus.Refunded, "Already refunded");

        transaction.status = BridgeStatus.Claimed;
        transaction.completedAt = block.timestamp;

        if (_token == address(0)) {
            payable(_recipient).transfer(_amount);
        } else {
            IERC20(_token).safeTransfer(_recipient, _amount);
        }

        currentPendingCount--;

        emit ClaimCompleted(_transactionId, _recipient, _amount, block.timestamp);
    }

    // ============================================================
    // REFUNDS
    // ============================================================

    /**
     * @dev Refund a failed transaction
     */
    function refund(uint256 _transactionId) 
        external 
        onlyRole(OPERATOR_ROLE) 
        nonReentrant 
    {
        BridgeTransaction storage transaction = transactions[_transactionId];
        require(
            transaction.status == BridgeStatus.Failed || 
            transaction.status == BridgeStatus.Initiated,
            "Cannot refund"
        );
        require(!processedDeposits[transaction.depositHash], "Deposit processed");

        uint256 refundAmount = transaction.amount + transaction.fee;
        transaction.status = BridgeStatus.Refunded;

        if (transaction.token == address(0)) {
            payable(transaction.sender).transfer(refundAmount);
        } else {
            IERC20(transaction.token).safeTransfer(transaction.sender, refundAmount);
        }

        collectedFees -= transaction.fee;
        currentPendingCount--;

        emit TransactionRefunded(
            _transactionId,
            transaction.sender,
            refundAmount,
            block.timestamp
        );
    }

    // ============================================================
    // GLOBAL EXIT ROOT
    // ============================================================

    /**
     * @dev Update global exit root
     */
    function updateGlobalExitRoot(
        bytes32 _mainnetExitRoot,
        bytes32 _rollupExitRoot
    ) external onlyRole(RELAYER_ROLE) {
        uint256 rootIndex = block.number;
        
        globalExitRoots[rootIndex] = GlobalExitRoot({
            mainnetExitRoot: _mainnetExitRoot,
            rollupExitRoot: _rollupExitRoot,
            timestamp: block.timestamp
        });

        emit GlobalExitRootUpdated(_mainnetExitRoot, _rollupExitRoot, block.timestamp);
    }

    // ============================================================
    // FEE MANAGEMENT
    // ============================================================

    /**
     * @dev Calculate bridge fee for a token
     */
    function calculateBridgeFee(address _token, uint256 _amount) public view returns (uint256) {
        SupportedToken storage token = supportedTokens[_token];
        uint256 feePercentage = token.bridgeFeePercentage > 0 ? token.bridgeFeePercentage : baseBridgeFee;
        
        uint256 fee = (_amount * feePercentage) / 10000;
        
        if (fee < minBridgeFee) fee = minBridgeFee;
        if (fee > maxBridgeFee) fee = maxBridgeFee;
        
        return fee;
    }

    /**
     * @dev Collect accumulated fees
     */
    function collectFees() external nonReentrant {
        require(msg.sender == feeCollector, "Not fee collector");
        require(collectedFees > 0, "No fees to collect");

        uint256 amount = collectedFees;
        collectedFees = 0;

        // Only transfer the collected fees amount, not the entire contract balance
        // This prevents accidentally transferring user deposits and bridge tokens
        payable(feeCollector).transfer(amount);

        emit FeesCollected(feeCollector, amount, block.timestamp);
    }

    /**
     * @dev Collect token fees
     */
    function collectTokenFees(address _token) external nonReentrant {
        require(msg.sender == feeCollector, "Not fee collector");
        
        uint256 balance = IERC20(_token).balanceOf(address(this));
        require(balance > 0, "No token balance");

        IERC20(_token).safeTransfer(feeCollector, balance);

        emit FeesCollected(feeCollector, balance, block.timestamp);
    }

    // ============================================================
    // HELPER FUNCTIONS
    // ============================================================

    /**
     * @dev Check and update daily limit
     */
    function _checkAndUpdateDailyLimit(address _token, uint256 _amount) internal {
        SupportedToken storage token = supportedTokens[_token];
        
        // Reset daily limit if 24 hours passed
        if (block.timestamp >= token.lastResetTime + 1 days) {
            token.dailyTransferred = 0;
            token.lastResetTime = block.timestamp;
        }

        require(
            token.dailyTransferred + _amount <= token.dailyLimit,
            "Daily limit exceeded"
        );

        token.dailyTransferred += _amount;
    }

    // ============================================================
    // VIEW FUNCTIONS
    // ============================================================

    /**
     * @dev Get transaction details
     */
    function getTransaction(uint256 _transactionId) external view returns (BridgeTransaction memory) {
        return transactions[_transactionId];
    }

    /**
     * @dev Get user transactions
     */
    function getUserTransactions(address _user) external view returns (uint256[] memory) {
        return userTransactions[_user];
    }

    /**
     * @dev Get supported token details
     */
    function getSupportedToken(address _token) external view returns (SupportedToken memory) {
        return supportedTokens[_token];
    }

    /**
     * @dev Get all supported tokens
     */
    function getAllSupportedTokens() external view returns (address[] memory) {
        return tokenList;
    }

    /**
     * @dev Get global exit root
     */
    function getGlobalExitRoot(uint256 _blockNumber) external view returns (GlobalExitRoot memory) {
        return globalExitRoots[_blockNumber];
    }

    /**
     * @dev Get total transactions count
     */
    function getTotalTransactions() external view returns (uint256) {
        return _transactionIds.current();
    }

    /**
     * @dev Get current deposit count
     */
    function getDepositCount() external view returns (uint256) {
        return _depositCount.current();
    }

    // ============================================================
    // ADMIN FUNCTIONS
    // ============================================================

    /**
     * @dev Add/update destination chain
     */
    function setDestinationChain(
        uint256 _chainId,
        bool _supported,
        address _bridgeContract
    ) external onlyRole(ADMIN_ROLE) {
        supportedDestinationChains[_chainId] = _supported;
        destinationBridgeContracts[_chainId] = _bridgeContract;

        emit DestinationChainUpdated(_chainId, _supported, _bridgeContract, block.timestamp);
    }

    /**
     * @dev Update fee configuration
     */
    function setFeeConfig(
        uint256 _baseFee,
        uint256 _minFee,
        uint256 _maxFee
    ) external onlyRole(ADMIN_ROLE) {
        require(_baseFee <= 1000, "Base fee too high"); // Max 10%
        baseBridgeFee = _baseFee;
        minBridgeFee = _minFee;
        maxBridgeFee = _maxFee;
    }

    /**
     * @dev Update fee collector
     */
    function setFeeCollector(address _newCollector) external onlyRole(ADMIN_ROLE) {
        require(_newCollector != address(0), "Invalid address");
        feeCollector = _newCollector;
    }

    /**
     * @dev Update security configuration
     */
    function setSecurityConfig(
        uint256 _cooldown,
        uint256 _maxPending
    ) external onlyRole(ADMIN_ROLE) {
        depositCooldown = _cooldown;
        maxPendingTransactions = _maxPending;
    }

    /**
     * @dev Pause the contract
     */
    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    /**
     * @dev Unpause the contract
     */
    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }

    /**
     * @dev Emergency withdraw
     */
    function emergencyWithdraw(address _token) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (_token == address(0)) {
            payable(msg.sender).transfer(address(this).balance);
        } else {
            uint256 balance = IERC20(_token).balanceOf(address(this));
            IERC20(_token).safeTransfer(msg.sender, balance);
        }
    }

    // Receive function to accept native tokens
    receive() external payable {}
}

