from typing import Any, List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.api.deps import get_current_user
from backend.app.core.database import get_db
from backend.app.models.analytics import SiteMetric
from backend.app.models.project import Project
from backend.app.models.site import Site
from backend.app.models.user import User
from backend.app.schemas.project import (
    ProjectCreate,
    ProjectResponse,
    ProjectUpdate,
)

router = APIRouter()


def enrich_project_response(project: Project, db: Session) -> ProjectResponse:
    """Calculate aggregate statistics for a project."""
    sites = db.query(Site).filter(Site.project_id == project.id).all()
    sites_count = len(sites)
    total_area = sum(s.area_hectares for s in sites)

    # Calculate latest carbon stock sum
    total_carbon = 0.0
    for s in sites:
        latest_metric = (
            db.query(SiteMetric)
            .filter(SiteMetric.site_id == s.id)
            .order_by(SiteMetric.record_date.desc())
            .first()
        )
        if latest_metric:
            total_carbon += latest_metric.carbon_stock_tco2e

    resp_dict = {
        "id": project.id,
        "title": project.title,
        "description": project.description,
        "project_type": project.project_type,
        "standard": project.standard,
        "status": project.status,
        "country": project.country,
        "owner_id": project.owner_id,
        "created_at": project.created_at,
        "updated_at": project.updated_at,
        "sites_count": sites_count,
        "total_area_hectares": round(total_area, 2),
        "total_carbon_stock": round(total_carbon, 2),
    }
    return ProjectResponse(**resp_dict)


@router.get("/", response_model=List[ProjectResponse])
def get_projects(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """List all projects."""
    projects = (
        db.query(Project)
        .order_by(Project.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return [enrich_project_response(p, db) for p in projects]


@router.post(
    "/", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED
)
def create_project(
    project_in: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Create a new project."""
    project = Project(
        title=project_in.title,
        description=project_in.description,
        project_type=project_in.project_type,
        standard=project_in.standard,
        status=project_in.status,
        country=project_in.country,
        owner_id=current_user.id,
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return enrich_project_response(project, db)


@router.get("/{id}", response_model=ProjectResponse)
def get_project(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Get project by ID."""
    project = db.query(Project).filter(Project.id == id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Project not found"
        )
    return enrich_project_response(project, db)


@router.put("/{id}", response_model=ProjectResponse)
def update_project(
    id: str,
    project_in: ProjectUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Update project details."""
    project = db.query(Project).filter(Project.id == id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Project not found"
        )

    update_data = project_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(project, field, value)

    db.commit()
    db.refresh(project)
    return enrich_project_response(project, db)


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    """Delete project and all associated sites."""
    project = db.query(Project).filter(Project.id == id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Project not found"
        )
    db.delete(project)
    db.commit()
