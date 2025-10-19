import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/contexts/UnifiedAuthContext'
import '@/lib/aws-config'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Syntra',
  description: 'A collaborative study platform for students',
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
