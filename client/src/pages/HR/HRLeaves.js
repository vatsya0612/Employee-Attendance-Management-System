import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import Table from '../../components/Common/Table';
import StatusBadge from '../../components/Common/StatusBadge';
import Button from '../../components/Common/Button';
import Toast from '../../components/Common/Toast';
import './HRLeaves.css';

const HRLeaves = () => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/leaves/all${statusFilter ? `?status=${statusFilter}` : ''}`);
      setLeaves(res.data);
    } catch (error) {
      console.error('Error fetching leaves', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, [statusFilter]);

  const handleAction = async (id, action) => {
    try {
      await api.put(`/leaves/${id}/${action}`);
      setToast({ message: `Leave ${action}d successfully`, type: 'success' });
      fetchLeaves();
    } catch (error) {
      setToast({ message: `Failed to ${action} leave`, type: 'error' });
    }
  };

  const columns = [
    { header: 'Employee', field: 'employee', render: (row) => row.employee?.name },
    { header: 'Type', field: 'leaveType' },
    { header: 'Dates', field: 'dates', render: (row) => `${new Date(row.startDate).toLocaleDateString()} - ${new Date(row.endDate).toLocaleDateString()}` },
    { header: 'Reason', field: 'reason' },
    { header: 'Status', field: 'status', render: (row) => <StatusBadge status={row.status} /> },
    { 
      header: 'Actions', 
      field: 'actions', 
      render: (row) => row.status === 'pending' ? (
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button variant="success" onClick={() => handleAction(row._id, 'approve')}>Approve</Button>
          <Button variant="danger" onClick={() => handleAction(row._id, 'reject')}>Reject</Button>
        </div>
      ) : '-'
    }
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>Leave Requests</h2>
        <select 
          className="filter-input"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <div className="table-wrapper">
        {loading ? <div>Loading...</div> : <Table columns={columns} data={leaves} keyField="_id" />}
      </div>
      
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default HRLeaves;
