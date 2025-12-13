// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title PolyOneBilling
 * @dev Smart contract for managing subscriptions and payments on-chain
 * Features: Subscription plans, payments, invoices, usage-based billing
 */
contract PolyOneBilling is AccessControl, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;
    using Counters for Counters.Counter;

    // Roles
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant BILLING_ROLE = keccak256("BILLING_ROLE");

    // Subscription status
    enum SubscriptionStatus {
        Trial,
        Active,
        PastDue,
        Canceled,
        Paused,
        Expired
    }

    // Payment status
    enum PaymentStatus {
        Pending,
        Processing,
        Succeeded,
        Failed,
        Refunded
    }

    // Billing cycle
    enum BillingCycle {
        Monthly,
        Yearly
    }

    // Subscription plan struct
    struct SubscriptionPlan {
        uint256 id;
        string name;
        string slug;
        uint256 priceMonthly;
        uint256 priceYearly;
        uint256 maxChains;
        uint256 maxValidatorsPerChain;
        uint256 maxTps;
        uint256 maxStorageGb;
        uint256 maxBandwidthGb;
        uint256 maxTeamMembers;
        uint256 maxApiCallsPerMonth;
        bool bridgeEnabled;
        bool analyticsEnabled;
        bool prioritySupport;
        bool isActive;
        bool isPublic;
    }

    // Subscription struct
    struct Subscription {
        uint256 id;
        address subscriber;
        uint256 planId;
        SubscriptionStatus status;
        BillingCycle billingCycle;
        uint256 currentPeriodStart;
        uint256 currentPeriodEnd;
        uint256 trialEnd;
        uint256 canceledAt;
        uint256 createdAt;
        uint256 nextPaymentAmount;
        uint256 chainsUsed;
        uint256 storageUsedGb;
        uint256 bandwidthUsedGb;
        uint256 apiCallsUsed;
    }

    // Payment struct
    struct Payment {
        uint256 id;
        uint256 subscriptionId;
        address payer;
        uint256 amount;
        address paymentToken;
        PaymentStatus status;
        string paymentType; // "subscription", "one_time", "usage"
        uint256 periodStart;
        uint256 periodEnd;
        uint256 createdAt;
        uint256 processedAt;
        bytes32 txHash;
        string failureReason;
    }

    // Invoice struct
    struct Invoice {
        uint256 id;
        uint256 subscriptionId;
        address subscriber;
        string invoiceNumber;
        uint256 subtotal;
        uint256 tax;
        uint256 discount;
        uint256 total;
        uint256 amountDue;
        uint256 amountPaid;
        uint256 periodStart;
        uint256 periodEnd;
        uint256 dueDate;
        uint256 paidAt;
        bool isPaid;
        uint256 createdAt;
    }

    // Usage record struct
    struct UsageRecord {
        uint256 subscriptionId;
        string usageType; // "api_calls", "storage", "bandwidth"
        uint256 quantity;
        uint256 unitPrice;
        uint256 periodStart;
        uint256 periodEnd;
        bool billed;
        uint256 invoiceId;
        uint256 createdAt;
    }

    // State variables
    Counters.Counter private _planIds;
    Counters.Counter private _subscriptionIds;
    Counters.Counter private _paymentIds;
    Counters.Counter private _invoiceIds;
    Counters.Counter private _invoiceNumberCounter;

    mapping(uint256 => SubscriptionPlan) public plans;
    mapping(string => uint256) public plansBySlug;
    uint256[] public planList;

    mapping(uint256 => Subscription) public subscriptions;
    mapping(address => uint256[]) public subscriberSubscriptions;
    mapping(address => uint256) public activeSubscription;

    mapping(uint256 => Payment) public payments;
    mapping(uint256 => uint256[]) public subscriptionPayments;
    mapping(address => uint256[]) public userPayments;

    mapping(uint256 => Invoice) public invoices;
    mapping(uint256 => uint256[]) public subscriptionInvoices;

    mapping(uint256 => UsageRecord[]) public usageRecords;

    // Payment tokens
    mapping(address => bool) public acceptedPaymentTokens;
    address[] public paymentTokenList;
    address public nativePaymentToken; // For tracking native currency payments

    // Configuration
    uint256 public trialPeriod = 14 days;
    uint256 public gracePeriod = 7 days;
    address public treasury;
    uint256 public taxRate = 0; // In basis points (e.g., 1000 = 10%)

    // Discount codes
    mapping(bytes32 => uint256) public discountCodes; // code hash => discount percentage (basis points)
    mapping(bytes32 => uint256) public discountCodeUsage;
    mapping(bytes32 => uint256) public discountCodeMaxUses;

    // Events
    event PlanCreated(
        uint256 indexed planId,
        string name,
        uint256 priceMonthly,
        uint256 priceYearly,
        uint256 timestamp
    );

    event PlanUpdated(
        uint256 indexed planId,
        uint256 priceMonthly,
        uint256 priceYearly,
        bool isActive,
        uint256 timestamp
    );

    event SubscriptionCreated(
        uint256 indexed subscriptionId,
        address indexed subscriber,
        uint256 indexed planId,
        BillingCycle billingCycle,
        uint256 timestamp
    );

    event SubscriptionUpdated(
        uint256 indexed subscriptionId,
        SubscriptionStatus status,
        uint256 timestamp
    );

    event SubscriptionCanceled(
        uint256 indexed subscriptionId,
        address indexed subscriber,
        uint256 timestamp
    );

    event SubscriptionRenewed(
        uint256 indexed subscriptionId,
        uint256 newPeriodEnd,
        uint256 amount,
        uint256 timestamp
    );

    event PaymentProcessed(
        uint256 indexed paymentId,
        uint256 indexed subscriptionId,
        address indexed payer,
        uint256 amount,
        PaymentStatus status,
        uint256 timestamp
    );

    event PaymentRefunded(
        uint256 indexed paymentId,
        uint256 amount,
        uint256 timestamp
    );

    event InvoiceCreated(
        uint256 indexed invoiceId,
        uint256 indexed subscriptionId,
        string invoiceNumber,
        uint256 total,
        uint256 dueDate,
        uint256 timestamp
    );

    event InvoicePaid(
        uint256 indexed invoiceId,
        uint256 amount,
        uint256 timestamp
    );

    event UsageRecorded(
        uint256 indexed subscriptionId,
        string usageType,
        uint256 quantity,
        uint256 timestamp
    );

    event DiscountCodeCreated(
        bytes32 indexed codeHash,
        uint256 discountPercentage,
        uint256 maxUses
    );

    // Modifiers
    modifier onlySubscriber(uint256 _subscriptionId) {
        require(subscriptions[_subscriptionId].subscriber == msg.sender, "Not subscriber");
        _;
    }

    modifier subscriptionExists(uint256 _subscriptionId) {
        require(subscriptions[_subscriptionId].id != 0, "Subscription not found");
        _;
    }

    modifier planExists(uint256 _planId) {
        require(plans[_planId].id != 0, "Plan not found");
        _;
    }

    modifier acceptedToken(address _token) {
        require(acceptedPaymentTokens[_token] || _token == address(0), "Token not accepted");
        _;
    }

    constructor(address _treasury) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(BILLING_ROLE, msg.sender);
        
        treasury = _treasury;
    }

    // ============================================================
    // SUBSCRIPTION PLANS
    // ============================================================

    /**
     * @dev Create a new subscription plan
     */
    function createPlan(
        string memory _name,
        string memory _slug,
        uint256 _priceMonthly,
        uint256 _priceYearly,
        uint256 _maxChains,
        uint256 _maxValidatorsPerChain,
        uint256 _maxTps,
        uint256 _maxStorageGb,
        uint256 _maxBandwidthGb,
        uint256 _maxTeamMembers,
        uint256 _maxApiCallsPerMonth,
        bool _bridgeEnabled,
        bool _analyticsEnabled,
        bool _prioritySupport
    ) external onlyRole(ADMIN_ROLE) returns (uint256) {
        require(plansBySlug[_slug] == 0, "Slug already exists");

        _planIds.increment();
        uint256 planId = _planIds.current();

        SubscriptionPlan storage plan = plans[planId];
        plan.id = planId;
        plan.name = _name;
        plan.slug = _slug;
        plan.priceMonthly = _priceMonthly;
        plan.priceYearly = _priceYearly;
        plan.maxChains = _maxChains;
        plan.maxValidatorsPerChain = _maxValidatorsPerChain;
        plan.maxTps = _maxTps;
        plan.maxStorageGb = _maxStorageGb;
        plan.maxBandwidthGb = _maxBandwidthGb;
        plan.maxTeamMembers = _maxTeamMembers;
        plan.maxApiCallsPerMonth = _maxApiCallsPerMonth;
        plan.bridgeEnabled = _bridgeEnabled;
        plan.analyticsEnabled = _analyticsEnabled;
        plan.prioritySupport = _prioritySupport;
        plan.isActive = true;
        plan.isPublic = true;

        plansBySlug[_slug] = planId;
        planList.push(planId);

        emit PlanCreated(planId, _name, _priceMonthly, _priceYearly, block.timestamp);

        return planId;
    }

    /**
     * @dev Update a subscription plan
     */
    function updatePlan(
        uint256 _planId,
        uint256 _priceMonthly,
        uint256 _priceYearly,
        bool _isActive,
        bool _isPublic
    ) external onlyRole(ADMIN_ROLE) planExists(_planId) {
        SubscriptionPlan storage plan = plans[_planId];
        plan.priceMonthly = _priceMonthly;
        plan.priceYearly = _priceYearly;
        plan.isActive = _isActive;
        plan.isPublic = _isPublic;

        emit PlanUpdated(_planId, _priceMonthly, _priceYearly, _isActive, block.timestamp);
    }

    // ============================================================
    // SUBSCRIPTIONS
    // ============================================================

    /**
     * @dev Create a new subscription with payment
     */
    function subscribe(
        uint256 _planId,
        BillingCycle _billingCycle,
        address _paymentToken,
        bytes32 _discountCode
    ) external payable whenNotPaused nonReentrant planExists(_planId) acceptedToken(_paymentToken) returns (uint256) {
        SubscriptionPlan storage plan = plans[_planId];
        require(plan.isActive, "Plan not active");
        require(activeSubscription[msg.sender] == 0, "Already has active subscription");

        // Calculate price
        uint256 price = _billingCycle == BillingCycle.Monthly ? plan.priceMonthly : plan.priceYearly;
        
        // Apply discount if valid
        uint256 discount = 0;
        if (_discountCode != bytes32(0)) {
            discount = _applyDiscount(_discountCode, price);
        }
        
        uint256 finalPrice = price - discount;
        
        // Apply tax
        uint256 tax = (finalPrice * taxRate) / 10000;
        uint256 totalAmount = finalPrice + tax;

        // Process payment
        _processPayment(msg.sender, totalAmount, _paymentToken);

        // Create subscription
        _subscriptionIds.increment();
        uint256 subscriptionId = _subscriptionIds.current();

        uint256 periodLength = _billingCycle == BillingCycle.Monthly ? 30 days : 365 days;

        Subscription storage subscription = subscriptions[subscriptionId];
        subscription.id = subscriptionId;
        subscription.subscriber = msg.sender;
        subscription.planId = _planId;
        subscription.status = SubscriptionStatus.Active;
        subscription.billingCycle = _billingCycle;
        subscription.currentPeriodStart = block.timestamp;
        subscription.currentPeriodEnd = block.timestamp + periodLength;
        subscription.createdAt = block.timestamp;
        subscription.nextPaymentAmount = totalAmount;

        subscriberSubscriptions[msg.sender].push(subscriptionId);
        activeSubscription[msg.sender] = subscriptionId;

        // Create payment record
        _createPaymentRecord(subscriptionId, msg.sender, totalAmount, _paymentToken, "subscription");

        // Create invoice
        _createInvoice(subscriptionId, finalPrice, tax, discount, totalAmount);

        emit SubscriptionCreated(subscriptionId, msg.sender, _planId, _billingCycle, block.timestamp);

        return subscriptionId;
    }

    /**
     * @dev Start a trial subscription
     */
    function startTrial(uint256 _planId) 
        external 
        whenNotPaused 
        planExists(_planId) 
        returns (uint256) 
    {
        SubscriptionPlan storage plan = plans[_planId];
        require(plan.isActive, "Plan not active");
        require(activeSubscription[msg.sender] == 0, "Already has active subscription");

        _subscriptionIds.increment();
        uint256 subscriptionId = _subscriptionIds.current();

        Subscription storage subscription = subscriptions[subscriptionId];
        subscription.id = subscriptionId;
        subscription.subscriber = msg.sender;
        subscription.planId = _planId;
        subscription.status = SubscriptionStatus.Trial;
        subscription.billingCycle = BillingCycle.Monthly; // Default to monthly
        subscription.currentPeriodStart = block.timestamp;
        subscription.currentPeriodEnd = block.timestamp + trialPeriod;
        subscription.trialEnd = block.timestamp + trialPeriod;
        subscription.createdAt = block.timestamp;

        subscriberSubscriptions[msg.sender].push(subscriptionId);
        activeSubscription[msg.sender] = subscriptionId;

        emit SubscriptionCreated(subscriptionId, msg.sender, _planId, BillingCycle.Monthly, block.timestamp);

        return subscriptionId;
    }

    /**
     * @dev Renew subscription (can be called by anyone, usually automated)
     */
    function renewSubscription(uint256 _subscriptionId, address _paymentToken) 
        external 
        payable 
        whenNotPaused 
        nonReentrant 
        subscriptionExists(_subscriptionId)
        acceptedToken(_paymentToken)
    {
        Subscription storage subscription = subscriptions[_subscriptionId];
        require(
            subscription.status == SubscriptionStatus.Active ||
            subscription.status == SubscriptionStatus.PastDue,
            "Cannot renew"
        );
        require(block.timestamp >= subscription.currentPeriodEnd - 1 days, "Too early to renew");

        SubscriptionPlan storage plan = plans[subscription.planId];
        uint256 price = subscription.billingCycle == BillingCycle.Monthly 
            ? plan.priceMonthly 
            : plan.priceYearly;
        
        uint256 tax = (price * taxRate) / 10000;
        uint256 totalAmount = price + tax;

        // Process payment
        _processPayment(subscription.subscriber, totalAmount, _paymentToken);

        // Update subscription period
        uint256 periodLength = subscription.billingCycle == BillingCycle.Monthly ? 30 days : 365 days;
        subscription.currentPeriodStart = subscription.currentPeriodEnd;
        subscription.currentPeriodEnd = subscription.currentPeriodStart + periodLength;
        subscription.status = SubscriptionStatus.Active;

        // Create payment record
        _createPaymentRecord(_subscriptionId, subscription.subscriber, totalAmount, _paymentToken, "subscription");

        // Create invoice
        _createInvoice(_subscriptionId, price, tax, 0, totalAmount);

        emit SubscriptionRenewed(_subscriptionId, subscription.currentPeriodEnd, totalAmount, block.timestamp);
    }

    /**
     * @dev Cancel subscription
     */
    function cancelSubscription(uint256 _subscriptionId) 
        external 
        onlySubscriber(_subscriptionId) 
        subscriptionExists(_subscriptionId) 
    {
        Subscription storage subscription = subscriptions[_subscriptionId];
        require(
            subscription.status == SubscriptionStatus.Active ||
            subscription.status == SubscriptionStatus.Trial,
            "Cannot cancel"
        );

        subscription.status = SubscriptionStatus.Canceled;
        subscription.canceledAt = block.timestamp;
        activeSubscription[msg.sender] = 0;

        emit SubscriptionCanceled(_subscriptionId, msg.sender, block.timestamp);
    }

    /**
     * @dev Pause subscription
     */
    function pauseSubscription(uint256 _subscriptionId) 
        external 
        onlySubscriber(_subscriptionId) 
        subscriptionExists(_subscriptionId) 
    {
        Subscription storage subscription = subscriptions[_subscriptionId];
        require(subscription.status == SubscriptionStatus.Active, "Not active");

        subscription.status = SubscriptionStatus.Paused;

        emit SubscriptionUpdated(_subscriptionId, SubscriptionStatus.Paused, block.timestamp);
    }

    /**
     * @dev Resume subscription
     */
    function resumeSubscription(uint256 _subscriptionId) 
        external 
        onlySubscriber(_subscriptionId) 
        subscriptionExists(_subscriptionId) 
    {
        Subscription storage subscription = subscriptions[_subscriptionId];
        require(subscription.status == SubscriptionStatus.Paused, "Not paused");
        require(block.timestamp < subscription.currentPeriodEnd, "Period expired");

        subscription.status = SubscriptionStatus.Active;

        emit SubscriptionUpdated(_subscriptionId, SubscriptionStatus.Active, block.timestamp);
    }

    /**
     * @dev Update subscription to past due (called by billing service)
     */
    function markPastDue(uint256 _subscriptionId) 
        external 
        onlyRole(BILLING_ROLE) 
        subscriptionExists(_subscriptionId) 
    {
        Subscription storage subscription = subscriptions[_subscriptionId];
        require(
            subscription.status == SubscriptionStatus.Active,
            "Not active"
        );
        require(block.timestamp > subscription.currentPeriodEnd, "Period not ended");

        subscription.status = SubscriptionStatus.PastDue;

        emit SubscriptionUpdated(_subscriptionId, SubscriptionStatus.PastDue, block.timestamp);
    }

    /**
     * @dev Expire subscription after grace period
     */
    function expireSubscription(uint256 _subscriptionId) 
        external 
        onlyRole(BILLING_ROLE) 
        subscriptionExists(_subscriptionId) 
    {
        Subscription storage subscription = subscriptions[_subscriptionId];
        require(
            subscription.status == SubscriptionStatus.PastDue,
            "Not past due"
        );
        require(
            block.timestamp > subscription.currentPeriodEnd + gracePeriod,
            "Grace period not ended"
        );

        subscription.status = SubscriptionStatus.Expired;
        activeSubscription[subscription.subscriber] = 0;

        emit SubscriptionUpdated(_subscriptionId, SubscriptionStatus.Expired, block.timestamp);
    }

    // ============================================================
    // USAGE TRACKING
    // ============================================================

    /**
     * @dev Record usage for a subscription
     */
    function recordUsage(
        uint256 _subscriptionId,
        string memory _usageType,
        uint256 _quantity,
        uint256 _unitPrice
    ) external onlyRole(BILLING_ROLE) subscriptionExists(_subscriptionId) {
        Subscription storage subscription = subscriptions[_subscriptionId];

        UsageRecord memory record = UsageRecord({
            subscriptionId: _subscriptionId,
            usageType: _usageType,
            quantity: _quantity,
            unitPrice: _unitPrice,
            periodStart: subscription.currentPeriodStart,
            periodEnd: subscription.currentPeriodEnd,
            billed: false,
            invoiceId: 0,
            createdAt: block.timestamp
        });

        usageRecords[_subscriptionId].push(record);

        // Update subscription usage counters
        if (keccak256(bytes(_usageType)) == keccak256("api_calls")) {
            subscription.apiCallsUsed += _quantity;
        } else if (keccak256(bytes(_usageType)) == keccak256("storage")) {
            subscription.storageUsedGb += _quantity;
        } else if (keccak256(bytes(_usageType)) == keccak256("bandwidth")) {
            subscription.bandwidthUsedGb += _quantity;
        }

        emit UsageRecorded(_subscriptionId, _usageType, _quantity, block.timestamp);
    }

    /**
     * @dev Update chain count for subscription
     */
    function updateChainCount(uint256 _subscriptionId, uint256 _count) 
        external 
        onlyRole(BILLING_ROLE) 
        subscriptionExists(_subscriptionId) 
    {
        subscriptions[_subscriptionId].chainsUsed = _count;
    }

    // ============================================================
    // PAYMENT PROCESSING
    // ============================================================

    /**
     * @dev Process payment internally
     */
    function _processPayment(
        address _payer,
        uint256 _amount,
        address _paymentToken
    ) internal {
        if (_paymentToken == address(0)) {
            // Native currency payment
            require(msg.value >= _amount, "Insufficient payment");
            
            // Send to treasury
            payable(treasury).transfer(_amount);
            
            // Refund excess
            if (msg.value > _amount) {
                payable(_payer).transfer(msg.value - _amount);
            }
        } else {
            // ERC20 payment
            IERC20(_paymentToken).safeTransferFrom(_payer, treasury, _amount);
        }
    }

    /**
     * @dev Create payment record
     */
    function _createPaymentRecord(
        uint256 _subscriptionId,
        address _payer,
        uint256 _amount,
        address _paymentToken,
        string memory _paymentType
    ) internal returns (uint256) {
        _paymentIds.increment();
        uint256 paymentId = _paymentIds.current();

        Subscription storage subscription = subscriptions[_subscriptionId];

        Payment storage payment = payments[paymentId];
        payment.id = paymentId;
        payment.subscriptionId = _subscriptionId;
        payment.payer = _payer;
        payment.amount = _amount;
        payment.paymentToken = _paymentToken;
        payment.status = PaymentStatus.Succeeded;
        payment.paymentType = _paymentType;
        payment.periodStart = subscription.currentPeriodStart;
        payment.periodEnd = subscription.currentPeriodEnd;
        payment.createdAt = block.timestamp;
        payment.processedAt = block.timestamp;
        payment.txHash = bytes32(block.number);

        subscriptionPayments[_subscriptionId].push(paymentId);
        userPayments[_payer].push(paymentId);

        emit PaymentProcessed(paymentId, _subscriptionId, _payer, _amount, PaymentStatus.Succeeded, block.timestamp);

        return paymentId;
    }

    /**
     * @dev Refund a payment
     */
    function refundPayment(uint256 _paymentId, uint256 _amount) 
        external 
        onlyRole(ADMIN_ROLE) 
        nonReentrant 
    {
        Payment storage payment = payments[_paymentId];
        require(payment.status == PaymentStatus.Succeeded, "Cannot refund");
        require(_amount <= payment.amount, "Amount too high");

        payment.status = PaymentStatus.Refunded;

        if (payment.paymentToken == address(0)) {
            payable(payment.payer).transfer(_amount);
        } else {
            IERC20(payment.paymentToken).safeTransfer(payment.payer, _amount);
        }

        emit PaymentRefunded(_paymentId, _amount, block.timestamp);
    }

    // ============================================================
    // INVOICING
    // ============================================================

    /**
     * @dev Create invoice
     */
    function _createInvoice(
        uint256 _subscriptionId,
        uint256 _subtotal,
        uint256 _tax,
        uint256 _discount,
        uint256 _total
    ) internal returns (uint256) {
        _invoiceIds.increment();
        uint256 invoiceId = _invoiceIds.current();
        
        _invoiceNumberCounter.increment();
        string memory invoiceNumber = string(abi.encodePacked(
            "INV-",
            _uintToString(block.timestamp / (30 days)),
            "-",
            _uintToString(_invoiceNumberCounter.current())
        ));

        Subscription storage subscription = subscriptions[_subscriptionId];

        Invoice storage invoice = invoices[invoiceId];
        invoice.id = invoiceId;
        invoice.subscriptionId = _subscriptionId;
        invoice.subscriber = subscription.subscriber;
        invoice.invoiceNumber = invoiceNumber;
        invoice.subtotal = _subtotal;
        invoice.tax = _tax;
        invoice.discount = _discount;
        invoice.total = _total;
        invoice.amountDue = _total;
        invoice.amountPaid = 0; // Not paid yet - will be updated when payment is processed
        invoice.periodStart = subscription.currentPeriodStart;
        invoice.periodEnd = subscription.currentPeriodEnd;
        invoice.dueDate = subscription.currentPeriodEnd + gracePeriod; // Due after period ends plus grace period
        invoice.paidAt = 0; // Will be set when payment is confirmed
        invoice.isPaid = false; // Will be set to true when payment is confirmed
        invoice.createdAt = block.timestamp;

        subscriptionInvoices[_subscriptionId].push(invoiceId);

        emit InvoiceCreated(invoiceId, _subscriptionId, invoiceNumber, _total, invoice.dueDate, block.timestamp);

        return invoiceId;
    }

    /**
     * @dev Mark an invoice as paid (called when payment is confirmed)
     */
    function markInvoicePaid(uint256 _invoiceId, uint256 _amountPaid) 
        external 
        onlyRole(BILLING_ROLE) 
    {
        Invoice storage invoice = invoices[_invoiceId];
        require(invoice.id != 0, "Invoice not found");
        require(!invoice.isPaid, "Invoice already paid");
        require(_amountPaid > 0, "Amount must be positive");

        invoice.amountPaid += _amountPaid;
        
        if (invoice.amountPaid >= invoice.amountDue) {
            invoice.isPaid = true;
            invoice.paidAt = block.timestamp;
            invoice.amountDue = 0;
        } else {
            invoice.amountDue -= _amountPaid;
        }

        emit InvoicePaid(_invoiceId, _amountPaid, block.timestamp);
    }

    // ============================================================
    // DISCOUNT CODES
    // ============================================================

    /**
     * @dev Create a discount code
     */
    function createDiscountCode(
        string memory _code,
        uint256 _discountPercentage,
        uint256 _maxUses
    ) external onlyRole(ADMIN_ROLE) {
        require(_discountPercentage <= 10000, "Invalid percentage");
        
        bytes32 codeHash = keccak256(bytes(_code));
        require(discountCodes[codeHash] == 0, "Code already exists");

        discountCodes[codeHash] = _discountPercentage;
        discountCodeMaxUses[codeHash] = _maxUses;

        emit DiscountCodeCreated(codeHash, _discountPercentage, _maxUses);
    }

    /**
     * @dev Apply discount code
     */
    function _applyDiscount(bytes32 _codeHash, uint256 _amount) internal returns (uint256) {
        uint256 discountPercentage = discountCodes[_codeHash];
        if (discountPercentage == 0) return 0;

        uint256 maxUses = discountCodeMaxUses[_codeHash];
        if (maxUses > 0 && discountCodeUsage[_codeHash] >= maxUses) return 0;

        discountCodeUsage[_codeHash]++;
        return (_amount * discountPercentage) / 10000;
    }

    // ============================================================
    // HELPER FUNCTIONS
    // ============================================================

    function _uintToString(uint256 _value) internal pure returns (string memory) {
        if (_value == 0) return "0";
        
        uint256 temp = _value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        
        bytes memory buffer = new bytes(digits);
        while (_value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(_value % 10)));
            _value /= 10;
        }
        
        return string(buffer);
    }

    // ============================================================
    // VIEW FUNCTIONS
    // ============================================================

    function getPlan(uint256 _planId) external view returns (SubscriptionPlan memory) {
        return plans[_planId];
    }

    function getAllPlans() external view returns (uint256[] memory) {
        return planList;
    }

    function getSubscription(uint256 _subscriptionId) external view returns (Subscription memory) {
        return subscriptions[_subscriptionId];
    }

    function getUserSubscriptions(address _user) external view returns (uint256[] memory) {
        return subscriberSubscriptions[_user];
    }

    function getPayment(uint256 _paymentId) external view returns (Payment memory) {
        return payments[_paymentId];
    }

    function getSubscriptionPayments(uint256 _subscriptionId) external view returns (uint256[] memory) {
        return subscriptionPayments[_subscriptionId];
    }

    function getInvoice(uint256 _invoiceId) external view returns (Invoice memory) {
        return invoices[_invoiceId];
    }

    function getSubscriptionInvoices(uint256 _subscriptionId) external view returns (uint256[] memory) {
        return subscriptionInvoices[_subscriptionId];
    }

    function getUsageRecords(uint256 _subscriptionId) external view returns (UsageRecord[] memory) {
        return usageRecords[_subscriptionId];
    }

    function isSubscriptionActive(address _user) external view returns (bool) {
        uint256 subId = activeSubscription[_user];
        if (subId == 0) return false;
        
        Subscription storage sub = subscriptions[subId];
        return sub.status == SubscriptionStatus.Active || sub.status == SubscriptionStatus.Trial;
    }

    // ============================================================
    // ADMIN FUNCTIONS
    // ============================================================

    function addPaymentToken(address _token) external onlyRole(ADMIN_ROLE) {
        require(!acceptedPaymentTokens[_token], "Already accepted");
        acceptedPaymentTokens[_token] = true;
        paymentTokenList.push(_token);
    }

    function removePaymentToken(address _token) external onlyRole(ADMIN_ROLE) {
        acceptedPaymentTokens[_token] = false;
    }

    function setTreasury(address _treasury) external onlyRole(ADMIN_ROLE) {
        require(_treasury != address(0), "Invalid address");
        treasury = _treasury;
    }

    function setTaxRate(uint256 _rate) external onlyRole(ADMIN_ROLE) {
        require(_rate <= 5000, "Tax too high"); // Max 50%
        taxRate = _rate;
    }

    function setTrialPeriod(uint256 _period) external onlyRole(ADMIN_ROLE) {
        trialPeriod = _period;
    }

    function setGracePeriod(uint256 _period) external onlyRole(ADMIN_ROLE) {
        gracePeriod = _period;
    }

    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }

    function emergencyWithdraw(address _token) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (_token == address(0)) {
            payable(msg.sender).transfer(address(this).balance);
        } else {
            uint256 balance = IERC20(_token).balanceOf(address(this));
            IERC20(_token).safeTransfer(msg.sender, balance);
        }
    }

    receive() external payable {}
}

