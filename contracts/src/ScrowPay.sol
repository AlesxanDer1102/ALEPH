// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title EscrowOrder (Arbitrum, USDC nativo) - MVP sin UUPS
 * @notice Custodia USDC de un comprador hasta confirmación (EIP-712) firmada por el oráculo;
 *         si no hay entrega a tiempo, el comprador puede pedir refund.
 * @dev    AccessControl + Pausable + ReentrancyGuard + EIP712 + SafeERC20.
 *         Reglas clave:
 *           - createOrder: buyer deposita USDC en escrow.
 *           - release: con firma EIP-712 válida -> acredita al saldo del merchant y devenga fee.
 *           - refund: si pasó timeout sin release -> devuelve al buyer.
 *           - withdraw: merchant retira su saldo (batch).
 *           - withdrawFees: admin retira fees devengados.
 */

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract EscrowPay is AccessControl, Pausable, ReentrancyGuard, EIP712 {
    using SafeERC20 for IERC20;

    // =========================
    //          Tipos
    // =========================

    /// @notice Estado de la orden
    enum OrderStatus {
        CREATED,
        RELEASED,
        REFUNDED,
        EXPIRED
    }

    /// @notice Parámetros de creación de orden
    struct OrderParams {
        address buyer; // Smart Account / EOA del comprador
        address merchant; // Receptor de la venta
        uint256 amount; // En USDC (6 dec)
        uint64 timeout; // Epoch (segundos)
        bytes32 orderId; // Idempotencia
    }

    /// @notice Registro completo de la orden
    struct Order {
        address buyer;
        address merchant;
        uint256 amount; // Bruto depositado
        uint256 feeCharged; // Fee fijado al crear
        uint64 createdAt;
        uint64 timeout;
        OrderStatus status;
    }

    /// @notice Payload EIP-712 firmado por el oráculo para liberar una orden
    struct ReleaseAuth {
        bytes32 orderId;
        address merchant;
        uint256 amount;
        uint64 exp; // Expiración corta (p.ej., now + 120s)
        bytes32 authNonce; // Anti-replay
    }

    // =========================
    //          Roles
    // =========================

    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant AUTH_SIGNER = keccak256("AUTH_SIGNER");

    // =========================
    //         Errores
    // =========================

    error InvalidAmount();
    error InvalidTimeout();
    error OrderAlreadyExists();
    error OrderNotFound();
    error OrderNotPending();
    error ExpiredAuthorization();
    error InvalidSignature();
    error NonceAlreadyUsed();
    error WithdrawNothingToClaim();
    error FeeOutOfRange();
    error CapExceeded();

    // =========================
    //        Eventos
    // =========================

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

    // =========================
    //        Constantes
    // =========================

    /// @dev Typehash de ReleaseAuth para EIP-712
    bytes32 private constant RELEASE_AUTH_TYPEHASH =
        keccak256(
            "ReleaseAuth(bytes32 orderId,address merchant,uint256 amount,uint64 exp,bytes32 authNonce)"
        );

    uint256 private constant BPS_DENOMINATOR = 10_000;

    // =========================
    //        Storage
    // =========================

    /// @notice Token USDC nativo (inmutable)
    IERC20 public immutable USDC;

    // Política de fees
    uint16 public feeBps; // 100 = 1.00%
    uint256 public feeMin; // 6 dec
    uint256 public feeMax; // 6 dec
    address public feeVault;

    // Caps de riesgo (opcionales; 0 = desactivado)
    uint256 public orderCap; // límite por orden (6 dec)
    uint256 public userDailyCap; // límite agregado por día (6 dec)
    uint256 public merchantDailyCap; // límite agregado por día (6 dec)

    // Nonce anti-replay para release
    mapping(bytes32 => bool) public usedAuth;

    // Órdenes
    mapping(bytes32 => Order) public orders;

    // Saldos de merchants listos para retirar
    mapping(address => uint256) public merchantBalances;

    // Límites diarios (bucket por día)
    mapping(address => mapping(uint64 => uint256)) private _userDaily;
    mapping(address => mapping(uint64 => uint256)) private _merchantDaily;

    // Fees devengados (acumulados y no retirados)
    uint256 public feesAccrued;

    // =========================
    //       Constructor
    // =========================

    /**
     * @param usdc_     Dirección del token USDC nativo (Arbitrum One)
     * @param admin     Dirección admin (DEFAULT_ADMIN + PAUSER)
     * @param feeVault_ Dirección que recibe fees de la plataforma
     * @param feeBps_   Basis points del fee (<= 10000)
     * @param feeMin_   Mínimo absoluto (6 dec)
     * @param feeMax_   Máximo absoluto (6 dec)
     * @param orderCap_ Límite por orden (6 dec)
     */
    constructor(
        address usdc_,
        address admin,
        address feeVault_,
        uint16 feeBps_,
        uint256 feeMin_,
        uint256 feeMax_,
        uint256 orderCap_
    ) EIP712("EscrowOrder", "1") {
        require(
            usdc_ != address(0) &&
                admin != address(0) &&
                feeVault_ != address(0),
            "zero addr"
        );
        USDC = IERC20(usdc_);

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(PAUSER_ROLE, admin);

        _setParamsInternal(
            feeBps_,
            feeMin_,
            feeMax_,
            orderCap_,
            0,
            0,
            feeVault_
        );
    }

    // =========================
    //        Funciones
    // =========================

    /**
     * @notice Crea una orden trasladando USDC del buyer al escrow.
     * @dev    Requiere allowance previo (approve) y whenNotPaused.
     * @param p Parámetros de la orden (OrderParams)
     */
    function createOrder(
        OrderParams calldata p
    ) external nonReentrant whenNotPaused {
        if (p.buyer == address(0) || p.merchant == address(0)) revert();
        if (p.amount == 0 || (orderCap != 0 && p.amount > orderCap))
            revert InvalidAmount();
        if (p.timeout <= block.timestamp) revert InvalidTimeout();
        if (orders[p.orderId].createdAt != 0) revert OrderAlreadyExists();
        if (msg.sender != p.buyer) revert(); // AA/EOA del buyer debe originar

        // Caps diarios (opcionales)
        uint64 day = _dayBucket(block.timestamp);
        if (
            userDailyCap != 0 &&
            _userDaily[p.buyer][day] + p.amount > userDailyCap
        ) revert CapExceeded();
        if (
            merchantDailyCap != 0 &&
            _merchantDaily[p.merchant][day] + p.amount > merchantDailyCap
        ) revert CapExceeded();

        uint256 fee = _quoteFee(p.amount);

        // Efectos
        orders[p.orderId] = Order({
            buyer: p.buyer,
            merchant: p.merchant,
            amount: p.amount,
            feeCharged: fee,
            createdAt: uint64(block.timestamp),
            timeout: p.timeout,
            status: OrderStatus.CREATED
        });

        _userDaily[p.buyer][day] += p.amount;
        _merchantDaily[p.merchant][day] += p.amount;

        // Interacciones (al final - CEI)
        USDC.safeTransferFrom(p.buyer, address(this), p.amount);

        emit OrderCreated(
            p.orderId,
            p.buyer,
            p.merchant,
            p.amount,
            fee,
            p.timeout,
            uint64(block.timestamp)
        );
    }

    /**
     * @notice Libera una orden al merchant usando autorización EIP-712 del oráculo.
     * @param orderId Id de la orden
     * @param auth    Payload ReleaseAuth
     * @param sig     Firma del oráculo (AUTH_SIGNER)
     */
    function release(
        bytes32 orderId,
        ReleaseAuth calldata auth,
        bytes calldata sig
    ) external nonReentrant whenNotPaused {
        Order storage o = orders[orderId];
        if (o.createdAt == 0) revert OrderNotFound();
        if (o.status != OrderStatus.CREATED) revert OrderNotPending();

        // Validaciones de payload
        if (block.timestamp > auth.exp) revert ExpiredAuthorization();
        if (
            auth.orderId != orderId ||
            auth.merchant != o.merchant ||
            auth.amount != o.amount
        ) revert InvalidSignature();
        if (usedAuth[auth.authNonce]) revert NonceAlreadyUsed();

        // Verificación EIP-712
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
        bytes32 digest = _hashTypedDataV4(structHash);
        address signer = ECDSA.recover(digest, sig);
        if (!hasRole(AUTH_SIGNER, signer)) revert InvalidSignature();

        // Efectos
        usedAuth[auth.authNonce] = true;
        o.status = OrderStatus.RELEASED;

        uint256 payout = o.amount - o.feeCharged;
        merchantBalances[o.merchant] += payout;

        // Fee se devenga al liberar (si la orden termina en refund, no se cobra)
        feesAccrued += o.feeCharged;

        emit OrderReleased(orderId, o.merchant, payout, auth.authNonce);
    }

    /**
     * @notice Reembolsa al buyer si pasó el timeout y la orden sigue pendiente.
     * @param orderId Id de la orden
     */
    function refund(bytes32 orderId) external nonReentrant {
        Order storage o = orders[orderId];
        if (o.createdAt == 0) revert OrderNotFound();
        if (o.status != OrderStatus.CREATED) revert OrderNotPending();
        if (block.timestamp <= o.timeout) revert InvalidTimeout();

        // Efectos
        o.status = OrderStatus.REFUNDED;

        // Interacciones (al final)
        USDC.safeTransfer(o.buyer, o.amount);

        emit OrderRefunded(orderId, o.buyer, o.amount);
        emit OrderExpired(orderId); // marca semántica
    }

    /**
     * @notice Retira el saldo acumulado del merchant (batch withdraw).
     * @param amount Monto a retirar. Use 0 para retirar TODO.
     */
    function withdraw(uint256 amount) external nonReentrant {
        address merchant = msg.sender;
        uint256 bal = merchantBalances[merchant];
        if (bal == 0) revert WithdrawNothingToClaim();

        uint256 toSend = amount == 0 ? bal : amount;
        if (toSend > bal) toSend = bal;

        merchantBalances[merchant] = bal - toSend;

        USDC.safeTransfer(merchant, toSend);
        emit Withdrawn(merchant, toSend, 0);
    }

    /**
     * @notice Retira fees devengados hacia el feeVault.
     * @param amount Monto a retirar (6 dec). Use 0 para retirar TODO.
     */
    function withdrawFees(
        uint256 amount
    ) external nonReentrant onlyRole(DEFAULT_ADMIN_ROLE) {
        uint256 available = feesAccrued;
        if (available == 0) revert WithdrawNothingToClaim();

        uint256 toSend = amount == 0 ? available : amount;
        if (toSend > available) toSend = available;

        feesAccrued = available - toSend;
        USDC.safeTransfer(feeVault, toSend);

        emit FeesWithdrawn(feeVault, toSend);
    }

    // =========================
    //     Administración
    // =========================

    /**
     * @notice Actualiza parámetros económicos y de riesgo.
     */
    function setParams(
        uint16 feeBps_,
        uint256 feeMin_,
        uint256 feeMax_,
        uint256 orderCap_,
        uint256 userDailyCap_,
        uint256 merchantDailyCap_,
        address feeVault_
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _setParamsInternal(
            feeBps_,
            feeMin_,
            feeMax_,
            orderCap_,
            userDailyCap_,
            merchantDailyCap_,
            feeVault_
        );
    }

    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }
    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    // =========================
    //        Lecturas
    // =========================

    /// @notice Devuelve el dominio EIP-712 efectivo del contrato.
    function domainSeparator() external view returns (bytes32) {
        return _domainSeparatorV4();
    }

    /// @notice Cotiza el fee para un monto dado (en 6 dec).
    function quoteFee(uint256 amount) external view returns (uint256) {
        return _quoteFee(amount);
    }

    /// @notice Azúcar: indica si una orden ya venció (sin considerar estado).
    function isExpired(bytes32 orderId) external view returns (bool) {
        Order storage o = orders[orderId];
        return o.createdAt != 0 && block.timestamp > o.timeout;
    }

    /// @inheritdoc AccessControl
    function supportsInterface(
        bytes4 interfaceId
    ) public view override(AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    // =========================
    //        Internas
    // =========================

    function _setParamsInternal(
        uint16 feeBps_,
        uint256 feeMin_,
        uint256 feeMax_,
        uint256 orderCap_,
        uint256 userDailyCap_,
        uint256 merchantDailyCap_,
        address feeVault_
    ) internal {
        if (feeBps_ > BPS_DENOMINATOR) revert FeeOutOfRange();
        if (feeMax_ != 0 && feeMin_ > feeMax_) revert FeeOutOfRange();
        if (feeVault_ == address(0)) revert();

        feeBps = feeBps_;
        feeMin = feeMin_;
        feeMax = feeMax_;
        orderCap = orderCap_;
        userDailyCap = userDailyCap_;
        merchantDailyCap = merchantDailyCap_;
        feeVault = feeVault_;

        emit ParamsUpdated(
            feeBps,
            feeMin,
            feeMax,
            orderCap,
            userDailyCap,
            merchantDailyCap,
            feeVault
        );
    }

    function _quoteFee(uint256 amount) internal view returns (uint256) {
        uint256 fee = (amount * feeBps) / BPS_DENOMINATOR;
        if (feeMin != 0 && fee < feeMin) fee = feeMin;
        if (feeMax != 0 && fee > feeMax) fee = feeMax;
        return fee;
    }

    function _dayBucket(uint256 ts) internal pure returns (uint64) {
        return uint64(ts / 1 days);
    }
}
