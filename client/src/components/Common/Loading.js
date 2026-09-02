import React from 'react';
import './Loading.css';

const Loading = ({ size = 24, color = 'var(--primary)' }) => {
  return (
    <div 
      className="loading-spinner"
      style={{ 
        width: size, 
        height: size, 
        borderColor: 'rgba(0, 0, 0, 0.1)',
        borderTopColor: color 
      }}
    />
  );
};

export default Loading;
