#!/usr/bin/env node

/**
 * Script to sync ABIs from Foundry to Frontend
 * Reads from sc/out/ and writes to web/lib/abis/
 */

const fs = require('fs');
const path = require('path');

// Paths
const ROOT = path.join(__dirname, '..');
const FOUNDRY_OUT = path.join(ROOT, 'sc', 'out');
const WEB_ABIS = path.join(ROOT, 'web', 'lib', 'abis');

// Contracts to sync
const CONTRACTS = [
  {
    name: 'DAOVoting',
    foundryPath: 'DAOVoting.sol/DAOVoting.json',
    outputName: 'DAOVoting.json'
  },
  {
    name: 'MinimalForwarder',
    foundryPath: 'MinimalForwarder.sol/MinimalForwarder.json',
    outputName: 'MinimalForwarder.json'
  }
];

console.log('🔄 Syncing ABIs from Foundry to Frontend...\n');

// Create abis directory if it doesn't exist
if (!fs.existsSync(WEB_ABIS)) {
  fs.mkdirSync(WEB_ABIS, { recursive: true });
  console.log('✅ Created directory:', WEB_ABIS);
}

let success = 0;
let errors = 0;
const abis = {};

CONTRACTS.forEach(contract => {
  try {
    const sourcePath = path.join(FOUNDRY_OUT, contract.foundryPath);
    const destPath = path.join(WEB_ABIS, contract.outputName);
    
    // Read Foundry output
    if (!fs.existsSync(sourcePath)) {
      console.error(`❌ Contract not found: ${contract.name} at ${sourcePath}`);
      errors++;
      return;
    }
    
    const contractJson = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
    
    // Extract only the ABI
    const abi = contractJson.abi;
    
    if (!abi || !Array.isArray(abi) || abi.length === 0) {
      console.error(`❌ Invalid ABI for ${contract.name}`);
      errors++;
      return;
    }
    
    // Write JSON file for public distribution
    fs.writeFileSync(destPath, JSON.stringify(abi, null, 2), 'utf8');
    
    // Store for index.ts generation
    abis[contract.name] = abi;
    
    console.log(`✅ ${contract.name}: ${abi.length} functions synced (JSON + TS)`);
    success++;
    
  } catch (error) {
    console.error(`❌ Error syncing ${contract.name}:`, error.message);
    errors++;
  }
});

// Generate index.ts with imports from JSON files
try {
  const indexContent = `/**
 * Auto-generated ABIs from Foundry
 * DO NOT EDIT MANUALLY - Run \`npm run sync:abis\` to update
 * Generated: ${new Date().toISOString()}
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
`;

  fs.writeFileSync(path.join(WEB_ABIS, 'index.ts'), indexContent, 'utf8');
  console.log('✅ index.ts generated with inlined ABIs');
} catch (error) {
  console.error('❌ Error generating index.ts:', error.message);
  errors++;
}

console.log('\n' + '='.repeat(50));
console.log(`📊 Summary: ${success} ABIs synced, ${errors} failed`);

if (errors > 0) {
  console.error('\n⚠️  Some ABIs failed to sync. Check errors above.');
  process.exit(1);
}

console.log('\n✅ All ABIs synced successfully!');
console.log('\n💡 Next step: Update contract addresses in .env.local');
