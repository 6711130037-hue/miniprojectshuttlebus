import {
  Department,
  Position,
  Employee,
  RolePermission,
  ScreenItem,
  BusStop,
  Route,
  RouteStop,
  Vehicle,
  Trip,
  SystemUser,
  Booking,
  UserFlowNode,
  FigmaFrameSpec,
  Report1MonthlyStopData,
  Report2MonthlyBookingStats,
  Report3UserBehavior,
  Report4DailyRoutePassengers,
  Report5StopScheduleUsage,
  Report6DriverAssignment,
  Report7VehicleAssignment,
} from '../types/schema';

// ============================================================
// REALTIME DATE HELPERS
// ============================================================
const pad2 = (n: number) => String(n).padStart(2, '0');

export const toYMD = (d: Date): string =>
  `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

export const toYMDHM = (d: Date): string =>
  `${toYMD(d)} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;

const _today = new Date();
const _tomorrow = new Date(_today);
_tomorrow.setDate(_today.getDate() + 1);

export const TODAY_STR = toYMD(_today);
export const TOMORROW_STR = toYMD(_tomorrow);
export const TODAY_LABEL = `วันนี้ (${_today.getDate()} ${['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'][_today.getMonth()]})`;
export const TOMORROW_LABEL = `พรุ่งนี้ (${_tomorrow.getDate()} ${['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'][_tomorrow.getMonth()]})`;

// 1. แผนก
export const initialDepartments: Department[] = [
  { department_id: 1, name: 'ฝ่ายบริหาร' },
  { department_id: 2, name: 'ฝ่ายเทคนิค' },
  { department_id: 3, name: 'ฝ่ายบริการและปฏิบัติการ' },
];

// 2. ตำแหน่ง
export const initialPositions: Position[] = [
  { position_id: 1, name: 'หัวหน้าฝ่าย' },
  { position_id: 2, name: 'รองหัวหน้าฝ่าย' },
  { position_id: 8, name: 'พนักงานขับรถ' },
];

// 3. พนักงาน
export const initialEmployees: Employee[] = [
  { employee_id: '00001', fullname: 'สมชาย ใจดี', username: 'somchai', password: '123456', phone: '081-234-5678', email: 'somchai@mut.ac.th', department_id: 1, position_id: 1 },
  { employee_id: '00002', fullname: 'สมหมาย ใจรัก', username: 'sommai', password: '123456', phone: '089-123-4567', email: 'sommai@mut.ac.th', department_id: 3, position_id: 8 },
  { employee_id: '00003', fullname: 'สมควร ใจงาม', username: 'somkuan', password: '123456', phone: '086-789-0123', email: 'somkuan@mut.ac.th', department_id: 3, position_id: 8 },
  { employee_id: '00004', fullname: 'อารีรัตน์ ศรีสุข', username: 'areerat', password: '123456', phone: '085-333-4455', email: 'areerat@mut.ac.th', department_id: 3, position_id: 8 },
  { employee_id: '00005', fullname: 'วรพล เทพทอง', username: 'worapon', password: '123456', phone: '084-777-8899', email: 'worapon@mut.ac.th', department_id: 3, position_id: 8 },
  { employee_id: '00006', fullname: 'นันทนา ใจตรง', username: 'nantana', password: '123456', phone: '082-999-1122', email: 'nantana@mut.ac.th', department_id: 3, position_id: 8 },
];

// 4. หน้าจอ
export const initialScreens: ScreenItem[] = [
  { screen_id: 10, name: 'จัดการรอบรถ (Code 3456)', code: '3456', group: 'จัดการรอบรถ' },
  { screen_id: 12, name: 'จัดการเส้นทาง (Code 6794)', code: '6794', group: 'จัดการเส้นทาง' },
  { screen_id: 14, name: 'ตรวจเช็คอินผู้โดยสาร (Code 8820)', code: '8820', group: 'งานบริการ' },
  { screen_id: 16, name: 'กำหนดสิทธิ์ตามตำแหน่ง (Code 9102)', code: '9102', group: 'ผู้ดูแลระบบ' },
  { screen_id: 18, name: 'รายงานและข้อมูลสถิติ (Reports)', code: '4450', group: 'รายงาน' },
  { screen_id: 20, name: 'จัดการพนักงาน & รถ (Master.1)', code: '1101', group: 'ผู้ดูแลระบบ' },
  { screen_id: 22, name: 'จัดการตำแหน่ง (Master.Position)', code: '1102', group: 'ผู้ดูแลระบบ' },
  { screen_id: 24, name: 'จัดการฝ่าย / แผนก (Master.Department)', code: '1103', group: 'ผู้ดูแลระบบ' },
];

