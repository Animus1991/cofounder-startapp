"""
Routers Package for CoFounderBay API
This package contains modular routers for different API domains.
"""
from .auth import router as auth_router
from .matching import router as matching_router

__all__ = ['auth_router', 'matching_router']
