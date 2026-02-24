#!/usr/bin/env python3
"""
Debug specific user flows and test the exact API calls requested
"""

import httpx
import json
import asyncio

BASE_URL = "https://startup-connect-53.preview.emergentagent.com"
API_BASE = f"{BASE_URL}/api"

async def test_requested_flows():
    """Test the exact flows requested in the review"""
    
    client = httpx.AsyncClient(timeout=30.0)
    
    print("🔍 Testing Requested API Flows")
    print("=" * 50)
    
    try:
        # 1. User Registration
        print("1. Testing User Registration...")
        reg_response = await client.post(
            f"{API_BASE}/auth/register",
            json={"email": "newuser@test.com", "password": "test123", "name": "Test User", "role": "founder"}
        )
        print(f"   Status: {reg_response.status_code}")
        if reg_response.status_code in [200, 201]:
            reg_data = reg_response.json()
            token = reg_data.get("access_token")
            user_id = reg_data.get("user", {}).get("user_id")
            print(f"   ✅ Success - Token: {token[:20] if token else 'None'}...")
            print(f"   ✅ User ID: {user_id}")
        elif reg_response.status_code == 400 and "already registered" in reg_response.json().get("detail", ""):
            print("   ⚠️  User already exists, trying login...")
            # 2. User Login
            login_response = await client.post(
                f"{API_BASE}/auth/login",
                json={"email": "newuser@test.com", "password": "test123"}
            )
            print(f"   Login Status: {login_response.status_code}")
            if login_response.status_code == 200:
                login_data = login_response.json()
                token = login_data.get("access_token")
                user_id = login_data.get("user", {}).get("user_id")
                print(f"   ✅ Login Success - Token: {token[:20] if token else 'None'}...")
                print(f"   ✅ User ID: {user_id}")
            else:
                print(f"   ❌ Login failed: {login_response.json()}")
                return
        else:
            print(f"   ❌ Registration failed: {reg_response.json()}")
            return
            
        # Continue with authenticated requests
        headers = {"Authorization": f"Bearer {token}"}
        
        # 3. Get User Profile
        print("\n3. Testing Get User Profile...")
        profile_response = await client.get(f"{API_BASE}/auth/me", headers=headers)
        print(f"   Status: {profile_response.status_code}")
        if profile_response.status_code == 200:
            profile_data = profile_response.json()
            print(f"   ✅ Profile: {profile_data.get('name')} ({profile_data.get('role')})")
            print(f"   ✅ Email: {profile_data.get('email')}")
        else:
            print(f"   ❌ Failed: {profile_response.json()}")
            
        # 4. Update Profile
        print("\n4. Testing Update Profile...")
        update_response = await client.put(
            f"{API_BASE}/users/profile",
            json={
                "headline": "Test Founder",
                "bio": "Building something great", 
                "skills": ["Product", "Marketing"]
            },
            headers=headers
        )
        print(f"   Status: {update_response.status_code}")
        if update_response.status_code == 200:
            updated_data = update_response.json()
            print(f"   ✅ Updated: {updated_data.get('headline')}")
        else:
            print(f"   ❌ Failed: {update_response.json()}")
            
        # 5. Create Post
        print("\n5. Testing Create Post...")
        post_response = await client.post(
            f"{API_BASE}/posts",
            json={
                "content": "Hello startup world!",
                "tags": ["startup", "intro"]
            },
            headers=headers
        )
        print(f"   Status: {post_response.status_code}")
        if post_response.status_code in [200, 201]:
            post_data = post_response.json()
            post_id = post_data.get("post_id")
            print(f"   ✅ Created Post: {post_id}")
        else:
            print(f"   ❌ Failed: {post_response.json()}")
            post_id = None
            
        # 6. Get Posts
        print("\n6. Testing Get Posts...")
        posts_response = await client.get(f"{API_BASE}/posts")
        print(f"   Status: {posts_response.status_code}")
        if posts_response.status_code == 200:
            posts_data = posts_response.json()
            print(f"   ✅ Retrieved {len(posts_data)} posts")
        else:
            print(f"   ❌ Failed: {posts_response.json()}")
            
        # 7 & 8. Like and Comment (if we have a post)
        if post_id:
            print(f"\n7. Testing Like Post {post_id}...")
            like_response = await client.post(f"{API_BASE}/posts/{post_id}/like", headers=headers)
            print(f"   Status: {like_response.status_code}")
            if like_response.status_code == 200:
                like_data = like_response.json()
                print(f"   ✅ Like status: {like_data.get('liked')}")
            else:
                print(f"   ❌ Failed: {like_response.json()}")
                
            print(f"\n8. Testing Comment on Post {post_id}...")
            comment_response = await client.post(
                f"{API_BASE}/posts/{post_id}/comment",
                json={"content": "Great post!"},
                headers=headers
            )
            print(f"   Status: {comment_response.status_code}")
            if comment_response.status_code in [200, 201]:
                comment_data = comment_response.json()
                print(f"   ✅ Comment created: {comment_data.get('comment_id')}")
            else:
                print(f"   ❌ Failed: {comment_response.json()}")
                
        # 9. Get Discovery
        print("\n9. Testing Get Discovery...")
        discover_response = await client.get(f"{API_BASE}/discover", headers=headers)
        print(f"   Status: {discover_response.status_code}")
        if discover_response.status_code == 200:
            discover_data = discover_response.json()
            print(f"   ✅ Found {len(discover_data)} potential connections")
            target_user_id = discover_data[0].get("user_id") if discover_data else None
        else:
            print(f"   ❌ Failed: {discover_response.json()}")
            target_user_id = None
            
        # 10. Send Connection Request (if we have a target)
        if target_user_id:
            print(f"\n10. Testing Connection Request to {target_user_id}...")
            conn_response = await client.post(
                f"{API_BASE}/connections/request",
                json={"target_user_id": target_user_id},
                headers=headers
            )
            print(f"    Status: {conn_response.status_code}")
            if conn_response.status_code in [200, 201]:
                conn_data = conn_response.json()
                print(f"    ✅ Connection request: {conn_data.get('connection_id')}")
            elif conn_response.status_code == 400:
                conn_data = conn_response.json()
                if "already exists" in conn_data.get("detail", ""):
                    print("    ⚠️  Connection already exists")
                else:
                    print(f"    ❌ Failed: {conn_data}")
            else:
                print(f"    ❌ Failed: {conn_response.json()}")
                
        # 11. Get Connections
        print("\n11. Testing Get Connections...")
        connections_response = await client.get(f"{API_BASE}/connections", headers=headers)
        print(f"    Status: {connections_response.status_code}")
        if connections_response.status_code == 200:
            connections_data = connections_response.json()
            print(f"    ✅ Found {len(connections_data)} connections")
        else:
            print(f"    ❌ Failed: {connections_response.json()}")
            
        # 12 & 13. Send Message and Get Conversations (if we have a target)
        if target_user_id:
            print(f"\n12. Testing Send Message to {target_user_id}...")
            message_response = await client.post(
                f"{API_BASE}/messages",
                json={"receiver_id": target_user_id, "content": "Hello!"},
                headers=headers
            )
            print(f"    Status: {message_response.status_code}")
            if message_response.status_code in [200, 201]:
                message_data = message_response.json()
                print(f"    ✅ Message sent: {message_data.get('message_id')}")
            else:
                print(f"    ❌ Failed: {message_response.json()}")
                
        print("\n13. Testing Get Conversations...")
        conversations_response = await client.get(f"{API_BASE}/conversations", headers=headers)
        print(f"    Status: {conversations_response.status_code}")
        if conversations_response.status_code == 200:
            conversations_data = conversations_response.json()
            print(f"    ✅ Found {len(conversations_data)} conversations")
        else:
            print(f"    ❌ Failed: {conversations_response.json()}")
            
    finally:
        await client.aclose()

if __name__ == "__main__":
    asyncio.run(test_requested_flows())