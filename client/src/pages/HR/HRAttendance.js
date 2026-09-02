import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import Table from '../../components/Common/Table';
import StatusBadge from '../../components/Common/StatusBadge';
import './HRAttendance.css';

const HRAttendance = () => {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    const fetchAttendance = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/attendance/all?date=${date}`);
        setAttendance(res.data);
      } catch (error) {
        console.error('Error fetching attendance', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAttendance();
  }, [date]);

  const columns = [
    { header: 'Employee', field: 'name', render: (row) => row.employee?.name },
    { header: 'Check In', field: 'checkIn', render: (row) => row.checkIn ? new Date(row.checkIn).toLocaleTimeString() : '-' },
    { header: 'Check Out', field: 'checkOut', render: (row) => row.checkOut ? new Date(row.checkOut).toLocaleTimeString() : '-' },
    { header: 'Working Hours', field: 'workingHours', render: (row) => row.workingHours ? `${row.workingHours.toFixed(1)} hrs` : '-' },
    { header: 'Status', field: 'status', render: (row) => <StatusBadge status={row.status} /> }
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>Company Attendance</h2>
        <input 
          type="date" 
          className="filter-input"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>

      <div className="table-wrapper">
        {loading ? <div>Loading...</div> : <Table columns={columns} data={attendance} keyField="_id" />}
      </div>
    </div>
  );
};

export default HRAttendance;
