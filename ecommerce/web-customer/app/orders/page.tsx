'use client'

import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { EcommerceABI } from '@/lib/contracts'

const ECOMMERCE_ADDRESS = process.env.NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS || ''

interface Invoice {
  invoiceId: number
  companyId: number
  totalAmount: string
  timestamp: number
  isPaid: boolean
  paymentTxHash: string
  items: Array<{
    productId: number
    quantity: number
    unitPrice: string
  }>
}

export default function OrdersPage() {
  const [walletAddress, setWalletAddress] = useState<string>('')
  const [isConnected, setIsConnected] = useState(false)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkConnection()
  }, [])

  useEffect(() => {
    if (isConnected && walletAddress) {
      loadInvoices()
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

  const loadInvoices = async () => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const contract = new ethers.Contract(ECOMMERCE_ADDRESS, EcommerceABI, provider)
      const invoicesData = await contract.getCustomerInvoices(walletAddress)
      
      const formattedInvoices = invoicesData.map((inv: any) => ({
        invoiceId: Number(inv.invoiceId),
        companyId: Number(inv.companyId),
        totalAmount: ethers.formatUnits(inv.totalAmount, 6),
        timestamp: Number(inv.timestamp),
        isPaid: inv.isPaid,
        paymentTxHash: inv.paymentTxHash,
        items: inv.items.map((item: any) => ({
          productId: Number(item.productId),
          quantity: Number(item.quantity),
          unitPrice: ethers.formatUnits(item.unitPrice, 6),
        })),
      }))
      
      setInvoices(formattedInvoices)
    } catch (err) {
      console.error('Error loading invoices:', err)
    } finally {
      setLoading(false)
    }
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl mb-4">Por favor conecta tu wallet para ver tus pedidos</p>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">Mis Pedidos</h1>

        {loading ? (
          <div className="text-center py-12">Cargando pedidos...</div>
        ) : invoices.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-xl text-gray-500">No tienes pedidos</p>
          </div>
        ) : (
          <div className="space-y-4">
            {invoices.map((invoice) => (
              <div key={invoice.invoiceId} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-lg">Pedido #{invoice.invoiceId}</h3>
                    <p className="text-sm text-gray-500">
                      {new Date(Number(invoice.timestamp) * 1000).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-xl text-blue-600">€{invoice.totalAmount}</p>
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      invoice.isPaid
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                    }`}>
                      {invoice.isPaid ? 'Pagado' : 'Pendiente'}
                    </span>
                  </div>
                </div>
                <div className="mt-4">
                  <h4 className="font-semibold mb-2">Items:</h4>
                  <ul className="space-y-1">
                    {invoice.items.map((item, idx) => (
                      <li key={idx} className="text-sm">
                        Producto #{item.productId} - Cantidad: {item.quantity} - €{item.unitPrice} c/u
                      </li>
                    ))}
                  </ul>
                </div>
                {invoice.isPaid && invoice.paymentTxHash && (
                  <p className="text-xs text-gray-400 mt-2">
                    TX: <span className="font-mono">{invoice.paymentTxHash}</span>
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
