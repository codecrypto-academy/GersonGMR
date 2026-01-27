// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./CompanyLib.sol";
import "./ProductLib.sol";
import "./CartLib.sol";
import "./InvoiceLib.sol";
import "./PaymentLib.sol";

/**
 * @title Ecommerce
 * @dev Contrato principal para gestión de e-commerce en blockchain
 * @notice Integra empresas, productos, carritos, facturas y pagos con EuroToken
 */
contract Ecommerce {
    using CompanyLib for CompanyLib.CompanyStorage;
    using ProductLib for ProductLib.ProductStorage;
    using CartLib for CartLib.CartStorage;
    using InvoiceLib for InvoiceLib.InvoiceStorage;
    using PaymentLib for PaymentLib;

    // Storage
    CompanyLib.CompanyStorage private companyStorage;
    ProductLib.ProductStorage private productStorage;
    CartLib.CartStorage private cartStorage;
    InvoiceLib.InvoiceStorage private invoiceStorage;

    // Dirección del contrato EuroToken
    address public immutable euroTokenAddress;

    // Eventos
    event CompanyRegistered(uint256 indexed companyId, address indexed companyAddress, string name);
    event ProductAdded(uint256 indexed productId, uint256 indexed companyId, string name, uint256 price);
    event ProductUpdated(uint256 indexed productId, uint256 newPrice, uint256 newStock);
    event ProductActivated(uint256 indexed productId, bool isActive);
    event CartItemAdded(address indexed customer, uint256 indexed productId, uint256 quantity);
    event CartCleared(address indexed customer);
    event InvoiceCreated(uint256 indexed invoiceId, address indexed customer, uint256 indexed companyId, uint256 totalAmount);
    event PaymentProcessed(uint256 indexed invoiceId, address indexed customer, address indexed merchant, uint256 amount, bytes32 txHash);

    /**
     * @dev Constructor que inicializa el contrato con la dirección del EuroToken
     * @param _euroTokenAddress Dirección del contrato EuroToken
     */
    constructor(address _euroTokenAddress) {
        require(_euroTokenAddress != address(0), "Ecommerce: invalid EuroToken address");
        euroTokenAddress = _euroTokenAddress;
    }

    // ============ FUNCIONES DE EMPRESAS ============

    /**
     * @dev Registra una nueva empresa
     * @param name Nombre de la empresa
     * @param taxId Número de identificación fiscal
     * @return companyId ID de la empresa registrada
     */
    function registerCompany(string memory name, string memory taxId) external returns (uint256) {
        require(!companyStorage.hasCompany(msg.sender), "Ecommerce: company already registered");
        
        uint256 companyId = companyStorage.registerCompany(msg.sender, name, taxId);
        
        emit CompanyRegistered(companyId, msg.sender, name);
        
        return companyId;
    }

    /**
     * @dev Obtiene información de una empresa
     * @param companyId ID de la empresa
     * @return Empresa con toda su información
     */
    function getCompany(uint256 companyId) external view returns (CompanyLib.Company memory) {
        return companyStorage.getCompany(companyId);
    }

    /**
     * @dev Obtiene el ID de empresa de una dirección
     * @param companyAddress Dirección de la empresa
     * @return companyId ID de la empresa (0 si no existe)
     */
    function getCompanyIdByAddress(address companyAddress) external view returns (uint256) {
        return companyStorage.getCompanyIdByAddress(companyAddress);
    }

    /**
     * @dev Verifica si una dirección tiene empresa registrada
     * @param companyAddress Dirección a verificar
     * @return true si tiene empresa registrada
     */
    function hasCompany(address companyAddress) external view returns (bool) {
        return companyStorage.hasCompany(companyAddress);
    }

    /**
     * @dev Activa/desactiva una empresa
     * @param companyId ID de la empresa
     * @param isActive Nuevo estado activo
     */
    function setCompanyActive(uint256 companyId, bool isActive) external {
        CompanyLib.Company memory company = companyStorage.getCompany(companyId);
        require(company.companyAddress == msg.sender, "Ecommerce: only company owner can modify");
        
        companyStorage.setActive(companyId, isActive);
    }

    // ============ FUNCIONES DE PRODUCTOS ============

    /**
     * @dev Agrega un nuevo producto (solo owner de empresa)
     * @param companyId ID de la empresa
     * @param name Nombre del producto
     * @param description Descripción del producto
     * @param price Precio en unidades con 6 decimales
     * @param stock Stock inicial
     * @param ipfsImageHash Hash IPFS de la imagen
     * @return productId ID del producto creado
     */
    function addProduct(
        uint256 companyId,
        string memory name,
        string memory description,
        uint256 price,
        uint256 stock,
        string memory ipfsImageHash
    ) external returns (uint256) {
        CompanyLib.Company memory company = companyStorage.getCompany(companyId);
        require(company.companyAddress == msg.sender, "Ecommerce: only company owner can add products");
        require(company.isActive, "Ecommerce: company must be active");
        
        uint256 productId = productStorage.addProduct(companyId, name, description, price, stock, ipfsImageHash);
        
        emit ProductAdded(productId, companyId, name, price);
        
        return productId;
    }

    /**
     * @dev Obtiene un producto por ID
     * @param productId ID del producto
     * @return Producto con toda su información
     */
    function getProduct(uint256 productId) external view returns (ProductLib.Product memory) {
        return productStorage.getProduct(productId);
    }

    /**
     * @dev Actualiza precio y stock de un producto (solo owner de empresa)
     * @param productId ID del producto
     * @param newPrice Nuevo precio
     * @param newStock Nuevo stock
     */
    function updateProduct(uint256 productId, uint256 newPrice, uint256 newStock) external {
        ProductLib.Product memory product = productStorage.getProduct(productId);
        CompanyLib.Company memory company = companyStorage.getCompany(product.companyId);
        require(company.companyAddress == msg.sender, "Ecommerce: only company owner can update products");
        
        productStorage.updateProduct(productId, newPrice, newStock);
        
        emit ProductUpdated(productId, newPrice, newStock);
    }

    /**
     * @dev Activa/desactiva un producto (solo owner de empresa)
     * @param productId ID del producto
     * @param isActive Nuevo estado activo
     */
    function setProductActive(uint256 productId, bool isActive) external {
        ProductLib.Product memory product = productStorage.getProduct(productId);
        CompanyLib.Company memory company = companyStorage.getCompany(product.companyId);
        require(company.companyAddress == msg.sender, "Ecommerce: only company owner can modify products");
        
        productStorage.setActive(productId, isActive);
        
        emit ProductActivated(productId, isActive);
    }

    /**
     * @dev Obtiene todos los productos de una empresa
     * @param companyId ID de la empresa
     * @return Array de productos
     */
    function getCompanyProducts(uint256 companyId) external view returns (ProductLib.Product[] memory) {
        return productStorage.getCompanyProducts(companyId);
    }

    /**
     * @dev Obtiene todos los productos activos
     * @return Array de productos activos
     */
    function getAllProducts() external view returns (ProductLib.Product[] memory) {
        return productStorage.getAllActiveProducts();
    }

    // ============ FUNCIONES DE CARRITO ============

    /**
     * @dev Agrega un producto al carrito del cliente
     * @param productId ID del producto
     * @param quantity Cantidad a agregar
     */
    function addToCart(uint256 productId, uint256 quantity) external {
        ProductLib.Product memory product = productStorage.getProduct(productId);
        require(product.isActive, "Ecommerce: product is not active");
        require(product.stock >= quantity, "Ecommerce: insufficient stock");
        
        cartStorage.addToCart(msg.sender, productId, quantity);
        
        emit CartItemAdded(msg.sender, productId, quantity);
    }

    /**
     * @dev Obtiene el carrito de un cliente
     * @param customer Dirección del cliente
     * @return Array de items del carrito
     */
    function getCart(address customer) external view returns (CartLib.CartItem[] memory) {
        return cartStorage.getCart(customer);
    }

    /**
     * @dev Limpia el carrito de un cliente
     * @param customer Dirección del cliente
     */
    function clearCart(address customer) external {
        require(customer == msg.sender, "Ecommerce: can only clear own cart");
        cartStorage.clearCart(customer);
        
        emit CartCleared(customer);
    }

    // ============ FUNCIONES DE FACTURAS ============

    /**
     * @dev Crea una factura desde el carrito del cliente
     * @param customer Dirección del cliente
     * @param companyId ID de la empresa
     * @return invoiceId ID de la factura creada
     */
    function createInvoice(address customer, uint256 companyId) external returns (uint256) {
        require(customer == msg.sender, "Ecommerce: can only create invoice for own cart");
        require(companyId > 0, "Ecommerce: invalid companyId");
        
        CompanyLib.Company memory company = companyStorage.getCompany(companyId);
        require(company.isActive, "Ecommerce: company must be active");
        
        CartLib.CartItem[] memory cartItems = cartStorage.getCart(customer);
        require(cartItems.length > 0, "Ecommerce: cart is empty");
        
        // Agrupa items por empresa y calcula total
        uint256 totalAmount = 0;
        InvoiceLib.CartItem[] memory invoiceItems = new InvoiceLib.CartItem[](cartItems.length);
        
        for (uint256 i = 0; i < cartItems.length; i++) {
            ProductLib.Product memory product = productStorage.getProduct(cartItems[i].productId);
            
            // Verifica que el producto pertenece a la empresa
            require(product.companyId == companyId, "Ecommerce: all items must be from same company");
            require(product.isActive, "Ecommerce: product is not active");
            require(product.stock >= cartItems[i].quantity, "Ecommerce: insufficient stock");
            
            uint256 itemTotal = product.price * cartItems[i].quantity;
            totalAmount += itemTotal;
            
            invoiceItems[i] = InvoiceLib.CartItem({
                productId: cartItems[i].productId,
                quantity: cartItems[i].quantity,
                unitPrice: product.price
            });
        }
        
        require(totalAmount > 0, "Ecommerce: total amount must be greater than zero");
        
        // Crea la factura
        uint256 invoiceId = invoiceStorage.createInvoice(customer, companyId, totalAmount, invoiceItems);
        
        // Limpia el carrito
        cartStorage.clearCart(customer);
        
        emit InvoiceCreated(invoiceId, customer, companyId, totalAmount);
        
        return invoiceId;
    }

    /**
     * @dev Obtiene una factura por ID
     * @param invoiceId ID de la factura
     * @return Factura con toda su información
     */
    function getInvoice(uint256 invoiceId) external view returns (InvoiceLib.Invoice memory) {
        return invoiceStorage.getInvoice(invoiceId);
    }

    /**
     * @dev Obtiene todas las facturas de un cliente
     * @param customer Dirección del cliente
     * @return Array de facturas
     */
    function getCustomerInvoices(address customer) external view returns (InvoiceLib.Invoice[] memory) {
        return invoiceStorage.getCustomerInvoices(customer);
    }

    /**
     * @dev Obtiene todas las facturas de una empresa
     * @param companyId ID de la empresa
     * @return Array de facturas
     */
    function getCompanyInvoices(uint256 companyId) external view returns (InvoiceLib.Invoice[] memory) {
        return invoiceStorage.getCompanyInvoices(companyId);
    }

    // ============ FUNCIONES DE PAGO ============

    /**
     * @dev Procesa el pago de una factura con EuroToken
     * @param customer Dirección del cliente que paga
     * @param invoiceId ID de la factura
     */
    function processPayment(address customer, uint256 invoiceId) external {
        require(customer == msg.sender, "Ecommerce: can only process own payment");
        
        InvoiceLib.Invoice memory invoice = invoiceStorage.getInvoice(invoiceId);
        require(invoice.customerAddress == customer, "Ecommerce: invoice does not belong to customer");
        require(!invoice.isPaid, "Ecommerce: invoice already paid");
        
        CompanyLib.Company memory company = companyStorage.getCompany(invoice.companyId);
        require(company.isActive, "Ecommerce: company must be active");
        
        // Verifica stock antes de procesar pago
        for (uint256 i = 0; i < invoice.items.length; i++) {
            ProductLib.Product memory product = productStorage.getProduct(invoice.items[i].productId);
            require(product.stock >= invoice.items[i].quantity, "Ecommerce: insufficient stock");
        }
        
        // Procesa el pago
        bool success = PaymentLib.processPayment(
            euroTokenAddress,
            customer,
            company.companyAddress,
            invoice.totalAmount
        );
        
        require(success, "Ecommerce: payment processing failed");
        
        // Reduce stock de productos
        for (uint256 i = 0; i < invoice.items.length; i++) {
            productStorage.reduceStock(invoice.items[i].productId, invoice.items[i].quantity);
        }
        
        // Marca factura como pagada
        bytes32 txHash = keccak256(abi.encodePacked(block.timestamp, block.number, customer, invoiceId));
        invoiceStorage.markAsPaid(invoiceId, txHash);
        
        emit PaymentProcessed(invoiceId, customer, company.companyAddress, invoice.totalAmount, txHash);
    }

    /**
     * @dev Verifica si un cliente puede pagar una cantidad
     * @param customer Dirección del cliente
     * @param amount Cantidad a verificar
     * @return true si puede pagar
     */
    function canPay(address customer, uint256 amount) external view returns (bool) {
        return PaymentLib.canPay(euroTokenAddress, customer, amount);
    }
}
