from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class ProjectBase(BaseModel):
    title: str = Field(..., min_length=2, max_length=255)
    description: Optional[str] = None
    project_type: str = Field(default="reforestation")
    standard: str = Field(default="Verra VCS")
    status: str = Field(default="active")
    country: str = Field(default="Global")


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    project_type: Optional[str] = None
    standard: Optional[str] = None
    status: Optional[str] = None
    country: Optional[str] = None


class ProjectResponse(ProjectBase):
    id: str
    owner_id: str
    created_at: datetime
    updated_at: datetime
    sites_count: int = 0
    total_area_hectares: float = 0.0
    total_carbon_stock: float = 0.0

    model_config = ConfigDict(from_attributes=True)
