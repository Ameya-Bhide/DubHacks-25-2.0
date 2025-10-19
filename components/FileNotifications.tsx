'use client'

import { useState, useEffect } from 'react'

interface FileNotification {
  id: string
  userId: string
  type: string
  title: string
  message: string
  fileId: string
  studyGroupName: string
  status: string
  createdAt: string
}

interface FileNotificationsProps {
  userId: string
  isOpen: boolean
  onClose: () => void
  onFileDownloaded?: () => void
}

export default function FileNotifications({ userId, isOpen, onClose, onFileDownloaded }: FileNotificationsProps) {
  const [notifications, setNotifications] = useState<FileNotification[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen && userId) {
      loadNotifications()
    }
  }, [isOpen, userId])

  const loadNotifications = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/study-group-files', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'getUserNotifications',
          data: { userId }
        })
      })

      const result = await response.json()
      if (result.success) {
        setNotifications(result.notifications)
      }
    } catch (error) {
      console.error('Error loading notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadFile = async (fileId: string, fileName: string, notificationId: string) => {
    try {
      // First, get the file record to get the actual S3 key
      const fileResponse = await fetch('/api/study-group-files', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'getFileRecord',
          data: { fileId }
        })
      })

      const fileResult = await fileResponse.json()
      
      if (!fileResult.success || !fileResult.fileRecord) {
        alert('File not found')
        return
      }

      const s3Key = fileResult.fileRecord.s3Key
      
      // Check if this is a local file (personal file)
      if (s3Key.startsWith('local://')) {
        alert('This is a personal file stored locally and cannot be downloaded through the web interface.')
        return
      }

      // Now download the file using the correct S3 key
      const response = await fetch(`/api/download-file?s3Key=${encodeURIComponent(s3Key)}`)
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = fileResult.fileRecord.fileName || fileName
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        
        // Record the download in the database
        const recordResponse = await fetch('/api/study-group-files', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'recordDownload',
            data: { 
              fileId: fileId,
              userId: userId
            }
          })
        })

        const recordResult = await recordResponse.json()
        
        if (recordResult.success) {
          // Show download acknowledgement
          alert(`✅ File "${fileResult.fileRecord.fileName || fileName}" has been downloaded successfully and added to your Documents!`)
        } else {
          // Still show success for download, but mention the recording failed
          alert(`✅ File "${fileResult.fileRecord.fileName || fileName}" has been downloaded successfully! (Note: Could not add to Documents)`)
        }
        
        // Mark notification as read after successful download
        await markAsRead(notificationId)
        
        // Reload notifications to update the UI
        loadNotifications()
        
        // Notify parent component to refresh Documents tab
        if (onFileDownloaded) {
          onFileDownloaded()
        }
      } else {
        const errorData = await response.json()
        alert(`Failed to download file: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error downloading file:', error)
      alert('Failed to download file')
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch('/api/study-group-files', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'markNotificationRead',
          data: { notificationId }
        })
      })

      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === notificationId 
              ? { ...notif, status: 'read' }
              : notif
          )
        )
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b">
          <h3 className="text-xl font-bold text-gray-900">File Notifications</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition duration-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-8">
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-gray-600">No new file notifications</p>
            </div>
          ) : (
            <div className="space-y-4">
              {notifications.map(notification => (
                <div
                  key={notification.id}
                  className={`p-4 rounded-lg border ${
                    notification.status === 'unread' 
                      ? 'bg-blue-50 border-blue-200' 
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 mb-1">
                        {notification.title}
                      </h4>
                      <p className="text-sm text-gray-600 mb-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(notification.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => handleDownloadFile(notification.fileId, notification.title, notification.id)}
                        className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition duration-200"
                      >
                        Download
                      </button>
                      {notification.status === 'unread' && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="text-gray-500 hover:text-gray-700 text-sm"
                        >
                          Mark Read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
