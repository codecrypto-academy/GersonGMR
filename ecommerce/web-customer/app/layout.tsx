import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Link from 'next/link'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Tienda Online',
  description: 'Compra productos con EuroTokens',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <nav className="bg-white dark:bg-gray-800 shadow-lg">
          <div className="container mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <Link href="/" className="text-2xl font-bold text-blue-600">
                Tienda Online
              </Link>
              <div className="space-x-4">
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
            </div>
          </div>
        </nav>
        {children}
      </body>
    </html>
  )
}
