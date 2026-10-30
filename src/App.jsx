import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useOutletContext } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';
import AppLayout from './components/layout/AppLayout';

import DashboardPage from './pages/DashboardPage';
import RoomsPage from './pages/RoomsPage';
import RoomDetailsPage from './pages/RoomDetailsPage';
import CustomersPage from './pages/CustomersPage';
import CustomerDetailsPage from './pages/CustomerDetailsPage';
import BookingsPage from './pages/BookingsPage';
import BookingDetailsPage from './pages/BookingDetailsPage';
import ReportsPage from './pages/ReportsPage';

// Context wrappers for pages needing layout triggers
function DashboardRoute() {
  const context = useOutletContext();
  return (
    <DashboardPage
      onNewBooking={context?.onNewBooking}
      onCheckAvailability={context?.onCheckAvailability}
    />
  );
}

function RoomDetailsRoute() {
  const context = useOutletContext();
  return <RoomDetailsPage onBookSpecificRoom={context?.onBookSpecificRoom} />;
}

function CustomerDetailsRoute() {
  const context = useOutletContext();
  return <CustomerDetailsPage onNewBookingForCustomer={context?.onNewBooking} />;
}

export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<DashboardRoute />} />
            <Route path="rooms" element={<RoomsPage />} />
            <Route path="rooms/:id" element={<RoomDetailsRoute />} />
            <Route path="customers" element={<CustomersPage />} />
            <Route path="customers/:id" element={<CustomerDetailsRoute />} />
            <Route path="bookings" element={<BookingsPage />} />
            <Route path="bookings/:id" element={<BookingDetailsPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}