// 5. สิทธิตามตำแหน่ง
export const initialPermissions: RolePermission[] = [
  { permission_id: '001', position_id: 1, screen_id: 10, can_view: true, can_edit: true },
  { permission_id: '002', position_id: 1, screen_id: 12, can_view: true, can_edit: true },
  { permission_id: '003', position_id: 1, screen_id: 14, can_view: true, can_edit: true },
  { permission_id: '004', position_id: 1, screen_id: 16, can_view: true, can_edit: true },
  { permission_id: '005', position_id: 1, screen_id: 18, can_view: true, can_edit: true },
  { permission_id: '006', position_id: 1, screen_id: 20, can_view: true, can_edit: true },
  { permission_id: '007', position_id: 1, screen_id: 22, can_view: true, can_edit: true },
  { permission_id: '008', position_id: 1, screen_id: 24, can_view: true, can_edit: true },
  { permission_id: '010', position_id: 2, screen_id: 10, can_view: true, can_edit: false },
  { permission_id: '011', position_id: 2, screen_id: 12, can_view: true, can_edit: false },
  { permission_id: '012', position_id: 2, screen_id: 18, can_view: true, can_edit: false },
  { permission_id: '013', position_id: 2, screen_id: 22, can_view: true, can_edit: false },
  { permission_id: '014', position_id: 2, screen_id: 24, can_view: true, can_edit: false },
  { permission_id: '020', position_id: 8, screen_id: 14, can_view: true, can_edit: true },
  { permission_id: '021', position_id: 8, screen_id: 10, can_view: true, can_edit: false },
];

// 6. จุดจอด
export const initialStops: BusStop[] = [
  { stop_id: 101, name: 'มหาวิทยาลัยเทคโนโลยีมหานคร', detail: 'จุดขึ้น-ลง อาคารอำนวยการ ม.มหานคร', status: 1 },
  { stop_id: 102, name: 'โลตัสหนองจอก', detail: 'ป้ายหน้าห้างสรรพสินค้าโลตัส สาขาหนองจอก', status: 1 },
  { stop_id: 103, name: 'โรงพยาบาลหนองจอก', detail: 'ป้ายหน้าโรงพยาบาลเวชการุณย์รัศมิ์ (รพ.หนองจอก)', status: 1 },
  { stop_id: 104, name: 'Big C หนองจอก', detail: 'จุดจอดหน้าห้างบิ๊กซี ซูเปอร์เซ็นเตอร์ หนองจอก', status: 1 },
  { stop_id: 105, name: 'สวนสาธารณหนองจอก', detail: 'จุดจอดข้างสวนสาธารณะหนองจอกพัฒนา', status: 1 },
  { stop_id: 106, name: 'ร้านส้มตำบ้านนา', detail: 'จุดจอดตามเส้นทางในเอกสารโครงการ', status: 1 },
];

// 7. เส้นทาง
export const initialRoutes: Route[] = [
  { route_id: 1, name: 'เส้นทางที่ 1 (ม.มหานคร - โลตัส - รพ. - Big C - ม.มหานคร)', total_time: 30, status: 1 },
  { route_id: 2, name: 'เส้นทางที่ 2 (ม.มหานคร - โลตัส - สวนสาธารณะ - ร้านส้มตำบ้านนา)', total_time: 13, status: 1 },
  { route_id: 3, name: 'เส้นทางที่ 3 (Big C - โลตัส - สวนสาธารณะ - ร้านส้มตำบ้านนา - ม.มหานคร)', total_time: 15, status: 1 },
];

