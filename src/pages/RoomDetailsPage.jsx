import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { roomApi, bookingApi, customerApi } from '../services/api';
import { formatCurrency, formatDate } from '../utils/formatters';
import { StatusBadge, RoomTypeBadge } from '../components/common/Badge';
import RoomFormModal from '../components/rooms/RoomFormModal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useToast } from '../context/ToastContext';
import {
  ArrowLeft,
  Edit,
  Trash2,
  CalendarCheck,
  Users,
  Layers,
  ShieldCheck,
  Check,
  ArrowRight
} from 'lucide-react';

export default function RoomDetailsPage({ onBookSpecificRoom }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { success, error } = useToast();

  const [room, setRoom] = useState(null);
  const [allRooms, setAllRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchRoomDetails();
  }, [id]);

  const fetchRoomDetails = async () => {
    setLoading(true);
    try {
      const [roomData, allRoomsData, bookingsData, customersData] = await Promise.all([
        roomApi.getById(id),
        roomApi.getAll(),
        bookingApi.getAll(),
        customerApi.getAll(),
      ]);
      setRoom(roomData);
      setAllRooms(allRoomsData || []);
      const roomBookings = (bookingsData || []).filter((b) => String(b.roomId) === String(id));
      setBookings(roomBookings);
      setCustomers(customersData || []);
    } catch (err) {
      error(`Error loading room: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const customerMap = React.useMemo(() => {
    const map = {};
    customers.forEach((c) => {
      map[String(c.id)] = c;
    });
    return map;
  }, [customers]);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await roomApi.delete(id);
      success(`Room ${room?.roomNumber} deleted successfully.`);
      navigate('/rooms');
    } catch (err) {
      error(`Failed to delete room: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading room details..." />;
  }

  if (!room) {
    return (
      <div className="alert-box alert-error">
        Room not found.
        <button
          type="button"
          className="btn btn-secondary btn-xs"
          onClick={() => navigate('/rooms')}
          style={{ marginTop: '0.4rem' }}
        >
          Return to Rooms
        </button>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Header Actions */}
      <div className="page-header-actions">
        <button
          type="button"
          className="btn-back"
          onClick={() => navigate('/rooms')}
        >
          <ArrowLeft size={14} /> Back to Rooms
        </button>

        <div className="header-action-group">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setIsEditOpen(true)}
          >
            <Edit size={14} /> Edit Room
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => onBookSpecificRoom && onBookSpecificRoom(room)}
          >
            <CalendarCheck size={14} /> Book This Room
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

      {/* Main Room Showcase */}
      <div className="details-hero-grid">
        <div className="details-hero-image-wrap">
          <img
            src={room.image}
            alt={`Room ${room.roomNumber}`}
            className="details-hero-image"
          />
          <div className="details-image-caption">
            <span>Room {room.roomNumber} — Floor {room.floor}</span>
            <StatusBadge status={room.status} />
          </div>
        </div>

        <div className="details-spec-card">
          <div className="spec-card-top">
            <div>
              <span className="spec-room-label">Room Information</span>
              <h2 className="spec-room-heading">Room {room.roomNumber}</h2>
              <div className="spec-type-tag">
                <RoomTypeBadge type={room.type} />
                <span className="spec-id-text">ID: #{room.id}</span>
              </div>
            </div>

            <div className="spec-pricing-box">
              <span className="spec-rate-sub">Rate per night</span>
              <div className="spec-rate-val">{formatCurrency(room.pricePerNight)}</div>
              <span className="spec-tax-hint">Per night</span>
            </div>
          </div>

          <div className="spec-divider" />

          <div className="spec-metrics-grid">
            <div className="spec-metric-item">
              <Users size={16} className="spec-metric-icon" />
              <div>
                <span className="spec-metric-label">Max Capacity</span>
                <span className="spec-metric-val">{room.capacity} Guests</span>
              </div>
            </div>

            <div className="spec-metric-item">
              <Layers size={16} className="spec-metric-icon" />
              <div>
                <span className="spec-metric-label">Floor</span>
                <span className="spec-metric-val">Floor {room.floor}</span>
              </div>
            </div>

            <div className="spec-metric-item">
              <ShieldCheck size={16} className="spec-metric-icon" />
              <div>
                <span className="spec-metric-label">Status</span>
                <span className="spec-metric-val">{room.status}</span>
              </div>
            </div>
          </div>

          <div className="spec-divider" />

          <div>
            <h4 className="spec-section-title">Description</h4>
            <p className="spec-desc-text">{room.description}</p>
          </div>

          <div style={{ marginTop: '1rem' }}>
            <h4 className="spec-section-title">Amenities & Features</h4>
            <div className="spec-amenities-grid">
              {Array.isArray(room.amenities) &&
                room.amenities.map((item, idx) => (
                  <div key={idx} className="spec-amenity-item">
                    <Check size={13} className="amenity-check-icon" />
                    <span>{item}</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* Booking History Table for this room */}
      <div className="table-card" style={{ marginTop: '1.5rem' }}>
        <div className="panel-header" style={{ padding: '1rem 1.25rem', marginBottom: 0 }}>
          <div>
            <h3 className="panel-title">Booking History for Room {room.roomNumber}</h3>
            <p className="panel-subtitle">Past and upcoming reservations for this room</p>
          </div>
        </div>

        {bookings.length === 0 ? (
          <p className="empty-panel-text">No bookings found for Room {room.roomNumber}.</p>
        ) : (
          <div className="table-responsive">
            <table className="operational-table">
              <thead>
                <tr>
                  <th>Booking Ref</th>
                  <th>Customer</th>
                  <th>Dates</th>
                  <th>Nights</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => {
                  const guest = customerMap[String(b.customerId)];
                  return (
                    <tr key={b.id}>
                      <td>
                        <span className="booking-ref-code">{b.bookingReference}</span>
                      </td>
                      <td>{guest?.fullName || 'Customer #' + b.customerId}</td>
                      <td>
                        {formatDate(b.checkInDate)} → {formatDate(b.checkOutDate)}
                      </td>
                      <td>{b.numberOfNights} nights</td>
                      <td>
                        <strong>{formatCurrency(b.totalAmount)}</strong>
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

      {/* Edit Modal */}
      <RoomFormModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        room={room}
        existingRooms={allRooms}
        onSuccess={fetchRoomDetails}
      />

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Delete Room"
        message={`Are you sure you want to delete Room ${room.roomNumber}? This cannot be undone.`}
        confirmText="Delete"
        isDestructive={true}
        isLoading={isDeleting}
      />
    </div>
  );
}
