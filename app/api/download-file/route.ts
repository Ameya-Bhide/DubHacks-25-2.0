import { NextRequest, NextResponse } from 'next/server'
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'

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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const s3Key = searchParams.get('s3Key')

    if (!s3Key) {
      return NextResponse.json({ 
        success: false, 
        error: 'No file key provided' 
      }, { status: 400 })
    }

    // Check if this is a local file (personal file)
    if (s3Key.startsWith('local://')) {
      return NextResponse.json({ 
        success: false, 
        error: 'Personal files are stored locally and cannot be downloaded through this API' 
      }, { status: 400 })
    }

    // Get file from S3 (only for study group files)
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

    // Get file metadata
    const originalName = response.Metadata?.originalname || s3Key.split('/').pop() || 'download'
    const contentType = response.ContentType || 'application/octet-stream'

    // Return file as download
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${originalName}"`,
        'Content-Length': fileBuffer.length.toString(),
      },
    })

  } catch (error: any) {
    console.error('Error downloading file:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Failed to download file' 
    }, { status: 500 })
  }
}
