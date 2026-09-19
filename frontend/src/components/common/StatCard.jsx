import React from 'react';

export default function StatCard({
  icon: Icon,
  label,
  value,
  unit,
  subtext,
  color = 'var(--emerald-500)',
}) {
  return (
    <div
      className="glass-panel card-interactive"
      style={{
        padding: '14px 16px 14px 18px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        minHeight: '106px',
        position: 'relative',
        borderRadius: 'var(--radius-sm)',
        borderLeft: `2px solid ${color}`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <span className="label-caps">
          {label}
        </span>
        {Icon && (
          <div className="stat-icon-box">
            <Icon size={15} color={color || 'var(--text-muted)'} />
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px', marginBottom: '4px' }}>
        <span
          className="metric-value"
          style={{ fontSize: '1.6rem' }}
        >
          {value}
        </span>
        {unit && (
          <span style={{ fontSize: '0.78rem', fontWeight: 500, color: 'var(--text-muted)' }}>
            {unit}
          </span>
        )}
      </div>

      {subtext && (
        <div
          style={{
            fontSize: '0.72rem',
            color: 'var(--text-faint)',
            lineHeight: 1.25,
          }}
        >
          {subtext}
        </div>
      )}
    </div>
  );
}
