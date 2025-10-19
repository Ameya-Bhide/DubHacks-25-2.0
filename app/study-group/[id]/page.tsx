'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/UnifiedAuthContext'
import { getStudyGroup, leaveStudyGroup, devStudyGroups, StudyGroup } from '@/lib/aws-study-groups'
import { hasRealAWSConfig } from '@/lib/aws-config'
import InviteModal from '@/components/InviteModal'

interface StudyGroupPageProps {
  params: {
    id: string
  }
}

export default function StudyGroupPage({ params }: StudyGroupPageProps) {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [group, setGroup] = useState<StudyGroup | null>(null)
  const [loadingGroup, setLoadingGroup] = useState(true)
  const [error, setError] = useState('')
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)

  useEffect(() => {
    if (user && params.id) {
      loadGroup()
    }
  }, [user, params.id])

  const loadGroup = async () => {
    if (!user) return

    try {
      setLoadingGroup(true)
      const isAWS = hasRealAWSConfig()
      const groupData = isAWS
        ? await getStudyGroup(params.id, user.username)
        : await devStudyGroups.getStudyGroup(params.id)

      if (groupData) {
        setGroup(groupData)
      } else {
        setError('Study group not found')
      }
    } catch (error) {
      console.error('Error loading study group:', error)
      if (error instanceof Error && error.message.includes('Access denied')) {
        setError('You are not a member of this study group')
      } else {
        setError('Failed to load study group')
      }
    } finally {
      setLoadingGroup(false)
    }
  }

  const handleLeaveGroup = async () => {
    if (!user || !group) return

    const confirmMessage = group.memberCount === 1 
      ? `Are you sure you want to leave "${group.name}"? This will delete the group since you are the last member.`
      : `Are you sure you want to leave "${group.name}"?`

    if (confirm(confirmMessage)) {
      try {
        const isAWS = hasRealAWSConfig()
        let result: { group: StudyGroup | null; deleted: boolean }
        
        if (isAWS) {
          result = await leaveStudyGroup(group.id, user.username)
        } else {
          const updatedGroup = await devStudyGroups.leaveStudyGroup(group.id, user.username)
          result = { group: updatedGroup, deleted: false }
        }
        
        // Show appropriate message
        if (result.deleted) {
          alert('You have left the group and it has been deleted.')
        } else {
          alert('You have successfully left the group.')
        }
        
        // Redirect back to study groups
        router.push('/?tab=study-group')
      } catch (error) {
        console.error('Error leaving study group:', error)
        if (error instanceof Error && error.message.includes('not a member')) {
          alert('You are not a member of this study group.')
        } else {
          alert('Failed to leave study group')
        }
      }
    }
  }

  if (loading || loadingGroup) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading study group...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/?tab=study-group')}
            className="bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition duration-200"
          >
            Back to Study Groups
          </button>
        </div>
      </div>
    )
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Study Group Not Found</h2>
          <p className="text-gray-600 mb-6">The study group you're looking for doesn't exist or you don't have access to it.</p>
          <button
            onClick={() => router.push('/?tab=study-group')}
            className="bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition duration-200"
          >
            Back to Study Groups
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Back Button */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/?tab=study-group')}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Back to Study Groups</span>
            </button>
            <div className="h-6 w-px bg-gray-300"></div>
            <h1 className="text-2xl font-bold text-gray-900">{group.name}</h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Group Info & Members */}
          <div className="lg:col-span-1 space-y-6">
            {/* Group Details */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Group Details</h3>
              <div className="space-y-4">
                <div>
                  <span className="text-sm font-medium text-gray-500">Description:</span>
                  <p className="text-gray-900 mt-1">{group.description}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Subject:</span>
                  <p className="text-gray-900 mt-1">{group.subject}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Meeting Schedule:</span>
                  <p className="text-gray-900 mt-1">
                    {group.meetingFrequency === 'daily' 
                      ? 'Daily at ' + group.meetingTime
                      : `${group.meetingFrequency.charAt(0).toUpperCase() + group.meetingFrequency.slice(1)} on ${group.meetingDay.charAt(0).toUpperCase() + group.meetingDay.slice(1)} at ${group.meetingTime}`
                    }
                  </p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Members:</span>
                  <p className="text-gray-900 mt-1">{group.memberCount} / {group.maxMembers}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Created:</span>
                  <p className="text-gray-900 mt-1">{new Date(group.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            {/* Members */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Members ({group.memberCount})</h3>
                {group.memberCount < group.maxMembers && (
                  <button 
                    onClick={() => setIsInviteModalOpen(true)}
                    className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    + Invite
                  </button>
                )}
              </div>
              <div className="space-y-3">
                {group.members.map((member, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-semibold text-sm">
                        {member.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{member}</p>
                      {member === group.createdBy && (
                        <span className="text-xs text-blue-600 font-medium">Creator</span>
                      )}
                      {member === user?.username && (
                        <span className="text-xs text-green-600 font-medium">You</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Leave Group Button */}
              {group.members.includes(user?.username || '') && (
                <div className="pt-4 border-t border-gray-200 mt-4">
                  <button
                    onClick={handleLeaveGroup}
                    className="w-full px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors font-medium"
                  >
                    Leave Group
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Shared Documents */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Shared Documents</h3>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                  + Upload Document
                </button>
              </div>
              
              {/* Documents List */}
              <div className="space-y-4">
                {/* Placeholder for documents */}
                <div className="text-center py-12">
                  <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">No Documents Yet</h4>
                  <p className="text-gray-600 mb-4">Share study materials, notes, and resources with your group members.</p>
                  <button className="bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition duration-200">
                    Upload First Document
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Invite Modal */}
      <InviteModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        groupId={group.id}
        groupName={group.name}
        inviterId={user?.username || ''}
        onInviteSent={() => {
          // Optionally refresh the group data or show a success message
          console.log('Invite sent successfully')
        }}
      />
    </div>
  )
}
