import { BrowserProvider, AbiCoder, keccak256, toUtf8Bytes } from "ethers";
import { VoteType } from "./contracts";

const DOMAIN_NAME = "MinimalForwarder";
const DOMAIN_VERSION = "0.0.1";

export async function signMetaTransaction(proposalId: bigint, voteType: VoteType) {
  try {
    if (typeof window.ethereum === "undefined") {
      throw new Error("MetaMask not installed");
    }

    const provider = new BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const userAddress = await signer.getAddress();

    const forwarderAddress = process.env.NEXT_PUBLIC_FORWARDER_ADDRESS;
    const daoAddress = process.env.NEXT_PUBLIC_DAO_ADDRESS;
    const chainId = process.env.NEXT_PUBLIC_CHAIN_ID || "31337";

    if (!forwarderAddress || !daoAddress) {
      throw new Error("Contract addresses not configured");
    }

    // Get nonce from relayer API
    const nonceResponse = await fetch(`/api/nonce?address=${userAddress}`);
    if (!nonceResponse.ok) {
      throw new Error("Failed to get nonce");
    }
    const { nonce } = await nonceResponse.json();

    // Encode the vote function call
    const abiCoder = new AbiCoder();
    const voteSelector = "0x943e8216"; // vote(uint256,uint8) selector
    const encodedParams = abiCoder.encode(
      ["uint256", "uint8"],
      [proposalId, voteType]
    );
    // Concatenate selector + encoded parameters
    const data = voteSelector + encodedParams.slice(2);

    // Create ForwardRequest
    const forwardRequest = {
      from: userAddress,
      to: daoAddress,
      value: 0,
      gas: 200000,
      nonce: nonce,
      data: data,
    };

    // EIP-712 Domain
    const domain = {
      name: DOMAIN_NAME,
      version: DOMAIN_VERSION,
      chainId: parseInt(chainId),
      verifyingContract: forwarderAddress,
    };

    // EIP-712 Types
    const types = {
      ForwardRequest: [
        { name: "from", type: "address" },
        { name: "to", type: "address" },
        { name: "value", type: "uint256" },
        { name: "gas", type: "uint256" },
        { name: "nonce", type: "uint256" },
        { name: "data", type: "bytes" },
      ],
    };

    // Sign the typed data
    const signature = await signer.signTypedData(domain, types, forwardRequest);

    // Send to relayer
    const relayResponse = await fetch("/api/relay", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        request: forwardRequest,
        signature: signature,
      }),
    });

    if (!relayResponse.ok) {
      const error = await relayResponse.json();
      throw new Error(error.error || "Relay failed");
    }

    const result = await relayResponse.json();
    
    // Wait for transaction to be mined before returning
    if (result.txHash) {
      try {
        const receipt = await provider.waitForTransaction(result.txHash, 1);
        console.log("Transaction mined:", receipt?.blockNumber);
      } catch (error) {
        console.error("Error waiting for transaction:", error);
        // Continue anyway - the transaction was submitted successfully
      }
    }
    
    return { success: true, txHash: result.txHash };

  } catch (error: any) {
    console.error("Error in signMetaTransaction:", error);
    return { success: false, error: error.message };
  }
}
