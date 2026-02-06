'use client'

import { useState, useEffect } from 'react'
import { useEthereum } from '@/lib/ethereum'
import { ESCROW_ADDRESS } from '@/lib/contracts'
import { parseUnits } from 'ethers'

interface TokenInfo {
  address: string
  symbol: string
  decimals: number
}

export default function CreateOperation() {
  const { escrowContract, getTokenContract } = useEthereum()
  const [tokens, setTokens] = useState<TokenInfo[]>([])
  const [tokenA, setTokenA] = useState('')
  const [tokenB, setTokenB] = useState('')
  const [amountA, setAmountA] = useState('')
  const [amountB, setAmountB] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Cargar tokens permitidos
  const loadTokens = async () => {
    if (!escrowContract) return

    try {
      const tokenAddresses = await escrowContract.getAllowedTokens()
      const tokenInfos: TokenInfo[] = []

      for (const addr of tokenAddresses) {
        try {
          const tokenContract = getTokenContract(addr)
          if (tokenContract) {
            const [symbol, decimals] = await Promise.all([
              tokenContract.symbol(),
              tokenContract.decimals()
            ])
            tokenInfos.push({ address: addr, symbol, decimals: Number(decimals) })
          }
        } catch (err) {
          console.error('Error loading token info:', err)
        }
      }

      setTokens(tokenInfos)
      if (tokenInfos.length >= 2) {
        setTokenA(tokenInfos[0].address)
        setTokenB(tokenInfos[1].address)
      }
    } catch (err) {
      console.error('Error loading tokens:', err)
      setTokens([])
    }
  }

  useEffect(() => {
    loadTokens()

    // Escuchar eventos de tokens para actualizar la lista
    if (escrowContract) {
      const handleTokenChange = () => {
        console.log('Event: Token list updated')
        loadTokens()
      }

      escrowContract.on('TokenAdded', handleTokenChange)
      escrowContract.on('TokenRemoved', handleTokenChange)

      return () => {
        escrowContract.off('TokenAdded', handleTokenChange)
        escrowContract.off('TokenRemoved', handleTokenChange)
      }
    }
  }, [escrowContract])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!escrowContract || !tokenA || !tokenB || !amountA || !amountB) return

    setIsLoading(true)
    setMessage(null)

    try {
      const tokenAInfo = tokens.find(t => t.address === tokenA)
      const tokenBInfo = tokens.find(t => t.address === tokenB)

      if (!tokenAInfo || !tokenBInfo) {
        throw new Error('Token info not found')
      }

      const amountAWei = parseUnits(amountA, tokenAInfo.decimals)
      const amountBWei = parseUnits(amountB, tokenBInfo.decimals)

      // Paso 1: Aprobar el token A
      setMessage({ type: 'success', text: 'Paso 1/2: Aprobando Token A...' })
      const tokenAContract = getTokenContract(tokenA)
      if (!tokenAContract) throw new Error('Token contract not found')

      const approveTx = await tokenAContract.approve(ESCROW_ADDRESS, amountAWei)
      await approveTx.wait()

      // Paso 2: Crear la operación
      setMessage({ type: 'success', text: 'Paso 2/2: Creando operación...' })
      const createTx = await escrowContract.createOperation(
        tokenA,
        tokenB,
        amountAWei,
        amountBWei
      )
      await createTx.wait()

      setMessage({ type: 'success', text: '¡Operación creada exitosamente!' })
      setAmountA('')
      setAmountB('')

      // Recargar después de un momento
      setTimeout(() => {
        window.location.reload()
      }, 1500)
    } catch (err: unknown) {
      console.error('Error creating operation:', err)
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      if (errorMessage.includes('user rejected')) {
        setMessage({ type: 'error', text: 'Transacción rechazada por el usuario' })
      } else if (errorMessage.includes('insufficient')) {
        setMessage({ type: 'error', text: 'Balance insuficiente' })
      } else {
        setMessage({ type: 'error', text: 'Error al crear la operación' })
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
      <h2 className="text-xl font-bold text-white mb-4">Crear Operación de Swap</h2>

      {tokens.length < 2 ? (
        <p className="text-gray-400 text-sm">
          Se necesitan al menos 2 tokens permitidos para crear operaciones
        </p>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm text-gray-300 mb-2">Token A (Ofrecer)</label>
            <select
              value={tokenA}
              onChange={(e) => setTokenA(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
            >
              {tokens.map((token) => (
                <option key={token.address} value={token.address}>
                  {token.symbol}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm text-gray-300 mb-2">Cantidad de Token A</label>
            <input
              type="number"
              step="any"
              min="0"
              value={amountA}
              onChange={(e) => setAmountA(e.target.value)}
              placeholder="100"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center justify-center my-4">
            <div className="bg-blue-600 rounded-full p-2">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm text-gray-300 mb-2">Token B (Recibir)</label>
            <select
              value={tokenB}
              onChange={(e) => setTokenB(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
            >
              {tokens.map((token) => (
                <option key={token.address} value={token.address} disabled={token.address === tokenA}>
                  {token.symbol}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-6">
            <label className="block text-sm text-gray-300 mb-2">Cantidad de Token B</label>
            <input
              type="number"
              step="any"
              min="0"
              value={amountB}
              onChange={(e) => setAmountB(e.target.value)}
              placeholder="50"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !amountA || !amountB || tokenA === tokenB}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white py-3 rounded-lg transition-colors font-medium"
          >
            {isLoading ? 'Procesando...' : 'Crear Operación'}
          </button>

          {message && (
            <p className={`mt-3 text-sm ${message.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
              {message.text}
            </p>
          )}
        </form>
      )}
    </div>
  )
}
