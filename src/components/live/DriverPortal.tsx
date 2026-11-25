import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { Html5Qrcode as Html5QrcodeInstance } from 'html5-qrcode';
import { useBus } from '../../context/BusContext';
import { Booking, Trip, TripSummaryNoShow, DriverTripStopManifest, resolveTicketActionStatus } from '../../types/schema';
import { TicketStatusBadge } from './TicketStatusBadge';
import {
  Bus,
  QrCode,
  Users,
  Calendar,
  Lock,
  Smartphone,
  Maximize2,
  Clock,
  MapPin,
  Check,
  CheckCheck,
  CheckCircle2,
  AlertCircle,
  Volume2,
  VolumeX,
  Flashlight,
  Sparkles,
  Search,
  Phone,
  Wifi,
  Battery,
  X,
  UserX,
  Play,
  ArrowRight,
  ChevronDown,
  Shield,
  User,
} from 'lucide-react';

type DriverTab = 'trips' | 'scan' | 'passengers';

export const DriverPortal: React.FC = () => {
  const {
    currentDriver,
    apiMode, apiCheckIn, apiAlightBooking, apiStartTrip, apiFinishTrip,
    setCurrentDriver,
    employees,
    positions,
    departments,
    trips,
    driverTripStops,
    routes,
    stops,
    vehicles,
    users,
    bookings,
    checkInBooking,
    alightBooking,
    startTrip,
    finishTrip,
    verifyTicketForTrip,
    getStopsForRoute,
    getStopById,
    getPermittedScreens,
    canEditScreen,
    simulatedCurrentTime,
  } = useBus();

  const [activeTab, setActiveTab] = useState<DriverTab>('scan');
  const [deviceMode, setDeviceMode] = useState<'frame' | 'fluid'>('frame');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [torchOn, setTorchOn] = useState<boolean>(false);
  const [driverDropdownOpen, setDriverDropdownOpen] = useState<boolean>(false);

  // ✅ นาฬิกาหัวหน้าจอ: โหมด API ใช้เวลาจริง, โหมดตัวอย่างล็อกช่วงเวลาทำการ (08:00 - 18:00)
  const [currentTime, setCurrentTime] = useState<string>('08:00');
  // ใช้เป็น dependency เพื่อให้รอบรถที่หลุดเกณฑ์เวลา 20 นาที หายไปเองตามเวลาจริง
  const [clockTick, setClockTick] = useState(0);

  const permittedScreens = getPermittedScreens(currentDriver.position_id);
  const hasAccessToScreen14 = apiMode || permittedScreens.some((s) => s.screen_id === 14);
  const canEditCurrent = apiMode || canEditScreen(14, currentDriver.position_id);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setClockTick((tick) => tick + 1);
      let hrs = now.getHours();
      let mins = now.getMinutes();

      // Lock ช่วงเวลาทำการ (08:00 - 18:00) เพื่อให้ดู realistic เฉพาะโหมดตัวอย่าง
      if (!apiMode && (hrs < 8 || hrs >= 18)) {
        hrs = 8;
        mins = 30;
      }

      setCurrentTime(`${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, [apiMode]);

  const getLocalDateKey = (date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  const timeToMinutes = (value: string): number => {
    const [h, m] = value.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  };
  const [todayDate, setTodayDate] = useState(() => getLocalDateKey(new Date()));
  const [scheduleDay, setScheduleDay] = useState<'today' | 'tomorrow'>('today');
  // ป้ายปัจจุบันที่รถจอดอยู่ — ใช้ล็อกปุ่มลงไม่ให้กดก่อนถึงป้ายลง
  const [currentRouteStopId, setCurrentRouteStopId] = useState<number | null>(null);

  useEffect(() => {
    const updateTodayDate = () => setTodayDate(getLocalDateKey(new Date()));
    const interval = window.setInterval(updateTodayDate, 60_000);
    return () => window.clearInterval(interval);
  }, []);

  const tomorrowDate = (() => {
    const [year, month, day] = todayDate.split('-').map(Number);
    const tomorrow = new Date(year, month - 1, day);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return getLocalDateKey(tomorrow);
  })();

  // เกณฑ์การแสดงรอบของคนขับ: รอบที่ยังไม่ถึงเวลาออกเดินทางต้องเห็นเสมอ เพราะคนขับต้องกด
  // "เริ่มออกรถ" ได้จนถึงตอนออกเดินทาง ซ่อนเฉพาะรอบที่เวลาผ่านไปแล้วหรือถูกยกเลิก
  const DRIVER_DEPARTURE_GRACE_MINUTES = 0;

  const getMinutesUntilDeparture = (trip: Trip): number => {
    const serviceDay = trip.service_date.slice(0, 10);
    const dayOffset = serviceDay === todayDate ? 0 : serviceDay === tomorrowDate ? 1 : Number.NaN;
    if (Number.isNaN(dayOffset)) return Number.NEGATIVE_INFINITY;
    if (apiMode) {
      const departureAt = new Date(`${serviceDay}T${trip.departure_time}:00`);
      const minutes = (departureAt.getTime() - Date.now()) / 60000;
      return Number.isFinite(minutes) ? minutes : Number.NEGATIVE_INFINITY;
    }
    return dayOffset * 1440 + timeToMinutes(trip.departure_time) - timeToMinutes(simulatedCurrentTime || '09:00');
  };

  // TRIP.STATUS: 0 = ยกเลิก, 1 = เปิด/พร้อม, 2 = กำลังเดินทาง, 3 = เสร็จสิ้น (database.sql CK_TRIP_STATUS)
  // รอบที่ยกเลิกและรอบที่เวลาออกเดินทางผ่านไปแล้วจะไม่แสดง ส่วนรอบที่กำลังเดินทาง/เสร็จแล้ว
  // ต้องเห็นเสมอเพื่อให้เช็คอินและสรุปยอดได้
  const isTripSelectable = (trip: Trip): boolean => {
    if (trip.status === 0) return false;
    if (trip.status !== 1) return true;
    return getMinutesUntilDeparture(trip) >= DRIVER_DEPARTURE_GRACE_MINUTES;
  };

  const driverTrips = useMemo(
    () => trips.filter((t) => t.driver_id === currentDriver.employee_id && isTripSelectable(t)),
    [trips, currentDriver.employee_id, todayDate, tomorrowDate, clockTick, apiMode, simulatedCurrentTime]
  );
  const todayTrips = useMemo(
    () => driverTrips.filter((t) => t.service_date.slice(0, 10) === todayDate),
    [driverTrips, todayDate]
  );
  const tomorrowTrips = useMemo(
    () => driverTrips.filter((t) => t.service_date.slice(0, 10) === tomorrowDate),
    [driverTrips, tomorrowDate]
  );
  const displayTrips = scheduleDay === 'today' ? todayTrips : tomorrowTrips;
  const displayServiceDate = scheduleDay === 'today' ? todayDate : tomorrowDate;
  // นับรอบทั้งหมดของวันนั้นโดยไม่กรอง เพื่อแยกความต่างระหว่าง "ไม่มีรอบ" กับ "รอบหมดเวลาแล้ว"
  const assignedTripsForDay = useMemo(
    () => trips.filter((t) => t.driver_id === currentDriver.employee_id && t.service_date.slice(0, 10) === displayServiceDate),
    [trips, currentDriver.employee_id, displayServiceDate]
  );

  const [selectedTripId, setSelectedTripId] = useState<number>(
    todayTrips.length > 0 ? todayTrips[0].trip_id : 0
  );

  useEffect(() => {
    if (!todayTrips.some((t) => t.trip_id === selectedTripId)) {
      setSelectedTripId(todayTrips[0]?.trip_id ?? 0);
    }
  }, [todayTrips, selectedTripId]);

  const [scanCodeInput, setScanCodeInput] = useState<string>('');
  const [cameraActive, setCameraActive] = useState(false);
  const scannerRef = useRef<Html5QrcodeInstance | null>(null);
  const scanInProgressRef = useRef(false);
  const [scanFeedback, setScanFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [passengerFilter, setPassengerFilter] = useState<'all' | 'pending' | 'checked'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedTripStops, setExpandedTripStops] = useState<number | null>(null);
  const [showPassengerStops, setShowPassengerStops] = useState(false);
  const [tripSummaryResult, setTripSummaryResult] = useState<{
    tripId: number;
    totalBoarded: number;
    totalAlighted?: number;
    notAlighted?: TripSummaryNoShow[];
    noShows: TripSummaryNoShow[];
  } | null>(null);

  const activeTrip = todayTrips.find((t) => t.trip_id === selectedTripId);
  const tripRoute = activeTrip ? routes.find((r) => r.route_id === activeTrip.route_id) : null;
  const tripVehicle = activeTrip ? vehicles.find((v) => v.vehicle_id === activeTrip.vehicle_id) : null;
  const tripBookings = bookings.filter((b) => b.trip_id === selectedTripId && b.status !== 0);
  const routeStops = activeTrip ? getStopsForRoute(activeTrip.route_id) : [];
  const activeStopManifest = driverTripStops[selectedTripId] || [];

  const totalPassengers = tripBookings.reduce((sum, b) => sum + b.seat_count, 0);
  const checkedInSeats = tripBookings
    .filter((b) => b.is_checked_in || b.status === 2 || b.status === 3)
    .reduce((sum, b) => sum + b.seat_count, 0);
  const pendingSeats = tripBookings
    .filter((b) => !b.is_checked_in && b.status === 1)
    .reduce((sum, b) => sum + b.seat_count, 0);

  const currentPos = positions.find((p) => p.position_id === currentDriver.position_id);
  const currentDept = departments.find((d) => d.department_id === currentDriver.department_id);

  const playSoundEffect = (isSuccess: boolean) => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = isSuccess ? 'sine' : 'sawtooth';
      osc.frequency.setValueAtTime(isSuccess ? 880 : 220, ctx.currentTime);
      if (isSuccess) {
        osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.12);
      }
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (isSuccess ? 0.18 : 0.25));
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + (isSuccess ? 0.2 : 0.28));
    } catch { /* ignore */ }
  };

  const handleScanTicket = async (bookingIdToScan?: number | string) => {
    if (!activeTrip) return;
    // บังคับเลือกป้ายปัจจุบันก่อนเช็กอิน — ทั้ง 4 ทางเข้า (กล้อง/พิมพ์รหัส/ปุ่มจำลอง/ปุ่มรายชื่อ) ใช้ function เดียวกัน
    if (currentRouteStopId == null) {
      setScanFeedback({ type: 'error', message: 'กรุณาเลือกป้ายปัจจุบันก่อนเช็กอิน' });
      playSoundEffect(false);
      setTimeout(() => setScanFeedback(null), 4500);
      return;
    }
    if (apiMode) {
      const qrPayload = String(bookingIdToScan ?? scanCodeInput).trim();
      if (!qrPayload) return;
      try {
        await apiCheckIn(activeTrip.trip_id, qrPayload, currentRouteStopId);
        setScanFeedback({ type: 'success', message: 'Check-in completed.' });
        setScanCodeInput('');
        playSoundEffect(true);
      } catch (error) {
        setScanFeedback({ type: 'error', message: error instanceof Error ? error.message : 'Check-in failed.' });
        playSoundEffect(false);
      }
      return;
    }
    const targetId = typeof bookingIdToScan === 'number' ? bookingIdToScan : parseInt(String(bookingIdToScan ?? scanCodeInput).replace(/\D/g, ''), 10);

    if (isNaN(targetId) || targetId <= 0) {
      setScanFeedback({ type: 'error', message: 'กรุณาระบุเลขที่ตั๋วให้ถูกต้อง' });
      playSoundEffect(false);
      return;
    }

    const result = verifyTicketForTrip(activeTrip.trip_id, targetId, currentRouteStopId);

    if (result.isValid && result.booking) {
      checkInBooking(result.booking.booking_id);
      const passenger = users.find((u) => u.user_id === result.booking?.user_id);
      setScanFeedback({
        type: 'success',
        message: `✅ เช็คอินสำเร็จ! #${result.booking.booking_id} (${passenger?.name || 'ผู้โดยสาร'}) ที่นั่ง: ${result.booking.seat_count}`,
      });
      playSoundEffect(true);
      setScanCodeInput('');
    } else {
      setScanFeedback({ type: 'error', message: `❌ ${result.message}` });
      playSoundEffect(false);
    }

    setTimeout(() => setScanFeedback(null), 4500);
  };

  const stopCamera = async () => {
    const scanner = scannerRef.current;
    if (!scanner) return;
    try {
      if (scanner.isScanning) await scanner.stop();
      scanner.clear();
    } catch {
      // The camera may already have stopped after a successful read.
    } finally {
      scannerRef.current = null;
      setCameraActive(false);
    }
  };

  const startCamera = async () => {
    if (!apiMode) return;
    if (!activeTrip) {
      setScanFeedback({ type: 'error', message: 'Select an assigned trip before scanning.' });
      return;
    }
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      setScanFeedback({ type: 'error', message: 'Camera unavailable here. Enter the booking code below instead.' });
      return;
    }
    let scanner: Html5QrcodeInstance | null = null;
    try {
      await stopCamera();
      const { Html5Qrcode } = await import('html5-qrcode');
      scanner = new Html5Qrcode('driver-qr-reader');
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 180, height: 180 }, aspectRatio: 1 },
        async (decodedText) => {
          if (scanInProgressRef.current) return;
          scanInProgressRef.current = true;
          await stopCamera();
          await handleScanTicket(decodedText);
          scanInProgressRef.current = false;
        },
        () => undefined,
      );
      setCameraActive(true);
      setScanFeedback(null);
    } catch {
      if (scanner?.isScanning) await scanner.stop().catch(() => undefined);
      scanner?.clear();
      scannerRef.current = null;
      setCameraActive(false);
      setScanFeedback({ type: 'error', message: 'Camera permission or device unavailable. Enter the booking code below instead.' });
    }
  };

  useEffect(() => () => {
    const scanner = scannerRef.current;
    if (scanner?.isScanning) void scanner.stop().catch(() => undefined);
  }, []);

  const getStopName = (id: number) => stops.find((s) => s.stop_id === id)?.name || `จุดจอด ${id}`;

  // รายชื่อผูกกับป้ายปัจจุบันแบบ 2 กลุ่ม:
  // 1) คนรอขึ้นป้ายนี้ (ยังไม่เช็กอิน + จองขึ้นป้ายปัจจุบัน) → ปุ่มเช็คอิน
  // 2) คนอยู่บนรถ (เช็กอินแล้ว + ยังไม่ลง) → ปุ่มลง ไม่ว่าจะขึ้นป้ายไหนมา
  // (ยังไม่เลือกป้าย = ไม่แสดง เพื่อบังคับให้เลือกป้ายก่อน)
  const manifestPassengers = tripBookings.filter((b) => {
    if (currentRouteStopId == null) return false;
    const isChecked = b.is_checked_in || b.status === 2 || b.status === 3;
    const stillOnboard = isChecked && !b.alighted_at;
    if (stillOnboard) return true;
    if (isChecked) return false;
    const pickupRs = b.pickup_route_stop_id ?? b.pickup_stop_id ?? null;
    if (pickupRs != null && pickupRs !== currentRouteStopId) return false;
    const passenger = users.find((u) => u.user_id === b.user_id);
    const searchLower = searchQuery.toLowerCase();
    const matchSearch =
      !searchQuery ||
      String(b.booking_id).includes(searchLower) ||
      (passenger?.name || '').toLowerCase().includes(searchLower) ||
      (passenger?.phone || '').includes(searchLower);

    if (!matchSearch) return false;
    if (passengerFilter === 'pending') return !b.is_checked_in && b.status === 1;
    if (passengerFilter === 'checked') return b.is_checked_in || b.status === 2 || b.status === 3;
    return true;
  });

  // ตารางผู้โดยสารขึ้น-ลงรายจุดจอด ใช้ร่วมกันระหว่างแท็บ "รอบรถ" และแท็บ "รายชื่อ"
  const renderStopManifest = (
    manifestStops: ReturnType<typeof getStopsForRoute>,
    manifest: DriverTripStopManifest[],
    sourceBookings: Booking[],
  ) => (
    <div className="space-y-1">
      {manifestStops.map((rs, idx) => {
        const stop = manifest.find((item) => item.route_stop_id === rs.route_stop_id);
        const fallback = (filter: (booking: Booking) => boolean) => sourceBookings.filter(filter).map((booking) => ({
          booking_id: booking.booking_id,
          booking_code: booking.booking_code || `BK-${booking.booking_id}`,
          passenger_id: booking.user_id,
          passenger_name: users.find((user) => user.user_id === booking.user_id)?.name || 'ผู้โดยสาร',
          seat_count: booking.seat_count,
          status_code: booking.status,
        }));
        const boarding = stop?.passengers_boarding ?? fallback((booking) => (booking.pickup_route_stop_id != null
          ? booking.pickup_route_stop_id === rs.route_stop_id
          : booking.pickup_stop_id === rs.stop_id));
        const alighting = stop?.passengers_alighting ?? fallback((booking) => (booking.dropoff_route_stop_id != null
          ? booking.dropoff_route_stop_id === rs.route_stop_id
          : booking.dropoff_stop_id === rs.stop_id));

        return (
          <div key={rs.route_stop_id} className="rounded-lg border border-slate-200 bg-white p-2 space-y-1.5">
            <div className="flex items-center gap-2 text-[11px]">
              <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-700 font-mono font-bold flex items-center justify-center text-[9px] shrink-0">{idx + 1}</span>
              <span className="text-slate-800 font-semibold">{getStopName(rs.stop_id)}</span>
              <span className="text-[10px] text-slate-400 font-mono">+{rs.minutesFromPrev} นาที</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-6">
              <div className="text-[10px]">
                <div className="font-bold text-emerald-700">ขึ้นรถ · {boarding.reduce((sum, passenger) => sum + passenger.seat_count, 0)} ที่นั่ง</div>
                {boarding.length ? boarding.map((passenger) => (
                  <div key={`board-${passenger.booking_id}`} className="text-slate-600 mt-0.5">
                    {passenger.passenger_name} · #{passenger.booking_id} · {passenger.seat_count} ที่นั่ง{[2, 3].includes(passenger.status_code) ? ' · เช็กอินแล้ว' : ' · รอเช็กอิน'}
                  </div>
                )) : <div className="text-slate-400 mt-0.5">ไม่มีผู้โดยสารขึ้น</div>}
              </div>
              <div className="text-[10px]">
                <div className="font-bold text-rose-700">ลงรถ · {alighting.reduce((sum, passenger) => sum + passenger.seat_count, 0)} ที่นั่ง</div>
                {alighting.length ? alighting.map((passenger) => (
                  <div key={`alight-${passenger.booking_id}`} className="text-slate-600 mt-0.5">
                    {passenger.passenger_name} · #{passenger.booking_id} · {passenger.seat_count} ที่นั่ง
                  </div>
                )) : <div className="text-slate-400 mt-0.5">ไม่มีผู้โดยสารลง</div>}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* ==================== TOP CONTROL BAR ==================== */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-sm">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full uppercase tracking-wider">
                📱 โหมดหน้าจอมือถือ
              </span>
            </div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 mt-0.5">
              Driver Mobile Application
            </h1>
            <p className="text-xs text-slate-500">
              3 เมนูหลัก: <strong>รอบรถที่รับผิดชอบ</strong> · <strong>สแกน QR Code</strong> · <strong>รายชื่อผู้โดยสาร</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap w-full md:w-auto justify-end">
          {/* Device mode toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            <button
              onClick={() => setDeviceMode('frame')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
                deviceMode === 'frame' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>กรอบมือถือ</span>
            </button>
            <button
              onClick={() => setDeviceMode('fluid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
                deviceMode === 'fluid' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>ขยายเต็ม</span>
            </button>
          </div>

          {/* ✅ Compact driver switcher — dropdown */}
          <div className="relative">
            <button
              onClick={() => setDriverDropdownOpen(!driverDropdownOpen)}
              className="flex items-center gap-2 pl-1.5 pr-2.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors"
            >
              <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0">
                <User className="w-3.5 h-3.5" />
              </div>
              <div className="text-left max-w-[160px]">
                <div className="text-xs font-bold text-slate-900 truncate">{currentDriver.fullname}</div>
                <div className="text-[10px] text-slate-500 truncate">
                  {currentPos?.name || 'คนขับ'} · #{currentDriver.employee_id}
                </div>
              </div>
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform ${driverDropdownOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {driverDropdownOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setDriverDropdownOpen(false)} />
                <div className="absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3 py-2 border-b border-slate-100 bg-slate-50">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      สลับคนขับ
                    </div>
                  </div>
                  <div className="max-h-72 overflow-y-auto p-1.5">
                    {employees
                      .filter((emp) => emp.position_id === 8)
                      .map((emp) => {
                        const p = positions.find((pos) => pos.position_id === emp.position_id);
                        const isActive = emp.employee_id === currentDriver.employee_id;
                        return (
                          <button
                            key={emp.employee_id}
                            onClick={() => {
                              setCurrentDriver(emp);
                              setDriverDropdownOpen(false);
                            }}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left ${
                              isActive ? 'bg-slate-900 text-white' : 'hover:bg-slate-100 text-slate-700'
                            }`}
                          >
                            <div
                              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              <User className="w-4 h-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-bold truncate">{emp.fullname}</div>
                              <div className={`text-[10px] truncate ${isActive ? 'text-slate-300' : 'text-slate-500'}`}>
                                {p?.name} · #{emp.employee_id}
                              </div>
                            </div>
                            {isActive && <Check className="w-4 h-4 shrink-0" />}
                          </button>
                        );
                      })}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ==================== MOBILE DEVICE STAGE ==================== */}
      <div className="flex justify-center items-start py-2">
        <div
          className={`transition-all duration-300 ${
            deviceMode === 'frame'
              ? 'w-full max-w-[420px] bg-slate-950 p-3 sm:p-4 rounded-[50px] shadow-2xl ring-1 ring-slate-800/40 border-4 border-slate-700/60 relative'
              : 'w-full max-w-xl bg-white border border-slate-200 rounded-3xl shadow-lg overflow-hidden'
          }`}
        >
          {deviceMode === 'frame' && (
            <>
              <div className="absolute -left-[9px] top-28 w-[5px] h-10 bg-slate-700 rounded-l-md" />
              <div className="absolute -left-[9px] top-42 w-[5px] h-10 bg-slate-700 rounded-l-md" />
              <div className="absolute -right-[9px] top-32 w-[5px] h-14 bg-slate-700 rounded-r-md" />
            </>
          )}

          <div
            className={`bg-slate-50 text-slate-900 flex flex-col overflow-hidden relative ${
              deviceMode === 'frame'
                ? 'rounded-[38px] border border-slate-800/50 min-h-[750px] max-h-[840px]'
                : 'min-h-[700px]'
            }`}
          >
            {/* ============ STATUS BAR ============ */}
            <div className="bg-slate-900 text-white px-5 pt-3 pb-2 flex items-center justify-between text-xs select-none shrink-0 z-30">
              <span className="font-mono font-bold tracking-tight text-[13px]">{currentTime}</span>
              <div className="h-5 w-24 bg-black rounded-full flex items-center justify-center gap-1.5 px-2 border border-slate-800">
                <span className="w-2 h-2 rounded-full bg-slate-800 border border-slate-700" />
                <span className="text-[9px] font-bold text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  MUT
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px]">
                <span className="text-[10px] font-bold text-slate-300">5G</span>
                <Wifi className="w-3.5 h-3.5 text-slate-200" />
                <div className="flex items-center gap-0.5 text-emerald-400">
                  <Battery className="w-4 h-4 fill-emerald-400/80" />
                  <span className="text-[10px] font-mono font-bold text-slate-200">98%</span>
                </div>
              </div>
            </div>

            {/* ============ MOBILE HEADER ============ */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white px-4 pt-3 pb-3 shrink-0 shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center shrink-0">
                    <Bus className="w-5 h-5 text-amber-300" />
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-300 font-bold uppercase tracking-wider flex items-center gap-1">
                      <span>MUT Driver</span>
                      <span>•</span>
                      <span className="text-emerald-300 flex items-center gap-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        ออนไลน์
                      </span>
                    </div>
                    <div className="text-sm font-bold truncate max-w-[190px]">
                      {currentDriver.fullname}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setTorchOn(!torchOn)}
                    className={`p-1.5 rounded-lg border text-xs transition-colors ${
                      torchOn
                        ? 'bg-amber-400 text-slate-900 border-amber-300'
                        : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
                    }`}
                  >
                    <Flashlight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setSoundEnabled(!soundEnabled)}
                    className={`p-1.5 rounded-lg border text-xs transition-colors ${
                      soundEnabled
                        ? 'bg-white/10 text-white border-white/20 hover:bg-white/20'
                        : 'bg-rose-500/20 text-rose-200 border-rose-400/30'
                    }`}
                  >
                    {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Driver info strip */}
              <div className="mt-2 pt-2 border-t border-white/15 flex items-center justify-between text-[11px] text-slate-300">
                <span className="truncate">
                  {currentPos?.name || 'พนักงานขับรถ'} · {currentDept?.name || 'ฝ่ายบริการ'}
                </span>
                <span className="font-mono text-amber-200 font-bold shrink-0">
                  ID: {currentDriver.employee_id}
                </span>
              </div>

              {/* ✅ NEW: Trip badge */}
              {activeTrip && (
                <div className="mt-2 pt-2 border-t border-white/15 flex items-center gap-2">
                  <span className="text-[10px] font-bold bg-amber-400 text-slate-900 px-2 py-0.5 rounded-md shrink-0">
                    🚌 รอบ #{activeTrip.trip_id}
                  </span>
                  <span className="text-[11px] text-slate-300 font-mono">
                    {activeTrip.departure_time} น.
                  </span>
                  <span className="text-[10px] text-slate-400">·</span>
                  <span className="text-[11px] text-slate-300 truncate">
                    {tripRoute?.name || 'สายรถ'}
                  </span>
                </div>
              )}
            </div>

            {/* ============ BODY ============ */}
            <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5">
              {!hasAccessToScreen14 ? (
                <div className="p-8 text-center bg-white rounded-2xl border border-rose-200 space-y-2 mt-8">
                  <Lock className="w-10 h-10 text-rose-500 mx-auto" />
                  <div className="text-sm font-bold text-slate-800">ไม่มีสิทธิ์เข้าถึง</div>
                  <div className="text-xs text-slate-500">
                    ตำแหน่งของคุณยังไม่ได้รับอนุญาตให้ใช้หน้าจอตรวจเช็คอิน
                  </div>
                </div>
              ) : activeTab === 'trips' ? (
                /* ==================== TRIPS TAB ==================== */
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-slate-700" />
                        <span>รอบรถที่รับผิดชอบ{scheduleDay === 'today' ? 'วันนี้' : 'พรุ่งนี้'}</span>
                      </h2>
                      <p className="text-[11px] text-slate-500">
                        ทั้งหมด {displayTrips.length} รอบ
                      </p>
                    </div>
                    <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200 shrink-0">
                      <button
                        type="button"
                        onClick={() => setScheduleDay('today')}
                        className={`px-2 py-1 rounded-md text-[10px] font-bold transition-colors ${scheduleDay === 'today' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                      >
                        วันนี้ ({todayTrips.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setScheduleDay('tomorrow')}
                        className={`px-2 py-1 rounded-md text-[10px] font-bold transition-colors ${scheduleDay === 'tomorrow' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                      >
                        พรุ่งนี้ ({tomorrowTrips.length})
                      </button>
                    </div>
                  </div>
                  <div className="-mt-2 text-[10px] text-slate-500 text-right">
                    {new Date(`${displayServiceDate}T00:00:00`).toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'short' })}
                  </div>

                  {displayTrips.length === 0 ? (
                    <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-slate-200 space-y-2">
                      <Bus className="w-8 h-8 text-slate-300 mx-auto" />
                      {assignedTripsForDay.length > 0 ? (
                        <>
                          <p className="text-sm font-semibold text-slate-700">ไม่มีรอบรถที่ต้องออกเดินทางแล้ว</p>
                          <p className="text-[11px] text-slate-500">
                            รอบที่ยกเลิกแล้ว และรอบที่เวลาออกเดินทางผ่านไปแล้ว จะไม่แสดงให้เลือก
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="text-sm font-semibold text-slate-700">{scheduleDay === 'today' ? 'วันนี้' : 'พรุ่งนี้'}ยังไม่มีรอบรถที่มอบหมาย</p>
                          <p className="text-[11px] text-slate-500">ติดต่อผู้ดูแลระบบเพื่อจัดสรรรอบ</p>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {displayTrips.map((t) => {
                        const isSelected = scheduleDay === 'today' && t.trip_id === selectedTripId;
                        const r = routes.find((route) => route.route_id === t.route_id);
                        const v = vehicles.find((veh) => veh.vehicle_id === t.vehicle_id);
                        const tripB = bookings.filter((b) => b.trip_id === t.trip_id && b.status !== 0);
                        const bookedSeats = tripB.reduce((sum, b) => sum + b.seat_count, 0);
                        const boardedSeats = tripB
                          .filter((b) => b.is_checked_in || b.status === 2 || b.status === 3)
                          .reduce((sum, b) => sum + b.seat_count, 0);
                        const isExpandedStops = expandedTripStops === t.trip_id;
                        const tripStops = getStopsForRoute(t.route_id);
                        const stopManifest = driverTripStops[t.trip_id] || [];

                        return (
                          <div
                            key={t.trip_id}
                            className={`bg-white rounded-2xl border p-3.5 transition-all space-y-3 ${
                              isSelected
                                ? 'border-slate-900 ring-1 ring-slate-900 shadow-md'
                                : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
                            }`}
                          >
                            {/* Header */}
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-sm font-bold font-mono text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200 flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {t.departure_time}
                                  </span>
                                  <span className="text-[10px] font-semibold text-slate-600 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
                                    #{t.trip_id}
                                  </span>
                                  <span
                                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                                      t.status === 2
                                        ? 'bg-slate-900 text-white border-slate-900 animate-pulse'
                                        : t.status === 3
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                        : 'bg-white text-slate-700 border-slate-200'
                                    }`}
                                  >
                                    {t.status === 2 ? 'กำลังเดินทาง' : t.status === 3 ? 'เสร็จสิ้น' : 'พร้อม'}
                                  </span>
                                </div>

                                {/* ✅ Route info with icon */}
                                <h3 className="text-sm font-bold text-slate-900 mt-2 flex items-start gap-1.5">
                                  <MapPin className="w-3.5 h-3.5 text-slate-500 mt-0.5 shrink-0" />
                                  <span className="line-clamp-2">{r?.name || 'สายรถรับส่ง'}</span>
                                </h3>

                                {/* ✅ Vehicle info */}
                                <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-1 flex-wrap">
                                  <span className="flex items-center gap-1">
                                    <Bus className="w-3 h-3 text-slate-400" />
                                    <strong className="text-slate-800">{v?.license_plate || '-'}</strong>
                                  </span>
                                  <span>·</span>
                                  <span className="flex items-center gap-1">
                                    <Users className="w-3 h-3 text-slate-400" />
                                    {v?.capacity || 40} ที่
                                  </span>
                                </div>
                              </div>

                              {scheduleDay === 'tomorrow' ? (
                                <span className="text-[10px] font-semibold text-slate-500 bg-slate-50 px-2 py-1 rounded-lg shrink-0">
                                  ตารางล่วงหน้า
                                </span>
                              ) : isSelected ? (
                                <span className="text-[10px] font-bold text-white bg-slate-900 px-2 py-1 rounded-lg shrink-0">
                                  เลือกอยู่
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setSelectedTripId(t.trip_id)}
                                  className="text-[11px] font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 transition-colors shrink-0"
                                >
                                  เลือก
                                </button>
                              )}
                            </div>

                            {/* Progress bar */}
                            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 space-y-1.5">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-slate-600 font-medium">เช็คอินแล้ว / จอง</span>
                                <span
                                  className="font-mono font-bold text-slate-900"
                                  title="จำนวนที่นั่งที่เช็คอินแล้ว เทียบกับจำนวนที่นั่งที่จอง"
                                >
                                  {boardedSeats} / {bookedSeats} ที่นั่ง
                                </span>
                              </div>
                              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                <div
                                  className="bg-emerald-500 h-full rounded-full transition-all"
                                  style={{ width: `${bookedSeats > 0 ? (boardedSeats / bookedSeats) * 100 : 0}%` }}
                                />
                              </div>
                            </div>

                            {/* Actions */}
                            {scheduleDay === 'today' ? <div className="flex items-center gap-2 pt-1 flex-wrap">
                              {canEditCurrent && t.status === 1 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (apiMode) void apiStartTrip(t.trip_id).catch((e) => setScanFeedback({ type: 'error', message: e instanceof Error ? e.message : 'Unable to start trip' })); else startTrip(t.trip_id);
                                    setSelectedTripId(t.trip_id);
                                  }}
                                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm"
                                >
                                  <Play className="w-3.5 h-3.5 fill-current" />
                                  <span>เริ่มออกรถ</span>
                                </button>
                              )}
                              {canEditCurrent && t.status === 2 && (
                                <button
                                  type="button"
                                  onClick={async () => {
                                    const res = apiMode ? await apiFinishTrip(t.trip_id) : finishTrip(t.trip_id);
                                    setTripSummaryResult({
                                      tripId: t.trip_id,
                                      totalBoarded: res.totalBoarded,
                                      totalAlighted: res.totalAlighted,
                                      notAlighted: res.notAlighted,
                                      noShows: res.noShows,
                                    });
                                  }}
                                  className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
                                >
                                  <CheckCheck className="w-3.5 h-3.5" />
                                  <span>ปิดรอบ</span>
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => { setSelectedTripId(t.trip_id); setActiveTab('scan'); }}
                                className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
                              >
                                <QrCode className="w-3.5 h-3.5" />
                                <span>สแกนตั๋ว</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => { setSelectedTripId(t.trip_id); setActiveTab('passengers'); }}
                                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
                              >
                                <Users className="w-3.5 h-3.5" />
                                <span>({tripB.length})</span>
                              </button>
                            </div> : (
                              <div className="pt-1 text-[10px] text-slate-500">แสดงตารางวันพรุ่งนี้ · การเริ่มเที่ยวและสแกน QR ใช้ได้ในวันให้บริการ</div>
                            )}

                            {/* Stops */}
                            <div className="pt-0.5 border-t border-slate-100">
                              <button
                                type="button"
                                onClick={() => setExpandedTripStops(isExpandedStops ? null : t.trip_id)}
                                className="text-[11px] text-slate-600 hover:text-slate-900 font-semibold flex items-center gap-1"
                              >
                                <MapPin className="w-3 h-3" />
                                <span>{isExpandedStops ? 'ซ่อนจุดจอด' : 'ดูจุดจอด'} ({tripStops.length})</span>
                              </button>

                              {isExpandedStops && (
                                <div className="mt-2 p-2 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                                  {renderStopManifest(tripStops, stopManifest, tripB)}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : activeTab === 'scan' ? (
                /* ==================== SCAN TAB ==================== */
                <div className="space-y-3.5">
                  {/* Active trip mini bar */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-sm flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200">
                          รอบ #{selectedTripId}
                        </span>
                        <span className="font-mono text-xs font-bold text-slate-900">
                          {activeTrip?.departure_time} น.
                        </span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${
                            activeTrip?.status === 2
                              ? 'bg-slate-900 text-white border-slate-900 animate-pulse'
                              : activeTrip?.status === 3
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-white text-slate-700 border-slate-200'
                          }`}
                        >
                          {activeTrip?.status === 2 ? 'กำลังเดินทาง' : activeTrip?.status === 3 ? 'จบรอบ' : 'พร้อม'}
                        </span>
                      </div>
                      <div className="text-xs font-bold text-slate-900 truncate mt-0.5">
                        {tripRoute?.name || 'สายรถ'} · {tripVehicle?.license_plate}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab('trips')}
                      className="text-[11px] text-slate-700 hover:text-slate-900 font-semibold bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded-lg border border-slate-200 shrink-0"
                    >
                      สลับรอบ
                    </button>
                  </div>

                  {/* ✅ Progress gauge with EMPTY STATE */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-sm space-y-1.5">
                    {totalPassengers === 0 ? (
                      <div className="text-center py-2 space-y-1">
                        <Users className="w-6 h-6 text-slate-300 mx-auto" />
                        <div className="text-[11px] text-slate-500 font-medium">
                          ยังไม่มีผู้โดยสารจองรอบนี้
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-700">ยอดขึ้นรถ</span>
                          <span className="font-mono font-bold text-slate-900">
                            {checkedInSeats} / {totalPassengers}
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${(checkedInSeats / totalPassengers) * 100}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-500">
                          <span>รอขึ้น: <strong className="text-slate-700">{pendingSeats} คน</strong></span>
                          <button
                            onClick={() => setActiveTab('passengers')}
                            className="text-slate-700 hover:underline font-semibold flex items-center gap-0.5"
                          >
                            ดูรายชื่อ <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>

                  {/* QR Scanner — ✅ compact */}
                  <div className="bg-slate-900 rounded-2xl p-4 text-white shadow-md space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                        <QrCode className="w-4 h-4" />
                        <span>สแกนตั๋ว QR Code</span>
                      </div>
                      <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-300 font-mono">
                        Auto-Focus
                      </span>
                    </div>

                    {/* ✅ ลดความสูงจาก aspect-16/10 → 180px */}
                    <div className="relative w-full h-[180px] bg-slate-950 rounded-xl border-2 border-dashed border-slate-700 flex items-center justify-center overflow-hidden">
                      <div id="driver-qr-reader" className="absolute inset-0 z-10 w-full overflow-hidden" />
                      {!cameraActive && <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-lg shadow-emerald-400/50 animate-scanline pointer-events-none" />}
                      <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-emerald-400" />
                      <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-emerald-400" />
                      <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-emerald-400" />
                      <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-emerald-400" />

                      {!cameraActive && <div className="text-center p-3 space-y-1 z-10 pointer-events-none">
                        <QrCode className="w-9 h-9 text-slate-600 mx-auto animate-pulse" />
                        <div className="text-[11px] text-slate-400">
                          หันกล้องไปที่ QR Code
                        </div>
                      </div>}

                      {torchOn && (
                        <div className="absolute inset-0 bg-amber-100/10 backdrop-brightness-125 pointer-events-none" />
                      )}
                    </div>

                    {apiMode && (
                      <button
                        type="button"
                        onClick={() => cameraActive ? void stopCamera() : void startCamera()}
                        className={`w-full py-2 rounded-xl text-xs font-bold transition-colors ${cameraActive ? 'bg-rose-600 hover:bg-rose-500 text-white' : 'bg-emerald-600 hover:bg-emerald-500 text-white'}`}
                      >
                        {cameraActive ? 'ปิดกล้อง' : 'เปิดกล้องสแกน QR'}
                      </button>
                    )}

                    {scanFeedback && (
                      <div
                        className={`p-2.5 rounded-xl text-xs font-semibold flex items-start gap-2 ${
                          scanFeedback.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                        }`}
                      >
                        {scanFeedback.type === 'success' ? (
                          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                        ) : (
                          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1 leading-snug">{scanFeedback.message}</div>
                      </div>
                    )}

                    <div className="space-y-2 pt-1">
                      <div className="text-[11px] text-slate-300 font-medium">
                        หรือพิมพ์เลขที่ตั๋ว:{currentRouteStopId == null && (
                          <span className="block text-amber-300 mt-0.5">กรุณาเลือกป้ายปัจจุบันในแท็บรายชื่อก่อนเช็กอิน</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={scanCodeInput}
                          onChange={(e) => setScanCodeInput(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') handleScanTicket(); }}
                          placeholder="เช่น SB-..."
                          className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => handleScanTicket()}
                          disabled={currentRouteStopId == null}
                          title={currentRouteStopId == null ? 'เลือกป้ายปัจจุบันก่อนเช็กอิน' : 'เช็กอินตั๋วป้ายปัจจุบัน'}
                          className={`px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 ${currentRouteStopId == null ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-slate-700 hover:bg-slate-600 text-white'}`}
                        >
                          สแกน
                        </button>
                      </div>

                      {tripBookings.length > 0 && (
                        <div className="pt-1">
                          <div className="text-[10px] text-slate-400 mb-1 flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-amber-400" />
                            <span>แตะจำลองสแกนตั๋ว:</span>
                          </div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {tripBookings.slice(0, 4).map((b) => {
                              const pass = users.find((u) => u.user_id === b.user_id);
                              const isDone = b.is_checked_in || b.status === 2 || b.status === 3;
                              const pickupRs = b.pickup_route_stop_id ?? b.pickup_stop_id ?? null;
                              const wrongStop = currentRouteStopId != null && pickupRs != null && pickupRs !== currentRouteStopId;
                              const blocked = currentRouteStopId == null || wrongStop;
                              return (
                                <button
                                  key={b.booking_id}
                                  onClick={() => handleScanTicket(apiMode ? (b.booking_code || '') : b.booking_id)}
                                  disabled={blocked}
                                  title={currentRouteStopId == null ? 'เลือกป้ายปัจจุบันก่อนเช็กอิน' : wrongStop ? 'ตั๋วใบนี้ขึ้นคนละป้าย' : 'เช็กอินตั๋วป้ายปัจจุบัน'}
                                  className={`text-[10px] px-2 py-1 rounded-lg border font-mono transition-all ${
                                    isDone
                                      ? 'bg-slate-800 text-emerald-400 border-slate-700'
                                      : blocked
                                        ? 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed'
                                        : 'bg-slate-800/90 hover:bg-slate-700 text-amber-300 border-amber-500/40'
                                  }`}
                                >
                                  #{b.booking_id} {pass?.name?.split(' ')[0]} ({b.seat_count}) {isDone ? '✓' : ''}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Trip control — ✅ กระชับขึ้น */}
                  {canEditCurrent && activeTrip && (
                    <div className="flex items-center gap-2">
                      {activeTrip.status === 1 && (
                        <button
                          type="button"
                          onClick={() => { if (apiMode) void apiStartTrip(activeTrip.trip_id).catch((e) => setScanFeedback({ type: 'error', message: e instanceof Error ? e.message : 'Unable to start trip' })); else startTrip(activeTrip.trip_id); }}
                          className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          <Play className="w-4 h-4 fill-current" />
                          <span>เริ่มออกรถ</span>
                          <span className="text-[10px] opacity-80 font-normal">
                            → เปลี่ยนเป็น "กำลังเดินทาง"
                          </span>
                        </button>
                      )}
                      {activeTrip.status === 2 && (
                        <button
                          type="button"
                          onClick={async () => {
                            const res = apiMode ? await apiFinishTrip(activeTrip.trip_id) : finishTrip(activeTrip.trip_id);
                            setTripSummaryResult({
                              tripId: activeTrip.trip_id,
                              totalBoarded: res.totalBoarded,
                              totalAlighted: res.totalAlighted,
                              notAlighted: res.notAlighted,
                              noShows: res.noShows,
                            });
                          }}
                          className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
                        >
                          <CheckCheck className="w-4 h-4" />
                          <span>ปิดรอบ/จบการเดินทาง</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                /* ==================== PASSENGERS TAB ==================== */
                <div className="space-y-3">
                  <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-sm flex items-center justify-between gap-2">
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        ผู้โดยสารรอบ #{selectedTripId} ({activeTrip?.departure_time} น.)
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {tripRoute?.name} · {totalPassengers} ที่นั่ง
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab('trips')}
                      className="text-[11px] text-slate-700 hover:text-slate-900 font-semibold bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded-lg border border-slate-200 shrink-0"
                    >
                      สลับรอบ
                    </button>
                  </div>

                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="ค้นหาชื่อ, ที่นั่ง, รหัสตั๋ว..."
                      className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900 shadow-sm"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1 bg-slate-200/70 p-0.5 rounded-xl text-[11px]">
                    <button
                      onClick={() => setPassengerFilter('all')}
                      className={`flex-1 py-1 rounded-lg font-semibold transition-all ${
                        passengerFilter === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                      }`}
                    >
                      ทั้งหมด ({tripBookings.length})
                    </button>
                    <button
                      onClick={() => setPassengerFilter('pending')}
                      className={`flex-1 py-1 rounded-lg font-semibold transition-all ${
                        passengerFilter === 'pending' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                      }`}
                    >
                      รอขึ้น ({pendingSeats})
                    </button>
                    <button
                      onClick={() => setPassengerFilter('checked')}
                      className={`flex-1 py-1 rounded-lg font-semibold transition-all ${
                        passengerFilter === 'checked' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                      }`}
                    >
                      ขึ้นแล้ว ({checkedInSeats})
                    </button>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                    <div className="px-3 py-2 flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="text-[11px] font-semibold text-slate-700">ป้ายปัจจุบัน</span>
                      <select
                        value={currentRouteStopId ?? ''}
                        onChange={(e) => setCurrentRouteStopId(e.target.value === '' ? null : Number(e.target.value))}
                        className="ml-auto text-[11px] font-semibold text-slate-900 bg-slate-100 border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:border-slate-900"
                        title="เลือกป้ายที่รถจอดอยู่ — ปุ่มลงจะกดได้เมื่อถึงป้ายลงแล้ว"
                      >
                        <option value="">— ยังไม่ระบุ —</option>
                        {routeStops.map((rs) => (
                          <option key={rs.route_stop_id} value={rs.route_stop_id}>
                            {rs.order}. {getStopById(rs.stop_id)?.name ?? `ป้าย ${rs.order}`}
                          </option>
                        ))}
                      </select>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowPassengerStops((open) => !open)}
                      className="w-full px-3 py-2 flex items-center gap-1.5 text-[11px] font-semibold text-slate-700 hover:text-slate-900"
                    >
                      <MapPin className="w-3.5 h-3.5 text-slate-500" />
                      <span>ตารางขึ้น-ลงตามจุดจอด ({routeStops.length})</span>
                      <ChevronDown className={`w-3.5 h-3.5 ml-auto text-slate-400 transition-transform ${showPassengerStops ? 'rotate-180' : ''}`} />
                    </button>
                    {showPassengerStops && (
                      <div className="p-2 border-t border-slate-100 bg-slate-50 space-y-1 text-xs">
                        {routeStops.length === 0 ? (
                          <div className="text-[10px] text-slate-400 text-center py-2">ยังไม่มีข้อมูลจุดจอดของรอบนี้</div>
                        ) : (
                          renderStopManifest(routeStops, activeStopManifest, tripBookings)
                        )}
                      </div>
                    )}
                  </div>

                  {manifestPassengers.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
                      {currentRouteStopId == null
                        ? 'กรุณาเลือกป้ายปัจจุบันก่อน จึงจะเห็นรายชื่อผู้โดยสารของป้ายนั้น'
                        : 'ไม่พบรายการผู้โดยสารของป้ายนี้'}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {manifestPassengers.map((b) => {
                        const passenger = users.find((u) => u.user_id === b.user_id);
                        const isChecked = b.is_checked_in || b.status === 2 || b.status === 3;
                        const currentStatus = resolveTicketActionStatus(b, activeTrip);
                        // ล็อกตามป้าย: ห้ามกดลงก่อนถึงป้ายลง (กันกดตั้งแต่ต้นทาง)
                        // ใช้ลำดับป้ายเทียบกับป้ายปัจจุบันที่เลือกไว้ ถ้ายังไม่เลือกถือว่ายังไม่ถึง
                        const dropRs = b.dropoff_route_stop_id ?? null;
                        const dropOrder = dropRs == null ? null : (routeStops.find((rs) => rs.route_stop_id === dropRs)?.order ?? null);
                        const currentOrder = currentRouteStopId == null ? null : (routeStops.find((rs) => rs.route_stop_id === currentRouteStopId)?.order ?? null);
                        const reachedDrop = dropOrder != null && currentOrder != null && currentOrder >= dropOrder;

                        return (
                          <div
                            key={b.booking_id}
                            className={`p-3 rounded-xl border transition-all ${
                              isChecked
                                ? 'bg-emerald-50/60 border-emerald-200'
                                : 'bg-white border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-mono text-xs font-bold text-slate-900">#{b.booking_id}</span>
                                  <TicketStatusBadge status={currentStatus} />
                                </div>
                                <div className="text-xs font-bold text-slate-900 mt-1">
                                  {passenger?.name || 'ผู้โดยสาร'}
                                </div>
                                <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                                  <span>ที่นั่ง: <strong className="text-slate-800 font-mono">{b.seat_count}</strong></span>
                                  {passenger?.phone && (
                                    <a href={`tel:${passenger.phone}`} className="text-slate-600 hover:underline flex items-center gap-0.5 font-mono">
                                      <Phone className="w-2.5 h-2.5" />
                                      <span>{passenger.phone}</span>
                                    </a>
                                  )}
                                </div>
                              </div>

                              {canEditCurrent && (
                                !isChecked ? (
                                  <button
                                    type="button"
                                  onClick={() => handleScanTicket(apiMode ? (b.booking_code || '') : b.booking_id)}
                                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shrink-0"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                    <span>เช็คอิน</span>
                                  </button>
                                ) : Boolean(b.alighted_at) ? (
                                  <div className="text-[11px] font-semibold text-sky-700 flex items-center gap-1 bg-sky-100/70 px-2 py-1 rounded-md shrink-0">
                                    <CheckCheck className="w-3.5 h-3.5" />
                                    <span>ลงแล้ว ✓{(() => {
                                      const raw = String(b.alighted_at ?? '');
                                      const m = raw.match(/(\d{1,2}):(\d{2})/);
                                      return m ? ` (${m[1].padStart(2, '0')}:${m[2]})` : '';
                                    })()}</span>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    title={reachedDrop ? 'ยืนยันลงแล้ว — ลงทั้งใบจองพร้อมกัน' : 'ยังไม่ถึงป้ายลง — เลือกป้ายปัจจุบันให้ถึงป้ายลงก่อน'}
                                    disabled={!reachedDrop}
                                    onClick={() => {
                                      if (!activeTrip || !reachedDrop) return;
                                      // ส่งป้ายปัจจุบันไปด้วย ถ้าลงไม่ตรงที่จอง backend จะเก็บจุดที่ลงจริงไว้
                                      const alightRs = currentRouteStopId ?? b.dropoff_route_stop_id ?? b.dropoff_stop_id ?? undefined;
                                      if (apiMode) void apiAlightBooking(activeTrip.trip_id, b.booking_id, alightRs).catch((e) => setScanFeedback({ type: 'error', message: e instanceof Error ? e.message : 'Unable to alight booking' }));
                                      else alightBooking(b.booking_id, alightRs);
                                    }}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 shrink-0 ${reachedDrop ? 'bg-sky-600 hover:bg-sky-700 text-white' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                                  >
                                    <ArrowRight className="w-3.5 h-3.5" />
                                    <span>ยืนยันลงแล้ว</span>
                                  </button>
                                )
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => setActiveTab('scan')}
                    className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>เปิดกล้องสแกน QR</span>
                  </button>
                </div>
              )}
            </div>

            {/* ==================== BOTTOM TAB NAV ==================== */}
            <div className="bg-white border-t border-slate-200 px-3 py-2 flex items-center justify-around shrink-0 shadow-sm">
              <button
                onClick={() => setActiveTab('trips')}
                className={`flex-1 flex flex-col items-center gap-0.5 py-0.5 transition-colors relative ${
                  activeTab === 'trips' ? 'text-slate-900' : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                <div className="relative">
                  <Calendar className="w-5 h-5" />
                  <span className="absolute -top-1 -right-2 bg-slate-900 text-white text-[8px] px-1 rounded-full font-bold">
                    {displayTrips.length}
                  </span>
                </div>
                <span className="text-[10px] font-semibold">รอบรถ</span>
                {activeTab === 'trips' && <div className="w-7 h-0.5 bg-slate-900 rounded-full mt-0.5" />}
              </button>

              <button
                onClick={() => setActiveTab('scan')}
                className={`flex-1 flex flex-col items-center gap-0.5 py-0.5 transition-colors relative ${
                  activeTab === 'scan' ? 'text-slate-900' : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                <div
                  className={`p-1 rounded-lg transition-transform ${
                    activeTab === 'scan' ? 'bg-slate-900 text-white shadow-sm scale-105' : 'text-slate-400'
                  }`}
                >
                  <QrCode className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-semibold">สแกน</span>
                {activeTab === 'scan' && <div className="w-7 h-0.5 bg-slate-900 rounded-full mt-0.5" />}
              </button>

              <button
                onClick={() => setActiveTab('passengers')}
                className={`flex-1 flex flex-col items-center gap-0.5 py-0.5 transition-colors relative ${
                  activeTab === 'passengers' ? 'text-slate-900' : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                <div className="relative">
                  <Users className="w-5 h-5" />
                  {pendingSeats > 0 && (
                    <span className="absolute -top-1 -right-2.5 bg-amber-500 text-white text-[8px] px-1 rounded-full font-bold">
                      {pendingSeats}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-semibold">รายชื่อ</span>
                {activeTab === 'passengers' && <div className="w-7 h-0.5 bg-slate-900 rounded-full mt-0.5" />}
              </button>
            </div>

            <div className="bg-white pb-2 pt-0.5 flex justify-center shrink-0">
              <div className="w-28 h-1 bg-slate-900/60 rounded-full" />
            </div>
          </div>
        </div>
      </div>

      {/* ==================== TRIP SUMMARY MODAL ==================== */}
      {tripSummaryResult && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-5 max-w-sm w-full relative shadow-2xl space-y-4">
            <button
              onClick={() => setTripSummaryResult(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">ปิดรอบเรียบร้อย</h3>
                <p className="text-[11px] text-slate-500">
                  รอบ #{tripSummaryResult.tripId} · {tripRoute?.name}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-2.5">
                <div className="text-[10px] text-emerald-800 font-bold">ขึ้นรถจริง</div>
                <div className="text-xl font-bold text-emerald-700 mt-0.5">
                  {tripSummaryResult.totalBoarded} คน
                </div>
              </div>
              <div className="bg-sky-50 border border-sky-200 rounded-2xl p-2.5">
                <div className="text-[10px] text-sky-800 font-bold">ลงรถแล้ว</div>
                <div className="text-xl font-bold text-sky-700 mt-0.5">
                  {tripSummaryResult.totalAlighted ?? tripSummaryResult.totalBoarded} คน
                </div>
              </div>
              <div
                className={`rounded-2xl p-2.5 border col-span-2 ${
                  tripSummaryResult.noShows.length > 0
                    ? 'bg-amber-50 border-amber-200 text-amber-900'
                    : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                <div className="text-[10px] font-bold">ไม่มา (No-Show)</div>
                <div
                  className={`text-xl font-bold mt-0.5 ${
                    tripSummaryResult.noShows.length > 0 ? 'text-amber-700' : 'text-slate-600'
                  }`}
                >
                  {tripSummaryResult.noShows.reduce((s, b) => s + b.seat_count, 0)} คน
                </div>
              </div>
            </div>

            {(tripSummaryResult.notAlighted ?? []).length > 0 && (
              <div className="space-y-1.5 text-xs">
                <div className="font-bold text-slate-800 flex items-center gap-1 text-[11px]">
                  <AlertCircle className="w-3.5 h-3.5 text-sky-600" />
                  <span>ขึ้นแล้วแต่ยังไม่กดลง:</span>
                </div>
                <div className="max-h-28 overflow-y-auto space-y-1.5 pr-1">
                  {(tripSummaryResult.notAlighted ?? []).map((b) => (
                    <div
                      key={b.booking_id}
                      className="p-2 bg-sky-50/70 border border-sky-200 rounded-xl text-[11px] flex items-center justify-between"
                    >
                      <span className="font-bold text-slate-900 truncate max-w-[170px]">
                        #{b.booking_id} {b.passenger_name}
                      </span>
                      <span className="font-mono text-sky-800 font-bold bg-sky-100 px-1.5 py-0.5 rounded text-[10px]">
                        {b.seat_count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-1.5 text-xs">
              <div className="font-bold text-slate-800 flex items-center gap-1 text-[11px]">
                <UserX className="w-3.5 h-3.5 text-amber-600" />
                <span>รายชื่อผู้โดยสารที่ไม่มา:</span>
              </div>
              {tripSummaryResult.noShows.length === 0 ? (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-center text-xs text-emerald-800 font-medium">
                  🎉 ผู้โดยสารมาครบทุกคน
                </div>
              ) : (
                <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                  {tripSummaryResult.noShows.map((b) => (
                      <div
                        key={b.booking_id}
                        className="p-2 bg-amber-50/70 border border-amber-200 rounded-xl text-[11px] flex items-center justify-between"
                      >
                        <span className="font-bold text-slate-900 truncate max-w-[170px]">
                          #{b.booking_id} {b.passenger_name}
                        </span>
                        <span className="font-mono text-amber-800 font-bold bg-amber-100 px-1.5 py-0.5 rounded text-[10px]">
                          {b.seat_count}
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setTripSummaryResult(null)}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl"
            >
              รับทราบ
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
