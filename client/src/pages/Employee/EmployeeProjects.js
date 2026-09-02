import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import Button from '../../components/Common/Button';
import Toast from '../../components/Common/Toast';
import '../HR/HRProjects.css'; // Reusing some common classes

const EmployeeProjects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [updateId, setUpdateId] = useState(null);
  const [updateData, setUpdateData] = useState({ status: '', progress: 0 });

  const fetchProjects = async () => {
    try {
      const res = await api.get('/projects');
      setProjects(res.data);
    } catch (err) {
      console.error('Failed to fetch projects data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/projects/${updateId}`, updateData);
      setToast({ message: 'Project updated successfully', type: 'success' });
      setUpdateId(null);
      fetchProjects();
      
      // Notify HR about project progress
      const projectTitle = projects.find(p => p._id === updateId)?.title;
      await api.post('/notifications/send', {
        recipient: 'hr', // not an exact field, but we can do it via 'all hr' if backend supported it. Wait, the backend currently accepts 'all' or 'employee' or specific user ID. Let's omit notifications to HR for now or use the assignedBy ID.
        // Wait, I will use the assignedBy ID!
        recipient: projects.find(p => p._id === updateId)?.assignedBy?._id,
        title: 'Project Updated',
        message: `Progress on ${projectTitle} has been updated to ${updateData.progress}%.`,
        type: 'project'
      });
      
    } catch (err) {
      setToast({ message: err.response?.data?.msg || 'Failed to update project', type: 'error' });
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="projects-page">
      <div className="page-header">
        <h2>My Assigned Projects</h2>
        <p>View your tasks and update your working progress.</p>
      </div>

      <div className="projects-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
        {projects.length === 0 ? (
          <p>No projects assigned to you yet.</p>
        ) : (
          projects.map(proj => (
            <div key={proj._id} className="projects-table-card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>{proj.title}</h3>
                <span className={`status-badge status-${proj.status.replace(' ', '-').toLowerCase()}`}>
                  {proj.status}
                </span>
              </div>
              <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '16px' }}>{proj.description}</p>
              
              <div style={{ marginBottom: '16px', fontSize: '13px' }}>
                <strong>Assigned By:</strong> {proj.assignedBy?.name || 'HR'} <br/>
                <strong>Due Date:</strong> {proj.dueDate ? new Date(proj.dueDate).toLocaleDateString() : 'None'}
              </div>

              <div className="progress-container" style={{ marginBottom: '16px', width: '100%' }}>
                <div className="progress-bar-bg" style={{ width: '100%' }}>
                  <div className="progress-bar-fill" style={{ width: `${proj.progress}%` }}></div>
                </div>
                <span className="progress-text">{proj.progress}%</span>
              </div>

              <Button variant="outline" onClick={() => {
                setUpdateId(proj._id);
                setUpdateData({ status: proj.status, progress: proj.progress });
              }} style={{ width: '100%' }}>
                Update Progress
              </Button>
            </div>
          ))
        )}
      </div>

      {updateId && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ marginBottom: '20px' }}>Update Project</h3>
            <form onSubmit={handleUpdate}>
              <div className="form-group">
                <label>Status</label>
                <select 
                  value={updateData.status} 
                  onChange={(e) => setUpdateData({ ...updateData, status: e.target.value })}
                >
                  <option value="Not Started">Not Started</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
              
              <div className="form-group">
                <label>Progress ({updateData.progress}%)</label>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={updateData.progress} 
                  onChange={(e) => setUpdateData({ ...updateData, progress: parseInt(e.target.value) })}
                  style={{ width: '100%', cursor: 'pointer' }}
                />
              </div>
              
              <div className="modal-actions" style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <Button type="button" variant="secondary" onClick={() => setUpdateId(null)}>Cancel</Button>
                <Button type="submit" variant="primary">Save Updates</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default EmployeeProjects;
