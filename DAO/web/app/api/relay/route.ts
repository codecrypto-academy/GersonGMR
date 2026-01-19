import { NextRequest, NextResponse } from "next/server";
import { JsonRpcProvider, Wallet, Contract } from "ethers";
import { MinimalForwarderABI } from "@/lib/contracts";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { request: forwardRequest, signature } = body;

    if (!forwardRequest || !signature) {
      return NextResponse.json(
        { error: "Missing request or signature" },
        { status: 400 }
      );
    }

    const rpcUrl = process.env.RPC_URL || "http://127.0.0.1:8545";
    const relayerPrivateKey = process.env.RELAYER_PRIVATE_KEY;
    const forwarderAddress = process.env.NEXT_PUBLIC_FORWARDER_ADDRESS;

    if (!relayerPrivateKey) {
      return NextResponse.json(
        { error: "Relayer private key not configured" },
        { status: 500 }
      );
    }

    if (!forwarderAddress) {
      return NextResponse.json(
        { error: "Forwarder address not configured" },
        { status: 500 }
      );
    }

    // Connect to network
    const provider = new JsonRpcProvider(rpcUrl);
    const relayer = new Wallet(relayerPrivateKey, provider);
    const forwarder = new Contract(forwarderAddress, MinimalForwarderABI, relayer);

    console.log("Relayer address:", await relayer.getAddress());
    console.log("Relayer balance:", await provider.getBalance(relayer.address));

    // Verify the signature first
    const isValid = await forwarder.verify(forwardRequest, signature);
    
    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 }
      );
    }

    // Execute the meta-transaction
    console.log("Executing meta-transaction...");
    const tx = await forwarder.execute(forwardRequest, signature);
    console.log("Transaction sent:", tx.hash);

    const receipt = await tx.wait();
    console.log("Transaction confirmed:", receipt?.hash);

    return NextResponse.json({
      success: true,
      txHash: receipt?.hash,
      blockNumber: receipt?.blockNumber,
    });

  } catch (error: any) {
    console.error("Error in relay:", error);
    
    let errorMessage = error.message || "Unknown error";
    
    // Extract revert reason if available (contract error messages)
    if (error.reason) {
      errorMessage = error.reason;
    } else if (error.data?.message) {
      errorMessage = error.data.message;
    } else if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (typeof error.shortMessage === 'string') {
      errorMessage = error.shortMessage;
    }
    
    // Extract contract revert messages from error data
    if (error.info?.error?.data?.message) {
      errorMessage = error.info.error.data.message;
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
