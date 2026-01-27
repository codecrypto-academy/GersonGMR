'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { ethers } from 'ethers'

const DISCONNECT_STORAGE_KEY = 'web-customer_wallet_disconnected'

interface WalletContextValue {
  walletAddress: string
  isConnected: boolean
  connectWallet: () => Promise<void>
  disconnectWallet: () => void
}

const WalletContext = createContext<WalletContextValue | null>(null)

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [walletAddress, setWalletAddress] = useState<string>('')
  const [isConnected, setIsConnected] = useState(false)

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

  const connectWallet = useCallback(async () => {
    if (typeof window.ethereum === 'undefined') {
      alert('MetaMask no está instalado')
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
      localStorage.removeItem(DISCONNECT_STORAGE_KEY)
    } catch (err) {
      console.error('Error connecting wallet:', err)
    }
  }, [])

  const disconnectWallet = useCallback(() => {
    setWalletAddress('')
    setIsConnected(false)
    localStorage.setItem(DISCONNECT_STORAGE_KEY, '1')
  }, [])

  return (
    <WalletContext.Provider
      value={{
        walletAddress,
        isConnected,
        connectWallet,
        disconnectWallet,
      }}
    >
      {children}
    </WalletContext.Provider>
  )
}

export function useWallet() {
  const ctx = useContext(WalletContext)
  if (!ctx) throw new Error('useWallet must be used within WalletProvider')
  return ctx
}
