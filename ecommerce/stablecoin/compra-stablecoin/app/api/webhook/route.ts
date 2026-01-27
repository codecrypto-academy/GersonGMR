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
    const walletAddress = paymentIntent.metadata?.walletAddress
    const tokenAmount = paymentIntent.metadata?.tokenAmount

    console.log('[webhook] payment_intent.succeeded', {
      paymentIntentId: paymentIntent.id,
      walletAddress: walletAddress ?? '(empty)',
      tokenAmount: tokenAmount ?? '(empty)',
    })

    if (walletAddress && tokenAmount) {
      const baseUrl =
        process.env.NEXT_PUBLIC_APP_URL ||
        (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : request.nextUrl.origin)
      const mintUrl = `${baseUrl.replace(/\/$/, '')}/api/mint-tokens`

      try {
        const mintSecret = process.env.MINT_INTERNAL_SECRET
        const response = await fetch(mintUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(mintSecret && { 'x-mint-internal-secret': mintSecret }),
          },
          body: JSON.stringify({
            walletAddress,
            amount: tokenAmount,
          }),
        })

        const text = await response.text()
        if (response.ok) {
          console.log('[webhook] mint-tokens OK', text)
        } else {
          console.error('[webhook] mint-tokens failed', response.status, text)
        }
      } catch (error) {
        console.error('[webhook] Error calling mint endpoint:', error)
      }
    } else {
      console.warn('[webhook] payment_intent.succeeded sin walletAddress o tokenAmount; no se llama a mint-tokens')
    }
  }

  return NextResponse.json({ received: true })
}
