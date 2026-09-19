import React, { useState, useCallback } from 'react';
import { X, Trees, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';

export default function CreateProjectModal({ isOpen, onClose, onProjectCreated }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [projectType, setProjectType] = useState('reforestation');
  const [standard, setStandard] = useState('Verra VCS');
  const [country, setCountry] = useState('');
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
    if (!title.trim()) {
      setError('Project title is required');
      return;
    }
    if (!country.trim()) {
      setError('Country or jurisdiction is required');
      return;
    }

    try {
      setIsSubmitting(true);
      const newProject = await api.projects.create({
        title: title.trim(),
        description: description.trim() || null,
        project_type: projectType,
        standard: standard,
        status: 'active',
        country: country.trim(),
      });
      onProjectCreated(newProject);
      handleClose();
    } catch (err) {
      setError(err.message || 'Failed to create project');
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
              <Trees size={17} color="#10b981" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-main)', lineHeight: 1.25 }}>
                Register New Project
              </h2>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Initiate a verified nature-based climate initiative
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
              Project Title *
            </label>
            <input
              id="input-project-title"
              type="text"
              className="input-field"
              placeholder="e.g. Madre de Dios Rainforest Canopy Restoration"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-main)', marginBottom: '5px' }}>
                Intervention Type *
              </label>
              <select
                id="select-project-type"
                className="input-field"
                value={projectType}
                onChange={(e) => setProjectType(e.target.value)}
              >
                <option value="reforestation">Tropical Reforestation</option>
                <option value="mangrove">Mangrove Blue Carbon</option>
                <option value="peatland_conservation">Peatland Conservation</option>
                <option value="agroforestry">Agroforestry & Canopy Cover</option>
                <option value="grassland">Grassland & Savanna Restoration</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-main)', marginBottom: '5px' }}>
                Certification Standard
              </label>
              <select
                id="select-project-standard"
                className="input-field"
                value={standard}
                onChange={(e) => setStandard(e.target.value)}
              >
                <option value="Verra VCS">Verra Verified Carbon Standard (VCS)</option>
                <option value="Gold Standard">Gold Standard for the Global Goals</option>
                <option value="Plan Vivo">Plan Vivo Foundation Standard</option>
                <option value="CCB Standards">Climate, Community & Biodiversity (CCB)</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-main)', marginBottom: '5px' }}>
              Country / Jurisdiction *
            </label>
            <input
              id="input-project-country"
              type="text"
              className="input-field"
              placeholder="e.g. Peru, Indonesia, Kenya, Costa Rica"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-main)', marginBottom: '5px' }}>
              Ecological Objective & Description
            </label>
            <textarea
              id="input-project-desc"
              className="input-field"
              rows={3}
              placeholder="Describe target native species, carbon baseline, and local community stewardship..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ resize: 'vertical' }}
            />
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '10px',
              marginTop: '6px',
              paddingTop: '16px',
              borderTop: '1px solid var(--border-subtle)',
            }}
          >
            <button type="button" className="btn-secondary" onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button id="btn-submit-project" type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Registering Project...' : 'Register Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
