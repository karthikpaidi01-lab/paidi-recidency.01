import React, { useState, useEffect, useMemo } from 'react';
import { roomApi, bookingApi, customerApi } from '../services/api';
import { formatCurrency } from '../utils/formatters';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { Printer } from 'lucide-react';

export default function ReportsPage() {
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const [roomsData, bookingsData, customersData] = await Promise.all([
        roomApi.getAll(),
        bookingApi.getAll(),
        customerApi.getAll(),
      ]);
      setRooms(roomsData || []);
      setBookings(bookingsData || []);
      setCustomers(customersData || []);
    } catch (err) {
      console.error('Failed to load reports data:', err);
    } finally {
      setLoading(false);
    }
  };

  const analytics = useMemo(() => {
    const totalBookings = bookings.length;
    const confirmedBookings = bookings.filter((b) => b.status === 'Confirmed');
    const completedBookings = bookings.filter((b) => b.status === 'Completed');
    const cancelledBookings = bookings.filter((b) => b.status === 'Cancelled');

    // Total revenue from confirmed and completed bookings
    const eligibleBookings = bookings.filter((b) => b.status === 'Confirmed' || b.status === 'Completed');
    const totalRevenue = eligibleBookings.reduce((sum, b) => sum + (Number(b.totalAmount) || 0), 0);
    const realizedRevenue = completedBookings.reduce((sum, b) => sum + (Number(b.totalAmount) || 0), 0);
    const projectedRevenue = confirmedBookings.reduce((sum, b) => sum + (Number(b.totalAmount) || 0), 0);
    const cancelledLostRevenue = cancelledBookings.reduce((sum, b) => sum + (Number(b.totalAmount) || 0), 0);

    const totalNights = eligibleBookings.reduce((sum, b) => sum + (Number(b.numberOfNights) || 0), 0);
    const averageDailyRate = totalNights > 0 ? Math.round(totalRevenue / totalNights) : 0;

    // Room Occupancy
    const totalRooms = rooms.length;
    const occupiedRooms = rooms.filter((r) => r.status === 'Occupied').length;
    const availableRooms = rooms.filter((r) => r.status === 'Available').length;
    const maintenanceRooms = rooms.filter((r) => r.status === 'Maintenance').length;
    const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

    // Category Breakdown
    const roomTypeStats = ['Single', 'Double', 'Deluxe', 'Suite', 'Premium'].map((type) => {
      const ofType = rooms.filter((r) => r.type === type);
      const roomIds = ofType.map((r) => String(r.id));
      const typeBookings = eligibleBookings.filter((b) => roomIds.includes(String(b.roomId)));
      const revenue = typeBookings.reduce((sum, b) => sum + (Number(b.totalAmount) || 0), 0);
      const nights = typeBookings.reduce((sum, b) => sum + (Number(b.numberOfNights) || 0), 0);
      const occupied = ofType.filter((r) => r.status === 'Occupied').length;

      return {
        type,
        count: ofType.length,
        occupied,
        bookingsCount: typeBookings.length,
        nights,
        revenue,
        occupancy: ofType.length > 0 ? Math.round((occupied / ofType.length) * 100) : 0,
      };
    });

    return {
      totalBookings,
      confirmedCount: confirmedBookings.length,
      completedCount: completedBookings.length,
      cancelledCount: cancelledBookings.length,
      totalRevenue,
      realizedRevenue,
      projectedRevenue,
      cancelledLostRevenue,
      totalNights,
      averageDailyRate,
      totalRooms,
      occupiedRooms,
      availableRooms,
      maintenanceRooms,
      occupancyRate,
      roomTypeStats,
    };
  }, [rooms, bookings]);

  if (loading) {
    return <LoadingSpinner message="Calculating report figures..." />;
  }

  return (
    <div className="page-container print-area">
      {/* Header */}
      <div className="page-header-actions no-print">
        <div>
          <h2 className="section-heading">Operational & Financial Reports</h2>
          <p className="section-subheading">
            Live figures calculated dynamically from JSON Server database records.
          </p>
        </div>
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => window.print()}>
          <Printer size={14} /> Print Report
        </button>
      </div>

      {/* KPI Cards */}
      <div className="reports-kpi-grid">
        <div className="report-card">
          <span className="report-card-label">Total Bookings</span>
          <div className="report-card-val">{analytics.totalBookings}</div>
          <div className="report-card-sub">All time bookings</div>
        </div>

        <div className="report-card">
          <span className="report-card-label">Confirmed Bookings</span>
          <div className="report-card-val">{analytics.confirmedCount}</div>
          <div className="report-card-sub">Active reservations</div>
        </div>

        <div className="report-card">
          <span className="report-card-label">Completed Bookings</span>
          <div className="report-card-val">{analytics.completedCount}</div>
          <div className="report-card-sub">Fulfilled stays</div>
        </div>

        <div className="report-card">
          <span className="report-card-label">Cancelled Bookings</span>
          <div className="report-card-val" style={{ color: '#991B1B' }}>{analytics.cancelledCount}</div>
          <div className="report-card-sub">Released inventory</div>
        </div>

        <div className="report-card featured">
          <span className="report-card-label">Total Revenue</span>
          <div className="report-card-val">{formatCurrency(analytics.totalRevenue)}</div>
          <div className="report-card-sub">Confirmed & completed</div>
        </div>

        <div className="report-card">
          <span className="report-card-label">Room Occupancy Rate</span>
          <div className="report-card-val">{analytics.occupancyRate}%</div>
          <div className="report-card-sub">
            {analytics.occupiedRooms} of {analytics.totalRooms} rooms occupied
          </div>
        </div>
      </div>

      {/* Revenue Breakdown */}
      <div className="table-card" style={{ marginTop: '1.25rem' }}>
        <div className="panel-header" style={{ padding: '0.85rem 1.25rem', marginBottom: 0 }}>
          <div>
            <h3 className="panel-title">Revenue Summary</h3>
            <p className="panel-subtitle">Revenue distribution by reservation status</p>
          </div>
        </div>

        <div className="revenue-summary-grid">
          <div className="rev-item">
            <span className="rev-label">Realized Revenue (Completed)</span>
            <span className="rev-val">{formatCurrency(analytics.realizedRevenue)}</span>
            <span className="rev-desc">From {analytics.completedCount} completed bookings</span>
          </div>

          <div className="rev-item">
            <span className="rev-label">Projected Revenue (Confirmed)</span>
            <span className="rev-val">{formatCurrency(analytics.projectedRevenue)}</span>
            <span className="rev-desc">From {analytics.confirmedCount} confirmed bookings</span>
          </div>

          <div className="rev-item">
            <span className="rev-label">Cancelled Bookings Value</span>
            <span className="rev-val" style={{ color: '#737373' }}>{formatCurrency(analytics.cancelledLostRevenue)}</span>
            <span className="rev-desc">From {analytics.cancelledCount} cancellations</span>
          </div>

          <div className="rev-item">
            <span className="rev-label">Average Daily Rate (ADR)</span>
            <span className="rev-val">{formatCurrency(analytics.averageDailyRate)}</span>
            <span className="rev-desc">Average per room night</span>
          </div>
        </div>
      </div>

      {/* Room Category Performance */}
      <div className="table-card" style={{ marginTop: '1.25rem' }}>
        <div className="panel-header" style={{ padding: '0.85rem 1.25rem', marginBottom: 0 }}>
          <div>
            <h3 className="panel-title">Room Category Performance</h3>
            <p className="panel-subtitle">Occupancy and revenue contribution by room type</p>
          </div>
        </div>

        <div className="table-responsive">
          <table className="operational-table">
            <thead>
              <tr>
                <th>Room Type</th>
                <th className="text-center">Total Inventory</th>
                <th className="text-center">Occupied</th>
                <th className="text-center">Occupancy Rate</th>
                <th className="text-center">Bookings Count</th>
                <th className="text-center">Nights Sold</th>
                <th className="text-right">Total Revenue</th>
              </tr>
            </thead>
            <tbody>
              {analytics.roomTypeStats.map((stat) => (
                <tr key={stat.type}>
                  <td>
                    <strong>{stat.type}</strong>
                  </td>
                  <td className="text-center">{stat.count} rooms</td>
                  <td className="text-center">{stat.occupied}</td>
                  <td className="text-center">
                    <div className="table-progress-wrap">
                      <div className="table-progress-bar">
                        <div
                          className="table-progress-fill"
                          style={{ width: `${stat.occupancy}%` }}
                        />
                      </div>
                      <span className="table-progress-text">{stat.occupancy}%</span>
                    </div>
                  </td>
                  <td className="text-center">{stat.bookingsCount}</td>
                  <td className="text-center">{stat.nights}</td>
                  <td className="text-right">
                    <strong>{formatCurrency(stat.revenue)}</strong>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td><strong>Total</strong></td>
                <td className="text-center"><strong>{analytics.totalRooms} rooms</strong></td>
                <td className="text-center"><strong>{analytics.occupiedRooms}</strong></td>
                <td className="text-center"><strong>{analytics.occupancyRate}%</strong></td>
                <td className="text-center"><strong>{analytics.confirmedCount + analytics.completedCount}</strong></td>
                <td className="text-center"><strong>{analytics.totalNights}</strong></td>
                <td className="text-right"><strong>{formatCurrency(analytics.totalRevenue)}</strong></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
