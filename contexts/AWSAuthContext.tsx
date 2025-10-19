'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { signIn, signUp, signOut, confirmSignUp, resendSignUpCode, resetPassword, confirmResetPassword, getCurrentUser, fetchAuthSession } from 'aws-amplify/auth'
import { Hub } from 'aws-amplify/utils'

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
  signIn: (email: string, password: string) => Promise<any>
  signUp: (email: string, password: string, givenName: string, familyName: string) => Promise<any>
  signOut: () => Promise<void>
  confirmSignUp: (email: string, code: string) => Promise<any>
  resendSignUp: (email: string) => Promise<any>
  forgotPassword: (email: string) => Promise<any>
  forgotPasswordSubmit: (email: string, code: string, newPassword: string) => Promise<any>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is already signed in
    checkUser()
    
    // Listen for auth events
    const unsubscribe = Hub.listen('auth', ({ payload }) => {
      console.log('Auth event:', payload.event, payload)
      switch (payload.event) {
        case 'signedIn':
          if ('data' in payload && payload.data) {
            setUser({
              username: (payload.data as any).username || (payload.data as any).userId,
              email: (payload.data as any).signInDetails?.loginId || (payload.data as any).username || (payload.data as any).userId,
              attributes: {
                email: (payload.data as any).signInDetails?.loginId || (payload.data as any).username || (payload.data as any).userId,
                email_verified: true
              }
            })
          }
          break
        case 'signedOut':
          setUser(null)
          break
        case 'signInWithRedirect':
          console.log('Sign in with redirect:', payload)
          break
        case 'signInWithRedirect_failure':
          console.error('Sign in with redirect failed:', payload)
          break
        default:
          break
      }
    })

    return unsubscribe
  }, [])

  const checkUser = async () => {
    try {
      const user = await getCurrentUser()
      console.log('Current user:', user)
      setUser({
        username: user.username,
        email: user.username, // Use username as email since we use email as username
        attributes: {
          email: user.username,
          email_verified: true
        }
      })
    } catch (error) {
      console.log('No authenticated user:', error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const handleSignIn = async (email: string, password: string) => {
    try {
      const result = await signIn({
        username: email,
        password,
      })
      console.log('Sign in result:', result)
      
      if (result.isSignedIn) {
        setUser({
          username: email,
          email: email,
          attributes: {
            email: email,
            email_verified: true
          }
        })
      }
      
      return result
    } catch (error) {
      console.error('Sign in error:', error)
      throw error
    }
  }

  const handleSignUp = async (email: string, password: string, givenName: string, familyName: string) => {
    try {
      const result = await signUp({
        username: email, // Use email as username
        password,
        options: {
          userAttributes: {
            email,
            given_name: givenName,
            family_name: familyName,
          },
        },
      })
      console.log('Sign up result:', result)
      return result
    } catch (error) {
      console.error('Sign up error:', error)
      throw error
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      setUser(null)
    } catch (error) {
      console.error('Sign out error:', error)
      throw error
    }
  }

  const handleConfirmSignUp = async (username: string, code: string) => {
    try {
      const result = await confirmSignUp({
        username,
        confirmationCode: code,
      })
      console.log('Confirm sign up result:', result)
      return result
    } catch (error) {
      console.error('Confirm sign up error:', error)
      throw error
    }
  }

  const handleResendSignUp = async (username: string) => {
    try {
      const result = await resendSignUpCode({
        username,
      })
      console.log('Resend sign up result:', result)
      return result
    } catch (error) {
      console.error('Resend sign up error:', error)
      throw error
    }
  }

  const handleForgotPassword = async (username: string) => {
    try {
      const result = await resetPassword({
        username,
      })
      console.log('Reset password result:', result)
      return result
    } catch (error) {
      console.error('Reset password error:', error)
      throw error
    }
  }

  const handleForgotPasswordSubmit = async (username: string, code: string, newPassword: string) => {
    try {
      const result = await confirmResetPassword({
        username,
        confirmationCode: code,
        newPassword,
      })
      console.log('Confirm reset password result:', result)
      return result
    } catch (error) {
      console.error('Confirm reset password error:', error)
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
