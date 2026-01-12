// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test} from "forge-std/Test.sol";
import {DocumentRegistry} from "../src/DocumentRegistry.sol";

/**
 * @title DocumentRegistryTest
 * @notice Tests completos para DocumentRegistry con cobertura >80%
 */
contract DocumentRegistryTest is Test {
    DocumentRegistry public registry;
    address public alice;
    address public bob;
    uint256 private alicePrivateKey;
    uint256 private bobPrivateKey;

    /// @notice Eventos para testing
    event DocumentSigned(bytes32 indexed hash, address indexed signer, uint256 timestamp);
    event DocumentVerified(bytes32 indexed hash, address indexed signer, bool isValid);

    function setUp() public {
        registry = new DocumentRegistry();
        
        // Crear cuentas de prueba con claves privadas conocidas
        alicePrivateKey = 0xa11ce;
        bobPrivateKey = 0xb0b;
        alice = vm.addr(alicePrivateKey);
        bob = vm.addr(bobPrivateKey);
        
        // Dar fondos a las cuentas
        vm.deal(alice, 10 ether);
        vm.deal(bob, 10 ether);
    }

    /// @notice Helper para crear una firma válida
    /// @dev vm.sign NO agrega el prefijo Ethereum Signed Message automáticamente
    /// Por lo tanto, debemos pasar el hash con el prefijo ya aplicado
    function _signHash(bytes32 hash, uint256 privateKey) internal pure returns (bytes memory) {
        // Crear el hash con prefijo Ethereum Signed Message
        bytes32 ethSignedMessageHash = keccak256(
            abi.encodePacked("\x19Ethereum Signed Message:\n32", hash)
        );
        // Firmar el hash con prefijo
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(privateKey, ethSignedMessageHash);
        return abi.encodePacked(r, s, v);
    }

    /// @notice Helper para crear hash con prefijo Ethereum (deprecated, usar _signHash directamente)
    /// @dev Mantenido para compatibilidad, pero _signHash ya maneja el prefijo
    function _getEthSignedMessageHash(bytes32 hash) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", hash));
    }

    /// @notice Test: Firmar un documento exitosamente
    function test_SignDocument_Success() public {
        bytes32 documentHash = keccak256("test document");
        bytes memory signature = _signHash(documentHash, alicePrivateKey);

        vm.prank(alice);
        vm.expectEmit(true, true, false, true);
        emit DocumentSigned(documentHash, alice, block.timestamp);
        registry.signDocument(documentHash, signature);

        // Verificar que se almacenó correctamente
        (bool isValid, uint256 timestamp) = registry.verifyDocument(documentHash, alice);
        assertTrue(isValid);
        assertGt(timestamp, 0);
    }

    /// @notice Test: Error al intentar firmar un hash vacío
    function test_SignDocument_EmptyHash() public {
        bytes32 emptyHash = bytes32(0);
        bytes memory signature = _signHash(emptyHash, alicePrivateKey);

        vm.prank(alice);
        vm.expectRevert(DocumentRegistry.EmptyHash.selector);
        registry.signDocument(emptyHash, signature);
    }

    /// @notice Test: Error al intentar firmar un hash ya firmado
    function test_SignDocument_HashAlreadySigned() public {
        bytes32 documentHash = keccak256("test document");
        bytes memory signature = _signHash(documentHash, alicePrivateKey);

        vm.prank(alice);
        registry.signDocument(documentHash, signature);

        // Intentar firmar el mismo hash de nuevo
        vm.prank(alice);
        vm.expectRevert(
            abi.encodeWithSelector(DocumentRegistry.HashAlreadySigned.selector, documentHash)
        );
        registry.signDocument(documentHash, signature);
    }

    /// @notice Test: Error al firmar con una firma inválida
    function test_SignDocument_InvalidSignature() public {
        bytes32 documentHash = keccak256("test document");
        // Crear firma con una clave privada diferente
        bytes memory wrongSignature = _signHash(documentHash, bobPrivateKey);

        vm.prank(alice);
        vm.expectRevert(
            abi.encodeWithSelector(DocumentRegistry.InvalidSignature.selector, documentHash, alice)
        );
        registry.signDocument(documentHash, wrongSignature);
    }

    /// @notice Test: Verificar documento firmado correctamente
    function test_VerifyDocument_Success() public {
        bytes32 documentHash = keccak256("test document");
        bytes memory signature = _signHash(documentHash, alicePrivateKey);

        vm.prank(alice);
        registry.signDocument(documentHash, signature);

        // Verificar con el signer correcto
        (bool isValid, uint256 timestamp) = registry.verifyDocument(documentHash, alice);
        assertTrue(isValid);
        assertGt(timestamp, 0);

        // Verificar con un signer incorrecto
        (bool isValidBob, ) = registry.verifyDocument(documentHash, bob);
        assertFalse(isValidBob);
    }

    /// @notice Test: Verificar documento no existente
    function test_VerifyDocument_NotFound() public view {
        bytes32 documentHash = keccak256("non-existent document");
        
        (bool isValid, uint256 timestamp) = registry.verifyDocument(documentHash, alice);
        assertFalse(isValid);
        assertEq(timestamp, 0);
    }

    /// @notice Test: Obtener información completa de una firma
    function test_GetSignature_Success() public {
        bytes32 documentHash = keccak256("test document");
        bytes memory signature = _signHash(documentHash, alicePrivateKey);

        vm.prank(alice);
        registry.signDocument(documentHash, signature);

        (uint256 timestamp, address signer, bytes memory sig) = registry.getSignature(documentHash);
        assertEq(signer, alice);
        assertEq(timestamp, block.timestamp);
        assertEq(sig.length, signature.length);
    }

    /// @notice Test: Error al obtener firma de hash no existente
    function test_GetSignature_NotFound() public {
        bytes32 documentHash = keccak256("non-existent document");
        
        vm.expectRevert(
            abi.encodeWithSelector(DocumentRegistry.HashNotFound.selector, documentHash)
        );
        registry.getSignature(documentHash);
    }

    /// @notice Test: Obtener historial de firmas de un signer
    function test_GetSignerHistory_Success() public {
        bytes32 hash1 = keccak256("document 1");
        bytes32 hash2 = keccak256("document 2");
        bytes32 hash3 = keccak256("document 3");

        bytes memory sig1 = _signHash(hash1, alicePrivateKey);
        bytes memory sig2 = _signHash(hash2, alicePrivateKey);
        bytes memory sig3 = _signHash(hash3, bobPrivateKey);

        vm.startPrank(alice);
        registry.signDocument(hash1, sig1);
        registry.signDocument(hash2, sig2);
        vm.stopPrank();

        vm.prank(bob);
        registry.signDocument(hash3, sig3);

        // Verificar historial de Alice
        bytes32[] memory aliceHistory = registry.getSignerHistory(alice);
        assertEq(aliceHistory.length, 2);
        assertEq(aliceHistory[0], hash1);
        assertEq(aliceHistory[1], hash2);

        // Verificar historial de Bob
        bytes32[] memory bobHistory = registry.getSignerHistory(bob);
        assertEq(bobHistory.length, 1);
        assertEq(bobHistory[0], hash3);
    }

    /// @notice Test: Obtener conteo de documentos firmados
    function test_GetSignerCount_Success() public {
        bytes32 hash1 = keccak256("document 1");
        bytes32 hash2 = keccak256("document 2");

        bytes memory sig1 = _signHash(hash1, alicePrivateKey);
        bytes memory sig2 = _signHash(hash2, alicePrivateKey);

        assertEq(registry.getSignerCount(alice), 0);

        vm.startPrank(alice);
        registry.signDocument(hash1, sig1);
        assertEq(registry.getSignerCount(alice), 1);
        
        registry.signDocument(hash2, sig2);
        assertEq(registry.getSignerCount(alice), 2);
        vm.stopPrank();
    }

    /// @notice Test: Múltiples signers pueden firmar diferentes documentos
    function test_MultipleSigners() public {
        bytes32 hash1 = keccak256("alice document");
        bytes32 hash2 = keccak256("bob document");

        bytes memory sig1 = _signHash(hash1, alicePrivateKey);
        bytes memory sig2 = _signHash(hash2, bobPrivateKey);

        vm.prank(alice);
        registry.signDocument(hash1, sig1);

        vm.prank(bob);
        registry.signDocument(hash2, sig2);

        // Verificar que cada uno puede verificar su propio documento
        (bool isValidAlice, ) = registry.verifyDocument(hash1, alice);
        assertTrue(isValidAlice);

        (bool isValidBob, ) = registry.verifyDocument(hash2, bob);
        assertTrue(isValidBob);

        // Verificar que no pueden verificar el documento del otro
        (bool isValidAliceBob, ) = registry.verifyDocument(hash2, alice);
        assertFalse(isValidAliceBob);

        (bool isValidBobAlice, ) = registry.verifyDocument(hash1, bob);
        assertFalse(isValidBobAlice);
    }

    /// @notice Test: Verificar que el timestamp se almacena correctamente
    function test_Timestamp_StoredCorrectly() public {
        bytes32 documentHash = keccak256("test document");
        bytes memory signature = _signHash(documentHash, alicePrivateKey);

        uint256 beforeTimestamp = block.timestamp;
        vm.prank(alice);
        registry.signDocument(documentHash, signature);
        uint256 afterTimestamp = block.timestamp;

        (uint256 timestamp, , ) = registry.getSignature(documentHash);
        assertGe(timestamp, beforeTimestamp);
        assertLe(timestamp, afterTimestamp);
    }

    /// @notice Test: Verificar que la firma se almacena correctamente
    function test_Signature_StoredCorrectly() public {
        bytes32 documentHash = keccak256("test document");
        bytes memory originalSignature = _signHash(documentHash, alicePrivateKey);

        vm.prank(alice);
        registry.signDocument(documentHash, originalSignature);

        (, , bytes memory sig) = registry.getSignature(documentHash);
        assertEq(sig.length, originalSignature.length);
        // Comparar bytes de la firma
        assertTrue(keccak256(sig) == keccak256(originalSignature));
    }

    /// @notice Test: Verificar historial vacío para signer sin documentos
    function test_GetSignerHistory_Empty() public view {
        bytes32[] memory history = registry.getSignerHistory(alice);
        assertEq(history.length, 0);
    }

    /// @notice Test: Error al firmar con firma de longitud incorrecta
    function test_SignDocument_InvalidSignatureLength() public {
        bytes32 documentHash = keccak256("test document");
        
        // Crear firma con longitud incorrecta (no 65 bytes)
        bytes memory invalidSignature = new bytes(64); // 64 bytes en lugar de 65
        
        vm.prank(alice);
        vm.expectRevert(
            abi.encodeWithSelector(DocumentRegistry.InvalidSignature.selector, documentHash, alice)
        );
        registry.signDocument(documentHash, invalidSignature);
    }

    /// @notice Test: Error al firmar con firma con v inválido (no 27 ni 28)
    function test_SignDocument_InvalidV() public {
        bytes32 documentHash = keccak256("test document");
        bytes memory validSignature = _signHash(documentHash, alicePrivateKey);
        
        // Modificar v para que sea inválido (no 27 ni 28)
        // Extraer r, s, v
        bytes32 r;
        bytes32 s;
        uint8 v;
        assembly {
            r := mload(add(validSignature, 32))
            s := mload(add(validSignature, 64))
            v := byte(0, mload(add(validSignature, 96)))
        }
        
        // Cambiar v a un valor inválido (por ejemplo, 29)
        uint8 invalidV = 29;
        bytes memory invalidSignature = abi.encodePacked(r, s, invalidV);
        
        vm.prank(alice);
        vm.expectRevert(
            abi.encodeWithSelector(DocumentRegistry.InvalidSignature.selector, documentHash, alice)
        );
        registry.signDocument(documentHash, invalidSignature);
    }

    /// @notice Test: Verificar múltiples documentos con el mismo signer
    function test_MultipleDocumentsSameSigner() public {
        bytes32 hash1 = keccak256("document 1");
        bytes32 hash2 = keccak256("document 2");
        bytes32 hash3 = keccak256("document 3");
        bytes32 hash4 = keccak256("document 4");
        bytes32 hash5 = keccak256("document 5");

        bytes memory sig1 = _signHash(hash1, alicePrivateKey);
        bytes memory sig2 = _signHash(hash2, alicePrivateKey);
        bytes memory sig3 = _signHash(hash3, alicePrivateKey);
        bytes memory sig4 = _signHash(hash4, alicePrivateKey);
        bytes memory sig5 = _signHash(hash5, alicePrivateKey);

        vm.startPrank(alice);
        registry.signDocument(hash1, sig1);
        registry.signDocument(hash2, sig2);
        registry.signDocument(hash3, sig3);
        registry.signDocument(hash4, sig4);
        registry.signDocument(hash5, sig5);
        vm.stopPrank();

        // Verificar que todos fueron firmados
        assertEq(registry.getSignerCount(alice), 5);
        
        bytes32[] memory history = registry.getSignerHistory(alice);
        assertEq(history.length, 5);
        
        // Verificar cada uno
        (bool isValid1, ) = registry.verifyDocument(hash1, alice);
        (bool isValid2, ) = registry.verifyDocument(hash2, alice);
        (bool isValid3, ) = registry.verifyDocument(hash3, alice);
        (bool isValid4, ) = registry.verifyDocument(hash4, alice);
        (bool isValid5, ) = registry.verifyDocument(hash5, alice);
        
        assertTrue(isValid1);
        assertTrue(isValid2);
        assertTrue(isValid3);
        assertTrue(isValid4);
        assertTrue(isValid5);
    }

    /// @notice Test: Verificar que getSignature retorna datos correctos para múltiples documentos
    function test_GetSignature_MultipleDocuments() public {
        bytes32 hash1 = keccak256("document 1");
        bytes32 hash2 = keccak256("document 2");

        bytes memory sig1 = _signHash(hash1, alicePrivateKey);
        bytes memory sig2 = _signHash(hash2, bobPrivateKey);

        vm.prank(alice);
        registry.signDocument(hash1, sig1);

        // Avanzar el tiempo para que el segundo documento tenga un timestamp diferente
        vm.warp(block.timestamp + 1);

        vm.prank(bob);
        registry.signDocument(hash2, sig2);

        (uint256 timestamp1, address signer1, ) = registry.getSignature(hash1);
        (uint256 timestamp2, address signer2, ) = registry.getSignature(hash2);

        assertEq(signer1, alice);
        assertGt(timestamp1, 0);

        assertEq(signer2, bob);
        assertGt(timestamp2, 0);
        assertGe(timestamp2, timestamp1); // El segundo debería ser igual o más reciente
    }

}

