// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title CompanyLib
 * @dev Librería para gestión de empresas
 */
library CompanyLib {
    struct Company {
        uint256 companyId;
        string name;
        address companyAddress; // Wallet donde recibe pagos
        string taxId;
        bool isActive;
    }

    struct CompanyStorage {
        mapping(uint256 => Company) companies;
        mapping(address => uint256) addressToCompanyId;
        uint256 nextCompanyId;
    }

    /**
     * @dev Registra una nueva empresa
     */
    function registerCompany(
        CompanyStorage storage self,
        address companyAddress,
        string memory name,
        string memory taxId
    ) internal returns (uint256) {
        require(companyAddress != address(0), "CompanyLib: invalid address");
        require(bytes(name).length > 0, "CompanyLib: name required");
        require(self.addressToCompanyId[companyAddress] == 0, "CompanyLib: company already exists");
        
        self.nextCompanyId++;
        uint256 companyId = self.nextCompanyId;
        
        self.companies[companyId] = Company({
            companyId: companyId,
            name: name,
            companyAddress: companyAddress,
            taxId: taxId,
            isActive: true
        });
        
        self.addressToCompanyId[companyAddress] = companyId;
        
        return companyId;
    }

    /**
     * @dev Obtiene una empresa por ID
     */
    function getCompany(CompanyStorage storage self, uint256 companyId)
        internal
        view
        returns (Company memory)
    {
        require(companyId > 0 && companyId <= self.nextCompanyId, "CompanyLib: company not found");
        return self.companies[companyId];
    }

    /**
     * @dev Obtiene el ID de empresa por dirección
     */
    function getCompanyIdByAddress(CompanyStorage storage self, address companyAddress)
        internal
        view
        returns (uint256)
    {
        return self.addressToCompanyId[companyAddress];
    }

    /**
     * @dev Verifica si una dirección tiene una empresa registrada
     */
    function hasCompany(CompanyStorage storage self, address companyAddress)
        internal
        view
        returns (bool)
    {
        return self.addressToCompanyId[companyAddress] > 0;
    }

    /**
     * @dev Actualiza el estado activo de una empresa
     */
    function setActive(CompanyStorage storage self, uint256 companyId, bool isActive) internal {
        require(companyId > 0 && companyId <= self.nextCompanyId, "CompanyLib: company not found");
        self.companies[companyId].isActive = isActive;
    }
}
