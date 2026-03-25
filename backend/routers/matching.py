"""
AI Matching Router for CoFounderBay API
Handles: AI-powered matches, recommendations, compatibility scoring
"""
from fastapi import APIRouter, HTTPException, Depends, Body
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
import uuid
import logging
import random

router = APIRouter(prefix="/matching", tags=["AI Matching"])

# These will be injected from main server
db = None
EMERGENT_LLM_KEY = None
get_current_user = None

def init_router(database, llm_key, auth_dependency):
    """Initialize router with dependencies"""
    global db, EMERGENT_LLM_KEY, get_current_user
    db = database
    EMERGENT_LLM_KEY = llm_key
    get_current_user = auth_dependency

# Models
class MatchRequest(BaseModel):
    min_score: int = 50
    limit: int = 20
    role_filter: Optional[str] = None
    sector_filter: Optional[str] = None

class AIMatchResult(BaseModel):
    user_id: str
    name: str
    roles: List[str]
    headline: Optional[str]
    profile_image: Optional[str]
    match_score: int
    match_reasons: List[str]
    complementary_skills: List[str]
    shared_interests: List[str]
    collaboration_potential: str
    ai_insights: str

# Utility functions
def calculate_detailed_match(user: dict, other: dict) -> tuple:
    """Calculate detailed compatibility score with explanations"""
    score = 0
    reasons = []
    complementary_skills = []
    shared_interests = []
    
    my_profile = user.get("profile", {})
    their_profile = other.get("profile", {})
    my_role = user.get("roles", ["member"])[0] if user.get("roles") else "member"
    their_role = other.get("roles", ["member"])[0] if other.get("roles") else "member"
    
    # 1. Role Fit (20 points)
    role_synergies = {
        ("founder", "talent"): (20, "Could be your technical co-founder"),
        ("founder", "investor"): (18, "Potential funding opportunity"),
        ("founder", "mentor"): (17, "Could provide valuable guidance"),
        ("talent", "founder"): (20, "Startup opportunity"),
        ("talent", "mentor"): (15, "Career mentorship potential"),
        ("investor", "founder"): (18, "Investment opportunity"),
        ("mentor", "founder"): (17, "Mentorship opportunity"),
        ("mentor", "talent"): (15, "Guidance opportunity"),
    }
    
    role_key = (my_role, their_role)
    if role_key in role_synergies:
        points, reason = role_synergies[role_key]
        score += points
        reasons.append(reason)
    
    # 2. Complementary Skills (25 points)
    my_skills = set(my_profile.get("skills", []))
    their_skills = set(their_profile.get("skills", []))
    
    unique_skills = their_skills - my_skills
    if unique_skills:
        complementary_skills = list(unique_skills)[:5]
        skill_score = min(25, len(unique_skills) * 5)
        score += skill_score
        reasons.append(f"Has {len(unique_skills)} complementary skills")
    
    # 3. Shared Sectors (15 points)
    my_sectors = set(my_profile.get("sectors", []))
    their_sectors = set(their_profile.get("sectors", []))
    common_sectors = my_sectors & their_sectors
    
    if common_sectors:
        score += min(15, len(common_sectors) * 5)
        reasons.append(f"Same industry focus: {list(common_sectors)[0]}")
    
    # 4. Shared Interests (10 points)
    my_interests = set(my_profile.get("interests", []))
    their_interests = set(their_profile.get("interests", []))
    common_interests = my_interests & their_interests
    
    if common_interests:
        shared_interests = list(common_interests)[:5]
        score += min(10, len(common_interests) * 3)
        reasons.append(f"{len(common_interests)} shared interests")
    
    # 5. Stage Alignment (10 points)
    my_stages = set(my_profile.get("stage_preferences", []))
    their_stages = set(their_profile.get("stage_preferences", []))
    
    if my_stages and their_stages:
        if my_stages & their_stages:
            score += 10
            reasons.append("Aligned on startup stage")
    
    # 6. Location/Remote (10 points)
    if my_profile.get("remote_ok") and their_profile.get("remote_ok"):
        score += 8
        reasons.append("Both open to remote")
    elif my_profile.get("location") and their_profile.get("location"):
        if my_profile["location"].lower() == their_profile["location"].lower():
            score += 10
            reasons.append(f"Same location: {my_profile['location']}")
    
    # 7. Availability Compatibility (5 points)
    my_hours = my_profile.get("availability_hours", 0)
    their_hours = their_profile.get("availability_hours", 0)
    
    if my_hours and their_hours:
        diff = abs(my_hours - their_hours)
        if diff <= 10:
            score += 5
            reasons.append("Similar time commitment")
    
    # Add some variety (5 points random)
    score += random.randint(0, 5)
    
    # Normalize to 0-100
    score = min(100, max(0, score))
    
    return score, reasons, complementary_skills, shared_interests

