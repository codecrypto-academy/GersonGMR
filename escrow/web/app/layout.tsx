import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { EthereumProvider } from '@/lib/ethereum'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Escrow DApp',
  description: 'Intercambio seguro de tokens ERC20',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <EthereumProvider>
          {children}
        </EthereumProvider>
      </body>
    </html>
  )
}
