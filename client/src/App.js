import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './utils/ProtectedRoute';
import Layout from './components/Layout/Layout';

// Auth Pages
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import VerifyOtp from './pages/Auth/VerifyOtp';

// Employee Pages
import EmployeeDashboard from './pages/Employee/EmployeeDashboard';
import EmployeeAttendance from './pages/Employee/EmployeeAttendance';
import EmployeeLeaves from './pages/Employee/EmployeeLeaves';
import EmployeeProjects from './pages/Employee/EmployeeProjects';
import Profile from './pages/Employee/Profile';

// HR Pages
import HRDashboard from './pages/HR/HRDashboard';
import HREmployees from './pages/HR/HREmployees';
import HRAttendance from './pages/HR/HRAttendance';
import HRLeaves from './pages/HR/HRLeaves';
import HRNotifications from './pages/HR/HRNotifications';
import HRProjects from './pages/HR/HRProjects';

import Loading from './components/Common/Loading';
import './App.css';

function App() {
  const { loading } = useAuth();

  if (loading) {
    return <div className="app-loading"><Loading /></div>;
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-otp" element={<VerifyOtp />} />
        
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        {/* Employee Routes */}
        <Route path="/employee" element={<ProtectedRoute role="employee"><Layout /></ProtectedRoute>}>
          <Route path="dashboard" element={<EmployeeDashboard />} />
          <Route path="projects" element={<EmployeeProjects />} />
          <Route path="attendance" element={<EmployeeAttendance />} />
          <Route path="leaves" element={<EmployeeLeaves />} />
          <Route path="profile" element={<Profile />} />
          <Route index element={<Navigate to="dashboard" replace />} />
        </Route>

        {/* HR Routes */}
        <Route path="/hr" element={<ProtectedRoute role="hr"><Layout /></ProtectedRoute>}>
          <Route path="dashboard" element={<HRDashboard />} />
          <Route path="notifications" element={<HRNotifications />} />
          <Route path="projects" element={<HRProjects />} />
          <Route path="employees" element={<HREmployees />} />
          <Route path="attendance" element={<HRAttendance />} />
          <Route path="leaves" element={<HRLeaves />} />
          <Route path="profile" element={<Profile />} />
          <Route index element={<Navigate to="dashboard" replace />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
