// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {EuroToken} from "../src/EuroToken.sol";

contract DeployEuroToken is Script {
    function run() external returns (address) {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        vm.startBroadcast(deployerPrivateKey);
        
        console.log("Deploying EuroToken...");
        console.log("Deployer address:", deployer);
        
        EuroToken token = new EuroToken(deployer);
        
        console.log("EuroToken deployed at:", address(token));
        console.log("Token name:", token.name());
        console.log("Token symbol:", token.symbol());
        console.log("Token decimals:", token.decimals());
        
        // Mint inicial de 1,000,000 tokens
        uint256 initialSupply = 1_000_000 * 10**6; // 1,000,000 EURT con 6 decimales
        token.mint(deployer, initialSupply);
        
        console.log("Initial supply minted:", initialSupply);
        console.log("Deployer balance:", token.balanceOf(deployer));
        
        vm.stopBroadcast();
        
        return address(token);
    }
}
