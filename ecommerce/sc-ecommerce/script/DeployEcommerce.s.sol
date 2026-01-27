// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {Ecommerce} from "../src/Ecommerce.sol";

contract DeployEcommerce is Script {
    function run() external returns (address) {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        // Obtener dirección del EuroToken desde variable de entorno
        address euroTokenAddress = vm.envAddress("EUROTOKEN_ADDRESS");
        
        vm.startBroadcast(deployerPrivateKey);
        
        console.log("Deploying Ecommerce contract...");
        console.log("Deployer address:", deployer);
        console.log("EuroToken address:", euroTokenAddress);
        
        Ecommerce ecommerce = new Ecommerce(euroTokenAddress);
        
        console.log("Ecommerce deployed at:", address(ecommerce));
        console.log("EuroToken address:", ecommerce.EURO_TOKEN_ADDRESS());
        
        vm.stopBroadcast();
        
        return address(ecommerce);
    }
}
