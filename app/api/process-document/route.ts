import { NextRequest, NextResponse } from 'next/server'
import { make_file } from '../../../make_file'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate the required fields
    const requiredFields = [
      'File path',
      'Date Created', 
      'Study Group Name',
      'Class Name',
      'Name of file',
      '1-sentence description'
    ]
    
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json({ 
          success: false, 
          error: `Missing required field: ${field}` 
        }, { status: 400 })
      }
    }
    
    // Call the make_file function
    const result = make_file(body)
    
    return NextResponse.json({ 
      success: true, 
      message: 'Document processed successfully',
      result 
    })
    
  } catch (error: any) {
    console.error('Error processing document:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Failed to process document' 
    }, { status: 500 })
  }
}
