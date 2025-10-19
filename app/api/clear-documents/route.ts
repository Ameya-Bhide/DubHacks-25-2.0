import { NextRequest, NextResponse } from 'next/server'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, ScanCommand, BatchWriteCommand } from '@aws-sdk/lib-dynamodb'

export const dynamic = 'force-dynamic'

const client = new DynamoDBClient({
  region: process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

const docClient = DynamoDBDocumentClient.from(client)
const FILES_TABLE = 'StudyGroupFiles'
const NOTIFICATIONS_TABLE = 'StudyGroupNotifications'

export async function POST(request: NextRequest) {
  try {
    console.log('🗑️ Starting to clear all documents...')

    // Clear StudyGroupFiles table
    console.log('📄 Clearing StudyGroupFiles table...')
    const filesScanCommand = new ScanCommand({
      TableName: FILES_TABLE
    })
    
    const filesResult = await docClient.send(filesScanCommand)
    const files = filesResult.Items || []
    
    if (files.length > 0) {
      // Delete in batches of 25 (DynamoDB limit)
      for (let i = 0; i < files.length; i += 25) {
        const batch = files.slice(i, i + 25)
        const deleteRequests = batch.map(item => ({
          DeleteRequest: {
            Key: { id: item.id }
          }
        }))
        
        const batchWriteCommand = new BatchWriteCommand({
          RequestItems: {
            [FILES_TABLE]: deleteRequests
          }
        })
        
        await docClient.send(batchWriteCommand)
        console.log(`✅ Deleted batch ${Math.floor(i/25) + 1} of files`)
      }
    }

    // Clear StudyGroupNotifications table
    console.log('🔔 Clearing StudyGroupNotifications table...')
    const notificationsScanCommand = new ScanCommand({
      TableName: NOTIFICATIONS_TABLE
    })
    
    const notificationsResult = await docClient.send(notificationsScanCommand)
    const notifications = notificationsResult.Items || []
    
    if (notifications.length > 0) {
      // Delete in batches of 25
      for (let i = 0; i < notifications.length; i += 25) {
        const batch = notifications.slice(i, i + 25)
        const deleteRequests = batch.map(item => ({
          DeleteRequest: {
            Key: { id: item.id }
          }
        }))
        
        const batchWriteCommand = new BatchWriteCommand({
          RequestItems: {
            [NOTIFICATIONS_TABLE]: deleteRequests
          }
        })
        
        await docClient.send(batchWriteCommand)
        console.log(`✅ Deleted batch ${Math.floor(i/25) + 1} of notifications`)
      }
    }

    console.log('🎉 All documents and notifications cleared successfully!')
    
    return NextResponse.json({ 
      success: true, 
      message: 'All documents and notifications cleared successfully!',
      summary: {
        filesDeleted: files.length,
        notificationsDeleted: notifications.length
      }
    })

  } catch (error: any) {
    console.error('❌ Error clearing documents:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Failed to clear documents' 
    }, { status: 500 })
  }
}
