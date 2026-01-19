"use client";

import { useState, useEffect } from "react";
import { useWeb3 } from "@/contexts/Web3Context";
import { ProposalCard } from "./ProposalCard";
import { Proposal } from "@/lib/contracts";

export function ProposalList() {
  const { daoContract } = useWeb3();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProposals();
  }, [daoContract]);
  
  // Load proposals on component mount (triggered by key change)
  useEffect(() => {
    if (daoContract) {
      loadProposals();
    }
  }, []);

  const loadProposals = async () => {
    if (!daoContract) return;

    try {
      setLoading(true);
      console.log("Loading proposals...");
      const count = await daoContract.proposalCount();
      const proposalPromises = [];

      for (let i = 1; i <= Number(count); i++) {
        proposalPromises.push(daoContract.getProposal(i));
      }

      const proposalsData = await Promise.all(proposalPromises);
      
      // Convert to array and reverse to show newest first
      setProposals(proposalsData.reverse());
      console.log(`Loaded ${proposalsData.length} proposals with fresh data`);
    } catch (error) {
      console.error("Error loading proposals:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="card">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading proposals...</p>
        </div>
      </div>
    );
  }

  if (proposals.length === 0) {
    return (
      <div className="card">
        <div className="text-center py-8">
          <h3 className="text-xl font-bold mb-2">No Proposals Yet</h3>
          <p className="text-gray-600 dark:text-gray-300">
            Create the first proposal to get started!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Proposals ({proposals.length})</h2>
        <button
          onClick={loadProposals}
          className="btn-secondary"
        >
          Refresh
        </button>
      </div>

      <div className="space-y-6">
        {proposals.map((proposal) => (
          <ProposalCard
            key={proposal.id.toString()}
            proposal={proposal}
            onVoteComplete={loadProposals}
          />
        ))}
      </div>
    </div>
  );
}
