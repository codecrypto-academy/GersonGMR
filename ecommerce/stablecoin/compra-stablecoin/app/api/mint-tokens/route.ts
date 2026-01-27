import { NextRequest, NextResponse } from 'next/server'
import { ethers } from 'ethers'
import { EuroTokenABI } from '@/lib/contracts'

const EUROTOKEN_ADDRESS = process.env.NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS || ''
const PRIVATE_KEY = process.env.PRIVATE_KEY || ''
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'http://localhost:8545'

export async function POST(request: NextRequest) {
  try {
    const { walletAddress, amount } = await request.json()

    if (!walletAddress || !amount) {
      return NextResponse.json(
        { error: 'Wallet address y amount requeridos' },
        { status: 400 }
      )
    }

    if (!PRIVATE_KEY) {
      return NextResponse.json(
        { error: 'Private key no configurada' },
        { status: 500 }
      )
    }

    // Conectar a la blockchain
    const provider = new ethers.JsonRpcProvider(RPC_URL)
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider)

    // Instanciar contrato
    const contract = new ethers.Contract(EUROTOKEN_ADDRESS, EuroTokenABI, wallet)

    // Convertir amount a unidades con 6 decimales
    const amountInWei = ethers.parseUnits(amount.toString(), 6)

    // Hacer mint
    const tx = await contract.mint(walletAddress, amountInWei)
    await tx.wait()

    return NextResponse.json({
      success: true,
      txHash: tx.hash,
    })
  } catch (error: any) {
    console.error('Error minting tokens:', error)
    return NextResponse.json(
      { error: error.message || 'Error al hacer mint de tokens' },
      { status: 500 }
    )
  }
}
