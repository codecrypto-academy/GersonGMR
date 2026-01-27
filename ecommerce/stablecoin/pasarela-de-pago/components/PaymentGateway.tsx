'use client'

import { useState, useEffect, useCallback } from 'react'
import { ethers } from 'ethers'
import { EuroTokenABI, EcommerceABI } from '@/lib/contracts'

const EUROTOKEN_ADDRESS = process.env.NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS || ''
const ECOMMERCE_ADDRESS = process.env.NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS || ''
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'http://localhost:8545'
const DISCONNECT_STORAGE_KEY = 'pasarela-de-pago_wallet_disconnected'

interface PaymentGatewayProps {
  merchantAddress: string
  amount: string
  invoice: string
  date: string
  redirect: string
}

export default function PaymentGateway({
  merchantAddress,
  amount,
  invoice,
  date,
  redirect,
}: PaymentGatewayProps) {
  const [walletAddress, setWalletAddress] = useState<string>('')
  const [isConnected, setIsConnected] = useState(false)
  const [balance, setBalance] = useState<string>('0')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState<string>('')
  const [txHash, setTxHash] = useState<string>('')

  const checkConnection = useCallback(async () => {
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
  }, [])

  useEffect(() => {
    checkConnection()
  }, [checkConnection])

  useEffect(() => {
    if (isConnected && walletAddress) {
      loadBalance()
    }
  }, [isConnected, walletAddress])

  useEffect(() => {
    if (typeof window.ethereum === 'undefined') return
    const onAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        setWalletAddress('')
        setIsConnected(false)
        return
      }
      if (localStorage.getItem(DISCONNECT_STORAGE_KEY) === '1') return
      setWalletAddress(accounts[0])
      setIsConnected(true)
    }
    window.ethereum.on('accountsChanged', onAccountsChanged)
    return () => {
      window.ethereum.removeListener('accountsChanged', onAccountsChanged)
    }
  }, [])

  const connectWallet = async () => {
    if (typeof window.ethereum === 'undefined') {
      setError('MetaMask no está instalado')
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
          // Si la wallet no soporta revokePermissions, seguimos normal
        }
      }
      const provider = new ethers.BrowserProvider(window.ethereum)
      await provider.send('eth_requestAccounts', [])
      const signer = await provider.getSigner()
      const address = await signer.getAddress()

      setWalletAddress(address)
      setIsConnected(true)
      setError('')
      localStorage.removeItem(DISCONNECT_STORAGE_KEY)
    } catch (err: any) {
      setError('Error al conectar wallet: ' + err.message)
    }
  }

  const disconnectWallet = () => {
    setWalletAddress('')
    setIsConnected(false)
    setError('')
    setSuccess('')
    setTxHash('')
    localStorage.setItem(DISCONNECT_STORAGE_KEY, '1')
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

  const handlePayment = async () => {
    if (!isConnected || !walletAddress) {
      setError('Por favor conecta tu wallet primero')
      return
    }

    const amountNum = parseFloat(amount)
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('Monto inválido')
      return
    }

    const balanceNum = parseFloat(balance)
    if (balanceNum < amountNum) {
      setError('Saldo insuficiente. Por favor compra más tokens.')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()

      // Convertir amount a unidades con 6 decimales
      const amountInWei = ethers.parseUnits(amountNum.toString(), 6)

      // Aprobar gasto de tokens al contrato Ecommerce
      const tokenContract = new ethers.Contract(EUROTOKEN_ADDRESS, EuroTokenABI, signer)
      const approveTx = await tokenContract.approve(ECOMMERCE_ADDRESS, amountInWei)
      await approveTx.wait()

      // Obtener invoiceId desde el parámetro invoice (asumiendo formato "INV-001" o número)
      const invoiceId = invoice.replace('INV-', '') || '1'

      // Procesar pago en el contrato Ecommerce
      const ecommerceContract = new ethers.Contract(ECOMMERCE_ADDRESS, EcommerceABI, signer)
      const paymentTx = await ecommerceContract.processPayment(walletAddress, invoiceId)
      const receipt = await paymentTx.wait()

      setTxHash(receipt.hash)
      setSuccess('Pago procesado exitosamente!')

      // Redirigir después de 3 segundos
      setTimeout(() => {
        if (redirect) {
          window.location.href = `${redirect}?payment=success&tx=${receipt.hash}&invoice=${invoice}`
        }
      }, 3000)
    } catch (err: any) {
      setError(err.message || 'Error al procesar el pago')
    } finally {
      setLoading(false)
    }
  }

  if (!merchantAddress || !amount) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <p className="text-red-500">Parámetros de pago inválidos</p>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">Detalles del Pago</h2>
        <div className="space-y-2 text-sm">
          <p><span className="font-semibold">Factura:</span> {invoice}</p>
          <p><span className="font-semibold">Fecha:</span> {date}</p>
          <p><span className="font-semibold">Monto:</span> {amount} EURT</p>
          <p><span className="font-semibold">Destinatario:</span> <span className="font-mono text-xs break-all">{merchantAddress}</span></p>
        </div>
      </div>

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
              Wallet conectada
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-mono text-sm font-medium text-gray-900 dark:text-gray-100" title={walletAddress}>
                {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
              </p>
              <button
                type="button"
                onClick={disconnectWallet}
                className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 underline"
              >
                Desconectar
              </button>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Balance: <span className="font-bold text-gray-900 dark:text-white">{balance} EURT</span>
            </p>
            {parseFloat(balance) < parseFloat(amount) && (
              <p className="text-red-500 text-sm mt-2">
                Saldo insuficiente. <a href="http://localhost:6001" className="underline">Comprar tokens</a>
              </p>
            )}
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
              <p className="text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-4">
              <p className="text-green-800 dark:text-green-200">{success}</p>
              {txHash && (
                <p className="text-sm mt-2">
                  TX Hash: <span className="font-mono break-all">{txHash}</span>
                </p>
              )}
            </div>
          )}

          <button
            onClick={handlePayment}
            disabled={loading || parseFloat(balance) < parseFloat(amount)}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            {loading ? 'Procesando...' : `Pagar ${amount} EURT`}
          </button>
        </>
      )}
    </div>
  )
}
