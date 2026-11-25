/**
 * MUT Bus Booking System - Schema Definitions
 * Defined directly from the Miniproject Entity & Attribute documentation:
 * Pages 1-4: แผนก, ตำแหน่ง, พนักงาน, สิทธิตามตำแหน่ง, หน้าจอ, เส้นทาง,
 * จุดจอดในเส้นทาง, จุดจอด, ยานพาหนะ, รอบรถ, ผู้ใช้งานระบบ, การจอง, รายละเอียดการจอง
 */

// 1. แผนก (Department)
export interface Department {
  department_id: number;
  name: string;
}

// 2. ตำแหน่ง (Position)
export interface Position {
  position_id: number;
  name: string;
}

// 3. พนักงาน (Employee / Staff)
export interface Employee {
  employee_id: string;
  fullname: string;
  username: string;
  password?: string;
  phone: string;
  email: string;
  department_id: number;
  position_id: number;
}

// 4. สิทธิตามตำแหน่ง (Role Permission - Associative Table M:N)
export interface RolePermission {
  permission_id: string;
  position_id: number;
  screen_id: number;
  can_view: boolean;
  can_edit: boolean;
}

// 5. หน้าจอ (Screen item)
export interface ScreenItem {
  screen_id: number;
  name: string;
  code: string;
  group: string;
}

// 6. จุดจอด (Bus Stop / Landmark)
export interface BusStop {
  stop_id: number;
  name: string;
  detail: string;
  status: number;
}

// 7. เส้นทาง (Route)
export interface Route {
  route_id: number;
  name: string;
  total_time: number;
  status: number;
}

// 8. จุดจอดในเส้นทาง (Route Stop sequence)
export interface RouteStop {
  route_stop_id: number;
  route_id: number;
  stop_id: number;
  stop_order: number;
  minutes_from_prev: number;
}

// 9. ยานพาหนะ (Vehicle)
export interface Vehicle {
  vehicle_id: string;
  license_plate: string;
  type: 'รถตู้' | 'รถบัส';
  capacity: number;
  status: number;
}

export interface VehicleType {
  vehicle_type_id: number;
  name: 'รถตู้' | 'รถบัส';
}

// 10. รอบรถ (Trip / Schedule)
export interface Trip {
  trip_id: number;
  route_id: number;
  driver_id: string;
  vehicle_id: string;
  service_date: string;
  departure_time: string;
  status: number;
}

// 11. ผู้ใช้งานระบบ (Passenger / System User)
export interface SystemUser {
  user_id: number;
  name: string;
  username: string;
  password: string;
  user_type: 'นักศึกษา' | 'อาจารย์' | 'บุคลากร';
  phone: string;
}

// 12. การจอง (Booking Transaction)
export interface Booking {
  booking_id: number;
  booking_code?: string;
  leg_type?: 'outbound' | 'return' | 'one-way';
  journey_type?: 'one-way' | 'round-trip';
  ticket_id?: string;
  user_id: number;
  trip_id: number;
  pickup_stop_id: number;
  dropoff_stop_id: number;
  pickup_route_stop_id?: number;
  dropoff_route_stop_id?: number;
  seat_count: number;
  status: number;
  action_status?: TicketActionStatus;
  is_checked_in: boolean;
  check_in_time?: string;
  alighted_at?: string | null;
  alighted_route_stop_id?: number | null;
  booking_time: string;
}

export interface DriverManifestPassenger {
  booking_id: number;
  booking_code: string;
  passenger_id: number;
  passenger_name: string;
  seat_count: number;
  status_code: number;
  checked_in_at?: string | null;
  alighted_at?: string | null;
  alighted_route_stop_id?: number | null;
}

