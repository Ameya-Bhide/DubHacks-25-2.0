import { NextRequest, NextResponse } from 'next/server'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:5004/api'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, ...data } = body

    if (!action) {
      return NextResponse.json({ 
        success: false, 
        error: 'No action specified' 
      }, { status: 400 })
    }

    console.log('🤖 AI Tool Request:', { action, data })

    // Call the Flask AI service
    const response = await fetch(AI_SERVICE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action, ...data }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('❌ AI Service Error:', errorData)
      return NextResponse.json({ 
        success: false, 
        error: errorData.error || 'AI service error' 
      }, { status: response.status })
    }

    const result = await response.json()
    console.log('✅ AI Service Response:', result)

    return NextResponse.json({ 
      success: true, 
      ...result 
    })

  } catch (error: any) {
    console.error('❌ AI Tools API Error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Failed to process AI request' 
    }, { status: 500 })
  }
}
