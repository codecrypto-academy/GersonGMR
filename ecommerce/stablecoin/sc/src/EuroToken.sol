// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title EuroToken
 * @dev ERC20 token representing euros digitales (1 EURT = 1 EUR)
 * @notice Decimales: 6 (para representar centavos de euro)
 */
contract EuroToken is ERC20, Ownable {
    /**
     * @dev Constructor que inicializa el token con nombre y símbolo
     * @param initialOwner Dirección que será el owner del contrato
     */
    constructor(address initialOwner) ERC20("EuroToken", "EURT") Ownable(initialOwner) {}

    /**
     * @dev Retorna el número de decimales del token (6)
     * @return Número de decimales
     */
    function decimals() public pure override returns (uint8) {
        return 6;
    }

    /**
     * @dev Crea nuevos tokens y los asigna a una dirección
     * @param to Dirección que recibirá los tokens
     * @param amount Cantidad de tokens a crear (en unidades con 6 decimales)
     * @notice Solo el owner puede ejecutar esta función
     */
    function mint(address to, uint256 amount) external onlyOwner {
        require(to != address(0), "EuroToken: cannot mint to zero address");
        require(amount > 0, "EuroToken: amount must be greater than zero");
        _mint(to, amount);
    }

    /**
     * @dev Quema tokens de una dirección
     * @param from Dirección de la cual se queman los tokens
     * @param amount Cantidad de tokens a quemar
     * @notice Solo el owner puede ejecutar esta función
     */
    function burn(address from, uint256 amount) external onlyOwner {
        require(from != address(0), "EuroToken: cannot burn from zero address");
        require(amount > 0, "EuroToken: amount must be greater than zero");
        _burn(from, amount);
    }
}
