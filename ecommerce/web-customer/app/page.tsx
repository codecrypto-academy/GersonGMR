'use client'

import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { EcommerceABI } from '@/lib/contracts'
import ProductCard from '@/components/ProductCard'

const ECOMMERCE_ADDRESS = process.env.NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS || ''
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'http://localhost:8545'

interface Product {
  productId: number
  companyId: number
  name: string
  description: string
  price: string
  stock: number
  ipfsImageHash: string
  isActive: boolean
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [walletAddress, setWalletAddress] = useState<string>('')
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    loadProducts()
    checkConnection()
  }, [])

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
      alert('MetaMask no está instalado')
      return
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      await provider.send('eth_requestAccounts', [])
      const signer = await provider.getSigner()
      const address = await signer.getAddress()
      setWalletAddress(address)
      setIsConnected(true)
    } catch (err) {
      console.error('Error connecting wallet:', err)
    }
  }

  const loadProducts = async () => {
    try {
      const provider = new ethers.JsonRpcProvider(RPC_URL)
      const contract = new ethers.Contract(ECOMMERCE_ADDRESS, EcommerceABI, provider)
      const productsData = await contract.getAllProducts()
      
      const formattedProducts = productsData.map((p: any) => ({
        productId: Number(p.productId),
        companyId: Number(p.companyId),
        name: p.name,
        description: p.description,
        price: ethers.formatUnits(p.price, 6),
        stock: Number(p.stock),
        ipfsImageHash: p.ipfsImageHash,
        isActive: p.isActive,
      }))
      
      setProducts(formattedProducts)
    } catch (err) {
      console.error('Error loading products:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            Catálogo de Productos
          </h1>
          {!isConnected ? (
            <button
              onClick={connectWallet}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
            >
              Conectar Wallet
            </button>
          ) : (
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <span className="font-mono">{walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</span>
            </div>
          )}
        </div>

        {loading ? (
          <div className="text-center py-12">Cargando productos...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard
                key={product.productId}
                product={product}
                isConnected={isConnected}
                walletAddress={walletAddress}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
