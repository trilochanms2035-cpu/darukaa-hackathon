import json
from typing import Any, List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.api.deps import get_current_user
from backend.app.core.database import get_db
from backend.app.models.analytics import SiteMetric
from backend.app.models.project import Project
from backend.app.models.site import Site
from backend.app.models.user import User
from backend.app.schemas.site import (
    GeoJSONFeatureCollection,
    SiteCreate,
    SiteResponse,
    SiteUpdate,
)
from backend.app.services.mock_data_generator import (
    generate_site_timeseries_metrics,
)
from backend.app.services.spatial_service import (
    calculate_geodesic_area_hectares,
    calculate_polygon_centroid,
    validate_and_parse_polygon,
)

router = APIRouter()


def enrich_site_response(site: Site, db: Session) -> SiteResponse:
    """Add latest carbon & biodiversity indicators to site response."""
    latest = (
        db.query(SiteMetric)
        .filter(SiteMetric.site_id == site.id)
        .order_by(SiteMetric.record_date.desc())
        .first()
    )

    latest_carbon = latest.carbon_stock_tco2e if latest else 0.0
    latest_ndvi = latest.ndvi_mean if latest else 0.0
    latest_shannon = latest.shannon_index if latest else 0.0

    return SiteResponse(
        id=site.id,
        project_id=site.project_id,
        name=site.name,
        description=site.description,
        habitat_type=site.habitat_type,
        elevation_meters=site.elevation_meters,
        area_hectares=round(site.area_hectares, 2),
        centroid_lat=site.centroid_lat,
        centroid_lng=site.centroid_lng,
        geometry=site.geometry_dict,
        created_at=site.created_at,
        updated_at=site.updated_at,
        latest_carbon_stock=latest_carbon,
        latest_ndvi=latest_ndvi,
        latest_shannon_index=latest_shannon,
    )


@router.get("/", response_model=List[SiteResponse])
def get_sites(
    project_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Retrieve sites, optionally filtered by project_id."""
    query = db.query(Site)
    if project_id:
        query = query.filter(Site.project_id == project_id)
    sites = query.order_by(Site.created_at.desc()).all()
    return [enrich_site_response(s, db) for s in sites]


@router.get("/geojson", response_model=GeoJSONFeatureCollection)
def get_sites_geojson(
    project_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Retrieve sites formatted as standard GeoJSON FeatureCollection for Mapbox GL JS."""
    query = db.query(Site)
    if project_id:
        query = query.filter(Site.project_id == project_id)
    sites = query.all()

    features = [s.to_geojson_feature() for s in sites]
    return {"type": "FeatureCollection", "features": features}


@router.post("/", response_model=SiteResponse, status_code=status.HTTP_201_CREATED)
def create_site(
    site_in: SiteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Create a new site with a GeoJSON polygon boundary.

    Validates polygon topology, computes geodetic area in hectares, computes centroid,
    and automatically initializes historical and current environmental metrics.
    """
    project = (
        db.query(Project).filter(Project.id == site_in.project_id).first()
    )
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Parent project {site_in.project_id} not found",
        )

    try:
        shapely_poly = validate_and_parse_polygon(site_in.geometry)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid polygon boundary: {str(e)}",
        )

    lat, lng = calculate_polygon_centroid(shapely_poly)
    geojson_str = json.dumps(site_in.geometry)
    area_ha = calculate_geodesic_area_hectares(
        shapely_poly, db=db, geom_geojson_str=geojson_str
    )

    site = Site(
        project_id=site_in.project_id,
        name=site_in.name,
        description=site_in.description,
        habitat_type=site_in.habitat_type,
        boundary=shapely_poly,
        centroid_lat=lat,
        centroid_lng=lng,
        area_hectares=area_ha,
        elevation_meters=site_in.elevation_meters or 120.0,
    )
    db.add(site)
    db.commit()
    db.refresh(site)

    # Seed baseline time-series metrics for the newly created site
    metrics = generate_site_timeseries_metrics(
        site_id=site.id,
        area_hectares=site.area_hectares,
        habitat_type=site.habitat_type,
        months=36,
    )
    db.add_all(metrics)
    db.commit()

    return enrich_site_response(site, db)


@router.get("/{site_id}", response_model=SiteResponse)
def get_site(
    site_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Retrieve details of a single site."""
    site = db.query(Site).filter(Site.id == site_id).first()
    if not site:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Site not found"
        )
    return enrich_site_response(site, db)


@router.put("/{site_id}", response_model=SiteResponse)
def update_site(
    site_id: str,
    site_in: SiteUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Update site attributes."""
    site = db.query(Site).filter(Site.id == site_id).first()
    if not site:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Site not found"
        )

    update_data = site_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(site, field, value)

    db.commit()
    db.refresh(site)
    return enrich_site_response(site, db)


@router.delete("/{site_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_site(
    site_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    """Delete site and all related metrics."""
    site = db.query(Site).filter(Site.id == site_id).first()
    if not site:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Site not found"
        )
    db.delete(site)
    db.commit()
