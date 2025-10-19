#!/usr/bin/env python3
"""
Test to verify the improved document filtering is working
"""

import requests
import json

def test_improved_filtering():
    """Test that the system now includes relevant documents even with partial matches"""
    print("🧪 Testing Improved Document Filtering")
    print("=" * 60)
    
    # Test with a query that should match documents
    test_query = "MLE questions from the section exercise"
    
    print(f"📝 Testing query: '{test_query}'")
    print("🔍 This should now find documents even with partial matches")
    
    # Simulate what the app would send
    ai_url = "http://localhost:3000/api/ai-tools"
    ai_data = {
        "action": "getFlashCards",
        "notesContent": f"=== MLE Worksheet ===\nMaximum Likelihood Estimation problems and solutions\n\n=== Section Exercise ===\nPractice problems for MLE concepts\n\n=== Downloaded from Mustafa Macaws - asdfasdfasdf ===\nDownloaded from Mustafa Macaws - asdfasdfasdf\n\n=== Stroop Test ===\nCognitive processing and attention tests",
        "query": test_query,
        "numCards": 5
    }
    
    try:
        response = requests.post(ai_url, json=ai_data)
        result = response.json()
        
        if result.get("success"):
            ai_reply = result.get("reply", "")
            print(f"✅ AI generation successful!")
            print(f"📝 Response length: {len(ai_reply)}")
            print(f"📝 Response preview:\n{ai_reply[:300]}...")
            
            # Check if response contains MLE-related content
            mle_keywords = ["MLE", "maximum likelihood", "estimation", "parameter", "likelihood function"]
            found_keywords = [keyword for keyword in mle_keywords if keyword.lower() in ai_reply.lower()]
            
            print(f"\n🔍 MLE keywords found: {found_keywords}")
            
            if len(found_keywords) >= 2:
                print("🎉 SUCCESS: AI is now focusing on relevant MLE content!")
                print("✅ The improved filtering is working correctly")
            else:
                print("⚠️ WARNING: AI may still not be focusing on the right content")
                
        else:
            print(f"❌ AI generation failed: {result.get('error')}")
            
    except Exception as e:
        print(f"❌ Test failed: {e}")

if __name__ == "__main__":
    test_improved_filtering()
