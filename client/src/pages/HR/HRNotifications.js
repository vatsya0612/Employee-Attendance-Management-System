import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import Button from '../../components/Common/Button';
import Toast from '../../components/Common/Toast';
import { Send, Users } from 'lucide-react';
import './HRNotifications.css';

const HRNotifications = () => {
  const [employees, setEmployees] = useState([]);
  const [formData, setFormData] = useState({
    recipient: 'all',
    type: 'announcement',
    title: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await api.get('/employees');
        setEmployees(res.data);
      } catch (err) {
        console.error('Failed to fetch employees');
      }
    };
    fetchEmployees();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.message) {
      setToast({ message: 'Title and Message are required', type: 'error' });
      return;
    }
    
    setLoading(true);
    try {
      await api.post('/notifications/send', formData);
      setToast({ message: 'Notification sent successfully!', type: 'success' });
      setFormData({ ...formData, title: '', message: '' });
    } catch (err) {
      setToast({ message: err.response?.data?.msg || 'Failed to send notification', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="notifications-page">
      <div className="page-header">
        <h2>Send Notification</h2>
        <p>Broadcast announcements to all employees or send a direct personal message.</p>
      </div>

      <div className="notification-form-card">
        <form onSubmit={handleSend}>
          <div className="form-group">
            <label>Recipient</label>
            <select 
              name="recipient" 
              value={formData.recipient} 
              onChange={(e) => {
                const val = e.target.value;
                setFormData({
                  ...formData,
                  recipient: val,
                  type: val === 'all' || val === 'employee' ? 'announcement' : 'personal'
                });
              }}
              required
            >
              <option value="all">Broadcast to All Employees</option>
              {employees.map(emp => (
                <option key={emp._id} value={emp._id}>{emp.name} ({emp.employeeId})</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Title</label>
            <input 
              type="text" 
              name="title"
              value={formData.title} 
              onChange={handleChange} 
              placeholder="e.g. Office Holiday Notice" 
              required 
            />
          </div>

          <div className="form-group">
            <label>Message</label>
            <textarea 
              name="message"
              value={formData.message} 
              onChange={handleChange} 
              placeholder="Write your announcement or message here..." 
              rows="5"
              required 
            />
          </div>

          <Button type="submit" variant="primary" loading={loading} className="send-btn">
            <Send size={16} style={{ marginRight: '8px' }} />
            Send Notification
          </Button>
        </form>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default HRNotifications;
