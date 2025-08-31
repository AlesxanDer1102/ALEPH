// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockUSDC is ERC20 {
    constructor() ERC20("Mock USDC", "USDC") {
        // Mint initial supply to deployer
        _mint(msg.sender, 1000000 * 10**6); // 1M USDC
    }

    function decimals() public pure override returns (uint8) {
        return 6;
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    function faucet() external {
        // Allow users to mint 1000 USDC for testing
        _mint(msg.sender, 1000 * 10**6);
    }
}

contract DeployMockUSDC is Script {
    function run() external returns (MockUSDC) {
        vm.startBroadcast();
        
        MockUSDC mockUSDC = new MockUSDC();
        
        console.log("Mock USDC deployed at:", address(mockUSDC));
        console.log("Deployer balance:", mockUSDC.balanceOf(msg.sender));
        
        vm.stopBroadcast();
        
        return mockUSDC;
    }
}