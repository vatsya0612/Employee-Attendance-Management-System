import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import Button from '../../components/Common/Button';
import Table from '../../components/Common/Table';
import Toast from '../../components/Common/Toast';
import { Briefcase, Plus } from 'lucide-react';
import './HRProjects.css';

const HRProjects = () => {
  const [projects, setProjects] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assignedTo: '',
    dueDate: ''
  });

  const fetchData = async () => {
    try {
      const [projRes, empRes] = await Promise.all([
        api.get('/projects'),
        api.get('/employees')
      ]);
      setProjects(projRes.data);
      setEmployees(empRes.data);
    } catch (err) {
      console.error('Failed to fetch projects data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/projects', formData);
      setToast({ message: 'Project assigned successfully', type: 'success' });
      setShowModal(false);
      setFormData({ title: '', description: '', assignedTo: '', dueDate: '' });
      fetchData();
      
      // Also send a notification to the user
      await api.post('/notifications/send', {
        recipient: formData.assignedTo,
        title: 'New Project Assigned',
        message: `You have been assigned a new project: ${formData.title}`,
        type: 'project'
      });
    } catch (err) {
      setToast({ message: err.response?.data?.msg || 'Failed to assign project', type: 'error' });
    }
  };

  const columns = [
    { header: 'Project Title', field: 'title', render: (row) => <div className="font-semibold">{row.title}</div> },
    { header: 'Assigned To', field: 'assignedTo', render: (row) => row.assignedTo?.name || 'Unknown' },
    { header: 'Status', field: 'status', render: (row) => (
      <span className={`status-badge status-${row.status.replace(' ', '-').toLowerCase()}`}>
        {row.status}
      </span>
    )},
    { header: 'Progress', field: 'progress', render: (row) => (
      <div className="progress-container">
        <div className="progress-bar-bg">
          <div className="progress-bar-fill" style={{ width: `${row.progress}%` }}></div>
        </div>
        <span className="progress-text">{row.progress}%</span>
      </div>
    )},
    { header: 'Due Date', field: 'dueDate', render: (row) => row.dueDate ? new Date(row.dueDate).toLocaleDateString() : '-' }
  ];

  if (loading) return <div>Loading...</div>;

  return (
    <div className="projects-page">
      <div className="page-header flex justify-between align-center">
        <div>
          <h2>Project Management</h2>
          <p>Assign tasks and monitor progress across the team.</p>
        </div>
        <Button variant="primary" onClick={() => setShowModal(true)}>
          <Plus size={16} style={{ marginRight: '8px' }} />
          Assign Project
        </Button>
      </div>

      <div className="projects-table-card">
        <Table columns={columns} data={projects} keyField="_id" />
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ marginBottom: '20px' }}>Assign New Project</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Project Title</label>
                <input type="text" name="title" value={formData.title} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea name="description" value={formData.description} onChange={handleChange} rows="3" required />
              </div>
              <div className="form-group">
                <label>Assign To</label>
                <select name="assignedTo" value={formData.assignedTo} onChange={handleChange} required>
                  <option value="">Select Employee</option>
                  {employees.map(emp => (
                    <option key={emp._id} value={emp._id}>{emp.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Due Date</label>
                <input type="date" name="dueDate" value={formData.dueDate} onChange={handleChange} required />
              </div>
              
              <div className="modal-actions" style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
                <Button type="submit" variant="primary">Assign Project</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default HRProjects;
