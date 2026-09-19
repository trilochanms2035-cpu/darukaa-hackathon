import React, { useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Globe, BarChart2, LogOut, User as UserIcon, Plus } from 'lucide-react';

export default function Navbar({ onOpenCreateProject }) {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const headerRef = useRef(null);

  // Add/remove .scrolled class for navbar shadow on scroll
  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;
    const onScroll = () => {
      header.classList.toggle('scrolled', window.scrollY > 10);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header
      id="main-navbar"
      ref={headerRef}
      className="app-navbar"
      style={{
        height: '60px',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
      }}
    >
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <Link
          to="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            textDecoration: 'none',
          }}
        >
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Globe size={18} color="var(--emerald-500)" />
          </div>
          <div>
            <div
              style={{
                fontSize: '1.02rem',
                fontWeight: 600,
                fontFamily: 'var(--font-display)',
                color: 'var(--text-main)',
                letterSpacing: '-0.015em',
                lineHeight: 1.15,
              }}
            >
              Darukaa<span style={{ color: 'var(--emerald-500)' }}>.Earth</span>
            </div>
            <div
              style={{
                fontSize: '0.66rem',
                color: 'var(--text-faint)',
                letterSpacing: '0.04em',
                fontWeight: 500,
              }}
            >
              Environmental Intelligence
            </div>
          </div>
        </Link>

        <div className="telemetry-nav-badge">
          <span className="telemetry-pulse" />
          <span>Live · Telemetry</span>
        </div>
      </div>

      {/* Navigation */}
      {isAuthenticated ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <nav style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Link
              to="/"
              id="nav-link-dashboard"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                color: location.pathname === '/' ? '#ffffff' : 'var(--text-muted)',
                backgroundColor:
                  location.pathname === '/' ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
                border:
                  location.pathname === '/'
                    ? '1px solid var(--border-default)'
                    : '1px solid transparent',
                textDecoration: 'none',
                fontSize: '0.84rem',
                fontWeight: 500,
                transition: 'all var(--transition-fast)',
              }}
            >
              <BarChart2 size={14} color={location.pathname === '/' ? 'var(--emerald-500)' : 'currentColor'} />
              Dashboard
            </Link>
          </nav>

          {onOpenCreateProject && (
            <button
              id="btn-nav-create-project"
              className="btn-primary"
              onClick={onOpenCreateProject}
              style={{ padding: '6px 12px', fontSize: '0.82rem' }}
            >
              <Plus size={14} />
              New Project
            </button>
          )}

          {/* User profile badge & logout */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              paddingLeft: '12px',
              borderLeft: '1px solid var(--border-subtle)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                backgroundColor: 'rgba(255, 255, 255, 0.025)',
                padding: '4px 9px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <UserIcon size={12} color="var(--text-muted)" />
              <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-main)' }}>
                {user?.full_name || user?.email}
              </span>
              <span
                className="badge badge-subtle"
                style={{ fontSize: '0.62rem', padding: '1px 5px' }}
              >
                {user?.role || 'admin'}
              </span>
            </div>

            <button
              id="btn-logout"
              onClick={handleLogout}
              title="Sign out"
              className="btn-icon-danger"
              style={{
                background: 'transparent',
                border: '1px solid transparent',
                cursor: 'pointer',
                padding: '6px',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Link to="/login" className="btn-secondary" style={{ padding: '6px 13px', fontSize: '0.82rem' }}>
            Sign In
          </Link>
          <Link to="/register" className="btn-primary" style={{ padding: '6px 13px', fontSize: '0.82rem' }}>
            Register
          </Link>
        </div>
      )}
    </header>
  );
}
