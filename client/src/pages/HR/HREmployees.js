import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import Table from '../../components/Common/Table';
import './HREmployees.css';

const HREmployees = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchEmployees = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/employees?search=${search}`);
        setEmployees(res.data);
      } catch (error) {
        console.error('Error fetching employees', error);
      } finally {
        setLoading(false);
      }
    };
    const timer = setTimeout(fetchEmployees, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const columns = [
    { header: 'ID', field: 'employeeId' },
    { header: 'Name', field: 'name' },
    { header: 'Email', field: 'email' },
    { header: 'Department', field: 'department' },
    { header: 'Position', field: 'position' },
    { header: 'Role', field: 'role', render: (row) => <span style={{textTransform: 'capitalize'}}>{row.role}</span> }
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>Employees Directory</h2>
        <input 
          type="text" 
          placeholder="Search employees..." 
          className="search-input"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="table-wrapper">
        {loading ? <div>Loading...</div> : <Table columns={columns} data={employees} keyField="_id" />}
      </div>
    </div>
  );
};

export default HREmployees;
