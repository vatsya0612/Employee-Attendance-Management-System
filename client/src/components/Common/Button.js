import React from 'react';
import Loading from './Loading';
import './Button.css';

const Button = ({ 
  children, 
  variant = 'primary', 
  type = 'button', 
  onClick, 
  disabled = false, 
  loading = false,
  className = '' 
}) => {
  return (
    <button
      type={type}
      className={`btn btn-${variant} ${className} ${loading ? 'btn-loading' : ''}`}
      onClick={onClick}
      disabled={disabled || loading}
    >
      {loading ? <Loading size={20} color="currentColor" /> : children}
    </button>
  );
};

export default Button;
