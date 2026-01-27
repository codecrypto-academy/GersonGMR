export const EcommerceABI = [
  'function registerCompany(string name, string taxId) returns (uint256)',
  'function getCompany(uint256 companyId) view returns (tuple(uint256 companyId, string name, address companyAddress, string taxId, bool isActive))',
  'function getCompanyIdByAddress(address) view returns (uint256)',
  'function addProduct(uint256 companyId, string name, string description, uint256 price, uint256 stock, string ipfsImageHash) returns (uint256)',
  'function getProduct(uint256 productId) view returns (tuple(uint256 productId, uint256 companyId, string name, string description, uint256 price, uint256 stock, string ipfsImageHash, bool isActive))',
  'function getCompanyProducts(uint256 companyId) view returns (tuple(uint256 productId, uint256 companyId, string name, string description, uint256 price, uint256 stock, string ipfsImageHash, bool isActive)[])',
  'function updateProduct(uint256 productId, uint256 newPrice, uint256 newStock)',
  'function setProductActive(uint256 productId, bool isActive)',
  'function getCompanyInvoices(uint256 companyId) view returns (tuple(uint256 invoiceId, uint256 companyId, address customerAddress, uint256 totalAmount, uint256 timestamp, bool isPaid, bytes32 paymentTxHash, tuple(uint256 productId, uint256 quantity, uint256 unitPrice)[] items)[])',
] as const
