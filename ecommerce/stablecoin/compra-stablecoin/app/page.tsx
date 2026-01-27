'use client'

import { useState, useEffect } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import EuroTokenPurchase from '@/components/EuroTokenPurchase'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '')

export default function Home() {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return <div className="min-h-screen flex items-center justify-center">Cargando...</div>
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-8 text-gray-900 dark:text-white">
            Comprar EuroTokens (EURT)
          </h1>
          <p className="text-center text-gray-600 dark:text-gray-300 mb-8">
            1 EURT = 1 EUR. Compra tokens con tu tarjeta de crédito.
          </p>

          <EuroTokenPurchase stripePromise={stripePromise} />
        </div>
      </div>
    </main>
  )
}
