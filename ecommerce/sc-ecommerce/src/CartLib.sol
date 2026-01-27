// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title CartLib
 * @dev Librería para gestión de carritos de compra
 */
library CartLib {
    struct CartItem {
        uint256 productId;
        uint256 quantity;
    }

    struct Cart {
        CartItem[] items;
        mapping(uint256 => uint256) productIndex; // productId => index in items array
    }

    struct CartStorage {
        mapping(address => Cart) carts;
    }

    /**
     * @dev Agrega un producto al carrito
     */
    function addToCart(
        CartStorage storage self,
        address customer,
        uint256 productId,
        uint256 quantity
    ) internal {
        require(customer != address(0), "CartLib: invalid customer address");
        require(productId > 0, "CartLib: invalid productId");
        require(quantity > 0, "CartLib: quantity must be greater than zero");
        
        Cart storage cart = self.carts[customer];
        
        // Si el producto ya está en el carrito, incrementa la cantidad
        if (cart.productIndex[productId] > 0) {
            uint256 index = cart.productIndex[productId] - 1; // Ajuste porque 0 significa "no existe"
            cart.items[index].quantity += quantity;
        } else {
            // Agrega nuevo item al carrito
            cart.items.push(CartItem({productId: productId, quantity: quantity}));
            cart.productIndex[productId] = cart.items.length; // Guarda índice + 1
        }
    }

    /**
     * @dev Remueve un producto del carrito
     */
    function removeFromCart(
        CartStorage storage self,
        address customer,
        uint256 productId
    ) internal {
        require(customer != address(0), "CartLib: invalid customer address");
        
        Cart storage cart = self.carts[customer];
        require(cart.productIndex[productId] > 0, "CartLib: product not in cart");
        
        uint256 index = cart.productIndex[productId] - 1;
        uint256 lastIndex = cart.items.length - 1;
        
        // Mueve el último elemento a la posición del elemento a eliminar
        if (index != lastIndex) {
            cart.items[index] = cart.items[lastIndex];
            cart.productIndex[cart.items[lastIndex].productId] = index + 1;
        }
        
        // Elimina el último elemento
        cart.items.pop();
        delete cart.productIndex[productId];
    }

    /**
     * @dev Actualiza la cantidad de un producto en el carrito
     */
    function updateCartItem(
        CartStorage storage self,
        address customer,
        uint256 productId,
        uint256 newQuantity
    ) internal {
        require(customer != address(0), "CartLib: invalid customer address");
        require(newQuantity > 0, "CartLib: quantity must be greater than zero");
        
        Cart storage cart = self.carts[customer];
        require(cart.productIndex[productId] > 0, "CartLib: product not in cart");
        
        uint256 index = cart.productIndex[productId] - 1;
        cart.items[index].quantity = newQuantity;
    }

    /**
     * @dev Obtiene el carrito de un cliente
     */
    function getCart(CartStorage storage self, address customer)
        internal
        view
        returns (CartItem[] memory)
    {
        return self.carts[customer].items;
    }

    /**
     * @dev Limpia el carrito de un cliente
     */
    function clearCart(CartStorage storage self, address customer) internal {
        Cart storage cart = self.carts[customer];
        
        // Limpia el mapping de índices antes de eliminar items
        for (uint256 i = 0; i < cart.items.length; i++) {
            delete cart.productIndex[cart.items[i].productId];
        }
        
        delete cart.items;
    }

    /**
     * @dev Obtiene el número de items en el carrito
     */
    function getCartItemCount(CartStorage storage self, address customer)
        internal
        view
        returns (uint256)
    {
        return self.carts[customer].items.length;
    }
}
