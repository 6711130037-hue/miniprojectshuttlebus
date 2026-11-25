import React, { useState, useMemo, useEffect } from 'react';
import { useBus } from '../../context/BusContext';
import {
  Trip,
  Booking,
  Vehicle,
  Employee,
  TicketActionStatus,
  TICKET_STATUS_CONFIG,
  resolveTicketActionStatus,
} from '../../types/schema';
import { initialEmployees } from '../../data/mockDatabase';
import { QrCodeSvg } from '../common/QrCodeSvg';
import {
  Bus, Calendar, Clock, MapPin, CheckCircle2, CheckCheck, Flag, ArrowRight,
  Ticket, User, ShieldCheck, AlertCircle, AlertTriangle, QrCode, X, Check,
  XCircle, CalendarCheck, PlusCircle, Trash2, Filter,
  Star, ArrowUpDown, Timer,
} from 'lucide-react';

// ============================================================
// REALTIME DATE HELPERS
// ============================================================
const getToday = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const getTomorrow = (): string => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const getBookingMaxDate = (): string => {
  return getTomorrow();
};
const getTodayLabel = (): string => {
  const d = new Date();
  const m = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
  return `วันนี้ ${d.getDate()} ${m[d.getMonth()]}`;
};
const getTomorrowLabel = (): string => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const m = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
  return `พรุ่งนี้ ${d.getDate()} ${m[d.getMonth()]}`;
};
const timeToMinutes = (t: string): number => {
  const [h, m] = t.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};
