#!/usr/bin/env python3
"""
Test to verify comprehensive content compilation is working
"""

import requests
import json

def test_comprehensive_content():
    """Test that the system compiles all content and lets AI choose what's relevant"""
    print("🧪 Testing Comprehensive Content Compilation")
    print("=" * 60)
    
    # Test with mixed content (PDFs and text files)
    comprehensive_content = """=== FastSHAP Optimization technqiues (PDF from AI Study Group - CSE 142) ===
FASTSHAP: REAL-TIME SHAPLEY VALUE ESTIMATION

ABSTRACT
Although Shapley values are theoretically appealing for explaining black-box models, they are costly to calculate and thus impractical in settings that involve large, high-dimensional models. To remedy this issue, we introduce FastSHAP, a new method for estimating Shapley values in a single forward pass using a learned explainer model. To enable efficient training without requiring ground truth Shapley values, we develop an approach to train FastSHAP via stochastic gradient descent using a weighted least squares objective function. In our experiments with tabular and image datasets, we compare FastSHAP to existing estimation approaches and find that it generates accurate explanations with an orders-of-magnitude speedup.

1 INTRODUCTION
With the proliferation of black-box models, Shapley values (Shapley, 1953) have emerged as a popular explanation approach due to their strong theoretical properties. In practice, however, Shapley value-based explanations are known to have high computational complexity, with an exact calculation requiring an exponential number of model evaluations. Speed becomes a critical issue as models increase in size and dimensionality, and for the largest models in fields such as computer vision and natural language processing, there is an unmet need for significantly faster Shapley value approximations that maintain high accuracy.

=== MLE Worksheet (Text from Statistics Study Group - STAT 101) ===
Maximum Likelihood Estimation problems and solutions

Problem 1: Find the MLE for the parameter θ of a Bernoulli distribution.
Solution: The MLE is the sample proportion.

Problem 2: Derive the MLE for the mean and variance of a normal distribution.
Solution: The MLE for the mean is the sample mean, and for the variance is the sample variance.

Problem 3: Find the MLE for the rate parameter λ of an exponential distribution.
Solution: The MLE is the reciprocal of the sample mean.

=== Stroop Test (Text from Psychology Study Group - PSYC 200) ===
Cognitive processing and attention tests

The Stroop effect is a phenomenon in which people have difficulty naming the color of a word when the word itself is the name of a different color. This demonstrates the brain's automatic processing of written words versus the more controlled processing required to name colors.

=== Downloaded from Mustafa Macaws - asdfasdfasdf (Text from Random Group - UNKNOWN) ===
Downloaded from Mustafa Macaws - asdfasdfasdf

This is just random content that should be ignored by the AI when focusing on relevant topics.

=== Section Exercise (Text from Statistics Study Group - STAT 101) ===
Practice problems for MLE concepts

Exercise 1: Calculate the MLE for a Poisson distribution.
Exercise 2: Find the MLE for the shape and scale parameters of a gamma distribution.
Exercise 3: Derive the MLE for a uniform distribution on [0, θ]."""
    
    test_cases = [
        {
            "name": "MLE Focused Query",
            "tool": "flashcards",
            "query": "MLE questions from the section exercise",
            "expected_keywords": ["MLE", "maximum likelihood", "estimation", "parameter", "sample"]
        },
        {
            "name": "FastSHAP Focused Query", 
            "tool": "summaries",
            "query": "FastSHAP optimization techniques and improvements",
            "expected_keywords": ["FastSHAP", "Shapley", "optimization", "explainer", "speedup"]
        },
        {
            "name": "Stroop Effect Query",
            "tool": "practice-questions", 
            "query": "Stroop effect and cognitive processing",
            "expected_keywords": ["Stroop", "cognitive", "attention", "processing", "automatic"]
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
            "notesContent": comprehensive_content,
            "query": f"{test_case['query']}. Please focus on the most relevant content from the provided documents."
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
                print(f"📝 Response preview:\n{ai_reply[:200]}...")
                
                # Check if response contains expected keywords
                found_keywords = []
                for keyword in test_case['expected_keywords']:
                    if keyword.lower() in ai_reply.lower():
                        found_keywords.append(keyword)
                
                print(f"\n🔍 Expected keywords found: {found_keywords}")
                
                if len(found_keywords) >= 3:
                    print("🎉 SUCCESS: AI is focusing on the right content!")
                    print("✅ Comprehensive content compilation is working")
                else:
                    print("⚠️ WARNING: AI may not be focusing on the expected content")
                    
            else:
                print(f"❌ AI generation failed: {result.get('error')}")
                
        except Exception as e:
            print(f"❌ Test failed: {e}")
        
        print("-" * 40)

if __name__ == "__main__":
    test_comprehensive_content()
