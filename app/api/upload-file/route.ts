import { NextRequest, NextResponse } from 'next/server'
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { v4 as uuidv4 } from 'uuid'

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
    const formData = await request.formData()
    const file = formData.get('file') as File
    const studyGroupName = formData.get('studyGroupName') as string
    const fileName = formData.get('fileName') as string
    const description = formData.get('description') as string
    const dateCreated = formData.get('dateCreated') as string
    const className = formData.get('className') as string
    const uploadedBy = formData.get('uploadedBy') as string || 'unknown-user'

    if (!file) {
      return NextResponse.json({ 
        success: false, 
        error: 'No file provided' 
      }, { status: 400 })
    }

    let fileKey = ''
    let s3Uploaded = false

    // Only upload to S3 if it's NOT a personal file
    if (studyGroupName !== 'Personal') {
      // Generate unique file key for study group files
      const fileExtension = file.name.split('.').pop()
      const uniqueFileName = `${uuidv4()}.${fileExtension}`
      fileKey = `study-groups/${studyGroupName}/${uniqueFileName}`

      // Convert file to buffer
      const fileBuffer = await file.arrayBuffer()

      // Upload to S3
      const uploadCommand = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: fileKey,
        Body: Buffer.from(fileBuffer),
        ContentType: file.type,
        Metadata: {
          originalName: fileName,
          studyGroupName: studyGroupName,
          description: description,
          dateCreated: dateCreated,
          className: className,
          uploadedBy: uploadedBy
        }
      })

      await s3Client.send(uploadCommand)
      s3Uploaded = true
      console.log('📤 File uploaded to S3:', fileKey)
    } else {
      // For personal files, use a local path reference
      fileKey = `local://${uploadedBy}/${fileName}`
      console.log('📁 Personal file kept local:', fileKey)
    }

    // Create file record for database
    const fileRecord = {
      id: uuidv4(),
      fileName: fileName,
      originalFileName: file.name,
      s3Key: fileKey,
      studyGroupName: studyGroupName,
      description: description,
      dateCreated: dateCreated,
      className: className,
      fileSize: file.size,
      fileType: file.type,
      uploadedBy: uploadedBy,
      uploadedAt: new Date().toISOString(),
      downloadCount: 0,
      s3Uploaded: s3Uploaded,
      isPersonal: studyGroupName === 'Personal'
    }

    return NextResponse.json({ 
      success: true, 
      message: 'File uploaded successfully',
      fileRecord: fileRecord
    })

  } catch (error: any) {
    console.error('Error uploading file:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Failed to upload file' 
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { s3Key } = await request.json()

    if (!s3Key) {
      return NextResponse.json({ 
        success: false, 
        error: 'No S3 key provided' 
      }, { status: 400 })
    }

    // Delete from S3
    const deleteCommand = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key
    })

    await s3Client.send(deleteCommand)

    return NextResponse.json({ 
      success: true, 
      message: 'File deleted successfully' 
    })

  } catch (error: any) {
    console.error('Error deleting file:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Failed to delete file' 
    }, { status: 500 })
  }
}
