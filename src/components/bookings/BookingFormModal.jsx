import React, { useState, useEffect, useMemo } from 'react';
import Modal from '../common/Modal';
import { bookingApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import {
  calculateNights,
  calculateTotalAmount,
  findRoomConflicts
} from '../../utils/bookingLogic';
import {
  formatCurrency,
  formatDate,
  generateBookingRef,
  getTodayString,
  getFutureDateString
} from '../../utils/formatters';
import { AlertCircle } from 'lucide-react';

export default function BookingFormModal({
  isOpen,
  onClose,
  booking,
  rooms = [],
  customers = [],
  allBookings = [],
  preselectedRoomId = null,
  onSuccess
}) {
  const { success, error } = useToast();
  const isEditing = Boolean(booking);

  const [customerId, setCustomerId] = useState('');
  const [roomId, setRoomId] = useState('');
  const [checkInDate, setCheckInDate] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');
  const [numberOfGuests, setNumberOfGuests] = useState(1);
  const [status, setStatus] = useState('Confirmed');
  const [specialRequests, setSpecialRequests] = useState('');

  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (booking) {
      setCustomerId(String(booking.customerId || ''));
      setRoomId(String(booking.roomId || ''));
      setCheckInDate(booking.checkInDate || '');
      setCheckOutDate(booking.checkOutDate || '');
      setNumberOfGuests(booking.numberOfGuests || 1);
      setStatus(booking.status || 'Confirmed');
      setSpecialRequests(booking.specialRequests || '');
    } else {
      const today = getTodayString();
      const tomorrow = getFutureDateString(1);
      setCustomerId(customers.length > 0 ? String(customers[0].id) : '');
      setRoomId(preselectedRoomId ? String(preselectedRoomId) : (rooms.length > 0 ? String(rooms[0].id) : ''));
      setCheckInDate(today);
      setCheckOutDate(tomorrow);
      setNumberOfGuests(1);
      setStatus('Confirmed');
      setSpecialRequests('');
    }
    setFormErrors({});
  }, [booking, preselectedRoomId, isOpen, customers, rooms]);

  const selectedRoom = useMemo(() => {
    return rooms.find((r) => String(r.id) === String(roomId));
  }, [rooms, roomId]);

  const numberOfNights = useMemo(() => {
    return calculateNights(checkInDate, checkOutDate);
  }, [checkInDate, checkOutDate]);

  const totalAmount = useMemo(() => {
    if (!selectedRoom || numberOfNights <= 0) return 0;
    return calculateTotalAmount(selectedRoom.pricePerNight, numberOfNights);
  }, [selectedRoom, numberOfNights]);

  // Real-time conflict detection:
  // New Check-in < Existing Check-out AND New Check-out > Existing Check-in
  const conflictBookings = useMemo(() => {
    if (!roomId || !checkInDate || !checkOutDate || numberOfNights <= 0) {
      return [];
    }
    return findRoomConflicts(
      roomId,
      checkInDate,
      checkOutDate,
      allBookings,
      isEditing ? booking.id : null
    );
  }, [roomId, checkInDate, checkOutDate, numberOfNights, allBookings, isEditing, booking]);

  const hasOverlapConflict = conflictBookings.length > 0 && status === 'Confirmed';
  const capacityExceeded = selectedRoom && numberOfGuests > selectedRoom.capacity;

  const validate = () => {
    const errs = {};

    if (!customerId) {
      errs.customerId = 'Please select a customer.';
    }

    if (!roomId) {
      errs.roomId = 'Please select a room.';
    }

    if (!checkInDate) {
      errs.checkInDate = 'Check-in date is required.';
    }

    if (!checkOutDate) {
      errs.checkOutDate = 'Check-out date is required.';
    }

    if (checkInDate && checkOutDate) {
      if (checkOutDate <= checkInDate) {
        errs.checkOutDate = 'Check-out date must be after check-in date.';
      }
    }

    if (!numberOfGuests || numberOfGuests < 1) {
      errs.numberOfGuests = 'Please enter at least 1 guest.';
    } else if (selectedRoom && numberOfGuests > selectedRoom.capacity) {
      errs.numberOfGuests = `Room maximum capacity is ${selectedRoom.capacity} guests.`;
    }

    if (hasOverlapConflict) {
      const conflict = conflictBookings[0];
      errs.overlap = `Room ${selectedRoom?.roomNumber} is already booked from ${formatDate(conflict.checkInDate)} to ${formatDate(conflict.checkOutDate)}. Please choose different dates or another room.`;
    }

    if (selectedRoom && selectedRoom.status === 'Maintenance') {
      errs.roomId = `Room ${selectedRoom.roomNumber} is currently under maintenance.`;
    }

    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        customerId: String(customerId),
        roomId: String(roomId),
        checkInDate,
        checkOutDate,
        numberOfGuests: Number(numberOfGuests),
        numberOfNights,
        totalAmount,
        status,
        specialRequests: specialRequests.trim(),
      };

      if (isEditing) {
        await bookingApi.update(booking.id, {
          ...booking,
          ...payload,
        });
        success(`Booking #${booking.bookingReference} updated successfully.`);
      } else {
        const reference = generateBookingRef();
        const newBooking = {
          ...payload,
          bookingReference: reference,
          createdAt: getTodayString(),
        };
        await bookingApi.create(newBooking);
        success(`Booking #${reference} created successfully.`);
      }

      onSuccess();
      onClose();
    } catch (err) {
      error(`Failed to save booking: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? `Edit Booking: #${booking?.bookingReference}` : 'Create New Booking'}
      subtitle="Select customer, room, and stay dates"
      maxWidth="640px"
    >
      <form onSubmit={handleSubmit} className="form-stack">
        {hasOverlapConflict && (
          <div className="alert-box alert-error">
            <AlertCircle size={18} className="alert-icon" />
            <div>
              <strong>Double Booking Conflict:</strong>
              <p>
                Room {selectedRoom?.roomNumber} already has a confirmed booking from{' '}
                <strong>{formatDate(conflictBookings[0]?.checkInDate)}</strong> to{' '}
                <strong>{formatDate(conflictBookings[0]?.checkOutDate)}</strong>.
                Please choose different dates or a different room.
              </p>
            </div>
          </div>
        )}

        {/* Customer & Room Selection */}
        <div className="form-grid-2">
          <div className="form-group">
            <label className="form-label">
              Customer <span className="req">*</span>
            </label>
            <select
              className={`form-select ${formErrors.customerId ? 'input-error' : ''}`}
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
            >
              <option value="">Select a customer...</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.fullName} ({c.phone || c.email})
                </option>
              ))}
            </select>
            {formErrors.customerId && <p className="field-error">{formErrors.customerId}</p>}
          </div>

          <div className="form-group">
            <label className="form-label">
              Room <span className="req">*</span>
            </label>
            <select
              className={`form-select ${formErrors.roomId ? 'input-error' : ''}`}
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
            >
              <option value="">Select a room...</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  Room {r.roomNumber} ({r.type}) — {formatCurrency(r.pricePerNight)}/night (Max {r.capacity}p)
                  {r.status === 'Maintenance' ? ' [Maintenance]' : ''}
                </option>
              ))}
            </select>
            {formErrors.roomId && <p className="field-error">{formErrors.roomId}</p>}
          </div>
        </div>

        {/* Dates & Guests */}
        <div className="form-grid-3">
          <div className="form-group">
            <label className="form-label">
              Check-In Date <span className="req">*</span>
            </label>
            <input
              type="date"
              className={`form-input ${formErrors.checkInDate ? 'input-error' : ''}`}
              value={checkInDate}
              onChange={(e) => setCheckInDate(e.target.value)}
            />
            {formErrors.checkInDate && <p className="field-error">{formErrors.checkInDate}</p>}
          </div>

          <div className="form-group">
            <label className="form-label">
              Check-Out Date <span className="req">*</span>
            </label>
            <input
              type="date"
              className={`form-input ${formErrors.checkOutDate ? 'input-error' : ''}`}
              value={checkOutDate}
              min={checkInDate || undefined}
              onChange={(e) => setCheckOutDate(e.target.value)}
            />
            {formErrors.checkOutDate && <p className="field-error">{formErrors.checkOutDate}</p>}
          </div>

          <div className="form-group">
            <label className="form-label">
              Number of Guests <span className="req">*</span>
            </label>
            <input
              type="number"
              min="1"
              max={selectedRoom ? selectedRoom.capacity : 10}
              className={`form-input ${formErrors.numberOfGuests || capacityExceeded ? 'input-error' : ''}`}
              value={numberOfGuests}
              onChange={(e) => setNumberOfGuests(Math.max(1, parseInt(e.target.value) || 1))}
            />
            {formErrors.numberOfGuests && <p className="field-error">{formErrors.numberOfGuests}</p>}
            {selectedRoom && !formErrors.numberOfGuests && (
              <span className="field-hint">Room capacity: {selectedRoom.capacity}</span>
            )}
          </div>
        </div>

        {/* Automatic Price Breakdown */}
        <div className="pricing-breakdown-card">
          <div className="pricing-row">
            <span className="pricing-label">Price Per Night:</span>
            <span className="pricing-val">
              {selectedRoom ? formatCurrency(selectedRoom.pricePerNight) : '—'}
            </span>
          </div>

          <div className="pricing-row">
            <span className="pricing-label">Number of Nights:</span>
            <span className="pricing-val">
              {numberOfNights > 0 ? `${numberOfNights} night(s)` : '0 nights'}
            </span>
          </div>

          <div className="pricing-divider" />

          <div className="pricing-total-row">
            <div>
              <span className="total-title">Total Amount</span>
              <span className="total-formula">
                ({formatCurrency(selectedRoom?.pricePerNight || 0)} × {numberOfNights} night{numberOfNights !== 1 ? 's' : ''})
              </span>
            </div>
            <div className="total-figure">{formatCurrency(totalAmount)}</div>
          </div>
        </div>

        {/* Status & Special Requests */}
        <div className="form-grid-2">
          <div className="form-group">
            <label className="form-label">Booking Status</label>
            <select
              className="form-select"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="Confirmed">Confirmed</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Special Requests / Notes</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Ground floor preferred, late arrival"
              value={specialRequests}
              onChange={(e) => setSpecialRequests(e.target.value)}
            />
          </div>
        </div>

        {/* Modal Actions */}
        <div className="modal-actions-bar">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary btn-sm"
            disabled={isSubmitting || hasOverlapConflict}
          >
            {isSubmitting
              ? 'Saving...'
              : isEditing
              ? 'Update Booking'
              : 'Confirm Booking'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
