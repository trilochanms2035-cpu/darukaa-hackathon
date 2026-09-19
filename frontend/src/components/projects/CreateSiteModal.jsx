import React, { useState, useCallback } from 'react';
import { X, Layers, AlertCircle, Compass } from 'lucide-react';
import { api } from '../../services/api';

export default function CreateSiteModal({
  isOpen,
  onClose,
  projectId,
  drawnGeometry,
  calculatedAreaHectares,
  onSiteCreated,
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [habitatType, setHabitatType] = useState('tropical_moist_forest');
  const [elevation, setElevation] = useState('140');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 160);
  }, [onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Site parcel name is required');
      return;
    }
    if (!drawnGeometry) {
      setError('No polygon geometry provided from the map');
      return;
    }

    try {
      setIsSubmitting(true);
      const newSite = await api.sites.create({
        project_id: projectId,
        name: name.trim(),
        description: description.trim() || null,
        habitat_type: habitatType,
        geometry: drawnGeometry,
        elevation_meters: parseFloat(elevation) || 100.0,
      });
      onSiteCreated(newSite);
      handleClose();
    } catch (err) {
      setError(err.message || 'Failed to save site polygon');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={`modal-overlay${isClosing ? ' modal-overlay-closing' : ''}`}
      onClick={handleClose}
    >
      <div
        className={`modal-content${isClosing ? ' modal-content-closing' : ''}`}
        onClick={(e) => e.stopPropagation()}
        style={{ padding: '24px 28px' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Compass size={17} color="#10b981" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-main)', lineHeight: 1.25 }}>
                Save Site Parcel
              </h2>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Persist vector boundary to PostGIS (SRID: 4326) and initialize telemetry
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-faint)',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: 'var(--radius-xs)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'color var(--transition-fast)',
            }}
            className="modal-close-btn"
          >
            <X size={18} />
          </button>
        </div>

        {/* Spatial Preview Banner: Area & PostGIS Tag */}
        <div
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-sm)',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '18px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Layers size={18} color="var(--earth-500)" />
            <div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-faint)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.04em' }}>
                Calculated Geodetic Area
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--earth-500)', fontVariantNumeric: 'tabular-nums' }}>
                {calculatedAreaHectares ? `${calculatedAreaHectares.toFixed(2)} ha` : 'Calculating...'}
              </div>
            </div>
          </div>
          <span className="badge badge-emerald">PostGIS SRID: 4326</span>
        </div>

        {error && (
          <div
            style={{
              backgroundColor: 'var(--rose-muted)',
              border: '1px solid rgba(225, 29, 72, 0.3)',
              borderRadius: 'var(--radius-sm)',
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#f87171',
              fontSize: '0.82rem',
              marginBottom: '16px',
            }}
          >
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-main)', marginBottom: '5px' }}>
              Site Parcel Designation *
            </label>
            <input
              id="input-site-name"
              type="text"
              className="input-field"
              placeholder="e.g. Sector Beta - Riparian Canopy Zone"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-main)', marginBottom: '5px' }}>
                Ecosystem / Habitat *
              </label>
              <select
                id="select-site-habitat"
                className="input-field"
                value={habitatType}
                onChange={(e) => setHabitatType(e.target.value)}
              >
                <option value="tropical_moist_forest">Tropical Moist Forest</option>
                <option value="mangrove">Mangrove / Estuarine Wetland</option>
                <option value="peatland_conservation">Peatland & Swamp</option>
                <option value="temperate_forest">Temperate Deciduous Forest</option>
                <option value="grassland">Grassland & Savanna</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-main)', marginBottom: '5px' }}>
                Mean Elevation (Meters)
              </label>
              <input
                id="input-site-elevation"
                type="number"
                step="any"
                className="input-field"
                placeholder="140"
                value={elevation}
                onChange={(e) => setElevation(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-main)', marginBottom: '5px' }}>
              Field Notes & Ecological Baseline
            </label>
            <textarea
              id="input-site-desc"
              className="input-field"
              rows={3}
              placeholder="Soil drainage, species composition, or baseline degradation details..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ resize: 'vertical' }}
            />
          </div>

          {/* Action Footer: Clear hierarchy */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: '8px',
              paddingTop: '16px',
              borderTop: '1px solid var(--border-subtle)',
            }}
          >
            <button
              type="button"
              className="btn-danger"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Discard Drawing
            </button>

            <button
              id="btn-submit-site"
              type="submit"
              className="btn-primary"
              disabled={isSubmitting}
              style={{ padding: '8px 18px' }}
            >
              {isSubmitting ? 'Persisting to PostGIS...' : 'Save Site Parcel'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
