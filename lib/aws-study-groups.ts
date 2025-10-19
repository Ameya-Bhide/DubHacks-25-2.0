// AWS Study Groups Service
// This will handle all study group operations with AWS DynamoDB

import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, PutCommand, GetCommand, ScanCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb'
import { v4 as uuidv4 } from 'uuid'
import { hasRealAWSConfig } from './aws-config'

// Initialize DynamoDB client
let docClient: DynamoDBDocumentClient | null = null

const initializeDynamoDB = async () => {
  if (!docClient && hasRealAWSConfig()) {
    try {
      // For now, use a simple approach that works with your current setup
      // This will use the default credential chain (which includes your .env.local)
      const client = new DynamoDBClient({
        region: process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1',
        // Let AWS SDK use default credential chain
      })
      docClient = DynamoDBDocumentClient.from(client)
    } catch (error) {
      console.error('Failed to initialize DynamoDB client:', error)
      return null
    }
  }
  return docClient
}

const TABLE_NAME = 'StudyGroups'

export interface Meeting {
  id: string
  title: string
  description: string
  date: string
  time: string
  duration: number
  location: string
  meetingType: 'in-person' | 'online'
  groupId: string
  groupName: string
  createdBy: string
  createdAt: string
  attendees: string[]
}

export interface StudyGroup {
  id: string
  name: string
  description: string
  subject: string
  university: string
  className: string
  maxMembers: number
  memberCount: number
  members: string[]
  createdBy: string
  createdAt: string
  isActive: boolean
  isPublic: boolean
  meetings?: Meeting[]
}

export interface CreateGroupData {
  name: string
  description: string
  subject: string
  university: string
  className: string
  maxMembers: number
  isPublic: boolean
}

// Create a new study group
export async function createStudyGroup(groupData: CreateGroupData, createdBy: string): Promise<StudyGroup> {
  // Check if we have real AWS config
  if (!hasRealAWSConfig()) {
    console.log('AWS not configured, using dev mode')
    return devStudyGroups.createStudyGroup(groupData, createdBy)
  }

  try {
    const response = await fetch('/api/study-groups', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'create',
        data: { groupData, createdBy }
      })
    })

    if (!response.ok) {
      throw new Error('Failed to create study group')
    }

    const result = await response.json()
    return result.group
  } catch (error) {
    console.error('Error creating study group:', error)
    console.log('Falling back to dev mode')
    return devStudyGroups.createStudyGroup(groupData, createdBy)
  }
}

// Get a study group by ID
export async function getStudyGroup(groupId: string, userId: string): Promise<StudyGroup | null> {
  if (!hasRealAWSConfig()) {
    return devStudyGroups.getStudyGroup(groupId)
  }

  try {
    const response = await fetch('/api/study-groups', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'getGroup',
        data: { groupId, userId }
      })
    })

    if (!response.ok) {
      if (response.status === 403) {
        throw new Error('Access denied: You are not a member of this study group')
      }
      throw new Error('Failed to get study group')
    }

    const result = await response.json()
    return result.group
  } catch (error) {
    console.error('Error getting study group:', error)
    console.log('Falling back to dev mode')
    return devStudyGroups.getStudyGroup(groupId)
  }
}

// Get all study groups for a user
export async function getUserStudyGroups(userId: string): Promise<StudyGroup[]> {
  if (!hasRealAWSConfig()) {
    return devStudyGroups.getUserStudyGroups(userId)
  }

  try {
    const response = await fetch('/api/study-groups', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'getUserGroups',
        data: { userId }
      })
    })

    if (!response.ok) {
      throw new Error('Failed to get user study groups')
    }

    const result = await response.json()
    return result.groups
  } catch (error) {
    console.error('Error getting user study groups:', error)
    return devStudyGroups.getUserStudyGroups(userId)
  }
}

// Get all study groups (for browsing)
export async function getAllStudyGroups(): Promise<StudyGroup[]> {
  if (!hasRealAWSConfig()) {
    return devStudyGroups.getAllStudyGroups()
  }

  const client = await initializeDynamoDB()
  if (!client) {
    return devStudyGroups.getAllStudyGroups()
  }

  try {
    const command = new ScanCommand({
      TableName: TABLE_NAME,
      FilterExpression: 'isActive = :active AND isPublic = :public',
      ExpressionAttributeValues: {
        ':active': true,
        ':public': true
      }
    })

    const result = await client.send(command)
    return result.Items as StudyGroup[] || []
  } catch (error) {
    console.error('Error getting all study groups:', error)
    return devStudyGroups.getAllStudyGroups()
  }
}

// Join a study group
export async function joinStudyGroup(groupId: string, userId: string): Promise<StudyGroup> {
  if (!hasRealAWSConfig()) {
    return devStudyGroups.joinStudyGroup(groupId, userId)
  }

  const client = await initializeDynamoDB()
  if (!client) {
    return devStudyGroups.joinStudyGroup(groupId, userId)
  }

  try {
    const command = new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { id: groupId },
      UpdateExpression: 'ADD members :userId, memberCount :one',
      ConditionExpression: 'memberCount < maxMembers AND NOT contains(members, :userId)',
      ExpressionAttributeValues: {
        ':userId': userId,
        ':one': 1
      },
      ReturnValues: 'ALL_NEW'
    })

    const result = await client.send(command)
    return result.Attributes as StudyGroup
  } catch (error) {
    console.error('Error joining study group:', error)
    return devStudyGroups.joinStudyGroup(groupId, userId)
  }
}

