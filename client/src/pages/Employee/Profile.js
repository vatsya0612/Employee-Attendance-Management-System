import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { User, Mail, Briefcase, Hash, Building, Edit2, Camera, Key } from 'lucide-react';
import api from '../../utils/api';
import Button from '../../components/Common/Button';
import Toast from '../../components/Common/Toast';
import PasswordStrengthMeter from '../../components/Common/PasswordStrengthMeter';
import './Profile.css';

const Profile = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editPhoto, setEditPhoto] = useState(user?.photo || null);
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  if (!user) return null;

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setToast({ message: 'Image size should be less than 2MB', type: 'error' });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditPhoto(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      const res = await api.put('/auth/update-profile', {
        name: editName,
        photo: editPhoto
      });
      setToast({ message: 'Profile updated successfully', type: 'success' });
      // The context will need a refresh or we just update local state. For now, a reload works or user will see changes on next context load.
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      setToast({ message: err.response?.data?.msg || 'Failed to update profile', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setToast({ message: 'New passwords do not match', type: 'error' });
      return;
    }
    
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[\W_]).{6,}$/;
    if (!passwordRegex.test(passwordData.newPassword)) {
      setToast({ message: 'Please ensure your new password meets all requirements.', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      await api.put('/auth/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      setToast({ message: 'Password changed successfully', type: 'success' });
      setIsChangingPassword(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setToast({ message: err.response?.data?.msg || 'Failed to change password', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-container">
      <div className="profile-header-card">
        <div className="profile-avatar-large">
          {editPhoto || user.photo ? (
            <img src={editPhoto || user.photo} alt="Profile" className="profile-photo-img" />
          ) : (
            <span>{user.name.charAt(0).toUpperCase()}</span>
          )}
          
          {isEditing && (
            <label className="photo-upload-btn">
              <Camera size={16} />
              <input type="file" accept="image/*" onChange={handlePhotoChange} hidden />
            </label>
          )}
        </div>
        <div className="profile-title">
          {isEditing ? (
            <input 
              type="text" 
              className="profile-name-edit"
              value={editName} 
              onChange={(e) => setEditName(e.target.value)} 
            />
          ) : (
            <h2>{user.name}</h2>
          )}
          <p>{user.position}</p>
        </div>
        
        <div className="profile-actions">
          {isEditing ? (
            <>
              <Button variant="secondary" onClick={() => { setIsEditing(false); setEditName(user.name); setEditPhoto(user.photo); }}>Cancel</Button>
              <Button variant="primary" onClick={handleSaveProfile} loading={loading}>Save</Button>
            </>
          ) : (
            <Button variant="secondary" onClick={() => setIsEditing(true)}>
              <Edit2 size={16} style={{ marginRight: '8px' }} /> Edit Profile
            </Button>
          )}
        </div>
      </div>

      <div className="profile-details-card">
        <div className="card-header-flex">
          <h3>Personal Information</h3>
          {!isChangingPassword && (
            <Button variant="outline" onClick={() => setIsChangingPassword(true)}>
              <Key size={16} style={{ marginRight: '8px' }} /> Change Password
            </Button>
          )}
        </div>
        
        {isChangingPassword ? (
          <form className="change-password-form" onSubmit={handleChangePassword}>
            <h4>Change Password</h4>
            <div className="form-group">
              <label>Current Password</label>
              <input 
                type="password" 
                value={passwordData.currentPassword} 
                onChange={e => setPasswordData({...passwordData, currentPassword: e.target.value})} 
                required 
              />
            </div>
            <div className="form-group">
              <label>New Password</label>
              <input 
                type="password" 
                value={passwordData.newPassword} 
                onChange={e => setPasswordData({...passwordData, newPassword: e.target.value})} 
                required 
              />
              <PasswordStrengthMeter password={passwordData.newPassword} />
            </div>
            <div className="form-group">
              <label>Confirm New Password</label>
              <input 
                type="password" 
                value={passwordData.confirmPassword} 
                onChange={e => setPasswordData({...passwordData, confirmPassword: e.target.value})} 
                required 
              />
            </div>
            <div className="password-actions">
              <Button variant="secondary" type="button" onClick={() => setIsChangingPassword(false)}>Cancel</Button>
              <Button variant="primary" type="submit" loading={loading}>Update Password</Button>
            </div>
          </form>
        ) : (
          <div className="info-grid">
            <div className="info-item">
              <div className="info-icon"><User size={18} /></div>
              <div className="info-content">
                <span className="info-label">Full Name</span>
                <span className="info-value">{user.name}</span>
              </div>
            </div>
            
            <div className="info-item">
              <div className="info-icon"><Mail size={18} /></div>
              <div className="info-content">
                <span className="info-label">Email Address</span>
                <span className="info-value">{user.email}</span>
              </div>
            </div>

            <div className="info-item">
              <div className="info-icon"><Hash size={18} /></div>
              <div className="info-content">
                <span className="info-label">Employee ID</span>
                <span className="info-value">{user.employeeId}</span>
              </div>
            </div>

            <div className="info-item">
              <div className="info-icon"><Building size={18} /></div>
              <div className="info-content">
                <span className="info-label">Department</span>
                <span className="info-value">{user.department}</span>
              </div>
            </div>

            <div className="info-item">
              <div className="info-icon"><Briefcase size={18} /></div>
              <div className="info-content">
                <span className="info-label">Role</span>
                <span className="info-value" style={{ textTransform: 'capitalize' }}>{user.role}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
};

export default Profile;
