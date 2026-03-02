// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title PolyOneSharedLiquidity
 * @dev Shared liquidity primitives to reduce capital fragmentation across appchains.
 * LPs deposit tokens into pools (per token + destination chain); bridge can use pool liquidity for claims.
 */
contract PolyOneSharedLiquidity is AccessControl, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    bytes32 public constant BRIDGE_ROLE = keccak256("BRIDGE_ROLE"); // Bridge contract can release liquidity for claims

    struct Pool {
        address token;
        uint256 destinationChainId;
        uint256 totalDeposited;
        uint256 totalUsed; // Released for bridge claims
        bool isActive;
    }

    struct LPPosition {
        uint256 shares; // Proportional share of pool (simplified: 1:1 with amount for now)
        uint256 depositedAt;
    }

    // poolId = keccak256(abi.encodePacked(token, destinationChainId))
    mapping(bytes32 => Pool) public pools;
    mapping(bytes32 => mapping(address => LPPosition)) public positions;
    mapping(bytes32 => address[]) public poolLPs;
    bytes32[] public poolIds;

    mapping(address => bool) public approvedTokens;

    event PoolCreated(bytes32 indexed poolId, address indexed token, uint256 destinationChainId, uint256 timestamp);
    event LiquidityDeposited(bytes32 indexed poolId, address indexed provider, uint256 amount, uint256 timestamp);
    event LiquidityWithdrawn(bytes32 indexed poolId, address indexed provider, uint256 amount, uint256 timestamp);
    event LiquidityReleasedForClaim(bytes32 indexed poolId, uint256 amount, address indexed recipient, uint256 timestamp);

    modifier onlyBridge() {
        require(hasRole(BRIDGE_ROLE, msg.sender), "Caller is not bridge");
        _;
    }

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(OPERATOR_ROLE, msg.sender);
    }

    /**
     * @dev Create or get pool for (token, destinationChainId)
     */
    function createPool(address _token, uint256 _destinationChainId) external onlyRole(ADMIN_ROLE) returns (bytes32 poolId) {
        poolId = keccak256(abi.encodePacked(_token, _destinationChainId));
        require(pools[poolId].token == address(0), "Pool exists");
        require(approvedTokens[_token], "Token not approved");

        pools[poolId] = Pool({
            token: _token,
            destinationChainId: _destinationChainId,
            totalDeposited: 0,
            totalUsed: 0,
            isActive: true
        });
        poolIds.push(poolId);
        emit PoolCreated(poolId, _token, _destinationChainId, block.timestamp);
    }

    function setApprovedToken(address _token, bool _approved) external onlyRole(ADMIN_ROLE) {
        approvedTokens[_token] = _approved;
    }

    /**
     * @dev LP deposits liquidity into shared pool
     */
    function depositLiquidity(address _token, uint256 _destinationChainId, uint256 _amount)
        external
        whenNotPaused
        nonReentrant
    {
        bytes32 poolId = keccak256(abi.encodePacked(_token, _destinationChainId));
        Pool storage pool = pools[poolId];
        require(pool.token != address(0) && pool.isActive, "Pool not active");

        IERC20(_token).safeTransferFrom(msg.sender, address(this), _amount);

        pool.totalDeposited += _amount;
        LPPosition storage pos = positions[poolId][msg.sender];
        if (pos.shares == 0) {
            poolLPs[poolId].push(msg.sender);
        }
        pos.shares += _amount;
        pos.depositedAt = block.timestamp;

        emit LiquidityDeposited(poolId, msg.sender, _amount, block.timestamp);
    }

    /**
     * @dev LP withdraws liquidity (only unused portion; simplified: withdraw up to (totalDeposited - totalUsed) proportionally)
     */
    function withdrawLiquidity(address _token, uint256 _destinationChainId, uint256 _amount)
        external
        whenNotPaused
        nonReentrant
    {
        bytes32 poolId = keccak256(abi.encodePacked(_token, _destinationChainId));
        Pool storage pool = pools[poolId];
        LPPosition storage pos = positions[poolId][msg.sender];
        require(pos.shares >= _amount, "Insufficient balance");

        uint256 available = pool.totalDeposited - pool.totalUsed;
        require(available >= _amount, "Pool liquidity in use");

        pos.shares -= _amount;
        pool.totalDeposited -= _amount;

        IERC20(_token).safeTransfer(msg.sender, _amount);
        emit LiquidityWithdrawn(poolId, msg.sender, _amount, block.timestamp);
    }

    /**
     * @dev Bridge calls this when fulfilling a claim on destination chain (releases pool liquidity)
     */
    function releaseLiquidityForClaim(address _token, uint256 _destinationChainId, uint256 _amount, address _recipient)
        external
        onlyBridge
        nonReentrant
    {
        bytes32 poolId = keccak256(abi.encodePacked(_token, _destinationChainId));
        Pool storage pool = pools[poolId];
        require(pool.isActive, "Pool not active");
        uint256 available = pool.totalDeposited - pool.totalUsed;
        require(available >= _amount, "Insufficient pool liquidity");

        pool.totalUsed += _amount;
        IERC20(_token).safeTransfer(_recipient, _amount);
        emit LiquidityReleasedForClaim(poolId, _amount, _recipient, block.timestamp);
    }

    /**
     * @dev Get available liquidity for (token, destinationChainId)
     */
    function getPoolBalance(address _token, uint256 _destinationChainId) external view returns (uint256 totalDeposited, uint256 totalUsed, uint256 available) {
        bytes32 poolId = keccak256(abi.encodePacked(_token, _destinationChainId));
        Pool storage pool = pools[poolId];
        totalDeposited = pool.totalDeposited;
        totalUsed = pool.totalUsed;
        available = totalDeposited > totalUsed ? totalDeposited - totalUsed : 0;
    }

    function getPoolId(address _token, uint256 _destinationChainId) external pure returns (bytes32) {
        return keccak256(abi.encodePacked(_token, _destinationChainId));
    }
}
