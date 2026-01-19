/**
 * Contract ABIs and Types
 * 
 * ABIs are auto-generated from Foundry contracts
 * Run `npm run sync:abis` to update ABIs from smart contracts
 * 
 * DO NOT EDIT ABIs MANUALLY - they are generated from sc/out/
 */

// Import auto-generated ABIs from Foundry
export { DAOVotingABI, MinimalForwarderABI, VoteType } from './abis';
export type { Proposal } from './abis';

// Additional TypeScript interfaces
export interface ForwardRequest {
  from: string;
  to: string;
  value: bigint;
  gas: bigint;
  nonce: bigint;
  data: string;
}
