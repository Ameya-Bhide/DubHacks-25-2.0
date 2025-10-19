import os
import pdfplumber
import PyPDF2
from typing import Optional

def extract_text_from_pdf(file_path: str, max_pages: int = 10) -> Optional[str]:
    """
    Extract text from a PDF file using multiple methods for better reliability.
    
    Args:
        file_path: Path to the PDF file
        max_pages: Maximum number of pages to extract (to avoid huge content)
    
    Returns:
        Extracted text or None if extraction fails
    """
    if not os.path.exists(file_path):
        print(f"❌ PDF file not found: {file_path}")
        return None
    
    if not file_path.lower().endswith('.pdf'):
        print(f"❌ Not a PDF file: {file_path}")
        return None
    
    try:
        # Method 1: Try pdfplumber first (better for complex layouts)
        print(f"📄 Extracting text from PDF: {os.path.basename(file_path)}")
        
        with pdfplumber.open(file_path) as pdf:
            text_content = []
            pages_to_extract = min(len(pdf.pages), max_pages)
            
            for i, page in enumerate(pdf.pages[:pages_to_extract]):
                try:
                    page_text = page.extract_text()
                    if page_text and page_text.strip():
                        text_content.append(f"--- Page {i+1} ---\n{page_text.strip()}")
                except Exception as e:
                    print(f"⚠️ Error extracting page {i+1}: {e}")
                    continue
            
            if text_content:
                full_text = "\n\n".join(text_content)
                print(f"✅ Successfully extracted {len(text_content)} pages using pdfplumber")
                return full_text
        
        # Method 2: Fallback to PyPDF2 if pdfplumber fails
        print("🔄 Trying PyPDF2 as fallback...")
        
        with open(file_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            text_content = []
            pages_to_extract = min(len(pdf_reader.pages), max_pages)
            
            for i in range(pages_to_extract):
                try:
                    page = pdf_reader.pages[i]
                    page_text = page.extract_text()
                    if page_text and page_text.strip():
                        text_content.append(f"--- Page {i+1} ---\n{page_text.strip()}")
                except Exception as e:
                    print(f"⚠️ Error extracting page {i+1} with PyPDF2: {e}")
                    continue
            
            if text_content:
                full_text = "\n\n".join(text_content)
                print(f"✅ Successfully extracted {len(text_content)} pages using PyPDF2")
                return full_text
        
        print("❌ Failed to extract text from PDF using both methods")
        return None
        
    except Exception as e:
        print(f"❌ Error extracting PDF text: {e}")
        return None

def get_pdf_summary(file_path: str, max_chars: int = 2000) -> str:
    """
    Get a summary of PDF content, truncated if too long.
    
    Args:
        file_path: Path to the PDF file
        max_chars: Maximum characters to return
    
    Returns:
        PDF text content, truncated if necessary
    """
    full_text = extract_text_from_pdf(file_path)
    
    if not full_text:
        return f"Could not extract text from PDF: {os.path.basename(file_path)}"
    
    # Clean up the text
    cleaned_text = full_text.replace('\n\n\n', '\n\n').strip()
    
    # Truncate if too long
    if len(cleaned_text) > max_chars:
        truncated = cleaned_text[:max_chars]
        # Try to end at a sentence boundary
        last_period = truncated.rfind('.')
        if last_period > max_chars * 0.8:  # If we can find a period in the last 20%
            truncated = truncated[:last_period + 1]
        return truncated + "\n\n[Content truncated - showing first portion of document]"
    
    return cleaned_text

# Command line interface
if __name__ == "__main__":
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python3 pdf_extractor.py <file_path> [max_pages] [max_chars]")
        sys.exit(1)
    
    file_path = sys.argv[1]
    max_pages = int(sys.argv[2]) if len(sys.argv) > 2 else 10
    max_chars = int(sys.argv[3]) if len(sys.argv) > 3 else 2000
    
    # Extract text and print to stdout
    result = get_pdf_summary(file_path, max_chars)
    print(result)
