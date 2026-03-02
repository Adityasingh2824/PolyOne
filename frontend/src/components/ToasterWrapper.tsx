'use client'

import { Toaster } from 'react-hot-toast'

export default function ToasterWrapper() {
  return (
    <Toaster 
      position="bottom-right"
      containerStyle={{
        top: 'auto',
        bottom: '16px',
        right: '16px',
        left: 'auto',
      }}
      containerClassName="toast-container"
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
          minWidth: '300px',
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
  )
}

