// 8. จุดจอดในเส้นทาง
export const initialRouteStops: RouteStop[] = [
  { route_stop_id: 1, route_id: 1, stop_id: 101, stop_order: 1, minutes_from_prev: 0 },
  { route_stop_id: 2, route_id: 1, stop_id: 102, stop_order: 2, minutes_from_prev: 5 },
  { route_stop_id: 3, route_id: 1, stop_id: 103, stop_order: 3, minutes_from_prev: 3 },
  { route_stop_id: 4, route_id: 1, stop_id: 104, stop_order: 4, minutes_from_prev: 6 },
  { route_stop_id: 5, route_id: 1, stop_id: 103, stop_order: 5, minutes_from_prev: 3 },
  { route_stop_id: 6, route_id: 1, stop_id: 102, stop_order: 6, minutes_from_prev: 3 },
  { route_stop_id: 7, route_id: 1, stop_id: 101, stop_order: 7, minutes_from_prev: 10 },
  { route_stop_id: 8, route_id: 2, stop_id: 101, stop_order: 1, minutes_from_prev: 0 },
  { route_stop_id: 9, route_id: 2, stop_id: 102, stop_order: 2, minutes_from_prev: 5 },
  { route_stop_id: 10, route_id: 2, stop_id: 105, stop_order: 3, minutes_from_prev: 3 },
  { route_stop_id: 11, route_id: 2, stop_id: 106, stop_order: 4, minutes_from_prev: 5 },
  { route_stop_id: 12, route_id: 3, stop_id: 104, stop_order: 1, minutes_from_prev: 0 },
  { route_stop_id: 13, route_id: 3, stop_id: 102, stop_order: 2, minutes_from_prev: 5 },
  { route_stop_id: 14, route_id: 3, stop_id: 105, stop_order: 3, minutes_from_prev: 3 },
  { route_stop_id: 15, route_id: 3, stop_id: 106, stop_order: 4, minutes_from_prev: 5 },
  { route_stop_id: 16, route_id: 3, stop_id: 101, stop_order: 5, minutes_from_prev: 2 },
];

// 9. ยานพาหนะ
export const initialVehicles: Vehicle[] = [
  { vehicle_id: '001', license_plate: 'สย 2591', type: 'รถตู้', capacity: 9, status: 1 },
  { vehicle_id: '002', license_plate: 'สย 2599', type: 'รถตู้', capacity: 9, status: 1 },
  { vehicle_id: '003', license_plate: 'ชย 7788', type: 'รถตู้', capacity: 9, status: 1 },
  { vehicle_id: '004', license_plate: 'บก 1130', type: 'รถบัส', capacity: 20, status: 1 },
  { vehicle_id: '005', license_plate: 'กข 4455', type: 'รถบัส', capacity: 20, status: 1 },
  { vehicle_id: '006', license_plate: 'นน 5566', type: 'รถบัส', capacity: 15, status: 1 },
  { vehicle_id: '007', license_plate: 'นม 8899', type: 'รถบัส', capacity: 15, status: 1 },
];

