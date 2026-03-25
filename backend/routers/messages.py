"""
Messages Router for CoFounderBay API
Handles: Conversations, messages, real-time chat
"""
from fastapi import APIRouter, HTTPException, Depends, Query, Body
from datetime import datetime, timezone
from typing import List, Optional

from .deps import db, get_current_user, generate_id, create_notification
from .models import MessageCreate

router = APIRouter(prefix="/messages", tags=["Messages"])

# ============== CONVERSATIONS ==============

@router.get("/conversations")
async def get_conversations(user: dict = Depends(get_current_user)):
    """Get all conversations for current user"""
    conversations = await db.conversations.find(
        {"participants": user["user_id"]},
        {"_id": 0}
    ).sort("updated_at", -1).to_list(100)
    
    # Enrich with participant info and last message
    for conv in conversations:
        other_id = [p for p in conv["participants"] if p != user["user_id"]][0]
        other_user = await db.users.find_one(
            {"user_id": other_id},
            {"_id": 0, "user_id": 1, "name": 1, "profile.headline": 1, "profile.profile_image": 1}
        )
        conv["other_user"] = other_user
        
        # Get last message
        last_msg = await db.messages.find_one(
            {"conversation_id": conv["conversation_id"]},
            {"_id": 0}
        )
        conv["last_message"] = last_msg
    
    return conversations

@router.post("/conversations")
async def create_conversation(
    data: dict = Body(...),
    user: dict = Depends(get_current_user)
):
    """Start a new conversation"""
    target_id = data.get("user_id")
    if not target_id:
        raise HTTPException(status_code=400, detail="user_id required")
    
    if target_id == user["user_id"]:
        raise HTTPException(status_code=400, detail="Cannot message yourself")
    
    # Check if conversation already exists
    existing = await db.conversations.find_one({
        "participants": {"$all": [user["user_id"], target_id]}
    })
    
    if existing:
        existing.pop("_id", None)
        return existing
    
    conversation = {
        "conversation_id": generate_id("conv"),
        "participants": [user["user_id"], target_id],
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
        "unread_count": {user["user_id"]: 0, target_id: 0}
    }
    
    await db.conversations.insert_one(conversation)
    conversation.pop("_id", None)
    return conversation

# ============== MESSAGES ==============

@router.get("/conversations/{conversation_id}/messages")
async def get_messages(
    conversation_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
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
    await db.conversations.update_one(
        {"conversation_id": conversation_id},
        {"$set": {f"unread_count.{user['user_id']}": 0}}
    )
    
    return list(reversed(messages))

@router.post("/conversations/{conversation_id}/messages")
async def send_message(
    conversation_id: str,
    data: MessageCreate,
    user: dict = Depends(get_current_user)
):
    """Send a message in a conversation"""
    conv = await db.conversations.find_one({"conversation_id": conversation_id})
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    if user["user_id"] not in conv["participants"]:
        raise HTTPException(status_code=403, detail="Not a participant")
    
    message = {
        "message_id": generate_id("msg"),
        "conversation_id": conversation_id,
        "sender_id": user["user_id"],
        "content": data.content,
        "attachments": data.attachments,
        "read_by": [user["user_id"]],
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.messages.insert_one(message)
    
    # Update conversation
    other_id = [p for p in conv["participants"] if p != user["user_id"]][0]
    await db.conversations.update_one(
        {"conversation_id": conversation_id},
        {
            "$set": {"updated_at": datetime.now(timezone.utc)},
            "$inc": {f"unread_count.{other_id}": 1}
        }
    )
    
    # Notify recipient
    await create_notification(
        other_id,
        "new_message",
        "New Message",
        f"{user['name']}: {data.content[:50]}...",
        f"/messages/{conversation_id}",
        {"sender_id": user["user_id"]}
    )
    
    message.pop("_id", None)
    return message

@router.put("/conversations/{conversation_id}/read")
async def mark_as_read(conversation_id: str, user: dict = Depends(get_current_user)):
    """Mark conversation as read"""
    conv = await db.conversations.find_one({"conversation_id": conversation_id})
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    if user["user_id"] not in conv["participants"]:
        raise HTTPException(status_code=403, detail="Not a participant")
    
    await db.conversations.update_one(
        {"conversation_id": conversation_id},
        {"$set": {f"unread_count.{user['user_id']}": 0}}
    )
    
    await db.messages.update_many(
        {"conversation_id": conversation_id, "sender_id": {"$ne": user["user_id"]}},
        {"$addToSet": {"read_by": user["user_id"]}}
    )
    
    return {"message": "Marked as read"}
