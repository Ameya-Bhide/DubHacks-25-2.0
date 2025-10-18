'use client'

import { useState } from 'react'

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: ''
  })

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    // Simple validation - in a real app, this would connect to a backend
    if (loginForm.email && loginForm.password) {
      setIsLoggedIn(true)
    }
  }

  const handleLogout = () => {
    setIsLoggedIn(false)
    setLoginForm({ email: '', password: '' })
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Study Group</h1>
            <p className="text-gray-600">Connect, Learn, and Study Together</p>
          </div>
          
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition duration-200"
                  placeholder="Enter your email"
                />
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition duration-200"
                  placeholder="Enter your password"
                />
              </div>
              
              <button
                type="submit"
                className="w-full bg-primary-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition duration-200"
              >
                Sign In
              </button>
            </form>
            
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <a href="#" className="text-primary-600 hover:text-primary-500 font-medium">
                  Sign up here
                </a>
              </p>
            </div>
          </div>
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
              <span className="text-gray-700">Welcome back!</span>
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
