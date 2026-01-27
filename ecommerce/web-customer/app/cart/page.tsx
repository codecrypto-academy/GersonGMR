'use client'

import { useState, useEffect, useCallback } from 'react'
import { ethers } from 'ethers'
import { EcommerceABI } from '@/lib/contracts'
import { useWallet } from '@/contexts/WalletContext'

const ECOMMERCE_ADDRESS = process.env.NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS || ''
const PAYMENT_GATEWAY_URL = process.env.NEXT_PUBLIC_PAYMENT_GATEWAY_URL || 'http://localhost:6002'

interface CartItem {
  productId: number
  quantity: number
}

interface Product {
  productId: number
  name: string
  price: string
  stock: number
}

export default function CartPage() {
  const { walletAddress, isConnected, connectWallet } = useWallet()
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [products, setProducts] = useState<Map<number, Product>>(new Map())
  const [total, setTotal] = useState<string>('0')
  const [loading, setLoading] = useState(false)

  const loadCart = useCallback(async () => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const contract = new ethers.Contract(ECOMMERCE_ADDRESS, EcommerceABI, provider)
      const items = await contract.getCart(walletAddress)

      const formattedItems = items.map((item: any) => ({
        productId: Number(item.productId),
        quantity: Number(item.quantity),
      }))

      setCartItems(formattedItems)

      const productsMap = new Map<number, Product>()
      let totalAmount = ethers.parseUnits('0', 6)

      for (const item of formattedItems) {
        const productData = await contract.getProduct(item.productId)
        const product: Product = {
          productId: item.productId,
          name: productData.name,
          price: ethers.formatUnits(productData.price, 6),
          stock: Number(productData.stock),
        }
        productsMap.set(item.productId, product)
        totalAmount += productData.price * BigInt(item.quantity)
      }

      setProducts(productsMap)
      setTotal(ethers.formatUnits(totalAmount, 6))
    } catch (err) {
      console.error('Error loading cart:', err)
    }
  }, [walletAddress])

  useEffect(() => {
    if (isConnected && walletAddress) {
      loadCart()
    }
  }, [isConnected, walletAddress, loadCart])

  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      alert('El carrito está vacío')
      return
    }

    setLoading(true)
    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const contract = new ethers.Contract(ECOMMERCE_ADDRESS, EcommerceABI, signer)

      // Agrupar items por empresa (asumiendo que todos son de la misma empresa por ahora)
      const firstProduct = await contract.getProduct(cartItems[0].productId)
      const companyId = Number(firstProduct.companyId)

      // Obtener información de la empresa
      const company = await contract.getCompany(companyId)
      const merchantAddress = company.companyAddress

      // Crear invoice
      const tx = await contract.createInvoice(walletAddress, companyId)
      const receipt = await tx.wait()

      // Obtener invoiceId desde eventos
      const invoiceCreatedEvent = receipt.logs.find((log: any) => {
        try {
          const parsed = contract.interface.parseLog(log)
          return parsed?.name === 'InvoiceCreated'
        } catch {
          return false
        }
      })

      let invoiceId = '1'
      if (invoiceCreatedEvent) {
        const parsed = contract.interface.parseLog(invoiceCreatedEvent)
        invoiceId = parsed?.args[0].toString() || '1'
      }

      // Redirigir a pasarela de pago
      const paymentUrl = new URL(PAYMENT_GATEWAY_URL)
      paymentUrl.searchParams.set('merchant_address', merchantAddress)
      paymentUrl.searchParams.set('amount', total)
      paymentUrl.searchParams.set('invoice', `INV-${invoiceId}`)
      paymentUrl.searchParams.set('date', new Date().toISOString().split('T')[0])
      paymentUrl.searchParams.set('redirect', `${window.location.origin}/orders`)

      window.location.href = paymentUrl.toString()
    } catch (err: any) {
      alert('Error: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl mb-4">Por favor conecta tu wallet para ver el carrito</p>
          <button
            onClick={connectWallet}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
          >
            Conectar Wallet
          </button>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">Carrito de Compras</h1>

        {cartItems.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-xl text-gray-500">Tu carrito está vacío</p>
          </div>
        ) : (
          <>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
              {cartItems.map((item) => {
                const product = products.get(item.productId)
                if (!product) return null

                return (
                  <div key={item.productId} className="flex justify-between items-center py-4 border-b">
                    <div>
                      <h3 className="font-bold">{product.name}</h3>
                      <p className="text-gray-500">Cantidad: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">€{(parseFloat(product.price) * item.quantity).toFixed(2)}</p>
                    </div>
                  </div>
                )
              })}
              <div className="flex justify-between items-center pt-4 mt-4 border-t">
                <span className="text-xl font-bold">Total:</span>
                <span className="text-2xl font-bold text-blue-600">€{total}</span>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-4 px-6 rounded-lg"
            >
              {loading ? 'Procesando...' : 'Proceder al Pago'}
            </button>
          </>
        )}
      </div>
    </main>
  )
}
