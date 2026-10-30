import React from 'react';

export function StatusBadge({ status }) {
  if (!status) return null;

  const normalized = status.toLowerCase();

  let className = 'badge-completed';
  let dotColor = '#737373';

  if (normalized === 'available') {
    className = 'badge-available';
    dotColor = '#166534';
  } else if (normalized === 'cancelled') {
    className = 'badge-cancelled';
    dotColor = '#991B1B';
  } else if (normalized === 'confirmed') {
    className = 'badge-confirmed';
    dotColor = '#777D68';
  } else if (normalized === 'occupied') {
    className = 'badge-occupied';
    dotColor = '#252525';
  } else if (normalized === 'completed') {
    className = 'badge-completed';
    dotColor = '#737373';
  } else if (normalized === 'maintenance') {
    className = 'badge-maintenance';
    dotColor = '#737373';
  }

  return (
    <span className={`status-badge ${className}`}>
      <span className="badge-dot" style={{ backgroundColor: dotColor }} />
      {status}
    </span>
  );
}

export function RoomTypeBadge({ type }) {
  return (
    <span className="room-type-badge">
      {type}
    </span>
  );
}
