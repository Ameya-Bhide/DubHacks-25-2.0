'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/UnifiedAuthContext'
import LoginForm from '@/components/LoginForm'
import SignUpForm from '@/components/SignUpForm'
import ConfirmSignUpForm from '@/components/ConfirmSignUpForm'
import CreateGroupModal from '@/components/CreateGroupModal'
import { createStudyGroup, getUserStudyGroups, devStudyGroups, StudyGroup, leaveStudyGroup } from '@/lib/aws-study-groups'
import { hasRealAWSConfig } from '@/lib/aws-config'

type AuthView = 'login' | 'signup' | 'confirm' | 'forgot'

export default function Home() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [authView, setAuthView] = useState<AuthView>('login')
  const [confirmEmail, setConfirmEmail] = useState('')
  const [activeTab, setActiveTab] = useState('home')
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false)
  const [studyGroups, setStudyGroups] = useState<StudyGroup[]>([])
  const { user, loading, signOut } = useAuth()

  // Handle URL tab parameter
  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab && ['home', 'ai', 'study-group', 'documents', 'calendar'].includes(tab)) {
      setActiveTab(tab)
    }
  }, [searchParams])

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

  // Load study groups when user is authenticated
  useEffect(() => {
    if (user) {
      loadStudyGroups()
    }
  }, [user])

  const loadStudyGroups = async () => {
    if (!user) return

    try {
      const isAWS = hasRealAWSConfig()
      const groups = isAWS
        ? await getUserStudyGroups(user.username) // Real AWS call
        : await devStudyGroups.getUserStudyGroups(user.username)

      setStudyGroups(groups)
      
      // Debug: Log all groups to console
      console.log('📊 All Study Groups:', groups)
      if (isAWS) {
        console.log('🔗 AWS Mode - Data loaded from DynamoDB')
      } else {
        console.log('💾 Dev Mode - Data stored in localStorage')
      }
    } catch (error) {
      console.error('Error loading study groups:', error)
    }
  }

  const handleCreateGroup = async (groupData: any) => {
    if (!user) return

    try {
      const isAWS = hasRealAWSConfig()
      const newGroup = isAWS
        ? await createStudyGroup(groupData, user.username) // Real AWS call
        : await devStudyGroups.createStudyGroup(groupData, user.username)
      
      setStudyGroups(prev => [newGroup, ...prev])
      console.log('Study group created:', newGroup)
      if (isAWS) {
        console.log('🔗 AWS Mode - Group saved to DynamoDB')
      } else {
        console.log('💾 Dev Mode - Group saved to localStorage')
      }
    } catch (error) {
      console.error('Error creating study group:', error)
      throw error
    }
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
          <div className="space-y-6">
            {/* Header with Action Buttons */}
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">My Study Groups</h2>
              <div className="flex items-center space-x-3">
                <button className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition duration-200 font-medium flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                  Invites
                  <span className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">2</span>
                </button>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition duration-200 font-medium flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Find Groups
                </button>
              </div>
            </div>

            {/* Main Study Groups Content */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              {studyGroups.length === 0 ? (
                <div className="text-center py-12">
                  <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Study Groups Yet</h3>
                  <p className="text-gray-600 mb-6">Start your learning journey by creating or joining a study group.</p>
                  <button 
                    onClick={() => setIsCreateGroupOpen(true)}
                    className="bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition duration-200"
                  >
                    Create Your First Group
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {studyGroups.map(group => (
                    <div 
                      key={group.id} 
                      onClick={() => router.push(`/study-group/${group.id}`)}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">{group.name}</h3>
                          <p className="text-gray-600 text-sm mb-3">{group.description}</p>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span className="flex items-center">
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                              </svg>
                              {group.memberCount}/{group.maxMembers} members
                            </span>
                            <span className="flex items-center">
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {group.meetingFrequency} • {group.meetingDay} at {group.meetingTime}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              group.subject === 'Computer Science' ? 'bg-blue-100 text-blue-800' :
                              group.subject === 'Data Science' ? 'bg-green-100 text-green-800' :
                              group.subject === 'Mathematics' ? 'bg-purple-100 text-purple-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {group.subject}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="flex -space-x-2">
                            {group.members.slice(0, 3).map((member, index) => (
                              <div
                                key={member}
                                className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-medium"
                              >
                                {member.charAt(0).toUpperCase()}
                              </div>
                            ))}
                            {group.members.length > 3 && (
                              <div className="w-8 h-8 bg-gray-200 rounded-full border-2 border-white flex items-center justify-center text-gray-600 text-xs font-medium">
                                +{group.members.length - 3}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Floating Add Group Button */}
            <button 
              onClick={() => setIsCreateGroupOpen(true)}
              className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 hover:shadow-xl transition-all duration-200 flex items-center justify-center z-50"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </button>
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
              <button className="bg-green-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-green-700 transition duration-200">
                Upload Documents
              </button>
            </div>
          </div>
        )}

        {/* Calendar Tab Content */}
        {activeTab === 'calendar' && (
          <div className="bg-white rounded-xl shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Calendar</h2>
            <div className="text-center py-12">
              <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Schedule Your Study Sessions</h3>
              <p className="text-gray-600 mb-6">Plan and manage your study schedule and group meetings.</p>
              <button className="bg-purple-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-purple-700 transition duration-200">
                View Calendar
              </button>
            </div>
          </div>
        )}
      </main>


      {/* Create Group Modal */}
      <CreateGroupModal
        isOpen={isCreateGroupOpen}
        onClose={() => setIsCreateGroupOpen(false)}
        onCreateGroup={handleCreateGroup}
      />

    </div>
  )
}

