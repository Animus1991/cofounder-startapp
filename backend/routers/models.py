"""
Shared Models, Types, and Dependencies for CoFounderBay API
"""
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Literal, Dict, Any
from datetime import datetime

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
    commitment: Optional[str] = None
    compensation_pref: Optional[CompensationType] = None
    skills_needed: List[str] = []
    is_active: bool = True

class PersonProfile(BaseModel):
    headline: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = None
    remote_ok: bool = True
    availability_hours: Optional[int] = None
    linkedin_url: Optional[str] = None
    website: Optional[str] = None
    twitter_url: Optional[str] = None
    github_url: Optional[str] = None
    profile_image: Optional[str] = None
    cover_image: Optional[str] = None
    skills: List[str] = []
    skill_levels: Dict[str, int] = {}
    interests: List[str] = []
    sectors: List[str] = []
    stage_preferences: List[StartupStage] = []
    compensation_preferences: List[CompensationType] = []
    looking_for: Optional[str] = None
    verification_status: str = "unverified"

class UserResponse(BaseModel):
    user_id: str
    email: str
    name: str
    roles: List[UserRole]
    profile: PersonProfile
    intent_cards: List[IntentCard] = []
    connection_count: int = 0
    post_count: int = 0
    trust_score: int = 0
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
    traction_metrics: Dict[str, Any] = {}
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
    status: str = "todo"

# --- Post Models ---
class PostCreate(BaseModel):
    content: str
    type: str = "update"
    visibility: str = "public"
    tags: List[str] = []
    media_urls: List[str] = []
    poll_options: List[str] = []
    linked_opportunity_id: Optional[str] = None

# --- Message Models ---
class MessageCreate(BaseModel):
    content: str
    attachments: List[str] = []

# --- Connection Models ---
class ConnectionRequest(BaseModel):
    target_user_id: str
    message: Optional[str] = None

# --- Community Models ---
class CommunityCreate(BaseModel):
    name: str
    description: str
    type: str = "public"  # public, private, invite_only
    category: str = "general"
    rules: List[str] = []
    cover_image: Optional[str] = None

class CommunityPostCreate(BaseModel):
    title: str
    content: str
    type: str = "discussion"  # discussion, question, announcement, event
    tags: List[str] = []

# --- Event Models ---
class EventCreate(BaseModel):
    title: str
    description: str
    type: str = "meetup"
    location: Optional[str] = None
    is_virtual: bool = False
    virtual_url: Optional[str] = None
    start_time: datetime
    end_time: datetime
    capacity: Optional[int] = None
    price: float = 0
    tags: List[str] = []

# --- Pipeline Models ---
class PipelineEntryCreate(BaseModel):
    startup_id: Optional[str] = None
    startup_name: str
    stage: PipelineStage = "new"
    notes: Optional[str] = None
    contact_info: Optional[str] = None
    deal_size: Optional[float] = None
    probability: int = 50

# --- Notification Models ---
class NotificationCreate(BaseModel):
    type: str
    title: str
    body: str
    action_url: Optional[str] = None
    data: Dict[str, Any] = {}
