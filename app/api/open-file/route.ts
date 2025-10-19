import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import os from 'os'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

const execAsync = promisify(exec)

export async function POST(request: NextRequest) {
  try {
    const { filePath } = await request.json()

    if (!filePath) {
      return NextResponse.json({ 
        success: false, 
        error: 'No file path provided' 
      }, { status: 400 })
    }

    const platform = os.platform()
    let command: string

    // Determine the appropriate command based on the operating system
    switch (platform) {
      case 'darwin': // macOS
        command = `open "${filePath}"`
        break
      case 'win32': // Windows
        command = `start "" "${filePath}"`
        break
      case 'linux': // Linux
        command = `xdg-open "${filePath}"`
        break
      default:
        return NextResponse.json({ 
          success: false, 
          error: `Unsupported platform: ${platform}` 
        }, { status: 400 })
    }

    try {
      // Execute the command to open the file
      await execAsync(command)
      
      return NextResponse.json({
        success: true,
        message: 'File opened successfully',
        platform: platform,
        command: command
      })
    } catch (execError: any) {
      console.error('Error executing open command:', execError)
      return NextResponse.json({ 
        success: false, 
        error: `Failed to open file: ${execError.message}` 
      }, { status: 500 })
    }

  } catch (error: any) {
    console.error('Error in open-file API:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Failed to open file' 
    }, { status: 500 })
  }
}
