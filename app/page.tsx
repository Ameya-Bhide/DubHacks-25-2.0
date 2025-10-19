'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/UnifiedAuthContext'
import LoginForm from '@/components/LoginForm'
import SignUpForm from '@/components/SignUpForm'
import ConfirmSignUpForm from '@/components/ConfirmSignUpForm'
import CreateGroupModal from '@/components/CreateGroupModal'
import MeetingScheduler from '@/components/MeetingScheduler'
import InviteCard from '@/components/InviteCard'
import InviteModal from '@/components/InviteModal'
import FileNotifications from '@/components/FileNotifications'
import DocumentCard from '@/components/DocumentCard'
import OpenFileModal from '@/components/OpenFileModal'
import { createStudyGroup, getUserStudyGroups, devStudyGroups, StudyGroup, leaveStudyGroup, devMeetings, Meeting, getInvitesForEmail, getAllInvites, respondToInvite, deleteInvite, sendInvite, getAllStudyGroups, joinStudyGroup } from '@/lib/aws-study-groups'

// Extended meeting type with group name
type MeetingWithGroupName = Meeting & { groupName: string }
import { hasRealAWSConfig, checkDynamoDBConfigFromBrowser, isElectron } from '@/lib/aws-config'
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
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false)
  const [showEmailSentModal, setShowEmailSentModal] = useState(false)
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('')
  const [isMeetingSchedulerOpen, setIsMeetingSchedulerOpen] = useState(false)
  const [selectedGroupForMeeting, setSelectedGroupForMeeting] = useState<StudyGroup | null>(null)
  const [selectedGroupForDetails, setSelectedGroupForDetails] = useState<StudyGroup | null>(null)
  const [isGroupDetailsOpen, setIsGroupDetailsOpen] = useState(false)
  const [groupMeetings, setGroupMeetings] = useState<Meeting[]>([])
  const [upcomingMeetings, setUpcomingMeetings] = useState<MeetingWithGroupName[]>([])
  const [studyGroups, setStudyGroups] = useState<StudyGroup[]>([])
  const [invites, setInvites] = useState<any[]>([])
  const [showInvites, setShowInvites] = useState(false)
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  const [selectedGroupForInvite, setSelectedGroupForInvite] = useState<StudyGroup | null>(null)
  const [showFileNotifications, setShowFileNotifications] = useState(false)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [documents, setDocuments] = useState<any[]>([])
  const [documentsLoading, setDocumentsLoading] = useState(false)
  const [showFindGroups, setShowFindGroups] = useState(false)
  const [allPublicGroups, setAllPublicGroups] = useState<StudyGroup[]>([])
  const [filteredGroups, setFilteredGroups] = useState<StudyGroup[]>([])
  const [universityFilter, setUniversityFilter] = useState('')
  const [classNameFilter, setClassNameFilter] = useState('')
  const [findGroupsLoading, setFindGroupsLoading] = useState(false)
  const [allMeetings, setAllMeetings] = useState<MeetingWithGroupName[]>([])
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
      // First, upload the file locally to get the actual file path
      const localUploadFormData = new FormData()
      localUploadFormData.append('file', file)
      localUploadFormData.append('fileName', formData.fileName)
      localUploadFormData.append('studyGroupName', formData.studyGroupName)
      localUploadFormData.append('description', formData.description)
      localUploadFormData.append('dateCreated', formData.date)
      localUploadFormData.append('className', formData.className)
      localUploadFormData.append('uploadedBy', user?.username || 'unknown-user')
      
      // The API will automatically check common locations and preserve existing file paths

      // Upload file to local filesystem
      const localUploadResponse = await fetch('/api/upload-local-file', {
        method: 'POST',
        body: localUploadFormData
      })
      
      const localUploadResult = await localUploadResponse.json()
      
      if (!localUploadResult.success) {
        console.error('Error uploading file locally:', localUploadResult.error)
        alert(`Failed to upload file: ${localUploadResult.error}`)
        return
      }

      const fileRecord = localUploadResult.fileRecord
      console.log('File uploaded locally with actual path:', fileRecord.filePath)

      // Save file record to .ai_helper system (for local storage)
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
        console.log('File record saved to .ai_helper successfully:', saveResult)
        
        // If it's a study group file (not personal), also save to DynamoDB for notifications
        if (formData.studyGroupName !== 'Personal') {
          // Create FormData for S3 upload
          const uploadFormData = new FormData()
          uploadFormData.append('file', file)
          uploadFormData.append('studyGroupName', formData.studyGroupName)
          uploadFormData.append('fileName', formData.fileName)
          uploadFormData.append('description', formData.description)
          uploadFormData.append('dateCreated', formData.date)
          uploadFormData.append('className', formData.className)
          uploadFormData.append('uploadedBy', user?.username || 'unknown-user')

          // Upload file to S3
          const uploadResponse = await fetch('/api/upload-file', {
            method: 'POST',
            body: uploadFormData
          })
          
          const uploadResult = await uploadResponse.json()
          
          if (uploadResult.success) {
            // Save file record to DynamoDB and notify study group members
            const dbResponse = await fetch('/api/study-group-files', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                action: 'saveFileRecord',
                data: { fileRecord: uploadResult.fileRecord }
              })
            })
            
            const dbResult = await dbResponse.json()
            
            if (dbResult.success) {
              console.log('File uploaded to S3 and shared with study group members:', dbResult)
              alert(`File uploaded successfully and shared with ${formData.studyGroupName} members!`)
            } else {
              console.error('Error saving to DynamoDB:', dbResult.error)
              alert(`File saved locally but failed to share with group: ${dbResult.error}`)
            }
          } else {
            console.error('Error uploading to S3:', uploadResult.error)
            alert(`File saved locally but failed to upload to S3: ${uploadResult.error}`)
          }
        } else {
          // Personal file - only saved locally
          alert('File uploaded successfully!')
        }
        
        // Refresh the documents list
        loadDocuments()
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

  // Helper function to get meetings for a specific date
  const getMeetingsForDate = (date: Date): MeetingWithGroupName[] => {
    const dateStr = date.toISOString().split('T')[0] // YYYY-MM-DD format
    return allMeetings.filter(meeting => meeting.date === dateStr)
  }

  // Helper function to get documents for a specific date
  const getDocumentsForDate = (date: Date): any[] => {
    const dateStr = date.toISOString().split('T')[0] // YYYY-MM-DD format
    console.log('🔍 Filtering documents for date:', dateStr, 'Total documents:', documents.length)
    
    const filteredDocs = documents.filter(doc => {
      // Check if document was created on this date or has a due date on this date
      const docDate = doc.dateCreated || doc.date || doc.createdAt
      const dueDate = doc.dueDate
      
      console.log('📄 Checking document:', doc.fileName, 'docDate:', docDate, 'dueDate:', dueDate)
      
      if (docDate) {
        // Handle different date formats
        let docDateStr: string
        if (typeof docDate === 'string') {
          // If it's already in YYYY-MM-DD format, use it directly
          if (docDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
            docDateStr = docDate
          } else {
            // Otherwise, parse it as a date
            docDateStr = new Date(docDate).toISOString().split('T')[0]
          }
        } else {
          docDateStr = new Date(docDate).toISOString().split('T')[0]
        }
        
        console.log('📅 Document date comparison:', docDateStr, '===', dateStr, '?', docDateStr === dateStr)
        if (docDateStr === dateStr) return true
      }
      
      if (dueDate) {
        const dueDateStr = new Date(dueDate).toISOString().split('T')[0]
        console.log('⏰ Due date comparison:', dueDateStr, '===', dateStr, '?', dueDateStr === dateStr)
        if (dueDateStr === dateStr) return true
      }
      
      return false
    })
    
    console.log('✅ Found documents for date:', filteredDocs.length, filteredDocs.map(d => d.fileName))
    return filteredDocs
  }

  // Helper function to check if a date has meetings or documents
  const hasEventsOnDate = (date: Date): boolean => {
    return getMeetingsForDate(date).length > 0 || getDocumentsForDate(date).length > 0
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
      // Always use AWS DynamoDB (no localStorage fallback)
      const groups = await getUserStudyGroups(user.username)
      setStudyGroups(groups)
      
      // Load upcoming meetings after study groups are loaded
      await loadUpcomingMeetings(groups)
      
      // Debug: Log all groups to console
      console.log('📊 All Study Groups:', groups)
      const isElectronEnv = isElectron()
      if (isElectronEnv) {
        console.log('🖥️ Electron Mode - Data loaded from AWS DynamoDB')
      } else {
        console.log('🔗 Browser Mode - Data loaded from AWS DynamoDB')
      }
    } catch (error) {
      console.error('Error loading study groups:', error)
    }
  }

  const loadInvites = async () => {
    if (!user) return

    try {
      // Always use AWS DynamoDB (no localStorage fallback)
      const userEmail = user.email || `${user.username}@example.com`
      
      console.log('Loading invites for user email:', userEmail)
      
      // Get all invites for the user from AWS DynamoDB
      const allUserInvites = await getInvitesForEmail(userEmail)
      console.log('Found invites for user:', allUserInvites)
      
      // Just show all invites for now - don't filter automatically
      // The user can manually clean up outdated invites using the cleanup button
      console.log('All user invites (no filtering):', allUserInvites)
      setInvites(allUserInvites)
      
      const isElectronEnv = isElectron()
      if (isElectronEnv) {
        console.log('🖥️ Electron Mode - Data loaded from AWS DynamoDB')
      } else {
        console.log('🔗 Browser Mode - Data loaded from AWS DynamoDB')
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
      // Always use API routes (works in both browser and Electron)
      const response = await fetch(`/api/ai-helper-files?userId=${user.username}&action=getUserFiles`)
      const result = await response.json()
      
      if (result.success) {
        setDocuments(result.files)
        console.log('📄 Documents loaded from .ai_helper:', result.files)
        
        const isElectronEnv = isElectron()
        if (isElectronEnv) {
          console.log('🖥️ Electron Mode - Documents loaded from AWS')
        } else {
          console.log('🔗 Browser Mode - Documents loaded from AWS')
        }
      } else {
        console.error('Error loading documents:', result.error)
      }
    } catch (error) {
      console.error('Error loading documents:', error)
    } finally {
      setDocumentsLoading(false)
    }
  }

  const loadUpcomingMeetings = async (groups?: StudyGroup[]) => {
    const groupsToUse = groups || studyGroups
    console.log('🔍 Loading upcoming meetings...', { user: !!user, groupsCount: groupsToUse.length })
    
    if (!user || groupsToUse.length === 0) {
      console.log('❌ No user or groups, skipping upcoming meetings load')
      return
    }

    try {
      const allMeetings: MeetingWithGroupName[] = []
      
      // Get meetings from all study groups
      for (const group of groupsToUse) {
        console.log(`📅 Getting meetings for group: ${group.name} (${group.id})`)
        const meetings = await devMeetings.getMeetingsForGroup(group.id)
        console.log(`📅 Found ${meetings.length} meetings for group ${group.name}`)
        
        // Add group name to each meeting
        const meetingsWithGroupName = meetings.map(meeting => ({
          ...meeting,
          groupName: group.name
        }))
        allMeetings.push(...meetingsWithGroupName)
      }
      
      console.log(`📅 Total meetings found: ${allMeetings.length}`)
      
      // Store all meetings for calendar functionality
      setAllMeetings(allMeetings)
      
      // Filter for upcoming meetings and sort by date
      const now = new Date()
      console.log('🕐 Current time:', now.toISOString())
      
      const upcoming = allMeetings
        .filter(meeting => {
          const meetingDate = new Date(`${meeting.date}T${meeting.time}`)
          const isUpcoming = meetingDate > now
          console.log(`📅 Meeting "${meeting.title}" on ${meeting.date} at ${meeting.time} - ${isUpcoming ? 'UPCOMING' : 'PAST'}`)
          return isUpcoming
        })
        .sort((a, b) => {
          const dateA = new Date(`${a.date}T${a.time}`)
          const dateB = new Date(`${b.date}T${b.time}`)
          return dateA.getTime() - dateB.getTime()
        })
        .slice(0, 3) // Get only the 3 closest
      
      console.log(`📅 Upcoming meetings to display: ${upcoming.length}`)
      setUpcomingMeetings(upcoming)
    } catch (error) {
      console.error('Error loading upcoming meetings:', error)
    }
  }

  const [showOpenModal, setShowOpenModal] = useState(false)
  const [pendingOpen, setPendingOpen] = useState<{
    filePath: string
    fileName: string
  } | null>(null)
  const [showFlashcardsModal, setShowFlashcardsModal] = useState(false)
  const [showSummariesModal, setShowSummariesModal] = useState(false)
  const [showPracticeQuestionsModal, setShowPracticeQuestionsModal] = useState(false)

  const handleDocumentOpen = (filePath: string, fileName: string) => {
    // Set up the pending open and show the modal
    setPendingOpen({ filePath, fileName })
    setShowOpenModal(true)
  }

  const handleOpenConfirm = async (application: string) => {
    if (!pendingOpen) return

    const { filePath, fileName } = pendingOpen

    try {
      // Try to open the file using the selected application
      const response = await fetch('/api/open-file', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filePath: filePath,
          application: application
        })
      })

      const result = await response.json()
      
      if (result.success) {
        // Show a brief success message
        const appName = application === 'default' ? 'default application' : application
        alert(`✅ Opening "${fileName}" with ${appName}`)
      } else {
        // Show error message with file path
        alert(`❌ Failed to open file: ${result.error}\n\nFile location: ${filePath}\n\nYou can try:\n1. Opening your file explorer\n2. Navigating to the path above\n3. Double-clicking the file`)
      }
    } catch (error) {
      console.error('Error opening document:', error)
      // Fallback: show the path and instructions
      alert(`❌ Error opening file\n\nFile location: ${filePath}\n\nYou can try:\n1. Opening your file explorer\n2. Navigating to the path above\n3. Double-clicking the file`)
    } finally {
      setShowOpenModal(false)
      setPendingOpen(null)
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
      // Update invite status using the appropriate data source (AWS or localStorage)
      await respondToInvite(inviteId, response, user.username)
      
        // Remove the invite from the list
        setInvites(prev => prev.filter(invite => invite.id !== inviteId))
        
      // Note: The respondToInvite function already handles adding the user to the group
      // when the response is 'accept', so we don't need to call joinStudyGroup separately
      
      // Reload study groups to show the new membership if accepted
      if (response === 'accept') {
          loadStudyGroups()
      }
      
      alert(`Invite ${response}ed successfully!`)
    } catch (error) {
      console.error('Error responding to invite:', error)
      alert('Failed to respond to invite')
    }
  }

  const handleCreateGroup = async (groupData: any) => {
    if (!user) return

    try {
      // Always use AWS DynamoDB (no localStorage fallback)
      const newGroup = await createStudyGroup({ ...groupData, createdBy: user.username })
      
      setStudyGroups(prev => [newGroup, ...prev])
      console.log('Study group created:', newGroup)
      const isElectronEnv = isElectron()
      if (isElectronEnv) {
        console.log('🖥️ Electron Mode - Group saved to AWS DynamoDB')
      } else {
        console.log('🔗 Browser Mode - Group saved to AWS DynamoDB')
      }
    } catch (error) {
      console.error('Error creating study group:', error)
      throw error
    }
  }

  const handleForgotPassword = async (email: string) => {
    try {
      // Simulate sending email - in a real app, this would call your backend API
      console.log('Sending password reset email to:', email)
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Show success modal
      setShowForgotPasswordModal(false)
      setShowEmailSentModal(true)
      setForgotPasswordEmail(email)
      
    } catch (error) {
      console.error('Error sending password reset email:', error)
      alert('Failed to send password reset email. Please try again.')
    }
  }

  const handleBackToLogin = () => {
    setShowEmailSentModal(false)
    setForgotPasswordEmail('')
    setAuthView('login')
  }

  const handleScheduleMeeting = (group: StudyGroup) => {
    setSelectedGroupForMeeting(group)
    setIsMeetingSchedulerOpen(true)
  }

  const handleMeetingSubmit = async (meetingData: any) => {
    try {
      console.log('Scheduling meeting:', meetingData)
      
      // Refresh meetings list for the current group
      if (selectedGroupForDetails) {
        const meetings = await devMeetings.getMeetingsForGroup(selectedGroupForDetails.id)
        setGroupMeetings(meetings)
      }
      
      // Refresh upcoming meetings
      await loadUpcomingMeetings()
      
      alert(`Meeting "${meetingData.title}" scheduled for ${meetingData.date} at ${meetingData.time}`)
    } catch (error) {
      console.error('Error scheduling meeting:', error)
    }
  }

  const handleInviteMembers = (group: StudyGroup) => {
    setSelectedGroupForInvite(group)
    setIsInviteModalOpen(true)
  }

  const handleInviteSent = () => {
    // Refresh invites list
    loadInvites()
  }

  const handleStudyGroupClick = async (group: StudyGroup) => {
    setSelectedGroupForDetails(group)
    setIsGroupDetailsOpen(true)
    
    // Load meetings for this group
    try {
      const meetings = await devMeetings.getMeetingsForGroup(group.id)
      setGroupMeetings(meetings)
    } catch (error) {
      console.error('Error loading meetings:', error)
      setGroupMeetings([])
    }
  }

  const handleLeaveGroup = async (group: StudyGroup) => {
    if (!user) return

    const confirmMessage = group.memberCount === 1 
      ? `Are you sure you want to leave "${group.name}"? This will delete the group since you are the last member.`
      : `Are you sure you want to leave "${group.name}"?`

    if (confirm(confirmMessage)) {
      try {
        // Use AWS DynamoDB API
        const result = await leaveStudyGroup(group.id, user.username)
        
        if (result.deleted) {
              alert('You have left the group and it has been deleted.')
            } else {
              alert('You have successfully left the group.')
            }
            
            // Reload study groups
            loadStudyGroups()
            // Close the modal
            setIsGroupDetailsOpen(false)
            setSelectedGroupForDetails(null)
      } catch (error) {
        console.error('Error leaving study group:', error)
        alert('Failed to leave study group')
      }
    }
  }

  const handleTogglePublic = async (group: StudyGroup) => {
    if (!user || group.createdBy !== user.username) {
      alert('Only the group creator can change the public setting.')
      return
    }

    // TODO: Implement API endpoint for updating group settings
    alert('Group settings update not yet implemented. This feature will be available soon.')
  }

  const loadPublicGroups = async () => {
    if (!user) return

    setFindGroupsLoading(true)
    try {
      // Load all public study groups
      const allGroups = await getAllStudyGroups()
      const publicGroups = allGroups.filter(group => group.isPublic)
      setAllPublicGroups(publicGroups)
      setFilteredGroups(publicGroups)
    } catch (error) {
      console.error('Error loading public groups:', error)
      alert('Failed to load public groups')
    } finally {
      setFindGroupsLoading(false)
    }
  }

  const handleFindGroupsToggle = () => {
    setShowFindGroups(!showFindGroups)
    if (!showFindGroups && allPublicGroups.length === 0) {
      loadPublicGroups()
    } else if (!showFindGroups) {
      // Reset filters when opening Find Groups
      setUniversityFilter('')
      setClassNameFilter('')
      setFilteredGroups(allPublicGroups)
    }
  }

  const handleFilterChange = () => {
    let filtered = allPublicGroups

    if (universityFilter) {
      filtered = filtered.filter(group => 
        group.university === universityFilter
      )
    }

    if (classNameFilter) {
      filtered = filtered.filter(group => 
        group.className.toLowerCase().includes(classNameFilter.toLowerCase())
      )
    }

    setFilteredGroups(filtered)
  }

  const handleJoinPublicGroup = async (group: StudyGroup) => {
    if (!user) return

    // Check if user is already a member
    if (group.members.includes(user.username)) {
      alert('You are already a member of this group!')
      return
    }

    // Check if group is full
    if (group.memberCount >= group.maxMembers) {
      alert('This group is full and cannot accept new members.')
      return
    }

    const confirmMessage = `Are you sure you want to join "${group.name}"?`
    if (confirm(confirmMessage)) {
      try {
        await joinStudyGroup(group.id, user.username)
        alert('Successfully joined the group!')
        
        // Reload both user groups and public groups
        loadStudyGroups()
        loadPublicGroups()
    } catch (error) {
        console.error('Error joining group:', error)
        alert('Failed to join group. Please try again.')
      }
    }
  }

  // Update filtered groups when allPublicGroups change (initial load)
  useEffect(() => {
    setFilteredGroups(allPublicGroups)
  }, [allPublicGroups])

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
              onSwitchToForgotPassword={() => setShowForgotPasswordModal(true)}
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

        {/* Forgot Password Modal */}
        {showForgotPasswordModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">Reset Password</h3>
                <button
                  onClick={() => setShowForgotPasswordModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition duration-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="mb-6">
                <p className="text-gray-600 mb-4">
                  Enter your email address and we'll send you a link to reset your password.
                </p>
                
                <form onSubmit={(e) => {
                  e.preventDefault()
                  const formData = new FormData(e.target as HTMLFormElement)
                  const email = formData.get('email') as string
                  handleForgotPassword(email)
                }} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      name="email"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter your email address"
                    />
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowForgotPasswordModal(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition duration-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200"
                    >
                      Send Reset Link
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Email Sent Confirmation Modal */}
        {showEmailSentModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <div className="text-center">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 mb-2">Email Sent!</h3>
                <p className="text-gray-600 mb-6">
                  We've sent a password reset link to <strong>{forgotPasswordEmail}</strong>. 
                  Please check your email and follow the instructions to reset your password.
                </p>
                
                <button
                  onClick={handleBackToLogin}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200"
                >
                  Back to Login
                </button>
              </div>
            </div>
          </div>
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
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">My Study Groups</h2>
                  <button 
                    onClick={() => setIsCreateGroupOpen(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition duration-200 font-medium flex items-center"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Create Group
                  </button>
                </div>
                
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
                    {studyGroups.slice(0, 3).map(group => (
                      <div 
                        key={group.id} 
                        onClick={() => handleStudyGroupClick(group)}
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h3 className="text-lg font-semibold text-gray-900">{group.name}</h3>
                              {group.isPublic && (
                                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                                  Public
                                </span>
                              )}
                            </div>
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
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                                {group.university}
                              </span>
                              <span className="flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                                {group.className}
                              </span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                group.subject === 'Computer Science' ? 'bg-blue-100 text-blue-800' :
                                group.subject === 'Data Science' ? 'bg-green-100 text-green-800' :
                                group.subject === 'Mathematics' ? 'bg-purple-100 text-purple-800' :
                                group.subject === 'Physics' ? 'bg-red-100 text-red-800' :
                                group.subject === 'Chemistry' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {group.subject}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <span className="text-xs text-gray-500">
                              {group.createdBy === user?.username ? 'Creator' : 'Member'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {studyGroups.length > 3 && (
                      <div className="text-center pt-4">
                        <button 
                          onClick={() => setActiveTab('study-group')}
                          className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                        >
                          View All {studyGroups.length} Groups →
                </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Upcoming Dates */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Dates</h3>
                {upcomingMeetings.length === 0 ? (
                <div className="text-center py-8">
                  <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                    <p className="text-gray-600 text-sm">No upcoming meetings</p>
                </div>
                ) : (
                  <div className="space-y-3">
                    {upcomingMeetings.map(meeting => (
                      <div key={meeting.id} className="border border-gray-200 rounded-lg p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 text-sm">{meeting.title}</h4>
                            <p className="text-xs text-gray-600 mt-1">{meeting.groupName}</p>
                            <div className="flex items-center space-x-2 mt-2 text-xs text-gray-500">
                              <span className="flex items-center">
                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                {new Date(meeting.date).toLocaleDateString()}
                              </span>
                              <span className="flex items-center">
                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {meeting.time}
                              </span>
                              <span className="flex items-center">
                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                {meeting.meetingType === 'in-person' ? 'In-Person' : 'Online'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <button 
                    onClick={() => setActiveTab('study-group')}
                    className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition duration-200"
                  >
                    <div className="font-medium text-gray-900">Find Study Groups</div>
                    <div className="text-sm text-gray-600">Discover and join public groups</div>
                  </button>
                  <button 
                    onClick={() => setActiveTab('documents')}
                    className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition duration-200"
                  >
                    <div className="font-medium text-gray-900">Share Notes</div>
                    <div className="text-sm text-gray-600">Upload study materials</div>
                  </button>
                  <button 
                    onClick={() => setIsCreateGroupOpen(true)}
                    className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition duration-200"
                  >
                    <div className="font-medium text-gray-900">Create Group</div>
                    <div className="text-sm text-gray-600">Start your own study group</div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* AI Tab Content */}
        {activeTab === 'ai' && (
          <div className="bg-white rounded-xl shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">AI Study Tools</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Flashcards Button */}
              <button
                onClick={() => setShowFlashcardsModal(true)}
                className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1"
              >
                <div className="text-center">
                  <div className="mx-auto w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
                  <h3 className="text-xl font-semibold mb-2">Flashcards</h3>
                  <p className="text-blue-100 text-sm">Generate AI-powered flashcards from your study materials</p>
                </div>
              </button>

              {/* Summaries Button */}
              <button
                onClick={() => setShowSummariesModal(true)}
                className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1"
              >
                <div className="text-center">
                  <div className="mx-auto w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Summaries</h3>
                  <p className="text-green-100 text-sm">Create concise summaries of your documents and notes</p>
                </div>
              </button>

              {/* Practice Questions Button */}
              <button
                onClick={() => setShowPracticeQuestionsModal(true)}
                className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1"
              >
                <div className="text-center">
                  <div className="mx-auto w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Practice Questions</h3>
                  <p className="text-purple-100 text-sm">Generate practice questions to test your knowledge</p>
                </div>
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
                <button 
                  onClick={handleFindGroupsToggle}
                  className={`px-4 py-2 rounded-lg transition duration-200 font-medium flex items-center ${
                    showFindGroups 
                      ? 'bg-blue-700 text-white' 
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
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

            {/* Find Groups Section */}
            {showFindGroups && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Find Public Study Groups</h3>
                  <button
                    onClick={() => loadPublicGroups()}
                    disabled={findGroupsLoading}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium disabled:opacity-50"
                  >
                    {findGroupsLoading ? 'Loading...' : 'Refresh'}
                  </button>
                </div>

                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label htmlFor="university-filter" className="block text-sm font-medium text-gray-700 mb-2">
                      Filter by University
                    </label>
                    <select
                      id="university-filter"
                      value={universityFilter}
                      onChange={(e) => setUniversityFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">All Universities</option>
                      <option value="University of Washington">University of Washington</option>
                      <option value="University of California, Berkeley">University of California, Berkeley</option>
                      <option value="Stanford University">Stanford University</option>
                      <option value="University of California, Los Angeles">University of California, Los Angeles</option>
                      <option value="University of California, San Diego">University of California, San Diego</option>
                      <option value="University of Southern California">University of Southern California</option>
                      <option value="California Institute of Technology">California Institute of Technology</option>
                      <option value="University of California, Davis">University of California, Davis</option>
                      <option value="University of California, Irvine">University of California, Irvine</option>
                      <option value="University of California, Santa Barbara">University of California, Santa Barbara</option>
                      <option value="University of California, Santa Cruz">University of California, Santa Cruz</option>
                      <option value="University of California, Riverside">University of California, Riverside</option>
                      <option value="University of California, Merced">University of California, Merced</option>
                      <option value="University of Oregon">University of Oregon</option>
                      <option value="Oregon State University">Oregon State University</option>
                      <option value="Portland State University">Portland State University</option>
                      <option value="University of British Columbia">University of British Columbia</option>
                      <option value="Simon Fraser University">Simon Fraser University</option>
                      <option value="University of Victoria">University of Victoria</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="class-filter" className="block text-sm font-medium text-gray-700 mb-2">
                      Filter by Class Name
                    </label>
                    <input
                      id="class-filter"
                      type="text"
                      placeholder="e.g., CSE 142, MATH 124"
                      value={classNameFilter}
                      onChange={(e) => setClassNameFilter(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleFilterChange()}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Search Button */}
                <div className="flex items-center justify-between mb-6">
                  <button
                    onClick={handleFilterChange}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition duration-200 font-medium flex items-center"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    Search Groups
                  </button>
                  <button
                    onClick={() => {
                      setUniversityFilter('')
                      setClassNameFilter('')
                      setFilteredGroups(allPublicGroups)
                    }}
                    className="text-gray-600 hover:text-gray-800 text-sm font-medium"
                  >
                    Clear Filters
                  </button>
                </div>

                {/* Results */}
                {findGroupsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Loading public groups...</p>
                  </div>
                ) : filteredGroups.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <p className="text-gray-600">
                      {allPublicGroups.length === 0 
                        ? 'No public study groups found. Be the first to create one!'
                        : 'No groups match your current filters. Try adjusting your search criteria.'
                      }
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600 mb-4">
                      Showing {filteredGroups.length} of {allPublicGroups.length} public groups
                    </p>
                    {filteredGroups.map(group => (
                      <div 
                        key={group.id} 
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h4 className="text-lg font-semibold text-gray-900">{group.name}</h4>
                              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                                Public
                              </span>
                            </div>
                            <p className="text-gray-600 text-sm mb-3">{group.description}</p>
                            <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                              <span className="flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                                {group.memberCount}/{group.maxMembers} members
                              </span>
                              <span className="flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                                {group.university}
                              </span>
                              <span className="flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                                {group.className}
                              </span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                group.subject === 'Computer Science' ? 'bg-blue-100 text-blue-800' :
                                group.subject === 'Data Science' ? 'bg-green-100 text-green-800' :
                                group.subject === 'Mathematics' ? 'bg-purple-100 text-purple-800' :
                                group.subject === 'Physics' ? 'bg-red-100 text-red-800' :
                                group.subject === 'Chemistry' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {group.subject}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500">
                              Created by {group.createdBy} • {new Date(group.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="ml-4">
                            {group.members.includes(user?.username || '') ? (
                              <span className="px-3 py-1 bg-gray-100 text-gray-600 text-sm font-medium rounded-lg">
                                Member
                              </span>
                            ) : group.memberCount >= group.maxMembers ? (
                              <span className="px-3 py-1 bg-red-100 text-red-600 text-sm font-medium rounded-lg">
                                Full
                              </span>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleJoinPublicGroup(group)
                                }}
                                className="px-3 py-1 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition duration-200"
                              >
                                Join Group
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
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
                      onClick={() => handleStudyGroupClick(group)}
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
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                              </svg>
                              {group.university}
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
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleScheduleMeeting(group)
                            }}
                            className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors flex items-center"
                          >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            Schedule Meeting
                          </button>
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
              {getDaysInMonth(currentMonth).map((day, index) => {
                const hasEvents = day ? hasEventsOnDate(day) : false
                const meetingsOnDay = day ? getMeetingsForDate(day) : []
                const documentsOnDay = day ? getDocumentsForDate(day) : []
                
                return (
                  <div
                    key={index}
                    className={`p-2 text-center text-sm rounded cursor-pointer transition duration-200 relative ${
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
                    
                    {/* Event indicators */}
                    {day && hasEvents && (
                      <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 flex space-x-1">
                        {meetingsOnDay.length > 0 && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full" title={`${meetingsOnDay.length} meeting(s)`}></div>
                        )}
                        {documentsOnDay.length > 0 && (
                          <div className="w-2 h-2 bg-green-500 rounded-full" title={`${documentsOnDay.length} document(s)`}></div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            
            <div className="mt-6">
              <div className="text-center text-sm text-gray-500 mb-4">
                Click on any date to view study group meetups and uploaded files
              </div>
              
              {/* Calendar Legend */}
              <div className="flex items-center justify-center space-x-6 text-xs text-gray-600">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span>Meetings</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span>Documents</span>
                </div>
              </div>
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
              
              const dueDateValue = formData.get('dueDate') as string
              const formattedDueDate = dueDateValue ? (() => {
                const dueDateParts = dueDateValue.split('-')
                return `${dueDateParts[1]}-${dueDateParts[2]}-${dueDateParts[0]}`
              })() : undefined

              const data = {
                date: formattedDate,
                dueDate: formattedDueDate,
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
                  Due Date (Optional):
                </label>
                <input
                  type="date"
                  name="dueDate"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">Set a due date to see it on the calendar</p>
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
                Study Group Meetups ({getMeetingsForDate(selectedDate).length})
              </h5>
              <div className="bg-gray-50 rounded-lg p-4">
                {getMeetingsForDate(selectedDate).length === 0 ? (
                  <div className="text-center">
                    <div className="text-gray-500 text-sm">
                      No study group meetups scheduled for this date
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {getMeetingsForDate(selectedDate).map((meeting) => (
                      <div key={meeting.id} className="bg-white rounded-lg p-3 border border-gray-200">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h6 className="font-medium text-gray-900 text-sm">{meeting.title}</h6>
                            <p className="text-xs text-gray-600 mt-1">{meeting.groupName}</p>
                            <div className="flex items-center space-x-3 mt-2 text-xs text-gray-500">
                              <span className="flex items-center">
                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {meeting.time}
                              </span>
                              <span className="flex items-center">
                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                {meeting.meetingType === 'in-person' ? 'In-Person' : 'Online'}
                              </span>
                            </div>
                            {meeting.description && (
                              <p className="text-xs text-gray-600 mt-2">{meeting.description}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Uploaded Files Section */}
            <div className="mb-6">
              <h5 className="text-md font-medium text-gray-700 mb-3 flex items-center">
                <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Documents & Files ({getDocumentsForDate(selectedDate).length})
              </h5>
              <div className="bg-gray-50 rounded-lg p-4">
                {getDocumentsForDate(selectedDate).length === 0 ? (
                  <div className="text-center">
                    <div className="text-gray-500 text-sm">
                      No documents or files for this date
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {getDocumentsForDate(selectedDate).map((doc, index) => {
                      const isDueDate = doc.dueDate && new Date(doc.dueDate).toISOString().split('T')[0] === selectedDate.toISOString().split('T')[0]
                      const docDate = doc.dateCreated || doc.date || doc.createdAt
                      const isCreatedDate = docDate && (() => {
                        let docDateStr: string
                        if (typeof docDate === 'string' && docDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
                          docDateStr = docDate
                        } else {
                          docDateStr = new Date(docDate).toISOString().split('T')[0]
                        }
                        return docDateStr === selectedDate.toISOString().split('T')[0]
                      })()
                      
                      return (
                        <div key={index} className="bg-white rounded-lg p-3 border border-gray-200">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h6 className="font-medium text-gray-900 text-sm">{doc.fileName || doc.originalFileName || doc.name}</h6>
                              {doc.studyGroupName && (
                                <p className="text-xs text-gray-600 mt-1">{doc.studyGroupName}</p>
                              )}
                              <div className="flex items-center space-x-3 mt-2 text-xs text-gray-500">
                                {isCreatedDate && (
                                  <span className="flex items-center text-green-600">
                                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Created
                                  </span>
                                )}
                                {isDueDate && (
                                  <span className="flex items-center text-red-600">
                                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                    </svg>
                                    Due
                                  </span>
                                )}
                                {doc.className && (
                                  <span className="text-gray-500">{doc.className}</span>
                                )}
                              </div>
                              {doc.description && (
                                <p className="text-xs text-gray-600 mt-2">{doc.description}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
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

      {/* Meeting Scheduler Modal */}
      {selectedGroupForMeeting && (
        <MeetingScheduler
          isOpen={isMeetingSchedulerOpen}
          onClose={() => {
            setIsMeetingSchedulerOpen(false)
            setSelectedGroupForMeeting(null)
          }}
          onScheduleMeeting={handleMeetingSubmit}
          groupId={selectedGroupForMeeting.id}
          groupName={selectedGroupForMeeting.name}
        />
      )}

      {/* File Notifications Modal */}
      <FileNotifications
        userId={user?.username || ''}
        isOpen={showFileNotifications}
        onClose={() => setShowFileNotifications(false)}
        onFileDownloaded={loadDocuments}
      />

      {/* Open File Modal */}
      <OpenFileModal
        isOpen={showOpenModal}
        fileName={pendingOpen?.fileName || ''}
        filePath={pendingOpen?.filePath || ''}
        onClose={() => {
          setShowOpenModal(false)
          setPendingOpen(null)
        }}
        onOpen={handleOpenConfirm}
      />

      {/* Study Group Details Modal */}
      {selectedGroupForDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">{selectedGroupForDetails.name}</h2>
              <button
                onClick={() => {
                  setIsGroupDetailsOpen(false)
                  setSelectedGroupForDetails(null)
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Group Info */}
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Group Information</h3>
                    <div className="space-y-4">
                      <div>
                        <span className="text-sm font-medium text-gray-500">Description:</span>
                        <p className="text-gray-900 mt-1">{selectedGroupForDetails?.description}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Subject:</span>
                        <p className="text-gray-900 mt-1">{selectedGroupForDetails?.subject}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">University:</span>
                        <p className="text-gray-900 mt-1">{selectedGroupForDetails?.university}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Class:</span>
                        <p className="text-gray-900 mt-1">{selectedGroupForDetails?.className}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Created:</span>
                        <p className="text-gray-900 mt-1">{selectedGroupForDetails?.createdAt ? new Date(selectedGroupForDetails.createdAt).toLocaleDateString() : ''}</p>
                      </div>
                    </div>
                  </div>

                  {/* Scheduled Meetings */}
                  <div className="bg-gray-50 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Scheduled Meetings</h3>
                      <button 
                        onClick={() => {
                          setIsGroupDetailsOpen(false)
                          setSelectedGroupForDetails(null)
                          if (selectedGroupForDetails) {
                          handleScheduleMeeting(selectedGroupForDetails)
                          }
                        }}
                        className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                      >
                        + Schedule Meeting
                      </button>
                    </div>
                    {groupMeetings.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <p className="text-gray-600 text-sm">No meetings scheduled yet</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {groupMeetings.map((meeting) => (
                          <div key={meeting.id} className="bg-white rounded-lg p-4 border border-gray-200">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-semibold text-gray-900 mb-1">{meeting.title}</h4>
                                {meeting.description && (
                                  <p className="text-gray-600 text-sm mb-2">{meeting.description}</p>
                                )}
                                <div className="flex items-center space-x-4 text-sm text-gray-500">
                                  <span className="flex items-center">
                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    {new Date(meeting.date).toLocaleDateString()} at {meeting.time}
                                  </span>
                                  <span className="flex items-center">
                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    {meeting.duration} min
                                  </span>
                                  <span className="flex items-center">
                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    {meeting.meetingType === 'in-person' ? 'In-Person' : 'Online'}
                                  </span>
                                </div>
                                <p className="text-gray-600 text-sm mt-2">{meeting.location}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                  {/* Members */}
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Members ({selectedGroupForDetails?.memberCount}/{selectedGroupForDetails?.maxMembers})</h3>
                    <div className="space-y-3">
                      {selectedGroupForDetails?.members.map((member, index) => (
                        <div key={index} className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-blue-600">
                              {member.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span className="text-sm text-gray-900">{member}</span>
                          {member === selectedGroupForDetails?.createdBy && (
                            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                              Creator
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Group Settings */}
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Group Settings</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Public Group</span>
                        {user && selectedGroupForDetails?.createdBy === user.username ? (
                          <button
                            onClick={() => selectedGroupForDetails && handleTogglePublic(selectedGroupForDetails)}
                            className={`text-xs px-3 py-1 rounded-full transition-colors ${
                              selectedGroupForDetails?.isPublic 
                                ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                            }`}
                          >
                            {selectedGroupForDetails?.isPublic ? 'Public' : 'Private'}
                          </button>
                        ) : (
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            selectedGroupForDetails?.isPublic 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {selectedGroupForDetails?.isPublic ? 'Public' : 'Private'}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Status</span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          selectedGroupForDetails?.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {selectedGroupForDetails?.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  {user && selectedGroupForDetails?.members.includes(user.username) && (
                    <div className="bg-gray-50 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
                      <div className="space-y-3">
                        <button
                          onClick={() => selectedGroupForDetails && handleInviteMembers(selectedGroupForDetails)}
                          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Invite Members
                        </button>
                        <button
                          onClick={() => selectedGroupForDetails && handleLeaveGroup(selectedGroupForDetails)}
                          className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        >
                          Leave Group
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {selectedGroupForInvite && (
        <InviteModal
          isOpen={isInviteModalOpen}
          onClose={() => {
            setIsInviteModalOpen(false)
            setSelectedGroupForInvite(null)
          }}
          groupId={String(selectedGroupForInvite.id)}
          groupName={selectedGroupForInvite.name}
          inviterId={user?.username || ''}
          inviterName={user?.username || ''}
          onInviteSent={handleInviteSent}
        />
      )}

      {/* Meeting Scheduler Modal */}
      {selectedGroupForMeeting && (
        <MeetingScheduler
          isOpen={isMeetingSchedulerOpen}
          onClose={() => {
            setIsMeetingSchedulerOpen(false)
            setSelectedGroupForMeeting(null)
          }}
          groupId={String(selectedGroupForMeeting.id)}
          groupName={selectedGroupForMeeting.name}
          onScheduleMeeting={handleMeetingSubmit}
        />
      )}
    </div>
  )
}

