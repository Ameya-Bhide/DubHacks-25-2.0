'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { hasRealAWSConfig } from '@/lib/aws-config'

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
  const [isAWSMode, setIsAWSMode] = useState(false)

  useEffect(() => {
    // Check if we have real AWS configuration
    const hasAWS = hasRealAWSConfig()
    setIsAWSMode(hasAWS)
    
    if (hasAWS) {
      console.log('🔐 Using AWS Cognito authentication')
      // Initialize AWS auth
      initializeAWSAuth()
    } else {
      console.log('🛠️ Using development authentication')
      // Initialize dev auth
      initializeDevAuth()
    }
  }, [])

  const initializeAWSAuth = async () => {
    try {
      // Dynamically import AWS auth functions
      const { signIn: awsSignIn, signUp: awsSignUp, signOut: awsSignOut, confirmSignUp: awsConfirmSignUp, resendSignUpCode, resetPassword, confirmResetPassword, getCurrentUser, fetchAuthSession } = await import('aws-amplify/auth')
      const { Hub } = await import('aws-amplify/utils')

      // Check if user is already signed in
      try {
        const currentUser = await getCurrentUser()
        setUser({
          username: currentUser.username,
          email: currentUser.signInDetails?.loginId || currentUser.username,
          attributes: {
            email: currentUser.signInDetails?.loginId || currentUser.username,
            email_verified: true
          }
        })
      } catch (error) {
        setUser(null)
      }

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
        }
      })

      // Store auth functions
      setAuthFunctions({
        signIn: async (email: string, password: string) => {
          const result = await awsSignIn({ username: email, password })
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
        },
        signUp: async (email: string, password: string, givenName: string, familyName: string) => {
          return await awsSignUp({
            username: email,
            password,
            options: { 
              userAttributes: { 
                email,
                given_name: givenName,
                family_name: familyName
              } 
            }
          })
        },
        signOut: async () => {
          await awsSignOut()
          setUser(null)
        },
        confirmSignUp: async (email: string, code: string) => {
          return await awsConfirmSignUp({ username: email, confirmationCode: code })
        },
        resendSignUp: async (email: string) => {
          return await resendSignUpCode({ username: email })
        },
        forgotPassword: async (email: string) => {
          return await resetPassword({ username: email })
        },
        forgotPasswordSubmit: async (email: string, code: string, newPassword: string) => {
          return await confirmResetPassword({ username: email, confirmationCode: code, newPassword })
        }
      })

      return () => unsubscribe()
    } catch (error) {
      console.error('Failed to initialize AWS auth:', error)
      // Fallback to dev auth
      initializeDevAuth()
    } finally {
      setLoading(false)
    }
  }

  const initializeDevAuth = async () => {
    try {
      // Check if user is in localStorage
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

      // Store dev auth functions
      setAuthFunctions({
        signIn: async (email: string, password: string) => {
          if (email && password) {
            const userData = {
              username: email,
              signInDetails: {
                loginId: email
              }
            }
            
            if (typeof window !== 'undefined') {
              localStorage.setItem('dev-user', JSON.stringify(userData))
            }
            
            setUser({
              username: email,
              email: userData.signInDetails.loginId,
              attributes: {
                email: userData.signInDetails.loginId,
                email_verified: true
              }
            })
            
            return userData
          }
          throw new Error('Invalid credentials')
        },
        signUp: async (email: string, password: string, givenName: string, familyName: string) => {
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
        },
        signOut: async () => {
          if (typeof window !== 'undefined') {
            localStorage.removeItem('dev-user')
          }
          setUser(null)
        },
        confirmSignUp: async (email: string, code: string) => {
          return { isSignUpComplete: true }
        },
        resendSignUp: async (email: string) => {
          return { isCodeDeliverySuccessful: true }
        },
        forgotPassword: async (email: string) => {
          return { isCodeDeliverySuccessful: true }
        },
        forgotPasswordSubmit: async (email: string, code: string, newPassword: string) => {
          return { isPasswordResetComplete: true }
        }
      })
    } catch (error) {
      console.error('Failed to initialize dev auth:', error)
    } finally {
      setLoading(false)
    }
  }

  const [authFunctions, setAuthFunctions] = useState<Omit<AuthContextType, 'user' | 'loading'>>({
    signIn: async () => {},
    signUp: async () => {},
    signOut: async () => {},
    confirmSignUp: async () => {},
    resendSignUp: async () => {},
    forgotPassword: async () => {},
    forgotPasswordSubmit: async () => {}
  })

  const value = {
    user,
    loading,
    ...authFunctions
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
