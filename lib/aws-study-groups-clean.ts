import { checkDynamoDBConfigFromBrowser } from '@/lib/aws-config'

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
  const hasDynamoDB = await checkDynamoDBConfigFromBrowser()
  
  if (!hasDynamoDB) {
    // Fallback to localStorage for dev mode
    const group: StudyGroup = {
      ...groupData,
      id: Date.now().toString(),
      members: [groupData.createdBy],
      memberCount: 1,
      isActive: true,
      createdAt: new Date().toISOString()
    }
    
    if (typeof window !== 'undefined') {
      const groups = JSON.parse(localStorage.getItem('dev-study-groups') || '[]')
      groups.push(group)
      localStorage.setItem('dev-study-groups', JSON.stringify(groups))
    }
    
    return group
  }
  
  const result = await apiCall('createGroup', groupData)
  return result.group
}

export async function getUserStudyGroups(userId: string): Promise<StudyGroup[]> {
  const hasDynamoDB = await checkDynamoDBConfigFromBrowser()
  
  if (!hasDynamoDB) {
    // Fallback to localStorage for dev mode
    if (typeof window === 'undefined') return []
    const groups = JSON.parse(localStorage.getItem('dev-study-groups') || '[]')
    return groups.filter((group: StudyGroup) => group.members.includes(userId) && group.isActive)
  }
  
  const result = await apiCall('getUserGroups', { userId })
  return result.groups
}

export async function getAllStudyGroups(): Promise<StudyGroup[]> {
  const hasDynamoDB = await checkDynamoDBConfigFromBrowser()
  
  if (!hasDynamoDB) {
    // Fallback to localStorage for dev mode
    if (typeof window === 'undefined') return []
    const groups = JSON.parse(localStorage.getItem('dev-study-groups') || '[]')
    return groups.filter((group: StudyGroup) => group.isActive)
  }
  
  const result = await apiCall('getAllGroups', {})
  return result.groups
}

export async function joinStudyGroup(groupId: string, userId: string): Promise<StudyGroup> {
  const hasDynamoDB = await checkDynamoDBConfigFromBrowser()
  
  if (!hasDynamoDB) {
    // Fallback to localStorage for dev mode
    if (typeof window === 'undefined') throw new Error('Not in browser environment')
    const groups = JSON.parse(localStorage.getItem('dev-study-groups') || '[]')
    const groupIndex = groups.findIndex((group: StudyGroup) => group.id === groupId)
    
    if (groupIndex === -1) {
      throw new Error('Group not found')
    }
    
    const group = groups[groupIndex]
    if (group.members.includes(userId)) {
      throw new Error('Already a member')
    }
    
    group.members.push(userId)
    group.memberCount++
    groups[groupIndex] = group
    localStorage.setItem('dev-study-groups', JSON.stringify(groups))
    
    return group
  }
  
  const result = await apiCall('joinGroup', { groupId, userId })
  return result.group
}

export async function leaveStudyGroup(groupId: string, userId: string): Promise<{ group: StudyGroup | null; deleted: boolean }> {
  const hasDynamoDB = await checkDynamoDBConfigFromBrowser()
  
  if (!hasDynamoDB) {
    // Fallback to localStorage for dev mode
    if (typeof window === 'undefined') throw new Error('Not in browser environment')
    const groups = JSON.parse(localStorage.getItem('dev-study-groups') || '[]')
    const groupIndex = groups.findIndex((group: StudyGroup) => group.id === groupId)
    
    if (groupIndex === -1) {
      throw new Error('Group not found')
    }
    
    const group = groups[groupIndex]
    group.members = group.members.filter((member: string) => member !== userId)
    group.memberCount--
    
    if (group.memberCount === 0) {
      group.isActive = false
      groups[groupIndex] = group
      localStorage.setItem('dev-study-groups', JSON.stringify(groups))
      return { group, deleted: true }
    } else {
      groups[groupIndex] = group
      localStorage.setItem('dev-study-groups', JSON.stringify(groups))
      return { group, deleted: false }
    }
  }
  
  const result = await apiCall('leaveGroup', { groupId, userId })
  return { group: result.group, deleted: result.deleted }
}

// Invite Functions
export async function sendInvite(invite: Omit<Invite, 'id' | 'status' | 'createdAt'>): Promise<Invite> {
  const hasDynamoDB = await checkDynamoDBConfigFromBrowser()
  
  if (!hasDynamoDB) {
    // Fallback to localStorage for dev mode
    const newInvite: Invite = {
      ...invite,
      id: Date.now().toString(),
      status: 'pending',
      createdAt: new Date().toISOString()
    }
    
    if (typeof window !== 'undefined') {
      const invites = JSON.parse(localStorage.getItem('dev-invites') || '[]')
      invites.push(newInvite)
      localStorage.setItem('dev-invites', JSON.stringify(invites))
    }
    
    return newInvite
  }
  
  const result = await apiCall('sendInvite', {
    groupId: invite.groupId,
    inviterId: invite.inviterId,
    inviteeEmail: invite.inviteeEmail
  })
  return result.invite
}

export async function getInvitesForEmail(email: string): Promise<Invite[]> {
  const hasDynamoDB = await checkDynamoDBConfigFromBrowser()
  
  if (!hasDynamoDB) {
    // Fallback to localStorage for dev mode
    if (typeof window === 'undefined') return []
    const invites = JSON.parse(localStorage.getItem('dev-invites') || '[]')
    return invites.filter((invite: Invite) => invite.inviteeEmail === email && invite.status === 'pending')
  }
  
  const result = await apiCall('getUserInvites', { userId: email })
  return result.invites
}

export async function getAllInvites(): Promise<Invite[]> {
  const hasDynamoDB = await checkDynamoDBConfigFromBrowser()
  
  if (!hasDynamoDB) {
    // Fallback to localStorage for dev mode
    if (typeof window === 'undefined') return []
    return JSON.parse(localStorage.getItem('dev-invites') || '[]')
  }
  
  const result = await apiCall('getAllInvites', {})
  return result.invites
}

export async function respondToInvite(inviteId: string, response: 'accept' | 'decline', userId: string): Promise<void> {
  const hasDynamoDB = await checkDynamoDBConfigFromBrowser()
  
  if (!hasDynamoDB) {
    // Fallback to localStorage for dev mode
    if (typeof window === 'undefined') throw new Error('Not in browser environment')
    const invites = JSON.parse(localStorage.getItem('dev-invites') || '[]')
    const inviteIndex = invites.findIndex((invite: Invite) => invite.id === inviteId)
    
    if (inviteIndex !== -1) {
      invites[inviteIndex].status = response
      invites[inviteIndex].respondedAt = new Date().toISOString()
      localStorage.setItem('dev-invites', JSON.stringify(invites))
    }
    return
  }
  
  await apiCall('respondToInvite', { inviteId, userId, response })
}

export async function deleteInvite(inviteId: string): Promise<void> {
  const hasDynamoDB = await checkDynamoDBConfigFromBrowser()
  
  if (!hasDynamoDB) {
    // Fallback to localStorage for dev mode
    if (typeof window === 'undefined') throw new Error('Not in browser environment')
    const invites = JSON.parse(localStorage.getItem('dev-invites') || '[]')
    const filteredInvites = invites.filter((invite: Invite) => invite.id !== inviteId)
    localStorage.setItem('dev-invites', JSON.stringify(filteredInvites))
    return
  }
  
  await apiCall('deleteInvite', { inviteId })
}

// Export dev functions for backward compatibility
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
  deleteInvite
}
