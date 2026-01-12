// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Script, console} from "forge-std/Script.sol";
import {DocumentRegistry} from "../src/DocumentRegistry.sol";

/**
 * @title DeployScript
 * @notice Script para desplegar DocumentRegistry en Anvil o cualquier red
 */
contract DeployScript is Script {
    function setUp() public {}

    function run() public returns (DocumentRegistry) {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        DocumentRegistry registry = new DocumentRegistry();
        
        console.log("DocumentRegistry deployed at:", address(registry));
        
        vm.stopBroadcast();
        return registry;
    }
}

