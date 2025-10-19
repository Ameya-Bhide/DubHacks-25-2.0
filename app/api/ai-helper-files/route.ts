import { NextRequest, NextResponse } from 'next/server'
import { 
  saveFileRecord, 
  getUserFiles, 
  deleteFileRecord, 
  getFileRecord, 
  updateFileRecord,
  makeFile 
} from '@/lib/ai-helper-files'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const action = searchParams.get('action')
    const filePath = searchParams.get('filePath')

    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        error: 'User ID is required' 
      }, { status: 400 })
    }

    if (action === 'getUserFiles') {
      const files = getUserFiles(userId)
      return NextResponse.json({ 
        success: true, 
        files: files 
      })
    }

    if (action === 'getFileRecord' && filePath) {
      const fileRecord = getFileRecord(filePath)
      if (fileRecord) {
        return NextResponse.json({ 
          success: true, 
          fileRecord: fileRecord 
        })
      } else {
        return NextResponse.json({ 
          success: false, 
          error: 'File not found' 
        }, { status: 404 })
      }
    }

    return NextResponse.json({ 
      success: false, 
      error: 'Invalid action' 
    }, { status: 400 })

  } catch (error: any) {
    console.error('Error in ai-helper-files GET:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Failed to get files' 
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, data } = body

    if (action === 'saveFileRecord') {
      const fileRecord = saveFileRecord(data)
      return NextResponse.json({ 
        success: true, 
        message: 'File record saved successfully',
        fileRecord: fileRecord 
      })
    }

    if (action === 'makeFile') {
      const result = makeFile(data)
      return NextResponse.json({ 
        success: true, 
        message: 'File processed successfully',
        fileRecord: result 
      })
    }

    if (action === 'updateFileRecord') {
      const { filePath, updates } = data
      const success = updateFileRecord(filePath, updates)
      
      if (success) {
        return NextResponse.json({ 
          success: true, 
          message: 'File record updated successfully' 
        })
      } else {
        return NextResponse.json({ 
          success: false, 
          error: 'File not found' 
        }, { status: 404 })
      }
    }

    return NextResponse.json({ 
      success: false, 
      error: 'Invalid action' 
    }, { status: 400 })

  } catch (error: any) {
    console.error('Error in ai-helper-files POST:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Failed to process request' 
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { filePath } = await request.json()

    if (!filePath) {
      return NextResponse.json({ 
        success: false, 
        error: 'File path is required' 
      }, { status: 400 })
    }

    const success = deleteFileRecord(filePath)
    
    if (success) {
      return NextResponse.json({ 
        success: true, 
        message: 'File record deleted successfully' 
      })
    } else {
      return NextResponse.json({ 
        success: false, 
        error: 'File not found' 
      }, { status: 404 })
    }

  } catch (error: any) {
    console.error('Error in ai-helper-files DELETE:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Failed to delete file' 
    }, { status: 500 })
  }
}
