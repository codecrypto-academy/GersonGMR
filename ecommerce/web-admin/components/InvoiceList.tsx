'use client'

import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { EcommerceABI } from '@/lib/contracts'

const ECOMMERCE_ADDRESS = process.env.NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS || ''

interface InvoiceListProps {
  companyId: number
}

interface Invoice {
  invoiceId: number
  customerAddress: string
  totalAmount: string
  timestamp: number
  isPaid: boolean
  paymentTxHash: string
}

export default function InvoiceList({ companyId }: InvoiceListProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadInvoices()
  }, [companyId])

  const loadInvoices = async () => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const contract = new ethers.Contract(ECOMMERCE_ADDRESS, EcommerceABI, provider)
      const invoicesData = await contract.getCompanyInvoices(companyId)
      
      const formattedInvoices = invoicesData.map((inv: any) => ({
        invoiceId: Number(inv.invoiceId),
        customerAddress: inv.customerAddress,
        totalAmount: ethers.formatUnits(inv.totalAmount, 6),
        timestamp: Number(inv.timestamp),
        isPaid: inv.isPaid,
        paymentTxHash: inv.paymentTxHash,
      }))
      
      setInvoices(formattedInvoices)
    } catch (err) {
      console.error('Error loading invoices:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div>Cargando facturas...</div>
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Facturas</h2>
      <div className="space-y-4">
        {invoices.length === 0 ? (
          <p className="text-gray-500">No hay facturas</p>
        ) : (
          invoices.map((invoice) => (
            <div key={invoice.invoiceId} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-lg">Factura #{invoice.invoiceId}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Cliente: <span className="font-mono">{invoice.customerAddress}</span>
                  </p>
                  <p className="text-sm text-gray-500">
                    Fecha: {new Date(Number(invoice.timestamp) * 1000).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-xl text-blue-600">€{invoice.totalAmount}</p>
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    invoice.isPaid
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                  }`}>
                    {invoice.isPaid ? 'Pagada' : 'Pendiente'}
                  </span>
                </div>
              </div>
              {invoice.isPaid && invoice.paymentTxHash && (
                <p className="text-xs text-gray-400 mt-2">
                  TX: <span className="font-mono">{invoice.paymentTxHash}</span>
                </p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
