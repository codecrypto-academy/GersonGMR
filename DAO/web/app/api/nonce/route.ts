import { NextRequest, NextResponse } from "next/server";
import { JsonRpcProvider, Contract } from "ethers";
import { MinimalForwarderABI } from "@/lib/contracts";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const address = searchParams.get("address");

    if (!address) {
      return NextResponse.json(
        { error: "Address parameter required" },
        { status: 400 }
      );
    }

    const rpcUrl = process.env.RPC_URL || "http://127.0.0.1:8545";
    const forwarderAddress = process.env.NEXT_PUBLIC_FORWARDER_ADDRESS;

    if (!forwarderAddress) {
      return NextResponse.json(
        { error: "Forwarder address not configured" },
        { status: 500 }
      );
    }

    const provider = new JsonRpcProvider(rpcUrl);
    const forwarder = new Contract(forwarderAddress, MinimalForwarderABI, provider);

    const nonce = await forwarder.getNonce(address);

    return NextResponse.json({ nonce: nonce.toString() });

  } catch (error: any) {
    console.error("Error getting nonce:", error);
    return NextResponse.json(
      { error: error.message || "Failed to get nonce" },
      { status: 500 }
    );
  }
}
