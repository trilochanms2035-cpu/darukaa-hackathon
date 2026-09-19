import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import area from '@turf/area';
import { Compass, ShieldAlert } from 'lucide-react';

// Default Mapbox Token or fallback demo token
const DEFAULT_MAPBOX_TOKEN =
  import.meta.env.VITE_MAPBOX_TOKEN ||
  'YOUR_MAPBOX_PUBLIC_TOKEN';

export default function MapView({
  sites = [],
  _selectedSiteId = null,
  onSelectSite,
  onPolygonDrawn,
  interactiveDraw = true,
}) {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const drawRef = useRef(null);
  const popupRef = useRef(null);

  const [mapStyle, setMapStyle] = useState('mapbox://styles/mapbox/satellite-streets-v12');
  const [isDrawingActive, setIsDrawingActive] = useState(false);
  const [tokenError, setTokenError] = useState(false);

  // Initialize Map
  useEffect(() => {
    if (!mapContainer.current) return;

    mapboxgl.accessToken = DEFAULT_MAPBOX_TOKEN;

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: mapStyle,
      center: [-69.2, -12.6], // Default center (Peru Amazonian corridor)
      zoom: 12,
      pitch: 35, // 3D tilt for rich spatial feel
    });

    map.on('error', (e) => {
      if (e?.error?.status === 401) {
        setTokenError(true);
      }
    });

    map.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), 'bottom-right');

    // Add Mapbox Draw
    if (interactiveDraw) {
      const draw = new MapboxDraw({
        displayControlsDefault: false,
        controls: {
          polygon: true,
          trash: true,
        },
        defaultMode: 'simple_select',
        styles: [
          // Active Polygon Fill
          {
            id: 'gl-draw-polygon-fill-active',
            type: 'fill',
            filter: ['all', ['==', '$type', 'Polygon'], ['!=', 'mode', 'static']],
            paint: {
              'fill-color': '#10b981',
              'fill-opacity': 0.35,
            },
          },
          // Active Polygon Outline
          {
            id: 'gl-draw-polygon-stroke-active',
            type: 'line',
            filter: ['all', ['==', '$type', 'Polygon'], ['!=', 'mode', 'static']],
            layout: {
              'line-cap': 'round',
              'line-join': 'round',
            },
            paint: {
              'line-color': '#34d399',
              'line-dasharray': [0.2, 2],
              'line-width': 2.5,
            },
          },
          // Vertices
          {
            id: 'gl-draw-point-active',
            type: 'circle',
            filter: ['all', ['==', '$type', 'Point'], ['!=', 'meta', 'midpoint']],
            paint: {
              'circle-radius': 6,
              'circle-color': '#ffffff',
              'circle-stroke-width': 2,
              'circle-stroke-color': '#10b981',
            },
          },
        ],
      });

      map.addControl(draw, 'top-left');
      drawRef.current = draw;

      const handleDrawComplete = (e) => {
        if (!e.features || e.features.length === 0) return;
        const feature = e.features[0];
        // Calculate area in hectares via turf
        const areaSqMeters = area(feature);
        const areaHectares = Math.max(0.01, areaSqMeters / 10000.0);

        if (onPolygonDrawn) {
          onPolygonDrawn(feature.geometry, areaHectares);
        }
        setIsDrawingActive(false);
      };

      map.on('draw.create', handleDrawComplete);
      map.on('draw.update', handleDrawComplete);

      map.on('draw.modechange', (e) => {
        setIsDrawingActive(e.mode === 'draw_polygon');
      });
    }

    mapRef.current = map;

    return () => {
      map.remove();
    };
  }, []);

  // Update Map Style when toggled
  useEffect(() => {
    if (!mapRef.current) return;
    mapRef.current.setStyle(mapStyle);
  }, [mapStyle]);

  // Update Sites GeoJSON Layer on Map
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const onStyleReady = () => {
      const geojsonData = {
        type: 'FeatureCollection',
        features: sites.map((s) => {
          let geom = s.geometry;
          if (typeof geom === 'string') {
            try {
              geom = JSON.parse(geom);
            } catch {
              geom = null;
            }
          }
          return {
            type: 'Feature',
            id: s.id,
            geometry: geom,
            properties: {
              id: s.id,
              name: s.name,
              habitat_type: s.habitat_type,
              area_hectares: s.area_hectares,
              latest_carbon: s.latest_carbon_stock || 0,
              latest_ndvi: s.latest_ndvi || 0,
            },
          };
        }),
      };

      // If source exists, update data; otherwise create source and layers
      if (map.getSource('sites-source')) {
        map.getSource('sites-source').setData(geojsonData);
      } else {
        map.addSource('sites-source', {
          type: 'geojson',
          data: geojsonData,
        });

        // Polygon Fill Layer
        map.addLayer({
          id: 'sites-fill',
          type: 'fill',
          source: 'sites-source',
          paint: {
            'fill-color': [
              'match',
              ['get', 'habitat_type'],
              'tropical_moist_forest',
              '#10b981',
              'mangrove',
              '#06b6d4',
              'peatland_conservation',
              '#8b5cf6',
              'temperate_forest',
              '#22c55e',
              '#eab308', // default grassland/other
            ],
            'fill-opacity': 0.45,
          },
        });

        // Polygon Outline Layer
        map.addLayer({
          id: 'sites-outline',
          type: 'line',
          source: 'sites-source',
          paint: {
            'line-color': '#ffffff',
            'line-width': 3,
            'line-opacity': 0.95,
          },
        });

        // Polygon Label Layer
        map.addLayer({
          id: 'sites-label',
          type: 'symbol',
          source: 'sites-source',
          layout: {
            'text-field': ['get', 'name'],
            'text-size': 12,
            'text-offset': [0, 0.6],
            'text-anchor': 'top',
          },
          paint: {
            'text-color': '#ffffff',
            'text-halo-color': '#070d0f',
            'text-halo-width': 2,
          },
        });

        // Hover & Click Interactions
        map.on('mouseenter', 'sites-fill', () => {
          map.getCanvas().style.cursor = 'pointer';
        });

        map.on('mouseleave', 'sites-fill', () => {
          map.getCanvas().style.cursor = '';
        });

        map.on('click', 'sites-fill', (e) => {
          if (!e.features || e.features.length === 0) return;
          const feature = e.features[0];
          const props = feature.properties;

          if (popupRef.current) popupRef.current.remove();

          const popupContent = `
            <div style="font-family: 'Plus Jakarta Sans', sans-serif;">
              <div style="font-size: 0.72rem; text-transform: uppercase; color: #34d399; font-weight: 700; letter-spacing: 0.05em; margin-bottom: 4px;">
                ${props.habitat_type?.replace(/_/g, ' ')}
              </div>
              <div style="font-size: 1.05rem; font-weight: 700; color: #ffffff; margin-bottom: 8px;">
                ${props.name}
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px; font-size: 0.8rem; background: rgba(255,255,255,0.06); padding: 8px 10px; border-radius: 8px;">
                <div>
                  <span style="color: #94a3b8; font-size: 0.72rem; display: block;">Area:</span>
                  <strong style="color: #f1f5f9;">${Number(props.area_hectares).toFixed(2)} ha</strong>
                </div>
                <div>
                  <span style="color: #94a3b8; font-size: 0.72rem; display: block;">Carbon:</span>
                  <strong style="color: #38bdf8;">${Number(props.latest_carbon).toFixed(1)} tCO2e</strong>
                </div>
              </div>
              <button
                id="btn-popup-analytics-${props.id}"
                style="width: 100%; background-color: #059669; border: 1px solid #10b981; color: white; border-radius: 4px; padding: 7px 12px; font-size: 0.8rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px;"
              >
                Inspect Telemetry &rarr;
              </button>
            </div>
          `;

          const popup = new mapboxgl.Popup({ offset: 15, maxWidth: '280px' })
            .setLngLat(e.lngLat)
            .setHTML(popupContent)
            .addTo(map);

          popupRef.current = popup;

          setTimeout(() => {
            const btn = document.getElementById(`btn-popup-analytics-${props.id}`);
            if (btn && onSelectSite) {
              btn.addEventListener('click', () => {
                onSelectSite(props.id);
                popup.remove();
              });
            }
          }, 50);
        });
      }

      // Auto-fit bounds if we have valid coordinates
      if (sites.length > 0) {
        const bounds = new mapboxgl.LngLatBounds();
        let validCoordsFound = false;

        sites.forEach((site) => {
          let geom = site.geometry;
          if (typeof geom === 'string') {
            try {
              geom = JSON.parse(geom);
            } catch {
              geom = null;
            }
          }
          if (geom && geom.coordinates && Array.isArray(geom.coordinates)) {
            const extractCoords = (coords) => {
              if (!Array.isArray(coords)) return;
              if (
                typeof coords[0] === 'number' &&
                typeof coords[1] === 'number' &&
                !isNaN(coords[0]) &&
                !isNaN(coords[1])
              ) {
                bounds.extend([coords[0], coords[1]]);
                validCoordsFound = true;
              } else {
                coords.forEach(extractCoords);
              }
            };
            extractCoords(geom.coordinates);
          } else if (
            site.centroid_lng != null &&
            site.centroid_lat != null &&
            !isNaN(site.centroid_lng) &&
            !isNaN(site.centroid_lat)
          ) {
            const d = 0.02;
            bounds.extend([site.centroid_lng - d, site.centroid_lat - d]);
            bounds.extend([site.centroid_lng + d, site.centroid_lat + d]);
            validCoordsFound = true;
          }
        });

        if (validCoordsFound) {
          map.fitBounds(bounds, {
            padding: 90,
            maxZoom: 14,
            duration: 1000,
          });
        }
      }
    };

    if (map.isStyleLoaded() || map.loaded()) {
      onStyleReady();
    } else {
      map.once('load', onStyleReady);
      map.once('style.load', onStyleReady);
    }
  }, [sites, mapStyle]);

  const triggerDrawPolygon = () => {
    if (drawRef.current) {
      drawRef.current.changeMode('draw_polygon');
      setIsDrawingActive(true);
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: '520px', borderRadius: '16px', overflow: 'hidden' }}>
      <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />

      {/* Token Alert Banner if invalid token */}
      {tokenError && (
        <div
          style={{
            position: 'absolute',
            top: '16px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(239, 68, 68, 0.9)',
            backdropFilter: 'blur(8px)',
            color: '#ffffff',
            padding: '8px 16px',
            borderRadius: '10px',
            fontSize: '0.82rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            zIndex: 10,
          }}
        >
          <ShieldAlert size={16} />
          <span>Add your valid Mapbox API key in frontend/.env to enable high-resolution vector tiles.</span>
        </div>
      )}

      {/* Floating Map Controls & Instructions Overlay */}
      <div
        style={{
          position: 'absolute',
          top: '16px',
          right: '16px',
          display: 'flex',
          gap: '8px',
          zIndex: 10,
        }}
      >
        {/* Style Switcher */}
        <div
          style={{
            padding: '3px',
            display: 'flex',
            gap: '2px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-default)',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          <button
            onClick={() => setMapStyle('mapbox://styles/mapbox/satellite-streets-v12')}
            style={{
              background: mapStyle.includes('satellite') ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
              color: mapStyle.includes('satellite') ? '#ffffff' : 'var(--text-muted)',
              border: mapStyle.includes('satellite') ? '1px solid var(--border-strong)' : '1px solid transparent',
              borderRadius: 'var(--radius-xs)',
              padding: '5px 9px',
              fontSize: '0.74rem',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all var(--transition-fast)',
            }}
          >
            Satellite
          </button>
          <button
            onClick={() => setMapStyle('mapbox://styles/mapbox/dark-v11')}
            style={{
              background: mapStyle.includes('dark') ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
              color: mapStyle.includes('dark') ? '#ffffff' : 'var(--text-muted)',
              border: mapStyle.includes('dark') ? '1px solid var(--border-strong)' : '1px solid transparent',
              borderRadius: 'var(--radius-xs)',
              padding: '5px 9px',
              fontSize: '0.74rem',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all var(--transition-fast)',
            }}
          >
            Dark Earth
          </button>
          <button
            onClick={() => setMapStyle('mapbox://styles/mapbox/outdoors-v12')}
            style={{
              background: mapStyle.includes('outdoors') ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
              color: mapStyle.includes('outdoors') ? '#ffffff' : 'var(--text-muted)',
              border: mapStyle.includes('outdoors') ? '1px solid var(--border-strong)' : '1px solid transparent',
              borderRadius: 'var(--radius-xs)',
              padding: '5px 9px',
              fontSize: '0.74rem',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all var(--transition-fast)',
            }}
          >
            Terrain
          </button>
        </div>

        {/* Quick Draw Polygon Trigger */}
        {interactiveDraw && (
          <button
            id="btn-trigger-draw-polygon"
            onClick={triggerDrawPolygon}
            className="btn-primary"
            style={{
              padding: '6px 12px',
              fontSize: '0.8rem',
              backgroundColor: isDrawingActive ? 'var(--emerald-700)' : 'var(--emerald-600)',
              borderColor: isDrawingActive ? '#34d399' : 'var(--emerald-500)',
            }}
          >
            <Compass size={14} />
            {isDrawingActive ? 'Click Points on Map' : 'Draw Site Polygon'}
          </button>
        )}
      </div>

      {/* Floating Drawing Instruction Pill */}
      {isDrawingActive && (
        <div
          style={{
            position: 'absolute',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'var(--bg-surface-elevated)',
            border: '1px solid var(--emerald-500)',
            borderRadius: 'var(--radius-md)',
            padding: '8px 16px',
            color: '#ffffff',
            fontSize: '0.82rem',
            fontWeight: 500,
            boxShadow: 'var(--shadow-lg)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            zIndex: 10,
          }}
        >
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#10b981',
            }}
          />
          Click points on the map to define the boundary. Click the first point or double-click to close.
        </div>
      )}

      {/* Map Legend */}
      <div
        style={{
          position: 'absolute',
          bottom: '16px',
          left: '16px',
          padding: '8px 12px',
          backgroundColor: 'var(--bg-surface-elevated)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-sm)',
          fontSize: '0.72rem',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          gap: '5px',
          boxShadow: 'var(--shadow-md)',
        }}
      >
        <div
          style={{
            fontWeight: 600,
            color: 'var(--text-faint)',
            textTransform: 'uppercase',
            fontSize: '0.65rem',
            letterSpacing: '0.04em',
          }}
        >
          Habitat Boundaries
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: '#10b981' }} />
          <span style={{ color: 'var(--text-main)' }}>Tropical Rainforest</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: '#06b6d4' }} />
          <span style={{ color: 'var(--text-main)' }}>Mangrove Blue Carbon</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: '#8b5cf6' }} />
          <span style={{ color: 'var(--text-main)' }}>Peatland Swamp</span>
        </div>
      </div>
    </div>
  );
}

