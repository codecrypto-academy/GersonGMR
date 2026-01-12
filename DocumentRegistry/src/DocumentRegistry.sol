// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title DocumentRegistry
 * @author GersonGMR
 * @notice Smart contract para registro y verificación de documentos mediante firma de hashes
 * @dev Cumple con estándares de seguridad de la industria, sin campos redundantes
 */
contract DocumentRegistry {
    /// @notice Estructura que almacena la información de una firma de documento
    /// @param hash Hash del documento firmado
    /// @param timestamp Timestamp de cuando se realizó la firma
    /// @param signature Firma del hash realizada por el signer
    /// @param signer Address que firmó el documento
    struct DocumentSignature {
        bytes32 hash;
        uint256 timestamp;
        bytes signature;
        address signer;
    }

    /// @notice Mapeo de hash a DocumentSignature para almacenar las firmas
    /// @dev No se usa mapping redundante hashExists, se verifica si hash != bytes32(0)
    mapping(bytes32 => DocumentSignature) private signatures;

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
        bytes memory signature
    ) external {
        // Validar que el hash no esté vacío
        if (documentHash == bytes32(0)) {
            revert EmptyHash();
        }

        // Verificar que el hash no haya sido firmado previamente
        // Se verifica si el hash ya tiene un registro (timestamp != 0)
        if (signatures[documentHash].timestamp != 0) {
            revert HashAlreadySigned(documentHash);
        }

        // Verificar que la firma sea válida
        address recoveredSigner = _recoverSigner(documentHash, signature);
        if (recoveredSigner != msg.sender) {
            revert InvalidSignature(documentHash, msg.sender);
        }

        // Almacenar la firma
        uint256 timestamp = block.timestamp;
        signatures[documentHash] = DocumentSignature({
            hash: documentHash,
            timestamp: timestamp,
            signature: signature,
            signer: msg.sender
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
        // Verificar que el hash existe
        DocumentSignature memory sig = signatures[documentHash];
        if (sig.timestamp == 0) {
            return (false, 0);
        }

        // Verificar que el signer coincide
        isValid = sig.signer == signer;
        timestamp = sig.timestamp;

        return (isValid, timestamp);
    }

    /**
     * @notice Obtiene la información completa de una firma
     * @param documentHash Hash del documento
     * @return signature Estructura DocumentSignature con toda la información
     */
    function getSignature(
        bytes32 documentHash
    ) external view returns (DocumentSignature memory signature) {
        DocumentSignature memory sig = signatures[documentHash];
        if (sig.timestamp == 0) {
            revert HashNotFound(documentHash);
        }
        return sig;
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
     * @dev Usa ecrecover para verificar la firma ECDSA
     */
    function _recoverSigner(
        bytes32 hash,
        bytes memory signature
    ) internal pure returns (address recovered) {
        // Verificar que la firma tenga la longitud correcta (65 bytes)
        if (signature.length != 65) {
            return address(0);
        }

        bytes32 r;
        bytes32 s;
        uint8 v;

        // Extraer r, s, v de la firma
        assembly {
            r := mload(add(signature, 32))
            s := mload(add(signature, 64))
            v := byte(0, mload(add(signature, 96)))
        }

        // Ajustar v si es necesario (27 o 28)
        if (v < 27) {
            v += 27;
        }

        // Verificar que v sea 27 o 28
        if (v != 27 && v != 28) {
            return address(0);
        }

        // Crear el hash del mensaje con prefijo Ethereum
        bytes32 ethSignedMessageHash = keccak256(
            abi.encodePacked("\x19Ethereum Signed Message:\n32", hash)
        );

        // Recuperar el address del firmante
        recovered = ecrecover(ethSignedMessageHash, v, r, s);
        return recovered;
    }
}

