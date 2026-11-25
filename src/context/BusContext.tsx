import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
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
  VehicleType,
  Trip,
  SystemUser,
  Booking,
  DriverTripStopManifest,
  TripSummaryNoShow,
  TicketActionStatus,
} from '../types/schema';
import {
  initialDepartments,
  initialPositions,
  initialEmployees,
  initialScreens,
  initialPermissions,
  initialStops,
  initialRoutes,
  initialRouteStops,
  initialVehicles,
  initialTrips,
  initialUsers,
  initialBookings,
} from '../data/mockDatabase';
import confetti from 'canvas-confetti';
import {
  api,
  apiAdminMasters,
  apiCreateDepartment as apiInsertDepartment,
  apiCreateEmployee as apiInsertEmployee,
  apiUpdateEmployee as apiSaveEmployee,
  apiCreateTrips as apiInsertTrips,
  apiUpdateTrip as apiSaveTrip,
  apiCreateRoute,
  apiUpdateRoute,
  apiDeleteRoute,
  apiCreateStop,
  apiUpdateStop,
  apiDeleteStop,
  apiCreateRouteStop,
  apiDeleteRouteStop,
  apiCreatePosition as apiInsertPosition,
  apiUpdatePosition as apiSavePosition,
  apiCreateVehicle as apiInsertVehicle,
  apiUpdateVehicle as apiSaveVehicle,
  apiSetVehicleStatus as apiSaveVehicleStatus,
  apiCreateVehicleType as apiInsertVehicleType,
  apiUpsertPermission as apiSavePermission,
  apiUpdateDepartment as apiSaveDepartment,
  apiHideAdminRecord,
  apiHideBooking,
  apiHideEmployee,
  apiUpdateTripStatus as apiSaveTripStatus,
  apiToken,
} from '../api/client';

export type AppMode = 'live' | 'figma' | 'er';
export type LiveRole = 'passenger' | 'driver' | 'admin';
export type FigmaViewMode = 'canvas' | 'flow' | 'prototype' | 'spec';

export interface PermittedScreenInfo {
  screen: ScreenItem;
  screen_id: number;
  can_view: boolean;
  can_edit: boolean;
  permission_id?: string;
}

interface BusContextType {
  apiMode: boolean;
  apiLoginComplete: (role: 'passenger' | 'driver', user: Record<string, unknown>) => Promise<void>;
  apiAdminLoginComplete: (user: Record<string, unknown>) => Promise<void>;
  apiCreateEmployee: (emp: Omit<Employee, 'employee_id'>) => Promise<Employee>;
  apiUpdateEmployee: (emp: Employee, newPassword?: string) => Promise<Employee>;
  apiCreateVehicle: (vehicle: Omit<Vehicle, 'status'>) => Promise<Vehicle>;
  apiUpdateVehicle: (vehicle: Omit<Vehicle, 'status'>) => Promise<Vehicle>;
  apiSetVehicleStatus: (vehicleId: string, status: 0 | 1) => Promise<void>;
  apiCreateVehicleType: (name: VehicleType['name']) => Promise<VehicleType>;
  apiCreateTrips: (input: { route_id: number; service_date: string; departure_times: string[]; driver_id: string; vehicle_id: string }) => Promise<Trip[]>;
  apiUpdateTrip: (tripId: number, input: { route_id: number; service_date: string; departure_time: string; driver_id: string; vehicle_id: string }) => Promise<Trip>;
  apiCreatePosition: (name: string) => Promise<Position>;
  apiCreateDepartment: (name: string) => Promise<Department>;
  apiCreateBooking: (tripId: number, pickupRouteStopId: number, dropoffRouteStopId: number, seatCount: number) => Promise<Booking>;
  apiCancelBooking: (bookingId: number) => Promise<void>;
  apiStartTrip: (tripId: number) => Promise<void>;
  apiCheckIn: (tripId: number, qrPayload: string, routeStopId: number) => Promise<void>;
  apiAlightBooking: (tripId: number, bookingId: number, routeStopId?: number) => Promise<void>;
  apiFinishTrip: (tripId: number) => Promise<{ totalBoarded: number; totalAlighted?: number; noShows: TripSummaryNoShow[]; notAlighted?: TripSummaryNoShow[] }>;
  // Authentication & Mode
  isAuthenticated: boolean;
  isLoggingIn: boolean;
  setIsAuthenticated: (auth: boolean) => void;
  setIsLoggingIn: (loading: boolean) => void;
  login: (role: LiveRole, identifier?: string) => void;
  logout: () => void;
  appMode: AppMode;
  setAppMode: (mode: AppMode) => void;
  liveRole: LiveRole;
  setLiveRole: (role: LiveRole) => void;
  figmaView: FigmaViewMode;
  setFigmaView: (view: FigmaViewMode) => void;
  selectedFigmaFrame: string | null;
  setSelectedFigmaFrame: (frameId: string | null) => void;

  // Simulation Clock for 20-min Booking Rule
  simulatedCurrentTime: string;
  setSimulatedCurrentTime: (time: string) => void;

  // Active Personas
  currentUser: SystemUser;
  setCurrentUser: (user: SystemUser) => void;
  currentDriver: Employee;
  setCurrentDriver: (driver: Employee) => void;
  currentAdmin: Employee;
  setCurrentAdmin: (admin: Employee) => void;
  currentEmployee: Employee;

  // Dynamic RBAC Permission Check Helpers
  canViewScreen: (screenId: number, positionId?: number) => boolean;
  canEditScreen: (screenId: number, positionId?: number) => boolean;
  getPermittedScreens: (positionId?: number) => PermittedScreenInfo[];
  getPermissionsForPosition: (positionId: number) => RolePermission[];

  // Database Collections
  departments: Department[];
  positions: Position[];
  employees: Employee[];
  screens: ScreenItem[];
  permissions: RolePermission[];
  stops: BusStop[];
  routes: Route[];
  routeStops: RouteStop[];
  vehicles: Vehicle[];
  vehicleTypes: VehicleType[];
  trips: Trip[];
  driverTripStops: Record<number, DriverTripStopManifest[]>;
  users: SystemUser[];
  bookings: Booking[];

  // Master 1: Employee Management
  addEmployee: (emp: Omit<Employee, 'employee_id'>) => Employee;
  updateEmployee: (emp: Employee) => void;
  deleteEmployee: (employeeId: string) => Promise<void>;

  // Master: Route & Stop Management
  addRoute: (name: string, routeId?: number) => Promise<Route>;
  updateRoute: (route: Route) => Promise<void>;
  deleteRoute: (routeId: number) => Promise<void>;
  addStop: (name: string, detail: string, stopId?: number) => Promise<BusStop>;
  updateStop: (stop: BusStop) => Promise<void>;
  deleteStop: (stopId: number) => Promise<void>;
  addRouteStop: (routeId: number, stopId: number, stopOrder: number, minutesFromPrev: number) => Promise<RouteStop>;
  deleteRouteStop: (routeId: number, routeStopId: number) => Promise<void>;

  // Master: Department & Position Management
  addPosition: (name: string, positionId?: number) => Position;
  addVehicleType: (name: VehicleType['name'], vehicleTypeId: number) => VehicleType;
  addVehicle: (vehicle: Vehicle) => Vehicle;
  updateVehicle: (vehicle: Omit<Vehicle, 'status'>) => void;
  setVehicleStatus: (vehicleId: string, status: 0 | 1) => Promise<void>;
  updatePosition: (pos: Position) => Promise<void>;
  deletePosition: (positionId: number) => Promise<void>;
  addDepartment: (name: string, departmentId?: number) => Department;
  updateDepartment: (dept: Department) => Promise<void>;
  deleteDepartment: (departmentId: number) => Promise<void>;

  // Master 2: Dynamic RBAC Permissions
  addPermission: (positionId: number, screenId: number, canView: boolean, canEdit: boolean) => Promise<void>;
  deletePermission: (permissionId: string) => Promise<void>;
  updatePermission: (
    permissionId: string,
    field: 'can_view' | 'can_edit',
    val: boolean
  ) => Promise<void>;

  // Conflict Checking for Trips (Page 3)
  checkTripConflict: (
    routeId: number,
    driverId: string,
    vehicleId: string,
    date: string,
    departureTime: string,
    excludeTripId?: number
  ) => { hasConflict: boolean; reason?: string };

  // 20-minute Cut-off Rule Validation (Page 3-4)
  checkCutOffTime: (
    tripOrDepartureTime: Trip | string,
    stopIdOrMinutes?: number
  ) => {
    isCutOff: boolean;
    isAvailable: boolean;
    minutesLeft: number;
    remainingMinutes: number;
    etaToPickup: string;
    pickupTimeStr: string;
    reason?: string;
  };

  // Passenger Booking Mutations
  createBooking: (
    tripId: number,
    pickupStopId: number,
    dropoffStopId: number,
    seatCount: number,
    extra?: {
      booking_code?: string;
      leg_type?: 'outbound' | 'return' | 'one-way';
      journey_type?: 'one-way' | 'round-trip';
    }
  ) => Booking;
  cancelBooking: (bookingId: number) => void;
  deleteBooking: (bookingId: number) => Promise<void>;
  deleteBookingsByCode: (bookingCode: string) => Promise<void>;
  checkInBooking: (bookingId: number) => boolean;
  alightBooking: (bookingId: number, routeStopId?: number) => boolean;
  updateTicketStatus: (bookingId: number, status: TicketActionStatus | number) => void;

  // Driver Operations
  startTrip: (tripId: number) => void;
  finishTrip: (tripId: number) => { totalBoarded: number; totalAlighted: number; noShows: TripSummaryNoShow[]; notAlighted: TripSummaryNoShow[] };
  verifyTicketForTrip: (tripId: number, bookingId: number, pickupRouteStopId?: number | null) => {
    isValid: boolean;
    message: string;
    booking?: Booking;
  };

  // Admin Mutations
  addTrip: (newTrip: Omit<Trip, 'trip_id'>) => Trip;
  updateTrip: (tripId: number, input: { route_id: number; service_date: string; departure_time: string; driver_id: string; vehicle_id: string }) => Promise<Trip>;
  updateTripStatus: (tripId: number, status: number) => Promise<void>;
  resetToDefault: () => void;

  // Helpers
  getRouteById: (routeId: number) => Route | undefined;
  getStopById: (stopId: number) => BusStop | undefined;
  getVehicleById: (vehicleId: string) => Vehicle | undefined;
  getEmployeeById: (employeeId: string) => Employee | undefined;
  getStopsForRoute: (
    routeId: number
  ) => (BusStop & { route_stop_id?: number; order: number; minutesFromPrev: number })[];
  getBookingsForTrip: (tripId: number) => Booking[];
  // ถ้าส่งช่วงป้ายที่จะจอง (route_stop_id) จะนับเฉพาะ booking ที่ช่วงซ้อนกัน (1→6 ไม่กินที่ 6→7)
  getBookedSeatCountForTrip: (tripId: number, pickupRouteStopId?: number, dropoffRouteStopId?: number) => number;
  apiLoadSegmentSeats: (tripIds: number[], pickupRouteStopId: number, dropoffRouteStopId: number) => Promise<void>;
}

