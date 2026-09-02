import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/Common/Button';
import Toast from '../../components/Common/Toast';
import './VerifyOtp.css';
import './Login.css';

const VerifyOtp = () => {
  const [searchParams] = useSearchParams();
  const emailParam = searchParams.get('email') || '';
  
  const [email, setEmail] = useState(emailParam);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [toast, setToast] = useState(null);

  const { verifyOTP, resendOTP } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [emailParam]);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!otp || otp.length < 6) {
      setToast({ message: 'Please enter the full 6-digit verification code.', type: 'error' });
      return;
    }
    
    setLoading(true);
    try {
      const data = await verifyOTP(email, otp);
      setToast({ message: data.msg || 'Email verified successfully!', type: 'success' });
      setTimeout(() => {
        if (data.user) {
          if (data.user.role === 'hr') {
            navigate('/hr/dashboard');
          } else {
            navigate('/employee/dashboard');
          }
        } else {
          navigate('/login');
        }
      }, 1500);
    } catch (error) {
      setToast({
        message: error.response?.data?.msg || 'Verification failed. Please try again.',
        type: 'error'
      });
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      setToast({ message: 'Please enter your email address.', type: 'error' });
      return;
    }

    setResending(true);
    try {
      const data = await resendOTP(email);
      setToast({ message: data.msg || 'New verification code sent!', type: 'success' });
    } catch (error) {
      setToast({
        message: error.response?.data?.msg || 'Failed to resend code. Please try again.',
        type: 'error'
      });
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>AttendEase</h1>
          <p>Verify Your Gmail Address</p>
        </div>

        <div className="otp-info-box">
          <p>We've sent a 6-digit verification code to your Gmail address. Please check your inbox (and spam folder) and enter it below.</p>
        </div>

        <form onSubmit={handleVerify} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="otp">6-Digit Verification Code</label>
            <input
              type="text"
              id="otp"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="123456"
              maxLength="6"
              className="otp-input"
              required
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            loading={loading}
          >
            Verify Gmail
          </Button>
        </form>

        <div className="otp-actions">
          <button
            type="button"
            className="btn-link"
            onClick={handleResend}
            disabled={resending}
          >
            {resending ? 'Sending...' : "Didn't receive the code? Resend Code"}
          </button>
        </div>

        <div className="auth-footer">
          <p>Back to <Link to="/login">Sign in</Link></p>
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

export default VerifyOtp;
