import type { Metadata } from 'next'
import { Outfit, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'

import { Providers } from './providers'

const outfit = Outfit({ 
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({ 
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'PolyOne | Launch Your Polygon App Chain',
  description: 'The most powerful Blockchain-as-a-Service platform built on Polygon CDK. Deploy custom app chains in minutes with enterprise-grade security.',
  keywords: 'blockchain, polygon, zkEVM, CDK, app chain, rollup, validium, BaaS, web3, smart contracts, enterprise blockchain',
  authors: [{ name: 'PolyOne Labs' }],
  openGraph: {
    title: 'PolyOne | Launch Your Polygon App Chain',
    description: 'Deploy custom blockchain networks in minutes with PolyOne',
    type: 'website',
    locale: 'en_US',
    siteName: 'PolyOne',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PolyOne | Launch Your Polygon App Chain',
    description: 'Deploy custom blockchain networks in minutes with PolyOne',
  },
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg'
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
  },
  themeColor: '#030014',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${outfit.variable} ${jetbrainsMono.variable}`}>
      <body className="font-sans antialiased">
        <Providers>
          {children}
          <Toaster 
            position="bottom-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: 'linear-gradient(135deg, rgba(15, 7, 36, 0.95) 0%, rgba(10, 1, 24, 0.9) 100%)',
                backdropFilter: 'blur(20px)',
                color: '#fff',
                border: '1px solid rgba(168, 85, 247, 0.3)',
                borderRadius: '12px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 40px rgba(168, 85, 247, 0.1)',
                fontFamily: 'var(--font-outfit)',
                fontSize: '14px',
                padding: '12px 16px',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#fff',
                },
              },
              error: {
                duration: 4000,
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
              loading: {
                iconTheme: {
                  primary: '#a855f7',
                  secondary: '#fff',
                },
              },
            }}
          />
        </Providers>
      </body>
    </html>
  )
}
