import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Bell } from 'lucide-react';
import api from '../../utils/api';
import './Header.css';

const Header = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const fetchNotifications = async () => {
    try {
      if (!user) return;
      const res = await api.get('/notifications');
      setNotifications(res.data);
    } catch (err) {
      console.error('Failed to fetch notifications');
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // poll every 30 seconds
    return () => clearInterval(interval);
  }, [user]);

  const navigate = useNavigate();

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleNotificationClick = async (notification) => {
    // Mark as read if not read
    if (!notification.isRead) {
      try {
        await api.put(`/notifications/${notification._id}/read`);
        setNotifications(notifications.map(n => n._id === notification._id ? { ...n, isRead: true } : n));
      } catch (err) {
        console.error(err);
      }
    }

    // Redirect based on type
    if (notification.type === 'leave_request' && user?.role === 'hr') {
      navigate('/hr/leaves');
      setShowDropdown(false);
    } else if ((notification.type === 'leave_approved' || notification.type === 'leave_rejected') && user?.role === 'employee') {
      navigate('/employee/leaves');
      setShowDropdown(false);
    } else if (notification.type === 'project' && user?.role === 'employee') {
      navigate('/employee/projects');
      setShowDropdown(false);
    } else if (notification.type === 'project' && user?.role === 'hr') {
      navigate('/hr/projects');
      setShowDropdown(false);
    }
  };

  return (
    <header className="header">
      <div className="header-content">
        <h2 className="greeting">
          {getGreeting()}, {user?.name?.split(' ')[0] || 'User'} 👋
        </h2>
        
        <div className="header-right">
          <div className="notification-container">
            <button className="notification-btn" onClick={() => setShowDropdown(!showDropdown)}>
              <Bell size={20} />
              {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
            </button>
            
            {showDropdown && (
              <div className="notification-dropdown">
                <div className="notification-dropdown-header">
                  <h3>Notifications</h3>
                </div>
                <div className="notification-list">
                  {notifications.length === 0 ? (
                    <div className="notification-empty">No notifications</div>
                  ) : (
                    notifications.map(n => (
                      <div 
                        key={n._id} 
                        className={`notification-item ${!n.isRead ? 'unread' : ''}`}
                        onClick={() => handleNotificationClick(n)}
                      >
                        <div className="notification-title">{n.title}</div>
                        <div className="notification-msg">{n.message}</div>
                        <div className="notification-time">{new Date(n.createdAt).toLocaleString()}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="user-info">
            <div className="user-avatar" style={{ overflow: 'hidden' }}>
              {user?.photo ? (
                <img src={user.photo} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                user?.name?.charAt(0)?.toUpperCase() || 'U'
              )}
            </div>
            <div className="user-details">
              <span className="user-name">{user?.name}</span>
              <span className="user-role">{user?.position}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
