"""
Opportunities Router for CoFounderBay API
Handles: Job/opportunity listings, applications
"""
from fastapi import APIRouter, HTTPException, Depends, Query, Body
from datetime import datetime, timezone
from typing import List, Optional

from .deps import db, get_current_user, generate_id, create_notification
from .models import OpportunityCreate, ApplicationCreate

router = APIRouter(prefix="/opportunities", tags=["Opportunities"])

@router.get("")
async def get_opportunities(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    type: Optional[str] = None,
    status: Optional[str] = "open",
    remote_ok: Optional[bool] = None,
    user: dict = Depends(get_current_user)
):
    """Get opportunities with filters"""
    query = {}
    
    if status:
        query["status"] = status
    if type:
        query["type"] = type
    if remote_ok is not None:
        query["remote_ok"] = remote_ok
    
    opportunities = await db.opportunities.find(
        query,
        {"_id": 0}
    ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    # Enrich with poster info
    for opp in opportunities:
        poster = await db.users.find_one(
            {"user_id": opp["posted_by"]},
            {"_id": 0, "user_id": 1, "name": 1, "profile.headline": 1, "profile.profile_image": 1}
        )
        opp["poster"] = poster
    
    return opportunities

@router.post("")
async def create_opportunity(
    data: OpportunityCreate,
    user: dict = Depends(get_current_user)
):
    """Create a new opportunity"""
    opportunity = {
        "opportunity_id": generate_id("opp"),
        "posted_by": user["user_id"],
        "org_id": data.org_id,
        "type": data.type,
        "title": data.title,
        "description": data.description,
        "requirements": data.requirements,
        "skills_required": data.skills_required,
        "location": data.location,
        "remote_ok": data.remote_ok,
        "compensation_type": data.compensation_type,
        "compensation_details": data.compensation_details,
        "equity_range": data.equity_range,
        "commitment": data.commitment,
        "deadline": data.deadline,
        "status": "open",
        "applications": [],
        "views": 0,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }
    
    await db.opportunities.insert_one(opportunity)
    opportunity.pop("_id", None)
    return opportunity

@router.get("/{opportunity_id}")
async def get_opportunity(opportunity_id: str, user: dict = Depends(get_current_user)):
    """Get a specific opportunity"""
    opp = await db.opportunities.find_one({"opportunity_id": opportunity_id}, {"_id": 0})
    if not opp:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    
    # Increment views
    await db.opportunities.update_one(
        {"opportunity_id": opportunity_id},
        {"$inc": {"views": 1}}
    )
    
    poster = await db.users.find_one(
        {"user_id": opp["posted_by"]},
        {"_id": 0, "user_id": 1, "name": 1, "profile": 1}
    )
    opp["poster"] = poster
    return opp

@router.put("/{opportunity_id}")
async def update_opportunity(
    opportunity_id: str,
    data: dict = Body(...),
    user: dict = Depends(get_current_user)
):
    """Update an opportunity"""
    opp = await db.opportunities.find_one({"opportunity_id": opportunity_id})
    if not opp:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    
    if opp["posted_by"] != user["user_id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    data["updated_at"] = datetime.now(timezone.utc)
    
    await db.opportunities.update_one(
        {"opportunity_id": opportunity_id},
        {"$set": data}
    )
    
    updated = await db.opportunities.find_one({"opportunity_id": opportunity_id}, {"_id": 0})
    return updated

@router.delete("/{opportunity_id}")
async def delete_opportunity(opportunity_id: str, user: dict = Depends(get_current_user)):
    """Delete an opportunity"""
    opp = await db.opportunities.find_one({"opportunity_id": opportunity_id})
    if not opp:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    
    if opp["posted_by"] != user["user_id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.opportunities.delete_one({"opportunity_id": opportunity_id})
    return {"message": "Opportunity deleted"}

# ============== APPLICATIONS ==============

@router.post("/{opportunity_id}/apply")
async def apply_to_opportunity(
    opportunity_id: str,
    data: ApplicationCreate,
    user: dict = Depends(get_current_user)
):
    """Apply to an opportunity"""
    opp = await db.opportunities.find_one({"opportunity_id": opportunity_id})
    if not opp:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    
    if opp["status"] != "open":
        raise HTTPException(status_code=400, detail="Opportunity is not accepting applications")
    
    # Check if already applied
    existing = next((a for a in opp.get("applications", []) if a["applicant_id"] == user["user_id"]), None)
    if existing:
        raise HTTPException(status_code=400, detail="Already applied")
    
    application = {
        "application_id": generate_id("app"),
        "applicant_id": user["user_id"],
        "message": data.message,
        "resume_url": data.resume_url,
        "portfolio_url": data.portfolio_url,
        "status": "pending",
        "applied_at": datetime.now(timezone.utc)
    }
    
    await db.opportunities.update_one(
        {"opportunity_id": opportunity_id},
        {"$push": {"applications": application}}
    )
    
    # Notify opportunity poster
    await create_notification(
        opp["posted_by"],
        "new_application",
        "New Application",
        f"{user['name']} applied to {opp['title']}",
        f"/opportunities/{opportunity_id}",
        {"applicant_id": user["user_id"]}
    )
    
    return application

@router.get("/{opportunity_id}/applications")
async def get_applications(opportunity_id: str, user: dict = Depends(get_current_user)):
    """Get applications for an opportunity (owner only)"""
    opp = await db.opportunities.find_one({"opportunity_id": opportunity_id})
    if not opp:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    
    if opp["posted_by"] != user["user_id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    applications = opp.get("applications", [])
    
    # Enrich with applicant info
    for app in applications:
        applicant = await db.users.find_one(
            {"user_id": app["applicant_id"]},
            {"_id": 0, "password_hash": 0}
        )
        app["applicant"] = applicant
    
    return applications
