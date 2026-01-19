import { NextRequest, NextResponse } from "next/server";
import { JsonRpcProvider, Wallet, Contract } from "ethers";
import { DAOVotingABI } from "@/lib/contracts";

/**
 * Daemon endpoint to automatically execute approved proposals
 * Can be called manually or set up with a cron job
 */
export async function GET(request: NextRequest) {
  try {
    const rpcUrl = process.env.RPC_URL || "http://127.0.0.1:8545";
    const relayerPrivateKey = process.env.RELAYER_PRIVATE_KEY;
    const daoAddress = process.env.NEXT_PUBLIC_DAO_ADDRESS;

    if (!relayerPrivateKey) {
      return NextResponse.json(
        { error: "Relayer private key not configured" },
        { status: 500 }
      );
    }

    if (!daoAddress) {
      return NextResponse.json(
        { error: "DAO address not configured" },
        { status: 500 }
      );
    }

    const provider = new JsonRpcProvider(rpcUrl);
    const executor = new Wallet(relayerPrivateKey, provider);
    const dao = new Contract(daoAddress, DAOVotingABI, executor);

    console.log("Daemon: Checking for executable proposals...");

    const proposalCount = await dao.proposalCount();
    const executedProposals = [];
    const errors = [];

    // Check all proposals
    for (let i = 1; i <= Number(proposalCount); i++) {
      try {
        const isExecutable = await dao.isProposalExecutable(i);
        
        if (isExecutable) {
          console.log(`Executing proposal #${i}...`);
          const tx = await dao.executeProposal(i);
          const receipt = await tx.wait();
          
          executedProposals.push({
            proposalId: i,
            txHash: receipt?.hash,
            blockNumber: receipt?.blockNumber,
          });
          
          console.log(`Proposal #${i} executed successfully`);
        }
      } catch (error: any) {
        console.error(`Error checking/executing proposal #${i}:`, error);
        errors.push({
          proposalId: i,
          error: error.message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      totalProposals: Number(proposalCount),
      executedProposals,
      errors,
      message: executedProposals.length > 0
        ? `Executed ${executedProposals.length} proposal(s)`
        : "No proposals ready for execution",
    });

  } catch (error: any) {
    console.error("Daemon error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Daemon execution failed",
      },
      { status: 500 }
    );
  }
}
