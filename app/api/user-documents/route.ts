import { NextRequest, NextResponse } from 'next/server'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, ScanCommand, DeleteCommand, GetCommand } from '@aws-sdk/lib-dynamodb'
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// Initialize DynamoDB client
const client = new DynamoDBClient({
  region: process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

const docClient = DynamoDBDocumentClient.from(client)
const FILES_TABLE = 'StudyGroupFiles'
const STUDY_GROUPS_TABLE = 'StudyGroups'

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        error: 'User ID is required' 
      }, { status: 400 })
    }

    // First, get all study groups the user is a member of
    const studyGroupsCommand = new ScanCommand({
      TableName: STUDY_GROUPS_TABLE,
      FilterExpression: 'contains(members, :userId)',
      ExpressionAttributeValues: {
        ':userId': userId
      }
    })

    const studyGroupsResult = await docClient.send(studyGroupsCommand)
    const userStudyGroups = studyGroupsResult.Items || []
    const studyGroupNames = userStudyGroups.map(group => group.name)

    // Get personal files, study group files that the user uploaded, AND downloaded files
    const filesCommand = new ScanCommand({
      TableName: FILES_TABLE,
      FilterExpression: 'uploadedBy = :userId OR downloadedBy = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      }
    })

    const filesResult = await docClient.send(filesCommand)
    const documents = filesResult.Items || []

    return NextResponse.json({ 
      success: true, 
      documents: documents 
    })

  } catch (error: any) {
    console.error('Error getting user documents:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Failed to get documents' 
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { fileId, s3Key } = await request.json()

    if (!fileId || !s3Key) {
      return NextResponse.json({ 
        success: false, 
        error: 'File ID and S3 key are required' 
      }, { status: 400 })
    }

    // Only delete from S3 if it's not a personal file
    if (!s3Key.startsWith('local://')) {
      const deleteS3Command = new DeleteObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: s3Key
      })

      try {
        await s3Client.send(deleteS3Command)
        console.log('File deleted from S3:', s3Key)
      } catch (s3Error) {
        console.error('Error deleting file from S3:', s3Error)
        // Continue with database deletion even if S3 deletion fails
      }
    } else {
      console.log('Personal file - skipping S3 deletion:', s3Key)
    }

    // Delete from DynamoDB
    const deleteCommand = new DeleteCommand({
      TableName: FILES_TABLE,
      Key: { id: fileId }
    })

    await docClient.send(deleteCommand)

    return NextResponse.json({ 
      success: true, 
      message: 'Document deleted successfully from both S3 and database' 
    })

  } catch (error: any) {
    console.error('Error deleting document:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Failed to delete document' 
    }, { status: 500 })
  }
}
