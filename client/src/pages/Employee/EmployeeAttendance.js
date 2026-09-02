import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import Table from '../../components/Common/Table';
import StatusBadge from '../../components/Common/StatusBadge';
import EmptyState from '../../components/Common/EmptyState';
import { Calendar } from 'lucide-react';
import './EmployeeAttendance.css';


// Haversine distance helper (client side)
function distanceMeters(lat1, lng1, lat2, lng2) {
  const toRad = (value) => (value * Math.PI) / 180;
  const R = 6371000; // meters
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const radLat1 = toRad(lat1);
  const radLat2 = toRad(lat2);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(radLat1) * Math.cos(radLat2) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const officeLat = parseFloat(process.env.REACT_APP_OFFICE_LAT);
const officeLng = parseFloat(process.env.REACT_APP_OFFICE_LNG);
const officeRadiusMeters = parseInt(process.env.REACT_APP_OFFICE_RADIUS_METERS, 10) || 100;

const EmployeeAttendance = () => {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: ''
  });
  const [position, setPosition] = useState(null);
  const [checkInError, setCheckInError] = useState('');

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      let url = '/attendance/my';
      if (filters.startDate && filters.endDate) {
        url += `?startDate=${filters.startDate}&endDate=${filters.endDate}`;
      }
      const res = await api.get(url);
      setAttendance(res.data);
    } catch (error) {
      console.error('Error fetching attendance', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [filters]);

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const requestLocation = () => {
    setCheckInError('');
    if (!navigator.geolocation) {
      setCheckInError('Geolocation is not supported by your browser');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const dist = distanceMeters(latitude, longitude, officeLat, officeLng);
        if (dist > officeRadiusMeters) {
          setCheckInError('You are outside the office geofence (100 m)');
          setPosition(null);
        } else {
          setPosition({ latitude, longitude });
        }
      },
      (err) => {
        setCheckInError('Failed to get location: ' + err.message);
      }
    );
  };

  const handleCheckIn = async () => {
    if (!position) {
      setCheckInError('Location not available');
      return;
    }
    try {
      await api.post('/attendance/checkin', {
        latitude: position.latitude,
        longitude: position.longitude
      });
      fetchAttendance();
    } catch (err) {
      console.error(err);
      setCheckInError(err.response?.data?.msg || 'Check‑in failed');
    }
  };

  const columns = [
    { header: 'Date', field: 'date', render: (row) => new Date(row.date).toLocaleDateString() },
    { header: 'Check In', field: 'checkIn', render: (row) => row.checkIn ? new Date(row.checkIn).toLocaleTimeString() : '-' },
    { header: 'Check Out', field: 'checkOut', render: (row) => row.checkOut ? new Date(row.checkOut).toLocaleTimeString() : '-' },
    { header: 'Working Hours', field: 'workingHours', render: (row) => row.workingHours ? `${row.workingHours.toFixed(1)} hrs` : '-' },
    { header: 'Status', field: 'status', render: (row) => <StatusBadge status={row.status} /> }
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>Attendance History</h2>
        <div className="filters">
          <input
            type="date"
            name="startDate"
            value={filters.startDate}
            onChange={handleFilterChange}
            className="filter-input"
          />
          <span className="filter-sep">to</span>
          <input
            type="date"
            name="endDate"
            value={filters.endDate}
            onChange={handleFilterChange}
            className="filter-input"
          />
        </div>
        <div className="checkin-section">
          <button onClick={requestLocation}>Get Location</button>
          <button onClick={handleCheckIn} disabled={!position}>Check In</button>
          {checkInError && <div className="error-msg">{checkInError}</div>}
        </div>
      </div>

      <div className="table-wrapper">
        {loading ? (
          <div>Loading...</div>
        ) : attendance.length > 0 ? (
          <Table columns={columns} data={attendance} keyField="_id" />
        ) : (
          <EmptyState
            icon={<Calendar size={32} />}
            title="No attendance records found"
            description="There are no attendance records for the selected date range."
          />
        )}
      </div>
    </div>
  );
};

export default EmployeeAttendance;
