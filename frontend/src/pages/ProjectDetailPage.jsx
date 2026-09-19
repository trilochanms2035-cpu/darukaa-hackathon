import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import MapView from '../components/map/MapView';
import CreateSiteModal from '../components/projects/CreateSiteModal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { api } from '../services/api';
import {
  ChevronLeft,
  Compass,
  MapPin,
  Trash2,
  ArrowRight,
  Shield,
  AlertCircle,
} from 'lucide-react';

const ECOSYSTEM_BADGES = {
  mangrove: 'badge-teal',
  agroforestry: 'badge-earth',
  peatland_conservation: 'badge-amber',
  reforestation: 'badge-emerald',
};

export default function ProjectDetailPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [sites, setSites] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Drawing state
  const [isSiteModalOpen, setIsSiteModalOpen] = useState(false);
  const [drawnGeometry, setDrawnGeometry] = useState(null);
  const [calculatedAreaHectares, setCalculatedAreaHectares] = useState(0);
  const [showDrawHint, setShowDrawHint] = useState(false);

  const loadProjectAndSites = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [projData, sitesData] = await Promise.all([
        api.projects.getById(projectId),
        api.sites.getAll(projectId),
      ]);
      setProject(projData);
      setSites(sitesData);
    } catch (err) {
      console.error('Failed to load project details:', err);
      setError(err.message || 'Failed to load project data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProjectAndSites();
  }, [projectId]);

  const handlePolygonDrawn = (geometry, areaHectares) => {
    setDrawnGeometry(geometry);
    setCalculatedAreaHectares(areaHectares);
    setIsSiteModalOpen(true);
  };

  const handleSiteCreated = (newSite) => {
    setSites((prev) => [newSite, ...prev]);
    loadProjectAndSites();
  };

  const handleDeleteSite = async (siteId, siteName, e) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete site "${siteName}"?`)) return;

    try {
      await api.sites.delete(siteId);
      setSites((prev) => prev.filter((s) => s.id !== siteId));
    } catch (err) {
      alert(`Error deleting site: ${err.message}`);
    }
  };

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Navbar />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <LoadingSpinner message="Loading project coordinates and vector boundaries..." />
        </div>
      </div>
    );
  }

  if (error || !project) {
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
            <h3 style={{ fontSize: '1.05rem', color: 'var(--text-main)' }}>Project Not Found</h3>
            <p style={{ color: 'var(--text-muted)', margin: '10px 0 18px', fontSize: '0.84rem' }}>
              {error || 'Unable to locate project records.'}
            </p>
            <Link to="/" className="btn-primary">
              Return to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }} className="page-enter">
      <Navbar />

      {/* GIS Header */}
      <div
        style={{
          backgroundColor: 'var(--bg-base)',
          borderBottom: '1px solid var(--border-subtle)',
          padding: '8px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 20,
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link
            to="/"
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
            Dashboard
          </Link>
          <span style={{ color: 'var(--border-strong)', fontSize: '0.8rem' }}>/</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2
              style={{
                fontSize: '1.02rem',
                fontWeight: 600,
                color: 'var(--text-main)',
                lineHeight: 1.2,
              }}
            >
              {project.title}
            </h2>
            <span className={`badge ${ECOSYSTEM_BADGES[project.project_type] || 'badge-emerald'}`}>
              {project.project_type.replace(/_/g, ' ')}
            </span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
                fontSize: '0.74rem',
                color: 'var(--text-muted)',
              }}
            >
              <MapPin size={11} color="var(--text-faint)" />
              {project.country}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            <strong style={{ color: 'var(--text-main)', fontVariantNumeric: 'tabular-nums' }}>
              {sites.length}
            </strong>{' '}
            {sites.length === 1 ? 'Site' : 'Sites'} ·{' '}
            <strong style={{ color: 'var(--earth-500)', fontVariantNumeric: 'tabular-nums' }}>
              {project.total_area_hectares} ha
            </strong>
          </div>
          <button
            id="btn-draw-site-header"
            className="btn-primary"
            onClick={() => {
              setShowDrawHint(true);
              setTimeout(() => setShowDrawHint(false), 5000);
            }}
            style={{ padding: '6px 12px', fontSize: '0.8rem' }}
          >
            <Compass size={13} />
            Delineate Boundary
          </button>
        </div>
      </div>

      {/* Workspace Split Layout */}
      <div style={{ flex: 1, display: 'flex', position: 'relative', overflow: 'hidden' }}>
        {/* Sites Sidebar */}
        <aside
          style={{
            width: '300px',
            backgroundColor: 'var(--bg-surface)',
            borderRight: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 10,
            flexShrink: 0,
          }}
        >
          {/* Project Summary Banner */}
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border-subtle)' }}>
            <p
              style={{
                fontSize: '0.8rem',
                color: 'var(--text-muted)',
                lineHeight: 1.45,
                marginBottom: '8px',
              }}
            >
              {project.description || 'Verified environmental baseline and carbon sequestration initiative.'}
            </p>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.72rem',
                color: 'var(--text-faint)',
              }}
            >
              <Shield size={12} color="var(--emerald-500)" />
              <span>Standard: {project.standard}</span>
            </div>
          </div>

          {/* Sites Header */}
          <div
            style={{
              padding: '10px 18px',
              backgroundColor: 'rgba(255, 255, 255, 0.015)',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span
              style={{
                fontSize: '0.7rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                color: 'var(--text-faint)',
              }}
            >
              Registered Vector Sites ({sites.length})
            </span>
          </div>

          {/* Sites List Container */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '10px 12px' }}>
            {sites.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '36px 12px', color: 'var(--text-faint)' }}>
                <Compass size={28} style={{ margin: '0 auto 10px', opacity: 0.4 }} />
                <p style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--text-muted)' }}>
                  No sites registered yet
                </p>
                <p style={{ fontSize: '0.76rem', marginTop: '4px', lineHeight: 1.4 }}>
                  Use the Mapbox drawing tool on the map to delineate your first polygon parcel.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {sites.map((site) => (
                  <div
                    key={site.id}
                    id={`site-drawer-item-${site.id}`}
                    className="glass-panel card-interactive site-card-hover"
                    style={{
                      padding: '12px 14px',
                      cursor: 'pointer',
                      borderRadius: 'var(--radius-sm)',
                    }}
                    onClick={() => navigate(`/projects/${projectId}/sites/${site.id}`)}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        marginBottom: '6px',
                      }}
                    >
                      <div>
                        <h4
                          style={{
                            fontSize: '0.88rem',
                            fontWeight: 600,
                            color: 'var(--text-main)',
                            lineHeight: 1.25,
                            marginBottom: '2px',
                          }}
                        >
                          {site.name}
                        </h4>
                        <span className="badge badge-emerald" style={{ fontSize: '0.64rem', padding: '1px 5px' }}>
                          {site.habitat_type.replace(/_/g, ' ')}
                        </span>
                      </div>

                      <button
                        title="Delete Site"
                        onClick={(e) => handleDeleteSite(site.id, site.name, e)}
                        className="btn-icon-danger"
                        style={{
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '4px',
                          borderRadius: 'var(--radius-xs)',
                        }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>

                    {/* Site Telemetry Summary */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: '6px',
                        padding: '6px 8px',
                        backgroundColor: 'rgba(255, 255, 255, 0.02)',
                        borderRadius: 'var(--radius-xs)',
                        border: '1px solid var(--border-subtle)',
                        marginTop: '8px',
                        marginBottom: '8px',
                        fontSize: '0.72rem',
                      }}
                    >
                      <div>
                        <span style={{ color: 'var(--text-faint)', display: 'block', fontSize: '0.62rem' }}>Area</span>
                        <strong style={{ color: 'var(--earth-500)', fontVariantNumeric: 'tabular-nums' }}>
                          {site.area_hectares} ha
                        </strong>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-faint)', display: 'block', fontSize: '0.62rem' }}>Carbon</span>
                        <strong style={{ color: 'var(--emerald-500)', fontVariantNumeric: 'tabular-nums' }}>
                          {site.latest_carbon_stock ? `${Math.round(site.latest_carbon_stock)}t` : '0t'}
                        </strong>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-faint)', display: 'block', fontSize: '0.62rem' }}>NDVI</span>
                        <strong style={{ color: 'var(--text-main)', fontVariantNumeric: 'tabular-nums' }}>
                          {site.latest_ndvi ? site.latest_ndvi.toFixed(2) : '0.00'}
                        </strong>
                      </div>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '0.74rem',
                        color: 'var(--emerald-500)',
                        fontWeight: 500,
                        marginTop: '4px',
                      }}
                    >
                      <span>View Site Telemetry</span>
                      <ArrowRight size={13} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* Right GIS Map Area */}
        <div style={{ flex: 1, position: 'relative', height: '100%' }}>
          {showDrawHint && (
            <div className="draw-hint-toast">
              <Compass size={14} color="var(--emerald-500)" />
              <span>
                Click the <strong style={{ color: 'var(--text-main)' }}>Polygon tool</strong> on the map, trace points, double-click to close.
              </span>
            </div>
          )}
          <MapView
            sites={sites}
            onSelectSite={(siteId) => navigate(`/projects/${projectId}/sites/${siteId}`)}
            onPolygonDrawn={handlePolygonDrawn}
            interactiveDraw={true}
          />
        </div>
      </div>

      <CreateSiteModal
        isOpen={isSiteModalOpen}
        onClose={() => setIsSiteModalOpen(false)}
        projectId={projectId}
        initialGeometry={drawnGeometry}
        calculatedAreaHectares={calculatedAreaHectares}
        onSiteCreated={handleSiteCreated}
      />
    </div>
  );
}
