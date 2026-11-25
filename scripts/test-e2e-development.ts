import 'dotenv/config';
import assert from 'node:assert/strict';
import QRCode from 'qrcode';
import jsQR from 'jsqr';

const password = process.env.DEV_SEED_PASSWORD;
const port = Number(process.env.API_PORT ?? 3101);
if (!password) throw new Error('DEV_SEED_PASSWORD is required in the local .env.');
const base = `http://127.0.0.1:${port}/api`;
let token = '';
let driverToken = '';
let passed = 0;
async function request<T>(path: string, init: RequestInit = {}, auth = token): Promise<{ status: number; data: T }> {
  const headers = new Headers(init.headers);
  if (auth) headers.set('Authorization', `Bearer ${auth}`);
  if (init.body) headers.set('Content-Type', 'application/json');
  const response = await fetch(`${base}${path}`, { ...init, headers });
  const data = await response.json().catch(() => ({})) as T;
  return { status: response.status, data };
}
function test(name: string, condition: boolean) {
  assert.ok(condition, name);
  passed++;
  console.log(`PASS ${name}`);
}

const passengerLogin = await request<{ token: string }>('/auth/passenger/login', { method: 'POST', body: JSON.stringify({ username: 'dev.passenger@example.test', password }) }, '');
test('User login succeeds', passengerLogin.status === 200 && Boolean(passengerLogin.data.token));
token = passengerLogin.data.token;
const driverLogin = await request<{ token: string }>('/auth/driver/login', { method: 'POST', body: JSON.stringify({ username: 'dev.driver@example.test', password }) }, '');
test('Driver login succeeds', driverLogin.status === 200 && Boolean(driverLogin.data.token));
driverToken = driverLogin.data.token;

