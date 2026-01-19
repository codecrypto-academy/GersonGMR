"use client";

import { useState } from "react";
import { ConnectWallet } from "@/components/ConnectWallet";
import { FundingPanel } from "@/components/FundingPanel";
import { CreateProposal } from "@/components/CreateProposal";
import { ProposalList } from "@/components/ProposalList";
import { useWeb3 } from "@/contexts/Web3Context";

export default function Home() {
  const { account } = useWeb3();
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <header className="bg-white dark:bg-gray-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                DAO Voting Platform
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                Gasless voting with meta-transactions
              </p>
            </div>
            <ConnectWallet />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!account ? (
          <div className="text-center py-20">
            <div className="card inline-block">
              <h2 className="text-2xl font-bold mb-4">Welcome to DAO Voting</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Connect your wallet to get started
              </p>
              <ConnectWallet />
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Funding and Create Proposal Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <FundingPanel key={refreshKey} />
              <CreateProposal onProposalCreated={() => setRefreshKey(prev => prev + 1)} />
            </div>

            {/* Proposals List */}
            <ProposalList key={refreshKey} />
          </div>
        )}
      </main>

      <footer className="bg-white dark:bg-gray-800 mt-16 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-gray-600 dark:text-gray-300">
            Built with Next.js, Ethereum, and EIP-2771 Meta-Transactions
          </p>
        </div>
      </footer>
    </div>
  );
}
