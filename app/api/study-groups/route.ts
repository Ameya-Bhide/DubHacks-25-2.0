import { NextRequest, NextResponse } from 'next/server'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, PutCommand, GetCommand, ScanCommand, UpdateCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb'
import { v4 as uuidv4 } from 'uuid'

// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic'

// Initialize DynamoDB client on server side
const client = new DynamoDBClient({
  region: process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

const docClient = DynamoDBDocumentClient.from(client)
const TABLE_NAME = 'StudyGroups'
const INVITES_TABLE_NAME = 'StudyGroupInvites'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, data } = body

    if (action === 'create') {
      const { groupData, createdBy } = data
      
      const newGroup = {
        id: uuidv4(),
        ...groupData,
        memberCount: 1,
        members: [createdBy],
        createdBy,
        createdAt: new Date().toISOString(),
        isActive: true
      }

      const command = new PutCommand({
        TableName: TABLE_NAME,
        Item: newGroup,
        ConditionExpression: 'attribute_not_exists(id)'
      })

      await docClient.send(command)
      return NextResponse.json({ success: true, group: newGroup })
    }

    if (action === 'getUserGroups') {
      const { userId } = data
      
      const command = new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression: 'contains(members, :userId)',
        ExpressionAttributeValues: {
          ':userId': userId
        }
      })

      const result = await docClient.send(command)
      return NextResponse.json({ success: true, groups: result.Items || [] })
    }

    if (action === 'getGroup') {
      const { groupId, userId } = data
      
      const command = new GetCommand({
        TableName: TABLE_NAME,
        Key: { id: groupId }
      })

      const result = await docClient.send(command)
      const group = result.Item

      // Check if user is a member of the group
      if (!group || !group.members || !group.members.includes(userId)) {
        return NextResponse.json({ 
          success: false, 
          error: 'Access denied: You are not a member of this study group' 
        }, { status: 403 })
      }

      return NextResponse.json({ success: true, group })
    }

    if (action === 'leaveGroup') {
      const { groupId, userId } = data
      
      // First, get the current group to check member count
      const getCommand = new GetCommand({
        TableName: TABLE_NAME,
        Key: { id: groupId }
      })
      
      const getResult = await docClient.send(getCommand)
      const group = getResult.Item
      
      if (!group || !group.members || !group.members.includes(userId)) {
        return NextResponse.json({ 
          success: false, 
          error: 'User is not a member of this group' 
        }, { status: 403 })
      }
      
      // If this is the last member, delete the group
      if (group.memberCount === 1) {
        const deleteCommand = new DeleteCommand({
          TableName: TABLE_NAME,
          Key: { id: groupId }
        })
        
        await docClient.send(deleteCommand)
        return NextResponse.json({ 
          success: true, 
          group: null, 
          deleted: true,
          message: 'Group deleted as last member left'
        })
      }
      
      // Otherwise, remove the user from the group
      const updateCommand = new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { id: groupId },
        UpdateExpression: 'SET members = list_remove(members, :index), memberCount = memberCount - :one',
        ConditionExpression: 'contains(members, :userId)',
        ExpressionAttributeValues: {
          ':userId': userId,
          ':index': group.members.indexOf(userId), // Get the index of the user in the list
          ':one': 1
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
        Item: invite,
        ConditionExpression: 'attribute_not_exists(id)'
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

    if (action === 'respondToInvite') {
      const { inviteId, userId, response } = data // response: 'accept' or 'decline'
      
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
        
        // Add user to group
        const updateGroupCommand = new UpdateCommand({
          TableName: TABLE_NAME,
          Key: { id: invite.groupId },
          UpdateExpression: 'SET members = list_append(members, :userId), memberCount = memberCount + :one',
          ConditionExpression: 'memberCount < maxMembers',
          ExpressionAttributeValues: {
            ':userId': [userId], // Use array for list_append operation
            ':one': 1
          },
          ReturnValues: 'ALL_NEW'
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
          ':status': response === 'accept' ? 'accepted' : 'declined',
          ':respondedAt': new Date().toISOString()
        }
      })
      
      await docClient.send(updateInviteCommand)
      
      return NextResponse.json({ 
        success: true, 
        message: `Invite ${response}ed successfully` 
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error: any) {
    console.error('API Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
