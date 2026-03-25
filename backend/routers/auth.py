"""
Authentication Router for CoFounderBay API
Handles: Login, Signup, Token refresh, OAuth, Session management
"""
from fastapi import APIRouter, HTTPException, Depends, Body
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime, timezone, timedelta
import uuid

router = APIRouter(prefix="/auth", tags=["Authentication"])

# These will be injected from main server
db = None
pwd_context = None
SECRET_KEY = None
ALGORITHM = None
ACCESS_TOKEN_EXPIRE_MINUTES = None
REFRESH_TOKEN_EXPIRE_DAYS = None

def init_router(database, password_context, secret, algorithm, access_exp, refresh_exp):
    """Initialize router with dependencies"""
    global db, pwd_context, SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES, REFRESH_TOKEN_EXPIRE_DAYS
    db = database
    pwd_context = password_context
    SECRET_KEY = secret
    ALGORITHM = algorithm
    ACCESS_TOKEN_EXPIRE_MINUTES = access_exp
    REFRESH_TOKEN_EXPIRE_DAYS = refresh_exp

# Models
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: dict

# Utility functions
def generate_id(prefix: str = "usr") -> str:
    return f"{prefix}_{uuid.uuid4().hex[:12]}"

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def create_access_token(data: dict, expires_delta: timedelta = None):
    from jose import jwt
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire, "type": "access"})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def create_refresh_token(data: dict):
    from jose import jwt
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# Routes
@router.post("/signup", response_model=TokenResponse)
async def signup(user_data: UserCreate):
    """Register a new user"""
    existing = await db.users.find_one({"email": user_data.email.lower()})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = generate_id("usr")
    user_doc = {
        "user_id": user_id,
        "email": user_data.email.lower(),
        "password_hash": hash_password(user_data.password),
        "name": user_data.name,
        "roles": [user_data.role],
        "profile": {
            "headline": None,
            "bio": None,
            "location": None,
            "remote_ok": True,
            "skills": [],
            "interests": [],
            "sectors": [],
            "stage_preferences": [],
            "looking_for": None,
        },
        "intent_cards": [],
        "organizations": [],
        "connection_count": 0,
        "post_count": 0,
        "trust_score": 50,
        "needs_onboarding": True,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    }
    
    await db.users.insert_one(user_doc)
    
    access_token = create_access_token({"sub": user_id})
    refresh_token = create_refresh_token({"sub": user_id})
    
    user_doc.pop("password_hash", None)
    user_doc.pop("_id", None)
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": user_doc
    }

@router.post("/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    """Login with email and password"""
    user = await db.users.find_one({"email": credentials.email.lower()})
    
    if not user or not verify_password(credentials.password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    access_token = create_access_token({"sub": user["user_id"]})
    refresh_token = create_refresh_token({"sub": user["user_id"]})
    
    user.pop("password_hash", None)
    user.pop("_id", None)
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": user
    }

@router.post("/refresh")
async def refresh_token(data: dict = Body(...)):
    """Refresh access token using refresh token"""
    from jose import JWTError, jwt
    
    refresh = data.get("refresh_token")
    if not refresh:
        raise HTTPException(status_code=400, detail="Refresh token required")
    
    try:
        payload = jwt.decode(refresh, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
        
        user_id = payload.get("sub")
        user = await db.users.find_one({"user_id": user_id})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        
        access_token = create_access_token({"sub": user_id})
        new_refresh_token = create_refresh_token({"sub": user_id})
        
        user.pop("password_hash", None)
        user.pop("_id", None)
        
        return {
            "access_token": access_token,
            "refresh_token": new_refresh_token,
            "token_type": "bearer",
            "user": user
        }
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

@router.post("/logout")
async def logout():
    """Logout (client should discard tokens)"""
    return {"message": "Logged out successfully"}
