/**
 * API Service Layer for Hotel Booking Management Portal
 * Centralized REST API calls with Fetch API and error handling
 * 
 * Configurable via VITE_API_URL environment variable for production hosting.
 * Defaults to http://localhost:3000 for local development with JSON Server.
 */

const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/+$/, '');

/**
 * Generic request helper with response.ok validation and JSON parsing
 */
async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      let errorMessage = `HTTP error ${response.status}: ${response.statusText}`;
      try {
        const errorData = await response.json();
        if (errorData && errorData.message) {
          errorMessage = errorData.message;
        }
      } catch {
        // Fallback to response.statusText if not json
      }
      throw new Error(errorMessage);
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return null;
    }

    return await response.json();
  } catch (err) {
    console.error(`API Error on ${options.method || 'GET'} ${url}:`, err.message);
    if (err.message === 'Failed to fetch' || err.name === 'TypeError') {
      throw new Error(
        `Unable to connect to backend API at ${BASE_URL}. If running locally, start JSON Server (npm run server). For production, set VITE_API_URL to your hosted backend.`
      );
    }
    throw err;
  }
}

// ============================================================================
// ROOM APIs
// ============================================================================

export const roomApi = {
  /**
   * GET all rooms
   */
  async getAll() {
    return await request('/rooms');
  },

  /**
   * GET room by ID
   */
  async getById(id) {
    return await request(`/rooms/${id}`);
  },

  /**
   * POST create new room
   */
  async create(roomData) {
    return await request('/rooms', {
      method: 'POST',
      body: JSON.stringify(roomData),
    });
  },

  /**
   * PUT update entire room
   */
  async update(id, roomData) {
    return await request(`/rooms/${id}`, {
      method: 'PUT',
      body: JSON.stringify(roomData),
    });
  },

  /**
   * PATCH update partial room fields (e.g., status)
   */
  async patch(id, partialData) {
    return await request(`/rooms/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(partialData),
    });
  },

  /**
   * DELETE room
   */
  async delete(id) {
    return await request(`/rooms/${id}`, {
      method: 'DELETE',
    });
  },
};

// ============================================================================
// CUSTOMER APIs
// ============================================================================

export const customerApi = {
  /**
   * GET all customers
   */
  async getAll() {
    return await request('/customers');
  },

  /**
   * GET customer by ID
   */
  async getById(id) {
    return await request(`/customers/${id}`);
  },

  /**
   * POST create new customer
   */
  async create(customerData) {
    return await request('/customers', {
      method: 'POST',
      body: JSON.stringify(customerData),
    });
  },

  /**
   * PUT update customer
   */
  async update(id, customerData) {
    return await request(`/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(customerData),
    });
  },

  /**
   * DELETE customer
   */
  async delete(id) {
    return await request(`/customers/${id}`, {
      method: 'DELETE',
    });
  },
};

// ============================================================================
// BOOKING APIs
// ============================================================================

export const bookingApi = {
  /**
   * GET all bookings
   */
  async getAll() {
    return await request('/bookings');
  },

  /**
   * GET booking by ID
   */
  async getById(id) {
    return await request(`/bookings/${id}`);
  },

  /**
   * POST create new booking
   */
  async create(bookingData) {
    return await request('/bookings', {
      method: 'POST',
      body: JSON.stringify(bookingData),
    });
  },

  /**
   * PUT update booking
   */
  async update(id, bookingData) {
    return await request(`/bookings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(bookingData),
    });
  },

  /**
   * PATCH partial update (e.g. status change to Cancelled / Completed)
   */
  async patch(id, partialData) {
    return await request(`/bookings/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(partialData),
    });
  },

  /**
   * DELETE booking
   */
  async delete(id) {
    return await request(`/bookings/${id}`, {
      method: 'DELETE',
    });
  },
};

export { BASE_URL };

export default {
  rooms: roomApi,
  customers: customerApi,
  bookings: bookingApi,
  BASE_URL,
};
