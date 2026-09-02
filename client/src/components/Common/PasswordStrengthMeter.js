import React from 'react';
import './PasswordStrengthMeter.css';

const PasswordStrengthMeter = ({ password }) => {
  const evaluatePassword = (pass) => {
    let score = 0;
    if (!pass) return { score: 0, label: '', color: '#ccc' };

    if (pass.length >= 6) score += 1;
    if (/[a-z]/.test(pass)) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/\d/.test(pass)) score += 1;
    if (/[\W_]/.test(pass)) score += 1;

    if (score < 3) return { score, label: 'Weak', color: '#ff4d4f' };
    if (score === 3 || score === 4) return { score, label: 'Moderate', color: '#faad14' };
    return { score, label: 'Strong', color: '#52c41a' };
  };

  const { score, label, color } = evaluatePassword(password);

  if (!password) return null;

  return (
    <div className="password-strength-container">
      <div className="strength-bars">
        <div className="strength-bar" style={{ backgroundColor: score >= 1 ? color : '#e0e0e0' }}></div>
        <div className="strength-bar" style={{ backgroundColor: score >= 3 ? color : '#e0e0e0' }}></div>
        <div className="strength-bar" style={{ backgroundColor: score >= 5 ? color : '#e0e0e0' }}></div>
      </div>
      <div className="strength-label" style={{ color }}>
        {label}
      </div>
      <ul className="strength-requirements">
        <li className={password.length >= 6 ? 'met' : 'unmet'}>At least 6 characters</li>
        <li className={/[A-Z]/.test(password) && /[a-z]/.test(password) ? 'met' : 'unmet'}>Uppercase & lowercase</li>
        <li className={/[\W_]/.test(password) ? 'met' : 'unmet'}>Special symbol (e.g. @)</li>
      </ul>
    </div>
  );
};

export default PasswordStrengthMeter;
