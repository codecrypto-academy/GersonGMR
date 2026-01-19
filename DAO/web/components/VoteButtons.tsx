"use client";

import { useState } from "react";
import { VoteType } from "@/lib/contracts";
import { signMetaTransaction } from "@/lib/gasless";

interface VoteButtonsProps {
  proposalId: bigint;
  onVoteComplete: () => void;
}

export function VoteButtons({ proposalId, onVoteComplete }: VoteButtonsProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [useGasless, setUseGasless] = useState(true);

  const handleVote = async (voteType: VoteType) => {
    try {
      setLoading(true);
      setMessage("");

      if (useGasless) {
        // Gasless voting
        setMessage("Signing vote (no gas required)...");
        const result = await signMetaTransaction(proposalId, voteType);
        
        if (!result.success) {
          throw new Error(result.error || "Failed to send meta-transaction");
        }

        setMessage("✅ Vote confirmed! Updating data...");
        
        // The transaction is now mined, update UI with fresh blockchain data
        await onVoteComplete();
        
        setMessage("✅ Vote registered successfully!");
        
        setTimeout(() => {
          setMessage("");
        }, 2000);
      } else {
        // Regular voting (requires gas)
        const { useWeb3 } = await import("@/contexts/Web3Context");
        // This is a workaround - in real implementation we'd use the hook properly
        throw new Error("Regular voting not implemented in this component. Use gasless voting.");
      }

    } catch (error: any) {
      console.error("Error voting:", error);
      setMessage(`❌ Error: ${error.message || "Vote failed"}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <input
          type="checkbox"
          id="gasless"
          checked={useGasless}
          onChange={(e) => setUseGasless(e.target.checked)}
          className="w-4 h-4"
        />
        <label htmlFor="gasless" className="text-sm text-gray-700 dark:text-gray-300">
          Use gasless voting (meta-transactions)
        </label>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={() => handleVote(VoteType.FOR)}
          disabled={loading}
          className="btn-success"
        >
          {loading ? "..." : "Vote FOR"}
        </button>
        
        <button
          onClick={() => handleVote(VoteType.AGAINST)}
          disabled={loading}
          className="btn-danger"
        >
          {loading ? "..." : "Vote AGAINST"}
        </button>
        
        <button
          onClick={() => handleVote(VoteType.ABSTAIN)}
          disabled={loading}
          className="btn-warning"
        >
          {loading ? "..." : "Abstain"}
        </button>
      </div>

      {message && (
        <div className={`p-3 rounded-lg text-sm ${
          message.includes("✅") 
            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" 
            : message.includes("❌")
            ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
            : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
        }`}>
          {message}
        </div>
      )}
    </div>
  );
}
