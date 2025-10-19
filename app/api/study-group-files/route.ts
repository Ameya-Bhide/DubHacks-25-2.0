import { NextRequest, NextResponse } from 'next/server'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, PutCommand, GetCommand, ScanCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb'
import { v4 as uuidv4 } from 'uuid'

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
const STUDY_GROUPS_TABLE = 'StudyGroups'
const FILES_TABLE = 'StudyGroupFiles'
const NOTIFICATIONS_TABLE = 'StudyGroupNotifications'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, data } = body

    if (action === 'saveFileRecord') {
      const { fileRecord } = data
      
      // Save file record to database
      const command = new PutCommand({
        TableName: FILES_TABLE,
        Item: {
          ...fileRecord,
          createdAt: new Date().toISOString()
        }
      })

      await docClient.send(command)

      // If not a personal file, notify all study group members
      if (fileRecord.studyGroupName !== 'Personal') {
        await notifyStudyGroupMembers(fileRecord)
      }

      return NextResponse.json({ 
        success: true, 
        message: 'File record saved and members notified' 
      })
    }

    if (action === 'getStudyGroupFiles') {
      const { studyGroupName, userId } = data
      
      // Get all files for the study group
      const command = new ScanCommand({
        TableName: FILES_TABLE,
        FilterExpression: 'studyGroupName = :studyGroupName',
        ExpressionAttributeValues: {
          ':studyGroupName': studyGroupName
        }
      })

      const result = await docClient.send(command)
      const files = result.Items || []

      return NextResponse.json({ 
        success: true, 
        files: files 
      })
    }

    if (action === 'getUserNotifications') {
      const { userId } = data
      
      // Get all notifications for the user
      const command = new ScanCommand({
        TableName: NOTIFICATIONS_TABLE,
        FilterExpression: 'userId = :userId AND #status = :status',
        ExpressionAttributeNames: {
          '#status': 'status'
        },
        ExpressionAttributeValues: {
          ':userId': userId,
          ':status': 'unread'
        }
      })

      const result = await docClient.send(command)
      const notifications = result.Items || []

      return NextResponse.json({ 
        success: true, 
        notifications: notifications 
      })
    }

    if (action === 'markNotificationRead') {
      const { notificationId } = data
      
      // Mark notification as read
      const command = new PutCommand({
        TableName: NOTIFICATIONS_TABLE,
        Item: {
          id: notificationId,
          status: 'read',
          updatedAt: new Date().toISOString()
        }
      })

      await docClient.send(command)

      return NextResponse.json({ 
        success: true, 
        message: 'Notification marked as read' 
      })
    }

    if (action === 'debugNotifications') {
      const { studyGroupName } = data
      
      // Debug function to check what's happening with notifications
      const debugInfo = await debugNotificationSystem(studyGroupName)
      
      return NextResponse.json({ 
        success: true, 
        debugInfo: debugInfo 
      })
    }

    if (action === 'getFileRecord') {
      const { fileId } = data
      
      // Get file record by ID
      const command = new GetCommand({
        TableName: FILES_TABLE,
        Key: { id: fileId }
      })

      const result = await docClient.send(command)
      
      if (result.Item) {
        return NextResponse.json({ 
          success: true, 
          fileRecord: result.Item 
        })
      } else {
        return NextResponse.json({ 
          success: false, 
          error: 'File not found' 
        }, { status: 404 })
      }
    }

    if (action === 'recordDownload') {
      const { fileId, userId, actualFilePath } = data
      
      // Get the original file record
      const getFileCommand = new GetCommand({
        TableName: FILES_TABLE,
        Key: { id: fileId }
      })

      const fileResult = await docClient.send(getFileCommand)
      
      if (!fileResult.Item) {
        return NextResponse.json({ 
          success: false, 
          error: 'File not found' 
        }, { status: 404 })
      }

      const originalFile = fileResult.Item
      
      // Use the actual file path if provided, otherwise create a predictable one
      const downloadedFilePath = actualFilePath || `~/Documents/DownloadedFiles/${originalFile.fileName}`
      
      // Create a new file record for the user's documents (downloaded copy)
      const downloadedFileRecord = {
        id: uuidv4(),
        fileName: originalFile.fileName,
        originalFileName: originalFile.originalFileName,
        filePath: downloadedFilePath, // Use the predictable local path
        studyGroupName: originalFile.studyGroupName,
        description: `Downloaded from ${originalFile.studyGroupName} - ${originalFile.description}`,
        dateCreated: originalFile.dateCreated,
        className: originalFile.className,
        fileSize: originalFile.fileSize,
        fileType: originalFile.fileType,
        uploadedBy: originalFile.uploadedBy, // Keep original uploader
        downloadedBy: userId, // Track who downloaded it
        uploadedAt: originalFile.uploadedAt,
        downloadedAt: new Date().toISOString(),
        downloadCount: 0,
        s3Uploaded: originalFile.s3Uploaded,
        isPersonal: false, // Downloaded files are not personal
        isDownloaded: true, // Mark as downloaded file
        originalFileId: fileId // Reference to original file
      }

      // Save the downloaded file record to .ai_helper system
      try {
        const aiHelperResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/ai-helper-files`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'saveFileRecord',
            data: downloadedFileRecord
          })
        })
        
        const aiHelperResult = await aiHelperResponse.json()
        
        if (!aiHelperResult.success) {
          console.error('Failed to save to .ai_helper system:', aiHelperResult.error)
        }
      } catch (error) {
        console.error('Error saving to .ai_helper system:', error)
      }

      // Also save the downloaded file record to DynamoDB for backward compatibility
      const putCommand = new PutCommand({
        TableName: FILES_TABLE,
        Item: downloadedFileRecord
      })

      await docClient.send(putCommand)

      // Update download count on original file
      const updateCommand = new UpdateCommand({
        TableName: FILES_TABLE,
        Key: { id: fileId },
        UpdateExpression: 'SET downloadCount = downloadCount + :one',
        ExpressionAttributeValues: {
          ':one': 1
        }
      })

      await docClient.send(updateCommand)

      return NextResponse.json({ 
        success: true, 
        message: 'Download recorded successfully',
        downloadedFile: downloadedFileRecord
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  } catch (error: any) {
    console.error('API Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

async function notifyStudyGroupMembers(fileRecord: any) {
  try {
    console.log('🔔 Notifying study group members for file:', fileRecord.fileName, 'in group:', fileRecord.studyGroupName)
    console.log('🔔 File record details:', JSON.stringify(fileRecord, null, 2))
    
    // Get study group members by scanning for the group name
    const scanCommand = new ScanCommand({
      TableName: STUDY_GROUPS_TABLE,
      FilterExpression: '#name = :groupName',
      ExpressionAttributeNames: {
        '#name': 'name'
      },
      ExpressionAttributeValues: {
        ':groupName': fileRecord.studyGroupName
      }
    })

    console.log('🔍 Scanning for group with name:', fileRecord.studyGroupName)
    const groupResult = await docClient.send(scanCommand)
    const groups = groupResult.Items || []
    
    console.log('🔍 Found groups:', groups.length, 'for name:', fileRecord.studyGroupName)
    console.log('🔍 All groups found:', JSON.stringify(groups, null, 2))
    
    if (groups.length === 0) {
      console.error('❌ Study group not found:', fileRecord.studyGroupName)
      return
    }
    
    const group = groups[0] // Take the first match
    console.log('👥 Selected group:', JSON.stringify(group, null, 2))
    console.log('👥 Group members:', group.members)
    console.log('👥 Uploader:', fileRecord.uploadedBy)

    if (!group || !group.members) {
      console.error('❌ Study group has no members:', fileRecord.studyGroupName)
      return
    }

    // Create notifications for all members except the uploader
    const membersToNotify = group.members.filter((member: string) => member !== fileRecord.uploadedBy)
    console.log('👥 Members to notify (excluding uploader):', membersToNotify)
    
    const notifications = membersToNotify.map((member: string) => ({
      id: uuidv4(),
      userId: member,
      type: 'new_file',
      title: 'New File Shared',
      message: `${fileRecord.uploadedBy} shared "${fileRecord.fileName}" in ${fileRecord.studyGroupName}`,
      fileId: fileRecord.id,
      studyGroupName: fileRecord.studyGroupName,
      status: 'unread',
      createdAt: new Date().toISOString()
    }))

    console.log('📬 Creating notifications for:', notifications.length, 'members')
    console.log('📬 Notification details:', JSON.stringify(notifications, null, 2))

    // Save all notifications
    for (const notification of notifications) {
      console.log('💾 Saving notification for user:', notification.userId)
      const putCommand = new PutCommand({
        TableName: NOTIFICATIONS_TABLE,
        Item: notification
      })
      await docClient.send(putCommand)
      console.log('✅ Created notification for user:', notification.userId)
    }

    console.log(`✅ Created ${notifications.length} notifications for study group members`)

  } catch (error: any) {
    console.error('❌ Error notifying study group members:', error)
    console.error('❌ Error details:', error.message)
    console.error('❌ Error stack:', error.stack)
  }
}

async function debugNotificationSystem(studyGroupName: string) {
  const debugInfo: any = {
    studyGroupName: studyGroupName,
    steps: []
  }
  
  try {
    debugInfo.steps.push('Starting debug for group: ' + studyGroupName)
    
    // Step 1: Check if group exists
    const scanCommand = new ScanCommand({
      TableName: STUDY_GROUPS_TABLE,
      FilterExpression: '#name = :groupName',
      ExpressionAttributeNames: {
        '#name': 'name'
      },
      ExpressionAttributeValues: {
        ':groupName': studyGroupName
      }
    })

    const groupResult = await docClient.send(scanCommand)
    const groups = groupResult.Items || []
    
    debugInfo.steps.push(`Found ${groups.length} groups with name: ${studyGroupName}`)
    debugInfo.groups = groups
    
    if (groups.length === 0) {
      debugInfo.error = 'No groups found'
      return debugInfo
    }
    
    const group = groups[0]
    debugInfo.selectedGroup = group
    debugInfo.steps.push(`Selected group with ${group.members?.length || 0} members: ${JSON.stringify(group.members)}`)
    
    // Step 2: Check notifications table
    const notificationScanCommand = new ScanCommand({
      TableName: NOTIFICATIONS_TABLE
    })
    
    const notificationResult = await docClient.send(notificationScanCommand)
    const allNotifications = notificationResult.Items || []
    
    debugInfo.steps.push(`Found ${allNotifications.length} total notifications in database`)
    debugInfo.allNotifications = allNotifications
    
    // Step 3: Check for notifications for this group
    const groupNotifications = allNotifications.filter(n => n.studyGroupName === studyGroupName)
    debugInfo.steps.push(`Found ${groupNotifications.length} notifications for this group`)
    debugInfo.groupNotifications = groupNotifications
    
    return debugInfo
    
  } catch (error: any) {
    debugInfo.error = error.message
    debugInfo.steps.push('Error: ' + error.message)
    return debugInfo
  }
}
