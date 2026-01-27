import { NextRequest, NextResponse } from 'next/server'
import { ethers } from 'ethers'
import { EuroTokenABI } from '@/lib/contracts'

const EUROTOKEN_ADDRESS = process.env.NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS || ''
const PRIVATE_KEY = process.env.PRIVATE_KEY || ''
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'http://localhost:8545'
const MINT_INTERNAL_SECRET = process.env.MINT_INTERNAL_SECRET || ''

export async function POST(request: NextRequest) {
  try {
    if (MINT_INTERNAL_SECRET) {
      const secret = request.headers.get('x-mint-internal-secret')
      if (secret !== MINT_INTERNAL_SECRET) {
        console.warn('[mint-tokens] Rechazado: header x-mint-internal-secret ausente o incorrecto')
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    const body = await request.json()
    const { walletAddress, amount } = body
    console.log('[mint-tokens] Llamada recibida', { walletAddress, amount })

    if (!walletAddress || !amount) {
      return NextResponse.json(
        { error: 'Wallet address y amount requeridos' },
        { status: 400 }
      )
    }

    if (!ethers.isAddress(walletAddress)) {
      return NextResponse.json(
        { error: 'Dirección de wallet inválida' },
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
    console.log('[mint-tokens] Mint OK', { txHash: tx.hash, to: walletAddress, amount: amountInWei.toString() })

    return NextResponse.json({
      success: true,
      txHash: tx.hash,
    })
  } catch (error: any) {
    console.error('[mint-tokens] Error:', error?.message ?? error)
    return NextResponse.json(
      { error: error.message || 'Error al hacer mint de tokens' },
      { status: 500 }
    )
  }
}
