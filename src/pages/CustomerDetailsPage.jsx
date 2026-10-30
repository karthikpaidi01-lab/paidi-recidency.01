import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { customerApi, bookingApi, roomApi } from '../services/api';
import { formatCurrency, formatDate } from '../utils/formatters';
import { StatusBadge, RoomTypeBadge } from '../components/common/Badge';
import CustomerFormModal from '../components/customers/CustomerFormModal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useToast } from '../context/ToastContext';
import {
  ArrowLeft,
  Edit,
  Trash2,
  CalendarCheck,
  Mail,
  Phone,
  MapPin,
  Calendar,
  ArrowRight
} from 'lucide-react';

export default function CustomerDetailsPage({ onNewBookingForCustomer }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { success, error } = useToast();

  const [customer, setCustomer] = useState(null);
  const [customerBookings, setCustomerBookings] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [customerData, bookingsData, roomsData] = await Promise.all([
        customerApi.getById(id),
        bookingApi.getAll(),
        roomApi.getAll(),
      ]);
      setCustomer(customerData);
      const bookingsForThisCust = (bookingsData || []).filter(
        (b) => String(b.customerId) === String(id)
      );
      setCustomerBookings(bookingsForThisCust);
      setRooms(roomsData || []);
    } catch (err) {
      error(`Error loading customer profile: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const roomMap = React.useMemo(() => {
    const map = {};
    rooms.forEach((r) => {
      map[String(r.id)] = r;
    });
    return map;
  }, [rooms]);

  const totalSpend = customerBookings
    .filter((b) => b.status === 'Confirmed' || b.status === 'Completed')
    .reduce((sum, b) => sum + (Number(b.totalAmount) || 0), 0);

  const activeReservations = customerBookings.filter((b) => b.status === 'Confirmed').length;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await customerApi.delete(id);
      success(`Customer "${customer?.fullName}" deleted.`);
      navigate('/customers');
    } catch (err) {
      error(`Failed to delete customer: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading customer details..." />;
  }

  if (!customer) {
    return (
      <div className="alert-box alert-error">
        Customer profile not found.
        <button
          type="button"
          className="btn btn-secondary btn-xs"
          onClick={() => navigate('/customers')}
          style={{ marginTop: '0.4rem' }}
        >
          Return to Customers
        </button>
      </div>
    );
  }

  const initials = customer.fullName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header-actions">
        <button
          type="button"
          className="btn-back"
          onClick={() => navigate('/customers')}
        >
          <ArrowLeft size={14} /> Back to Customers
        </button>

        <div className="header-action-group">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setIsEditOpen(true)}
          >
            <Edit size={14} /> Edit Customer
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => onNewBookingForCustomer && onNewBookingForCustomer(customer)}
          >
            <CalendarCheck size={14} /> Create Booking
          </button>
          <button
            type="button"
            className="btn btn-danger-outline btn-sm"
            onClick={() => setIsDeleteDialogOpen(true)}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Customer Profile Card */}
      <div className="patron-profile-card">
        <div className="patron-profile-header">
          <div className="patron-large-avatar">{initials}</div>
          <div>
            <span className="patron-id-tag">Customer #{customer.id}</span>
            <h2 className="patron-name-lg">{customer.fullName}</h2>
            <div className="patron-contact-chips">
              <span className="contact-chip">
                <Mail size={13} /> {customer.email}
              </span>
              <span className="contact-chip">
                <Phone size={13} /> {customer.phone}
              </span>
              <span className="contact-chip">
                <MapPin size={13} /> {customer.address ? `${customer.address}, ` : ''}
                {customer.city ? `${customer.city}, ` : ''}{customer.country}
              </span>
              {customer.createdAt && (
                <span className="contact-chip">
                  <Calendar size={13} /> Registered {formatDate(customer.createdAt)}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="patron-kpi-bar">
          <div className="patron-kpi-item">
            <span className="kpi-label">Total Bookings</span>
            <span className="kpi-num">{customerBookings.length}</span>
          </div>
          <div className="patron-kpi-item">
            <span className="kpi-label">Active Bookings</span>
            <span className="kpi-num">{activeReservations}</span>
          </div>
          <div className="patron-kpi-item">
            <span className="kpi-label">Total Spend</span>
            <span className="kpi-num">{formatCurrency(totalSpend)}</span>
          </div>
        </div>
      </div>

      {/* Booking History Table */}
      <div className="table-card" style={{ marginTop: '1.5rem' }}>
        <div className="panel-header" style={{ padding: '1rem 1.25rem', marginBottom: 0 }}>
          <div>
            <h3 className="panel-title">Booking History</h3>
            <p className="panel-subtitle">All past and current bookings for {customer.fullName}</p>
          </div>
        </div>

        {customerBookings.length === 0 ? (
          <p className="empty-panel-text">No bookings recorded for this customer.</p>
        ) : (
          <div className="table-responsive">
            <table className="operational-table">
              <thead>
                <tr>
                  <th>Booking Ref</th>
                  <th>Room</th>
                  <th>Dates</th>
                  <th>Nights</th>
                  <th>Guests</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {customerBookings.map((b) => {
                  const room = roomMap[String(b.roomId)];
                  return (
                    <tr key={b.id}>
                      <td>
                        <span className="booking-ref-code">{b.bookingReference}</span>
                      </td>
                      <td>
                        {room ? (
                          <div className="room-cell">
                            <span className="room-cell-num">Room {room.roomNumber}</span>
                            <RoomTypeBadge type={room.type} />
                          </div>
                        ) : (
                          `Room #${b.roomId}`
                        )}
                      </td>
                      <td>
                        {formatDate(b.checkInDate)} → {formatDate(b.checkOutDate)}
                      </td>
                      <td>{b.numberOfNights} night{b.numberOfNights !== 1 ? 's' : ''}</td>
                      <td>{b.numberOfGuests} guest(s)</td>
                      <td>
                        <span className="total-amount-cell">{formatCurrency(b.totalAmount)}</span>
                      </td>
                      <td>
                        <StatusBadge status={b.status} />
                      </td>
                      <td className="text-right">
                        <button
                          type="button"
                          className="btn btn-secondary btn-xs"
                          onClick={() => navigate(`/bookings/${b.id}`)}
                        >
                          Details <ArrowRight size={12} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Customer Modal */}
      <CustomerFormModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        customer={customer}
        onSuccess={fetchData}
      />

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Delete Customer"
        message={`Are you sure you want to delete customer "${customer.fullName}"?`}
        confirmText="Delete"
        isDestructive={true}
        isLoading={isDeleting}
      />
    </div>
  );
}
