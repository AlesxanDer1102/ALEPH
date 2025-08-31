// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/ScrowPay.sol";

/**
 * @title DeployTestnet
 * @notice Deployment script for testnets with real USDC addresses
 * @dev Uses environment variables for network-specific configurations
 */
contract DeployTestnet is Script {
    
    // Known USDC addresses for different networks
    mapping(uint256 => address) public usdcAddresses;
    
    function setUp() public {
        // Arbitrum Sepolia USDC
        usdcAddresses[421614] = 0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d;
        
        // Sepolia USDC (Circle's testnet USDC)
        usdcAddresses[11155111] = 0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238;
        
        // Base Sepolia USDC
        usdcAddresses[84532] = 0x036CbD53842c5426634e7929541eC2318f3dCF7e;
        
        // Polygon Mumbai USDC (deprecated but still available)
        usdcAddresses[80001] = 0x9999f7Fea5938fD3b1E26A12c3f2fb024e194f97;
        
        // Polygon Amoy USDC (new Mumbai replacement)
        usdcAddresses[80002] = 0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582;
    }
    
    function run() external returns (EscrowPay) {
        setUp();
        
        uint256 chainId = block.chainid;
        console.log("Deploying to chain ID:", chainId);
        
        // Get USDC address for the current chain
        address usdcAddress = usdcAddresses[chainId];
        
        // Allow manual override via environment variable
        if (vm.envOr("USDC_ADDRESS", address(0)) != address(0)) {
            usdcAddress = vm.envAddress("USDC_ADDRESS");
            console.log("Using custom USDC address from env:", usdcAddress);
        } else if (usdcAddress != address(0)) {
            console.log("Using known USDC address for chain:", usdcAddress);
        } else {
            revert("No USDC address configured for this chain. Set USDC_ADDRESS env var.");
        }
        
        // Get deployment parameters from environment variables
        address adminAddress = vm.envAddress("ADMIN_ADDRESS");
        address feeVaultAddress = vm.envAddress("FEE_VAULT_ADDRESS");
        address authSignerAddress = vm.envAddress("AUTH_SIGNER_ADDRESS");
        
        // Fee configuration with testnet-friendly defaults
        uint16 feeBps = uint16(vm.envOr("FEE_BPS", uint256(100))); // Default 1% for testnet
        uint256 feeMin = vm.envOr("FEE_MIN", uint256(1 * 10**6)); // 1 USDC
        uint256 feeMax = vm.envOr("FEE_MAX", uint256(50 * 10**6)); // 50 USDC for testnet
        uint256 orderCap = vm.envOr("ORDER_CAP", uint256(5000 * 10**6)); // 5k USDC for testnet
        
        console.log("=== DEPLOYMENT PARAMETERS ===");
        console.log("Chain ID:", chainId);
        console.log("USDC Address:", usdcAddress);
        console.log("Admin Address:", adminAddress);
        console.log("Fee Vault Address:", feeVaultAddress);
        console.log("Auth Signer Address:", authSignerAddress);
        console.log("Fee BPS:", feeBps);
        console.log("Fee Min:", feeMin);
        console.log("Fee Max:", feeMax);
        console.log("Order Cap:", orderCap);
        
        vm.startBroadcast();
        
        EscrowPay escrow = new EscrowPay(
            usdcAddress,
            adminAddress,
            feeVaultAddress,
            feeBps,
            feeMin,
            feeMax,
            orderCap
        );
        
        // Grant AUTH_SIGNER role to the specified address
        escrow.grantRole(escrow.AUTH_SIGNER(), authSignerAddress);
        
        vm.stopBroadcast();
        
        console.log("=== DEPLOYMENT COMPLETE ===");
        console.log("EscrowPay deployed at:", address(escrow));
        console.log("Domain Separator:", vm.toString(escrow.domainSeparator()));
        console.log("");
        console.log("=== VERIFICATION ===");
        console.log("forge verify-contract", address(escrow), "src/ScrowPay.sol:EscrowPay");
        console.log("Use the following constructor args for verification:");
        console.log("USDC:", usdcAddress);
        console.log("Admin:", adminAddress);
        console.log("FeeVault:", feeVaultAddress);
        console.log("FeeBps:", feeBps);
        console.log("FeeMin:", feeMin);
        console.log("FeeMax:", feeMax);
        console.log("OrderCap:", orderCap);
        
        return escrow;
    }
    
    function getChainName(uint256 chainId) public pure returns (string memory) {
        if (chainId == 421614) return "Arbitrum Sepolia";
        if (chainId == 11155111) return "Sepolia";
        if (chainId == 84532) return "Base Sepolia";
        if (chainId == 80001) return "Polygon Mumbai";
        if (chainId == 80002) return "Polygon Amoy";
        return "Unknown";
    }
}