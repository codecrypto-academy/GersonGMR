// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title ProductLib
 * @dev Librería para gestión de productos
 */
library ProductLib {
    struct Product {
        uint256 productId;
        uint256 companyId;
        string name;
        string description;
        uint256 price; // En unidades con 6 decimales (centavos de euro)
        uint256 stock;
        string ipfsImageHash;
        bool isActive;
    }

    struct ProductStorage {
        mapping(uint256 => Product) products;
        mapping(uint256 => uint256[]) companyProducts; // companyId => productIds[]
        uint256 nextProductId;
    }

    /**
     * @dev Agrega un nuevo producto
     */
    function addProduct(
        ProductStorage storage self,
        uint256 companyId,
        string memory name,
        string memory description,
        uint256 price,
        uint256 stock,
        string memory ipfsImageHash
    ) internal returns (uint256) {
        require(companyId > 0, "ProductLib: invalid companyId");
        require(bytes(name).length > 0, "ProductLib: name required");
        require(price > 0, "ProductLib: price must be greater than zero");
        
        self.nextProductId++;
        uint256 productId = self.nextProductId;
        
        self.products[productId] = Product({
            productId: productId,
            companyId: companyId,
            name: name,
            description: description,
            price: price,
            stock: stock,
            ipfsImageHash: ipfsImageHash,
            isActive: true
        });
        
        self.companyProducts[companyId].push(productId);
        
        return productId;
    }

    /**
     * @dev Obtiene un producto por ID
     */
    function getProduct(ProductStorage storage self, uint256 productId)
        internal
        view
        returns (Product memory)
    {
        require(productId > 0 && productId <= self.nextProductId, "ProductLib: product not found");
        return self.products[productId];
    }

    /**
     * @dev Actualiza precio y stock de un producto
     */
    function updateProduct(
        ProductStorage storage self,
        uint256 productId,
        uint256 newPrice,
        uint256 newStock
    ) internal {
        require(productId > 0 && productId <= self.nextProductId, "ProductLib: product not found");
        require(newPrice > 0, "ProductLib: price must be greater than zero");
        
        self.products[productId].price = newPrice;
        self.products[productId].stock = newStock;
    }

    /**
     * @dev Reduce el stock de un producto
     */
    function reduceStock(ProductStorage storage self, uint256 productId, uint256 quantity) internal {
        require(productId > 0 && productId <= self.nextProductId, "ProductLib: product not found");
        require(self.products[productId].stock >= quantity, "ProductLib: insufficient stock");
        
        self.products[productId].stock -= quantity;
    }

    /**
     * @dev Obtiene todos los productos de una empresa
     */
    function getCompanyProducts(ProductStorage storage self, uint256 companyId)
        internal
        view
        returns (Product[] memory)
    {
        uint256[] memory productIds = self.companyProducts[companyId];
        Product[] memory products = new Product[](productIds.length);
        
        for (uint256 i = 0; i < productIds.length; i++) {
            products[i] = self.products[productIds[i]];
        }
        
        return products;
    }

    /**
     * @dev Obtiene todos los productos activos
     */
    function getAllActiveProducts(ProductStorage storage self)
        internal
        view
        returns (Product[] memory)
    {
        uint256 count = 0;
        
        // Primera pasada: contar productos activos
        for (uint256 i = 1; i <= self.nextProductId; i++) {
            if (self.products[i].isActive) {
                count++;
            }
        }
        
        // Segunda pasada: crear array con productos activos
        Product[] memory products = new Product[](count);
        uint256 index = 0;
        
        for (uint256 i = 1; i <= self.nextProductId; i++) {
            if (self.products[i].isActive) {
                products[index] = self.products[i];
                index++;
            }
        }
        
        return products;
    }

    /**
     * @dev Activa/desactiva un producto
     */
    function setActive(ProductStorage storage self, uint256 productId, bool isActive) internal {
        require(productId > 0 && productId <= self.nextProductId, "ProductLib: product not found");
        self.products[productId].isActive = isActive;
    }
}
