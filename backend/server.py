from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Response, Cookie
from fastapi.security import HTTPBearer
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Literal
import uuid
from datetime import datetime, timezone, timedelta
import httpx
from passlib.context import CryptContext
from jose import JWTError, jwt
import base64

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Settings
SECRET_KEY = os.getenv("JWT_SECRET", "cofounder-connect-secret-key-2025")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 7

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Emergent LLM Key for AI features
EMERGENT_LLM_KEY = os.getenv("EMERGENT_LLM_KEY", "")

# Create the main app
app = FastAPI(title="CoFounder Connect API")

# Create router with /api prefix
api_router = APIRouter(prefix="/api")

# ============== MODELS ==============

# User Types
UserRole = Literal["founder", "investor", "mentor", "service_provider", "talent"]

class UserBase(BaseModel):
    email: EmailStr
    name: str
    role: UserRole
    headline: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = None
    skills: List[str] = []
    interests: List[str] = []
    linkedin_url: Optional[str] = None
    website: Optional[str] = None
    profile_image: Optional[str] = None  # Base64
    cover_image: Optional[str] = None  # Base64
    
    # Role-specific fields
    company_name: Optional[str] = None
    company_stage: Optional[str] = None  # For founders
    investment_range: Optional[str] = None  # For investors
    expertise_areas: List[str] = []  # For mentors
    services_offered: List[str] = []  # For service providers
    looking_for: Optional[str] = None  # For talent

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: UserRole

class UserResponse(UserBase):
    user_id: str
    created_at: datetime
    connection_count: int = 0
    post_count: int = 0
    is_verified: bool = False

class UserLogin(BaseModel):
    email: EmailStr
    password: str

# Posts
class PostCreate(BaseModel):
    content: str
    image: Optional[str] = None  # Base64
    tags: List[str] = []

class CommentCreate(BaseModel):
    content: str

class CommentResponse(BaseModel):
    comment_id: str
    post_id: str
    user_id: str
    user_name: str
    user_image: Optional[str] = None
    content: str
    created_at: datetime

class PostResponse(BaseModel):
    post_id: str
    user_id: str
    user_name: str
    user_headline: Optional[str] = None
    user_image: Optional[str] = None
    user_role: str
    content: str
    image: Optional[str] = None
    tags: List[str] = []
    likes_count: int = 0
    comments_count: int = 0
    is_liked: bool = False
    created_at: datetime
    comments: List[CommentResponse] = []

# Connections
class ConnectionRequest(BaseModel):
    target_user_id: str
    message: Optional[str] = None

class ConnectionResponse(BaseModel):
    connection_id: str
    user_id: str
    target_user_id: str
    status: str  # pending, accepted, rejected
    message: Optional[str] = None
    created_at: datetime

# Messages
class MessageCreate(BaseModel):
    receiver_id: str
    content: str

class MessageResponse(BaseModel):
    message_id: str
    sender_id: str
    receiver_id: str
    content: str
    is_read: bool
    created_at: datetime

class ConversationResponse(BaseModel):
    conversation_id: str
    user_id: str
    user_name: str
    user_image: Optional[str] = None
    last_message: str
    unread_count: int
    last_message_at: datetime

# AI Recommendations
class AIRecommendation(BaseModel):
    user_id: str
    user_name: str
    user_image: Optional[str] = None
    user_role: str
    headline: Optional[str] = None
    match_score: float
    match_reason: str

# Auth tokens
class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# ============== AUTH HELPERS ==============

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

