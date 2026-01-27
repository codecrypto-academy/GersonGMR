// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {Ecommerce} from "../src/Ecommerce.sol";
import {EuroToken} from "eurotoken/EuroToken.sol";
import {CompanyLib} from "../src/CompanyLib.sol";
import {ProductLib} from "../src/ProductLib.sol";
import {CartLib} from "../src/CartLib.sol";
import {InvoiceLib} from "../src/InvoiceLib.sol";

contract EcommerceTest is Test {
    Ecommerce public ecommerce;
    EuroToken public euroToken;
    
    address public owner;
    address public companyOwner;
    address public customer;
    
    uint256 public constant INITIAL_SUPPLY = 1_000_000 * 10**6; // 1M EURT
    
    function setUp() public {
        owner = address(this);
        companyOwner = address(0x1);
        customer = address(0x2);
        
        // Deploy EuroToken
        euroToken = new EuroToken(owner);
        euroToken.mint(customer, INITIAL_SUPPLY);
        
        // Deploy Ecommerce
        ecommerce = new Ecommerce(address(euroToken));
    }
    
    // ============ TESTS DE EMPRESAS ============
    
    function test_RegisterCompany() public {
        vm.prank(companyOwner);
        uint256 companyId = ecommerce.registerCompany("Mi Tienda", "TAX123");
        
        assertEq(companyId, 1);
        assertTrue(ecommerce.hasCompany(companyOwner));
        
        CompanyLib.Company memory company = ecommerce.getCompany(companyId);
        assertEq(company.name, "Mi Tienda");
        assertEq(company.taxId, "TAX123");
        assertEq(company.companyAddress, companyOwner);
        assertTrue(company.isActive);
    }
    
    function test_RegisterCompanyTwiceFails() public {
        vm.prank(companyOwner);
        ecommerce.registerCompany("Mi Tienda", "TAX123");
        
        vm.prank(companyOwner);
        vm.expectRevert("Ecommerce: company already registered");
        ecommerce.registerCompany("Otra Tienda", "TAX456");
    }
    
    function test_GetCompanyIdByAddress() public {
        vm.prank(companyOwner);
        uint256 companyId = ecommerce.registerCompany("Mi Tienda", "TAX123");
        
        assertEq(ecommerce.getCompanyIdByAddress(companyOwner), companyId);
        assertEq(ecommerce.getCompanyIdByAddress(address(0x999)), 0);
    }
    
    // ============ TESTS DE PRODUCTOS ============
    
    function test_AddProduct() public {
        vm.prank(companyOwner);
        uint256 companyId = ecommerce.registerCompany("Mi Tienda", "TAX123");
        
        vm.prank(companyOwner);
        uint256 productId = ecommerce.addProduct(
            companyId,
            "Producto A",
            "Descripcion del producto",
            10 * 10**6, // 10 EURT
            100, // stock
            "QmHash123"
        );
        
        assertEq(productId, 1);
        
        ProductLib.Product memory product = ecommerce.getProduct(productId);
        assertEq(product.name, "Producto A");
        assertEq(product.price, 10 * 10**6);
        assertEq(product.stock, 100);
    }
    
    function test_AddProductByNonOwnerFails() public {
        vm.prank(companyOwner);
        uint256 companyId = ecommerce.registerCompany("Mi Tienda", "TAX123");
        
        vm.prank(customer);
        vm.expectRevert("Ecommerce: only company owner can add products");
        ecommerce.addProduct(companyId, "Producto", "Desc", 10 * 10**6, 100, "hash");
    }
    
    function test_UpdateProduct() public {
        vm.prank(companyOwner);
        uint256 companyId = ecommerce.registerCompany("Mi Tienda", "TAX123");
        
        vm.prank(companyOwner);
        uint256 productId = ecommerce.addProduct(companyId, "Producto", "Desc", 10 * 10**6, 100, "hash");
        
        vm.prank(companyOwner);
        ecommerce.updateProduct(productId, 15 * 10**6, 50);
        
        ProductLib.Product memory product = ecommerce.getProduct(productId);
        assertEq(product.price, 15 * 10**6);
        assertEq(product.stock, 50);
    }
    
    function test_GetAllProducts() public {
        vm.prank(companyOwner);
        uint256 companyId = ecommerce.registerCompany("Mi Tienda", "TAX123");
        
        vm.prank(companyOwner);
        ecommerce.addProduct(companyId, "Producto A", "Desc", 10 * 10**6, 100, "hash1");
        
        vm.prank(companyOwner);
        ecommerce.addProduct(companyId, "Producto B", "Desc", 20 * 10**6, 50, "hash2");
        
        ProductLib.Product[] memory products = ecommerce.getAllProducts();
        assertEq(products.length, 2);
    }
    
    // ============ TESTS DE CARRITO ============
    
    function test_AddToCart() public {
        vm.prank(companyOwner);
        uint256 companyId = ecommerce.registerCompany("Mi Tienda", "TAX123");
        
        vm.prank(companyOwner);
        uint256 productId = ecommerce.addProduct(companyId, "Producto", "Desc", 10 * 10**6, 100, "hash");
        
        vm.prank(customer);
        ecommerce.addToCart(productId, 2);
        
        CartLib.CartItem[] memory cart = ecommerce.getCart(customer);
        assertEq(cart.length, 1);
        assertEq(cart[0].productId, productId);
        assertEq(cart[0].quantity, 2);
    }
    
    function test_AddToCartInsufficientStock() public {
        vm.prank(companyOwner);
        uint256 companyId = ecommerce.registerCompany("Mi Tienda", "TAX123");
        
        vm.prank(companyOwner);
        uint256 productId = ecommerce.addProduct(companyId, "Producto", "Desc", 10 * 10**6, 5, "hash");
        
        vm.prank(customer);
        vm.expectRevert("Ecommerce: insufficient stock");
        ecommerce.addToCart(productId, 10);
    }
    
    function test_ClearCart() public {
        vm.prank(companyOwner);
        uint256 companyId = ecommerce.registerCompany("Mi Tienda", "TAX123");
        
        vm.prank(companyOwner);
        uint256 productId = ecommerce.addProduct(companyId, "Producto", "Desc", 10 * 10**6, 100, "hash");
        
        vm.prank(customer);
        ecommerce.addToCart(productId, 2);
        
        vm.prank(customer);
        ecommerce.clearCart(customer);
        
        CartLib.CartItem[] memory cart = ecommerce.getCart(customer);
        assertEq(cart.length, 0);
    }
    
    // ============ TESTS DE FACTURAS ============
    
    function test_CreateInvoice() public {
        vm.prank(companyOwner);
        uint256 companyId = ecommerce.registerCompany("Mi Tienda", "TAX123");
        
        vm.prank(companyOwner);
        uint256 productId = ecommerce.addProduct(companyId, "Producto", "Desc", 10 * 10**6, 100, "hash");
        
        vm.prank(customer);
        ecommerce.addToCart(productId, 2);
        
        vm.prank(customer);
        uint256 invoiceId = ecommerce.createInvoice(customer, companyId);
        
        assertEq(invoiceId, 1);
        
        InvoiceLib.Invoice memory invoice = ecommerce.getInvoice(invoiceId);
        assertEq(invoice.totalAmount, 20 * 10**6); // 2 * 10 EURT
        assertEq(invoice.items.length, 1);
        assertFalse(invoice.isPaid);
    }
    
    function test_CreateInvoiceEmptyCart() public {
        vm.prank(companyOwner);
        uint256 companyId = ecommerce.registerCompany("Mi Tienda", "TAX123");
        
        vm.prank(customer);
        vm.expectRevert("Ecommerce: cart is empty");
        ecommerce.createInvoice(customer, companyId);
    }
    
    // ============ TESTS DE PAGO ============
    
    function test_ProcessPayment() public {
        vm.prank(companyOwner);
        uint256 companyId = ecommerce.registerCompany("Mi Tienda", "TAX123");
        
        vm.prank(companyOwner);
        uint256 productId = ecommerce.addProduct(companyId, "Producto", "Desc", 10 * 10**6, 100, "hash");
        
        vm.prank(customer);
        ecommerce.addToCart(productId, 2);
        
        vm.prank(customer);
        uint256 invoiceId = ecommerce.createInvoice(customer, companyId);
        
        // Aprobar gasto de tokens
        vm.prank(customer);
        euroToken.approve(address(ecommerce), 20 * 10**6);
        
        // Procesar pago
        vm.prank(customer);
        ecommerce.processPayment(customer, invoiceId);
        
        InvoiceLib.Invoice memory invoice = ecommerce.getInvoice(invoiceId);
        assertTrue(invoice.isPaid);
        
        // Verificar stock reducido
        ProductLib.Product memory product = ecommerce.getProduct(productId);
        assertEq(product.stock, 98); // 100 - 2
        
        // Verificar balance de empresa
        assertEq(euroToken.balanceOf(companyOwner), 20 * 10**6);
    }
    
    function test_ProcessPaymentInsufficientBalance() public {
        address poorCustomer = address(0x999);
        
        vm.prank(companyOwner);
        uint256 companyId = ecommerce.registerCompany("Mi Tienda", "TAX123");
        
        vm.prank(companyOwner);
        uint256 productId = ecommerce.addProduct(companyId, "Producto", "Desc", 10 * 10**6, 100, "hash");
        
        vm.prank(poorCustomer);
        ecommerce.addToCart(productId, 2);
        
        vm.prank(poorCustomer);
        uint256 invoiceId = ecommerce.createInvoice(poorCustomer, companyId);
        
        vm.prank(poorCustomer);
        vm.expectRevert();
        ecommerce.processPayment(poorCustomer, invoiceId);
    }
    
    function test_ProcessPaymentTwiceFails() public {
        vm.prank(companyOwner);
        uint256 companyId = ecommerce.registerCompany("Mi Tienda", "TAX123");
        
        vm.prank(companyOwner);
        uint256 productId = ecommerce.addProduct(companyId, "Producto", "Desc", 10 * 10**6, 100, "hash");
        
        vm.prank(customer);
        ecommerce.addToCart(productId, 2);
        
        vm.prank(customer);
        uint256 invoiceId = ecommerce.createInvoice(customer, companyId);
        
        vm.prank(customer);
        euroToken.approve(address(ecommerce), 20 * 10**6);
        
        vm.prank(customer);
        ecommerce.processPayment(customer, invoiceId);
        
        vm.prank(customer);
        vm.expectRevert("Ecommerce: invoice already paid");
        ecommerce.processPayment(customer, invoiceId);
    }
    
    function test_GetCustomerInvoices() public {
        vm.prank(companyOwner);
        uint256 companyId = ecommerce.registerCompany("Mi Tienda", "TAX123");
        
        vm.prank(companyOwner);
        uint256 productId = ecommerce.addProduct(companyId, "Producto", "Desc", 10 * 10**6, 100, "hash");
        
        vm.prank(customer);
        ecommerce.addToCart(productId, 1);
        
        vm.prank(customer);
        uint256 invoiceId1 = ecommerce.createInvoice(customer, companyId);
        
        vm.prank(customer);
        ecommerce.addToCart(productId, 1);
        
        vm.prank(customer);
        uint256 invoiceId2 = ecommerce.createInvoice(customer, companyId);
        
        InvoiceLib.Invoice[] memory invoices = ecommerce.getCustomerInvoices(customer);
        assertEq(invoices.length, 2);
        assertEq(invoices[0].invoiceId, invoiceId1);
        assertEq(invoices[1].invoiceId, invoiceId2);
    }
}
