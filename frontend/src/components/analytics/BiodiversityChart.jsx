import React from 'react';
import { Line } from 'react-chartjs-2';

export default function BiodiversityChart({ timeseries = [] }) {
  if (!timeseries || timeseries.length === 0) {
    return (
      <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.84rem' }}>
        No biodiversity monitoring records available.
      </div>
    );
  }

  const labels = timeseries.map((m) => {
    const d = new Date(m.record_date);
    return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
  });

  const speciesRichness = timeseries.map((m) => m.species_richness);
  const shannonIndex = timeseries.map((m) => m.shannon_index);

  const data = {
    labels,
    datasets: [
      {
        label: 'Observed Species Richness',
        data: speciesRichness,
        borderColor: '#c29b68',
        backgroundColor: 'rgba(194, 155, 104, 0.05)',
        borderWidth: 2,
        fill: true,
        tension: 0.28,
        pointRadius: 2.5,
        pointHoverRadius: 4.5,
        pointBackgroundColor: '#c29b68',
        yAxisID: 'y',
      },
      {
        label: "Shannon Diversity Index (H')",
        data: shannonIndex,
        borderColor: '#d97706',
        backgroundColor: 'transparent',
        borderWidth: 1.8,
        borderDash: [4, 4],
        fill: false,
        tension: 0.28,
        pointRadius: 2,
        pointHoverRadius: 4,
        pointBackgroundColor: '#d97706',
        yAxisID: 'y1',
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top',
        align: 'end',
        labels: {
          color: '#94a3b8',
          font: {
            family: "'Plus Jakarta Sans', sans-serif",
            size: 11,
            weight: 500,
          },
          boxWidth: 10,
          usePointStyle: true,
          padding: 16,
        },
      },
      tooltip: {
        backgroundColor: '#161c20',
        titleColor: '#f8fafc',
        bodyColor: '#94a3b8',
        borderColor: 'rgba(255, 255, 255, 0.12)',
        borderWidth: 1,
        padding: 10,
        boxPadding: 4,
        cornerRadius: 6,
        usePointStyle: true,
        titleFont: {
          family: "'Plus Jakarta Sans', sans-serif",
          weight: 600,
          size: 12,
        },
        bodyFont: {
          family: "'Plus Jakarta Sans', sans-serif",
          size: 11,
        },
      },
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.035)',
        },
        ticks: {
          color: '#64748b',
          font: { size: 10.5, family: "'Plus Jakarta Sans', sans-serif" },
          maxRotation: 0,
        },
      },
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: 'Observed Taxa Count',
          color: '#c29b68',
          font: { weight: 500, size: 10.5, family: "'Plus Jakarta Sans', sans-serif" },
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.035)',
        },
        ticks: {
          color: '#64748b',
          font: { size: 10.5, family: "'Plus Jakarta Sans', sans-serif" },
        },
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        title: {
          display: true,
          text: "Shannon Index (H')",
          color: '#d97706',
          font: { weight: 500, size: 10.5, family: "'Plus Jakarta Sans', sans-serif" },
        },
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          color: '#64748b',
          font: { size: 10.5, family: "'Plus Jakarta Sans', sans-serif" },
        },
      },
    },
  };

  return (
    <div style={{ height: '340px', width: '100%', position: 'relative' }}>
      <Line data={data} options={options} />
    </div>
  );
}