// 10. รอบรถ — REALTIME
export const initialTrips: Trip[] = [
  { trip_id: 1001, route_id: 1, driver_id: '00006', vehicle_id: '001', service_date: TODAY_STR, departure_time: '09:30', status: 1 },
  { trip_id: 1002, route_id: 1, driver_id: '00002', vehicle_id: '001', service_date: TODAY_STR, departure_time: '11:00', status: 1 },
  { trip_id: 1003, route_id: 1, driver_id: '00004', vehicle_id: '004', service_date: TODAY_STR, departure_time: '13:00', status: 1 },
  { trip_id: 1004, route_id: 1, driver_id: '00005', vehicle_id: '004', service_date: TODAY_STR, departure_time: '15:00', status: 1 },
  { trip_id: 1005, route_id: 1, driver_id: '00006', vehicle_id: '001', service_date: TODAY_STR, departure_time: '16:30', status: 1 },
  { trip_id: 1006, route_id: 1, driver_id: '00002', vehicle_id: '004', service_date: TOMORROW_STR, departure_time: '16:30', status: 1 },
  { trip_id: 2001, route_id: 2, driver_id: '00003', vehicle_id: '002', service_date: TODAY_STR, departure_time: '09:30', status: 1 },
  { trip_id: 2002, route_id: 2, driver_id: '00003', vehicle_id: '002', service_date: TODAY_STR, departure_time: '11:00', status: 1 },
  { trip_id: 2003, route_id: 2, driver_id: '00002', vehicle_id: '002', service_date: TODAY_STR, departure_time: '13:00', status: 1 },
  { trip_id: 2004, route_id: 2, driver_id: '00002', vehicle_id: '002', service_date: TODAY_STR, departure_time: '15:00', status: 1 },
  { trip_id: 2005, route_id: 2, driver_id: '00003', vehicle_id: '002', service_date: TODAY_STR, departure_time: '16:30', status: 1 },
  { trip_id: 2006, route_id: 2, driver_id: '00003', vehicle_id: '002', service_date: TOMORROW_STR, departure_time: '16:30', status: 1 },
  { trip_id: 3001, route_id: 3, driver_id: '00004', vehicle_id: '003', service_date: TODAY_STR, departure_time: '10:00', status: 1 },
  { trip_id: 3002, route_id: 3, driver_id: '00005', vehicle_id: '006', service_date: TODAY_STR, departure_time: '14:00', status: 1 },
  { trip_id: 3003, route_id: 3, driver_id: '00004', vehicle_id: '003', service_date: TODAY_STR, departure_time: '16:30', status: 1 },
  { trip_id: 3004, route_id: 3, driver_id: '00005', vehicle_id: '006', service_date: TOMORROW_STR, departure_time: '16:30', status: 1 },
];

// 11. ผู้ใช้งานระบบ
export const initialUsers: SystemUser[] = [
  { user_id: 55541, name: 'พลพิธ วัฒนศิลป์', username: '6711130037', password: '123456', user_type: 'นักศึกษา', phone: '089-111-3003' },
  { user_id: 10379, name: 'เพ็ญศรี สุขเกษม', username: '7891056799', password: '123456', user_type: 'อาจารย์', phone: '081-999-8877' },
  { user_id: 20455, name: 'กิตติศักดิ์ ชัยมงคล', username: '6711140088', password: '123456', user_type: 'นักศึกษา', phone: '082-345-6789' },
];

// 12. การจอง — REALTIME
const _now = new Date();
const hoursAgo = (h: number) => { const d = new Date(_now); d.setHours(d.getHours() - h); return toYMDHM(d); };

export const initialBookings: Booking[] = [
  { booking_id: 90001, booking_code: 'BK-TODAY-01', leg_type: 'one-way', journey_type: 'one-way', user_id: 55541, trip_id: 1001, pickup_stop_id: 101, dropoff_stop_id: 102, seat_count: 1, status: 1, action_status: 'จองสำเร็จ', is_checked_in: false, booking_time: hoursAgo(1) },
  { booking_id: 90004, booking_code: 'BK-TODAY-01', leg_type: 'one-way', journey_type: 'one-way', user_id: 55541, trip_id: 1002, pickup_stop_id: 101, dropoff_stop_id: 104, seat_count: 2, status: 2, action_status: 'เช็กอินแล้ว', is_checked_in: true, check_in_time: hoursAgo(0), booking_time: hoursAgo(1) },
  { booking_id: 90006, booking_code: 'BK-OLD-01', leg_type: 'one-way', journey_type: 'one-way', user_id: 55541, trip_id: 1003, pickup_stop_id: 101, dropoff_stop_id: 104, seat_count: 1, status: 3, action_status: 'เสร็จสิ้น', is_checked_in: true, check_in_time: hoursAgo(24), booking_time: hoursAgo(26) },
  { booking_id: 90005, booking_code: 'BK-OLD-02', leg_type: 'one-way', journey_type: 'one-way', user_id: 55541, trip_id: 2001, pickup_stop_id: 101, dropoff_stop_id: 106, seat_count: 1, status: 0, action_status: 'ยกเลิก', is_checked_in: false, booking_time: hoursAgo(30) },
  { booking_id: 90007, booking_code: 'BK-OLD-05', leg_type: 'one-way', journey_type: 'one-way', user_id: 55541, trip_id: 1005, pickup_stop_id: 101, dropoff_stop_id: 103, seat_count: 1, status: 4, action_status: 'ไม่ได้ขึ้นรถ', is_checked_in: false, booking_time: hoursAgo(48) },
  { booking_id: 90002, booking_code: 'BK-TODAY-03', leg_type: 'one-way', journey_type: 'one-way', user_id: 10379, trip_id: 1001, pickup_stop_id: 101, dropoff_stop_id: 104, seat_count: 2, status: 1, action_status: 'จองสำเร็จ', is_checked_in: false, booking_time: hoursAgo(1) },
  { booking_id: 90003, booking_code: 'BK-TODAY-04', leg_type: 'one-way', journey_type: 'one-way', user_id: 20455, trip_id: 1001, pickup_stop_id: 102, dropoff_stop_id: 103, seat_count: 1, status: 2, action_status: 'เช็กอินแล้ว', is_checked_in: true, check_in_time: hoursAgo(0), booking_time: hoursAgo(1) },
];

