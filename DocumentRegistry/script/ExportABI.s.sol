// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Script} from "forge-std/Script.sol";
import {DocumentRegistry} from "../src/DocumentRegistry.sol";

/**
 * @title ExportABIScript
 * @notice Script para exportar el ABI del contrato (se ejecuta automáticamente al compilar)
 */
contract ExportABIScript is Script {
    function run() public {
        // Este script se usa para asegurar que el ABI se genere
        // El ABI se encuentra en out/DocumentRegistry.sol/DocumentRegistry.json
    }
}

