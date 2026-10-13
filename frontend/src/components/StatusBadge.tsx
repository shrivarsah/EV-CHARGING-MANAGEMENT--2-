import React from 'react';

interface StatusBadgeProps {
  status: 'GOOD' | 'WARNING' | 'DANGER' | 'UNCONFIGURED' | 'AVAILABLE' | 'RESERVED' | 'CHARGING' | 'MAINTENANCE' | 'OFFLINE' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | string;
  label?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, label }) => {
  const norm = status?.toUpperCase() || 'UNCONFIGURED';

  let badgeClass = 'status-unconfigured';
  let pulseColor = '';
  let displayLabel = label || norm;

  if (['GOOD', 'AVAILABLE', 'ACTIVE', 'COMPLETED', 'SUCCESS', 'CONNECTED'].includes(norm)) {
    badgeClass = 'status-good';
    pulseColor = 'pulse-green';
  } else if (['WARNING', 'RESERVED', 'PARTIAL'].includes(norm)) {
    badgeClass = 'status-warning';
    pulseColor = 'pulse-yellow';
  } else if (['DANGER', 'CHARGING', 'MAINTENANCE', 'OFFLINE', 'ERROR', 'UNAUTHORIZED'].includes(norm)) {
    badgeClass = norm === 'CHARGING' ? 'status-warning' : 'status-danger';
    pulseColor = norm === 'CHARGING' ? 'pulse-yellow' : 'pulse-red';
  }

  return (
    <span className={`status-pill ${badgeClass}`}>
      {pulseColor && <span className={`pulse-indicator ${pulseColor}`} />}
      {displayLabel}
    </span>
  );
};
