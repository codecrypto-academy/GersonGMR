"use client";

import { useState, useEffect } from "react";
import { useWeb3 } from "@/contexts/Web3Context";
import { VoteButtons } from "./VoteButtons";
import { Proposal } from "@/lib/contracts";
import { formatEther } from "ethers";
import { getErrorMessage } from "@/lib/errorHandler";

interface ProposalCardProps {
  proposal: Proposal;
  onVoteComplete: () => void;
}

export function ProposalCard({ proposal: initialProposal, onVoteComplete }: ProposalCardProps) {
  const { daoContract, account, refreshBalances, getBlockTimestamp } = useWeb3();
  const [proposal, setProposal] = useState<Proposal>(initialProposal);
  const [userVote, setUserVote] = useState<number | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [message, setMessage] = useState("");
  const [blockTime, setBlockTime] = useState<number>(Math.floor(Date.now() / 1000));

  useEffect(() => {
    setProposal(initialProposal);
  }, [initialProposal]);

  useEffect(() => {
    loadUserVote();
  }, [account, proposal.id]);

  // Update block time every 5 seconds to reflect deadline changes
  useEffect(() => {
    const updateBlockTime = async () => {
      const timestamp = await getBlockTimestamp();
      setBlockTime(timestamp);
    };

    updateBlockTime(); // Initial load
    
    const interval = setInterval(() => {
      updateBlockTime();
    }, 5000);

    return () => clearInterval(interval);
  }, [getBlockTimestamp]);

  const loadUserVote = async () => {
    if (!daoContract || !account) return;

    try {
      const voted = await daoContract.hasVoted(proposal.id, account);
      setHasVoted(voted);
      
      if (voted) {
        const vote = await daoContract.userVotes(proposal.id, account);
        setUserVote(Number(vote));
        console.log(`Loaded vote for proposal ${proposal.id}: ${Number(vote)}`);
      } else {
        setUserVote(null);
        console.log(`No vote found for proposal ${proposal.id}`);
      }
    } catch (error) {
      console.error("Error loading user vote:", error);
    }
  };

  const refreshProposal = async () => {
    if (!daoContract) return;
    
    try {
      console.log(`Refreshing proposal ${proposal.id}...`);
      const updatedProposal = await daoContract.getProposal(proposal.id);
      setProposal(updatedProposal);
      console.log(`Proposal ${proposal.id} updated with fresh vote data`);
    } catch (error) {
      console.error("Error refreshing proposal:", error);
    }
  };

  const handleExecute = async () => {
    if (!daoContract) return;

    try {
      setExecuting(true);
      setMessage("Executing proposal...");

      const tx = await daoContract.executeProposal(proposal.id);
      await tx.wait();

      setMessage("✅ Proposal executed successfully!");
      
      // Refresh balances and proposal list
      await refreshBalances();
      
      setTimeout(() => {
        onVoteComplete();
      }, 2000);
    } catch (error: any) {
      console.error("Error executing proposal:", error);
      setMessage(`❌ ${getErrorMessage(error)}`);
    } finally {
      setExecuting(false);
    }
  };

  const getStatus = () => {
    const deadline = Number(proposal.deadline);
    
    // Debug logging - using BLOCK timestamp, not system time
    console.log(`Proposal ${proposal.id} - Block Time: ${blockTime} (${new Date(blockTime * 1000).toISOString()}), Deadline: ${deadline} (${new Date(deadline * 1000).toISOString()}), Expired: ${blockTime >= deadline}`);
    
    if (proposal.executed) {
      return { text: "Executed", color: "bg-green-500" };
    }
    
    if (blockTime >= deadline) {
      if (proposal.votesFor > proposal.votesAgainst) {
        return { text: "Approved", color: "bg-blue-500" };
      } else {
        return { text: "Rejected", color: "bg-red-500" };
      }
    }
    
    return { text: "Active", color: "bg-yellow-500" };
  };

  const status = getStatus();
  const isActive = blockTime < Number(proposal.deadline) && !proposal.executed;
  const canExecute = !proposal.executed && 
                     blockTime >= Number(proposal.deadline) + 3600 && // After 1 hour delay
                     proposal.votesFor > proposal.votesAgainst;

  // Convert votes to numbers (now 1 person = 1 vote, not weighted by ETH)
  const forVotes = Number(proposal.votesFor);
  const againstVotes = Number(proposal.votesAgainst);
  const abstainVotes = Number(proposal.votesAbstain);
  const totalVotes = forVotes + againstVotes + abstainVotes;
  
  const forPercentage = totalVotes > 0 ? Math.round((forVotes * 100) / totalVotes) : 0;
  const againstPercentage = totalVotes > 0 ? Math.round((againstVotes * 100) / totalVotes) : 0;
  const abstainPercentage = totalVotes > 0 ? Math.round((abstainVotes * 100) / totalVotes) : 0;

  const getVoteTypeText = (voteType: number) => {
    switch (voteType) {
      case 0: return "ABSTAIN";
      case 1: return "FOR";
      case 2: return "AGAINST";
      default: return "UNKNOWN";
    }
  };

  return (
    <div className="card">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold">Proposal #{proposal.id.toString()}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            By {proposal.proposer.slice(0, 6)}...{proposal.proposer.slice(-4)}
          </p>
        </div>
        <span className={`${status.color} text-white px-3 py-1 rounded-full text-sm font-semibold`}>
          {status.text}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-300">Recipient</p>
          <p className="font-mono text-sm">
            {proposal.recipient.slice(0, 10)}...{proposal.recipient.slice(-8)}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-300">Amount</p>
          <p className="font-bold text-lg">{formatEther(proposal.amount)} ETH</p>
        </div>
      </div>

      <div className="mb-4">
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">Description</p>
        <p className="text-sm bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
          {proposal.description}
        </p>
      </div>

      <div className="mb-4">
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">Deadline</p>
        <p className="text-sm">
          {new Date(Number(proposal.deadline) * 1000).toLocaleString()}
        </p>
      </div>

      {/* Voting Progress - Individual Bars */}
      <div className="mb-4 space-y-3">
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Voting Results</h4>
        
        {/* FOR Votes */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-green-600 dark:text-green-400 font-medium">FOR</span>
            <span className="text-gray-700 dark:text-gray-300">
              {forVotes} {forVotes === 1 ? 'vote' : 'votes'} ({forPercentage}%)
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
            <div
              className="bg-green-500 h-full transition-all duration-300"
              style={{ width: `${forPercentage}%` }}
            />
          </div>
        </div>

        {/* AGAINST Votes */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-red-600 dark:text-red-400 font-medium">AGAINST</span>
            <span className="text-gray-700 dark:text-gray-300">
              {againstVotes} {againstVotes === 1 ? 'vote' : 'votes'} ({againstPercentage}%)
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
            <div
              className="bg-red-500 h-full transition-all duration-300"
              style={{ width: `${againstPercentage}%` }}
            />
          </div>
        </div>

        {/* ABSTAIN Votes */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-yellow-600 dark:text-yellow-400 font-medium">ABSTAIN</span>
            <span className="text-gray-700 dark:text-gray-300">
              {abstainVotes} {abstainVotes === 1 ? 'vote' : 'votes'} ({abstainPercentage}%)
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
            <div
              className="bg-yellow-500 h-full transition-all duration-300"
              style={{ width: `${abstainPercentage}%` }}
            />
          </div>
        </div>

        <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          Total: {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}
        </div>
      </div>

      {/* User Vote Status */}
      {hasVoted && userVote !== null && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-sm">
            You voted: <strong>{getVoteTypeText(userVote)}</strong>
            {isActive && " (you can change your vote)"}
          </p>
        </div>
      )}

      {/* Vote Buttons */}
      {isActive && (
        <VoteButtons
          proposalId={proposal.id}
          onVoteComplete={async () => {
            console.log("Vote complete callback triggered");
            // Refresh only this proposal's data
            await refreshProposal();
            await loadUserVote();
            await refreshBalances();
            console.log("Proposal data updated successfully");
          }}
        />
      )}

      {/* Execute Button */}
      {canExecute && (
        <div className="mt-4">
          <button
            onClick={handleExecute}
            disabled={executing}
            className="btn-success w-full"
          >
            {executing ? "Executing..." : "Execute Proposal"}
          </button>
        </div>
      )}

      {message && (
        <div className={`mt-4 p-3 rounded-lg text-sm ${
          message.includes("✅") 
            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" 
            : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
        }`}>
          {message}
        </div>
      )}
    </div>
  );
}
