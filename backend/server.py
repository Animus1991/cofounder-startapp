from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Response, Query, Body
from fastapi.security import HTTPBearer
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Literal, Dict, Any, Union
import uuid
from datetime import datetime, timezone, timedelta
import httpx
from passlib.context import CryptContext
from jose import JWTError, jwt
import base64
from collections import defaultdict
import asyncio

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'cofounderbay')]

# JWT Settings
SECRET_KEY = os.getenv("JWT_SECRET", "cofounderbay-secret-key-2025-secure")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 7

# Password hashing
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

# Emergent LLM Key for AI features
EMERGENT_LLM_KEY = os.getenv("EMERGENT_LLM_KEY", "")

# Create the main app
app = FastAPI(title="CoFounderBay API", version="2.0")

# Create router with /api prefix
api_router = APIRouter(prefix="/api")

# Rate limiting storage (in-memory for MVP, use Redis in production)
rate_limit_storage = defaultdict(list)

# ============== ENUMS & TYPES ==============

UserRole = Literal["founder", "investor", "mentor", "service_provider", "talent", "startup_team", "ecosystem_org"]
OrgType = Literal["startup", "investor_org", "accelerator", "university", "ngo", "government"]
StartupStage = Literal["idea", "mvp", "pre_seed", "seed", "series_a", "series_b", "series_c", "growth", "ipo"]
OpportunityType = Literal["cofounder", "full_time", "part_time", "freelance", "internship", "advisor"]
CompensationType = Literal["salary", "equity", "mixed", "unpaid"]
IntentType = Literal["looking_for", "offering"]
PipelineStage = Literal["new", "contacted", "meeting", "due_diligence", "term_sheet", "pass", "invested"]

# ============== PYDANTIC MODELS ==============

# --- Auth Models ---
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: UserRole

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: dict

# --- Profile Models ---
class IntentCard(BaseModel):
    intent_id: Optional[str] = None
    type: IntentType
    title: str
    description: str
    stage: Optional[StartupStage] = None
    commitment: Optional[str] = None  # e.g., "full_time", "10hrs/week"
    compensation_pref: Optional[CompensationType] = None
    skills_needed: List[str] = []
    is_active: bool = True

class PersonProfile(BaseModel):
    headline: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = None
    remote_ok: bool = True
    availability_hours: Optional[int] = None  # hours per week
    linkedin_url: Optional[str] = None
    website: Optional[str] = None
    twitter_url: Optional[str] = None
    github_url: Optional[str] = None
    profile_image: Optional[str] = None
    cover_image: Optional[str] = None
    skills: List[str] = []
    skill_levels: Dict[str, int] = {}  # skill -> level (1-5)
    interests: List[str] = []
    sectors: List[str] = []
    stage_preferences: List[StartupStage] = []
    compensation_preferences: List[CompensationType] = []
    looking_for: Optional[str] = None
    verification_status: str = "unverified"  # unverified, email_verified, id_verified

class UserResponse(BaseModel):
    user_id: str
    email: str
    name: str
    roles: List[UserRole]
    profile: PersonProfile
    intent_cards: List[IntentCard] = []
    connection_count: int = 0
    post_count: int = 0
    trust_score: int = 0  # 0-100, affects rate limits
    created_at: datetime

# --- Organization Models ---
class OrganizationCreate(BaseModel):
    type: OrgType
    name: str
    description: Optional[str] = None
    website: Optional[str] = None
    logo: Optional[str] = None
    location: Optional[str] = None

class StartupProfile(BaseModel):
    stage: StartupStage
    sector: str
    sub_sectors: List[str] = []
    founded_date: Optional[str] = None
    team_size: Optional[int] = None
    traction_metrics: Dict[str, Any] = {}  # flexible metrics
    pitch_deck_url: Optional[str] = None
    funding_raised: Optional[float] = None
    funding_seeking: Optional[float] = None
    one_liner: Optional[str] = None

class InvestorProfile(BaseModel):
    thesis: Optional[str] = None
    ticket_min: Optional[float] = None
    ticket_max: Optional[float] = None
    stages: List[StartupStage] = []
    sectors: List[str] = []
    portfolio_count: int = 0
    check_size_avg: Optional[float] = None

# --- Opportunity Models ---
class OpportunityCreate(BaseModel):
    org_id: Optional[str] = None
    type: OpportunityType
    title: str
    description: str
    requirements: List[str] = []
    skills_required: List[str] = []
    location: Optional[str] = None
    remote_ok: bool = True
    compensation_type: CompensationType
    compensation_details: Optional[str] = None
    equity_range: Optional[str] = None
    commitment: Optional[str] = None
    deadline: Optional[datetime] = None

class ApplicationCreate(BaseModel):
    opportunity_id: str
    message: str
    resume_url: Optional[str] = None
    portfolio_url: Optional[str] = None

# --- Collaboration Models ---
class CollaborationProposal(BaseModel):
    target_user_id: Optional[str] = None
    target_org_id: Optional[str] = None
    title: str
    scope: str
    role: str
    timeframe: Optional[str] = None
    compensation_type: CompensationType
    compensation_details: Optional[str] = None
    milestones: List[str] = []

class WorkspaceTask(BaseModel):
    title: str
    description: Optional[str] = None
    assignee_id: Optional[str] = None
    due_date: Optional[datetime] = None
    status: str = "todo"  # todo, in_progress, done

# --- Mentoring Models ---
class MentorProfileCreate(BaseModel):
    expertise: List[str] = []
    bio: Optional[str] = None
    hourly_rate: Optional[float] = None  # None means free
    is_free: bool = False
    availability: Dict[str, List[str]] = {}  # day -> time slots
    session_duration: int = 60  # minutes
    max_mentees: Optional[int] = None

class BookingCreate(BaseModel):
    mentor_user_id: str
    date: str  # ISO date
    time_slot: str
    topic: str
    notes: Optional[str] = None

class MentorReviewCreate(BaseModel):
    booking_id: str
    rating: int = Field(ge=1, le=5)
    review_text: Optional[str] = None

# --- Learning Models ---
class CourseCreate(BaseModel):
    title: str
    description: str
    level: str  # beginner, intermediate, advanced
    duration_hours: Optional[float] = None
    tags: List[str] = []
    thumbnail: Optional[str] = None

class CourseModuleCreate(BaseModel):
    course_id: str
    title: str
    content_type: str  # video, text, quiz
    content: str  # URL or markdown content
    duration_minutes: Optional[int] = None
    order: int

# --- Marketplace Models ---
class MarketplaceToolCreate(BaseModel):
    name: str
    description: str
    category: str
    url: str
    logo: Optional[str] = None
    pricing: Optional[str] = None
    tags: List[str] = []
    affiliate_url: Optional[str] = None

class ToolReviewCreate(BaseModel):
    tool_id: str
    rating: int = Field(ge=1, le=5)
    review_text: Optional[str] = None
    pros: List[str] = []
    cons: List[str] = []

# --- Event & Group Models ---
class EventCreate(BaseModel):
    title: str
    description: str
    event_type: str  # online, offline, hybrid
    location: Optional[str] = None
    online_url: Optional[str] = None
    start_time: datetime
    end_time: datetime
    max_attendees: Optional[int] = None
    tags: List[str] = []
    cover_image: Optional[str] = None

class GroupCreate(BaseModel):
    name: str
    description: str
    rules: Optional[str] = None
    is_private: bool = False
    tags: List[str] = []
    cover_image: Optional[str] = None

# --- Investor Flow Models ---
class WatchlistCreate(BaseModel):
    name: str
    description: Optional[str] = None

class PipelineItemCreate(BaseModel):
    startup_id: str
    stage: PipelineStage = "new"
    notes: Optional[str] = None
    next_action: Optional[str] = None
    next_action_date: Optional[datetime] = None

# --- Messaging Models ---
class ConversationCreate(BaseModel):
    participant_ids: List[str]
    type: str = "dm"  # dm, group
    name: Optional[str] = None  # for group chats

class MessageCreate(BaseModel):
    conversation_id: str
    content: str
    attachments: List[str] = []

class IntroRequestCreate(BaseModel):
    target_user_id: str
    message: str

# --- Post Models ---
class PostCreate(BaseModel):
    content: str
    media: List[str] = []  # URLs or base64
    tags: List[str] = []
    visibility: str = "public"  # public, connections, private

class CommentCreate(BaseModel):
    content: str

class ReactionCreate(BaseModel):
    type: str = "like"  # like, celebrate, support, insightful

# --- Notification Models ---
class NotificationResponse(BaseModel):
    notification_id: str
    type: str
    title: str
    message: str
    payload: Dict[str, Any] = {}
    is_read: bool
    created_at: datetime

# ============== AUTH HELPERS ==============

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "type": "access"})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def create_refresh_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

async def get_current_user(request: Request) -> dict:
    """Get current user from token"""
    auth_header = request.headers.get("Authorization")
    session_token = request.cookies.get("session_token")
    
    token = None
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]
    elif session_token:
        token = session_token
    
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Check user_sessions (for OAuth)
    session = await db.user_sessions.find_one({"session_token": token})
    if session:
        expires_at = session.get("expires_at")
        if isinstance(expires_at, str):
            expires_at = datetime.fromisoformat(expires_at)
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        if expires_at < datetime.now(timezone.utc):
            raise HTTPException(status_code=401, detail="Session expired")
        
        user = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})
        if user:
            return user
    
    # Check JWT
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user_id = payload.get("sub")
        if user_id:
            user = await db.users.find_one({"user_id": user_id}, {"_id": 0, "password_hash": 0})
            if user:
                return user
    except JWTError:
        pass
    
    raise HTTPException(status_code=401, detail="Invalid token")

async def get_optional_user(request: Request) -> Optional[dict]:
    try:
        return await get_current_user(request)
    except HTTPException:
        return None

# Rate limiting decorator
def check_rate_limit(user_id: str, action: str, limit: int, window_seconds: int) -> bool:
    """Check if user is within rate limit"""
    key = f"{user_id}:{action}"
    now = datetime.now(timezone.utc)
    cutoff = now - timedelta(seconds=window_seconds)
    
    # Clean old entries
    rate_limit_storage[key] = [t for t in rate_limit_storage[key] if t > cutoff]
    
    if len(rate_limit_storage[key]) >= limit:
        return False
    
    rate_limit_storage[key].append(now)
    return True

# ============== HELPER FUNCTIONS ==============

def generate_id(prefix: str) -> str:
    return f"{prefix}_{uuid.uuid4().hex[:12]}"

async def create_notification(user_id: str, type: str, title: str, message: str, payload: dict = {}):
    """Create a notification for a user"""
    notification = {
        "notification_id": generate_id("notif"),
        "user_id": user_id,
        "type": type,
        "title": title,
        "message": message,
        "payload": payload,
        "is_read": False,
        "created_at": datetime.now(timezone.utc)
    }
    await db.notifications.insert_one(notification)
    return notification

