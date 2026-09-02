import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import StatCard from '../../components/Common/StatCard';
import Table from '../../components/Common/Table';
import Button from '../../components/Common/Button';
import StatusBadge from '../../components/Common/StatusBadge';
import Toast from '../../components/Common/Toast';
import { Clock, CalendarCheck, Umbrella, Activity } from 'lucide-react';
import './EmployeeDashboard.css';

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

const EmployeeDashboard = () => {
  const [stats, setStats] = useState({
    status: 'Absent',
    workingHours: '0h 0m',
    daysPresent: 0,
    leaveBalance: 0,
    avgWorkingTime: '0h 0m'
  });
  const [liveHours, setLiveHours] = useState('0h 0m');
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [recentAttendance, setRecentAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const fetchData = async () => {
    try {
      const [todayRes, myRes, profileRes] = await Promise.all([
        api.get('/attendance/today'),
        api.get('/attendance/my'),
        api.get('/auth/me')
      ]);

      const todayData = todayRes.data;
      setTodayAttendance(todayData);
      
      const allAttendance = myRes.data || [];
      setRecentAttendance(allAttendance.slice(0, 5));

      const validAttendances = allAttendance.filter(a => a.workingHours);
      const avgHours = validAttendances.length > 0 
        ? validAttendances.reduce((acc, a) => acc + a.workingHours, 0) / validAttendances.length 
        : 0;

      let initialLiveHours = '0h 0m';
      if (todayData?.workingHours) {
        initialLiveHours = `${Math.floor(todayData.workingHours)}h ${Math.floor((todayData.workingHours % 1) * 60)}m`;
      }

      setStats({
        status: todayData ? (todayData.status === 'late' ? 'Late' : 'Present') : 'Absent',
        workingHours: initialLiveHours,
        daysPresent: allAttendance.filter(a => a.status === 'present' || a.status === 'late').length,
        leaveBalance: profileRes.data?.leaveBalance || 15,
        avgWorkingTime: `${Math.floor(avgHours)}h ${Math.floor((avgHours % 1) * 60)}m`
      });
      setLiveHours(initialLiveHours);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let interval;
    if (todayAttendance?.checkIn && !todayAttendance?.checkOut) {
      interval = setInterval(() => {
        const checkInTime = new Date(todayAttendance.checkIn).getTime();
        const now = new Date().getTime();
        const diffMs = now - checkInTime;
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        const diffSecs = Math.floor((diffMs % (1000 * 60)) / 1000);
        setLiveHours(`${diffHours}h ${diffMins}m ${diffSecs}s`);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [todayAttendance]);

  useEffect(() => {
    fetchData();
  }, []);

  const handleCheckIn = async () => {
    setActionLoading(true);
    
    if (!navigator.geolocation) {
      setToast({ message: 'Geolocation is not supported by your browser', type: 'error' });
      setActionLoading(false);
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const dist = distanceMeters(latitude, longitude, officeLat, officeLng);
        
        if (dist > officeRadiusMeters) {
          setToast({ message: 'You are outside the office geofence (100m)', type: 'error' });
          setActionLoading(false);
          return;
        }

        try {
          await api.post('/attendance/checkin', { latitude, longitude });
          setToast({ message: 'Checked in successfully!', type: 'success' });
          fetchData();
        } catch (error) {
          setToast({ message: error.response?.data?.msg || 'Check in failed', type: 'error' });
        } finally {
          setActionLoading(false);
        }
      },
      (err) => {
        setToast({ message: 'Failed to get location: ' + err.message, type: 'error' });
        setActionLoading(false);
      }
    );
  };

  const handleCheckOut = async () => {
    setActionLoading(true);
    try {
      await api.post('/attendance/checkout');
      setToast({ message: 'Checked out successfully!', type: 'success' });
      fetchData();
    } catch (error) {
      setToast({ message: error.response?.data?.msg || 'Check out failed', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const columns = [
    { header: 'Date', field: 'date', render: (row) => new Date(row.date).toLocaleDateString() },
    { header: 'Check In', field: 'checkIn', render: (row) => row.checkIn ? new Date(row.checkIn).toLocaleTimeString() : '-' },
    { header: 'Check Out', field: 'checkOut', render: (row) => row.checkOut ? new Date(row.checkOut).toLocaleTimeString() : '-' },
    { header: 'Status', field: 'status', render: (row) => <StatusBadge status={row.status} /> }
  ];

  if (loading) return <div>Loading...</div>;

  return (
    <div className="dashboard-container">
      <div className="stats-grid">
        <StatCard 
          icon={<Activity size={24} />} 
          title="Today's Status" 
          value={stats.status} 
          variant={stats.status === 'Present' ? 'success' : 'warning'} 
        />
        <StatCard 
          icon={<Clock size={24} />} 
          title="Working Hours" 
          value={liveHours} 
          variant="primary" 
        />
        <StatCard 
          icon={<Clock size={24} />} 
          title="Avg Working Time" 
          value={stats.avgWorkingTime} 
          variant="primary" 
        />
        <StatCard 
          icon={<CalendarCheck size={24} />} 
          title="Days Present" 
          value={stats.daysPresent} 
          variant="info" 
        />
        <StatCard 
          icon={<Umbrella size={24} />} 
          title="Leave Balance" 
          value={stats.leaveBalance} 
          variant="warning" 
        />
      </div>

      <div className="dashboard-content">
        <div className="action-card">
          <h3>Quick Action</h3>
          <p className="action-desc">Record your attendance for today</p>
          
          <div className="action-times">
            <div className="time-block">
              <span className="time-label">Check In Time</span>
              <span className="time-value">
                {todayAttendance?.checkIn ? new Date(todayAttendance.checkIn).toLocaleTimeString() : '--:--'}
              </span>
            </div>
            <div className="time-block">
              <span className="time-label">Check Out Time</span>
              <span className="time-value">
                {todayAttendance?.checkOut ? new Date(todayAttendance.checkOut).toLocaleTimeString() : '--:--'}
              </span>
            </div>
          </div>

          <div className="action-buttons">
            {!todayAttendance?.checkIn ? (
              <Button 
                variant="primary" 
                onClick={handleCheckIn} 
                loading={actionLoading}
                className="action-btn"
              >
                Check In
              </Button>
            ) : !todayAttendance?.checkOut ? (
              <Button 
                variant="warning" 
                onClick={handleCheckOut} 
                loading={actionLoading}
                className="action-btn"
              >
                Check Out
              </Button>
            ) : (
              <Button disabled variant="success" className="action-btn">
                Completed for Today
              </Button>
            )}
          </div>
        </div>

        <div className="recent-table-card">
          <div className="card-header">
            <h3>Recent Attendance</h3>
          </div>
          <Table columns={columns} data={recentAttendance} keyField="_id" />
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default EmployeeDashboard;
