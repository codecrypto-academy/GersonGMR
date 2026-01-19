// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {MinimalForwarder} from "../src/MinimalForwarder.sol";
import {DAOVoting} from "../src/DAOVoting.sol";

contract MinimalForwarderTest is Test {
    MinimalForwarder public forwarder;
    DAOVoting public dao;
    
    uint256 internal userPrivateKey = 0xA11CE;
    address internal user;
    address internal relayer = address(0x999);
    address internal recipient = address(0x4);
    
    function setUp() public {
        user = vm.addr(userPrivateKey);
        
        forwarder = new MinimalForwarder();
        dao = new DAOVoting(address(forwarder));
        
        // Dar ETH a los usuarios
        vm.deal(user, 100 ether);
        vm.deal(relayer, 10 ether);
    }

    function testGetNonce() public view {
        assertEq(forwarder.getNonce(user), 0);
    }

    function testVerifyValidSignature() public {
        // User deposita fondos primero
        vm.prank(user);
        dao.fundDao{value: 10 ether}();
        
        // Crear propuesta
        vm.prank(user);
        dao.createProposal(recipient, 5 ether, block.timestamp + 1 days, "Test proposal");
        
        // Preparar meta-transacción para votar
        bytes memory data = abi.encodeWithSelector(
            dao.vote.selector,
            1,
            DAOVoting.VoteType.FOR
        );
        
        MinimalForwarder.ForwardRequest memory req = MinimalForwarder.ForwardRequest({
            from: user,
            to: address(dao),
            value: 0,
            gas: 100000,
            nonce: forwarder.getNonce(user),
            data: data
        });
        
        bytes32 digest = _getTypedDataHash(req);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(userPrivateKey, digest);
        bytes memory signature = abi.encodePacked(r, s, v);
        
        assertTrue(forwarder.verify(req, signature));
    }

    function testVerifyInvalidSignature() public view {
        bytes memory data = abi.encodeWithSelector(
            dao.vote.selector,
            1,
            DAOVoting.VoteType.FOR
        );
        
        MinimalForwarder.ForwardRequest memory req = MinimalForwarder.ForwardRequest({
            from: user,
            to: address(dao),
            value: 0,
            gas: 100000,
            nonce: forwarder.getNonce(user),
            data: data
        });
        
        // Firma firmada por otra dirección (clave privada diferente)
        uint256 wrongPrivateKey = 0xB0B;
        bytes32 digest = _getTypedDataHash(req);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(wrongPrivateKey, digest);
        bytes memory wrongSignature = abi.encodePacked(r, s, v);
        
        // La verificación debe devolver false porque la firma es de otra dirección
        assertFalse(forwarder.verify(req, wrongSignature));
    }

    function testExecuteMetaTransaction() public {
        // User deposita fondos
        vm.prank(user);
        dao.fundDao{value: 10 ether}();
        
        // User crea propuesta
        vm.prank(user);
        dao.createProposal(recipient, 5 ether, block.timestamp + 1 days, "Test proposal");
        
        // Preparar meta-transacción para votar
        bytes memory data = abi.encodeWithSelector(
            dao.vote.selector,
            1,
            DAOVoting.VoteType.FOR
        );
        
        MinimalForwarder.ForwardRequest memory req = MinimalForwarder.ForwardRequest({
            from: user,
            to: address(dao),
            value: 0,
            gas: 200000,
            nonce: forwarder.getNonce(user),
            data: data
        });
        
        bytes32 digest = _getTypedDataHash(req);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(userPrivateKey, digest);
        bytes memory signature = abi.encodePacked(r, s, v);
        
        // Relayer ejecuta la meta-transacción
        vm.prank(relayer);
        (bool success, ) = forwarder.execute(req, signature);
        
        assertTrue(success);
        
        // Verificar que el voto se registró (1 voto por persona)
        DAOVoting.Proposal memory proposal = dao.getProposal(1);
        assertEq(proposal.votesFor, 1);
        
        // Verificar que el nonce aumentó
        assertEq(forwarder.getNonce(user), 1);
    }

    function testExecuteFailsWithInvalidNonce() public {
        vm.prank(user);
        dao.fundDao{value: 10 ether}();
        
        vm.prank(user);
        dao.createProposal(recipient, 5 ether, block.timestamp + 1 days, "Test proposal");
        
        bytes memory data = abi.encodeWithSelector(
            dao.vote.selector,
            1,
            DAOVoting.VoteType.FOR
        );
        
        // Usar nonce incorrecto
        MinimalForwarder.ForwardRequest memory req = MinimalForwarder.ForwardRequest({
            from: user,
            to: address(dao),
            value: 0,
            gas: 200000,
            nonce: 999, // Nonce incorrecto
            data: data
        });
        
        bytes32 digest = _getTypedDataHash(req);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(userPrivateKey, digest);
        bytes memory signature = abi.encodePacked(r, s, v);
        
        // Debería fallar
        vm.prank(relayer);
        vm.expectRevert("MinimalForwarder: signature does not match request");
        forwarder.execute(req, signature);
    }

    function testNonceIncrementsAfterExecution() public {
        vm.prank(user);
        dao.fundDao{value: 10 ether}();
        
        vm.prank(user);
        dao.createProposal(recipient, 5 ether, block.timestamp + 1 days, "Test proposal");
        
        assertEq(forwarder.getNonce(user), 0);
        
        // Primera meta-transacción
        _executeVote(0, DAOVoting.VoteType.FOR);
        assertEq(forwarder.getNonce(user), 1);
        
        // Segunda meta-transacción (cambiar voto)
        _executeVote(1, DAOVoting.VoteType.AGAINST);
        assertEq(forwarder.getNonce(user), 2);
    }

    // Helper function
    function _executeVote(uint256 nonce, DAOVoting.VoteType voteType) internal {
        bytes memory data = abi.encodeWithSelector(
            dao.vote.selector,
            1,
            voteType
        );
        
        MinimalForwarder.ForwardRequest memory req = MinimalForwarder.ForwardRequest({
            from: user,
            to: address(dao),
            value: 0,
            gas: 200000,
            nonce: nonce,
            data: data
        });
        
        bytes32 digest = _getTypedDataHash(req);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(userPrivateKey, digest);
        bytes memory signature = abi.encodePacked(r, s, v);
        
        vm.prank(relayer);
        forwarder.execute(req, signature);
    }

    function _getTypedDataHash(MinimalForwarder.ForwardRequest memory req) internal view returns (bytes32) {
        bytes32 structHash = keccak256(
            abi.encode(
                keccak256("ForwardRequest(address from,address to,uint256 value,uint256 gas,uint256 nonce,bytes data)"),
                req.from,
                req.to,
                req.value,
                req.gas,
                req.nonce,
                keccak256(req.data)
            )
        );
        
        return keccak256(
            abi.encodePacked(
                "\x19\x01",
                forwarder.DOMAIN_SEPARATOR(),
                structHash
            )
        );
    }
}
