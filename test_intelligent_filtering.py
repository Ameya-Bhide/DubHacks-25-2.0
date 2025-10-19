#!/usr/bin/env python3
"""
Test to verify intelligent document filtering is working
"""

import requests
import json

def test_intelligent_filtering():
    """Test that the system properly filters documents by relevance"""
    print("🧪 Testing Intelligent Document Filtering")
    print("=" * 60)
    
    # Test cases for different scenarios
    test_cases = [
        {
            "name": "MLE Flashcards Request",
            "tool": "flashcards",
            "query": "MLE questions from the section exercise",
            "expected_keywords": ["MLE", "section", "exercise", "question"]
        },
        {
            "name": "Stroop Effect Summary",
            "tool": "summaries", 
            "query": "Stroop effect and cognitive processing",
            "expected_keywords": ["Stroop", "cognitive", "processing"]
        },
        {
            "name": "FastSHAP Practice Questions",
            "tool": "practice-questions",
            "query": "FastSHAP optimization techniques",
            "expected_keywords": ["FastSHAP", "optimization", "technique"]
        }
    ]
    
    for test_case in test_cases:
        print(f"\n📋 Testing: {test_case['name']}")
        print(f"🔍 Tool: {test_case['tool']}")
        print(f"📝 Query: {test_case['query']}")
        
        # Map tool names to correct actions
        action_map = {
            'flashcards': 'getFlashCards',
            'summaries': 'getSummary', 
            'practice-questions': 'getQuestions',
            'search': 'search'
        }
        
        # Simulate what the app would send
        ai_url = "http://localhost:3000/api/ai-tools"
        ai_data = {
            "action": action_map.get(test_case['tool'], 'getSummary'),
            "notesContent": f"=== Test Document ===\nThis is a test document for {test_case['query']}\n\n=== MLE Worksheet ===\nMaximum Likelihood Estimation problems and solutions\n\n=== Stroop Test ===\nCognitive processing and attention tests\n\n=== FastSHAP Paper ===\nOptimization techniques for Shapley values",
            "query": test_case['query']
        }
        
        # Add tool-specific parameters
        if test_case['tool'] == 'flashcards':
            ai_data['numCards'] = 5
        elif test_case['tool'] == 'practice-questions':
            ai_data['numQuestions'] = 3
        
        try:
            response = requests.post(ai_url, json=ai_data)
            result = response.json()
            
            if result.get("success"):
                ai_reply = result.get("reply", "")
                print(f"✅ AI generation successful!")
                print(f"📝 Response length: {len(ai_reply)}")
                
                # Check if response contains expected keywords
                found_keywords = []
                for keyword in test_case['expected_keywords']:
                    if keyword.lower() in ai_reply.lower():
                        found_keywords.append(keyword)
                
                print(f"🔍 Found keywords: {found_keywords}")
                
                if len(found_keywords) >= 2:
                    print("🎉 SUCCESS: AI is focusing on relevant content!")
                else:
                    print("⚠️ WARNING: AI may not be focusing on the right content")
                    
            else:
                print(f"❌ AI generation failed: {result.get('error')}")
                
        except Exception as e:
            print(f"❌ Test failed: {e}")
        
        print("-" * 40)

if __name__ == "__main__":
    test_intelligent_filtering()
