import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import os from 'os'
import { promises as fs } from 'fs'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

const execAsync = promisify(exec)

export async function POST(request: NextRequest) {
  try {
    const { filePath, application } = await request.json()

    if (!filePath) {
      return NextResponse.json({ 
        success: false, 
        error: 'No file path provided' 
      }, { status: 400 })
    }

    // Expand the home directory symbol (~) to the actual home directory
    const expandedPath = filePath.replace('~', os.homedir())

    // Check if the file exists
    try {
      await fs.access(expandedPath)
    } catch (error) {
      return NextResponse.json({ 
        success: false, 
        error: `File not found: ${expandedPath}`,
        expandedPath: expandedPath
      }, { status: 404 })
    }

    const platform = os.platform()
    let command: string

    // Determine the appropriate command based on the operating system and application choice
    if (application && application !== 'default') {
      // Use specific application
      switch (platform) {
        case 'darwin': // macOS
          command = `open -a "${application}" "${expandedPath}"`
          break
        case 'win32': // Windows
          command = `"${application}" "${expandedPath}"`
          break
        case 'linux': // Linux
          command = `${application} "${expandedPath}"`
          break
        default:
          return NextResponse.json({ 
            success: false, 
            error: `Unsupported platform: ${platform}` 
          }, { status: 400 })
      }
    } else {
      // Use default application
      switch (platform) {
        case 'darwin': // macOS
          command = `open "${expandedPath}"`
          break
        case 'win32': // Windows
          command = `start "" "${expandedPath}"`
          break
        case 'linux': // Linux
          command = `xdg-open "${expandedPath}"`
          break
        default:
          return NextResponse.json({ 
            success: false, 
            error: `Unsupported platform: ${platform}` 
          }, { status: 400 })
      }
    }

    try {
      // Execute the command to open the file
      await execAsync(command)
      
      return NextResponse.json({
        success: true,
        message: application ? `File opened with ${application}` : 'File opened with default application',
        platform: platform,
        command: command,
        expandedPath: expandedPath,
        application: application || 'default'
      })
    } catch (execError: any) {
      console.error('Error executing open command:', execError)
      return NextResponse.json({ 
        success: false, 
        error: `Failed to open file: ${execError.message}`,
        expandedPath: expandedPath
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