const routes = await request<{ routes: Record<string, unknown>[] }>('/routes');
// ต้องรัน seed:dev ก่อน test:e2e:dev เสมอ — seed-dev เปิด STATUS=1 ให้ Development Shuttle Loop
// ถ้าเคยรัน seed-pdf-routes มาก่อน (มันซ่อน loop เป็น STATUS=0) ให้กลับไปรัน seed:dev ใหม่ก่อน
const route = routes.data.routes.find((r) => r.NAME === 'Development Shuttle Loop');
test('User can see Oracle route catalog', routes.status === 200 && Boolean(route));
assert.ok(route);
const stops = await request<{ stops: Record<string, unknown>[] }>(`/routes/${route.ROUTE_ID}/stops`);
const trips = await request<{ trips: Record<string, unknown>[] }>(`/trips?routeId=${route.ROUTE_ID}`);
const tripCandidates = trips.data.trips.filter((t) => t.DRIVER_ID === 'DEVDR001' && Number(t.STATUS) === 1);
const trip = tripCandidates.sort((a, b) => Number(a.TRIP_ID) - Number(b.TRIP_ID)).at(-1);
test('User can see route stops and bookable trip', stops.status === 200 && stops.data.stops.length >= 2 && Boolean(trip));
assert.ok(trip);
const seatView = await request<{ capacity: number; booked_count: number; remaining_count: number }>(`/trips/${trip.TRIP_ID}/seats`);
test('User can see seat capacity and remaining count', seatView.status === 200 && seatView.data.capacity > 0 && seatView.data.remaining_count >= 1);
const pickup = stops.data.stops[0], dropoff = stops.data.stops[stops.data.stops.length - 1];
const body = (seat_count: number) => JSON.stringify({ trip_id: trip.TRIP_ID, pickup_route_stop_id: pickup.ROUTE_STOP_ID, dropoff_route_stop_id: dropoff.ROUTE_STOP_ID, seat_count });
const booking = await request<{ booking_id: number; booking_code: string; seat_count: number }>('/bookings', { method: 'POST', body: body(1) });
test('One seat booking succeeds and returns booking code for QR payload', booking.status === 201 && Boolean(booking.data.booking_code) && booking.data.seat_count === 1);
const additionalBooking = await request<{ booking_id: number }>('/bookings', { method: 'POST', body: body(1) });
test('Additional seat quantity can be booked independently', additionalBooking.status === 201);
const tooMany = await request('/bookings', { method: 'POST', body: body(5) });
test('Booking is limited to four seats', tooMany.status === 400);
const cancel = await request(`/bookings/${booking.data.booking_id}/cancel`, { method: 'POST' });
const seatsAfterCancel = await request<{ booked_count: number }>(`/trips/${trip.TRIP_ID}/seats`);
test('Cancellation releases its seat quantity', cancel.status === 200 && seatsAfterCancel.data.booked_count === seatView.data.booked_count + 1);
const checkedBooking = await request<{ booking_id: number; booking_code: string }>('/bookings', { method: 'POST', body: body(1) });
const noShowBooking = await request<{ booking_id: number }>('/bookings', { method: 'POST', body: body(1) });
test('Seat quantity can be booked again after cancellation', checkedBooking.status === 201 && noShowBooking.status === 201);
// เคลียร์ใบส่วนเกินจากการทดสอบข้างบน — ไม่งั้นยอด finish จะนับ no-show เกิน
const clearExtra = await request(`/bookings/${additionalBooking.data.booking_id}/cancel`, { method: 'POST' });
test('Extra probe booking is cleared before finish', clearExtra.status === 200);
const qr = QRCode.create(checkedBooking.data.booking_code);
const scale = 8, quietZone = 4, dimension = (qr.modules.size + quietZone * 2) * scale;
const pixels = new Uint8ClampedArray(dimension * dimension * 4);
for (let y = 0; y < dimension; y++) for (let x = 0; x < dimension; x++) {
  const row = Math.floor(y / scale) - quietZone, col = Math.floor(x / scale) - quietZone;
  const dark = row >= 0 && col >= 0 && row < qr.modules.size && col < qr.modules.size && qr.modules.get(row, col) === 1;
  const offset = (y * dimension + x) * 4;
  pixels[offset] = pixels[offset + 1] = pixels[offset + 2] = dark ? 0 : 255;
  pixels[offset + 3] = 255;
}
const decoded = jsQR(pixels, dimension, dimension);
test('Generated passenger QR decodes to the API booking code', decoded?.data === checkedBooking.data.booking_code);
const myBookings = await request<{ bookings: Record<string, unknown>[] }>('/bookings/me');
test('User can view own bookings', myBookings.status === 200 && myBookings.data.bookings.some((b) => b.BOOKING_ID === checkedBooking.data.booking_id));
const driverTrips = await request<{ trips: Record<string, unknown>[] }>('/driver/trips', {}, driverToken);
test('Driver sees assigned trip', driverTrips.status === 200 && driverTrips.data.trips.some((t) => Number(t.TRIP_ID) === Number(trip.TRIP_ID)));
const manifest = await request<{ passengers: Record<string, unknown>[] }>(`/driver/trips/${trip.TRIP_ID}/passengers`, {}, driverToken);
test('Driver sees trip bookings and passengers', manifest.status === 200 && manifest.data.passengers.some((p) => Number(p.booking_id) === checkedBooking.data.booking_id) && manifest.data.passengers.some((p) => Number(p.booking_id) === noShowBooking.data.booking_id));
test('Driver manifest rows carry the requested trip id', manifest.status === 200 && manifest.data.passengers.length > 0 && manifest.data.passengers.every((p) => Number(p.trip_id) === Number(trip.TRIP_ID)));
const start = await request(`/driver/trips/${trip.TRIP_ID}/start`, { method: 'POST' }, driverToken);
test('Driver can start trip', start.status === 200);
const invalidCheckin = await request(`/driver/trips/${trip.TRIP_ID}/check-in`, { method: 'POST', body: JSON.stringify({ qr_payload: 'INVALID-QR-CODE', route_stop_id: pickup.ROUTE_STOP_ID }) }, driverToken);
test('Invalid QR payload is rejected', invalidCheckin.status === 409);
const missingStopCheckin = await request(`/driver/trips/${trip.TRIP_ID}/check-in`, { method: 'POST', body: JSON.stringify({ qr_payload: checkedBooking.data.booking_code }) }, driverToken);
test('Check-in without current stop is rejected', missingStopCheckin.status === 400);
const wrongStopCheckin = await request(`/driver/trips/${trip.TRIP_ID}/check-in`, { method: 'POST', body: JSON.stringify({ qr_payload: checkedBooking.data.booking_code, route_stop_id: dropoff.ROUTE_STOP_ID }) }, driverToken);
test('Check-in for a different pickup stop is rejected', wrongStopCheckin.status === 409);
const checkin = await request(`/driver/trips/${trip.TRIP_ID}/check-in`, { method: 'POST', body: JSON.stringify({ qr_payload: checkedBooking.data.booking_code, route_stop_id: pickup.ROUTE_STOP_ID }) }, driverToken);
test('Driver can check in matching trip booking code', checkin.status === 200);
const repeatedCheckin = await request(`/driver/trips/${trip.TRIP_ID}/check-in`, { method: 'POST', body: JSON.stringify({ qr_payload: checkedBooking.data.booking_code, route_stop_id: pickup.ROUTE_STOP_ID }) }, driverToken);
test('Already checked-in booking is rejected', repeatedCheckin.status === 409);
// ข้อสรุป: 1 ใบจองลงพร้อมกันทั้งกลุ่ม — ไม่แยกที่นั่ง/จุด
// alight ก่อน check-in ต้อง 409 / alight ครั้งแรก 200 / alight ซ้ำต้อง 409
const earlyAlight = await request(`/driver/trips/${trip.TRIP_ID}/alight`, { method: 'POST', body: JSON.stringify({ booking_id: noShowBooking.data.booking_id }) }, driverToken);
test('Alighting before check-in is rejected', earlyAlight.status === 409);
const alight = await request<{ status: string; alighted_count: number; alighted_route_stop_id: number }>(`/driver/trips/${trip.TRIP_ID}/alight`, { method: 'POST', body: JSON.stringify({ booking_id: checkedBooking.data.booking_id }) }, driverToken);
test('Driver can alight whole booking in one press', alight.status === 200 && alight.data.status === 'alighted' && alight.data.alighted_count === 1);
const repeatedAlight = await request(`/driver/trips/${trip.TRIP_ID}/alight`, { method: 'POST', body: JSON.stringify({ booking_id: checkedBooking.data.booking_id }) }, driverToken);
test('Already alighted booking is rejected', repeatedAlight.status === 409);
const manifestAfterAlight = await request<{ stops: Record<string, unknown>[] }>(`/driver/trips/${trip.TRIP_ID}/passengers`, {}, driverToken);
test('Alighted booking keeps alight timestamp in manifest', manifestAfterAlight.status === 200 && JSON.stringify(manifestAfterAlight.data).includes('alighted_at'));
const finish = await request<{ summary: { boarded_count: number; no_show_count: number } }>(`/driver/trips/${trip.TRIP_ID}/finish`, { method: 'POST' }, driverToken);
test('Driver can finish trip and receive no-show summary', finish.status === 200 && finish.data.summary.boarded_count === 1 && finish.data.summary.no_show_count === 1);
console.log(`RESULT ${passed}/27 checks passed`);
