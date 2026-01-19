/**
 * @file wallet.ts
 * @description Utility functions for deriving wallets from mnemonic
 */

import { ethers } from "ethers";

/**
 * Interface for derived wallet data
 */
export interface DerivedWallet {
  wallet: ethers.HDNodeWallet;
  address: string;
  index: number;
}

/**
 * Derives multiple wallets from a mnemonic phrase
 * @param mnemonic - The BIP39 mnemonic phrase
 * @param count - Number of wallets to derive
 * @returns Array of derived wallets with their addresses
 */
export function deriveWalletsFromMnemonic(
  mnemonic: string,
  count: number
): DerivedWallet[] {
  const wallets: DerivedWallet[] = [];

  for (let i = 0; i < count; i++) {
    // Derive wallet using BIP44 path: m/44'/60'/0'/0/i
    // 60' is the coin type for Ethereum
    const path = `m/44'/60'/0'/0/${i}`;
    const wallet = ethers.HDNodeWallet.fromPhrase(mnemonic, undefined, path);

    wallets.push({
      wallet,
      address: wallet.address,
      index: i,
    });
  }

  return wallets;
}