// User Flow Nodes
export const initialUserFlowNodes: UserFlowNode[] = [
  { id: 'flow-login', title: '1. ยืนยันตัวตน / เลือกบทบาท', role: 'passenger', screenCode: 'SCR-AUTH', description: 'ผู้ใช้ระบุรหัสนักศึกษา/อาจารย์', nextNodes: ['flow-search'], entityUsed: ['ผู้ใช้งานระบบ', 'พนักงาน', 'สิทธิตามตำแหน่ง'] },
  { id: 'flow-search', title: '2. ค้นหาเส้นทาง & รอบรถ', role: 'passenger', screenCode: 'SCR-01', description: 'เลือกวันเดินทาง, เส้นทาง, จุดขึ้น - จุดลง', nextNodes: ['flow-select-trip'], entityUsed: ['เส้นทาง', 'จุดจอด', 'จุดจอดในเส้นทาง'] },
  { id: 'flow-select-trip', title: '3. เลือกรอบเวลา & ดูยานพาหนะ', role: 'passenger', screenCode: 'SCR-02', description: 'ดูเวลาออก, ประเภทรถ, ทะเบียน, คนขับ', nextNodes: ['flow-select-seat'], entityUsed: ['รอบรถ', 'ยานพาหนะ', 'พนักงาน'] },
  { id: 'flow-select-seat', title: '4. เลือกที่นั่ง & ยืนยันจอง', role: 'passenger', screenCode: 'SCR-03', description: 'เลือกที่นั่งบนรถ', nextNodes: ['flow-ticket'], entityUsed: ['การจอง', 'รายละเอียดการจอง', 'ยานพาหนะ'] },
  { id: 'flow-ticket', title: '5. ตั๋วอิเล็กทรอนิกส์ & Boarding Pass', role: 'passenger', screenCode: 'SCR-04', description: 'ระบบออกรหัสการจอง พร้อม QR Code', nextNodes: ['flow-driver-checkin'], entityUsed: ['การจอง', 'ผู้ใช้งานระบบ', 'รอบรถ'] },
  { id: 'flow-driver-checkin', title: '6. เช็คอินขึ้นรถ', role: 'driver', screenCode: 'SCR-05', description: 'พนักงานขับรถสแกน QR', nextNodes: ['flow-complete'], entityUsed: ['การจอง', 'รอบรถ', 'พนักงาน'] },
  { id: 'flow-complete', title: '7. ออกเดินทาง & เสร็จสิ้นรอบ', role: 'system', screenCode: 'SCR-STATUS', description: 'ปรับสถานะการจอง', nextNodes: [], entityUsed: ['การจอง', 'รอบรถ'] },
  { id: 'flow-admin-manage', title: 'Admin: จัดการรอบรถ & เส้นทาง', role: 'admin', screenCode: 'SCR-06', description: 'จัดการรอบเวลา, รถ, คนขับ', nextNodes: ['flow-search'], entityUsed: ['หน้าจอ', 'สิทธิตามตำแหน่ง', 'รอบรถ', 'เส้นทาง'] },
];

