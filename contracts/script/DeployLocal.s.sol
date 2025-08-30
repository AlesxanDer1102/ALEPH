// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "./DeployMockUSDC.s.sol";
import "./DeployEscrowPay.s.sol";

/**
 * @title DeployLocal
 * @notice Complete deployment script for local Anvil testing
 * @dev Deploys MockUSDC and EscrowPay contracts with test configurations
 */
contract DeployLocal is Script {
    function run() external {
        // Use the default forge account for local testing
        address deployer = vm.addr(vm.envUint("PRIVATE_KEY"));
        
        console.log("Deploying to local Anvil...");
        console.log("Deployer address:", deployer);
        
        vm.startBroadcast();
        
        // Deploy Mock USDC
        MockUSDC mockUSDC = new MockUSDC();
        console.log("Mock USDC deployed at:", address(mockUSDC));
        
        // Configuration for local testing
        address admin = deployer; // Use deployer as admin for testing
        address feeVault = deployer; // Use deployer as fee vault for testing
        address authSigner = vm.addr(0xA11CE); // Deterministic auth signer for testing
        
        uint16 feeBps = 250; // 2.5%
        uint256 feeMin = 1 * 10**6; // 1 USDC
        uint256 feeMax = 100 * 10**6; // 100 USDC
        uint256 orderCap = 10000 * 10**6; // 10k USDC
        
        // Deploy EscrowPay
        EscrowPay escrow = new EscrowPay(
            address(mockUSDC),
            admin,
            feeVault,
            feeBps,
            feeMin,
            feeMax,
            orderCap
        );
        
        // Grant AUTH_SIGNER role
        escrow.grantRole(escrow.AUTH_SIGNER(), authSigner);
        
        // Create additional test accounts and mint USDC
        address buyer1 = vm.addr(0xB1);
        address buyer2 = vm.addr(0xB2);
        address merchant1 = vm.addr(0xABCD1);
        address merchant2 = vm.addr(0xABCD2);
        
        // Mint USDC for testing accounts
        mockUSDC.mint(buyer1, 50000 * 10**6); // 50k USDC
        mockUSDC.mint(buyer2, 50000 * 10**6); // 50k USDC
        
        vm.stopBroadcast();
        
        console.log("=== LOCAL DEPLOYMENT COMPLETE ===");
        console.log("EscrowPay deployed at:", address(escrow));
        console.log("Mock USDC deployed at:", address(mockUSDC));
        console.log("Admin/Deployer:", admin);
        console.log("Fee Vault:", feeVault);
        console.log("Auth Signer:", authSigner);
        console.log("Buyer1:", buyer1);
        console.log("Buyer2:", buyer2);
        console.log("Merchant1:", merchant1);
        console.log("Merchant2:", merchant2);
        console.log("Domain Separator:", vm.toString(escrow.domainSeparator()));
    }
}