"""
Communities Router for CoFounderBay API
Handles: Communities, discussions, membership
"""
from fastapi import APIRouter, HTTPException, Depends, Query, Body
from datetime import datetime, timezone
from typing import List, Optional

from .deps import db, get_current_user, generate_id, create_notification
from .models import CommunityCreate, CommunityPostCreate

router = APIRouter(prefix="/communities", tags=["Communities"])

@router.get("")
async def get_communities(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    category: Optional[str] = None,
    type: Optional[str] = None,
    user: dict = Depends(get_current_user)
):
    """Get all communities"""
    query = {}
    
    if category:
        query["category"] = category
    if type:
        query["type"] = type
    
    communities = await db.communities.find(
        query,
        {"_id": 0}
    ).sort("member_count", -1).skip(skip).limit(limit).to_list(limit)
    
    # Check if user is member
    for comm in communities:
        comm["is_member"] = user["user_id"] in comm.get("members", [])
    
    return communities

@router.post("")
async def create_community(
    data: CommunityCreate,
    user: dict = Depends(get_current_user)
):
    """Create a new community"""
    community = {
        "community_id": generate_id("comm"),
        "name": data.name,
        "description": data.description,
        "type": data.type,
        "category": data.category,
        "rules": data.rules,
        "cover_image": data.cover_image,
        "creator_id": user["user_id"],
        "admins": [user["user_id"]],
        "moderators": [],
        "members": [user["user_id"]],
        "member_count": 1,
        "post_count": 0,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }
    
    await db.communities.insert_one(community)
    community.pop("_id", None)
    return community

@router.get("/{community_id}")
async def get_community(community_id: str, user: dict = Depends(get_current_user)):
    """Get community details"""
    community = await db.communities.find_one(
        {"community_id": community_id},
        {"_id": 0}
    )
    
    if not community:
        raise HTTPException(status_code=404, detail="Community not found")
    
    community["is_member"] = user["user_id"] in community.get("members", [])
    community["is_admin"] = user["user_id"] in community.get("admins", [])
    
    # Get recent members
    member_ids = community.get("members", [])[:10]
    if member_ids:
        members = await db.users.find(
            {"user_id": {"$in": member_ids}},
            {"_id": 0, "user_id": 1, "name": 1, "profile.profile_image": 1, "profile.headline": 1}
        ).to_list(10)
        community["recent_members"] = members
    
    return community

@router.post("/{community_id}/join")
async def join_community(community_id: str, user: dict = Depends(get_current_user)):
    """Join a community"""
    community = await db.communities.find_one({"community_id": community_id})
    if not community:
        raise HTTPException(status_code=404, detail="Community not found")
    
    if user["user_id"] in community.get("members", []):
        raise HTTPException(status_code=400, detail="Already a member")
    
    if community["type"] == "invite_only":
        raise HTTPException(status_code=403, detail="This community is invite-only")
    
    await db.communities.update_one(
        {"community_id": community_id},
        {
            "$addToSet": {"members": user["user_id"]},
            "$inc": {"member_count": 1}
        }
    )
    
    return {"message": "Joined community successfully"}

@router.post("/{community_id}/leave")
async def leave_community(community_id: str, user: dict = Depends(get_current_user)):
    """Leave a community"""
    community = await db.communities.find_one({"community_id": community_id})
    if not community:
        raise HTTPException(status_code=404, detail="Community not found")
    
    if user["user_id"] not in community.get("members", []):
        raise HTTPException(status_code=400, detail="Not a member")
    
    if user["user_id"] == community["creator_id"]:
        raise HTTPException(status_code=400, detail="Creator cannot leave the community")
    
    await db.communities.update_one(
        {"community_id": community_id},
        {
            "$pull": {"members": user["user_id"], "admins": user["user_id"], "moderators": user["user_id"]},
            "$inc": {"member_count": -1}
        }
    )
    
    return {"message": "Left community successfully"}

# ============== COMMUNITY POSTS ==============

