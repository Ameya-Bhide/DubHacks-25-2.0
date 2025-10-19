'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/UnifiedAuthContext'
import LoginForm from '@/components/LoginForm'
import SignUpForm from '@/components/SignUpForm'
import ConfirmSignUpForm from '@/components/ConfirmSignUpForm'
import CreateGroupModal from '@/components/CreateGroupModal'
import InviteCard from '@/components/InviteCard'
import FileNotifications from '@/components/FileNotifications'
import DocumentCard from '@/components/DocumentCard'
import { createStudyGroup, getUserStudyGroups, devStudyGroups, StudyGroup, leaveStudyGroup } from '@/lib/aws-study-groups'
import { hasRealAWSConfig } from '@/lib/aws-config'
import { getUserProfile, UserProfile } from '@/lib/aws-user-profiles'

type AuthView = 'login' | 'signup' | 'confirm' | 'forgot'

export default function Home() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [authView, setAuthView] = useState<AuthView>('login')
  const [confirmEmail, setConfirmEmail] = useState('')
  const [activeTab, setActiveTab] = useState('home')
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showCalendarModal, setShowCalendarModal] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false)
  const [studyGroups, setStudyGroups] = useState<StudyGroup[]>([])
  const [invites, setInvites] = useState<any[]>([])
  const [showInvites, setShowInvites] = useState(false)
  const [showFileNotifications, setShowFileNotifications] = useState(false)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [documents, setDocuments] = useState<any[]>([])
  const [documentsLoading, setDocumentsLoading] = useState(false)
  const { user, loading, signOut, isAWSMode, retryAWS } = useAuth()

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

  const handleUploadSubmit = async (formData: any, file: File) => {
    console.log('Upload form data:', formData)
    console.log('Selected file:', file)
    
    try {
      // Create file record for .ai_helper system
      const fileRecord = {
        fileName: formData.fileName,
        originalFileName: file.name,
        filePath: `~/Documents/UploadedFiles/${file.name}`, // This will be expanded by the system
        studyGroupName: formData.studyGroupName,
        description: formData.description,
        dateCreated: formData.date,
        className: formData.className,
        fileSize: file.size,
        fileType: file.type,
        uploadedBy: user?.username || 'unknown-user',
        uploadedAt: new Date().toISOString(),
        isPersonal: formData.studyGroupName === 'Personal'
      }

      // Save file record to .ai_helper system
      const saveResponse = await fetch('/api/ai-helper-files', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'saveFileRecord',
          data: fileRecord
        })
      })
      
      const saveResult = await saveResponse.json()
      
      if (saveResult.success) {
        console.log('File record saved successfully:', saveResult)
        
        // Refresh the documents list
        loadDocuments()
        
        if (formData.studyGroupName !== 'Personal') {
          alert(`File uploaded successfully and shared with ${formData.studyGroupName} members!`)
        } else {
          alert('File uploaded successfully!')
        }
      } else {
        console.error('Error saving file record:', saveResult.error)
        alert(`Failed to save file record: ${saveResult.error}`)
      }
    } catch (error) {
      console.error('Error in upload process:', error)
      alert('Failed to upload file. Please try again.')
    }
    
    setShowUploadModal(false)
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

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentMonth)
    
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1)
    } else {
      newDate.setMonth(newDate.getMonth() + 1)
    }
    
    // Check boundaries (January 2025 to December 2026)
    const year = newDate.getFullYear()
    const month = newDate.getMonth()
    
    if (year < 2025 || (year === 2025 && month < 0)) {
      return // Don't navigate before January 2025
    }
    
    if (year > 2026 || (year === 2026 && month > 11)) {
      return // Don't navigate after December 2026
    }
    
    setCurrentMonth(newDate)
  }

  const canNavigatePrev = () => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    return !(year === 2025 && month === 0) // Can't go before January 2025
  }

  const canNavigateNext = () => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    return !(year === 2026 && month === 11) // Can't go after December 2026
  }

  // Load study groups, invites, user profile, and documents when user is authenticated
  useEffect(() => {
    if (user) {
      loadStudyGroups()
      loadInvites()
      loadUserProfile()
      loadDocuments()
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

  const loadInvites = async () => {
    if (!user) return

    try {
      const response = await fetch('/api/study-groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'getUserInvites',
          data: { userId: user.username }
        })
      })

      const result = await response.json()
      if (result.success) {
        setInvites(result.invites)
      }
    } catch (error) {
      console.error('Error loading invites:', error)
    }
  }

  const loadUserProfile = async () => {
    if (!user) return

    try {
      const profile = await getUserProfile(user.username)
      setUserProfile(profile)
      console.log('📋 User profile loaded:', profile)
    } catch (error) {
      console.error('Error loading user profile:', error)
    }
  }

  const loadDocuments = async () => {
    if (!user) return

    setDocumentsLoading(true)
    try {
      const response = await fetch(`/api/ai-helper-files?userId=${user.username}&action=getUserFiles`)
      const result = await response.json()
      
      if (result.success) {
        setDocuments(result.files)
        console.log('📄 Documents loaded from .ai_helper:', result.files)
      } else {
        console.error('Error loading documents:', result.error)
      }
    } catch (error) {
      console.error('Error loading documents:', error)
    } finally {
      setDocumentsLoading(false)
    }
  }

  const handleDocumentOpen = async (filePath: string, fileName: string) => {
    try {
      // For local files, show the file path
      alert(`File location: ${filePath}\n\nYou can open it directly from your file system.`)
    } catch (error) {
      console.error('Error opening document:', error)
      alert('Failed to open document. Please try again.')
    }
  }

  const handleDocumentDelete = async (fileId: string, filePath: string) => {
    try {
      const response = await fetch('/api/ai-helper-files', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ filePath })
      })
      
      const result = await response.json()
      
      if (result.success) {
        // Remove from local state
        setDocuments(prev => prev.filter(doc => doc.id !== fileId))
        alert('Document deleted successfully!')
      } else {
        console.error('Error deleting document:', result.error)
        alert(`Error deleting document: ${result.error}`)
      }
    } catch (error) {
      console.error('Error deleting document:', error)
      alert('Failed to delete document. Please try again.')
    }
  }

  const handleInviteResponse = async (inviteId: string, response: 'accept' | 'decline') => {
    if (!user) return

    try {
      const apiResponse = await fetch('/api/study-groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'respondToInvite',
          data: { 
            inviteId, 
            userId: user.username, 
            response 
          }
        })
      })

      const result = await apiResponse.json()
      if (result.success) {
        // Remove the invite from the list
        setInvites(prev => prev.filter(invite => invite.id !== inviteId))
        
        // If accepted, reload study groups
        if (response === 'accept') {
          loadStudyGroups()
        }
        
        alert(result.message)
      } else {
        alert(result.error || 'Failed to respond to invite')
      }
    } catch (error) {
      console.error('Error responding to invite:', error)
      alert('Failed to respond to invite')
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
              
              {/* Mode Indicator */}
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  isAWSMode 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {isAWSMode ? 'AWS Mode' : 'Dev Mode'}
                </span>
                {!isAWSMode && hasRealAWSConfig() && (
                  <button
                    onClick={retryAWS}
                    className="bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600 transition duration-200"
                    title="Retry AWS authentication"
                  >
                    Retry AWS
                  </button>
                )}
              </div>
              
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
                <button 
                  onClick={() => setShowInvites(!showInvites)}
                  className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition duration-200 font-medium flex items-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                  Invites
                  {invites.length > 0 && (
                    <span className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">{invites.length}</span>
                  )}
                </button>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition duration-200 font-medium flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Find Groups
                </button>
              </div>
            </div>

            {/* Invites Section */}
            {showInvites && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Pending Invites</h3>
                {invites.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                      </svg>
                    </div>
                    <p className="text-gray-600">No pending invites</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {invites.map(invite => (
                      <InviteCard
                        key={invite.id}
                        invite={invite}
                        onRespond={handleInviteResponse}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

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
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Documents</h2>
              <div className="flex items-center space-x-3">
                <button 
                  onClick={() => setShowFileNotifications(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition duration-200 font-medium flex items-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4 19h6v-6H4v6zM4 5h6V1H4v4zM15 3h5l-5-5v5z" />
                  </svg>
                  File Notifications
                </button>
                <button 
                  onClick={() => setShowUploadModal(true)}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition duration-200 font-medium flex items-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  Upload Documents
                </button>
              </div>
            </div>

            {/* Documents List */}
            {documentsLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading documents...</p>
              </div>
            ) : documents.length === 0 ? (
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
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-gray-600">
                    {documents.length} document{documents.length !== 1 ? 's' : ''} found
                  </p>
                  <button
                    onClick={loadDocuments}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh
                  </button>
                </div>
                
                <div className="grid gap-4">
                  {documents.map((document) => (
                    <DocumentCard
                      key={document.id}
                      document={document}
                      onOpen={handleDocumentOpen}
                      onDelete={handleDocumentDelete}
                      currentUserId={user?.username || ''}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Calendar Tab Content */}
        {activeTab === 'calendar' && (
          <div className="bg-white rounded-xl shadow-sm p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Calendar</h2>
              
              {/* Month Navigation */}
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => navigateMonth('prev')}
                  disabled={!canNavigatePrev()}
                  className={`p-2 rounded-lg transition duration-200 ${
                    canNavigatePrev()
                      ? 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      : 'text-gray-300 cursor-not-allowed'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                
                <div className="text-lg font-medium text-gray-700 min-w-[140px] text-center">
                  {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </div>
                
                <button
                  onClick={() => navigateMonth('next')}
                  disabled={!canNavigateNext()}
                  className={`p-2 rounded-lg transition duration-200 ${
                    canNavigateNext()
                      ? 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      : 'text-gray-300 cursor-not-allowed'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
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
              {getDaysInMonth(currentMonth).map((day, index) => (
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
              const fileInput = formData.get('filePath') as File
              
              if (!fileInput) {
                alert('Please select a file to upload')
                return
              }
              
              // Convert date from YYYY-MM-DD to MM-DD-YYYY format
              const dateValue = formData.get('date') as string
              const dateParts = dateValue.split('-')
              const formattedDate = `${dateParts[1]}-${dateParts[2]}-${dateParts[0]}`
              
              const data = {
                date: formattedDate,
                studyGroupName: formData.get('studyGroupName') as string,
                className: formData.get('className') as string,
                fileName: formData.get('fileName') as string,
                description: formData.get('description') as string
              }
              handleUploadSubmit(data, fileInput)
            }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select File:
                </label>
                <input
                  type="file"
                  name="filePath"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  accept=".pdf,.doc,.docx,.txt,.md,.ppt,.pptx,.xls,.xlsx"
                />
                <p className="text-xs text-gray-500 mt-1">Supported formats: PDF, DOC, DOCX, TXT, MD, PPT, PPTX, XLS, XLSX</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date Created:
                </label>
                <input
                  type="date"
                  name="date"
                  required
                  defaultValue={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Study Group Name:
                </label>
                <select
                  name="studyGroupName"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select a study group</option>
                  <option value="Personal">Personal</option>
                  {studyGroups.map(group => (
                    <option key={group.id} value={group.name}>
                      {group.name}
                    </option>
                  ))}
                </select>
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

      {/* Create Group Modal */}
      <CreateGroupModal
        isOpen={isCreateGroupOpen}
        onClose={() => setIsCreateGroupOpen(false)}
        onCreateGroup={handleCreateGroup}
        userProfile={userProfile ? {
          university: userProfile.university,
          className: userProfile.className
        } : undefined}
      />

      {/* File Notifications Modal */}
      <FileNotifications
        userId={user?.username || ''}
        isOpen={showFileNotifications}
        onClose={() => setShowFileNotifications(false)}
        onFileDownloaded={loadDocuments}
      />
    </div>
  )
}

