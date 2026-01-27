'use client'

import { useState } from 'react'
import { ethers } from 'ethers'
import { EcommerceABI } from '@/lib/contracts'

const ECOMMERCE_ADDRESS = process.env.NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS || ''

interface CompanyRegistrationProps {
  walletAddress: string
  onRegistered: (companyId: number) => void
}

export default function CompanyRegistration({
  walletAddress,
  onRegistered,
}: CompanyRegistrationProps) {
  const [name, setName] = useState('')
  const [taxId, setTaxId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const contract = new ethers.Contract(ECOMMERCE_ADDRESS, EcommerceABI, signer)

      const tx = await contract.registerCompany(name, taxId)
      await tx.wait()

      // Obtener el ID de la empresa
      const companyId = await contract.getCompanyIdByAddress(walletAddress)
      onRegistered(Number(companyId))
    } catch (err: any) {
      setError(err.message || 'Error al registrar empresa')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-4">Registrar Empresa</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-2">
            Nombre de la Empresa
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
            required
          />
        </div>
        <div>
          <label htmlFor="taxId" className="block text-sm font-medium mb-2">
            NIF/CIF
          </label>
          <input
            id="taxId"
            type="text"
            value={taxId}
            onChange={(e) => setTaxId(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
            required
          />
        </div>
        {error && <p className="text-red-500">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-lg"
        >
          {loading ? 'Registrando...' : 'Registrar Empresa'}
        </button>
      </form>
    </div>
  )
}
