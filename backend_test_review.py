#!/usr/bin/env python3
"""
CoFounderBay Backend API Test Suite - Review Request Testing
Tests all the specific API endpoints requested in the review with provided credentials.
"""

import httpx
import json
import asyncio
from datetime import datetime
import uuid

# Configuration from review request
BASE_URL = "https://startup-connect-53.preview.emergentagent.com"  # From frontend/.env
API_BASE = f"{BASE_URL}/api"

# Test credentials as specified in review request
TEST_EMAIL = "sarah@cofounderbay.com"
TEST_PASSWORD = "Demo1234!"

class ReviewTester:
    def __init__(self):
        self.client = httpx.AsyncClient(timeout=30.0)
        self.access_token = None
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

    async def test_01_login(self) -> bool:
        """1. POST /api/auth/login - Login with test credentials"""
        try:
            response = await self.client.post(
                f"{API_BASE}/auth/login",
                json={"email": TEST_EMAIL, "password": TEST_PASSWORD},
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                data = response.json()
                if "access_token" in data and "user" in data:
                    self.access_token = data["access_token"]
                    self.user_data = data["user"]
                    self.log_result(
                        "POST /api/auth/login",
                        True,
                        f"Login successful, user: {self.user_data.get('name', 'N/A')}"
                    )
                    return True
                else:
                    self.log_result(
                        "POST /api/auth/login",
                        False,
                        "Missing access_token or user in response",
                        data
                    )
                    return False
            else:
                data = response.json() if response.headers.get("content-type", "").startswith("application/json") else {"error": response.text}
                self.log_result(
                    "POST /api/auth/login",
                    False,
                    f"HTTP {response.status_code}: {data.get('detail', 'Login failed')}",
                    data
                )
                return False
                
        except Exception as e:
            self.log_result(
                "POST /api/auth/login",
                False,
                f"Exception: {str(e)}"
            )
            return False

    async def test_02_get_posts(self) -> bool:
        """2. GET /api/posts - Get feed posts"""
        if not self.access_token:
            self.log_result("GET /api/posts", False, "No access token available")
            return False
            
        try:
            response = await self.client.get(
                f"{API_BASE}/posts",
                headers={"Authorization": f"Bearer {self.access_token}"}
            )
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_result(
                        "GET /api/posts",
                        True,
                        f"Retrieved {len(data)} posts successfully"
                    )
                    return True
                else:
                    self.log_result(
                        "GET /api/posts",
                        False,
                        "Response is not a list of posts",
                        data
                    )
                    return False
            else:
                data = response.json() if response.headers.get("content-type", "").startswith("application/json") else {"error": response.text}
                self.log_result(
                    "GET /api/posts",
                    False,
                    f"HTTP {response.status_code}: {data.get('detail', 'Get posts failed')}",
                    data
                )
                return False
                
        except Exception as e:
            self.log_result(
                "GET /api/posts",
                False,
                f"Exception: {str(e)}"
            )
            return False

    async def test_03_create_post(self) -> str:
        """3. POST /api/posts - Create a new post"""
        if not self.access_token:
            self.log_result("POST /api/posts", False, "No access token available")
            return None
            
        post_data = {
            "content": "🚀 Excited to be part of the CoFounderBay community! Looking forward to connecting with fellow entrepreneurs and building the future together. #startup #networking #innovation",
            "tags": ["startup", "networking", "innovation"]
        }
        
        try:
            response = await self.client.post(
                f"{API_BASE}/posts",
                json=post_data,
                headers={
                    "Authorization": f"Bearer {self.access_token}",
                    "Content-Type": "application/json"
                }
            )
            
            if response.status_code == 200 or response.status_code == 201:
                data = response.json()
                if "post_id" in data:
                    self.log_result(
                        "POST /api/posts",
                        True,
                        f"Post created successfully: {data['post_id']}"
                    )
                    return data["post_id"]
                else:
                    self.log_result(
                        "POST /api/posts",
                        False,
                        "Missing post_id in response",
                        data
                    )
                    return None
            else:
                data = response.json() if response.headers.get("content-type", "").startswith("application/json") else {"error": response.text}
                self.log_result(
                    "POST /api/posts",
                    False,
                    f"HTTP {response.status_code}: {data.get('detail', 'Post creation failed')}",
                    data
                )
                return None
                
        except Exception as e:
            self.log_result(
                "POST /api/posts",
                False,
                f"Exception: {str(e)}"
            )
            return None

    async def test_04_like_post(self, post_id: str) -> bool:
        """4. POST /api/posts/{id}/react - Like a post"""
        if not self.access_token or not post_id:
            self.log_result("POST /api/posts/{id}/react", False, "No access token or post_id available")
            return False
            
        try:
            response = await self.client.post(
                f"{API_BASE}/posts/{post_id}/react",
                json={"type": "like"},
                headers={
                    "Authorization": f"Bearer {self.access_token}",
                    "Content-Type": "application/json"
                }
            )
            
            if response.status_code == 200:
                self.log_result(
                    "POST /api/posts/{id}/react",
                    True,
                    f"Post liked successfully"
                )
                return True
            else:
                data = response.json() if response.headers.get("content-type", "").startswith("application/json") else {"error": response.text}
                self.log_result(
                    "POST /api/posts/{id}/react",
                    False,
                    f"HTTP {response.status_code}: {data.get('detail', 'Like post failed')}",
                    data
                )
                return False
                
        except Exception as e:
            self.log_result(
                "POST /api/posts/{id}/react",
                False,
                f"Exception: {str(e)}"
            )
            return False

    async def test_05_get_users(self) -> bool:
        """5. GET /api/users - Get users list"""
        if not self.access_token:
            self.log_result("GET /api/users", False, "No access token available")
            return False
            
        try:
            response = await self.client.get(
                f"{API_BASE}/users",
                headers={"Authorization": f"Bearer {self.access_token}"}
            )
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_result(
                        "GET /api/users",
                        True,
                        f"Retrieved {len(data)} users successfully"
                    )
                    return True
                else:
                    self.log_result(
                        "GET /api/users",
                        False,
                        "Response is not a list of users",
                        data
                    )
                    return False
            else:
                data = response.json() if response.headers.get("content-type", "").startswith("application/json") else {"error": response.text}
                self.log_result(
                    "GET /api/users",
                    False,
                    f"HTTP {response.status_code}: {data.get('detail', 'Get users failed')}",
                    data
                )
                return False
                
        except Exception as e:
            self.log_result(
                "GET /api/users",
                False,
                f"Exception: {str(e)}"
            )
            return False

    async def test_06_get_opportunities(self) -> bool:
        """6. GET /api/opportunities - Get opportunities"""
        if not self.access_token:
            self.log_result("GET /api/opportunities", False, "No access token available")
            return False
            
        try:
            response = await self.client.get(
                f"{API_BASE}/opportunities",
                headers={"Authorization": f"Bearer {self.access_token}"}
            )
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_result(
                        "GET /api/opportunities",
                        True,
                        f"Retrieved {len(data)} opportunities successfully"
                    )
                    return True
                else:
                    self.log_result(
                        "GET /api/opportunities",
                        False,
                        "Response is not a list of opportunities",
                        data
                    )
                    return False
            else:
                data = response.json() if response.headers.get("content-type", "").startswith("application/json") else {"error": response.text}
                self.log_result(
                    "GET /api/opportunities",
                    False,
                    f"HTTP {response.status_code}: {data.get('detail', 'Get opportunities failed')}",
                    data
                )
                return False
                
        except Exception as e:
            self.log_result(
                "GET /api/opportunities",
                False,
                f"Exception: {str(e)}"
            )
            return False

    async def test_07_create_opportunity(self) -> bool:
        """7. POST /api/opportunities - Create an opportunity"""
        if not self.access_token:
            self.log_result("POST /api/opportunities", False, "No access token available")
            return False
            
        opportunity_data = {
            "type": "cofounder",
            "title": "Technical Co-Founder for FinTech Startup",
            "description": "Seeking a technical co-founder with blockchain and financial services experience to help build the next generation of decentralized finance solutions.",
            "requirements": [
                "5+ years in software development",
                "Blockchain/DeFi experience",
                "Strong leadership skills"
            ],
            "skills_required": ["Python", "Solidity", "React", "Leadership"],
            "location": "San Francisco, CA",
            "remote_ok": True,
            "compensation_type": "equity"
        }
        
        try:
            response = await self.client.post(
                f"{API_BASE}/opportunities",
                json=opportunity_data,
                headers={
                    "Authorization": f"Bearer {self.access_token}",
                    "Content-Type": "application/json"
                }
            )
            
            if response.status_code == 200 or response.status_code == 201:
                data = response.json()
                if "opportunity_id" in data:
                    self.log_result(
                        "POST /api/opportunities",
                        True,
                        f"Opportunity created successfully: {data['opportunity_id']}"
                    )
                    return True
                else:
                    self.log_result(
                        "POST /api/opportunities",
                        False,
                        "Missing opportunity_id in response",
                        data
                    )
                    return False
            else:
                data = response.json() if response.headers.get("content-type", "").startswith("application/json") else {"error": response.text}
                self.log_result(
                    "POST /api/opportunities",
                    False,
                    f"HTTP {response.status_code}: {data.get('detail', 'Create opportunity failed')}",
                    data
                )
                return False
                
        except Exception as e:
            self.log_result(
                "POST /api/opportunities",
                False,
                f"Exception: {str(e)}"
            )
            return False

    async def test_08_get_events(self) -> bool:
        """8. GET /api/events - Get events"""
        if not self.access_token:
            self.log_result("GET /api/events", False, "No access token available")
            return False
            
        try:
            response = await self.client.get(
                f"{API_BASE}/events",
                headers={"Authorization": f"Bearer {self.access_token}"}
            )
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_result(
                        "GET /api/events",
                        True,
                        f"Retrieved {len(data)} events successfully"
                    )
                    return True
                else:
                    self.log_result(
                        "GET /api/events",
                        False,
                        "Response is not a list of events",
                        data
                    )
                    return False
            else:
                data = response.json() if response.headers.get("content-type", "").startswith("application/json") else {"error": response.text}
                self.log_result(
                    "GET /api/events",
                    False,
                    f"HTTP {response.status_code}: {data.get('detail', 'Get events failed')}",
                    data
                )
                return False
                
        except Exception as e:
            self.log_result(
                "GET /api/events",
                False,
                f"Exception: {str(e)}"
            )
            return False

    async def test_09_rsvp_event(self) -> bool:
        """9. POST /api/events/{id}/rsvp - RSVP to an event (requires existing event)"""
        if not self.access_token:
            self.log_result("POST /api/events/{id}/rsvp", False, "No access token available")
            return False
        
        # First try to get events to see if any exist
        try:
            events_response = await self.client.get(
                f"{API_BASE}/events",
                headers={"Authorization": f"Bearer {self.access_token}"}
            )
            
            if events_response.status_code == 200:
                events = events_response.json()
                if events and len(events) > 0:
                    event_id = events[0].get("event_id")
                    if event_id:
                        # Try to RSVP to the first event
                        rsvp_response = await self.client.post(
                            f"{API_BASE}/events/{event_id}/rsvp",
                            json={"status": "attending"},
                            headers={
                                "Authorization": f"Bearer {self.access_token}",
                                "Content-Type": "application/json"
                            }
                        )
                        
                        if rsvp_response.status_code == 200:
                            self.log_result(
                                "POST /api/events/{id}/rsvp",
                                True,
                                f"RSVP successful for event: {event_id}"
                            )
                            return True
                        else:
                            data = rsvp_response.json() if rsvp_response.headers.get("content-type", "").startswith("application/json") else {"error": rsvp_response.text}
                            self.log_result(
                                "POST /api/events/{id}/rsvp",
                                False,
                                f"HTTP {rsvp_response.status_code}: {data.get('detail', 'RSVP failed')}",
                                data
                            )
                            return False
                    else:
                        self.log_result(
                            "POST /api/events/{id}/rsvp",
                            False,
                            "Event found but no event_id in response"
                        )
                        return False
                else:
                    self.log_result(
                        "POST /api/events/{id}/rsvp",
                        True,
                        "No events available to RSVP to (acceptable)"
                    )
                    return True
            else:
                self.log_result(
                    "POST /api/events/{id}/rsvp",
                    False,
                    "Could not retrieve events to test RSVP"
                )
                return False
                
        except Exception as e:
            self.log_result(
                "POST /api/events/{id}/rsvp",
                False,
                f"Exception: {str(e)}"
            )
            return False

    async def test_10_get_groups(self) -> bool:
        """10. GET /api/groups - Get groups"""
        if not self.access_token:
            self.log_result("GET /api/groups", False, "No access token available")
            return False
            
        try:
            response = await self.client.get(
                f"{API_BASE}/groups",
                headers={"Authorization": f"Bearer {self.access_token}"}
            )
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_result(
                        "GET /api/groups",
                        True,
                        f"Retrieved {len(data)} groups successfully"
                    )
                    return True
                else:
                    self.log_result(
                        "GET /api/groups",
                        False,
                        "Response is not a list of groups",
                        data
                    )
                    return False
            else:
                data = response.json() if response.headers.get("content-type", "").startswith("application/json") else {"error": response.text}
                self.log_result(
                    "GET /api/groups",
                    False,
                    f"HTTP {response.status_code}: {data.get('detail', 'Get groups failed')}",
                    data
                )
                return False
                
        except Exception as e:
            self.log_result(
                "GET /api/groups",
                False,
                f"Exception: {str(e)}"
            )
            return False

    async def test_11_create_group(self) -> bool:
        """11. POST /api/groups - Create a group"""
        if not self.access_token:
            self.log_result("POST /api/groups", False, "No access token available")
            return False
            
        group_data = {
            "name": "FinTech Founders Network",
            "description": "A community for founders building innovative financial technology solutions. Share insights, collaborate, and grow together.",
            "rules": "Be respectful, share valuable insights, and help fellow founders succeed.",
            "is_private": False,
            "tags": ["fintech", "founders", "networking", "innovation"]
        }
        
        try:
            response = await self.client.post(
                f"{API_BASE}/groups",
                json=group_data,
                headers={
                    "Authorization": f"Bearer {self.access_token}",
                    "Content-Type": "application/json"
                }
            )
            
            if response.status_code == 200 or response.status_code == 201:
                data = response.json()
                if "group_id" in data:
                    self.log_result(
                        "POST /api/groups",
                        True,
                        f"Group created successfully: {data['group_id']}"
                    )
                    return True
                else:
                    self.log_result(
                        "POST /api/groups",
                        False,
                        "Missing group_id in response",
                        data
                    )
                    return False
            else:
                data = response.json() if response.headers.get("content-type", "").startswith("application/json") else {"error": response.text}
                self.log_result(
                    "POST /api/groups",
                    False,
                    f"HTTP {response.status_code}: {data.get('detail', 'Create group failed')}",
                    data
                )
                return False
                
        except Exception as e:
            self.log_result(
                "POST /api/groups",
                False,
                f"Exception: {str(e)}"
            )
            return False

    async def test_12_get_mentors(self) -> bool:
        """12. GET /api/mentors - Get mentors"""
        if not self.access_token:
            self.log_result("GET /api/mentors", False, "No access token available")
            return False
            
        try:
            response = await self.client.get(
                f"{API_BASE}/mentors",
                headers={"Authorization": f"Bearer {self.access_token}"}
            )
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_result(
                        "GET /api/mentors",
                        True,
                        f"Retrieved {len(data)} mentors successfully"
                    )
                    return True
                else:
                    self.log_result(
                        "GET /api/mentors",
                        False,
                        "Response is not a list of mentors",
                        data
                    )
                    return False
            else:
                data = response.json() if response.headers.get("content-type", "").startswith("application/json") else {"error": response.text}
                self.log_result(
                    "GET /api/mentors",
                    False,
                    f"HTTP {response.status_code}: {data.get('detail', 'Get mentors failed')}",
                    data
                )
                return False
                
        except Exception as e:
            self.log_result(
                "GET /api/mentors",
                False,
                f"Exception: {str(e)}"
            )
            return False

    async def test_13_book_mentor_session(self) -> bool:
        """13. POST /api/mentor-sessions - Book a mentor session"""
        if not self.access_token:
            self.log_result("POST /api/mentor-sessions", False, "No access token available")
            return False
        
        # First try to get mentors to see if any exist
        try:
            mentors_response = await self.client.get(
                f"{API_BASE}/mentors",
                headers={"Authorization": f"Bearer {self.access_token}"}
            )
            
            if mentors_response.status_code == 200:
                mentors = mentors_response.json()
                if mentors and len(mentors) > 0:
                    mentor = mentors[0]
                    mentor_id = mentor.get("user_id")
                    if mentor_id:
                        # Try to book a session with the first mentor
                        session_data = {
                            "mentor_user_id": mentor_id,
                            "date": "2024-02-15",
                            "time_slot": "10:00",
                            "topic": "Fundraising Strategy",
                            "notes": "Looking for guidance on Series A fundraising strategy and investor relations."
                        }
                        
                        booking_response = await self.client.post(
                            f"{API_BASE}/mentor-sessions",
                            json=session_data,
                            headers={
                                "Authorization": f"Bearer {self.access_token}",
                                "Content-Type": "application/json"
                            }
                        )
                        
                        if booking_response.status_code == 200 or booking_response.status_code == 201:
                            data = booking_response.json()
                            if "booking_id" in data:
                                self.log_result(
                                    "POST /api/mentor-sessions",
                                    True,
                                    f"Mentor session booked successfully: {data['booking_id']}"
                                )
                                return True
                            else:
                                self.log_result(
                                    "POST /api/mentor-sessions",
                                    False,
                                    "Missing booking_id in response",
                                    data
                                )
                                return False
                        else:
                            data = booking_response.json() if booking_response.headers.get("content-type", "").startswith("application/json") else {"error": booking_response.text}
                            self.log_result(
                                "POST /api/mentor-sessions",
                                False,
                                f"HTTP {booking_response.status_code}: {data.get('detail', 'Mentor session booking failed')}",
                                data
                            )
                            return False
                    else:
                        self.log_result(
                            "POST /api/mentor-sessions",
                            False,
                            "Mentor found but no user_id in response"
                        )
                        return False
                else:
                    self.log_result(
                        "POST /api/mentor-sessions",
                        True,
                        "No mentors available to book sessions with (acceptable)"
                    )
                    return True
            else:
                self.log_result(
                    "POST /api/mentor-sessions",
                    False,
                    "Could not retrieve mentors to test session booking"
                )
                return False
                
        except Exception as e:
            self.log_result(
                "POST /api/mentor-sessions",
                False,
                f"Exception: {str(e)}"
            )
            return False

    async def test_14_get_courses(self) -> bool:
        """14. GET /api/courses - Get courses"""
        if not self.access_token:
            self.log_result("GET /api/courses", False, "No access token available")
            return False
            
        try:
            response = await self.client.get(
                f"{API_BASE}/courses",
                headers={"Authorization": f"Bearer {self.access_token}"}
            )
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_result(
                        "GET /api/courses",
                        True,
                        f"Retrieved {len(data)} courses successfully"
                    )
                    return True
                else:
                    self.log_result(
                        "GET /api/courses",
                        False,
                        "Response is not a list of courses",
                        data
                    )
                    return False
            else:
                data = response.json() if response.headers.get("content-type", "").startswith("application/json") else {"error": response.text}
                self.log_result(
                    "GET /api/courses",
                    False,
                    f"HTTP {response.status_code}: {data.get('detail', 'Get courses failed')}",
                    data
                )
                return False
                
        except Exception as e:
            self.log_result(
                "GET /api/courses",
                False,
                f"Exception: {str(e)}"
            )
            return False

    async def test_15_get_marketplace_tools(self) -> bool:
        """15. GET /api/marketplace/tools - Get marketplace tools"""
        if not self.access_token:
            self.log_result("GET /api/marketplace/tools", False, "No access token available")
            return False
            
        try:
            response = await self.client.get(
                f"{API_BASE}/marketplace/tools",
                headers={"Authorization": f"Bearer {self.access_token}"}
            )
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_result(
                        "GET /api/marketplace/tools",
                        True,
                        f"Retrieved {len(data)} marketplace tools successfully"
                    )
                    return True
                else:
                    self.log_result(
                        "GET /api/marketplace/tools",
                        False,
                        "Response is not a list of tools",
                        data
                    )
                    return False
            else:
                data = response.json() if response.headers.get("content-type", "").startswith("application/json") else {"error": response.text}
                self.log_result(
                    "GET /api/marketplace/tools",
                    False,
                    f"HTTP {response.status_code}: {data.get('detail', 'Get marketplace tools failed')}",
                    data
                )
                return False
                
        except Exception as e:
            self.log_result(
                "GET /api/marketplace/tools",
                False,
                f"Exception: {str(e)}"
            )
            return False

    async def test_16_get_conversations(self) -> bool:
        """16. GET /api/conversations - Get conversations"""
        if not self.access_token:
            self.log_result("GET /api/conversations", False, "No access token available")
            return False
            
        try:
            response = await self.client.get(
                f"{API_BASE}/conversations",
                headers={"Authorization": f"Bearer {self.access_token}"}
            )
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_result(
                        "GET /api/conversations",
                        True,
                        f"Retrieved {len(data)} conversations successfully"
                    )
                    return True
                else:
                    self.log_result(
                        "GET /api/conversations",
                        False,
                        "Response is not a list of conversations",
                        data
                    )
                    return False
            else:
                data = response.json() if response.headers.get("content-type", "").startswith("application/json") else {"error": response.text}
                self.log_result(
                    "GET /api/conversations",
                    False,
                    f"HTTP {response.status_code}: {data.get('detail', 'Get conversations failed')}",
                    data
                )
                return False
                
        except Exception as e:
            self.log_result(
                "GET /api/conversations",
                False,
                f"Exception: {str(e)}"
            )
            return False

    async def test_17_get_recommendations(self) -> bool:
        """17. GET /api/recommendations - Get AI recommendations"""
        if not self.access_token:
            self.log_result("GET /api/recommendations", False, "No access token available")
            return False
            
        try:
            response = await self.client.get(
                f"{API_BASE}/recommendations",
                headers={"Authorization": f"Bearer {self.access_token}"}
            )
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_result(
                        "GET /api/recommendations",
                        True,
                        f"Retrieved {len(data)} AI recommendations successfully"
                    )
                    return True
                else:
                    self.log_result(
                        "GET /api/recommendations",
                        False,
                        "Response is not a list of recommendations",
                        data
                    )
                    return False
            else:
                data = response.json() if response.headers.get("content-type", "").startswith("application/json") else {"error": response.text}
                self.log_result(
                    "GET /api/recommendations",
                    False,
                    f"HTTP {response.status_code}: {data.get('detail', 'Get recommendations failed')}",
                    data
                )
                return False
                
        except Exception as e:
            self.log_result(
                "GET /api/recommendations",
                False,
                f"Exception: {str(e)}"
            )
            return False

    async def test_18_get_notifications(self) -> bool:
        """18. GET /api/notifications - Get notifications"""
        if not self.access_token:
            self.log_result("GET /api/notifications", False, "No access token available")
            return False
            
        try:
            response = await self.client.get(
                f"{API_BASE}/notifications",
                headers={"Authorization": f"Bearer {self.access_token}"}
            )
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_result(
                        "GET /api/notifications",
                        True,
                        f"Retrieved {len(data)} notifications successfully"
                    )
                    return True
                else:
                    self.log_result(
                        "GET /api/notifications",
                        False,
                        "Response is not a list of notifications",
                        data
                    )
                    return False
            else:
                data = response.json() if response.headers.get("content-type", "").startswith("application/json") else {"error": response.text}
                self.log_result(
                    "GET /api/notifications",
                    False,
                    f"HTTP {response.status_code}: {data.get('detail', 'Get notifications failed')}",
                    data
                )
                return False
                
        except Exception as e:
            self.log_result(
                "GET /api/notifications",
                False,
                f"Exception: {str(e)}"
            )
            return False

    async def run_all_tests(self):
        """Run all the tests specified in the review request"""
        print(f"🚀 CoFounderBay Backend API Review Tests")
        print(f"📍 Testing against: {BASE_URL}")
        print(f"👤 Test user: {TEST_EMAIL}")
        print(f"=" * 70)
        
        # Test sequence as specified in review request
        if not await self.test_01_login():
            print("❌ Login failed - cannot proceed with authenticated tests")
            return
        
        await self.test_02_get_posts()
        
        # Create post and get the ID for the like test
        post_id = await self.test_03_create_post()
        
        # Test liking the created post
        if post_id:
            await self.test_04_like_post(post_id)
        
        await self.test_05_get_users()
        await self.test_06_get_opportunities()
        await self.test_07_create_opportunity()
        await self.test_08_get_events()
        await self.test_09_rsvp_event()
        await self.test_10_get_groups()
        await self.test_11_create_group()
        await self.test_12_get_mentors()
        await self.test_13_book_mentor_session()
        await self.test_14_get_courses()
        await self.test_15_get_marketplace_tools()
        await self.test_16_get_conversations()
        await self.test_17_get_recommendations()
        await self.test_18_get_notifications()

    def print_summary(self):
        """Print comprehensive test summary"""
        print(f"\n" + "=" * 70)
        print("📊 COMPREHENSIVE TEST RESULTS SUMMARY")
        print(f"=" * 70)
        
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
        else:
            print(f"\n🎉 ALL TESTS PASSED!")
                    
        print(f"\n🕐 Test completed at: {datetime.now().isoformat()}")
        
        return passed, failed


async def main():
    """Main test execution"""
    async with ReviewTester() as tester:
        await tester.run_all_tests()
        passed, failed = tester.print_summary()
        
        # Return overall success
        return failed == 0


if __name__ == "__main__":
    import sys
    success = asyncio.run(main())
    sys.exit(0 if success else 1)