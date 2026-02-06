'use client'

import { useState, useEffect } from 'react'
import { useEthereum } from '@/lib/ethereum'
import ConnectButton from '@/components/ConnectButton'
import AddToken from '@/components/AddToken'
import CreateOperation from '@/components/CreateOperation'
import OperationsList from '@/components/OperationsList'
import BalanceDebug from '@/components/BalanceDebug'

export default function Home() {
  const { isConnected, chainId } = useEthereum()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  const isCorrectNetwork = chainId === 31337

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Escrow DApp</h1>
              <p className="text-xs text-gray-400">Intercambio seguro de tokens ERC20</p>
            </div>
          </div>
          <ConnectButton />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {!isConnected ? (
          // Welcome Screen
          <div className="text-center py-20">
            <div className="bg-gray-800 rounded-2xl p-12 max-w-2xl mx-auto">
              <div className="bg-blue-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-white mb-4">
                Bienvenido a Escrow DApp
              </h2>
              <p className="text-gray-400 mb-8 max-w-md mx-auto">
                Intercambia tokens ERC20 de forma segura usando contratos inteligentes de escrow. 
                Conecta tu wallet para comenzar.
              </p>
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-3 text-gray-300">
                  <div className="bg-green-600/20 p-2 rounded-lg">
                    <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span>Intercambios seguros con escrow</span>
                </div>
                <div className="flex items-center justify-center gap-3 text-gray-300">
                  <div className="bg-green-600/20 p-2 rounded-lg">
                    <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span>Sin intermediarios, solo smart contracts</span>
                </div>
                <div className="flex items-center justify-center gap-3 text-gray-300">
                  <div className="bg-green-600/20 p-2 rounded-lg">
                    <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span>Cancela en cualquier momento</span>
                </div>
              </div>
            </div>
          </div>
        ) : !isCorrectNetwork ? (
          // Wrong Network Warning
          <div className="text-center py-20">
            <div className="bg-yellow-900/30 border border-yellow-700 rounded-2xl p-12 max-w-2xl mx-auto">
              <div className="bg-yellow-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-yellow-400 mb-4">
                Red Incorrecta
              </h2>
              <p className="text-gray-300 mb-4">
                Por favor cambia a la red local de Anvil
              </p>
              <div className="bg-gray-800 rounded-lg p-4 text-left max-w-md mx-auto">
                <p className="text-sm text-gray-400 mb-2">Configuración de red:</p>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li><span className="text-gray-500">RPC URL:</span> http://localhost:8545</li>
                  <li><span className="text-gray-500">Chain ID:</span> 31337</li>
                  <li><span className="text-gray-500">Símbolo:</span> ETH</li>
                </ul>
              </div>
            </div>
          </div>
        ) : (
          // Main Dashboard
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Add Token & Create Operation */}
            <div className="space-y-6">
              <AddToken />
              <CreateOperation />
            </div>

            {/* Middle Column - Operations List */}
            <div>
              <OperationsList />
            </div>

            {/* Right Column - Balance Debug */}
            <div>
              <BalanceDebug />
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 border-t border-gray-700 mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-center md:text-left">
              <p className="text-gray-400 text-sm">
                Escrow DApp - Proyecto educativo
              </p>
              <p className="text-gray-500 text-xs mt-1">
                Desarrollado con Solidity, Foundry, Next.js 14 y ethers.js
              </p>
            </div>
            <div className="flex gap-4 text-sm text-gray-400">
              <a 
                href="https://book.getfoundry.sh/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-blue-400 transition-colors"
              >
                Foundry Docs
              </a>
              <a 
                href="https://docs.ethers.org/v6/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-blue-400 transition-colors"
              >
                Ethers.js Docs
              </a>
              <a 
                href="https://docs.openzeppelin.com/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-blue-400 transition-colors"
              >
                OpenZeppelin
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
