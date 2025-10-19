#!/usr/bin/env python3
"""
Test script to verify PDF extraction and AI integration
"""

import requests
import json

def test_pdf_extraction():
    """Test PDF text extraction"""
    print("🧪 Testing PDF text extraction...")
    
    url = "http://localhost:3000/api/extract-pdf-text"
    data = {
        "filePath": "/Users/ameyabhide/Downloads/2107.07436v3.pdf",
        "maxPages": 2,
        "maxChars": 1000
    }
    
    try:
        response = requests.post(url, json=data)
        result = response.json()
        
        if result.get("success"):
            print("✅ PDF extraction successful!")
            print(f"📄 Extracted {result.get('length', 0)} characters")
            print(f"📝 Preview: {result.get('text', '')[:200]}...")
            return result.get('text', '')
        else:
            print(f"❌ PDF extraction failed: {result.get('error')}")
            return None
            
    except Exception as e:
        print(f"❌ PDF extraction error: {e}")
        return None

def test_ai_generation(extracted_text):
    """Test AI generation with extracted PDF text"""
    print("\n🤖 Testing AI generation with PDF content...")
    
    url = "http://127.0.0.1:5000/api"
    data = {
        "action": "getSummary",
        "notesContent": extracted_text,
        "query": "FastSHAP optimization techniques"
    }
    
    try:
        response = requests.post(url, json=data)
        result = response.json()
        
        if "reply" in result:
            print("✅ AI generation successful!")
            print(f"📝 AI Summary:\n{result['reply'][:300]}...")
            return True
        else:
            print(f"❌ AI generation failed: {result}")
            return False
            
    except Exception as e:
        print(f"❌ AI generation error: {e}")
        return False

def main():
    print("🚀 Testing PDF to AI Integration")
    print("=" * 50)
    
    # Test PDF extraction
    extracted_text = test_pdf_extraction()
    
    if extracted_text:
        # Test AI generation
        ai_success = test_ai_generation(extracted_text)
        
        if ai_success:
            print("\n🎉 Full integration test PASSED!")
            print("✅ PDF extraction → AI generation pipeline is working")
        else:
            print("\n❌ AI generation test FAILED")
    else:
        print("\n❌ PDF extraction test FAILED")

if __name__ == "__main__":
    main()
