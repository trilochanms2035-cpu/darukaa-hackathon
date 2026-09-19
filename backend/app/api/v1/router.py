from fastapi import APIRouter

from backend.app.api.v1.endpoints import analytics, auth, projects, sites

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(projects.router, prefix="/projects", tags=["Projects"])
api_router.include_router(sites.router, prefix="/sites", tags=["Sites & Geospatial"])
api_router.include_router(
    analytics.router, prefix="/analytics", tags=["Analytics & KPIs"]
)
