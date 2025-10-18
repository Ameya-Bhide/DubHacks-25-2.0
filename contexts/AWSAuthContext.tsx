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
    // Check if user is already signed in
    checkUser()
    
    // Listen for auth events
    const unsubscribe = Hub.listen('auth', ({ payload: { event, data } }) => {
      console.log('Auth event:', event, data)
      switch (event) {
        case 'signedIn':
          setUser({
            username: data.username,
            email: data.signInDetails?.loginId || data.username,
            attributes: {
              email: data.signInDetails?.loginId || data.username,
              email_verified: true
            }
          })
          break
        case 'signedOut':
          setUser(null)
          break
        case 'signUp':
          console.log('User signed up:', data)
          break
        case 'signInWithRedirect':
          console.log('Sign in with redirect:', data)
          break
        case 'signInWithRedirect_failure':
          console.error('Sign in with redirect failed:', data)
          break
        case 'signUp_failure':
          console.error('Sign up failed:', data)
          break
        case 'confirmSignUp_failure':
          console.error('Confirm sign up failed:', data)
          break
        case 'resetPassword_failure':
          console.error('Reset password failed:', data)
          break
        case 'confirmResetPassword_failure':
          console.error('Confirm reset password failed:', data)
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
        email: user.signInDetails?.loginId || user.username,
        attributes: {
          email: user.signInDetails?.loginId || user.username,
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

  const handleSignIn = async (username: string, password: string) => {
    try {
      const result = await signIn({
        username,
        password,
      })
      console.log('Sign in result:', result)
      
      if (result.isSignedIn) {
        setUser({
          username: result.username,
          email: result.signInDetails?.loginId || result.username,
          attributes: {
            email: result.signInDetails?.loginId || result.username,
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

  const handleSignUp = async (username: string, password: string, email: string) => {
    try {
      const result = await signUp({
        username,
        password,
        options: {
          userAttributes: {
            email,
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
