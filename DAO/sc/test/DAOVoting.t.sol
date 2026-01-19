// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {DAOVoting} from "../src/DAOVoting.sol";
import {MinimalForwarder} from "../src/MinimalForwarder.sol";

contract DAOVotingTest is Test {
    DAOVoting public dao;
    MinimalForwarder public forwarder;
    
    address public user1 = address(0x1);
    address public user2 = address(0x2);
    address public user3 = address(0x3);
    address public recipient = address(0x4);
    
    function setUp() public {
        forwarder = new MinimalForwarder();
        dao = new DAOVoting(address(forwarder));
        
        // Dar ETH a los usuarios de prueba
        vm.deal(user1, 100 ether);
        vm.deal(user2, 100 ether);
        vm.deal(user3, 100 ether);
    }

    function testFundDao() public {
        vm.prank(user1);
        dao.fundDao{value: 10 ether}();
        
        assertEq(dao.getUserBalance(user1), 10 ether);
        assertEq(dao.totalBalance(), 10 ether);
        assertEq(address(dao).balance, 10 ether);
    }

    function testFundDaoViaReceive() public {
        vm.prank(user1);
        (bool success, ) = address(dao).call{value: 5 ether}("");
        
        assertTrue(success);
        assertEq(dao.getUserBalance(user1), 5 ether);
        assertEq(dao.totalBalance(), 5 ether);
    }

    function testCreateProposalSuccess() public {
        // User1 deposita 10 ETH (100% del balance)
        vm.prank(user1);
        dao.fundDao{value: 10 ether}();
        
        // User1 crea propuesta
        vm.prank(user1);
        dao.createProposal(recipient, 5 ether, block.timestamp + 1 days, "Test proposal");
        
        DAOVoting.Proposal memory proposal = dao.getProposal(1);
        assertEq(proposal.id, 1);
        assertEq(proposal.recipient, recipient);
        assertEq(proposal.amount, 5 ether);
        assertEq(proposal.proposer, user1);
    }

    function testCreateProposalFailsWithInsufficientBalance() public {
        // User1 deposita 10 ETH
        vm.prank(user1);
        dao.fundDao{value: 10 ether}();
        
        // User2 deposita 0.5 ETH (< 10% del total)
        vm.prank(user2);
        dao.fundDao{value: 0.5 ether}();
        
        // User2 intenta crear propuesta (debería fallar)
        vm.prank(user2);
        vm.expectRevert("Insufficient balance to create proposal (need 10% of total)");
        dao.createProposal(recipient, 1 ether, block.timestamp + 1 days, "Test proposal");
    }

    function testCreateProposalFailsWithDAOAsRecipient() public {
        // User1 deposita 10 ETH
        vm.prank(user1);
        dao.fundDao{value: 10 ether}();
        
        // User1 intenta crear propuesta con el DAO como recipient (debería fallar)
        vm.prank(user1);
        vm.expectRevert("Cannot send funds to DAO itself");
        dao.createProposal(address(dao), 1 ether, block.timestamp + 1 days, "Test proposal");
    }

    function testVoteFor() public {
        // Setup: User1 deposita y crea propuesta
        vm.prank(user1);
        dao.fundDao{value: 10 ether}();
        
        vm.prank(user1);
        dao.createProposal(recipient, 5 ether, block.timestamp + 1 days, "Test proposal");
        
        // User1 vota a favor (1 voto por persona)
        vm.prank(user1);
        dao.vote(1, DAOVoting.VoteType.FOR);
        
        DAOVoting.Proposal memory proposal = dao.getProposal(1);
        assertEq(proposal.votesFor, 1);
        assertEq(proposal.votesAgainst, 0);
        assertEq(proposal.votesAbstain, 0);
    }

    function testVoteAgainst() public {
        // Setup
        vm.prank(user1);
        dao.fundDao{value: 10 ether}();
        
        vm.prank(user1);
        dao.createProposal(recipient, 5 ether, block.timestamp + 1 days, "Test proposal");
        
        // User1 vota en contra (1 voto por persona)
        vm.prank(user1);
        dao.vote(1, DAOVoting.VoteType.AGAINST);
        
        DAOVoting.Proposal memory proposal = dao.getProposal(1);
        assertEq(proposal.votesFor, 0);
        assertEq(proposal.votesAgainst, 1);
    }

    function testChangeVote() public {
        // Setup
        vm.prank(user1);
        dao.fundDao{value: 10 ether}();
        
        vm.prank(user1);
        dao.createProposal(recipient, 5 ether, block.timestamp + 1 days, "Test proposal");
        
        // User1 vota a favor (1 voto por persona)
        vm.prank(user1);
        dao.vote(1, DAOVoting.VoteType.FOR);
        
        // User1 cambia su voto a en contra
        vm.prank(user1);
        dao.vote(1, DAOVoting.VoteType.AGAINST);
        
        DAOVoting.Proposal memory proposal = dao.getProposal(1);
        assertEq(proposal.votesFor, 0);
        assertEq(proposal.votesAgainst, 1);
    }

    function testVoteFailsAfterDeadline() public {
        // Setup
        vm.prank(user1);
        dao.fundDao{value: 10 ether}();
        
        uint256 deadline = block.timestamp + 1 days;
        vm.prank(user1);
        dao.createProposal(recipient, 5 ether, deadline, "Test proposal");
        
        // Avanzar tiempo más allá del deadline
        vm.warp(deadline + 1);
        
        // Intentar votar (debería fallar)
        vm.prank(user1);
        vm.expectRevert("Voting period has ended");
        dao.vote(1, DAOVoting.VoteType.FOR);
    }

    function testExecuteProposalSuccess() public {
        // Setup: User1 y User2 depositan
        vm.prank(user1);
        dao.fundDao{value: 10 ether}();
        
        vm.prank(user2);
        dao.fundDao{value: 5 ether}();
        
        // User1 crea propuesta
        uint256 deadline = block.timestamp + 1 days;
        vm.prank(user1);
        dao.createProposal(recipient, 5 ether, deadline, "Test proposal");
        
        // Ambos votan a favor
        vm.prank(user1);
        dao.vote(1, DAOVoting.VoteType.FOR);
        
        vm.prank(user2);
        dao.vote(1, DAOVoting.VoteType.FOR);
        
        // Avanzar tiempo: deadline + delay
        vm.warp(deadline + 1 hours + 1);
        
        // Ejecutar propuesta
        uint256 recipientBalanceBefore = recipient.balance;
        uint256 daoTotalBalanceBefore = dao.totalBalance();
        
        dao.executeProposal(1);
        
        assertEq(recipient.balance, recipientBalanceBefore + 5 ether);
        assertEq(dao.totalBalance(), daoTotalBalanceBefore - 5 ether);
        
        DAOVoting.Proposal memory proposal = dao.getProposal(1);
        assertTrue(proposal.executed);
    }

    function testExecuteProposalFailsIfNotApproved() public {
        // Setup
        vm.prank(user1);
        dao.fundDao{value: 10 ether}();
        
        vm.prank(user2);
        dao.fundDao{value: 15 ether}();
        
        uint256 deadline = block.timestamp + 1 days;
        vm.prank(user1);
        dao.createProposal(recipient, 5 ether, deadline, "Test proposal");
        
        // User1 vota a favor, User2 en contra (más peso)
        vm.prank(user1);
        dao.vote(1, DAOVoting.VoteType.FOR);
        
        vm.prank(user2);
        dao.vote(1, DAOVoting.VoteType.AGAINST);
        
        // Avanzar tiempo
        vm.warp(deadline + 1 hours + 1);
        
        // Intentar ejecutar (debería fallar)
        vm.expectRevert("Proposal not approved");
        dao.executeProposal(1);
    }

    function testExecuteProposalFailsBeforeDelay() public {
        // Setup
        vm.prank(user1);
        dao.fundDao{value: 10 ether}();
        
        uint256 deadline = block.timestamp + 1 days;
        vm.prank(user1);
        dao.createProposal(recipient, 5 ether, deadline, "Test proposal");
        
        vm.prank(user1);
        dao.vote(1, DAOVoting.VoteType.FOR);
        
        // Avanzar solo hasta deadline (sin delay)
        vm.warp(deadline + 1);
        
        // Intentar ejecutar (debería fallar)
        vm.expectRevert("Execution delay period not passed");
        dao.executeProposal(1);
    }

    function testCannotExecuteTwice() public {
        // Setup
        vm.prank(user1);
        dao.fundDao{value: 10 ether}();
        
        uint256 deadline = block.timestamp + 1 days;
        vm.prank(user1);
        dao.createProposal(recipient, 5 ether, deadline, "Test proposal");
        
        vm.prank(user1);
        dao.vote(1, DAOVoting.VoteType.FOR);
        
        vm.warp(deadline + 1 hours + 1);
        
        // Primera ejecución
        dao.executeProposal(1);
        
        // Intentar ejecutar de nuevo
        vm.expectRevert("Proposal already executed");
        dao.executeProposal(1);
    }

    function testIsProposalApproved() public {
        vm.prank(user1);
        dao.fundDao{value: 10 ether}();
        
        vm.prank(user2);
        dao.fundDao{value: 5 ether}();
        
        // Use user3 (already declared in contract setup)
        vm.deal(user3, 100 ether);
        vm.prank(user3);
        dao.fundDao{value: 5 ether}();
        
        vm.prank(user1);
        dao.createProposal(recipient, 5 ether, block.timestamp + 1 days, "Test proposal");
        
        // Sin votos todavía
        assertFalse(dao.isProposalApproved(1));
        
        // User1 vota a favor (1 voto)
        vm.prank(user1);
        dao.vote(1, DAOVoting.VoteType.FOR);
        
        assertTrue(dao.isProposalApproved(1));
        
        // User2 vota en contra (1 voto) - ahora es empate 1-1
        vm.prank(user2);
        dao.vote(1, DAOVoting.VoteType.AGAINST);
        
        // Empate - no aprobada (necesita votesFor > votesAgainst)
        assertFalse(dao.isProposalApproved(1));
        
        // User3 vota a favor (2-1)
        vm.prank(user3);
        dao.vote(1, DAOVoting.VoteType.FOR);
        
        // Ahora sí está aprobada (2 > 1)
        assertTrue(dao.isProposalApproved(1));
    }

    function testIsProposalExecutable() public {
        vm.prank(user1);
        dao.fundDao{value: 10 ether}();
        
        uint256 deadline = block.timestamp + 1 days;
        vm.prank(user1);
        dao.createProposal(recipient, 5 ether, deadline, "Test proposal");
        
        vm.prank(user1);
        dao.vote(1, DAOVoting.VoteType.FOR);
        
        // Antes del deadline
        assertFalse(dao.isProposalExecutable(1));
        
        // Después del deadline pero antes del delay
        vm.warp(deadline + 1);
        assertFalse(dao.isProposalExecutable(1));
        
        // Después del delay
        vm.warp(deadline + 1 hours + 1);
        assertTrue(dao.isProposalExecutable(1));
        
        // Ejecutar
        dao.executeProposal(1);
        
        // Ya no es ejecutable
        assertFalse(dao.isProposalExecutable(1));
    }
}
