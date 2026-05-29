import type { Metadata } from 'next'
import Providers from '@/components/Providers'
import Navbar from '@/components/Navbar'
import './globals.css'

export const metadata: Metadata = {
  title: 'Office Snack Box',
  description: 'ระบบจัดการขนมออฟฟิศ',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body style={{ minHeight: '100vh' }}>
        {/* Fixed background image */}
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundImage: 'url(/snack-bg2.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            zIndex: -2,
          }}
        />
        {/* Light overlay for readability */}
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(244, 244, 245, 0.55)',
            zIndex: -1,
          }}
        />

        <Providers>
          <Navbar />
          <main
            style={{
              maxWidth: 1200,
              margin: '0 auto',
              padding: '24px',
            }}
          >
            <div
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid rgba(0,0,0,0.08)',
                borderRadius: 16,
                padding: '28px 32px 36px',
                boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
              }}
            >
              {children}
            </div>
          </main>
        </Providers>
      </body>
    </html>
  )
}
