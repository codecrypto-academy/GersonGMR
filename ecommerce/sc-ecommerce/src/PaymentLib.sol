// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title PaymentLib
 * @dev Librería para procesamiento de pagos con EuroToken
 */
library PaymentLib {
    /**
     * @dev Procesa un pago de tokens desde el cliente hacia la empresa
     * @param tokenAddress Dirección del contrato EuroToken
     * @param customer Dirección del cliente que paga
     * @param merchant Dirección de la empresa que recibe
     * @param amount Cantidad de tokens a transferir (en unidades con 6 decimales)
     */
    function processPayment(
        address tokenAddress,
        address customer,
        address merchant,
        uint256 amount
    ) internal returns (bool) {
        require(tokenAddress != address(0), "PaymentLib: invalid token address");
        require(customer != address(0), "PaymentLib: invalid customer address");
        require(merchant != address(0), "PaymentLib: invalid merchant address");
        require(amount > 0, "PaymentLib: amount must be greater than zero");
        
        IERC20 token = IERC20(tokenAddress);
        
        // Verifica que el contrato tiene suficiente allowance
        uint256 allowance = token.allowance(customer, address(this));
        require(allowance >= amount, "PaymentLib: insufficient allowance");
        
        // Verifica que el cliente tiene suficiente balance
        uint256 balance = token.balanceOf(customer);
        require(balance >= amount, "PaymentLib: insufficient balance");
        
        // Transfiere los tokens del cliente a la empresa
        bool success = token.transferFrom(customer, merchant, amount);
        require(success, "PaymentLib: transfer failed");
        
        return true;
    }

    /**
     * @dev Verifica si un cliente tiene suficiente balance y allowance
     */
    function canPay(
        address tokenAddress,
        address customer,
        uint256 amount
    ) internal view returns (bool) {
        if (tokenAddress == address(0) || customer == address(0) || amount == 0) {
            return false;
        }
        
        IERC20 token = IERC20(tokenAddress);
        
        uint256 balance = token.balanceOf(customer);
        uint256 allowance = token.allowance(customer, address(this));
        
        return balance >= amount && allowance >= amount;
    }
}
