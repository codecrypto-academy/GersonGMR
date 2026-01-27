import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-11-20.acacia',
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || ''

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json(
      { error: 'No signature' },
      { status: 400 }
    )
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    )
  }

  // Manejar evento de pago exitoso
  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent
    const walletAddress = paymentIntent.metadata.walletAddress
    const tokenAmount = paymentIntent.metadata.tokenAmount

    if (walletAddress && tokenAmount) {
      try {
        // Llamar al endpoint de mint
        const response = await fetch(`${request.nextUrl.origin}/api/mint-tokens`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            walletAddress,
            amount: tokenAmount,
          }),
        })

        if (!response.ok) {
          console.error('Error minting tokens:', await response.text())
        }
      } catch (error) {
        console.error('Error calling mint endpoint:', error)
      }
    }
  }

  return NextResponse.json({ received: true })
}
