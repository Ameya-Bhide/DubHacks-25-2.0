import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import os from 'os'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const fileName = formData.get('fileName') as string
    const studyGroupName = formData.get('studyGroupName') as string
    const description = formData.get('description') as string
    const dateCreated = formData.get('dateCreated') as string
    const className = formData.get('className') as string
    const uploadedBy = formData.get('uploadedBy') as string

    if (!file) {
      return NextResponse.json({ 
        success: false, 
        error: 'No file provided' 
      }, { status: 400 })
    }

    const homeDir = os.homedir()
    let filePath: string
    let userFriendlyPath: string

    // Check common locations to see if the file already exists
    const commonLocations = [
      path.join(homeDir, 'Downloads', file.name),
      path.join(homeDir, 'Documents', file.name),
      path.join(homeDir, 'Desktop', file.name)
    ]
    
    let existingFilePath: string | null = null
    
    // Check if file exists in any common location
    for (const location of commonLocations) {
      try {
        await fs.access(location)
        existingFilePath = location
        console.log(`Found existing file at: ${location}`)
        break
      } catch (error) {
        // File doesn't exist at this location, continue checking
      }
    }
    
    if (existingFilePath) {
      // File exists in a common location, preserve that path
      filePath = existingFilePath
      userFriendlyPath = existingFilePath.replace(homeDir, '~')
      console.log(`Preserving existing file location: ${filePath}`)
    } else {
      // No original path provided, use default UploadedFiles location
      const uploadDir = path.join(homeDir, 'Documents', 'UploadedFiles')
      await fs.mkdir(uploadDir, { recursive: true })
      filePath = path.join(uploadDir, file.name)
      userFriendlyPath = `~/Documents/UploadedFiles/${file.name}`
      
      // Convert file to buffer and save
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      await fs.writeFile(filePath, buffer)
      console.log(`File saved to default location: ${filePath}`)
    }

    // Create the file record with the actual file path
    const fileRecord = {
      fileName: fileName || file.name,
      originalFileName: file.name,
      filePath: userFriendlyPath, // User-friendly path with ~
      actualFilePath: filePath, // Full system path
      studyGroupName: studyGroupName || 'Personal',
      description: description || '',
      dateCreated: dateCreated || new Date().toISOString().split('T')[0],
      className: className || '',
      fileSize: file.size,
      fileType: file.type,
      uploadedBy: uploadedBy || 'unknown-user',
      uploadedAt: new Date().toISOString(),
      isPersonal: studyGroupName === 'Personal'
    }

    return NextResponse.json({
      success: true,
      message: 'File uploaded successfully',
      fileRecord: fileRecord,
      actualFilePath: filePath
    })

  } catch (error: any) {
    console.error('Error uploading file:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Failed to upload file' 
    }, { status: 500 })
  }
}
