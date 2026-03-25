"""
Admin Router for CoFounderBay API  
Handles: Admin dashboard, moderation, analytics
"""
from fastapi import APIRouter, HTTPException, Depends, Query, Body
from datetime import datetime, timezone, timedelta
from typing import List, Optional

from .deps import db, get_current_user, generate_id

router = APIRouter(prefix="/admin", tags=["Admin"])

async def require_admin(user: dict = Depends(get_current_user)):
    """Require admin role"""
    # For MVP, check if user has admin-like privileges (can be expanded)
    # Currently any authenticated user can access basic stats
    return user

@router.get("/stats")
async def get_platform_stats(user: dict = Depends(require_admin)):
    """Get platform statistics"""
    now = datetime.now(timezone.utc)
    week_ago = now - timedelta(days=7)
    month_ago = now - timedelta(days=30)
    
    stats = {
        "users": {
            "total": await db.users.count_documents({}),
            "new_this_week": await db.users.count_documents({"created_at": {"$gte": week_ago}}),
            "new_this_month": await db.users.count_documents({"created_at": {"$gte": month_ago}}),
            "by_role": {}
        },
        "posts": {
            "total": await db.posts.count_documents({}),
            "this_week": await db.posts.count_documents({"created_at": {"$gte": week_ago}})
        },
        "opportunities": {
            "total": await db.opportunities.count_documents({}),
            "open": await db.opportunities.count_documents({"status": "open"})
        },
        "connections": {
            "total": await db.connections.count_documents({"status": "accepted"})
        },
        "communities": {
            "total": await db.communities.count_documents({})
        },
        "messages": {
            "total": await db.messages.count_documents({}),
            "this_week": await db.messages.count_documents({"created_at": {"$gte": week_ago}})
        }
    }
    
    # Count users by role
    for role in ["founder", "investor", "mentor", "talent"]:
        stats["users"]["by_role"][role] = await db.users.count_documents({"roles": role})
    
    return stats

@router.get("/users")
async def get_all_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    role: Optional[str] = None,
    search: Optional[str] = None,
    user: dict = Depends(require_admin)
):
    """Get all users (admin view)"""
    query = {}
    
    if role:
        query["roles"] = role
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}}
        ]
    
    users = await db.users.find(
        query,
        {"_id": 0, "password_hash": 0}
    ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    total = await db.users.count_documents(query)
    
    return {
        "users": users,
        "total": total,
        "skip": skip,
        "limit": limit
    }

@router.get("/recent-activity")
async def get_recent_activity(
    limit: int = Query(20, ge=1, le=100),
    user: dict = Depends(require_admin)
):
    """Get recent platform activity"""
    activity = []
    
    # Recent users
    recent_users = await db.users.find(
        {},
        {"_id": 0, "user_id": 1, "name": 1, "created_at": 1, "roles": 1}
    ).sort("created_at", -1).limit(10).to_list(10)
    
    for u in recent_users:
        activity.append({
            "type": "user_joined",
            "data": u,
            "timestamp": u["created_at"]
        })
    
    # Recent posts
    recent_posts = await db.posts.find(
        {},
        {"_id": 0, "post_id": 1, "author_id": 1, "content": 1, "created_at": 1}
    ).sort("created_at", -1).limit(10).to_list(10)
    
    for p in recent_posts:
        activity.append({
            "type": "post_created",
            "data": p,
            "timestamp": p["created_at"]
        })
    
    # Sort by timestamp
    activity.sort(key=lambda x: x["timestamp"], reverse=True)
    
    return activity[:limit]

@router.get("/moderation/queue")
async def get_moderation_queue(user: dict = Depends(require_admin)):
    """Get content flagged for moderation"""
    # Get flagged posts
    flagged_posts = await db.posts.find(
        {"is_flagged": True},
        {"_id": 0}
    ).limit(50).to_list(50)
    
    # Get reported users
    reports = await db.reports.find(
        {"status": "pending"},
        {"_id": 0}
    ).limit(50).to_list(50)
    
    return {
        "flagged_posts": flagged_posts,
        "pending_reports": reports
    }

@router.post("/moderation/action")
async def take_moderation_action(
    data: dict = Body(...),
    user: dict = Depends(require_admin)
):
    """Take moderation action on content"""
    action = data.get("action")  # approve, remove, warn, ban
    target_type = data.get("target_type")  # post, user
    target_id = data.get("target_id")
    reason = data.get("reason", "")
    
    if action == "remove" and target_type == "post":
        await db.posts.delete_one({"post_id": target_id})
        return {"message": "Post removed"}
    
    elif action == "approve" and target_type == "post":
        await db.posts.update_one(
            {"post_id": target_id},
            {"$set": {"is_flagged": False}}
        )
        return {"message": "Post approved"}
    
    elif action == "warn" and target_type == "user":
        await db.users.update_one(
            {"user_id": target_id},
            {
                "$push": {"warnings": {
                    "reason": reason,
                    "issued_by": user["user_id"],
                    "issued_at": datetime.now(timezone.utc)
                }},
                "$inc": {"trust_score": -10}
            }
        )
        return {"message": "User warned"}
    
    elif action == "ban" and target_type == "user":
        await db.users.update_one(
            {"user_id": target_id},
            {"$set": {"is_banned": True, "banned_at": datetime.now(timezone.utc), "ban_reason": reason}}
        )
        return {"message": "User banned"}
    
    raise HTTPException(status_code=400, detail="Invalid action")
