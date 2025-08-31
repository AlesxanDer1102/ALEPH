// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/ScrowPay.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract MockUSDC is ERC20 {
    constructor() ERC20("Mock USDC", "USDC") {
        _mint(msg.sender, 1000000 * 10**6); // 1M USDC
    }

    function decimals() public pure override returns (uint8) {
        return 6;
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

contract EscrowPayTest is Test {
    EscrowPay public escrow;
    MockUSDC public usdc;
    
    address public admin = makeAddr("admin");
    address public feeVault = makeAddr("feeVault");
    address public buyer = makeAddr("buyer");
    address public merchant = makeAddr("merchant");
    
    uint256 public authSignerPrivateKey = 0xA11CE;
    address public authSigner = vm.addr(authSignerPrivateKey);
    
    uint16 constant FEE_BPS = 250; // 2.5%
    uint256 constant FEE_MIN = 1 * 10**6; // 1 USDC
    uint256 constant FEE_MAX = 100 * 10**6; // 100 USDC
    uint256 constant ORDER_CAP = 10000 * 10**6; // 10k USDC
    
    bytes32 constant DOMAIN_TYPEHASH = keccak256(
        "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
    );
    bytes32 constant RELEASE_AUTH_TYPEHASH = keccak256(
        "ReleaseAuth(bytes32 orderId,address merchant,uint256 amount,uint64 exp,bytes32 authNonce)"
    );
    
    function setUp() public {
        usdc = new MockUSDC();
        
        vm.startPrank(admin);
        escrow = new EscrowPay(
            address(usdc),
            admin,
            feeVault,
            FEE_BPS,
            FEE_MIN,
            FEE_MAX,
            ORDER_CAP
        );
        
        // Grant AUTH_SIGNER role to authSigner
        escrow.grantRole(escrow.AUTH_SIGNER(), authSigner);
        vm.stopPrank();
        
        // Setup initial balances
        usdc.mint(buyer, 100000 * 10**6); // 100k USDC for buyer
    }

    function testConstructor() public {
        assertEq(address(escrow.USDC()), address(usdc));
        assertEq(escrow.feeBps(), FEE_BPS);
        assertEq(escrow.feeMin(), FEE_MIN);
        assertEq(escrow.feeMax(), FEE_MAX);
        assertEq(escrow.orderCap(), ORDER_CAP);
        assertEq(escrow.feeVault(), feeVault);
        assertTrue(escrow.hasRole(escrow.DEFAULT_ADMIN_ROLE(), admin));
        assertTrue(escrow.hasRole(escrow.PAUSER_ROLE(), admin));
        assertTrue(escrow.hasRole(escrow.AUTH_SIGNER(), authSigner));
    }

    function testConstructorWithZeroAddresses() public {
        vm.expectRevert("zero addr");
        new EscrowPay(
            address(0), // zero USDC address
            admin,
            feeVault,
            FEE_BPS,
            FEE_MIN,
            FEE_MAX,
            ORDER_CAP
        );
        
        vm.expectRevert("zero addr");
        new EscrowPay(
            address(usdc),
            address(0), // zero admin address
            feeVault,
            FEE_BPS,
            FEE_MIN,
            FEE_MAX,
            ORDER_CAP
        );
        
        vm.expectRevert("zero addr");
        new EscrowPay(
            address(usdc),
            admin,
            address(0), // zero feeVault address
            FEE_BPS,
            FEE_MIN,
            FEE_MAX,
            ORDER_CAP
        );
    }

    function testCreateOrderSuccess() public {
        uint256 amount = 1000 * 10**6; // 1000 USDC
        bytes32 orderId = keccak256("order1");
        uint64 timeout = uint64(block.timestamp + 3600); // 1 hour from now
        
        vm.startPrank(buyer);
        usdc.approve(address(escrow), amount);
        
        EscrowPay.OrderParams memory params = EscrowPay.OrderParams({
            buyer: buyer,
            merchant: merchant,
            amount: amount,
            timeout: timeout,
            orderId: orderId
        });
        
        vm.expectEmit(true, true, true, true);
        emit OrderCreated(orderId, buyer, merchant, amount, escrow.quoteFee(amount), timeout, uint64(block.timestamp));
        
        escrow.createOrder(params);
        vm.stopPrank();
        
        (address orderBuyer, address orderMerchant, uint256 orderAmount, uint256 feeCharged, uint64 createdAt, uint64 orderTimeout, EscrowPay.OrderStatus status) = escrow.orders(orderId);
        
        assertEq(orderBuyer, buyer);
        assertEq(orderMerchant, merchant);
        assertEq(orderAmount, amount);
        assertEq(feeCharged, escrow.quoteFee(amount));
        assertEq(createdAt, block.timestamp);
        assertEq(orderTimeout, timeout);
        assertEq(uint8(status), uint8(EscrowPay.OrderStatus.CREATED));
        assertEq(usdc.balanceOf(address(escrow)), amount);
        assertEq(usdc.balanceOf(buyer), 100000 * 10**6 - amount);
    }

    function testCreateOrderInvalidAmount() public {
        bytes32 orderId = keccak256("order1");
        uint64 timeout = uint64(block.timestamp + 3600);
        
        vm.startPrank(buyer);
        
        // Test zero amount
        EscrowPay.OrderParams memory params = EscrowPay.OrderParams({
            buyer: buyer,
            merchant: merchant,
            amount: 0,
            timeout: timeout,
            orderId: orderId
        });
        
        vm.expectRevert(EscrowPay.InvalidAmount.selector);
        escrow.createOrder(params);
        
        // Test amount exceeding order cap
        params.amount = ORDER_CAP + 1;
        vm.expectRevert(EscrowPay.InvalidAmount.selector);
        escrow.createOrder(params);
        
        vm.stopPrank();
    }

    function testCreateOrderInvalidTimeout() public {
        uint256 amount = 1000 * 10**6;
        bytes32 orderId = keccak256("order1");
        uint64 timeout = uint64(block.timestamp - 1); // Past timeout
        
        vm.startPrank(buyer);
        usdc.approve(address(escrow), amount);
        
        EscrowPay.OrderParams memory params = EscrowPay.OrderParams({
            buyer: buyer,
            merchant: merchant,
            amount: amount,
            timeout: timeout,
            orderId: orderId
        });
        
        vm.expectRevert(EscrowPay.InvalidTimeout.selector);
        escrow.createOrder(params);
        
        vm.stopPrank();
    }

    function testCreateOrderAlreadyExists() public {
        uint256 amount = 1000 * 10**6;
        bytes32 orderId = keccak256("order1");
        uint64 timeout = uint64(block.timestamp + 3600);
        
        vm.startPrank(buyer);
        usdc.approve(address(escrow), amount * 2);
        
        EscrowPay.OrderParams memory params = EscrowPay.OrderParams({
            buyer: buyer,
            merchant: merchant,
            amount: amount,
            timeout: timeout,
            orderId: orderId
        });
        
        escrow.createOrder(params);
        
        vm.expectRevert(EscrowPay.OrderAlreadyExists.selector);
        escrow.createOrder(params);
        
        vm.stopPrank();
    }

    function testCreateOrderWhenPaused() public {
        uint256 amount = 1000 * 10**6;
        bytes32 orderId = keccak256("order1");
        uint64 timeout = uint64(block.timestamp + 3600);
        
        vm.prank(admin);
        escrow.pause();
        
        vm.startPrank(buyer);
        usdc.approve(address(escrow), amount);
        
        EscrowPay.OrderParams memory params = EscrowPay.OrderParams({
            buyer: buyer,
            merchant: merchant,
            amount: amount,
            timeout: timeout,
            orderId: orderId
        });
        
        vm.expectRevert(abi.encodeWithSelector(Pausable.EnforcedPause.selector));
        escrow.createOrder(params);
        
        vm.stopPrank();
    }

    function testReleaseOrderSuccess() public {
        // First create an order
        uint256 amount = 1000 * 10**6;
        bytes32 orderId = keccak256("order1");
        uint64 timeout = uint64(block.timestamp + 3600);
        
        _createOrder(orderId, buyer, merchant, amount, timeout);
        
        // Prepare release authorization
        bytes32 authNonce = keccak256("auth1");
        uint64 exp = uint64(block.timestamp + 120);
        
        EscrowPay.ReleaseAuth memory auth = EscrowPay.ReleaseAuth({
            orderId: orderId,
            merchant: merchant,
            amount: amount,
            exp: exp,
            authNonce: authNonce
        });
        
        bytes memory signature = _signReleaseAuth(auth, authSigner);
        
        uint256 expectedFee = escrow.quoteFee(amount);
        uint256 expectedPayout = amount - expectedFee;
        
        vm.expectEmit(true, true, false, true);
        emit OrderReleased(orderId, merchant, expectedPayout, authNonce);
        
        escrow.release(orderId, auth, signature);
        
        // Verify order state
        (, , , , , , EscrowPay.OrderStatus status) = escrow.orders(orderId);
        assertEq(uint8(status), uint8(EscrowPay.OrderStatus.RELEASED));
        
        // Verify merchant balance
        assertEq(escrow.merchantBalances(merchant), expectedPayout);
        
        // Verify fees accrued
        assertEq(escrow.feesAccrued(), expectedFee);
        
        // Verify nonce is used
        assertTrue(escrow.usedAuth(authNonce));
    }

    function testReleaseOrderNotFound() public {
        bytes32 orderId = keccak256("nonexistent");
        bytes32 authNonce = keccak256("auth1");
        uint64 exp = uint64(block.timestamp + 120);
        
        EscrowPay.ReleaseAuth memory auth = EscrowPay.ReleaseAuth({
            orderId: orderId,
            merchant: merchant,
            amount: 1000 * 10**6,
            exp: exp,
            authNonce: authNonce
        });
        
        bytes memory signature = _signReleaseAuth(auth, authSigner);
        
        vm.expectRevert(EscrowPay.OrderNotFound.selector);
        escrow.release(orderId, auth, signature);
    }

    function testReleaseOrderNotPending() public {
        uint256 amount = 1000 * 10**6;
        bytes32 orderId = keccak256("order1");
        uint64 timeout = uint64(block.timestamp + 3600);
        
        _createOrder(orderId, buyer, merchant, amount, timeout);
        
        // Release the order first time
        bytes32 authNonce1 = keccak256("auth1");
        EscrowPay.ReleaseAuth memory auth1 = EscrowPay.ReleaseAuth({
            orderId: orderId,
            merchant: merchant,
            amount: amount,
            exp: uint64(block.timestamp + 120),
            authNonce: authNonce1
        });
        
        escrow.release(orderId, auth1, _signReleaseAuth(auth1, authSigner));
        
        // Try to release again
        bytes32 authNonce2 = keccak256("auth2");
        EscrowPay.ReleaseAuth memory auth2 = EscrowPay.ReleaseAuth({
            orderId: orderId,
            merchant: merchant,
            amount: amount,
            exp: uint64(block.timestamp + 120),
            authNonce: authNonce2
        });
        
        bytes memory sig2 = _signReleaseAuth(auth2, authSigner);
        
        vm.expectRevert(EscrowPay.OrderNotPending.selector);
        escrow.release(orderId, auth2, sig2);
    }

    function testReleaseExpiredAuthorization() public {
        uint256 amount = 1000 * 10**6;
        bytes32 orderId = keccak256("order1");
        uint64 timeout = uint64(block.timestamp + 3600);
        
        _createOrder(orderId, buyer, merchant, amount, timeout);
        
        bytes32 authNonce = keccak256("auth1");
        uint64 exp = uint64(block.timestamp - 1); // Expired
        
        EscrowPay.ReleaseAuth memory auth = EscrowPay.ReleaseAuth({
            orderId: orderId,
            merchant: merchant,
            amount: amount,
            exp: exp,
            authNonce: authNonce
        });
        
        bytes memory signature = _signReleaseAuth(auth, authSigner);
        
        vm.expectRevert(EscrowPay.ExpiredAuthorization.selector);
        escrow.release(orderId, auth, signature);
    }

    function testReleaseInvalidSignature() public {
        uint256 amount = 1000 * 10**6;
        bytes32 orderId = keccak256("order1");
        uint64 timeout = uint64(block.timestamp + 3600);
        
        _createOrder(orderId, buyer, merchant, amount, timeout);
        
        bytes32 authNonce = keccak256("auth1");
        uint64 exp = uint64(block.timestamp + 120);
        
        EscrowPay.ReleaseAuth memory auth = EscrowPay.ReleaseAuth({
            orderId: orderId,
            merchant: merchant,
            amount: amount,
            exp: exp,
            authNonce: authNonce
        });
        
        // Sign with wrong signer
        address wrongSigner = makeAddr("wrongSigner");
        bytes memory signature = _signReleaseAuth(auth, wrongSigner);
        
        vm.expectRevert(EscrowPay.InvalidSignature.selector);
        escrow.release(orderId, auth, signature);
    }

    function testReleaseNonceAlreadyUsed() public {
        uint256 amount1 = 1000 * 10**6;
        uint256 amount2 = 2000 * 10**6;
        bytes32 orderId1 = keccak256("order1");
        bytes32 orderId2 = keccak256("order2");
        uint64 timeout = uint64(block.timestamp + 3600);
        
        _createOrder(orderId1, buyer, merchant, amount1, timeout);
        _createOrder(orderId2, buyer, merchant, amount2, timeout);
        
        bytes32 authNonce = keccak256("auth1"); // Same nonce for both
        uint64 exp = uint64(block.timestamp + 120);
        
        // First release
        EscrowPay.ReleaseAuth memory auth1 = EscrowPay.ReleaseAuth({
            orderId: orderId1,
            merchant: merchant,
            amount: amount1,
            exp: exp,
            authNonce: authNonce
        });
        
        escrow.release(orderId1, auth1, _signReleaseAuth(auth1, authSigner));
        
        // Second release with same nonce
        EscrowPay.ReleaseAuth memory auth2 = EscrowPay.ReleaseAuth({
            orderId: orderId2,
            merchant: merchant,
            amount: amount2,
            exp: exp,
            authNonce: authNonce
        });
        
        bytes memory sig2 = _signReleaseAuth(auth2, authSigner);
        
        vm.expectRevert(EscrowPay.NonceAlreadyUsed.selector);
        escrow.release(orderId2, auth2, sig2);
    }

    function testRefundSuccess() public {
        uint256 amount = 1000 * 10**6;
        bytes32 orderId = keccak256("order1");
        uint64 timeout = uint64(block.timestamp + 3600);
        
        _createOrder(orderId, buyer, merchant, amount, timeout);
        
        // Fast forward past timeout
        vm.warp(timeout + 1);
        
        uint256 buyerBalanceBefore = usdc.balanceOf(buyer);
        
        vm.expectEmit(true, true, false, true);
        emit OrderRefunded(orderId, buyer, amount);
        
        vm.expectEmit(true, false, false, false);
        emit OrderExpired(orderId);
        
        escrow.refund(orderId);
        
        // Verify order state
        (, , , , , , EscrowPay.OrderStatus status) = escrow.orders(orderId);
        assertEq(uint8(status), uint8(EscrowPay.OrderStatus.REFUNDED));
        
        // Verify buyer got refund
        assertEq(usdc.balanceOf(buyer), buyerBalanceBefore + amount);
    }

    function testRefundOrderNotFound() public {
        bytes32 orderId = keccak256("nonexistent");
        
        vm.expectRevert(EscrowPay.OrderNotFound.selector);
        escrow.refund(orderId);
    }

    function testRefundOrderNotPending() public {
        uint256 amount = 1000 * 10**6;
        bytes32 orderId = keccak256("order1");
        uint64 timeout = uint64(block.timestamp + 3600);
        
        _createOrder(orderId, buyer, merchant, amount, timeout);
        
        // Release the order first
        bytes32 authNonce = keccak256("auth1");
        EscrowPay.ReleaseAuth memory auth = EscrowPay.ReleaseAuth({
            orderId: orderId,
            merchant: merchant,
            amount: amount,
            exp: uint64(block.timestamp + 120),
            authNonce: authNonce
        });
        
        escrow.release(orderId, auth, _signReleaseAuth(auth, authSigner));
        
        // Try to refund
        vm.warp(timeout + 1);
        vm.expectRevert(EscrowPay.OrderNotPending.selector);
        escrow.refund(orderId);
    }

    function testRefundBeforeTimeout() public {
        uint256 amount = 1000 * 10**6;
        bytes32 orderId = keccak256("order1");
        uint64 timeout = uint64(block.timestamp + 3600);
        
        _createOrder(orderId, buyer, merchant, amount, timeout);
        
        // Try to refund before timeout
        vm.expectRevert(EscrowPay.InvalidTimeout.selector);
        escrow.refund(orderId);
    }

    function testWithdrawSuccess() public {
        uint256 amount = 1000 * 10**6;
        bytes32 orderId = keccak256("order1");
        uint64 timeout = uint64(block.timestamp + 3600);
        
        _createOrder(orderId, buyer, merchant, amount, timeout);
        
        // Release order to create merchant balance
        bytes32 authNonce = keccak256("auth1");
        EscrowPay.ReleaseAuth memory auth = EscrowPay.ReleaseAuth({
            orderId: orderId,
            merchant: merchant,
            amount: amount,
            exp: uint64(block.timestamp + 120),
            authNonce: authNonce
        });
        
        escrow.release(orderId, auth, _signReleaseAuth(auth, authSigner));
        
        uint256 expectedPayout = amount - escrow.quoteFee(amount);
        uint256 merchantBalanceBefore = usdc.balanceOf(merchant);
        
        vm.expectEmit(true, false, false, true);
        emit Withdrawn(merchant, expectedPayout, 0);
        
        vm.prank(merchant);
        escrow.withdraw(0); // Withdraw all
        
        assertEq(usdc.balanceOf(merchant), merchantBalanceBefore + expectedPayout);
        assertEq(escrow.merchantBalances(merchant), 0);
    }

    function testWithdrawPartial() public {
        uint256 amount = 1000 * 10**6;
        bytes32 orderId = keccak256("order1");
        uint64 timeout = uint64(block.timestamp + 3600);
        
        _createOrder(orderId, buyer, merchant, amount, timeout);
        
        // Release order to create merchant balance
        bytes32 authNonce = keccak256("auth1");
        EscrowPay.ReleaseAuth memory auth = EscrowPay.ReleaseAuth({
            orderId: orderId,
            merchant: merchant,
            amount: amount,
            exp: uint64(block.timestamp + 120),
            authNonce: authNonce
        });
        
        escrow.release(orderId, auth, _signReleaseAuth(auth, authSigner));
        
        uint256 expectedPayout = amount - escrow.quoteFee(amount);
        uint256 withdrawAmount = expectedPayout / 2;
        
        vm.prank(merchant);
        escrow.withdraw(withdrawAmount);
        
        assertEq(escrow.merchantBalances(merchant), expectedPayout - withdrawAmount);
    }

    function testWithdrawNothingToClaim() public {
        vm.prank(merchant);
        vm.expectRevert(EscrowPay.WithdrawNothingToClaim.selector);
        escrow.withdraw(0);
    }

    function testWithdrawFeesSuccess() public {
        uint256 amount = 1000 * 10**6;
        bytes32 orderId = keccak256("order1");
        uint64 timeout = uint64(block.timestamp + 3600);
        
        _createOrder(orderId, buyer, merchant, amount, timeout);
        
        // Release order to accrue fees
        bytes32 authNonce = keccak256("auth1");
        EscrowPay.ReleaseAuth memory auth = EscrowPay.ReleaseAuth({
            orderId: orderId,
            merchant: merchant,
            amount: amount,
            exp: uint64(block.timestamp + 120),
            authNonce: authNonce
        });
        
        escrow.release(orderId, auth, _signReleaseAuth(auth, authSigner));
        
        uint256 expectedFee = escrow.quoteFee(amount);
        uint256 feeVaultBalanceBefore = usdc.balanceOf(feeVault);
        
        vm.expectEmit(true, false, false, true);
        emit FeesWithdrawn(feeVault, expectedFee);
        
        vm.prank(admin);
        escrow.withdrawFees(0); // Withdraw all fees
        
        assertEq(usdc.balanceOf(feeVault), feeVaultBalanceBefore + expectedFee);
        assertEq(escrow.feesAccrued(), 0);
    }

    function testWithdrawFeesNothingToClaim() public {
        vm.prank(admin);
        vm.expectRevert(EscrowPay.WithdrawNothingToClaim.selector);
        escrow.withdrawFees(0);
    }

    function testWithdrawFeesOnlyAdmin() public {
        vm.prank(buyer);
        vm.expectRevert();
        escrow.withdrawFees(0);
    }

    function testSetParams() public {
        uint16 newFeeBps = 300;
        uint256 newFeeMin = 2 * 10**6;
        uint256 newFeeMax = 200 * 10**6;
        uint256 newOrderCap = 20000 * 10**6;
        uint256 newUserDailyCap = 50000 * 10**6;
        uint256 newMerchantDailyCap = 100000 * 10**6;
        address newFeeVault = makeAddr("newFeeVault");
        
        vm.expectEmit(false, false, false, true);
        emit ParamsUpdated(newFeeBps, newFeeMin, newFeeMax, newOrderCap, newUserDailyCap, newMerchantDailyCap, newFeeVault);
        
        vm.prank(admin);
        escrow.setParams(newFeeBps, newFeeMin, newFeeMax, newOrderCap, newUserDailyCap, newMerchantDailyCap, newFeeVault);
        
        assertEq(escrow.feeBps(), newFeeBps);
        assertEq(escrow.feeMin(), newFeeMin);
        assertEq(escrow.feeMax(), newFeeMax);
        assertEq(escrow.orderCap(), newOrderCap);
        assertEq(escrow.userDailyCap(), newUserDailyCap);
        assertEq(escrow.merchantDailyCap(), newMerchantDailyCap);
        assertEq(escrow.feeVault(), newFeeVault);
    }

    function testSetParamsOnlyAdmin() public {
        vm.prank(buyer);
        vm.expectRevert();
        escrow.setParams(300, 2 * 10**6, 200 * 10**6, 20000 * 10**6, 0, 0, feeVault);
    }

    function testPauseUnpause() public {
        vm.prank(admin);
        escrow.pause();
        assertTrue(escrow.paused());
        
        vm.prank(admin);
        escrow.unpause();
        assertFalse(escrow.paused());
    }

    function testPauseOnlyPauser() public {
        vm.prank(buyer);
        vm.expectRevert();
        escrow.pause();
    }

    function testQuoteFee() public {
        uint256 amount = 1000 * 10**6;
        uint256 expectedFee = (amount * FEE_BPS) / 10000;
        assertEq(escrow.quoteFee(amount), expectedFee);
    }

    function testQuoteFeeMin() public {
        uint256 smallAmount = 10 * 10**6; // 10 USDC
        uint256 fee = escrow.quoteFee(smallAmount);
        assertEq(fee, FEE_MIN); // Should be capped at minimum
    }

    function testQuoteFeeMax() public {
        uint256 largeAmount = 10000 * 10**6; // 10k USDC
        uint256 fee = escrow.quoteFee(largeAmount);
        assertEq(fee, FEE_MAX); // Should be capped at maximum
    }

    function testIsExpired() public {
        uint256 amount = 1000 * 10**6;
        bytes32 orderId = keccak256("order1");
        uint64 timeout = uint64(block.timestamp + 3600);
        
        _createOrder(orderId, buyer, merchant, amount, timeout);
        
        assertFalse(escrow.isExpired(orderId));
        
        vm.warp(timeout + 1);
        assertTrue(escrow.isExpired(orderId));
    }

    function testDomainSeparator() public view {
        bytes32 domainSeparator = escrow.domainSeparator();
        assertNotEq(domainSeparator, bytes32(0));
    }

    // Helper functions
    function _createOrder(bytes32 orderId, address _buyer, address _merchant, uint256 amount, uint64 timeout) internal {
        vm.startPrank(_buyer);
        usdc.approve(address(escrow), amount);
        
        EscrowPay.OrderParams memory params = EscrowPay.OrderParams({
            buyer: _buyer,
            merchant: _merchant,
            amount: amount,
            timeout: timeout,
            orderId: orderId
        });
        
        escrow.createOrder(params);
        vm.stopPrank();
    }

    function _signReleaseAuth(EscrowPay.ReleaseAuth memory auth, address signer) internal view returns (bytes memory) {
        bytes32 structHash = keccak256(
            abi.encode(
                RELEASE_AUTH_TYPEHASH,
                auth.orderId,
                auth.merchant,
                auth.amount,
                auth.exp,
                auth.authNonce
            )
        );
        
        bytes32 digest = keccak256(
            abi.encodePacked(
                "\x19\x01",
                escrow.domainSeparator(),
                structHash
            )
        );
        
        // Use the known private key for authSigner
        uint256 signerPrivateKey;
        if (signer == authSigner) {
            signerPrivateKey = authSignerPrivateKey;
        } else {
            // For other signers, derive a key (this is just for testing wrong signers)
            signerPrivateKey = uint256(keccak256(abi.encodePacked(signer)));
        }
        
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(signerPrivateKey, digest);
        return abi.encodePacked(r, s, v);
    }

    // Events (copied from contract for testing)
    event OrderCreated(
        bytes32 indexed orderId,
        address indexed buyer,
        address indexed merchant,
        uint256 amount,
        uint256 fee,
        uint64 timeout,
        uint64 createdAt
    );

    event OrderReleased(
        bytes32 indexed orderId,
        address indexed merchant,
        uint256 paidOut,
        bytes32 authNonce
    );

    event OrderRefunded(
        bytes32 indexed orderId,
        address indexed buyer,
        uint256 amount
    );

    event OrderExpired(bytes32 indexed orderId);

    event Withdrawn(
        address indexed merchant,
        uint256 amount,
        uint256 batchCount
    );

    event FeesWithdrawn(address indexed vault, uint256 amount);

    event ParamsUpdated(
        uint16 feeBps,
        uint256 feeMin,
        uint256 feeMax,
        uint256 orderCap,
        uint256 userDailyCap,
        uint256 merchantDailyCap,
        address feeVault
    );
}