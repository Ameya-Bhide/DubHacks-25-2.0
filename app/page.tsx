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
  const [activeTab, setActiveTab] = useState('home')
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showCalendarModal, setShowCalendarModal] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
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

  const handleUploadSubmit = (formData: any) => {
    const jsonData = {
      "File path": formData.filePath,
      "Date Created": formData.date,
      "Study Group Name": formData.studyGroupName,
      "Class Name": formData.className,
      "Name of file": formData.fileName,
      "1-sentence description": formData.description
    }
    
    console.log('Upload form data:', jsonData)
    setShowUploadModal(false)
    // Here you can add logic to actually upload the file or send the data to a server
  }

  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
    setShowCalendarModal(true)
  }

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()
    
    const days = []
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day))
    }
    
    return days
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
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
      {/* Navbar */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Navigation Tabs */}
            <div className="flex items-center space-x-8">
              <div className="flex items-center">
                <h1 className="text-2xl font-bold text-gray-900">Study Group</h1>
              </div>
              
              {/* Navigation Tabs */}
              <div className="hidden md:flex space-x-1">
                <button
                  onClick={() => setActiveTab('home')}
                  className={`px-4 py-2 rounded-lg font-medium transition duration-200 ${
                    activeTab === 'home'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  Home
                </button>
                <button
                  onClick={() => setActiveTab('ai')}
                  className={`px-4 py-2 rounded-lg font-medium transition duration-200 ${
                    activeTab === 'ai'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  AI
                </button>
                <button
                  onClick={() => setActiveTab('study-group')}
                  className={`px-4 py-2 rounded-lg font-medium transition duration-200 ${
                    activeTab === 'study-group'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  Study Group
                </button>
                <button
                  onClick={() => setActiveTab('documents')}
                  className={`px-4 py-2 rounded-lg font-medium transition duration-200 ${
                    activeTab === 'documents'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  Documents
                </button>
                <button
                  onClick={() => setActiveTab('calendar')}
                  className={`px-4 py-2 rounded-lg font-medium transition duration-200 ${
                    activeTab === 'calendar'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  Calendar
                </button>
              </div>
            </div>

            {/* User Actions */}
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
          
          {/* Mobile Navigation */}
          <div className="md:hidden border-t border-gray-200">
            <div className="flex space-x-1 py-2">
              <button
                onClick={() => setActiveTab('home')}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition duration-200 ${
                  activeTab === 'home'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                Home
              </button>
              <button
                onClick={() => setActiveTab('ai')}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition duration-200 ${
                  activeTab === 'ai'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                AI
              </button>
              <button
                onClick={() => setActiveTab('study-group')}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition duration-200 ${
                  activeTab === 'study-group'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                Study Group
              </button>
              <button
                onClick={() => setActiveTab('documents')}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition duration-200 ${
                  activeTab === 'documents'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                Documents
              </button>
              <button
                onClick={() => setActiveTab('calendar')}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition duration-200 ${
                  activeTab === 'calendar'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                Calendar
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Home Tab Content */}
        {activeTab === 'home' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Study Groups */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">My Study Groups</h2>
                
                <div className="text-center py-12">
                  <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Study Groups Yet</h3>
                  <p className="text-gray-600 mb-6">Start your learning journey by creating or joining a study group.</p>
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
                <div className="text-center py-8">
                  <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-gray-600 text-sm">No upcoming sessions</p>
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
        )}

        {/* AI Tab Content */}
        {activeTab === 'ai' && (
          <div className="bg-white rounded-xl shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">AI Assistant</h2>
            <div className="text-center py-12">
              <div className="mx-auto w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">AI Features Coming Soon</h3>
              <p className="text-gray-600 mb-6">Get personalized study recommendations and AI-powered learning assistance.</p>
              <button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition duration-200">
                Explore AI Features
              </button>
            </div>
          </div>
        )}

        {/* Study Group Tab Content */}
        {activeTab === 'study-group' && (
          <div className="bg-white rounded-xl shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Study Groups</h2>
            <div className="text-center py-12">
              <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Manage Study Groups</h3>
              <p className="text-gray-600 mb-6">Create, join, and manage your study groups from here.</p>
              <div className="flex space-x-4 justify-center">
                <button className="bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition duration-200">
                  Create Group
                </button>
                <button className="bg-gray-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-gray-700 transition duration-200">
                  Join Group
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Documents Tab Content */}
        {activeTab === 'documents' && (
          <div className="bg-white rounded-xl shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Documents</h2>
            <div className="text-center py-12">
              <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Documents Yet</h3>
              <p className="text-gray-600 mb-6">Upload and organize your study materials, notes, and resources.</p>
              <button 
                onClick={() => setShowUploadModal(true)}
                className="bg-green-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-green-700 transition duration-200"
              >
                Upload Documents
              </button>
            </div>
          </div>
        )}

        {/* Calendar Tab Content */}
        {activeTab === 'calendar' && (
          <div className="bg-white rounded-xl shadow-sm p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Calendar</h2>
              <div className="text-lg font-medium text-gray-700">
                {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </div>
            </div>
            
            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1 mb-4">
              {/* Day headers */}
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="p-2 text-center text-sm font-medium text-gray-500 bg-gray-50 rounded">
                  {day}
                </div>
              ))}
              
              {/* Calendar days */}
              {getDaysInMonth(new Date()).map((day, index) => (
                <div
                  key={index}
                  className={`p-2 text-center text-sm rounded cursor-pointer transition duration-200 ${
                    day
                      ? 'hover:bg-blue-100 hover:text-blue-700 text-gray-900'
                      : 'text-gray-300'
                  } ${
                    day && day.getDate() === new Date().getDate() && 
                    day.getMonth() === new Date().getMonth() && 
                    day.getFullYear() === new Date().getFullYear()
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : ''
                  }`}
                  onClick={() => day && handleDateClick(day)}
                >
                  {day ? day.getDate() : ''}
                </div>
              ))}
            </div>
            
            <div className="text-center text-sm text-gray-500 mt-4">
              Click on any date to view study group meetups and uploaded files
            </div>
          </div>
        )}
      </main>

      {/* Upload Documents Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">Upload Document</h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-gray-400 hover:text-gray-600 transition duration-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault()
              const formData = new FormData(e.target as HTMLFormElement)
              const data = {
                filePath: formData.get('filePath') as string,
                date: formData.get('date') as string,
                studyGroupName: formData.get('studyGroupName') as string,
                className: formData.get('className') as string,
                fileName: formData.get('fileName') as string,
                description: formData.get('description') as string
              }
              handleUploadSubmit(data)
            }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Path to file:
                </label>
                <input
                  type="text"
                  name="filePath"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter file path"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date (enter as MM-DD-YY):
                </label>
                <input
                  type="text"
                  name="date"
                  required
                  pattern="\d{2}-\d{2}-\d{2}"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="MM-DD-YY"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Study Group Name:
                </label>
                <input
                  type="text"
                  name="studyGroupName"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter study group name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Class Name:
                </label>
                <input
                  type="text"
                  name="className"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter class name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name of file:
                </label>
                <input
                  type="text"
                  name="fileName"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter file name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  1-sentence description:
                </label>
                <textarea
                  name="description"
                  required
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter a brief description"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Calendar Modal */}
      {showCalendarModal && selectedDate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">Date Details</h3>
              <button
                onClick={() => setShowCalendarModal(false)}
                className="text-gray-400 hover:text-gray-600 transition duration-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-2">
                {formatDate(selectedDate)}
              </h4>
            </div>

            {/* Study Group Meetups Section */}
            <div className="mb-6">
              <h5 className="text-md font-medium text-gray-700 mb-3 flex items-center">
                <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Study Group Meetups
              </h5>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="text-gray-500 text-sm">
                  No study group meetups scheduled for this date
                </div>
              </div>
            </div>

            {/* Uploaded Files Section */}
            <div className="mb-6">
              <h5 className="text-md font-medium text-gray-700 mb-3 flex items-center">
                <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Uploaded Files
              </h5>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="text-gray-500 text-sm">
                  No files uploaded on this date
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setShowCalendarModal(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

