// AWS Study Groups Service
// This will handle all study group operations with AWS DynamoDB

import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, PutCommand, GetCommand, ScanCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb'
import { v4 as uuidv4 } from 'uuid'
import { hasRealAWSConfig, hasDynamoDBConfig, checkDynamoDBConfigFromBrowser } from './aws-config'

// Initialize DynamoDB client
let docClient: DynamoDBDocumentClient | null = null

const initializeDynamoDB = async () => {
  if (!docClient && hasDynamoDBConfig()) {
    try {
      // For client-side, we need to use the API routes instead of direct DynamoDB access
      // This is because we can't expose AWS credentials to the client
      console.log('Client-side DynamoDB access - using API routes instead')
      return null
    } catch (error) {
      console.error('Failed to initialize DynamoDB client:', error)
      return null
    }
  }
  return docClient
}

const TABLE_NAME = 'StudyGroups'
const INVITES_TABLE_NAME = 'StudyGroupInvites'

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

export interface Invite {
  id: string
  groupId: string
  groupName: string
  inviterId: string
  inviterName: string
  inviteeEmail: string
  status: 'pending' | 'accepted' | 'declined'
  createdAt: string
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

// Get all study groups (for browsing and invite functionality)
export async function getAllStudyGroups(): Promise<StudyGroup[]> {
  // Check DynamoDB config from browser
  const hasDynamoDB = await checkDynamoDBConfigFromBrowser()
  if (!hasDynamoDB) {
    console.log('Debug - No DynamoDB config, using localStorage')
    return devStudyGroups.getAllStudyGroups()
  }

  try {
    const response = await fetch('/api/study-groups', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'getAllGroups',
        data: {}
      })
    })

    if (!response.ok) {
      throw new Error('Failed to get all study groups')
    }

    const result = await response.json()
    const groups = result.groups as StudyGroup[] || []
    
    // Ensure all IDs are strings for consistency
    const normalizedGroups = groups.map(group => ({
      ...group,
      id: String(group.id)
    }))
    
    console.log('Debug - AWS DynamoDB getAllStudyGroups found:', normalizedGroups.length, 'groups')
    console.log('Debug - AWS DynamoDB group IDs:', normalizedGroups.map(g => ({ id: g.id, name: g.name })))
    
    return normalizedGroups
  } catch (error) {
    console.error('Error getting all study groups:', error)
    return devStudyGroups.getAllStudyGroups()
  }
}

// Get public study groups (for browsing)
export async function getPublicStudyGroups(): Promise<StudyGroup[]> {
  if (!hasDynamoDBConfig()) {
    return devStudyGroups.getPublicStudyGroups()
  }

  const client = await initializeDynamoDB()
  if (!client) {
    return devStudyGroups.getPublicStudyGroups()
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
    const groups = result.Items as StudyGroup[] || []
    
    // Ensure all IDs are strings for consistency
    const normalizedGroups = groups.map(group => ({
      ...group,
      id: String(group.id)
    }))
    
    return normalizedGroups
  } catch (error) {
    console.error('Error getting public study groups:', error)
    return devStudyGroups.getPublicStudyGroups()
  }
}

