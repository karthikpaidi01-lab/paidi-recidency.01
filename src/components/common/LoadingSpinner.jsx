import React from 'react';

export default function LoadingSpinner({ message = 'Loading records...' }) {
  return (
    <div className="loading-state">
      <div className="spinner-ring" />
      <p className="loading-text">{message}</p>
    </div>
  );
}
