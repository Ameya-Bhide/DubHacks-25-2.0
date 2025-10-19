'use client'

import { useState } from 'react'

interface OpenFileModalProps {
  isOpen: boolean
  fileName: string
  filePath: string
  onClose: () => void
  onOpen: (application: string) => void
}

export default function OpenFileModal({ 
  isOpen, 
  fileName, 
  filePath,
  onClose, 
  onOpen 
}: OpenFileModalProps) {
  const [selectedApp, setSelectedApp] = useState('default')

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onOpen(selectedApp)
  }

  const handleCancel = () => {
    setSelectedApp('default')
    onClose()
  }

  // Common applications for different file types
  const getApplicationsForFile = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase()
    
    const commonApps = [
      { name: 'default', label: 'Default Application', icon: '📄' },
      { name: 'Preview', label: 'Preview (macOS)', icon: '👁️' },
      { name: 'Adobe Acrobat', label: 'Adobe Acrobat', icon: '📕' },
      { name: 'TextEdit', label: 'TextEdit', icon: '📝' },
      { name: 'Safari', label: 'Safari', icon: '🌐' },
      { name: 'Chrome', label: 'Google Chrome', icon: '🌐' },
      { name: 'Firefox', label: 'Firefox', icon: '🦊' },
      { name: 'Microsoft Word', label: 'Microsoft Word', icon: '📄' },
      { name: 'Microsoft Excel', label: 'Microsoft Excel', icon: '📊' },
      { name: 'Microsoft PowerPoint', label: 'Microsoft PowerPoint', icon: '📽️' },
      { name: 'VLC', label: 'VLC Media Player', icon: '🎬' },
      { name: 'QuickTime Player', label: 'QuickTime Player', icon: '🎥' }
    ]

    // Filter apps based on file type
    switch (extension) {
      case 'pdf':
        return commonApps.filter(app => 
          ['default', 'Preview', 'Adobe Acrobat', 'Safari', 'Chrome', 'Firefox'].includes(app.name)
        )
      case 'txt':
      case 'md':
        return commonApps.filter(app => 
          ['default', 'TextEdit', 'Safari', 'Chrome', 'Firefox'].includes(app.name)
        )
      case 'doc':
      case 'docx':
        return commonApps.filter(app => 
          ['default', 'Microsoft Word', 'Safari', 'Chrome', 'Firefox'].includes(app.name)
        )
      case 'xls':
      case 'xlsx':
        return commonApps.filter(app => 
          ['default', 'Microsoft Excel', 'Safari', 'Chrome', 'Firefox'].includes(app.name)
        )
      case 'ppt':
      case 'pptx':
        return commonApps.filter(app => 
          ['default', 'Microsoft PowerPoint', 'Safari', 'Chrome', 'Firefox'].includes(app.name)
        )
      case 'mp4':
      case 'avi':
      case 'mov':
        return commonApps.filter(app => 
          ['default', 'VLC', 'QuickTime Player', 'Safari', 'Chrome'].includes(app.name)
        )
      default:
        return commonApps.slice(0, 6) // Show first 6 apps for unknown types
    }
  }

  const applications = getApplicationsForFile(fileName)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">Open File</h3>
        
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">
            Choose how to open <strong>"{fileName}"</strong>
          </p>
          <p className="text-xs text-gray-500 mb-4">
            File location: {filePath}
          </p>
          
          {/* File type specific guidance */}
          {fileName.toLowerCase().endsWith('.pdf') && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>💡 Tip:</strong> For PDF files, Preview and Adobe Acrobat work best. 
                Browsers may show a blank page or require additional setup.
              </p>
            </div>
          )}
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select application:
            </label>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {applications.map((app, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setSelectedApp(app.name)}
                  className={`w-full p-3 text-left border rounded-lg transition duration-200 ${
                    selectedApp === app.name
                      ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">{app.icon}</span>
                    <div>
                      <div className="font-medium text-gray-900">{app.label}</div>
                      {app.name !== 'default' && (
                        <div className="text-xs text-gray-500">{app.name}</div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-200"
            >
              Open File
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
