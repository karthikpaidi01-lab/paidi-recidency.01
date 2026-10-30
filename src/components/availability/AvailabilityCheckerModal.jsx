import React, { useState, useMemo } from 'react';
import Modal from '../common/Modal';
import { getAvailableRooms, calculateNights } from '../../utils/bookingLogic';
import { formatCurrency, getTodayString, getFutureDateString } from '../../utils/formatters';
import { RoomTypeBadge } from '../common/Badge';
import { Users, ArrowRight, XCircle } from 'lucide-react';

const ROOM_TYPES = ['All', 'Single', 'Double', 'Deluxe', 'Suite', 'Premium'];

export default function AvailabilityCheckerModal({
  isOpen,
  onClose,
  rooms = [],
  bookings = [],
  onSelectRoomForBooking
}) {
  const [checkInDate, setCheckInDate] = useState(getTodayString());
  const [checkOutDate, setCheckOutDate] = useState(getFutureDateString(2));
  const [roomType, setRoomType] = useState('All');
  const [guests, setGuests] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

  const nights = useMemo(() => {
    return calculateNights(checkInDate, checkOutDate);
  }, [checkInDate, checkOutDate]);

  const matchingRooms = useMemo(() => {
    if (!checkInDate || !checkOutDate || nights <= 0) return [];

    let available = getAvailableRooms(rooms, bookings, {
      checkInDate,
      checkOutDate,
      guests,
      roomType: roomType === 'All' ? null : roomType,
    });

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      available = available.filter(
        (r) =>
          r.roomNumber.toLowerCase().includes(q) ||
          r.type.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q)
      );
    }

    return available;
  }, [rooms, bookings, checkInDate, checkOutDate, nights, guests, roomType, searchQuery]);

  const handleBookRoom = (room) => {
    onClose();
    if (onSelectRoomForBooking) {
      onSelectRoomForBooking(room, checkInDate, checkOutDate, guests);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Check Room Availability"
      subtitle="Find available rooms for specific dates without double booking"
      maxWidth="720px"
    >
      <div className="availability-checker-container">
        {/* Filters */}
        <div className="checker-filters-grid">
          <div className="form-group">
            <label className="form-label">Check-in</label>
            <input
              type="date"
              className="form-input"
              value={checkInDate}
              onChange={(e) => setCheckInDate(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Check-out</label>
            <input
              type="date"
              className="form-input"
              value={checkOutDate}
              min={checkInDate || undefined}
              onChange={(e) => setCheckOutDate(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Room Type</label>
            <select
              className="form-select"
              value={roomType}
              onChange={(e) => setRoomType(e.target.value)}
            >
              {ROOM_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Guests</label>
            <input
              type="number"
              min="1"
              max="10"
              className="form-input"
              value={guests}
              onChange={(e) => setGuests(Math.max(1, parseInt(e.target.value) || 1))}
            />
          </div>
        </div>

        {/* Results Header */}
        <div className="checker-results-header">
          <div>
            <span className="results-count">
              <strong>{matchingRooms.length}</strong> room{matchingRooms.length !== 1 ? 's' : ''} available
            </span>
            <span className="results-dates">
              for {nights} night{nights !== 1 ? 's' : ''} ({checkInDate} to {checkOutDate})
            </span>
          </div>
          <input
            type="text"
            className="form-input search-mini"
            placeholder="Filter rooms..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Results List */}
        {nights <= 0 ? (
          <div className="alert-box alert-error">
            Check-out date must be after check-in date.
          </div>
        ) : matchingRooms.length === 0 ? (
          <div className="empty-checker-state">
            <XCircle size={28} className="empty-icon-muted" />
            <h4 className="empty-state-title">No Rooms Available</h4>
            <p className="empty-state-description">
              All rooms in this category or capacity are booked for the selected dates.
            </p>
          </div>
        ) : (
          <div className="checker-results-list">
            {matchingRooms.map((room) => {
              const estimatedTotal = room.pricePerNight * nights;
              return (
                <div key={room.id} className="checker-room-card">
                  <img src={room.image} alt={room.roomNumber} className="checker-room-thumb" />
                  <div className="checker-room-info">
                    <div className="checker-room-top">
                      <div>
                        <span className="chamber-num">Room {room.roomNumber}</span>
                        <RoomTypeBadge type={room.type} />
                      </div>
                      <div>
                        <span className="rate-amount">{formatCurrency(room.pricePerNight)}</span>
                        <span className="rate-period">/night</span>
                      </div>
                    </div>

                    <p className="checker-room-desc">{room.description}</p>

                    <div className="checker-room-footer">
                      <div className="checker-meta">
                        <span>
                          <Users size={12} style={{ verticalAlign: 'middle', marginRight: '3px' }} />
                          Max {room.capacity}
                        </span>
                        <span>Floor {room.floor}</span>
                        <span className="meta-total">
                          Total: <strong>{formatCurrency(estimatedTotal)}</strong>
                        </span>
                      </div>

                      <button
                        type="button"
                        className="btn btn-primary btn-xs"
                        onClick={() => handleBookRoom(room)}
                      >
                        Book Room <ArrowRight size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );
}