# Routes
@router.post("/ai-matches")
async def get_ai_matches(
    request: MatchRequest = Body(default=MatchRequest()),
    user: dict = Depends(lambda: get_current_user)
):
    """Get AI-powered matches with explainable scoring"""
    import json
    
    # Get user's existing connections to exclude
    connections = await db.connections.find({
        "$or": [
            {"user_id": user["user_id"]},
            {"connected_user_id": user["user_id"]}
        ],
        "status": "accepted"
    }).to_list(1000)
    
    connected_ids = set([user["user_id"]])
    for conn in connections:
        connected_ids.add(conn.get("user_id"))
        connected_ids.add(conn.get("connected_user_id"))
    
    # Build query for potential matches
    query = {"user_id": {"$nin": list(connected_ids)}}
    if request.role_filter:
        query["roles"] = request.role_filter
    
    potential = await db.users.find(
        query,
        {"_id": 0, "password_hash": 0}
    ).limit(50).to_list(50)
    
    if not potential:
        return {"matches": [], "total": 0}
    
    # Filter by sector if specified
    if request.sector_filter:
        potential = [
            p for p in potential 
            if request.sector_filter.lower() in [s.lower() for s in p.get('profile', {}).get('sectors', [])]
        ]
    
    results = []
    
    # Calculate basic compatibility scores first
    for other_user in potential:
        score, reasons, complementary, shared = calculate_detailed_match(user, other_user)
        
        if score >= request.min_score:
            results.append({
                "user_id": other_user["user_id"],
                "name": other_user["name"],
                "roles": other_user.get("roles", []),
                "headline": other_user.get("profile", {}).get("headline"),
                "profile_image": other_user.get("profile", {}).get("profile_image"),
                "location": other_user.get("profile", {}).get("location"),
                "skills": other_user.get("profile", {}).get("skills", [])[:5],
                "sectors": other_user.get("profile", {}).get("sectors", [])[:3],
                "match_score": score,
                "match_reasons": reasons,
                "complementary_skills": complementary,
                "shared_interests": shared,
                "collaboration_potential": "",
                "ai_insights": ""
            })
    
    # Sort by score
    results.sort(key=lambda x: x["match_score"], reverse=True)
    results = results[:request.limit]
    
    # Enhance top matches with AI insights if available
    if EMERGENT_LLM_KEY and results:
        try:
            from emergentintegrations.llm.chat import LlmChat, UserMessage
            
            # Prepare context for AI
            user_profile = f"""
            Name: {user['name']}
            Role: {', '.join(user.get('roles', ['member']))}
            Headline: {user.get('profile', {}).get('headline', 'N/A')}
            Bio: {user.get('profile', {}).get('bio', 'N/A')[:200] if user.get('profile', {}).get('bio') else 'N/A'}
            Skills: {', '.join(user.get('profile', {}).get('skills', [])[:8])}
            Sectors: {', '.join(user.get('profile', {}).get('sectors', [])[:5])}
            Looking for: {user.get('profile', {}).get('looking_for', 'N/A')[:200] if user.get('profile', {}).get('looking_for') else 'N/A'}
            """
            
            # Get AI insights for top 5 matches
            top_matches = results[:5]
            matches_context = ""
            for i, match in enumerate(top_matches):
                matches_context += f"""
                Match {i+1} (ID: {match['user_id']}):
                - Name: {match['name']}
                - Role: {', '.join(match['roles'])}
                - Headline: {match.get('headline', 'N/A')}
                - Skills: {', '.join(match.get('skills', []))}
                - Sectors: {', '.join(match.get('sectors', []))}
                - Current Score: {match['match_score']}%
                """
            
            chat = LlmChat(
                api_key=EMERGENT_LLM_KEY,
                session_id=f"match_{user['user_id']}_{uuid.uuid4().hex[:8]}",
                system_message="""You are an expert startup ecosystem matchmaker and networking advisor.
                Your job is to analyze potential professional matches and provide actionable insights.
                Be specific about WHY these people should connect and HOW they could collaborate.
                Consider: complementary skills, shared sectors, potential synergies, stage alignment.
                
                IMPORTANT: Return ONLY a valid JSON array with no additional text."""
            ).with_model("openai", "gpt-4o")
            
            prompt = f"""Analyze these potential matches for a startup ecosystem professional:

USER PROFILE:
{user_profile}

POTENTIAL MATCHES:
{matches_context}

For each match, provide:
1. A specific collaboration potential (one sentence)
2. Actionable AI insight (what they could work on together)

Return ONLY a JSON array in this exact format:
[
  {{"user_id": "...", "collaboration_potential": "...", "ai_insight": "..."}}
]
"""
            
            response = await chat.send_message(UserMessage(text=prompt))
            
            # Parse AI response
            response_text = response.strip()
            if response_text.startswith("```"):
                lines = response_text.split("\n")
                response_text = "\n".join(lines[1:-1] if lines[-1] == "```" else lines[1:])
                if response_text.startswith("json"):
                    response_text = response_text[4:].strip()
            
            ai_insights = json.loads(response_text)
            
            # Merge AI insights into results
            insight_map = {item["user_id"]: item for item in ai_insights}
            for result in results:
                if result["user_id"] in insight_map:
                    insight = insight_map[result["user_id"]]
                    result["collaboration_potential"] = insight.get("collaboration_potential", "")
                    result["ai_insights"] = insight.get("ai_insight", "")
                    
        except Exception as e:
            logging.error(f"AI matching insights error: {e}")
            # Continue without AI insights
    
    return {
        "matches": results,
        "total": len(results),
        "filters_applied": {
            "min_score": request.min_score,
            "role_filter": request.role_filter,
            "sector_filter": request.sector_filter
        }
    }

@router.get("/recommendations")
async def get_recommendations(user: dict = Depends(lambda: get_current_user)):
    """Get AI-powered recommendations (legacy endpoint)"""
    # Delegate to ai-matches with default params
    request = MatchRequest(min_score=40, limit=5)
    result = await get_ai_matches(request, user)
    
    # Transform to legacy format
    return [
        {
            "user": {
                "user_id": m["user_id"],
                "name": m["name"],
                "roles": m["roles"],
                "profile": {
                    "headline": m.get("headline"),
                    "skills": m.get("skills", []),
                    "sectors": m.get("sectors", [])
                }
            },
            "match_score": m["match_score"] / 100,
            "match_reason": m["match_reasons"][0] if m["match_reasons"] else "Potential match"
        }
        for m in result.get("matches", [])
    ]
