/**
 * Core Hotel Booking Business Logic & Availability Engine
 */

/**
 * Calculate the number of nights between check-in and check-out dates.
 * Returns an integer >= 0, or 0 if dates are invalid.
 */
export function calculateNights(checkInDate, checkOutDate) {
  if (!checkInDate || !checkOutDate) return 0;

  const start = new Date(checkInDate);
  const end = new Date(checkOutDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;

  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays > 0 ? diffDays : 0;
}

/**
 * Calculate the total amount for a reservation.
 * Formula: Total Amount = Price Per Night × Number of Nights
 */
export function calculateTotalAmount(pricePerNight, numberOfNights) {
  const price = Number(pricePerNight) || 0;
  const nights = Number(numberOfNights) || 0;
  return price * nights;
}

/**
 * Check if two date ranges overlap using the required formula:
 * (New Check-in < Existing Check-out) AND (New Check-out > Existing Check-in)
 * 
 * @param {string} newCheckIn - YYYY-MM-DD
 * @param {string} newCheckOut - YYYY-MM-DD
 * @param {string} existingCheckIn - YYYY-MM-DD
 * @param {string} existingCheckOut - YYYY-MM-DD
 * @returns {boolean} True if ranges overlap
 */
export function isDateRangeOverlapping(newCheckIn, newCheckOut, existingCheckIn, existingCheckOut) {
  if (!newCheckIn || !newCheckOut || !existingCheckIn || !existingCheckOut) {
    return false;
  }
  // Standard lexicographical or Date comparison for ISO "YYYY-MM-DD" strings:
  return newCheckIn < existingCheckOut && newCheckOut > existingCheckIn;
}

/**
 * Find any conflicting bookings for a specific room during a proposed date range.
 * Rules:
 * - Only 'Confirmed' bookings can cause a conflict.
 * - 'Cancelled' reservations must NOT block room availability.
 * - When editing an existing booking, exclude itself by `excludeBookingId`.
 * 
 * @param {string|number} roomId - Target room ID
 * @param {string} checkInDate - Proposed check-in (YYYY-MM-DD)
 * @param {string} checkOutDate - Proposed check-out (YYYY-MM-DD)
 * @param {Array} bookings - Array of all booking objects
 * @param {string|number|null} excludeBookingId - Current booking ID to exclude if editing
 * @returns {Array} List of overlapping confirmed bookings
 */
export function findRoomConflicts(roomId, checkInDate, checkOutDate, bookings, excludeBookingId = null) {
  if (!roomId || !checkInDate || !checkOutDate || !Array.isArray(bookings)) {
    return [];
  }

  return bookings.filter((b) => {
    // Must match the room
    if (String(b.roomId) !== String(roomId)) return false;

    // Exclude current booking when editing
    if (excludeBookingId && String(b.id) === String(excludeBookingId)) {
      return false;
    }

    // Only 'Confirmed' bookings block rooms. 'Cancelled' bookings do not.
    // 'Completed' bookings are in the past; if dates overlap they are checked, but typically won't conflict with future dates.
    if (b.status !== 'Confirmed') {
      return false;
    }

    // Apply the overlap condition
    return isDateRangeOverlapping(checkInDate, checkOutDate, b.checkInDate, b.checkOutDate);
  });
}

/**
 * Determine if a room is available for a specified date range.
 */
export function isRoomAvailableForDates(roomId, checkInDate, checkOutDate, bookings, excludeBookingId = null) {
  const conflicts = findRoomConflicts(roomId, checkInDate, checkOutDate, bookings, excludeBookingId);
  return conflicts.length === 0;
}

/**
 * Filter rooms that match search criteria and have no overlapping confirmed reservations.
 * 
 * @param {Array} rooms - Array of all room records
 * @param {Array} bookings - Array of all booking records
 * @param {Object} criteria - { checkInDate, checkOutDate, guests, roomType }
 * @returns {Array} Available room records with conflict information
 */
export function getAvailableRooms(rooms, bookings, criteria = {}) {
  const { checkInDate, checkOutDate, guests, roomType } = criteria;

  return rooms.filter((room) => {
    // Filter by maintenance status
    if (room.status === 'Maintenance') {
      return false;
    }

    // Filter by room type if specified
    if (roomType && roomType !== 'All' && room.type.toLowerCase() !== roomType.toLowerCase()) {
      return false;
    }

    // Filter by capacity if specified
    if (guests && Number(guests) > Number(room.capacity)) {
      return false;
    }

    // If both dates are provided, verify availability against confirmed bookings
    if (checkInDate && checkOutDate) {
      const isAvailable = isRoomAvailableForDates(room.id, checkInDate, checkOutDate, bookings);
      if (!isAvailable) {
        return false;
      }
    }

    return true;
  });
}