async def create_audit_log(actor_id: str, action: str, entity: str, entity_id: str, metadata: dict = {}):
    """Create an audit log entry"""
    log = {
        "log_id": generate_id("audit"),
        "actor_user_id": actor_id,
        "action": action,
        "entity": entity,
        "entity_id": entity_id,
        "metadata": metadata,
        "created_at": datetime.now(timezone.utc)
    }
    await db.audit_logs.insert_one(log)

async def calculate_match_score(user1: dict, user2: dict) -> tuple[float, List[str]]:
    """Calculate compatibility score between two users"""
    score = 0.0
    reasons = []
    
    profile1 = user1.get("profile", {})
    profile2 = user2.get("profile", {})
    
    # Skills overlap
    skills1 = set(profile1.get("skills", []))
    skills2 = set(profile2.get("skills", []))
    skill_overlap = len(skills1 & skills2)
    if skill_overlap > 0:
        score += min(skill_overlap * 0.1, 0.3)
        reasons.append(f"Shares {skill_overlap} skill(s)")
    
    # Interests overlap
    interests1 = set(profile1.get("interests", []))
    interests2 = set(profile2.get("interests", []))
    interest_overlap = len(interests1 & interests2)
    if interest_overlap > 0:
        score += min(interest_overlap * 0.1, 0.3)
        reasons.append(f"Shares {interest_overlap} interest(s)")
    
    # Sector overlap
    sectors1 = set(profile1.get("sectors", []))
    sectors2 = set(profile2.get("sectors", []))
    sector_overlap = len(sectors1 & sectors2)
    if sector_overlap > 0:
        score += 0.2
        reasons.append(f"Same sector focus")
    
    # Stage preference match
    stages1 = set(profile1.get("stage_preferences", []))
    stages2 = set(profile2.get("stage_preferences", []))
    if stages1 & stages2:
        score += 0.1
        reasons.append("Matching stage preferences")
    
    # Role complementarity
    roles1 = set(user1.get("roles", []))
    roles2 = set(user2.get("roles", []))
    complementary_pairs = [
        ({"founder"}, {"investor"}),
        ({"founder"}, {"mentor"}),
        ({"startup_team"}, {"talent"}),
        ({"startup_team"}, {"service_provider"}),
    ]
    for pair1, pair2 in complementary_pairs:
        if (roles1 & pair1 and roles2 & pair2) or (roles1 & pair2 and roles2 & pair1):
            score += 0.2
            reasons.append("Complementary roles")
            break
    
    # Location match
    loc1 = profile1.get("location", "")
    loc2 = profile2.get("location", "")
    if loc1 and loc2 and loc1.lower() == loc2.lower():
        score += 0.1
        reasons.append("Same location")
    
    # Remote compatibility
    if profile1.get("remote_ok") and profile2.get("remote_ok"):
        score += 0.05
    
    return min(score, 1.0), reasons

# ============== AUTH ROUTES ==============

@api_router.post("/auth/register")
async def register(user_data: UserCreate, response: Response):
    """Register with email/password"""
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = generate_id("user")
    hashed_pw = hash_password(user_data.password)
    
    user_doc = {
        "user_id": user_id,
        "email": user_data.email,
        "name": user_data.name,
        "roles": [user_data.role],
        "password_hash": hashed_pw,
        "profile": {
            "headline": None,
            "bio": None,
            "location": None,
            "remote_ok": True,
            "availability_hours": None,
            "linkedin_url": None,
            "website": None,
            "profile_image": None,
            "cover_image": None,
            "skills": [],
            "skill_levels": {},
            "interests": [],
            "sectors": [],
            "stage_preferences": [],
            "compensation_preferences": [],
            "looking_for": None,
            "verification_status": "unverified"
        },
        "intent_cards": [],
        "connection_count": 0,
        "post_count": 0,
        "trust_score": 10,  # New users start with low trust
        "needs_onboarding": True,
        "created_at": datetime.now(timezone.utc),
        "auth_type": "email"
    }
    
    await db.users.insert_one(user_doc)
    await create_audit_log(user_id, "register", "user", user_id)
    
    access_token = create_access_token({"sub": user_id})
    refresh_token = create_refresh_token({"sub": user_id})
    
    response.set_cookie(
        key="session_token", value=access_token, httponly=True,
        secure=True, samesite="none", max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60, path="/"
    )
    
    user_doc.pop("password_hash", None)
    user_doc.pop("_id", None)
    
    return {"access_token": access_token, "refresh_token": refresh_token, "token_type": "bearer", "user": user_doc}

@api_router.post("/auth/login")
async def login(credentials: UserLogin, response: Response):
    """Login with email/password"""
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    
    if not user or not user.get("password_hash"):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    access_token = create_access_token({"sub": user["user_id"]})
    refresh_token = create_refresh_token({"sub": user["user_id"]})
    
    # Update last login
    await db.users.update_one(
        {"user_id": user["user_id"]},
        {"$set": {"last_login_at": datetime.now(timezone.utc)}}
    )
    
    response.set_cookie(
        key="session_token", value=access_token, httponly=True,
        secure=True, samesite="none", max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60, path="/"
    )
    
    user.pop("password_hash", None)
    
    return {"access_token": access_token, "refresh_token": refresh_token, "token_type": "bearer", "user": user}

@api_router.post("/auth/refresh")
async def refresh_token(request: Request, response: Response):
    """Refresh access token"""
    body = await request.json()
    token = body.get("refresh_token")
    
    if not token:
        raise HTTPException(status_code=400, detail="Refresh token required")
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
        
        user_id = payload.get("sub")
        user = await db.users.find_one({"user_id": user_id}, {"_id": 0, "password_hash": 0})
        
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        
        new_access_token = create_access_token({"sub": user_id})
        new_refresh_token = create_refresh_token({"sub": user_id})
        
        response.set_cookie(
            key="session_token", value=new_access_token, httponly=True,
            secure=True, samesite="none", max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60, path="/"
        )
        
        return {"access_token": new_access_token, "refresh_token": new_refresh_token, "token_type": "bearer"}
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

@api_router.post("/auth/session")
async def exchange_session(request: Request, response: Response):
    """Exchange Emergent OAuth session_id for tokens"""
    body = await request.json()
    session_id = body.get("session_id")
    
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id required")
    
    async with httpx.AsyncClient() as client:
        try:
            auth_response = await client.get(
                "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
                headers={"X-Session-ID": session_id}
            )
            if auth_response.status_code != 200:
                raise HTTPException(status_code=401, detail="Invalid session")
            
            auth_data = auth_response.json()
        except Exception as e:
            logging.error(f"Auth exchange error: {e}")
            raise HTTPException(status_code=401, detail="Authentication failed")
    
    email = auth_data.get("email")
    name = auth_data.get("name", "")
    picture = auth_data.get("picture", "")
    emergent_session_token = auth_data.get("session_token", "")
    
    user = await db.users.find_one({"email": email}, {"_id": 0})
    
    if not user:
        user_id = generate_id("user")
        user = {
            "user_id": user_id,
            "email": email,
            "name": name,
            "roles": ["founder"],
            "profile": {
                "headline": None,
                "bio": None,
                "location": None,
                "remote_ok": True,
                "profile_image": picture if picture else None,
                "skills": [],
                "interests": [],
                "sectors": [],
                "verification_status": "email_verified"
            },
            "intent_cards": [],
            "connection_count": 0,
            "post_count": 0,
            "trust_score": 20,  # OAuth users get slightly higher trust
            "needs_onboarding": True,
            "created_at": datetime.now(timezone.utc),
            "auth_type": "google"
        }
        await db.users.insert_one(user)
        await create_audit_log(user_id, "register_oauth", "user", user_id)
    else:
        user_id = user["user_id"]
        if picture and not user.get("profile", {}).get("profile_image"):
            await db.users.update_one(
                {"user_id": user_id},
                {"$set": {"profile.profile_image": picture}}
            )
    
    session_token = emergent_session_token or generate_id("sess")
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    
    await db.user_sessions.update_one(
        {"user_id": user_id},
        {"$set": {"session_token": session_token, "expires_at": expires_at, "updated_at": datetime.now(timezone.utc)}},
        upsert=True
    )
    
    response.set_cookie(
        key="session_token", value=session_token, httponly=True,
        secure=True, samesite="none", max_age=7 * 24 * 60 * 60, path="/"
    )
    
    user.pop("password_hash", None)
    
    return {
        "access_token": session_token,
        "refresh_token": session_token,
        "token_type": "bearer",
        "user": user,
        "needs_onboarding": user.get("needs_onboarding", False)
    }

@api_router.get("/auth/me")
async def get_me(user: dict = Depends(get_current_user)):
    """Get current user profile"""
    user.pop("password_hash", None)
    return user

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    """Logout"""
    session_token = request.cookies.get("session_token")
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    response.delete_cookie(key="session_token", path="/")
    return {"message": "Logged out"}

# ============== PROFILE ROUTES ==============

@api_router.put("/users/profile")
async def update_profile(update_data: dict = Body(...), user: dict = Depends(get_current_user)):
    """Update user profile"""
    allowed_top_level = ["name", "roles"]
    allowed_profile = [
        "headline", "bio", "location", "remote_ok", "availability_hours",
        "linkedin_url", "website", "twitter_url", "github_url",
        "profile_image", "cover_image", "skills", "skill_levels",
        "interests", "sectors", "stage_preferences", "compensation_preferences", "looking_for"
    ]
    
    update_dict = {}
    for key, value in update_data.items():
        if key in allowed_top_level:
            update_dict[key] = value
        elif key in allowed_profile:
            update_dict[f"profile.{key}"] = value
    
    if "roles" in update_data or any(k in update_data for k in allowed_profile):
        update_dict["needs_onboarding"] = False
    
    if update_dict:
        await db.users.update_one({"user_id": user["user_id"]}, {"$set": update_dict})
        await create_audit_log(user["user_id"], "update_profile", "user", user["user_id"])
    
    updated_user = await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0, "password_hash": 0})
    return updated_user

@api_router.get("/users/{user_id}")
async def get_user(user_id: str, current_user: dict = Depends(get_optional_user)):
    """Get user by ID"""
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@api_router.get("/users")
async def list_users(
    role: Optional[str] = None,
    search: Optional[str] = None,
    skills: Optional[str] = None,
    sectors: Optional[str] = None,
    location: Optional[str] = None,
    remote_ok: Optional[bool] = None,
    skip: int = 0,
    limit: int = 20,
    current_user: dict = Depends(get_optional_user)
):
    """List users with filters"""
    query = {}
    
    if role:
        query["roles"] = role
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"profile.headline": {"$regex": search, "$options": "i"}},
            {"profile.bio": {"$regex": search, "$options": "i"}}
        ]
    if skills:
        skill_list = [s.strip() for s in skills.split(",")]
        query["profile.skills"] = {"$in": skill_list}
    if sectors:
        sector_list = [s.strip() for s in sectors.split(",")]
        query["profile.sectors"] = {"$in": sector_list}
    if location:
        query["profile.location"] = {"$regex": location, "$options": "i"}
    if remote_ok is not None:
        query["profile.remote_ok"] = remote_ok
    
    users = await db.users.find(query, {"_id": 0, "password_hash": 0}).skip(skip).limit(limit).to_list(limit)
    return users

