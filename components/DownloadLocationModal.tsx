'use client'

import { useState } from 'react'

interface DownloadLocationModalProps {
  isOpen: boolean
  fileName: string
  onClose: () => void
  onConfirm: (downloadPath: string) => void
}

export default function DownloadLocationModal({ 
  isOpen, 
  fileName, 
  onClose, 
  onConfirm 
}: DownloadLocationModalProps) {
  const [downloadPath, setDownloadPath] = useState(`~/Documents/DownloadedFiles/`)
  const [selectedOption, setSelectedOption] = useState('default')

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const path = downloadPath.trim()
    if (path) {
      onConfirm(path)
    } else {
      onConfirm(`~/Documents/DownloadedFiles/`)
    }
  }

  const handleCancel = () => {
    setDownloadPath(`~/Documents/DownloadedFiles/`)
    setSelectedOption('default')
    onClose()
  }

  const quickSelect = (path: string, option: string) => {
    setDownloadPath(path)
    setSelectedOption(option)
  }

  const commonDirectories = [
    { 
      name: 'Documents/DownloadedFiles', 
      path: '~/Documents/DownloadedFiles/', 
      icon: '📁',
      description: 'Default download folder'
    },
    { 
      name: 'Downloads', 
      path: '~/Downloads/', 
      icon: '⬇️',
      description: 'System downloads folder'
    },
    { 
      name: 'Desktop', 
      path: '~/Desktop/', 
      icon: '🖥️',
      description: 'Desktop folder'
    },
    { 
      name: 'Documents', 
      path: '~/Documents/', 
      icon: '📄',
      description: 'Documents folder'
    },
    { 
      name: 'Pictures', 
      path: '~/Pictures/', 
      icon: '🖼️',
      description: 'Pictures folder'
    }
  ]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">Choose Download Location</h3>
        
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-4">
            Where would you like to save <strong>"{fileName}"</strong>?
          </p>
          
          {/* Directory selection options */}
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-700 mb-3">Select a folder:</p>
            <div className="grid grid-cols-1 gap-2">
              {commonDirectories.map((dir, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => quickSelect(dir.path, dir.name)}
                  className={`p-3 text-left border rounded-lg transition duration-200 ${
                    selectedOption === dir.name
                      ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">{dir.icon}</span>
                    <div>
                      <div className="font-medium text-gray-900">{dir.name}</div>
                      <div className="text-xs text-gray-500">{dir.description}</div>
                      <div className="text-xs text-gray-400 font-mono">{dir.path}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Custom path option */}
          <div className="mb-4">
            <button
              type="button"
              onClick={() => setSelectedOption('custom')}
              className={`w-full p-3 text-left border rounded-lg transition duration-200 ${
                selectedOption === 'custom'
                  ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center">
                <span className="text-2xl mr-3">📂</span>
                <div>
                  <div className="font-medium text-gray-900">Custom Location</div>
                  <div className="text-xs text-gray-500">Specify your own directory path</div>
                </div>
              </div>
            </button>
          </div>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="downloadPath" className="block text-sm font-medium text-gray-700 mb-2">
              Directory path:
            </label>
            <input
              type="text"
              id="downloadPath"
              value={downloadPath}
              onChange={(e) => {
                setDownloadPath(e.target.value)
                setSelectedOption('custom')
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter directory path (filename will be added automatically)"
            />
            <p className="text-xs text-gray-500 mt-1">
              💡 <strong>Tip:</strong> Just specify the directory. The filename "{fileName}" will be added automatically.
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Examples: ~/Documents/MyFiles/, ~/Downloads/, /Users/YourName/Desktop/
            </p>
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
              Download
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
