import type { Metadata, Viewport } from 'next'
import { Outfit, JetBrains_Mono } from 'next/font/google'
import dynamic from 'next/dynamic'
import './globals.css'
import ToasterWrapper from '@/components/ToasterWrapper'
import { ThemeProvider } from '@/components/ThemeProvider'
import { WhiteLabelProvider } from '@/components/WhiteLabelProvider'

// Dynamically import Providers with SSR disabled to avoid getDefaultConfig SSR issues
const Providers = dynamic(
  () => import('./providers').then((mod) => ({ default: mod.Providers })),
  {
    ssr: false,
    loading: () => (
      <div style={{ minHeight: '100vh', background: '#030014', color: '#fff' }} />
    )
  }
)

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
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
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
          <WhiteLabelProvider>
            <ThemeProvider>
              {children}
              <ToasterWrapper />
            </ThemeProvider>
          </WhiteLabelProvider>
        </Providers>
      </body>
    </html>
  )
}