# ============== INTENT CARDS ==============

@api_router.post("/intent-cards")
async def create_intent_card(card: IntentCard, user: dict = Depends(get_current_user)):
    """Create an intent card"""
    card_dict = card.dict()
    card_dict["intent_id"] = generate_id("intent")
    card_dict["created_at"] = datetime.now(timezone.utc)
    
    await db.users.update_one(
        {"user_id": user["user_id"]},
        {"$push": {"intent_cards": card_dict}}
    )
    return card_dict

@api_router.put("/intent-cards/{intent_id}")
async def update_intent_card(intent_id: str, card: IntentCard, user: dict = Depends(get_current_user)):
    """Update an intent card"""
    await db.users.update_one(
        {"user_id": user["user_id"], "intent_cards.intent_id": intent_id},
        {"$set": {
            "intent_cards.$.title": card.title,
            "intent_cards.$.description": card.description,
            "intent_cards.$.type": card.type,
            "intent_cards.$.stage": card.stage,
            "intent_cards.$.commitment": card.commitment,
            "intent_cards.$.compensation_pref": card.compensation_pref,
            "intent_cards.$.skills_needed": card.skills_needed,
            "intent_cards.$.is_active": card.is_active
        }}
    )
    return {"message": "Intent card updated"}

@api_router.delete("/intent-cards/{intent_id}")
async def delete_intent_card(intent_id: str, user: dict = Depends(get_current_user)):
    """Delete an intent card"""
    await db.users.update_one(
        {"user_id": user["user_id"]},
        {"$pull": {"intent_cards": {"intent_id": intent_id}}}
    )
    return {"message": "Intent card deleted"}

# ============== ORGANIZATIONS ==============

@api_router.post("/organizations")
async def create_organization(org: OrganizationCreate, user: dict = Depends(get_current_user)):
    """Create an organization"""
    org_id = generate_id("org")
    
    org_doc = {
        "org_id": org_id,
        "type": org.type,
        "name": org.name,
        "description": org.description,
        "website": org.website,
        "logo": org.logo,
        "location": org.location,
        "created_by": user["user_id"],
        "created_at": datetime.now(timezone.utc),
        "members": [{"user_id": user["user_id"], "role": "owner", "joined_at": datetime.now(timezone.utc)}],
        "startup_profile": None,
        "investor_profile": None,
        "is_verified": False
    }
    
    await db.organizations.insert_one(org_doc)
    await create_audit_log(user["user_id"], "create_org", "organization", org_id)
    
    org_doc.pop("_id", None)
    return org_doc

@api_router.get("/organizations/{org_id}")
async def get_organization(org_id: str):
    """Get organization by ID"""
    org = await db.organizations.find_one({"org_id": org_id}, {"_id": 0})
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    return org

@api_router.put("/organizations/{org_id}")
async def update_organization(org_id: str, update_data: dict = Body(...), user: dict = Depends(get_current_user)):
    """Update organization"""
    org = await db.organizations.find_one({"org_id": org_id})
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    
    is_member = any(m["user_id"] == user["user_id"] and m["role"] in ["owner", "admin"] for m in org.get("members", []))
    if not is_member:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    allowed = ["name", "description", "website", "logo", "location"]
    update_dict = {k: v for k, v in update_data.items() if k in allowed}
    
    if update_dict:
        await db.organizations.update_one({"org_id": org_id}, {"$set": update_dict})
    
    return await db.organizations.find_one({"org_id": org_id}, {"_id": 0})

@api_router.put("/organizations/{org_id}/startup-profile")
async def update_startup_profile(org_id: str, profile: StartupProfile, user: dict = Depends(get_current_user)):
    """Update startup profile for an organization"""
    org = await db.organizations.find_one({"org_id": org_id})
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    
    is_member = any(m["user_id"] == user["user_id"] for m in org.get("members", []))
    if not is_member:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.organizations.update_one(
        {"org_id": org_id},
        {"$set": {"startup_profile": profile.dict(), "type": "startup"}}
    )
    return {"message": "Startup profile updated"}

@api_router.put("/organizations/{org_id}/investor-profile")
async def update_investor_profile(org_id: str, profile: InvestorProfile, user: dict = Depends(get_current_user)):
    """Update investor profile for an organization"""
    org = await db.organizations.find_one({"org_id": org_id})
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    
    is_member = any(m["user_id"] == user["user_id"] for m in org.get("members", []))
    if not is_member:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.organizations.update_one(
        {"org_id": org_id},
        {"$set": {"investor_profile": profile.dict(), "type": "investor_org"}}
    )
    return {"message": "Investor profile updated"}

