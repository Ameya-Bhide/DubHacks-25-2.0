import { Amplify } from 'aws-amplify'

// Check if we have real AWS configuration
const hasRealAWSConfig = () => {
  return process.env.NEXT_PUBLIC_AWS_USER_POOL_ID && 
         process.env.NEXT_PUBLIC_AWS_USER_POOL_ID !== 'us-east-1_XXXXXXXXX' &&
         process.env.NEXT_PUBLIC_AWS_USER_POOL_WEB_CLIENT_ID &&
         process.env.NEXT_PUBLIC_AWS_USER_POOL_WEB_CLIENT_ID !== 'your-client-id'
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
export { hasRealAWSConfig }
