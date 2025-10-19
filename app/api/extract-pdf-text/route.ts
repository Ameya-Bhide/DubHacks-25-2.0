import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import fs from 'fs'

const execAsync = promisify(exec)

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { filePath, maxPages = 10, maxChars = 2000 } = body

    if (!filePath) {
      return NextResponse.json({ 
        success: false, 
        error: 'File path is required' 
      }, { status: 400 })
    }

    // Expand ~ to home directory if present
    const expandedPath = filePath.startsWith('~/') 
      ? filePath.replace('~/', `${process.env.HOME || '/Users/' + process.env.USER}/`)
      : filePath

    console.log('📄 Processing file:', filePath, 'Expanded path:', expandedPath)

    // Check if it's a text file (including files without extensions that are likely text)
    const isTextFile = filePath.toLowerCase().endsWith('.txt') || 
                      (!filePath.toLowerCase().endsWith('.pdf') && 
                       !filePath.toLowerCase().endsWith('.doc') && 
                       !filePath.toLowerCase().endsWith('.docx') &&
                       !filePath.toLowerCase().endsWith('.xls') &&
                       !filePath.toLowerCase().endsWith('.xlsx'))
    const isPdfFile = filePath.toLowerCase().endsWith('.pdf')

    if (isTextFile) {
      try {
        console.log('📄 Reading text file content from:', filePath)
        
        // Read text file directly
        const fileContent = await fs.promises.readFile(expandedPath, 'utf-8')
        
        // Truncate if too long
        let extractedText = fileContent
        if (extractedText.length > maxChars) {
          extractedText = extractedText.substring(0, maxChars) + '\n\n[Content truncated - showing first portion of document]'
        }
        
        console.log('✅ Text file read successfully, length:', extractedText.length)
        
        return NextResponse.json({ 
          success: true, 
          text: extractedText,
          length: extractedText.length
        })
        
      } catch (error: any) {
        console.error('❌ Text file reading failed:', error)
        return NextResponse.json({ 
          success: false, 
          error: `Text file reading failed: ${error.message}` 
        }, { status: 500 })
      }
    } else if (isPdfFile) {
      console.log('📄 Extracting PDF text from:', filePath)
      
      // Use Python script to extract PDF text
      const pythonScript = path.join(process.cwd(), 'pdf_extractor.py')
      const command = `python3 "${pythonScript}" "${expandedPath}" ${maxPages} ${maxChars}`

      try {
        const { stdout, stderr } = await execAsync(command)
        
        if (stderr) {
          console.warn('PDF extraction warnings:', stderr)
        }

        const extractedText = stdout.trim()
        
        if (!extractedText) {
          return NextResponse.json({ 
            success: false, 
            error: 'No text could be extracted from the PDF' 
          }, { status: 400 })
        }

        console.log('✅ PDF text extracted successfully, length:', extractedText.length)

        return NextResponse.json({ 
          success: true, 
          text: extractedText,
          length: extractedText.length
        })

      } catch (execError: any) {
        console.error('❌ PDF extraction failed:', execError)
        return NextResponse.json({ 
          success: false, 
          error: `PDF extraction failed: ${execError.message}` 
        }, { status: 500 })
      }
    } else {
      return NextResponse.json({ 
        success: false, 
        error: 'Unsupported file type. Only PDF and TXT files are supported.' 
      }, { status: 400 })
    }

  } catch (error: any) {
    console.error('❌ PDF extraction API error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Failed to extract PDF text' 
    }, { status: 500 })
  }
}
