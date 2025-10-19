import fs from 'fs'
import path from 'path'
import os from 'os'
import yaml from 'js-yaml'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

interface FileMetadata {
  one_sentence: string
  five_sentence: string
  date_created?: string
  study_group_name?: string
  class_name?: string
  uploaded_by?: string
  uploaded_at?: string
  file_size?: number
  file_type?: string
  is_personal?: boolean
  is_downloaded?: boolean
  original_file_id?: string
  downloaded_by?: string
  downloaded_at?: string
}

interface FileRecord {
  id: string
  fileName: string
  originalFileName: string
  filePath: string
  studyGroupName: string
  description: string
  dateCreated: string
  className: string
  fileSize: number
  fileType: string
  uploadedBy: string
  uploadedAt: string
  isPersonal: boolean
  isDownloaded?: boolean
  originalFileId?: string
  downloadedBy?: string
  downloadedAt?: string
}

const getAiHelperDir = () => {
  const homeDir = os.homedir()
  return path.join(homeDir, 'Documents', '.ai_helper')
}

const getDescriptionsFile = () => {
  return path.join(getAiHelperDir(), 'descriptions.yaml')
}

const ensureAiHelperDir = () => {
  const aiHelperDir = getAiHelperDir()
  if (!fs.existsSync(aiHelperDir)) {
    fs.mkdirSync(aiHelperDir, { recursive: true })
  }
}

const loadDescriptions = (): Record<string, FileMetadata> => {
  const descriptionsFile = getDescriptionsFile()
  
  if (!fs.existsSync(descriptionsFile)) {
    return {}
  }

  try {
    const fileContents = fs.readFileSync(descriptionsFile, 'utf8')
    return yaml.load(fileContents) as Record<string, FileMetadata> || {}
  } catch (error) {
    console.error('Error reading descriptions.yaml:', error)
    return {}
  }
}

const saveDescriptions = (descriptions: Record<string, FileMetadata>) => {
  ensureAiHelperDir()
  const descriptionsFile = getDescriptionsFile()
  
  try {
    const yamlData = yaml.dump(descriptions, { indent: 2 })
    fs.writeFileSync(descriptionsFile, yamlData, 'utf8')
  } catch (error) {
    console.error('Error writing descriptions.yaml:', error)
    throw error
  }
}

export const saveFileRecord = (fileRecord: Omit<FileRecord, 'id'>): FileRecord => {
  const descriptions = loadDescriptions()
  const id = `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  const fullFileRecord: FileRecord = {
    id,
    ...fileRecord
  }

  // Store in YAML with file path as key
  descriptions[fileRecord.filePath] = {
    one_sentence: fileRecord.description,
    five_sentence: fileRecord.description, // Using description as both for now
    date_created: fileRecord.dateCreated,
    study_group_name: fileRecord.studyGroupName,
    class_name: fileRecord.className,
    uploaded_by: fileRecord.uploadedBy,
    uploaded_at: fileRecord.uploadedAt,
    file_size: fileRecord.fileSize,
    file_type: fileRecord.fileType,
    is_personal: fileRecord.isPersonal,
    is_downloaded: fileRecord.isDownloaded,
    original_file_id: fileRecord.originalFileId,
    downloaded_by: fileRecord.downloadedBy,
    downloaded_at: fileRecord.downloadedAt
  }

  saveDescriptions(descriptions)
  return fullFileRecord
}

export const getUserFiles = (userId: string): FileRecord[] => {
  const descriptions = loadDescriptions()
  const files: FileRecord[] = []

  for (const [filePath, metadata] of Object.entries(descriptions)) {
    // Check if user uploaded this file or downloaded it
    if (metadata.uploaded_by === userId || metadata.downloaded_by === userId) {
      const fileName = path.basename(filePath)
      
      files.push({
        id: `file_${filePath.replace(/[^a-zA-Z0-9]/g, '_')}`,
        fileName: metadata.one_sentence || fileName,
        originalFileName: fileName,
        filePath,
        studyGroupName: metadata.study_group_name || 'Personal',
        description: metadata.one_sentence || '',
        dateCreated: metadata.date_created || new Date().toISOString().split('T')[0],
        className: metadata.class_name || '',
        fileSize: metadata.file_size || 0,
        fileType: metadata.file_type || 'application/octet-stream',
        uploadedBy: metadata.uploaded_by || userId,
        uploadedAt: metadata.uploaded_at || new Date().toISOString(),
        isPersonal: metadata.is_personal || false,
        isDownloaded: metadata.is_downloaded || false,
        originalFileId: metadata.original_file_id,
        downloadedBy: metadata.downloaded_by,
        downloadedAt: metadata.downloaded_at
      })
    }
  }

  return files.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
}

export const deleteFileRecord = (filePath: string): boolean => {
  const descriptions = loadDescriptions()
  
  if (descriptions[filePath]) {
    delete descriptions[filePath]
    saveDescriptions(descriptions)
    return true
  }
  
  return false
}

export const getFileRecord = (filePath: string): FileRecord | null => {
  const descriptions = loadDescriptions()
  const metadata = descriptions[filePath]
  
  if (!metadata) {
    return null
  }

  const fileName = path.basename(filePath)
  
  return {
    id: `file_${filePath.replace(/[^a-zA-Z0-9]/g, '_')}`,
    fileName: metadata.one_sentence || fileName,
    originalFileName: fileName,
    filePath,
    studyGroupName: metadata.study_group_name || 'Personal',
    description: metadata.one_sentence || '',
    dateCreated: metadata.date_created || new Date().toISOString().split('T')[0],
    className: metadata.class_name || '',
    fileSize: metadata.file_size || 0,
    fileType: metadata.file_type || 'application/octet-stream',
    uploadedBy: metadata.uploaded_by || 'unknown',
    uploadedAt: metadata.uploaded_at || new Date().toISOString(),
    isPersonal: metadata.is_personal || false,
    isDownloaded: metadata.is_downloaded || false,
    originalFileId: metadata.original_file_id,
    downloadedBy: metadata.downloaded_by,
    downloadedAt: metadata.downloaded_at
  }
}

export const updateFileRecord = (filePath: string, updates: Partial<FileMetadata>): boolean => {
  const descriptions = loadDescriptions()
  
  if (descriptions[filePath]) {
    descriptions[filePath] = { ...descriptions[filePath], ...updates }
    saveDescriptions(descriptions)
    return true
  }
  
  return false
}

// Integration with make_file.js
export const makeFile = (data: {
  'File path': string
  'Date Created': string
  'Study Group Name': string
  'Class Name': string
  'Name of file': string
  '1-sentence description': string
  'five-sentence summary'?: string
}) => {
  const homeDir = os.homedir()
  const documentsDir = path.join(homeDir, 'Documents')
  const fileName = path.basename(data['File path'])
  const expandedFilePath = path.join(documentsDir, 'UploadedFiles', fileName)

  const fileRecord: Omit<FileRecord, 'id'> = {
    fileName: data['Name of file'],
    originalFileName: fileName,
    filePath: expandedFilePath,
    studyGroupName: data['Study Group Name'],
    description: data['1-sentence description'],
    dateCreated: data['Date Created'],
    className: data['Class Name'],
    fileSize: 0, // Will be updated when file is actually uploaded
    fileType: 'application/octet-stream', // Will be updated when file is actually uploaded
    uploadedBy: 'current-user', // Will be updated with actual user
    uploadedAt: new Date().toISOString(),
    isPersonal: data['Study Group Name'] === 'Personal'
  }

  return saveFileRecord(fileRecord)
}
