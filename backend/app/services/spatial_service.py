import math
from typing import Any, Dict, Tuple

from shapely.geometry import Polygon, shape
from sqlalchemy import text
from sqlalchemy.orm import Session


def validate_and_parse_polygon(geometry: Dict[str, Any]) -> Polygon:
    """Validate GeoJSON geometry structure and return Shapely Polygon."""
    if not isinstance(geometry, dict):
        raise ValueError("Geometry must be a GeoJSON object")

    geom_type = geometry.get("type")
    if geom_type != "Polygon":
        raise ValueError(
            f"Expected geometry type 'Polygon', received '{geom_type}'"
        )

    coords = geometry.get("coordinates")
    if not coords or not isinstance(coords, list) or len(coords) == 0:
        raise ValueError("Polygon must contain coordinate rings")

    exterior = coords[0]
    if len(exterior) < 4:
        raise ValueError(
            "Exterior ring must contain at least 4 coordinates (closed ring)"
        )

    # Check if closed
    if exterior[0] != exterior[-1]:
        # Auto-close ring for convenience
        exterior.append(exterior[0])
        geometry["coordinates"][0] = exterior

    poly = shape(geometry)
    if not poly.is_valid:
        # Attempt repair
        poly = poly.buffer(0)
        if not poly.is_valid:
            raise ValueError("Invalid polygon topology")

    return poly


def calculate_polygon_centroid(poly: Polygon) -> Tuple[float, float]:
    """Calculate (latitude, longitude) centroid of polygon."""
    c = poly.centroid
    # WGS84 GeoJSON is [longitude, latitude] -> c.x is lng, c.y is lat
    return float(c.y), float(c.x)


def calculate_geodesic_area_hectares(
    poly: Polygon, db: Session = None, geom_geojson_str: str = None
) -> float:
    """Calculate ground surface area in hectares.

    Uses PostGIS ST_Area with WGS84 geography if connected to PostgreSQL;
    otherwise computes geodesic spherical polygon area directly.
    """
    if db and geom_geojson_str:
        try:
            # Try PostGIS native geography calculation for maximum accuracy
            bind = db.get_bind()
            if bind.dialect.name == "postgresql":
                sql = text(
                    """
                    SELECT ST_Area(ST_GeomFromGeoJSON(:geom)::geography) / 10000.0 AS area_ha;
                """
                )
                result = db.execute(sql, {"geom": geom_geojson_str}).scalar()
                if result is not None and result > 0:
                    return float(result)
        except Exception:
            pass  # Fall back to pure Python spherical geodesy

    # Pure Python spherical geodesy area calculation (WGS84 authalic sphere R = 6371008.8m)
    # Uses Gauss-Bonnet spherical polygon area formula
    coords = list(poly.exterior.coords)
    if len(coords) < 3:
        return 0.0

    R = 6371008.8  # Earth mean radius in meters
    total = 0.0
    num_pts = len(coords)

    for i in range(num_pts - 1):
        p1 = coords[i]
        p2 = coords[i + 1]
        lon1 = math.radians(p1[0])
        lat1 = math.radians(p1[1])
        lon2 = math.radians(p2[0])
        lat2 = math.radians(p2[1])
        total += (lon2 - lon1) * (2 + math.sin(lat1) + math.sin(lat2))

    area_sq_meters = abs(total * (R**2) / 2.0)
    area_hectares = area_sq_meters / 10000.0
    return max(0.01, round(area_hectares, 4))
