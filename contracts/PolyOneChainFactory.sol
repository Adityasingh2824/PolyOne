// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title PolyOneChainFactory
 * @dev Enhanced smart contract for managing blockchain deployments on PolyOne
 * Features: Chain creation, pause/resume, upgrades, backups, scaling, deletion
 * Deployed on Polygon network
 */
contract PolyOneChainFactory is AccessControl, ReentrancyGuard, Pausable {
    using Counters for Counters.Counter;

    // Roles
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");

    // Chain status enum
    enum ChainStatus {
        Deploying,
        Active,
        Paused,
        Upgrading,
        Maintenance,
        Failed,
        Deleted
    }

    // Chain type enum
    enum ChainType {
        ZkRollup,
        OptimisticRollup,
        Validium
    }

    // Validator access enum
    enum ValidatorAccess {
        Public,
        Permissioned,
        Private
    }

    // Chain configuration struct
    struct ChainConfig {
        uint256 maxTps;
        uint256 blockGasLimit;
        uint256 blockTime; // in milliseconds
        uint256 maxValidators;
        bool bridgeEnabled;
        bool analyticsEnabled;
    }

    // Chain struct
    struct Chain {
        uint256 id;
        address owner;
        string name;
        string symbol;
        ChainType chainType;
        ValidatorAccess validatorAccess;
        string gasToken;
        uint256 validatorCount;
        ChainStatus status;
        uint256 createdAt;
        uint256 deployedAt;
        uint256 pausedAt;
        string rpcUrl;
        string explorerUrl;
        string bridgeUrl;
        ChainConfig config;
        uint256 currentVersion;
        bytes32 lastBackupHash;
    }

    // Upgrade struct
    struct ChainUpgrade {
        uint256 chainId;
        uint256 fromVersion;
        uint256 toVersion;
        address initiatedBy;
        uint256 scheduledAt;
        uint256 executedAt;
        bool executed;
        bool rolledBack;
        bytes upgradeData;
    }

    // Backup struct
    struct ChainBackup {
        uint256 chainId;
        bytes32 backupHash;
        uint256 blockHeight;
        uint256 createdAt;
        address createdBy;
        string storageLocation;
        bool isValid;
    }

    // State variables
    Counters.Counter private _chainIds;
    Counters.Counter private _upgradeIds;
    Counters.Counter private _backupIds;

    mapping(uint256 => Chain) public chains;
    mapping(address => uint256[]) public userChains;
    mapping(uint256 => ChainUpgrade) public upgrades;
    mapping(uint256 => ChainBackup) public backups;
    mapping(uint256 => uint256[]) public chainBackups;
    mapping(uint256 => uint256[]) public chainUpgrades;
    mapping(uint256 => mapping(address => bool)) public chainAdmins;

    // Fee configuration
    uint256 public deploymentFee;
    uint256 public upgradeMinDelay = 1 hours;
    address public feeCollector;

    // Events
    event ChainCreated(
        uint256 indexed chainId,
        address indexed owner,
        string name,
        ChainType chainType,
        uint256 timestamp
    );

    event ChainDeployed(
        uint256 indexed chainId,
        string rpcUrl,
        string explorerUrl,
        uint256 timestamp
    );

    event ChainPaused(
        uint256 indexed chainId,
        address indexed pausedBy,
        string reason,
        uint256 timestamp
    );

    event ChainResumed(
        uint256 indexed chainId,
        address indexed resumedBy,
        uint256 timestamp
    );

    event ChainUpgradeScheduled(
        uint256 indexed chainId,
        uint256 indexed upgradeId,
        uint256 fromVersion,
        uint256 toVersion,
        uint256 scheduledAt
    );

    event ChainUpgradeExecuted(
        uint256 indexed chainId,
        uint256 indexed upgradeId,
        uint256 toVersion,
        uint256 timestamp
    );

    event ChainUpgradeRolledBack(
        uint256 indexed chainId,
        uint256 indexed upgradeId,
        uint256 timestamp
    );

    event ChainBackupCreated(
        uint256 indexed chainId,
        uint256 indexed backupId,
        bytes32 backupHash,
        uint256 blockHeight,
        uint256 timestamp
    );

    event ChainBackupRestored(
        uint256 indexed chainId,
        uint256 indexed backupId,
        uint256 timestamp
    );

    event ChainScaled(
        uint256 indexed chainId,
        uint256 oldValidatorCount,
        uint256 newValidatorCount,
        uint256 timestamp
    );

    event ChainDeleted(
        uint256 indexed chainId,
        address indexed owner,
        uint256 timestamp
    );

    event ChainAdminAdded(
        uint256 indexed chainId,
        address indexed admin,
        address indexed addedBy
    );

    event ChainAdminRemoved(
        uint256 indexed chainId,
        address indexed admin,
        address indexed removedBy
    );

    event DeploymentFeeUpdated(uint256 oldFee, uint256 newFee);

    // Modifiers
    modifier onlyChainOwner(uint256 _chainId) {
        require(chains[_chainId].owner == msg.sender, "Not chain owner");
        _;
    }

    modifier onlyChainAdmin(uint256 _chainId) {
        require(
            chains[_chainId].owner == msg.sender || 
            chainAdmins[_chainId][msg.sender] ||
            hasRole(ADMIN_ROLE, msg.sender),
            "Not authorized"
        );
        _;
    }

    modifier chainExists(uint256 _chainId) {
        require(chains[_chainId].id != 0, "Chain does not exist");
        require(chains[_chainId].status != ChainStatus.Deleted, "Chain is deleted");
        _;
    }

    modifier chainActive(uint256 _chainId) {
        require(chains[_chainId].status == ChainStatus.Active, "Chain is not active");
        _;
    }

    constructor(address _feeCollector) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(OPERATOR_ROLE, msg.sender);
        
        feeCollector = _feeCollector;
        deploymentFee = 0.01 ether; // Default deployment fee
    }

    // ============================================================
    // CHAIN CREATION & DEPLOYMENT
    // ============================================================

    /**
     * @dev Create a new blockchain deployment
     */
    function createChain(
        string memory _name,
        string memory _symbol,
        ChainType _chainType,
        ValidatorAccess _validatorAccess,
        string memory _gasToken,
        uint256 _validatorCount,
        ChainConfig memory _config
    ) external payable whenNotPaused nonReentrant returns (uint256) {
        require(bytes(_name).length > 0, "Name required");
        require(bytes(_symbol).length > 0, "Symbol required");
        require(_validatorCount > 0 && _validatorCount <= 100, "Invalid validator count");
        require(msg.value >= deploymentFee, "Insufficient deployment fee");

        _chainIds.increment();
        uint256 newChainId = _chainIds.current();

        Chain storage newChain = chains[newChainId];
        newChain.id = newChainId;
        newChain.owner = msg.sender;
        newChain.name = _name;
        newChain.symbol = _symbol;
        newChain.chainType = _chainType;
        newChain.validatorAccess = _validatorAccess;
        newChain.gasToken = _gasToken;
        newChain.validatorCount = _validatorCount;
        newChain.status = ChainStatus.Deploying;
        newChain.createdAt = block.timestamp;
        newChain.config = _config;
        newChain.currentVersion = 1;

        userChains[msg.sender].push(newChainId);

        // Transfer deployment fee
        if (deploymentFee > 0) {
            payable(feeCollector).transfer(deploymentFee);
        }

        // Refund excess
        if (msg.value > deploymentFee) {
            payable(msg.sender).transfer(msg.value - deploymentFee);
        }

        emit ChainCreated(
            newChainId,
            msg.sender,
            _name,
            _chainType,
            block.timestamp
        );

        return newChainId;
    }

    /**
     * @dev Mark chain as deployed (called by operator after off-chain deployment)
     */
    function markChainDeployed(
        uint256 _chainId,
        string memory _rpcUrl,
        string memory _explorerUrl,
        string memory _bridgeUrl
    ) external onlyRole(OPERATOR_ROLE) chainExists(_chainId) {
        Chain storage chain = chains[_chainId];
        require(chain.status == ChainStatus.Deploying, "Chain not in deploying state");

        chain.rpcUrl = _rpcUrl;
        chain.explorerUrl = _explorerUrl;
        chain.bridgeUrl = _bridgeUrl;
        chain.status = ChainStatus.Active;
        chain.deployedAt = block.timestamp;

        emit ChainDeployed(_chainId, _rpcUrl, _explorerUrl, block.timestamp);
    }

    // ============================================================
    // PAUSE & RESUME
    // ============================================================

    /**
     * @dev Pause a chain
     */
    function pauseChain(uint256 _chainId, string memory _reason) 
        external 
        onlyChainAdmin(_chainId) 
        chainExists(_chainId)
        chainActive(_chainId) 
    {
        Chain storage chain = chains[_chainId];
        chain.status = ChainStatus.Paused;
        chain.pausedAt = block.timestamp;

        emit ChainPaused(_chainId, msg.sender, _reason, block.timestamp);
    }

    /**
     * @dev Resume a paused chain
     */
    function resumeChain(uint256 _chainId) 
        external 
        onlyChainAdmin(_chainId) 
        chainExists(_chainId) 
    {
        Chain storage chain = chains[_chainId];
        require(chain.status == ChainStatus.Paused, "Chain is not paused");

        chain.status = ChainStatus.Active;
        chain.pausedAt = 0;

        emit ChainResumed(_chainId, msg.sender, block.timestamp);
    }

    // ============================================================
    // UPGRADES
    // ============================================================

    /**
     * @dev Schedule a chain upgrade
     */
    function scheduleUpgrade(
        uint256 _chainId,
        uint256 _toVersion,
        uint256 _scheduledAt,
        bytes memory _upgradeData
    ) external onlyChainAdmin(_chainId) chainExists(_chainId) returns (uint256) {
        require(_scheduledAt >= block.timestamp + upgradeMinDelay, "Scheduled time too soon");
        
        Chain storage chain = chains[_chainId];
        require(_toVersion > chain.currentVersion, "New version must be higher");

        _upgradeIds.increment();
        uint256 upgradeId = _upgradeIds.current();

        ChainUpgrade storage upgrade = upgrades[upgradeId];
        upgrade.chainId = _chainId;
        upgrade.fromVersion = chain.currentVersion;
        upgrade.toVersion = _toVersion;
        upgrade.initiatedBy = msg.sender;
        upgrade.scheduledAt = _scheduledAt;
        upgrade.upgradeData = _upgradeData;

        chainUpgrades[_chainId].push(upgradeId);

        emit ChainUpgradeScheduled(
            _chainId,
            upgradeId,
            chain.currentVersion,
            _toVersion,
            _scheduledAt
        );

        return upgradeId;
    }

    /**
     * @dev Execute a scheduled upgrade
     */
    function executeUpgrade(uint256 _upgradeId) 
        external 
        onlyRole(OPERATOR_ROLE) 
        nonReentrant 
    {
        ChainUpgrade storage upgrade = upgrades[_upgradeId];
        require(!upgrade.executed, "Upgrade already executed");
        require(!upgrade.rolledBack, "Upgrade was rolled back");
        require(block.timestamp >= upgrade.scheduledAt, "Upgrade not yet scheduled");

        Chain storage chain = chains[upgrade.chainId];
        require(chain.status != ChainStatus.Deleted, "Chain is deleted");

        chain.status = ChainStatus.Upgrading;
        
        // Execute upgrade logic (in production, this would trigger off-chain processes)
        chain.currentVersion = upgrade.toVersion;
        upgrade.executed = true;
        upgrade.executedAt = block.timestamp;
        
        chain.status = ChainStatus.Active;

        emit ChainUpgradeExecuted(
            upgrade.chainId,
            _upgradeId,
            upgrade.toVersion,
            block.timestamp
        );
    }

    /**
     * @dev Rollback an upgrade
     */
    function rollbackUpgrade(uint256 _upgradeId) 
        external 
        onlyRole(OPERATOR_ROLE) 
        nonReentrant 
    {
        ChainUpgrade storage upgrade = upgrades[_upgradeId];
        require(upgrade.executed, "Upgrade not executed");
        require(!upgrade.rolledBack, "Already rolled back");

        Chain storage chain = chains[upgrade.chainId];
        chain.currentVersion = upgrade.fromVersion;
        upgrade.rolledBack = true;

        emit ChainUpgradeRolledBack(upgrade.chainId, _upgradeId, block.timestamp);
    }

    // ============================================================
    // BACKUPS
    // ============================================================

    /**
     * @dev Create a chain backup
     */
    function createBackup(
        uint256 _chainId,
        bytes32 _backupHash,
        uint256 _blockHeight,
        string memory _storageLocation
    ) external onlyRole(OPERATOR_ROLE) chainExists(_chainId) returns (uint256) {
        _backupIds.increment();
        uint256 backupId = _backupIds.current();

        ChainBackup storage backup = backups[backupId];
        backup.chainId = _chainId;
        backup.backupHash = _backupHash;
        backup.blockHeight = _blockHeight;
        backup.createdAt = block.timestamp;
        backup.createdBy = msg.sender;
        backup.storageLocation = _storageLocation;
        backup.isValid = true;

        chainBackups[_chainId].push(backupId);
        chains[_chainId].lastBackupHash = _backupHash;

        emit ChainBackupCreated(
            _chainId,
            backupId,
            _backupHash,
            _blockHeight,
            block.timestamp
        );

        return backupId;
    }

    /**
     * @dev Mark backup as restored
     */
    function markBackupRestored(uint256 _backupId) 
        external 
        onlyRole(OPERATOR_ROLE) 
    {
        ChainBackup storage backup = backups[_backupId];
        require(backup.isValid, "Invalid backup");

        emit ChainBackupRestored(backup.chainId, _backupId, block.timestamp);
    }

    /**
     * @dev Invalidate a backup
     */
    function invalidateBackup(uint256 _backupId) 
        external 
        onlyRole(OPERATOR_ROLE) 
    {
        backups[_backupId].isValid = false;
    }

    // ============================================================
    // SCALING
    // ============================================================

    /**
     * @dev Scale chain validators
     */
    function scaleChain(uint256 _chainId, uint256 _newValidatorCount) 
        external 
        onlyChainAdmin(_chainId) 
        chainExists(_chainId) 
    {
        require(_newValidatorCount > 0 && _newValidatorCount <= 100, "Invalid validator count");
        
        Chain storage chain = chains[_chainId];
        uint256 oldCount = chain.validatorCount;
        require(_newValidatorCount != oldCount, "Same validator count");

        chain.validatorCount = _newValidatorCount;

        emit ChainScaled(_chainId, oldCount, _newValidatorCount, block.timestamp);
    }

    // ============================================================
    // DELETION
    // ============================================================

    /**
     * @dev Delete a chain (soft delete)
     */
    function deleteChain(uint256 _chainId) 
        external 
        onlyChainOwner(_chainId) 
        chainExists(_chainId) 
    {
        Chain storage chain = chains[_chainId];
        require(
            chain.status == ChainStatus.Paused || 
            chain.status == ChainStatus.Failed,
            "Chain must be paused or failed to delete"
        );

        chain.status = ChainStatus.Deleted;

        emit ChainDeleted(_chainId, msg.sender, block.timestamp);
    }

    // ============================================================
    // CHAIN ADMIN MANAGEMENT
    // ============================================================

    /**
     * @dev Add a chain admin
     */
    function addChainAdmin(uint256 _chainId, address _admin) 
        external 
        onlyChainOwner(_chainId) 
        chainExists(_chainId) 
    {
        require(_admin != address(0), "Invalid address");
        require(!chainAdmins[_chainId][_admin], "Already admin");

        chainAdmins[_chainId][_admin] = true;

        emit ChainAdminAdded(_chainId, _admin, msg.sender);
    }

    /**
     * @dev Remove a chain admin
     */
    function removeChainAdmin(uint256 _chainId, address _admin) 
        external 
        onlyChainOwner(_chainId) 
        chainExists(_chainId) 
    {
        require(chainAdmins[_chainId][_admin], "Not an admin");

        chainAdmins[_chainId][_admin] = false;

        emit ChainAdminRemoved(_chainId, _admin, msg.sender);
    }

    // ============================================================
    // VIEW FUNCTIONS
    // ============================================================

    /**
     * @dev Get all chains for a user
     */
    function getUserChains(address _user) external view returns (uint256[] memory) {
        return userChains[_user];
    }

    /**
     * @dev Get chain details
     */
    function getChain(uint256 _chainId) external view returns (Chain memory) {
        return chains[_chainId];
    }

    /**
     * @dev Get all backups for a chain
     */
    function getChainBackups(uint256 _chainId) external view returns (uint256[] memory) {
        return chainBackups[_chainId];
    }

    /**
     * @dev Get all upgrades for a chain
     */
    function getChainUpgrades(uint256 _chainId) external view returns (uint256[] memory) {
        return chainUpgrades[_chainId];
    }

    /**
     * @dev Get backup details
     */
    function getBackup(uint256 _backupId) external view returns (ChainBackup memory) {
        return backups[_backupId];
    }

    /**
     * @dev Get upgrade details
     */
    function getUpgrade(uint256 _upgradeId) external view returns (ChainUpgrade memory) {
        return upgrades[_upgradeId];
    }

    /**
     * @dev Get total number of chains
     */
    function getTotalChains() external view returns (uint256) {
        return _chainIds.current();
    }

    /**
     * @dev Check if address is chain admin
     */
    function isChainAdmin(uint256 _chainId, address _addr) external view returns (bool) {
        return chainAdmins[_chainId][_addr] || 
               chains[_chainId].owner == _addr ||
               hasRole(ADMIN_ROLE, _addr);
    }

    // ============================================================
    // ADMIN FUNCTIONS
    // ============================================================

    /**
     * @dev Update deployment fee
     */
    function setDeploymentFee(uint256 _newFee) external onlyRole(ADMIN_ROLE) {
        uint256 oldFee = deploymentFee;
        deploymentFee = _newFee;
        emit DeploymentFeeUpdated(oldFee, _newFee);
    }

    /**
     * @dev Update fee collector address
     */
    function setFeeCollector(address _newCollector) external onlyRole(ADMIN_ROLE) {
        require(_newCollector != address(0), "Invalid address");
        feeCollector = _newCollector;
    }

    /**
     * @dev Update minimum upgrade delay
     */
    function setUpgradeMinDelay(uint256 _delay) external onlyRole(ADMIN_ROLE) {
        upgradeMinDelay = _delay;
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
    function emergencyWithdraw() external onlyRole(DEFAULT_ADMIN_ROLE) {
        payable(msg.sender).transfer(address(this).balance);
    }
}


