import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import Table from '../../components/Common/Table';
import StatusBadge from '../../components/Common/StatusBadge';
import Button from '../../components/Common/Button';
import Modal from '../../components/Common/Modal';
import Toast from '../../components/Common/Toast';
import './EmployeeLeaves.css';

const EmployeeLeaves = () => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [formData, setFormData] = useState({
    leaveType: 'casual',
    startDate: '',
    endDate: '',
    reason: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchLeaves = async () => {
    try {
      const res = await api.get('/leaves/my');
      setLeaves(res.data);
    } catch (error) {
      console.error('Error fetching leaves', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/leaves', formData);
      setToast({ message: 'Leave request submitted successfully', type: 'success' });
      setIsModalOpen(false);
      fetchLeaves();
      setFormData({ leaveType: 'casual', startDate: '', endDate: '', reason: '' });
    } catch (error) {
      setToast({ message: error.response?.data?.msg || 'Failed to submit request', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    { header: 'Type', field: 'leaveType' },
    { header: 'Start Date', field: 'startDate', render: (row) => new Date(row.startDate).toLocaleDateString() },
    { header: 'End Date', field: 'endDate', render: (row) => new Date(row.endDate).toLocaleDateString() },
    { header: 'Reason', field: 'reason' },
    { header: 'Status', field: 'status', render: (row) => <StatusBadge status={row.status} /> }
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>Leave Management</h2>
        <Button variant="primary" onClick={() => setIsModalOpen(true)}>
          Apply for Leave
        </Button>
      </div>

      <div className="table-wrapper">
        {loading ? <div>Loading...</div> : <Table columns={columns} data={leaves} keyField="_id" />}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Apply for Leave">
        <form onSubmit={handleSubmit} className="leave-form">
          <div className="form-group">
            <label>Leave Type</label>
            <select 
              value={formData.leaveType} 
              onChange={(e) => setFormData({...formData, leaveType: e.target.value})}
              required
            >
              <option value="casual">Casual Leave</option>
              <option value="sick">Sick Leave</option>
              <option value="personal">Personal Leave</option>
            </select>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label>Start Date</label>
              <input 
                type="date" 
                value={formData.startDate}
                onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                required 
              />
            </div>
            <div className="form-group">
              <label>End Date</label>
              <input 
                type="date" 
                value={formData.endDate}
                onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                required 
              />
            </div>
          </div>

          <div className="form-group">
            <label>Reason</label>
            <textarea 
              rows="4" 
              value={formData.reason}
              onChange={(e) => setFormData({...formData, reason: e.target.value})}
              required
              placeholder="Please provide a reason for your leave..."
            />
          </div>

          <div className="form-actions">
            <Button variant="outline" onClick={() => setIsModalOpen(false)} type="button">
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={submitting}>
              Submit Request
            </Button>
          </div>
        </form>
      </Modal>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default EmployeeLeaves;
