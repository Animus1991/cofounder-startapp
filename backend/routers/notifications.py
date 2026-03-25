"""
Notifications Router for CoFounderBay API
Handles: User notifications, read status
"""
from fastapi import APIRouter, HTTPException, Depends, Query, Body
from datetime import datetime, timezone
from typing import List, Optional

from .deps import db, get_current_user, generate_id

router = APIRouter(prefix="/notifications", tags=["Notifications"])

@router.get("")
async def get_notifications(
    skip: int = Query(0, ge=0),
    limit: int = Query(30, ge=1, le=100),
    unread_only: bool = Query(False),
    user: dict = Depends(get_current_user)
):
    """Get user's notifications"""
    query = {"user_id": user["user_id"]}
    
    if unread_only:
        query["is_read"] = False
    
    notifications = await db.notifications.find(
        query,
        {"_id": 0}
    ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    return notifications

@router.get("/count")
async def get_unread_count(user: dict = Depends(get_current_user)):
    """Get count of unread notifications"""
    count = await db.notifications.count_documents({
        "user_id": user["user_id"],
        "is_read": False
    })
    
    return {"unread_count": count}

@router.put("/{notification_id}/read")
async def mark_notification_read(
    notification_id: str,
    user: dict = Depends(get_current_user)
):
    """Mark a notification as read"""
    result = await db.notifications.update_one(
        {"notification_id": notification_id, "user_id": user["user_id"]},
        {"$set": {"is_read": True, "read_at": datetime.now(timezone.utc)}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    return {"message": "Marked as read"}

@router.put("/read-all")
async def mark_all_read(user: dict = Depends(get_current_user)):
    """Mark all notifications as read"""
    await db.notifications.update_many(
        {"user_id": user["user_id"], "is_read": False},
        {"$set": {"is_read": True, "read_at": datetime.now(timezone.utc)}}
    )
    
    return {"message": "All notifications marked as read"}

@router.delete("/{notification_id}")
async def delete_notification(
    notification_id: str,
    user: dict = Depends(get_current_user)
):
    """Delete a notification"""
    result = await db.notifications.delete_one({
        "notification_id": notification_id,
        "user_id": user["user_id"]
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    return {"message": "Notification deleted"}

@router.delete("")
async def clear_all_notifications(user: dict = Depends(get_current_user)):
    """Clear all notifications"""
    result = await db.notifications.delete_many({"user_id": user["user_id"]})
    
    return {"message": f"Deleted {result.deleted_count} notifications"}
