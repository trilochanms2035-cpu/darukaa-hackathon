import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Globe,
  Lock,
  Mail,
  User,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';

export default function RegisterPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    try {
      setIsSubmitting(true);
      await register({
        full_name: fullName.trim(),
        email: email.trim(),
        password,
        role: 'admin',
      });
      navigate('/');
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setIsSubmitting(false);
    }
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
            Deploy verifiable nature-based project boundaries.
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
            Register your conservation organization to delineate vector parcels on high-resolution satellite imagery and track time-series ecological recovery.
          </p>

          {/* Platform Scope */}
          <div
            style={{
              marginTop: '28px',
              padding: '18px 20px',
              backgroundColor: 'rgba(180, 220, 190, 0.04)',
              border: '1px solid var(--border-subtle)',
              borderLeft: '2px solid var(--emerald-500)',
              borderRadius: 'var(--radius-sm)',
              maxWidth: '440px',
            }}
          >
            <div style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '8px' }}>
              Join the Darukaa.Earth platform
            </div>
            <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '12px' }}>
              Access active conservation jurisdictions across 3 countries. Delineate polygon parcels on satellite imagery and track time-series ecological recovery.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.72rem', color: 'var(--text-faint)' }}>
              <span>PostGIS · SRID 4326</span>
              <span>Sentinel-2 NDVI</span>
              <span>Verra VCS MRV</span>
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

      {/* Registration Form */}
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
              Create Administrator Account
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem' }}>
              Register your credentials to manage field projects and sites.
            </p>
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
                Full Name
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="input-register-name"
                  type="text"
                  className="input-field"
                  placeholder="Dr. Elena Vance"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  style={{ paddingLeft: '34px' }}
                  required
                />
                <User size={14} color="var(--text-faint)" style={{ position: 'absolute', left: '11px', top: '11px' }} />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 500, color: 'var(--text-main)', marginBottom: '5px' }}>
                Work Email
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="input-register-email"
                  type="email"
                  className="input-field"
                  placeholder="elena@conservation.org"
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
                  id="input-register-password"
                  type="password"
                  className="input-field"
                  placeholder="Minimum 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ paddingLeft: '34px' }}
                  required
                />
                <Lock size={14} color="var(--text-faint)" style={{ position: 'absolute', left: '11px', top: '11px' }} />
              </div>
            </div>

            <button
              id="btn-register-submit"
              type="submit"
              className="btn-primary"
              style={{ width: '100%', padding: '9px', marginTop: '6px' }}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating Account...' : 'Complete Registration'}
              <ArrowRight size={14} />
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '18px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Already have an administrator account?{' '}
            <Link to="/login" style={{ color: 'var(--emerald-500)', fontWeight: 500, textDecoration: 'none' }}>
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
