import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import SessionProvider from '@/components/SessionProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'PolyOne - The Incubator of the Polygon Ecosystem',
  description: 'Smart Contracts × Community. Launch your own Polygon-based blockchain with Juno-inspired design.',
  keywords: 'blockchain, polygon, zkEVM, CDK, enterprise, BaaS, web3, smart contracts',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SessionProvider>
          {children}
          <Toaster 
            position="bottom-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(12px)',
                color: '#fff',
                border: '1px solid rgba(168, 85, 247, 0.3)',
                borderRadius: '12px',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#a855f7',
                  secondary: '#fff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ec4899',
                  secondary: '#fff',
                },
              },
            }}
          />
        </SessionProvider>
      </body>
    </html>
  )
}

