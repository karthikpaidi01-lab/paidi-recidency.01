import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { bookingApi, roomApi, customerApi } from '../services/api';
import { formatCurrency, formatDate } from '../utils/formatters';
import { StatusBadge, RoomTypeBadge } from '../components/common/Badge';
import BookingFormModal from '../components/bookings/BookingFormModal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useToast } from '../context/ToastContext';
import {
  ArrowLeft,
  Edit,
  Ban,
  Printer,
  User,
  BedDouble,
  Mail,
  Phone,
  MapPin,
  FileText
} from 'lucide-react';

export default function BookingDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { success, error } = useToast();

  const [booking, setBooking] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [room, setRoom] = useState(null);
  const [allRooms, setAllRooms] = useState([]);
  const [allCustomers, setAllCustomers] = useState([]);
  const [allBookings, setAllBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    fetchBookingFolio();
  }, [id]);

  const fetchBookingFolio = async () => {
    setLoading(true);
    try {
      const [bData, roomsData, custsData, allBData] = await Promise.all([
        bookingApi.getById(id),
        roomApi.getAll(),
        customerApi.getAll(),
        bookingApi.getAll(),
      ]);
      setBooking(bData);
      setAllRooms(roomsData || []);
      setAllCustomers(custsData || []);
      setAllBookings(allBData || []);

      const matchedCust = (custsData || []).find((c) => String(c.id) === String(bData.customerId));
      setCustomer(matchedCust);

      const matchedRoom = (roomsData || []).find((r) => String(r.id) === String(bData.roomId));
      setRoom(matchedRoom);
    } catch (err) {
      error(`Error loading booking: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async () => {
    setIsCancelling(true);
    try {
      await bookingApi.patch(id, { status: 'Cancelled' });
      success(`Booking #${booking?.bookingReference} cancelled.`);
      setIsCancelOpen(false);
      fetchBookingFolio();
    } catch (err) {
      error(`Failed to cancel booking: ${err.message}`);
    } finally {
      setIsCancelling(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <LoadingSpinner message="Loading booking details..." />;
  }

  if (!booking) {
    return (
      <div className="alert-box alert-error">
        Booking not found.
        <button
          type="button"
          className="btn btn-secondary btn-xs"
          onClick={() => navigate('/bookings')}
          style={{ marginTop: '0.4rem' }}
        >
          Return to Bookings
        </button>
      </div>
    );
  }

  return (
    <div className="page-container print-area">
      {/* Header Actions */}
      <div className="page-header-actions no-print">
        <button
          type="button"
          className="btn-back"
          onClick={() => navigate('/bookings')}
        >
          <ArrowLeft size={14} /> Back to Bookings
        </button>

        <div className="header-action-group">
          <button type="button" className="btn btn-secondary btn-sm" onClick={handlePrint}>
            <Printer size={14} /> Print Invoice
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setIsEditOpen(true)}
          >
            <Edit size={14} /> Edit Booking
          </button>
          {booking.status === 'Confirmed' && (
            <button
              type="button"
              className="btn btn-danger-outline btn-sm"
              onClick={() => setIsCancelOpen(true)}
            >
              <Ban size={14} /> Cancel Booking
            </button>
          )}
        </div>
      </div>

      {/* Invoice / Voucher Sheet */}
      <div className="folio-voucher-card">
        {/* Brand Banner */}
        <div className="folio-brand-banner">
          <div>
            <h2 className="folio-hotel-name">PAIDI RESIDENCY</h2>
            <p className="folio-hotel-sub">Hotel Booking & Reservation Management</p>
            <p className="folio-address">Main Road • reservations@paidiresidency.com</p>
          </div>

          <div className="folio-meta-box">
            <div className="folio-ref-tag">Booking Reference</div>
            <div className="folio-ref-number">{booking.bookingReference}</div>
            <div style={{ marginTop: '0.25rem' }}>
              <StatusBadge status={booking.status} />
            </div>
            <div className="folio-issue-date">Date: {formatDate(booking.createdAt)}</div>
          </div>
        </div>

        <div className="folio-divider" />

        {/* Customer & Room Info */}
        <div className="folio-grid-2">
          {/* Customer Information */}
          <div>
            <h4 className="folio-block-title">
              <User size={14} /> Customer Information
            </h4>
            {customer ? (
              <div>
                <h3 className="folio-patron-name">{customer.fullName}</h3>
                <div className="folio-patron-meta">
                  <div className="meta-row">
                    <Mail size={13} />
                    <span>{customer.email}</span>
                  </div>
                  <div className="meta-row">
                    <Phone size={13} />
                    <span>{customer.phone}</span>
                  </div>
                  <div className="meta-row">
                    <MapPin size={13} />
                    <span>
                      {customer.address ? `${customer.address}, ` : ''}
                      {customer.city}, {customer.country}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-secondary">Customer #{booking.customerId}</p>
            )}
          </div>

          {/* Room Information */}
          <div>
            <h4 className="folio-block-title">
              <BedDouble size={14} /> Room Information
            </h4>
            {room ? (
              <div>
                <div className="room-folio-row">
                  <div>
                    <h3 className="folio-patron-name">Room {room.roomNumber}</h3>
                    <div style={{ marginTop: '0.2rem' }}>
                      <RoomTypeBadge type={room.type} />
                      <span className="folio-room-floor">Floor {room.floor}</span>
                    </div>
                  </div>
                  <img
                    src={room.image}
                    alt={room.roomNumber}
                    className="folio-room-thumb"
                  />
                </div>
                <p className="folio-room-desc">{room.description}</p>
              </div>
            ) : (
              <p className="text-secondary">Room #{booking.roomId}</p>
            )}
          </div>
        </div>

        <div className="folio-divider" />

        {/* Stay Parameters */}
        <div className="folio-stay-parameters">
          <div className="stay-param-item">
            <span className="param-label">Check-In</span>
            <span className="param-value">{formatDate(booking.checkInDate)}</span>
            <span className="param-sub">From 12:00 PM</span>
          </div>

          <div className="stay-param-item">
            <span className="param-label">Check-Out</span>
            <span className="param-value">{formatDate(booking.checkOutDate)}</span>
            <span className="param-sub">Until 11:00 AM</span>
          </div>

          <div className="stay-param-item">
            <span className="param-label">Duration</span>
            <span className="param-value">{booking.numberOfNights} Night{booking.numberOfNights !== 1 ? 's' : ''}</span>
          </div>

          <div className="stay-param-item">
            <span className="param-label">Guests</span>
            <span className="param-value">{booking.numberOfGuests} Guest{booking.numberOfGuests !== 1 ? 's' : ''}</span>
          </div>
        </div>

        {booking.specialRequests && (
          <div className="folio-special-requests">
            <h4 className="folio-block-title">Special Requests / Notes</h4>
            <p className="requests-text">"{booking.specialRequests}"</p>
          </div>
        )}

        <div className="folio-divider" />

        {/* Billing Table */}
        <div className="folio-billing-section">
          <h4 className="folio-block-title">
            <FileText size={14} /> Price Breakdown
          </h4>
          <table className="folio-billing-table">
            <thead>
              <tr>
                <th>Item Description</th>
                <th className="text-center">Price / Night</th>
                <th className="text-center">Nights</th>
                <th className="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <strong>Room Accommodation: Room {room?.roomNumber || booking.roomId} ({room?.type || 'Standard'})</strong>
                  <div className="table-sub-detail">
                    {booking.numberOfNights} night{booking.numberOfNights !== 1 ? 's' : ''} stay
                  </div>
                </td>
                <td className="text-center">
                  {formatCurrency(room?.pricePerNight || (booking.totalAmount / (booking.numberOfNights || 1)))}
                </td>
                <td className="text-center">{booking.numberOfNights}</td>
                <td className="text-right">
                  <strong>{formatCurrency(booking.totalAmount)}</strong>
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td colSpan="3" className="text-right subtotal-cell">
                  Total Amount:
                </td>
                <td className="text-right grand-total-cell">
                  {formatCurrency(booking.totalAmount)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Footer Policy */}
        <div className="folio-footer-note">
          <p>
            Standard hotel check-in time is 12:00 PM and check-out time is 11:00 AM.
            Valid photo identification is required at the time of check-in.
          </p>
        </div>
      </div>

      {/* Edit Booking Modal */}
      <BookingFormModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        booking={booking}
        rooms={allRooms}
        customers={allCustomers}
        allBookings={allBookings}
        onSuccess={fetchBookingFolio}
      />

      {/* Cancellation Dialog */}
      <ConfirmDialog
        isOpen={isCancelOpen}
        onClose={() => setIsCancelOpen(false)}
        onConfirm={handleCancelBooking}
        title="Cancel Booking"
        message={`Are you sure you want to cancel booking #${booking.bookingReference}? This will free up the room for other guests.`}
        confirmText="Cancel Booking"
        isDestructive={true}
        isLoading={isCancelling}
      />
    </div>
  );
}
