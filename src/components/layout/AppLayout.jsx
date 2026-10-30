import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import BookingFormModal from '../bookings/BookingFormModal';
import AvailabilityCheckerModal from '../availability/AvailabilityCheckerModal';
import { roomApi, customerApi, bookingApi } from '../../services/api';

export default function AppLayout() {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [bookings, setBookings] = useState([]);

  // Modal triggers
  const [isNewBookingOpen, setIsNewBookingOpen] = useState(false);
  const [isAvailabilityOpen, setIsAvailabilityOpen] = useState(false);
  const [preselectedRoomId, setPreselectedRoomId] = useState(null);

  const refreshGlobalData = async () => {
    try {
      const [roomsData, custsData, bookingsData] = await Promise.all([
        roomApi.getAll(),
        customerApi.getAll(),
        bookingApi.getAll(),
      ]);
      setRooms(roomsData || []);
      setCustomers(custsData || []);
      setBookings(bookingsData || []);
    } catch (err) {
      console.error('Error refreshing layout data:', err);
    }
  };

  useEffect(() => {
    refreshGlobalData();
  }, []);

  const handleOpenNewBooking = (preselectedRoom = null) => {
    if (preselectedRoom && preselectedRoom.id) {
      setPreselectedRoomId(preselectedRoom.id);
    } else {
      setPreselectedRoomId(null);
    }
    setIsNewBookingOpen(true);
  };

  const handleOpenAvailability = () => {
    setIsAvailabilityOpen(true);
  };

  const handleSelectRoomFromChecker = (room, checkIn, checkOut, guests) => {
    setPreselectedRoomId(room.id);
    setIsNewBookingOpen(true);
  };

  return (
    <div className="app-shell">
      {/* Left Navigation Sidebar */}
      <Sidebar
        onQuickBooking={() => handleOpenNewBooking(null)}
        onCheckAvailability={handleOpenAvailability}
      />

      {/* Main View Area */}
      <div className="app-main-wrapper">
        <Navbar />

        <main className="main-content">
          <Outlet
            context={{
              onNewBooking: () => handleOpenNewBooking(null),
              onCheckAvailability: handleOpenAvailability,
              onBookSpecificRoom: (room) => handleOpenNewBooking(room),
              refreshGlobalData,
            }}
          />
        </main>
      </div>

      {/* Global New Reservation Modal */}
      <BookingFormModal
        isOpen={isNewBookingOpen}
        onClose={() => {
          setIsNewBookingOpen(false);
          setPreselectedRoomId(null);
        }}
        rooms={rooms}
        customers={customers}
        allBookings={bookings}
        preselectedRoomId={preselectedRoomId}
        onSuccess={() => {
          refreshGlobalData();
          navigate('/bookings');
        }}
      />

      {/* Global Availability Checker Modal */}
      <AvailabilityCheckerModal
        isOpen={isAvailabilityOpen}
        onClose={() => setIsAvailabilityOpen(false)}
        rooms={rooms}
        bookings={bookings}
        onSelectRoomForBooking={handleSelectRoomFromChecker}
      />
    </div>
  );
}
