'use client'

import Link from 'next/link'
import { useWallet } from '@/contexts/WalletContext'

export default function NavBar() {
  const { walletAddress, isConnected, connectWallet, disconnectWallet } = useWallet()

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-blue-600">
            Tienda Online
          </Link>
          <div className="flex items-center gap-6">
            <div className="flex gap-4">
              <Link href="/" className="text-gray-700 dark:text-gray-300 hover:text-blue-600">
                Productos
              </Link>
              <Link href="/cart" className="text-gray-700 dark:text-gray-300 hover:text-blue-600">
                Carrito
              </Link>
              <Link href="/orders" className="text-gray-700 dark:text-gray-300 hover:text-blue-600">
                Mis Pedidos
              </Link>
            </div>
            {!isConnected ? (
              <button
                onClick={connectWallet}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
              >
                Conectar Wallet
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-400 font-mono" title={walletAddress}>
                  {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                </span>
                <button
                  onClick={disconnectWallet}
                  className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 underline"
                >
                  Desconectar
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
