"""
Routers Package for CoFounderBay API
This package contains modular routers for different API domains.
"""
from .users import router as users_router
from .posts import router as posts_router
from .opportunities import router as opportunities_router
from .messages import router as messages_router
from .communities import router as communities_router
from .notifications import router as notifications_router
from .admin import router as admin_router

__all__ = [
    'users_router',
    'posts_router', 
    'opportunities_router',
    'messages_router',
    'communities_router',
    'notifications_router',
    'admin_router'
]

