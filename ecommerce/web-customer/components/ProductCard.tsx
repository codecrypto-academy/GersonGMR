'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ethers } from 'ethers'
import { EcommerceABI } from '@/lib/contracts'

const ECOMMERCE_ADDRESS = process.env.NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS || ''

/** Extrae solo el CID de un valor que puede ser "Qm...", "ipfs://Qm...", "https://ipfs.io/ipfs/Qm...", etc. */
function getIpfsCid(value: string): string {
  if (!value || typeof value !== 'string') return ''
  const s = value.trim()
  if (!s) return ''
  const m = s.match(/\/ipfs\/([^/?#]+)/)
  if (m) return m[1]
  if (s.startsWith('ipfs://')) return s.slice(7).trim()
  return s
}

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
  const [imgError, setImgError] = useState(false)

  const ipfsCid = getIpfsCid(product.ipfsImageHash || '')
  const showImage = ipfsCid && !imgError
  const imageUrl = ipfsCid
    ? `https://cloudflare-ipfs.com/ipfs/${ipfsCid}`
    : ''

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
      <div className="h-48 bg-gray-200 dark:bg-gray-700 flex items-center justify-center relative overflow-hidden">
        {showImage ? (
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            onError={() => setImgError(true)}
            unoptimized
          />
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 text-gray-400 dark:text-gray-500">
            <svg className="w-12 h-12 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-xs font-medium">Sin imagen</span>
          </div>
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
