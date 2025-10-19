'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/UnifiedAuthContext'

interface SignUpFormProps {
  onSwitchToLogin: () => void
  onSignUpSuccess: (username: string) => void
}

export default function SignUpForm({ onSwitchToLogin, onSignUpSuccess }: SignUpFormProps) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    givenName: '',
    familyName: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signUp } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long')
      return
    }

    if (!formData.givenName.trim()) {
      setError('First name is required')
      return
    }

    if (!formData.familyName.trim()) {
      setError('Last name is required')
      return
    }


    setLoading(true)

    try {
      // Use email as username since email doubles as username
      console.log('🚀 Starting signup process for:', formData.email)
      const result = await signUp(formData.email, formData.password, formData.givenName, formData.familyName)
      console.log('✅ Signup successful:', result)
      
      // Check if email verification is required
      if (result.nextStep && result.nextStep.signUpStep === 'CONFIRM_SIGN_UP') {
        console.log('📧 Email verification required')
        console.log('📬 Email destination:', result.nextStep.codeDeliveryDetails?.destination)
        console.log('📧 Delivery medium:', result.nextStep.codeDeliveryDetails?.deliveryMedium)
      }
      
      onSignUpSuccess(formData.email)
    } catch (error: any) {
      console.error('❌ Sign up error:', error)
      console.error('Error code:', error.code)
      console.error('Error message:', error.message)
      setError(error.message || 'An error occurred during sign up')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Create Account</h2>
        <p className="text-gray-600 mt-2">Join your study group community</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="givenName" className="block text-sm font-medium text-gray-700 mb-2">
              First Name
            </label>
            <input
              id="givenName"
              name="givenName"
              type="text"
              required
              value={formData.givenName}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition duration-200"
              placeholder="Enter your first name"
            />
          </div>

          <div>
            <label htmlFor="familyName" className="block text-sm font-medium text-gray-700 mb-2">
              Last Name
            </label>
            <input
              id="familyName"
              name="familyName"
              type="text"
              required
              value={formData.familyName}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition duration-200"
              placeholder="Enter your last name"
            />
          </div>
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            Email Address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            value={formData.email}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition duration-200"
            placeholder="Enter your email address"
          />
          <p className="text-xs text-gray-500 mt-1">This will also be your username</p>
        </div>


        
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            value={formData.password}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition duration-200"
            placeholder="Create a password (min 8 characters)"
          />
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
            value={formData.confirmPassword}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition duration-200"
            placeholder="Confirm your password"
          />
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Creating Account...' : 'Create Account'}
        </button>
      </form>
      
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          Already have an account?{' '}
          <button
            onClick={onSwitchToLogin}
            className="text-primary-600 hover:text-primary-500 font-medium"
          >
            Sign in here
          </button>
        </p>
      </div>
    </div>
  )
}
