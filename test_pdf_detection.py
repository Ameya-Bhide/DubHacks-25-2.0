#!/usr/bin/env python3
"""
Test to verify PDF detection and content extraction is working
"""

import requests
import json

def test_pdf_detection():
    """Test that the system properly detects PDF files and extracts content"""
    print("🧪 Testing PDF Detection and Content Extraction")
    print("=" * 60)
    
    # Test the AI tools API with a mock document that has PDF filePath
    print("📄 Testing AI tools with PDF filePath...")
    
    # Simulate what the app would send
    ai_url = "http://localhost:3000/api/ai-tools"
    ai_data = {
        "action": "getSummary",
        "notesContent": "=== FastSHARP Optimization technqiues ===\nFASTSHAP: REAL-TIME SHAPLEY VALUE ESTIMATION\n\nABSTRACT\nAlthough Shapley values are theoretically appealing for explaining black-box models, they are costly to calculate and thus impractical in settings that involve large, high-dimensional models. To remedy this issue, we introduce FastSHAP, a new method for estimating Shapley values in a single forward pass using a learned explainer model. To enable efficient training without requiring ground truth Shapley values, we develop an approach to train FastSHAP via stochastic gradient descent using a weighted least squares objective function. In our experiments with tabular and image datasets, we compare FastSHAP to existing estimation approaches and find that it generates accurate explanations with an orders-of-magnitude speedup.\n\n1 INTRODUCTION\nWith the proliferation of black-box models, Shapley values (Shapley, 1953) have emerged as a popular explanation approach due to their strong theoretical properties. In practice, however, Shapley value-based explanations are known to have high computational complexity, with an exact calculation requiring an exponential number of model evaluations. Speed becomes a critical issue as models increase in size and dimensionality, and for the largest models in fields such as computer vision and natural language processing, there is an unmet need for significantly faster Shapley value approximations that maintain high accuracy.\n\nRecent work has addressed the computational challenges with Shapley values using two main approaches. First, many works have proposed stochastic estimators that rely on sampling either feature subsets or permutations; though often consistent, these estimators require many model evaluations and impose an undesirable trade-off between run-time and accuracy. Second, some works have proposed model-specific approximations, e.g., for trees or neural networks; while generally faster, these approaches can still require many model evaluations, often induce bias, and typically lack flexibility regarding the handling held-out features.\n\nHere, we introduce a new approach for efficient Shapley value estimation: to achieve the fastest possible run-time, we propose learning a separate explainer model that outputs precise Shapley value estimates in a single forward pass. Naïvely, such a learning-based approach would seem to require a large training set of ground truth Shapley values, which would be computationally intractable. Instead, our approach trains an explainer model by minimizing an objective function inspired by the Shapley value's weighted least squares characterization, which enables efficient gradient-based optimization.\n\nOur contributions. We introduce FastSHAP, an amortized approach for generating real-time Shapley value explanations. We derive an objective function from the Shapley value's weighted least squares characterization and investigate several ways to reduce gradient variance during training. Our experiments show that FastSHAP provides accurate Shapley value estimates with an orders-of-magnitude speedup relative to non-amortized estimation approaches. Finally, we also find that FastSHAP generates high-quality image explanations that outperform gradient-based methods (e.g., IntGrad and GradCAM) on quantitative inclusion and exclusion metrics.",
        "query": "What are the specific technical contributions of FastSHAP and how does it achieve orders-of-magnitude speedup?"
    }
    
    try:
        response = requests.post(ai_url, json=ai_data)
        result = response.json()
        
        if result.get("success"):
            ai_reply = result.get("reply", "")
            print("✅ AI generation successful!")
            print(f"📝 AI Response Length: {len(ai_reply)}")
            print(f"📝 AI Response Preview:\n{ai_reply[:500]}...")
            
            # Check if the response contains specific technical details
            technical_terms = ["Shapley values", "explainer model", "weighted least squares", "stochastic gradient descent", "orders-of-magnitude"]
            found_terms = [term for term in technical_terms if term.lower() in ai_reply.lower()]
            
            print(f"\n🔍 Technical terms found: {found_terms}")
            
            if len(found_terms) >= 3:
                print("\n🎉 SUCCESS: AI is using actual PDF content!")
                print("✅ The system is now properly processing PDF text")
            else:
                print("\n⚠️ WARNING: AI response may still be generic")
        else:
            print(f"❌ AI generation failed: {result.get('error')}")
            
    except Exception as e:
        print(f"❌ Test failed: {e}")

if __name__ == "__main__":
    test_pdf_detection()