@router.get("/{community_id}/posts")
async def get_community_posts(
    community_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    type: Optional[str] = None,
    user: dict = Depends(get_current_user)
):
    """Get posts in a community"""
    community = await db.communities.find_one({"community_id": community_id})
    if not community:
        raise HTTPException(status_code=404, detail="Community not found")
    
    # Check access for private communities
    if community["type"] == "private" and user["user_id"] not in community.get("members", []):
        raise HTTPException(status_code=403, detail="Not a member of this private community")
    
    query = {"community_id": community_id}
    if type:
        query["type"] = type
    
    posts = await db.community_posts.find(
        query,
        {"_id": 0}
    ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    # Enrich with author info
    for post in posts:
        author = await db.users.find_one(
            {"user_id": post["author_id"]},
            {"_id": 0, "user_id": 1, "name": 1, "profile.profile_image": 1, "profile.headline": 1}
        )
        post["author"] = author
    
    return posts

@router.post("/{community_id}/posts")
async def create_community_post(
    community_id: str,
    data: CommunityPostCreate,
    user: dict = Depends(get_current_user)
):
    """Create a post in a community"""
    community = await db.communities.find_one({"community_id": community_id})
    if not community:
        raise HTTPException(status_code=404, detail="Community not found")
    
    if user["user_id"] not in community.get("members", []):
        raise HTTPException(status_code=403, detail="Must be a member to post")
    
    post = {
        "post_id": generate_id("cpost"),
        "community_id": community_id,
        "author_id": user["user_id"],
        "title": data.title,
        "content": data.content,
        "type": data.type,
        "tags": data.tags,
        "likes": [],
        "comments": [],
        "is_pinned": False,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }
    
    await db.community_posts.insert_one(post)
    await db.communities.update_one(
        {"community_id": community_id},
        {"$inc": {"post_count": 1}}
    )
    
    post.pop("_id", None)
    post["author"] = {
        "user_id": user["user_id"],
        "name": user["name"],
        "profile": user.get("profile", {})
    }
    return post

@router.post("/{community_id}/posts/{post_id}/comment")
async def comment_on_community_post(
    community_id: str,
    post_id: str,
    data: dict = Body(...),
    user: dict = Depends(get_current_user)
):
    """Add a comment to a community post"""
    post = await db.community_posts.find_one({"post_id": post_id, "community_id": community_id})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    comment = {
        "comment_id": generate_id("ccmt"),
        "author_id": user["user_id"],
        "author_name": user["name"],
        "content": data["content"],
        "likes": [],
        "replies": [],
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.community_posts.update_one(
        {"post_id": post_id},
        {"$push": {"comments": comment}}
    )
    
    # Notify post author
    if post["author_id"] != user["user_id"]:
        await create_notification(
            post["author_id"],
            "community_comment",
            "New Comment",
            f"{user['name']} commented on your post",
            f"/communities/{community_id}/posts/{post_id}"
        )
    
    return comment

@router.post("/{community_id}/posts/{post_id}/like")
async def like_community_post(
    community_id: str,
    post_id: str,
    user: dict = Depends(get_current_user)
):
    """Like/unlike a community post"""
    post = await db.community_posts.find_one({"post_id": post_id, "community_id": community_id})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    if user["user_id"] in post.get("likes", []):
        await db.community_posts.update_one(
            {"post_id": post_id},
            {"$pull": {"likes": user["user_id"]}}
        )
        return {"liked": False}
    else:
        await db.community_posts.update_one(
            {"post_id": post_id},
            {"$addToSet": {"likes": user["user_id"]}}
        )
        return {"liked": True}

# ============== ADMIN ACTIONS ==============

@router.put("/{community_id}")
async def update_community(
    community_id: str,
    data: dict = Body(...),
    user: dict = Depends(get_current_user)
):
    """Update community settings (admin only)"""
    community = await db.communities.find_one({"community_id": community_id})
    if not community:
        raise HTTPException(status_code=404, detail="Community not found")
    
    if user["user_id"] not in community.get("admins", []):
        raise HTTPException(status_code=403, detail="Admin access required")
    
    allowed_fields = ["name", "description", "rules", "cover_image", "type", "category"]
    update_data = {k: v for k, v in data.items() if k in allowed_fields}
    update_data["updated_at"] = datetime.now(timezone.utc)
    
    await db.communities.update_one(
        {"community_id": community_id},
        {"$set": update_data}
    )
    
    updated = await db.communities.find_one({"community_id": community_id}, {"_id": 0})
    return updated

@router.delete("/{community_id}")
async def delete_community(community_id: str, user: dict = Depends(get_current_user)):
    """Delete a community (creator only)"""
    community = await db.communities.find_one({"community_id": community_id})
    if not community:
        raise HTTPException(status_code=404, detail="Community not found")
    
    if community["creator_id"] != user["user_id"]:
        raise HTTPException(status_code=403, detail="Only creator can delete the community")
    
    await db.communities.delete_one({"community_id": community_id})
    await db.community_posts.delete_many({"community_id": community_id})
    
    return {"message": "Community deleted"}
