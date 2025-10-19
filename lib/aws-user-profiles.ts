import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb'
import { hasRealAWSConfig } from './aws-config'

// User profile interface
export interface UserProfile {
  userId: string
  email: string
  givenName: string
  familyName: string
  university: string
  className: string
  createdAt: string
  updatedAt: string
}

// Initialize DynamoDB client
const getDynamoDBClient = () => {
  if (!hasRealAWSConfig()) {
    return null
  }

  const client = new DynamoDBClient({
    region: process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1',
  })
  
  return DynamoDBDocumentClient.from(client)
}

// Development mode storage
const devUserProfiles = {
  // In-memory storage for development
  profiles: new Map<string, UserProfile>(),

  async createProfile(profile: Omit<UserProfile, 'createdAt' | 'updatedAt'>): Promise<UserProfile> {
    const now = new Date().toISOString()
    const fullProfile: UserProfile = {
      ...profile,
      createdAt: now,
      updatedAt: now
    }
    
    this.profiles.set(profile.userId, fullProfile)
    
    // Also store in localStorage for persistence
    if (typeof window !== 'undefined') {
      const stored = JSON.parse(localStorage.getItem('dev-user-profiles') || '{}')
      stored[profile.userId] = fullProfile
      localStorage.setItem('dev-user-profiles', JSON.stringify(stored))
    }
    
    console.log('💾 Dev Mode - User profile created:', fullProfile)
    return fullProfile
  },

  async getProfile(userId: string): Promise<UserProfile | null> {
    // Try in-memory first
    let profile = this.profiles.get(userId)
    
    // If not found, try localStorage
    if (!profile && typeof window !== 'undefined') {
      const stored = JSON.parse(localStorage.getItem('dev-user-profiles') || '{}')
      profile = stored[userId] || null
      if (profile) {
        this.profiles.set(userId, profile)
      }
    }
    
    return profile || null
  },

  async updateProfile(userId: string, updates: Partial<Omit<UserProfile, 'userId' | 'createdAt'>>): Promise<UserProfile | null> {
    const existing = await this.getProfile(userId)
    if (!existing) return null
    
    const updated: UserProfile = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString()
    }
    
    this.profiles.set(userId, updated)
    
    // Update localStorage
    if (typeof window !== 'undefined') {
      const stored = JSON.parse(localStorage.getItem('dev-user-profiles') || '{}')
      stored[userId] = updated
      localStorage.setItem('dev-user-profiles', JSON.stringify(stored))
    }
    
    console.log('💾 Dev Mode - User profile updated:', updated)
    return updated
  }
}

// Production AWS functions
export const createUserProfile = async (profile: Omit<UserProfile, 'createdAt' | 'updatedAt'>): Promise<UserProfile> => {
  const client = getDynamoDBClient()
  
  if (!client) {
    // Development mode
    return await devUserProfiles.createProfile(profile)
  }

  const now = new Date().toISOString()
  const fullProfile: UserProfile = {
    ...profile,
    createdAt: now,
    updatedAt: now
  }

  const command = new PutCommand({
    TableName: 'UserProfiles',
    Item: fullProfile,
    ConditionExpression: 'attribute_not_exists(userId)', // Prevent overwriting existing profiles
  })

  try {
    await client.send(command)
    console.log('🔗 AWS Mode - User profile created in DynamoDB:', fullProfile)
    return fullProfile
  } catch (error) {
    console.error('Error creating user profile:', error)
    throw error
  }
}

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  const client = getDynamoDBClient()
  
  if (!client) {
    // Development mode
    return await devUserProfiles.getProfile(userId)
  }

  const command = new GetCommand({
    TableName: 'UserProfiles',
    Key: { userId },
  })

  try {
    const result = await client.send(command)
    if (result.Item) {
      console.log('🔗 AWS Mode - User profile retrieved from DynamoDB:', result.Item)
      return result.Item as UserProfile
    }
    return null
  } catch (error) {
    console.error('Error getting user profile:', error)
    throw error
  }
}

export const updateUserProfile = async (userId: string, updates: Partial<Omit<UserProfile, 'userId' | 'createdAt'>>): Promise<UserProfile | null> => {
  const client = getDynamoDBClient()
  
  if (!client) {
    // Development mode
    return await devUserProfiles.updateProfile(userId, updates)
  }

  const updateExpression = []
  const expressionAttributeNames: Record<string, string> = {}
  const expressionAttributeValues: Record<string, any> = {}

  // Build update expression dynamically
  Object.keys(updates).forEach((key, index) => {
    if (updates[key as keyof typeof updates] !== undefined) {
      updateExpression.push(`#${key} = :${key}`)
      expressionAttributeNames[`#${key}`] = key
      expressionAttributeValues[`:${key}`] = updates[key as keyof typeof updates]
    }
  })

  // Always update the updatedAt timestamp
  updateExpression.push('#updatedAt = :updatedAt')
  expressionAttributeNames['#updatedAt'] = 'updatedAt'
  expressionAttributeValues[':updatedAt'] = new Date().toISOString()

  const command = new UpdateCommand({
    TableName: 'UserProfiles',
    Key: { userId },
    UpdateExpression: `SET ${updateExpression.join(', ')}`,
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: expressionAttributeValues,
    ReturnValues: 'ALL_NEW',
  })

  try {
    const result = await client.send(command)
    console.log('🔗 AWS Mode - User profile updated in DynamoDB:', result.Attributes)
    return result.Attributes as UserProfile
  } catch (error) {
    console.error('Error updating user profile:', error)
    throw error
  }
}

// Initialize dev profiles from localStorage on load
if (typeof window !== 'undefined') {
  try {
    const stored = JSON.parse(localStorage.getItem('dev-user-profiles') || '{}')
    Object.entries(stored).forEach(([userId, profile]) => {
      devUserProfiles.profiles.set(userId, profile as UserProfile)
    })
  } catch (error) {
    console.warn('Failed to load dev user profiles from localStorage:', error)
  }
}
