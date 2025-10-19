'use client'

import { useState } from 'react'

interface Invite {
  id: string
  groupId: string
  groupName: string
  inviterId: string
  inviteeEmail: string
  status: string
  createdAt: string
}

interface InviteCardProps {
  invite: Invite
  onRespond: (inviteId: string, response: 'accept' | 'decline') => void
}

export default function InviteCard({ invite, onRespond }: InviteCardProps) {
  const [loading, setLoading] = useState(false)

  const handleRespond = async (response: 'accept' | 'decline') => {
    setLoading(true)
    try {
      await onRespond(invite.id, response)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900 mb-1">{invite.groupName}</h4>
          <p className="text-sm text-gray-600 mb-2">
            Invited by {invite.inviterId}
          </p>
          <p className="text-xs text-gray-500">
            {new Date(invite.createdAt).toLocaleDateString()}
          </p>
        </div>
        <div className="flex space-x-2 ml-4">
          <button
            onClick={() => handleRespond('accept')}
            disabled={loading}
            className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '...' : 'Accept'}
          </button>
          <button
            onClick={() => handleRespond('decline')}
            disabled={loading}
            className="px-3 py-1 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '...' : 'Decline'}
          </button>
        </div>
      </div>
    </div>
  )
}
