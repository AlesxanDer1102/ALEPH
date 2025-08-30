// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/ScrowPay.sol";

contract DeployEscrowPay is Script {
    function run() external returns (EscrowPay) {
        // Get deployment parameters from environment variables
        address usdcAddress = vm.envAddress("USDC_ADDRESS");
        address adminAddress = vm.envAddress("ADMIN_ADDRESS");
        address feeVaultAddress = vm.envAddress("FEE_VAULT_ADDRESS");
        address authSignerAddress = vm.envAddress("AUTH_SIGNER_ADDRESS");
        
        // Fee configuration (can be overridden via env vars)
        uint16 feeBps = uint16(vm.envOr("FEE_BPS", uint256(250))); // Default 2.5%
        uint256 feeMin = vm.envOr("FEE_MIN", uint256(1 * 10**6)); // Default 1 USDC
        uint256 feeMax = vm.envOr("FEE_MAX", uint256(100 * 10**6)); // Default 100 USDC
        uint256 orderCap = vm.envOr("ORDER_CAP", uint256(10000 * 10**6)); // Default 10k USDC
        
        console.log("Deployment Parameters:");
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
        
        console.log("EscrowPay deployed at:", address(escrow));
        console.log("Domain Separator:", vm.toString(escrow.domainSeparator()));
        
        vm.stopBroadcast();
        
        return escrow;
    }
    
    function deployWithCustomParams(
        address usdcAddress,
        address adminAddress,
        address feeVaultAddress,
        address authSignerAddress,
        uint16 feeBps,
        uint256 feeMin,
        uint256 feeMax,
        uint256 orderCap
    ) external returns (EscrowPay) {
        console.log("Deploying EscrowPay with custom parameters:");
        console.log("USDC Address:", usdcAddress);
        console.log("Admin Address:", adminAddress);
        console.log("Fee Vault Address:", feeVaultAddress);
        console.log("Auth Signer Address:", authSignerAddress);
        
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
        
        // Grant AUTH_SIGNER role
        escrow.grantRole(escrow.AUTH_SIGNER(), authSignerAddress);
        
        console.log("EscrowPay deployed at:", address(escrow));
        
        vm.stopBroadcast();
        
        return escrow;
    }
}