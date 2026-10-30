import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { bookingApi, roomApi, customerApi } from '../services/api';
import { formatCurrency, formatDate } from '../utils/formatters';
import { StatusBadge, RoomTypeBadge } from '../components/common/Badge';
import BookingFormModal from '../components/bookings/BookingFormModal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import { useToast } from '../context/ToastContext';
import {
  Plus,
  Search,
  Eye,
  Edit,
  Ban
} from 'lucide-react';

const STATUS_FILTERS = ['All Statuses', 'Confirmed', 'Completed', 'Cancelled'];

export default function BookingsPage() {
  const navigate = useNavigate();
  const { success, error } = useToast();

  const [bookings, setBookings] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Statuses');

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState(null);
  const [cancellingBooking, setCancellingBooking] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [bookingsData, roomsData, customersData] = await Promise.all([
        bookingApi.getAll(),
        roomApi.getAll(),
        customerApi.getAll(),
      ]);
      setBookings(bookingsData || []);
      setRooms(roomsData || []);
      setCustomers(customersData || []);
    } catch (err) {
      error(`Failed to load bookings: ${err.message}`);
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

  const filteredBookings = useMemo(() => {
    return bookings
      .filter((b) => {
        if (statusFilter !== 'All Statuses' && b.status !== statusFilter) {
          return false;
        }

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const guest = customerMap[String(b.customerId)];
          const room = roomMap[String(b.roomId)];

          const matchRef = (b.bookingReference || '').toLowerCase().includes(q);
          const matchGuest = (guest?.fullName || '').toLowerCase().includes(q);
          const matchRoom = (room?.roomNumber || '').toString().toLowerCase().includes(q);
          const matchReq = (b.specialRequests || '').toLowerCase().includes(q);

          if (!matchRef && !matchGuest && !matchRoom && !matchReq) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => (b.checkInDate || '').localeCompare(a.checkInDate || ''));
  }, [bookings, statusFilter, searchQuery, customerMap, roomMap]);

  const handleOpenAdd = () => {
    setEditingBooking(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (b) => {
    setEditingBooking(b);
    setIsFormOpen(true);
  };

  const handleCancelConfirm = async () => {
    if (!cancellingBooking) return;
    setIsCancelling(true);
    try {
      await bookingApi.patch(cancellingBooking.id, {
        status: 'Cancelled',
      });
      success(`Booking #${cancellingBooking.bookingReference} cancelled.`);
      setCancellingBooking(null);
      fetchData();
    } catch (err) {
      error(`Failed to cancel booking: ${err.message}`);
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header-actions">
        <div>
          <h2 className="section-heading">Bookings & Reservations</h2>
          <p className="section-subheading">
            Manage hotel reservations, check-in schedules, and room availability.
          </p>
        </div>
        <button type="button" className="btn btn-primary" onClick={handleOpenAdd}>
          <Plus size={15} /> Create Booking
        </button>
      </div>

      {/* Filters */}
      <div className="filter-control-card">
        <div className="filter-main-row">
          <div className="search-input-wrapper">
            <Search size={15} className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Search by reference (e.g. BK-8103), customer name, or room number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => setSearchQuery('')}
              >
                ×
              </button>
            )}
          </div>

          <div className="filter-select-wrapper">
            <select
              className="form-select filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              {STATUS_FILTERS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="filter-results-info">
          <span>
            Showing <strong>{filteredBookings.length}</strong> of <strong>{bookings.length}</strong> bookings
          </span>
          {(searchQuery || statusFilter !== 'All Statuses') && (
            <button
              type="button"
              className="filter-reset-link"
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('All Statuses');
              }}
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Bookings Table */}
      {loading ? (
        <LoadingSpinner message="Loading bookings..." />
      ) : filteredBookings.length === 0 ? (
        <EmptyState
          title="No Bookings Found"
          description="No bookings match your search query or status filter."
          actionLabel="Create Booking"
          onAction={handleOpenAdd}
        />
      ) : (
        <div className="table-card">
          <div className="table-responsive">
            <table className="operational-table">
              <thead>
                <tr>
                  <th>Booking Reference</th>
                  <th>Customer Name</th>
                  <th>Room Number</th>
                  <th>Check-In</th>
                  <th>Check-Out</th>
                  <th>Nights</th>
                  <th>Total Amount</th>
                  <th>Booking Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.map((b) => {
                  const guest = customerMap[String(b.customerId)];
                  const room = roomMap[String(b.roomId)];

                  return (
                    <tr key={b.id}>
                      <td>
                        <div
                          className="booking-ref-cell"
                          onClick={() => navigate(`/bookings/${b.id}`)}
                        >
                          <span className="booking-ref-code">{b.bookingReference}</span>
                          <span className="booking-created-sub">
                            {formatDate(b.createdAt)}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div
                          className="patron-cell"
                          onClick={() => guest && navigate(`/customers/${guest.id}`)}
                        >
                          <span className="patron-name">{guest?.fullName || 'Customer #' + b.customerId}</span>
                          <span className="patron-sub">{guest?.phone || '—'}</span>
                        </div>
                      </td>
                      <td>
                        {room ? (
                          <div
                            className="room-cell"
                            onClick={() => navigate(`/rooms/${room.id}`)}
                          >
                            <span className="room-cell-num">Room {room.roomNumber}</span>
                            <RoomTypeBadge type={room.type} />
                          </div>
                        ) : (
                          `Room #${b.roomId}`
                        )}
                      </td>
                      <td>
                        <span>{formatDate(b.checkInDate)}</span>
                      </td>
                      <td>
                        <span>{formatDate(b.checkOutDate)}</span>
                      </td>
                      <td>{b.numberOfNights} night{b.numberOfNights !== 1 ? 's' : ''}</td>
                      <td>
                        <span className="total-amount-cell">{formatCurrency(b.totalAmount)}</span>
                      </td>
                      <td>
                        <StatusBadge status={b.status} />
                      </td>
                      <td className="text-right">
                        <div className="action-buttons-group">
                          <button
                            type="button"
                            className="action-btn-icon"
                            title="View Booking Details"
                            onClick={() => navigate(`/bookings/${b.id}`)}
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            type="button"
                            className="action-btn-icon"
                            title="Edit Booking"
                            onClick={() => handleOpenEdit(b)}
                          >
                            <Edit size={14} />
                          </button>
                          {b.status === 'Confirmed' && (
                            <button
                              type="button"
                              className="action-btn-icon danger"
                              title="Cancel Booking"
                              onClick={() => setCancellingBooking(b)}
                            >
                              <Ban size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Booking Form Modal */}
      <BookingFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        booking={editingBooking}
        rooms={rooms}
        customers={customers}
        allBookings={bookings}
        onSuccess={fetchData}
      />

      {/* Cancel Dialog */}
      <ConfirmDialog
        isOpen={Boolean(cancellingBooking)}
        onClose={() => setCancellingBooking(null)}
        onConfirm={handleCancelConfirm}
        title="Cancel Booking"
        message={`Are you sure you want to cancel booking #${cancellingBooking?.bookingReference}? This will free up the room.`}
        confirmText="Cancel Booking"
        isDestructive={true}
        isLoading={isCancelling}
      />
    </div>
  );
}
