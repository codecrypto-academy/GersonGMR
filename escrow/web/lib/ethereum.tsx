'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { BrowserProvider, JsonRpcSigner, Contract } from 'ethers'
import { ESCROW_ADDRESS, ESCROW_ABI, ERC20_ABI } from './contracts'

// Declaración de tipos para window.ethereum
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>
      on: (event: string, callback: (...args: unknown[]) => void) => void
      removeListener: (event: string, callback: (...args: unknown[]) => void) => void
      isMetaMask?: boolean
    }
  }
}

interface EthereumContextType {
  provider: BrowserProvider | null
  signer: JsonRpcSigner | null
  account: string | null
  chainId: number | null
  isConnected: boolean
  isConnecting: boolean
  connect: () => Promise<void>
  disconnect: () => void
  escrowContract: Contract | null
  getTokenContract: (address: string) => Contract | null
  error: string | null
}

const EthereumContext = createContext<EthereumContextType | null>(null)

export function EthereumProvider({ children }: { children: ReactNode }) {
  const [provider, setProvider] = useState<BrowserProvider | null>(null)
  const [signer, setSigner] = useState<JsonRpcSigner | null>(null)
  const [account, setAccount] = useState<string | null>(null)
  const [chainId, setChainId] = useState<number | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [escrowContract, setEscrowContract] = useState<Contract | null>(null)

  const isConnected = !!account

  // Inicializar contratos cuando hay signer
  useEffect(() => {
    if (signer && ESCROW_ADDRESS) {
      const contract = new Contract(ESCROW_ADDRESS, ESCROW_ABI, signer)
      setEscrowContract(contract)
    } else {
      setEscrowContract(null)
    }
  }, [signer])

  // Obtener contrato de token ERC20
  const getTokenContract = useCallback((address: string): Contract | null => {
    if (!signer) return null
    return new Contract(address, ERC20_ABI, signer)
  }, [signer])

  // Conectar wallet
  const connect = useCallback(async () => {
    if (typeof window === 'undefined' || !window.ethereum) {
      setError('MetaMask no está instalado. Por favor instala MetaMask.')
      return
    }

    setIsConnecting(true)
    setError(null)

    try {
      const browserProvider = new BrowserProvider(window.ethereum)
      
      // Solicitar cuentas
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      }) as string[]

      if (accounts.length === 0) {
        throw new Error('No se encontraron cuentas')
      }

      const walletSigner = await browserProvider.getSigner()
      const network = await browserProvider.getNetwork()

      setProvider(browserProvider)
      setSigner(walletSigner)
      setAccount(accounts[0])
      setChainId(Number(network.chainId))
    } catch (err) {
      console.error('Error al conectar:', err)
      setError(err instanceof Error ? err.message : 'Error al conectar wallet')
    } finally {
      setIsConnecting(false)
    }
  }, [])

  // Desconectar
  const disconnect = useCallback(() => {
    setProvider(null)
    setSigner(null)
    setAccount(null)
    setChainId(null)
    setEscrowContract(null)
    setError(null)
  }, [])

  // Manejar cambios de cuenta
  const handleAccountsChanged = useCallback((accounts: unknown) => {
    const accountsArray = accounts as string[]
    if (accountsArray.length === 0) {
      disconnect()
    } else {
      setAccount(accountsArray[0])
      // Re-obtener signer
      if (provider) {
        provider.getSigner().then(setSigner).catch(console.error)
      }
    }
  }, [disconnect, provider])

  // Manejar cambios de red
  const handleChainChanged = useCallback((chainIdHex: unknown) => {
    const newChainId = parseInt(chainIdHex as string, 16)
    setChainId(newChainId)
    // Recargar la página para reiniciar el estado
    window.location.reload()
  }, [])

  // Configurar listeners de MetaMask
  useEffect(() => {
    if (typeof window === 'undefined' || !window.ethereum) return

    window.ethereum.on('accountsChanged', handleAccountsChanged)
    window.ethereum.on('chainChanged', handleChainChanged)

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged)
        window.ethereum.removeListener('chainChanged', handleChainChanged)
      }
    }
  }, [handleAccountsChanged, handleChainChanged])

  // Auto-conectar si ya estaba conectado
  useEffect(() => {
    if (typeof window === 'undefined' || !window.ethereum) return

    const checkConnection = async () => {
      try {
        const accounts = await window.ethereum!.request({
          method: 'eth_accounts'
        }) as string[]

        if (accounts.length > 0) {
          connect()
        }
      } catch (err) {
        console.error('Error al verificar conexión:', err)
      }
    }

    checkConnection()
  }, [connect])

  const value: EthereumContextType = {
    provider,
    signer,
    account,
    chainId,
    isConnected,
    isConnecting,
    connect,
    disconnect,
    escrowContract,
    getTokenContract,
    error
  }

  return (
    <EthereumContext.Provider value={value}>
      {children}
    </EthereumContext.Provider>
  )
}

export function useEthereum() {
  const context = useContext(EthereumContext)
  if (!context) {
    throw new Error('useEthereum debe usarse dentro de EthereumProvider')
  }
  return context
}
