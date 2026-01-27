'use client'

import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { EcommerceABI } from '@/lib/contracts'

const ECOMMERCE_ADDRESS = process.env.NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS || ''

interface ProductManagementProps {
  walletAddress: string
  companyId: number
}

interface Product {
  productId: number
  name: string
  description: string
  price: string
  stock: number
  ipfsImageHash: string
  isActive: boolean
}

export default function ProductManagement({ walletAddress, companyId }: ProductManagementProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    ipfsImageHash: '',
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadProducts()
  }, [companyId])

  const loadProducts = async () => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const contract = new ethers.Contract(ECOMMERCE_ADDRESS, EcommerceABI, provider)
      const productsData = await contract.getCompanyProducts(companyId)
      
      const formattedProducts = productsData.map((p: any) => ({
        productId: Number(p.productId),
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
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const contract = new ethers.Contract(ECOMMERCE_ADDRESS, EcommerceABI, signer)

      const priceInWei = ethers.parseUnits(formData.price, 6)
      const tx = await contract.addProduct(
        companyId,
        formData.name,
        formData.description,
        priceInWei,
        formData.stock,
        formData.ipfsImageHash
      )
      await tx.wait()

      setFormData({ name: '', description: '', price: '', stock: '', ipfsImageHash: '' })
      setShowForm(false)
      loadProducts()
    } catch (err: any) {
      alert('Error: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Productos</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
        >
          {showForm ? 'Cancelar' : 'Agregar Producto'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Nombre</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Precio (EUR)</label>
              <input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700"
                required
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-2">Descripción</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Stock</label>
              <input
                type="number"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">IPFS Hash (imagen)</label>
              <input
                type="text"
                value={formData.ipfsImageHash}
                onChange={(e) => setFormData({ ...formData, ipfsImageHash: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700"
                placeholder="Qm... o bafybei..."
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Opcional. Sube la imagen en <a href="https://app.pinata.cloud" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 underline">Pinata</a>, <a href="https://web3.storage" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 underline">web3.storage</a> o similar y pega aquí solo el CID (ej. QmXyz… o bafybei…).
              </p>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="mt-4 bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg"
          >
            {loading ? 'Guardando...' : 'Guardar Producto'}
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map((product) => (
          <div key={product.productId} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
            <h3 className="font-bold text-lg mb-2">{product.name}</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">{product.description}</p>
            <p className="font-semibold text-blue-600">€{product.price}</p>
            <p className="text-sm text-gray-500">Stock: {product.stock}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
