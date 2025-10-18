#!/usr/bin/env node

// Script to check AWS configuration
const fs = require('fs')
const path = require('path')

console.log('🔍 Checking AWS Configuration...\n')

// Check if .env.local exists
const envPath = path.join(process.cwd(), '.env.local')
if (!fs.existsSync(envPath)) {
  console.log('❌ .env.local file not found')
  console.log('   Please create .env.local with your AWS configuration')
  process.exit(1)
}

// Read .env.local
const envContent = fs.readFileSync(envPath, 'utf8')
const envVars = {}

envContent.split('\n').forEach(line => {
  if (line.trim() && !line.startsWith('#')) {
    const [key, value] = line.split('=')
    if (key && value) {
      envVars[key.trim()] = value.trim()
    }
  }
})

console.log('📋 Environment Variables:')
console.log(`   NEXT_PUBLIC_AWS_REGION: ${envVars.NEXT_PUBLIC_AWS_REGION || '❌ Not set'}`)
console.log(`   NEXT_PUBLIC_AWS_USER_POOL_ID: ${envVars.NEXT_PUBLIC_AWS_USER_POOL_ID || '❌ Not set'}`)
console.log(`   NEXT_PUBLIC_AWS_USER_POOL_WEB_CLIENT_ID: ${envVars.NEXT_PUBLIC_AWS_USER_POOL_WEB_CLIENT_ID || '❌ Not set'}`)

// Check if values are placeholder values
const hasPlaceholders = 
  envVars.NEXT_PUBLIC_AWS_USER_POOL_ID === 'us-east-1_XXXXXXXXX' ||
  envVars.NEXT_PUBLIC_AWS_USER_POOL_WEB_CLIENT_ID === 'your-client-id'

if (hasPlaceholders) {
  console.log('\n⚠️  Placeholder values detected!')
  console.log('   You need to replace these with your actual AWS Cognito values.')
  console.log('   Follow the AWS_COGNITO_SETUP.md guide to get real values.')
} else if (envVars.NEXT_PUBLIC_AWS_USER_POOL_ID && envVars.NEXT_PUBLIC_AWS_USER_POOL_WEB_CLIENT_ID) {
  console.log('\n✅ AWS configuration looks good!')
  console.log('   Your app will use AWS Cognito authentication.')
} else {
  console.log('\n❌ Incomplete AWS configuration')
  console.log('   Please set all required environment variables.')
}

console.log('\n📚 Next steps:')
console.log('   1. Create AWS Cognito User Pool (see AWS_COGNITO_SETUP.md)')
console.log('   2. Update .env.local with real values')
console.log('   3. Restart your development server')
console.log('   4. Test the authentication flow')
