import math
import random
from datetime import date, timedelta
from typing import List

from backend.app.models.analytics import SiteMetric


def generate_site_timeseries_metrics(
    site_id: str,
    area_hectares: float,
    habitat_type: str = "tropical_moist_forest",
    months: int = 36,
) -> List[SiteMetric]:
    """Generate realistic, scientifically grounded environmental time-series metrics.

    Models biological growth curves for carbon stock, seasonal NDVI oscillations,
    and ecological biodiversity succession over a given number of months.
    """
    # Deterministic pseudo-random seed per site for reproducible, clean curves
    seed_value = sum(ord(c) for c in str(site_id))
    rng = random.Random(seed_value)

    # Habitat coefficient multipliers
    habitat_multipliers = {
        "tropical_moist_forest": {
            "seq_rate": 11.5,
            "max_biomass": 280.0,
            "base_ndvi": 0.72,
            "base_shannon": 3.2,
            "species_base": 65,
        },
        "mangrove": {
            "seq_rate": 14.2,
            "max_biomass": 320.0,
            "base_ndvi": 0.68,
            "base_shannon": 2.8,
            "species_base": 48,
        },
        "peatland_conservation": {
            "seq_rate": 8.5,
            "max_biomass": 240.0,
            "base_ndvi": 0.65,
            "base_shannon": 2.6,
            "species_base": 40,
        },
        "temperate_forest": {
            "seq_rate": 7.8,
            "max_biomass": 190.0,
            "base_ndvi": 0.62,
            "base_shannon": 2.7,
            "species_base": 42,
        },
        "grassland": {
            "seq_rate": 3.8,
            "max_biomass": 65.0,
            "base_ndvi": 0.48,
            "base_shannon": 2.2,
            "species_base": 30,
        },
    }

    params = habitat_multipliers.get(
        habitat_type, habitat_multipliers["tropical_moist_forest"]
    )

    metrics: List[SiteMetric] = []
    end_date = date.today()

    # Step backwards from today by monthly intervals
    dates = []
    curr = end_date
    for _ in range(months):
        dates.append(curr)
        # approximately 1 month prior
        first_of_curr = curr.replace(day=1)
        prev_month_end = first_of_curr - timedelta(days=1)
        curr = prev_month_end.replace(day=min(curr.day, 28))

    dates.reverse()  # Chronological order from oldest to newest

    # Growth progression over timeline
    for step, record_date in enumerate(dates):
        # Progress factor t from 0.0 (baseline) to 1.0 (current)
        t = step / max(1, (months - 1))

        # Carbon sequestration rate with slight climatic variation
        climatic_noise = rng.uniform(-0.4, 0.4)
        annual_rate_per_ha = max(
            1.0, params["seq_rate"] * (0.85 + 0.3 * t) + climatic_noise
        )

        # Cumulative biomass carbon accumulation via logistic/sigmoid curve
        sigmoid_t = 1.0 / (1.0 + math.exp(-4 * (t - 0.3)))
        carbon_stock_tco2e = (
            area_hectares * params["max_biomass"] * (0.35 + 0.65 * sigmoid_t)
        )
        carbon_stock_tco2e = round(
            carbon_stock_tco2e + rng.uniform(-5.0, 5.0), 2
        )

        biomass_density = round(carbon_stock_tco2e / max(0.1, area_hectares), 2)

        # Seasonal NDVI oscillation and vegetation succession
        month_idx = record_date.month
        seasonal_wave = 0.08 * math.sin(
            (month_idx / 12.0) * 2 * math.pi - math.pi / 3
        )
        ndvi = min(
            0.94,
            max(
                0.20,
                params["base_ndvi"]
                + 0.12 * t
                + seasonal_wave
                + rng.uniform(-0.02, 0.02),
            ),
        )

        # Canopy closure progression as forest matures
        canopy_pct = min(
            96.0,
            max(
                20.0,
                35.0
                + 50.0 * (1.0 - math.exp(-2.2 * t))
                + rng.uniform(-1.5, 1.5),
            ),
        )

        # Ecological biodiversity (species richness and Shannon diversity)
        species_richness = int(
            params["species_base"] * (0.7 + 0.5 * t) + rng.randint(-3, 3)
        )
        shannon_index = round(
            min(
                4.2,
                params["base_shannon"]
                + 0.4 * t
                + rng.uniform(-0.08, 0.08)
                + (ndvi - 0.6) * 0.2,
            ),
            3,
        )

        # Soil moisture seasonal cycle
        soil_moisture = round(
            min(
                85.0,
                max(
                    15.0,
                    42.0
                    + 18.0 * math.sin((month_idx / 12.0) * 2 * math.pi)
                    + rng.uniform(-4.0, 4.0),
                ),
            ),
            1,
        )

        metric = SiteMetric(
            site_id=site_id,
            record_date=record_date,
            carbon_stock_tco2e=max(0.0, carbon_stock_tco2e),
            sequestration_rate=round(annual_rate_per_ha, 2),
            biomass_density=biomass_density,
            ndvi_mean=round(ndvi, 3),
            canopy_cover_pct=round(canopy_pct, 1),
            species_richness=max(5, species_richness),
            shannon_index=shannon_index,
            soil_moisture_pct=soil_moisture,
            data_source="satellite_sentinel2_synthetic",
        )
        metrics.append(metric)

    return metrics
