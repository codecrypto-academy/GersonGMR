"use client";

import { useState, useEffect } from "react";
import { useWeb3 } from "@/contexts/Web3Context";
import { parseEther } from "ethers";
import { getErrorMessage } from "@/lib/errorHandler";

export function FundingPanel() {
  const { daoContract, daoTotalBalance, refreshBalances } = useWeb3();
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [proposalCount, setProposalCount] = useState<number>(0);

  useEffect(() => {
    loadProposalCount();
  }, [daoContract]);

  const loadProposalCount = async () => {
    if (!daoContract) return;
    
    try {
      const count = await daoContract.proposalCount();
      setProposalCount(Number(count));
    } catch (error) {
      console.error("Error loading proposal count:", error);
    }
  };

  const handleFund = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!daoContract || !amount) return;

    try {
      setLoading(true);
      setMessage("");

      const tx = await daoContract.fundDao({ value: parseEther(amount) });
      setMessage("Transaction sent! Waiting for confirmation...");
      
      await tx.wait();
      setMessage("✅ Funds deposited successfully!");
      setAmount("");
      
      // Refresh balances
      await refreshBalances();
      
      setTimeout(() => setMessage(""), 5000);
    } catch (error: any) {
      console.error("Error funding DAO:", error);
      setMessage(`❌ ${getErrorMessage(error)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2 className="text-2xl font-bold mb-4">Fund the DAO</h2>
      
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <div className="text-sm text-gray-600 dark:text-gray-300 mb-1">
            Total DAO Balance
          </div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {parseFloat(daoTotalBalance).toFixed(4)} ETH
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-600 dark:text-gray-300 mb-1">
            Total Proposals
          </div>
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {proposalCount}
          </div>
        </div>
      </div>

      <form onSubmit={handleFund} className="space-y-4">
        <div>
          <label className="label">
            Amount (ETH)
          </label>
          <input
            type="number"
            step="0.001"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.0"
            className="input-field"
            disabled={loading}
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading || !amount}
          className="btn-primary w-full"
        >
          {loading ? "Processing..." : "Deposit ETH"}
        </button>

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
      </form>

      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <p className="text-sm text-gray-700 dark:text-gray-300">
          <strong>Note:</strong> You need at least 10% of the total DAO balance to create proposals.
        </p>
      </div>
    </div>
  );
}
