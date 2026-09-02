import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/Common/Button';
import Toast from '../../components/Common/Toast';
import PasswordStrengthMeter from '../../components/Common/PasswordStrengthMeter';
import './Register.css';
import './Login.css';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    employeeId: '',
    department: 'Engineering',
    position: ''
  });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[\W_]).{6,}$/;
    if (!passwordRegex.test(formData.password)) {
      setToast({
        message: 'Please ensure your password meets all requirements.',
        type: 'error'
      });
      return;
    }

    setLoading(true);
    try {
      const res = await register(formData);
      setToast({ message: res.msg || 'Registration successful! Check your email for OTP.', type: 'success' });
      setTimeout(() => navigate(`/verify-otp?email=${encodeURIComponent(formData.email)}`), 1500);
    } catch (error) {
      setToast({
        message: error.response?.data?.msg || 'Registration failed.',
        type: 'error'
      });
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card register-card">
        <div className="auth-header">
          <h1>AttendEase</h1>
          <p>Create your employee account</p>
        </div>
        
        <form onSubmit={handleSubmit} className="auth-form register-form">
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="John Doe"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@company.com"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
              minLength="6"
            />
            <PasswordStrengthMeter password={formData.password} />
          </div>

          <div className="form-group">
            <label htmlFor="employeeId">Employee ID</label>
            <input
              type="text"
              id="employeeId"
              name="employeeId"
              value={formData.employeeId}
              onChange={handleChange}
              placeholder="EMP-001"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="department">Department</label>
            <select
              id="department"
              name="department"
              value={formData.department}
              onChange={handleChange}
              required
            >
              <option value="Engineering">Engineering</option>
              <option value="HR">HR</option>
              <option value="Finance">Finance</option>
              <option value="Marketing">Marketing</option>
              <option value="Operations">Operations</option>
              <option value="Design">Design</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="position">Position</label>
            <input
              type="text"
              id="position"
              name="position"
              value={formData.position}
              onChange={handleChange}
              placeholder="Software Engineer"
              required
            />
          </div>
          
          <Button 
            type="submit" 
            variant="primary" 
            className="w-full mt-4"
            loading={loading}
          >
            Register
          </Button>
        </form>
        
        <div className="auth-footer">
          <p>Already have an account? <Link to="/login">Sign in</Link></p>
        </div>
      </div>
      
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}
    </div>
  );
};

export default Register;