// Figma Frames
export const figmaFrames: FigmaFrameSpec[] = [
  { id: 'frame-1', name: '[SCR-01] หน้าหลัก & ค้นหารอบรถ', device: 'mobile', width: 390, height: 844, screenGroup: 'ผู้โดยสาร (Passenger)', code: 'SCR-01', description: 'ค้นหาเส้นทาง, เลือกวันเดินทาง', entities: ['เส้นทาง', 'จุดจอด', 'จุดจอดในเส้นทาง', 'รอบรถ'] },
  { id: 'frame-2', name: '[SCR-02] เลือกรอบเวลาและยานพาหนะ', device: 'mobile', width: 390, height: 844, screenGroup: 'ผู้โดยสาร (Passenger)', code: 'SCR-02', description: 'รายการรอบรถประจำวัน', entities: ['รอบรถ', 'ยานพาหนะ', 'พนักงาน'] },
  { id: 'frame-3', name: '[SCR-03] ผังที่นั่ง & ยืนยันการจอง', device: 'mobile', width: 390, height: 844, screenGroup: 'ผู้โดยสาร (Passenger)', code: 'SCR-03', description: 'Interactive Seat Map', entities: ['การจอง', 'รายละเอียดการจอง', 'ยานพาหนะ', 'ผู้ใช้งานระบบ'] },
  { id: 'frame-4', name: '[SCR-04] ตั๋วเดินทาง E-Ticket & QR Code', device: 'mobile', width: 390, height: 844, screenGroup: 'ผู้โดยสาร (Passenger)', code: 'SCR-04', description: 'Digital Boarding Pass', entities: ['การจอง', 'รอบรถ', 'จุดจอด', 'ผู้ใช้งานระบบ'] },
  { id: 'frame-5', name: '[SCR-05] คนขับรถ & ตรวจสอบเช็คอิน', device: 'mobile', width: 390, height: 844, screenGroup: 'พนักงานขับรถ (Driver)', code: 'SCR-05 (Code 8820)', description: 'หน้าจอพนักงานขับรถ', entities: ['รอบรถ', 'การจอง', 'พนักงาน', 'จุดจอด'] },
  { id: 'frame-6', name: '[SCR-06] จัดการรอบรถ (Admin)', device: 'desktop', width: 1100, height: 720, screenGroup: 'ฝ่ายบริหาร/เทคนิค (Admin)', code: 'หน้าจอ 10 (Code 3456)', description: 'สร้าง/แก้ไขตารางรอบรถ', entities: ['รอบรถ', 'เส้นทาง', 'พนักงาน', 'ยานพาหนะ'] },
  { id: 'frame-7', name: '[SCR-07] จัดการเส้นทาง & ลำดับจุดจอด', device: 'desktop', width: 1100, height: 720, screenGroup: 'ฝ่ายเทคนิค (Admin)', code: 'หน้าจอ 12 (Code 6794)', description: 'จัดการเส้นทาง', entities: ['เส้นทาง', 'จุดจอด', 'จุดจอดในเส้นทาง'] },
  { id: 'frame-8', name: '[SCR-08] สิทธิตามตำแหน่ง (RBAC Matrix)', device: 'desktop', width: 1100, height: 720, screenGroup: 'ผู้ดูแลระบบ (Admin)', code: 'หน้าจอ 16 (Code 9102)', description: 'Associative Table M:N', entities: ['สิทธิตามตำแหน่ง', 'ตำแหน่ง', 'หน้าจอ', 'แผนก'] },
];

// 14. Reports Data
export const monthsTh = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

