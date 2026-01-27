// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title InvoiceLib
 * @dev Librería para gestión de facturas
 */
library InvoiceLib {
    struct Invoice {
        uint256 invoiceId;
        uint256 companyId;
        address customerAddress;
        uint256 totalAmount; // En unidades con 6 decimales
        uint256 timestamp;
        bool isPaid;
        bytes32 paymentTxHash;
        CartItem[] items;
    }

    struct CartItem {
        uint256 productId;
        uint256 quantity;
        uint256 unitPrice;
    }

    struct InvoiceStorage {
        mapping(uint256 => Invoice) invoices;
        mapping(address => uint256[]) customerInvoices; // customerAddress => invoiceIds[]
        mapping(uint256 => uint256[]) companyInvoices; // companyId => invoiceIds[]
        uint256 nextInvoiceId;
    }

    /**
     * @dev Crea una nueva factura desde el carrito
     */
    function createInvoice(
        InvoiceStorage storage self,
        address customerAddress,
        uint256 companyId,
        uint256 totalAmount,
        CartItem[] memory items
    ) internal returns (uint256) {
        require(customerAddress != address(0), "InvoiceLib: invalid customer address");
        require(companyId > 0, "InvoiceLib: invalid companyId");
        require(totalAmount > 0, "InvoiceLib: totalAmount must be greater than zero");
        require(items.length > 0, "InvoiceLib: invoice must have at least one item");
        
        self.nextInvoiceId++;
        uint256 invoiceId = self.nextInvoiceId;
        
        Invoice storage invoice = self.invoices[invoiceId];
        invoice.invoiceId = invoiceId;
        invoice.companyId = companyId;
        invoice.customerAddress = customerAddress;
        invoice.totalAmount = totalAmount;
        invoice.timestamp = block.timestamp;
        invoice.isPaid = false;
        invoice.paymentTxHash = bytes32(0);
        
        // Copia los items
        for (uint256 i = 0; i < items.length; i++) {
            invoice.items.push(items[i]);
        }
        
        // Registra la factura en los índices
        self.customerInvoices[customerAddress].push(invoiceId);
        self.companyInvoices[companyId].push(invoiceId);
        
        return invoiceId;
    }

    /**
     * @dev Obtiene una factura por ID
     */
    function getInvoice(InvoiceStorage storage self, uint256 invoiceId)
        internal
        view
        returns (Invoice memory)
    {
        require(invoiceId > 0 && invoiceId <= self.nextInvoiceId, "InvoiceLib: invoice not found");
        return self.invoices[invoiceId];
    }

    /**
     * @dev Marca una factura como pagada
     */
    function markAsPaid(
        InvoiceStorage storage self,
        uint256 invoiceId,
        bytes32 paymentTxHash
    ) internal {
        require(invoiceId > 0 && invoiceId <= self.nextInvoiceId, "InvoiceLib: invoice not found");
        require(!self.invoices[invoiceId].isPaid, "InvoiceLib: invoice already paid");
        
        self.invoices[invoiceId].isPaid = true;
        self.invoices[invoiceId].paymentTxHash = paymentTxHash;
    }

    /**
     * @dev Obtiene todas las facturas de un cliente
     */
    function getCustomerInvoices(InvoiceStorage storage self, address customerAddress)
        internal
        view
        returns (Invoice[] memory)
    {
        uint256[] memory invoiceIds = self.customerInvoices[customerAddress];
        Invoice[] memory invoices = new Invoice[](invoiceIds.length);
        
        for (uint256 i = 0; i < invoiceIds.length; i++) {
            invoices[i] = self.invoices[invoiceIds[i]];
        }
        
        return invoices;
    }

    /**
     * @dev Obtiene todas las facturas de una empresa
     */
    function getCompanyInvoices(InvoiceStorage storage self, uint256 companyId)
        internal
        view
        returns (Invoice[] memory)
    {
        uint256[] memory invoiceIds = self.companyInvoices[companyId];
        Invoice[] memory invoices = new Invoice[](invoiceIds.length);
        
        for (uint256 i = 0; i < invoiceIds.length; i++) {
            invoices[i] = self.invoices[invoiceIds[i]];
        }
        
        return invoices;
    }
}
