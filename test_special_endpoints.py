#!/usr/bin/env python3
"""
Test AI recommendations and Google OAuth endpoints
"""

import httpx
import json
import asyncio

BASE_URL = "https://startup-connect-53.preview.emergentagent.com"
API_BASE = f"{BASE_URL}/api"

async def test_ai_and_oauth():
    client = httpx.AsyncClient(timeout=30.0)
    
    try:
        # First, get a valid token
        login_response = await client.post(
            f"{API_BASE}/auth/login",
            json={"email": "newuser@test.com", "password": "test123"}
        )
        
        if login_response.status_code == 200:
            login_data = login_response.json()
            token = login_data.get("access_token")
            headers = {"Authorization": f"Bearer {token}"}
            
            # Test AI recommendations
            print("🤖 Testing AI Recommendations...")
            ai_response = await client.get(f"{API_BASE}/ai/recommendations", headers=headers)
            print(f"   Status: {ai_response.status_code}")
            
            if ai_response.status_code == 200:
                ai_data = ai_response.json()
                print(f"   ✅ AI Recommendations: {len(ai_data)} recommendations")
                if ai_data:
                    print(f"   Sample recommendation: {ai_data[0].get('user_name')} (Score: {ai_data[0].get('match_score')}) - {ai_data[0].get('match_reason')}")
            else:
                print(f"   ❌ AI Recommendations failed: {ai_response.json()}")
        else:
            print(f"❌ Login failed: {login_response.json()}")
            
        # Test Google OAuth endpoint (session exchange)
        print("\n🔐 Testing Google OAuth Session Exchange...")
        
        # This tests the endpoint structure but we can't test full OAuth flow without browser
        oauth_response = await client.post(
            f"{API_BASE}/auth/session",
            json={"session_id": "test_session_id"}
        )
        print(f"   Status: {oauth_response.status_code}")
        
        if oauth_response.status_code == 401:
            oauth_data = oauth_response.json()
            if "Invalid session" in oauth_data.get("detail", ""):
                print("   ✅ OAuth endpoint working (correctly rejects invalid session)")
            else:
                print(f"   ⚠️  Unexpected error: {oauth_data}")
        elif oauth_response.status_code == 400:
            print("   ✅ OAuth endpoint working (requires valid session_id)")
        else:
            print(f"   ❌ Unexpected response: {oauth_response.json()}")
            
    finally:
        await client.aclose()

if __name__ == "__main__":
    asyncio.run(test_ai_and_oauth())