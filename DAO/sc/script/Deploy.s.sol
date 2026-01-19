// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {MinimalForwarder} from "../src/MinimalForwarder.sol";
import {DAOVoting} from "../src/DAOVoting.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);

        // Deploy MinimalForwarder
        MinimalForwarder forwarder = new MinimalForwarder();
        console.log("MinimalForwarder deployed at:", address(forwarder));

        // Deploy DAOVoting
        DAOVoting dao = new DAOVoting(address(forwarder));
        console.log("DAOVoting deployed at:", address(dao));

        vm.stopBroadcast();
        
        // Save deployment info
        console.log("\n=== Deployment Complete ===");
        console.log("MinimalForwarder:", address(forwarder));
        console.log("DAOVoting:", address(dao));
        console.log("\nAdd these to your .env.local:");
        console.log("NEXT_PUBLIC_FORWARDER_ADDRESS=%s", address(forwarder));
        console.log("NEXT_PUBLIC_DAO_ADDRESS=%s", address(dao));
    }
}
