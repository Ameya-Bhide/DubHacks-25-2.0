import { NextRequest, NextResponse } from 'next/server'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, PutCommand, GetCommand, ScanCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb'
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

    if (action === 'leaveGroup') {
      const { groupId, userId } = data
      
      const command = new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { id: groupId },
        UpdateExpression: 'REMOVE members :userId SET memberCount = memberCount - :one',
        ConditionExpression: 'contains(members, :userId)',
        ExpressionAttributeValues: {
          ':userId': userId,
          ':one': 1
        },
        ReturnValues: 'ALL_NEW'
      })

      const result = await docClient.send(command)
      return NextResponse.json({ success: true, group: result.Attributes })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error: any) {
    console.error('API Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