async def get_current_user(request: Request) -> dict:
    """Get current user from session token (cookie or header)"""
    # Try cookie first
    session_token = request.cookies.get("session_token")
    
    # Fall back to Authorization header
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header.split(" ")[1]
    
    if not session_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Check user_sessions collection (for Google OAuth)
    session = await db.user_sessions.find_one(
        {"session_token": session_token},
        {"_id": 0}
    )
    
    if session:
        # Check expiry
        expires_at = session.get("expires_at")
        if isinstance(expires_at, str):
            expires_at = datetime.fromisoformat(expires_at)
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        if expires_at < datetime.now(timezone.utc):
            raise HTTPException(status_code=401, detail="Session expired")
        
        user = await db.users.find_one(
            {"user_id": session["user_id"]},
            {"_id": 0}
        )
        if user:
            return user
    
    # Check JWT token (for email/password auth)
    try:
        payload = jwt.decode(session_token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id:
            user = await db.users.find_one(
                {"user_id": user_id},
                {"_id": 0}
            )
            if user:
                return user
    except JWTError:
        pass
    
    raise HTTPException(status_code=401, detail="Invalid session")

# Optional auth - doesn't fail if not authenticated
async def get_optional_user(request: Request) -> Optional[dict]:
    try:
        return await get_current_user(request)
    except HTTPException:
        return None

# ============== AUTH ROUTES ==============

@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserCreate, response: Response):
    """Register with email/password"""
    # Check if email exists
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    hashed_pw = hash_password(user_data.password)
    
    user_doc = {
        "user_id": user_id,
        "email": user_data.email,
        "name": user_data.name,
        "role": user_data.role,
        "password_hash": hashed_pw,
        "headline": None,
        "bio": None,
        "location": None,
        "skills": [],
        "interests": [],
        "linkedin_url": None,
        "website": None,
        "profile_image": None,
        "cover_image": None,
        "company_name": None,
        "company_stage": None,
        "investment_range": None,
        "expertise_areas": [],
        "services_offered": [],
        "looking_for": None,
        "connection_count": 0,
        "post_count": 0,
        "is_verified": False,
        "created_at": datetime.now(timezone.utc),
        "auth_type": "email"
    }
    
    await db.users.insert_one(user_doc)
    
    # Create JWT token
    token = create_access_token({"sub": user_id})
    
    # Set cookie
    response.set_cookie(
        key="session_token",
        value=token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=ACCESS_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
        path="/"
    )
    
    user_doc.pop("password_hash", None)
    user_doc.pop("_id", None)
    
    return TokenResponse(
        access_token=token,
        user=UserResponse(**user_doc)
    )

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin, response: Response):
    """Login with email/password"""
    user = await db.users.find_one(
        {"email": credentials.email},
        {"_id": 0}
    )
    
    if not user or not user.get("password_hash"):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_access_token({"sub": user["user_id"]})
    
    response.set_cookie(
        key="session_token",
        value=token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=ACCESS_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
        path="/"
    )
    
    user.pop("password_hash", None)
    
    return TokenResponse(
        access_token=token,
        user=UserResponse(**user)
    )

@api_router.post("/auth/session")
async def exchange_session(request: Request, response: Response):
    """Exchange Emergent OAuth session_id for session token"""
    body = await request.json()
    session_id = body.get("session_id")
    
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id required")
    
    # Exchange session_id with Emergent Auth
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
    
    # Check if user exists
    user = await db.users.find_one({"email": email}, {"_id": 0})
    
    if not user:
        # Create new user - will need onboarding
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        user = {
            "user_id": user_id,
            "email": email,
            "name": name,
            "role": "founder",  # Default, user will change in onboarding
            "headline": None,
            "bio": None,
            "location": None,
            "skills": [],
            "interests": [],
            "linkedin_url": None,
            "website": None,
            "profile_image": picture if picture else None,
            "cover_image": None,
            "company_name": None,
            "company_stage": None,
            "investment_range": None,
            "expertise_areas": [],
            "services_offered": [],
            "looking_for": None,
            "connection_count": 0,
            "post_count": 0,
            "is_verified": False,
            "needs_onboarding": True,
            "created_at": datetime.now(timezone.utc),
            "auth_type": "google"
        }
        await db.users.insert_one(user)
    else:
        user_id = user["user_id"]
        # Update profile picture if new
        if picture and not user.get("profile_image"):
            await db.users.update_one(
                {"user_id": user_id},
                {"$set": {"profile_image": picture}}
            )
            user["profile_image"] = picture
    
    # Store session
    session_token = emergent_session_token or f"sess_{uuid.uuid4().hex}"
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    
    await db.user_sessions.update_one(
        {"user_id": user_id},
        {
            "$set": {
                "session_token": session_token,
                "expires_at": expires_at,
                "updated_at": datetime.now(timezone.utc)
            }
        },
        upsert=True
    )
    
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=7 * 24 * 60 * 60,
        path="/"
    )
    
    user.pop("password_hash", None)
    user.pop("_id", None)
    
    return {
        "access_token": session_token,
        "token_type": "bearer",
        "user": user,
        "needs_onboarding": user.get("needs_onboarding", False)
    }

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(user: dict = Depends(get_current_user)):
    """Get current user profile"""
    user.pop("password_hash", None)
    return UserResponse(**user)

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    """Logout and clear session"""
    session_token = request.cookies.get("session_token")
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    
    response.delete_cookie(key="session_token", path="/")
    return {"message": "Logged out successfully"}

