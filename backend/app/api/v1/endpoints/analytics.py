from datetime import date
from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from backend.app.api.deps import get_current_user
from backend.app.core.database import get_db
from backend.app.models.analytics import SiteMetric
from backend.app.models.project import Project
from backend.app.models.site import Site
from backend.app.models.user import User
from backend.app.schemas.analytics import (
    DashboardOverviewResponse,
    MetricResponse,
    SiteAnalyticsResponse,
    SiteKPIs,
)
from backend.app.services.mock_data_generator import (
    generate_site_timeseries_metrics,
)

router = APIRouter()


@router.get("/overview", response_model=DashboardOverviewResponse)
def get_dashboard_overview(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Compute platform-wide aggregate environmental and carbon KPIs."""
    total_projects = db.query(func.count(Project.id)).scalar() or 0
    total_sites = db.query(func.count(Site.id)).scalar() or 0
    total_hectares = db.query(func.sum(Site.area_hectares)).scalar() or 0.0

    # Calculate total carbon stock from latest record of each site
    sites = db.query(Site).all()
    total_carbon = 0.0
    latest_ndvis = []
    latest_shannons = []

    for s in sites:
        latest = (
            db.query(SiteMetric)
            .filter(SiteMetric.site_id == s.id)
            .order_by(SiteMetric.record_date.desc())
            .first()
        )
        if latest:
            total_carbon += latest.carbon_stock_tco2e
            latest_ndvis.append(latest.ndvi_mean)
            latest_shannons.append(latest.shannon_index)

    avg_ndvi = (
        round(sum(latest_ndvis) / len(latest_ndvis), 3) if latest_ndvis else 0.0
    )
    avg_shannon = (
        round(sum(latest_shannons) / len(latest_shannons), 3)
        if latest_shannons
        else 0.0
    )

    return DashboardOverviewResponse(
        total_projects=total_projects,
        total_sites=total_sites,
        total_hectares=round(total_hectares, 2),
        total_carbon_sequestered_tco2e=round(total_carbon, 2),
        average_ndvi=avg_ndvi,
        average_shannon_index=avg_shannon,
    )


@router.get("/sites/{site_id}", response_model=SiteAnalyticsResponse)
def get_site_analytics(
    site_id: str,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Retrieve full temporal analytics and current ecological KPIs for a site."""
    site = db.query(Site).filter(Site.id == site_id).first()
    if not site:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Site not found"
        )

    project = db.query(Project).filter(Project.id == site.project_id).first()
    project_title = project.title if project else "Unknown Project"

    # Query metrics with optional date filtering
    query = db.query(SiteMetric).filter(SiteMetric.site_id == site_id)
    if start_date:
        query = query.filter(SiteMetric.record_date >= start_date)
    if end_date:
        query = query.filter(SiteMetric.record_date <= end_date)

    metrics = query.order_by(SiteMetric.record_date.asc()).all()

    # If no metrics exist yet, generate them on the fly
    if not metrics:
        metrics = generate_site_timeseries_metrics(
            site_id=site.id,
            area_hectares=site.area_hectares,
            habitat_type=site.habitat_type,
            months=36,
        )
        db.add_all(metrics)
        db.commit()

    latest = metrics[-1]

    kpis = SiteKPIs(
        total_area_hectares=round(site.area_hectares, 2),
        current_carbon_stock_tco2e=round(latest.carbon_stock_tco2e, 2),
        annual_sequestration_rate=round(latest.sequestration_rate, 2),
        current_ndvi=round(latest.ndvi_mean, 3),
        current_canopy_cover_pct=round(latest.canopy_cover_pct, 1),
        current_species_richness=latest.species_richness,
        current_shannon_index=round(latest.shannon_index, 3),
    )

    return SiteAnalyticsResponse(
        site_id=site.id,
        site_name=site.name,
        project_id=site.project_id,
        project_title=project_title,
        habitat_type=site.habitat_type,
        area_hectares=round(site.area_hectares, 2),
        kpis=kpis,
        timeseries=[MetricResponse.model_validate(m) for m in metrics],
    )


@router.post("/sites/{site_id}/regenerate", response_model=SiteAnalyticsResponse)
def regenerate_site_metrics(
    site_id: str,
    months: int = Query(default=36, ge=12, le=60),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Regenerate or re-seed time-series data for a site."""
    site = db.query(Site).filter(Site.id == site_id).first()
    if not site:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Site not found"
        )

    # Delete existing metrics
    db.query(SiteMetric).filter(SiteMetric.site_id == site_id).delete()
    db.commit()

    # Generate fresh metrics
    new_metrics = generate_site_timeseries_metrics(
        site_id=site.id,
        area_hectares=site.area_hectares,
        habitat_type=site.habitat_type,
        months=months,
    )
    db.add_all(new_metrics)
    db.commit()

    return get_site_analytics(site_id=site_id, db=db, current_user=current_user)
