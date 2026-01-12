"use client";

/**
 * @file WalletSelector.tsx
 * @description Componente para seleccionar y conectar wallets
 */

import React from "react";
import { useMetaMask } from "@/contexts/MetaMaskContext";

export default function WalletSelector() {
  const {
    wallets,
    currentWallet,
    isConnected,
    connect,
    disconnect,
  } = useMetaMask();

  const truncateAddress = (address: string): string => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
      <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
        Wallet Connection
      </h3>

      {isConnected && currentWallet ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <div>
              <p className="text-sm font-medium text-green-800 dark:text-green-200">
                Connected
              </p>
              <p className="text-xs font-mono text-green-600 dark:text-green-400 mt-1 break-all">
                {currentWallet.address}
              </p>
            </div>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          </div>
          <button
            onClick={disconnect}
            className="w-full py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
          >
            Disconnect
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            Select a wallet to connect:
          </p>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {wallets.map((wallet) => (
              <button
                key={wallet.index}
                onClick={() => connect(wallet.index)}
                className="w-full text-left p-3 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      Wallet {wallet.index + 1}
                    </p>
                    <p className="text-xs font-mono text-gray-600 dark:text-gray-400 break-all">
                      {wallet.address}
                    </p>
                  </div>
                  <svg
                    className="w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

