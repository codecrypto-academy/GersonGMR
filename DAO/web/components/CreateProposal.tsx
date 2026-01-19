"use client";

import { useState } from "react";
import { useWeb3 } from "@/contexts/Web3Context";
import { parseEther } from "ethers";
import { getErrorMessage } from "@/lib/errorHandler";

interface CreateProposalProps {
  onProposalCreated?: () => void;
}

export function CreateProposal({ onProposalCreated }: CreateProposalProps) {
  const { daoContract, refreshBalances } = useWeb3();
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [days, setDays] = useState("7");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleCreateProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!daoContract || !recipient || !amount || !days || !description) return;

    try {
      setLoading(true);
      setMessage("");

      // Calculate deadline (current time + days in seconds)
      const deadline = Math.floor(Date.now() / 1000) + (parseInt(days) * 24 * 60 * 60);

      const tx = await daoContract.createProposal(
        recipient,
        parseEther(amount),
        deadline,
        description
      );
      
      setMessage("Transaction sent! Waiting for confirmation...");
      
      await tx.wait();
      setMessage("✅ Proposal created successfully!");
      
      // Reset form
      setRecipient("");
      setAmount("");
      setDays("7");
      setDescription("");
      
      // Refresh data
      await refreshBalances();
      
      // Trigger refresh of proposal list without reloading page
      if (onProposalCreated) {
        setTimeout(() => {
          onProposalCreated();
          setMessage("");
        }, 1500);
      }
      
    } catch (error: any) {
      console.error("Error creating proposal:", error);
      setMessage(`❌ ${getErrorMessage(error)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2 className="text-2xl font-bold mb-4">Create Proposal</h2>
      
      <form onSubmit={handleCreateProposal} className="space-y-4">
        <div>
          <label className="label">
            Recipient Address
          </label>
          <input
            type="text"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="0x..."
            className="input-field font-mono"
            disabled={loading}
            required
          />
        </div>

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

        <div>
          <label className="label">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the purpose of this proposal..."
            className="input-field min-h-[100px] resize-y"
            disabled={loading}
            required
            maxLength={500}
          />
          <p className="text-xs text-gray-500 mt-1">
            {description.length}/500 characters
          </p>
        </div>

        <div>
          <label className="label">
            Voting Period (Days)
          </label>
          <input
            type="number"
            min="1"
            value={days}
            onChange={(e) => setDays(e.target.value)}
            className="input-field"
            disabled={loading}
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading || !recipient || !amount || !days || !description}
          className="btn-primary w-full"
        >
          {loading ? "Creating..." : "Create Proposal"}
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
    </div>
  );
}
