# MUT Shuttle Bus System

React + TypeScript + Vite Shuttle Bus prototype with an Express API for Oracle Database 19c. Passenger and driver sessions use the Oracle API; admin and design/mock flows remain available as before.

## Requirements

- Node.js and npm
- Oracle Database 19c access
- The Oracle `oracledb` Node.js driver (installed with project dependencies)

## Create the Oracle schema

1. Confirm that you are connected in SQL Developer to the intended, empty Mini Project schema.
2. Open the repository's `database.sql` in SQL Developer.
3. Run the script with **Run Script (F5)** only when setting up a new, empty schema. It creates the tables, constraints, and supporting indexes. The schema is already created in the current Mini Project Oracle database; do not rerun this script there. To update an existing schema from seat-number bookings, run [migrations/002_booking_detail_seat_count.sql](migrations/002_booking_detail_seat_count.sql) once instead.
4. The script contains no `DROP` statements and does not insert seed rows. Development UI data remains in `src/data/mockDatabase.ts`.
5. For an existing schema, run [migrations/004_web_visibility_and_admin_updates.sql](migrations/004_web_visibility_and_admin_updates.sql) once to add web-only hide tracking. This does not delete or modify existing booking/master rows.

Route duration is derived by querying `ROUTE` with `ROUTE_STOP` and grouping by route, using `SUM(MINUTES_FROM_PREV)` and `COUNT(ROUTE_STOP_ID)`. No database view is required. Each `BOOKING_DETAIL` row stores the number of seats booked for one trip and route segment; individual seat numbers are not stored. Status code `0` means cancelled and releases that quantity from trip capacity.

## Configure and start the API

1. Copy `.env.example` to `.env`.
2. Set `ORACLE_USER`, `ORACLE_PASSWORD`, `ORACLE_CONNECT_STRING`, and `API_PORT` in `.env`. Keep `.env` local and do not commit credentials.
3. Install dependencies with `npm install`.
4. Start the Express API with `npm run dev:api`.
5. Check `http://localhost:<API_PORT>/api/health`. The health route checks Oracle with `SELECT 1 FROM DUAL`.
6. Start the React UI with `npm run dev`. Vite proxies `/api` to the API port in `.env`.

The backend reads all Oracle connection settings from environment variables and uses an `oracledb` connection pool. Starting the API does not create or seed the schema.

## Phase 2 API

All database-backed API routes use Oracle. Route duration is selected directly from `ROUTE` and `ROUTE_STOP`; no view is required.

- `POST /api/auth/passenger/login`, `POST /api/auth/driver/login`, `GET /api/auth/me`, `POST /api/auth/logout`
- `GET /api/routes`, `GET /api/routes/:routeId/stops`, `GET /api/trips`, `GET /api/trips/:tripId/seats`
- `POST /api/bookings`, `GET /api/bookings/me?filter=upcoming|completed|cancelled`, `POST /api/bookings/:bookingId/cancel`
- `POST /api/bookings/:bookingId/hide` hides a ticket only for its owner; Oracle booking records remain unchanged.
- `GET /api/driver/trips`, `GET /api/driver/trips/:tripId/passengers`, `POST /api/driver/trips/:tripId/start`, `POST /api/driver/trips/:tripId/check-in`, `POST /api/driver/trips/:tripId/alight`, `POST /api/driver/trips/:tripId/finish`
- Admin master create/update, permission and trip-status mutations are persisted through `/api/admin/*`. Web hide operations create visibility markers; they do not physically delete or alter the underlying Oracle record.

Use the returned bearer token in the `Authorization` header for booking and driver routes. Sessions are held in API memory for 12 hours and are invalidated when the API restarts. Driver routes re-check the dynamic `ROLE_PERMISSION` entry for screen code `8820` and require edit permission for trip mutations.

Login verifies `PASSWORD_HASH` values in the format `scrypt$16384$8$1$<salt-base64url>$<key-base64url>`. The backend provides a built-in scrypt hash helper; no plaintext password is stored or returned. Booking requests accept `pickup_route_stop_id` and `dropoff_route_stop_id` so repeated stops on a route are unambiguous. Each booking detail row stores a seat count from 1 to 4; the API enforces that limit, the 20-minute pickup cutoff, route order, and trip capacity while locking the trip row.

Passenger and driver UI flows use these Oracle-backed endpoints after API login. UI state is adapted to the existing components, and the original mock/admin flows remain available. Driver stop summaries calculate scheduled alightings from booking drop-off stops; the schema has no separate event for recording a passenger physically getting off. Passenger QR codes contain the API-issued booking code. Drivers can scan them with a camera, or enter the booking code manually if camera access is unavailable. Camera access requires a secure browser context (HTTPS or localhost) and user permission.

## Development seed and end-to-end flow

Development seed rows are synthetic and are kept out of `database.sql`. Set `DEV_SEED_PASSWORD` to a private value of at least 12 characters in the ignored local `.env`, then run `npm run seed:dev`. The seed script uses the same scrypt helper as login and stores only the resulting hash. It creates or refreshes only its named development fixtures with `MERGE` and insert-if-absent statements; it does not drop tables or delete rows.

To populate the booking calendar with sample service, run `npm run seed:booking-demo` after `npm run seed:dev`. It creates three sample routes and recurring departures from the database's current date through the 5th of next month, reusing an active employee and vehicle. It is safe to rerun; it only removes unbooked demo trips outside that date range. The passenger date picker is limited to the same range. The trips and route data are synthetic examples and should be replaced with the university's approved timetable before production use.

To extend the recurring trip schedule, run `npm run seed:trips`. It copies the schedule pattern (routes, departure times, driver rotation, and vehicle rotation) from the busiest day in the last 7 days, then fills every day from tomorrow through the 9th of the current month. Pass a `YYYY-MM-DD` argument to change the end date, for example `npx tsx scripts/seed-trip-schedule.ts 2026-10-09`. Trips that already exist are skipped and the driver/vehicle conflicts are checked before each insert, so the script is safe to rerun.

Development usernames are `dev.passenger@example.test`, `dev.driver@example.test`, and `dev.admin@example.test`. Use the value you set in `DEV_SEED_PASSWORD` in the login form. The development seed grants the admin fixture edit permission for employee, position, and department masters. In API mode the admin create/update/hide and trip-status actions are persisted to Oracle. The development trip is scheduled for the next day at 09:00, so the 20-minute booking cutoff can be tested. Start `npm run dev:api` and `npm run dev` in separate terminals before signing in.

To verify QR encode/decode and the Oracle check-in lifecycle, start the API and run `npm run test:e2e:dev`. The test creates and cancels synthetic development bookings, checks invalid and repeated QR payloads, and closes its test trip.

## Checks

- `npm run lint` — TypeScript check for the app.
- `npm run build` — Vite production build.
- `npm run build:api` — TypeScript check for the API.

Camera QR scanning and database-backed reports remain future work. UI-facing models are retained for mock compatibility; Oracle persistence record types are declared separately in `src/types/schema.ts`.
