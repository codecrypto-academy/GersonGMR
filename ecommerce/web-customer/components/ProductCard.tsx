'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ethers } from 'ethers'
import { EcommerceABI } from '@/lib/contracts'

const ECOMMERCE_ADDRESS = process.env.NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS || ''

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

interface ProductCardProps {
  product: Product
  isConnected: boolean
  walletAddress: string
}

export default function ProductCard({ product, isConnected, walletAddress }: ProductCardProps) {
  const [loading, setLoading] = useState(false)
  const [quantity, setQuantity] = useState(1)

  const addToCart = async () => {
    if (!isConnected) {
      alert('Por favor conecta tu wallet primero')
      return
    }

    setLoading(true)
    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const contract = new ethers.Contract(ECOMMERCE_ADDRESS, EcommerceABI, signer)

      const tx = await contract.addToCart(product.productId, quantity)
      await tx.wait()

      alert('Producto agregado al carrito')
    } catch (err: any) {
      alert('Error: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
      <div className="h-48 bg-gray-200 dark:bg-gray-700 flex items-center justify-center relative">
        {product.ipfsImageHash ? (
          <Image
            src={`https://ipfs.io/ipfs/${product.ipfsImageHash}`}
            alt={product.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <span className="text-gray-400">Sin imagen</span>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-bold text-lg mb-2">{product.name}</h3>
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-2 line-clamp-2">
          {product.description}
        </p>
        <div className="flex justify-between items-center mb-4">
          <span className="font-bold text-blue-600 text-xl">€{product.price}</span>
          <span className="text-sm text-gray-500">Stock: {product.stock}</span>
        </div>
        {isConnected && product.stock > 0 && (
          <div className="space-y-2">
            <input
              type="number"
              min="1"
              max={product.stock}
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700"
            />
            <button
              onClick={addToCart}
              disabled={loading || product.stock === 0}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-2 rounded-lg"
            >
              {loading ? 'Agregando...' : 'Agregar al Carrito'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
