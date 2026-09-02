import React from 'react';
import './StatusBadge.css';

const StatusBadge = ({ status }) => {
  const getVariant = (s) => {
    switch (s?.toLowerCase()) {
      case 'present':
      case 'approved':
        return 'success';
      case 'late':
      case 'pending':
        return 'warning';
      case 'absent':
      case 'rejected':
        return 'danger';
      case 'on-leave':
        return 'info';
      default:
        return 'default';
    }
  };

  const variant = getVariant(status);
  
  return (
    <span className={`status-badge status-badge-${variant}`}>
      {status}
    </span>
  );
};

export default StatusBadge;
