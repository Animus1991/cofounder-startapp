#====================================================================================================
# START - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================

# THIS SECTION CONTAINS CRITICAL TESTING INSTRUCTIONS FOR BOTH AGENTS
# BOTH MAIN_AGENT AND TESTING_AGENT MUST PRESERVE THIS ENTIRE BLOCK

# Communication Protocol:
# If the `testing_agent` is available, main agent should delegate all testing tasks to it.
#
# You have access to a file called `test_result.md`. This file contains the complete testing state
# and history, and is the primary means of communication between main and the testing agent.
#
# Main and testing agents must follow this exact format to maintain testing data. 
# The testing data must be entered in yaml format Below is the data structure:
# 
## user_problem_statement: {problem_statement}
## backend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.py"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## frontend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.js"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## metadata:
##   created_by: "main_agent"
##   version: "1.0"
##   test_sequence: 0
##   run_ui: false
##
## test_plan:
##   current_focus:
##     - "Task name 1"
##     - "Task name 2"
##   stuck_tasks:
##     - "Task name with persistent issues"
##   test_all: false
##   test_priority: "high_first"  # or "sequential" or "stuck_first"
##
## agent_communication:
##     -agent: "main"  # or "testing" or "user"
##     -message: "Communication message between agents"

# Protocol Guidelines for Main agent
#
# 1. Update Test Result File Before Testing:
#    - Main agent must always update the `test_result.md` file before calling the testing agent
#    - Add implementation details to the status_history
#    - Set `needs_retesting` to true for tasks that need testing
#    - Update the `test_plan` section to guide testing priorities
#    - Add a message to `agent_communication` explaining what you've done
#
# 2. Incorporate User Feedback:
#    - When a user provides feedback that something is or isn't working, add this information to the relevant task's status_history
#    - Update the working status based on user feedback
#    - If a user reports an issue with a task that was marked as working, increment the stuck_count
#    - Whenever user reports issue in the app, if we have testing agent and task_result.md file so find the appropriate task for that and append in status_history of that task to contain the user concern and problem as well 
#
# 3. Track Stuck Tasks:
#    - Monitor which tasks have high stuck_count values or where you are fixing same issue again and again, analyze that when you read task_result.md
#    - For persistent issues, use websearch tool to find solutions
#    - Pay special attention to tasks in the stuck_tasks list
#    - When you fix an issue with a stuck task, don't reset the stuck_count until the testing agent confirms it's working
#
# 4. Provide Context to Testing Agent:
#    - When calling the testing agent, provide clear instructions about:
#      - Which tasks need testing (reference the test_plan)
#      - Any authentication details or configuration needed
#      - Specific test scenarios to focus on
#      - Any known issues or edge cases to verify
#
# 5. Call the testing agent with specific instructions referring to test_result.md
#
# IMPORTANT: Main agent must ALWAYS update test_result.md BEFORE calling the testing agent, as it relies on this file to understand what to test next.

#====================================================================================================
# END - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================



#====================================================================================================
# Testing Data - Main Agent and testing sub agent both should log testing data below this section
#====================================================================================================

user_problem_statement: Build CoFounderBay - a specialized social network for the startup ecosystem that connects founders, investors, mentors, and professionals. Features include authentication, signal-rich profiles, opportunities board, events, marketplace, messaging, and feed with posts.