// รายการผู้โดยสารที่จองแต่ไม่มาใช้บริการ ใช้ตอนคนขับกดปิดรอบ
// ค่าชุดนี้มาจาก API /driver/trips/:tripId/finish โดยตรง จึงเชื่อถือได้ว่าตรงกับฐานข้อมูล
export interface TripSummaryNoShow {
  booking_id: number;
  booking_code: string;
  passenger_name: string;
  passenger_phone?: string;
  pickup_stop_id?: number;
  seat_count: number;
}

export interface DriverTripStopManifest {
  route_stop_id: number;
  stop_id: number;
  stop_name: string;
  stop_order: number;
  scheduled_boardings: number;
  checked_in_boardings: number;
  scheduled_alightings: number;
  passengers_boarding: DriverManifestPassenger[];
  passengers_alighting: DriverManifestPassenger[];
}

// --------------------------------------------------------------------------
// 13. รายละเอียดการจอง (Booking Details - Entity & Ticket Status Specifications)
// --------------------------------------------------------------------------

export enum TicketStatusEnum {
  CONFIRMED = 'จองสำเร็จ',
  CHECKED_IN = 'เช็กอินแล้ว',
  COMPLETED = 'เสร็จสิ้น',
  CANCELLED = 'ยกเลิก',
  NO_SHOW = 'ไม่ได้ขึ้นรถ',
}

export type TicketActionStatus =
  | 'จองสำเร็จ'
  | 'เช็กอินแล้ว'
  | 'เสร็จสิ้น'
  | 'ยกเลิก'
  | 'ไม่ได้ขึ้นรถ';

export enum TicketStatusCode {
  CANCELLED = 0,
  CONFIRMED = 1,
  CHECKED_IN = 2,
  COMPLETED = 3,
  NO_SHOW = 4,
}

export interface TicketStatusMeta {
  key: string;
  statusCode: TicketStatusCode;
  actionStatus: TicketActionStatus;
  labelTh: string;
  labelEn: string;
  description: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  dotColor: string;
  canScan: boolean;
  canCancel: boolean;
}

export const TICKET_STATUS_CONFIG: Record<TicketActionStatus, TicketStatusMeta> = {
  'จองสำเร็จ': {
    key: 'confirmed',
    statusCode: TicketStatusCode.CONFIRMED,
    actionStatus: 'จองสำเร็จ',
    labelTh: 'จองสำเร็จ',
    labelEn: 'Confirmed',
    description: 'ผู้ใช้ทำรายการจองสำเร็จ ได้รับ QR Code พร้อมนำไปสแกนขึ้นรถ',
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-700',
    badgeBorder: 'border-emerald-200',
    dotColor: 'bg-emerald-500',
    canScan: true,
    canCancel: true,
  },
  'เช็กอินแล้ว': {
    key: 'checked_in',
    statusCode: TicketStatusCode.CHECKED_IN,
    actionStatus: 'เช็กอินแล้ว',
    labelTh: 'เช็กอินแล้ว',
    labelEn: 'Checked-in',
    description: 'พนักงานขับรถทำการสแกน QR Code หน้าตั๋วเพื่อยืนยันการขึ้นรถเรียบร้อยแล้ว',
    badgeBg: 'bg-emerald-700',
    badgeText: 'text-white',
    badgeBorder: 'border-emerald-800',
    dotColor: 'bg-white',
    canScan: false,
    canCancel: false,
  },
  'เสร็จสิ้น': {
    key: 'completed',
    statusCode: TicketStatusCode.COMPLETED,
    actionStatus: 'เสร็จสิ้น',
    labelTh: 'เสร็จสิ้น',
    labelEn: 'Completed',
    description: 'รอบรถเดินทางถึงจุดหมายปลายทางตามกำหนดเวลาเรียบร้อย',
    badgeBg: 'bg-sky-50',
    badgeText: 'text-sky-700',
    badgeBorder: 'border-sky-200',
    dotColor: 'bg-sky-500',
    canScan: false,
    canCancel: false,
  },
  'ยกเลิก': {
    key: 'cancelled',
    statusCode: TicketStatusCode.CANCELLED,
    actionStatus: 'ยกเลิก',
    labelTh: 'ยกเลิก',
    labelEn: 'Cancelled',
    description: 'ผู้ใช้งานหรือระบบทำการยกเลิกตั๋วเดินทางใบนั้น',
    badgeBg: 'bg-rose-50',
    badgeText: 'text-rose-700',
    badgeBorder: 'border-rose-200',
    dotColor: 'bg-rose-500',
    canScan: false,
    canCancel: false,
  },
  'ไม่ได้ขึ้นรถ': {
    key: 'no_show',
    statusCode: TicketStatusCode.NO_SHOW,
    actionStatus: 'ไม่ได้ขึ้นรถ',
    labelTh: 'ไม่ได้ขึ้นรถ',
    labelEn: 'No-Show',
    description: 'ตั๋วหมดเวลาเดินทางแล้ว โดยผู้โดยสารไม่ได้มาสแกนเช็กอินขึ้นรถ',
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-900',
    badgeBorder: 'border-amber-300',
    dotColor: 'bg-amber-500',
    canScan: false,
    canCancel: false,
  },
};

