'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/UnifiedAuthContext'
import LoginForm from '@/components/LoginForm'
import SignUpForm from '@/components/SignUpForm'
import ConfirmSignUpForm from '@/components/ConfirmSignUpForm'

type AuthView = 'login' | 'signup' | 'confirm' | 'forgot'

export default function Home() {
  const [authView, setAuthView] = useState<AuthView>('login')
  const [confirmEmail, setConfirmEmail] = useState('')
  const { user, loading, signOut } = useAuth()

  const handleLogout = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const handleSignUpSuccess = (email: string) => {
    setConfirmEmail(email)
    setAuthView('confirm')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Study Group</h1>
            <p className="text-gray-600">Connect, Learn, and Study Together</p>
          </div>
          
          {authView === 'login' && (
            <LoginForm
              onSwitchToSignUp={() => setAuthView('signup')}
              onSwitchToForgotPassword={() => setAuthView('forgot')}
            />
          )}
          
          {authView === 'signup' && (
            <SignUpForm
              onSwitchToLogin={() => setAuthView('login')}
              onSignUpSuccess={handleSignUpSuccess}
            />
          )}
          
        {authView === 'confirm' && (
          <ConfirmSignUpForm
            email={confirmEmail}
            onBackToLogin={() => setAuthView('login')}
          />
        )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Study Group</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Welcome, {user.username}!</span>
              <button
                onClick={handleLogout}
                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition duration-200"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Study Groups */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">My Study Groups</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition duration-200">
                  <h3 className="font-semibold text-gray-900 mb-2">Mathematics Study Group</h3>
                  <p className="text-gray-600 text-sm mb-3">Advanced Calculus and Linear Algebra</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">5 members</span>
                    <span className="text-sm text-green-600">Active</span>
                  </div>
                </div>
                
                <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition duration-200">
                  <h3 className="font-semibold text-gray-900 mb-2">Computer Science</h3>
                  <p className="text-gray-600 text-sm mb-3">Data Structures and Algorithms</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">8 members</span>
                    <span className="text-sm text-green-600">Active</span>
                  </div>
                </div>
                
                <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition duration-200">
                  <h3 className="font-semibold text-gray-900 mb-2">Physics Study Group</h3>
                  <p className="text-gray-600 text-sm mb-3">Quantum Mechanics and Thermodynamics</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">3 members</span>
                    <span className="text-sm text-yellow-600">Inactive</span>
                  </div>
                </div>
                
                <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition duration-200">
                  <h3 className="font-semibold text-gray-900 mb-2">Chemistry Lab Group</h3>
                  <p className="text-gray-600 text-sm mb-3">Organic Chemistry and Lab Techniques</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">6 members</span>
                    <span className="text-sm text-green-600">Active</span>
                  </div>
                </div>
              </div>
              
              <button className="mt-6 w-full bg-primary-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-primary-700 transition duration-200">
                Create New Study Group
              </button>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Upcoming Sessions */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Sessions</h3>
              <div className="space-y-3">
                <div className="border-l-4 border-primary-500 pl-4">
                  <p className="font-medium text-gray-900">Math Study Session</p>
                  <p className="text-sm text-gray-600">Today, 2:00 PM</p>
                </div>
                <div className="border-l-4 border-green-500 pl-4">
                  <p className="font-medium text-gray-900">CS Code Review</p>
                  <p className="text-sm text-gray-600">Tomorrow, 10:00 AM</p>
                </div>
                <div className="border-l-4 border-yellow-500 pl-4">
                  <p className="font-medium text-gray-900">Physics Problem Solving</p>
                  <p className="text-sm text-gray-600">Friday, 3:00 PM</p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition duration-200">
                  <div className="font-medium text-gray-900">Join Study Session</div>
                  <div className="text-sm text-gray-600">Find active sessions</div>
                </button>
                <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition duration-200">
                  <div className="font-medium text-gray-900">Share Notes</div>
                  <div className="text-sm text-gray-600">Upload study materials</div>
                </button>
                <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition duration-200">
                  <div className="font-medium text-gray-900">Schedule Meeting</div>
                  <div className="text-sm text-gray-600">Plan group study time</div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

