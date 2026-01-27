'use client'

import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { EcommerceABI } from '@/lib/contracts'
import WalletConnect from '@/components/WalletConnect'
import CompanyRegistration from '@/components/CompanyRegistration'
import Dashboard from '@/components/Dashboard'

const ECOMMERCE_ADDRESS = process.env.NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS || ''
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'http://localhost:8545'

export default function Home() {
  const [walletAddress, setWalletAddress] = useState<string>('')
  const [isConnected, setIsConnected] = useState(false)
  const [companyId, setCompanyId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    checkConnection()
  }, [])

  useEffect(() => {
    if (isConnected && walletAddress) {
      loadCompanyId()
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

  const loadCompanyId = async () => {
    if (!walletAddress || !ECOMMERCE_ADDRESS) return

    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const contract = new ethers.Contract(ECOMMERCE_ADDRESS, EcommerceABI, provider)
      const id = await contract.getCompanyIdByAddress(walletAddress)
      if (id > 0) {
        setCompanyId(Number(id))
      }
    } catch (err) {
      console.error('Error loading company ID:', err)
    }
  }

  const handleConnect = (address: string) => {
    setWalletAddress(address)
    setIsConnected(true)
  }

  const handleCompanyRegistered = (id: number) => {
    setCompanyId(id)
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8 text-gray-900 dark:text-white">
          Panel de Administración
        </h1>

        {!isConnected ? (
          <WalletConnect onConnect={handleConnect} />
        ) : companyId === null ? (
          <CompanyRegistration
            walletAddress={walletAddress}
            onRegistered={handleCompanyRegistered}
          />
        ) : (
          <Dashboard walletAddress={walletAddress} companyId={companyId} />
        )}
      </div>
    </main>
  )
}
