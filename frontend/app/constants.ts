export const scrowPayAbi = [
    {
        "type": "constructor",
        "inputs": [
            { "name": "usdc_", "type": "address", "internalType": "address" },
            { "name": "admin", "type": "address", "internalType": "address" },
            { "name": "feeVault_", "type": "address", "internalType": "address" },
            { "name": "feeBps_", "type": "uint16", "internalType": "uint16" },
            { "name": "feeMin_", "type": "uint256", "internalType": "uint256" },
            { "name": "feeMax_", "type": "uint256", "internalType": "uint256" },
            { "name": "orderCap_", "type": "uint256", "internalType": "uint256" }
        ],
        "stateMutability": "nonpayable"
    },
    {
        "type": "function",
        "name": "AUTH_SIGNER",
        "inputs": [],
        "outputs": [{ "name": "", "type": "bytes32", "internalType": "bytes32" }],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "DEFAULT_ADMIN_ROLE",
        "inputs": [],
        "outputs": [{ "name": "", "type": "bytes32", "internalType": "bytes32" }],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "PAUSER_ROLE",
        "inputs": [],
        "outputs": [{ "name": "", "type": "bytes32", "internalType": "bytes32" }],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "USDC",
        "inputs": [],
        "outputs": [
            { "name": "", "type": "address", "internalType": "contract IERC20" }
        ],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "createOrder",
        "inputs": [
            {
                "name": "p",
                "type": "tuple",
                "internalType": "struct EscrowPay.OrderParams",
                "components": [
                    { "name": "buyer", "type": "address", "internalType": "address" },
                    {
                        "name": "merchant",
                        "type": "address",
                        "internalType": "address"
                    },
                    { "name": "amount", "type": "uint256", "internalType": "uint256" },
                    { "name": "timeout", "type": "uint64", "internalType": "uint64" },
                    { "name": "orderId", "type": "bytes32", "internalType": "bytes32" }
                ]
            }
        ],
        "outputs": [],
        "stateMutability": "nonpayable"
    },
    {
        "type": "function",
        "name": "domainSeparator",
        "inputs": [],
        "outputs": [{ "name": "", "type": "bytes32", "internalType": "bytes32" }],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "eip712Domain",
        "inputs": [],
        "outputs": [
            { "name": "fields", "type": "bytes1", "internalType": "bytes1" },
            { "name": "name", "type": "string", "internalType": "string" },
            { "name": "version", "type": "string", "internalType": "string" },
            { "name": "chainId", "type": "uint256", "internalType": "uint256" },
            {
                "name": "verifyingContract",
                "type": "address",
                "internalType": "address"
            },
            { "name": "salt", "type": "bytes32", "internalType": "bytes32" },
            {
                "name": "extensions",
                "type": "uint256[]",
                "internalType": "uint256[]"
            }
        ],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "feeBps",
        "inputs": [],
        "outputs": [{ "name": "", "type": "uint16", "internalType": "uint16" }],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "feeMax",
        "inputs": [],
        "outputs": [{ "name": "", "type": "uint256", "internalType": "uint256" }],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "feeMin",
        "inputs": [],
        "outputs": [{ "name": "", "type": "uint256", "internalType": "uint256" }],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "feeVault",
        "inputs": [],
        "outputs": [{ "name": "", "type": "address", "internalType": "address" }],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "feesAccrued",
        "inputs": [],
        "outputs": [{ "name": "", "type": "uint256", "internalType": "uint256" }],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "getRoleAdmin",
        "inputs": [
            { "name": "role", "type": "bytes32", "internalType": "bytes32" }
        ],
        "outputs": [{ "name": "", "type": "bytes32", "internalType": "bytes32" }],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "grantRole",
        "inputs": [
            { "name": "role", "type": "bytes32", "internalType": "bytes32" },
            { "name": "account", "type": "address", "internalType": "address" }
        ],
        "outputs": [],
        "stateMutability": "nonpayable"
    },
    {
        "type": "function",
        "name": "hasRole",
        "inputs": [
            { "name": "role", "type": "bytes32", "internalType": "bytes32" },
            { "name": "account", "type": "address", "internalType": "address" }
        ],
        "outputs": [{ "name": "", "type": "bool", "internalType": "bool" }],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "isExpired",
        "inputs": [
            { "name": "orderId", "type": "bytes32", "internalType": "bytes32" }
        ],
        "outputs": [{ "name": "", "type": "bool", "internalType": "bool" }],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "merchantBalances",
        "inputs": [{ "name": "", "type": "address", "internalType": "address" }],
        "outputs": [{ "name": "", "type": "uint256", "internalType": "uint256" }],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "merchantDailyCap",
        "inputs": [],
        "outputs": [{ "name": "", "type": "uint256", "internalType": "uint256" }],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "orderCap",
        "inputs": [],
        "outputs": [{ "name": "", "type": "uint256", "internalType": "uint256" }],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "orders",
        "inputs": [{ "name": "", "type": "bytes32", "internalType": "bytes32" }],
        "outputs": [
            { "name": "buyer", "type": "address", "internalType": "address" },
            { "name": "merchant", "type": "address", "internalType": "address" },
            { "name": "amount", "type": "uint256", "internalType": "uint256" },
            { "name": "feeCharged", "type": "uint256", "internalType": "uint256" },
            { "name": "timeout", "type": "uint64", "internalType": "uint64" },
            { "name": "createdAt", "type": "uint64", "internalType": "uint64" },
            {
                "name": "status",
                "type": "uint8",
                "internalType": "enum EscrowPay.OrderStatus"
            }
        ],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "pause",
        "inputs": [],
        "outputs": [],
        "stateMutability": "nonpayable"
    },
    {
        "type": "function",
        "name": "paused",
        "inputs": [],
        "outputs": [{ "name": "", "type": "bool", "internalType": "bool" }],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "quoteFee",
        "inputs": [
            { "name": "amount", "type": "uint256", "internalType": "uint256" }
        ],
        "outputs": [{ "name": "", "type": "uint256", "internalType": "uint256" }],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "refund",
        "inputs": [
            { "name": "orderId", "type": "bytes32", "internalType": "bytes32" }
        ],
        "outputs": [],
        "stateMutability": "nonpayable"
    },
    {
        "type": "function",
        "name": "release",
        "inputs": [
            { "name": "orderId", "type": "bytes32", "internalType": "bytes32" },
            {
                "name": "auth",
                "type": "tuple",
                "internalType": "struct EscrowPay.ReleaseAuth",
                "components": [
                    { "name": "orderId", "type": "bytes32", "internalType": "bytes32" },
                    {
                        "name": "merchant",
                        "type": "address",
                        "internalType": "address"
                    },
                    { "name": "amount", "type": "uint256", "internalType": "uint256" },
                    { "name": "exp", "type": "uint64", "internalType": "uint64" },
                    {
                        "name": "authNonce",
                        "type": "bytes32",
                        "internalType": "bytes32"
                    }
                ]
            },
            { "name": "sig", "type": "bytes", "internalType": "bytes" }
        ],
        "outputs": [],
        "stateMutability": "nonpayable"
    },
    {
        "type": "function",
        "name": "renounceRole",
        "inputs": [
            { "name": "role", "type": "bytes32", "internalType": "bytes32" },
            {
                "name": "callerConfirmation",
                "type": "address",
                "internalType": "address"
            }
        ],
        "outputs": [],
        "stateMutability": "nonpayable"
    },
    {
        "type": "function",
        "name": "revokeRole",
        "inputs": [
            { "name": "role", "type": "bytes32", "internalType": "bytes32" },
            { "name": "account", "type": "address", "internalType": "address" }
        ],
        "outputs": [],
        "stateMutability": "nonpayable"
    },
    {
        "type": "function",
        "name": "setParams",
        "inputs": [
            { "name": "feeBps_", "type": "uint16", "internalType": "uint16" },
            { "name": "feeMin_", "type": "uint256", "internalType": "uint256" },
            { "name": "feeMax_", "type": "uint256", "internalType": "uint256" },
            { "name": "orderCap_", "type": "uint256", "internalType": "uint256" },
            {
                "name": "userDailyCap_",
                "type": "uint256",
                "internalType": "uint256"
            },
            {
                "name": "merchantDailyCap_",
                "type": "uint256",
                "internalType": "uint256"
            },
            { "name": "feeVault_", "type": "address", "internalType": "address" }
        ],
        "outputs": [],
        "stateMutability": "nonpayable"
    },
    {
        "type": "function",
        "name": "supportsInterface",
        "inputs": [
            { "name": "interfaceId", "type": "bytes4", "internalType": "bytes4" }
        ],
        "outputs": [{ "name": "", "type": "bool", "internalType": "bool" }],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "unpause",
        "inputs": [],
        "outputs": [],
        "stateMutability": "nonpayable"
    },
    {
        "type": "function",
        "name": "usedAuth",
        "inputs": [{ "name": "", "type": "bytes32", "internalType": "bytes32" }],
        "outputs": [{ "name": "", "type": "bool", "internalType": "bool" }],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "userDailyCap",
        "inputs": [],
        "outputs": [{ "name": "", "type": "uint256", "internalType": "uint256" }],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "withdraw",
        "inputs": [
            { "name": "amount", "type": "uint256", "internalType": "uint256" }
        ],
        "outputs": [],
        "stateMutability": "nonpayable"
    },
    {
        "type": "function",
        "name": "withdrawFees",
        "inputs": [
            { "name": "amount", "type": "uint256", "internalType": "uint256" }
        ],
        "outputs": [],
        "stateMutability": "nonpayable"
    },
    {
        "type": "event",
        "name": "EIP712DomainChanged",
        "inputs": [],
        "anonymous": false
    },
    {
        "type": "event",
        "name": "FeesWithdrawn",
        "inputs": [
            {
                "name": "vault",
                "type": "address",
                "indexed": true,
                "internalType": "address"
            },
            {
                "name": "amount",
                "type": "uint256",
                "indexed": false,
                "internalType": "uint256"
            }
        ],
        "anonymous": false
    },
    {
        "type": "event",
        "name": "OrderCreated",
        "inputs": [
            {
                "name": "orderId",
                "type": "bytes32",
                "indexed": true,
                "internalType": "bytes32"
            },
            {
                "name": "buyer",
                "type": "address",
                "indexed": true,
                "internalType": "address"
            },
            {
                "name": "merchant",
                "type": "address",
                "indexed": true,
                "internalType": "address"
            },
            {
                "name": "amount",
                "type": "uint256",
                "indexed": false,
                "internalType": "uint256"
            },
            {
                "name": "fee",
                "type": "uint256",
                "indexed": false,
                "internalType": "uint256"
            },
            {
                "name": "timeout",
                "type": "uint64",
                "indexed": false,
                "internalType": "uint64"
            },
            {
                "name": "createdAt",
                "type": "uint64",
                "indexed": false,
                "internalType": "uint64"
            }
        ],
        "anonymous": false
    },
    {
        "type": "event",
        "name": "OrderExpired",
        "inputs": [
            {
                "name": "orderId",
                "type": "bytes32",
                "indexed": true,
                "internalType": "bytes32"
            }
        ],
        "anonymous": false
    },
    {
        "type": "event",
        "name": "OrderRefunded",
        "inputs": [
            {
                "name": "orderId",
                "type": "bytes32",
                "indexed": true,
                "internalType": "bytes32"
            },
            {
                "name": "buyer",
                "type": "address",
                "indexed": true,
                "internalType": "address"
            },
            {
                "name": "amount",
                "type": "uint256",
                "indexed": false,
                "internalType": "uint256"
            }
        ],
        "anonymous": false
    },
    {
        "type": "event",
        "name": "OrderReleased",
        "inputs": [
            {
                "name": "orderId",
                "type": "bytes32",
                "indexed": true,
                "internalType": "bytes32"
            },
            {
                "name": "merchant",
                "type": "address",
                "indexed": true,
                "internalType": "address"
            },
            {
                "name": "paidOut",
                "type": "uint256",
                "indexed": false,
                "internalType": "uint256"
            },
            {
                "name": "authNonce",
                "type": "bytes32",
                "indexed": false,
                "internalType": "bytes32"
            }
        ],
        "anonymous": false
    },
    {
        "type": "event",
        "name": "ParamsUpdated",
        "inputs": [
            {
                "name": "feeBps",
                "type": "uint16",
                "indexed": false,
                "internalType": "uint16"
            },
            {
                "name": "feeMin",
                "type": "uint256",
                "indexed": false,
                "internalType": "uint256"
            },
            {
                "name": "feeMax",
                "type": "uint256",
                "indexed": false,
                "internalType": "uint256"
            },
            {
                "name": "orderCap",
                "type": "uint256",
                "indexed": false,
                "internalType": "uint256"
            },
            {
                "name": "userDailyCap",
                "type": "uint256",
                "indexed": false,
                "internalType": "uint256"
            },
            {
                "name": "merchantDailyCap",
                "type": "uint256",
                "indexed": false,
                "internalType": "uint256"
            },
            {
                "name": "feeVault",
                "type": "address",
                "indexed": false,
                "internalType": "address"
            }
        ],
        "anonymous": false
    },
    {
        "type": "event",
        "name": "Paused",
        "inputs": [
            {
                "name": "account",
                "type": "address",
                "indexed": false,
                "internalType": "address"
            }
        ],
        "anonymous": false
    },
    {
        "type": "event",
        "name": "RoleAdminChanged",
        "inputs": [
            {
                "name": "role",
                "type": "bytes32",
                "indexed": true,
                "internalType": "bytes32"
            },
            {
                "name": "previousAdminRole",
                "type": "bytes32",
                "indexed": true,
                "internalType": "bytes32"
            },
            {
                "name": "newAdminRole",
                "type": "bytes32",
                "indexed": true,
                "internalType": "bytes32"
            }
        ],
        "anonymous": false
    },
    {
        "type": "event",
        "name": "RoleGranted",
        "inputs": [
            {
                "name": "role",
                "type": "bytes32",
                "indexed": true,
                "internalType": "bytes32"
            },
            {
                "name": "account",
                "type": "address",
                "indexed": true,
                "internalType": "address"
            },
            {
                "name": "sender",
                "type": "address",
                "indexed": true,
                "internalType": "address"
            }
        ],
        "anonymous": false
    },
    {
        "type": "event",
        "name": "RoleRevoked",
        "inputs": [
            {
                "name": "role",
                "type": "bytes32",
                "indexed": true,
                "internalType": "bytes32"
            },
            {
                "name": "account",
                "type": "address",
                "indexed": true,
                "internalType": "address"
            },
            {
                "name": "sender",
                "type": "address",
                "indexed": true,
                "internalType": "address"
            }
        ],
        "anonymous": false
    },
    {
        "type": "event",
        "name": "Unpaused",
        "inputs": [
            {
                "name": "account",
                "type": "address",
                "indexed": false,
                "internalType": "address"
            }
        ],
        "anonymous": false
    },
    {
        "type": "event",
        "name": "Withdrawn",
        "inputs": [
            {
                "name": "merchant",
                "type": "address",
                "indexed": true,
                "internalType": "address"
            },
            {
                "name": "amount",
                "type": "uint256",
                "indexed": false,
                "internalType": "uint256"
            },
            {
                "name": "batchCount",
                "type": "uint256",
                "indexed": false,
                "internalType": "uint256"
            }
        ],
        "anonymous": false
    },
    { "type": "error", "name": "AccessControlBadConfirmation", "inputs": [] },
    {
        "type": "error",
        "name": "AccessControlUnauthorizedAccount",
        "inputs": [
            { "name": "account", "type": "address", "internalType": "address" },
            { "name": "neededRole", "type": "bytes32", "internalType": "bytes32" }
        ]
    },
    { "type": "error", "name": "CapExceeded", "inputs": [] },
    { "type": "error", "name": "ECDSAInvalidSignature", "inputs": [] },
    {
        "type": "error",
        "name": "ECDSAInvalidSignatureLength",
        "inputs": [
            { "name": "length", "type": "uint256", "internalType": "uint256" }
        ]
    },
    {
        "type": "error",
        "name": "ECDSAInvalidSignatureS",
        "inputs": [{ "name": "s", "type": "bytes32", "internalType": "bytes32" }]
    },
    { "type": "error", "name": "EnforcedPause", "inputs": [] },
    { "type": "error", "name": "ExpectedPause", "inputs": [] },
    { "type": "error", "name": "ExpiredAuthorization", "inputs": [] },
    { "type": "error", "name": "FeeOutOfRange", "inputs": [] },
    { "type": "error", "name": "InvalidAmount", "inputs": [] },
    { "type": "error", "name": "InvalidShortString", "inputs": [] },
    { "type": "error", "name": "InvalidSignature", "inputs": [] },
    { "type": "error", "name": "InvalidTimeout", "inputs": [] },
    { "type": "error", "name": "NonceAlreadyUsed", "inputs": [] },
    { "type": "error", "name": "OrderAlreadyExists", "inputs": [] },
    { "type": "error", "name": "OrderNotFound", "inputs": [] },
    { "type": "error", "name": "OrderNotPending", "inputs": [] },
    { "type": "error", "name": "ReentrancyGuardReentrantCall", "inputs": [] },
    {
        "type": "error",
        "name": "SafeERC20FailedOperation",
        "inputs": [
            { "name": "token", "type": "address", "internalType": "address" }
        ]
    },
    {
        "type": "error",
        "name": "StringTooLong",
        "inputs": [{ "name": "str", "type": "string", "internalType": "string" }]
    },
    { "type": "error", "name": "WithdrawNothingToClaim", "inputs": [] }
]