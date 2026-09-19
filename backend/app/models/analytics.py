import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, Date, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from backend.app.core.database import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


class SiteMetric(Base):
    __tablename__ = "site_metrics_timeseries"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    site_id = Column(
        String(36),
        ForeignKey("sites.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    record_date = Column(Date, nullable=False, index=True)

    # Carbon Metrics
    carbon_stock_tco2e = Column(Float, nullable=False, default=0.0)
    sequestration_rate = Column(Float, nullable=False, default=0.0)
    biomass_density = Column(Float, nullable=False, default=0.0)

    # Biodiversity & Ecological Metrics
    ndvi_mean = Column(Float, nullable=False, default=0.5)
    canopy_cover_pct = Column(Float, nullable=False, default=50.0)
    species_richness = Column(Integer, nullable=False, default=20)
    shannon_index = Column(Float, nullable=False, default=2.0)
    soil_moisture_pct = Column(Float, nullable=False, default=35.0)

    data_source = Column(
        String(100), default="sentinel2_synthetic", nullable=False
    )
    created_at = Column(
        DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )

    site = relationship("Site", back_populates="metrics")
