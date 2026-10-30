import React from 'react';
import { Search } from 'lucide-react';

export default function EmptyState({
  title = 'No records found',
  description = 'Try adjusting your search query or filter criteria.',
  actionLabel,
  onAction,
  icon: Icon = Search,
}) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        <Icon size={28} />
      </div>
      <h4 className="empty-state-title">{title}</h4>
      <p className="empty-state-description">{description}</p>
      {actionLabel && onAction && (
        <button type="button" className="btn btn-primary btn-sm" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}
