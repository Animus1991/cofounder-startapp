"""
Users Router for CoFounderBay API
Handles: User profiles, connections, search
"""
from fastapi import APIRouter, HTTPException, Depends, Query, Body
from datetime import datetime, timezone
from typing import List, Optional

from .deps import db, get_current_user, generate_id, create_notification
from .models import PersonProfile, ConnectionRequest

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("")
async def get_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    role: Optional[str] = None,
    skills: Optional[str] = None,
    sectors: Optional[str] = None,
    location: Optional[str] = None,
    user: dict = Depends(get_current_user)
):
    """Get users with optional filters"""
    query = {}
    
    if role:
        query["roles"] = role
    if skills:
        skill_list = [s.strip() for s in skills.split(",")]
        query["profile.skills"] = {"$in": skill_list}
    if sectors:
        sector_list = [s.strip() for s in sectors.split(",")]
        query["profile.sectors"] = {"$in": sector_list}
    if location:
        query["profile.location"] = {"$regex": location, "$options": "i"}
    
    users = await db.users.find(
        query,
        {"_id": 0, "password_hash": 0}
    ).skip(skip).limit(limit).to_list(limit)
    
    return users

@router.get("/me")
async def get_my_profile(user: dict = Depends(get_current_user)):
    """Get current user's profile"""
    return user

@router.get("/{user_id}")
async def get_user_profile(user_id: str, user: dict = Depends(get_current_user)):
    """Get a specific user's profile"""
    target = await db.users.find_one(
        {"user_id": user_id},
        {"_id": 0, "password_hash": 0}
    )
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    return target

@router.put("/me/profile")
async def update_profile(
    profile_data: dict = Body(...),
    user: dict = Depends(get_current_user)
):
    """Update current user's profile"""
    update_fields = {f"profile.{k}": v for k, v in profile_data.items()}
    update_fields["updated_at"] = datetime.now(timezone.utc)
    update_fields["needs_onboarding"] = False
    
    await db.users.update_one(
        {"user_id": user["user_id"]},
        {"$set": update_fields}
    )
    
    updated = await db.users.find_one(
        {"user_id": user["user_id"]},
        {"_id": 0, "password_hash": 0}
    )
    return updated

# ============== CONNECTIONS ==============

@router.get("/connections")
async def get_connections(user: dict = Depends(get_current_user)):
    """Get user's connections"""
    connections = await db.connections.find({
        "$or": [
            {"user_id": user["user_id"]},
            {"connected_user_id": user["user_id"]}
        ],
        "status": "accepted"
    }).to_list(1000)
    
    # Get connected user details
    connected_ids = []
    for conn in connections:
        other_id = conn["connected_user_id"] if conn["user_id"] == user["user_id"] else conn["user_id"]
        connected_ids.append(other_id)
    
    if connected_ids:
        users = await db.users.find(
            {"user_id": {"$in": connected_ids}},
            {"_id": 0, "password_hash": 0}
        ).to_list(len(connected_ids))
        return users
    
    return []

@router.post("/connections")
async def create_connection(
    data: ConnectionRequest,
    user: dict = Depends(get_current_user)
):
    """Send a connection request"""
    if data.target_user_id == user["user_id"]:
        raise HTTPException(status_code=400, detail="Cannot connect to yourself")
    
    # Check if already connected
    existing = await db.connections.find_one({
        "$or": [
            {"user_id": user["user_id"], "connected_user_id": data.target_user_id},
            {"user_id": data.target_user_id, "connected_user_id": user["user_id"]}
        ]
    })
    
    if existing:
        raise HTTPException(status_code=400, detail="Connection already exists")
    
    connection = {
        "connection_id": generate_id("conn"),
        "user_id": user["user_id"],
        "connected_user_id": data.target_user_id,
        "status": "pending",
        "message": data.message,
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.connections.insert_one(connection)
    
    # Notify target user
    await create_notification(
        data.target_user_id,
        "connection_request",
        "New Connection Request",
        f"{user['name']} wants to connect with you",
        f"/user/{user['user_id']}",
        {"from_user_id": user["user_id"]}
    )
    
    connection.pop("_id", None)
    return connection

@router.put("/connections/{connection_id}")
async def update_connection(
    connection_id: str,
    data: dict = Body(...),
    user: dict = Depends(get_current_user)
):
    """Accept or reject a connection request"""
    connection = await db.connections.find_one({"connection_id": connection_id})
    
    if not connection:
        raise HTTPException(status_code=404, detail="Connection not found")
    
    if connection["connected_user_id"] != user["user_id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    new_status = data.get("status")
    if new_status not in ["accepted", "rejected"]:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    await db.connections.update_one(
        {"connection_id": connection_id},
        {"$set": {"status": new_status, "updated_at": datetime.now(timezone.utc)}}
    )
    
    if new_status == "accepted":
        # Update connection counts
        await db.users.update_one(
            {"user_id": connection["user_id"]},
            {"$inc": {"connection_count": 1}}
        )
        await db.users.update_one(
            {"user_id": connection["connected_user_id"]},
            {"$inc": {"connection_count": 1}}
        )
        
        # Notify requester
        await create_notification(
            connection["user_id"],
            "connection_accepted",
            "Connection Accepted",
            f"{user['name']} accepted your connection request",
            f"/user/{user['user_id']}"
        )
    
    return {"message": f"Connection {new_status}"}
