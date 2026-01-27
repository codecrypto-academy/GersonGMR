'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import PaymentGateway from '@/components/PaymentGateway'

export default function Home() {
  const searchParams = useSearchParams()
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return <div className="min-h-screen flex items-center justify-center">Cargando...</div>
  }

  const merchantAddress = searchParams.get('merchant_address') || ''
  const amount = searchParams.get('amount') || '0'
  const invoice = searchParams.get('invoice') || ''
  const date = searchParams.get('date') || ''
  const redirect = searchParams.get('redirect') || ''

  return (
    <main className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-8 text-gray-900 dark:text-white">
            Pasarela de Pago
          </h1>
          <PaymentGateway
            merchantAddress={merchantAddress}
            amount={amount}
            invoice={invoice}
            date={date}
            redirect={redirect}
          />
        </div>
      </div>
    </main>
  )
}
