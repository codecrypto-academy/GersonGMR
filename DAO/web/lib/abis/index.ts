/**
 * Auto-generated ABIs from Foundry
 * DO NOT EDIT MANUALLY - Run `npm run sync:abis` to update
 * Generated: 2026-01-19T21:54:29.044Z
 * 
 * This file provides TypeScript exports for the frontend.
 * For direct ABI usage, import the JSON files instead.
 */

// Import ABIs from JSON files (universally compatible)
import DAOVotingABIJson from './DAOVoting.json';
import MinimalForwarderABIJson from './MinimalForwarder.json';

// Export with TypeScript type safety
export const DAOVotingABI = DAOVotingABIJson;
export const MinimalForwarderABI = MinimalForwarderABIJson;

// TypeScript types
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

export enum VoteType {
  ABSTAIN = 0,
  FOR = 1,
  AGAINST = 2
}
