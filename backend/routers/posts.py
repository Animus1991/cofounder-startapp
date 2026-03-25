"""
Posts Router for CoFounderBay API
Handles: Posts, comments, likes, feed
"""
from fastapi import APIRouter, HTTPException, Depends, Query, Body
from datetime import datetime, timezone
from typing import List, Optional

from .deps import db, get_current_user, generate_id, create_notification
from .models import PostCreate

router = APIRouter(prefix="/posts", tags=["Posts"])

@router.get("")
async def get_posts(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    type: Optional[str] = None,
    author_id: Optional[str] = None,
    user: dict = Depends(get_current_user)
):
    """Get posts feed"""
    query = {"visibility": {"$in": ["public", "connections"]}}
    
    if type:
        query["type"] = type
    if author_id:
        query["author_id"] = author_id
    
    posts = await db.posts.find(
        query,
        {"_id": 0}
    ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    # Enrich with author info
    for post in posts:
        author = await db.users.find_one(
            {"user_id": post["author_id"]},
            {"_id": 0, "user_id": 1, "name": 1, "profile.headline": 1, "profile.profile_image": 1, "roles": 1}
        )
        post["author"] = author
    
    return posts

@router.post("")
async def create_post(
    post_data: PostCreate,
    user: dict = Depends(get_current_user)
):
    """Create a new post"""
    post = {
        "post_id": generate_id("post"),
        "author_id": user["user_id"],
        "content": post_data.content,
        "type": post_data.type,
        "visibility": post_data.visibility,
        "tags": post_data.tags,
        "media_urls": post_data.media_urls,
        "poll_options": post_data.poll_options,
        "poll_votes": {},
        "linked_opportunity_id": post_data.linked_opportunity_id,
        "likes": [],
        "comments": [],
        "shares": 0,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }
    
    await db.posts.insert_one(post)
    await db.users.update_one(
        {"user_id": user["user_id"]},
        {"$inc": {"post_count": 1}}
    )
    
    post.pop("_id", None)
    post["author"] = {
        "user_id": user["user_id"],
        "name": user["name"],
        "profile": user.get("profile", {})
    }
    return post

@router.get("/{post_id}")
async def get_post(post_id: str, user: dict = Depends(get_current_user)):
    """Get a specific post"""
    post = await db.posts.find_one({"post_id": post_id}, {"_id": 0})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    author = await db.users.find_one(
        {"user_id": post["author_id"]},
        {"_id": 0, "user_id": 1, "name": 1, "profile.headline": 1, "profile.profile_image": 1}
    )
    post["author"] = author
    return post

@router.delete("/{post_id}")
async def delete_post(post_id: str, user: dict = Depends(get_current_user)):
    """Delete a post"""
    post = await db.posts.find_one({"post_id": post_id})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    if post["author_id"] != user["user_id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.posts.delete_one({"post_id": post_id})
    await db.users.update_one(
        {"user_id": user["user_id"]},
        {"$inc": {"post_count": -1}}
    )
    
    return {"message": "Post deleted"}

@router.post("/{post_id}/like")
async def like_post(post_id: str, user: dict = Depends(get_current_user)):
    """Like/unlike a post"""
    post = await db.posts.find_one({"post_id": post_id})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    if user["user_id"] in post.get("likes", []):
        await db.posts.update_one(
            {"post_id": post_id},
            {"$pull": {"likes": user["user_id"]}}
        )
        return {"liked": False}
    else:
        await db.posts.update_one(
            {"post_id": post_id},
            {"$addToSet": {"likes": user["user_id"]}}
        )
        
        # Notify post author
        if post["author_id"] != user["user_id"]:
            await create_notification(
                post["author_id"],
                "post_like",
                "New Like",
                f"{user['name']} liked your post",
                f"/post/{post_id}"
            )
        
        return {"liked": True}

@router.post("/{post_id}/comment")
async def add_comment(
    post_id: str,
    data: dict = Body(...),
    user: dict = Depends(get_current_user)
):
    """Add a comment to a post"""
    post = await db.posts.find_one({"post_id": post_id})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    comment = {
        "comment_id": generate_id("cmt"),
        "author_id": user["user_id"],
        "author_name": user["name"],
        "content": data["content"],
        "likes": [],
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.posts.update_one(
        {"post_id": post_id},
        {"$push": {"comments": comment}}
    )
    
    # Notify post author
    if post["author_id"] != user["user_id"]:
        await create_notification(
            post["author_id"],
            "post_comment",
            "New Comment",
            f"{user['name']} commented on your post",
            f"/post/{post_id}"
        )
    
    return comment
