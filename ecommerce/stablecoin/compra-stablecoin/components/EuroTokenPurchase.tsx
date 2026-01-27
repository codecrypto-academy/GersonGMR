'use client'

import { useState, useEffect } from 'react'
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js'
import { ethers } from 'ethers'
import { EuroTokenABI } from '@/lib/contracts'

const EUROTOKEN_ADDRESS = process.env.NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS || ''

export default function EuroTokenPurchase() {
  const stripe = useStripe()
  const elements = useElements()
  
  const [walletAddress, setWalletAddress] = useState<string>('')
  const [isConnected, setIsConnected] = useState(false)
  const [amount, setAmount] = useState<string>('100')
  const [loading, setLoading] = useState(false)
  const [balance, setBalance] = useState<string>('0')
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState<string>('')

  useEffect(() => {
    checkConnection()
  }, [])

  useEffect(() => {
    if (isConnected && walletAddress) {
      loadBalance()
    }
  }, [isConnected, walletAddress])

  const checkConnection = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum)
        const accounts = await provider.listAccounts()
        if (accounts.length > 0) {
          setWalletAddress(accounts[0].address)
          setIsConnected(true)
        }
      } catch (err) {
        console.error('Error checking connection:', err)
      }
    }
  }

  const connectWallet = async () => {
    if (typeof window.ethereum === 'undefined') {
      setError('MetaMask no está instalado. Por favor instálalo desde https://metamask.io')
      return
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      await provider.send('eth_requestAccounts', [])
      const signer = await provider.getSigner()
      const address = await signer.getAddress()
      
      setWalletAddress(address)
      setIsConnected(true)
      setError('')
    } catch (err: any) {
      setError('Error al conectar wallet: ' + (err.message || 'Error desconocido'))
    }
  }

  const loadBalance = async () => {
    if (!walletAddress || !EUROTOKEN_ADDRESS) return

    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const contract = new ethers.Contract(EUROTOKEN_ADDRESS, EuroTokenABI, provider)
      const balance = await contract.balanceOf(walletAddress)
      const formattedBalance = ethers.formatUnits(balance, 6)
      setBalance(formattedBalance)
    } catch (err) {
      console.error('Error loading balance:', err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!stripe || !elements || !isConnected) {
      setError('Por favor conecta tu wallet primero')
      return
    }

    const amountNum = parseFloat(amount)
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('Por favor ingresa una cantidad válida')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      // Crear Payment Intent en el backend
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amountNum,
          walletAddress,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al crear payment intent')
      }

      const { clientSecret } = await response.json()

      // Confirmar pago con Stripe
      const { error: stripeError } = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}?payment=success`,
        },
      })

      if (stripeError) {
        throw new Error(stripeError.message)
      }

      // El webhook procesará el mint de tokens
      setSuccess('Pago procesado. Los tokens se acreditarán en breve.')
    } catch (err: any) {
      setError(err.message || 'Error al procesar el pago')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      {!isConnected ? (
        <div className="text-center">
          <button
            onClick={connectWallet}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            Conectar MetaMask
          </button>
          {error && <p className="text-red-500 mt-4">{error}</p>}
        </div>
      ) : (
        <>
          <div className="mb-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">Wallet conectada:</p>
            <p className="font-mono text-sm break-all">{walletAddress}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Balance: <span className="font-bold">{balance} EURT</span>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Cantidad de EURT a comprar
              </label>
              <input
                id="amount"
                type="number"
                step="0.01"
                min="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                Costo: €{amount}
              </p>
            </div>

            <div>
              <PaymentElement />
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <p className="text-red-800 dark:text-red-200">{error}</p>
              </div>
            )}

            {success && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <p className="text-green-800 dark:text-green-200">{success}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={!stripe || loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-lg transition-colors"
            >
              {loading ? 'Procesando...' : `Comprar ${amount} EURT`}
            </button>
          </form>
        </>
      )}
    </div>
  )
}
