// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title TestToken
 * @dev Token ERC20 de prueba con función de mint pública para testing
 */
contract TestToken is ERC20, Ownable {
    uint8 private _decimals;

    constructor(
        string memory name,
        string memory symbol,
        uint8 decimals_
    ) ERC20(name, symbol) Ownable() {
        _decimals = decimals_;
    }

    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }

    /**
     * @dev Permite al owner mintear tokens a cualquier dirección
     * @param to Dirección que recibirá los tokens
     * @param amount Cantidad de tokens a mintear
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    /**
     * @dev Permite a cualquiera mintear tokens para testing
     * @param amount Cantidad de tokens a mintear
     */
    function faucet(uint256 amount) external {
        require(amount <= 10000 * 10**_decimals, "Max 10000 tokens per faucet");
        _mint(msg.sender, amount);
    }
}