# ============== USER ROUTES ==============

@api_router.put("/users/profile", response_model=UserResponse)
async def update_profile(
    update_data: dict,
    user: dict = Depends(get_current_user)
):
    """Update user profile"""
    allowed_fields = [
        "name", "role", "headline", "bio", "location", "skills", "interests",
        "linkedin_url", "website", "profile_image", "cover_image",
        "company_name", "company_stage", "investment_range", "expertise_areas",
        "services_offered", "looking_for"
    ]
    
    update_dict = {k: v for k, v in update_data.items() if k in allowed_fields}
    
    if update_dict:
        # If completing onboarding, remove the flag
        if "role" in update_dict:
            update_dict["needs_onboarding"] = False
        
        await db.users.update_one(
            {"user_id": user["user_id"]},
            {"$set": update_dict}
        )
    
    updated_user = await db.users.find_one(
        {"user_id": user["user_id"]},
        {"_id": 0, "password_hash": 0}
    )
    
    return UserResponse(**updated_user)

@api_router.get("/users/{user_id}", response_model=UserResponse)
async def get_user(user_id: str, current_user: dict = Depends(get_optional_user)):
    """Get user profile by ID"""
    user = await db.users.find_one(
        {"user_id": user_id},
        {"_id": 0, "password_hash": 0}
    )
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return UserResponse(**user)

@api_router.get("/users", response_model=List[UserResponse])
async def list_users(
    role: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 20,
    current_user: dict = Depends(get_optional_user)
):
    """List users with optional filters"""
    query = {}
    
    if role:
        query["role"] = role
    
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"headline": {"$regex": search, "$options": "i"}},
            {"bio": {"$regex": search, "$options": "i"}},
            {"company_name": {"$regex": search, "$options": "i"}}
        ]
    
    users = await db.users.find(
        query,
        {"_id": 0, "password_hash": 0}
    ).skip(skip).limit(limit).to_list(limit)
    
    return [UserResponse(**u) for u in users]

# ============== POSTS ROUTES ==============