const BusContext = createContext<BusContextType | undefined>(undefined);

export const BusProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [apiMode, setApiMode] = useState(false);
  const [apiSeats, setApiSeats] = useState<Record<number, number>>({});
  const [apiSegmentSeats, setApiSegmentSeats] = useState<Record<string, number>>({});
  // ============================================================
  // Auth & Mode — ไม่ persist ลง localStorage (ให้เริ่มที่ Login ทุกครั้ง)
  // ============================================================
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const [appMode, setAppMode] = useState<AppMode>('live');
  const [liveRole, setLiveRole] = useState<LiveRole>('passenger');
  const [figmaView, setFigmaView] = useState<FigmaViewMode>('canvas');
  const [selectedFigmaFrame, setSelectedFigmaFrame] = useState<string | null>('frame-1');

  // Simulation Clock
  const [simulatedCurrentTime, setSimulatedCurrentTime] = useState<string>('09:00');

  // Personas
  const [currentUser, setCurrentUser] = useState<SystemUser>(initialUsers[0]);
  const [currentDriver, setCurrentDriver] = useState<Employee>(() => {
    return initialEmployees.find((e) => e.position_id === 8) || initialEmployees[1] || initialEmployees[0];
  });
  const [currentAdmin, setCurrentAdmin] = useState<Employee>(initialEmployees[0]);

  // Database States with localStorage persistence
  const [departments, setDepartments] = useState<Department[]>(() => {
    const saved = localStorage.getItem('mut_bus_departments');
    return saved ? JSON.parse(saved) : initialDepartments;
  });
  const [positions, setPositions] = useState<Position[]>(() => {
    const saved = localStorage.getItem('mut_bus_positions');
    return saved ? JSON.parse(saved) : initialPositions;
  });
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>(() => {
    const saved = localStorage.getItem('mut_bus_vehicle_types');
    return saved ? JSON.parse(saved) : [{ vehicle_type_id: 1, name: 'รถตู้' }];
  });
  const [employees, setEmployees] = useState<Employee[]>(() => {
    const saved = localStorage.getItem('mut_bus_employees');
    return saved ? JSON.parse(saved) : initialEmployees;
  });
  const [screens] = useState<ScreenItem[]>(initialScreens);
  const [permissions, setPermissions] = useState<RolePermission[]>(() => {
    const saved = localStorage.getItem('mut_bus_permissions');
    if (saved) {
      try {
        const parsed: RolePermission[] = JSON.parse(saved);
        const hasScreen22 = parsed.some((p) => p.screen_id === 22);
        const hasScreen24 = parsed.some((p) => p.screen_id === 24);
        if (!hasScreen22 || !hasScreen24) {
          const newPerms = [...parsed];
          if (!hasScreen22) {
            newPerms.push({ permission_id: '007', position_id: 1, screen_id: 22, can_view: true, can_edit: true });
          }
          if (!hasScreen24) {
            newPerms.push({ permission_id: '008', position_id: 1, screen_id: 24, can_view: true, can_edit: true });
          }
          return newPerms;
        }
        return parsed;
      } catch {
        return initialPermissions;
      }
    }
    return initialPermissions;
  });
  const [stops, setStops] = useState<BusStop[]>(() => {
    const saved = localStorage.getItem('mut_bus_stops');
    return saved ? JSON.parse(saved) : initialStops;
  });
  const [routes, setRoutes] = useState<Route[]>(() => {
    const saved = localStorage.getItem('mut_bus_routes');
    return saved ? JSON.parse(saved) : initialRoutes;
  });
  const [routeStops, setRouteStops] = useState<RouteStop[]>(() => {
    const saved = localStorage.getItem('mut_bus_routeStops');
    return saved ? JSON.parse(saved) : initialRouteStops;
  });
  const [vehicles, setVehicles] = useState<Vehicle[]>(() => {
    const saved = localStorage.getItem('mut_bus_vehicles');
    return saved ? JSON.parse(saved) : initialVehicles;
  });
  const [trips, setTrips] = useState<Trip[]>(() => {
    const saved = localStorage.getItem('mut_bus_trips');
    if (saved) {
      try {
        const parsed: Trip[] = JSON.parse(saved);
        const sanitized = parsed.map((t) => {
          const init = initialTrips.find((it) => it.trip_id === t.trip_id);
          const validVeh = t.vehicle_id && String(t.vehicle_id).trim() !== ''
            ? String(t.vehicle_id)
            : init?.vehicle_id || '001';
          const validDrv = t.driver_id && String(t.driver_id).trim() !== ''
            ? String(t.driver_id)
            : init?.driver_id || '00001';
          return {
            ...t,
            vehicle_id: validVeh,
            driver_id: validDrv,
          };
        });

        const existingIds = new Set(sanitized.map((t) => t.trip_id));
        const missing = initialTrips.filter((it) => !existingIds.has(it.trip_id));
        const merged = missing.length > 0 ? [...sanitized, ...missing] : sanitized;
        return merged.map((t) => {
          if (t.trip_id === 3003 && (!t.vehicle_id || t.vehicle_id === '')) {
            return { ...t, vehicle_id: '003', driver_id: '00004' };
          }
          return t;
        });
      } catch (e) {
        return initialTrips;
      }
    }
    return initialTrips;
  });
  const [driverTripStops, setDriverTripStops] = useState<Record<number, DriverTripStopManifest[]>>({});
  const [users, setUsers] = useState<SystemUser[]>(initialUsers);
  const [bookings, setBookings] = useState<Booking[]>(() => {
    const saved = localStorage.getItem('mut_bus_bookings');
    return saved ? JSON.parse(saved) : initialBookings;
  });

  // ============================================================
  // Migration: ล้างค่า auth เก่าที่อาจค้างอยู่ใน localStorage
  // ============================================================
  useEffect(() => {
    localStorage.removeItem('mut_bus_auth');
    localStorage.removeItem('mut_bus_role');
  }, []);

  // Save changes to localStorage (เฉพาะ database ไม่รวม auth)
  useEffect(() => {
    localStorage.setItem('mut_bus_bookings', JSON.stringify(bookings));
  }, [bookings]);
  useEffect(() => {
    localStorage.setItem('mut_bus_trips', JSON.stringify(trips));
  }, [trips]);
  useEffect(() => {
    localStorage.setItem('mut_bus_permissions', JSON.stringify(permissions));
  }, [permissions]);
  useEffect(() => {
    localStorage.setItem('mut_bus_employees', JSON.stringify(employees));
  }, [employees]);
  useEffect(() => {
    localStorage.setItem('mut_bus_departments', JSON.stringify(departments));
  }, [departments]);
  useEffect(() => {
    localStorage.setItem('mut_bus_positions', JSON.stringify(positions));
  }, [positions]);
  useEffect(() => {
    localStorage.setItem('mut_bus_vehicle_types', JSON.stringify(vehicleTypes));
  }, [vehicleTypes]);
  useEffect(() => {
    localStorage.setItem('mut_bus_vehicles', JSON.stringify(vehicles));
  }, [vehicles]);

  // ============================================================
  // Helpers
  // ============================================================
  const getRouteById = (routeId: number) => routes.find((r) => r.route_id === routeId);
  const getStopById = (stopId: number) => stops.find((s) => s.stop_id === stopId);
  const getVehicleById = (vehicleId: string) =>
    vehicles.find(
      (v) =>
        String(v.vehicle_id).trim() === String(vehicleId).trim() ||
        Number(v.vehicle_id) === Number(vehicleId)
    );
  const getEmployeeById = (employeeId: string) =>
    employees.find(
      (e) =>
        String(e.employee_id).trim() === String(employeeId).trim() ||
        Number(e.employee_id) === Number(employeeId)
    );

  const getStopsForRoute = (routeId: number) => {
    const rStops = routeStops
      .filter((rs) => rs.route_id === routeId)
      .sort((a, b) => a.stop_order - b.stop_order);

    return rStops.map((rs) => {
      const stop = stops.find((s) => s.stop_id === rs.stop_id);
      return {
        route_stop_id: rs.route_stop_id,
        stop_id: rs.stop_id,
        name: stop?.name || `จุดจอด ${rs.stop_id}`,
        detail: stop?.detail || '',
        status: stop?.status ?? 1,
        order: rs.stop_order,
        minutesFromPrev: rs.minutes_from_prev,
      };
    });
  };

  const getBookingsForTrip = (tripId: number) =>
    bookings.filter((b) => b.trip_id === tripId && b.status !== 0);

  const getBookedSeatCountForTrip = (tripId: number, pickupRouteStopId?: number, dropoffRouteStopId?: number) => {
    if (apiMode) {
      if (pickupRouteStopId && dropoffRouteStopId) {
        const segment = apiSegmentSeats[`${tripId}:${pickupRouteStopId}:${dropoffRouteStopId}`];
        if (segment !== undefined) return segment;
      }
      return apiSeats[tripId] ?? 0;
    }
    const tripBookings = bookings.filter((booking) => booking.trip_id === tripId && booking.status !== 0);
    const trip = trips.find((t) => t.trip_id === tripId);
    const newPickupOrder = routeStops.find((rs) => rs.route_stop_id === pickupRouteStopId)?.stop_order;
    const newDropOrder = routeStops.find((rs) => rs.route_stop_id === dropoffRouteStopId)?.stop_order;
    if (!trip || newPickupOrder === undefined || newDropOrder === undefined) {
      return tripBookings.reduce((total, booking) => total + booking.seat_count, 0);
    }
    const orderOf = (stopId: number) => routeStops.find((rs) => rs.route_id === trip.route_id && rs.stop_id === stopId)?.stop_order;
    return tripBookings
      .filter((booking) => {
        const bookedPickup = orderOf(booking.pickup_stop_id);
        const bookedDrop = orderOf(booking.dropoff_stop_id);
        if (bookedPickup === undefined || bookedDrop === undefined) return true;
        // ช่วงซ้อนกันเมื่อ pickup เดิม < drop ใหม่ และ drop เดิม > pickup ใหม่
        return bookedPickup < newDropOrder && bookedDrop > newPickupOrder;
      })
      .reduce((total, booking) => total + booking.seat_count, 0);
  };

  // ดึงจำนวนที่นั่งที่ถูกใช้ในช่วงป้ายที่เลือกจาก API (นับเฉพาะ booking ที่ช่วงซ้อนกัน)
  const apiLoadSegmentSeats = async (tripIds: number[], pickupRouteStopId: number, dropoffRouteStopId: number) => {
    const entries = await Promise.all(tripIds.map(async (tripId) => {
      const result = await api<{ booked_count: number }>(`/trips/${tripId}/seats?pickupRouteStopId=${pickupRouteStopId}&dropoffRouteStopId=${dropoffRouteStopId}`);
      return [`${tripId}:${pickupRouteStopId}:${dropoffRouteStopId}`, result.booked_count] as const;
    }));
    setApiSegmentSeats((prev) => ({ ...prev, ...Object.fromEntries(entries) }));
  };

  // ============================================================
  // Master.1: Employee Management
  // ============================================================
  const addEmployee = (empData: Omit<Employee, 'employee_id'>): Employee => {
    const nextNum = employees.length + 1;
    const newId = String(nextNum).padStart(5, '0');
    const newEmp: Employee = {
      ...empData,
      employee_id: newId,
    };
    setEmployees((prev) => [...prev, newEmp]);
    return newEmp;
  };

  const addVehicle = (vehicle: Vehicle): Vehicle => {
    if (vehicles.some((item) => item.vehicle_id === vehicle.vehicle_id)) {
      throw new Error(`รหัสยานพาหนะ ${vehicle.vehicle_id} มีอยู่แล้ว`);
    }
    if (vehicles.some((item) => item.license_plate.trim().toLowerCase() === vehicle.license_plate.trim().toLowerCase())) {
      throw new Error(`ทะเบียนรถ ${vehicle.license_plate} มีอยู่แล้ว`);
    }
    setVehicles((prev) => [...prev, vehicle]);
    return vehicle;
  };

  const updateVehicle = (vehicleData: Omit<Vehicle, 'status'>) => {
    const existing = vehicles.find((vehicle) => vehicle.vehicle_id === vehicleData.vehicle_id);
    if (!existing) throw new Error('ไม่พบยานพาหนะ');
    if (vehicles.some((vehicle) => vehicle.vehicle_id !== vehicleData.vehicle_id && vehicle.license_plate.trim().toLowerCase() === vehicleData.license_plate.trim().toLowerCase())) {
      throw new Error(`ทะเบียนรถ ${vehicleData.license_plate} มีอยู่แล้ว`);
    }
    setVehicles((previous) => previous.map((vehicle) => vehicle.vehicle_id === vehicleData.vehicle_id ? { ...vehicleData, status: vehicle.status } : vehicle));
  };

  const setVehicleStatus = async (vehicleId: string, status: 0 | 1) => {
    if (apiMode) {
      await apiSaveVehicleStatus(vehicleId, status);
    } else if (status === 0) {
      const assignedTrip = trips.find((trip) => trip.vehicle_id === vehicleId && [1, 2].includes(trip.status));
      if (assignedTrip) throw new Error(`ไม่สามารถปิดรถได้ เพราะยังผูกกับรอบ #${assignedTrip.trip_id} ที่ยังเปิดอยู่หรือกำลังเดินทาง กรุณาจัดการรอบนั้นก่อน`);
    }
    setVehicles((previous) => previous.map((vehicle) => vehicle.vehicle_id === vehicleId ? { ...vehicle, status } : vehicle));
  };

  const updateEmployee = (empData: Employee) => {
    setEmployees((prev) =>
      prev.map((e) => (e.employee_id === empData.employee_id ? empData : e))
    );
  };

  const deleteEmployee = async (employeeId: string) => {
    if (apiMode) await apiHideEmployee(employeeId);
    setEmployees((prev) => prev.filter((e) => e.employee_id !== employeeId));
  };

  // ============================================================
  // Master: Department & Position Management
  // ============================================================
  const addPosition = (name: string, positionId?: number): Position => {
    const newId =
      positionId !== undefined && positionId > 0
        ? positionId
        : positions.length > 0
        ? Math.max(...positions.map((p) => p.position_id)) + 1
        : 1;
    const newPos: Position = { position_id: newId, name };
    setPositions((prev) => [...prev, newPos]);
    return newPos;
  };

  const addVehicleType = (name: VehicleType['name'], vehicleTypeId: number): VehicleType => {
    if (vehicleTypes.some((item) => item.vehicle_type_id === vehicleTypeId)) {
      throw new Error(`รหัสประเภทยานพาหนะ ${vehicleTypeId} มีอยู่แล้ว`);
    }
    if (vehicleTypes.some((item) => item.name === name)) {
      throw new Error(`ชื่อ ${name} มีอยู่แล้ว`);
    }
    const next: VehicleType = { vehicle_type_id: vehicleTypeId, name };
    setVehicleTypes((prev) => [...prev, next]);
    return next;
  };

  const updatePosition = async (pos: Position) => {
    if (apiMode) await apiSavePosition(pos.position_id, pos.name);
    setPositions((prev) =>
      prev.map((p) => (p.position_id === pos.position_id ? pos : p))
    );
  };

  const deletePosition = async (positionId: number) => {
    if (apiMode) await apiHideAdminRecord('position', positionId);
    setPositions((prev) => prev.filter((p) => p.position_id !== positionId));
  };

  const addDepartment = (name: string, departmentId?: number): Department => {
    const newId =
      departmentId !== undefined && departmentId > 0
        ? departmentId
        : departments.length > 0
        ? Math.max(...departments.map((d) => d.department_id)) + 1
        : 1;
    const newDept: Department = { department_id: newId, name };
    setDepartments((prev) => [...prev, newDept]);
    return newDept;
  };

  const updateDepartment = async (dept: Department) => {
    if (apiMode) await apiSaveDepartment(dept.department_id, dept.name);
    setDepartments((prev) =>
      prev.map((d) => (d.department_id === dept.department_id ? dept : d))
    );
  };

  const deleteDepartment = async (departmentId: number) => {
    if (apiMode) await apiHideAdminRecord('department', departmentId);
    setDepartments((prev) => prev.filter((d) => d.department_id !== departmentId));
  };

  const addRoute = async (name: string, routeId?: number): Promise<Route> => {
    const trimmed = name.trim();
    if (!trimmed) throw new Error('ชื่อเส้นทางต้องไม่ว่าง');
    if (apiMode) {
      const result = await apiCreateRoute({ name: trimmed, status: 1 });
      const created = result.route as unknown as Route;
      setRoutes((previous) => [...previous, created]);
      return created;
    }
    const nextId = routeId ?? (routes.length > 0 ? Math.max(...routes.map((r) => r.route_id)) + 1 : 1);
    const newRoute: Route = { route_id: nextId, name: trimmed, total_time: 0, status: 1 };
    setRoutes((previous) => [...previous, newRoute]);
    return newRoute;
  };

  const updateRoute = async (route: Route) => {
    const trimmed = route.name.trim();
    if (!trimmed) throw new Error('ชื่อเส้นทางต้องไม่ว่าง');
    if (apiMode) {
      await apiUpdateRoute(route.route_id, { name: trimmed, status: route.status });
    }
    setRoutes((previous) => previous.map((item) => item.route_id === route.route_id ? { ...item, name: trimmed, status: route.status } : item));
  };

  const deleteRoute = async (routeId: number) => {
    if (apiMode) {
      await apiDeleteRoute(routeId);
    }
    setRoutes((previous) => previous.filter((item) => item.route_id !== routeId));
    setRouteStops((previous) => previous.filter((item) => item.route_id !== routeId));
  };

  const addStop = async (name: string, detail: string, stopId?: number): Promise<BusStop> => {
    const trimmed = name.trim();
    if (!trimmed) throw new Error('ชื่อจุดจอดต้องไม่ว่าง');
    if (apiMode) {
      const result = await apiCreateStop({ name: trimmed, description: detail, status: 1 });
      const created = result.stop as unknown as BusStop;
      setStops((previous) => [...previous, created]);
      return created;
    }
    const nextId = stopId ?? (stops.length > 0 ? Math.max(...stops.map((s) => s.stop_id)) + 1 : 1);
    const newStop: BusStop = { stop_id: nextId, name: trimmed, detail, status: 1 };
    setStops((previous) => [...previous, newStop]);
    return newStop;
  };

  const updateStop = async (stop: BusStop) => {
    const trimmed = stop.name.trim();
    if (!trimmed) throw new Error('ชื่อจุดจอดต้องไม่ว่าง');
    if (apiMode) {
      await apiUpdateStop(stop.stop_id, { name: trimmed, description: stop.detail, status: stop.status });
    }
    setStops((previous) => previous.map((item) => item.stop_id === stop.stop_id ? { ...item, name: trimmed, detail: stop.detail, status: stop.status } : item));
  };

  const deleteStop = async (stopId: number) => {
    if (apiMode) {
      await apiDeleteStop(stopId);
    }
    setStops((previous) => previous.filter((item) => item.stop_id !== stopId));
    setRouteStops((previous) => previous.filter((item) => item.stop_id !== stopId));
  };

  const addRouteStop = async (routeId: number, stopId: number, stopOrder: number, minutesFromPrev: number): Promise<RouteStop> => {
    if (apiMode) {
      const result = await apiCreateRouteStop(routeId, { stop_id: stopId, stop_order: stopOrder, minutes_from_prev: minutesFromPrev });
      const routeStop = result.routeStop as unknown as RouteStop;
      setRouteStops((previous) => [...previous, routeStop]);
      return routeStop;
    }
    const newRouteStop: RouteStop = {
      route_stop_id: routeStops.length > 0 ? Math.max(...routeStops.map((rs) => rs.route_stop_id)) + 1 : 1,
      route_id: routeId,
      stop_id: stopId,
      stop_order: stopOrder,
      minutes_from_prev: minutesFromPrev,
    };
    setRouteStops((previous) => [...previous, newRouteStop]);
    return newRouteStop;
  };

  const deleteRouteStop = async (routeId: number, routeStopId: number) => {
    if (apiMode) {
      await apiDeleteRouteStop(routeId, routeStopId);
    }
    setRouteStops((previous) => previous.filter((item) => !(item.route_id === routeId && item.route_stop_id === routeStopId)));
  };

  // ============================================================
  // Master 2: Dynamic RBAC Permissions
  // ============================================================
  const currentEmployee = liveRole === 'driver' ? currentDriver : currentAdmin;

  const getPermissionsForPosition = (positionId: number): RolePermission[] => {
    return permissions.filter((p) => p.position_id === positionId);
  };

  const canViewScreen = (screenId: number, positionId?: number): boolean => {
    const targetPosId = positionId !== undefined ? positionId : currentEmployee.position_id;
    const perm = permissions.find((p) => p.position_id === targetPosId && p.screen_id === screenId);
    if (perm) return Boolean(perm.can_view);
    if (targetPosId === 1) return true;
    return false;
  };

  const canEditScreen = (screenId: number, positionId?: number): boolean => {
    const targetPosId = positionId !== undefined ? positionId : currentEmployee.position_id;
    const perm = permissions.find((p) => p.position_id === targetPosId && p.screen_id === screenId);
    if (perm) return Boolean(perm.can_edit && perm.can_view);
    if (targetPosId === 1) return true;
    return false;
  };

  const getPermittedScreens = (positionId?: number): PermittedScreenInfo[] => {
    const targetPosId = positionId !== undefined ? positionId : currentEmployee.position_id;
    return screens
      .map((scr) => {
        const perm = permissions.find((p) => p.position_id === targetPosId && p.screen_id === scr.screen_id);
        const can_view = perm ? Boolean(perm.can_view) : targetPosId === 1;
        const can_edit = perm ? Boolean(perm.can_edit && perm.can_view) : targetPosId === 1;
        return {
          screen: scr,
          screen_id: scr.screen_id,
          can_view,
          can_edit,
          permission_id: perm?.permission_id,
        };
      })
      .filter((s) => s.can_view);
  };

  const addPermission = async (
    positionId: number,
    screenId: number,
    canView: boolean,
    canEdit: boolean
  ): Promise<void> => {
    if (apiMode) {
      const targetScreen = screens.find((screen) => screen.screen_id === screenId);
      if (!targetScreen) throw new Error('ไม่พบหน้าจอที่ต้องการกำหนดสิทธิ์');
      const result = await apiSavePermission({
        position_id: positionId,
        screen_code: targetScreen.code,
        can_view: canView,
        can_edit: canEdit,
      });
      const row = result.permission;
      const saved: RolePermission = {
        permission_id: String(row.PERMISSION_ID),
        position_id: Number(row.POSITION_ID),
        screen_id: screens.find((screen) => screen.code === String(row.SCREEN_CODE))?.screen_id ?? screenId,
        can_view: row.CAN_VIEW === 'Y',
        can_edit: row.CAN_EDIT === 'Y',
      };
      setPermissions((previous) => {
        const existingIndex = previous.findIndex((permission) =>
          permission.position_id === saved.position_id && permission.screen_id === saved.screen_id
        );
        if (existingIndex < 0) return [...previous, saved];
        return previous.map((permission, index) => index === existingIndex ? saved : permission);
      });
      return;
    }
    const newId = String(Math.floor(100 + Math.random() * 900));
    const newPerm: RolePermission = {
      permission_id: newId,
      position_id: positionId,
      screen_id: screenId,
      can_view: canView,
      can_edit: canEdit,
    };
    setPermissions((prev) => {
      const existsIndex = prev.findIndex(
        (p) => p.position_id === positionId && p.screen_id === screenId
      );
      if (existsIndex >= 0) {
        const copy = [...prev];
        copy[existsIndex] = {
          ...copy[existsIndex],
          can_view: canView,
          can_edit: canEdit,
        };
        return copy;
      }
      return [...prev, newPerm];
    });
  };

  const deletePermission = async (permissionId: string) => {
    if (apiMode) await apiHideAdminRecord('permission', permissionId);
    setPermissions((prev) => prev.filter((p) => p.permission_id !== permissionId));
  };

  const updatePermission = async (
    permissionId: string,
    field: 'can_view' | 'can_edit',
    val: boolean
  ) => {
    const current = permissions.find((permission) => permission.permission_id === permissionId);
    if (!current) return;
    const nextCanView = field === 'can_view' ? val : current.can_view;
    const nextCanEdit = field === 'can_edit' ? val : current.can_edit && nextCanView;
    if (apiMode) {
      const screen = screens.find((item) => item.screen_id === current.screen_id);
      if (!screen) throw new Error('ไม่พบหน้าจอที่ต้องการกำหนดสิทธิ์');
      const result = await apiSavePermission({
        position_id: current.position_id,
        screen_code: screen.code,
        can_view: nextCanView,
        can_edit: nextCanEdit,
      });
      const row = result.permission;
      const saved: RolePermission = {
        permission_id: String(row.PERMISSION_ID),
        position_id: Number(row.POSITION_ID),
        screen_id: screens.find((item) => item.code === String(row.SCREEN_CODE))?.screen_id ?? Number(row.SCREEN_ID),
        can_view: row.CAN_VIEW === 'Y',
        can_edit: row.CAN_EDIT === 'Y',
      };
      setPermissions((prev) => prev.map((permission) => permission.permission_id === permissionId ? saved : permission));
      return;
    }
    setPermissions((prev) =>
      prev.map((p) => p.permission_id === permissionId ? { ...p, can_view: nextCanView, can_edit: nextCanEdit } : p)
    );
  };

  // ============================================================
  // Conflict Checking for Trips (Page 3 Requirement)
  // ============================================================
  const checkTripConflict = (
    routeId: number,
    driverId: string,
    vehicleId: string,
    date: string,
    departureTime: string,
    excludeTripId?: number
  ): { hasConflict: boolean; reason?: string } => {
    const [dHours, dMins] = departureTime.split(':').map(Number);
    const newTripStartMin = dHours * 60 + dMins;
    const targetRoute = routes.find((r) => r.route_id === routeId);
    const newTripDuration = targetRoute ? targetRoute.total_time : 30;
    const newTripEndMin = newTripStartMin + newTripDuration;

    const sameDayTrips = trips.filter(
      (t) => t.service_date === date && t.status !== 0 && t.trip_id !== excludeTripId
    );

    for (const trip of sameDayTrips) {
      const [tHours, tMins] = trip.departure_time.split(':').map(Number);
      const tripStartMin = tHours * 60 + tMins;
      const r = routes.find((rt) => rt.route_id === trip.route_id);
      const tripDuration = r ? r.total_time : 30;
      const tripEndMin = tripStartMin + tripDuration;

      const isOverlap = newTripStartMin < tripEndMin && tripStartMin < newTripEndMin;

      if (isOverlap) {
        if (trip.driver_id === driverId) {
          const emp = employees.find((e) => e.employee_id === driverId);
          return {
            hasConflict: true,
            reason: `คนขับ "${emp?.fullname || driverId}" มีคิวขับรอบเวลา ${trip.departure_time} น. อยู่แล้ว ไม่สามารถกำหนดเวลาซ้อนทับกันได้`,
          };
        }
        if (trip.vehicle_id === vehicleId) {
          const v = vehicles.find((veh) => veh.vehicle_id === vehicleId);
          return {
            hasConflict: true,
            reason: `รถคันหมายเลขทะเบียน "${v?.license_plate || vehicleId}" มีรอบวิ่งเวลา ${trip.departure_time} น. อยู่แล้ว ไม่สามารถใช้รถคันเดียวกันในเวลาซ้อนทับกันได้`,
          };
        }
      }
    }

    return { hasConflict: false };
  };

  // ============================================================
  // 20-minute Cut-off Rule (ใช้ getTodayStr จาก Date ของเครื่อง)
  // ============================================================
  const getTodayStr = (): string => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  };

  const checkCutOffTime = (
    tripOrDepartureTime: Trip | string,
    stopIdOrMinutes?: number
  ): {
    isCutOff: boolean;
    isAvailable: boolean;
    minutesLeft: number;
    remainingMinutes: number;
    etaToPickup: string;
    pickupTimeStr: string;
    reason?: string;
  } => {
    let departureTime = '00:00';
    let minutesFromStart = 0;
    let isFutureDate = false;

    if (typeof tripOrDepartureTime === 'object' && tripOrDepartureTime !== null) {
      const trip = tripOrDepartureTime as Trip;
      departureTime = trip.departure_time || '00:00';
      const pickupStopId = stopIdOrMinutes;

      const todayStr = getTodayStr();
      if (trip.service_date && trip.service_date > todayStr) {
        isFutureDate = true;
      }

      if (pickupStopId !== undefined) {
        const rStops = routeStops
          .filter((rs) => rs.route_id === trip.route_id)
          .sort((a, b) => a.stop_order - b.stop_order);

        let accumulated = 0;
        for (const rs of rStops) {
          accumulated += rs.minutes_from_prev || 0;
          if (rs.stop_id === pickupStopId) {
            minutesFromStart = accumulated;
            break;
          }
        }
      }
    } else if (typeof tripOrDepartureTime === 'string') {
      departureTime = tripOrDepartureTime;
      minutesFromStart = typeof stopIdOrMinutes === 'number' ? stopIdOrMinutes : 0;
    }

    const [depH, depM] = (departureTime || '00:00').split(':').map((v) => Number(v) || 0);
    const departureTotalMinutes = depH * 60 + depM;
    const pickupTotalMinutes = departureTotalMinutes + minutesFromStart;

    const [simH, simM] = (simulatedCurrentTime || '09:00').split(':').map((v) => Number(v) || 0);
    const simTotalMinutes = simH * 60 + simM;

    const diffMinutes = isFutureDate ? 1440 + (pickupTotalMinutes - simTotalMinutes) : (pickupTotalMinutes - simTotalMinutes);

    const pickupH = Math.floor(pickupTotalMinutes / 60) % 24;
    const pickupM = pickupTotalMinutes % 60;
    const pickupTimeStr = `${String(pickupH).padStart(2, '0')}:${String(pickupM).padStart(2, '0')}`;

    const isCutOff = isFutureDate ? false : diffMinutes < 20;

    return {
      isCutOff,
      isAvailable: !isCutOff,
      minutesLeft: diffMinutes,
      remainingMinutes: diffMinutes,
      etaToPickup: pickupTimeStr,
      pickupTimeStr,
      reason: isCutOff
        ? diffMinutes <= 0
          ? `รถผ่านจุดจอดนี้ไปแล้ว (เวลาถึง ~${pickupTimeStr} น.)`
          : `เหลือเวลาเพียง ${diffMinutes} นาที ซึ่งน้อยกว่าเกณฑ์ 20 นาทีก่อนรถถึงจุดจอด`
        : undefined,
    };
  };

  // ============================================================
  // Driver Trip Lifecycle (Page 4 Requirement)
  // ============================================================
  const startTrip = (tripId: number) => {
    updateTripStatus(tripId, 2);
  };

  const finishTrip = (
    tripId: number
  ): { totalBoarded: number; totalAlighted: number; noShows: TripSummaryNoShow[]; notAlighted: TripSummaryNoShow[] } => {
    updateTripStatus(tripId, 3);
    const tripBookings = bookings.filter((b) => b.trip_id === tripId && b.status !== 0);
    const boarded = tripBookings.filter((b) => b.is_checked_in || b.status === 2);
    const noShows = tripBookings.filter((b) => !b.is_checked_in && b.status === 1);
    const alighted = boarded.filter((b) => Boolean(b.alighted_at));
    const notAlightedList = boarded.filter((b) => !b.alighted_at);

    setBookings((prev) =>
      prev.map((b) => {
        if (b.trip_id === tripId) {
          if (b.status === 2 || b.is_checked_in) {
            return {
              ...b,
              status: 3,
              action_status: 'เสร็จสิ้น' as TicketActionStatus,
            };
          }
          if (b.status === 1 && !b.is_checked_in) {
            return {
              ...b,
              status: 4,
              action_status: 'ไม่ได้ขึ้นรถ' as TicketActionStatus,
            };
          }
        }
        return b;
      })
    );

    return {
      totalBoarded: boarded.reduce((sum, b) => sum + b.seat_count, 0),
      totalAlighted: alighted.reduce((sum, b) => sum + b.seat_count, 0),
      noShows: noShows.map((b) => ({
        booking_id: b.booking_id,
        booking_code: b.booking_code || `BK-${b.booking_id}`,
        passenger_name: users.find((u) => u.user_id === b.user_id)?.name || 'ผู้โดยสาร',
        passenger_phone: users.find((u) => u.user_id === b.user_id)?.phone,
        pickup_stop_id: b.pickup_stop_id,
        seat_count: b.seat_count,
      })),
      notAlighted: notAlightedList.map((b) => ({
        booking_id: b.booking_id,
        booking_code: b.booking_code || `BK-${b.booking_id}`,
        passenger_name: users.find((u) => u.user_id === b.user_id)?.name || 'ผู้โดยสาร',
        passenger_phone: users.find((u) => u.user_id === b.user_id)?.phone,
        pickup_stop_id: b.pickup_stop_id,
        seat_count: b.seat_count,
      })),
    };
  };

  const verifyTicketForTrip = (
    tripId: number,
    bookingId: number,
    pickupRouteStopId?: number | null
  ): { isValid: boolean; message: string; booking?: Booking } => {
    const booking = bookings.find((b) => b.booking_id === bookingId);
    if (!booking) {
      return { isValid: false, message: 'ไม่พบข้อมูลตั๋วเดินทางในระบบ' };
    }
    if (booking.status === 0 || booking.action_status === 'ยกเลิก') {
      return { isValid: false, message: 'ตั๋วเดินทางนี้ถูกยกเลิกแล้ว', booking };
    }
    if (booking.status === 4 || booking.action_status === 'ไม่ได้ขึ้นรถ') {
      return { isValid: false, message: 'ตั๋วเดินทางนี้ถูกบันทึกสถานะว่า "ไม่ได้ขึ้นรถ" (No-Show) แล้ว', booking };
    }
    if (booking.status === 3 || booking.action_status === 'เสร็จสิ้น') {
      return { isValid: false, message: 'ตั๋วเดินทางนี้รอบรถเดินทางถึงจุดหมาย "เสร็จสิ้น" แล้ว', booking };
    }
    if (booking.trip_id !== tripId) {
      return {
        isValid: false,
        message: `ตั๋วผิดรอบการเดินทาง! ผู้โดยสารจองรอบที่ #${booking.trip_id} แต่รอบปัจจุบันคือ #${tripId}`,
        booking,
      };
    }
    // โหมดจำลองก็บังคับกฎเดียวกับ backend: ตั๋วต้องจองขึ้นป้ายปัจจุบันที่เลือกไว้
    // ผู้เรียกต้อง map ป้ายปัจจุบันให้เป็น id ระบบเดียวกับ booking ก่อนส่งมา
    // (DriverPortal มี pickup_route_stop_id อยู่แล้ว ส่วน CheckInScannerView map เป็น stop_id เอง)
    if (pickupRouteStopId != null) {
      const bookedPickup = booking.pickup_route_stop_id ?? booking.pickup_stop_id ?? null;
      if (bookedPickup != null && bookedPickup !== pickupRouteStopId) {
        return {
          isValid: false,
          message: 'ตั๋วใบนี้จองขึ้นคนละป้ายกับป้ายปัจจุบันที่เลือกไว้',
          booking,
        };
      }
    }
    return {
      isValid: true,
      message: 'ตั๋วถูกต้อง สามารถขึ้นรถได้',
      booking,
    };
  };

  // ============================================================
  // Booking Mutations
  // ============================================================
  const createBooking = (
    tripId: number,
    pickupStopId: number,
    dropoffStopId: number,
    seatCount: number,
    extra?: {
      booking_code?: string;
      leg_type?: 'outbound' | 'return' | 'one-way';
      journey_type?: 'one-way' | 'round-trip';
    }
  ): Booking => {
    let newId = 0;
    do {
      newId = Math.floor(10000 + Math.random() * 90000);
    } while (bookings.some((b) => b.booking_id === newId));

    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
      now.getDate()
    ).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}`;

    const bookingCode =
      extra?.booking_code ||
      `BK-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(
        now.getDate()
      ).padStart(2, '0')}-${String(Math.floor(10 + Math.random() * 90))}`;

    const newBooking: Booking = {
      booking_id: newId,
      booking_code: bookingCode,
      leg_type: extra?.leg_type || 'one-way',
      journey_type: extra?.journey_type || 'one-way',
      user_id: currentUser.user_id,
      trip_id: tripId,
      pickup_stop_id: pickupStopId,
      dropoff_stop_id: dropoffStopId,
      seat_count: seatCount,
      status: 1,
      action_status: 'จองสำเร็จ',
      is_checked_in: false,
      booking_time: dateStr,
    };

    setBookings((prev) => [newBooking, ...prev]);

    try {
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {
      /* ignore */
    }

    return newBooking;
  };

  const cancelBooking = (bookingId: number) => {
    setBookings((prev) =>
      prev.map((b) =>
        b.booking_id === bookingId
          ? { ...b, status: 0, action_status: 'ยกเลิก' as TicketActionStatus }
          : b
      )
    );
  };

  // ✅ ลบตั๋วถาวร (รายใบ)
  const deleteBooking = async (bookingId: number) => {
    if (apiMode) await apiHideBooking(bookingId);
    setBookings((prev) => prev.filter((b) => b.booking_id !== bookingId));
  };

  // Hide every booking header with this code for this passenger; Oracle records remain intact.
  const deleteBookingsByCode = async (bookingCode: string) => {
    const hiddenIds = bookings
      .filter((booking) => (booking.booking_code || `BK-${booking.booking_id}`) === bookingCode)
      .map((booking) => booking.booking_id);
    if (apiMode) await Promise.all(hiddenIds.map((bookingId) => apiHideBooking(bookingId)));
    setBookings((prev) =>
      prev.filter((b) => (b.booking_code || `BK-${b.booking_id}`) !== bookingCode)
    );
  };

  const checkInBooking = (bookingId: number) => {
    const now = new Date();
    const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
      now.getDate()
    ).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}`;

    let success = false;
    setBookings((prev) =>
      prev.map((b) => {
        if (b.booking_id === bookingId) {
          success = true;
          return {
            ...b,
            status: 2,
            action_status: 'เช็กอินแล้ว' as TicketActionStatus,
            is_checked_in: true,
            check_in_time: timeStr,
          };
        }
        return b;
      })
    );

    if (success) {
      try {
        confetti({
          particleCount: 40,
          spread: 50,
          origin: { y: 0.5 },
        });
      } catch {
        /* ignore */
      }
    }
    return success;
  };

  // ข้อสรุป: 1 ใบจองลงพร้อมกันทั้งกลุ่ม — ปุ่มเดียวต่อ 1 ใบจอง ไม่แยกที่นั่ง/จุด
  // ตัวอย่าง: สมชาย · #77 · 4 ที่นั่ง [ยืนยันลงแล้ว] ↓ กดแล้ว / ลงแล้ว ✓ (21:47)
  const alightBooking = (bookingId: number, routeStopId?: number) => {
    const now = new Date();
    const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
      now.getDate()
    ).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}`;

    let success = false;
    setBookings((prev) =>
      prev.map((b) => {
        if (b.booking_id === bookingId) {
          // ต้องขึ้นรถมาแล้ว (กันกดลงก่อนขึ้น) และยังไม่เคยกดลง (กันกดเบิ้ล)
          if (b.status !== 2 || b.alighted_at) return b;
          // ล็อกตามป้ายฝั่ง mock: ถ้าส่งป้ายมา ต้องถึงป้ายลงแล้ว (order >= ป้ายลงที่จอง)
          if (routeStopId != null && b.dropoff_route_stop_id != null && b.pickup_route_stop_id != null) {
            const dropRs = routeStops.find((rs) => rs.route_stop_id === b.dropoff_route_stop_id);
            const alightRs = routeStops.find((rs) => rs.route_stop_id === routeStopId);
            if (dropRs && alightRs && alightRs.route_id === dropRs.route_id && alightRs.stop_order < dropRs.stop_order) return b;
          }
          success = true;
          return {
            ...b,
            alighted_at: timeStr,
            alighted_route_stop_id: routeStopId ?? b.dropoff_route_stop_id ?? b.dropoff_stop_id ?? null,
          };
        }
        return b;
      })
    );

    return success;
  };

  const updateTicketStatus = (bookingId: number, statusInput: TicketActionStatus | number) => {
    let newStatusCode: number;
    let newActionStatus: TicketActionStatus;

    if (typeof statusInput === 'number') {
      newStatusCode = statusInput;
      if (statusInput === 0) newActionStatus = 'ยกเลิก';
      else if (statusInput === 2) newActionStatus = 'เช็กอินแล้ว';
      else if (statusInput === 3) newActionStatus = 'เสร็จสิ้น';
      else if (statusInput === 4) newActionStatus = 'ไม่ได้ขึ้นรถ';
      else newActionStatus = 'จองสำเร็จ';
    } else {
      newActionStatus = statusInput;
      if (statusInput === 'ยกเลิก') newStatusCode = 0;
      else if (statusInput === 'เช็กอินแล้ว') newStatusCode = 2;
      else if (statusInput === 'เสร็จสิ้น') newStatusCode = 3;
      else if (statusInput === 'ไม่ได้ขึ้นรถ') newStatusCode = 4;
      else newStatusCode = 1;
    }

    setBookings((prev) =>
      prev.map((b) => {
        if (b.booking_id === bookingId) {
          const now = new Date();
          const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
            now.getDate()
          ).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(
            now.getMinutes()
          ).padStart(2, '0')}`;

          return {
            ...b,
            status: newStatusCode,
            action_status: newActionStatus,
            is_checked_in: newStatusCode === 2 || newStatusCode === 3,
            check_in_time:
              (newStatusCode === 2 || newStatusCode === 3) && !b.check_in_time
                ? timeStr
                : b.check_in_time,
          };
        }
        return b;
      })
    );
  };

  const addTrip = (newTripData: Omit<Trip, 'trip_id'>): Trip => {
    const newId = Math.floor(5000 + Math.random() * 4000);
    const newTrip: Trip = {
      ...newTripData,
      trip_id: newId,
    };
    setTrips((prev) => [...prev, newTrip]);
    return newTrip;
  };

  const updateTrip = async (
    tripId: number,
    input: { route_id: number; service_date: string; departure_time: string; driver_id: string; vehicle_id: string }
  ): Promise<Trip> => {
    const updatedTrip: Trip = {
      trip_id: tripId,
      route_id: input.route_id,
      service_date: input.service_date,
      departure_time: input.departure_time,
      driver_id: input.driver_id,
      vehicle_id: input.vehicle_id,
      status: trips.find((trip) => trip.trip_id === tripId)?.status ?? 1,
    };

    if (apiMode) {
      const result = await apiSaveTrip(tripId, input);
      const row = result.trip;
      const nextTrip: Trip = {
        trip_id: tripId,
        route_id: Number(row.ROUTE_ID ?? input.route_id),
        driver_id: String(row.DRIVER_ID ?? input.driver_id),
        vehicle_id: String(row.VEHICLE_ID ?? input.vehicle_id),
        service_date: String(row.SERVICE_DATE ?? input.service_date),
        departure_time: String(row.DEPARTURE_TIME ?? input.departure_time),
        status: Number(row.STATUS ?? updatedTrip.status),
      };
      setTrips((prev) => prev.map((trip) => (trip.trip_id === tripId ? nextTrip : trip)));
      return nextTrip;
    }

    setTrips((prev) => prev.map((trip) => (trip.trip_id === tripId ? updatedTrip : trip)));
    return updatedTrip;
  };

  const updateTripStatus = async (tripId: number, status: number) => {
    if (apiMode) {
      if (status !== 0 && status !== 1) throw new Error('สถานะรอบรถไม่ถูกต้อง');
      await apiSaveTripStatus(tripId, status);
    }
    setTrips((prev) => prev.map((t) => (t.trip_id === tripId ? { ...t, status } : t)));
  };

  const resetToDefault = () => {
    setBookings(initialBookings);
    setTrips(initialTrips);
    setPermissions(initialPermissions);
    setEmployees(initialEmployees);
    setStops(initialStops);
    setRoutes(initialRoutes);
    setRouteStops(initialRouteStops);
    setVehicles(initialVehicles);
    localStorage.removeItem('mut_bus_bookings');
    localStorage.removeItem('mut_bus_trips');
    localStorage.removeItem('mut_bus_permissions');
  };

  // ============================================================
  // Auth: login / logout
  // ============================================================
  const loginRequestRef = useRef(0);

  const login = (role: LiveRole, identifier?: string) => {
    setIsAuthenticated(true);
    setLiveRole(role);
    setAppMode('live');

    if (role === 'admin') {
      if (identifier) {
        const found = employees.find(
          (e) =>
            e.username.toLowerCase() === identifier.toLowerCase() ||
            e.employee_id === identifier
        );
        if (found) setCurrentAdmin(found);
      } else {
        const adminEmp = employees.find((e) => e.position_id === 1) || initialEmployees[0];
        setCurrentAdmin(adminEmp);
      }
    } else if (role === 'driver') {
      if (identifier) {
        const found = employees.find(
          (e) =>
            e.username.toLowerCase() === identifier.toLowerCase() ||
            e.employee_id === identifier
        );
        if (found) setCurrentDriver(found);
      } else {
        const driverEmp = employees.find((e) => e.position_id === 8) || initialEmployees[1] || initialEmployees[0];
        setCurrentDriver(driverEmp);
      }
    } else if (role === 'passenger') {
      if (identifier) {
        const found = users.find(
          (u) =>
            u.username.toLowerCase() === identifier.toLowerCase() ||
            String(u.user_id) === identifier
        );
        if (found) setCurrentUser(found);
      } else {
        setCurrentUser(initialUsers[0]);
      }
    }
  };

  const apiLoginComplete = async (role: 'passenger' | 'driver', user: Record<string, unknown>) => {
    const requestId = ++loginRequestRef.current;
    setIsLoggingIn(true);

    try {
      if (role === 'passenger') {
        setCurrentUser({
          user_id: Number(user.user_id),
          name: String(user.name),
          username: String(user.username),
          password: '',
          user_type: String(user.user_type) as SystemUser['user_type'],
          phone: String(user.phone ?? ''),
        });
      } else {
        const driverProfile = await api<{ driver: Record<string, unknown> }>('/driver/me');
        const driver = driverProfile.driver;
        setCurrentDriver({
          employee_id: String(driver.EMPLOYEE_ID),
          fullname: String(driver.FULL_NAME),
          username: String(driver.USERNAME),
          phone: String(driver.PHONE ?? ''),
          email: String(driver.EMAIL ?? ''),
          department_id: Number(driver.DEPARTMENT_ID),
          position_id: Number(driver.POSITION_ID),
          password: '',
        });
      }

      const [routePayload, tripPayload] = await Promise.all([
        api<{ routes: Record<string, unknown>[] }>('/routes'),
        api<{ trips: Record<string, unknown>[] }>(role === 'driver' ? '/driver/trips' : '/trips'),
      ]);

      const nextRoutes: Route[] = routePayload.routes.map((r) => ({
        route_id: Number(r.ROUTE_ID),
        name: String(r.NAME),
        status: Number(r.STATUS),
        total_time: Number(r.TOTAL_TIME),
      }));

      const stopResults = await Promise.all(nextRoutes.map(async (route) => {
        const payload = await api<{ stops: Record<string, unknown>[] }>(`/routes/${route.route_id}/stops`);
        return payload.stops.map((row) => ({ route, row }));
      }));

      const nextStops: BusStop[] = [];
      const nextRouteStops: RouteStop[] = [];
      for (const batch of stopResults) {
        for (const item of batch) {
          const { route, row } = item;
          const stopId = Number(row.STOP_ID);
          if (!nextStops.some((s) => s.stop_id === stopId)) {
            nextStops.push({
              stop_id: stopId,
              name: String(row.STOP_NAME),
              detail: String(row.DESCRIPTION ?? ''),
              status: Number(row.STOP_STATUS),
            });
          }
          nextRouteStops.push({
            route_stop_id: Number(row.ROUTE_STOP_ID),
            route_id: route.route_id,
            stop_id: stopId,
            stop_order: Number(row.STOP_ORDER),
            minutes_from_prev: Number(row.MINUTES_FROM_PREV),
          });
        }
      }

      const nextTrips: Trip[] = tripPayload.trips.map((t) => ({
        trip_id: Number(t.TRIP_ID),
        route_id: Number(t.ROUTE_ID),
        driver_id: String(t.DRIVER_ID),
        vehicle_id: String(t.VEHICLE_ID),
        service_date: String(t.SERVICE_DATE),
        departure_time: String(t.DEPARTURE_TIME),
        status: Number(t.STATUS),
      }));

      const nextVehicles: Vehicle[] = tripPayload.trips.map((t) => ({
        vehicle_id: String(t.VEHICLE_ID),
        license_plate: String(t.LICENSE_PLATE),
        capacity: Number(t.CAPACITY),
        status: 1,
        type: String(t.VEHICLE_TYPE) as Vehicle['type'],
      })).filter((v, i, a) => a.findIndex((x) => x.vehicle_id === v.vehicle_id) === i);

      const nextUsers: SystemUser[] = role === 'passenger'
        ? [{
            user_id: Number(user.user_id),
            name: String(user.name),
            username: String(user.username),
            password: '',
            user_type: String(user.user_type) as SystemUser['user_type'],
            phone: String(user.phone ?? ''),
          }]
        : [];
      const grouped = new Map<number, Booking>();
      const nextDriverTripStops: Record<number, DriverTripStopManifest[]> = {};

      if (role === 'passenger') {
        const result = await api<{ bookings: Record<string, unknown>[] }>('/bookings/me');
        for (const row of result.bookings) {
          const bookingId = Number(row.BOOKING_ID);
          const existing = grouped.get(bookingId);
          const status = Number(row.STATUS_CODE);
          const seatCount = Number(row.SEAT_COUNT);
          if (existing) {
            existing.seat_count += seatCount;
            existing.status = status === 0 ? 0 : Math.max(existing.status, status);
            existing.is_checked_in ||= status === 2 || status === 3;
            const alightedAt = row.ALIGHTED_AT == null ? null : String(row.ALIGHTED_AT);
            if (alightedAt && !existing.alighted_at) {
              existing.alighted_at = alightedAt;
              existing.alighted_route_stop_id = row.ALIGHTED_ROUTE_STOP_ID == null ? null : Number(row.ALIGHTED_ROUTE_STOP_ID);
            }
          } else {
            grouped.set(bookingId, {
              booking_id: bookingId,
              booking_code: String(row.BOOKING_CODE),
              user_id: Number(user.user_id),
              trip_id: Number(row.TRIP_ID),
              pickup_stop_id: Number(row.PICKUP_STOP_ID),
              dropoff_stop_id: Number(row.DROPOFF_STOP_ID),
              pickup_route_stop_id: Number(row.PICKUP_ROUTE_STOP_ID),
              dropoff_route_stop_id: Number(row.DROPOFF_ROUTE_STOP_ID),
              seat_count: seatCount,
              status,
              is_checked_in: status === 2 || status === 3,
              alighted_at: row.ALIGHTED_AT == null ? null : String(row.ALIGHTED_AT),
              alighted_route_stop_id: row.ALIGHTED_ROUTE_STOP_ID == null ? null : Number(row.ALIGHTED_ROUTE_STOP_ID),
              booking_time: String(row.BOOKING_TIME),
              leg_type: 'one-way',
              journey_type: 'one-way',
            });
          }
        }
      } else {
        const driverTripResults = await Promise.all(nextTrips.map(async (trip) => {
          const result = await api<{ passengers: Record<string, unknown>[]; stops: Record<string, unknown>[] }>(`/driver/trips/${trip.trip_id}/passengers`);
          nextDriverTripStops[trip.trip_id] = result.stops.map((stop) => ({
            route_stop_id: Number(stop.route_stop_id),
            stop_id: Number(stop.stop_id),
            stop_name: String(stop.stop_name),
            stop_order: Number(stop.stop_order),
            scheduled_boardings: Number(stop.scheduled_boardings),
            checked_in_boardings: Number(stop.checked_in_boardings),
            scheduled_alightings: Number(stop.scheduled_alightings),
            passengers_boarding: (stop.passengers_boarding as Record<string, unknown>[]).map((passenger) => ({
              booking_id: Number(passenger.booking_id),
              booking_code: String(passenger.booking_code),
              passenger_id: Number(passenger.passenger_id),
              passenger_name: String(passenger.passenger_name),
              seat_count: Number(passenger.seat_count),
              status_code: Number(passenger.status_code),
              checked_in_at: passenger.checked_in_at == null ? null : String(passenger.checked_in_at),
              alighted_at: passenger.alighted_at == null ? null : String(passenger.alighted_at),
              alighted_route_stop_id: passenger.alighted_route_stop_id == null ? null : Number(passenger.alighted_route_stop_id),
            })),
            passengers_alighting: (stop.passengers_alighting as Record<string, unknown>[]).map((passenger) => ({
              booking_id: Number(passenger.booking_id),
              booking_code: String(passenger.booking_code),
              passenger_id: Number(passenger.passenger_id),
              passenger_name: String(passenger.passenger_name),
              seat_count: Number(passenger.seat_count),
              status_code: Number(passenger.status_code),
              checked_in_at: passenger.checked_in_at == null ? null : String(passenger.checked_in_at),
              alighted_at: passenger.alighted_at == null ? null : String(passenger.alighted_at),
              alighted_route_stop_id: passenger.alighted_route_stop_id == null ? null : Number(passenger.alighted_route_stop_id),
            })),
          }));
          return result;
        }));

        const uniqueUsers = new Map<number, SystemUser>();
        for (const result of driverTripResults) {
          for (const row of result.passengers) {
            const uid = Number(row.passenger_id);
            uniqueUsers.set(uid, {
              user_id: uid,
              name: String(row.passenger_name),
              username: String(row.passenger_username),
              password: '',
              user_type: 'นักศึกษา',
              phone: '',
            });
            const bookingId = Number(row.booking_id);
            const status = Number(row.status_code);
            const tripId = Number(row.trip_id);
            const rs1 = nextRouteStops.find((rs) => rs.route_stop_id === Number(row.pickup_route_stop_id));
            const rs2 = nextRouteStops.find((rs) => rs.route_stop_id === Number(row.dropoff_route_stop_id));
            const existing = grouped.get(bookingId);
            const seatCount = Number(row.seat_count);
            const alightedAt = row.alighted_at == null ? null : String(row.alighted_at);
            const alightedRs = row.alighted_route_stop_id == null ? null : Number(row.alighted_route_stop_id);
            if (!Number.isFinite(bookingId) || !Number.isFinite(uid) || !Number.isFinite(status) || !Number.isFinite(seatCount) || !Number.isFinite(tripId)) continue;
            if (existing) {
              existing.seat_count += seatCount;
              existing.status = Math.max(existing.status, status);
              existing.is_checked_in ||= status === 2 || status === 3;
              if (alightedAt && !existing.alighted_at) {
                existing.alighted_at = alightedAt;
                existing.alighted_route_stop_id = alightedRs;
              }
            } else {
              grouped.set(bookingId, {
                booking_id: bookingId,
                booking_code: String(row.booking_code),
                user_id: uid,
                trip_id: tripId,
                pickup_stop_id: rs1?.stop_id ?? 0,
                dropoff_stop_id: rs2?.stop_id ?? 0,
                pickup_route_stop_id: Number(row.pickup_route_stop_id),
                dropoff_route_stop_id: Number(row.dropoff_route_stop_id),
                seat_count: seatCount,
                status,
                is_checked_in: status === 2 || status === 3,
                alighted_at: alightedAt,
                alighted_route_stop_id: alightedRs,
                booking_time: '',
                leg_type: 'one-way',
                journey_type: 'one-way',
              });
            }
          }
        }
        nextUsers.push(...uniqueUsers.values());
      }

      if (requestId !== loginRequestRef.current) return;

      setRoutes(nextRoutes);
      setStops(nextStops);
      setRouteStops(nextRouteStops);
      setTrips(nextTrips);
      setVehicles(nextVehicles);
      setUsersLive(nextUsers);
      setDriverTripStops(role === 'driver' ? nextDriverTripStops : {});
      setBookings([...grouped.values()]);

      const seats: Record<number, number> = {};
      const seatResults = await Promise.all(nextTrips.map(async (t) => {
        const result = await api<{ booked_count: number }>(`/trips/${t.trip_id}/seats`);
        return { tripId: t.trip_id, count: result.booked_count };
      }));
      for (const seat of seatResults) seats[seat.tripId] = seat.count;

      if (requestId !== loginRequestRef.current) return;
      setApiSeats(seats);
      setApiMode(true);
      setIsAuthenticated(true);
      setLiveRole(role);
      setAppMode('live');
    } finally {
      if (requestId === loginRequestRef.current) setIsLoggingIn(false);
    }
  };

  const apiAdminLoginComplete = async (user: Record<string, unknown>) => {
    const requestId = ++loginRequestRef.current;
    setIsLoggingIn(true);

    try {
      const result = await apiAdminMasters();
      const admin: Employee = {
        employee_id: String(user.employee_id),
        fullname: String(user.full_name),
        username: String(user.username),
        password: '',
        phone: String(user.phone ?? ''),
        email: String(user.email ?? ''),
        department_id: Number(user.department_id),
        position_id: Number(user.position_id),
      };

      if (requestId !== loginRequestRef.current) return;
      setCurrentAdmin(admin);
      setEmployees(result.employees.map((row) => ({
        employee_id: String(row.EMPLOYEE_ID),
        fullname: String(row.FULL_NAME),
        username: String(row.USERNAME),
        phone: String(row.PHONE ?? ''),
        email: String(row.EMAIL ?? ''),
        department_id: Number(row.DEPARTMENT_ID),
        position_id: Number(row.POSITION_ID),
      })));
      setPositions(result.positions.map((row) => ({
        position_id: Number(row.POSITION_ID),
        name: String(row.NAME),
      })));
      setDepartments(result.departments.map((row) => ({
        department_id: Number(row.DEPARTMENT_ID),
        name: String(row.NAME),
      })));
      setVehicles(result.vehicles.map((row) => ({
        vehicle_id: String(row.VEHICLE_ID),
        license_plate: String(row.LICENSE_PLATE),
        type: String(row.TYPE) as Vehicle['type'],
        capacity: Number(row.CAPACITY),
        status: Number(row.STATUS),
      })));
      setVehicleTypes(result.vehicleTypes.map((row) => ({
        vehicle_type_id: Number(row.VEHICLE_TYPE_ID),
        name: String(row.NAME) as VehicleType['name'],
      })));
      setRoutes(result.routes.map((row) => ({
        route_id: Number(row.ROUTE_ID),
        name: String(row.NAME),
        total_time: Number(row.TOTAL_TIME),
        status: Number(row.STATUS),
      })));
      setStops(result.stops.map((row) => ({
        stop_id: Number(row.STOP_ID),
        name: String(row.NAME),
        detail: String(row.DETAIL ?? ''),
        status: Number(row.STATUS),
      })));
      setRouteStops(result.routeStops.map((row) => ({
        route_stop_id: Number(row.ROUTE_STOP_ID),
        route_id: Number(row.ROUTE_ID),
        stop_id: Number(row.STOP_ID),
        stop_order: Number(row.STOP_ORDER),
        minutes_from_prev: Number(row.MINUTES_FROM_PREV),
      })));
      setTrips(result.trips.map((row) => ({
        trip_id: Number(row.TRIP_ID),
        route_id: Number(row.ROUTE_ID),
        driver_id: String(row.DRIVER_ID),
        vehicle_id: String(row.VEHICLE_ID),
        service_date: String(row.SERVICE_DATE),
        departure_time: String(row.DEPARTURE_TIME),
        status: Number(row.STATUS),
      })));
      setPermissions(result.permissions.map((row) => {
        const screenCode = String(row.SCREEN_CODE);
        const screen = initialScreens.find((item) => item.code === screenCode);
        return {
          permission_id: String(row.PERMISSION_ID),
          position_id: Number(row.POSITION_ID),
          screen_id: screen?.screen_id ?? Number(row.SCREEN_ID),
          can_view: row.CAN_VIEW === 'Y',
          can_edit: row.CAN_EDIT === 'Y',
        };
      }));

      if (requestId !== loginRequestRef.current) return;
      setApiMode(true);
      setApiSeats({});
      setIsAuthenticated(true);
      setLiveRole('admin');
      setAppMode('live');
    } finally {
      if (requestId === loginRequestRef.current) setIsLoggingIn(false);
    }
  };

  const apiCreateEmployee = async (emp: Omit<Employee, 'employee_id'>) => {
    const result = await apiInsertEmployee({
      fullname: emp.fullname,
      username: emp.username,
      password: emp.password ?? '',
      phone: emp.phone,
      email: emp.email,
      department_id: emp.department_id,
      position_id: emp.position_id,
    });
    const row = result.employee;
    const created: Employee = {
      employee_id: String(row.employee_id),
      fullname: String(row.fullname),
      username: String(row.username),
      phone: String(row.phone ?? ''),
      email: String(row.email ?? ''),
      department_id: Number(row.department_id),
      position_id: Number(row.position_id),
    };
    setEmployees((previous) => [...previous, created]);
    return created;
  };

  const apiUpdateEmployee = async (emp: Employee, newPassword?: string) => {
    const result = await apiSaveEmployee(emp.employee_id, {
      fullname: emp.fullname,
      username: emp.username,
      ...(newPassword?.trim() ? { password: newPassword.trim() } : {}),
      phone: emp.phone,
      email: emp.email,
      department_id: emp.department_id,
      position_id: emp.position_id,
    });
    const row = result.employee;
    const updated: Employee = {
      employee_id: String(row.employee_id),
      fullname: String(row.fullname),
      username: String(row.username),
      phone: String(row.phone ?? ''),
      email: String(row.email ?? ''),
      department_id: Number(row.department_id),
      position_id: Number(row.position_id),
    };
    setEmployees((previous) => previous.map((employee) => employee.employee_id === updated.employee_id ? updated : employee));
    return updated;
  };

  const apiCreateVehicle = async (vehicle: Omit<Vehicle, 'status'>) => {
    const result = await apiInsertVehicle(vehicle);
    const row = result.vehicle;
    const created: Vehicle = {
      vehicle_id: String(row.vehicle_id),
      license_plate: String(row.license_plate),
      type: String(row.type) as Vehicle['type'],
      capacity: Number(row.capacity),
      status: Number(row.status),
    };
    setVehicles((previous) => [...previous, created]);
    return created;
  };

  const apiUpdateVehicle = async (vehicle: Omit<Vehicle, 'status'>) => {
    const result = await apiSaveVehicle(vehicle.vehicle_id, {
      license_plate: vehicle.license_plate,
      type: vehicle.type,
      capacity: vehicle.capacity,
    });
    const row = result.vehicle;
    const updated: Vehicle = {
      vehicle_id: String(row.vehicle_id),
      license_plate: String(row.license_plate),
      type: String(row.type) as Vehicle['type'],
      capacity: Number(row.capacity),
      status: vehicles.find((item) => item.vehicle_id === String(row.vehicle_id))?.status ?? 1,
    };
    setVehicles((previous) => previous.map((item) => item.vehicle_id === updated.vehicle_id ? updated : item));
    return updated;
  };

  const apiSetVehicleStatus = async (vehicleId: string, status: 0 | 1) => {
    await apiSaveVehicleStatus(vehicleId, status);
    setVehicles((previous) => previous.map((vehicle) => vehicle.vehicle_id === vehicleId ? { ...vehicle, status } : vehicle));
  };

  const apiCreateVehicleType = async (name: VehicleType['name']) => {
    const result = await apiInsertVehicleType(name);
    const row = result.vehicleType;
    const created: VehicleType = {
      vehicle_type_id: Number(row.vehicle_type_id),
      name: String(row.name) as VehicleType['name'],
    };
    setVehicleTypes((previous) => [...previous, created]);
    return created;
  };

  const apiCreateTrips = async (input: {
    route_id: number;
    service_date: string;
    departure_times: string[];
    driver_id: string;
    vehicle_id: string;
  }) => {
    const result = await apiInsertTrips(input);
    const created = result.trips.map((row): Trip => ({
      trip_id: Number(row.trip_id),
      route_id: Number(row.route_id),
      driver_id: String(row.driver_id),
      vehicle_id: String(row.vehicle_id),
      service_date: String(row.service_date),
      departure_time: String(row.departure_time),
      status: Number(row.status),
    }));
    setTrips((previous) => [...previous, ...created]);
    return created;
  };

  const apiCreatePosition = async (name: string) => {
    const result = await apiInsertPosition(name);
    const created = { position_id: Number(result.position.position_id), name: String(result.position.name) };
    setPositions((previous) => [...previous, created]);
    return created;
  };

  const apiCreateDepartment = async (name: string) => {
    const result = await apiInsertDepartment(name);
    const created = { department_id: Number(result.department.department_id), name: String(result.department.name) };
    setDepartments((previous) => [...previous, created]);
    return created;
  };

  const setUsersLive = (next: SystemUser[]) => setUsers(next);

  const apiRefreshBookings = async () => {
    const result = await api<{ bookings: Record<string, unknown>[] }>('/bookings/me');
    const grouped = new Map<number, Booking>();
    for (const row of result.bookings) {
      const bookingId = Number(row.BOOKING_ID), status = Number(row.STATUS_CODE), found = grouped.get(bookingId);
      const seatCount = Number(row.SEAT_COUNT);
      if (found) { found.seat_count += seatCount; found.status = status === 0 ? 0 : Math.max(found.status, status); found.is_checked_in ||= status === 2 || status === 3; }
      else grouped.set(bookingId, { booking_id: bookingId, booking_code: String(row.BOOKING_CODE), user_id: currentUser.user_id, trip_id: Number(row.TRIP_ID), pickup_stop_id: Number(row.PICKUP_STOP_ID), dropoff_stop_id: Number(row.DROPOFF_STOP_ID), seat_count: seatCount, status, is_checked_in: status === 2 || status === 3, booking_time: String(row.BOOKING_TIME), leg_type: 'one-way', journey_type: 'one-way' });
    }
    setBookings([...grouped.values()]);
    setApiSegmentSeats({});
    await Promise.all([...new Set([...grouped.values()].map((b) => b.trip_id))].map(async (tripId) => { const seats = await api<{ booked_count: number }>(`/trips/${tripId}/seats`); setApiSeats((prev) => ({ ...prev, [tripId]: seats.booked_count })); }));
  };

  const apiCreateBooking = async (tripId: number, pickupRouteStopId: number, dropoffRouteStopId: number, seatCount: number) => {
    const stopsForTrip = routeStops.filter((rs) => rs.route_id === trips.find((t) => t.trip_id === tripId)?.route_id);
    const pickup = stopsForTrip.find((rs) => rs.route_stop_id === pickupRouteStopId), dropoff = stopsForTrip.find((rs) => rs.route_stop_id === dropoffRouteStopId);
    if (!pickup || !dropoff) throw new Error('Select pickup and drop-off stops on this route.');
    const result = await api<{ booking_id: number; booking_code: string; seat_count: number }>('/bookings', { method: 'POST', body: JSON.stringify({ trip_id: tripId, pickup_route_stop_id: pickup.route_stop_id, dropoff_route_stop_id: dropoff.route_stop_id, seat_count: seatCount }) });
    await apiRefreshBookings();
    return bookings.find((b) => b.booking_id === result.booking_id) ?? { booking_id: result.booking_id, booking_code: result.booking_code, user_id: currentUser.user_id, trip_id: tripId, pickup_stop_id: pickup.stop_id, dropoff_stop_id: dropoff.stop_id, seat_count: result.seat_count, status: 1, is_checked_in: false, booking_time: new Date().toISOString(), leg_type: 'one-way', journey_type: 'one-way' };
  };
  const apiCancelBooking = async (bookingId: number) => { await api(`/bookings/${bookingId}/cancel`, { method: 'POST' }); await apiRefreshBookings(); };
  const apiStartTrip = async (tripId: number) => {
    await api(`/driver/trips/${tripId}/start`, { method: 'POST' });
    setTrips((prev) => prev.map((t) => t.trip_id === tripId ? { ...t, status: 2 } : t));
    // ดึง bookings, users และตารางขึ้น-ลงตามจุดจอดใหม่ เพราะอาจมีผู้โดยสารจองเพิ่ม
    // หลังคนขับล็อกอิน แต่ก่อนกดเริ่มออกรถ (แบบเดียวกับที่ apiCheckIn ทำอยู่แล้ว)
    await apiLoginComplete('driver', { employee_id: currentDriver.employee_id, full_name: currentDriver.fullname, username: currentDriver.username, position_id: currentDriver.position_id });
  };
  // เช็กอินต้องระบุป้ายปัจจุบันที่รถจอดอยู่ — backend ตรวจว่าตั๋วจองขึ้นป้ายนี้จริง
  const apiCheckIn = async (tripId: number, qrPayload: string, routeStopId: number) => { await api(`/driver/trips/${tripId}/check-in`, { method: 'POST', body: JSON.stringify({ qr_payload: qrPayload, route_stop_id: routeStopId }) }); await apiLoginComplete('driver', { employee_id: currentDriver.employee_id, full_name: currentDriver.fullname, username: currentDriver.username, position_id: currentDriver.position_id }); };
  // ลงทั้งใบจองปุ่มเดียว: 1 ใบจองลงพร้อมกันทั้งกลุ่ม ไม่แยกที่นั่ง/จุด
  // ส่ง route_stop_id ไปด้วยถ้าลงไม่ตรงที่จอง (ถ้าไม่ส่ง backend ใช้จุดลงที่จองไว้)
  const apiAlightBooking = async (tripId: number, bookingId: number, routeStopId?: number) => {
    await api(`/driver/trips/${tripId}/alight`, { method: 'POST', body: JSON.stringify(routeStopId == null ? { booking_id: bookingId } : { booking_id: bookingId, route_stop_id: routeStopId }) });
    await apiLoginComplete('driver', { employee_id: currentDriver.employee_id, full_name: currentDriver.fullname, username: currentDriver.username, position_id: currentDriver.position_id });
  };
  const apiFinishTrip = async (tripId: number) => {
    const result = await api<{ summary: { boarded_count: number; no_show_count: number; alighted_count?: number; no_shows: Record<string, unknown>[]; not_alighted?: Record<string, unknown>[] } }>(`/driver/trips/${tripId}/finish`, { method: 'POST' });
    setTrips((prev) => prev.map((t) => t.trip_id === tripId ? { ...t, status: 3 } : t));
    // ใช้รายชื่อ no-show ที่ server คำนวณจากฐานข้อมูลโดยตรง ไม่กรองจาก state ในเบราว์เซอร์
    // เพื่อให้ตัวเลขที่แสดงตรงกับที่ถูกบันทึกลง Oracle เสมอ
    const noShows: TripSummaryNoShow[] = result.summary.no_shows.map((row) => ({
      booking_id: Number(row.BOOKING_ID),
      booking_code: String(row.BOOKING_CODE),
      passenger_name: String(row.PASSENGER_NAME),
      seat_count: Number(row.SEAT_COUNT),
    }));
    const notAlighted: TripSummaryNoShow[] = (result.summary.not_alighted ?? []).map((row) => ({
      booking_id: Number(row.BOOKING_ID),
      booking_code: String(row.BOOKING_CODE),
      passenger_name: String(row.PASSENGER_NAME),
      seat_count: Number(row.SEAT_COUNT),
    }));
    setBookings((prev) => prev.map((b) => b.trip_id === tripId ? { ...b, status: b.is_checked_in ? 3 : 4 } : b));
    return { totalBoarded: result.summary.boarded_count, totalAlighted: Number(result.summary.alighted_count ?? result.summary.boarded_count), noShows, notAlighted };
  };

  const logout = () => {
    if (apiToken.get()) void api('/auth/logout', { method: 'POST' }).catch(() => undefined);
    apiToken.clear(); setApiMode(false); setApiSeats({}); setApiSegmentSeats({});
    setIsAuthenticated(false);
    setAppMode('live');
    setLiveRole('passenger');
  };

  // ============================================================
  // Provider
  // ============================================================
  return (
    <BusContext.Provider
      value={{
        apiMode, apiLoginComplete, apiAdminLoginComplete, apiCreateEmployee, apiUpdateEmployee, apiCreateVehicle, apiUpdateVehicle, apiSetVehicleStatus, apiCreateVehicleType, apiCreateTrips, apiUpdateTrip: updateTrip, apiCreatePosition, apiCreateDepartment,
        apiCreateBooking, apiCancelBooking, apiStartTrip, apiCheckIn, apiAlightBooking, apiFinishTrip,
        isAuthenticated,
        isLoggingIn,
        setIsAuthenticated,
        setIsLoggingIn,
        login,
        logout,
        appMode,
        setAppMode,
        liveRole,
        setLiveRole,
        figmaView,
        setFigmaView,
        selectedFigmaFrame,
        setSelectedFigmaFrame,
        simulatedCurrentTime,
        setSimulatedCurrentTime,
        currentUser,
        setCurrentUser,
        currentDriver,
        setCurrentDriver,
        currentAdmin,
        setCurrentAdmin,
        currentEmployee,
        canViewScreen,
        canEditScreen,
        getPermittedScreens,
        getPermissionsForPosition,
        departments,
        positions,
        employees,
        screens,
        permissions,
        stops,
        routes,
        routeStops,
        vehicles,
        vehicleTypes,
        trips,
        driverTripStops,
        users,
        bookings,
        addEmployee,
        updateEmployee,
        deleteEmployee,
        addRoute,
        updateRoute,
        deleteRoute,
        addStop,
        updateStop,
        deleteStop,
        addRouteStop,
        deleteRouteStop,
        addPosition,
        addVehicleType,
        addVehicle,
        updateVehicle,
        setVehicleStatus,
        updatePosition,
        deletePosition,
        addDepartment,
        updateDepartment,
        deleteDepartment,
        addPermission,
        deletePermission,
        updatePermission,
        checkTripConflict,
        checkCutOffTime,
        createBooking,
        cancelBooking,
        deleteBooking,
        deleteBookingsByCode,
        checkInBooking,
        alightBooking,
        updateTicketStatus,
        startTrip,
        finishTrip,
        verifyTicketForTrip,
        addTrip,
        updateTrip,
        updateTripStatus,
        resetToDefault,
        getRouteById,
        getStopById,
        getVehicleById,
        getEmployeeById,
        getStopsForRoute,
        getBookingsForTrip,
        getBookedSeatCountForTrip,
        apiLoadSegmentSeats,
      }}
    >
      {children}
    </BusContext.Provider>
  );
};

export const useBus = () => {
  const context = useContext(BusContext);
  if (!context) {
    throw new Error('useBus must be used within a BusProvider');
  }
  return context;
};
