import { NextRequest, NextResponse } from 'next/server'
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import { promises as fs } from 'fs'
import path from 'path'
import os from 'os'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || 'study-group-files'

export async function POST(request: NextRequest) {
  try {
    const { s3Key, fileName, userId, customPath } = await request.json()

    if (!s3Key || !fileName || !userId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required parameters: s3Key, fileName, userId' 
      }, { status: 400 })
    }

    // Check if this is a local file (personal file)
    if (s3Key.startsWith('local://')) {
      return NextResponse.json({ 
        success: false, 
        error: 'Personal files are stored locally and cannot be downloaded through this API' 
      }, { status: 400 })
    }

    // Get file from S3
    const getCommand = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key
    })

    const response = await s3Client.send(getCommand)
    
    if (!response.Body) {
      return NextResponse.json({ 
        success: false, 
        error: 'File not found' 
      }, { status: 404 })
    }

    // Convert stream to buffer
    const chunks = []
    const reader = response.Body.transformToWebStream().getReader()
    
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      chunks.push(value)
    }
    
    const fileBuffer = Buffer.concat(chunks)

    // Determine the file path
    let finalFilePath: string
    
    if (customPath) {
      // Use custom path provided by user
      const homeDir = os.homedir()
      // Expand ~ to actual home directory
      const expandedPath = customPath.replace('~', homeDir)
      
      // Check if the path ends with a filename or is just a directory
      if (path.extname(expandedPath)) {
        // Path includes a filename, use as is
        finalFilePath = expandedPath
      } else {
        // Path is just a directory, append the filename
        finalFilePath = path.join(expandedPath, fileName)
      }
    } else {
      // Use default location
      const homeDir = os.homedir()
      const downloadDir = path.join(homeDir, 'Documents', 'DownloadedFiles')
      finalFilePath = path.join(downloadDir, fileName)
    }
    
    // Ensure the directory exists
    const dirPath = path.dirname(finalFilePath)
    await fs.mkdir(dirPath, { recursive: true })
    
    // Write the file to the specified location
    await fs.writeFile(finalFilePath, fileBuffer)

    // Return the actual file path where the file was saved (with ~ for user-friendly display)
    const userFriendlyPath = finalFilePath.replace(os.homedir(), '~')
    
    return NextResponse.json({
      success: true,
      filePath: userFriendlyPath,
      actualFilePath: finalFilePath,
      message: 'File downloaded successfully'
    })

  } catch (error: any) {
    console.error('Error downloading file to path:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Failed to download file' 
    }, { status: 500 })
  }
}