export const report1Dataset: Report1MonthlyStopData[] = [
  { stopName: 'มหาวิทยาลัยเทคโนโลยีมหานคร', monthlyBoarding: [1250,1180,1340,920,1400,1450,1520,1590,1480,1540,1610,1720], monthlyAlighting: [110,95,120,80,130,140,150,160,145,155,165,175], totalBoarding: 17000, totalAlighting: 1625 },
  { stopName: 'โลตัสหนองจอก', monthlyBoarding: [380,360,410,290,430,450,480,500,470,490,510,540], monthlyAlighting: [450,430,490,340,510,530,560,580,550,570,600,630], totalBoarding: 5310, totalAlighting: 6240 },
  { stopName: 'โรงพยาบาลหนองจอก', monthlyBoarding: [220,210,240,180,250,260,280,290,270,280,300,320], monthlyAlighting: [290,280,310,230,330,340,360,380,350,370,390,410], totalBoarding: 3100, totalAlighting: 4040 },
  { stopName: 'Big C หนองจอก', monthlyBoarding: [310,290,330,240,350,370,390,410,380,400,420,450], monthlyAlighting: [360,340,390,280,410,430,450,470,440,460,480,510], totalBoarding: 4340, totalAlighting: 5020 },
  { stopName: 'สวนสาธารณหนองจอก', monthlyBoarding: [150,140,160,110,170,180,190,200,185,195,210,225], monthlyAlighting: [180,170,200,140,210,220,230,240,225,235,250,270], totalBoarding: 2115, totalAlighting: 2570 },
  { stopName: 'ร้านส้มตำป้านาง', monthlyBoarding: [80,75,85,60,90,95,100,110,95,105,115,120], monthlyAlighting: [220,210,240,170,250,260,270,290,265,280,300,320], totalBoarding: 1130, totalAlighting: 2975 },
];

export const report2Dataset: Report2MonthlyBookingStats[] = [
  { month: 'มกราคม', monthShort: 'ม.ค.', bookingCount: 320, bookedSeats: 950, cancelled: 20, checkedIn: 910, noShow: 40 },
  { month: 'กุมภาพันธ์', monthShort: 'ก.พ.', bookingCount: 300, bookedSeats: 880, cancelled: 18, checkedIn: 850, noShow: 30 },
  { month: 'มีนาคม', monthShort: 'มี.ค.', bookingCount: 340, bookedSeats: 1020, cancelled: 25, checkedIn: 970, noShow: 50 },
  { month: 'เมษายน', monthShort: 'เม.ย.', bookingCount: 280, bookedSeats: 810, cancelled: 15, checkedIn: 780, noShow: 30 },
  { month: 'พฤษภาคม', monthShort: 'พ.ค.', bookingCount: 360, bookedSeats: 1050, cancelled: 28, checkedIn: 1000, noShow: 50 },
  { month: 'มิถุนายน', monthShort: 'มิ.ย.', bookingCount: 370, bookedSeats: 1080, cancelled: 30, checkedIn: 1020, noShow: 60 },
  { month: 'กรกฎาคม', monthShort: 'ก.ค.', bookingCount: 400, bookedSeats: 1200, cancelled: 35, checkedIn: 1140, noShow: 60 },
  { month: 'สิงหาคม', monthShort: 'ส.ค.', bookingCount: 420, bookedSeats: 1250, cancelled: 32, checkedIn: 1190, noShow: 60 },
  { month: 'กันยายน', monthShort: 'ก.ย.', bookingCount: 390, bookedSeats: 1150, cancelled: 27, checkedIn: 1100, noShow: 50 },
  { month: 'ตุลาคม', monthShort: 'ต.ค.', bookingCount: 410, bookedSeats: 1220, cancelled: 30, checkedIn: 1160, noShow: 60 },
  { month: 'พฤศจิกายน', monthShort: 'พ.ย.', bookingCount: 430, bookedSeats: 1280, cancelled: 33, checkedIn: 1220, noShow: 60 },
  { month: 'ธันวาคม', monthShort: 'ธ.ค.', bookingCount: 450, bookedSeats: 1350, cancelled: 40, checkedIn: 1280, noShow: 70 },
];

export const report3Dataset: Report3UserBehavior[] = [
  { userName: 'สมชาย ใจดี', totalBookings: 12, boardedActual: 11, cancelled: 1, noShow: 0 },
  { userName: 'สมหมาย ใจรัก', totalBookings: 10, boardedActual: 9, cancelled: 0, noShow: 1 },
  { userName: 'สมควร ใจงาม', totalBookings: 8, boardedActual: 7, cancelled: 0, noShow: 1 },
  { userName: 'อารีรัตน์ ศรีสุข', totalBookings: 6, boardedActual: 5, cancelled: 1, noShow: 0 },
  { userName: 'วรพล เทพทอง', totalBookings: 5, boardedActual: 4, cancelled: 1, noShow: 0 },
];