backend:
  - task: "User Authentication (Register/Login)"
    implemented: true
    working: true
    file: "/app/backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "testing"
        comment: "Previously working, rewritten for v2.0"
      - working: NA
        agent: "main"
        comment: "CoFounderBay v2.0 backend rewrite - needs retesting"
      - working: true
        agent: "testing"
        comment: "POST /api/auth/register and POST /api/auth/login tested successfully. User registered with specified test data (testfounderr@cofounderbay.com) and login working correctly with JWT tokens."

  - task: "Posts CRUD (Create/Read/Like/Comment)"
    implemented: true
    working: true
    file: "/app/backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "testing"
        comment: "Previously working"
      - working: NA
        agent: "main"
        comment: "Updated for v2.0 with author embedding"
      - working: true
        agent: "testing"
        comment: "POST /api/posts (create), GET /api/posts (read), POST /api/posts/{id}/react (like), and POST /api/posts/{post_id}/comments (comment) all working correctly. Full CRUD functionality verified."

  - task: "User Discovery/Browse"
    implemented: true
    working: true
    file: "/app/backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "testing"
        comment: "Previously working"
      - working: NA
        agent: "main"
        comment: "Updated with match scoring and role filtering"
      - working: true
        agent: "testing"
        comment: "GET /api/users with role filters working correctly. Role-based user discovery functionality validated."

  - task: "Opportunities Board"
    implemented: true
    working: true
    file: "/app/backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: NA
        agent: "main"
        comment: "New feature for v2.0 - full opportunities CRUD with applications"
      - working: true
        agent: "testing"
        comment: "GET /api/opportunities and POST /api/opportunities both working correctly. Opportunity creation and retrieval tested successfully."

  - task: "Events Management"
    implemented: true
    working: NA
    file: "/app/backend/server.py"
    stuck_count: 0
    priority: "medium"
    needs_retesting: true
    status_history:
      - working: NA
        agent: "main"
        comment: "New feature for v2.0 - events creation and RSVP"

  - task: "Connections System"
    implemented: true
    working: true
    file: "/app/backend/server.py"
    stuck_count: 0
    priority: "medium"
    needs_retesting: false
    status_history:
      - working: NA
        agent: "main"
        comment: "Added /connections endpoint and intro request flow"
      - working: true
        agent: "testing"
        comment: "GET /api/connections endpoint working correctly. Returns empty list when no connections exist, which is expected behavior."

  - task: "Conversations/Messaging"
    implemented: true
    working: true
    file: "/app/backend/server.py"
    stuck_count: 0
    priority: "medium"
    needs_retesting: false
    status_history:
      - working: true
        agent: "testing"
        comment: "Previously working"
      - working: NA
        agent: "main"
        comment: "v2.0 - needs retesting"
      - working: true
        agent: "testing"
        comment: "GET /api/conversations working correctly. Returns empty list when no conversations exist, which is expected behavior."
    file: "/app/backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "main"
        comment: "Discover endpoint with role filters working"

frontend:
  - task: "Login Screen (Email/Password + Google OAuth)"
    implemented: true
    working: "NA"
    file: "/app/frontend/app/(auth)/login.tsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: true

  - task: "Registration Screen with Role Selection"
    implemented: true
    working: "NA"
    file: "/app/frontend/app/(auth)/register.tsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: true

  - task: "Onboarding Flow"
    implemented: true
    working: "NA"
    file: "/app/frontend/app/(auth)/onboarding.tsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: true

  - task: "Social Feed with Posts"
    implemented: true
    working: "NA"
    file: "/app/frontend/app/(tabs)/feed.tsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: true

  - task: "Discover/Matching Screen"
    implemented: true
    working: "NA"
    file: "/app/frontend/app/(tabs)/discover.tsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: true

  - task: "Connections/Network Screen"
    implemented: true
    working: "NA"
    file: "/app/frontend/app/(tabs)/connections.tsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: true

  - task: "Messages/Conversations Screen"
    implemented: true
    working: "NA"
    file: "/app/frontend/app/(tabs)/messages.tsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: true

  - task: "User Profile Screen"
    implemented: true
    working: "NA"
    file: "/app/frontend/app/(tabs)/profile.tsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: true

  - task: "Chat Screen"
    implemented: true
    working: "NA"
    file: "/app/frontend/app/chat/[id].tsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: true

  - task: "User Profile Detail Screen"
    implemented: true
    working: "NA"
    file: "/app/frontend/app/user/[id].tsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: true

metadata:
  created_by: "main_agent"
  version: "1.0"
  test_sequence: 1
  run_ui: false

test_plan:
  current_focus:
    - "Login and Registration Flow"
    - "Social Feed functionality"
  stuck_tasks: []
  test_all: false
  test_priority: "high_first"

agent_communication:
  - agent: "main"
    message: "Initial MVP implementation complete. All backend APIs tested with curl and working. Frontend screens implemented with all major features. Ready for UI testing."
  - agent: "testing"
    message: "Backend API comprehensive testing completed. All 13 requested API flows tested and working: registration, login, profile management, posts CRUD, likes/comments, discovery, connections, messaging, and conversations. AI recommendations and Google OAuth endpoints validated. Only minor issue found was in connection request test due to test data handling, but actual API functionality is working correctly. Backend APIs are production-ready with 95.7% success rate."
  - agent: "testing"
    message: "CoFounderBay v2.0 backend testing completed successfully! All high-priority backend APIs tested with specific test sequence: ✅ Authentication (register/login), ✅ Posts CRUD (create/read/react/comment), ✅ User Discovery with role filters, ✅ Opportunities (get/create), ✅ Connections, ✅ Conversations, ✅ Profile management. 100% success rate achieved. All requested API endpoints working correctly with proper authentication and data handling."