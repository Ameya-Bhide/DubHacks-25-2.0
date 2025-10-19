'use client'

import React, { useState } from 'react'
import { StudyGroup } from '@/lib/aws-study-groups'

interface StudyGroupDetailProps {
  group: StudyGroup
  currentUser: string
  onClose: () => void
  onLeaveGroup: (groupId: string) => void
}

export default function StudyGroupDetail({ group, currentUser, onClose, onLeaveGroup }: StudyGroupDetailProps) {
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return
    
    // TODO: Implement invite functionality
    console.log('Inviting:', inviteEmail, 'to group:', group.id)
    setShowInviteModal(false)
    setInviteEmail('')
  }

  const handleLeaveConfirm = () => {
    onLeaveGroup(group.id)
    setShowLeaveConfirm(false)
    onClose()
  }

  const isCreator = group.createdBy === currentUser

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{group.name}</h2>
            <p className="text-gray-600 mt-1">{group.subject}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Group Info */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Group Details</h3>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-gray-500">Description:</span>
                    <p className="text-gray-900 mt-1">{group.description}</p>
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
            </div>

            {/* Right Column - Members */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Members ({group.memberCount})</h3>
                {group.memberCount < group.maxMembers && (
                  <button
                    onClick={() => setShowInviteModal(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
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
                      {member === currentUser && (
                        <span className="text-xs text-green-600 font-medium">You</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Leave Group Button */}
              {!isCreator && (
                <div className="pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setShowLeaveConfirm(true)}
                    className="w-full px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors font-medium"
                  >
                    Leave Group
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-60">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Invite Member</h3>
              <div className="space-y-4">
                <div>
                  <label htmlFor="inviteEmail" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="inviteEmail"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter email address"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleInvite}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Send Invite
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Leave Confirmation Modal */}
      {showLeaveConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-60">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Leave Group</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to leave "{group.name}"? You won't be able to access this group anymore.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowLeaveConfirm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLeaveConfirm}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Leave Group
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
