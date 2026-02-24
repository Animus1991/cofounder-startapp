"""
CoFounderBay Database Seed Script
Seeds the database with initial data for all features
"""
import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from datetime import datetime, timezone, timedelta
from uuid import uuid4
from dotenv import load_dotenv

load_dotenv()

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

async def seed_database():
    client = AsyncIOMotorClient(os.environ['MONGO_URL'])
    db = client[os.environ.get('DB_NAME', 'cofounderbay')]
    
    print("Starting database seed...")
    
    # ============== SEED USERS ==============
    users = [
        {
            "user_id": f"user_{uuid4().hex[:12]}",
            "email": "sarah@cofounderbay.com",
            "password_hash": pwd_context.hash("Demo1234!"),
            "name": "Sarah Johnson",
            "roles": ["mentor", "founder"],
            "status": "active",
            "is_verified": True,
            "trust_score": 95,
            "connection_count": 124,
            "post_count": 45,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "profile": {
                "headline": "Serial Entrepreneur | 3x Founder | YC Alum",
                "bio": "15+ years building startups from 0 to IPO. Passionate about helping early-stage founders navigate their journey. Previously founded and sold two B2B SaaS companies.",
                "location": "San Francisco, CA",
                "remote_ok": True,
                "availability_hours": 10,
                "skills": ["Fundraising", "Product Strategy", "Team Building", "Go-to-Market", "B2B Sales"],
                "sectors": ["SaaS", "FinTech", "AI/ML"],
                "interests": ["Mentoring", "Angel Investing", "Startup Ecosystem"],
                "looking_for": "Looking to mentor early-stage founders and potentially join as an advisor",
                "linkedin_url": "https://linkedin.com/in/sarahjohnson",
                "verification_status": "verified"
            },
            "mentor_info": {
                "expertise": ["Fundraising", "Product Strategy", "Team Building"],
                "hourly_rate": 150,
                "availability": "Weekdays 9am-5pm PST",
                "total_sessions": 124,
                "avg_rating": 4.9,
                "is_accepting": True
            }
        },
        {
            "user_id": f"user_{uuid4().hex[:12]}",
            "email": "michael@cofounderbay.com",
            "password_hash": pwd_context.hash("Demo1234!"),
            "name": "Michael Chen",
            "roles": ["mentor", "talent"],
            "status": "active",
            "is_verified": True,
            "trust_score": 92,
            "connection_count": 89,
            "post_count": 23,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "profile": {
                "headline": "Tech Lead @ Google | Startup Advisor | Ex-Facebook",
                "bio": "10+ years in big tech, now helping founders build scalable systems. Expert in distributed systems, ML infrastructure, and engineering leadership.",
                "location": "New York, NY",
                "remote_ok": True,
                "availability_hours": 8,
                "skills": ["System Design", "Engineering Leadership", "AI/ML", "Cloud Architecture", "Technical Hiring"],
                "sectors": ["AI/ML", "Cloud", "Developer Tools"],
                "interests": ["Technical Mentoring", "Startup Advisory"],
                "looking_for": "Technical advisor roles for AI/ML startups",
                "linkedin_url": "https://linkedin.com/in/michaelchen",
                "verification_status": "verified"
            },
            "mentor_info": {
                "expertise": ["System Design", "Engineering Leadership", "AI/ML"],
                "hourly_rate": 200,
                "availability": "Weekends",
                "total_sessions": 89,
                "avg_rating": 4.8,
                "is_accepting": True
            }
        },
        {
            "user_id": f"user_{uuid4().hex[:12]}",
            "email": "emily@cofounderbay.com",
            "password_hash": pwd_context.hash("Demo1234!"),
            "name": "Emily Rodriguez",
            "roles": ["mentor", "founder"],
            "status": "active",
            "is_verified": True,
            "trust_score": 97,
            "connection_count": 156,
            "post_count": 67,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "profile": {
                "headline": "Growth Expert | Ex-Uber, Ex-Airbnb | Advisor to 20+ Startups",
                "bio": "Scaled multiple products from 0 to millions of users. Specialist in growth loops, viral mechanics, and data-driven experimentation.",
                "location": "Austin, TX",
                "remote_ok": True,
                "availability_hours": 15,
                "skills": ["Growth Hacking", "Marketing", "Analytics", "User Acquisition", "Retention"],
                "sectors": ["Consumer", "Marketplace", "SaaS"],
                "interests": ["Growth Advisory", "Angel Investing"],
                "looking_for": "Growth advisor roles and potential co-founder opportunities",
                "linkedin_url": "https://linkedin.com/in/emilyrodriguez",
                "verification_status": "verified"
            },
            "mentor_info": {
                "expertise": ["Growth Hacking", "Marketing", "Analytics"],
                "hourly_rate": 175,
                "availability": "Flexible",
                "total_sessions": 156,
                "avg_rating": 4.95,
                "is_accepting": True
            }
        },
        {
            "user_id": f"user_{uuid4().hex[:12]}",
            "email": "david@cofounderbay.com",
            "password_hash": pwd_context.hash("Demo1234!"),
            "name": "David Park",
            "roles": ["investor"],
            "status": "active",
            "is_verified": True,
            "trust_score": 98,
            "connection_count": 234,
            "post_count": 12,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "profile": {
                "headline": "Partner @ Sequoia Capital | Early-stage Investor",
                "bio": "Investing in exceptional founders building the future. Focus on AI, fintech, and enterprise software. Former founder with 2 exits.",
                "location": "Palo Alto, CA",
                "remote_ok": False,
                "skills": ["Venture Capital", "Due Diligence", "Portfolio Management"],
                "sectors": ["AI/ML", "FinTech", "Enterprise"],
                "interests": ["Deal Flow", "Founder Mentoring"],
                "looking_for": "Seed to Series A investments in AI and fintech",
                "linkedin_url": "https://linkedin.com/in/davidpark",
                "verification_status": "verified"
            },
            "investor_profile": {
                "firm": "Sequoia Capital",
                "thesis": "Investing in AI-first companies transforming traditional industries",
                "ticket_min": 500000,
                "ticket_max": 5000000,
                "stages": ["seed", "series_a"],
                "sectors": ["AI/ML", "FinTech", "Enterprise"],
                "portfolio_count": 45
            }
        },
        {
            "user_id": f"user_{uuid4().hex[:12]}",
            "email": "lisa@cofounderbay.com",
            "password_hash": pwd_context.hash("Demo1234!"),
            "name": "Lisa Wang",
            "roles": ["founder"],
            "status": "active",
            "is_verified": True,
            "trust_score": 85,
            "connection_count": 67,
            "post_count": 34,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "profile": {
                "headline": "Founder & CEO @ TechFlow | Building the future of work",
                "bio": "Building TechFlow - an AI-powered workflow automation platform. Previously Product Manager at Stripe. Stanford MBA.",
                "location": "San Francisco, CA",
                "remote_ok": True,
                "availability_hours": 5,
                "skills": ["Product Management", "Strategy", "AI/ML", "Enterprise Sales"],
                "sectors": ["SaaS", "AI/ML", "Productivity"],
                "interests": ["Co-founder Search", "Fundraising", "Networking"],
                "looking_for": "Technical co-founder with ML/AI expertise",
                "linkedin_url": "https://linkedin.com/in/lisawang",
                "verification_status": "verified"
            }
        },
        {
            "user_id": f"user_{uuid4().hex[:12]}",
            "email": "james@cofounderbay.com",
            "password_hash": pwd_context.hash("Demo1234!"),
            "name": "James Miller",
            "roles": ["talent", "service_provider"],
            "status": "active",
            "is_verified": True,
            "trust_score": 88,
            "connection_count": 45,
            "post_count": 19,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "profile": {
                "headline": "Full-Stack Developer | React/Node Expert | Startup Builder",
                "bio": "8 years of experience building scalable web applications. Worked with 15+ startups from MVP to scale. Available for co-founder roles or contract work.",
                "location": "Remote",
                "remote_ok": True,
                "availability_hours": 40,
                "skills": ["React", "Node.js", "TypeScript", "AWS", "System Design"],
                "sectors": ["SaaS", "FinTech", "E-commerce"],
                "interests": ["Co-founding", "Contract Work", "Technical Advisory"],
                "looking_for": "Technical co-founder role with equity or high-impact contract projects",
                "linkedin_url": "https://linkedin.com/in/jamesmiller",
                "verification_status": "verified"
            }
        }
    ]
    
    # Clear existing users and insert new ones
    await db.users.delete_many({})
    for user in users:
        await db.users.insert_one(user)
    print(f"Seeded {len(users)} users")
    
    # Store user IDs for relationships
    user_ids = [u["user_id"] for u in users]
    
    # ============== SEED COURSES ==============
    courses = [
        {
            "course_id": f"course_{uuid4().hex[:12]}",
            "title": "Fundraising Masterclass: From Seed to Series A",
            "description": "Learn the art and science of raising venture capital from experienced founders and investors. Covers pitch deck creation, investor targeting, term sheet negotiation, and closing rounds.",
            "instructor": "Sarah Johnson",
            "instructor_id": user_ids[0],
            "category": "Fundraising",
            "difficulty": "intermediate",
            "duration_hours": 8,
            "lessons_count": 24,
            "enrolled_count": 2340,
            "avg_rating": 4.9,
            "tags": ["VC", "Pitch Deck", "Term Sheets", "Investor Relations"],
            "price": 0,
            "is_free": True,
            "modules": [
                {"title": "Understanding the VC Landscape", "duration": 45},
                {"title": "Building Your Pitch Deck", "duration": 60},
                {"title": "Finding the Right Investors", "duration": 30},
                {"title": "The Art of the Pitch", "duration": 45},
                {"title": "Term Sheet Negotiation", "duration": 60},
                {"title": "Due Diligence Preparation", "duration": 45},
            ],
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "course_id": f"course_{uuid4().hex[:12]}",
            "title": "Product-Market Fit: Finding Your First 100 Customers",
            "description": "A practical guide to validating your startup idea and acquiring early adopters. Learn customer discovery techniques, MVP validation, and iteration strategies.",
            "instructor": "Emily Rodriguez",
            "instructor_id": user_ids[2],
            "category": "Product",
            "difficulty": "beginner",
            "duration_hours": 6,
            "lessons_count": 18,
            "enrolled_count": 3120,
            "avg_rating": 4.8,
            "tags": ["PMF", "Customer Discovery", "MVP", "Validation"],
            "price": 49,
            "is_free": False,
            "modules": [
                {"title": "What is Product-Market Fit?", "duration": 30},
                {"title": "Customer Discovery Interviews", "duration": 45},
                {"title": "Building Your MVP", "duration": 60},
                {"title": "Measuring PMF Signals", "duration": 45},
                {"title": "Iterating Based on Feedback", "duration": 45},
            ],
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "course_id": f"course_{uuid4().hex[:12]}",
            "title": "Growth Hacking for Startups",
            "description": "Data-driven strategies to scale your startup from zero to millions of users. Covers acquisition channels, retention mechanics, and viral growth loops.",
            "instructor": "Emily Rodriguez",
            "instructor_id": user_ids[2],
            "category": "Growth",
            "difficulty": "intermediate",
            "duration_hours": 10,
            "lessons_count": 32,
            "enrolled_count": 1890,
            "avg_rating": 4.7,
            "tags": ["Acquisition", "Retention", "Analytics", "Viral Growth"],
            "price": 79,
            "is_free": False,
            "modules": [
                {"title": "The Growth Mindset", "duration": 30},
                {"title": "Acquisition Channels Deep Dive", "duration": 90},
                {"title": "Retention & Engagement", "duration": 60},
                {"title": "Viral Mechanics", "duration": 45},
                {"title": "Analytics & Experimentation", "duration": 60},
            ],
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "course_id": f"course_{uuid4().hex[:12]}",
            "title": "Technical Leadership for Startup CTOs",
            "description": "How to build and lead engineering teams in fast-growing startups. Covers hiring, architecture decisions, technical debt, and scaling teams.",
            "instructor": "Michael Chen",
            "instructor_id": user_ids[1],
            "category": "Engineering",
            "difficulty": "advanced",
            "duration_hours": 12,
            "lessons_count": 28,
            "enrolled_count": 980,
            "avg_rating": 4.9,
            "tags": ["Team Building", "Architecture", "Scaling", "Technical Leadership"],
            "price": 99,
            "is_free": False,
            "modules": [
                {"title": "The CTO Role in Startups", "duration": 45},
                {"title": "Building Your First Engineering Team", "duration": 60},
                {"title": "Architecture for Scale", "duration": 90},
                {"title": "Managing Technical Debt", "duration": 45},
                {"title": "Engineering Culture", "duration": 60},
            ],
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "course_id": f"course_{uuid4().hex[:12]}",
            "title": "Startup Finance Fundamentals",
            "description": "Essential financial skills every founder needs to know. Covers financial modeling, unit economics, burn rate management, and investor reporting.",
            "instructor": "Sarah Johnson",
            "instructor_id": user_ids[0],
            "category": "Finance",
            "difficulty": "beginner",
            "duration_hours": 5,
            "lessons_count": 15,
            "enrolled_count": 2100,
            "avg_rating": 4.6,
            "tags": ["Accounting", "Budgeting", "Metrics", "Financial Modeling"],
            "price": 0,
            "is_free": True,
            "modules": [
                {"title": "Startup Financial Basics", "duration": 30},
                {"title": "Unit Economics Deep Dive", "duration": 45},
                {"title": "Burn Rate & Runway", "duration": 30},
                {"title": "Financial Modeling 101", "duration": 60},
                {"title": "Investor Reporting", "duration": 45},
            ],
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "course_id": f"course_{uuid4().hex[:12]}",
            "title": "Building a Winning Go-to-Market Strategy",
            "description": "Learn how to launch your product and capture market share. Covers positioning, pricing, sales channels, and market entry strategies.",
            "instructor": "Emily Rodriguez",
            "instructor_id": user_ids[2],
            "category": "Marketing",
            "difficulty": "intermediate",
            "duration_hours": 7,
            "lessons_count": 21,
            "enrolled_count": 1650,
            "avg_rating": 4.8,
            "tags": ["GTM", "Positioning", "Pricing", "Sales"],
            "price": 59,
            "is_free": False,
            "modules": [
                {"title": "Market Analysis Framework", "duration": 45},
                {"title": "Positioning & Messaging", "duration": 60},
                {"title": "Pricing Strategies", "duration": 45},
                {"title": "Sales Channel Selection", "duration": 45},
                {"title": "Launch Planning", "duration": 60},
            ],
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    await db.courses.delete_many({})
    for course in courses:
        await db.courses.insert_one(course)
    print(f"Seeded {len(courses)} courses")
    
    # ============== SEED MARKETPLACE TOOLS ==============
    tools = [
        {
            "tool_id": f"tool_{uuid4().hex[:12]}",
            "name": "Notion",
            "description": "All-in-one workspace for notes, docs, wikis, and project management. Perfect for startup teams to organize everything in one place.",
            "category": "Productivity",
            "url": "https://notion.so",
            "pricing": "Free tier available, $8/user/mo for teams",
            "avg_rating": 4.8,
            "review_count": 2450,
            "tags": ["Documentation", "Project Management", "Wiki", "Collaboration"],
            "features": ["Templates", "Databases", "Real-time collaboration", "API"],
            "startup_discount": "50% off for startups",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "tool_id": f"tool_{uuid4().hex[:12]}",
            "name": "Stripe",
            "description": "Payment infrastructure for the internet. Accept payments, send payouts, and manage business online.",
            "category": "Finance",
            "url": "https://stripe.com",
            "pricing": "2.9% + 30¢ per transaction",
            "avg_rating": 4.9,
            "review_count": 3200,
            "tags": ["Payments", "Billing", "Subscriptions", "Financial Infrastructure"],
            "features": ["Payment processing", "Invoicing", "Subscriptions", "Connect"],
            "startup_discount": "No transaction fees on first $25K",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "tool_id": f"tool_{uuid4().hex[:12]}",
            "name": "Figma",
            "description": "Collaborative interface design tool. Design, prototype, and gather feedback all in one place.",
            "category": "Design",
            "url": "https://figma.com",
            "pricing": "Free for individuals, $12/editor/mo for teams",
            "avg_rating": 4.9,
            "review_count": 1890,
            "tags": ["Design", "Prototyping", "Collaboration", "UI/UX"],
            "features": ["Real-time collaboration", "Prototyping", "Design systems", "Dev handoff"],
            "startup_discount": "Free for 2 years for startups",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "tool_id": f"tool_{uuid4().hex[:12]}",
            "name": "Mixpanel",
            "description": "Product analytics platform. Understand user behavior and make data-driven product decisions.",
            "category": "Analytics",
            "url": "https://mixpanel.com",
            "pricing": "Free up to 100K events/mo, paid plans from $25/mo",
            "avg_rating": 4.6,
            "review_count": 980,
            "tags": ["Analytics", "Product", "User Behavior", "Data"],
            "features": ["Event tracking", "Funnels", "Retention analysis", "A/B testing"],
            "startup_discount": "$50K in credits for startups",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "tool_id": f"tool_{uuid4().hex[:12]}",
            "name": "Intercom",
            "description": "Customer messaging platform. Engage customers with targeted messages and provide support at scale.",
            "category": "Marketing",
            "url": "https://intercom.com",
            "pricing": "From $74/mo for startups",
            "avg_rating": 4.5,
            "review_count": 1560,
            "tags": ["Customer Support", "Chat", "Marketing", "Engagement"],
            "features": ["Live chat", "Chatbots", "Product tours", "Help center"],
            "startup_discount": "95% off for early-stage startups",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "tool_id": f"tool_{uuid4().hex[:12]}",
            "name": "Vercel",
            "description": "Frontend cloud platform. Deploy web projects with zero configuration and global edge network.",
            "category": "Development",
            "url": "https://vercel.com",
            "pricing": "Free for hobby, $20/user/mo for teams",
            "avg_rating": 4.8,
            "review_count": 2100,
            "tags": ["Deployment", "Hosting", "Frontend", "DevOps"],
            "features": ["Instant deploys", "Edge network", "Analytics", "Preview deployments"],
            "startup_discount": "Free Pro plan for startups",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "tool_id": f"tool_{uuid4().hex[:12]}",
            "name": "Linear",
            "description": "Issue tracking and project management for modern software teams. Streamlined, fast, and keyboard-first.",
            "category": "Productivity",
            "url": "https://linear.app",
            "pricing": "Free for small teams, $8/user/mo for standard",
            "avg_rating": 4.9,
            "review_count": 1340,
            "tags": ["Issue Tracking", "Project Management", "Agile", "Engineering"],
            "features": ["Cycles", "Roadmaps", "Git integration", "API"],
            "startup_discount": "Free for teams under 10",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "tool_id": f"tool_{uuid4().hex[:12]}",
            "name": "Segment",
            "description": "Customer data platform. Collect, clean, and control customer data with a single API.",
            "category": "Analytics",
            "url": "https://segment.com",
            "pricing": "Free up to 1K visitors/mo, paid plans from $120/mo",
            "avg_rating": 4.7,
            "review_count": 890,
            "tags": ["CDP", "Data", "Integration", "Analytics"],
            "features": ["Data collection", "Integrations", "Identity resolution", "Privacy"],
            "startup_discount": "$25K in credits for startups",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    await db.marketplace_tools.delete_many({})
    for tool in tools:
        await db.marketplace_tools.insert_one(tool)
    print(f"Seeded {len(tools)} marketplace tools")
    
    # ============== SEED EVENTS ==============
    now = datetime.now(timezone.utc)
    events = [
        {
            "event_id": f"event_{uuid4().hex[:12]}",
            "title": "AI Startup Demo Day",
            "description": "Watch 10 AI startups pitch their innovations to top VCs. Networking reception to follow.",
            "event_type": "hybrid",
            "start_time": (now + timedelta(days=7)).isoformat(),
            "end_time": (now + timedelta(days=7, hours=3)).isoformat(),
            "location": "San Francisco, CA + Virtual",
            "virtual_link": "https://zoom.us/demo-day",
            "organizer_id": user_ids[3],
            "tags": ["AI", "Demo Day", "Pitch", "VC"],
            "max_attendees": 200,
            "attendees_count": 145,
            "attendees": [],
            "is_featured": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "event_id": f"event_{uuid4().hex[:12]}",
            "title": "Founder Coffee Chat - NYC",
            "description": "Informal morning coffee meetup for NYC founders. Share updates, challenges, and wins.",
            "event_type": "offline",
            "start_time": (now + timedelta(days=3)).isoformat(),
            "end_time": (now + timedelta(days=3, hours=2)).isoformat(),
            "location": "Blue Bottle Coffee, Williamsburg, Brooklyn",
            "organizer_id": user_ids[4],
            "tags": ["Networking", "Founders", "NYC", "Coffee"],
            "max_attendees": 25,
            "attendees_count": 18,
            "attendees": [],
            "is_featured": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "event_id": f"event_{uuid4().hex[:12]}",
            "title": "Masterclass: Building Your Pitch Deck",
            "description": "Live workshop on creating compelling pitch decks. Includes real-time feedback sessions.",
            "event_type": "online",
            "start_time": (now + timedelta(days=14)).isoformat(),
            "end_time": (now + timedelta(days=14, hours=2)).isoformat(),
            "virtual_link": "https://zoom.us/pitch-deck-workshop",
            "organizer_id": user_ids[0],
            "tags": ["Fundraising", "Pitch Deck", "Workshop", "Learning"],
            "max_attendees": 100,
            "attendees_count": 67,
            "attendees": [],
            "is_featured": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "event_id": f"event_{uuid4().hex[:12]}",
            "title": "FinTech Founders Dinner",
            "description": "Exclusive dinner for FinTech founders. Intimate setting to discuss industry challenges.",
            "event_type": "offline",
            "start_time": (now + timedelta(days=10)).isoformat(),
            "end_time": (now + timedelta(days=10, hours=3)).isoformat(),
            "location": "Private venue, San Francisco",
            "organizer_id": user_ids[3],
            "tags": ["FinTech", "Networking", "Dinner", "Founders"],
            "max_attendees": 30,
            "attendees_count": 28,
            "attendees": [],
            "is_featured": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "event_id": f"event_{uuid4().hex[:12]}",
            "title": "Growth Hacking AMA with Emily Rodriguez",
            "description": "Ask anything about growth strategies. Live Q&A session with growth expert Emily Rodriguez.",
            "event_type": "online",
            "start_time": (now + timedelta(days=5)).isoformat(),
            "end_time": (now + timedelta(days=5, hours=1, minutes=30)).isoformat(),
            "virtual_link": "https://zoom.us/growth-ama",
            "organizer_id": user_ids[2],
            "tags": ["Growth", "AMA", "Marketing", "Q&A"],
            "max_attendees": 500,
            "attendees_count": 234,
            "attendees": [],
            "is_featured": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    await db.events.delete_many({})
    for event in events:
        await db.events.insert_one(event)
    print(f"Seeded {len(events)} events")
    
    # ============== SEED GROUPS ==============
    groups = [
        {
            "group_id": f"group_{uuid4().hex[:12]}",
            "name": "Early Stage Founders",
            "description": "A community for pre-seed and seed stage founders to share experiences, challenges, and victories. Get advice, find co-founders, and grow together.",
            "category": "Founders",
            "privacy": "public",
            "cover_image": None,
            "tags": ["Pre-seed", "Seed", "Networking", "Support"],
            "members": [user_ids[4], user_ids[5]],
            "admins": [user_ids[4]],
            "member_count": 3420,
            "post_count": 890,
            "created_by": user_ids[4],
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "group_id": f"group_{uuid4().hex[:12]}",
            "name": "Angel Investors Network",
            "description": "Connect with fellow angel investors, share deal flow, and discuss investment strategies. Private group for verified investors.",
            "category": "Investors",
            "privacy": "private",
            "cover_image": None,
            "tags": ["Angel Investing", "Deal Flow", "Due Diligence"],
            "members": [user_ids[3]],
            "admins": [user_ids[3]],
            "member_count": 890,
            "post_count": 234,
            "created_by": user_ids[3],
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "group_id": f"group_{uuid4().hex[:12]}",
            "name": "Startup CTOs",
            "description": "Technical leadership discussions, architecture decisions, and engineering team management. For CTOs, VPs of Engineering, and tech leads.",
            "category": "Engineering",
            "privacy": "public",
            "cover_image": None,
            "tags": ["CTO", "Engineering", "Leadership", "Architecture"],
            "members": [user_ids[1], user_ids[5]],
            "admins": [user_ids[1]],
            "member_count": 2100,
            "post_count": 567,
            "created_by": user_ids[1],
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "group_id": f"group_{uuid4().hex[:12]}",
            "name": "Product-Market Fit Lab",
            "description": "Share your PMF journey, get feedback on your ideas, and learn from others experiences. Open discussions and case studies.",
            "category": "Product",
            "privacy": "public",
            "cover_image": None,
            "tags": ["PMF", "Product", "Validation", "Customer Discovery"],
            "members": [user_ids[2], user_ids[4]],
            "admins": [user_ids[2]],
            "member_count": 4500,
            "post_count": 1230,
            "created_by": user_ids[2],
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "group_id": f"group_{uuid4().hex[:12]}",
            "name": "Growth Hackers United",
            "description": "Data-driven growth strategies, A/B testing insights, and acquisition channel discussions. Share what's working for your startup.",
            "category": "Marketing",
            "privacy": "public",
            "cover_image": None,
            "tags": ["Growth", "Marketing", "Analytics", "Experiments"],
            "members": [user_ids[2]],
            "admins": [user_ids[2]],
            "member_count": 2890,
            "post_count": 678,
            "created_by": user_ids[2],
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "group_id": f"group_{uuid4().hex[:12]}",
            "name": "AI/ML Founders",
            "description": "Discuss AI/ML product challenges, model deployment, and AI startup-specific issues. Share resources and learnings.",
            "category": "Industry",
            "privacy": "public",
            "cover_image": None,
            "tags": ["AI", "ML", "Deep Learning", "AI Products"],
            "members": [user_ids[1], user_ids[3], user_ids[4]],
            "admins": [user_ids[1]],
            "member_count": 1560,
            "post_count": 345,
            "created_by": user_ids[1],
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    await db.groups.delete_many({})
    for group in groups:
        await db.groups.insert_one(group)
    print(f"Seeded {len(groups)} groups")
    
    # ============== SEED OPPORTUNITIES ==============
    opportunities = [
        {
            "opportunity_id": f"opp_{uuid4().hex[:12]}",
            "type": "cofounder",
            "title": "Technical Co-Founder for AI Workflow Platform",
            "description": "Looking for a technical co-founder to join TechFlow, an AI-powered workflow automation platform. We have $500K in ARR and are raising our seed round. Need someone with ML/AI expertise and startup experience.",
            "creator_id": user_ids[4],
            "compensation_type": "equity",
            "equity_range": "15-25%",
            "skills_required": ["AI/ML", "Python", "System Design", "Leadership"],
            "commitment": "full_time",
            "location": "San Francisco or Remote",
            "remote_ok": True,
            "stage": "seed",
            "status": "open",
            "applications_count": 12,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "opportunity_id": f"opp_{uuid4().hex[:12]}",
            "type": "full_time",
            "title": "Senior Frontend Engineer",
            "description": "Join our growing engineering team to build beautiful, performant user interfaces. We're a Series A fintech startup with a mission to democratize investing.",
            "creator_id": user_ids[4],
            "compensation_type": "mixed",
            "salary_range": "$150K - $180K + equity",
            "skills_required": ["React", "TypeScript", "GraphQL", "CSS"],
            "commitment": "full_time",
            "location": "New York, NY",
            "remote_ok": True,
            "stage": "series_a",
            "status": "open",
            "applications_count": 34,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "opportunity_id": f"opp_{uuid4().hex[:12]}",
            "type": "advisor",
            "title": "Growth Advisor - B2B SaaS",
            "description": "Seeking an experienced growth advisor to help us scale from $1M to $10M ARR. Looking for someone with B2B SaaS growth experience.",
            "creator_id": user_ids[4],
            "compensation_type": "equity",
            "equity_range": "0.25-0.5%",
            "skills_required": ["Growth", "B2B SaaS", "Marketing", "Analytics"],
            "commitment": "part_time",
            "location": "Remote",
            "remote_ok": True,
            "stage": "seed",
            "status": "open",
            "applications_count": 8,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "opportunity_id": f"opp_{uuid4().hex[:12]}",
            "type": "freelance",
            "title": "UI/UX Designer for Mobile App Redesign",
            "description": "Looking for a talented designer to help us redesign our mobile app. 2-3 month project with potential for ongoing work.",
            "creator_id": user_ids[5],
            "compensation_type": "salary",
            "salary_range": "$80-100/hour",
            "skills_required": ["UI Design", "UX Design", "Figma", "Mobile Design"],
            "commitment": "part_time",
            "location": "Remote",
            "remote_ok": True,
            "stage": "mvp",
            "status": "open",
            "applications_count": 21,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "opportunity_id": f"opp_{uuid4().hex[:12]}",
            "type": "cofounder",
            "title": "Business Co-Founder for Developer Tools Startup",
            "description": "Technical founder looking for a business co-founder. I've built the MVP and have early traction. Need someone to lead sales, marketing, and fundraising.",
            "creator_id": user_ids[5],
            "compensation_type": "equity",
            "equity_range": "40-50%",
            "skills_required": ["Sales", "Marketing", "Fundraising", "Strategy"],
            "commitment": "full_time",
            "location": "San Francisco Bay Area",
            "remote_ok": False,
            "stage": "mvp",
            "status": "open",
            "applications_count": 6,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    await db.opportunities.delete_many({})
    for opp in opportunities:
        await db.opportunities.insert_one(opp)
    print(f"Seeded {len(opportunities)} opportunities")
    
    # ============== SEED POSTS ==============
    posts = [
        {
            "post_id": f"post_{uuid4().hex[:12]}",
            "author_id": user_ids[0],
            "content": "Just closed our seed round! 🎉 Huge thanks to everyone who supported us on this journey. Key learnings: 1) Start fundraising 6 months before you need the money, 2) Build relationships with investors early, 3) Have your metrics ready. Happy to share more details in the comments!",
            "media": [],
            "tags": ["fundraising", "seed", "startup"],
            "visibility": "public",
            "likes_count": 89,
            "comments_count": 23,
            "reposts_count": 12,
            "reactions": [],
            "is_liked": False,
            "created_at": (now - timedelta(hours=5)).isoformat()
        },
        {
            "post_id": f"post_{uuid4().hex[:12]}",
            "author_id": user_ids[1],
            "content": "Hot take: Most startups don't need microservices. A well-designed monolith can take you to $10M+ ARR. Only split when you have clear scaling needs. Save your engineering bandwidth for building features your customers actually want.",
            "media": [],
            "tags": ["engineering", "architecture", "startups"],
            "visibility": "public",
            "likes_count": 156,
            "comments_count": 45,
            "reposts_count": 34,
            "reactions": [],
            "is_liked": False,
            "created_at": (now - timedelta(hours=12)).isoformat()
        },
        {
            "post_id": f"post_{uuid4().hex[:12]}",
            "author_id": user_ids[2],
            "content": "3 growth tactics that actually worked for us:\n\n1. Cold email with personalized Loom videos (8x response rate)\n2. Building in public on Twitter (free distribution)\n3. Partner integrations (borrowed audience)\n\nWhat's working for your startup right now?",
            "media": [],
            "tags": ["growth", "marketing", "tactics"],
            "visibility": "public",
            "likes_count": 234,
            "comments_count": 67,
            "reposts_count": 45,
            "reactions": [],
            "is_liked": False,
            "created_at": (now - timedelta(days=1)).isoformat()
        },
        {
            "post_id": f"post_{uuid4().hex[:12]}",
            "author_id": user_ids[3],
            "content": "What I look for in founders (after 50+ investments):\n\n✅ Deep domain expertise\n✅ Ability to recruit A-players\n✅ Clear thinking under pressure\n✅ Resilience (startup is a marathon)\n✅ Coachability\n\nNotice I didn't mention the idea. Ideas change, founders don't.",
            "media": [],
            "tags": ["investing", "founders", "vc"],
            "visibility": "public",
            "likes_count": 312,
            "comments_count": 89,
            "reposts_count": 67,
            "reactions": [],
            "is_liked": False,
            "created_at": (now - timedelta(days=2)).isoformat()
        },
        {
            "post_id": f"post_{uuid4().hex[:12]}",
            "author_id": user_ids[4],
            "content": "Looking for a technical co-founder! 🚀\n\nBuilding TechFlow - AI-powered workflow automation. We have $500K ARR, 50+ customers, and just got into YC.\n\nLooking for someone with ML/AI expertise who wants to build the future of work.\n\nDM me or check out our opportunity listing!",
            "media": [],
            "tags": ["cofounder", "hiring", "ai"],
            "visibility": "public",
            "likes_count": 67,
            "comments_count": 34,
            "reposts_count": 12,
            "reactions": [],
            "is_liked": False,
            "created_at": (now - timedelta(hours=8)).isoformat()
        }
    ]
    
    await db.posts.delete_many({})
    for post in posts:
        await db.posts.insert_one(post)
    print(f"Seeded {len(posts)} posts")
    
    # ============== SEED INTENT CARDS ==============
    intent_cards = [
        {
            "intent_id": f"intent_{uuid4().hex[:12]}",
            "user_id": user_ids[4],
            "type": "looking_for",
            "title": "Looking for Technical Co-Founder",
            "description": "Seeking a technical co-founder with ML/AI expertise for TechFlow. Offering 15-25% equity for the right person.",
            "stage": "seed",
            "commitment": "full_time",
            "compensation_pref": "equity",
            "skills_needed": ["AI/ML", "Python", "Leadership"],
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "intent_id": f"intent_{uuid4().hex[:12]}",
            "user_id": user_ids[5],
            "type": "offering",
            "title": "Full-Stack Development Services",
            "description": "Available for technical co-founder roles or contract work. 8 years of experience building scalable web applications.",
            "commitment": "full_time",
            "compensation_pref": "mixed",
            "skills_needed": [],
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "intent_id": f"intent_{uuid4().hex[:12]}",
            "user_id": user_ids[0],
            "type": "offering",
            "title": "Mentoring Early-Stage Founders",
            "description": "Offering mentorship sessions for pre-seed and seed stage founders. Focus on fundraising, product strategy, and team building.",
            "commitment": "part_time",
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "intent_id": f"intent_{uuid4().hex[:12]}",
            "user_id": user_ids[3],
            "type": "looking_for",
            "title": "Seed-Stage AI Startups",
            "description": "Actively looking to invest in seed-stage AI/ML startups. Check size $500K-$2M.",
            "stage": "seed",
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    await db.intent_cards.delete_many({})
    for card in intent_cards:
        await db.intent_cards.insert_one(card)
    print(f"Seeded {len(intent_cards)} intent cards")
    
    print("\n✅ Database seeding complete!")
    print(f"   - {len(users)} users (including mentors, investors, founders)")
    print(f"   - {len(courses)} courses")
    print(f"   - {len(tools)} marketplace tools")
    print(f"   - {len(events)} events")
    print(f"   - {len(groups)} groups")
    print(f"   - {len(opportunities)} opportunities")
    print(f"   - {len(posts)} posts")
    print(f"   - {len(intent_cards)} intent cards")

if __name__ == "__main__":
    asyncio.run(seed_database())
