'use client'

import { useState, useEffect } from 'react'
import { useEthereum } from '@/lib/ethereum'

export default function ConnectButton() {
  const { account, isConnected, isConnecting, connect, disconnect, chainId, error } = useEthereum()
  const [mounted, setMounted] = useState(false)

  // Evitar errores de hidratación
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <button className="bg-gray-600 text-white px-4 py-2 rounded-lg" disabled>
        Cargando...
      </button>
    )
  }

  // Formatear dirección para mostrar
  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  if (isConnected && account) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex flex-col items-end">
          <span className="text-sm text-green-400 font-medium">
            {formatAddress(account)}
          </span>
          <span className="text-xs text-gray-400">
            Chain ID: {chainId}
          </span>
        </div>
        <button
          onClick={disconnect}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors text-sm"
        >
          Desconectar
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={connect}
        disabled={isConnecting}
        className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
      >
        {isConnecting ? (
          <>
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Conectando...
          </>
        ) : (
          'Conectar Wallet'
        )}
      </button>
      {error && (
        <span className="text-xs text-red-400">{error}</span>
      )}
    </div>
  )
}
