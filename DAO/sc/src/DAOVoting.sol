// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC2771Context} from "@openzeppelin/contracts/metatx/ERC2771Context.sol";

/**
 * @title DAOVoting
 * @dev Contrato de DAO con sistema de votación y meta-transacciones
 */
contract DAOVoting is ERC2771Context {
    enum VoteType {
        ABSTAIN,
        FOR,
        AGAINST
    }

    struct Proposal {
        uint256 id;
        address recipient;
        uint256 amount;
        uint256 deadline;
        uint256 votesFor;
        uint256 votesAgainst;
        uint256 votesAbstain;
        bool executed;
        address proposer;
        string description;
    }

    // Estado del DAO
    uint256 public proposalCount;
    uint256 public totalBalance;
    mapping(uint256 => Proposal) public proposals;
    mapping(address => uint256) public userBalances;
    mapping(uint256 => mapping(address => bool)) public hasVoted;
    mapping(uint256 => mapping(address => VoteType)) public userVotes;

    // Configuración
    uint256 public constant MIN_BALANCE_PERCENTAGE = 10; // 10% del balance total
    uint256 public constant EXECUTION_DELAY = 1 hours; // Período de seguridad

    // Eventos
    event FundsDeposited(address indexed user, uint256 amount);
    event ProposalCreated(
        uint256 indexed proposalId,
        address indexed proposer,
        address recipient,
        uint256 amount,
        uint256 deadline,
        string description
    );
    event VoteCast(uint256 indexed proposalId, address indexed voter, VoteType voteType);
    event ProposalExecuted(uint256 indexed proposalId, address recipient, uint256 amount);

    constructor(address trustedForwarder) ERC2771Context(trustedForwarder) {}

    /**
     * @dev Permite recibir ETH directamente
     */
    receive() external payable {
        fundDao();
    }

    /**
     * @dev Función para depositar fondos en el DAO
     */
    function fundDao() public payable {
        require(msg.value > 0, "Must send ETH");
        
        userBalances[_msgSender()] += msg.value;
        totalBalance += msg.value;
        
        emit FundsDeposited(_msgSender(), msg.value);
    }

    /**
     * @dev Crea una nueva propuesta
     * @param recipient Dirección que recibirá los fondos
     * @param amount Cantidad de ETH a transferir
     * @param deadline Timestamp límite para votar
     * @param description Descripción de la propuesta
     */
    function createProposal(address recipient, uint256 amount, uint256 deadline, string calldata description) external {
        require(recipient != address(0), "Invalid recipient");
        require(amount > 0, "Amount must be greater than 0");
        require(amount <= address(this).balance, "Insufficient DAO balance");
        require(deadline > block.timestamp, "Deadline must be in the future");
        require(bytes(description).length > 0, "Description cannot be empty");
        
        // Verificar que el usuario tenga al menos 10% del balance total
        require(
            userBalances[_msgSender()] * 100 >= totalBalance * MIN_BALANCE_PERCENTAGE,
            "Insufficient balance to create proposal (need 10% of total)"
        );

        proposalCount++;
        
        proposals[proposalCount] = Proposal({
            id: proposalCount,
            recipient: recipient,
            amount: amount,
            deadline: deadline,
            votesFor: 0,
            votesAgainst: 0,
            votesAbstain: 0,
            executed: false,
            proposer: _msgSender(),
            description: description
        });

        emit ProposalCreated(proposalCount, _msgSender(), recipient, amount, deadline, description);
    }

    /**
     * @dev Permite votar en una propuesta
     * @param proposalId ID de la propuesta
     * @param voteType Tipo de voto (ABSTAIN, FOR, AGAINST)
     */
    function vote(uint256 proposalId, VoteType voteType) external {
        require(proposalId > 0 && proposalId <= proposalCount, "Invalid proposal ID");
        Proposal storage proposal = proposals[proposalId];
        
        require(block.timestamp < proposal.deadline, "Voting period has ended");
        require(!proposal.executed, "Proposal already executed");
        require(userBalances[_msgSender()] > 0, "Must have balance to vote");

        // Si ya votó, restar su voto anterior (1 voto por persona)
        if (hasVoted[proposalId][_msgSender()]) {
            VoteType previousVote = userVotes[proposalId][_msgSender()];
            
            if (previousVote == VoteType.FOR) {
                proposal.votesFor -= 1;
            } else if (previousVote == VoteType.AGAINST) {
                proposal.votesAgainst -= 1;
            } else if (previousVote == VoteType.ABSTAIN) {
                proposal.votesAbstain -= 1;
            }
        }

        // Registrar nuevo voto
        hasVoted[proposalId][_msgSender()] = true;
        userVotes[proposalId][_msgSender()] = voteType;

        // Agregar nuevo voto (1 voto por persona)
        if (voteType == VoteType.FOR) {
            proposal.votesFor += 1;
        } else if (voteType == VoteType.AGAINST) {
            proposal.votesAgainst += 1;
        } else if (voteType == VoteType.ABSTAIN) {
            proposal.votesAbstain += 1;
        }

        emit VoteCast(proposalId, _msgSender(), voteType);
    }

    /**
     * @dev Ejecuta una propuesta aprobada
     * @param proposalId ID de la propuesta a ejecutar
     */
    function executeProposal(uint256 proposalId) external {
        require(proposalId > 0 && proposalId <= proposalCount, "Invalid proposal ID");
        Proposal storage proposal = proposals[proposalId];

        require(!proposal.executed, "Proposal already executed");
        require(block.timestamp >= proposal.deadline, "Voting period not ended");
        require(
            block.timestamp >= proposal.deadline + EXECUTION_DELAY,
            "Execution delay period not passed"
        );
        require(proposal.votesFor > proposal.votesAgainst, "Proposal not approved");
        require(address(this).balance >= proposal.amount, "Insufficient contract balance");

        proposal.executed = true;

        (bool success, ) = proposal.recipient.call{value: proposal.amount}("");
        require(success, "Transfer failed");

        emit ProposalExecuted(proposalId, proposal.recipient, proposal.amount);
    }

    /**
     * @dev Obtiene información completa de una propuesta
     */
    function getProposal(uint256 proposalId) external view returns (Proposal memory) {
        require(proposalId > 0 && proposalId <= proposalCount, "Invalid proposal ID");
        return proposals[proposalId];
    }

    /**
     * @dev Obtiene el balance de un usuario en el DAO
     */
    function getUserBalance(address user) external view returns (uint256) {
        return userBalances[user];
    }

    /**
     * @dev Verifica si una propuesta está aprobada
     */
    function isProposalApproved(uint256 proposalId) external view returns (bool) {
        require(proposalId > 0 && proposalId <= proposalCount, "Invalid proposal ID");
        Proposal memory proposal = proposals[proposalId];
        return proposal.votesFor > proposal.votesAgainst;
    }

    /**
     * @dev Verifica si una propuesta es ejecutable
     */
    function isProposalExecutable(uint256 proposalId) external view returns (bool) {
        require(proposalId > 0 && proposalId <= proposalCount, "Invalid proposal ID");
        Proposal memory proposal = proposals[proposalId];
        
        return !proposal.executed &&
            block.timestamp >= proposal.deadline + EXECUTION_DELAY &&
            proposal.votesFor > proposal.votesAgainst &&
            address(this).balance >= proposal.amount;
    }

    /**
     * @dev Override de _msgSender para soportar meta-transacciones
     */
    function _msgSender() internal view virtual override returns (address) {
        return ERC2771Context._msgSender();
    }

    /**
     * @dev Override de _msgData para soportar meta-transacciones
     */
    function _msgData() internal view virtual override returns (bytes calldata) {
        return ERC2771Context._msgData();
    }
}
