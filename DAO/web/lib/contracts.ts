// ABI para el contrato DAOVoting
export const DAOVotingABI = [
  "function fundDao() external payable",
  "function createProposal(address recipient, uint256 amount, uint256 deadline, string description) external",
  "function vote(uint256 proposalId, uint8 voteType) external",
  "function executeProposal(uint256 proposalId) external",
  "function getProposal(uint256 proposalId) external view returns (tuple(uint256 id, address recipient, uint256 amount, uint256 deadline, uint256 votesFor, uint256 votesAgainst, uint256 votesAbstain, bool executed, address proposer, string description))",
  "function getUserBalance(address user) external view returns (uint256)",
  "function proposalCount() external view returns (uint256)",
  "function totalBalance() external view returns (uint256)",
  "function isProposalApproved(uint256 proposalId) external view returns (bool)",
  "function isProposalExecutable(uint256 proposalId) external view returns (bool)",
  "function hasVoted(uint256 proposalId, address user) external view returns (bool)",
  "function userVotes(uint256 proposalId, address user) external view returns (uint8)",
  "event FundsDeposited(address indexed user, uint256 amount)",
  "event ProposalCreated(uint256 indexed proposalId, address indexed proposer, address recipient, uint256 amount, uint256 deadline, string description)",
  "event VoteCast(uint256 indexed proposalId, address indexed voter, uint8 voteType)",
  "event ProposalExecuted(uint256 indexed proposalId, address recipient, uint256 amount)"
];

// ABI para el contrato MinimalForwarder
export const MinimalForwarderABI = [
  "function getNonce(address from) public view returns (uint256)",
  "function verify(tuple(address from, address to, uint256 value, uint256 gas, uint256 nonce, bytes data) req, bytes signature) public view returns (bool)",
  "function execute(tuple(address from, address to, uint256 value, uint256 gas, uint256 nonce, bytes data) req, bytes signature) public payable returns (bool, bytes)",
  "function DOMAIN_SEPARATOR() external view returns (bytes32)",
  "event MetaTransactionExecuted(address indexed from, address indexed to, bytes data)"
];

// Enum VoteType
export enum VoteType {
  ABSTAIN = 0,
  FOR = 1,
  AGAINST = 2
}

// Tipos TypeScript
export interface Proposal {
  id: bigint;
  recipient: string;
  amount: bigint;
  deadline: bigint;
  votesFor: bigint;
  votesAgainst: bigint;
  votesAbstain: bigint;
  executed: boolean;
  proposer: string;
  description: string;
}

export interface ForwardRequest {
  from: string;
  to: string;
  value: bigint;
  gas: bigint;
  nonce: bigint;
  data: string;
}
