// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "forge-std/Script.sol";
import "../src/Escrow.sol";
import "../src/TestToken.sol";

contract DeployScript is Script {
    // Cuentas de test de Anvil
    address constant ACCOUNT_0 = 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266;
    address constant ACCOUNT_1 = 0x70997970C51812dc3A010C7d01b50e0d17dc79C8;
    address constant ACCOUNT_2 = 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC;

    function run() external {
        // Private key del deployer (account #0 de Anvil)
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);

        // 1. Desplegar el contrato Escrow
        Escrow escrow = new Escrow();
        console.log("Escrow deployed at:", address(escrow));

        // 2. Desplegar Token A
        TestToken tokenA = new TestToken("Token A", "TKA", 18);
        console.log("TokenA deployed at:", address(tokenA));

        // 3. Desplegar Token B
        TestToken tokenB = new TestToken("Token B", "TKB", 18);
        console.log("TokenB deployed at:", address(tokenB));

        // 4. Agregar tokens al Escrow
        escrow.addToken(address(tokenA));
        escrow.addToken(address(tokenB));
        console.log("Tokens added to Escrow");

        // 5. Mint tokens a las cuentas de test (1000 de cada uno)
        uint256 mintAmount = 1000 * 10**18;
        
        tokenA.mint(ACCOUNT_0, mintAmount);
        tokenA.mint(ACCOUNT_1, mintAmount);
        tokenA.mint(ACCOUNT_2, mintAmount);
        
        tokenB.mint(ACCOUNT_0, mintAmount);
        tokenB.mint(ACCOUNT_1, mintAmount);
        tokenB.mint(ACCOUNT_2, mintAmount);
        
        console.log("Tokens minted to test accounts");

        vm.stopBroadcast();

        // Imprimir resumen
        console.log("\n=== DEPLOYMENT SUMMARY ===");
        console.log("Escrow:", address(escrow));
        console.log("TokenA (TKA):", address(tokenA));
        console.log("TokenB (TKB):", address(tokenB));
        console.log("==========================\n");
    }
}
