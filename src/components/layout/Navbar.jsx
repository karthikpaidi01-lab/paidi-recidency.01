import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Bell,
  Calendar,
  Clock,
  User
} from 'lucide-react';
import { formatDate } from '../../utils/formatters';

const NOTIFICATIONS = [
  {
    id: 1,
    title: 'Arrival Scheduled Today',
    desc: 'Room 502: Guest check-in scheduled for 2:00 PM.',
    time: 'Today, 14:00',
    link: '/bookings'
  },
  {
    id: 2,
    title: 'Upcoming Check-out Tomorrow',
    desc: 'Room 202: Departure scheduled for 11:00 AM.',
    time: 'Tomorrow, 11:00',
    link: '/bookings'
  },
  {
    id: 3,
    title: 'Maintenance Update',
    desc: 'Room 303: Regular AC service in progress.',
    time: 'Active',
    link: '/rooms'
  }
];

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const notifRef = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    if (showNotifications) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [showNotifications]);

  const getPageInfo = () => {
    const p = location.pathname;
    if (p === '/') {
      return {
        title: 'Dashboard',
        subtitle: 'Overview of hotel operations, room occupancy, and revenue',
      };
    }
    if (p.startsWith('/rooms')) {
      return {
        title: 'Rooms',
        subtitle: 'Manage hotel rooms, pricing, and availability',
      };
    }
    if (p.startsWith('/customers')) {
      return {
        title: 'Customers',
        subtitle: 'Customer contact directory and booking records',
      };
    }
    if (p.startsWith('/bookings')) {
      return {
        title: 'Bookings',
        subtitle: 'Reservation folios, schedules, and billing',
      };
    }
    if (p.startsWith('/reports')) {
      return {
        title: 'Reports',
        subtitle: 'Calculated financial summaries and room occupancy rates',
      };
    }
    return {
      title: 'PAIDI RESIDENCY',
      subtitle: 'Hotel Booking Management Portal',
    };
  };

  const pageInfo = getPageInfo();

  return (
    <header className="app-navbar">
      <div className="navbar-left">
        <h1 className="navbar-page-title">{pageInfo.title}</h1>
        <p className="navbar-page-subtitle">{pageInfo.subtitle}</p>
      </div>

      <div className="navbar-right">
        {/* Date & Time */}
        <div className="navbar-time-chip">
          <Calendar size={13} className="time-chip-icon" />
          <span>{formatDate(currentTime.toISOString().split('T')[0])}</span>
          <span>•</span>
          <Clock size={13} className="time-chip-icon" />
          <span>
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        {/* Notifications */}
        <div className="navbar-notif-container" ref={notifRef}>
          <button
            type="button"
            className="navbar-icon-btn"
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label="Notifications"
            title="Notifications"
          >
            <Bell size={16} />
            <span className="notif-badge-dot" />
          </button>

          {showNotifications && (
            <div className="notif-dropdown">
              <div className="notif-dropdown-header">
                <span className="notif-header-title">Notifications</span>
                <span className="notif-header-count">3 updates</span>
              </div>
              <div className="notif-list">
                {NOTIFICATIONS.map((n) => (
                  <div
                    key={n.id}
                    className="notif-item"
                    onClick={() => {
                      setShowNotifications(false);
                      navigate(n.link);
                    }}
                  >
                    <div className="notif-item-header">
                      <span className="notif-item-title">{n.title}</span>
                      <span className="notif-item-time">{n.time}</span>
                    </div>
                    <p className="notif-item-desc">{n.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Profile */}
        <div className="navbar-user-profile">
          <div className="user-avatar">
            <User size={14} />
          </div>
          <div className="user-details">
            <span className="user-name">Staff Admin</span>
            <span className="user-role">Front Desk</span>
          </div>
        </div>
      </div>
    </header>
  );
}
