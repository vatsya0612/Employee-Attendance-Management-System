import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import StatCard from '../../components/Common/StatCard';
import Table from '../../components/Common/Table';
import StatusBadge from '../../components/Common/StatusBadge';
import './HRDashboard.css';
import { Users, UserCheck, Clock, UserX } from 'lucide-react';

const HRDashboard = () => {
  const [stats, setStats] = useState({
    total: 0,
    present: 0,
    late: 0,
    absent: 0
  });
  const [recentAttendance, setRecentAttendance] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, attendanceRes] = await Promise.all([
          api.get('/attendance/stats'),
          api.get('/attendance/all?date=' + new Date().toISOString().split('T')[0])
        ]);
        
        setStats(statsRes.data || { total: 0, present: 0, late: 0, absent: 0 });
        setRecentAttendance((attendanceRes.data || []).slice(0, 5));
      } catch (error) {
        console.error('Error fetching HR dashboard data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const columns = [
    { header: 'Employee', field: 'employee', render: (row) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
          {row.employee?.name?.charAt(0) || 'U'}
        </div>
        <div>
          <div style={{ fontWeight: '600' }}>{row.employee?.name || 'Unknown'}</div>
          <div style={{ fontSize: '12px', color: '#64748b' }}>{row.employee?.employeeId || '-'}</div>
        </div>
      </div>
    ) },
    { header: 'Department', field: 'dept', render: (row) => row.employee?.department || '-' },
    { header: 'Check In', field: 'checkIn', render: (row) => row.checkIn ? new Date(row.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-' },
    { header: 'Check Out', field: 'checkOut', render: (row) => row.checkOut ? new Date(row.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-' },
    { header: 'Working Hours', field: 'workingHours', render: (row) => row.workingHours ? `${Math.floor(row.workingHours)}h ${Math.floor((row.workingHours % 1) * 60)}m` : '-' },
    { header: 'Status', field: 'status', render: (row) => <StatusBadge status={row.status} /> }
  ];

  if (loading) return <div>Loading...</div>;

  return (
    <div className="dashboard-container">
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b' }}>HR Overview</h2>
        <p style={{ color: '#64748b' }}>Manage employee attendance and track daily statistics.</p>
      </div>
      
      <div className="stats-grid">
        <StatCard icon={<Users size={24} />} title="Total Employees" value={stats.total} variant="primary" />
        <StatCard icon={<UserCheck size={24} />} title="Present Today" value={stats.present} variant="success" />
        <StatCard icon={<Clock size={24} />} title="Late Today" value={stats.late} variant="warning" />
        <StatCard icon={<UserX size={24} />} title="Absent Today" value={stats.absent} variant="danger" />
      </div>

      <div className="recent-table-card" style={{ marginTop: '32px', backgroundColor: '#fff', borderRadius: '8px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0' }}>
        <div className="card-header" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600' }}>Today's Live Attendance</h3>
          <span style={{ fontSize: '14px', color: '#64748b' }}>{new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
        <Table columns={columns} data={recentAttendance} keyField="_id" />
      </div>
    </div>
  );
};

export default HRDashboard;