export function resolveTicketActionStatus(
  booking: {
    status: number;
    is_checked_in?: boolean;
    action_status?: TicketActionStatus;
  },
  trip?: { status?: number; departure_time?: string; service_date?: string } | null
): TicketActionStatus {
  if (booking.action_status) {
    return booking.action_status;
  }
  if (booking.status === 0) return 'ยกเลิก';
  if (booking.status === 4) return 'ไม่ได้ขึ้นรถ';
  if (booking.status === 3) return 'เสร็จสิ้น';
  if (booking.status === 2 || booking.is_checked_in) {
    if (trip && trip.status === 3) return 'เสร็จสิ้น';
    return 'เช็กอินแล้ว';
  }
  // status 1
  if (trip && trip.status === 3 && !booking.is_checked_in) {
    return 'ไม่ได้ขึ้นรถ';
  }
  return 'จองสำเร็จ';
}

export interface BookingDetail {
  detail_id: number;
  booking_id: number;
  trip_id: number;
  pickup_stop_id: number;
  dropoff_stop_id: number;
  seat_count: number;
  leg_type: 'outbound' | 'return' | 'one-way';
  /** Database status code; UI labels are derived with TICKET_STATUS_CONFIG. */
  status: TicketStatusCode;
  checked_in_at?: string | null;
  checked_in_by_employee_id?: string | null;
  alighted_at?: string | null;
  alighted_route_stop_id?: number | null;
  /** Compatibility field for existing mock/UI data during the migration phase. */
  action_status?: TicketActionStatus;
}

/** Normalized Oracle booking header. UI Booking remains unchanged for Phase 1. */
export interface BookingRecord {
  booking_id: number;
  booking_code: string;
  journey_type: 'one-way' | 'round-trip';
  user_id: number;
  booking_time: string;
}

/** Oracle persistence records. UI models above intentionally keep their existing shape. */
export type OracleFlag = 'Y' | 'N';

export interface OracleDepartmentRecord {
  department_id: number;
  department_name: string;
}

export interface OraclePositionRecord {
  position_id: number;
  position_name: string;
}

/** Authentication records expose hashes only; plaintext passwords remain UI/mock-only. */
export interface EmployeeAuthRecord {
  employee_id: string;
  full_name: string;
  username: string;
  password_hash: string;
  phone: string | null;
  email: string | null;
  department_id: number;
  position_id: number;
  is_active: OracleFlag;
  created_at: string;
  updated_at: string | null;
}

export interface OracleScreenRecord {
  screen_id: number;
  screen_code: string;
  screen_name: string;
  screen_group: string | null;
}

export interface OracleRolePermissionRecord {
  permission_id: number;
  position_id: number;
  screen_id: number;
  can_view: OracleFlag;
  can_edit: OracleFlag;
}

