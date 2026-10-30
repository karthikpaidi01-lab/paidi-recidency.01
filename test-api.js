import { isDateRangeOverlapping, findRoomConflicts, calculateNights, calculateTotalAmount } from './src/utils/bookingLogic.js';

const BASE_URL = 'http://localhost:3000';

async function testREST() {
  console.log('=== RUNNING REST API & LOGIC TEST SUITE ===\n');

  // 1. TEST ROOMS
  console.log('1. Testing GET /rooms...');
  const roomsRes = await fetch(`${BASE_URL}/rooms`);
  if (!roomsRes.ok) throw new Error(`GET /rooms failed: ${roomsRes.status}`);
  const rooms = await roomsRes.json();
  console.log(`✓ GET /rooms: retrieved ${rooms.length} rooms (Expected >= 10: ${rooms.length >= 10})`);

  console.log('2. Testing GET /rooms/1...');
  const room1Res = await fetch(`${BASE_URL}/rooms/1`);
  if (!room1Res.ok) throw new Error(`GET /rooms/1 failed`);
  const room1 = await room1Res.json();
  console.log(`✓ GET /rooms/1: retrieved Room ${room1.roomNumber} (${room1.type})`);

  console.log('3. Testing POST /rooms...');
  const newRoomPayload = {
    roomNumber: '999',
    type: 'Suite',
    pricePerNight: 9999,
    capacity: 4,
    floor: 9,
    status: 'Available',
    image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427',
    description: 'Test Suite for automated verification.',
    amenities: ['Wi-Fi', 'Spa']
  };
  const postRoomRes = await fetch(`${BASE_URL}/rooms`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newRoomPayload)
  });
  if (!postRoomRes.ok) throw new Error(`POST /rooms failed`);
  const createdRoom = await postRoomRes.json();
  console.log(`✓ POST /rooms: created room id ${createdRoom.id}`);

  console.log('4. Testing PUT /rooms/:id...');
  createdRoom.pricePerNight = 10500;
  const putRoomRes = await fetch(`${BASE_URL}/rooms/${createdRoom.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(createdRoom)
  });
  if (!putRoomRes.ok) throw new Error(`PUT /rooms failed`);
  const updatedRoom = await putRoomRes.json();
  console.log(`✓ PUT /rooms/:id: updated rate to ${updatedRoom.pricePerNight}`);

  console.log('5. Testing DELETE /rooms/:id...');
  const delRoomRes = await fetch(`${BASE_URL}/rooms/${createdRoom.id}`, { method: 'DELETE' });
  if (!delRoomRes.ok) throw new Error(`DELETE /rooms failed`);
  console.log(`✓ DELETE /rooms/:id: deleted temporary room ${createdRoom.id}`);

  // 2. TEST CUSTOMERS
  console.log('\n6. Testing GET /customers...');
  const custRes = await fetch(`${BASE_URL}/customers`);
  const customers = await custRes.json();
  console.log(`✓ GET /customers: retrieved ${customers.length} customers (Expected >= 5: ${customers.length >= 5})`);

  console.log('7. Testing POST /customers...');
  const testCustomer = {
    fullName: 'Lady Genevieve Sterling',
    email: 'genevieve.sterling@mayfair.co.uk',
    phone: '+44 20 7946 0912',
    address: '10 Berkeley Square',
    city: 'London',
    country: 'United Kingdom',
    createdAt: '2026-10-30'
  };
  const postCustRes = await fetch(`${BASE_URL}/customers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testCustomer)
  });
  const createdCustomer = await postCustRes.json();
  console.log(`✓ POST /customers: created customer id ${createdCustomer.id}`);

  console.log('8. Testing PUT /customers/:id...');
  createdCustomer.city = 'Oxford';
  const putCustRes = await fetch(`${BASE_URL}/customers/${createdCustomer.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(createdCustomer)
  });
  const updatedCust = await putCustRes.json();
  console.log(`✓ PUT /customers/:id: updated city to ${updatedCust.city}`);

  console.log('9. Testing DELETE /customers/:id...');
  const delCustRes = await fetch(`${BASE_URL}/customers/${createdCustomer.id}`, { method: 'DELETE' });
  console.log(`✓ DELETE /customers/:id: deleted test customer ${createdCustomer.id}`);

  // 3. TEST BOOKINGS
  console.log('\n10. Testing GET /bookings...');
  const bookRes = await fetch(`${BASE_URL}/bookings`);
  const bookings = await bookRes.json();
  console.log(`✓ GET /bookings: retrieved ${bookings.length} bookings (Expected >= 5: ${bookings.length >= 5})`);

  // 4. TEST BUSINESS LOGIC & OVERLAP ENGINE
  console.log('\n11. Testing Business Logic Calculations...');
  const nights = calculateNights('2026-11-01', '2026-11-05');
  console.log(`✓ calculateNights('2026-11-01', '2026-11-05') = ${nights} nights (Expected: 4)`);
  if (nights !== 4) throw new Error('calculateNights mismatch');

  const total = calculateTotalAmount(2500, 3);
  console.log(`✓ calculateTotalAmount(2500, 3) = ₹${total} (Expected: 7500)`);
  if (total !== 7500) throw new Error('calculateTotalAmount mismatch');

  console.log('\n12. Testing Overlapping Booking Engine condition:');
  console.log('    New Check-in < Existing Check-out AND New Check-out > Existing Check-in');
  
  // Case A: Existing: 2026-11-10 to 2026-11-15
  // New: 2026-11-12 to 2026-11-14 (Inside) -> Overlaps!
  const overlap1 = isDateRangeOverlapping('2026-11-12', '2026-11-14', '2026-11-10', '2026-11-15');
  console.log(`✓ Overlap Test 1 (Interior overlap): ${overlap1} (Expected: true)`);
  if (!overlap1) throw new Error('Overlap 1 failed');

  // Case B: Existing: 2026-11-10 to 2026-11-15
  // New: 2026-11-05 to 2026-11-10 (Checkout on checkin date) -> No overlap!
  const overlap2 = isDateRangeOverlapping('2026-11-05', '2026-11-10', '2026-11-10', '2026-11-15');
  console.log(`✓ Overlap Test 2 (Back-to-back checkout/checkin): ${overlap2} (Expected: false)`);
  if (overlap2) throw new Error('Overlap 2 failed');

  // Case C: Existing: 2026-11-10 to 2026-11-15
  // New: 2026-11-15 to 2026-11-20 (Checkin on checkout date) -> No overlap!
  const overlap3 = isDateRangeOverlapping('2026-11-15', '2026-11-20', '2026-11-10', '2026-11-15');
  console.log(`✓ Overlap Test 3 (Back-to-back checkin/checkout): ${overlap3} (Expected: false)`);
  if (overlap3) throw new Error('Overlap 3 failed');

  // Case D: Existing: 2026-11-10 to 2026-11-15
  // New: 2026-11-08 to 2026-11-12 (Straddles checkin) -> Overlaps!
  const overlap4 = isDateRangeOverlapping('2026-11-08', '2026-11-12', '2026-11-10', '2026-11-15');
  console.log(`✓ Overlap Test 4 (Straddling check-in): ${overlap4} (Expected: true)`);
  if (!overlap4) throw new Error('Overlap 4 failed');

  // Case E: Cancelled reservation must NOT block room availability
  const mockBookings = [
    {
      id: 'mock-1',
      roomId: '11',
      checkInDate: '2026-11-10',
      checkOutDate: '2026-11-15',
      status: 'Cancelled'
    }
  ];
  const conflictsCancelled = findRoomConflicts('11', '2026-11-12', '2026-11-14', mockBookings);
  console.log(`✓ Overlap Test 5 (Cancelled reservation does not block): ${conflictsCancelled.length === 0} (Expected: true)`);
  if (conflictsCancelled.length !== 0) throw new Error('Cancelled booking blocked room');

  console.log('\n=== ALL TESTS PASSED SUCCESSFULLY! ===\n');
}

testREST().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
