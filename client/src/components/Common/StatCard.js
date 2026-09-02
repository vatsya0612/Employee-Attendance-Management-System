import React from 'react';
import './StatCard.css';

const StatCard = ({ icon, title, value, variant = 'primary' }) => {
  return (
    <div className="stat-card">
      <div className={`stat-icon stat-icon-${variant}`}>
        {icon}
      </div>
      <div className="stat-info">
        <p className="stat-title">{title}</p>
        <h3 className="stat-value">{value}</h3>
      </div>
    </div>
  );
};

export default StatCard;
