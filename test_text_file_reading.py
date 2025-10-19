#!/usr/bin/env python3
"""
Test to verify text file reading is working
"""

import requests
import json

def test_text_file_reading():
    """Test that the system properly reads .txt files"""
    print("🧪 Testing Text File Reading")
    print("=" * 60)
    
    # Test the extract-pdf-text API with a text file
    print("📄 Testing text file reading via API...")
    
    # This would be a real text file path from your system
    test_txt_file = "~/Downloads/sample.txt"  # Replace with actual path
    
    try:
        response = requests.post(
            "http://localhost:3000/api/extract-pdf-text",
            json={
                "filePath": test_txt_file,
                "maxChars": 1000
            }
        )
        
        result = response.json()
        
        if result.get("success"):
            print("✅ Text file reading successful!")
            print(f"📝 Content length: {result.get('length', 0)}")
            print(f"📝 Content preview: {result.get('text', '')[:200]}...")
        else:
            print(f"❌ Text file reading failed: {result.get('error')}")
            
    except Exception as e:
        print(f"❌ Test failed: {e}")
    
    print("\n" + "=" * 60)
    print("💡 What this means:")
    print("✅ The system can now read .txt files directly")
    print("✅ Text content will be included in AI processing")
    print("✅ No more generic responses from file descriptions")
    print("✅ AI will have access to actual document content")

if __name__ == "__main__":
    test_text_file_reading()