export const report4Dataset: Report4DailyRoutePassengers[] = [
  { dayName: 'จันทร์', route1: 120, route2: 90, route3: 75, total: 285 },
  { dayName: 'อังคาร', route1: 110, route2: 85, route3: 80, total: 275 },
  { dayName: 'พุธ', route1: 130, route2: 95, route3: 85, total: 310 },
  { dayName: 'พฤหัสบดี', route1: 115, route2: 92, route3: 88, total: 295 },
  { dayName: 'ศุกร์', route1: 140, route2: 105, route3: 95, total: 340 },
  { dayName: 'เสาร์', route1: 80, route2: 60, route3: 50, total: 190 },
  { dayName: 'อาทิตย์', route1: 70, route2: 55, route3: 45, total: 170 },
];

export const report5Dataset: Report5StopScheduleUsage[] = [
  { stopName: 'มหาวิทยาลัยเทคโนโลยีมหานคร', time: '09:30', boardingCount: 120, alightingCount: 0 },
  { stopName: 'มหาวิทยาลัยเทคโนโลยีมหานคร', time: '11:00', boardingCount: 110, alightingCount: 0 },
  { stopName: 'มหาวิทยาลัยเทคโนโลยีมหานคร', time: '13:00', boardingCount: 130, alightingCount: 0 },
  { stopName: 'มหาวิทยาลัยเทคโนโลยีมหานคร', time: '15:00', boardingCount: 140, alightingCount: 0 },
  { stopName: 'โลตัสหนองจอก', time: '09:45', boardingCount: 95, alightingCount: 88 },
  { stopName: 'โลตัสหนองจอก', time: '11:15', boardingCount: 85, alightingCount: 92 },
  { stopName: 'โลตัสหนองจอก', time: '13:15', boardingCount: 100, alightingCount: 110 },
  { stopName: 'โลตัสหนองจอก', time: '15:15', boardingCount: 110, alightingCount: 120 },
  { stopName: 'โรงพยาบาลหนองจอก', time: '09:55', boardingCount: 70, alightingCount: 65 },
  { stopName: 'โรงพยาบาลหนองจอก', time: '11:25', boardingCount: 60, alightingCount: 75 },
  { stopName: 'โรงพยาบาลหนองจอก', time: '13:25', boardingCount: 80, alightingCount: 90 },
  { stopName: 'โรงพยาบาลหนองจอก', time: '15:25', boardingCount: 90, alightingCount: 100 },
];

export const report6Dataset: Report6DriverAssignment[] = [
  { driverName: 'สมชาย ใจดี', totalTrips: 25, before1700: 18, after1700: 7 },
  { driverName: 'สมหมาย ใจรัก', totalTrips: 20, before1700: 15, after1700: 5 },
  { driverName: 'สมควร ใจงาม', totalTrips: 18, before1700: 12, after1700: 6 },
  { driverName: 'อารีรัตน์ ศรีสุข', totalTrips: 15, before1700: 10, after1700: 5 },
  { driverName: 'วรพล เทพทอง', totalTrips: 12, before1700: 8, after1700: 4 },
  { driverName: 'นันทนา ใจตรง', totalTrips: 10, before1700: 7, after1700: 3 },
];

export const report7Dataset: Report7VehicleAssignment[] = [
  { category: 'รถตู้ 9 ที่นั่ง', plate: 'สย 2591', tripCount: 28 },
  { category: 'รถตู้ 9 ที่นั่ง', plate: 'สย 2599', tripCount: 25 },
  { category: 'รถตู้ 9 ที่นั่ง', plate: 'ชย 7788', tripCount: 10 },
  { category: 'รถบัส 20 ที่นั่ง', plate: 'บก 1130', tripCount: 22 },
  { category: 'รถบัส 20 ที่นั่ง', plate: 'กข 4455', tripCount: 15 },
  { category: 'รถมินิบัส 15 ที่นั่ง', plate: 'นน 5566', tripCount: 12 },
  { category: 'รถมินิบัส 15 ที่นั่ง', plate: 'นม 8899', tripCount: 8 },
];
