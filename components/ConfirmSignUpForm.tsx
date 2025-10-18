'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/UnifiedAuthContext'

interface ConfirmSignUpFormProps {
  email: string
  onBackToLogin: () => void
}

export default function ConfirmSignUpForm({ email, onBackToLogin }: ConfirmSignUpFormProps) {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const { confirmSignUp, resendSignUp } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await confirmSignUp(email, code)
      setSuccess(true)
    } catch (error: any) {
      console.error('Confirm sign up error:', error)
      setError(error.message || 'Invalid verification code')
    } finally {
      setLoading(false)
    }
  }

  const handleResendCode = async () => {
    setError('')
    setResendLoading(true)

    try {
      await resendSignUp(email)
      setError('')
    } catch (error: any) {
      console.error('Resend code error:', error)
      setError(error.message || 'Failed to resend verification code')
    } finally {
      setResendLoading(false)
    }
  }

  if (success) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
            <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Account Verified!</h2>
          <p className="text-gray-600 mb-6">Your account has been successfully verified. You can now sign in.</p>
          <button
            onClick={onBackToLogin}
            className="w-full bg-primary-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-primary-700 transition duration-200"
          >
            Sign In
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Verify Your Email</h2>
        <p className="text-gray-600 mt-2">
          We've sent a verification code to your email address
        </p>
        <p className="text-sm text-gray-500 mt-1">
          Email: <span className="font-medium">{email}</span>
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
            Verification Code
          </label>
          <input
            id="code"
            type="text"
            required
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition duration-200 text-center text-lg tracking-widest"
            placeholder="Enter 6-digit code"
            maxLength={6}
          />
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Verifying...' : 'Verify Account'}
        </button>
      </form>
      
      <div className="mt-6 space-y-3">
        <button
          onClick={handleResendCode}
          disabled={resendLoading}
          className="w-full text-center text-sm text-primary-600 hover:text-primary-500 font-medium disabled:opacity-50"
        >
          {resendLoading ? 'Sending...' : "Didn't receive a code? Resend"}
        </button>
        
        <div className="text-center">
          <button
            onClick={onBackToLogin}
            className="text-sm text-gray-600 hover:text-gray-500"
          >
            Back to Sign In
          </button>
        </div>
      </div>
    </div>
  )
}
