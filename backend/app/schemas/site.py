from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field


class GeoJSONPolygon(BaseModel):
    type: str = "Polygon"
    coordinates: List[List[List[float]]]


class SiteBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    description: Optional[str] = None
    habitat_type: str = Field(default="tropical_moist_forest")
    elevation_meters: Optional[float] = 120.0


class SiteCreate(SiteBase):
    project_id: str
    # Accepts either a GeoJSON geometry object or coordinates directly
    geometry: Dict[str, Any]


class SiteUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    habitat_type: Optional[str] = None
    elevation_meters: Optional[float] = None


class SiteResponse(SiteBase):
    id: str
    project_id: str
    area_hectares: float
    centroid_lat: float
    centroid_lng: float
    geometry: Dict[str, Any]
    created_at: datetime
    updated_at: datetime
    latest_carbon_stock: Optional[float] = 0.0
    latest_ndvi: Optional[float] = 0.0
    latest_shannon_index: Optional[float] = 0.0

    model_config = ConfigDict(from_attributes=True)


class GeoJSONFeature(BaseModel):
    type: str = "Feature"
    id: str
    geometry: Dict[str, Any]
    properties: Dict[str, Any]


class GeoJSONFeatureCollection(BaseModel):
    type: str = "FeatureCollection"
    features: List[GeoJSONFeature]
