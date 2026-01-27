'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Elements, useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js'
import type { Stripe } from '@stripe/stripe-js'
import { ethers } from 'ethers'
import { EuroTokenABI } from '@/lib/contracts'

const EUROTOKEN_ADDRESS = process.env.NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS || ''
const DISCONNECT_STORAGE_KEY = 'compra-stablecoin_wallet_disconnected'
/** Balance inicial minteado al deployer en el script de deploy (6 decimales → 1_000_000 en unidades) */
const DEPLOY_INITIAL_SUPPLY = 1_000_000

type StripePromise = Promise<Stripe | null>

interface PaymentFormProps {
  clientSecret: string
  amount: string
  walletAddress: string
  onSuccess: () => void
  onCancel: () => void
}

function PaymentForm({ clientSecret, amount, walletAddress, onSuccess, onCancel }: PaymentFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return

    setLoading(true)
    setError('')

    try {
      const { error: submitError } = await elements.submit()
      if (submitError) throw new Error(submitError.message)

      const { error: stripeError } = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}?payment=success`,
        },
      })
      if (stripeError) throw new Error(stripeError.message)
      onSuccess()
    } catch (err: any) {
      setError(err.message || 'Error al procesar el pago')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="mb-2">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Comprando <span className="font-bold">{amount} EURT</span> para {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
        </p>
      </div>
      <PaymentElement />
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          Volver
        </button>
        <button
          type="submit"
          disabled={!stripe || loading}
          className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-lg"
        >
          {loading ? 'Procesando...' : `Pagar €${amount}`}
        </button>
      </div>
    </form>
  )
}

interface EuroTokenPurchaseProps {
  stripePromise: StripePromise
}

export default function EuroTokenPurchase({ stripePromise }: EuroTokenPurchaseProps) {
  const searchParams = useSearchParams()
  const [walletAddress, setWalletAddress] = useState<string>('')
  const [isConnected, setIsConnected] = useState(false)
  const [amount, setAmount] = useState<string>('100')
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [balance, setBalance] = useState<string>('0')
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState<string>('')

  useEffect(() => {
    checkConnection()
  }, [])

  useEffect(() => {
    if (isConnected && walletAddress) loadBalance()
  }, [isConnected, walletAddress])

  // Al volver de Stripe con ?payment=success: mostrar mensaje, refrescar balance y limpiar URL
  useEffect(() => {
    if (searchParams.get('payment') !== 'success') return
    setSuccess('Pago completado. Los EURT se han acreditado.')
    const t = setTimeout(() => {
      if (walletAddress) loadBalance()
    }, 2500)
    if (typeof window !== 'undefined') {
      const u = new URL(window.location.href)
      u.searchParams.delete('payment')
      window.history.replaceState({}, '', u.pathname + (u.search || ''))
    }
    return () => clearTimeout(t)
  }, [searchParams, walletAddress])

  const balanceNum = parseFloat(balance)
  const isDeployerInitialSupply = !isNaN(balanceNum) && Math.abs(balanceNum - DEPLOY_INITIAL_SUPPLY) < 0.01

  useEffect(() => {
    if (typeof window.ethereum === 'undefined') return
    const onAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        setWalletAddress('')
        setIsConnected(false)
        setClientSecret(null)
        return
      }
      if (localStorage.getItem(DISCONNECT_STORAGE_KEY) === '1') return
      setWalletAddress(accounts[0])
      setIsConnected(true)
      setClientSecret((prev) => (prev ? null : prev))
    }
    window.ethereum.on('accountsChanged', onAccountsChanged)
    return () => {
      window.ethereum.removeListener('accountsChanged', onAccountsChanged)
    }
  }, [])

  const checkConnection = async () => {
    if (typeof window === 'undefined' || localStorage.getItem(DISCONNECT_STORAGE_KEY) === '1') return
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
      if (localStorage.getItem(DISCONNECT_STORAGE_KEY) === '1') {
        try {
          await window.ethereum.request({
            method: 'wallet_revokePermissions',
            params: [{ eth_accounts: {} }],
          })
        } catch {
          // Si la wallet no soporta revokePermissions, seguimos con la conexión normal
        }
      }
      const provider = new ethers.BrowserProvider(window.ethereum)
      await provider.send('eth_requestAccounts', [])
      const signer = await provider.getSigner()
      setWalletAddress(await signer.getAddress())
      setIsConnected(true)
      setError('')
      localStorage.removeItem(DISCONNECT_STORAGE_KEY)
    } catch (err: any) {
      setError('Error al conectar wallet: ' + (err.message || 'Error desconocido'))
    }
  }

  const loadBalance = async () => {
    if (!walletAddress || !EUROTOKEN_ADDRESS) return
    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const contract = new ethers.Contract(EUROTOKEN_ADDRESS, EuroTokenABI, provider)
      const bal = await contract.balanceOf(walletAddress)
      setBalance(ethers.formatUnits(bal, 6))
    } catch (err) {
      console.error('Error loading balance:', err)
    }
  }

  const handleContinueToPayment = async () => {
    const amountNum = parseFloat(amount)
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('Por favor ingresa una cantidad válida')
      return
    }
    if (!walletAddress) {
      setError('Conecta tu wallet primero')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: amountNum, walletAddress }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Error al crear payment intent')
      setClientSecret(data.clientSecret)
    } catch (err: any) {
      setError(err.message || 'Error al preparar el pago')
    } finally {
      setLoading(false)
    }
  }

  if (clientSecret && stripePromise) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <PaymentForm
            clientSecret={clientSecret}
            amount={amount}
            walletAddress={walletAddress}
            onSuccess={() => setSuccess('Pago procesado. Los tokens se acreditarán en breve.')}
            onCancel={() => setClientSecret(null)}
          />
        </Elements>
      </div>
    )
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
          <div className="mb-6 p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
              Wallet conectada (recibirá los EURT)
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-mono text-base font-medium text-gray-900 dark:text-gray-100" title={walletAddress}>
                {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
              </p>
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(walletAddress)}
                className="text-xs px-2 py-1 rounded bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500"
              >
                Copiar
              </button>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">
              Balance: <span className="font-bold text-gray-900 dark:text-white">{balance} EURT</span>
            </p>
            {isDeployerInitialSupply && (
              <p className="text-xs text-amber-700 dark:text-amber-400 mt-1" role="note">
                Si esta es la cuenta que desplegó EuroToken, 1.000.000 EURT es el supply inicial del script de deploy.
              </p>
            )}
            <button
              type="button"
              onClick={() => {
                setWalletAddress('')
                setIsConnected(false)
                setClientSecret(null)
                setError('')
                setSuccess('')
                localStorage.setItem(DISCONNECT_STORAGE_KEY, '1')
              }}
              className="mt-3 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 underline"
            >
              Desconectar wallet
            </button>
          </div>

          <div className="space-y-6">
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
              <p className="text-sm text-gray-500 mt-1">Costo: €{amount}</p>
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
              type="button"
              onClick={handleContinueToPayment}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-lg"
            >
              {loading ? 'Preparando...' : 'Continuar al pago'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
