import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, Calendar, FileText, Users, User, LogOut, Briefcase, Bell } from 'lucide-react';
import './Sidebar.css';

const Sidebar = () => {
  const { user, logout } = useAuth();

  const employeeLinks = [
    { to: '/employee/dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { to: '/employee/projects', icon: <Briefcase size={20} />, label: 'My Projects' },
    { to: '/employee/attendance', icon: <Calendar size={20} />, label: 'Attendance' },
    { to: '/employee/leaves', icon: <FileText size={20} />, label: 'Leaves' },
    { to: '/employee/profile', icon: <User size={20} />, label: 'Profile' },
  ];

  const hrLinks = [
    { to: '/hr/dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { to: '/hr/notifications', icon: <Bell size={20} />, label: 'Send Alert' },
    { to: '/hr/projects', icon: <Briefcase size={20} />, label: 'Projects' },
    { to: '/hr/employees', icon: <Users size={20} />, label: 'Employees' },
    { to: '/hr/attendance', icon: <Calendar size={20} />, label: 'All Attendance' },
    { to: '/hr/leaves', icon: <FileText size={20} />, label: 'Leave Requests' },
    { to: '/hr/profile', icon: <User size={20} />, label: 'Profile' },
  ];

  const links = user?.role === 'hr' ? hrLinks : employeeLinks;

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2>AttendEase</h2>
      </div>
      <nav className="sidebar-nav">
        <ul>
          {links.map((link) => (
            <li key={link.to}>
              <NavLink to={link.to} className={({ isActive }) => isActive ? 'active' : ''}>
                {link.icon}
                <span>{link.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <div className="sidebar-footer">
        <button onClick={logout} className="logout-btn">
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