@api_router.post("/posts", response_model=PostResponse)
async def create_post(
    post_data: PostCreate,
    user: dict = Depends(get_current_user)
):
    """Create a new post"""
    post_id = f"post_{uuid.uuid4().hex[:12]}"
    
    post = {
        "post_id": post_id,
        "user_id": user["user_id"],
        "content": post_data.content,
        "image": post_data.image,
        "tags": post_data.tags,
        "likes_count": 0,
        "comments_count": 0,
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.posts.insert_one(post)
    
    # Update user post count
    await db.users.update_one(
        {"user_id": user["user_id"]},
        {"$inc": {"post_count": 1}}
    )
    
    return PostResponse(
        post_id=post_id,
        user_id=user["user_id"],
        user_name=user["name"],
        user_headline=user.get("headline"),
        user_image=user.get("profile_image"),
        user_role=user["role"],
        content=post_data.content,
        image=post_data.image,
        tags=post_data.tags,
        likes_count=0,
        comments_count=0,
        is_liked=False,
        created_at=post["created_at"],
        comments=[]
    )

@api_router.get("/posts", response_model=List[PostResponse])
async def get_posts(
    user_id: Optional[str] = None,
    tag: Optional[str] = None,
    skip: int = 0,
    limit: int = 20,
    current_user: dict = Depends(get_optional_user)
):
    """Get posts feed"""
    query = {}
    
    if user_id:
        query["user_id"] = user_id
    
    if tag:
        query["tags"] = tag
    
    posts = await db.posts.find(
        query,
        {"_id": 0}
    ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    result = []
    for post in posts:
        # Get author info
        author = await db.users.find_one(
            {"user_id": post["user_id"]},
            {"_id": 0, "name": 1, "headline": 1, "profile_image": 1, "role": 1}
        )
        
        # Check if current user liked
        is_liked = False
        if current_user:
            like = await db.likes.find_one({
                "post_id": post["post_id"],
                "user_id": current_user["user_id"]
            })
            is_liked = like is not None
        
        # Get comments
        comments = await db.comments.find(
            {"post_id": post["post_id"]},
            {"_id": 0}
        ).sort("created_at", 1).limit(5).to_list(5)
        
        comment_responses = []
        for c in comments:
            c_author = await db.users.find_one(
                {"user_id": c["user_id"]},
                {"_id": 0, "name": 1, "profile_image": 1}
            )
            comment_responses.append(CommentResponse(
                comment_id=c["comment_id"],
                post_id=c["post_id"],
                user_id=c["user_id"],
                user_name=c_author["name"] if c_author else "Unknown",
                user_image=c_author.get("profile_image") if c_author else None,
                content=c["content"],
                created_at=c["created_at"]
            ))
        
        result.append(PostResponse(
            post_id=post["post_id"],
            user_id=post["user_id"],
            user_name=author["name"] if author else "Unknown",
            user_headline=author.get("headline") if author else None,
            user_image=author.get("profile_image") if author else None,
            user_role=author.get("role", "founder") if author else "founder",
            content=post["content"],
            image=post.get("image"),
            tags=post.get("tags", []),
            likes_count=post.get("likes_count", 0),
            comments_count=post.get("comments_count", 0),
            is_liked=is_liked,
            created_at=post["created_at"],
            comments=comment_responses
        ))
    
    return result

@api_router.get("/posts/{post_id}", response_model=PostResponse)
async def get_post(post_id: str, current_user: dict = Depends(get_optional_user)):
    """Get single post with all comments"""
    post = await db.posts.find_one({"post_id": post_id}, {"_id": 0})
    
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    author = await db.users.find_one(
        {"user_id": post["user_id"]},
        {"_id": 0, "name": 1, "headline": 1, "profile_image": 1, "role": 1}
    )
    
    is_liked = False
    if current_user:
        like = await db.likes.find_one({
            "post_id": post_id,
            "user_id": current_user["user_id"]
        })
        is_liked = like is not None
    
    # Get all comments
    comments = await db.comments.find(
        {"post_id": post_id},
        {"_id": 0}
    ).sort("created_at", 1).to_list(100)
    
    comment_responses = []
    for c in comments:
        c_author = await db.users.find_one(
            {"user_id": c["user_id"]},
            {"_id": 0, "name": 1, "profile_image": 1}
        )
        comment_responses.append(CommentResponse(
            comment_id=c["comment_id"],
            post_id=c["post_id"],
            user_id=c["user_id"],
            user_name=c_author["name"] if c_author else "Unknown",
            user_image=c_author.get("profile_image") if c_author else None,
            content=c["content"],
            created_at=c["created_at"]
        ))
    
    return PostResponse(
        post_id=post["post_id"],
        user_id=post["user_id"],
        user_name=author["name"] if author else "Unknown",
        user_headline=author.get("headline") if author else None,
        user_image=author.get("profile_image") if author else None,
        user_role=author.get("role", "founder") if author else "founder",
        content=post["content"],
        image=post.get("image"),
        tags=post.get("tags", []),
        likes_count=post.get("likes_count", 0),
        comments_count=post.get("comments_count", 0),
        is_liked=is_liked,
        created_at=post["created_at"],
        comments=comment_responses
    )

@api_router.post("/posts/{post_id}/like")
async def toggle_like(post_id: str, user: dict = Depends(get_current_user)):
    """Like or unlike a post"""
    existing_like = await db.likes.find_one({
        "post_id": post_id,
        "user_id": user["user_id"]
    })
    
    if existing_like:
        # Unlike
        await db.likes.delete_one({
            "post_id": post_id,
            "user_id": user["user_id"]
        })
        await db.posts.update_one(
            {"post_id": post_id},
            {"$inc": {"likes_count": -1}}
        )
        return {"liked": False}
    else:
        # Like
        await db.likes.insert_one({
            "like_id": f"like_{uuid.uuid4().hex[:12]}",
            "post_id": post_id,
            "user_id": user["user_id"],
            "created_at": datetime.now(timezone.utc)
        })
        await db.posts.update_one(
            {"post_id": post_id},
            {"$inc": {"likes_count": 1}}
        )
        return {"liked": True}

@api_router.post("/posts/{post_id}/comment", response_model=CommentResponse)
async def add_comment(
    post_id: str,
    comment_data: CommentCreate,
    user: dict = Depends(get_current_user)
):
    """Add comment to a post"""
    comment_id = f"comment_{uuid.uuid4().hex[:12]}"
    
    comment = {
        "comment_id": comment_id,
        "post_id": post_id,
        "user_id": user["user_id"],
        "content": comment_data.content,
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.comments.insert_one(comment)
    
    # Update comment count
    await db.posts.update_one(
        {"post_id": post_id},
        {"$inc": {"comments_count": 1}}
    )
    
    return CommentResponse(
        comment_id=comment_id,
        post_id=post_id,
        user_id=user["user_id"],
        user_name=user["name"],
        user_image=user.get("profile_image"),
        content=comment_data.content,
        created_at=comment["created_at"]
    )

@api_router.delete("/posts/{post_id}")
async def delete_post(post_id: str, user: dict = Depends(get_current_user)):
    """Delete a post"""
    post = await db.posts.find_one({"post_id": post_id})
    
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    if post["user_id"] != user["user_id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.posts.delete_one({"post_id": post_id})
    await db.comments.delete_many({"post_id": post_id})
    await db.likes.delete_many({"post_id": post_id})
    
    # Update user post count
    await db.users.update_one(
        {"user_id": user["user_id"]},
        {"$inc": {"post_count": -1}}
    )
    
    return {"message": "Post deleted"}

# ============== CONNECTION ROUTES ==============

@api_router.post("/connections/request", response_model=ConnectionResponse)
async def send_connection_request(
    request_data: ConnectionRequest,
    user: dict = Depends(get_current_user)
):
    """Send a connection request"""
    if request_data.target_user_id == user["user_id"]:
        raise HTTPException(status_code=400, detail="Cannot connect with yourself")
    
    # Check if target exists
    target = await db.users.find_one({"user_id": request_data.target_user_id})
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check existing connection
    existing = await db.connections.find_one({
        "$or": [
            {"user_id": user["user_id"], "target_user_id": request_data.target_user_id},
            {"user_id": request_data.target_user_id, "target_user_id": user["user_id"]}
        ]
    })
    
    if existing:
        raise HTTPException(status_code=400, detail="Connection already exists")
    
    connection_id = f"conn_{uuid.uuid4().hex[:12]}"
    
    connection = {
        "connection_id": connection_id,
        "user_id": user["user_id"],
        "target_user_id": request_data.target_user_id,
        "status": "pending",
        "message": request_data.message,
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.connections.insert_one(connection)
    
    return ConnectionResponse(**connection)

@api_router.put("/connections/{connection_id}/accept")
async def accept_connection(connection_id: str, user: dict = Depends(get_current_user)):
    """Accept a connection request"""
    connection = await db.connections.find_one({"connection_id": connection_id})
    
    if not connection:
        raise HTTPException(status_code=404, detail="Connection not found")
    
    if connection["target_user_id"] != user["user_id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.connections.update_one(
        {"connection_id": connection_id},
        {"$set": {"status": "accepted"}}
    )
    
    # Update connection counts
    await db.users.update_one(
        {"user_id": connection["user_id"]},
        {"$inc": {"connection_count": 1}}
    )
    await db.users.update_one(
        {"user_id": connection["target_user_id"]},
        {"$inc": {"connection_count": 1}}
    )
    
    return {"message": "Connection accepted"}

@api_router.put("/connections/{connection_id}/reject")
async def reject_connection(connection_id: str, user: dict = Depends(get_current_user)):
    """Reject a connection request"""
    connection = await db.connections.find_one({"connection_id": connection_id})
    
    if not connection:
        raise HTTPException(status_code=404, detail="Connection not found")
    
    if connection["target_user_id"] != user["user_id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.connections.update_one(
        {"connection_id": connection_id},
        {"$set": {"status": "rejected"}}
    )
    
    return {"message": "Connection rejected"}

@api_router.get("/connections", response_model=List[dict])
async def get_connections(
    status: Optional[str] = None,
    user: dict = Depends(get_current_user)
):
    """Get user's connections"""
    query = {
        "$or": [
            {"user_id": user["user_id"]},
            {"target_user_id": user["user_id"]}
        ]
    }
    
    if status:
        query["status"] = status
    
    connections = await db.connections.find(query, {"_id": 0}).to_list(100)
    
    result = []
    for conn in connections:
        # Get the other user
        other_user_id = conn["target_user_id"] if conn["user_id"] == user["user_id"] else conn["user_id"]
        other_user = await db.users.find_one(
            {"user_id": other_user_id},
            {"_id": 0, "password_hash": 0}
        )
        
        if other_user:
            result.append({
                **conn,
                "other_user": other_user,
                "is_sender": conn["user_id"] == user["user_id"]
            })
    
    return result

@api_router.delete("/connections/{connection_id}")
async def remove_connection(connection_id: str, user: dict = Depends(get_current_user)):
    """Remove a connection"""
    connection = await db.connections.find_one({"connection_id": connection_id})
    
    if not connection:
        raise HTTPException(status_code=404, detail="Connection not found")
    
    if connection["user_id"] != user["user_id"] and connection["target_user_id"] != user["user_id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    if connection["status"] == "accepted":
        # Update connection counts
        await db.users.update_one(
            {"user_id": connection["user_id"]},
            {"$inc": {"connection_count": -1}}
        )
        await db.users.update_one(
            {"user_id": connection["target_user_id"]},
            {"$inc": {"connection_count": -1}}
        )
    
    await db.connections.delete_one({"connection_id": connection_id})
    
    return {"message": "Connection removed"}

# ============== MESSAGING ROUTES ==============

@api_router.post("/messages", response_model=MessageResponse)
async def send_message(
    message_data: MessageCreate,
    user: dict = Depends(get_current_user)
):
    """Send a direct message"""
    # Check if receiver exists
    receiver = await db.users.find_one({"user_id": message_data.receiver_id})
    if not receiver:
        raise HTTPException(status_code=404, detail="User not found")
    
    message_id = f"msg_{uuid.uuid4().hex[:12]}"
    
    message = {
        "message_id": message_id,
        "sender_id": user["user_id"],
        "receiver_id": message_data.receiver_id,
        "content": message_data.content,
        "is_read": False,
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.messages.insert_one(message)
    
    return MessageResponse(**message)

@api_router.get("/messages/{other_user_id}", response_model=List[MessageResponse])
async def get_conversation(
    other_user_id: str,
    skip: int = 0,
    limit: int = 50,
    user: dict = Depends(get_current_user)
):
    """Get messages with a specific user"""
    messages = await db.messages.find(
        {
            "$or": [
                {"sender_id": user["user_id"], "receiver_id": other_user_id},
                {"sender_id": other_user_id, "receiver_id": user["user_id"]}
            ]
        },
        {"_id": 0}
    ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    # Mark as read
    await db.messages.update_many(
        {"sender_id": other_user_id, "receiver_id": user["user_id"], "is_read": False},
        {"$set": {"is_read": True}}
    )
    
    return [MessageResponse(**m) for m in reversed(messages)]

@api_router.get("/conversations", response_model=List[ConversationResponse])
async def get_conversations(user: dict = Depends(get_current_user)):
    """Get all conversations"""
    # Get all unique conversation partners
    pipeline = [
        {
            "$match": {
                "$or": [
                    {"sender_id": user["user_id"]},
                    {"receiver_id": user["user_id"]}
                ]
            }
        },
        {
            "$sort": {"created_at": -1}
        },
        {
            "$group": {
                "_id": {
                    "$cond": [
                        {"$eq": ["$sender_id", user["user_id"]]},
                        "$receiver_id",
                        "$sender_id"
                    ]
                },
                "last_message": {"$first": "$content"},
                "last_message_at": {"$first": "$created_at"},
                "unread_count": {
                    "$sum": {
                        "$cond": [
                            {
                                "$and": [
                                    {"$eq": ["$receiver_id", user["user_id"]]},
                                    {"$eq": ["$is_read", False]}
                                ]
                            },
                            1,
                            0
                        ]
                    }
                }
            }
        },
        {
            "$sort": {"last_message_at": -1}
        }
    ]
    
    conversations = await db.messages.aggregate(pipeline).to_list(100)
    
    result = []
    for conv in conversations:
        other_user = await db.users.find_one(
            {"user_id": conv["_id"]},
            {"_id": 0, "name": 1, "profile_image": 1}
        )
        
        if other_user:
            result.append(ConversationResponse(
                conversation_id=f"conv_{conv['_id']}",
                user_id=conv["_id"],
                user_name=other_user["name"],
                user_image=other_user.get("profile_image"),
                last_message=conv["last_message"],
                unread_count=conv["unread_count"],
                last_message_at=conv["last_message_at"]
            ))
    
    return result

# ============== AI ROUTES ==============

@api_router.get("/ai/recommendations", response_model=List[AIRecommendation])
async def get_ai_recommendations(user: dict = Depends(get_current_user)):
    """Get AI-powered connection recommendations"""
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    
    if not EMERGENT_LLM_KEY:
        # Fallback to basic matching if no API key
        return await get_basic_recommendations(user)
    
    try:
        # Get potential matches (users not already connected)
        connected_ids = set()
        connections = await db.connections.find({
            "$or": [
                {"user_id": user["user_id"]},
                {"target_user_id": user["user_id"]}
            ]
        }).to_list(100)
        
        for conn in connections:
            connected_ids.add(conn["user_id"])
            connected_ids.add(conn["target_user_id"])
        
        connected_ids.add(user["user_id"])
        
        # Get potential matches
        potential_matches = await db.users.find(
            {"user_id": {"$nin": list(connected_ids)}},
            {"_id": 0, "password_hash": 0}
        ).limit(20).to_list(20)
        
        if not potential_matches:
            return []
        
        # Build user profile summary
        user_profile = f"""
        Name: {user['name']}
        Role: {user['role']}
        Headline: {user.get('headline', 'N/A')}
        Bio: {user.get('bio', 'N/A')}
        Skills: {', '.join(user.get('skills', []))}
        Interests: {', '.join(user.get('interests', []))}
        Looking for: {user.get('looking_for', 'N/A')}
        Company: {user.get('company_name', 'N/A')}
        """
        
        # Build potential matches summary
        matches_text = ""
        for i, m in enumerate(potential_matches):
            matches_text += f"""
            Match {i+1} (ID: {m['user_id']}):
            - Name: {m['name']}
            - Role: {m['role']}
            - Headline: {m.get('headline', 'N/A')}
            - Skills: {', '.join(m.get('skills', [])[:5])}
            - Interests: {', '.join(m.get('interests', [])[:5])}
            """
        
        # Call AI for recommendations
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
        
        prompt = f"""
        User Profile:
        {user_profile}
        
        Potential Matches:
        {matches_text}
        
        Return the top 5 best matches as a JSON array.
        """
        
        response = await chat.send_message(UserMessage(text=prompt))
        
        # Parse response
        import json
        try:
            # Clean the response
            response_text = response.strip()
            if response_text.startswith("```"):
                response_text = response_text.split("```")[1]
                if response_text.startswith("json"):
                    response_text = response_text[4:]
            
            recommendations_data = json.loads(response_text)
            
            result = []
            for rec in recommendations_data[:5]:
                match_user = next((m for m in potential_matches if m["user_id"] == rec["user_id"]), None)
                if match_user:
                    result.append(AIRecommendation(
                        user_id=match_user["user_id"],
                        user_name=match_user["name"],
                        user_image=match_user.get("profile_image"),
                        user_role=match_user["role"],
                        headline=match_user.get("headline"),
                        match_score=rec.get("match_score", 0.8),
                        match_reason=rec.get("match_reason", "Good potential match")
                    ))
            
            return result
            
        except json.JSONDecodeError:
            return await get_basic_recommendations(user)
            
    except Exception as e:
        logging.error(f"AI recommendation error: {e}")
        return await get_basic_recommendations(user)

async def get_basic_recommendations(user: dict) -> List[AIRecommendation]:
    """Basic matching without AI"""
    # Get connected user IDs
    connected_ids = set()
    connections = await db.connections.find({
        "$or": [
            {"user_id": user["user_id"]},
            {"target_user_id": user["user_id"]}
        ]
    }).to_list(100)
    
    for conn in connections:
        connected_ids.add(conn["user_id"])
        connected_ids.add(conn["target_user_id"])
    
    connected_ids.add(user["user_id"])
    
    # Get users with matching interests/skills
    user_interests = set(user.get("interests", []))
    user_skills = set(user.get("skills", []))
    
    potential = await db.users.find(
        {"user_id": {"$nin": list(connected_ids)}},
        {"_id": 0, "password_hash": 0}
    ).limit(50).to_list(50)
    
    scored_matches = []
    for p in potential:
        p_interests = set(p.get("interests", []))
        p_skills = set(p.get("skills", []))
        
        # Calculate basic match score
        interest_overlap = len(user_interests & p_interests)
        skill_overlap = len(user_skills & p_skills)
        
        # Boost for complementary roles
        role_boost = 0
        if user["role"] == "founder" and p["role"] in ["investor", "mentor"]:
            role_boost = 0.2
        elif user["role"] == "investor" and p["role"] == "founder":
            role_boost = 0.2
        
        score = min(1.0, (interest_overlap * 0.1 + skill_overlap * 0.1 + role_boost + 0.5))
        
        reason = "Potential match"
        if interest_overlap > 0:
            reason = f"Shares {interest_overlap} interest(s)"
        elif skill_overlap > 0:
            reason = f"Complementary skills"
        elif role_boost > 0:
            reason = f"Good {p['role']}-{user['role']} synergy"
        
        scored_matches.append({
            "user": p,
            "score": score,
            "reason": reason
        })
    
    # Sort by score and return top 5
    scored_matches.sort(key=lambda x: x["score"], reverse=True)
    
    return [
        AIRecommendation(
            user_id=m["user"]["user_id"],
            user_name=m["user"]["name"],
            user_image=m["user"].get("profile_image"),
            user_role=m["user"]["role"],
            headline=m["user"].get("headline"),
            match_score=m["score"],
            match_reason=m["reason"]
        )
        for m in scored_matches[:5]
    ]

# ============== DISCOVER ROUTES ==============

@api_router.get("/discover", response_model=List[UserResponse])
async def discover_users(
    role: Optional[str] = None,
    skill: Optional[str] = None,
    interest: Optional[str] = None,
    skip: int = 0,
    limit: int = 10,
    user: dict = Depends(get_current_user)
):
    """Discover users for matching"""
    # Get connected user IDs to exclude
    connected_ids = set([user["user_id"]])
    connections = await db.connections.find({
        "$or": [
            {"user_id": user["user_id"]},
            {"target_user_id": user["user_id"]}
        ]
    }).to_list(100)
    
    for conn in connections:
        connected_ids.add(conn["user_id"])
        connected_ids.add(conn["target_user_id"])
    
    query = {"user_id": {"$nin": list(connected_ids)}}
    
    if role:
        query["role"] = role
    
    if skill:
        query["skills"] = {"$in": [skill]}
    
    if interest:
        query["interests"] = {"$in": [interest]}
    
    users = await db.users.find(
        query,
        {"_id": 0, "password_hash": 0}
    ).skip(skip).limit(limit).to_list(limit)
    
    return [UserResponse(**u) for u in users]

# ============== HEALTH CHECK ==============

@api_router.get("/")
async def root():
    return {"message": "CoFounder Connect API v1.0", "status": "healthy"}

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
