'use client'

import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { EcommerceABI } from '@/lib/contracts'
import ProductManagement from './ProductManagement'
import InvoiceList from './InvoiceList'

const ECOMMERCE_ADDRESS = process.env.NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS || ''

interface DashboardProps {
  walletAddress: string
  companyId: number
}

export default function Dashboard({ walletAddress, companyId }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<'products' | 'invoices'>('products')
  const [company, setCompany] = useState<any>(null)

  useEffect(() => {
    loadCompany()
  }, [companyId])

  const loadCompany = async () => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const contract = new ethers.Contract(ECOMMERCE_ADDRESS, EcommerceABI, provider)
      const companyData = await contract.getCompany(companyId)
      setCompany({
        name: companyData.name,
        taxId: companyData.taxId,
        isActive: companyData.isActive,
      })
    } catch (err) {
      console.error('Error loading company:', err)
    }
  }

  return (
    <div>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-2xl font-bold mb-2">{company?.name}</h2>
        <p className="text-gray-600 dark:text-gray-400">NIF: {company?.taxId}</p>
        <p className="text-sm text-gray-500 mt-2">Wallet: <span className="font-mono">{walletAddress}</span></p>
      </div>

      <div className="flex space-x-4 mb-6">
        <button
          onClick={() => setActiveTab('products')}
          className={`px-6 py-2 rounded-lg font-semibold ${
            activeTab === 'products'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
        >
          Productos
        </button>
        <button
          onClick={() => setActiveTab('invoices')}
          className={`px-6 py-2 rounded-lg font-semibold ${
            activeTab === 'invoices'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
        >
          Facturas
        </button>
      </div>

      {activeTab === 'products' && (
        <ProductManagement walletAddress={walletAddress} companyId={companyId} />
      )}
      {activeTab === 'invoices' && (
        <InvoiceList companyId={companyId} />
      )}
    </div>
  )
}
