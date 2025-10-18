'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

interface User {
  username: string
  email: string
  attributes: {
    email: string
    email_verified: boolean
  }
}

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (username: string, password: string) => Promise<any>
  signUp: (username: string, password: string, email: string) => Promise<any>
  signOut: () => Promise<void>
  confirmSignUp: (username: string, code: string) => Promise<any>
  resendSignUp: (username: string) => Promise<any>
  forgotPassword: (username: string) => Promise<any>
  forgotPasswordSubmit: (username: string, code: string, newPassword: string) => Promise<any>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is already signed in (from localStorage)
    checkUser()
  }, [])

  const checkUser = async () => {
    try {
      if (typeof window !== 'undefined') {
        const storedUser = localStorage.getItem('dev-user')
        if (storedUser) {
          const userData = JSON.parse(storedUser)
          setUser({
            username: userData.username,
            email: userData.signInDetails?.loginId || userData.username,
            attributes: {
              email: userData.signInDetails?.loginId || userData.username,
              email_verified: true
            }
          })
        }
      }
    } catch (error) {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const handleSignIn = async (username: string, password: string) => {
    try {
      // Simple dev authentication - accepts any username/password
      if (username && password) {
        const userData = {
          username,
          signInDetails: {
            loginId: username.includes('@') ? username : `${username}@example.com`
          }
        }
        
        // Store user in localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('dev-user', JSON.stringify(userData))
        }
        
        setUser({
          username,
          email: userData.signInDetails.loginId,
          attributes: {
            email: userData.signInDetails.loginId,
            email_verified: true
          }
        })
        
        return userData
      }
      throw new Error('Invalid credentials')
    } catch (error) {
      throw error
    }
  }

  const handleSignUp = async (username: string, password: string, email: string) => {
    try {
      // Simple dev signup - always succeeds
      return {
        isSignUpComplete: false,
        nextStep: {
          signUpStep: 'CONFIRM_SIGN_UP',
          codeDeliveryDetails: {
            destination: email,
            deliveryMedium: 'EMAIL',
            attributeName: 'email'
          }
        }
      }
    } catch (error) {
      throw error
    }
  }

  const handleSignOut = async () => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('dev-user')
      }
      setUser(null)
    } catch (error) {
      throw error
    }
  }

  const handleConfirmSignUp = async (username: string, code: string) => {
    try {
      // Simple dev confirmation - accepts any code
      return { isSignUpComplete: true }
    } catch (error) {
      throw error
    }
  }

  const handleResendSignUp = async (username: string) => {
    try {
      return { isCodeDeliverySuccessful: true }
    } catch (error) {
      throw error
    }
  }

  const handleForgotPassword = async (username: string) => {
    try {
      return { isCodeDeliverySuccessful: true }
    } catch (error) {
      throw error
    }
  }

  const handleForgotPasswordSubmit = async (username: string, code: string, newPassword: string) => {
    try {
      return { isPasswordResetComplete: true }
    } catch (error) {
      throw error
    }
  }

  const value = {
    user,
    loading,
    signIn: handleSignIn,
    signUp: handleSignUp,
    signOut: handleSignOut,
    confirmSignUp: handleConfirmSignUp,
    resendSignUp: handleResendSignUp,
    forgotPassword: handleForgotPassword,
    forgotPasswordSubmit: handleForgotPasswordSubmit,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
