// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ECDSA} from "../lib/openzeppelin-contracts/contracts/utils/cryptography/ECDSA.sol";

/**
 * @title DocumentRegistry
 * @author GersonGMR
 * @notice Smart contract para registro y verificación de documentos mediante firma de hashes
 * @dev Cumple con estándares de seguridad de la industria, usa ECDSA de OpenZeppelin
 */
contract DocumentRegistry {
    /// @notice Estructura que almacena la información completa de un documento firmado
    /// @param hash Hash del documento (bytes32)
    /// @param timestamp Timestamp de cuando se realizó la firma (uint256)
    /// @param signer Address que firmó el documento
    /// @param signature Firma del hash realizada por el signer
    struct Document {
        bytes32 hash;
        uint256 timestamp;
        address signer;
        bytes signature;
    }

    /// @notice Mapeo de hash a Document para almacenar las firmas
    /// @dev No se usa mapping redundante hashExists, se verifica si signer != address(0)
    mapping(bytes32 => Document) private documents;

    /// @notice Mapeo de signer a array de hashes firmados por ese address
    /// @dev Permite obtener el historial de firmas de un address específico
    mapping(address => bytes32[]) private signerHashes;

    /// @notice Evento emitido cuando se registra una nueva firma
    /// @param hash Hash del documento firmado
    /// @param signer Address que firmó el documento
    /// @param timestamp Timestamp de la firma
    event DocumentSigned(
        bytes32 indexed hash,
        address indexed signer,
        uint256 timestamp
    );

    /// @notice Evento emitido cuando se verifica una firma
    /// @param hash Hash del documento verificado
    /// @param signer Address del firmante
    /// @param isValid Indica si la verificación fue exitosa
    event DocumentVerified(
        bytes32 indexed hash,
        address indexed signer,
        bool isValid
    );

    /// @notice Error lanzado cuando se intenta firmar un hash que ya existe
    error HashAlreadySigned(bytes32 hash);

    /// @notice Error lanzado cuando se intenta verificar un hash que no existe
    error HashNotFound(bytes32 hash);

    /// @notice Error lanzado cuando la firma proporcionada no es válida
    error InvalidSignature(bytes32 hash, address signer);

    /// @notice Error lanzado cuando se proporciona un hash vacío
    error EmptyHash();

    /**
     * @notice Firma un documento mediante su hash
     * @param documentHash Hash del documento a firmar
     * @param signature Firma del hash realizada por msg.sender
     * @dev Verifica que el hash no esté vacío y que no haya sido firmado previamente
     * @dev Verifica que la firma sea válida antes de almacenarla
     */
    function signDocument(
        bytes32 documentHash,
        bytes calldata signature
    ) external {
        // Validar que el hash no esté vacío (early return)
        if (documentHash == bytes32(0)) {
            revert EmptyHash();
        }

        // Verificar que el hash no haya sido firmado previamente (early return)
        // Se verifica si el hash ya tiene un registro (signer != address(0))
        if (documents[documentHash].signer != address(0)) {
            revert HashAlreadySigned(documentHash);
        }

        // Verificar que la firma sea válida (early return)
        address recoveredSigner = _recoverSigner(documentHash, signature);
        if (recoveredSigner != msg.sender || recoveredSigner == address(0)) {
            revert InvalidSignature(documentHash, msg.sender);
        }

        // Almacenar el documento completo
        uint256 timestamp = block.timestamp;
        documents[documentHash] = Document({
            hash: documentHash,
            timestamp: timestamp,
            signer: msg.sender,
            signature: signature
        });

        // Agregar el hash al historial del signer
        signerHashes[msg.sender].push(documentHash);

        // Emitir evento
        emit DocumentSigned(documentHash, msg.sender, timestamp);
    }

    /**
     * @notice Verifica si un documento fue firmado por un address específico
     * @param documentHash Hash del documento a verificar
     * @param signer Address del firmante a verificar
     * @return isValid True si el documento fue firmado por el signer, false en caso contrario
     * @return timestamp Timestamp de cuando se realizó la firma (0 si no existe)
     */
    function verifyDocument(
        bytes32 documentHash,
        address signer
    ) external view returns (bool isValid, uint256 timestamp) {
        // Cargar el documento desde storage (solo una lectura)
        Document storage doc = documents[documentHash];
        
        // Early return si no existe
        if (doc.signer == address(0)) {
            return (false, 0);
        }

        // Verificar que el signer coincide
        isValid = doc.signer == signer;
        timestamp = doc.timestamp;
        return (isValid, timestamp);
    }

    /**
     * @notice Obtiene la información completa de un documento
     * @param documentHash Hash del documento
     * @return document Estructura Document completa con hash, timestamp, signer y signature
     */
    function getDocument(
        bytes32 documentHash
    ) external view returns (Document memory document) {
        Document storage doc = documents[documentHash];
        if (doc.signer == address(0)) {
            revert HashNotFound(documentHash);
        }
        return doc;
    }

    /**
     * @notice Obtiene la información completa de una firma (compatibilidad hacia atrás)
     * @param documentHash Hash del documento
     * @return timestamp Timestamp de cuando se realizó la firma
     * @return signer Address que firmó el documento
     * @return signature Firma del hash
     * @dev Esta función se mantiene para compatibilidad, pero se recomienda usar getDocument()
     */
    function getSignature(
        bytes32 documentHash
    ) external view returns (uint256 timestamp, address signer, bytes memory signature) {
        Document storage doc = documents[documentHash];
        if (doc.signer == address(0)) {
            revert HashNotFound(documentHash);
        }
        return (doc.timestamp, doc.signer, doc.signature);
    }

    /**
     * @notice Obtiene todos los hashes firmados por un address específico
     * @param signer Address del firmante
     * @return hashes Array de hashes firmados por el signer
     */
    function getSignerHistory(
        address signer
    ) external view returns (bytes32[] memory hashes) {
        return signerHashes[signer];
    }

    /**
     * @notice Obtiene el número total de documentos firmados por un address
     * @param signer Address del firmante
     * @return count Número de documentos firmados
     */
    function getSignerCount(address signer) external view returns (uint256 count) {
        return signerHashes[signer].length;
    }

    /**
     * @notice Verifica internamente la firma y recupera el address del firmante
     * @param hash Hash que fue firmado
     * @param signature Firma a verificar
     * @return recovered Address recuperado de la firma
     * @dev Usa ECDSA de OpenZeppelin para verificar la firma de forma segura
     * @dev Previene signature malleability validando el valor de s
     */
    function _recoverSigner(
        bytes32 hash,
        bytes calldata signature
    ) internal pure returns (address recovered) {
        // Crear el hash del mensaje con prefijo Ethereum usando ECDSA
        bytes32 ethSignedMessageHash = ECDSA.toEthSignedMessageHash(hash);

        // Convertir calldata a memory de forma eficiente usando assembly
        bytes memory signatureMemory;
        assembly {
            let signatureLength := signature.length
            // Asignar memoria para la firma
            signatureMemory := mload(0x40)
            mstore(signatureMemory, signatureLength)
            // Copiar datos de calldata a memory
            calldatacopy(add(signatureMemory, 0x20), signature.offset, signatureLength)
            // Actualizar el puntero de memoria libre
            mstore(0x40, add(signatureMemory, add(0x20, signatureLength)))
        }

        // Recuperar el address del firmante usando ECDSA.tryRecover
        // Esto valida automáticamente la firma y previene malleability
        (address signer, ECDSA.RecoverError error, ) = ECDSA.tryRecover(ethSignedMessageHash, signatureMemory);
        
        // Si hay error o el signer es address(0), retornar address(0)
        if (error != ECDSA.RecoverError.NoError || signer == address(0)) {
            return address(0);
        }
        
        return signer;
    }
}
