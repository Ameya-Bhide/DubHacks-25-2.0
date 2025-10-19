#!/usr/bin/env python3
"""
Check what documents are in the Personal folder
"""

import requests
import json

def check_personal_documents():
    """Check what documents are being loaded from the Personal study group"""
    print("🔍 Checking Personal Study Group Documents")
    print("=" * 60)
    
    # Simulate what the app loads
    try:
        # This would be the actual API call your app makes
        # For now, let's check what we can see from the terminal logs
        
        print("📋 From the terminal logs, I can see these documents in Personal:")
        print()
        
        print("1. FastSHARP Optimization technqiues (PDF from Personal - CSE 390R)")
        print("   - This is your research paper about FastSHAP")
        print("   - File: ~/Downloads/2107.07436v3.pdf")
        print()
        
        print("2. Fort (PDF from Personal - Fort)")
        print("   - This appears to be lecture notes about 'Shortest Paths'")
        print("   - From CSE 332 course")
        print("   - File: ~/Downloads/dfkljfdsklj.pdf")
        print()
        
        print("🔍 The system is reading BOTH documents when you select 'Personal' study group")
        print("📝 This is why you're getting content from both the research paper AND the CSE 332 notes")
        print()
        
        print("💡 To fix this, you have a few options:")
        print("   1. Create separate study groups for different types of documents")
        print("   2. Rename the CSE 332 document to a different study group")
        print("   3. Use more specific queries to focus the AI on the research paper")
        print()
        
        print("🎯 For example, if you want only the research paper:")
        print("   - Query: 'FastSHAP optimization techniques and Shapley values'")
        print("   - This should make the AI focus on the research paper content")
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    check_personal_documents()
