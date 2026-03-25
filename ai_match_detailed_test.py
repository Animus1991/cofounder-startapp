#!/usr/bin/env python3
"""
Detailed AI Matching Engine Test
Tests the specific endpoint with detailed output
"""

import requests
import json
import sys

# Configuration
BASE_URL = "https://startup-connect-53.preview.emergentagent.com/api"
TEST_EMAIL = "sarah@cofounderbay.com"
TEST_PASSWORD = "Demo1234!"

def test_ai_matching_detailed():
    """Test AI matching with detailed output"""
    session = requests.Session()
    
    # Login first
    print("🔐 Logging in...")
    login_data = {
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD
    }
    
    response = session.post(f"{BASE_URL}/auth/login", json=login_data)
    if response.status_code != 200:
        print(f"❌ Login failed: {response.status_code}")
        return False
    
    data = response.json()
    auth_token = data["access_token"]
    user_data = data["user"]
    
    session.headers.update({
        "Authorization": f"Bearer {auth_token}"
    })
    
    print(f"✅ Logged in as {user_data['name']} ({user_data['email']})")
    print()
    
    # Test AI matching endpoint
    print("🤖 Testing AI Matching Engine with detailed output...")
    
    match_request = {
        "min_score": 40,
        "limit": 10
    }
    
    response = session.post(f"{BASE_URL}/ai-matches", json=match_request)
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ AI Matching successful!")
        print(f"📊 Total matches: {data.get('total', 'N/A')}")
        print(f"🎯 Filters applied: {data.get('filters_applied', {})}")
        print()
        
        matches = data.get("matches", [])
        
        if matches:
            print("🎯 MATCH DETAILS:")
            print("=" * 80)
            
            for i, match in enumerate(matches[:3], 1):  # Show first 3 matches
                print(f"\n🔍 MATCH #{i}")
                print(f"   Name: {match.get('name', 'N/A')}")
                print(f"   Roles: {', '.join(match.get('roles', []))}")
                print(f"   Headline: {match.get('headline', 'N/A')}")
                print(f"   Location: {match.get('location', 'N/A')}")
                print(f"   Match Score: {match.get('match_score', 0)}%")
                print(f"   Skills: {', '.join(match.get('skills', []))}")
                print(f"   Sectors: {', '.join(match.get('sectors', []))}")
                print(f"   Match Reasons: {', '.join(match.get('match_reasons', []))}")
                print(f"   Complementary Skills: {', '.join(match.get('complementary_skills', []))}")
                print(f"   Shared Interests: {', '.join(match.get('shared_interests', []))}")
                
                # AI Insights
                if match.get('collaboration_potential'):
                    print(f"   🤝 Collaboration Potential: {match.get('collaboration_potential')}")
                
                if match.get('ai_insights'):
                    print(f"   🧠 AI Insights: {match.get('ai_insights')}")
                
                print("-" * 80)
            
            if len(matches) > 3:
                print(f"\n... and {len(matches) - 3} more matches")
        else:
            print("ℹ️  No matches found with the specified criteria")
        
        # Test response structure
        print("\n🔍 RESPONSE STRUCTURE VALIDATION:")
        required_fields = ["matches", "total", "filters_applied"]
        for field in required_fields:
            if field in data:
                print(f"   ✅ {field}: Present")
            else:
                print(f"   ❌ {field}: Missing")
        
        if matches:
            match_required = ["user_id", "name", "roles", "match_score", "match_reasons", "complementary_skills", "shared_interests"]
            match_optional = ["ai_insights", "collaboration_potential"]
            
            print("\n   Match Structure:")
            for field in match_required:
                if field in matches[0]:
                    print(f"     ✅ {field}: Present (required)")
                else:
                    print(f"     ❌ {field}: Missing (required)")
            
            for field in match_optional:
                if field in matches[0] and matches[0][field]:
                    print(f"     ✅ {field}: Present and populated (optional)")
                elif field in matches[0]:
                    print(f"     ⚠️  {field}: Present but empty (optional)")
                else:
                    print(f"     ❌ {field}: Missing (optional)")
        
        return True
    else:
        print(f"❌ AI Matching failed: HTTP {response.status_code}")
        print(f"Response: {response.text}")
        return False

if __name__ == "__main__":
    success = test_ai_matching_detailed()
    sys.exit(0 if success else 1)