const minutesToTime = (mins: number): string => {
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

const getBookingPickupDateTime = (booking: Booking, trip: Trip | undefined, routeStops: ReturnType<typeof useBus>['routeStops']): Date | null => {
  if (!trip) return null;
  const orderedStops = routeStops
    .filter((routeStop) => routeStop.route_id === trip.route_id)
    .sort((a, b) => a.stop_order - b.stop_order);
  const pickup = booking.pickup_route_stop_id != null
    ? orderedStops.find((routeStop) => routeStop.route_stop_id === booking.pickup_route_stop_id)
    : orderedStops.find((routeStop) => routeStop.stop_id === booking.pickup_stop_id);
  if (!pickup) return null;
  const minutesToPickup = orderedStops
    .filter((routeStop) => routeStop.stop_order <= pickup.stop_order)
    .reduce((total, routeStop) => total + (routeStop.minutes_from_prev || 0), 0);
  const pickupAt = new Date(`${trip.service_date.slice(0, 10)}T${trip.departure_time}:00`);
  if (Number.isNaN(pickupAt.getTime())) return null;
  pickupAt.setMinutes(pickupAt.getMinutes() + minutesToPickup);
  return pickupAt;
};

const isBookingUpcoming = (booking: Booking, trip: Trip | undefined, routeStops: ReturnType<typeof useBus>['routeStops']): boolean => {
  if (![1, 2].includes(booking.status) || !trip || ![1, 2].includes(trip.status)) return false;
  const pickupAt = getBookingPickupDateTime(booking, trip, routeStops);
  return pickupAt !== null && pickupAt.getTime() > Date.now();
};

// ============================================================
// TICKET STATUS BADGE
// ============================================================
export const TicketStatusBadge: React.FC<{
  status: TicketActionStatus;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}> = ({ status, showIcon = true, size = 'sm' }) => {
  const meta = TICKET_STATUS_CONFIG[status] || TICKET_STATUS_CONFIG['จองสำเร็จ'];
  const sizeClasses =
    size === 'lg' ? 'px-3.5 py-1.5 text-xs font-bold'
    : size === 'md' ? 'px-3 py-1 text-xs font-bold'
    : 'px-2.5 py-0.5 text-[11px] font-bold';

  const renderIcon = () => {
    switch (status) {
      case 'จองสำเร็จ': return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />;
      case 'เช็กอินแล้ว': return <CheckCheck className="w-3.5 h-3.5 text-white shrink-0" />;
      case 'เสร็จสิ้น': return <Flag className="w-3.5 h-3.5 text-sky-600 shrink-0" />;
      case 'ยกเลิก': return <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />;
      case 'ไม่ได้ขึ้นรถ': return <AlertTriangle className="w-3.5 h-3.5 text-amber-800 shrink-0" />;
      default: return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />;
    }
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border whitespace-nowrap tracking-tight transition-all ${sizeClasses} ${meta.badgeBg} ${meta.badgeText} ${meta.badgeBorder}`}
      title={meta.description}
    >
      {showIcon && renderIcon()}
      <span>{meta.labelTh}</span>
      <span className="text-[10px] opacity-80 font-normal">({meta.labelEn})</span>
    </span>
  );
};

// ============================================================
// PASSENGER PORTAL
// ============================================================
export const PassengerPortal: React.FC = () => {
  const {
    currentUser, trips, routes, stops, routeStops, vehicles, employees, bookings, apiMode, simulatedCurrentTime, apiCreateBooking, apiCancelBooking,
    createBooking, cancelBooking, checkInBooking, getStopsForRoute, getBookedSeatCountForTrip, setSimulatedCurrentTime,
    deleteBooking, deleteBookingsByCode, apiLoadSegmentSeats,
  } = useBus();

  const [activeTab, setActiveTab] = useState<'book' | 'my-tickets'>('book');
  const [step, setStep] = useState<number>(1);

  const MAX_STAGED_TRIPS = 4;
  const [stagedTrips, setStagedTrips] = useState<{
    staged_id: string;
    trip: Trip;
    route: any;
    pickup_stop_id: number;
    dropoff_stop_id: number;
    pickup_route_stop_id: number;
    dropoff_route_stop_id: number;
    seat_count: number;
    leg_type: 'one-way';
    journey_label: string;
    service_date: string;
    departure_time: string;
  }[]>([]);
  const [isConfirmingBookings, setIsConfirmingBookings] = useState(false);

  const [newlyIssuedBookings, setNewlyIssuedBookings] = useState<any[]>([]);
  const [activeIssuedTicketIndex, setActiveIssuedTicketIndex] = useState<number>(0);
  const [checkInFeedback, setCheckInFeedback] = useState<{ [bookingId: number]: boolean }>({});

  const [selectedRouteId, setSelectedRouteId] = useState<number>(1);
  const [hasAutoSelectedApiRoute, setHasAutoSelectedApiRoute] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(getToday());
  const [clockDraft, setClockDraft] = useState(simulatedCurrentTime);
  const [pickupRouteStopId, setPickupRouteStopId] = useState<number>(1);
  const [dropoffRouteStopId, setDropoffRouteStopId] = useState<number>(7);
  const [selectedTripId, setSelectedTripId] = useState<number | null>(null);
  const [liveClock, setLiveClock] = useState(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  });

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setLiveClock(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);
    };
    const timer = window.setInterval(updateClock, 30_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    setClockDraft(simulatedCurrentTime);
  }, [simulatedCurrentTime]);

  useEffect(() => {
    if (!apiMode || routes.length === 0) return;
    if (!hasAutoSelectedApiRoute && trips.length > 0) {
      const routeWithMostUpcomingTrips = routes.reduce((best, candidate) => {
        const candidateCount = trips.filter((trip) => trip.route_id === candidate.route_id && trip.status === 1 && trip.service_date >= getToday() && trip.service_date <= getTomorrow()).length;
        const bestCount = trips.filter((trip) => trip.route_id === best.route_id && trip.status === 1 && trip.service_date >= getToday() && trip.service_date <= getTomorrow()).length;
        return candidateCount > bestCount ? candidate : best;
      }, routes[0]);
      setHasAutoSelectedApiRoute(true);
      if (routeWithMostUpcomingTrips.route_id !== selectedRouteId) setSelectedRouteId(routeWithMostUpcomingTrips.route_id);
    }
    const route = routes.find((r) => r.route_id === selectedRouteId) ?? routes[0];
    if (route.route_id !== selectedRouteId) setSelectedRouteId(route.route_id);
    const stopsOnRoute = routeStops.filter((rs) => rs.route_id === route.route_id).sort((a, b) => a.stop_order - b.stop_order);
    if (stopsOnRoute.length > 1) {
      const pickupIndex = stopsOnRoute.findIndex((rs) => rs.route_stop_id === pickupRouteStopId);
      const dropoffIndex = stopsOnRoute.findIndex((rs) => rs.route_stop_id === dropoffRouteStopId);
      if (pickupIndex < 0) {
        setPickupRouteStopId(stopsOnRoute[0].route_stop_id);
        setDropoffRouteStopId(stopsOnRoute[stopsOnRoute.length - 1].route_stop_id);
      } else if (dropoffIndex <= pickupIndex) {
        setDropoffRouteStopId(stopsOnRoute[stopsOnRoute.length - 1].route_stop_id);
      }
    }
    const matchingTrips = trips.filter((t) => t.route_id === route.route_id && t.service_date >= getToday() && t.service_date <= getTomorrow());
    if (matchingTrips.length && !matchingTrips.some((t) => t.service_date === selectedDate)) setSelectedDate(matchingTrips[0].service_date);
  }, [apiMode, routes, routeStops, trips, selectedRouteId, pickupRouteStopId, dropoffRouteStopId, hasAutoSelectedApiRoute, selectedDate]);

  useEffect(() => {
    if (selectedDate < getToday() || selectedDate > getTomorrow()) setSelectedDate(getToday());
  }, [selectedDate, liveClock]);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [seatLimitWarning, setSeatLimitWarning] = useState<string | null>(null);

  type SortBy = 'time-asc' | 'time-desc' | 'seats-desc';
  const [sortBy, setSortBy] = useState<SortBy>('time-asc');
  const [favorites, setFavorites] = useState<number[]>([]);

  const [activeTicketBookingId, setActiveTicketBookingId] = useState<number | null>(null);
  const [ticketModalOpen, setTicketModalOpen] = useState<boolean>(false);
  const [confirmErrorModal, setConfirmErrorModal] = useState<{ title: string; message: string } | null>(null);
  const [cancelModalData, setCancelModalData] = useState<{ bookingId: number; bookingCode: string; seatCount?: number } | null>(null);
  const [ticketStatusFilter, setTicketStatusFilter] = useState<'all' | 'upcoming' | TicketActionStatus>('all');

  // Delete modal state
  const [deleteModalData, setDeleteModalData] = useState<{
    type: 'single' | 'group';
    bookingId?: number;
    bookingCode?: string;
    ticketCount?: number;
    label: string;
  } | null>(null);

  const selectedTrip = useMemo(() => {
    if (!selectedTripId) return null;
    return trips.find((t) => t.trip_id === selectedTripId) || null;
  }, [selectedTripId, trips]);

  // ============================================================
  // Resolvers
  // ============================================================
  const resolveVehicle = (trip: Trip | null | undefined): Vehicle => {
    if (!trip) return vehicles[0] || { vehicle_id: '001', license_plate: 'สย 2591', type: 'รถตู้', capacity: 9, status: 1 };
    const found = vehicles.find((v) => String(v.vehicle_id).trim() === String(trip.vehicle_id).trim() || Number(v.vehicle_id) === Number(trip.vehicle_id));
    if (found) return found;
    if (trip.vehicle_id === '003' || trip.trip_id === 3001 || trip.trip_id === 3003)
      return vehicles.find((v) => v.vehicle_id === '003') || { vehicle_id: '003', license_plate: 'ชย 7788', type: 'รถตู้', capacity: 9, status: 1 };
    if (['004','005'].includes(trip.vehicle_id) || [1003,1004,1006].includes(trip.trip_id))
      return vehicles.find((v) => v.type === 'รถบัส') || { vehicle_id: '004', license_plate: 'บก 1130', type: 'รถบัส', capacity: 20, status: 1 };
    if (['006','007'].includes(trip.vehicle_id) || [3002,3004].includes(trip.trip_id))
      return vehicles.find((v) => v.type === 'รถบัส' && v.capacity === 15) || { vehicle_id: '006', license_plate: 'นน 5566', type: 'รถบัส', capacity: 15, status: 1 };
    return vehicles.find((v) => v.type === 'รถตู้') || { vehicle_id: '001', license_plate: 'สย 2591', type: 'รถตู้', capacity: 9, status: 1 };
  };

  const resolveDriver = (trip: Trip | null | undefined): Employee => {
    if (!trip) return employees[0] || initialEmployees[0];
    const found = employees.find((e) => String(e.employee_id).trim() === String(trip.driver_id).trim() || Number(e.employee_id) === Number(trip.driver_id));
    if (found) return found;
    if (trip.trip_id === 3001 || trip.trip_id === 3003)
      return employees.find((e) => e.employee_id === '00004') || initialEmployees.find((e) => e.employee_id === '00004') || initialEmployees[3];
    if (trip.trip_id === 3002 || trip.trip_id === 3004)
      return employees.find((e) => e.employee_id === '00005') || initialEmployees.find((e) => e.employee_id === '00005') || initialEmployees[4];
    return employees.find((e) => e.position_id === 8) || initialEmployees.find((e) => e.position_id === 8) || initialEmployees[0];
  };

  const currentRouteStops = getStopsForRoute(selectedRouteId);
  const selectedPickupRouteStop = currentRouteStops.find((stop) => stop.route_stop_id === pickupRouteStopId);
  const selectedDropoffRouteStop = currentRouteStops.find((stop) => stop.route_stop_id === dropoffRouteStopId);
  const pickupStopId = selectedPickupRouteStop?.stop_id ?? 0;
  const dropoffStopId = selectedDropoffRouteStop?.stop_id ?? 0;
  const selectedRoute = routes.find((r) => r.route_id === selectedRouteId);
  const availableTripsRaw = trips.filter((t) =>
    t.route_id === selectedRouteId
    && t.service_date === selectedDate
    && t.status === 1
    && vehicles.some((vehicle) => vehicle.vehicle_id === t.vehicle_id && vehicle.status === 1)
  );

  const getMinutesUntilPickup = (trip: Trip): number => {
    const pickupIndex = currentRouteStops.findIndex((stop) => stop.route_stop_id === pickupRouteStopId);
    if (pickupIndex < 0) return Number.NEGATIVE_INFINITY;

    const minutesToPickup = currentRouteStops
      .slice(0, pickupIndex + 1)
      .reduce((total, stop) => total + (stop.minutesFromPrev || 0), 0);
    const todayStart = new Date(`${getToday()}T00:00:00`);
    const tripStart = new Date(`${trip.service_date}T00:00:00`);
    const dayOffset = Math.round((tripStart.getTime() - todayStart.getTime()) / 86400000);
    return dayOffset * 1440 + timeToMinutes(trip.departure_time) + minutesToPickup - timeToMinutes(simulatedCurrentTime);
  };

  const getActualMinutesUntilPickup = (trip: Trip): number => {
    const pickupIndex = currentRouteStops.findIndex((stop) => stop.route_stop_id === pickupRouteStopId);
    if (pickupIndex < 0) return Number.NEGATIVE_INFINITY;
    const minutesToPickup = currentRouteStops
      .slice(0, pickupIndex + 1)
      .reduce((total, stop) => total + (stop.minutesFromPrev || 0), 0);
    const arrivalAtPickup = new Date(`${trip.service_date}T${trip.departure_time}:00`);
    arrivalAtPickup.setMinutes(arrivalAtPickup.getMinutes() + minutesToPickup);
    return (arrivalAtPickup.getTime() - Date.now()) / 60000;
  };

  const isTripBookable = (trip: Trip): boolean =>
    trip.service_date >= getToday() && trip.service_date <= getTomorrow() &&
    (apiMode
      ? getActualMinutesUntilPickup(trip) >= 20
      : getMinutesUntilPickup(trip) >= 20);

  const availableOutboundTrips = useMemo(() => {
    let list = availableTripsRaw.filter(isTripBookable);
    list.sort((a, b) => {
      if (sortBy === 'time-asc') return timeToMinutes(a.departure_time) - timeToMinutes(b.departure_time);
      if (sortBy === 'time-desc') return timeToMinutes(b.departure_time) - timeToMinutes(a.departure_time);
      if (sortBy === 'seats-desc') {
        const sa = (resolveVehicle(a).capacity || 9) - getBookedSeatCountForTrip(a.trip_id, pickupRouteStopId, dropoffRouteStopId);
        const sb = (resolveVehicle(b).capacity || 9) - getBookedSeatCountForTrip(b.trip_id, pickupRouteStopId, dropoffRouteStopId);
        return sb - sa;
      }
      return 0;
    });
    return list;
  }, [availableTripsRaw, sortBy, pickupRouteStopId, currentRouteStops, apiMode, simulatedCurrentTime, liveClock]);

  // โหมด API: ถามที่นั่งว่างตามช่วงป้ายที่เลือก (ขึ้น→ลง) ทุกครั้งที่เปลี่ยนช่วง/รอบ/จำนวนการจอง
  useEffect(() => {
    if (!apiMode || !pickupRouteStopId || !dropoffRouteStopId || availableTripsRaw.length === 0) return;
    void apiLoadSegmentSeats(availableTripsRaw.map((t) => t.trip_id), pickupRouteStopId, dropoffRouteStopId).catch(() => undefined);
  }, [apiMode, pickupRouteStopId, dropoffRouteStopId, selectedRouteId, selectedDate, trips, bookings]);

  useEffect(() => {
    if (selectedTripId !== null && (!availableOutboundTrips.some((trip) => trip.trip_id === selectedTripId) || !selectedTrip || !isTripBookable(selectedTrip))) {
      setSelectedTripId(null);
    }
  }, [availableOutboundTrips, selectedTripId, selectedTrip, pickupRouteStopId, routeStops, simulatedCurrentTime, liveClock, apiMode]);

  const myBookings = bookings.filter((b) => b.user_id === currentUser.user_id);

  const bookingGroups = useMemo(() => {
    const map = new Map<string, typeof myBookings>();
    myBookings.forEach((b) => {
      const code = b.booking_code || `BK-${b.booking_id}`;
      if (!map.has(code)) map.set(code, []);
      map.get(code)!.push(b);
    });
    const groups: { booking_code: string; booking_time: string; tickets: typeof myBookings }[] = [];
    map.forEach((tickets, code) => {
      tickets.sort((a, b) => a.booking_id - b.booking_id);
      groups.push({ booking_code: code, booking_time: tickets[0]?.booking_time || '', tickets });
    });
    return groups.sort((a, b) => Math.max(...b.tickets.map((t) => t.booking_id)) - Math.max(...a.tickets.map((t) => t.booking_id)));
  }, [myBookings]);

  const statusCounts = useMemo(() => {
    const c: Record<string, number> = { all: myBookings.length, upcoming: 0, 'จองสำเร็จ': 0, 'เช็กอินแล้ว': 0, 'เสร็จสิ้น': 0, 'ยกเลิก': 0, 'ไม่ได้ขึ้นรถ': 0 };
    myBookings.forEach((b) => {
      const trip = trips.find((t) => t.trip_id === b.trip_id);
      const r = resolveTicketActionStatus(b, trip);
      if (c[r] !== undefined) c[r]++;
      if (isBookingUpcoming(b, trip, routeStops)) c.upcoming++;
    });
    return c;
  }, [myBookings, trips, routeStops, liveClock]);

  const filteredBookingGroups = useMemo(() => {
    if (ticketStatusFilter === 'all') return bookingGroups;
    if (ticketStatusFilter === 'upcoming') {
      return bookingGroups
        .map((group) => ({
          ...group,
          tickets: group.tickets.filter((ticket) => isBookingUpcoming(
            ticket,
            trips.find((trip) => trip.trip_id === ticket.trip_id),
            routeStops,
          )),
        }))
        .filter((group) => group.tickets.length > 0);
    }
    return bookingGroups
      .map((g) => ({
        ...g,
        tickets: g.tickets.filter((t) => {
          const trip = trips.find((tr) => tr.trip_id === t.trip_id);
          return resolveTicketActionStatus(t, trip) === ticketStatusFilter;
        }),
      }))
      .filter((g) => g.tickets.length > 0);
  }, [bookingGroups, ticketStatusFilter, trips, routeStops, liveClock]);

  const getStopName = (id: number) => stops.find((s) => s.stop_id === id)?.name || `จุดจอด ${id}`;

  const getArrivalTime = (trip: Trip, dropoffId: number): string | null => {
    const rs = routeStops.filter((r) => r.route_id === trip.route_id).sort((a, b) => a.stop_order - b.stop_order);
    let acc = 0;
    for (const r of rs) {
      acc += r.minutes_from_prev || 0;
      if (r.stop_id === dropoffId) return minutesToTime(timeToMinutes(trip.departure_time) + acc);
    }
    return null;
  };

  const getArrivalTimeForRouteStop = (trip: Trip, routeStopId: number): string | null => {
    const routeStop = routeStops.find((rs) => rs.route_id === trip.route_id && rs.route_stop_id === routeStopId);
    if (!routeStop) return null;
    const elapsed = routeStops
      .filter((rs) => rs.route_id === trip.route_id && rs.stop_order <= routeStop.stop_order)
      .reduce((total, rs) => total + (rs.minutes_from_prev || 0), 0);
    return minutesToTime(timeToMinutes(trip.departure_time) + elapsed);
  };

  const getTravelDuration = (routeId: number, pickupRouteStopId: number, dropoffRouteStopId: number): number | null => {
    const rs = routeStops.filter((r) => r.route_id === routeId).sort((a, b) => a.stop_order - b.stop_order);
    const start = rs.findIndex((stop) => stop.route_stop_id === pickupRouteStopId);
    const end = rs.findIndex((stop) => stop.route_stop_id === dropoffRouteStopId);
    if (start < 0 || end <= start) return null;
    return rs.slice(start + 1, end + 1).reduce((total, stop) => total + (stop.minutes_from_prev || 0), 0);
  };

  const getVehicleSeatList = (trip: Trip | null | undefined): string[] => {
    if (!trip) return [];
    const veh = resolveVehicle(trip);
    const isVan = veh.type === 'รถตู้';
    const cap = veh.capacity || (isVan ? 9 : 20);
    const list: string[] = [];
    for (let i = 1; i <= cap; i++) list.push(`slot-${i}`);
    return list;
  };

  const toggleSeat = (seatNo: string, bookedList: string[]) => {
    if (bookedList.includes(seatNo)) return;
    const valid = getVehicleSeatList(selectedTrip);
    const cur = selectedSeats.filter((s) => valid.includes(s));
    if (cur.includes(seatNo)) {
      setSelectedSeats(cur.filter((s) => s !== seatNo));
      setSeatLimitWarning(null);
    } else {
      if (cur.length >= 4) {
        setSeatLimitWarning('⚠️ เลือกที่นั่งครบโควตา 4 ที่นั่งแล้ว หากต้องการเปลี่ยน กรุณายกเลิกที่นั่งเดิมก่อน');
        return;
      }
      setSeatLimitWarning(null);
      setSelectedSeats([...cur, seatNo]);
    }
  };

  const handleStageCurrentTrip = () => {
    if (!selectedTrip) {
      setConfirmErrorModal({ title: 'ยังไม่ได้เลือกรอบรถ', message: 'กรุณาย้อนกลับไปเลือกรอบรถก่อน' });
      return;
    }
    const valid = selectedSeats.filter((s) => getVehicleSeatList(selectedTrip).includes(s));
    if (valid.length === 0) {
      setConfirmErrorModal({ title: 'ยังไม่ได้เลือกที่นั่ง', message: 'กรุณาเลือกอย่างน้อย 1 ที่นั่ง (สูงสุด 4)' });
      return;
    }
    if (stagedTrips.length + 1 > MAX_STAGED_TRIPS) {
      setConfirmErrorModal({
        title: 'เกินโควตารอบรถสูงสุด 4 รอบ',
        message: `คุณเลือกครบ ${MAX_STAGED_TRIPS} รอบแล้ว กรุณายืนยันออกตั๋ว หรือลบรอบเดิมก่อน`,
      });
      return;
    }
    const outRoute = routes.find((r) => r.route_id === selectedTrip.route_id) || routes[0];
    const pickupStop = currentRouteStops.find((stop) => stop.route_stop_id === pickupRouteStopId);
    const dropoffStop = currentRouteStops.find((stop) => stop.route_stop_id === dropoffRouteStopId);
    if (!pickupStop || !dropoffStop) {
      setConfirmErrorModal({ title: 'จุดขึ้น/ลงไม่ถูกต้อง', message: 'กรุณาเลือกจุดขึ้นและจุดลงบนเส้นทางนี้' });
      return;
    }
    setStagedTrips((prev) => [
      ...prev,
      {
        staged_id: `staged-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        trip: selectedTrip,
        route: outRoute,
        pickup_stop_id: pickupStop.stop_id,
        dropoff_stop_id: dropoffStop.stop_id,
        pickup_route_stop_id: pickupStop.route_stop_id,
        dropoff_route_stop_id: dropoffStop.route_stop_id,
        seat_count: valid.length,
        leg_type: 'one-way',
        journey_label: 'เลือกเที่ยวรถ',
        service_date: selectedDate,
        departure_time: selectedTrip.departure_time,
      },
    ]);
    setSelectedTripId(null);
    setSelectedSeats([]);
    setSeatLimitWarning(null);
    setStep(4);
  };

  const handleRemoveStagedTrip = (id: string) => setStagedTrips((prev) => prev.filter((it) => it.staged_id !== id));

  const handleAddNewTrip = () => {
    if (stagedTrips.length >= MAX_STAGED_TRIPS) {
      setConfirmErrorModal({ title: 'ครบโควตา 4 รอบ', message: 'คุณเลือกรอบรถครบ 4 รอบแล้ว' });
      return;
    }
    setSelectedTripId(null);
    setSelectedSeats([]);
    setStep(1);
  };

  const handleConfirmAllStagedBookings = async () => {
    if (stagedTrips.length === 0) {
      setConfirmErrorModal({ title: 'ยังไม่มีรอบรถ', message: 'กรุณาเลือกรอบรถและที่นั่งก่อน' });
      return;
    }
    if (isConfirmingBookings) return;

    setIsConfirmingBookings(true);
    try {
      if (apiMode) {
        const issued: Booking[] = [];
        for (const item of stagedTrips) issued.push(await apiCreateBooking(item.trip.trip_id, item.pickup_route_stop_id, item.dropoff_route_stop_id, item.seat_count));
        setNewlyIssuedBookings(issued);
        setActiveIssuedTicketIndex(0);
        setActiveTicketBookingId(issued[0]?.booking_id ?? null);
        setStagedTrips([]);
        setStep(5);
        return;
      }

      const now = new Date();
      const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
      let code = '';
      do { code = `BK-${datePart}-${String(Math.floor(10 + Math.random() * 90))}`; }
      while (bookings.some((b) => b.booking_code === code));

      const list: any[] = [];
      stagedTrips.forEach((it) => {
        list.push(createBooking(it.trip.trip_id, it.pickup_stop_id, it.dropoff_stop_id, it.seat_count, {
          booking_code: code, leg_type: it.leg_type, journey_type: 'one-way',
        }));
      });
      setNewlyIssuedBookings(list);
      setActiveIssuedTicketIndex(0);
      setActiveTicketBookingId(list[0]?.booking_id || null);
      setStagedTrips([]);
      setStep(5);
    } catch (error) {
      setConfirmErrorModal({ title: 'จองรอบรถไม่สำเร็จ', message: error instanceof Error ? error.message : 'ไม่สามารถบันทึกการจองได้ กรุณาลองอีกครั้ง' });
    } finally {
      setIsConfirmingBookings(false);
    }
  };

  const handleStartNewBookingSession = () => {
    setSelectedTripId(null);
    setSelectedSeats([]);
    setNewlyIssuedBookings([]);
    setActiveIssuedTicketIndex(0);
    setStagedTrips([]);
    setStep(1);
  };

  const toggleFavorite = (routeId: number) => {
    setFavorites((prev) => (prev.includes(routeId) ? prev.filter((id) => id !== routeId) : [...prev, routeId]));
  };

  const confirmDelete = async () => {
    if (!deleteModalData) return;
    try {
      if (deleteModalData.type === 'single' && deleteModalData.bookingId) {
        await deleteBooking(deleteModalData.bookingId);
      } else if (deleteModalData.type === 'group' && deleteModalData.bookingCode) {
        await deleteBookingsByCode(deleteModalData.bookingCode);
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : 'ซ่อนตั๋วไม่สำเร็จ');
      return;
    }
    setDeleteModalData(null);
  };

  // ============================================================
  // SEAT MAP
  // ============================================================
  const renderSeatMapForTrip = (trip: Trip, chosen: string[], warning: string | null, setWarning: (m: string | null) => void) => {
    const veh = resolveVehicle(trip);
    const drv = resolveDriver(trip);
    const stagedSeatCount = stagedTrips.filter((st) => st.trip.trip_id === trip.trip_id).reduce((sum, st) => sum + st.seat_count, 0);
    const bookedCount = getBookedSeatCountForTrip(trip.trip_id, pickupRouteStopId, dropoffRouteStopId) + stagedSeatCount;
    const booked = Array.from({ length: bookedCount }, (_, index) => `slot-${index + 1}`);
    const isVan = veh.type === 'รถตู้';
    const totalCap = veh.capacity || 9;
    const seatList = getVehicleSeatList(trip);
    const valid = chosen.filter((s) => seatList.includes(s));

    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-5 text-center">
        {warning && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 text-xs flex items-start gap-2.5 text-left">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1 leading-relaxed">{warning}</div>
            <button onClick={() => setWarning(null)} className="text-rose-500 hover:text-rose-700 shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="flex items-center justify-center gap-5 mb-4 text-xs text-slate-600 flex-wrap">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded border-2 border-slate-300 bg-white" /> ว่าง ({Math.max(0, totalCap - booked.length)})</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-slate-900" /> ที่เลือก ({valid.length}/4)</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-slate-300" /> จองแล้ว ({booked.length})</span>
        </div>

        <p className="mb-3 text-[11px] text-slate-500">
          ผังนี้แสดงที่นั่งว่างและจำนวนที่เลือก โดยไม่มีการกำหนดหมายเลขที่นั่ง
        </p>

        <div className="max-w-xs mx-auto bg-slate-50 border border-slate-200 rounded-2xl p-4">
          <div className="flex items-center justify-between px-3 py-2 bg-white rounded-lg mb-3 text-xs text-slate-700 border border-slate-200">
            <div className="flex items-center gap-1.5 font-medium truncate">
              <span className="text-base">{isVan ? '🚐' : '🚌'}</span>
              <span className="truncate">{drv.fullname}</span>
            </div>
            <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-600 shrink-0">
              {veh.license_plate} · {totalCap} ที่
            </span>
          </div>

          <div className={isVan ? 'grid grid-cols-3 gap-2.5' : 'grid grid-cols-4 gap-2'}>
            {seatList.map((s) => {
              const isBooked = booked.includes(s);
              const isSel = valid.includes(s);
              return (
                <button
                  key={`${trip.trip_id}-${s}`}
                  type="button"
                  disabled={isBooked}
                  onClick={() => toggleSeat(s, booked)}
                  className={`rounded-lg font-semibold transition-all flex flex-col items-center ${
                    isVan ? 'py-2.5 text-xs' : 'py-2 text-[11px]'
                  } ${
                    isBooked ? 'bg-slate-200 text-slate-400 cursor-not-allowed line-through'
                    : isSel ? 'bg-slate-900 text-white shadow-md'
                    : 'bg-white hover:bg-slate-100 hover:border-slate-300 text-slate-700 border border-slate-200'
                  }`}
                >
                  <span className="text-[9px] opacity-80">{isBooked ? 'เต็ม' : isSel ? 'เลือก' : 'ว่าง'}</span>
                </button>
              );
            })}
          </div>
        </div>

        {valid.length > 0 ? (
          <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs flex items-center justify-between flex-wrap gap-2">
            <span>ที่นั่งที่เลือก: <strong className="font-bold">{valid.length}</strong> ({valid.length}/4)</span>
            <div className="flex items-center gap-2">
              <button onClick={() => setSelectedSeats([])} className="px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:text-rose-700 bg-white border border-slate-200 hover:border-rose-200 rounded-lg">
                ล้างที่นั่ง
              </button>
              <span className="font-semibold text-emerald-700">ฟรี</span>
            </div>
          </div>
        ) : (
          <div className="mt-4 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 text-xs text-center">
            กรุณาคลิกเลือกที่นั่ง (สูงสุด 4 ที่นั่ง)
          </div>
        )}
      </div>
    );
  };

  // ============================================================
  // SINGLE TICKET CARD (flat layout)
  // ============================================================
  const renderSingleTicketCard = (b: any, showGroupInfo: boolean, group: any) => {
    const trip = trips.find((t) => t.trip_id === b.trip_id);
    const veh = resolveVehicle(trip);
    const drv = resolveDriver(trip);
    const route = trip ? routes.find((r) => r.route_id === trip.route_id) : null;
    const ticketStatus = resolveTicketActionStatus(b, trip);
    const isConfirmed = ticketStatus === 'จองสำเร็จ';
    const isCheckedIn = ticketStatus === 'เช็กอินแล้ว';
    const isCompleted = ticketStatus === 'เสร็จสิ้น';
    const isCancelled = ticketStatus === 'ยกเลิก';
    const isNoShow = ticketStatus === 'ไม่ได้ขึ้นรถ';
    const eta = trip ? getArrivalTime(trip, b.dropoff_stop_id) : null;

    return (
      <div
        key={b.booking_id}
        className={`bg-white border rounded-xl p-4 space-y-3 ${
          isCancelled ? 'border-rose-200 bg-rose-50/30'
          : isNoShow ? 'border-amber-200 bg-amber-50/30'
          : isCompleted ? 'border-slate-200 bg-slate-50/40'
          : isCheckedIn ? 'border-emerald-200 bg-emerald-50/20'
          : 'border-slate-200'
        }`}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-base font-bold text-slate-900 font-mono">#{b.booking_id}</span>
            <TicketStatusBadge status={ticketStatus} size="sm" />
          </div>
          {showGroupInfo && group && (
            <button
              onClick={() =>
                setDeleteModalData({
                  type: 'group',
                  bookingCode: group.booking_code,
                  ticketCount: group.tickets.length,
                  label: `กลุ่ม ${group.booking_code}`,
                })
              }
              className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors"
              title="ลบทั้งกลุ่ม"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
          {!showGroupInfo && (
            <button
              onClick={() =>
                setDeleteModalData({
                  type: 'single',
                  bookingId: b.booking_id,
                  label: `${route?.name || 'เส้นทาง'} · ${trip?.departure_time || ''} น. · ที่นั่ง ${b.seat_count}`,
                })
              }
              className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              title="ลบตั๋วใบนี้"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Route info */}
        <div className="space-y-1.5 text-xs text-slate-700">
          <div className="font-semibold text-slate-900">{route?.name}</div>
          <div className="flex items-center gap-1.5 text-[11px]">
            <span className="text-emerald-700 font-semibold">{getStopName(b.pickup_stop_id)}</span>
            <ArrowRight className="w-3 h-3 text-slate-300" />
            <span className="text-rose-700 font-semibold">{getStopName(b.dropoff_stop_id)}</span>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-slate-600 flex-wrap">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-400" />
              {trip?.departure_time} {eta && <>→ {eta}</>} น.
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3 text-slate-400" />
              {trip?.service_date}
            </span>
          </div>
          <div className="text-[11px]">
            ที่นั่ง: <strong className="font-mono text-slate-900">{b.seat_count}</strong> ({b.seat_count} ที่)
          </div>
          {Boolean(b.alighted_at) && (
            <div className="text-[11px] font-semibold text-sky-700 bg-sky-50 border border-sky-200 rounded-lg px-2 py-1">
              ลงแล้ว ✓{(() => {
                const raw = String(b.alighted_at ?? '');
                const m = raw.match(/(\d{1,2}):(\d{2})/);
                return m ? ` (${m[1].padStart(2, '0')}:${m[2]})` : '';
              })()}
            </div>
          )}
          <div className="text-[10px] text-slate-500 flex items-center gap-1">
            <Bus className="w-3 h-3 text-slate-400" />
            {veh.type} · {veh.license_plate} · {drv.fullname}
          </div>
        </div>

        {/* Actions */}
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
          <button
            onClick={() => { setActiveTicketBookingId(b.booking_id); setTicketModalOpen(true); }}
            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 rounded-lg text-[11px] font-semibold flex items-center gap-1"
          >
            <QrCode className="w-3 h-3" />
            {isCancelled || isNoShow || isCompleted ? 'ดูข้อมูล' : 'Boarding Pass QR'}
          </button>

          {isConfirmed && (
            <div className="flex items-center gap-1.5">
              {!apiMode && (
                <button
                  onClick={() => checkInBooking(b.booking_id)}
                  className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-semibold"
                >
                  เช็คอิน
                </button>
              )}
              <button
                onClick={() => setCancelModalData({
                  bookingId: b.booking_id,
                  bookingCode: b.booking_code || group?.booking_code || '',
                  seatCount: b.seat_count,
                })}
                className="px-2.5 py-1.5 bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-[11px] font-semibold"
              >
                ยกเลิก
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold mb-1 uppercase tracking-wider">
            <span>🎓 ระบบจองรถสำหรับประชาคม ม.มหานคร</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">จองตั๋วรถบัส & รถตู้รับส่ง</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            ผู้ใช้งาน: <strong className="text-slate-800 font-semibold">{currentUser.name}</strong> ({currentUser.user_type}) · Email: <span className="font-mono text-slate-700">{currentUser.username}</span>
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveTab('book')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'book' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Bus className="w-3.5 h-3.5" /><span>จองตั๋วโดยสาร</span>
          </button>
          <button
            onClick={() => setActiveTab('my-tickets')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'my-tickets' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Ticket className="w-3.5 h-3.5" /><span>ตั๋วของฉัน ({myBookings.length})</span>
          </button>
        </div>
      </div>

      {activeTab === 'book' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-6">
            {/* Stepper */}
            <div className="grid grid-cols-5 gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 text-xs font-semibold">
              {[
                { n: 1, t: 'ระบุเส้นทาง', m: 'เส้นทาง' },
                { n: 2, t: 'เลือกรอบรถ', m: 'รอบรถ' },
                { n: 3, t: 'เลือกที่นั่ง', m: 'ที่นั่ง' },
                { n: 4, t: 'รอบที่เลือกไว้', m: 'รอบที่เลือก' },
                { n: 5, t: 'รับตั๋ว QR', m: 'ตั๋ว' },
              ].map((s) => (
                <button
                  key={s.n}
                  type="button"
                  onClick={() => setStep(s.n)}
                  disabled={s.n === 5}
                  className={`py-2 px-1.5 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                    step === s.n ? 'bg-white text-slate-900 font-semibold shadow-sm'
                    : step > s.n ? 'text-slate-600 hover:text-slate-900 cursor-pointer'
                    : 'text-slate-400'
                  }`}
                >
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${step >= s.n ? 'bg-slate-900 text-white' : 'bg-slate-300 text-white'}`}>
                    {s.n}
                  </span>
                  <span className="hidden md:inline">{s.t}</span>
                  <span className="md:hidden">{s.m}</span>
                  {s.n === 4 && stagedTrips.length > 0 && (
                    <span className="ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-900 text-white">{stagedTrips.length}/4</span>
                  )}
                </button>
              ))}
            </div>

            {stagedTrips.length > 0 && step < 4 && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0">{stagedTrips.length}/4</div>
                  <div className="text-xs text-slate-700">
                    คุณมีรอบรถที่เลือกไว้แล้ว <strong>{stagedTrips.length}</strong> รอบ (เพิ่มได้อีก {4 - stagedTrips.length} รอบ)
                  </div>
                </div>
                <button onClick={() => setStep(4)} className="px-3.5 py-1.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5">
                  <span>ดูรายการ</span><ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* STEP 1 */}
            {step === 1 && (
              <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-5 shadow-sm">
                <div className="border-b border-slate-100 pb-4">
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-slate-700" /><span>ระบุเส้นทางและวันเดินทาง</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">เลือกเส้นทาง วันเดินทาง และจุดขึ้น-ลงรถ</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1.5">
                      <span>เส้นทาง (Route)</span>
                      {selectedRoute && (
                        <button
                          type="button"
                          onClick={() => toggleFavorite(selectedRoute.route_id)}
                          className={`text-[10px] flex items-center gap-1 px-2 py-0.5 rounded-full border transition-all ${
                            favorites.includes(selectedRoute.route_id)
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-white text-slate-500 border-slate-200 hover:border-amber-300'
                          }`}
                        >
                          <Star className={`w-3 h-3 ${favorites.includes(selectedRoute.route_id) ? 'fill-amber-500 text-amber-500' : ''}`} />
                          {favorites.includes(selectedRoute.route_id) ? 'โปรด' : 'ปักหมุด'}
                        </button>
                      )}
                    </label>
                    <select
                      value={selectedRouteId}
                      onChange={(e) => {
                        const n = Number(e.target.value);
                        setHasAutoSelectedApiRoute(true);
                        setSelectedRouteId(n);
                        const ns = getStopsForRoute(n);
                        if (ns.length > 1) {
                          setPickupRouteStopId(ns[0].route_stop_id);
                          setDropoffRouteStopId(ns[ns.length - 1].route_stop_id);
                        }
                      }}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                    >
                      {routes.map((r) => (
                        <option key={r.route_id} value={r.route_id}>
                          {r.name} · {r.total_time} นาที
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">วันที่เดินทาง</label>
                    <input
                      type="date"
                      min={getToday()}
                      max={getBookingMaxDate()}
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 font-mono"
                    />
                    <div className="flex flex-wrap gap-2 mt-2">
                      <button
                        type="button"
                        onClick={() => setSelectedDate(getToday())}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold border transition-all ${
                          selectedDate === getToday() ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-400'
                        }`}
                      >
                        📅 {getTodayLabel()}
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedDate(getTomorrow())}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold border transition-all ${
                          selectedDate === getTomorrow() ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-400'
                        }`}
                      >
                        📅 {getTomorrowLabel()}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>จุดขึ้นรถ
                    </label>
                    <select
                      value={pickupRouteStopId}
                      onChange={(e) => {
                        const nextId = Number(e.target.value);
                        setPickupRouteStopId(nextId);
                        const nextPickup = currentRouteStops.find((stop) => stop.route_stop_id === nextId);
                        if (nextPickup && (selectedDropoffRouteStop?.order ?? 0) <= nextPickup.order) {
                          setDropoffRouteStopId(currentRouteStops[currentRouteStops.length - 1]?.route_stop_id ?? nextId);
                        }
                      }}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                    >
                      {currentRouteStops.map((st, i) => (
                        <option key={`p-${st.route_stop_id}`} value={st.route_stop_id}>
                          {st.order}. {st.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>จุดลงรถ
                    </label>
                    <select
                      value={dropoffRouteStopId}
                      onChange={(e) => setDropoffRouteStopId(Number(e.target.value))}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                    >
                      {currentRouteStops.map((st, i) => (
                        <option key={`d-${st.route_stop_id}`} value={st.route_stop_id} disabled={st.order <= (selectedPickupRouteStop?.order ?? 0)}>
                          {st.order}. {st.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {currentRouteStops.length > 0 && (
                  <div className="rounded-xl border border-amber-200 bg-white p-3">
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-1.5 text-[10px]">
                      <span className="font-semibold text-slate-600">ลำดับจุดจอดในเส้นทาง ({currentRouteStops.length} จุดจอด)</span>
                      {selectedPickupRouteStop && selectedDropoffRouteStop && (
                        <span className="font-semibold text-amber-800">
                          {selectedPickupRouteStop.order}. {selectedPickupRouteStop.name} → {selectedDropoffRouteStop.order}. {selectedDropoffRouteStop.name}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1" aria-label="ลำดับจุดจอดในเส้นทาง">
                      {currentRouteStops.map((stop, index) => {
                        const isPickup = stop.route_stop_id === pickupRouteStopId;
                        const isDropoff = stop.route_stop_id === dropoffRouteStopId;
                        const selectedClass = isPickup
                          ? 'border-emerald-400 bg-emerald-50 text-emerald-800'
                          : isDropoff
                            ? 'border-rose-400 bg-rose-50 text-rose-800'
                            : 'border-slate-200 bg-white text-slate-700';
                        return (
                          <React.Fragment key={`route-stop-order-${stop.route_stop_id}`}>
                            {index > 0 && <ArrowRight className="h-3 w-3 shrink-0 text-slate-300" aria-hidden="true" />}
                            <div
                              title={`${stop.order}. ${stop.name}`}
                              className={`max-w-[200px] shrink-0 truncate rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold ${selectedClass}`}
                            >
                              {stop.order}. {stop.name}
                              {isPickup && <span className="ml-1 text-[9px]">(ขึ้น)</span>}
                              {isDropoff && <span className="ml-1 text-[9px]">(ลง)</span>}
                            </div>
                          </React.Fragment>
                        );
                      })}
                    </div>
                  </div>
                )}

                {pickupRouteStopId === dropoffRouteStopId && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>จุดขึ้นรถและจุดลงรถต้องไม่เป็นจุดเดียวกัน</span>
                  </div>
                )}

                {pickupRouteStopId !== dropoffRouteStopId && (() => {
                  const dur = getTravelDuration(selectedRouteId, pickupRouteStopId, dropoffRouteStopId);
                  return (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs flex items-center gap-3 flex-wrap">
                      <Timer className="w-4 h-4 text-slate-500" />
                      <span className="text-slate-700">
                        ระยะเวลาเดินทางจาก <strong>{getStopName(pickupStopId)}</strong> ไป <strong>{getStopName(dropoffStopId)}</strong>
                        {dur !== null && <> ประมาณ <strong className="text-slate-900">{dur} นาที</strong></>}
                      </span>
                    </div>
                  );
                })()}

                <div className="flex justify-end pt-2">
                  <button
                    disabled={pickupRouteStopId === dropoffRouteStopId}
                    onClick={() => setStep(2)}
                    className={`flex items-center gap-2 px-6 py-3 font-semibold rounded-xl text-sm transition-all ${
                      pickupRouteStopId === dropoffRouteStopId ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-slate-900 hover:bg-slate-800 text-white shadow-sm'
                    }`}
                  >
                    <span>ค้นหารอบรถ</span><ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2 */}
            {step === 2 && (
              <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-5 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <Clock className="w-5 h-5 text-slate-700" /><span>เลือกรอบเวลาเดินทาง</span>
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5 flex flex-wrap items-center gap-x-2">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <strong className="text-slate-700">
                          {selectedDate === getToday() ? getTodayLabel() : selectedDate === getTomorrow() ? getTomorrowLabel() : selectedDate}
                        </strong>
                      </span>
                      <span className="text-slate-300">·</span>
                      <span>{selectedRoute?.name}</span>
                      <span className="text-slate-300">·</span>
                      <span>
                        <strong className="text-emerald-700">{getStopName(pickupStopId)}</strong> → <strong className="text-rose-700">{getStopName(dropoffStopId)}</strong>
                      </span>
                    </p>
                  </div>
                  <button onClick={() => setStep(1)} className="text-xs text-slate-600 hover:text-slate-900 font-semibold self-start sm:self-auto">
                    ← แก้ไข
                  </button>
                </div>

                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 sm:p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  <div className="flex items-start gap-3 text-xs text-amber-950">
                    <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-amber-400" />
                    <div className="grid sm:grid-cols-[auto_1fr] gap-x-3 gap-y-1">
                      <strong>กฎ 20 นาที (Mini Project หน้า 3):</strong>
                      <span>ต้องจองก่อนเวลาที่รถจะถึงจุดจอดอย่างน้อย 20 นาที</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 rounded-lg border border-amber-200 bg-white/80 px-3 py-2 text-xs">
                    <Clock className="h-4 w-4 text-amber-700" />
                    <label htmlFor="reference-clock" className="font-semibold text-slate-700">เวลาจำลอง:</label>
                    <input id="reference-clock" type="text" inputMode="numeric" maxLength={5} placeholder="HH:mm" value={clockDraft}
                      onChange={(event) => {
                        const value = event.target.value.replace(/[^\d:]/g, '').slice(0, 5);
                        setClockDraft(value);
                        if (/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value)) setSimulatedCurrentTime(value);
                      }}
                      onBlur={() => setClockDraft(simulatedCurrentTime)}
                      className="w-[4.5rem] rounded-md border border-slate-300 bg-white px-2 py-1 font-mono font-bold text-amber-800 focus:outline-none focus:ring-2 focus:ring-amber-300"
                      aria-label="พิมพ์เวลาจำลองรูปแบบ 24 ชั่วโมง ชั่วโมง:นาที" />
                    <span className="font-semibold text-amber-800">น.</span>
                    {apiMode && <span className="text-[10px] text-slate-500">(เวลาจริง API: {liveClock} น.)</span>}
                    {!apiMode && ([['เช้า', '09:20'], ['เที่ยง', '12:00'], ['บ่าย', '15:00'], ['เย็น', '18:00']] as const).map(([label, time]) => (
                      <button key={time} type="button" onClick={() => { setSimulatedCurrentTime(time); setClockDraft(time); }} className={`rounded-md border px-2 py-1 font-medium ${simulatedCurrentTime === time ? 'border-amber-400 bg-amber-100 text-amber-900' : 'border-slate-200 bg-white text-slate-600 hover:border-amber-300'}`}>{label}</button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <strong className="text-xs text-slate-800">รอบรถที่พร้อมให้บริการ (เลือกเที่ยวรถ):</strong>
                  <span className="text-xs text-slate-600">ขึ้น: <strong className="text-emerald-700">{getStopName(pickupStopId)}</strong> → ลง: <strong className="text-rose-700">{getStopName(dropoffStopId)}</strong></span>
                  <div className="ml-auto flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs">
                    <ArrowUpDown className="h-3.5 w-3.5 text-slate-500" />
                    <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortBy)} className="cursor-pointer bg-transparent font-medium text-slate-700 focus:outline-none">
                      <option value="time-asc">เวลาออก: เร็ว → ช้า</option><option value="time-desc">เวลาออก: ช้า → เร็ว</option><option value="seats-desc">ที่นั่งว่างมากสุด</option>
                    </select>
                  </div>
                </div>

                {availableOutboundTrips.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                    <AlertCircle className="w-8 h-8 text-slate-400 mx-auto" />
                    <p className="text-sm text-slate-700 font-semibold">ไม่พบรอบรถในเงื่อนไขที่เลือก</p>
                    <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                      <button onClick={() => setSelectedDate(getTomorrow())} className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 font-semibold text-xs rounded-lg">
                        📅 {getTomorrowLabel()}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {availableOutboundTrips.map((trip) => {
                      const veh = resolveVehicle(trip);
                      const drv = resolveDriver(trip);
                      const bookedCount = getBookedSeatCountForTrip(trip.trip_id, pickupRouteStopId, dropoffRouteStopId);
                      const cap = veh.capacity || 9;
                      const left = cap - bookedCount;
                      const isChosen = selectedTripId === trip.trip_id;
                      const canBookTrip = isTripBookable(trip);
                      const pickupEta = getArrivalTimeForRouteStop(trip, pickupRouteStopId);
                      const eta = getArrivalTimeForRouteStop(trip, dropoffRouteStopId);
                      const minutesUntilPickup = getMinutesUntilPickup(trip);
                      const minutesUntilDeadline = Math.floor(minutesUntilPickup - 20);

                      return (
                        <div
                          key={trip.trip_id}
                          className={`rounded-xl p-4 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 border ${
                            isChosen ? 'bg-amber-50 border-amber-500 ring-1 ring-amber-300' : !canBookTrip ? 'bg-slate-50 border-slate-200 opacity-80' : 'bg-white border-slate-200 hover:border-amber-300 hover:shadow-sm'
                          }`}
                        >
                          <div className="flex-1 space-y-2 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xl font-bold text-slate-900 font-mono">{trip.departure_time}</span>
                              <span className="text-xs text-slate-500">→</span>
                              <span className="text-base font-semibold text-slate-700 font-mono">{eta || '—'}</span>
                              <span className="text-[10px] text-slate-500">น.</span>
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-600">รอบ #{trip.trip_id}</span>
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${canBookTrip ? 'border border-emerald-200 bg-emerald-50 text-emerald-700' : 'border border-rose-200 bg-rose-50 text-rose-700'}`}>
                                {canBookTrip ? `เปิดจอง (เหลือ ${minutesUntilDeadline} นาที)` : `ปิดจอง (ถึงจุดขึ้นใน ${Math.max(0, Math.ceil(minutesUntilPickup))} นาที)`}
                              </span>
                            </div>

                            <div className="flex items-center gap-3 text-xs text-slate-600 flex-wrap">
                              <span className="flex items-center gap-1"><Bus className="w-3.5 h-3.5 text-slate-400" />{veh.type} · {veh.license_plate}</span>
                              <span className="flex items-center gap-1"><User className="w-3.5 h-3.5 text-slate-400" />{drv.fullname}</span>
                            </div>

                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-600">
                              <span>ขึ้น: <strong className="text-emerald-700">{getStopName(pickupStopId)}</strong> (ถึงประมาณ {pickupEta || '—'} น.)</span>
                              <span>ลง: <strong className="text-rose-700">{getStopName(dropoffStopId)}</strong> (ถึงประมาณ {eta || '—'} น.)</span>
                              <span>ความจุ: <strong>{cap} ที่นั่ง</strong></span>
                            </div>



                            {!canBookTrip && (
                              <p className="flex items-center gap-1 text-[11px] font-medium text-rose-700">
                                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                                ปิดรับจอง: ต้องจองก่อนรถถึงจุดขึ้นอย่างน้อย 20 นาที
                              </p>
                            )}

                            <div className="flex items-center gap-2 pt-0.5">
                              <div className="w-32 bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                <div
                                  className={`h-full transition-all ${left <= 2 ? 'bg-rose-500' : left <= 5 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                  style={{ width: `${Math.min(100, (bookedCount / cap) * 100)}%` }}
                                />
                              </div>
                              <span className="text-[11px] text-slate-600">
                                ว่าง <strong className={left === 0 ? 'text-rose-600' : 'text-slate-800'}>{left}/{cap}</strong> ที่นั่ง
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            disabled={left === 0 || !canBookTrip}
                            onClick={() => { if (canBookTrip) { setSelectedTripId(trip.trip_id); setSelectedSeats([]); } }}
                            className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-1.5 w-full sm:w-auto ${
                              isChosen ? 'bg-amber-500 text-slate-950'
                              : left === 0 || !canBookTrip ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                              : 'bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-sm'
                            }`}
                          >
                            {isChosen ? <><Check className="w-4 h-4" /> เลือกแล้ว</> : !canBookTrip ? 'ปิดรับจอง' : <>เลือกรอบนี้ <ArrowRight className="w-3.5 h-3.5" /></>}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-3">
                  <button onClick={() => setStep(1)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg border border-slate-200">
                    ← ย้อนกลับ
                  </button>
                  <button
                    disabled={!selectedTrip}
                    onClick={() => setStep(3)}
                    className={`px-6 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 transition-all ${
                      selectedTrip ? 'bg-slate-900 hover:bg-slate-800 text-white shadow-sm' : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    เลือกที่นั่ง <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3 */}
            {step === 3 && selectedTrip && (
              <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-5 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <Bus className="w-5 h-5 text-slate-700" /><span>เลือกที่นั่ง (สูงสุด 4 ที่นั่ง)</span>
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">รอบ #{selectedTrip.trip_id} · {selectedTrip.departure_time} น. · {selectedDate} · เลือกจำนวนที่นั่งโดยไม่ระบุหมายเลข</p>
                  </div>
                  <button onClick={() => setStep(2)} className="text-xs text-slate-600 hover:text-slate-900 font-semibold">← เปลี่ยนรอบ</button>
                </div>

                {renderSeatMapForTrip(selectedTrip, selectedSeats, seatLimitWarning, setSeatLimitWarning)}

                <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-200">
                  <button onClick={() => setStep(2)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg">← ย้อนกลับ</button>
                  <button
                    disabled={selectedSeats.filter((s) => getVehicleSeatList(selectedTrip).includes(s)).length === 0}
                    onClick={handleStageCurrentTrip}
                    className={`px-6 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 transition-all ${
                      selectedSeats.filter((s) => getVehicleSeatList(selectedTrip).includes(s)).length > 0
                        ? 'bg-slate-900 hover:bg-slate-800 text-white shadow-sm'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <PlusCircle className="w-4 h-4" />
                    เพิ่มรอบนี้ ({selectedSeats.filter((s) => getVehicleSeatList(selectedTrip).includes(s)).length} ที่นั่ง)
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4 */}
            {step === 4 && (
              <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-5 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <CalendarCheck className="w-5 h-5 text-slate-700" /><span>รายการรอบรถที่เลือกไว้</span>
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">ตรวจสอบและยืนยันการจอง (สูงสุด 4 รอบ)</p>
                  </div>
                  <span className="px-3 py-1 bg-slate-100 border border-slate-200 text-slate-800 rounded-lg text-xs font-bold">
                    {stagedTrips.length} / 4 รอบ
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[0, 1, 2, 3].map((i) => {
                    const it = stagedTrips[i];
                    return (
                      <div key={i} className={`p-2.5 rounded-lg border text-xs ${it ? 'bg-slate-50 border-slate-300' : 'bg-slate-50 border-dashed border-slate-300 text-slate-400'}`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-[11px]">รอบ {i + 1}</span>
                          {it ? <span className="w-2 h-2 rounded-full bg-emerald-500"></span> : <span className="text-[10px]">ว่าง</span>}
                        </div>
                        {it ? (
                          <>
                            <div className="font-semibold text-slate-800 text-[11px] truncate">{it.departure_time} น.</div>
                            <div className="text-[10px] text-slate-500 truncate">{it.seat_count}</div>
                          </>
                        ) : (<div className="text-[10px]">+ เลือกเพิ่ม</div>)}
                      </div>
                    );
                  })}
                </div>

                {stagedTrips.length === 0 ? (
                  <div className="py-12 px-4 text-center border border-dashed border-slate-300 rounded-xl bg-slate-50 space-y-2">
                    <CalendarCheck className="w-8 h-8 text-slate-400 mx-auto" />
                    <p className="text-sm font-semibold text-slate-700">ยังไม่มีรอบรถ</p>
                    <button onClick={() => setStep(1)} className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg text-xs">
                      ไปเลือกรอบรถ
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {stagedTrips.map((st, idx) => {
                      const veh = resolveVehicle(st.trip);
                      const drv = resolveDriver(st.trip);
                      return (
                        <div key={st.staged_id} className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                          <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center">{idx + 1}</span>
                              <span className="font-semibold text-sm text-slate-900 truncate">{st.route?.name || 'เส้นทาง'}</span>
                            </div>
                            <button onClick={() => handleRemoveStagedTrip(st.staged_id)} className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                            <div>
                              <div className="text-[10px] text-slate-500 mb-0.5">วัน/เวลา</div>
                              <div className="font-semibold text-slate-900">{st.service_date} · {st.departure_time} น.</div>
                            </div>
                            <div>
                              <div className="text-[10px] text-slate-500 mb-0.5">เส้นทาง</div>
                              <div className="font-semibold text-slate-800 truncate">{getStopName(st.pickup_stop_id)} → {getStopName(st.dropoff_stop_id)}</div>
                            </div>
                            <div>
                              <div className="text-[10px] text-slate-500 mb-0.5">ที่นั่ง</div>
                              <div className="font-bold text-slate-900">{st.seat_count}</div>
                            </div>
                            <div>
                              <div className="text-[10px] text-slate-500 mb-0.5">รถ/คนขับ</div>
                              <div className="font-semibold text-slate-800 truncate">{veh.license_plate} · {drv.fullname}</div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                  {stagedTrips.length < MAX_STAGED_TRIPS ? (
                    <button onClick={handleAddNewTrip} className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-800 font-semibold rounded-xl text-xs border border-slate-300 flex items-center gap-2">
                      <PlusCircle className="w-4 h-4" />เลือกเพิ่ม (อีก {MAX_STAGED_TRIPS - stagedTrips.length} รอบ)
                    </button>
                  ) : (
                    <div className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700">ครบโควตา 4 รอบ</div>
                  )}

                  <button
                    type="button"
                    disabled={stagedTrips.length === 0 || isConfirmingBookings}
                    onClick={handleConfirmAllStagedBookings}
                    className={`px-6 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 ${
                      stagedTrips.length > 0 && !isConfirmingBookings ? 'bg-slate-900 hover:bg-slate-800 text-white shadow-sm cursor-pointer' : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />{isConfirmingBookings ? 'กำลังบันทึกการจอง…' : `ยืนยันการจอง (${stagedTrips.length} รอบ)`}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 5 */}
            {step === 5 && (
              <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-5 shadow-sm">
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                  <div>
                    <h3 className="text-sm font-bold text-emerald-900">จองตั๋วสำเร็จ! ({newlyIssuedBookings.length} ใบ)</h3>
                    <p className="text-xs text-emerald-800 mt-0.5">
                      บันทึกในระบบแล้ว · ดูได้ที่แท็บ <strong>"ตั๋วของฉัน"</strong> แม้รีเฟรชหน้าจอ
                    </p>
                  </div>
                </div>

                {newlyIssuedBookings.length > 1 && (
                  <div className="flex flex-wrap gap-2 p-1.5 bg-slate-100 rounded-xl border border-slate-200">
                    {newlyIssuedBookings.map((bk, idx) => {
                      const tObj = trips.find((t) => t.trip_id === bk.trip_id);
                      return (
                        <button
                          key={bk.booking_id}
                          onClick={() => setActiveIssuedTicketIndex(idx)}
                          className={`flex-1 min-w-[130px] py-2 px-3 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 ${
                            activeIssuedTicketIndex === idx ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <span>ตั๋ว {idx + 1}</span>
                          <span className="font-mono text-[11px]">#{bk.booking_id}</span>
                          {tObj && <span className="text-[10px] text-slate-500">({tObj.departure_time})</span>}
                        </button>
                      );
                    })}
                  </div>
                )}

                {(() => {
                  const cur = newlyIssuedBookings[activeIssuedTicketIndex] || newlyIssuedBookings[0];
                  if (!cur) return null;
                  const trip = trips.find((t) => t.trip_id === cur.trip_id);
                  const veh = resolveVehicle(trip);
                  const drv = resolveDriver(trip);
                  const isCheckedIn = cur.status === 2 || checkInFeedback[cur.booking_id];
                  return (
                    <div className="max-w-md mx-auto bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
                      <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                        <div>
                          <div className="text-[10px] uppercase font-mono tracking-wider text-slate-500 font-semibold">MUT BOARDING PASS</div>
                          <div className="text-xs text-slate-500 mt-0.5">รหัส: <strong className="font-mono text-slate-900">{cur.booking_code}</strong></div>
                        </div>
                        <span className="font-mono font-bold text-slate-900 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-sm">#{cur.booking_id}</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                          <div className="text-[10px] text-slate-500">ผู้โดยสาร</div>
                          <div className="font-semibold text-slate-900 truncate">{currentUser.name}</div>
                        </div>
                        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                          <div className="text-[10px] text-slate-500">รหัส</div>
                          <div className="font-mono text-slate-800 truncate">{currentUser.username}</div>
                        </div>
                        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                          <div className="text-[10px] text-slate-500">จุดขึ้น</div>
                          <div className="font-semibold text-emerald-700 truncate text-[11px]">{getStopName(cur.pickup_stop_id)}</div>
                        </div>
                        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                          <div className="text-[10px] text-slate-500">จุดลง</div>
                          <div className="font-semibold text-rose-700 truncate text-[11px]">{getStopName(cur.dropoff_stop_id)}</div>
                        </div>
                        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                          <div className="text-[10px] text-slate-500">วัน/เวลา</div>
                          <div className="font-semibold text-slate-900 text-[11px]">{trip?.service_date} · {trip?.departure_time}</div>
                        </div>
                        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                          <div className="text-[10px] text-slate-500">ที่นั่ง</div>
                          <div className="font-bold text-slate-900 text-[11px]">{cur.seat_count}</div>
                        </div>
                      </div>

                      <div className="text-center py-2">
                        <div className="p-3 bg-white border border-slate-200 rounded-xl inline-block">
                          <QrCodeSvg value={apiMode && cur.booking_code ? cur.booking_code : `MUT-PASS-${cur.booking_id}-${currentUser.username}`} size={140} />
                        </div>
                        <div className="text-[10px] text-slate-500 mt-2">ยื่น QR ให้พนักงานขับรถ ({drv.fullname}) สแกน</div>
                      </div>

                      {isCheckedIn && (
                        <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 font-semibold flex items-center justify-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" /> เช็คอินแล้ว
                        </div>
                      )}

                      <div className="flex items-center gap-2 pt-1">
                        <button
                          disabled={isCheckedIn}
                          onClick={() => {
                            checkInBooking(cur.booking_id);
                            setCheckInFeedback((p) => ({ ...p, [cur.booking_id]: true }));
                          }}
                          className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold ${isCheckedIn ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 text-white'}`}
                        >
                          {isCheckedIn ? 'เช็คอินแล้ว' : 'จำลองเช็คอิน'}
                        </button>
                        <button onClick={() => setActiveTab('my-tickets')} className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold">
                          ดูตั๋วทั้งหมด
                        </button>
                      </div>
                    </div>
                  );
                })()}

                <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <button onClick={() => setActiveTab('my-tickets')} className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-lg text-xs border border-slate-200 flex items-center gap-2">
                    <Ticket className="w-4 h-4" />ไปที่ประวัติการจอง
                  </button>
                  <button onClick={handleStartNewBookingSession} className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg text-sm flex items-center gap-2">
                    <PlusCircle className="w-4 h-4" />เริ่มจองใหม่
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Column */}
          <div className="lg:col-span-4 space-y-5">
            {stagedTrips.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-sm">
                <div className="flex items-center gap-2 text-slate-900 font-semibold text-sm">
                  <CalendarCheck className="w-4 h-4 text-slate-600" />
                  <span>รอบที่เลือกไว้ ({stagedTrips.length}/4)</span>
                </div>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {stagedTrips.map((st, i) => (
                    <div key={st.staged_id} className="bg-slate-50 p-2.5 rounded-lg text-xs flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-slate-900 text-[11px] truncate">รอบ {i + 1}: {st.departure_time} น.</div>
                        <div className="text-[10px] text-slate-500 truncate">ที่นั่ง <span className="font-mono font-semibold text-slate-700">{st.seat_count}</span></div>
                      </div>
                      <button onClick={() => handleRemoveStagedTrip(st.staged_id)} className="text-rose-500 hover:text-rose-700 p-1 shrink-0">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  disabled={isConfirmingBookings}
                  onClick={() => { if (step === 4) void handleConfirmAllStagedBookings(); else setStep(4); }}
                  className="w-full py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-60 disabled:cursor-wait text-white font-semibold rounded-lg text-xs flex items-center justify-center gap-1.5"
                >
                  {isConfirmingBookings ? 'กำลังบันทึกการจอง…' : step === 4 ? 'ยืนยันการจองจริง' : 'ตรวจสอบและยืนยัน'} <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 text-sm">{currentUser.name}</h3>
                  <div className="text-xs text-slate-500">{currentUser.user_type}</div>
                  <div className="text-[11px] font-mono text-slate-600">Email: {currentUser.username}</div>
                </div>
              </div>
              <div className="pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                <div className="flex justify-between"><span>เบอร์ติดต่อ:</span><span className="text-slate-900 font-mono">{currentUser.phone}</span></div>
                <div className="flex justify-between"><span>สิทธิ์การจอง:</span><span className="text-emerald-700 font-semibold">สูงสุด 4 ที่นั่ง/เที่ยว</span></div>
                <div className="flex justify-between"><span>การจองคงค้าง:</span><span className="text-slate-900 font-semibold">{myBookings.filter((b) => b.status === 1).length} รายการ</span></div>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs space-y-2">
              <div className="flex items-center gap-2 text-slate-700 font-semibold">
                <ShieldCheck className="w-4 h-4 text-slate-500" /><span>ความสอดคล้องกับ Entity</span>
              </div>
              <ul className="space-y-1 text-slate-600">
                <li>• <strong>ผู้ใช้งานระบบ</strong> (รหัส, ชื่อ, ประเภท)</li>
                <li>• <strong>เส้นทาง & จุดจอด</strong> (รหัส, ลำดับ, นาที)</li>
                <li>• <strong>รอบรถ & ยานพาหนะ</strong> (วัน, เวลา, ความจุ)</li>
                <li>• <strong>การจอง & รายละเอียด</strong> (รหัส, ที่นั่ง, เช็คอิน)</li>
              </ul>
            </div>
          </div>
        </div>
      ) : (
        /* ==================== MY TICKETS TAB ==================== */
        <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-4 shadow-sm">
          {/* ✅ Header แบบสะอาด ไม่ซ้ำ */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Ticket className="w-5 h-5 text-slate-700" />
                <span>ประวัติการจอง</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                ทั้งหมด <strong className="text-slate-700">{myBookings.length}</strong> ใบ
                  {statusCounts.upcoming > 0 && <> · เที่ยวที่กำลังจะถึง <strong className="text-emerald-700">{statusCounts.upcoming}</strong> ใบ</>}
              </p>
            </div>
          </div>

          {/* ✅ Filter chips เท่านั้น — ไม่มี 5 cards ด้านบนอีก */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-50 p-2 rounded-xl border border-slate-200">
            <Filter className="w-3.5 h-3.5 text-slate-500 ml-1" />
            <button
              onClick={() => setTicketStatusFilter('all')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                ticketStatusFilter === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              ทั้งหมด ({statusCounts.all})
            </button>
            <button
              onClick={() => setTicketStatusFilter('upcoming')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                ticketStatusFilter === 'upcoming'
                  ? 'bg-emerald-700 text-white'
                  : statusCounts.upcoming === 0
                  ? 'bg-slate-50 text-slate-300 border border-slate-200 cursor-not-allowed'
                  : 'bg-white text-emerald-800 border border-emerald-200 hover:bg-emerald-50'
              }`}
              disabled={statusCounts.upcoming === 0}
            >
              เที่ยวที่กำลังจะถึง ({statusCounts.upcoming})
            </button>
            {(['จองสำเร็จ', 'เช็กอินแล้ว', 'เสร็จสิ้น', 'ยกเลิก', 'ไม่ได้ขึ้นรถ'] as const).map((s) => {
              const count = statusCounts[s];
              const isActive = ticketStatusFilter === s;
              const isEmpty = count === 0;
              return (
                <button
                  key={s}
                  onClick={() => !isEmpty && setTicketStatusFilter(s)}
                  disabled={isEmpty}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-slate-900 text-white'
                      : isEmpty
                      ? 'bg-slate-50 text-slate-300 border border-slate-200 cursor-not-allowed'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {s} ({count})
                </button>
              );
            })}
          </div>

          {/* List */}
          {filteredBookingGroups.length === 0 ? (
            <div className="p-10 text-center bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <Ticket className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-sm font-semibold text-slate-700">
                {ticketStatusFilter === 'all' ? 'ยังไม่มีประวัติการจอง' : ticketStatusFilter === 'upcoming' ? 'ไม่มีเที่ยวที่กำลังจะถึง' : `ไม่มีตั๋วสถานะ "${ticketStatusFilter}"`}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredBookingGroups.map((group) => {
                // ✅ ถ้ามี 1 ตั๋ว → flat layout (ไม่มี border ซ้อน)
                if (group.tickets.length === 1) {
                  return (
                    <div key={group.booking_code}>
                      {renderSingleTicketCard(group.tickets[0], false, group)}
                    </div>
                  );
                }

                // หลายตั๋ว → แสดง group header
                return (
                  <div key={group.booking_code} className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 px-1">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600">
                          <CalendarCheck className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-500">รหัสการจอง</div>
                          <div className="text-sm font-bold text-slate-900 font-mono">{group.booking_code}</div>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          {group.tickets.length} เที่ยว
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-2">
                        {group.booking_time && <span>{group.booking_time}</span>}
                        <button
                          onClick={() =>
                            setDeleteModalData({
                              type: 'group',
                              bookingCode: group.booking_code,
                              ticketCount: group.tickets.length,
                              label: `กลุ่ม ${group.booking_code}`,
                            })
                          }
                          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors"
                          title="ลบทั้งกลุ่มการจองนี้"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                      {group.tickets.map((b) => renderSingleTicketCard(b, false, group))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Ticket Modal */}
          {ticketModalOpen && activeTicketBookingId && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-sm w-full relative shadow-xl">
                <button onClick={() => setTicketModalOpen(false)} className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-full">
                  <X className="w-4 h-4" />
                </button>
                {(() => {
                  const b = bookings.find((bk) => bk.booking_id === activeTicketBookingId);
                  const trip = b ? trips.find((t) => t.trip_id === b.trip_id) : null;
                  const route = trip ? routes.find((r) => r.route_id === trip.route_id) : null;
                  const veh = resolveVehicle(trip);
                  const ticketStatus = b ? resolveTicketActionStatus(b, trip) : 'จองสำเร็จ';
                  const isConfirmed = ticketStatus === 'จองสำเร็จ';
                  const isCheckedIn = ticketStatus === 'เช็กอินแล้ว';
                  const isCancelled = ticketStatus === 'ยกเลิก';
                  const isNoShow = ticketStatus === 'ไม่ได้ขึ้นรถ';
                  const isCompleted = ticketStatus === 'เสร็จสิ้น';
                  return (
                    <div className="text-center space-y-3">
                      <div className="flex justify-center"><TicketStatusBadge status={ticketStatus} size="md" /></div>
                      <div>
                        <div className="text-[11px] text-slate-500 font-mono">รหัสตั๋ว</div>
                        <h3 className="text-xl font-bold text-slate-900 font-mono">#{activeTicketBookingId}</h3>
                        {b?.booking_code && <div className="text-xs text-slate-600 mt-1">รหัสการจอง: <span className="font-mono font-bold text-slate-900">{b.booking_code}</span></div>}
                      </div>
                      {trip && (
                        <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 text-left text-xs space-y-1 text-slate-700">
                          <div><strong>เส้นทาง:</strong> {route?.name}</div>
                          <div><strong>จุดขึ้น-ลง:</strong> {b && getStopName(b.pickup_stop_id)} → {b && getStopName(b.dropoff_stop_id)}</div>
                          <div><strong>เวลาออก:</strong> {trip.departure_time} น. ({trip.service_date})</div>
                          <div><strong>ที่นั่ง:</strong> <span className="font-bold">{b?.seat_count}</span></div>
                          <div><strong>ยานพาหนะ:</strong> {veh.type} ({veh.license_plate})</div>
                        </div>
                      )}
                      <div className="flex justify-center py-1 relative">
                        <div className={`p-3 bg-white border rounded-xl relative ${
                          isCancelled ? 'border-rose-200 opacity-60 grayscale' : isNoShow ? 'border-amber-200 opacity-75' : isCompleted ? 'border-sky-200 opacity-80' : 'border-slate-200'
                        }`}>
                          <QrCodeSvg value={apiMode && b?.booking_code ? b.booking_code : `MUT-PASS-${activeTicketBookingId}`} size={150} />
                          {isCheckedIn && (
                            <div className="absolute inset-0 bg-emerald-900/10 flex items-center justify-center pointer-events-none">
                              <div className="rotate-[-12deg] bg-emerald-700 text-white font-bold text-xs px-3 py-1 rounded-lg border-2 border-white shadow-lg flex items-center gap-1">
                                <CheckCheck className="w-3.5 h-3.5" /> เช็กอินแล้ว
                              </div>
                            </div>
                          )}
                          {isCancelled && (
                            <div className="absolute inset-0 bg-rose-900/20 flex items-center justify-center pointer-events-none">
                              <div className="rotate-[-12deg] bg-rose-700 text-white font-bold text-xs px-3 py-1 rounded-lg border-2 border-white shadow-lg flex items-center gap-1">
                                <XCircle className="w-3.5 h-3.5" /> ยกเลิก
                              </div>
                            </div>
                          )}
                          {isNoShow && (
                            <div className="absolute inset-0 bg-amber-900/20 flex items-center justify-center pointer-events-none">
                              <div className="rotate-[-12deg] bg-amber-800 text-white font-bold text-xs px-3 py-1 rounded-lg border-2 border-white shadow-lg flex items-center gap-1">
                                <AlertTriangle className="w-3.5 h-3.5" /> No-Show
                              </div>
                            </div>
                          )}
                          {isCompleted && (
                            <div className="absolute inset-0 bg-sky-900/15 flex items-center justify-center pointer-events-none">
                              <div className="rotate-[-12deg] bg-sky-700 text-white font-bold text-xs px-3 py-1 rounded-lg border-2 border-white shadow-lg flex items-center gap-1">
                                <Flag className="w-3.5 h-3.5" /> เสร็จสิ้น
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      {isConfirmed && !apiMode && (
                        <button
                          onClick={() => { checkInBooking(activeTicketBookingId); setTicketModalOpen(false); }}
                          className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs flex items-center justify-center gap-1.5"
                        >
                          <CheckCheck className="w-4 h-4" /> จำลองเช็คอิน
                        </button>
                      )}
                      {!isConfirmed && !isCheckedIn && (
                        <div className="w-full py-2 bg-slate-100 text-slate-500 font-medium rounded-lg text-xs border border-slate-200">ปิดการทำงาน</div>
                      )}
                      {apiMode && isConfirmed && (
                        <div className="w-full py-2 bg-emerald-50 text-emerald-800 font-medium rounded-lg text-xs border border-emerald-200">แสดง QR ให้พนักงานขับรถสแกนเพื่อเช็กอิน</div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* Cancel Modal */}
          {cancelModalData && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-sm w-full relative shadow-xl space-y-4">
                <button onClick={() => setCancelModalData(null)} className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-full">
                  <X className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-700 shrink-0">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">ยืนยันยกเลิกตั๋ว</h3>
                    <p className="text-xs text-slate-500">การยกเลิกมีผลทันที (ตั๋วยังอยู่ในรายการ)</p>
                  </div>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500">รหัสตั๋ว:</span>
                    <strong className="font-mono text-slate-900">#{cancelModalData.bookingId}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">รหัสการจอง:</span>
                    <strong className="font-mono text-slate-900">{cancelModalData.bookingCode}</strong>
                  </div>
                  {cancelModalData.seatCount && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">ที่นั่ง:</span>
                      <span className="font-bold font-mono text-slate-900">{cancelModalData.seatCount} ที่นั่ง</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <button onClick={() => setCancelModalData(null)} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold">
                    ย้อนกลับ
                  </button>
                  <button
                    onClick={() => { if (apiMode) void apiCancelBooking(cancelModalData.bookingId).catch((e) => setConfirmErrorModal({ title: 'à¸¢à¸à¹€à¸¥à¸´à¸à¹„à¸¡à¹ˆà¸ªà¸³à¹€à¸£à¹‡à¸ˆ', message: e instanceof Error ? e.message : 'API request failed' })); else cancelBooking(cancelModalData.bookingId); setCancelModalData(null); }}
                    className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold"
                  >
                    ยืนยันยกเลิก
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Delete Modal */}
          {deleteModalData && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-sm w-full relative shadow-xl space-y-4">
                <button onClick={() => setDeleteModalData(null)} className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-full">
                  <X className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-700 shrink-0">
                    <Trash2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">ซ่อนตั๋วจากหน้าเว็บ</h3>
                    <p className="text-xs text-slate-500">ตั๋วจะหายจากรายการของคุณ แต่ข้อมูลใน Oracle ยังคงเก็บไว้</p>
                  </div>
                </div>

                <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-xs space-y-1.5">
                  {deleteModalData.type === 'single' ? (
                    <>
                      <div className="flex justify-between">
                        <span className="text-slate-500">รหัสตั๋ว:</span>
                        <strong className="font-mono text-slate-900">#{deleteModalData.bookingId}</strong>
                      </div>
                      <div className="text-slate-700 text-[11px] leading-relaxed">
                        {deleteModalData.label}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between">
                        <span className="text-slate-500">รหัสการจอง:</span>
                        <strong className="font-mono text-slate-900">{deleteModalData.bookingCode}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">จำนวนตั๋วที่จะซ่อน:</span>
                        <strong className="text-slate-900">{deleteModalData.ticketCount} ใบ</strong>
                      </div>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button onClick={() => setDeleteModalData(null)} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold">
                    ยกเลิก
                  </button>
                  <button
                    onClick={confirmDelete}
                    className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />ซ่อนตั๋ว
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Confirm Error Modal */}
          {confirmErrorModal && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full relative shadow-xl space-y-4">
                <button onClick={() => setConfirmErrorModal(null)} className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-full">
                  <X className="w-4 h-4" />
                </button>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{confirmErrorModal.title}</h3>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{confirmErrorModal.message}</p>
                  </div>
                </div>
                <button onClick={() => setConfirmErrorModal(null)} className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg text-xs">
                  รับทราบ
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
