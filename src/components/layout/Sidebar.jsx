import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  BedDouble,
  Users,
  CalendarCheck,
  BarChart3,
  PlusCircle,
  CalendarSearch
} from 'lucide-react';

const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/rooms', label: 'Rooms', icon: BedDouble },
  { path: '/customers', label: 'Customers', icon: Users },
  { path: '/bookings', label: 'Bookings', icon: CalendarCheck },
  { path: '/reports', label: 'Reports', icon: BarChart3 },
];

export default function Sidebar({ onQuickBooking, onCheckAvailability }) {
  return (
    <aside className="app-sidebar">
      {/* Brand: Clean simple text wordmark */}
      <div className="sidebar-brand">
        <span className="brand-wordmark">PAIDI RESIDENCY</span>
        <span className="brand-tagline">Hotel Management Portal</span>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <div className="nav-section-label">Menu</div>
        <ul className="nav-list">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                >
                  <Icon size={16} className="nav-icon" />
                  <span>{item.label}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Operational Actions */}
      <div className="sidebar-actions">
        <div className="nav-section-label">Quick Actions</div>
        <button
          type="button"
          className="sidebar-action-btn primary"
          onClick={onQuickBooking}
        >
          <PlusCircle size={15} />
          <span>New Booking</span>
        </button>
        <button
          type="button"
          className="sidebar-action-btn secondary"
          onClick={onCheckAvailability}
        >
          <CalendarSearch size={15} />
          <span>Check Availability</span>
        </button>
      </div>

      {/* Footer */}
      <div className="sidebar-footer">
        <div className="system-status-indicator">
          <span className="status-ping" />
          <span>System Online</span>
        </div>
        <div className="system-version">JSON Server • REST API</div>
      </div>
    </aside>
  );
}
