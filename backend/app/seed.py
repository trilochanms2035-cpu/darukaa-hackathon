from backend.app.core.database import SessionLocal, init_db
from backend.app.core.security import get_password_hash
from backend.app.models.project import Project
from backend.app.models.site import Site
from backend.app.models.user import User
from backend.app.services.mock_data_generator import (
    generate_site_timeseries_metrics,
)
from backend.app.services.spatial_service import (
    calculate_geodesic_area_hectares,
    calculate_polygon_centroid,
    validate_and_parse_polygon,
)


def seed_database():
    """Seed initial administrator and baseline showcase conservation projects."""
    init_db()
    db = SessionLocal()

    try:
        admin_email = "admin@darukaa.earth"
        admin = db.query(User).filter(User.email == admin_email).first()
        if not admin:
            admin = User(
                email=admin_email,
                hashed_password=get_password_hash("Admin123!"),
                full_name="Chief Conservation Officer",
                role="admin",
            )
            db.add(admin)
            db.commit()
            db.refresh(admin)

        showcase_projects = [
            {
                "title": "Tambopata Amazonian Reforestation Corridor",
                "description": (
                    "Restoration of degraded buffer zones adjacent to Tambopata "
                    "National Reserve using native hardwood agroforestry and continuous canopy enrichment."
                ),
                "project_type": "reforestation",
                "standard": "Verra VCS + CCB Gold",
                "status": "active",
                "country": "Peru",
                "sites": [
                    {
                        "name": "Madre de Dios Canopy Parcel Alpha",
                        "description": "Secondary growth enrichment with Cedrela odorata and Bertholletia excelsa.",
                        "habitat_type": "tropical_moist_forest",
                        "elevation_meters": 185.0,
                        "geometry": {
                            "type": "Polygon",
                            "coordinates": [
                                [
                                    [-69.215, -12.585],
                                    [-69.195, -12.585],
                                    [-69.190, -12.605],
                                    [-69.210, -12.610],
                                    [-69.215, -12.585],
                                ]
                            ],
                        },
                    },
                    {
                        "name": "Heath River Riparian Sanctuary",
                        "description": "Riverine wildlife corridor restoration monitoring giant otter and tapir movements.",
                        "habitat_type": "tropical_moist_forest",
                        "elevation_meters": 170.0,
                        "geometry": {
                            "type": "Polygon",
                            "coordinates": [
                                [
                                    [-69.180, -12.615],
                                    [-69.160, -12.610],
                                    [-69.155, -12.630],
                                    [-69.175, -12.635],
                                    [-69.180, -12.615],
                                ]
                            ],
                        },
                    },
                ],
            },
            {
                "title": "Sundarbans Delta Blue Carbon Initiative",
                "description": (
                    "Estuarine mangrove restoration focusing on Rhizophora mucronata and Avicennia marina "
                    "for tidal storm surge protection and deep sediment blue carbon sequestration."
                ),
                "project_type": "mangrove",
                "standard": "Plan Vivo Blue Carbon",
                "status": "active",
                "country": "Bangladesh",
                "sites": [
                    {
                        "name": "Katka Intertidal Mangrove Reserve",
                        "description": "Tidal creek restoration supporting royal Bengal tiger habitat and benthic carbon capture.",
                        "habitat_type": "mangrove",
                        "elevation_meters": 3.5,
                        "geometry": {
                            "type": "Polygon",
                            "coordinates": [
                                [
                                    [89.780, 21.840],
                                    [89.810, 21.845],
                                    [89.815, 21.820],
                                    [89.785, 21.815],
                                    [89.780, 21.840],
                                ]
                            ],
                        },
                    }
                ],
            },
            {
                "title": "Chocó Bio-Corridor Restoration",
                "description": "Cloud forest corridor connecting coastal lowland and Andean ecosystems.",
                "project_type": "agroforestry",
                "standard": "Plan Vivo",
                "status": "active",
                "country": "Colombia",
                "sites": [
                    {
                        "name": "Anchicayá River Agroforestry Plot 1",
                        "description": "Native shade canopy cacao and Inga edulis planting on former pasture.",
                        "habitat_type": "tropical_moist_forest",
                        "elevation_meters": 350.0,
                        "geometry": {
                            "type": "Polygon",
                            "coordinates": [
                                [
                                    [-76.55, 3.82],
                                    [-76.50, 3.82],
                                    [-76.50, 3.86],
                                    [-76.55, 3.86],
                                    [-76.55, 3.82],
                                ]
                            ],
                        },
                    }
                ],
            },
        ]

        for pdata in showcase_projects:
            project = (
                db.query(Project)
                .filter(Project.title == pdata["title"], Project.owner_id == admin.id)
                .first()
            )
            if not project:
                project = Project(
                    title=pdata["title"],
                    description=pdata["description"],
                    project_type=pdata["project_type"],
                    standard=pdata["standard"],
                    status=pdata["status"],
                    country=pdata["country"],
                    owner_id=admin.id,
                )
                db.add(project)
                db.commit()
                db.refresh(project)

            for sdata in pdata["sites"]:
                site = (
                    db.query(Site)
                    .filter(Site.project_id == project.id, Site.name == sdata["name"])
                    .first()
                )
                if not site:
                    poly = validate_and_parse_polygon(sdata["geometry"])
                    lat, lng = calculate_polygon_centroid(poly)
                    area_ha = calculate_geodesic_area_hectares(poly)

                    site = Site(
                        project_id=project.id,
                        name=sdata["name"],
                        description=sdata["description"],
                        habitat_type=sdata["habitat_type"],
                        boundary=poly,
                        centroid_lat=lat,
                        centroid_lng=lng,
                        area_hectares=area_ha,
                        elevation_meters=sdata["elevation_meters"],
                    )
                    db.add(site)
                    db.commit()
                    db.refresh(site)

                    metrics = generate_site_timeseries_metrics(
                        site.id, site.area_hectares, site.habitat_type, months=36
                    )
                    db.add_all(metrics)
                    db.commit()

        print("Database seed completed successfully.")

    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
