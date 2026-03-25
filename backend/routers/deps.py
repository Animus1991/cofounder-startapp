"""
Database and Dependencies Module for CoFounderBay API
Provides shared database connection and utilities for all routers
"""
from motor.motor_asyncio import AsyncIOMotorClient
from fastapi import Depends, HTTPException, Request
from fastapi.security import HTTPBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from datetime import datetime, timezone, timedelta
import os
import uuid
from pathlib import Path
from dotenv import load_dotenv

# Load environment
ROOT_DIR = Path(__file__).parent.parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'cofounderbay')]

# JWT Settings
SECRET_KEY = os.getenv("JWT_SECRET", "cofounderbay-secret-key-2025-secure")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 7

# Password hashing
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

# Emergent LLM Key
EMERGENT_LLM_KEY = os.getenv("EMERGENT_LLM_KEY", "")

# Security
security = HTTPBearer(auto_error=False)

# ============== UTILITY FUNCTIONS ==============

def generate_id(prefix: str = "id") -> str:
    """Generate a unique ID with prefix"""
    return f"{prefix}_{uuid.uuid4().hex[:12]}"

def hash_password(password: str) -> str:
    """Hash a password"""
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    """Verify a password against its hash"""
    return pwd_context.verify(plain, hashed)

def create_access_token(data: dict, expires_delta: timedelta = None) -> str:
    """Create JWT access token"""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire, "type": "access"})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def create_refresh_token(data: dict) -> str:
    """Create JWT refresh token"""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def decode_token(token: str) -> dict:
    """Decode and validate JWT token"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ============== AUTH DEPENDENCY ==============

async def get_current_user(request: Request) -> dict:
    """Get current authenticated user from JWT token"""
    auth_header = request.headers.get("Authorization")
    
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    token = auth_header.split(" ")[1]
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user = await db.users.find_one({"user_id": user_id})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        
        user.pop("password_hash", None)
        user.pop("_id", None)
        return user
        
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_optional_user(request: Request) -> dict:
    """Get current user if authenticated, None otherwise"""
    try:
        return await get_current_user(request)
    except HTTPException:
        return None

# ============== NOTIFICATION HELPER ==============

async def create_notification(user_id: str, type: str, title: str, body: str, 
                              action_url: str = None, data: dict = None):
    """Create a notification for a user"""
    notification = {
        "notification_id": generate_id("notif"),
        "user_id": user_id,
        "type": type,
        "title": title,
        "body": body,
        "action_url": action_url,
        "data": data or {},
        "is_read": False,
        "created_at": datetime.now(timezone.utc)
    }
    await db.notifications.insert_one(notification)
    return notification
