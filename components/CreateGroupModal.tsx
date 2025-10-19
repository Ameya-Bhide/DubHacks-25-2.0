'use client'

import { useState, useEffect } from 'react'

interface CreateGroupModalProps {
  isOpen: boolean
  onClose: () => void
  onCreateGroup: (groupData: any) => void
  userProfile?: {
    university?: string
    className?: string
  }
}

export default function CreateGroupModal({ isOpen, onClose, onCreateGroup, userProfile }: CreateGroupModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    university: '',
    className: '',
    subject: '',
    maxMembers: 20, // Fixed cap of 20 members
    meetingFrequency: 'weekly',
    meetingDay: 'monday',
    meetingTime: '18:00'
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Pre-populate form with user profile data when modal opens
  useEffect(() => {
    if (isOpen && userProfile) {
      setFormData(prev => ({
        ...prev,
        university: userProfile.university || '',
        className: userProfile.className || ''
      }))
    }
  }, [isOpen, userProfile])

  const universities = [
    'University of Washington',
    'University of California, Berkeley',
    'Stanford University',
    'University of California, Los Angeles',
    'University of California, San Diego',
    'University of Southern California',
    'California Institute of Technology',
    'University of California, Davis',
    'University of California, Irvine',
    'University of California, Santa Barbara',
    'University of California, Santa Cruz',
    'University of California, Riverside',
    'University of California, Merced',
    'University of Oregon',
    'Oregon State University',
    'Portland State University',
    'University of British Columbia',
    'Simon Fraser University',
    'University of Victoria',
    'Other'
  ]

  const subjects = [
    'Computer Science',
    'Mathematics',
    'Physics',
    'Chemistry',
    'Biology',
    'Literature',
    'History',
    'Economics',
    'Psychology',
    'Engineering',
    'Data Science',
    'Other'
  ]

  const days = [
    'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
  ]

  const frequencies = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'biweekly', label: 'Bi-weekly' },
    { value: 'monthly', label: 'Monthly' }
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // TODO: Replace with actual AWS DynamoDB integration
      const groupData = {
        ...formData,
        // For daily meetings, set meetingDay to 'daily'
        meetingDay: formData.meetingFrequency === 'daily' ? 'daily' : formData.meetingDay,
        id: Date.now().toString(), // Temporary ID
        createdAt: new Date().toISOString(),
        memberCount: 1, // Creator is the first member
        createdBy: 'current-user', // TODO: Get from auth context
        members: ['current-user'] // TODO: Get from auth context
      }

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      onCreateGroup(groupData)
      onClose()
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        university: '',
        className: '',
        subject: '',
        maxMembers: 20, // Fixed cap of 20 members
        meetingFrequency: 'weekly',
        meetingDay: 'monday',
        meetingTime: '18:00'
      })
    } catch (error: any) {
      console.error('Error creating group:', error)
      setError(error.message || 'Failed to create study group')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
      // If frequency is daily, clear the meeting day
      ...(name === 'meetingFrequency' && value === 'daily' ? { meetingDay: '' } : {})
    }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Create New Study Group</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <div className="space-y-6">
            {/* Group Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Group Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Advanced React Development"
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                id="description"
                name="description"
                required
                rows={3}
                value={formData.description}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Describe what your study group will focus on..."
              />
            </div>

            {/* University and Class */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="university" className="block text-sm font-medium text-gray-700 mb-2">
                  University *
                </label>
                <select
                  id="university"
                  name="university"
                  required
                  value={formData.university}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select university</option>
                  {universities.map(university => (
                    <option key={university} value={university}>{university}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="className" className="block text-sm font-medium text-gray-700 mb-2">
                  Class Name/Code *
                </label>
                <input
                  type="text"
                  id="className"
                  name="className"
                  required
                  value={formData.className}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., CSE 142, MATH 124"
                />
              </div>
            </div>

            {/* Subject */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                  Subject *
                </label>
                <select
                  id="subject"
                  name="subject"
                  required
                  value={formData.subject}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select a subject</option>
                  {subjects.map(subject => (
                    <option key={subject} value={subject}>{subject}</option>
                  ))}
                </select>
              </div>

            </div>

            {/* Meeting Schedule */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Meeting Schedule</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="meetingFrequency" className="block text-sm font-medium text-gray-700 mb-2">
                    Frequency
                  </label>
                  <select
                    id="meetingFrequency"
                    name="meetingFrequency"
                    value={formData.meetingFrequency}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {frequencies.map(freq => (
                      <option key={freq.value} value={freq.value}>{freq.label}</option>
                    ))}
                  </select>
                </div>

                {formData.meetingFrequency !== 'daily' && (
                  <div>
                    <label htmlFor="meetingDay" className="block text-sm font-medium text-gray-700 mb-2">
                      Day
                    </label>
                    <select
                      id="meetingDay"
                      name="meetingDay"
                      value={formData.meetingDay}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {days.map(day => (
                        <option key={day} value={day}>
                          {day.charAt(0).toUpperCase() + day.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label htmlFor="meetingTime" className="block text-sm font-medium text-gray-700 mb-2">
                    Time
                  </label>
                  <input
                    type="time"
                    id="meetingTime"
                    name="meetingTime"
                    value={formData.meetingTime}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 mt-8 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating...
                </>
              ) : (
                'Create Group'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
