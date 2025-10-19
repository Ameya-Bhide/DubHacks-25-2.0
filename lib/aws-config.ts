import { Amplify } from 'aws-amplify'

// Check if we have real AWS configuration
const hasRealAWSConfig = (): boolean => {
  return !!(process.env.NEXT_PUBLIC_AWS_USER_POOL_ID && 
         process.env.NEXT_PUBLIC_AWS_USER_POOL_ID !== 'us-east-1_XXXXXXXXX' &&
         process.env.NEXT_PUBLIC_AWS_USER_POOL_WEB_CLIENT_ID &&
         process.env.NEXT_PUBLIC_AWS_USER_POOL_WEB_CLIENT_ID !== 'your-client-id')
}

// Check if we should use AWS DynamoDB (separate from Cognito)
// This function checks server-side environment variables
const hasDynamoDBConfig = (): boolean => {
  return !!(process.env.AWS_ACCESS_KEY_ID && 
         process.env.AWS_SECRET_ACCESS_KEY &&
         process.env.NEXT_PUBLIC_AWS_REGION)
}

// Check if we're running in Electron
const isElectron = (): boolean => {
  if (typeof window === 'undefined') return false
  
  // Check for forced Electron mode (for debugging)
  if (typeof window !== 'undefined' && window.localStorage) {
    const forcedElectron = window.localStorage.getItem('force-electron-mode')
    if (forcedElectron === 'true') {
      console.log('🔧 Forced Electron mode enabled via localStorage')
      return true
    }
  }
  
  // Multiple ways to detect Electron
  return !!(
    window.process && 
    (window.process.type === 'renderer' || window.process.versions?.electron) ||
    window.navigator?.userAgent?.includes('Electron') ||
    window.require // Electron has require available in renderer
  )
}

// Check DynamoDB config from browser (async)
const checkDynamoDBConfigFromBrowser = async (): Promise<boolean> => {
  // Debug: Log Electron detection details
  const electronDetected = isElectron()
  console.log('🔍 Electron detection check:', {
    electronDetected,
    hasWindow: typeof window !== 'undefined',
    hasProcess: typeof window !== 'undefined' && !!window.process,
    processType: typeof window !== 'undefined' && window.process?.type,
    hasElectronVersion: typeof window !== 'undefined' && !!window.process?.versions?.electron,
    userAgent: typeof window !== 'undefined' && window.navigator?.userAgent,
    hasRequire: typeof window !== 'undefined' && typeof window.require === 'function'
  })
  
  // Always try API routes first (works in both browser and Electron)
  try {
    const response = await fetch('/api/check-dynamodb-config')
    if (!response.ok) {
      console.log('🔧 API route not available - checking environment variables')
      // Check if we have AWS credentials in environment
      return hasDynamoDBConfig()
    }
    const data = await response.json()
    console.log('🔧 API route response:', data)
    return data.hasDynamoDBConfig
  } catch (error: any) {
    // Check if the error is due to HTML response (404 page) instead of JSON
    if (error.message && error.message.includes('Unexpected token')) {
      console.log('🔧 HTML response received - checking environment variables')
      return hasDynamoDBConfig()
    }
    console.log('🔧 API call failed - checking environment variables:', error.message)
    return hasDynamoDBConfig()
  }
}

// AWS Cognito configuration
const awsConfig = {
  Auth: {
    Cognito: {
      region: process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1',
      userPoolId: process.env.NEXT_PUBLIC_AWS_USER_POOL_ID || 'us-east-1_XXXXXXXXX',
      userPoolClientId: process.env.NEXT_PUBLIC_AWS_USER_POOL_WEB_CLIENT_ID || 'your-client-id',
      loginWith: {
        email: true,
        username: true,
      },
      identityPoolId: process.env.NEXT_PUBLIC_AWS_IDENTITY_POOL_ID || 'us-east-1:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
    },
  },
}

// Configure Amplify if we have real AWS configuration
if (hasRealAWSConfig()) {
  console.log('Configuring AWS Amplify with real credentials')
  Amplify.configure(awsConfig)
} else {
  console.log('Using development mode - AWS Amplify not configured')
}

export default awsConfig
export { hasRealAWSConfig, hasDynamoDBConfig, checkDynamoDBConfigFromBrowser, isElectron }
