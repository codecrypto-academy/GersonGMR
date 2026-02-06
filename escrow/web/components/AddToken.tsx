'use client'

import { useState, useEffect } from 'react'
import { useEthereum } from '@/lib/ethereum'
import { ESCROW_ADDRESS } from '@/lib/contracts'

interface TokenInfo {
  address: string
  symbol: string
  name: string
}

export default function AddToken() {
  const { escrowContract, getTokenContract, account } = useEthereum()
  const [tokenAddress, setTokenAddress] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [allowedTokens, setAllowedTokens] = useState<TokenInfo[]>([])
  const [isOwner, setIsOwner] = useState(false)

  // Cargar tokens permitidos
  const loadTokens = async () => {
    if (!escrowContract) return

    try {
      const tokens = await escrowContract.getAllowedTokens()
      const tokenInfos: TokenInfo[] = []

      for (const tokenAddr of tokens) {
        try {
          const tokenContract = getTokenContract(tokenAddr)
          if (tokenContract) {
            const [symbol, name] = await Promise.all([
              tokenContract.symbol(),
              tokenContract.name()
            ])
            tokenInfos.push({ address: tokenAddr, symbol, name })
          }
        } catch (err) {
          tokenInfos.push({ address: tokenAddr, symbol: 'Unknown', name: 'Unknown Token' })
        }
      }

      setAllowedTokens(tokenInfos)
    } catch (err) {
      console.error('Error loading tokens:', err)
      setAllowedTokens([])
    }
  }

  // Verificar si el usuario es owner
  const checkOwner = async () => {
    if (!escrowContract || !account) return

    try {
      const owner = await escrowContract.owner()
      setIsOwner(owner.toLowerCase() === account.toLowerCase())
    } catch (err) {
      console.error('Error checking owner:', err)
      setIsOwner(false)
    }
  }

  useEffect(() => {
    loadTokens()
    checkOwner()

    // Escuchar eventos de tokens para actualizar en tiempo real
    if (escrowContract) {
      const handleTokenAdded = () => {
        console.log('Event: TokenAdded')
        loadTokens()
      }
      const handleTokenRemoved = () => {
        console.log('Event: TokenRemoved')
        loadTokens()
      }

      escrowContract.on('TokenAdded', handleTokenAdded)
      escrowContract.on('TokenRemoved', handleTokenRemoved)

      return () => {
        escrowContract.off('TokenAdded', handleTokenAdded)
        escrowContract.off('TokenRemoved', handleTokenRemoved)
      }
    }
  }, [escrowContract, account])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!escrowContract || !tokenAddress) return

    setIsLoading(true)
    setMessage(null)

    try {
      const tx = await escrowContract.addToken(tokenAddress)
      await tx.wait()

      setMessage({ type: 'success', text: 'Token agregado exitosamente!' })
      setTokenAddress('')
      loadTokens()
    } catch (err: unknown) {
      console.error('Error adding token:', err)
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      if (errorMessage.includes('already allowed')) {
        setMessage({ type: 'error', text: 'Este token ya está permitido' })
      } else if (errorMessage.includes('not the owner')) {
        setMessage({ type: 'error', text: 'Solo el owner puede agregar tokens' })
      } else {
        setMessage({ type: 'error', text: 'Error al agregar token' })
      }
    } finally {
      setIsLoading(false)
    }
  }

  const formatAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`

  return (
    <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
      <h2 className="text-xl font-bold text-white mb-4">Agregar Token</h2>
      
      <div className="mb-4 p-3 bg-gray-700 rounded-lg">
        <p className="text-sm text-gray-300">Contrato Escrow:</p>
        <p className="text-xs text-blue-400 font-mono break-all">{ESCROW_ADDRESS}</p>
      </div>

      {isOwner && (
        <form onSubmit={handleSubmit} className="mb-6">
          <div className="mb-4">
            <label className="block text-sm text-gray-300 mb-2">
              Dirección del Token ERC20
            </label>
            <input
              type="text"
              value={tokenAddress}
              onChange={(e) => setTokenAddress(e.target.value)}
              placeholder="0x..."
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !tokenAddress}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white py-2 rounded-lg transition-colors"
          >
            {isLoading ? 'Agregando...' : 'Agregar Token'}
          </button>

          {message && (
            <p className={`mt-3 text-sm ${message.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
              {message.text}
            </p>
          )}
        </form>
      )}

      {!isOwner && (
        <div className="mb-4 p-3 bg-yellow-900/30 border border-yellow-700 rounded-lg">
          <p className="text-sm text-yellow-400">
            Solo el owner puede agregar tokens
          </p>
        </div>
      )}

      <div>
        <h3 className="text-lg font-semibold text-white mb-3">Tokens Permitidos</h3>
        {allowedTokens.length === 0 ? (
          <p className="text-gray-400 text-sm">No hay tokens permitidos aún</p>
        ) : (
          <ul className="space-y-2">
            {allowedTokens.map((token) => (
              <li key={token.address} className="p-3 bg-gray-700 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-white">{token.symbol}</span>
                  <span className="text-sm text-gray-400">{token.name}</span>
                </div>
                <p className="text-xs text-gray-500 font-mono mt-1">{formatAddress(token.address)}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