// Join a study group
export async function joinStudyGroup(groupId: string, userId: string): Promise<StudyGroup> {
  const hasDynamoDB = await checkDynamoDBConfigFromBrowser()
  
  if (!hasDynamoDB) {
    return devStudyGroups.joinStudyGroup(groupId, userId)
  }

  try {
    const response = await fetch('/api/study-groups', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'joinGroup',
        data: { groupId, userId }
      })
    })

    if (!response.ok) {
      throw new Error('Failed to join study group')
    }

    const result = await response.json()
    return result.group
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
    console.log('Debug - All groups in localStorage:', allGroups)
    console.log('Debug - Groups with isPublic filter:', allGroups.filter((group: StudyGroup) => group.isPublic === true))
    
    // Return all groups, not just public ones, for invite functionality
    return allGroups
  },

  getPublicStudyGroups: async (): Promise<StudyGroup[]> => {
    if (typeof window === 'undefined') return []
    
    const allGroups = JSON.parse(localStorage.getItem('dev-study-groups') || '[]')
    return allGroups.filter((group: StudyGroup) => group.isPublic === true)
  },

  joinStudyGroup: async (groupId: string, userId: string): Promise<StudyGroup> => {
    if (typeof window === 'undefined') throw new Error('Not in browser environment')
    
    const allGroups = JSON.parse(localStorage.getItem('dev-study-groups') || '[]')
    
    // Try exact match first
    let groupIndex = allGroups.findIndex((group: StudyGroup) => group.id === groupId)
    
    // If not found, try string comparison
    if (groupIndex === -1) {
      groupIndex = allGroups.findIndex((group: StudyGroup) => String(group.id) === String(groupId))
    }
    
    if (groupIndex === -1) {
      console.error('Group not found. Looking for:', groupId, 'Type:', typeof groupId)
      console.error('Available groups:', allGroups.map(g => ({ id: g.id, type: typeof g.id })))
      throw new Error(`Group not found with ID: ${groupId}`)
    }
    
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

// Invite storage functions for dev mode
export const devInvites = {
  sendInvite: async (invite: Invite): Promise<Invite> => {
    if (typeof window === 'undefined') throw new Error('Not in browser environment')
    
    // Get existing invites
    const existingInvites = JSON.parse(localStorage.getItem('dev-invites') || '[]')
    
    // Add new invite
    existingInvites.push(invite)
    
    // Save back to localStorage
    localStorage.setItem('dev-invites', JSON.stringify(existingInvites))
    
    return invite
  },

  getInvitesForEmail: async (email: string): Promise<Invite[]> => {
    if (typeof window === 'undefined') throw new Error('Not in browser environment')
    
    const allInvites = JSON.parse(localStorage.getItem('dev-invites') || '[]')
    return allInvites.filter((invite: Invite) => invite.inviteeEmail === email && invite.status === 'pending')
  },

  getAllInvites: async (): Promise<Invite[]> => {
    if (typeof window === 'undefined') throw new Error('Not in browser environment')
    
    return JSON.parse(localStorage.getItem('dev-invites') || '[]')
  },

  respondToInvite: async (inviteId: string, response: 'accept' | 'decline'): Promise<void> => {
    if (typeof window === 'undefined') throw new Error('Not in browser environment')
    
    const allInvites = JSON.parse(localStorage.getItem('dev-invites') || '[]')
    const inviteIndex = allInvites.findIndex((invite: Invite) => invite.id === inviteId)
    
    if (inviteIndex !== -1) {
      allInvites[inviteIndex].status = response
      localStorage.setItem('dev-invites', JSON.stringify(allInvites))
    }
  },

  deleteInvite: async (inviteId: string): Promise<void> => {
    if (typeof window === 'undefined') throw new Error('Not in browser environment')
    
    const allInvites = JSON.parse(localStorage.getItem('dev-invites') || '[]')
    const filteredInvites = allInvites.filter((invite: Invite) => invite.id !== inviteId)
    
    localStorage.setItem('dev-invites', JSON.stringify(filteredInvites))
  },

  cleanupOutdatedInvites: async (): Promise<number> => {
    if (typeof window === 'undefined') throw new Error('Not in browser environment')
    
    const allInvites = JSON.parse(localStorage.getItem('dev-invites') || '[]')
    const allGroups = JSON.parse(localStorage.getItem('dev-study-groups') || '[]')
    const groupIds = allGroups.map((g: StudyGroup) => String(g.id))
    
    const validInvites = allInvites.filter((invite: Invite) => {
      return groupIds.includes(String(invite.groupId))
    })
    
    const removedCount = allInvites.length - validInvites.length
    
    if (removedCount > 0) {
      localStorage.setItem('dev-invites', JSON.stringify(validInvites))
      console.log(`Cleaned up ${removedCount} outdated invites`)
    }
    
    return removedCount
  }
}

// AWS Invite Functions
export async function sendInvite(invite: Invite): Promise<Invite> {
  const hasDynamoDB = await checkDynamoDBConfigFromBrowser()
  if (!hasDynamoDB) {
    return devInvites.sendInvite(invite)
  }

  try {
    const response = await fetch('/api/study-groups', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'sendInvite',
        data: {
          groupId: invite.groupId,
          inviterId: invite.inviterId,
          inviteeEmail: invite.inviteeEmail
        }
      })
    })

    if (!response.ok) {
      throw new Error('Failed to send invite')
    }

    const result = await response.json()
    return result.invite
  } catch (error) {
    console.error('Error sending invite:', error)
    return devInvites.sendInvite(invite)
  }
}

export async function getInvitesForEmail(email: string): Promise<Invite[]> {
  const hasDynamoDB = await checkDynamoDBConfigFromBrowser()
  if (!hasDynamoDB) {
    return devInvites.getInvitesForEmail(email)
  }

  try {
    const response = await fetch('/api/study-groups', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'getUserInvites',
        data: { userId: email }
      })
    })

    if (!response.ok) {
      throw new Error('Failed to get invites')
    }

    const result = await response.json()
    return result.invites || []
  } catch (error) {
    console.error('Error getting invites:', error)
    return devInvites.getInvitesForEmail(email)
  }
}

export async function getAllInvites(): Promise<Invite[]> {
  const hasDynamoDB = await checkDynamoDBConfigFromBrowser()
  if (!hasDynamoDB) {
    return devInvites.getAllInvites()
  }

  try {
    const response = await fetch('/api/study-groups', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'getAllInvites',
        data: {}
      })
    })

    if (!response.ok) {
      throw new Error('Failed to get all invites')
    }

    const result = await response.json()
    return result.invites || []
  } catch (error) {
    console.error('Error getting all invites:', error)
    return devInvites.getAllInvites()
  }
}

export async function respondToInvite(inviteId: string, response: 'accept' | 'decline', userId: string): Promise<void> {
  const hasDynamoDB = await checkDynamoDBConfigFromBrowser()
  
  if (!hasDynamoDB) {
    return devInvites.respondToInvite(inviteId, response)
  }

  try {
    const apiResponse = await fetch('/api/study-groups', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'respondToInvite',
        data: { inviteId, userId, response }
      })
    })

    if (!apiResponse.ok) {
      throw new Error('Failed to respond to invite')
    }
  } catch (error) {
    console.error('Error responding to invite:', error)
    return devInvites.respondToInvite(inviteId, response)
  }
}

export async function deleteInvite(inviteId: string): Promise<void> {
  const hasDynamoDB = await checkDynamoDBConfigFromBrowser()
  if (!hasDynamoDB) {
    return devInvites.deleteInvite(inviteId)
  }

  try {
    // For now, we'll fall back to dev mode since we don't have a delete API endpoint
    console.log('Delete invite not implemented for AWS mode, falling back to dev mode')
    return devInvites.deleteInvite(inviteId)
  } catch (error) {
    console.error('Error deleting invite:', error)
    return devInvites.deleteInvite(inviteId)
  }
}
