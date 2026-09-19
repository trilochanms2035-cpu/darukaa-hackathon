import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Globe,
  Lock,
  Mail,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Database,
  Radio,
} from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('admin@darukaa.earth');
  const [password, setPassword] = useState('Admin123!');
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      setIsSubmitting(true);
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Invalid credentials. Please verify your email and password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickDemoFill = () => {
    setEmail('admin@darukaa.earth');
    setPassword('Admin123!');
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        backgroundColor: 'var(--bg-base)',
      }}
      className="page-enter"
    >
      {/* Brand Column */}
      <div
        style={{
          flex: '1.1',
          backgroundColor: 'var(--forest-deep)',
          borderRight: '1px solid var(--border-subtle)',
          padding: '48px 44px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
          overflow: 'hidden',
        }}
        className="geo-grid-backdrop topo-backdrop"
      >
        <div>
          {/* Brand Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '36px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Globe size={20} color="var(--emerald-500)" />
            </div>
            <div>
              <div
                style={{
                  fontSize: '1.15rem',
                  fontWeight: 600,
                  fontFamily: 'var(--font-display)',
                  color: '#ffffff',
                  letterSpacing: '-0.015em',
                  lineHeight: 1.15,
                }}
              >
                Darukaa<span style={{ color: 'var(--emerald-500)' }}>.Earth</span>
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-faint)', letterSpacing: '0.04em' }}>
                Climate Intelligence Platform
              </div>
            </div>
          </div>

          {/* Hero Pitch */}
          <h1
            style={{
              fontSize: '2rem',
              fontWeight: 600,
              lineHeight: 1.25,
              color: '#ffffff',
              letterSpacing: '-0.025em',
              marginBottom: '14px',
              maxWidth: '480px',
            }}
          >
            Planetary carbon and ecological intelligence.
          </h1>
          <p
            style={{
              color: 'var(--text-muted)',
              fontSize: '0.9rem',
              lineHeight: 1.55,
              maxWidth: '460px',
              marginBottom: '36px',
            }}
          >
            Geodetic boundary verification, Sentinel-2 optical telemetry, and rigorous biomass carbon accounting for field conservation projects.
          </p>

          {/* Core Capabilities */}
          <div style={{ display: 'flex', flexDirection: 'column', maxWidth: '440px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '14px 0' }}>
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: 'var(--radius-xs)',
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid var(--emerald-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Database size={14} color="var(--emerald-500)" />
              </div>
              <div>
                <div style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-main)' }}>
                  Native PostGIS Geodesy
                </div>
                <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', lineHeight: 1.35 }}>
                  Sub-meter polygon topology verification using SRID 4326 on PostgreSQL.
                </div>
              </div>
            </div>

            <div style={{ height: '1px', backgroundColor: 'var(--border-subtle)' }} />

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '14px 0' }}>
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: 'var(--radius-xs)',
                  backgroundColor: 'rgba(13, 148, 136, 0.1)',
                  border: '1px solid var(--teal-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Radio size={14} color="var(--teal-500)" />
              </div>
              <div>
                <div style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-main)' }}>
                  Multispectral Canopy Telemetry
                </div>
                <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', lineHeight: 1.35 }}>
                  Continuous NDVI and canopy cover tracking to monitor forest succession.
                </div>
              </div>
            </div>

            <div style={{ height: '1px', backgroundColor: 'var(--border-subtle)' }} />

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '14px 0' }}>
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: 'var(--radius-xs)',
                  backgroundColor: 'rgba(194, 155, 104, 0.1)',
                  border: '1px solid var(--earth-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <CheckCircle2 size={14} color="var(--earth-500)" />
              </div>
              <div>
                <div style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-main)' }}>
                  Audit-Ready MRV Standards
                </div>
                <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', lineHeight: 1.35 }}>
                  Verra VCS, CCB Standards, and Plan Vivo compliant reporting.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Operational Status */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.74rem',
            color: 'var(--text-faint)',
            paddingTop: '24px',
            borderTop: '1px solid var(--border-subtle)',
          }}
        >
          <span className="telemetry-pulse" />
          <span>Operational Command Status: All Telemetry Streams Online</span>
        </div>
      </div>

      {/* Auth Form */}
      <div
        style={{
          flex: '1',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 24px',
          backgroundColor: 'var(--bg-surface)',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '380px',
          }}
        >
          <div style={{ marginBottom: '24px' }}>
            <h2
              style={{
                fontSize: '1.4rem',
                fontWeight: 600,
                color: 'var(--text-main)',
                letterSpacing: '-0.02em',
                marginBottom: '6px',
              }}
            >
              Sign In to Command Center
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem' }}>
              Enter your credentials to access project vector boundaries and analytics.
            </p>
          </div>

          {/* Demo Fill Helper */}
          <div
            style={{
              backgroundColor: 'rgba(16, 185, 129, 0.06)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              borderRadius: 'var(--radius-sm)',
              padding: '9px 12px',
              marginBottom: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '8px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.76rem', color: 'var(--emerald-500)' }}>
              <ShieldCheck size={15} />
              <span>Admin Demo Preset</span>
            </div>
            <button
              type="button"
              onClick={handleQuickDemoFill}
              style={{
                backgroundColor: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                color: '#ffffff',
                padding: '3px 8px',
                borderRadius: 'var(--radius-xs)',
                fontSize: '0.7rem',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'background-color var(--transition-fast)',
              }}
            >
              Auto-fill
            </button>
          </div>

          {error && (
            <div
              style={{
                backgroundColor: 'var(--rose-muted)',
                border: '1px solid var(--rose-border)',
                borderRadius: 'var(--radius-sm)',
                padding: '10px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: '#f87171',
                fontSize: '0.8rem',
                marginBottom: '16px',
              }}
            >
              <AlertCircle size={15} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 500, color: 'var(--text-main)', marginBottom: '5px' }}>
                Administrator Email
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="input-login-email"
                  type="email"
                  className="input-field"
                  placeholder="admin@darukaa.earth"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ paddingLeft: '34px' }}
                  required
                />
                <Mail size={14} color="var(--text-faint)" style={{ position: 'absolute', left: '11px', top: '11px' }} />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 500, color: 'var(--text-main)', marginBottom: '5px' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="input-login-password"
                  type="password"
                  className="input-field"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ paddingLeft: '34px' }}
                  required
                />
                <Lock size={14} color="var(--text-faint)" style={{ position: 'absolute', left: '11px', top: '11px' }} />
              </div>
            </div>

            <button
              id="btn-login-submit"
              type="submit"
              className="btn-primary"
              style={{ width: '100%', padding: '9px', marginTop: '6px' }}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Authenticating...' : 'Sign In to Command Center'}
              <ArrowRight size={14} />
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '18px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Don't have an administrator account?{' '}
            <Link to="/register" style={{ color: 'var(--emerald-500)', fontWeight: 500, textDecoration: 'none' }}>
              Register
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
