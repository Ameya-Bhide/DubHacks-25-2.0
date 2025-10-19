import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/contexts/UnifiedAuthContext'
import '@/lib/aws-config'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Study Group App',
  description: 'A collaborative study platform for students',
  other: {
    'Content-Security-Policy': "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: http: https: ws: wss:; connect-src 'self' http: https: ws: wss:; img-src 'self' data: blob: http: https:; font-src 'self' data: http: https:;",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
