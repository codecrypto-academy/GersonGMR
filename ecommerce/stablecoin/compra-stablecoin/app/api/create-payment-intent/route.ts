import { NextRequest, NextResponse } from 'next/server'
import { ethers } from 'ethers'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-11-20.acacia',
})

export async function POST(request: NextRequest) {
  try {
    const { amount, walletAddress } = await request.json()

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Cantidad inválida' },
        { status: 400 }
      )
    }

    if (!walletAddress || typeof walletAddress !== 'string') {
      return NextResponse.json(
        { error: 'Wallet address requerida' },
        { status: 400 }
      )
    }

    if (!ethers.isAddress(walletAddress)) {
      return NextResponse.json(
        { error: 'Dirección de wallet inválida' },
        { status: 400 }
      )
    }

    // Crear Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convertir a centavos
      currency: 'eur',
      metadata: {
        walletAddress,
        tokenAmount: amount.toString(),
      },
    })

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
    })
  } catch (error: any) {
    console.error('Error creating payment intent:', error)
    return NextResponse.json(
      { error: error.message || 'Error al crear payment intent' },
      { status: 500 }
    )
  }
}
