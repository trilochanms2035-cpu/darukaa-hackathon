import React from 'react';
import { Loader2 } from 'lucide-react';

export default function LoadingSpinner({ message = 'Loading geospatial intelligence...' }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 20px',
        gap: '12px',
        color: 'var(--text-muted)',
      }}
    >
      <Loader2
        size={24}
        color="#10b981"
        style={{ animation: 'spin 0.9s linear infinite' }}
      />
      <span style={{ fontSize: '0.84rem', fontWeight: 500, letterSpacing: '0.01em' }}>{message}</span>
    </div>
  );
}