// Leave a study group
export async function leaveStudyGroup(groupId: string, userId: string): Promise<{ group: StudyGroup | null; deleted: boolean }> {
  if (!hasRealAWSConfig()) {
    const group = await devStudyGroups.leaveStudyGroup(groupId, userId)
    return { group, deleted: false }
  }

  try {
    const response = await fetch('/api/study-groups', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'leaveGroup',
        data: { groupId, userId }
      })
    })

    if (!response.ok) {
      if (response.status === 403) {
        throw new Error('You are not a member of this study group')
      }
      throw new Error('Failed to leave study group')
    }

    const result = await response.json()
    return { group: result.group, deleted: result.deleted }
  } catch (error) {
    console.error('Error leaving study group:', error)
    console.log('Falling back to dev mode')
    const group = await devStudyGroups.leaveStudyGroup(groupId, userId)
    return { group, deleted: false }
  }
}

// Development mode functions (when AWS is not configured)
export const devStudyGroups = {
  createStudyGroup: async (groupData: CreateGroupData, createdBy: string): Promise<StudyGroup> => {
    const group: StudyGroup = {
      id: `dev_group_${Date.now()}`,
      ...groupData,
      memberCount: 1,
      members: [createdBy],
      createdBy,
      createdAt: new Date().toISOString(),
      isActive: true,
      isPublic: groupData.isPublic || false
    }
    
    // Store in localStorage for development
    if (typeof window !== 'undefined') {
      const existingGroups = JSON.parse(localStorage.getItem('dev-study-groups') || '[]')
      existingGroups.push(group)
      localStorage.setItem('dev-study-groups', JSON.stringify(existingGroups))
    }
    
    return group
  },

  getStudyGroup: async (groupId: string): Promise<StudyGroup | null> => {
    if (typeof window === 'undefined') return null
    
    const allGroups = JSON.parse(localStorage.getItem('dev-study-groups') || '[]')
    return allGroups.find((group: StudyGroup) => group.id === groupId) || null
  },

  getUserStudyGroups: async (userId: string): Promise<StudyGroup[]> => {
    if (typeof window === 'undefined') return []
    
    const allGroups = JSON.parse(localStorage.getItem('dev-study-groups') || '[]')
    return allGroups.filter((group: StudyGroup) => group.members.includes(userId))
  },

  getAllStudyGroups: async (): Promise<StudyGroup[]> => {
    if (typeof window === 'undefined') return []
    
    const allGroups = JSON.parse(localStorage.getItem('dev-study-groups') || '[]')
    return allGroups.filter((group: StudyGroup) => group.isPublic === true)
  },

  joinStudyGroup: async (groupId: string, userId: string): Promise<StudyGroup> => {
    if (typeof window === 'undefined') throw new Error('Not in browser environment')
    
    const allGroups = JSON.parse(localStorage.getItem('dev-study-groups') || '[]')
    const groupIndex = allGroups.findIndex((group: StudyGroup) => group.id === groupId)
    
    if (groupIndex === -1) throw new Error('Group not found')
    
    const group = allGroups[groupIndex]
    if (group.members.includes(userId)) throw new Error('Already a member')
    if (group.memberCount >= group.maxMembers) throw new Error('Group is full')
    
    group.members.push(userId)
    group.memberCount += 1
    
    allGroups[groupIndex] = group
    localStorage.setItem('dev-study-groups', JSON.stringify(allGroups))
    
    return group
  },

  leaveStudyGroup: async (groupId: string, userId: string): Promise<StudyGroup> => {
    if (typeof window === 'undefined') throw new Error('Not in browser environment')
    
    const allGroups = JSON.parse(localStorage.getItem('dev-study-groups') || '[]')
    const groupIndex = allGroups.findIndex((group: StudyGroup) => group.id === groupId)
    
    if (groupIndex === -1) throw new Error('Group not found')
    
    const group = allGroups[groupIndex]
    if (!group.members.includes(userId)) throw new Error('Not a member')
    
    group.members = group.members.filter((member: string) => member !== userId)
    group.memberCount -= 1
    
    allGroups[groupIndex] = group
    localStorage.setItem('dev-study-groups', JSON.stringify(allGroups))
    
    return group
  }
}

// Meeting storage functions for dev mode
export const devMeetings = {
  saveMeeting: async (meeting: Meeting): Promise<Meeting> => {
    if (typeof window === 'undefined') throw new Error('Not in browser environment')
    
    // Get existing meetings
    const existingMeetings = JSON.parse(localStorage.getItem('dev-meetings') || '[]')
    
    // Add new meeting
    existingMeetings.push(meeting)
    
    // Save back to localStorage
    localStorage.setItem('dev-meetings', JSON.stringify(existingMeetings))
    
    return meeting
  },

  getMeetingsForGroup: async (groupId: string): Promise<Meeting[]> => {
    if (typeof window === 'undefined') throw new Error('Not in browser environment')
    
    const allMeetings = JSON.parse(localStorage.getItem('dev-meetings') || '[]')
    return allMeetings.filter((meeting: Meeting) => meeting.groupId === groupId)
  },

  getAllMeetings: async (): Promise<Meeting[]> => {
    if (typeof window === 'undefined') throw new Error('Not in browser environment')
    
    return JSON.parse(localStorage.getItem('dev-meetings') || '[]')
  },

  deleteMeeting: async (meetingId: string): Promise<void> => {
    if (typeof window === 'undefined') throw new Error('Not in browser environment')
    
    const allMeetings = JSON.parse(localStorage.getItem('dev-meetings') || '[]')
    const filteredMeetings = allMeetings.filter((meeting: Meeting) => meeting.id !== meetingId)
    
    localStorage.setItem('dev-meetings', JSON.stringify(filteredMeetings))
  }
}
