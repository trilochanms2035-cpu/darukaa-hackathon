from datetime import date
from typing import List

from pydantic import BaseModel, ConfigDict


class MetricResponse(BaseModel):
    id: str
    site_id: str
    record_date: date
    carbon_stock_tco2e: float
    sequestration_rate: float
    biomass_density: float
    ndvi_mean: float
    canopy_cover_pct: float
    species_richness: int
    shannon_index: float
    soil_moisture_pct: float
    data_source: str

    model_config = ConfigDict(from_attributes=True)


class SiteKPIs(BaseModel):
    total_area_hectares: float
    current_carbon_stock_tco2e: float
    annual_sequestration_rate: float
    current_ndvi: float
    current_canopy_cover_pct: float
    current_species_richness: int
    current_shannon_index: float


class SiteAnalyticsResponse(BaseModel):
    site_id: str
    site_name: str
    project_id: str
    project_title: str
    habitat_type: str
    area_hectares: float
    kpis: SiteKPIs
    timeseries: List[MetricResponse]


class DashboardOverviewResponse(BaseModel):
    total_projects: int
    total_sites: int
    total_hectares: float
    total_carbon_sequestered_tco2e: float
    average_ndvi: float
    average_shannon_index: float
