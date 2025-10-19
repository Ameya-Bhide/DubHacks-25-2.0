#!/usr/bin/env python3
"""
Test the full PDF to AI pipeline with the corrected path handling
"""

import requests
import json

def test_full_pipeline():
    """Test the complete PDF extraction to AI generation pipeline"""
    print("🧪 Testing Full PDF to AI Pipeline")
    print("=" * 50)
    
    # Step 1: Test PDF extraction with ~ path
    print("📄 Step 1: Testing PDF extraction with ~ path...")
    extract_url = "http://localhost:3000/api/extract-pdf-text"
    extract_data = {
        "filePath": "~/Downloads/2107.07436v3.pdf",
        "maxPages": 3,
        "maxChars": 3000
    }
    
    try:
        response = requests.post(extract_url, json=extract_data)
        result = response.json()
        
        if result.get("success"):
            extracted_text = result.get("text", "")
            print(f"✅ PDF extraction successful! Length: {len(extracted_text)}")
            print(f"📝 Preview: {extracted_text[:200]}...")
            
            # Step 2: Test AI generation with extracted content
            print("\n🤖 Step 2: Testing AI generation with extracted content...")
            ai_url = "http://127.0.0.1:5000/api"
            ai_data = {
                "action": "getSummary",
                "notesContent": f"=== FastSHAP Paper ===\n{extracted_text}",
                "query": "What is FastSHAP and what are its key contributions?"
            }
            
            ai_response = requests.post(ai_url, json=ai_data)
            ai_result = ai_response.json()
            
            if "reply" in ai_result:
                print("✅ AI generation successful!")
                print(f"📝 AI Summary:\n{ai_result['reply'][:500]}...")
                
                # Check if the response contains accurate information
                if "FastSHAP" in ai_result['reply'] and "Shapley" in ai_result['reply']:
                    print("\n🎉 SUCCESS: AI correctly processed the PDF content!")
                    print("✅ The system is now using actual PDF text instead of descriptions")
                else:
                    print("\n⚠️ WARNING: AI response may not be using PDF content correctly")
            else:
                print(f"❌ AI generation failed: {ai_result}")
        else:
            print(f"❌ PDF extraction failed: {result.get('error')}")
            
    except Exception as e:
        print(f"❌ Pipeline test failed: {e}")

if __name__ == "__main__":
    test_full_pipeline()
