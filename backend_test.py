#!/usr/bin/env python3
"""
CoFounder Connect Backend API Test Suite
Tests all major backend functionality including auth, posts, connections, and messaging
"""

import httpx
import json
import asyncio
from datetime import datetime
import uuid

# Configuration
BASE_URL = "https://startup-connect-53.preview.emergentagent.com"
API_BASE = f"{BASE_URL}/api"

# Test data - using the exact test user from the request
TEST_USERS = [
    {
        "email": "testfounderr@cofounderbay.com",
        "password": "Test1234!",
        "name": "Test Founder",
        "role": "founder"
    },
    {
        "email": "mike.investor@venture.com", 
        "password": "InvestorPass456!",
        "name": "Mike Rodriguez",
        "role": "investor"
    }
]

class BackendTester:
    def __init__(self):
        self.client = httpx.AsyncClient(timeout=30.0)
        self.tokens = {}
        self.user_data = {}
        self.test_results = []
        
    async def __aenter__(self):
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.client.aclose()

    def log_result(self, test_name: str, success: bool, details: str = "", response_data: dict = None):
        """Log test result"""
        result = {
            "test": test_name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat(),
            "response_data": response_data
        }
        self.test_results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} - {test_name}: {details}")
        if response_data and not success:
            print(f"  Response: {json.dumps(response_data, indent=2)}")

    async def test_registration(self, user_data: dict) -> bool:
        """Test user registration"""
        try:
            response = await self.client.post(
                f"{API_BASE}/auth/register",
                json=user_data,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 201 or response.status_code == 200:
                data = response.json()
                if "access_token" in data and "user" in data:
                    self.tokens[user_data["email"]] = data["access_token"]
                    self.user_data[user_data["email"]] = data["user"]
                    self.log_result(
                        f"Registration ({user_data['name']})",
                        True,
                        f"User registered successfully with ID: {data['user']['user_id']}"
                    )
                    return True
                else:
                    self.log_result(
                        f"Registration ({user_data['name']})",
                        False,
                        "Missing access_token or user in response",
                        data
                    )
                    return False
            elif response.status_code == 400:
                # User might already exist
                data = response.json()
                if "already registered" in data.get("detail", ""):
                    self.log_result(
                        f"Registration ({user_data['name']})",
                        True,
                        "User already exists (acceptable for testing)"
                    )
                    return True
                else:
                    self.log_result(
                        f"Registration ({user_data['name']})",
                        False,
                        f"Registration failed: {data.get('detail', 'Unknown error')}",
                        data
                    )
                    return False
            else:
                data = response.json() if response.headers.get("content-type", "").startswith("application/json") else {"error": response.text}
                self.log_result(
                    f"Registration ({user_data['name']})",
                    False,
                    f"HTTP {response.status_code}: {data.get('detail', 'Registration failed')}",
                    data
                )
                return False
                
        except Exception as e:
            self.log_result(
                f"Registration ({user_data['name']})",
                False,
                f"Exception: {str(e)}"
            )
            return False

    async def test_login(self, email: str, password: str) -> bool:
        """Test user login"""
        try:
            response = await self.client.post(
                f"{API_BASE}/auth/login",
                json={"email": email, "password": password},
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                data = response.json()
                if "access_token" in data and "user" in data:
                    self.tokens[email] = data["access_token"]
                    self.user_data[email] = data["user"]
                    self.log_result(
                        f"Login ({email})",
                        True,
                        f"Login successful, token: {data['access_token'][:20]}..."
                    )
                    return True
                else:
                    self.log_result(
                        f"Login ({email})",
                        False,
                        "Missing access_token or user in response",
                        data
                    )
                    return False
            else:
                data = response.json() if response.headers.get("content-type", "").startswith("application/json") else {"error": response.text}
                self.log_result(
                    f"Login ({email})",
                    False,
                    f"HTTP {response.status_code}: {data.get('detail', 'Login failed')}",
                    data
                )
                return False
                
        except Exception as e:
            self.log_result(
                f"Login ({email})",
                False,
                f"Exception: {str(e)}"
            )
            return False

    async def test_get_profile(self, email: str) -> bool:
        """Test get user profile"""
        if email not in self.tokens:
            self.log_result(f"Get Profile ({email})", False, "No token available")
            return False
            
        try:
            response = await self.client.get(
                f"{API_BASE}/auth/me",
                headers={"Authorization": f"Bearer {self.tokens[email]}"}
            )
            
            if response.status_code == 200:
                data = response.json()
                if "user_id" in data and "email" in data:
                    roles = data.get('roles', [])
                    role_str = roles[0] if roles else 'no role'
                    self.log_result(
                        f"Get Profile ({email})",
                        True,
                        f"Profile retrieved: {data['name']} ({role_str})"
                    )
                    return True
                else:
                    self.log_result(
                        f"Get Profile ({email})",
                        False,
                        "Invalid profile data structure",
                        data
                    )
                    return False
            else:
                data = response.json() if response.headers.get("content-type", "").startswith("application/json") else {"error": response.text}
                self.log_result(
                    f"Get Profile ({email})",
                    False,
                    f"HTTP {response.status_code}: {data.get('detail', 'Profile fetch failed')}",
                    data
                )
                return False
                
        except Exception as e:
            self.log_result(
                f"Get Profile ({email})",
                False,
                f"Exception: {str(e)}"
            )
            return False

    async def test_update_profile(self, email: str) -> bool:
        """Test update user profile"""
        if email not in self.tokens:
            self.log_result(f"Update Profile ({email})", False, "No token available")
            return False
            
        update_data = {
            "headline": "Building the future of startup collaboration",
            "bio": "Passionate entrepreneur focused on connecting innovative minds in the startup ecosystem",
            "skills": ["Product Management", "Strategic Partnerships", "Fundraising"],
            "interests": ["AI/ML", "FinTech", "Sustainability"],
            "location": "San Francisco, CA"
        }
        
        try:
            response = await self.client.put(
                f"{API_BASE}/users/profile",
                json=update_data,
                headers={
                    "Authorization": f"Bearer {self.tokens[email]}",
                    "Content-Type": "application/json"
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get("headline") == update_data["headline"]:
                    self.log_result(
                        f"Update Profile ({email})",
                        True,
                        f"Profile updated successfully: {data.get('headline')}"
                    )
                    return True
                else:
                    self.log_result(
                        f"Update Profile ({email})",
                        False,
                        "Profile update didn't reflect changes",
                        data
                    )
                    return False
            else:
                data = response.json() if response.headers.get("content-type", "").startswith("application/json") else {"error": response.text}
                self.log_result(
                    f"Update Profile ({email})",
                    False,
                    f"HTTP {response.status_code}: {data.get('detail', 'Profile update failed')}",
                    data
                )
                return False
                
        except Exception as e:
            self.log_result(
                f"Update Profile ({email})",
                False,
                f"Exception: {str(e)}"
            )
            return False

    async def test_create_post(self, email: str) -> str:
        """Test create post and return post_id"""
        if email not in self.tokens:
            self.log_result(f"Create Post ({email})", False, "No token available")
            return None
            
        post_data = {
            "content": "🚀 Excited to launch our new startup platform! Looking for co-founders who share the vision of revolutionizing how entrepreneurs connect and collaborate. #startup #cofounder #innovation",
            "tags": ["startup", "cofounder", "innovation", "networking"]
        }
        
        try:
            response = await self.client.post(
                f"{API_BASE}/posts",
                json=post_data,
                headers={
                    "Authorization": f"Bearer {self.tokens[email]}",
                    "Content-Type": "application/json"
                }
            )
            
            if response.status_code == 200 or response.status_code == 201:
                data = response.json()
                if "post_id" in data:
                    self.log_result(
                        f"Create Post ({email})",
                        True,
                        f"Post created successfully: {data['post_id']}"
                    )
                    return data["post_id"]
                else:
                    self.log_result(
                        f"Create Post ({email})",
                        False,
                        "Missing post_id in response",
                        data
                    )
                    return None
            else:
                data = response.json() if response.headers.get("content-type", "").startswith("application/json") else {"error": response.text}
                self.log_result(
                    f"Create Post ({email})",
                    False,
                    f"HTTP {response.status_code}: {data.get('detail', 'Post creation failed')}",
                    data
                )
                return None
                
        except Exception as e:
            self.log_result(
                f"Create Post ({email})",
                False,
                f"Exception: {str(e)}"
            )
            return None

    async def test_get_posts(self, email: str = None) -> bool:
        """Test get posts feed"""
        headers = {}
        if email and email in self.tokens:
            headers["Authorization"] = f"Bearer {self.tokens[email]}"
            
        try:
            response = await self.client.get(
                f"{API_BASE}/posts",
                headers=headers
            )
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_result(
                        "Get Posts",
                        True,
                        f"Retrieved {len(data)} posts successfully"
                    )
                    return True
                else:
                    self.log_result(
                        "Get Posts",
                        False,
                        "Response is not a list of posts",
                        data
                    )
                    return False
            else:
                data = response.json() if response.headers.get("content-type", "").startswith("application/json") else {"error": response.text}
                self.log_result(
                    "Get Posts",
                    False,
                    f"HTTP {response.status_code}: {data.get('detail', 'Get posts failed')}",
                    data
                )
                return False
                
        except Exception as e:
            self.log_result(
                "Get Posts",
                False,
                f"Exception: {str(e)}"
            )
            return False

    async def test_like_post(self, email: str, post_id: str) -> bool:
        """Test react to post"""
        if email not in self.tokens or not post_id:
            self.log_result(f"React Post ({email})", False, "No token available or post_id missing")
            return False
            
        try:
            response = await self.client.post(
                f"{API_BASE}/posts/{post_id}/react",
                json={"type": "like"},
                headers={
                    "Authorization": f"Bearer {self.tokens[email]}",
                    "Content-Type": "application/json"
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                self.log_result(
                    f"React Post ({email})",
                    True,
                    f"Post reaction added successfully"
                )
                return True
            else:
                data = response.json() if response.headers.get("content-type", "").startswith("application/json") else {"error": response.text}
                self.log_result(
                    f"React Post ({email})",
                    False,
                    f"HTTP {response.status_code}: {data.get('detail', 'React post failed')}",
                    data
                )
                return False
                
        except Exception as e:
            self.log_result(
                f"React Post ({email})",
                False,
                f"Exception: {str(e)}"
            )
            return False

    async def test_comment_post(self, email: str, post_id: str) -> bool:
        """Test add comment to post"""
        if email not in self.tokens or not post_id:
            self.log_result(f"Comment Post ({email})", False, "No token available or post_id missing")
            return False
            
        comment_data = {
            "content": "Great initiative! I'd love to learn more about your vision and how we can collaborate. The startup ecosystem needs more platforms like this! 🎯"
        }
        
        try:
            response = await self.client.post(
                f"{API_BASE}/posts/{post_id}/comments",
                json=comment_data,
                headers={
                    "Authorization": f"Bearer {self.tokens[email]}",
                    "Content-Type": "application/json"
                }
            )
            
            if response.status_code == 200 or response.status_code == 201:
                data = response.json()
                if "comment_id" in data:
                    self.log_result(
                        f"Comment Post ({email})",
                        True,
                        f"Comment added successfully: {data['comment_id']}"
                    )
                    return True
                else:
                    self.log_result(
                        f"Comment Post ({email})",
                        False,
                        "Missing comment_id in response",
                        data
                    )
                    return False
            else:
                data = response.json() if response.headers.get("content-type", "").startswith("application/json") else {"error": response.text}
                self.log_result(
                    f"Comment Post ({email})",
                    False,
                    f"HTTP {response.status_code}: {data.get('detail', 'Comment post failed')}",
                    data
                )
                return False
                
        except Exception as e:
            self.log_result(
                f"Comment Post ({email})",
                False,
                f"Exception: {str(e)}"
            )
            return False

    async def test_discovery(self, email: str) -> bool:
        """Test user discovery with role filters"""
        if email not in self.tokens:
            self.log_result(f"User Discovery ({email})", False, "No token available")
            return False
            
        try:
            # Test user discovery with role filter
            response = await self.client.get(
                f"{API_BASE}/users?role=investor&limit=10",
                headers={"Authorization": f"Bearer {self.tokens[email]}"}
            )
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_result(
                        f"User Discovery ({email})",
                        True,
                        f"User discovery returned {len(data)} users with role filter"
                    )
                    return True
                else:
                    self.log_result(
                        f"User Discovery ({email})",
                        False,
                        "Response is not a list of users",
                        data
                    )
                    return False
            else:
                data = response.json() if response.headers.get("content-type", "").startswith("application/json") else {"error": response.text}
                self.log_result(
                    f"User Discovery ({email})",
                    False,
                    f"HTTP {response.status_code}: {data.get('detail', 'User discovery failed')}",
                    data
                )
                return False
                
        except Exception as e:
            self.log_result(
                f"User Discovery ({email})",
                False,
                f"Exception: {str(e)}"
            )
            return False

    async def test_get_opportunities(self, email: str = None) -> bool:
        """Test get opportunities"""
        headers = {}
        if email and email in self.tokens:
            headers["Authorization"] = f"Bearer {self.tokens[email]}"
            
        try:
            response = await self.client.get(
                f"{API_BASE}/opportunities",
                headers=headers
            )
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_result(
                        "Get Opportunities",
                        True,
                        f"Retrieved {len(data)} opportunities successfully"
                    )
                    return True
                else:
                    self.log_result(
                        "Get Opportunities",
                        False,
                        "Response is not a list of opportunities",
                        data
                    )
                    return False
            else:
                data = response.json() if response.headers.get("content-type", "").startswith("application/json") else {"error": response.text}
                self.log_result(
                    "Get Opportunities",
                    False,
                    f"HTTP {response.status_code}: {data.get('detail', 'Get opportunities failed')}",
                    data
                )
                return False
                
        except Exception as e:
            self.log_result(
                "Get Opportunities",
                False,
                f"Exception: {str(e)}"
            )
            return False

    async def test_create_opportunity(self, email: str) -> bool:
        """Test create opportunity"""
        if email not in self.tokens:
            self.log_result(f"Create Opportunity ({email})", False, "No token available")
            return False
            
        opportunity_data = {
            "type": "cofounder",
            "title": "Co-Founder - CTO Needed for AI Startup",
            "description": "Seeking a technical co-founder to lead product development for our revolutionary AI platform that connects entrepreneurs. Must have strong background in AI/ML and startup experience.",
            "requirements": [
                "5+ years software engineering experience",
                "Experience with AI/ML technologies",
                "Previous startup experience preferred",
                "Strong leadership and team building skills"
            ],
            "skills_required": ["Python", "Machine Learning", "Product Management", "Leadership"],
            "location": "San Francisco, CA",
            "remote_ok": True,
            "compensation_type": "equity",
            "compensation_details": "Significant equity package as co-founder",
            "commitment": "full_time"
        }
        
        try:
            response = await self.client.post(
                f"{API_BASE}/opportunities",
                json=opportunity_data,
                headers={
                    "Authorization": f"Bearer {self.tokens[email]}",
                    "Content-Type": "application/json"
                }
            )
            
            if response.status_code == 200 or response.status_code == 201:
                data = response.json()
                if "opportunity_id" in data:
                    self.log_result(
                        f"Create Opportunity ({email})",
                        True,
                        f"Opportunity created successfully: {data['opportunity_id']}"
                    )
                    return True
                else:
                    self.log_result(
                        f"Create Opportunity ({email})",
                        False,
                        "Missing opportunity_id in response",
                        data
                    )
                    return False
            else:
                data = response.json() if response.headers.get("content-type", "").startswith("application/json") else {"error": response.text}
                self.log_result(
                    f"Create Opportunity ({email})",
                    False,
                    f"HTTP {response.status_code}: {data.get('detail', 'Create opportunity failed')}",
                    data
                )
                return False
                
        except Exception as e:
            self.log_result(
                f"Create Opportunity ({email})",
                False,
                f"Exception: {str(e)}"
            )
            return False

    async def test_connection_request(self, from_email: str, to_email: str) -> bool:
        """Test sending connection request"""
        if from_email not in self.tokens or to_email not in self.user_data:
            self.log_result(f"Connection Request ({from_email} -> {to_email})", False, "Missing token or target user data")
            return False
            
        request_data = {
            "target_user_id": self.user_data[to_email]["user_id"],
            "message": "Hi! I'd love to connect and explore potential collaboration opportunities. Your expertise in the startup ecosystem would be invaluable!"
        }
        
        try:
            response = await self.client.post(
                f"{API_BASE}/connections/request",
                json=request_data,
                headers={
                    "Authorization": f"Bearer {self.tokens[from_email]}",
                    "Content-Type": "application/json"
                }
            )
            
            if response.status_code == 200 or response.status_code == 201:
                data = response.json()
                if "connection_id" in data:
                    self.log_result(
                        f"Connection Request ({from_email} -> {to_email})",
                        True,
                        f"Connection request sent successfully: {data['connection_id']}"
                    )
                    return True
                else:
                    self.log_result(
                        f"Connection Request ({from_email} -> {to_email})",
                        False,
                        "Missing connection_id in response",
                        data
                    )
                    return False
            elif response.status_code == 400:
                data = response.json()
                if "already exists" in data.get("detail", ""):
                    self.log_result(
                        f"Connection Request ({from_email} -> {to_email})",
                        True,
                        "Connection already exists (acceptable for testing)"
                    )
                    return True
                else:
                    self.log_result(
                        f"Connection Request ({from_email} -> {to_email})",
                        False,
                        f"Connection request failed: {data.get('detail', 'Unknown error')}",
                        data
                    )
                    return False
            else:
                data = response.json() if response.headers.get("content-type", "").startswith("application/json") else {"error": response.text}
                self.log_result(
                    f"Connection Request ({from_email} -> {to_email})",
                    False,
                    f"HTTP {response.status_code}: {data.get('detail', 'Connection request failed')}",
                    data
                )
                return False
                
        except Exception as e:
            self.log_result(
                f"Connection Request ({from_email} -> {to_email})",
                False,
                f"Exception: {str(e)}"
            )
            return False

    async def test_get_connections(self, email: str) -> bool:
        """Test get connections"""
        if email not in self.tokens:
            self.log_result(f"Get Connections ({email})", False, "No token available")
            return False
            
        try:
            response = await self.client.get(
                f"{API_BASE}/connections",
                headers={"Authorization": f"Bearer {self.tokens[email]}"}
            )
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_result(
                        f"Get Connections ({email})",
                        True,
                        f"Retrieved {len(data)} connections successfully"
                    )
                    return True
                else:
                    self.log_result(
                        f"Get Connections ({email})",
                        False,
                        "Response is not a list of connections",
                        data
                    )
                    return False
            else:
                data = response.json() if response.headers.get("content-type", "").startswith("application/json") else {"error": response.text}
                self.log_result(
                    f"Get Connections ({email})",
                    False,
                    f"HTTP {response.status_code}: {data.get('detail', 'Get connections failed')}",
                    data
                )
                return False
                
        except Exception as e:
            self.log_result(
                f"Get Connections ({email})",
                False,
                f"Exception: {str(e)}"
            )
            return False

    async def test_send_message(self, from_email: str, to_email: str) -> bool:
        """Test send direct message"""
        if from_email not in self.tokens or to_email not in self.user_data:
            self.log_result(f"Send Message ({from_email} -> {to_email})", False, "Missing token or target user data")
            return False
            
        message_data = {
            "receiver_id": self.user_data[to_email]["user_id"],
            "content": "Hello! Thanks for connecting. I'm excited about the potential for collaboration between our ventures. Would you be interested in setting up a call to discuss synergies?"
        }
        
        try:
            response = await self.client.post(
                f"{API_BASE}/messages",
                json=message_data,
                headers={
                    "Authorization": f"Bearer {self.tokens[from_email]}",
                    "Content-Type": "application/json"
                }
            )
            
            if response.status_code == 200 or response.status_code == 201:
                data = response.json()
                if "message_id" in data:
                    self.log_result(
                        f"Send Message ({from_email} -> {to_email})",
                        True,
                        f"Message sent successfully: {data['message_id']}"
                    )
                    return True
                else:
                    self.log_result(
                        f"Send Message ({from_email} -> {to_email})",
                        False,
                        "Missing message_id in response",
                        data
                    )
                    return False
            else:
                data = response.json() if response.headers.get("content-type", "").startswith("application/json") else {"error": response.text}
                self.log_result(
                    f"Send Message ({from_email} -> {to_email})",
                    False,
                    f"HTTP {response.status_code}: {data.get('detail', 'Send message failed')}",
                    data
                )
                return False
                
        except Exception as e:
            self.log_result(
                f"Send Message ({from_email} -> {to_email})",
                False,
                f"Exception: {str(e)}"
            )
            return False

    async def test_get_conversations(self, email: str) -> bool:
        """Test get conversations"""
        if email not in self.tokens:
            self.log_result(f"Get Conversations ({email})", False, "No token available")
            return False
            
        try:
            response = await self.client.get(
                f"{API_BASE}/conversations",
                headers={"Authorization": f"Bearer {self.tokens[email]}"}
            )
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_result(
                        f"Get Conversations ({email})",
                        True,
                        f"Retrieved {len(data)} conversations successfully"
                    )
                    return True
                else:
                    self.log_result(
                        f"Get Conversations ({email})",
                        False,
                        "Response is not a list of conversations",
                        data
                    )
                    return False
            else:
                data = response.json() if response.headers.get("content-type", "").startswith("application/json") else {"error": response.text}
                self.log_result(
                    f"Get Conversations ({email})",
                    False,
                    f"HTTP {response.status_code}: {data.get('detail', 'Get conversations failed')}",
                    data
                )
                return False
                
        except Exception as e:
            self.log_result(
                f"Get Conversations ({email})",
                False,
                f"Exception: {str(e)}"
            )
            return False

    async def test_ai_recommendations(self, email: str) -> bool:
        """Test AI-powered recommendations"""
        if email not in self.tokens:
            self.log_result(f"AI Recommendations ({email})", False, "No token available")
            return False
            
        try:
            response = await self.client.get(
                f"{API_BASE}/ai/recommendations",
                headers={"Authorization": f"Bearer {self.tokens[email]}"}
            )
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_result(
                        f"AI Recommendations ({email})",
                        True,
                        f"Retrieved {len(data)} AI recommendations successfully"
                    )
                    return True
                else:
                    self.log_result(
                        f"AI Recommendations ({email})",
                        False,
                        "Response is not a list of recommendations",
                        data
                    )
                    return False
            else:
                data = response.json() if response.headers.get("content-type", "").startswith("application/json") else {"error": response.text}
                self.log_result(
                    f"AI Recommendations ({email})",
                    False,
                    f"HTTP {response.status_code}: {data.get('detail', 'AI recommendations failed')}",
                    data
                )
                return False
                
        except Exception as e:
            self.log_result(
                f"AI Recommendations ({email})",
                False,
                f"Exception: {str(e)}"
            )
            return False

    async def run_comprehensive_tests(self):
        """Run all backend API tests following the specific test sequence"""
        print(f"🚀 Starting CoFounderBay v2.0 Backend API Tests")
        print(f"📍 Testing against: {BASE_URL}")
        print(f"=" * 60)
        
        # Specific test sequence as requested:
        # 1. Register a new user with email: testfounderr@cofounderbay.com, password: Test1234!, name: Test Founder, role: founder
        user = TEST_USERS[0]  # The specific test user
        if not await self.test_registration(user):
            print("❌ Registration failed, skipping dependent tests")
            return
            
        # 2. Login and get token
        if not await self.test_login(user["email"], user["password"]):
            print("❌ Login failed, skipping dependent tests")
            return
            
        # Verify profile access
        await self.test_get_profile(user["email"])
        
        # 3. Create a post with the token
        post_id = await self.test_create_post(user["email"])
        
        # 4. Get posts feed
        await self.test_get_posts(user["email"])
        
        # 5. Like a post (using react endpoint)
        if post_id:
            await self.test_like_post(user["email"], post_id)
            await self.test_comment_post(user["email"], post_id)
            
        # 6. Browse users with role filter
        await self.test_discovery(user["email"])
        
        # 7. Get opportunities
        await self.test_get_opportunities(user["email"])
        
        # 8. Create an opportunity with the token
        await self.test_create_opportunity(user["email"])
        
        # 9. Get connections
        await self.test_get_connections(user["email"])
        
        # 10. Get conversations
        await self.test_get_conversations(user["email"])
        
        # Test profile update capability
        await self.test_update_profile(user["email"])
        
        # If we have a second user, test cross-user interactions
        if len(TEST_USERS) > 1:
            second_user = TEST_USERS[1]
            
            # Register/login second user
            if await self.test_registration(second_user) and await self.test_login(second_user["email"], second_user["password"]):
                # Test cross-user interactions
                await self.test_connection_request(user["email"], second_user["email"])
                await self.test_send_message(user["email"], second_user["email"])

    def print_summary(self):
        """Print test summary"""
        print(f"\n" + "=" * 60)
        print("📊 TEST RESULTS SUMMARY")
        print(f"=" * 60)
        
        passed = sum(1 for result in self.test_results if result["success"])
        failed = len(self.test_results) - passed
        
        print(f"✅ PASSED: {passed}")
        print(f"❌ FAILED: {failed}")
        print(f"📈 SUCCESS RATE: {(passed / len(self.test_results) * 100):.1f}%")
        
        if failed > 0:
            print(f"\n🔍 FAILED TESTS:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"  - {result['test']}: {result['details']}")
                    
        print(f"\n🕐 Test completed at: {datetime.now().isoformat()}")


async def main():
    """Main test execution"""
    async with BackendTester() as tester:
        await tester.run_comprehensive_tests()
        tester.print_summary()
        
        # Return overall success
        failed_count = sum(1 for result in tester.test_results if not result["success"])
        return failed_count == 0


if __name__ == "__main__":
    import sys
    success = asyncio.run(main())
    sys.exit(0 if success else 1)