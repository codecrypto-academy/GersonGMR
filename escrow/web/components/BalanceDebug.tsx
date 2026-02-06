'use client'

import { useState, useEffect, useCallback } from 'react'
import { useEthereum } from '@/lib/ethereum'
import { ESCROW_ADDRESS, TEST_ACCOUNTS } from '@/lib/contracts'
import { formatUnits, Contract } from 'ethers'

interface TokenInfo {
  address: string
  symbol: string
  decimals: number
}

interface AccountBalance {
  address: string
  label: string
  ethBalance: string
  tokenBalances: { symbol: string; balance: string }[]
}

export default function BalanceDebug() {
  const { escrowContract, getTokenContract, provider, signer } = useEthereum()
  const [tokens, setTokens] = useState<TokenInfo[]>([])
  const [balances, setBalances] = useState<AccountBalance[]>([])
  const [escrowBalance, setEscrowBalance] = useState<AccountBalance | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Cargar tokens permitidos
  const loadTokens = useCallback(async () => {
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
          console.error('Error loading token:', err)
        }
      }

      setTokens(tokenInfos)
    } catch (err) {
      console.error('Error loading tokens:', err)
      setTokens([])
    }
  }, [escrowContract, getTokenContract])

  // Obtener balance de una cuenta
  const getAccountBalance = useCallback(async (
    address: string,
    label: string
  ): Promise<AccountBalance> => {
    const balance: AccountBalance = {
      address,
      label,
      ethBalance: '0',
      tokenBalances: []
    }

    try {
      // Balance de ETH
      if (provider) {
        const ethBal = await provider.getBalance(address)
        balance.ethBalance = parseFloat(formatUnits(ethBal, 18)).toFixed(4)
      }

      // Balances de tokens
      for (const token of tokens) {
        try {
          const tokenContract = getTokenContract(token.address)
          if (tokenContract) {
            const bal = await tokenContract.balanceOf(address)
            balance.tokenBalances.push({
              symbol: token.symbol,
              balance: parseFloat(formatUnits(bal, token.decimals)).toFixed(2)
            })
          }
        } catch (err) {
          console.error(`Error getting balance for ${token.symbol}:`, err)
          balance.tokenBalances.push({
            symbol: token.symbol,
            balance: '0'
          })
        }
      }
    } catch (err) {
      console.error('Error getting account balance:', err)
    }

    return balance
  }, [provider, tokens, getTokenContract])

  // Cargar todos los balances
  const loadBalances = useCallback(async () => {
    if (!provider || tokens.length === 0) return

    setIsLoading(true)
    try {
      // Balance del contrato Escrow
      const escrowBal = await getAccountBalance(ESCROW_ADDRESS, 'Escrow Contract')
      setEscrowBalance(escrowBal)

      // Balances de cuentas de test
      const accountBalances = await Promise.all(
        TEST_ACCOUNTS.map(acc => getAccountBalance(acc.address, acc.label))
      )
      setBalances(accountBalances)
    } catch (err) {
      console.error('Error loading balances:', err)
    } finally {
      setIsLoading(false)
    }
  }, [provider, tokens, getAccountBalance])

  useEffect(() => {
    loadTokens()
  }, [loadTokens])

  useEffect(() => {
    if (tokens.length > 0) {
      loadBalances()

      // Escuchar eventos del contrato para actualizar balances en tiempo real
      if (escrowContract) {
        const handleBalanceChange = () => {
          console.log('Event: Balance update triggered')
          loadBalances()
        }

        escrowContract.on('OperationCreated', handleBalanceChange)
        escrowContract.on('OperationCompleted', handleBalanceChange)
        escrowContract.on('OperationCancelled', handleBalanceChange)

        return () => {
          escrowContract.off('OperationCreated', handleBalanceChange)
          escrowContract.off('OperationCompleted', handleBalanceChange)
          escrowContract.off('OperationCancelled', handleBalanceChange)
        }
      }
    }
  }, [tokens, loadBalances, escrowContract])

  const formatAddress = (addr: string) => `${addr.slice(0, 8)}...${addr.slice(-6)}`

  const BalanceCard = ({ balance, isEscrow = false }: { balance: AccountBalance; isEscrow?: boolean }) => (
    <div className={`p-4 rounded-lg ${isEscrow ? 'bg-blue-900/30 border border-blue-700' : 'bg-gray-700'}`}>
      <div className="mb-2">
        <p className={`font-medium ${isEscrow ? 'text-blue-400' : 'text-white'}`}>
          {balance.label}
        </p>
        <p className="text-xs text-gray-500 font-mono">
          {formatAddress(balance.address)}
        </p>
      </div>
      
      <div className="space-y-1">
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">ETH</span>
          <span className="text-white font-mono">{balance.ethBalance}</span>
        </div>
        {balance.tokenBalances.map((tb) => (
          <div key={tb.symbol} className="flex justify-between text-sm">
            <span className="text-gray-400">{tb.symbol}</span>
            <span className="text-white font-mono">{tb.balance}</span>
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-white">Balance Debug</h2>
        <button
          onClick={loadBalances}
          disabled={isLoading}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-3 py-1 rounded-lg text-sm flex items-center gap-2"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Cargando...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </>
          )}
        </button>
      </div>

      {tokens.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-400">No hay tokens aún</p>
          <p className="text-gray-500 text-sm mt-2">Agrega tokens para ver los balances</p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Escrow Contract Balance */}
          {escrowBalance && (
            <BalanceCard balance={escrowBalance} isEscrow={true} />
          )}

          {/* Separator */}
          <div className="border-t border-gray-600 my-4"></div>

          {/* Test Accounts */}
          {balances.map((balance) => (
            <BalanceCard key={balance.address} balance={balance} />
          ))}
        </div>
      )}
    </div>
  )
}
