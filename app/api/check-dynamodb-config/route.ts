import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Check if we have DynamoDB configuration
    const hasDynamoDBConfig = !!(
      process.env.AWS_ACCESS_KEY_ID && 
      process.env.AWS_SECRET_ACCESS_KEY &&
      process.env.NEXT_PUBLIC_AWS_REGION
    )

    return NextResponse.json({
      hasDynamoDBConfig,
      region: process.env.NEXT_PUBLIC_AWS_REGION || 'not-set',
      hasAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
      hasSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY
    })
  } catch (error) {
    console.error('Error checking DynamoDB config:', error)
    return NextResponse.json({ 
      hasDynamoDBConfig: false,
      error: 'Failed to check configuration'
    }, { status: 500 })
  }
}
