import { checkDynamoDBConfigFromBrowser, isElectron } from '@/lib/aws-config'

export interface StudyGroup {
  id: string
  name: string
  description: string
  className: string
  subject: string
  university: string
  maxMembers: number
  isPublic: boolean
  createdBy: string
  members: string[]
  memberCount: number
  isActive: boolean
  createdAt: string
}

export interface Invite {
  id: string
  groupId: string
  groupName: string
  inviterId: string
  inviteeEmail: string
  status: 'pending' | 'accepted' | 'declined'
  createdAt: string
  respondedAt?: string
}

export interface Meeting {
  id: string
  groupId: string
  title: string
  description: string
  date: string
  time: string
  duration: number
  location: string
  meetingType: 'in-person' | 'online'
  createdBy: string
  createdAt: string
}

// Simple API call wrapper
async function apiCall(action: string, data: any) {
  const response = await fetch('/api/study-groups', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, data })
  })
  
  if (!response.ok) {
    throw new Error(`API call failed: ${response.status}`)
  }
  
  return response.json()
}

// Study Group Functions
export async function createStudyGroup(groupData: Omit<StudyGroup, 'id' | 'members' | 'memberCount' | 'isActive' | 'createdAt'>): Promise<StudyGroup> {
  // Always use API routes (works in both browser and Electron)
  const hasDynamoDB = await checkDynamoDBConfigFromBrowser()
  
  if (!hasDynamoDB) {
    throw new Error('AWS DynamoDB not configured. Please configure AWS credentials.')
  }
  
  const result = await apiCall('createGroup', groupData)
  return result.group
}

export async function getUserStudyGroups(userId: string): Promise<StudyGroup[]> {
  // Always use API routes (works in both browser and Electron)
  const hasDynamoDB = await checkDynamoDBConfigFromBrowser()
  
  if (!hasDynamoDB) {
    throw new Error('AWS DynamoDB not configured. Please configure AWS credentials.')
  }
  
  const result = await apiCall('getUserGroups', { userId })
  return result.groups
}

export async function getAllStudyGroups(): Promise<StudyGroup[]> {
  // Always use API routes (works in both browser and Electron)
  const hasDynamoDB = await checkDynamoDBConfigFromBrowser()
  
  if (!hasDynamoDB) {
    throw new Error('AWS DynamoDB not configured. Please configure AWS credentials.')
  }
  
  const result = await apiCall('getAllGroups', {})
  return result.groups
}

export async function joinStudyGroup(groupId: string, userId: string): Promise<StudyGroup> {
  // Always use API routes (works in both browser and Electron)
  const hasDynamoDB = await checkDynamoDBConfigFromBrowser()
  
  if (!hasDynamoDB) {
    throw new Error('AWS DynamoDB not configured. Please configure AWS credentials.')
  }
  
  const result = await apiCall('joinGroup', { groupId, userId })
  return result.group
}

export async function leaveStudyGroup(groupId: string, userId: string): Promise<{ group: StudyGroup | null; deleted: boolean }> {
  // Always use API routes (works in both browser and Electron)
  const hasDynamoDB = await checkDynamoDBConfigFromBrowser()
  
  if (!hasDynamoDB) {
    throw new Error('AWS DynamoDB not configured. Please configure AWS credentials.')
  }
  
  const result = await apiCall('leaveGroup', { groupId, userId })
  return { group: result.group, deleted: result.deleted }
}

// Invite Functions
export async function sendInvite(invite: Omit<Invite, 'id' | 'status' | 'createdAt'>): Promise<Invite> {
  // Always use API routes (works in both browser and Electron)
  const hasDynamoDB = await checkDynamoDBConfigFromBrowser()
  
  if (!hasDynamoDB) {
    throw new Error('AWS DynamoDB not configured. Please configure AWS credentials.')
  }
  
  const result = await apiCall('sendInvite', {
    groupId: invite.groupId,
    inviterId: invite.inviterId,
    inviteeEmail: invite.inviteeEmail
  })
  return result.invite
}

export async function getInvitesForEmail(email: string): Promise<Invite[]> {
  // Always use API routes (works in both browser and Electron)
  const hasDynamoDB = await checkDynamoDBConfigFromBrowser()
  
  if (!hasDynamoDB) {
    throw new Error('AWS DynamoDB not configured. Please configure AWS credentials.')
  }
  
  const result = await apiCall('getUserInvites', { userId: email })
  return result.invites
}

export async function getAllInvites(): Promise<Invite[]> {
  // Always use API routes (works in both browser and Electron)
  const hasDynamoDB = await checkDynamoDBConfigFromBrowser()
  
  if (!hasDynamoDB) {
    throw new Error('AWS DynamoDB not configured. Please configure AWS credentials.')
  }
  
  const result = await apiCall('getAllInvites', {})
  return result.invites
}

export async function respondToInvite(inviteId: string, response: 'accept' | 'decline', userId: string): Promise<void> {
  // Always use API routes (works in both browser and Electron)
  const hasDynamoDB = await checkDynamoDBConfigFromBrowser()
  
  if (!hasDynamoDB) {
    throw new Error('AWS DynamoDB not configured. Please configure AWS credentials.')
  }
  
  await apiCall('respondToInvite', { inviteId, userId, response })
}

export async function deleteInvite(inviteId: string): Promise<void> {
  // Always use API routes (works in both browser and Electron)
  const hasDynamoDB = await checkDynamoDBConfigFromBrowser()
  
  if (!hasDynamoDB) {
    throw new Error('AWS DynamoDB not configured. Please configure AWS credentials.')
  }
  
  await apiCall('deleteInvite', { inviteId })
}

// Dev functions for backward compatibility
export const devStudyGroups = {
  createStudyGroup,
  getUserStudyGroups,
  getAllStudyGroups,
  joinStudyGroup,
  leaveStudyGroup
}

export const devInvites = {
  sendInvite,
  getInvitesForEmail,
  getAllInvites,
  respondToInvite,
  deleteInvite,
  cleanupOutdatedInvites: async (): Promise<number> => {
    if (typeof window === 'undefined') return 0
    const invites = JSON.parse(localStorage.getItem('dev-invites') || '[]')
    const activeInvites = invites.filter((invite: Invite) => invite.status === 'pending')
    localStorage.setItem('dev-invites', JSON.stringify(activeInvites))
    return invites.length - activeInvites.length
  }
}

// Meeting functions - now using AWS DynamoDB
export const devMeetings = {
  createMeeting: async (meeting: Omit<Meeting, 'id' | 'createdAt'>): Promise<Meeting> => {
    const hasDynamoDB = await checkDynamoDBConfigFromBrowser()

    if (!hasDynamoDB) {
      throw new Error('AWS DynamoDB not configured. Please configure AWS credentials.')
    }

    const result = await apiCall('createMeeting', meeting)
    return result.meeting
  },
  
  getMeetingsForGroup: async (groupId: string): Promise<Meeting[]> => {
    const hasDynamoDB = await checkDynamoDBConfigFromBrowser()

    if (!hasDynamoDB) {
      console.log('🔧 No DynamoDB config - returning empty meetings array')
      return []
    }

    const result = await apiCall('getMeetingsForGroup', { groupId })
    return result.meetings
  },
  
  deleteMeeting: async (meetingId: string): Promise<void> => {
    const hasDynamoDB = await checkDynamoDBConfigFromBrowser()

    if (!hasDynamoDB) {
      throw new Error('AWS DynamoDB not configured. Please configure AWS credentials.')
    }

    await apiCall('deleteMeeting', { meetingId })
  }
}