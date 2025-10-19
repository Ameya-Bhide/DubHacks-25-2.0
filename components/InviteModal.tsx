'use client'

import { useState } from 'react'
import { devInvites, Invite, getAllStudyGroups, sendInvite, getAllInvites } from '@/lib/aws-study-groups'
import { checkDynamoDBConfigFromBrowser } from '@/lib/aws-config'

interface InviteModalProps {
  isOpen: boolean
  onClose: () => void
  groupId: string
  groupName: string
  inviterId: string
  inviterName: string
  onInviteSent: () => void
}

export default function InviteModal({ isOpen, onClose, groupId, groupName, inviterId, inviterName, onInviteSent }: InviteModalProps) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) {
      setError('Please enter an email address')
      return
    }

    setLoading(true)
    setError('')

    try {
      // First, verify that the group still exists using the appropriate data source (AWS or localStorage)
      const allGroups = await getAllStudyGroups()
      
      // Ensure groupId is always a string for consistent comparison
      const normalizedGroupId = String(groupId)
      
      console.log('Debug - Looking for group with ID:', groupId, 'Type:', typeof groupId)
      console.log('Debug - Normalized group ID:', normalizedGroupId, 'Type:', typeof normalizedGroupId)
      console.log('Debug - Available groups:', allGroups.map(g => ({ id: g.id, name: g.name, idType: typeof g.id })))
      const hasDynamoDB = await checkDynamoDBConfigFromBrowser()
      console.log('Debug - Using AWS DynamoDB:', hasDynamoDB)
      
      // Try multiple matching strategies to handle type mismatches
      let groupExists = allGroups.find(g => String(g.id) === normalizedGroupId) // String comparison (primary)
      if (!groupExists) {
        groupExists = allGroups.find(g => g.id === normalizedGroupId) // Exact match
      }
      if (!groupExists) {
        groupExists = allGroups.find(g => Number(g.id) === Number(normalizedGroupId)) // Number comparison
      }
      if (!groupExists) {
        groupExists = allGroups.find(g => g.id == normalizedGroupId) // Loose equality
      }
      
      if (!groupExists) {
        console.error('Debug - Group not found with ID:', groupId)
        console.error('Debug - Available group IDs:', allGroups.map(g => g.id))
        setError('This study group no longer exists. Please refresh the page and try again.')
        return
      }
      
      console.log('Debug - Found group:', groupExists)

      // Check if the group is full
      if (groupExists.memberCount >= groupExists.maxMembers) {
        setError('This study group is full and cannot accept new members.')
        return
      }

      // Check if the email is already a member
      if (groupExists.members.includes(email.trim())) {
        setError('This email is already a member of the study group.')
        return
      }

      // Note: Removed restriction on sending multiple invites to the same person
      // Users can now send multiple invites to the same email address

      // Create invite object
      const invite: Invite = {
        id: Date.now().toString(),
        groupId: normalizedGroupId, // Use the normalized string ID
        groupName,
        inviterId,
        inviterName,
        inviteeEmail: email.trim(),
        status: 'pending',
        createdAt: new Date().toISOString()
      }

      // Save invite using the appropriate data source (AWS or localStorage)
      await sendInvite(invite)

      // Reset form and close modal
      setEmail('')
      onInviteSent()
      onClose()
      
      // Show success message
      alert(`Invitation sent to ${email.trim()}! They will see it in their invites and can join "${groupName}".`)
    } catch (error) {
      console.error('Error sending invite:', error)
      setError(error instanceof Error ? error.message : 'Failed to send invite')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setEmail('')
    setError('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Invite to {groupName}</h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email address"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                required
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Sending...
                  </div>
                ) : (
                  'Send Invite'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
