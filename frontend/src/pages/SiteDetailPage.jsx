import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import StatCard from '../components/common/StatCard';
import CarbonChart from '../components/analytics/CarbonChart';
import BiodiversityChart from '../components/analytics/BiodiversityChart';
import VegetationChart from '../components/analytics/VegetationChart';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { api } from '../services/api';
import {
  ChevronLeft,
  Trees,
  Layers,
  Sparkles,
  Leaf,
  Bug,
  Download,
  RotateCw,
  AlertCircle,
  Shield,
  FileSpreadsheet,
  TrendingUp,
  Activity,
  CheckCircle2,
} from 'lucide-react';

export default function SiteDetailPage() {
  const { projectId, siteId } = useParams();

  const [analytics, setAnalytics] = useState(null);
  const [siteDetails, setSiteDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('carbon');
  const [timeRangeMonths, setTimeRangeMonths] = useState(36);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      let startDate = null;
      if (timeRangeMonths < 36) {
        const d = new Date();
        d.setMonth(d.getMonth() - timeRangeMonths);
        startDate = d.toISOString().split('T')[0];
      }

      const [analyticsData, siteData] = await Promise.all([
        api.analytics.getSiteAnalytics(siteId, startDate, null),
        api.sites.getById(siteId),
      ]);

      setAnalytics(analyticsData);
      setSiteDetails(siteData);
    } catch (err) {
      console.error('Failed to load site analytics:', err);
      setError(err.message || 'Failed to load site data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [siteId, timeRangeMonths]);

  const handleExportGeoJSON = () => {
    if (!siteDetails) return;
    const geojsonFeature = {
      type: 'Feature',
      id: siteDetails.id,
      geometry: siteDetails.geometry,
      properties: {
        name: siteDetails.name,
        habitat_type: siteDetails.habitat_type,
        area_hectares: siteDetails.area_hectares,
        centroid: [siteDetails.centroid_lng, siteDetails.centroid_lat],
        elevation_meters: siteDetails.elevation_meters,
        project_id: projectId,
      },
    };

    const blob = new Blob([JSON.stringify(geojsonFeature, null, 2)], {
      type: 'application/geo+json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${siteDetails.name.toLowerCase().replace(/\s+/g, '_')}_boundary.geojson`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleRegenerate = async () => {
    if (
      !window.confirm(
        'Re-simulate and generate fresh 36-month high-resolution baseline metrics for this site?'
      )
    )
      return;

    try {
      setIsRegenerating(true);
      const updated = await api.analytics.regenerate(siteId, 36);
      setAnalytics(updated);
    } catch (err) {
      alert(`Error regenerating metrics: ${err.message}`);
    } finally {
      setIsRegenerating(false);
    }
  };

  // Compute summary observations from time-series records
  const keyObservations = useMemo(() => {
    if (!analytics?.timeseries || analytics.timeseries.length < 2) return null;
    const ts = analytics.timeseries;
    const first = ts[0];
    const latest = ts[ts.length - 1];

    const carbonGain = latest.carbon_stock_tco2e - first.carbon_stock_tco2e;
    const carbonGainPct = first.carbon_stock_tco2e > 0
      ? Math.round((carbonGain / first.carbon_stock_tco2e) * 100)
      : 0;

    const maxNdvi = Math.max(...ts.map((m) => m.ndvi_mean));
    const minNdvi = Math.min(...ts.map((m) => m.ndvi_mean));
    const speciesGain = latest.species_richness - first.species_richness;

    return {
      carbonGain: Math.round(carbonGain),
      carbonGainPct,
      maxNdvi: maxNdvi.toFixed(3),
      minNdvi: minNdvi.toFixed(3),
      speciesGain,
      monthsObserved: ts.length,
      startDate: first.record_date,
      endDate: latest.record_date,
    };
  }, [analytics]);

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Navbar />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <LoadingSpinner message="Calculating temporal ecological telemetry..." />
        </div>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Navbar />
        <div style={{ flex: 1, padding: '32px', textAlign: 'center' }}>
          <div
            className="glass-panel"
            style={{
              padding: '32px',
              maxWidth: '460px',
              margin: '40px auto',
              color: '#f87171',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <AlertCircle size={32} style={{ margin: '0 auto 12px' }} />
            <h3 style={{ fontSize: '1.05rem', color: 'var(--text-main)' }}>Site Analytics Unavailable</h3>
            <p style={{ color: 'var(--text-muted)', margin: '10px 0 18px', fontSize: '0.84rem' }}>{error}</p>
            <Link to={`/projects/${projectId}`} className="btn-primary">
              Return to Project Map
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { kpis, timeseries } = analytics;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }} className="page-enter">
      <Navbar />

      <main style={{ flex: 1, padding: '24px 32px', maxWidth: '1440px', margin: '0 auto', width: '100%' }}>
        {/* Breadcrumb Navigation */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Link
              to={`/projects/${projectId}`}
              className="link-hover"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.82rem',
                fontWeight: 500,
              }}
            >
              <ChevronLeft size={16} />
              Project Workspace
            </Link>
            <span style={{ color: 'var(--border-strong)', fontSize: '0.8rem' }}>/</span>
            <span style={{ color: 'var(--text-main)', fontSize: '0.82rem', fontWeight: 500 }}>
              {analytics.project_title}
            </span>
          </div>

          {/* Key Metrics & Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Parcel Area and Mean Elevation — visible in breadcrumb */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                padding: '5px 12px',
                backgroundColor: 'rgba(180, 220, 190, 0.04)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: '0.62rem',
                    color: 'var(--text-faint)',
                    textTransform: 'uppercase',
                    fontWeight: 600,
                    display: 'block',
                    letterSpacing: '0.04em',
                  }}
                >
                  Parcel Area
                </span>
                <strong
                  style={{
                    fontSize: '0.92rem',
                    color: 'var(--earth-500)',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {kpis.total_area_hectares.toFixed(2)} ha
                </strong>
              </div>
              <div style={{ height: '20px', width: '1px', backgroundColor: 'var(--border-subtle)' }} />
              <div>
                <span
                  style={{
                    fontSize: '0.62rem',
                    color: 'var(--text-faint)',
                    textTransform: 'uppercase',
                    fontWeight: 600,
                    display: 'block',
                    letterSpacing: '0.04em',
                  }}
                >
                  Mean Elevation
                </span>
                <strong
                  style={{
                    fontSize: '0.92rem',
                    color: 'var(--text-main)',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {siteDetails?.elevation_meters || 120} m
                </strong>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                id="btn-regenerate-metrics"
                className="btn-secondary"
                onClick={handleRegenerate}
                disabled={isRegenerating}
                style={{ fontSize: '0.8rem', padding: '6px 12px' }}
              >
                <RotateCw size={13} style={{ animation: isRegenerating ? 'spin 1s linear infinite' : 'none' }} />
                {isRegenerating ? 'Simulating...' : 'Re-seed Telemetry'}
              </button>

              <button
                id="btn-export-geojson"
                className="btn-primary"
                onClick={handleExportGeoJSON}
                style={{ fontSize: '0.8rem', padding: '6px 14px' }}
              >
                <Download size={13} />
                Export GeoJSON
              </button>
            </div>
          </div>
        </div>

        {/* Site Identity Header */}
        <div
          className="glass-panel"
          style={{
            padding: '14px 20px',
            marginBottom: '20px',
            borderRadius: 'var(--radius-md)',
            borderLeft: '3px solid var(--emerald-500)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span className="badge badge-emerald">
              {analytics.habitat_type.replace(/_/g, ' ')}
            </span>
            <span className="badge badge-subtle">
              PostGIS Verified Boundary
            </span>
          </div>
          <h1
            style={{
              fontSize: '1.45rem',
              fontWeight: 600,
              color: 'var(--text-main)',
              letterSpacing: '-0.02em',
              lineHeight: 1.2,
            }}
          >
            {analytics.site_name}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: '3px' }}>
            {siteDetails?.description || 'High-integrity nature-based permanent carbon removal site.'}
          </p>
        </div>

        {/* Ecological KPI Indicators */}
        <section
          className="stat-stagger"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '12px',
            marginBottom: '20px',
          }}
        >
          <StatCard
            icon={Sparkles}
            label="Carbon Stock"
            value={kpis.current_carbon_stock_tco2e.toLocaleString()}
            unit="tCO2e"
            subtext="Total biomass stored"
            color="var(--emerald-500)"
          />
          <StatCard
            icon={Trees}
            label="Sequestration Rate"
            value={kpis.annual_sequestration_rate.toFixed(2)}
            unit="tCO2e/ha/yr"
            subtext="Annual accumulation"
            color="var(--teal-500)"
          />
          <StatCard
            icon={Leaf}
            label="NDVI Index"
            value={kpis.current_ndvi.toFixed(3)}
            unit="index"
            subtext="Optical foliage vigor"
            color="var(--emerald-500)"
          />
          <StatCard
            icon={Layers}
            label="Canopy Cover"
            value={kpis.current_canopy_cover_pct.toFixed(1)}
            unit="%"
            subtext="Foliage density"
            color="var(--teal-500)"
          />
          <StatCard
            icon={Bug}
            label="Species Richness"
            value={kpis.current_species_richness}
            unit="taxa"
            subtext="Observed biodiversity"
            color="var(--earth-500)"
          />
          <StatCard
            icon={Shield}
            label="Shannon Index"
            value={kpis.current_shannon_index.toFixed(3)}
            unit="H'"
            subtext="Ecosystem complexity"
            color="var(--amber-500)"
          />
        </section>

        {/* Ecological Baseline Observations */}
        {keyObservations && (
          <section
            className="glass-panel"
            style={{
              padding: '14px 18px',
              marginBottom: '20px',
              backgroundColor: 'rgba(255, 255, 255, 0.015)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <TrendingUp size={15} color="var(--emerald-500)" />
              <h3 style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-main)' }}>
                Ecological Baseline Observations
              </h3>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-faint)' }}>
                ({keyObservations.monthsObserved} monthly intervals · {keyObservations.startDate} to {keyObservations.endDate})
              </span>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '12px',
                fontSize: '0.78rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <CheckCircle2 size={14} color="var(--emerald-500)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span style={{ color: 'var(--text-muted)' }}>
                  Net biomass carbon increased by{' '}
                  <strong style={{ color: 'var(--emerald-500)' }}>+{keyObservations.carbonGain.toLocaleString()} tCO2e</strong>{' '}
                  (+{keyObservations.carbonGainPct}%) across the observed growth curve.
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <Activity size={14} color="var(--teal-500)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span style={{ color: 'var(--text-muted)' }}>
                  Optical foliage vigor ranged between{' '}
                  <strong style={{ color: 'var(--text-main)' }}>{keyObservations.minNdvi}</strong> and{' '}
                  <strong style={{ color: 'var(--text-main)' }}>{keyObservations.maxNdvi} NDVI</strong>, demonstrating natural seasonal oscillations.
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <Bug size={14} color="var(--earth-500)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span style={{ color: 'var(--text-muted)' }}>
                  Ecological succession yielded a net gain of{' '}
                  <strong style={{ color: 'var(--earth-500)' }}>+{keyObservations.speciesGain} observed taxa</strong>, confirming biodiversity recovery.
                </span>
              </div>
            </div>
          </section>
        )}

        {/* Analytics & Time Series */}
        <section
          className="glass-panel"
          style={{ padding: '18px 22px', marginBottom: '24px', borderRadius: 'var(--radius-md)' }}
        >
          {/* Tabs and Time Range Filter */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              borderBottom: '1px solid var(--border-subtle)',
              paddingBottom: '12px',
              marginBottom: '18px',
            }}
          >
            {/* Chart View Tabs */}
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
              {[
                { id: 'carbon', label: 'Carbon Stock & Sequestration', icon: Sparkles },
                { id: 'vegetation', label: 'NDVI & Canopy Cover', icon: Leaf },
                { id: 'biodiversity', label: 'Biodiversity & Species Index', icon: Bug },
                { id: 'table', label: 'Raw Telemetry Records', icon: FileSpreadsheet },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    id={`tab-${tab.id}`}
                    onClick={() => setActiveTab(tab.id)}
                    className={`tab-underline${isActive ? ' tab-underline-active' : ''}`}
                  >
                    <Icon size={13} color={isActive ? 'var(--emerald-500)' : 'currentColor'} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Time-Range Selector */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '2px',
                backgroundColor: 'var(--bg-base)',
                padding: '3px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              {[
                { months: 12, label: '1 Year' },
                { months: 24, label: '2 Years' },
                { months: 36, label: '3 Years (All)' },
              ].map((item) => (
                <button
                  key={item.months}
                  onClick={() => setTimeRangeMonths(item.months)}
                  style={{
                    backgroundColor:
                      timeRangeMonths === item.months ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                    color: timeRangeMonths === item.months ? '#ffffff' : 'var(--text-muted)',
                    border:
                      timeRangeMonths === item.months
                        ? '1px solid var(--border-strong)'
                        : '1px solid transparent',
                    borderRadius: 'var(--radius-xs)',
                    padding: '4px 9px',
                    fontSize: '0.72rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Active Tab View */}
          <div key={activeTab} className="tab-content-enter" style={{ minHeight: '340px' }}>
            {activeTab === 'carbon' && <CarbonChart timeseries={timeseries} />}
            {activeTab === 'vegetation' && <VegetationChart timeseries={timeseries} />}
            {activeTab === 'biodiversity' && <BiodiversityChart timeseries={timeseries} />}
            {activeTab === 'table' && (
              <div style={{ overflowX: 'auto' }}>
                <table
                  className="data-table"
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: '0.8rem',
                    textAlign: 'left',
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        borderBottom: '1px solid var(--border-default)',
                        color: 'var(--text-faint)',
                        fontSize: '0.7rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                      }}
                    >
                      <th style={{ padding: '9px 12px' }}>Date</th>
                      <th style={{ padding: '9px 12px' }}>Carbon Stock (tCO2e)</th>
                      <th style={{ padding: '9px 12px' }}>Rate (tCO2e/ha/yr)</th>
                      <th style={{ padding: '9px 12px' }}>NDVI Index</th>
                      <th style={{ padding: '9px 12px' }}>Canopy Cover</th>
                      <th style={{ padding: '9px 12px' }}>Species Richness</th>
                      <th style={{ padding: '9px 12px' }}>Shannon Index (H')</th>
                    </tr>
                  </thead>
                  <tbody>
                    {timeseries
                      .slice()
                      .reverse()
                      .map((row) => (
                        <tr
                          key={row.id}
                          style={{
                            borderBottom: '1px solid var(--border-subtle)',
                            color: 'var(--text-muted)',
                          }}
                        >
                          <td style={{ padding: '8px 12px', fontWeight: 500, color: 'var(--text-main)' }}>
                            {row.record_date}
                          </td>
                          <td
                            style={{
                              padding: '8px 12px',
                              color: 'var(--emerald-500)',
                              fontWeight: 600,
                              fontVariantNumeric: 'tabular-nums',
                            }}
                          >
                            {row.carbon_stock_tco2e.toFixed(1)}
                          </td>
                          <td
                            style={{
                              padding: '8px 12px',
                              color: 'var(--teal-500)',
                              fontVariantNumeric: 'tabular-nums',
                            }}
                          >
                            {row.sequestration_rate.toFixed(2)}
                          </td>
                          <td
                            style={{
                              padding: '8px 12px',
                              color: 'var(--text-main)',
                              fontVariantNumeric: 'tabular-nums',
                            }}
                          >
                            {row.ndvi_mean.toFixed(3)}
                          </td>
                          <td style={{ padding: '8px 12px', fontVariantNumeric: 'tabular-nums' }}>
                            {row.canopy_cover_pct.toFixed(1)}%
                          </td>
                          <td
                            style={{
                              padding: '8px 12px',
                              color: 'var(--earth-500)',
                              fontVariantNumeric: 'tabular-nums',
                            }}
                          >
                            {row.species_richness}
                          </td>
                          <td
                            style={{
                              padding: '8px 12px',
                              color: 'var(--amber-500)',
                              fontVariantNumeric: 'tabular-nums',
                            }}
                          >
                            {row.shannon_index.toFixed(3)}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
