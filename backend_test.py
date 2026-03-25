#!/usr/bin/env python3
"""
CoFounderBay Phase 3 Backend API Testing
Tests authentication, notifications, investor pipeline, intro requests, and connections APIs
"""

import requests
import json
import sys
from datetime import datetime

# Configuration
BASE_URL = "https://startup-connect-53.preview.emergentagent.com/api"
TEST_EMAIL = "sarah@cofounderbay.com"
TEST_PASSWORD = "Demo1234!"

class CoFounderBayTester:
    def __init__(self):
        self.base_url = BASE_URL
        self.session = requests.Session()
        self.auth_token = None
        self.user_data = None
        self.test_results = []
        
    def log_test(self, test_name, success, details="", response_data=None):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if details:
            print(f"   Details: {details}")
        if response_data and not success:
            print(f"   Response: {response_data}")
        print()
        
        self.test_results.append({
            "test": test_name,
            "success": success,
            "details": details,
            "response": response_data
        })
    
    def test_authentication(self):
        """Test Phase 3 Authentication - Login with credentials"""
        print("🔐 Testing Authentication...")
        
        try:
            # Test login
            login_data = {
                "email": TEST_EMAIL,
                "password": TEST_PASSWORD
            }
            
            response = self.session.post(f"{self.base_url}/auth/login", json=login_data)
            
            if response.status_code == 200:
                data = response.json()
                if "access_token" in data and "user" in data:
                    self.auth_token = data["access_token"]
                    self.user_data = data["user"]
                    
                    # Set authorization header for future requests
                    self.session.headers.update({
                        "Authorization": f"Bearer {self.auth_token}"
                    })
                    
                    self.log_test(
                        "Authentication - Login",
                        True,
                        f"Successfully logged in as {data['user']['name']} ({data['user']['email']})"
                    )
                    return True
                else:
                    self.log_test(
                        "Authentication - Login",
                        False,
                        "Missing access_token or user in response",
                        data
                    )
            else:
                self.log_test(
                    "Authentication - Login",
                    False,
                    f"HTTP {response.status_code}",
                    response.text
                )
                
        except Exception as e:
            self.log_test(
                "Authentication - Login",
                False,
                f"Exception: {str(e)}"
            )
        
        return False
    
    def test_notifications_api(self):
        """Test Phase 3 Notifications API"""
        print("🔔 Testing Notifications API...")
        
        if not self.auth_token:
            self.log_test("Notifications API", False, "No auth token available")
            return
        
        try:
            # Test GET /api/notifications
            response = self.session.get(f"{self.base_url}/notifications")
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_test(
                        "Notifications - GET /api/notifications",
                        True,
                        f"Retrieved {len(data)} notifications"
                    )
                    
                    # Test notification structure if any exist
                    if data:
                        notif = data[0]
                        required_fields = ["notification_id", "type", "title", "message", "is_read", "created_at"]
                        missing_fields = [field for field in required_fields if field not in notif]
                        
                        if not missing_fields:
                            self.log_test(
                                "Notifications - Data Structure",
                                True,
                                "Notification structure is valid"
                            )
                        else:
                            self.log_test(
                                "Notifications - Data Structure",
                                False,
                                f"Missing fields: {missing_fields}",
                                notif
                            )
                    else:
                        self.log_test(
                            "Notifications - Data Structure",
                            True,
                            "No notifications to validate structure (empty list is valid)"
                        )
                else:
                    self.log_test(
                        "Notifications - GET /api/notifications",
                        False,
                        "Response is not a list",
                        data
                    )
            else:
                self.log_test(
                    "Notifications - GET /api/notifications",
                    False,
                    f"HTTP {response.status_code}",
                    response.text
                )
                
        except Exception as e:
            self.log_test(
                "Notifications API",
                False,
                f"Exception: {str(e)}"
            )
    
    def test_investor_pipeline_api(self):
        """Test Phase 3 Investor Pipeline API"""
        print("💼 Testing Investor Pipeline API...")
        
        if not self.auth_token:
            self.log_test("Investor Pipeline API", False, "No auth token available")
            return
        
        try:
            # Test GET /api/investor/pipeline
            response = self.session.get(f"{self.base_url}/investor/pipeline")
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_test(
                        "Investor Pipeline - GET /api/investor/pipeline",
                        True,
                        f"Retrieved {len(data)} pipeline items"
                    )
                    
                    # Test pipeline structure if any exist
                    if data:
                        pipeline_item = data[0]
                        required_fields = ["pipeline_id", "startup_id", "stage", "created_at"]
                        missing_fields = [field for field in required_fields if field not in pipeline_item]
                        
                        if not missing_fields:
                            self.log_test(
                                "Investor Pipeline - Data Structure",
                                True,
                                "Pipeline structure is valid"
                            )
                        else:
                            self.log_test(
                                "Investor Pipeline - Data Structure",
                                False,
                                f"Missing fields: {missing_fields}",
                                pipeline_item
                            )
                    else:
                        self.log_test(
                            "Investor Pipeline - Data Structure",
                            True,
                            "No pipeline items to validate structure (empty list is valid)"
                        )
                        
                    # Test POST /api/investor/pipeline (add new deal)
                    # First, get a startup_id from users with founder role
                    users_response = self.session.get(f"{self.base_url}/users?role=founder&limit=1")
                    if users_response.status_code == 200:
                        users = users_response.json()
                        if users:
                            startup_id = users[0]["user_id"]
                            
                            # Check if this startup is already in pipeline
                            existing_pipeline = [item for item in data if item.get("startup_id") == startup_id]
                            
                            if not existing_pipeline:
                                # Add new pipeline item
                                pipeline_data = {
                                    "startup_id": startup_id,
                                    "stage": "new",
                                    "notes": "Test pipeline item from automated testing",
                                    "next_action": "Initial review"
                                }
                                
                                post_response = self.session.post(f"{self.base_url}/investor/pipeline", json=pipeline_data)
                                
                                if post_response.status_code == 200:
                                    post_data = post_response.json()
                                    self.log_test(
                                        "Investor Pipeline - POST /api/investor/pipeline",
                                        True,
                                        f"Successfully added pipeline item: {post_data.get('pipeline_id', 'N/A')}"
                                    )
                                else:
                                    self.log_test(
                                        "Investor Pipeline - POST /api/investor/pipeline",
                                        False,
                                        f"HTTP {post_response.status_code}",
                                        post_response.text
                                    )
                            else:
                                self.log_test(
                                    "Investor Pipeline - POST /api/investor/pipeline",
                                    True,
                                    "Startup already in pipeline, skipping POST test (expected behavior)"
                                )
                        else:
                            self.log_test(
                                "Investor Pipeline - POST /api/investor/pipeline",
                                False,
                                "No founder users found to test pipeline creation"
                            )
                    else:
                        self.log_test(
                            "Investor Pipeline - POST /api/investor/pipeline",
                            False,
                            f"Failed to get users for pipeline test: HTTP {users_response.status_code}"
                        )
                        
                else:
                    self.log_test(
                        "Investor Pipeline - GET /api/investor/pipeline",
                        False,
                        "Response is not a list",
                        data
                    )
            else:
                self.log_test(
                    "Investor Pipeline - GET /api/investor/pipeline",
                    False,
                    f"HTTP {response.status_code}",
                    response.text
                )
                
        except Exception as e:
            self.log_test(
                "Investor Pipeline API",
                False,
                f"Exception: {str(e)}"
            )
    
    def test_intro_requests_api(self):
        """Test Phase 3 Intro Requests (Collaboration Workflow)"""
        print("🤝 Testing Intro Requests API...")
        
        if not self.auth_token:
            self.log_test("Intro Requests API", False, "No auth token available")
            return
        
        try:
            # First, get a target user from the database
            users_response = self.session.get(f"{self.base_url}/users?limit=5")
            target_user_id = None
            
            if users_response.status_code == 200:
                users = users_response.json()
                # Find a user that's not the current user
                for user in users:
                    if user["user_id"] != self.user_data["user_id"]:
                        target_user_id = user["user_id"]
                        break
            
            if not target_user_id:
                self.log_test(
                    "Intro Requests - Setup",
                    False,
                    "No target user found for intro request test"
                )
                return
            
            # Test GET /api/intro-requests (get existing requests)
            get_response = self.session.get(f"{self.base_url}/intro-requests")
            
            if get_response.status_code == 200:
                existing_requests = get_response.json()
                self.log_test(
                    "Intro Requests - GET /api/intro-requests",
                    True,
                    f"Retrieved {len(existing_requests)} intro requests"
                )
                
                # Check if we already have a pending request to this user
                existing_request = None
                for req in existing_requests:
                    if (req.get("to_user_id") == target_user_id and 
                        req.get("from_user_id") == self.user_data["user_id"] and 
                        req.get("status") == "pending"):
                        existing_request = req
                        break
                
                # Test POST /api/intro-requests (send intro request)
                if not existing_request:
                    intro_data = {
                        "target_user_id": target_user_id,
                        "message": "Hi! I'd like to connect with you. I'm testing the CoFounderBay platform and would love to explore potential collaboration opportunities."
                    }
                    
                    post_response = self.session.post(f"{self.base_url}/intro-requests", json=intro_data)
                    
                    if post_response.status_code == 200:
                        post_data = post_response.json()
                        self.log_test(
                            "Intro Requests - POST /api/intro-requests",
                            True,
                            f"Successfully sent intro request: {post_data.get('request_id', 'N/A')}"
                        )
                    elif post_response.status_code == 400:
                        # Check if it's a "Request already pending" error
                        error_text = post_response.text
                        if "already pending" in error_text.lower():
                            self.log_test(
                                "Intro Requests - POST /api/intro-requests",
                                True,
                                "Request already pending (expected behavior for duplicate requests)"
                            )
                        else:
                            self.log_test(
                                "Intro Requests - POST /api/intro-requests",
                                False,
                                f"HTTP 400: {error_text}"
                            )
                    elif post_response.status_code == 429:
                        self.log_test(
                            "Intro Requests - POST /api/intro-requests",
                            True,
                            "Rate limit exceeded (expected behavior for rate limiting)"
                        )
                    else:
                        self.log_test(
                            "Intro Requests - POST /api/intro-requests",
                            False,
                            f"HTTP {post_response.status_code}",
                            post_response.text
                        )
                else:
                    self.log_test(
                        "Intro Requests - POST /api/intro-requests",
                        True,
                        "Existing pending request found, skipping POST test (expected behavior)"
                    )
                    
                # Validate intro request structure
                if existing_requests:
                    req = existing_requests[0]
                    required_fields = ["request_id", "from_user_id", "to_user_id", "message", "status", "created_at"]
                    missing_fields = [field for field in required_fields if field not in req]
                    
                    if not missing_fields:
                        self.log_test(
                            "Intro Requests - Data Structure",
                            True,
                            "Intro request structure is valid"
                        )
                    else:
                        self.log_test(
                            "Intro Requests - Data Structure",
                            False,
                            f"Missing fields: {missing_fields}",
                            req
                        )
                else:
                    self.log_test(
                        "Intro Requests - Data Structure",
                        True,
                        "No intro requests to validate structure (empty list is valid)"
                    )
                    
            else:
                self.log_test(
                    "Intro Requests - GET /api/intro-requests",
                    False,
                    f"HTTP {get_response.status_code}",
                    get_response.text
                )
                
        except Exception as e:
            self.log_test(
                "Intro Requests API",
                False,
                f"Exception: {str(e)}"
            )
    
    def test_connections_api(self):
        """Test Phase 3 Connections API"""
        print("🌐 Testing Connections API...")
        
        if not self.auth_token:
            self.log_test("Connections API", False, "No auth token available")
            return
        
        try:
            # Test GET /api/connections
            response = self.session.get(f"{self.base_url}/connections")
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_test(
                        "Connections - GET /api/connections",
                        True,
                        f"Retrieved {len(data)} connections"
                    )
                    
                    # Validate connection structure if any exist
                    if data:
                        connection = data[0]
                        required_fields = ["user_id", "name", "email"]
                        missing_fields = [field for field in required_fields if field not in connection]
                        
                        if not missing_fields:
                            self.log_test(
                                "Connections - Data Structure",
                                True,
                                "Connection structure is valid"
                            )
                        else:
                            self.log_test(
                                "Connections - Data Structure",
                                False,
                                f"Missing fields: {missing_fields}",
                                connection
                            )
                    else:
                        self.log_test(
                            "Connections - Data Structure",
                            True,
                            "No connections to validate structure (empty list is valid)"
                        )
                else:
                    self.log_test(
                        "Connections - GET /api/connections",
                        False,
                        "Response is not a list",
                        data
                    )
            else:
                self.log_test(
                    "Connections - GET /api/connections",
                    False,
                    f"HTTP {response.status_code}",
                    response.text
                )
                
        except Exception as e:
            self.log_test(
                "Connections API",
                False,
                f"Exception: {str(e)}"
            )
    
    def test_ai_matching_engine(self):
        """Test AI Matching Engine endpoint"""
        print("🤖 Testing AI Matching Engine...")
        
        if not self.auth_token:
            self.log_test("AI Matching Engine", False, "No auth token available")
            return
        
        try:
            # Test POST /api/ai-matches with specified parameters
            match_request = {
                "min_score": 40,
                "limit": 10
            }
            
            response = self.session.post(f"{self.base_url}/ai-matches", json=match_request)
            
            if response.status_code == 200:
                data = response.json()
                
                # Validate response structure
                if "matches" in data:
                    matches = data["matches"]
                    self.log_test(
                        "AI Matching Engine - POST /api/ai-matches",
                        True,
                        f"Retrieved {len(matches)} matches with min_score={match_request['min_score']}"
                    )
                    
                    # Validate match structure
                    if matches:
                        match = matches[0]
                        required_fields = [
                            "user_id", "name", "roles", "match_score", 
                            "match_reasons", "complementary_skills", "shared_interests"
                        ]
                        missing_fields = [field for field in required_fields if field not in match]
                        
                        if not missing_fields:
                            self.log_test(
                                "AI Matching Engine - Match Structure",
                                True,
                                "Match structure contains all required fields"
                            )
                            
                            # Check if AI insights are present (optional fields)
                            ai_fields = ["ai_insights", "collaboration_potential"]
                            ai_present = [field for field in ai_fields if field in match and match[field]]
                            
                            if ai_present:
                                self.log_test(
                                    "AI Matching Engine - AI Insights",
                                    True,
                                    f"AI insights working: {', '.join(ai_present)} fields populated"
                                )
                            else:
                                self.log_test(
                                    "AI Matching Engine - AI Insights",
                                    False,
                                    "AI insights fields (ai_insights, collaboration_potential) are empty - check OpenAI GPT-4o integration"
                                )
                            
                            # Validate match scores are above minimum
                            scores_valid = all(m.get("match_score", 0) >= match_request["min_score"] for m in matches)
                            if scores_valid:
                                self.log_test(
                                    "AI Matching Engine - Score Filtering",
                                    True,
                                    f"All matches have scores >= {match_request['min_score']}"
                                )
                            else:
                                invalid_scores = [m.get("match_score", 0) for m in matches if m.get("match_score", 0) < match_request["min_score"]]
                                self.log_test(
                                    "AI Matching Engine - Score Filtering",
                                    False,
                                    f"Some matches have scores below minimum: {invalid_scores}"
                                )
                                
                        else:
                            self.log_test(
                                "AI Matching Engine - Match Structure",
                                False,
                                f"Missing required fields: {missing_fields}",
                                match
                            )
                    else:
                        self.log_test(
                            "AI Matching Engine - Match Structure",
                            True,
                            "No matches returned (empty list is valid for high min_score)"
                        )
                        
                    # Test response metadata
                    if "total" in data:
                        self.log_test(
                            "AI Matching Engine - Response Metadata",
                            True,
                            f"Response includes total count: {data['total']}"
                        )
                    else:
                        self.log_test(
                            "AI Matching Engine - Response Metadata",
                            False,
                            "Missing 'total' field in response"
                        )
                        
                else:
                    self.log_test(
                        "AI Matching Engine - POST /api/ai-matches",
                        False,
                        "Response missing 'matches' field",
                        data
                    )
            else:
                self.log_test(
                    "AI Matching Engine - POST /api/ai-matches",
                    False,
                    f"HTTP {response.status_code}",
                    response.text
                )
                
        except Exception as e:
            self.log_test(
                "AI Matching Engine",
                False,
                f"Exception: {str(e)}"
            )
    
    def run_all_tests(self):
        """Run all Phase 3 backend API tests"""
        print("🚀 Starting CoFounderBay Backend API Tests")
        print("=" * 60)
        print()
        
        # Test authentication first
        if not self.test_authentication():
            print("❌ Authentication failed. Cannot proceed with other tests.")
            return False
        
        print()
        
        # Test all Phase 3 APIs
        self.test_notifications_api()
        print()
        
        self.test_investor_pipeline_api()
        print()
        
        self.test_intro_requests_api()
        print()
        
        self.test_connections_api()
        print()
        
        # Test AI Matching Engine (new endpoint)
        self.test_ai_matching_engine()
        print()
        
        # Summary
        self.print_summary()
        
        return True
    
    def print_summary(self):
        """Print test summary"""
        print("=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result["success"])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"✅ Passed: {passed_tests}")
        print(f"❌ Failed: {failed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests*100):.1f}%")
        print()
        
        if failed_tests > 0:
            print("❌ FAILED TESTS:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"  • {result['test']}: {result['details']}")
            print()
        
        print("✅ PASSED TESTS:")
        for result in self.test_results:
            if result["success"]:
                print(f"  • {result['test']}")
        
        print()
        print("🎯 Phase 3 Backend API Testing Complete!")

if __name__ == "__main__":
    tester = CoFounderBayTester()
    success = tester.run_all_tests()
    
    # Exit with appropriate code
    sys.exit(0 if success else 1)