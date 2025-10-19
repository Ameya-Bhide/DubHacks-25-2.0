'use client'

import React, { useEffect, useState } from 'react'
import { hasRealAWSConfig } from '@/lib/aws-config'
import { AuthProvider as SimpleAuthProvider } from './SimpleAuthContext'
import { AuthProvider as AWSAuthProvider } from './AWSAuthContext'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAWSMode, setIsAWSMode] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if we have real AWS configuration
    const hasAWS = hasRealAWSConfig()
    setIsAWSMode(hasAWS)
    setLoading(false)
    
    if (hasAWS) {
      console.log('🔐 Using AWS Cognito authentication')
    } else {
      console.log('🛠️ Using development authentication')
    }
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading authentication...</p>
        </div>
      </div>
    )
  }

  // Use AWS authentication if configured, otherwise use simple dev authentication
  if (isAWSMode) {
    return <AWSAuthProvider>{children}</AWSAuthProvider>
  } else {
    return <SimpleAuthProvider>{children}</SimpleAuthProvider>
  }
}

// Re-export the useAuth hook from the appropriate context
export { useAuth } from './SimpleAuthContext'
