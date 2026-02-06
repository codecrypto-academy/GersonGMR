'use client'

import { useState, useEffect, useCallback } from 'react'
import { useEthereum } from '@/lib/ethereum'
import { ESCROW_ADDRESS } from '@/lib/contracts'
import { formatUnits } from 'ethers'

interface Operation {
  id: bigint
  creator: string
  tokenA: string
  tokenB: string
  amountA: bigint
  amountB: bigint
  isActive: boolean
}

interface TokenInfo {
  address: string
  symbol: string
  decimals: number
}

export default function OperationsList() {
  const { escrowContract, getTokenContract, account } = useEthereum()
  const [operations, setOperations] = useState<Operation[]>([])
  const [tokens, setTokens] = useState<Map<string, TokenInfo>>(new Map())
  const [isLoading, setIsLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState<number | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Cargar información de tokens
  const loadTokenInfo = useCallback(async (tokenAddress: string): Promise<TokenInfo | null> => {
    try {
      const tokenContract = getTokenContract(tokenAddress)
      if (!tokenContract) return null

      const [symbol, decimals] = await Promise.all([
        tokenContract.symbol(),
        tokenContract.decimals()
      ])

      return { address: tokenAddress, symbol, decimals: Number(decimals) }
    } catch (err) {
      console.error('Error loading token info:', err)
      return null
    }
  }, [getTokenContract])

  // Cargar operaciones
  const loadOperations = useCallback(async () => {
    if (!escrowContract) return

    setIsLoading(true)
    try {
      const ops = await escrowContract.getAllOperations()
      setOperations(ops)

      // Cargar info de tokens únicos
      const uniqueTokens = new Set<string>()
      ops.forEach((op: Operation) => {
        uniqueTokens.add(op.tokenA)
        uniqueTokens.add(op.tokenB)
      })

      const tokenMap = new Map<string, TokenInfo>()
      for (const addr of uniqueTokens) {
        const info = await loadTokenInfo(addr)
        if (info) {
          tokenMap.set(addr, info)
        }
      }
      setTokens(tokenMap)
    } catch (err) {
      console.error('Error loading operations:', err)
      setOperations([])
    } finally {
      setIsLoading(false)
    }
  }, [escrowContract, loadTokenInfo])

  useEffect(() => {
    loadOperations()

    // Escuchar eventos del contrato para actualizar en tiempo real
    if (escrowContract) {
      const handleOperationCreated = () => {
        console.log('Event: OperationCreated')
        loadOperations()
      }
      const handleOperationCompleted = () => {
        console.log('Event: OperationCompleted')
        loadOperations()
      }
      const handleOperationCancelled = () => {
        console.log('Event: OperationCancelled')
        loadOperations()
      }

      escrowContract.on('OperationCreated', handleOperationCreated)
      escrowContract.on('OperationCompleted', handleOperationCompleted)
      escrowContract.on('OperationCancelled', handleOperationCancelled)

      return () => {
        escrowContract.off('OperationCreated', handleOperationCreated)
        escrowContract.off('OperationCompleted', handleOperationCompleted)
        escrowContract.off('OperationCancelled', handleOperationCancelled)
      }
    }
  }, [loadOperations, escrowContract])

  const handleComplete = async (operationId: number) => {
    if (!escrowContract) return

    setActionLoading(operationId)
    setMessage(null)

    try {
      const op = operations.find(o => Number(o.id) === operationId)
      if (!op) throw new Error('Operation not found')

      const tokenBInfo = tokens.get(op.tokenB)
      if (!tokenBInfo) throw new Error('Token info not found')

      // Paso 1: Aprobar token B
      setMessage({ type: 'success', text: 'Paso 1/2: Aprobando Token B...' })
      const tokenBContract = getTokenContract(op.tokenB)
      if (!tokenBContract) throw new Error('Token contract not found')

      const approveTx = await tokenBContract.approve(ESCROW_ADDRESS, op.amountB)
      await approveTx.wait()

      // Paso 2: Completar operación
      setMessage({ type: 'success', text: 'Paso 2/2: Completando operación...' })
      const completeTx = await escrowContract.completeOperation(operationId)
      await completeTx.wait()

      setMessage({ type: 'success', text: '¡Operación completada!' })
      loadOperations()
    } catch (err: unknown) {
      console.error('Error completing operation:', err)
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      if (errorMessage.includes('your own operation')) {
        setMessage({ type: 'error', text: 'No puedes completar tu propia operación' })
      } else if (errorMessage.includes('not active')) {
        setMessage({ type: 'error', text: 'La operación ya no está activa' })
      } else if (errorMessage.includes('user rejected')) {
        setMessage({ type: 'error', text: 'Transacción rechazada' })
      } else {
        setMessage({ type: 'error', text: 'Error al completar la operación' })
      }
    } finally {
      setActionLoading(null)
    }
  }

  const handleCancel = async (operationId: number) => {
    if (!escrowContract) return

    setActionLoading(operationId)
    setMessage(null)

    try {
      setMessage({ type: 'success', text: 'Cancelando operación...' })
      const tx = await escrowContract.cancelOperation(operationId)
      await tx.wait()

      setMessage({ type: 'success', text: '¡Operación cancelada!' })
      loadOperations()
    } catch (err: unknown) {
      console.error('Error cancelling operation:', err)
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      if (errorMessage.includes('Only creator')) {
        setMessage({ type: 'error', text: 'Solo el creador puede cancelar' })
      } else if (errorMessage.includes('not active')) {
        setMessage({ type: 'error', text: 'La operación ya no está activa' })
      } else {
        setMessage({ type: 'error', text: 'Error al cancelar la operación' })
      }
    } finally {
      setActionLoading(null)
    }
  }

  const formatAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`

  const formatAmount = (amount: bigint, tokenAddress: string) => {
    const info = tokens.get(tokenAddress)
    if (!info) return amount.toString()
    return parseFloat(formatUnits(amount, info.decimals)).toFixed(2)
  }

  const getTokenSymbol = (address: string) => {
    const info = tokens.get(address)
    return info?.symbol || 'Unknown'
  }

  const isCreator = (creator: string) => {
    return account?.toLowerCase() === creator.toLowerCase()
  }

  return (
    <div className="bg-gray-800 rounded-xl p-6 shadow-lg h-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-white">Operaciones</h2>
        <button
          onClick={loadOperations}
          disabled={isLoading}
          className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1"
        >
          <svg className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Actualizar
        </button>
      </div>

      {message && (
        <div className={`mb-4 p-3 rounded-lg ${message.type === 'success' ? 'bg-green-900/30 border border-green-700' : 'bg-red-900/30 border border-red-700'}`}>
          <p className={`text-sm ${message.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
            {message.text}
          </p>
        </div>
      )}

      {operations.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-400">No hay operaciones aún</p>
          <p className="text-gray-500 text-sm mt-2">Crea tu primera operación de swap</p>
        </div>
      ) : (
        <div className="space-y-4 max-h-[600px] overflow-y-auto">
          {operations.map((op) => (
            <div
              key={Number(op.id)}
              className={`p-4 rounded-lg border ${
                op.isActive
                  ? 'bg-gray-700 border-gray-600'
                  : 'bg-gray-800 border-gray-700 opacity-60'
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <span className="text-sm text-gray-400">ID: #{Number(op.id)}</span>
                  <p className="text-xs text-gray-500 mt-1">
                    Creador: {formatAddress(op.creator)}
                    {isCreator(op.creator) && (
                      <span className="ml-2 text-blue-400">(Tú)</span>
                    )}
                  </p>
                </div>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    op.isActive
                      ? 'bg-green-900/50 text-green-400'
                      : 'bg-gray-600 text-gray-300'
                  }`}
                >
                  {op.isActive ? 'Activa' : 'Cerrada'}
                </span>
              </div>

              <div className="flex items-center justify-between bg-gray-800 rounded-lg p-3 mb-3">
                <div className="text-center">
                  <p className="text-lg font-bold text-white">
                    {formatAmount(op.amountA, op.tokenA)}
                  </p>
                  <p className="text-sm text-blue-400">{getTokenSymbol(op.tokenA)}</p>
                </div>
                <div className="text-gray-400">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-white">
                    {formatAmount(op.amountB, op.tokenB)}
                  </p>
                  <p className="text-sm text-green-400">{getTokenSymbol(op.tokenB)}</p>
                </div>
              </div>

              {op.isActive && account && (
                <div className="flex gap-2">
                  {isCreator(op.creator) ? (
                    <button
                      onClick={() => handleCancel(Number(op.id))}
                      disabled={actionLoading === Number(op.id)}
                      className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white py-2 rounded-lg transition-colors text-sm"
                    >
                      {actionLoading === Number(op.id) ? 'Procesando...' : 'Cancelar Operación'}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleComplete(Number(op.id))}
                      disabled={actionLoading === Number(op.id)}
                      className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white py-2 rounded-lg transition-colors text-sm"
                    >
                      {actionLoading === Number(op.id) ? 'Procesando...' : 'Completar Operación'}
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