export interface SystemUserAuthRecord {
  user_id: number;
  name: string;
  username: string;
  password_hash: string;
  user_type: SystemUser['user_type'];
  phone: string;
  is_active: OracleFlag;
  created_at: string;
}

export interface OracleStopRecord {
  stop_id: number;
  name: string;
  description: string | null;
  status: 0 | 1;
}

/** Route duration is derived from ROUTE_STOP by a grouped query when needed. */
export interface OracleRouteRecord {
  route_id: number;
  name: string;
  status: 0 | 1;
}

export interface OracleRouteSummaryRecord extends OracleRouteRecord {
  total_time: number;
  stop_count: number;
}

export interface OracleRouteStopRecord {
  route_stop_id: number;
  route_id: number;
  stop_id: number;
  stop_order: number;
  minutes_from_prev: number;
}

export interface OracleVehicleTypeRecord {
  vehicle_type_id: number;
  name: string;
}

export interface OracleVehicleRecord {
  vehicle_id: string;
  license_plate: string;
  capacity: number;
  status: 0 | 1;
  vehicle_type_id: number;
}

/** Oracle stores trip time as one TIMESTAMP; the UI still consumes date + time. */
export interface OracleTripRecord {
  trip_id: number;
  route_id: number;
  driver_id: string;
  vehicle_id: string;
  departure_at: string;
  status: 0 | 1 | 2 | 3;
  actual_started_at: string | null;
  actual_finished_at: string | null;
}

export interface OracleSystemUserRecord extends SystemUserAuthRecord {}

/** One row per booking and trip; SEAT_COUNT is the reserved passenger quantity. */
export interface OracleBookingDetailRecord {
  detail_id: number;
  booking_id: number;
  trip_id: number;
  route_id: number;
  pickup_route_stop_id: number;
  dropoff_route_stop_id: number;
  seat_count: number;
  leg_type: NonNullable<Booking['leg_type']>;
  status_code: TicketStatusCode;
  created_at: string;
  checked_in_at: string | null;
  checked_in_by_employee_id: string | null;
  alighted_at: string | null;
  alighted_route_stop_id: number | null;
}

// ============================================================
// Data Science / Admin Report Types (From PDF Pages 4-10)
// ============================================================

export interface Report1MonthlyStopData {
  stopName: string;
  monthlyBoarding: number[];
  monthlyAlighting: number[];
  totalBoarding: number;
  totalAlighting: number;
}

export interface Report2MonthlyBookingStats {
  month: string;
  monthShort: string;
  bookingCount: number;
  bookedSeats: number;
  cancelled: number;
  checkedIn: number;
  noShow: number;
}

export interface Report3UserBehavior {
  userName: string;
  totalBookings: number;
  boardedActual: number;
  cancelled: number;
  noShow: number;
}

export interface Report4DailyRoutePassengers {
  dayName: string;
  route1: number;
  route2: number;
  route3: number;
  total: number;
}

export interface Report5StopScheduleUsage {
  stopName: string;
  time: string;
  boardingCount: number;
  alightingCount: number;
}

export interface Report6DriverAssignment {
  driverName: string;
  totalTrips: number;
  before1700: number;
  after1700: number;
}

export interface Report7VehicleAssignment {
  category: 'รถตู้ 9 ที่นั่ง' | 'รถบัส 20 ที่นั่ง' | 'รถมินิบัส 15 ที่นั่ง';
  plate: string;
  tripCount: number;
}

// ============================================================
// Figma & User Flow Spec Types
// ============================================================

export interface UserFlowNode {
  id: string;
  title: string;
  role: 'passenger' | 'driver' | 'admin' | 'system';
  screenCode?: string;
  description: string;
  nextNodes: string[];
  entityUsed: string[];
}

export interface FigmaFrameSpec {
  id: string;
  name: string;
  device: 'mobile' | 'desktop';
  width: number;
  height: number;
  screenGroup: string;
  code: string;
  description: string;
  entities: string[];
}
