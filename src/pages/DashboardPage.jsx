import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { roomApi, customerApi, bookingApi } from '../services/api';
import { formatCurrency, formatDate, getTodayString } from '../utils/formatters';
import { StatusBadge, RoomTypeBadge } from '../components/common/Badge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import {
  BedDouble,
  Users,
  CalendarCheck,
  TrendingUp,
  LogIn,
  LogOut,
  ArrowRight,
  ShieldCheck,
  CalendarSearch,
  PlusCircle,
  AlertCircle
} from 'lucide-react';

export default function DashboardPage({ onNewBooking, onCheckAvailability }) {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorState, setErrorState] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setErrorState(null);
    try {
      const [roomsData, customersData, bookingsData] = await Promise.all([
        roomApi.getAll(),
        customerApi.getAll(),
        bookingApi.getAll(),
      ]);
      setRooms(roomsData || []);
      setCustomers(customersData || []);
      setBookings(bookingsData || []);
    } catch (err) {
      console.error('Failed to load dashboard metrics:', err);
      setErrorState('Could not connect to JSON Server. Ensure json-server is running on port 3000.');
    } finally {
      setLoading(false);
    }
  };

  const customerMap = useMemo(() => {
    const map = {};
    customers.forEach((c) => {
      map[String(c.id)] = c;
    });
    return map;
  }, [customers]);

  const roomMap = useMemo(() => {
    const map = {};
    rooms.forEach((r) => {
      map[String(r.id)] = r;
    });
    return map;
  }, [rooms]);

  // Dynamic statistics calculations
  const stats = useMemo(() => {
    const totalRooms = rooms.length;
    const occupiedRooms = rooms.filter((r) => r.status === 'Occupied').length;
    const availableRooms = rooms.filter((r) => r.status === 'Available').length;
    const maintenanceRooms = rooms.filter((r) => r.status === 'Maintenance').length;
    const totalCustomers = customers.length;

    const activeReservations = bookings.filter((b) => b.status === 'Confirmed').length;
    const completedReservations = bookings.filter((b) => b.status === 'Completed').length;
    const cancelledReservations = bookings.filter((b) => b.status === 'Cancelled').length;

    // Total revenue from confirmed and completed bookings
    const totalRevenue = bookings
      .filter((b) => b.status === 'Completed' || b.status === 'Confirmed')
      .reduce((sum, b) => sum + (Number(b.totalAmount) || 0), 0);

    const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

    return {
      totalRooms,
      occupiedRooms,
      availableRooms,
      maintenanceRooms,
      totalCustomers,
      activeReservations,
      completedReservations,
      cancelledReservations,
      totalRevenue,
      occupancyRate,
    };
  }, [rooms, customers, bookings]);

  const today = getTodayString();

  const upcomingCheckIns = useMemo(() => {
    return bookings
      .filter((b) => b.status === 'Confirmed' && b.checkInDate >= today)
      .sort((a, b) => a.checkInDate.localeCompare(b.checkInDate))
      .slice(0, 5);
  }, [bookings, today]);

  const upcomingCheckOuts = useMemo(() => {
    return bookings
      .filter((b) => b.status === 'Confirmed' && b.checkOutDate >= today)
      .sort((a, b) => a.checkOutDate.localeCompare(b.checkOutDate))
      .slice(0, 5);
  }, [bookings, today]);

  const recentReservations = useMemo(() => {
    return [...bookings]
      .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
      .slice(0, 5);
  }, [bookings]);

  if (loading) {
    return <LoadingSpinner message="Loading dashboard data..." />;
  }

  return (
    <div className="dashboard-container">
      {errorState && (
        <div className="alert-box alert-error">
          <AlertCircle size={18} className="alert-icon" />
          <div style={{ flex: 1 }}>
            <strong>Backend Connection Notice:</strong> {errorState}
            <div style={{ marginTop: '0.35rem' }}>
              <button
                type="button"
                className="btn btn-secondary btn-xs"
                onClick={fetchDashboardData}
              >
                Retry Connection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clean Header Bar: PAIDI RESIDENCY */}
      <div className="dashboard-header-bar">
        <div>
          <h2 className="hotel-main-title">PAIDI RESIDENCY</h2>
          <p className="hotel-main-desc">
            Hotel Booking Management Portal • Live Occupancy: <strong>{stats.occupancyRate}%</strong> ({stats.occupiedRooms} of {stats.totalRooms} rooms occupied)
          </p>
        </div>
        <div className="dashboard-header-actions">
          <button type="button" className="btn btn-primary" onClick={onNewBooking}>
            <PlusCircle size={15} /> New Booking
          </button>
          <button type="button" className="btn btn-secondary" onClick={onCheckAvailability}>
            <CalendarSearch size={15} /> Check Availability
          </button>
        </div>
      </div>

      {/* 6 Compact Rectangular Statistic Cards */}
      <div className="stats-grid">
        <div className="stat-card" onClick={() => navigate('/rooms')}>
          <div className="stat-card-header">
            <span className="stat-label">Total Rooms</span>
            <BedDouble size={16} className="stat-icon" />
          </div>
          <div className="stat-value">{stats.totalRooms}</div>
          <div className="stat-subtext">Registered in inventory</div>
        </div>

        <div className="stat-card" onClick={() => navigate('/rooms')}>
          <div className="stat-card-header">
            <span className="stat-label">Available Rooms</span>
            <span className="status-badge badge-available">{stats.availableRooms} Ready</span>
          </div>
          <div className="stat-value" style={{ color: '#166534' }}>{stats.availableRooms}</div>
          <div className="stat-subtext">Ready for booking</div>
        </div>

        <div className="stat-card" onClick={() => navigate('/rooms')}>
          <div className="stat-card-header">
            <span className="stat-label">Occupied Rooms</span>
            <span className="stat-subtext">{stats.occupancyRate}% Occupancy</span>
          </div>
          <div className="stat-value">{stats.occupiedRooms}</div>
          <div className="stat-subtext">Current in-house guests</div>
        </div>

        <div className="stat-card" onClick={() => navigate('/customers')}>
          <div className="stat-card-header">
            <span className="stat-label">Total Customers</span>
            <Users size={16} className="stat-icon" />
          </div>
          <div className="stat-value">{stats.totalCustomers}</div>
          <div className="stat-subtext">Customer directory</div>
        </div>

        <div className="stat-card" onClick={() => navigate('/bookings')}>
          <div className="stat-card-header">
            <span className="stat-label">Active Bookings</span>
            <CalendarCheck size={16} className="stat-icon" />
          </div>
          <div className="stat-value">{stats.activeReservations}</div>
          <div className="stat-subtext">Confirmed reservations</div>
        </div>

        <div className="stat-card" onClick={() => navigate('/reports')}>
          <div className="stat-card-header">
            <span className="stat-label">Total Revenue</span>
            <TrendingUp size={16} className="stat-icon" />
          </div>
          <div className="stat-value">{formatCurrency(stats.totalRevenue)}</div>
          <div className="stat-subtext">Confirmed & completed</div>
        </div>
      </div>

      {/* Room Occupancy & Booking Status Breakdown */}
      <div className="dashboard-mid-grid">
        {/* Room Availability & Occupancy */}
        <div className="dashboard-panel">
          <div className="panel-header">
            <div>
              <h3 className="panel-title">Room Occupancy</h3>
              <p className="panel-subtitle">Current room allocation status</p>
            </div>
            <button
              type="button"
              className="panel-link-btn"
              onClick={() => navigate('/rooms')}
            >
              View Rooms <ArrowRight size={13} />
            </button>
          </div>

          <div className="occupancy-progress-wrap">
            <div className="progress-bar-container">
              <div
                className="progress-bar-fill occupied"
                style={{ width: `${(stats.occupiedRooms / (stats.totalRooms || 1)) * 100}%` }}
              />
              <div
                className="progress-bar-fill available"
                style={{ width: `${(stats.availableRooms / (stats.totalRooms || 1)) * 100}%` }}
              />
              <div
                className="progress-bar-fill maintenance"
                style={{ width: `${(stats.maintenanceRooms / (stats.totalRooms || 1)) * 100}%` }}
              />
            </div>

            <div className="occupancy-legend">
              <div className="legend-item">
                <span className="legend-dot occupied" />
                <span>Occupied:</span>
                <span className="legend-count">{stats.occupiedRooms}</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot available" />
                <span>Available:</span>
                <span className="legend-count">{stats.availableRooms}</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot maintenance" />
                <span>Maintenance:</span>
                <span className="legend-count">{stats.maintenanceRooms}</span>
              </div>
            </div>
          </div>

          <div className="category-occupancy-list">
            {['Single', 'Double', 'Deluxe', 'Suite', 'Premium'].map((type) => {
              const ofType = rooms.filter((r) => r.type === type);
              const occOfType = ofType.filter((r) => r.status === 'Occupied').length;
              return (
                <div key={type} className="category-occ-row">
                  <span className="cat-type">{type}</span>
                  <div className="cat-bar-track">
                    <div
                      className="cat-bar-fill"
                      style={{
                        width: ofType.length > 0 ? `${(occOfType / ofType.length) * 100}%` : '0%',
                      }}
                    />
                  </div>
                  <span className="cat-counts">
                    {occOfType}/{ofType.length} occupied
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Booking Status Distribution */}
        <div className="dashboard-panel">
          <div className="panel-header">
            <div>
              <h3 className="panel-title">Booking Status Overview</h3>
              <p className="panel-subtitle">Total reservations by status</p>
            </div>
            <button
              type="button"
              className="panel-link-btn"
              onClick={() => navigate('/bookings')}
            >
              All Bookings <ArrowRight size={13} />
            </button>
          </div>

          <div className="status-overview-grid">
            <div className="status-box">
              <span className="status-box-count">{stats.activeReservations}</span>
              <span className="status-box-label">Confirmed</span>
            </div>
            <div className="status-box">
              <span className="status-box-count">{stats.completedReservations}</span>
              <span className="status-box-label">Completed</span>
            </div>
            <div className="status-box">
              <span className="status-box-count">{stats.cancelledReservations}</span>
              <span className="status-box-label">Cancelled</span>
            </div>
          </div>

          <div className="operational-note-box">
            <ShieldCheck size={16} className="note-icon" />
            <div>
              <strong>Double-Booking Prevention Active:</strong> Rooms are automatically locked for confirmed dates. Cancelled reservations instantly free up room availability.
            </div>
          </div>
        </div>
      </div>

      {/* Two Columns: Upcoming Check-Ins & Check-Outs */}
      <div className="dashboard-mid-grid">
        {/* Check-ins */}
        <div className="dashboard-panel">
          <div className="panel-header">
            <div className="panel-title-with-icon">
              <LogIn size={16} className="panel-header-icon" />
              <div>
                <h3 className="panel-title">Upcoming Check-ins</h3>
                <p className="panel-subtitle">Confirmed arrivals</p>
              </div>
            </div>
          </div>

          {upcomingCheckIns.length === 0 ? (
            <p className="empty-panel-text">No upcoming arrivals found.</p>
          ) : (
            <div className="arrivals-list">
              {upcomingCheckIns.map((booking) => {
                const guest = customerMap[String(booking.customerId)];
                const room = roomMap[String(booking.roomId)];
                return (
                  <div
                    key={booking.id}
                    className="arrival-item"
                    onClick={() => navigate(`/bookings/${booking.id}`)}
                  >
                    <div className="arrival-date-badge">
                      <span className="badge-day">{booking.checkInDate.split('-')[2]}</span>
                      <span className="badge-mon">
                        {new Date(booking.checkInDate).toLocaleDateString('en-GB', { month: 'short' })}
                      </span>
                    </div>
                    <div className="arrival-guest-info">
                      <span className="guest-name">{guest?.fullName || 'Customer #' + booking.customerId}</span>
                      <span className="guest-room-info">
                        Room {room?.roomNumber || '—'} ({room?.type || 'Standard'}) • {booking.numberOfNights} night{booking.numberOfNights !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="arrival-amount">
                      <span className="amount-num">{formatCurrency(booking.totalAmount)}</span>
                      <span className="ref-tag">{booking.bookingReference}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Check-outs */}
        <div className="dashboard-panel">
          <div className="panel-header">
            <div className="panel-title-with-icon">
              <LogOut size={16} className="panel-header-icon" />
              <div>
                <h3 className="panel-title">Upcoming Check-outs</h3>
                <p className="panel-subtitle">Scheduled departures</p>
              </div>
            </div>
          </div>

          {upcomingCheckOuts.length === 0 ? (
            <p className="empty-panel-text">No upcoming check-outs found.</p>
          ) : (
            <div className="arrivals-list">
              {upcomingCheckOuts.map((booking) => {
                const guest = customerMap[String(booking.customerId)];
                const room = roomMap[String(booking.roomId)];
                return (
                  <div
                    key={booking.id}
                    className="arrival-item"
                    onClick={() => navigate(`/bookings/${booking.id}`)}
                  >
                    <div className="arrival-date-badge">
                      <span className="badge-day">{booking.checkOutDate.split('-')[2]}</span>
                      <span className="badge-mon">
                        {new Date(booking.checkOutDate).toLocaleDateString('en-GB', { month: 'short' })}
                      </span>
                    </div>
                    <div className="arrival-guest-info">
                      <span className="guest-name">{guest?.fullName || 'Customer #' + booking.customerId}</span>
                      <span className="guest-room-info">
                        Room {room?.roomNumber || '—'} ({room?.type || 'Standard'}) • {booking.numberOfGuests} guest(s)
                      </span>
                    </div>
                    <div className="arrival-amount">
                      <span className="amount-num">{formatCurrency(booking.totalAmount)}</span>
                      <span className="ref-tag">{booking.bookingReference}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recent Bookings Table */}
      <div className="table-card">
        <div className="panel-header" style={{ padding: '1rem 1.25rem', marginBottom: 0 }}>
          <div>
            <h3 className="panel-title">Recent Bookings</h3>
            <p className="panel-subtitle">Recently created reservation records</p>
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => navigate('/bookings')}
          >
            View All Bookings <ArrowRight size={13} />
          </button>
        </div>

        <div className="table-responsive">
          <table className="operational-table">
            <thead>
              <tr>
                <th>Booking Ref</th>
                <th>Customer</th>
                <th>Room</th>
                <th>Dates</th>
                <th>Nights</th>
                <th>Total</th>
                <th>Status</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {recentReservations.map((booking) => {
                const guest = customerMap[String(booking.customerId)];
                const room = roomMap[String(booking.roomId)];
                return (
                  <tr key={booking.id}>
                    <td>
                      <span className="booking-ref-code">{booking.bookingReference}</span>
                    </td>
                    <td>
                      <div className="patron-cell">
                        <span className="patron-name">{guest?.fullName || 'Customer #' + booking.customerId}</span>
                        <span className="patron-sub">{guest?.phone || guest?.email || '—'}</span>
                      </div>
                    </td>
                    <td>
                      {room ? (
                        <div className="room-cell">
                          <span className="room-cell-num">Room {room.roomNumber}</span>
                          <RoomTypeBadge type={room.type} />
                        </div>
                      ) : (
                        `Room #${booking.roomId}`
                      )}
                    </td>
                    <td>
                      <div className="date-period-cell">
                        <span>{formatDate(booking.checkInDate)}</span>
                        <span className="date-arrow">→</span>
                        <span>{formatDate(booking.checkOutDate)}</span>
                      </div>
                    </td>
                    <td>{booking.numberOfNights}</td>
                    <td>
                      <span className="total-amount-cell">{formatCurrency(booking.totalAmount)}</span>
                    </td>
                    <td>
                      <StatusBadge status={booking.status} />
                    </td>
                    <td className="text-right">
                      <button
                        type="button"
                        className="btn btn-secondary btn-xs"
                        onClick={() => navigate(`/bookings/${booking.id}`)}
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
