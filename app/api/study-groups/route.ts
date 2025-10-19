import { NextRequest, NextResponse } from 'next/server'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand, ScanCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb'
import { v4 as uuidv4 } from 'uuid'

const TABLE_NAME = 'StudyGroups'
const INVITES_TABLE_NAME = 'StudyGroupInvites'

// Initialize DynamoDB client
const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

const docClient = DynamoDBDocumentClient.from(client)

export async function POST(request: NextRequest) {
  try {
    const { action, data } = await request.json()

    if (action === 'createGroup') {
      const { name, description, className, subject, university, maxMembers, isPublic, createdBy } = data
      
      const group = {
        id: Date.now().toString(),
        name,
        description,
        className,
        subject,
        university,
        maxMembers: maxMembers || 20,
        isPublic: isPublic !== false,
        createdBy,
        members: [createdBy],
        memberCount: 1,
        isActive: true,
        createdAt: new Date().toISOString()
      }
      
      const command = new PutCommand({
        TableName: TABLE_NAME,
        Item: group
      })
      
      await docClient.send(command)
      return NextResponse.json({ success: true, group })
    }

    if (action === 'getUserGroups') {
      const { userId } = data
      
      const command = new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression: 'contains(members, :userId) AND isActive = :active',
        ExpressionAttributeValues: {
          ':userId': userId,
          ':active': true
        }
      })
      
      const result = await docClient.send(command)
      return NextResponse.json({ success: true, groups: result.Items || [] })
    }

    if (action === 'getAllGroups') {
      const command = new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression: 'isActive = :active',
        ExpressionAttributeValues: { ':active': true }
      })
      
      const result = await docClient.send(command)
      return NextResponse.json({ success: true, groups: result.Items || [] })
    }

    if (action === 'joinGroup') {
      const { groupId, userId } = data
      
      // Get the current group
      const getCommand = new GetCommand({
        TableName: TABLE_NAME,
        Key: { id: groupId }
      })
      
      const getResult = await docClient.send(getCommand)
      const group = getResult.Item
      
      if (!group) {
        return NextResponse.json({ 
          success: false, 
          error: 'Group not found' 
        }, { status: 404 })
      }
      
      if (group.memberCount >= group.maxMembers) {
        return NextResponse.json({ 
          success: false, 
          error: 'Group is full' 
        }, { status: 400 })
      }
      
      if (group.members.includes(userId)) {
        return NextResponse.json({ 
          success: false, 
          error: 'You are already a member of this group' 
        }, { status: 400 })
      }
      
      // Add user to members list and increment member count
      const updatedMembers = [...group.members, userId]
      
      const updateCommand = new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { id: groupId },
        UpdateExpression: 'SET members = :members, memberCount = :memberCount',
        ExpressionAttributeValues: {
          ':members': updatedMembers,
          ':memberCount': group.memberCount + 1
        },
        ReturnValues: 'ALL_NEW'
      })
      
      const result = await docClient.send(updateCommand)
      const updatedGroup = result.Attributes
      
      return NextResponse.json({ success: true, group: updatedGroup })
    }

    if (action === 'leaveGroup') {
      const { groupId, userId } = data
      
      // Get the current group
      const getCommand = new GetCommand({
        TableName: TABLE_NAME,
        Key: { id: groupId }
      })
      
      const getResult = await docClient.send(getCommand)
      const group = getResult.Item
      
      if (!group) {
        return NextResponse.json({ 
          success: false, 
          error: 'Group not found' 
        }, { status: 404 })
      }
      
      if (!group.members.includes(userId)) {
        return NextResponse.json({ 
          success: false, 
          error: 'You are not a member of this group' 
        }, { status: 400 })
      }
      
      // Remove user from members list and decrement member count
      const updatedMembers = group.members.filter((member: string) => member !== userId)
      const newMemberCount = group.memberCount - 1
      
      // If no members left, mark group as inactive
      if (newMemberCount === 0) {
        const updateCommand = new UpdateCommand({
          TableName: TABLE_NAME,
          Key: { id: groupId },
          UpdateExpression: 'SET isActive = :inactive, memberCount = :zero',
          ExpressionAttributeValues: {
            ':inactive': false,
            ':zero': 0
          },
          ReturnValues: 'ALL_NEW'
        })
        
        const result = await docClient.send(updateCommand)
        return NextResponse.json({ 
          success: true, 
          group: result.Attributes,
          deleted: true
        })
      } else {
        const updateCommand = new UpdateCommand({
          TableName: TABLE_NAME,
          Key: { id: groupId },
          UpdateExpression: 'SET members = :members, memberCount = :memberCount',
          ExpressionAttributeValues: {
            ':members': updatedMembers,
            ':memberCount': newMemberCount
          },
          ReturnValues: 'ALL_NEW'
        })
        
        const result = await docClient.send(updateCommand)
        return NextResponse.json({ 
          success: true, 
          group: result.Attributes,
          deleted: false
        })
      }
    }

    if (action === 'sendInvite') {
      const { groupId, inviterId, inviteeEmail } = data
      
      // First, verify the inviter is a member of the group
      const getGroupCommand = new GetCommand({
        TableName: TABLE_NAME,
        Key: { id: groupId }
      })
      
      const groupResult = await docClient.send(getGroupCommand)
      const group = groupResult.Item
      
      if (!group || !group.members || !group.members.includes(inviterId)) {
        return NextResponse.json({ 
          success: false, 
          error: 'You are not a member of this group' 
        }, { status: 403 })
      }
      
      // Check if group is full
      if (group.memberCount >= group.maxMembers) {
        return NextResponse.json({ 
          success: false, 
          error: 'This group is full' 
        }, { status: 400 })
      }
      
      // Check if user is already a member
      if (group.members.includes(inviteeEmail)) {
        return NextResponse.json({ 
          success: false, 
          error: 'User is already a member of this group' 
        }, { status: 400 })
      }
      
      // Create invite
      const invite = {
        id: uuidv4(),
        groupId,
        groupName: group.name,
        inviterId,
        inviteeEmail,
        status: 'pending',
        createdAt: new Date().toISOString()
      }
      
      const inviteCommand = new PutCommand({
        TableName: INVITES_TABLE_NAME,
        Item: invite
      })
      
      await docClient.send(inviteCommand)
      return NextResponse.json({ success: true, invite })
    }

    if (action === 'getUserInvites') {
      const { userId } = data
      
      const command = new ScanCommand({
        TableName: INVITES_TABLE_NAME,
        FilterExpression: 'inviteeEmail = :userId AND #status = :status',
        ExpressionAttributeNames: {
          '#status': 'status'
        },
        ExpressionAttributeValues: {
          ':userId': userId,
          ':status': 'pending'
        }
      })
      
      const result = await docClient.send(command)
      return NextResponse.json({ success: true, invites: result.Items || [] })
    }

    if (action === 'getAllInvites') {
      const command = new ScanCommand({
        TableName: INVITES_TABLE_NAME
      })
      
      const result = await docClient.send(command)
      return NextResponse.json({ success: true, invites: result.Items || [] })
    }

    if (action === 'respondToInvite') {
      const { inviteId, userId, response } = data
      
      // Get the invite
      const getInviteCommand = new GetCommand({
        TableName: INVITES_TABLE_NAME,
        Key: { id: inviteId }
      })
      
      const inviteResult = await docClient.send(getInviteCommand)
      const invite = inviteResult.Item
      
      if (!invite || invite.inviteeEmail !== userId) {
        return NextResponse.json({ 
          success: false, 
          error: 'Invite not found or access denied' 
        }, { status: 403 })
      }
      
      if (invite.status !== 'pending') {
        return NextResponse.json({ 
          success: false, 
          error: 'This invite has already been responded to' 
        }, { status: 400 })
      }
      
      if (response === 'accept') {
        // Get the group to check if it's still not full
        const getGroupCommand = new GetCommand({
          TableName: TABLE_NAME,
          Key: { id: invite.groupId }
        })
        
        const groupResult = await docClient.send(getGroupCommand)
        const group = groupResult.Item
        
        if (!group) {
          return NextResponse.json({ 
            success: false, 
            error: 'Group no longer exists' 
          }, { status: 400 })
        }
        
        if (group.memberCount >= group.maxMembers) {
          return NextResponse.json({ 
            success: false, 
            error: 'Group is now full' 
          }, { status: 400 })
        }
        
        // Add user to group - use simple array operations
        const updatedMembers = [...group.members, userId]
        const updateGroupCommand = new UpdateCommand({
          TableName: TABLE_NAME,
          Key: { id: invite.groupId },
          UpdateExpression: 'SET members = :members, memberCount = :memberCount',
          ExpressionAttributeValues: {
            ':members': updatedMembers,
            ':memberCount': group.memberCount + 1
          }
        })
        
        await docClient.send(updateGroupCommand)
      }
      
      // Update invite status
      const updateInviteCommand = new UpdateCommand({
        TableName: INVITES_TABLE_NAME,
        Key: { id: inviteId },
        UpdateExpression: 'SET #status = :status, respondedAt = :respondedAt',
        ExpressionAttributeNames: {
          '#status': 'status'
        },
        ExpressionAttributeValues: {
          ':status': response,
          ':respondedAt': new Date().toISOString()
        }
      })
      
      await docClient.send(updateInviteCommand)
      return NextResponse.json({ success: true, message: `Invite ${response}ed successfully` })
    }

    if (action === 'deleteInvite') {
      const { inviteId } = data
      
      const command = new DeleteCommand({
        TableName: INVITES_TABLE_NAME,
        Key: { id: inviteId }
      })
      
      await docClient.send(command)
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 })

  } catch (error: any) {
    console.error('API Error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Internal server error' 
    }, { status: 500 })
  }
}