@api_router.get("/organizations")
async def list_organizations(
    type: Optional[str] = None,
    stage: Optional[str] = None,
    sector: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 20
):
    """List organizations"""
    query = {}
    if type:
        query["type"] = type
    if stage:
        query["startup_profile.stage"] = stage
    if sector:
        query["startup_profile.sector"] = {"$regex": sector, "$options": "i"}
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}}
        ]
    
    orgs = await db.organizations.find(query, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
    return orgs

@api_router.post("/organizations/{org_id}/members")
async def add_org_member(org_id: str, member_data: dict = Body(...), user: dict = Depends(get_current_user)):
    """Add member to organization"""
    org = await db.organizations.find_one({"org_id": org_id})
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    
    is_admin = any(m["user_id"] == user["user_id"] and m["role"] in ["owner", "admin"] for m in org.get("members", []))
    if not is_admin:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    new_member = {
        "user_id": member_data["user_id"],
        "role": member_data.get("role", "member"),
        "joined_at": datetime.now(timezone.utc)
    }
    
    await db.organizations.update_one(
        {"org_id": org_id},
        {"$push": {"members": new_member}}
    )
    
    await create_notification(
        member_data["user_id"], "org_invite",
        "Organization Invitation",
        f"You've been added to {org['name']}",
        {"org_id": org_id}
    )
    
    return {"message": "Member added"}

# ============== OPPORTUNITIES ==============

@api_router.post("/opportunities")
async def create_opportunity(opp: OpportunityCreate, user: dict = Depends(get_current_user)):
    """Create an opportunity"""
    opp_id = generate_id("opp")
    
    opp_doc = {
        "opportunity_id": opp_id,
        "creator_id": user["user_id"],
        "org_id": opp.org_id,
        "type": opp.type,
        "title": opp.title,
        "description": opp.description,
        "requirements": opp.requirements,
        "skills_required": opp.skills_required,
        "location": opp.location,
        "remote_ok": opp.remote_ok,
        "compensation_type": opp.compensation_type,
        "compensation_details": opp.compensation_details,
        "equity_range": opp.equity_range,
        "commitment": opp.commitment,
        "deadline": opp.deadline,
        "status": "open",
        "applications_count": 0,
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.opportunities.insert_one(opp_doc)
    opp_doc.pop("_id", None)
    return opp_doc

@api_router.get("/opportunities")
async def list_opportunities(
    type: Optional[str] = None,
    compensation_type: Optional[str] = None,
    skills: Optional[str] = None,
    remote_ok: Optional[bool] = None,
    status: str = "open",
    skip: int = 0,
    limit: int = 20,
    current_user: dict = Depends(get_optional_user)
):
    """List opportunities"""
    query = {"status": status}
    if type:
        query["type"] = type
    if compensation_type:
        query["compensation_type"] = compensation_type
    if skills:
        skill_list = [s.strip() for s in skills.split(",")]
        query["skills_required"] = {"$in": skill_list}
    if remote_ok is not None:
        query["remote_ok"] = remote_ok
    
    opps = await db.opportunities.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    # Enrich with creator info
    for opp in opps:
        creator = await db.users.find_one({"user_id": opp["creator_id"]}, {"_id": 0, "name": 1, "profile.profile_image": 1})
        opp["creator"] = creator
        if opp.get("org_id"):
            org = await db.organizations.find_one({"org_id": opp["org_id"]}, {"_id": 0, "name": 1, "logo": 1})
            opp["organization"] = org
    
    return opps

@api_router.get("/opportunities/{opp_id}")
async def get_opportunity(opp_id: str):
    """Get opportunity by ID"""
    opp = await db.opportunities.find_one({"opportunity_id": opp_id}, {"_id": 0})
    if not opp:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    
    creator = await db.users.find_one({"user_id": opp["creator_id"]}, {"_id": 0, "name": 1, "profile": 1})
    opp["creator"] = creator
    
    return opp

@api_router.post("/opportunities/{opp_id}/apply")
async def apply_to_opportunity(opp_id: str, application: ApplicationCreate, user: dict = Depends(get_current_user)):
    """Apply to an opportunity"""
    opp = await db.opportunities.find_one({"opportunity_id": opp_id})
    if not opp:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    
    if opp["status"] != "open":
        raise HTTPException(status_code=400, detail="Opportunity is not open")
    
    # Check for existing application
    existing = await db.applications.find_one({
        "opportunity_id": opp_id,
        "applicant_id": user["user_id"]
    })
    if existing:
        raise HTTPException(status_code=400, detail="Already applied")
    
    app_id = generate_id("app")
    app_doc = {
        "application_id": app_id,
        "opportunity_id": opp_id,
        "applicant_id": user["user_id"],
        "message": application.message,
        "resume_url": application.resume_url,
        "portfolio_url": application.portfolio_url,
        "status": "pending",
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.applications.insert_one(app_doc)
    await db.opportunities.update_one({"opportunity_id": opp_id}, {"$inc": {"applications_count": 1}})
    
    # Notify opportunity creator
    await create_notification(
        opp["creator_id"], "new_application",
        "New Application",
        f"{user['name']} applied to your opportunity: {opp['title']}",
        {"opportunity_id": opp_id, "application_id": app_id}
    )
    
    app_doc.pop("_id", None)
    return app_doc

@api_router.get("/opportunities/{opp_id}/applications")
async def get_opportunity_applications(opp_id: str, user: dict = Depends(get_current_user)):
    """Get applications for an opportunity"""
    opp = await db.opportunities.find_one({"opportunity_id": opp_id})
    if not opp:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    
    if opp["creator_id"] != user["user_id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    applications = await db.applications.find({"opportunity_id": opp_id}, {"_id": 0}).to_list(100)
    
    for app in applications:
        applicant = await db.users.find_one({"user_id": app["applicant_id"]}, {"_id": 0, "password_hash": 0})
        app["applicant"] = applicant
    
    return applications

@api_router.put("/applications/{app_id}/status")
async def update_application_status(app_id: str, status_data: dict = Body(...), user: dict = Depends(get_current_user)):
    """Update application status"""
    app = await db.applications.find_one({"application_id": app_id})
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    
    opp = await db.opportunities.find_one({"opportunity_id": app["opportunity_id"]})
    if opp["creator_id"] != user["user_id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    new_status = status_data.get("status")
    if new_status not in ["pending", "reviewing", "interview", "accepted", "rejected"]:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    await db.applications.update_one(
        {"application_id": app_id},
        {"$set": {"status": new_status, "updated_at": datetime.now(timezone.utc)}}
    )
    
    # Notify applicant
    await create_notification(
        app["applicant_id"], "application_update",
        "Application Update",
        f"Your application status has been updated to: {new_status}",
        {"application_id": app_id, "opportunity_id": app["opportunity_id"]}
    )
    
    return {"message": "Status updated"}

# ============== COLLABORATION ==============

@api_router.post("/collaborations/propose")
async def create_collaboration_proposal(proposal: CollaborationProposal, user: dict = Depends(get_current_user)):
    """Create a collaboration proposal"""
    prop_id = generate_id("collab")
    
    prop_doc = {
        "proposal_id": prop_id,
        "from_user_id": user["user_id"],
        "to_user_id": proposal.target_user_id,
        "to_org_id": proposal.target_org_id,
        "title": proposal.title,
        "scope": proposal.scope,
        "role": proposal.role,
        "timeframe": proposal.timeframe,
        "compensation_type": proposal.compensation_type,
        "compensation_details": proposal.compensation_details,
        "milestones": proposal.milestones,
        "status": "pending",
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.collaboration_proposals.insert_one(prop_doc)
    
    # Notify target
    target_id = proposal.target_user_id or proposal.target_org_id
    if proposal.target_user_id:
        await create_notification(
            proposal.target_user_id, "collaboration_proposal",
            "Collaboration Proposal",
            f"{user['name']} sent you a collaboration proposal",
            {"proposal_id": prop_id}
        )
    
    prop_doc.pop("_id", None)
    return prop_doc

@api_router.get("/collaborations/proposals")
async def get_my_proposals(user: dict = Depends(get_current_user)):
    """Get collaboration proposals for current user"""
    proposals = await db.collaboration_proposals.find({
        "$or": [
            {"from_user_id": user["user_id"]},
            {"to_user_id": user["user_id"]}
        ]
    }, {"_id": 0}).sort("created_at", -1).to_list(100)
    
    for prop in proposals:
        from_user = await db.users.find_one({"user_id": prop["from_user_id"]}, {"_id": 0, "name": 1, "profile.profile_image": 1})
        prop["from_user"] = from_user
        if prop.get("to_user_id"):
            to_user = await db.users.find_one({"user_id": prop["to_user_id"]}, {"_id": 0, "name": 1, "profile.profile_image": 1})
            prop["to_user"] = to_user
    
    return proposals

@api_router.put("/collaborations/proposals/{prop_id}")
async def update_proposal_status(prop_id: str, status_data: dict = Body(...), user: dict = Depends(get_current_user)):
    """Accept or reject collaboration proposal"""
    prop = await db.collaboration_proposals.find_one({"proposal_id": prop_id})
    if not prop:
        raise HTTPException(status_code=404, detail="Proposal not found")
    
    if prop["to_user_id"] != user["user_id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    new_status = status_data.get("status")
    if new_status not in ["accepted", "rejected", "negotiating"]:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    update = {"status": new_status, "updated_at": datetime.now(timezone.utc)}
    
    # If accepted, create a workspace
    if new_status == "accepted":
        workspace_id = generate_id("workspace")
        workspace = {
            "workspace_id": workspace_id,
            "proposal_id": prop_id,
            "participants": [prop["from_user_id"], prop["to_user_id"]],
            "title": prop["title"],
            "tasks": [],
            "documents": [],
            "created_at": datetime.now(timezone.utc)
        }
        await db.collaboration_workspaces.insert_one(workspace)
        update["workspace_id"] = workspace_id
    
    await db.collaboration_proposals.update_one({"proposal_id": prop_id}, {"$set": update})
    
    # Notify proposer
    await create_notification(
        prop["from_user_id"], "proposal_response",
        f"Proposal {new_status.capitalize()}",
        f"Your collaboration proposal has been {new_status}",
        {"proposal_id": prop_id}
    )
    
    return {"message": f"Proposal {new_status}"}

@api_router.get("/collaborations/workspaces")
async def get_my_workspaces(user: dict = Depends(get_current_user)):
    """Get collaboration workspaces"""
    workspaces = await db.collaboration_workspaces.find(
        {"participants": user["user_id"]},
        {"_id": 0}
    ).to_list(100)
    return workspaces

@api_router.post("/collaborations/workspaces/{workspace_id}/tasks")
async def add_workspace_task(workspace_id: str, task: WorkspaceTask, user: dict = Depends(get_current_user)):
    """Add task to workspace"""
    workspace = await db.collaboration_workspaces.find_one({"workspace_id": workspace_id})
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")
    
    if user["user_id"] not in workspace["participants"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    task_dict = task.dict()
    task_dict["task_id"] = generate_id("task")
    task_dict["created_by"] = user["user_id"]
    task_dict["created_at"] = datetime.now(timezone.utc)
    
    await db.collaboration_workspaces.update_one(
        {"workspace_id": workspace_id},
        {"$push": {"tasks": task_dict}}
    )
    
    return task_dict

# ============== MENTORING ==============

@api_router.post("/mentoring/profile")
async def create_mentor_profile(profile: MentorProfileCreate, user: dict = Depends(get_current_user)):
    """Create or update mentor profile"""
    profile_doc = {
        "user_id": user["user_id"],
        "expertise": profile.expertise,
        "bio": profile.bio,
        "hourly_rate": profile.hourly_rate,
        "is_free": profile.is_free,
        "availability": profile.availability,
        "session_duration": profile.session_duration,
        "max_mentees": profile.max_mentees,
        "total_sessions": 0,
        "avg_rating": 0,
        "review_count": 0,
        "is_active": True,
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.mentor_profiles.update_one(
        {"user_id": user["user_id"]},
        {"$set": profile_doc},
        upsert=True
    )
    
    # Add mentor role if not present
    if "mentor" not in user.get("roles", []):
        await db.users.update_one(
            {"user_id": user["user_id"]},
            {"$addToSet": {"roles": "mentor"}}
        )
    
    return {"message": "Mentor profile created"}

@api_router.get("/mentoring/mentors")
async def list_mentors(
    expertise: Optional[str] = None,
    is_free: Optional[bool] = None,
    skip: int = 0,
    limit: int = 20
):
    """List available mentors"""
    query = {"is_active": True}
    if expertise:
        query["expertise"] = {"$in": [expertise]}
    if is_free is not None:
        query["is_free"] = is_free
    
    mentors = await db.mentor_profiles.find(query, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
    
    for mentor in mentors:
        user = await db.users.find_one({"user_id": mentor["user_id"]}, {"_id": 0, "name": 1, "profile": 1})
        mentor["user"] = user
    
    return mentors

@api_router.post("/mentoring/bookings")
async def create_booking(booking: BookingCreate, user: dict = Depends(get_current_user)):
    """Book a mentoring session"""
    mentor = await db.mentor_profiles.find_one({"user_id": booking.mentor_user_id})
    if not mentor:
        raise HTTPException(status_code=404, detail="Mentor not found")
    
    if not mentor["is_active"]:
        raise HTTPException(status_code=400, detail="Mentor is not accepting bookings")
    
    booking_id = generate_id("booking")
    booking_doc = {
        "booking_id": booking_id,
        "mentor_user_id": booking.mentor_user_id,
        "mentee_user_id": user["user_id"],
        "date": booking.date,
        "time_slot": booking.time_slot,
        "topic": booking.topic,
        "notes": booking.notes,
        "status": "pending",
        "session_notes": None,
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.mentor_bookings.insert_one(booking_doc)
    
    # Notify mentor
    await create_notification(
        booking.mentor_user_id, "new_booking",
        "New Mentoring Booking",
        f"{user['name']} requested a session on {booking.date}",
        {"booking_id": booking_id}
    )
    
    booking_doc.pop("_id", None)
    return booking_doc

@api_router.get("/mentoring/bookings")
async def get_my_bookings(user: dict = Depends(get_current_user)):
    """Get user's bookings (as mentor or mentee)"""
    bookings = await db.mentor_bookings.find({
        "$or": [
            {"mentor_user_id": user["user_id"]},
            {"mentee_user_id": user["user_id"]}
        ]
    }, {"_id": 0}).sort("date", -1).to_list(100)
    
    for booking in bookings:
        mentor = await db.users.find_one({"user_id": booking["mentor_user_id"]}, {"_id": 0, "name": 1, "profile.profile_image": 1})
        mentee = await db.users.find_one({"user_id": booking["mentee_user_id"]}, {"_id": 0, "name": 1, "profile.profile_image": 1})
        booking["mentor"] = mentor
        booking["mentee"] = mentee
    
    return bookings

@api_router.put("/mentoring/bookings/{booking_id}")
async def update_booking(booking_id: str, update_data: dict = Body(...), user: dict = Depends(get_current_user)):
    """Update booking status"""
    booking = await db.mentor_bookings.find_one({"booking_id": booking_id})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    if booking["mentor_user_id"] != user["user_id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    allowed = ["status", "session_notes"]
    update = {k: v for k, v in update_data.items() if k in allowed}
    
    if update:
        update["updated_at"] = datetime.now(timezone.utc)
        await db.mentor_bookings.update_one({"booking_id": booking_id}, {"$set": update})
        
        if "status" in update:
            await create_notification(
                booking["mentee_user_id"], "booking_update",
                "Booking Update",
                f"Your mentoring session has been {update['status']}",
                {"booking_id": booking_id}
            )
        
        if update.get("status") == "completed":
            await db.mentor_profiles.update_one(
                {"user_id": user["user_id"]},
                {"$inc": {"total_sessions": 1}}
            )
    
    return {"message": "Booking updated"}

@api_router.post("/mentoring/reviews")
async def create_mentor_review(review: MentorReviewCreate, user: dict = Depends(get_current_user)):
    """Create a mentor review"""
    booking = await db.mentor_bookings.find_one({"booking_id": review.booking_id})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    if booking["mentee_user_id"] != user["user_id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    if booking["status"] != "completed":
        raise HTTPException(status_code=400, detail="Session not completed")
    
    review_id = generate_id("review")
    review_doc = {
        "review_id": review_id,
        "booking_id": review.booking_id,
        "mentor_user_id": booking["mentor_user_id"],
        "reviewer_user_id": user["user_id"],
        "rating": review.rating,
        "review_text": review.review_text,
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.mentor_reviews.insert_one(review_doc)
    
    # Update mentor avg rating
    reviews = await db.mentor_reviews.find({"mentor_user_id": booking["mentor_user_id"]}).to_list(1000)
    avg_rating = sum(r["rating"] for r in reviews) / len(reviews)
    await db.mentor_profiles.update_one(
        {"user_id": booking["mentor_user_id"]},
        {"$set": {"avg_rating": round(avg_rating, 2), "review_count": len(reviews)}}
    )
    
    review_doc.pop("_id", None)
    return review_doc

# ============== LEARNING ==============

@api_router.post("/learning/courses")
async def create_course(course: CourseCreate, user: dict = Depends(get_current_user)):
    """Create a course (admin only for now)"""
    course_id = generate_id("course")
    
    course_doc = {
        "course_id": course_id,
        "title": course.title,
        "description": course.description,
        "level": course.level,
        "duration_hours": course.duration_hours,
        "tags": course.tags,
        "thumbnail": course.thumbnail,
        "creator_id": user["user_id"],
        "modules": [],
        "enrolled_count": 0,
        "avg_rating": 0,
        "is_published": False,
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.courses.insert_one(course_doc)
    course_doc.pop("_id", None)
    return course_doc

@api_router.get("/learning/courses")
async def list_courses(
    level: Optional[str] = None,
    tags: Optional[str] = None,
    skip: int = 0,
    limit: int = 20
):
    """List published courses"""
    query = {"is_published": True}
    if level:
        query["level"] = level
    if tags:
        tag_list = [t.strip() for t in tags.split(",")]
        query["tags"] = {"$in": tag_list}
    
    courses = await db.courses.find(query, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
    return courses

@api_router.get("/learning/courses/{course_id}")
async def get_course(course_id: str, user: dict = Depends(get_optional_user)):
    """Get course details"""
    course = await db.courses.find_one({"course_id": course_id}, {"_id": 0})
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    if user:
        progress = await db.course_progress.find_one({
            "user_id": user["user_id"],
            "course_id": course_id
        }, {"_id": 0})
        course["user_progress"] = progress
    
    return course

@api_router.post("/learning/courses/{course_id}/modules")
async def add_course_module(course_id: str, module: CourseModuleCreate, user: dict = Depends(get_current_user)):
    """Add module to course"""
    course = await db.courses.find_one({"course_id": course_id})
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    if course["creator_id"] != user["user_id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    module_dict = module.dict()
    module_dict["module_id"] = generate_id("module")
    
    await db.courses.update_one(
        {"course_id": course_id},
        {"$push": {"modules": module_dict}}
    )
    
    return module_dict

@api_router.post("/learning/courses/{course_id}/enroll")
async def enroll_in_course(course_id: str, user: dict = Depends(get_current_user)):
    """Enroll in a course"""
    course = await db.courses.find_one({"course_id": course_id})
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    existing = await db.course_progress.find_one({
        "user_id": user["user_id"],
        "course_id": course_id
    })
    if existing:
        raise HTTPException(status_code=400, detail="Already enrolled")
    
    progress = {
        "user_id": user["user_id"],
        "course_id": course_id,
        "progress_pct": 0,
        "completed_modules": [],
        "enrolled_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }
    
    await db.course_progress.insert_one(progress)
    await db.courses.update_one({"course_id": course_id}, {"$inc": {"enrolled_count": 1}})
    
    return {"message": "Enrolled successfully"}

@api_router.put("/learning/progress/{course_id}")
async def update_course_progress(course_id: str, progress_data: dict = Body(...), user: dict = Depends(get_current_user)):
    """Update course progress"""
    module_id = progress_data.get("completed_module_id")
    
    if module_id:
        await db.course_progress.update_one(
            {"user_id": user["user_id"], "course_id": course_id},
            {
                "$addToSet": {"completed_modules": module_id},
                "$set": {"updated_at": datetime.now(timezone.utc)}
            }
        )
    
    # Calculate progress percentage
    course = await db.courses.find_one({"course_id": course_id})
    progress = await db.course_progress.find_one({"user_id": user["user_id"], "course_id": course_id})
    
    if course and progress:
        total_modules = len(course.get("modules", []))
        completed = len(progress.get("completed_modules", []))
        pct = (completed / total_modules * 100) if total_modules > 0 else 0
        
        await db.course_progress.update_one(
            {"user_id": user["user_id"], "course_id": course_id},
            {"$set": {"progress_pct": round(pct, 1)}}
        )
    
    return {"message": "Progress updated"}

# ============== MARKETPLACE ==============

@api_router.post("/marketplace/tools")
async def create_tool(tool: MarketplaceToolCreate, user: dict = Depends(get_current_user)):
    """Add a tool to marketplace"""
    tool_id = generate_id("tool")
    
    tool_doc = {
        "tool_id": tool_id,
        "name": tool.name,
        "description": tool.description,
        "category": tool.category,
        "url": tool.url,
        "logo": tool.logo,
        "pricing": tool.pricing,
        "tags": tool.tags,
        "affiliate_url": tool.affiliate_url,
        "submitted_by": user["user_id"],
        "avg_rating": 0,
        "review_count": 0,
        "is_approved": False,
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.marketplace_tools.insert_one(tool_doc)
    tool_doc.pop("_id", None)
    return tool_doc

@api_router.get("/marketplace/tools")
async def list_tools(
    category: Optional[str] = None,
    tags: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 20
):
    """List marketplace tools"""
    query = {}
    if category:
        query["category"] = category
    if tags:
        tag_list = [t.strip() for t in tags.split(",")]
        query["tags"] = {"$in": tag_list}
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}}
        ]
    
    tools = await db.marketplace_tools.find(query, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
    return tools

@api_router.post("/marketplace/tools/{tool_id}/reviews")
async def create_tool_review(tool_id: str, review: ToolReviewCreate, user: dict = Depends(get_current_user)):
    """Create a tool review"""
    tool = await db.marketplace_tools.find_one({"tool_id": tool_id})
    if not tool:
        raise HTTPException(status_code=404, detail="Tool not found")
    
    review_id = generate_id("toolrev")
    review_doc = {
        "review_id": review_id,
        "tool_id": tool_id,
        "user_id": user["user_id"],
        "rating": review.rating,
        "review_text": review.review_text,
        "pros": review.pros,
        "cons": review.cons,
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.tool_reviews.insert_one(review_doc)
    
    # Update avg rating
    reviews = await db.tool_reviews.find({"tool_id": tool_id}).to_list(1000)
    avg_rating = sum(r["rating"] for r in reviews) / len(reviews)
    await db.marketplace_tools.update_one(
        {"tool_id": tool_id},
        {"$set": {"avg_rating": round(avg_rating, 2), "review_count": len(reviews)}}
    )
    
    review_doc.pop("_id", None)
    return review_doc

# ============== EVENTS ==============

@api_router.post("/events")
async def create_event(event: EventCreate, user: dict = Depends(get_current_user)):
    """Create an event"""
    event_id = generate_id("event")
    
    event_doc = {
        "event_id": event_id,
        "title": event.title,
        "description": event.description,
        "event_type": event.event_type,
        "location": event.location,
        "online_url": event.online_url,
        "start_time": event.start_time,
        "end_time": event.end_time,
        "max_attendees": event.max_attendees,
        "tags": event.tags,
        "cover_image": event.cover_image,
        "organizer_id": user["user_id"],
        "attendees_count": 0,
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.events.insert_one(event_doc)
    event_doc.pop("_id", None)
    return event_doc

@api_router.get("/events")
async def list_events(
    event_type: Optional[str] = None,
    upcoming: bool = True,
    skip: int = 0,
    limit: int = 20
):
    """List events"""
    query = {}
    if event_type:
        query["event_type"] = event_type
    # For upcoming, we compare with ISO string since dates are stored as strings
    if upcoming:
        now_str = datetime.now(timezone.utc).isoformat()
        query["start_time"] = {"$gte": now_str}
    
    events = await db.events.find(query, {"_id": 0}).sort("start_time", 1).skip(skip).limit(limit).to_list(limit)
    
    for event in events:
        organizer = await db.users.find_one({"user_id": event.get("organizer_id")}, {"_id": 0, "name": 1, "profile.profile_image": 1})
        event["organizer"] = organizer
    
    return events

@api_router.post("/events/{event_id}/rsvp")
async def rsvp_event(event_id: str, user: dict = Depends(get_current_user)):
    """RSVP to an event"""
    event = await db.events.find_one({"event_id": event_id})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    if event.get("max_attendees") and event["attendees_count"] >= event["max_attendees"]:
        raise HTTPException(status_code=400, detail="Event is full")
    
    existing = await db.event_rsvps.find_one({
        "event_id": event_id,
        "user_id": user["user_id"]
    })
    if existing:
        raise HTTPException(status_code=400, detail="Already RSVPed")
    
    rsvp = {
        "rsvp_id": generate_id("rsvp"),
        "event_id": event_id,
        "user_id": user["user_id"],
        "status": "going",
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.event_rsvps.insert_one(rsvp)
    await db.events.update_one({"event_id": event_id}, {"$inc": {"attendees_count": 1}})
    
    return {"message": "RSVPed successfully"}

@api_router.get("/events/{event_id}/attendees")
async def get_event_attendees(event_id: str):
    """Get event attendees"""
    rsvps = await db.event_rsvps.find({"event_id": event_id, "status": "going"}, {"_id": 0}).to_list(500)
    
    attendees = []
    for rsvp in rsvps:
        user = await db.users.find_one({"user_id": rsvp["user_id"]}, {"_id": 0, "name": 1, "profile": 1, "roles": 1})
        if user:
            attendees.append(user)
    
    return attendees

# ============== GROUPS ==============

@api_router.post("/groups")
async def create_group(group: GroupCreate, user: dict = Depends(get_current_user)):
    """Create a group"""
    group_id = generate_id("group")
    
    group_doc = {
        "group_id": group_id,
        "name": group.name,
        "description": group.description,
        "rules": group.rules,
        "is_private": group.is_private,
        "tags": group.tags,
        "cover_image": group.cover_image,
        "creator_id": user["user_id"],
        "moderators": [user["user_id"]],
        "members_count": 1,
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.groups.insert_one(group_doc)
    
    # Add creator as member
    await db.group_members.insert_one({
        "group_id": group_id,
        "user_id": user["user_id"],
        "role": "admin",
        "joined_at": datetime.now(timezone.utc)
    })
    
    group_doc.pop("_id", None)
    return group_doc

@api_router.get("/groups")
async def list_groups(
    search: Optional[str] = None,
    tags: Optional[str] = None,
    category: Optional[str] = None,
    skip: int = 0,
    limit: int = 20,
    user: dict = Depends(get_current_user)
):
    """List groups"""
    query = {}
    # Only show public groups or groups user is a member of
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}}
        ]
    if tags:
        tag_list = [t.strip() for t in tags.split(",")]
        query["tags"] = {"$in": tag_list}
    if category:
        query["category"] = category
    
    groups = await db.groups.find(query, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
    
    # Add membership info
    for group in groups:
        group["is_member"] = user["user_id"] in group.get("members", [])
    
    return groups

@api_router.post("/groups/{group_id}/join")
async def join_group(group_id: str, user: dict = Depends(get_current_user)):
    """Join a group"""
    group = await db.groups.find_one({"group_id": group_id})
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    existing = await db.group_members.find_one({
        "group_id": group_id,
        "user_id": user["user_id"]
    })
    if existing:
        raise HTTPException(status_code=400, detail="Already a member")
    
    await db.group_members.insert_one({
        "group_id": group_id,
        "user_id": user["user_id"],
        "role": "member",
        "joined_at": datetime.now(timezone.utc)
    })
    
    await db.groups.update_one({"group_id": group_id}, {"$inc": {"members_count": 1}})
    
    return {"message": "Joined successfully"}

@api_router.get("/groups/{group_id}/members")
async def get_group_members(group_id: str, skip: int = 0, limit: int = 50):
    """Get group members"""
    members = await db.group_members.find({"group_id": group_id}, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
    
    for member in members:
        user = await db.users.find_one({"user_id": member["user_id"]}, {"_id": 0, "name": 1, "profile": 1})
        member["user"] = user
    
    return members

# ============== INVESTOR FLOW ==============

@api_router.post("/investor/watchlists")
async def create_watchlist(watchlist: WatchlistCreate, user: dict = Depends(get_current_user)):
    """Create investor watchlist"""
    watchlist_id = generate_id("watchlist")
    
    doc = {
        "watchlist_id": watchlist_id,
        "user_id": user["user_id"],
        "name": watchlist.name,
        "description": watchlist.description,
        "startups": [],
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.investor_watchlists.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api_router.get("/investor/watchlists")
async def get_watchlists(user: dict = Depends(get_current_user)):
    """Get user's watchlists"""
    watchlists = await db.investor_watchlists.find({"user_id": user["user_id"]}, {"_id": 0}).to_list(100)
    return watchlists

@api_router.post("/investor/watchlists/{watchlist_id}/add")
async def add_to_watchlist(watchlist_id: str, data: dict = Body(...), user: dict = Depends(get_current_user)):
    """Add startup to watchlist"""
    watchlist = await db.investor_watchlists.find_one({
        "watchlist_id": watchlist_id,
        "user_id": user["user_id"]
    })
    if not watchlist:
        raise HTTPException(status_code=404, detail="Watchlist not found")
    
    await db.investor_watchlists.update_one(
        {"watchlist_id": watchlist_id},
        {"$addToSet": {"startups": data["startup_id"]}}
    )
    
    return {"message": "Added to watchlist"}

@api_router.post("/investor/pipeline")
async def add_to_pipeline(item: PipelineItemCreate, user: dict = Depends(get_current_user)):
    """Add startup to investor pipeline"""
    pipeline_id = generate_id("pipeline")
    
    doc = {
        "pipeline_id": pipeline_id,
        "investor_user_id": user["user_id"],
        "startup_id": item.startup_id,
        "stage": item.stage,
        "notes": item.notes,
        "next_action": item.next_action,
        "next_action_date": item.next_action_date,
        "history": [{
            "stage": item.stage,
            "date": datetime.now(timezone.utc),
            "notes": item.notes
        }],
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.investor_pipeline.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api_router.get("/investor/pipeline")
async def get_pipeline(
    stage: Optional[str] = None,
    user: dict = Depends(get_current_user)
):
    """Get investor pipeline"""
    query = {"investor_user_id": user["user_id"]}
    if stage:
        query["stage"] = stage
    
    items = await db.investor_pipeline.find(query, {"_id": 0}).to_list(500)
    
    for item in items:
        startup = await db.organizations.find_one({"org_id": item["startup_id"]}, {"_id": 0})
        item["startup"] = startup
    
    return items

@api_router.put("/investor/pipeline/{pipeline_id}")
async def update_pipeline_item(pipeline_id: str, update_data: dict = Body(...), user: dict = Depends(get_current_user)):
    """Update pipeline item"""
    item = await db.investor_pipeline.find_one({
        "pipeline_id": pipeline_id,
        "investor_user_id": user["user_id"]
    })
    if not item:
        raise HTTPException(status_code=404, detail="Pipeline item not found")
    
    allowed = ["stage", "notes", "next_action", "next_action_date"]
    update = {k: v for k, v in update_data.items() if k in allowed}
    
    if "stage" in update:
        # Add to history
        await db.investor_pipeline.update_one(
            {"pipeline_id": pipeline_id},
            {"$push": {"history": {
                "stage": update["stage"],
                "date": datetime.now(timezone.utc),
                "notes": update.get("notes")
            }}}
        )
    
    if update:
        update["updated_at"] = datetime.now(timezone.utc)
        await db.investor_pipeline.update_one({"pipeline_id": pipeline_id}, {"$set": update})
    
    return {"message": "Pipeline updated"}

# ============== MESSAGING ==============

@api_router.post("/intro-requests")
async def send_intro_request(request_data: IntroRequestCreate, user: dict = Depends(get_current_user)):
    """Send an intro request"""
    # Check rate limit based on trust score
    limit = 5 + (user.get("trust_score", 0) // 10)  # More trusted users can send more
    if not check_rate_limit(user["user_id"], "intro_request", limit, 3600):
        raise HTTPException(status_code=429, detail="Rate limit exceeded. Try again later.")
    
    target = await db.users.find_one({"user_id": request_data.target_user_id})
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check for existing request
    existing = await db.intro_requests.find_one({
        "from_user_id": user["user_id"],
        "to_user_id": request_data.target_user_id,
        "status": "pending"
    })
    if existing:
        raise HTTPException(status_code=400, detail="Request already pending")
    
    request_id = generate_id("intro")
    doc = {
        "request_id": request_id,
        "from_user_id": user["user_id"],
        "to_user_id": request_data.target_user_id,
        "message": request_data.message,
        "status": "pending",
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.intro_requests.insert_one(doc)
    
    await create_notification(
        request_data.target_user_id, "intro_request",
        "New Introduction Request",
        f"{user['name']} wants to connect with you",
        {"request_id": request_id}
    )
    
    doc.pop("_id", None)
    return doc

@api_router.get("/connections")
async def get_connections(user: dict = Depends(get_current_user)):
    """Get user's connections"""
    # Get accepted intro requests
    requests = await db.intro_requests.find({
        "$or": [
            {"from_user_id": user["user_id"]},
            {"to_user_id": user["user_id"]}
        ],
        "status": "accepted"
    }, {"_id": 0}).sort("created_at", -1).to_list(100)
    
    connections = []
    for req in requests:
        other_id = req["to_user_id"] if req["from_user_id"] == user["user_id"] else req["from_user_id"]
        other_user = await db.users.find_one({"user_id": other_id}, {"_id": 0, "password_hash": 0})
        if other_user:
            connections.append(other_user)
    
    return connections

@api_router.get("/intro-requests")
async def get_intro_requests(user: dict = Depends(get_current_user)):
    """Get intro requests"""
    requests = await db.intro_requests.find({
        "$or": [
            {"from_user_id": user["user_id"]},
            {"to_user_id": user["user_id"]}
        ]
    }, {"_id": 0}).sort("created_at", -1).to_list(100)
    
    for req in requests:
        from_user = await db.users.find_one({"user_id": req["from_user_id"]}, {"_id": 0, "name": 1, "profile": 1})
        to_user = await db.users.find_one({"user_id": req["to_user_id"]}, {"_id": 0, "name": 1, "profile": 1})
        req["from_user"] = from_user
        req["to_user"] = to_user
    
    return requests

@api_router.put("/intro-requests/{request_id}")
async def respond_to_intro(request_id: str, response_data: dict = Body(...), user: dict = Depends(get_current_user)):
    """Accept or reject intro request"""
    req = await db.intro_requests.find_one({"request_id": request_id})
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    
    if req["to_user_id"] != user["user_id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    status = response_data.get("status")
    if status not in ["accepted", "rejected"]:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    await db.intro_requests.update_one(
        {"request_id": request_id},
        {"$set": {"status": status, "responded_at": datetime.now(timezone.utc)}}
    )
    
    if status == "accepted":
        # Create a conversation
        conv_id = generate_id("conv")
        conv = {
            "conversation_id": conv_id,
            "type": "dm",
            "participants": [req["from_user_id"], req["to_user_id"]],
            "created_at": datetime.now(timezone.utc),
            "last_message_at": datetime.now(timezone.utc)
        }
        await db.conversations.insert_one(conv)
        
        # Update connection counts
        await db.users.update_one({"user_id": req["from_user_id"]}, {"$inc": {"connection_count": 1}})
        await db.users.update_one({"user_id": req["to_user_id"]}, {"$inc": {"connection_count": 1}})
        
        # Increase trust score for both
        await db.users.update_one({"user_id": req["from_user_id"]}, {"$inc": {"trust_score": 2}})
        await db.users.update_one({"user_id": req["to_user_id"]}, {"$inc": {"trust_score": 2}})
    
    await create_notification(
        req["from_user_id"], "intro_response",
        f"Intro Request {status.capitalize()}",
        f"Your introduction request was {status}",
        {"request_id": request_id}
    )
    
    return {"message": f"Request {status}"}

@api_router.get("/conversations")
async def get_conversations(user: dict = Depends(get_current_user)):
    """Get user's conversations"""
    convs = await db.conversations.find(
        {"participants": user["user_id"]},
        {"_id": 0}
    ).sort("last_message_at", -1).to_list(100)
    
    for conv in convs:
        # Get other participant(s)
        other_ids = [p for p in conv["participants"] if p != user["user_id"]]
        others = []
        for oid in other_ids[:3]:  # Max 3 for preview
            other = await db.users.find_one({"user_id": oid}, {"_id": 0, "name": 1, "profile.profile_image": 1})
            if other:
                others.append(other)
        conv["participants_info"] = others
        
        # Get last message
        last_msg = await db.messages.find_one(
            {"conversation_id": conv["conversation_id"]},
            {"_id": 0}
        )
        conv["last_message"] = last_msg
        
        # Get unread count
        unread = await db.messages.count_documents({
            "conversation_id": conv["conversation_id"],
            "sender_id": {"$ne": user["user_id"]},
            "read_by": {"$ne": user["user_id"]}
        })
        conv["unread_count"] = unread
    
    return convs

@api_router.post("/messages")
async def send_message(message: MessageCreate, user: dict = Depends(get_current_user)):
    """Send a message"""
    conv = await db.conversations.find_one({"conversation_id": message.conversation_id})
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    if user["user_id"] not in conv["participants"]:
        raise HTTPException(status_code=403, detail="Not a participant")
    
    # Rate limit
    limit = 50 + (user.get("trust_score", 0) // 5)
    if not check_rate_limit(user["user_id"], "message", limit, 3600):
        raise HTTPException(status_code=429, detail="Message rate limit exceeded")
    
    msg_id = generate_id("msg")
    msg = {
        "message_id": msg_id,
        "conversation_id": message.conversation_id,
        "sender_id": user["user_id"],
        "content": message.content,
        "attachments": message.attachments,
        "read_by": [user["user_id"]],
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.messages.insert_one(msg)
    await db.conversations.update_one(
        {"conversation_id": message.conversation_id},
        {"$set": {"last_message_at": datetime.now(timezone.utc)}}
    )
    
    # Notify other participants
    for pid in conv["participants"]:
        if pid != user["user_id"]:
            await create_notification(
                pid, "new_message",
                "New Message",
                f"{user['name']} sent you a message",
                {"conversation_id": message.conversation_id, "message_id": msg_id}
            )
    
    msg.pop("_id", None)
    return msg

@api_router.get("/messages/{conversation_id}")
async def get_messages(
    conversation_id: str,
    skip: int = 0,
    limit: int = 50,
    user: dict = Depends(get_current_user)
):
    """Get messages in a conversation"""
    conv = await db.conversations.find_one({"conversation_id": conversation_id})
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    if user["user_id"] not in conv["participants"]:
        raise HTTPException(status_code=403, detail="Not a participant")
    
    messages = await db.messages.find(
        {"conversation_id": conversation_id},
        {"_id": 0}
    ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    # Mark as read
    await db.messages.update_many(
        {
            "conversation_id": conversation_id,
            "sender_id": {"$ne": user["user_id"]},
            "read_by": {"$ne": user["user_id"]}
        },
        {"$addToSet": {"read_by": user["user_id"]}}
    )
    
    messages.reverse()  # Return in chronological order
    return messages

# ============== FEED ==============

@api_router.post("/posts")
async def create_post(post: PostCreate, user: dict = Depends(get_current_user)):
    """Create a post"""
    post_id = generate_id("post")
    
    post_doc = {
        "post_id": post_id,
        "author_id": user["user_id"],
        "author_type": "user",
        "content": post.content,
        "media": post.media,
        "tags": post.tags,
        "visibility": post.visibility,
        "likes_count": 0,
        "comments_count": 0,
        "reposts_count": 0,
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.posts.insert_one(post_doc)
    await db.users.update_one({"user_id": user["user_id"]}, {"$inc": {"post_count": 1}})
    await create_audit_log(user["user_id"], "create_post", "post", post_id)
    
    post_doc.pop("_id", None)
    
    # Add author info
    post_doc["author"] = {
        "user_id": user["user_id"],
        "name": user["name"],
        "profile_image": user.get("profile", {}).get("profile_image"),
        "headline": user.get("profile", {}).get("headline"),
        "roles": user.get("roles", [])
    }
    
    return post_doc

@api_router.get("/posts")
async def get_posts(
    user_id: Optional[str] = None,
    tag: Optional[str] = None,
    skip: int = 0,
    limit: int = 20,
    current_user: dict = Depends(get_optional_user)
):
    """Get posts feed"""
    query = {"visibility": "public"}
    if user_id:
        query["author_id"] = user_id
    if tag:
        query["tags"] = tag
    
    posts = await db.posts.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    for post in posts:
        author = await db.users.find_one(
            {"user_id": post["author_id"]},
            {"_id": 0, "name": 1, "profile": 1, "roles": 1}
        )
        post["author"] = {
            "user_id": post["author_id"],
            "name": author["name"] if author else "Unknown",
            "profile_image": author.get("profile", {}).get("profile_image") if author else None,
            "headline": author.get("profile", {}).get("headline") if author else None,
            "roles": author.get("roles", []) if author else []
        }
        
        # Check if current user liked
        post["is_liked"] = False
        if current_user:
            like = await db.reactions.find_one({
                "target_type": "post",
                "target_id": post["post_id"],
                "user_id": current_user["user_id"]
            })
            post["is_liked"] = like is not None
        
        # Get recent comments
        comments = await db.comments.find(
            {"post_id": post["post_id"]},
            {"_id": 0}
        ).sort("created_at", 1).limit(3).to_list(3)
        
        for c in comments:
            c_author = await db.users.find_one({"user_id": c["author_id"]}, {"_id": 0, "name": 1, "profile.profile_image": 1})
            c["author"] = c_author
        
        post["comments"] = comments
    
    return posts

@api_router.get("/posts/{post_id}")
async def get_post(post_id: str, current_user: dict = Depends(get_optional_user)):
    """Get single post"""
    post = await db.posts.find_one({"post_id": post_id}, {"_id": 0})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    author = await db.users.find_one({"user_id": post["author_id"]}, {"_id": 0, "name": 1, "profile": 1, "roles": 1})
    post["author"] = author
    
    post["is_liked"] = False
    if current_user:
        like = await db.reactions.find_one({
            "target_type": "post",
            "target_id": post_id,
            "user_id": current_user["user_id"]
        })
        post["is_liked"] = like is not None
    
    # Get all comments
    comments = await db.comments.find({"post_id": post_id}, {"_id": 0}).sort("created_at", 1).to_list(100)
    for c in comments:
        c_author = await db.users.find_one({"user_id": c["author_id"]}, {"_id": 0, "name": 1, "profile.profile_image": 1})
        c["author"] = c_author
    
    post["comments"] = comments
    
    return post

@api_router.post("/posts/{post_id}/react")
async def react_to_post(post_id: str, reaction: ReactionCreate = Body(default=ReactionCreate()), user: dict = Depends(get_current_user)):
    """React to a post (like/unlike)"""
    existing = await db.reactions.find_one({
        "target_type": "post",
        "target_id": post_id,
        "user_id": user["user_id"]
    })
    
    if existing:
        await db.reactions.delete_one({"_id": existing["_id"]})
        await db.posts.update_one({"post_id": post_id}, {"$inc": {"likes_count": -1}})
        return {"liked": False}
    else:
        await db.reactions.insert_one({
            "reaction_id": generate_id("react"),
            "target_type": "post",
            "target_id": post_id,
            "user_id": user["user_id"],
            "type": reaction.type,
            "created_at": datetime.now(timezone.utc)
        })
        await db.posts.update_one({"post_id": post_id}, {"$inc": {"likes_count": 1}})
        
        # Notify post author
        post = await db.posts.find_one({"post_id": post_id})
        if post and post["author_id"] != user["user_id"]:
            await create_notification(
                post["author_id"], "post_reaction",
                "New Reaction",
                f"{user['name']} liked your post",
                {"post_id": post_id}
            )
        
        return {"liked": True}

@api_router.post("/posts/{post_id}/comments")
async def add_comment(post_id: str, comment: CommentCreate, user: dict = Depends(get_current_user)):
    """Add comment to post"""
    post = await db.posts.find_one({"post_id": post_id})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    comment_id = generate_id("comment")
    comment_doc = {
        "comment_id": comment_id,
        "post_id": post_id,
        "author_id": user["user_id"],
        "content": comment.content,
        "likes_count": 0,
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.comments.insert_one(comment_doc)
    await db.posts.update_one({"post_id": post_id}, {"$inc": {"comments_count": 1}})
    
    # Notify post author
    if post["author_id"] != user["user_id"]:
        await create_notification(
            post["author_id"], "post_comment",
            "New Comment",
            f"{user['name']} commented on your post",
            {"post_id": post_id, "comment_id": comment_id}
        )
    
    comment_doc.pop("_id", None)
    comment_doc["author"] = {
        "user_id": user["user_id"],
        "name": user["name"],
        "profile_image": user.get("profile", {}).get("profile_image")
    }
    
    return comment_doc

@api_router.post("/posts/{post_id}/report")
async def report_post(post_id: str, report_data: dict = Body(...), user: dict = Depends(get_current_user)):
    """Report a post"""
    post = await db.posts.find_one({"post_id": post_id})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    report = {
        "report_id": generate_id("report"),
        "reporter_id": user["user_id"],
        "target_type": "post",
        "target_id": post_id,
        "reason": report_data.get("reason"),
        "details": report_data.get("details"),
        "status": "pending",
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.reports.insert_one(report)
    await create_audit_log(user["user_id"], "report_content", "post", post_id)
    
    return {"message": "Report submitted"}

@api_router.delete("/posts/{post_id}")
async def delete_post(post_id: str, user: dict = Depends(get_current_user)):
    """Delete a post"""
    post = await db.posts.find_one({"post_id": post_id})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    if post["author_id"] != user["user_id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.posts.delete_one({"post_id": post_id})
    await db.comments.delete_many({"post_id": post_id})
    await db.reactions.delete_many({"target_type": "post", "target_id": post_id})
    await db.users.update_one({"user_id": user["user_id"]}, {"$inc": {"post_count": -1}})
    
    return {"message": "Post deleted"}

# ============== DISCOVERY & MATCHING ==============

@api_router.get("/discover")
async def discover(
    role: Optional[str] = None,
    skills: Optional[str] = None,
    sectors: Optional[str] = None,
    stage: Optional[str] = None,
    location: Optional[str] = None,
    skip: int = 0,
    limit: int = 10,
    user: dict = Depends(get_current_user)
):
    """Discover users for matching"""
    # Get existing connections
    intro_requests = await db.intro_requests.find({
        "$or": [
            {"from_user_id": user["user_id"]},
            {"to_user_id": user["user_id"]}
        ]
    }).to_list(1000)
    
    connected_ids = set([user["user_id"]])
    for req in intro_requests:
        if req["status"] in ["pending", "accepted"]:
            connected_ids.add(req["from_user_id"])
            connected_ids.add(req["to_user_id"])
    
    query = {"user_id": {"$nin": list(connected_ids)}}
    
    if role:
        query["roles"] = role
    if skills:
        skill_list = [s.strip() for s in skills.split(",")]
        query["profile.skills"] = {"$in": skill_list}
    if sectors:
        sector_list = [s.strip() for s in sectors.split(",")]
        query["profile.sectors"] = {"$in": sector_list}
    if stage:
        query["profile.stage_preferences"] = stage
    if location:
        query["profile.location"] = {"$regex": location, "$options": "i"}
    
    users = await db.users.find(query, {"_id": 0, "password_hash": 0}).skip(skip).limit(limit).to_list(limit)
    
    # Calculate match scores
    for u in users:
        score, reasons = await calculate_match_score(user, u)
        u["match_score"] = score
        u["match_reasons"] = reasons
    
    # Sort by match score
    users.sort(key=lambda x: x.get("match_score", 0), reverse=True)
    
    return users

@api_router.get("/recommendations")
async def get_recommendations(user: dict = Depends(get_current_user)):
    """Get AI-powered recommendations"""
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    
    # Get potential matches
    intro_requests = await db.intro_requests.find({
        "$or": [
            {"from_user_id": user["user_id"]},
            {"to_user_id": user["user_id"]}
        ]
    }).to_list(1000)
    
    connected_ids = set([user["user_id"]])
    for req in intro_requests:
        connected_ids.add(req["from_user_id"])
        connected_ids.add(req["to_user_id"])
    
    potential = await db.users.find(
        {"user_id": {"$nin": list(connected_ids)}},
        {"_id": 0, "password_hash": 0}
    ).limit(30).to_list(30)
    
    if not potential:
        return []
    
    if EMERGENT_LLM_KEY:
        try:
            user_profile = f"""
            Name: {user['name']}
            Roles: {', '.join(user.get('roles', []))}
            Headline: {user.get('profile', {}).get('headline', 'N/A')}
            Bio: {user.get('profile', {}).get('bio', 'N/A')}
            Skills: {', '.join(user.get('profile', {}).get('skills', []))}
            Interests: {', '.join(user.get('profile', {}).get('interests', []))}
            Sectors: {', '.join(user.get('profile', {}).get('sectors', []))}
            Looking for: {user.get('profile', {}).get('looking_for', 'N/A')}
            """
            
            matches_text = ""
            for i, p in enumerate(potential[:15]):
                matches_text += f"""
                Match {i+1} (ID: {p['user_id']}):
                - Name: {p['name']}
                - Roles: {', '.join(p.get('roles', []))}
                - Headline: {p.get('profile', {}).get('headline', 'N/A')}
                - Skills: {', '.join(p.get('profile', {}).get('skills', [])[:5])}
                - Sectors: {', '.join(p.get('profile', {}).get('sectors', [])[:3])}
                """
            
            chat = LlmChat(
                api_key=EMERGENT_LLM_KEY,
                session_id=f"rec_{user['user_id']}_{uuid.uuid4().hex[:8]}",
                system_message="""You are an expert startup ecosystem matchmaker.
                Analyze the user's profile and potential connections, then recommend the best matches.
                Consider complementary skills, shared interests, potential synergies, and startup ecosystem dynamics.
                Return a JSON array with exactly 5 recommendations in this format:
                [{"user_id": "...", "match_score": 0.85, "match_reason": "Brief explanation"}]
                Only return the JSON array, no other text."""
            ).with_model("openai", "gpt-4o")
            
            response = await chat.send_message(UserMessage(text=f"""
            User Profile:
            {user_profile}
            
            Potential Matches:
            {matches_text}
            
            Return the top 5 best matches as a JSON array.
            """))
            
            import json
            response_text = response.strip()
            if response_text.startswith("```"):
                response_text = response_text.split("```")[1]
                if response_text.startswith("json"):
                    response_text = response_text[4:]
            
            recommendations_data = json.loads(response_text)
            
            results = []
            for rec in recommendations_data[:5]:
                match_user = next((p for p in potential if p["user_id"] == rec["user_id"]), None)
                if match_user:
                    results.append({
                        "user": match_user,
                        "match_score": rec.get("match_score", 0.8),
                        "match_reason": rec.get("match_reason", "Good potential match")
                    })
            
            return results
        except Exception as e:
            logging.error(f"AI recommendation error: {e}")
    
    # Fallback to basic matching
    results = []
    for p in potential:
        score, reasons = await calculate_match_score(user, p)
        results.append({
            "user": p,
            "match_score": score,
            "match_reason": reasons[0] if reasons else "Potential match"
        })
    
    results.sort(key=lambda x: x["match_score"], reverse=True)
    return results[:5]

@api_router.post("/saved-lists")
async def create_saved_list(data: dict = Body(...), user: dict = Depends(get_current_user)):
    """Create a saved list"""
    list_id = generate_id("list")
    doc = {
        "list_id": list_id,
        "owner_id": user["user_id"],
        "name": data["name"],
        "type": data.get("type", "general"),
        "items": [],
        "created_at": datetime.now(timezone.utc)
    }
    await db.saved_lists.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api_router.post("/saved-lists/{list_id}/items")
async def add_to_saved_list(list_id: str, data: dict = Body(...), user: dict = Depends(get_current_user)):
    """Add item to saved list"""
    lst = await db.saved_lists.find_one({"list_id": list_id, "owner_id": user["user_id"]})
    if not lst:
        raise HTTPException(status_code=404, detail="List not found")
    
    await db.saved_lists.update_one(
        {"list_id": list_id},
        {"$addToSet": {"items": {"entity_type": data["entity_type"], "entity_id": data["entity_id"], "added_at": datetime.now(timezone.utc)}}}
    )
    return {"message": "Added to list"}

@api_router.get("/saved-lists")
async def get_saved_lists(user: dict = Depends(get_current_user)):
    """Get user's saved lists"""
    lists = await db.saved_lists.find({"owner_id": user["user_id"]}, {"_id": 0}).to_list(100)
    return lists

# ============== NOTIFICATIONS ==============

@api_router.get("/notifications")
async def get_notifications(
    unread_only: bool = False,
    skip: int = 0,
    limit: int = 50,
    user: dict = Depends(get_current_user)
):
    """Get user notifications"""
    query = {"user_id": user["user_id"]}
    if unread_only:
        query["is_read"] = False
    
    notifications = await db.notifications.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    return notifications

@api_router.put("/notifications/{notif_id}/read")
async def mark_notification_read(notif_id: str, user: dict = Depends(get_current_user)):
    """Mark notification as read"""
    await db.notifications.update_one(
        {"notification_id": notif_id, "user_id": user["user_id"]},
        {"$set": {"is_read": True, "read_at": datetime.now(timezone.utc)}}
    )
    return {"message": "Marked as read"}

@api_router.put("/notifications/read-all")
async def mark_all_notifications_read(user: dict = Depends(get_current_user)):
    """Mark all notifications as read"""
    await db.notifications.update_many(
        {"user_id": user["user_id"], "is_read": False},
        {"$set": {"is_read": True, "read_at": datetime.now(timezone.utc)}}
    )
    return {"message": "All marked as read"}

@api_router.get("/notifications/count")
async def get_unread_count(user: dict = Depends(get_current_user)):
    """Get unread notification count"""
    count = await db.notifications.count_documents({"user_id": user["user_id"], "is_read": False})
    return {"unread_count": count}

# ============== ADMIN & MODERATION ==============

@api_router.get("/admin/reports")
async def get_reports(
    status: str = "pending",
    skip: int = 0,
    limit: int = 50,
    user: dict = Depends(get_current_user)
):
    """Get content reports (admin only)"""
    # TODO: Add proper admin role check
    reports = await db.reports.find({"status": status}, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    for report in reports:
        reporter = await db.users.find_one({"user_id": report["reporter_id"]}, {"_id": 0, "name": 1})
        report["reporter"] = reporter
        
        if report["target_type"] == "post":
            target = await db.posts.find_one({"post_id": report["target_id"]}, {"_id": 0})
            report["target"] = target
    
    return reports

@api_router.put("/admin/reports/{report_id}")
async def handle_report(report_id: str, action_data: dict = Body(...), user: dict = Depends(get_current_user)):
    """Handle a report"""
    action = action_data.get("action")  # dismiss, warn, remove, ban
    
    report = await db.reports.find_one({"report_id": report_id})
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    update = {"status": "resolved", "resolved_by": user["user_id"], "action": action, "resolved_at": datetime.now(timezone.utc)}
    await db.reports.update_one({"report_id": report_id}, {"$set": update})
    
    if action == "remove":
        if report["target_type"] == "post":
            await db.posts.delete_one({"post_id": report["target_id"]})
    
    await create_audit_log(user["user_id"], f"moderate_{action}", report["target_type"], report["target_id"])
    
    return {"message": f"Report handled with action: {action}"}

@api_router.get("/admin/audit-logs")
async def get_audit_logs(
    action: Optional[str] = None,
    entity: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    user: dict = Depends(get_current_user)
):
    """Get audit logs"""
    query = {}
    if action:
        query["action"] = action
    if entity:
        query["entity"] = entity
    
    logs = await db.audit_logs.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    return logs

# ============== MENTORING MODULE ==============

@api_router.get("/mentors")
async def get_mentors(
    expertise: Optional[str] = None,
    skip: int = 0,
    limit: int = 20,
    user: dict = Depends(get_current_user)
):
    """Get list of mentors"""
    query = {"roles": "mentor"}
    if expertise:
        query["profile.skills"] = {"$in": [expertise]}
    
    mentors = await db.users.find(query, {"_id": 0, "password_hash": 0}).skip(skip).limit(limit).to_list(limit)
    
    # Add mentor info if not exists
    for mentor in mentors:
        if not mentor.get("mentor_info"):
            mentor["mentor_info"] = {
                "expertise": mentor.get("profile", {}).get("skills", [])[:5],
                "hourly_rate": 100,
                "availability": "Weekdays",
                "total_sessions": 0,
                "avg_rating": 0
            }
    
    return mentors

@api_router.post("/mentor-sessions")
async def create_mentor_session(
    data: dict,
    user: dict = Depends(get_current_user)
):
    """Book a mentor session"""
    session_id = f"session_{uuid4().hex[:12]}"
    session = {
        "session_id": session_id,
        "mentor_id": data["mentor_id"],
        "mentee_id": user["user_id"],
        "topic": data.get("topic", ""),
        "scheduled_at": data.get("scheduled_at", datetime.now(timezone.utc).isoformat()),
        "duration_minutes": data.get("duration_minutes", 60),
        "status": "pending",
        "notes": data.get("notes", ""),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.mentor_sessions.insert_one(session)
    session.pop("_id", None)
    return session

@api_router.get("/mentor-sessions")
async def get_mentor_sessions(
    status: Optional[str] = None,
    user: dict = Depends(get_current_user)
):
    """Get user's mentor sessions"""
    query = {
        "$or": [
            {"mentor_id": user["user_id"]},
            {"mentee_id": user["user_id"]}
        ]
    }
    if status:
        query["status"] = status
    
    sessions = await db.mentor_sessions.find(query, {"_id": 0}).sort("scheduled_at", -1).to_list(50)
    
    # Populate mentor info
    for session in sessions:
        mentor = await db.users.find_one({"user_id": session["mentor_id"]}, {"_id": 0, "password_hash": 0})
        session["mentor"] = mentor
    
    return sessions

# ============== LEARNING MODULE ==============

@api_router.get("/courses")
async def get_courses(
    category: Optional[str] = None,
    difficulty: Optional[str] = None,
    skip: int = 0,
    limit: int = 20,
    user: dict = Depends(get_current_user)
):
    """Get courses"""
    query = {}
    if category:
        query["category"] = category
    if difficulty:
        query["difficulty"] = difficulty
    
    courses = await db.courses.find(query, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
    return courses

@api_router.post("/courses/{course_id}/enroll")
async def enroll_in_course(course_id: str, user: dict = Depends(get_current_user)):
    """Enroll in a course"""
    enrollment = {
        "enrollment_id": f"enroll_{uuid4().hex[:12]}",
        "course_id": course_id,
        "user_id": user["user_id"],
        "progress": 0,
        "completed_lessons": [],
        "enrolled_at": datetime.now(timezone.utc).isoformat()
    }
    await db.enrollments.insert_one(enrollment)
    enrollment.pop("_id", None)
    return enrollment

# ============== HEALTH CHECK ==============

@api_router.get("/")
async def root():
    return {"message": "CoFounderBay API v2.0", "status": "healthy"}

@api_router.get("/health")
async def health():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

# Include router
app.include_router(api_router)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
