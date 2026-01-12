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
    function _signHash(bytes32 hash, uint256 privateKey) internal pure returns (bytes memory) {
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(privateKey, hash);
        return abi.encodePacked(r, s, v);
    }

    /// @notice Helper para crear hash con prefijo Ethereum
    function _getEthSignedMessageHash(bytes32 hash) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", hash));
    }

    /// @notice Test: Firmar un documento exitosamente
    function test_SignDocument_Success() public {
        bytes32 documentHash = keccak256("test document");
        bytes memory signature = _signHash(_getEthSignedMessageHash(documentHash), alicePrivateKey);

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
        bytes memory signature = _signHash(_getEthSignedMessageHash(emptyHash), alicePrivateKey);

        vm.prank(alice);
        vm.expectRevert(DocumentRegistry.EmptyHash.selector);
        registry.signDocument(emptyHash, signature);
    }

    /// @notice Test: Error al intentar firmar un hash ya firmado
    function test_SignDocument_HashAlreadySigned() public {
        bytes32 documentHash = keccak256("test document");
        bytes memory signature = _signHash(_getEthSignedMessageHash(documentHash), alicePrivateKey);

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
        bytes memory wrongSignature = _signHash(_getEthSignedMessageHash(documentHash), bobPrivateKey);

        vm.prank(alice);
        vm.expectRevert(
            abi.encodeWithSelector(DocumentRegistry.InvalidSignature.selector, documentHash, alice)
        );
        registry.signDocument(documentHash, wrongSignature);
    }

    /// @notice Test: Verificar documento firmado correctamente
    function test_VerifyDocument_Success() public {
        bytes32 documentHash = keccak256("test document");
        bytes memory signature = _signHash(_getEthSignedMessageHash(documentHash), alicePrivateKey);

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
        bytes memory signature = _signHash(_getEthSignedMessageHash(documentHash), alicePrivateKey);

        vm.prank(alice);
        registry.signDocument(documentHash, signature);

        DocumentRegistry.DocumentSignature memory sig = registry.getSignature(documentHash);
        assertEq(sig.hash, documentHash);
        assertEq(sig.signer, alice);
        assertEq(sig.timestamp, block.timestamp);
        assertEq(sig.signature.length, signature.length);
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

        bytes memory sig1 = _signHash(_getEthSignedMessageHash(hash1), alicePrivateKey);
        bytes memory sig2 = _signHash(_getEthSignedMessageHash(hash2), alicePrivateKey);
        bytes memory sig3 = _signHash(_getEthSignedMessageHash(hash3), bobPrivateKey);

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

        bytes memory sig1 = _signHash(_getEthSignedMessageHash(hash1), alicePrivateKey);
        bytes memory sig2 = _signHash(_getEthSignedMessageHash(hash2), alicePrivateKey);

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

        bytes memory sig1 = _signHash(_getEthSignedMessageHash(hash1), alicePrivateKey);
        bytes memory sig2 = _signHash(_getEthSignedMessageHash(hash2), bobPrivateKey);

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
        bytes memory signature = _signHash(_getEthSignedMessageHash(documentHash), alicePrivateKey);

        uint256 beforeTimestamp = block.timestamp;
        vm.prank(alice);
        registry.signDocument(documentHash, signature);
        uint256 afterTimestamp = block.timestamp;

        DocumentRegistry.DocumentSignature memory sig = registry.getSignature(documentHash);
        assertGe(sig.timestamp, beforeTimestamp);
        assertLe(sig.timestamp, afterTimestamp);
    }

    /// @notice Test: Verificar que la firma se almacena correctamente
    function test_Signature_StoredCorrectly() public {
        bytes32 documentHash = keccak256("test document");
        bytes memory originalSignature = _signHash(_getEthSignedMessageHash(documentHash), alicePrivateKey);

        vm.prank(alice);
        registry.signDocument(documentHash, originalSignature);

        DocumentRegistry.DocumentSignature memory sig = registry.getSignature(documentHash);
        assertEq(sig.signature.length, originalSignature.length);
        // Comparar bytes de la firma
        assertTrue(keccak256(sig.signature) == keccak256(originalSignature));
    }

    /// @notice Test: Verificar historial vacío para signer sin documentos
    function test_GetSignerHistory_Empty() public view {
        bytes32[] memory history = registry.getSignerHistory(alice);
        assertEq(history.length, 0);
    }
}

