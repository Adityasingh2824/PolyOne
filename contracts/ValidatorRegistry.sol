// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title ValidatorRegistry
 * @dev Smart contract for managing validators with staking, rewards, and slashing
 * Features: Add/remove validators, staking, rewards distribution, slashing, performance monitoring
 */
contract ValidatorRegistry is AccessControl, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;
    using Counters for Counters.Counter;

    // Roles
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    bytes32 public constant SLASHER_ROLE = keccak256("SLASHER_ROLE");

    // Validator status enum
    enum ValidatorStatus {
        Pending,
        Active,
        Inactive,
        Jailed,
        Unbonding,
        Slashed,
        Removed
    }

    // Validator struct
    struct Validator {
        uint256 id;
        uint256 chainId;
        address owner;
        address validatorAddress;
        bytes publicKey;
        string name;
        ValidatorStatus status;
        uint256 stakeAmount;
        uint256 minStakeRequired;
        uint256 commissionRate; // basis points (e.g., 500 = 5%)
        uint256 rewardsEarned;
        uint256 rewardsClaimed;
        uint256 delegationsReceived;
        uint256 delegatorsCount;
        uint256 blocksProduced;
        uint256 blocksMissed;
        uint256 slashCount;
        uint256 totalSlashed;
        uint256 jailUntil;
        uint256 createdAt;
        uint256 activatedAt;
        uint256 lastActiveAt;
        bool isGenesis;
    }

    // Delegation struct
    struct Delegation {
        uint256 validatorId;
        address delegator;
        uint256 amount;
        uint256 rewardsEarned;
        uint256 rewardsClaimed;
        uint256 delegatedAt;
        uint256 undelegateRequestedAt;
        bool isActive;
    }

    // Performance record struct
    struct PerformanceRecord {
        uint256 validatorId;
        uint256 blocksProduced;
        uint256 blocksMissed;
        uint256 transactionsProcessed;
        uint256 uptimeSeconds;
        uint256 avgResponseTimeMs;
        uint256 rewardsEarned;
        uint256 periodStart;
        uint256 periodEnd;
    }

    // Slash event struct
    struct SlashEvent {
        uint256 validatorId;
        uint256 amount;
        string reason;
        uint256 slashedAt;
        address slashedBy;
        bool jailed;
        uint256 jailDuration;
    }

    // State variables
    Counters.Counter private _validatorIds;
    Counters.Counter private _delegationIds;
    Counters.Counter private _performanceIds;
    Counters.Counter private _slashIds;

    IERC20 public stakingToken;
    
    mapping(uint256 => Validator) public validators;
    mapping(uint256 => mapping(address => bool)) public chainValidators; // chainId => validatorAddr => exists
    mapping(address => uint256[]) public validatorsByOwner;
    mapping(uint256 => uint256[]) public validatorsByChain;
    
    mapping(uint256 => Delegation) public delegations;
    mapping(address => uint256[]) public delegationsByDelegator;
    mapping(uint256 => uint256[]) public delegationsByValidator;
    
    mapping(uint256 => PerformanceRecord[]) public performanceHistory;
    mapping(uint256 => SlashEvent[]) public slashHistory;

    // Configuration
    uint256 public minStake = 1000 ether;
    uint256 public maxCommissionRate = 2000; // 20%
    uint256 public unbondingPeriod = 14 days;
    uint256 public slashJailDuration = 7 days;
    uint256 public minSlashAmount = 100 ether;
    uint256 public maxSlashPercentage = 5000; // 50%

    // Events
    event ValidatorRegistered(
        uint256 indexed validatorId,
        uint256 indexed chainId,
        address indexed owner,
        address validatorAddress,
        string name,
        uint256 timestamp
    );

    event ValidatorActivated(
        uint256 indexed validatorId,
        uint256 indexed chainId,
        uint256 timestamp
    );

    event ValidatorDeactivated(
        uint256 indexed validatorId,
        uint256 indexed chainId,
        string reason,
        uint256 timestamp
    );

    event ValidatorRemoved(
        uint256 indexed validatorId,
        uint256 indexed chainId,
        uint256 timestamp
    );

    event StakeAdded(
        uint256 indexed validatorId,
        address indexed staker,
        uint256 amount,
        uint256 newTotal,
        uint256 timestamp
    );

    event StakeWithdrawn(
        uint256 indexed validatorId,
        address indexed staker,
        uint256 amount,
        uint256 remaining,
        uint256 timestamp
    );

    event DelegationAdded(
        uint256 indexed delegationId,
        uint256 indexed validatorId,
        address indexed delegator,
        uint256 amount,
        uint256 timestamp
    );

    event DelegationRemoved(
        uint256 indexed delegationId,
        uint256 indexed validatorId,
        address indexed delegator,
        uint256 amount,
        uint256 timestamp
    );

    event RewardsDistributed(
        uint256 indexed validatorId,
        uint256 validatorReward,
        uint256 delegatorsReward,
        uint256 timestamp
    );

    event RewardsClaimed(
        uint256 indexed validatorId,
        address indexed claimant,
        uint256 amount,
        uint256 timestamp
    );

    event ValidatorSlashed(
        uint256 indexed validatorId,
        uint256 indexed slashId,
        uint256 amount,
        string reason,
        bool jailed,
        uint256 timestamp
    );

    event ValidatorUnjailed(
        uint256 indexed validatorId,
        uint256 timestamp
    );

    event PerformanceRecorded(
        uint256 indexed validatorId,
        uint256 blocksProduced,
        uint256 blocksMissed,
        uint256 periodStart,
        uint256 periodEnd
    );

    event CommissionRateUpdated(
        uint256 indexed validatorId,
        uint256 oldRate,
        uint256 newRate
    );

    // Modifiers
    modifier onlyValidatorOwner(uint256 _validatorId) {
        require(validators[_validatorId].owner == msg.sender, "Not validator owner");
        _;
    }

    modifier validatorExists(uint256 _validatorId) {
        require(validators[_validatorId].id != 0, "Validator does not exist");
        _;
    }

    modifier validatorActive(uint256 _validatorId) {
        require(validators[_validatorId].status == ValidatorStatus.Active, "Validator not active");
        _;
    }

    constructor(address _stakingToken) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(OPERATOR_ROLE, msg.sender);
        _grantRole(SLASHER_ROLE, msg.sender);
        
        stakingToken = IERC20(_stakingToken);
    }

    // ============================================================
    // VALIDATOR REGISTRATION
    // ============================================================

    /**
     * @dev Register a new validator
     */
    function registerValidator(
        uint256 _chainId,
        address _validatorAddress,
        bytes memory _publicKey,
        string memory _name,
        uint256 _commissionRate,
        bool _isGenesis
    ) external whenNotPaused nonReentrant returns (uint256) {
        require(_validatorAddress != address(0), "Invalid validator address");
        require(!chainValidators[_chainId][_validatorAddress], "Validator already exists for chain");
        require(_commissionRate <= maxCommissionRate, "Commission too high");
        require(bytes(_publicKey).length > 0, "Public key required");

        _validatorIds.increment();
        uint256 validatorId = _validatorIds.current();

        Validator storage validator = validators[validatorId];
        validator.id = validatorId;
        validator.chainId = _chainId;
        validator.owner = msg.sender;
        validator.validatorAddress = _validatorAddress;
        validator.publicKey = _publicKey;
        validator.name = _name;
        validator.status = ValidatorStatus.Pending;
        validator.commissionRate = _commissionRate;
        validator.minStakeRequired = minStake;
        validator.createdAt = block.timestamp;
        validator.isGenesis = _isGenesis;

        chainValidators[_chainId][_validatorAddress] = true;
        validatorsByOwner[msg.sender].push(validatorId);
        validatorsByChain[_chainId].push(validatorId);

        emit ValidatorRegistered(
            validatorId,
            _chainId,
            msg.sender,
            _validatorAddress,
            _name,
            block.timestamp
        );

        return validatorId;
    }

    /**
     * @dev Activate a validator (requires minimum stake)
     */
    function activateValidator(uint256 _validatorId) 
        external 
        onlyRole(OPERATOR_ROLE) 
        validatorExists(_validatorId) 
    {
        Validator storage validator = validators[_validatorId];
        require(validator.status == ValidatorStatus.Pending || validator.status == ValidatorStatus.Inactive, 
                "Invalid status");
        require(validator.stakeAmount >= validator.minStakeRequired, "Insufficient stake");

        validator.status = ValidatorStatus.Active;
        validator.activatedAt = block.timestamp;
        validator.lastActiveAt = block.timestamp;

        emit ValidatorActivated(_validatorId, validator.chainId, block.timestamp);
    }

    /**
     * @dev Deactivate a validator
     */
    function deactivateValidator(uint256 _validatorId, string memory _reason) 
        external 
        onlyValidatorOwner(_validatorId) 
        validatorExists(_validatorId) 
    {
        Validator storage validator = validators[_validatorId];
        require(validator.status == ValidatorStatus.Active, "Not active");

        validator.status = ValidatorStatus.Inactive;

        emit ValidatorDeactivated(_validatorId, validator.chainId, _reason, block.timestamp);
    }

    /**
     * @dev Remove a validator completely
     */
    function removeValidator(uint256 _validatorId) 
        external 
        onlyValidatorOwner(_validatorId) 
        validatorExists(_validatorId) 
    {
        Validator storage validator = validators[_validatorId];
        require(
            validator.status == ValidatorStatus.Inactive || 
            validator.status == ValidatorStatus.Slashed,
            "Must be inactive or slashed"
        );
        require(validator.delegationsReceived == 0, "Has active delegations");
        require(block.timestamp >= validator.jailUntil, "Still jailed");

        // Return remaining stake
        if (validator.stakeAmount > 0) {
            uint256 returnAmount = validator.stakeAmount;
            validator.stakeAmount = 0;
            stakingToken.safeTransfer(validator.owner, returnAmount);
        }

        validator.status = ValidatorStatus.Removed;
        chainValidators[validator.chainId][validator.validatorAddress] = false;

        emit ValidatorRemoved(_validatorId, validator.chainId, block.timestamp);
    }

    // ============================================================
    // STAKING
    // ============================================================

    /**
     * @dev Add stake to a validator
     */
    function addStake(uint256 _validatorId, uint256 _amount) 
        external 
        onlyValidatorOwner(_validatorId) 
        validatorExists(_validatorId) 
        nonReentrant 
    {
        require(_amount > 0, "Amount must be positive");
        
        Validator storage validator = validators[_validatorId];
        require(
            validator.status != ValidatorStatus.Removed && 
            validator.status != ValidatorStatus.Slashed,
            "Cannot stake"
        );

        stakingToken.safeTransferFrom(msg.sender, address(this), _amount);
        validator.stakeAmount += _amount;

        emit StakeAdded(_validatorId, msg.sender, _amount, validator.stakeAmount, block.timestamp);
    }

    /**
     * @dev Withdraw stake from a validator
     */
    function withdrawStake(uint256 _validatorId, uint256 _amount) 
        external 
        onlyValidatorOwner(_validatorId) 
        validatorExists(_validatorId) 
        nonReentrant 
    {
        Validator storage validator = validators[_validatorId];
        require(_amount > 0 && _amount <= validator.stakeAmount, "Invalid amount");
        
        // Check if validator will still meet minimum stake if active
        if (validator.status == ValidatorStatus.Active) {
            require(
                validator.stakeAmount - _amount >= validator.minStakeRequired,
                "Would go below min stake"
            );
        }

        validator.stakeAmount -= _amount;
        stakingToken.safeTransfer(msg.sender, _amount);

        emit StakeWithdrawn(_validatorId, msg.sender, _amount, validator.stakeAmount, block.timestamp);
    }

    // ============================================================
    // DELEGATION
    // ============================================================

    /**
     * @dev Delegate tokens to a validator
     */
    function delegate(uint256 _validatorId, uint256 _amount) 
        external 
        validatorExists(_validatorId) 
        validatorActive(_validatorId) 
        nonReentrant 
        returns (uint256) 
    {
        require(_amount > 0, "Amount must be positive");

        stakingToken.safeTransferFrom(msg.sender, address(this), _amount);

        _delegationIds.increment();
        uint256 delegationId = _delegationIds.current();

        Delegation storage delegation = delegations[delegationId];
        delegation.validatorId = _validatorId;
        delegation.delegator = msg.sender;
        delegation.amount = _amount;
        delegation.delegatedAt = block.timestamp;
        delegation.isActive = true;

        delegationsByDelegator[msg.sender].push(delegationId);
        delegationsByValidator[_validatorId].push(delegationId);

        Validator storage validator = validators[_validatorId];
        validator.delegationsReceived += _amount;
        validator.delegatorsCount++;

        emit DelegationAdded(delegationId, _validatorId, msg.sender, _amount, block.timestamp);

        return delegationId;
    }

    /**
     * @dev Request to undelegate (starts unbonding period)
     */
    function requestUndelegate(uint256 _delegationId) 
        external 
        nonReentrant 
    {
        Delegation storage delegation = delegations[_delegationId];
        require(delegation.delegator == msg.sender, "Not delegator");
        require(delegation.isActive, "Not active");
        require(delegation.undelegateRequestedAt == 0, "Already requested");

        delegation.undelegateRequestedAt = block.timestamp;
    }

    /**
     * @dev Complete undelegation after unbonding period
     */
    function completeUndelegate(uint256 _delegationId) 
        external 
        nonReentrant 
    {
        Delegation storage delegation = delegations[_delegationId];
        require(delegation.delegator == msg.sender, "Not delegator");
        require(delegation.isActive, "Not active");
        require(delegation.undelegateRequestedAt > 0, "Not requested");
        require(
            block.timestamp >= delegation.undelegateRequestedAt + unbondingPeriod,
            "Unbonding period not over"
        );

        uint256 amount = delegation.amount;
        uint256 rewards = delegation.rewardsEarned - delegation.rewardsClaimed;

        Validator storage validator = validators[delegation.validatorId];
        validator.delegationsReceived -= amount;
        validator.delegatorsCount--;

        delegation.isActive = false;
        delegation.amount = 0;

        // Transfer principal + unclaimed rewards
        stakingToken.safeTransfer(msg.sender, amount + rewards);

        emit DelegationRemoved(
            _delegationId, 
            delegation.validatorId, 
            msg.sender, 
            amount, 
            block.timestamp
        );
    }

    // ============================================================
    // REWARDS
    // ============================================================

    /**
     * @dev Distribute rewards to a validator and their delegators
     */
    function distributeRewards(uint256 _validatorId, uint256 _totalReward) 
        external 
        onlyRole(OPERATOR_ROLE) 
        validatorExists(_validatorId) 
        nonReentrant 
    {
        require(_totalReward > 0, "No rewards to distribute");

        Validator storage validator = validators[_validatorId];
        
        // Calculate commission for validator
        uint256 validatorCommission = (_totalReward * validator.commissionRate) / 10000;
        uint256 delegatorsReward = _totalReward - validatorCommission;

        // Add commission to validator rewards
        validator.rewardsEarned += validatorCommission;

        // Distribute to delegators proportionally
        if (validator.delegationsReceived > 0) {
            uint256[] memory validatorDelegations = delegationsByValidator[_validatorId];
            for (uint256 i = 0; i < validatorDelegations.length; i++) {
                Delegation storage delegation = delegations[validatorDelegations[i]];
                if (delegation.isActive) {
                    uint256 delegatorShare = (delegatorsReward * delegation.amount) / validator.delegationsReceived;
                    delegation.rewardsEarned += delegatorShare;
                }
            }
        } else {
            // If no delegators, all rewards go to validator
            validator.rewardsEarned += delegatorsReward;
        }

        // Transfer rewards to contract
        stakingToken.safeTransferFrom(msg.sender, address(this), _totalReward);

        emit RewardsDistributed(_validatorId, validatorCommission, delegatorsReward, block.timestamp);
    }

    /**
     * @dev Claim validator rewards
     */
    function claimValidatorRewards(uint256 _validatorId) 
        external 
        onlyValidatorOwner(_validatorId) 
        validatorExists(_validatorId) 
        nonReentrant 
    {
        Validator storage validator = validators[_validatorId];
        uint256 claimable = validator.rewardsEarned - validator.rewardsClaimed;
        require(claimable > 0, "No rewards to claim");

        validator.rewardsClaimed += claimable;
        stakingToken.safeTransfer(msg.sender, claimable);

        emit RewardsClaimed(_validatorId, msg.sender, claimable, block.timestamp);
    }

    /**
     * @dev Claim delegator rewards
     */
    function claimDelegatorRewards(uint256 _delegationId) 
        external 
        nonReentrant 
    {
        Delegation storage delegation = delegations[_delegationId];
        require(delegation.delegator == msg.sender, "Not delegator");
        
        uint256 claimable = delegation.rewardsEarned - delegation.rewardsClaimed;
        require(claimable > 0, "No rewards to claim");

        delegation.rewardsClaimed += claimable;
        stakingToken.safeTransfer(msg.sender, claimable);

        emit RewardsClaimed(delegation.validatorId, msg.sender, claimable, block.timestamp);
    }

    // ============================================================
    // SLASHING
    // ============================================================

    /**
     * @dev Slash a validator for misbehavior
     */
    function slashValidator(
        uint256 _validatorId,
        uint256 _percentage, // basis points
        string memory _reason,
        bool _jail
    ) external onlyRole(SLASHER_ROLE) validatorExists(_validatorId) nonReentrant {
        require(_percentage > 0 && _percentage <= maxSlashPercentage, "Invalid slash percentage");

        Validator storage validator = validators[_validatorId];
        
        uint256 totalStake = validator.stakeAmount + validator.delegationsReceived;
        uint256 slashAmount = (totalStake * _percentage) / 10000;
        
        if (slashAmount < minSlashAmount) {
            slashAmount = minSlashAmount > totalStake ? totalStake : minSlashAmount;
        }

        // Slash from validator stake first
        uint256 fromValidator = slashAmount > validator.stakeAmount ? validator.stakeAmount : slashAmount;
        validator.stakeAmount -= fromValidator;
        
        // If more to slash, take from delegations proportionally
        if (slashAmount > fromValidator && validator.delegationsReceived > 0) {
            uint256 remainingSlash = slashAmount - fromValidator;
            uint256[] memory validatorDelegations = delegationsByValidator[_validatorId];
            
            for (uint256 i = 0; i < validatorDelegations.length; i++) {
                Delegation storage delegation = delegations[validatorDelegations[i]];
                if (delegation.isActive) {
                    uint256 delegatorSlash = (remainingSlash * delegation.amount) / validator.delegationsReceived;
                    delegation.amount -= delegatorSlash;
                }
            }
            validator.delegationsReceived -= remainingSlash;
        }

        validator.slashCount++;
        validator.totalSlashed += slashAmount;

        if (_jail) {
            validator.status = ValidatorStatus.Jailed;
            validator.jailUntil = block.timestamp + slashJailDuration;
        }

        _slashIds.increment();
        uint256 slashId = _slashIds.current();

        SlashEvent memory slashEvent = SlashEvent({
            validatorId: _validatorId,
            amount: slashAmount,
            reason: _reason,
            slashedAt: block.timestamp,
            slashedBy: msg.sender,
            jailed: _jail,
            jailDuration: _jail ? slashJailDuration : 0
        });
        slashHistory[_validatorId].push(slashEvent);

        emit ValidatorSlashed(_validatorId, slashId, slashAmount, _reason, _jail, block.timestamp);
    }

    /**
     * @dev Unjail a validator after jail period
     */
    function unjailValidator(uint256 _validatorId) 
        external 
        onlyValidatorOwner(_validatorId) 
        validatorExists(_validatorId) 
    {
        Validator storage validator = validators[_validatorId];
        require(validator.status == ValidatorStatus.Jailed, "Not jailed");
        require(block.timestamp >= validator.jailUntil, "Still in jail");
        require(validator.stakeAmount >= validator.minStakeRequired, "Insufficient stake");

        validator.status = ValidatorStatus.Active;
        validator.jailUntil = 0;

        emit ValidatorUnjailed(_validatorId, block.timestamp);
    }

    // ============================================================
    // PERFORMANCE MONITORING
    // ============================================================

    /**
     * @dev Record validator performance
     */
    function recordPerformance(
        uint256 _validatorId,
        uint256 _blocksProduced,
        uint256 _blocksMissed,
        uint256 _transactionsProcessed,
        uint256 _uptimeSeconds,
        uint256 _avgResponseTimeMs,
        uint256 _rewardsEarned,
        uint256 _periodStart,
        uint256 _periodEnd
    ) external onlyRole(OPERATOR_ROLE) validatorExists(_validatorId) {
        Validator storage validator = validators[_validatorId];
        validator.blocksProduced += _blocksProduced;
        validator.blocksMissed += _blocksMissed;
        validator.lastActiveAt = block.timestamp;

        PerformanceRecord memory record = PerformanceRecord({
            validatorId: _validatorId,
            blocksProduced: _blocksProduced,
            blocksMissed: _blocksMissed,
            transactionsProcessed: _transactionsProcessed,
            uptimeSeconds: _uptimeSeconds,
            avgResponseTimeMs: _avgResponseTimeMs,
            rewardsEarned: _rewardsEarned,
            periodStart: _periodStart,
            periodEnd: _periodEnd
        });
        performanceHistory[_validatorId].push(record);

        emit PerformanceRecorded(_validatorId, _blocksProduced, _blocksMissed, _periodStart, _periodEnd);
    }

    // ============================================================
    // CONFIGURATION
    // ============================================================

    /**
     * @dev Update validator commission rate
     */
    function updateCommissionRate(uint256 _validatorId, uint256 _newRate) 
        external 
        onlyValidatorOwner(_validatorId) 
        validatorExists(_validatorId) 
    {
        require(_newRate <= maxCommissionRate, "Rate too high");
        
        Validator storage validator = validators[_validatorId];
        uint256 oldRate = validator.commissionRate;
        validator.commissionRate = _newRate;

        emit CommissionRateUpdated(_validatorId, oldRate, _newRate);
    }

    // ============================================================
    // VIEW FUNCTIONS
    // ============================================================

    /**
     * @dev Get validator details
     */
    function getValidator(uint256 _validatorId) external view returns (Validator memory) {
        return validators[_validatorId];
    }

    /**
     * @dev Get validators by chain
     */
    function getValidatorsByChain(uint256 _chainId) external view returns (uint256[] memory) {
        return validatorsByChain[_chainId];
    }

    /**
     * @dev Get validators by owner
     */
    function getValidatorsByOwner(address _owner) external view returns (uint256[] memory) {
        return validatorsByOwner[_owner];
    }

    /**
     * @dev Get delegation details
     */
    function getDelegation(uint256 _delegationId) external view returns (Delegation memory) {
        return delegations[_delegationId];
    }

    /**
     * @dev Get delegations by delegator
     */
    function getDelegationsByDelegator(address _delegator) external view returns (uint256[] memory) {
        return delegationsByDelegator[_delegator];
    }

    /**
     * @dev Get delegations by validator
     */
    function getDelegationsByValidator(uint256 _validatorId) external view returns (uint256[] memory) {
        return delegationsByValidator[_validatorId];
    }

    /**
     * @dev Get performance history
     */
    function getPerformanceHistory(uint256 _validatorId) external view returns (PerformanceRecord[] memory) {
        return performanceHistory[_validatorId];
    }

    /**
     * @dev Get slash history
     */
    function getSlashHistory(uint256 _validatorId) external view returns (SlashEvent[] memory) {
        return slashHistory[_validatorId];
    }

    /**
     * @dev Get total validators count
     */
    function getTotalValidators() external view returns (uint256) {
        return _validatorIds.current();
    }

    /**
     * @dev Calculate effective stake (own stake + delegations)
     */
    function getEffectiveStake(uint256 _validatorId) external view returns (uint256) {
        Validator storage validator = validators[_validatorId];
        return validator.stakeAmount + validator.delegationsReceived;
    }

    // ============================================================
    // ADMIN FUNCTIONS
    // ============================================================

    /**
     * @dev Update minimum stake requirement
     */
    function setMinStake(uint256 _minStake) external onlyRole(ADMIN_ROLE) {
        minStake = _minStake;
    }

    /**
     * @dev Update maximum commission rate
     */
    function setMaxCommissionRate(uint256 _maxRate) external onlyRole(ADMIN_ROLE) {
        require(_maxRate <= 10000, "Cannot exceed 100%");
        maxCommissionRate = _maxRate;
    }

    /**
     * @dev Update unbonding period
     */
    function setUnbondingPeriod(uint256 _period) external onlyRole(ADMIN_ROLE) {
        unbondingPeriod = _period;
    }

    /**
     * @dev Update slash parameters
     */
    function setSlashParams(
        uint256 _jailDuration,
        uint256 _minSlashAmount,
        uint256 _maxSlashPercentage
    ) external onlyRole(ADMIN_ROLE) {
        require(_maxSlashPercentage <= 10000, "Cannot exceed 100%");
        slashJailDuration = _jailDuration;
        minSlashAmount = _minSlashAmount;
        maxSlashPercentage = _maxSlashPercentage;
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
}


