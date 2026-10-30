# PAIDI RESIDENCY — Hotel Booking Management Portal

> **A simple, practical, fully functional Hotel Booking Management Portal built with React.js, Vite, React Router DOM, Lucide Icons, and JSON Server REST API.**

Designed with a clean, minimal human-developed aesthetic using mostly white backgrounds, dark charcoal text, light grey separators, and olive accent highlights.

---

## 1. Brand Identity & Color Palette

- **Hotel Name**: **PAIDI RESIDENCY**
- **Primary Background**: `#FFFFFF` (White)
- **Secondary Background**: `#F5F5F3` (Light Grey Neutral)
- **Primary Text**: `#252525` (Dark Charcoal)
- **Secondary Text**: `#737373` (Medium Grey)
- **Borders & Dividers**: `#E5E5E5` (Light Grey hairline borders)
- **Accent Highlight**: `#777D68` (Muted Olive)
- **Success / Available**: `#166534` (Green)
- **Cancelled / Error**: `#991B1B` (Red)
- **Typography**: Clean, readable sans-serif (*Inter* / system sans-serif).

---

## 2. Modules & Core Functionality

### A. Dashboard (`/`)
- Dynamic statistics from JSON Server:
  - Total Rooms (12)
  - Available Rooms
  - Occupied Rooms
  - Total Customers (7)
  - Active Bookings
  - Total Revenue (from confirmed and completed bookings)
- Recent Bookings table with direct links to details.
- Upcoming Check-ins and Check-outs based on dates.
- Room Occupancy breakdown by category.

### B. Room Management (`/rooms`, `/rooms/:id`)
- Inventory table and optional card view.
- Room specifications: Room Number, Room Type, Capacity, Nightly Price, Availability Status, Description, Floor, and Amenities.
- Search by room number, filter by type (*Single*, *Double*, *Deluxe*, *Suite*, *Premium*), and filter by status (*Available*, *Occupied*, *Maintenance*).
- Full CRUD operations: Add Room, Edit Room, Delete Room, View Details.

### C. Customer Management (`/customers`, `/customers/:id`)
- Customer directory with Full Name, Email, Phone, Address, City, Country.
- Customer Details page with lifetime booking count, total spend in INR (₹), and complete stay ledger.
- Full CRUD operations: Add Customer, Edit Customer, Delete Customer, View Details.

### D. Booking Management (`/bookings`, `/bookings/:id`)
- Complete reservation management table: Booking Reference, Customer Name, Room Number, Check-in, Check-out, Nights, Total Amount, Booking Status.
- Search by reference code, customer name, or room number.
- Filter by status (*Confirmed*, *Completed*, *Cancelled*).
- Create Booking with:
  - Customer selection
  - Room selection
  - Check-in & check-out dates
  - Number of guests (validated against room capacity)
  - Automatic calculation of nights
  - Automatic calculation of total amount (`Price Per Night × Nights`)
  - Clear price breakdown preview
  - Auto-generated reference (e.g. `BK-8106`)
- **Strict Double-Booking Prevention**:
  Evaluates proposed dates against all existing confirmed bookings for that room using the overlap condition:
  $$\text{New Check-in} < \text{Existing Check-out} \quad \text{AND} \quad \text{New Check-out} > \text{Existing Check-in}$$
  If true, the booking is blocked with a clear warning. Cancelled bookings do not block rooms.
- **Dedicated Booking Details Page (`/bookings/:id`)**:
  - Printable invoice/voucher layout (`@media print` supported).
  - Itemized tariff computation table.
  - Cancellation action with confirmation modal.

### E. Date-Based Room Availability Checker
- Accessible from the sidebar and dashboard.
- Select check-in and check-out dates, room type, and guest count to see matching available rooms with direct booking buttons.

### F. Reports (`/reports`)
- Calculated dynamically from JSON Server data without fake charts:
  - Total Bookings, Confirmed, Completed, Cancelled.
  - Realized Revenue (Completed), Projected Revenue (Confirmed), and Cancelled Bookings Value.
  - Average Daily Rate (ADR).
  - Room category performance table with inventory, occupancy rate, nights sold, and revenue per category.

---

## 3. Technology Stack

- **Frontend**: React.js 19, Vite, React Router DOM v7, Lucide React icons, CSS3.
- **Backend / Database**: JSON Server (`db.json`) REST API on port 3000.
- **API Service Layer**: `src/services/api.js` (Fetch API with `response.ok` checks).

---

## 4. Setup & Running Instructions

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Start Application Concurrently
```bash
npm run dev
```
This runs both:
- JSON Server on `http://localhost:3000`
- React Vite dev server on `http://localhost:5173`

Or run them individually:
- **JSON Server**: `npm run server`
- **React Client**: `npm run client`

### Step 3: Run Automated Test Suite
```bash
npm test
```
Verifies all 5 REST operations across rooms, customers, bookings, tariff calculations, and the double-booking overlap logic.
