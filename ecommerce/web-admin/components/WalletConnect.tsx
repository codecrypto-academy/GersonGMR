'use client'

import { useState } from 'react'
import { ethers } from 'ethers'

interface WalletConnectProps {
  onConnect: (address: string) => void
}

export default function WalletConnect({ onConnect }: WalletConnectProps) {
  const [error, setError] = useState<string>('')

  const connectWallet = async () => {
    if (typeof window.ethereum === 'undefined') {
      setError('MetaMask no está instalado')
      return
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      await provider.send('eth_requestAccounts', [])
      const signer = await provider.getSigner()
      const address = await signer.getAddress()
      onConnect(address)
    } catch (err: any) {
      setError('Error al conectar: ' + err.message)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-4">Conectar Wallet</h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        Conecta tu wallet de MetaMask para gestionar tu empresa
      </p>
      <button
        onClick={connectWallet}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
      >
        Conectar MetaMask
      </button>
      {error && <p className="text-red-500 mt-4">{error}</p>}
    </div>
  )
}
