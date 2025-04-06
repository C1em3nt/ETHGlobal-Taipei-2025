// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

/* 
 * ===================
 * Payment Factory 
 * ===================
 *
 * Features:
 *  1. Deploy a new Payment contract (each transaction corresponds to one contract).
 *  2. Pre-collect (mainAmount + collateralAmount) of tokens and forward them to the new Payment contract.
 *
 * You can record the Payment contract address in frontend or backend to interact with it.
 */

interface IERC20 {
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function transfer(address recipient, uint256 amount) external returns (bool);
}

contract PaymentFactory {
    address public platform;  // Platform address (can be set in constructor or updated later)

    uint256 public paymentCount;
    mapping(uint256 => address) public paymentAddresses;

    event PaymentCreated(
        uint256 indexed paymentId,
        address indexed paymentAddress,
        address indexed cryptoPayer,
        address token,
        uint256 mainAmount,
        uint256 collateralAmount
    );

    constructor() {
        platform = msg.sender;
    }

    /**
     * @notice Create a new Payment contract
     * @param _token ERC20 Token Address (e.g., USDC)
     * @param _mainAmount Main payment amount
     * @param _collateralAmount Collateral amount
     */
    function createPayment(
        address _token,
        uint256 _mainAmount,
        uint256 _collateralAmount
    ) external {
        require(_mainAmount > 0, "mainAmount must be > 0");
        require(_collateralAmount > 0, "collateralAmount must be > 0");

        uint256 total = _mainAmount + _collateralAmount;
        bool ok = IERC20(_token).transferFrom(msg.sender, address(this), total);
        require(ok, "transferFrom failed");

        Payment newPayment = new Payment(
            msg.sender,
            _token,
            _mainAmount,
            _collateralAmount,
            platform
        );

        ok = IERC20(_token).transfer(address(newPayment), total);
        require(ok, "transfer to payment failed");

        paymentCount++;
        paymentAddresses[paymentCount] = address(newPayment);

        emit PaymentCreated(
            paymentCount,
            address(newPayment),
            msg.sender,
            _token,
            _mainAmount,
            _collateralAmount
        );
    }
}

/* 
 * ===================
 * Payment Contract
 * ===================
 *
 * Features (Double timelock flow):
 *  1. cryptoPayer -> Open state (can cancel anytime)
 *  2. helper -> acceptOrder() -> HelperCommited state, starts first timelock
 *  3. helper -> helperDeclaredPaid() -> HelperDeclaredPaid state, starts second timelock
 *  4. cryptoPayer -> confirmPayment() (within time) -> Completed
 *  5. If timeout, platform -> arbitrate() -> Arbitrated
 */

contract Payment {
    enum PaymentState {
        Open,
        HelperCommited,
        HelperDeclaredPaid,
        Completed,
        Cancelled,
        Arbitrated
    }

    IERC20 public token;
    address public cryptoPayer;
    address public helper;
    address public platform;

    uint256 public mainAmount;
    uint256 public collateralAmount;

    PaymentState public state;

    uint256 public constant helperDeadline = 5 * 60;
    uint256 public constant cryptoPayerConfirmDeadline = 5 * 60;

    uint256 public helperCommitedTime;
    uint256 public helperDeclaredPaidTime;

    event OrderAccepted(address indexed helper);
    event HelperDeclaredPaid(address indexed helper);
    event PaymentConfirmed(address indexed cryptoPayer);
    event OrderCancelled(address indexed caller);
    event OrderArbitrated(address indexed platform);
    event StateChanged(PaymentState oldState, PaymentState newState);

    modifier onlyCryptoPayer() {
        require(msg.sender == cryptoPayer, "Not cryptoPayer");
        _;
    }

    modifier onlyPlatform() {
        require(msg.sender == platform, "Not platform");
        _;
    }

    constructor(
        address _cryptoPayer,
        address _token,
        uint256 _mainAmount,
        uint256 _collateralAmount,
        address _platform
    ) {
        cryptoPayer = _cryptoPayer;
        token = IERC20(_token);
        mainAmount = _mainAmount;
        collateralAmount = _collateralAmount;
        platform = _platform;

        state = PaymentState.Open;
        emit StateChanged(PaymentState(0), state);
    }

    function acceptOrder() external {
        require(state == PaymentState.Open, "State not Open");
        helper = msg.sender;
        state = PaymentState.HelperCommited;
        helperCommitedTime = block.timestamp;

        emit OrderAccepted(helper);
        emit StateChanged(PaymentState.Open, state);
    }

    function helperDeclaredPaid () external {
        require(state == PaymentState.HelperCommited, "State not HelperCommited");
        require(msg.sender == helper, "Not helper");
        require(block.timestamp <= helperCommitedTime + helperDeadline, "helperDeadline passed");

        state = PaymentState.HelperDeclaredPaid;
        helperDeclaredPaidTime = block.timestamp;

        emit HelperDeclaredPaid(helper);
        emit StateChanged(PaymentState.HelperCommited, state);
    }

    function confirmPayment() external onlyCryptoPayer {
        require(state == PaymentState.HelperDeclaredPaid, "State not HelperDeclaredPaid");
        require(block.timestamp <= helperDeclaredPaidTime + cryptoPayerConfirmDeadline, "confirm deadline passed");

        bool ok = token.transfer(helper, mainAmount);
        require(ok, "transfer to helper failed");

        ok = token.transfer(cryptoPayer, collateralAmount);
        require(ok, "transfer deposit to cryptoPayer failed");

        state = PaymentState.Completed;
        emit PaymentConfirmed(msg.sender);
        emit StateChanged(PaymentState.HelperDeclaredPaid, state);
    }

    function arbitrate() external onlyPlatform {
        require(state == PaymentState.HelperDeclaredPaid, "State not HelperDeclaredPaid");
        require(block.timestamp > helperDeclaredPaidTime + cryptoPayerConfirmDeadline, "Not yet time for arbitrate");

        bool ok = token.transfer(helper, mainAmount);
        require(ok, "transfer to helper failed");

        ok = token.transfer(platform, collateralAmount);
        require(ok, "transfer to platform failed");

        state = PaymentState.Arbitrated;
        emit OrderArbitrated(msg.sender);
        emit StateChanged(PaymentState.HelperDeclaredPaid, state);
    }

    function cancelOrder() external onlyCryptoPayer {
        require(
            state == PaymentState.Open ||
            (state == PaymentState.HelperCommited && block.timestamp > helperCommitedTime + helperDeadline),
            "Cannot cancel at this state/time"
        );

        uint256 total = mainAmount + collateralAmount;
        bool ok = token.transfer(cryptoPayer, total);
        require(ok, "transfer back to cryptoPayer failed");

        state = PaymentState.Cancelled;
        emit OrderCancelled(msg.sender);
        emit StateChanged(PaymentState.HelperCommited, state);
    }
}
