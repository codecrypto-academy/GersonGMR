export const EcommerceABI = [
  'function getAllProducts() view returns (tuple(uint256 productId, uint256 companyId, string name, string description, uint256 price, uint256 stock, string ipfsImageHash, bool isActive)[])',
  'function getProduct(uint256 productId) view returns (tuple(uint256 productId, uint256 companyId, string name, string description, uint256 price, uint256 stock, string ipfsImageHash, bool isActive))',
  'function getCompany(uint256 companyId) view returns (tuple(uint256 companyId, string name, address companyAddress, string taxId, bool isActive))',
  'function addToCart(uint256 productId, uint256 quantity)',
  'function getCart(address customer) view returns (tuple(uint256 productId, uint256 quantity)[])',
  'function clearCart(address customer)',
  'function createInvoice(address customer, uint256 companyId) returns (uint256)',
  'function getCustomerInvoices(address customer) view returns (tuple(uint256 invoiceId, uint256 companyId, address customerAddress, uint256 totalAmount, uint256 timestamp, bool isPaid, bytes32 paymentTxHash, tuple(uint256 productId, uint256 quantity, uint256 unitPrice)[] items)[])',
  'event InvoiceCreated(uint256 indexed invoiceId, address indexed customer, uint256 indexed companyId, uint256 totalAmount)',
] as const
