import json
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, Optional

from geoalchemy2 import Geometry
from geoalchemy2.elements import WKBElement, WKTElement
from geoalchemy2.shape import from_shape, to_shape
from shapely import from_wkt
from shapely.geometry import Polygon, shape
from sqlalchemy import Column, DateTime, Float, ForeignKey, Index, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.types import TypeDecorator

from backend.app.core.database import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


class PostGISPolygon(TypeDecorator):
    """SQLAlchemy geometry type that natively maps to PostGIS Geometry('POLYGON', srid=4326)

    on PostgreSQL, while providing a clean WKT/text fallback for lightweight SQLite testing.
    """

    impl = Geometry
    cache_ok = True

    def __init__(self, srid: int = 4326, **kwargs):
        super().__init__(**kwargs)
        self.srid = srid
        self.geometry_type = "POLYGON"

    def load_dialect_impl(self, dialect):
        if dialect is not None and dialect.name == "postgresql":
            return dialect.type_descriptor(
                Geometry(geometry_type="POLYGON", srid=self.srid)
            )
        return dialect.type_descriptor(Text()) if dialect else Text()

    def process_bind_param(self, value, dialect):
        if value is None:
            return None

        # Normalize input to Shapely Polygon
        if isinstance(value, Polygon):
            poly = value
        elif isinstance(value, dict):
            poly = shape(value)
        elif isinstance(value, str):
            try:
                poly = shape(json.loads(value))
            except Exception:
                poly = from_wkt(value)
        elif isinstance(value, (WKBElement, WKTElement)):
            if dialect is not None and dialect.name == "postgresql":
                return value
            poly = to_shape(value)
        else:
            raise ValueError(
                f"Unsupported geometry input for PostGIS polygon: {type(value)}"
            )

        if dialect is not None and dialect.name == "postgresql":
            return from_shape(poly, srid=self.srid)
        else:
            return poly.wkt

    def process_result_value(self, value, dialect):
        return value


class Site(Base):
    __tablename__ = "sites"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    project_id = Column(
        String(36),
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    habitat_type = Column(
        String(100), nullable=False, default="tropical_moist_forest"
    )

    # Native PostGIS geometry column: SRID 4326 Polygon
    boundary = Column(PostGISPolygon(srid=4326), nullable=False)

    centroid_lat = Column(Float, nullable=False, default=0.0)
    centroid_lng = Column(Float, nullable=False, default=0.0)
    area_hectares = Column(Float, nullable=False, default=0.0)
    elevation_meters = Column(Float, nullable=True, default=120.0)
    created_at = Column(
        DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    project = relationship("Project", back_populates="sites")
    metrics = relationship(
        "SiteMetric",
        back_populates="site",
        cascade="all, delete-orphan",
        order_by="SiteMetric.record_date",
    )

    __table_args__ = (
        Index("idx_sites_boundary_gist", "boundary", postgresql_using="gist"),
    )

    @property
    def geom_shape(self) -> Optional[Polygon]:
        """Convert boundary column to a Shapely Polygon."""
        if self.boundary is None:
            return None
        if isinstance(self.boundary, (WKBElement, WKTElement)):
            return to_shape(self.boundary)
        if isinstance(self.boundary, Polygon):
            return self.boundary
        if isinstance(self.boundary, dict):
            return shape(self.boundary)
        if isinstance(self.boundary, str):
            try:
                return from_wkt(self.boundary)
            except Exception:
                return shape(json.loads(self.boundary))
        return None

    @property
    def geometry_dict(self) -> Dict[str, Any]:
        """Convert stored PostGIS polygon geometry to a standard GeoJSON geometry dict for Mapbox."""
        poly = self.geom_shape
        if poly is None:
            return {}
        coords = [
            [list(pt) for pt in poly.exterior.coords]
        ] + [
            [list(pt) for pt in interior.coords]
            for interior in poly.interiors
        ]
        return {
            "type": "Polygon",
            "coordinates": coords,
        }

    @property
    def boundary_geojson(self) -> str:
        """Serialized GeoJSON string of the boundary for backward compatibility."""
        return json.dumps(self.geometry_dict)

    def to_geojson_feature(self) -> Dict[str, Any]:
        """Format site as standard GeoJSON Feature for Mapbox GL JS."""
        return {
            "type": "Feature",
            "id": self.id,
            "geometry": self.geometry_dict,
            "properties": {
                "id": self.id,
                "project_id": self.project_id,
                "name": self.name,
                "description": self.description or "",
                "habitat_type": self.habitat_type,
                "area_hectares": (
                    round(self.area_hectares, 2)
                    if self.area_hectares is not None
                    else 0.0
                ),
                "centroid": [self.centroid_lng or 0.0, self.centroid_lat or 0.0],
                "elevation_meters": self.elevation_meters,
                "created_at": (
                    self.created_at.isoformat() if self.created_at else None
                ),
            },
        }
