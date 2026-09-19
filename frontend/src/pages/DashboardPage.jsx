import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import LoadingSpinner from '../components/common/LoadingSpinner';
import CreateProjectModal from '../components/projects/CreateProjectModal';
import { api } from '../services/api';
import {
  Trees,
  Plus,
  Search,
  ArrowUpRight,
  Shield,
  MapPin,
  Compass,
  CheckCircle2,
  Database,
  Radio,
} from 'lucide-react';

const ECOSYSTEM_THEMES = {
  mangrove: { badge: 'badge-teal', color: 'var(--teal-500)', border: 'eco-left-teal' },
  agroforestry: { badge: 'badge-earth', color: 'var(--earth-500)', border: 'eco-left-earth' },
  peatland_conservation: { badge: 'badge-amber', color: 'var(--amber-500)', border: 'eco-left-amber' },
  reforestation: { badge: 'badge-emerald', color: 'var(--emerald-500)', border: 'eco-left-emerald' },
};

const getTheme = (type) => ECOSYSTEM_THEMES[type] || ECOSYSTEM_THEMES.reforestation;

export default function DashboardPage() {
  const [projects, setProjects] = useState([]);
  const [overview, setOverview] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');

  const navigate = useNavigate();

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [projectsData, overviewData] = await Promise.all([
        api.projects.getAll(),
        api.analytics.getOverview(),
      ]);
      setProjects(projectsData);
      setOverview(overviewData);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setError(err.message || 'Failed to load projects');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleProjectCreated = (newProject) => {
    setProjects((prev) => [newProject, ...prev]);
    loadData();
  };

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const matchesSearch =
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesType = selectedType === 'all' || p.project_type === selectedType;
      return matchesSearch && matchesType;
    });
  }, [projects, searchQuery, selectedType]);

  // Biome calculations for geographic breakdown
  const biomeBreakdown = useMemo(() => {
    if (!projects.length) return [];
    const counts = {};
    projects.forEach((p) => {
      counts[p.project_type] = (counts[p.project_type] || 0) + 1;
    });
    return Object.entries(counts).map(([type, count]) => ({
      type,
      label: type.replace(/_/g, ' '),
      count,
      pct: Math.round((count / projects.length) * 100),
    }));
  }, [projects]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }} className="page-enter">
      <Navbar onOpenCreateProject={() => setIsModalOpen(true)} />

      <main style={{ flex: 1, padding: '24px 32px', maxWidth: '1440px', margin: '0 auto', width: '100%' }}>
        {/* Page Header */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '16px',
            marginBottom: '20px',
            paddingBottom: '18px',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <span className="label-caps">Global Conservation Registry</span>
            </div>
            <h1
              style={{
                fontSize: '1.55rem',
                fontWeight: 600,
                letterSpacing: '-0.02em',
                lineHeight: 1.2,
                color: 'var(--text-main)',
              }}
            >
              Conservation & Carbon Command
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem', marginTop: '6px' }}>
              High-integrity geospatial verification, biomass stock accounting, and vegetative canopy telemetry.
            </p>
          </div>

          <button
            id="btn-hero-create-project"
            className="btn-primary"
            onClick={() => setIsModalOpen(true)}
            style={{ padding: '8px 16px', fontSize: '0.84rem' }}
          >
            <Plus size={15} />
            Create New Project
          </button>
        </div>

        {/* Global Overview KPI Strip */}
        <div
          className="metric-strip"
          style={{
            marginBottom: '0',
            borderTop: '1px solid var(--section-rule)',
            borderRadius: 0,
            overflowX: 'auto',
          }}
        >
          <div className="metric-strip-item">
            <span className="metric-strip-label">Active Jurisdictions</span>
            <span className="metric-strip-value" style={{ color: 'var(--sky-500)' }}>
              {overview ? overview.total_projects : '—'}
            </span>
            <span className="metric-strip-sub">National conservation frameworks</span>
          </div>
          <div className="metric-strip-item">
            <span className="metric-strip-label">Monitored Sites</span>
            <span className="metric-strip-value" style={{ color: 'var(--emerald-500)' }}>
              {overview ? overview.total_sites : '—'}
            </span>
            <span className="metric-strip-sub">PostGIS vector polygons</span>
          </div>
          <div className="metric-strip-item">
            <span className="metric-strip-label">Land Coverage</span>
            <span className="metric-strip-value" style={{ color: 'var(--earth-500)' }}>
              {overview ? overview.total_hectares.toLocaleString() : '—'}
              <span style={{ fontSize: '0.75rem', fontWeight: 400, marginLeft: '4px', color: 'var(--text-faint)' }}>ha</span>
            </span>
            <span className="metric-strip-sub">Geodesic surface area</span>
          </div>
          <div className="metric-strip-item">
            <span className="metric-strip-label">Biomass Carbon</span>
            <span className="metric-strip-value" style={{ color: 'var(--teal-500)' }}>
              {overview ? overview.total_carbon_sequestered_tco2e.toLocaleString() : '—'}
              <span style={{ fontSize: '0.75rem', fontWeight: 400, marginLeft: '4px', color: 'var(--text-faint)' }}>tCO2e</span>
            </span>
            <span className="metric-strip-sub">Verified cumulative removal</span>
          </div>
          <div className="metric-strip-item">
            <span className="metric-strip-label">Canopy NDVI</span>
            <span className="metric-strip-value" style={{ color: 'var(--emerald-500)' }}>
              {overview ? overview.average_ndvi.toFixed(3) : '—'}
            </span>
            <span className="metric-strip-sub">Sentinel-2 optical vigor</span>
          </div>
        </div>

        {/* Biome Portfolio */}
        <section style={{ marginBottom: '24px' }}>
          <div className="section-header-row" style={{ marginBottom: '10px', marginTop: '22px' }}>
            <Compass size={13} color="var(--emerald-500)" />
            <span className="section-header-label">Monitored Biome Portfolio</span>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '8px',
            }}
          >
            {biomeBreakdown.map((b) => {
              const theme = getTheme(b.type);
              return (
                <div
                  key={b.type}
                  className={theme.border}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 14px',
                    backgroundColor: 'var(--bg-panel-flat)',
                    borderTop: '1px solid var(--section-rule)',
                    borderBottom: '1px solid var(--section-rule)',
                    borderRight: '1px solid var(--border-subtle)',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-main)', textTransform: 'capitalize' }}>
                      {b.label}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-faint)', marginTop: '1px' }}>
                      {b.count} {b.count === 1 ? 'project' : 'projects'} · {b.pct}% of portfolio
                    </div>
                  </div>
                  <strong
                    style={{
                      fontSize: '1.1rem',
                      fontWeight: 700,
                      color: theme.color,
                      fontVariantNumeric: 'tabular-nums',
                      flexShrink: 0,
                    }}
                  >
                    {b.count}
                  </strong>
                </div>
              );
            })}
          </div>
        </section>

        {/* Project Directory Filters */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            padding: '10px 0',
            marginBottom: '16px',
            borderBottom: '1px solid var(--section-rule)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="section-header-label">Project Portfolio</span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-faint)' }}>
              {filteredProjects.length} of {projects.length}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', minWidth: '220px', maxWidth: '320px', flex: 1 }}>
              <input
                id="input-search-projects"
                type="text"
                className="input-field"
                placeholder="Filter by title or country..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '34px', fontSize: '0.84rem', padding: '6px 10px 6px 34px' }}
              />
              <Search size={13} color="var(--text-faint)" style={{ position: 'absolute', left: '11px', top: '9px' }} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              {[
                { id: 'all', label: 'All' },
                { id: 'reforestation', label: 'Reforestation' },
                { id: 'mangrove', label: 'Mangrove' },
                { id: 'peatland_conservation', label: 'Peatlands' },
                { id: 'agroforestry', label: 'Agroforestry' },
              ].map((pill) => {
                const isActive = selectedType === pill.id;
                return (
                  <button
                    key={pill.id}
                    onClick={() => setSelectedType(pill.id)}
                    className={isActive ? 'filter-btn-active' : ''}
                    style={{
                      backgroundColor: isActive ? undefined : 'transparent',
                      border: isActive ? undefined : '1px solid transparent',
                      color: isActive ? undefined : 'var(--text-muted)',
                      padding: '4px 10px',
                      borderRadius: 'var(--radius-xs)',
                      fontSize: '0.76rem',
                      fontWeight: 500,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'all var(--transition-fast)',
                    }}
                  >
                    {pill.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>


        {/* Projects Grid */}
        {isLoading ? (
          <LoadingSpinner message="Querying geospatial project registries..." />
        ) : error ? (
          <div
            className="glass-panel"
            style={{ padding: '32px', textAlign: 'center', color: '#f87171' }}
          >
            {error}
          </div>
        ) : filteredProjects.length === 0 ? (
          <div
            className="glass-panel"
            style={{
              padding: '48px 20px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <Trees size={32} color="var(--text-faint)" />
            <h3 style={{ fontSize: '1.05rem', color: 'var(--text-main)' }}>No matching projects</h3>
            <p style={{ color: 'var(--text-muted)', maxWidth: '380px', fontSize: '0.82rem' }}>
              {searchQuery || selectedType !== 'all'
                ? 'Try adjusting your search terms or ecosystem filter.'
                : 'Create your first verified environmental project to draft polygon boundaries on satellite imagery.'}
            </p>
            <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
              <Plus size={15} />
              Register Project
            </button>
          </div>
        ) : (
          <div
            className="card-grid-stagger"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
              gap: '16px',
              marginBottom: '28px',
            }}
          >
            {filteredProjects.map((project) => {
              const theme = getTheme(project.project_type);
              return (
                <div
                  key={project.id}
                  id={`project-card-${project.id}`}
                  className="glass-panel card-interactive"
                  style={{
                    padding: '18px 20px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    position: 'relative',
                    minHeight: '220px',
                    borderRadius: 'var(--radius-sm)',
                    borderTop: `2px solid ${theme.color}`,
                  }}
                  onClick={() => navigate(`/projects/${project.id}`)}
                >
                  <div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '10px',
                      }}
                    >
                      <span className={`badge ${theme.badge}`}>
                        {project.project_type.replace(/_/g, ' ')}
                      </span>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 500,
                          color: 'var(--text-muted)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <Shield size={12} color="var(--text-muted)" />
                        {project.standard}
                      </span>
                    </div>

                    <h3
                      style={{
                        fontSize: '1.04rem',
                        fontWeight: 600,
                        marginBottom: '5px',
                        lineHeight: 1.3,
                        color: 'var(--text-main)',
                      }}
                    >
                      {project.title}
                    </h3>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '0.76rem',
                        color: 'var(--text-muted)',
                        marginBottom: '10px',
                      }}
                    >
                      <MapPin size={12} color="var(--text-faint)" />
                      <span>{project.country}</span>
                    </div>

                    <p
                      style={{
                        fontSize: '0.8rem',
                        color: 'var(--text-muted)',
                        lineHeight: 1.45,
                        marginBottom: '16px',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {project.description || 'Verified environmental baseline and carbon sequestration initiative.'}
                    </p>
                  </div>

                  {/* Card Data Footer */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '16px',
                      paddingTop: '10px',
                      marginTop: '12px',
                      borderTop: '1px solid var(--border-subtle)',
                    }}
                  >
                    <div>
                      <span className="label-caps" style={{ display: 'block', fontSize: '0.62rem' }}>
                        Sites
                      </span>
                      <strong style={{ fontSize: '0.92rem', color: 'var(--text-main)', fontVariantNumeric: 'tabular-nums' }}>
                        {project.sites_count}
                      </strong>
                    </div>
                    <div>
                      <span className="label-caps" style={{ display: 'block', fontSize: '0.62rem' }}>
                        Coverage
                      </span>
                      <strong style={{ fontSize: '0.92rem', color: 'var(--earth-500)', fontVariantNumeric: 'tabular-nums' }}>
                        {project.total_area_hectares} ha
                      </strong>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '0.76rem',
                        fontWeight: 500,
                        color: 'var(--emerald-500)',
                        marginLeft: 'auto',
                      }}
                    >
                      <span>Open Workspace</span>
                      <ArrowUpRight size={13} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Operational Status Strip */}
        <div
          style={{
            paddingTop: '16px',
            marginTop: '8px',
            borderTop: '1px solid var(--section-rule)',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            fontSize: '0.72rem',
            color: 'var(--text-faint)',
            marginBottom: '24px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Database size={12} color="var(--emerald-500)" />
              <span>PostGIS 3.4 · WGS84 SRID 4326</span>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Radio size={12} color="var(--teal-500)" />
              <span>Sentinel-2 Multispectral MSI</span>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={12} color="var(--earth-500)" />
              <span>Verra VCS + CCB · Plan Vivo</span>
            </span>
          </div>
          <div>Darukaa.Earth Platform v1.0.0</div>
        </div>
      </main>

      <CreateProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onProjectCreated={handleProjectCreated}
      />
    </div>
  );
}
