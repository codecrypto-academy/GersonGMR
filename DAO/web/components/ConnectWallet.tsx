"use client";

import { useWeb3 } from "@/contexts/Web3Context";

export function ConnectWallet() {
  const { account, connectWallet, disconnectWallet, userBalance, chainId } = useWeb3();

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (!account) {
    return (
      <button onClick={connectWallet} className="btn-primary">
        Connect Wallet
      </button>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <div className="text-right">
        <div className="text-sm text-gray-600 dark:text-gray-300">
          Your DAO Balance
        </div>
        <div className="font-bold text-lg">
          {parseFloat(userBalance).toFixed(4)} ETH
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <div className="bg-gray-100 dark:bg-gray-700 px-4 py-2 rounded-lg">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Chain ID: {chainId}
          </div>
          <div className="font-mono text-sm">
            {shortenAddress(account)}
          </div>
        </div>
        <button
          onClick={disconnectWallet}
          className="text-xs text-red-600 hover:text-red-700 dark:text-red-400"
        >
          Disconnect
        </button>
      </div>
    </div>
  );
}
