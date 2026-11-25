import React, { useState, useEffect } from 'react';
import { useBus } from '../../../context/BusContext';
import { resolveTicketActionStatus, Booking, TripSummaryNoShow } from '../../../types/schema';
import { TicketStatusBadge } from '../TicketStatusBadge';
import {
  Bus,
  CheckCircle2,
  QrCode,
  Users,
  MapPin,
  Clock,
  Search,
  Check,
  Play,
  CheckCheck,
  X,
  UserX,
  Lock,
  Filter,
  XCircle,
} from 'lucide-react';

interface CheckInScannerViewProps {
  canEdit?: boolean;
  filterDriverId?: string;
}

export const CheckInScannerView: React.FC<CheckInScannerViewProps> = ({
  canEdit = true,
  filterDriverId,
}) => {
  const {
    trips,
    routes,
    stops,
    vehicles,
    users,
    bookings,
    checkInBooking,
    getStopsForRoute,
    startTrip,
    finishTrip,
    verifyTicketForTrip,
  } = useBus();

  const relevantTrips = filterDriverId
    ? trips.filter((t) => t.driver_id === filterDriverId)
    : trips;

  // ป้ายปัจจุบันที่รถจอดอยู่ — บังคับเลือกก่อนเช็กอิน (กฎเดียวกับหน้าคนขับ + backend)
  const [currentRouteStopId, setCurrentRouteStopId] = useState<number | null>(null);

  const [selectedTripId, setSelectedTripId] = useState<number>(
    relevantTrips.length > 0 ? relevantTrips[0].trip_id : 0
  );

  useEffect(() => {
    if (relevantTrips.length > 0 && !relevantTrips.some((t) => t.trip_id === selectedTripId)) {
      setSelectedTripId(relevantTrips[0].trip_id);
    }
  }, [filterDriverId, relevantTrips, selectedTripId]);

  // เปลี่ยนรอบ = รีเซ็ตป้ายปัจจุบัน (กันเอาป้ายรอบเก่าไปเช็กอินรอบใหม่)
  useEffect(() => {
    setCurrentRouteStopId(null);
  }, [selectedTripId]);

  const [scanCodeInput, setScanCodeInput] = useState<string>('');
  const [scanFeedback, setScanFeedback] = useState<string | null>(null);
  const [passengerFilter, setPassengerFilter] = useState<'all' | 'pending' | 'checked'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [tripSummaryResult, setTripSummaryResult] = useState<{
    tripId: number;
    totalBoarded: number;
    noShows: TripSummaryNoShow[];
  } | null>(null);

  const activeTrip = trips.find((t) => t.trip_id === selectedTripId);
  const tripRoute = activeTrip ? routes.find((r) => r.route_id === activeTrip.route_id) : null;
  const tripVehicle = activeTrip ? vehicles.find((v) => v.vehicle_id === activeTrip.vehicle_id) : null;
  const tripBookings = bookings.filter((b) => b.trip_id === selectedTripId && b.status !== 0);

  const routeStops = activeTrip ? getStopsForRoute(activeTrip.route_id) : [];

  const totalPassengers = tripBookings.reduce((sum, b) => sum + b.seat_count, 0);
  const checkedInSeats = tripBookings
    .filter((b) => b.is_checked_in || b.status === 2 || b.status === 3)
    .reduce((sum, b) => sum + b.seat_count, 0);
  const pendingSeats = tripBookings
    .filter((b) => !b.is_checked_in && b.status === 1)
    .reduce((sum, b) => sum + b.seat_count, 0);
  const checkedInTicketsCount = tripBookings.filter(
    (b) => b.is_checked_in || b.status === 2 || b.status === 3
  ).length;

  const handleScanOrSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!canEdit) {
      setScanFeedback('🔒 คุณมีสิทธิ์ดูข้อมูลเท่านั้น');
      return;
    }
    if (currentRouteStopId == null) {
      setScanFeedback('❌ กรุณาเลือกป้ายปัจจุบันก่อนเช็กอิน');
      setTimeout(() => setScanFeedback(null), 5000);
      return;
    }
    if (!scanCodeInput.trim()) return;

    const bookingIdNum = Number(scanCodeInput.replace(/\D/g, '')) || Number(scanCodeInput.trim());
    // หน้านี้ mock booking มีแค่ stop_id — map ป้ายปัจจุบันเป็น stop_id ก่อนส่งให้ validator
    const currentStopId = routeStops.find((rs) => rs.route_stop_id === currentRouteStopId)?.stop_id ?? currentRouteStopId;
    const result = verifyTicketForTrip(selectedTripId, bookingIdNum, currentStopId);
    if (result.isValid) {
      if (result.booking) {
        checkInBooking(result.booking.booking_id);
      }
      setScanFeedback(`✅ ${result.message}`);
      setScanCodeInput('');
    } else {
      setScanFeedback(`❌ ${result.message}`);
    }
    setTimeout(() => setScanFeedback(null), 5000);
  };

  const getStopName = (id: number) => stops.find((s) => s.stop_id === id)?.name || `จุดจอด ${id}`;

  const filteredBookings = tripBookings.filter((b) => {
    // กฎเดียวกับหน้าคนขับ: คนรอขึ้นเห็นเฉพาะป้ายปัจจุบัน, คนอยู่บนรถเห็นทุกป้าย
    const isChecked = b.is_checked_in || b.status === 2 || b.status === 3;
    const stillOnboard = isChecked && !b.alighted_at;
    if (currentRouteStopId == null) return false;
    if (stillOnboard) { /* fall through to search filter */ }
    else if (isChecked) return false;
    else {
      // โหมดจำลองของหน้านี้เก็บแค่ stop_id — เทียบผ่าน stop_id ของป้ายปัจจุบันที่เลือกไว้
      const currentStopId = routeStops.find((rs) => rs.route_stop_id === currentRouteStopId)?.stop_id ?? null;
      if (currentStopId != null && b.pickup_stop_id !== currentStopId) return false;
    }
    const passenger = users.find((u) => u.user_id === b.user_id);
    const q = searchQuery.toLowerCase();
    const matchSearch =
      !q ||
      String(b.booking_id).includes(q) ||
      (passenger?.name || '').toLowerCase().includes(q) ||
      (passenger?.username || '').toLowerCase().includes(q);

    if (!matchSearch) return false;
    if (passengerFilter === 'pending') return !b.is_checked_in && b.status === 1;
    if (passengerFilter === 'checked') return b.is_checked_in || b.status === 2 || b.status === 3;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* ============ TRIP SELECTOR ============ */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="text-[11px] text-slate-500 font-mono font-semibold flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                หน้าจอ 14 · Code 8820
              </span>
              {!canEdit && (
                <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[10px]">
                  🔒 Read-Only
                </span>
              )}
            </div>
            <h2 className="text-sm font-bold text-slate-900 mt-1 flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-700" />
              <span>{filterDriverId ? 'เลือกรอบรถที่รับผิดชอบ' : 'เลือกรอบรถที่ต้องการตรวจเช็คอิน'}</span>
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              ทั้งหมด {relevantTrips.length} เที่ยว
            </p>
          </div>
        </div>

        {relevantTrips.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl space-y-2">
            <Bus className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs font-semibold text-slate-600">ไม่มีรอบรถที่ได้รับมอบหมาย</p>
            <p className="text-[11px] text-slate-500">โปรดติดต่อผู้ดูแลระบบเพื่อจัดสรรรอบรถ</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {relevantTrips.map((trip) => {
              const isSelected = trip.trip_id === selectedTripId;
              const v = vehicles.find((x) => x.vehicle_id === trip.vehicle_id);
              const r = routes.find((x) => x.route_id === trip.route_id);
              const tripB = bookings.filter((b) => b.trip_id === trip.trip_id && b.status !== 0);
              const booked = tripB.reduce((s, b) => s + b.seat_count, 0);

              return (
                <button
                  key={trip.trip_id}
                  onClick={() => setSelectedTripId(trip.trip_id)}
                  className={`text-left p-3.5 rounded-xl border transition-all ${
                    isSelected
                      ? 'bg-slate-50 border-slate-900 ring-1 ring-slate-900 shadow-sm'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono text-base font-bold text-slate-900">
                      {trip.departure_time}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                        trip.status === 2
                          ? 'bg-slate-900 text-white border-slate-900 animate-pulse'
                          : trip.status === 3
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-white text-slate-600 border-slate-200'
                      }`}
                    >
                      {trip.status === 2 ? 'กำลังเดินทาง' : trip.status === 3 ? 'เสร็จสิ้น' : 'พร้อม'}
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-500 mb-1">
                    รอบ #{trip.trip_id}
                  </div>
                  <div className="text-xs font-bold text-slate-900 truncate">{r?.name}</div>
                  <div className="text-[10px] text-slate-500 mt-1 truncate">
                    {v?.type} · {v?.license_plate}
                  </div>
                  <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                    <span className="text-slate-500">ผู้โดยสาร</span>
                    <span className="font-mono font-bold text-slate-800">
                      {booked} คน
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ============ MAIN DASHBOARD ============ */}
      {activeTrip && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Dashboard */}
          <div className="lg:col-span-8 space-y-5">
            {/* Trip info + actions */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    รอบรถที่เลือก
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mt-0.5">
                    รอบ #{activeTrip.trip_id} · {tripRoute?.name}
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2 flex-wrap">
                    <span>📅 {activeTrip.service_date}</span>
                    <span>·</span>
                    <span className="font-mono font-bold text-slate-700">
                      🕐 {activeTrip.departure_time} น.
                    </span>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {canEdit ? (
                    activeTrip.status === 1 ? (
                      <button
                        onClick={() => {
                          startTrip(activeTrip.trip_id);
                        }}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all shadow-sm"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>เริ่มออกรถ</span>
                      </button>
                    ) : activeTrip.status === 2 ? (
                      <button
                        onClick={() => {
                          const result = finishTrip(activeTrip.trip_id);
                          setTripSummaryResult({
                            tripId: activeTrip.trip_id,
                            totalBoarded: result.totalBoarded,
                            noShows: result.noShows,
                          });
                        }}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all shadow-sm"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                        <span>ปิดงาน/สิ้นสุดรอบ</span>
                      </button>
                    ) : (
                      <span className="text-[11px] text-slate-600 font-semibold bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg">
                        สิ้นสุดการเดินทางแล้ว
                      </span>
                    )
                  ) : (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-500 rounded-xl text-[11px] font-semibold border border-slate-200">
                      <Lock className="w-3 h-3" />
                      <span>Read-Only</span>
                    </div>
                  )}
                </div>
              </div>

              {/* KPI Cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                    ผู้โดยสารทั้งหมด
                  </div>
                  <div className="text-xl font-bold text-slate-900 mt-1">
                    {totalPassengers}
                    <span className="text-xs font-normal text-slate-500 ml-1">คน</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {tripBookings.length} ใบจอง · {tripVehicle?.capacity} ที่
                  </div>
                </div>

                <div className="bg-emerald-50 p-3.5 rounded-xl border border-emerald-200">
                  <div className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider">
                    เช็คอินแล้ว
                  </div>
                  <div className="text-xl font-bold text-emerald-700 mt-1">
                    {checkedInSeats}
                    <span className="text-xs font-normal text-emerald-600 ml-1">คน</span>
                  </div>
                  <div className="text-[10px] text-emerald-700 mt-0.5 font-medium">
                    {totalPassengers > 0
                      ? Math.round((checkedInSeats / totalPassengers) * 100)
                      : 0}
                    % ({checkedInTicketsCount} ใบ)
                  </div>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <div className="text-[10px] text-slate-600 font-bold uppercase tracking-wider">
                    รอเช็คอิน
                  </div>
                  <div className="text-xl font-bold text-slate-800 mt-1">
                    {pendingSeats}
                    <span className="text-xs font-normal text-slate-500 ml-1">คน</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">พร้อมรับที่จุดจอด</div>
                </div>
              </div>

              {/* Stop breakdown */}
              {routeStops.length > 0 && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                  <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-600" />
                    <span>จำนวนผู้โดยสารแยกตามจุดจอด</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {routeStops.map((st, idx) => {
                      const boardCount = tripBookings
                        .filter((b) => b.pickup_stop_id === st.stop_id)
                        .reduce((s, b) => s + b.seat_count, 0);
                      const dropCount = tripBookings
                        .filter((b) => b.dropoff_stop_id === st.stop_id)
                        .reduce((s, b) => s + b.seat_count, 0);

                      return (
                        <div
                          key={`${st.stop_id}-${st.order}-${idx}`}
                          className="flex items-center justify-between text-[11px] py-1.5 px-2.5 rounded-lg bg-white border border-slate-200"
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center text-[10px] font-bold shrink-0">
                              {st.order}
                            </span>
                            <span className="font-semibold text-slate-800 truncate">
                              {st.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span
                              className={`text-[10px] ${
                                boardCount > 0 ? 'text-emerald-700 font-bold' : 'text-slate-400'
                              }`}
                            >
                              ↑ {boardCount}
                            </span>
                            <span
                              className={`text-[10px] ${
                                dropCount > 0 ? 'text-rose-700 font-bold' : 'text-slate-400'
                              }`}
                            >
                              ↓ {dropCount}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Passenger Manifest */}
              <div className="space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-slate-600" />
                    <span>รายชื่อผู้โดยสาร (Manifest)</span>
                  </h4>
                  <span className="text-[11px] text-slate-500">
                    {filteredBookings.length} / {tripBookings.length} รายการ
                  </span>
                </div>

                {/* ป้ายปัจจุบัน — บังคับเลือกก่อนเช็กอิน เห็นเฉพาะคนจองขึ้นป้ายนี้ */}
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="text-[11px] font-semibold text-slate-700">ป้ายปัจจุบัน</span>
                  <select
                    value={currentRouteStopId ?? ''}
                    onChange={(e) => setCurrentRouteStopId(e.target.value === '' ? null : Number(e.target.value))}
                    className="ml-auto text-[11px] font-semibold text-slate-900 bg-white border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:border-slate-900"
                    title="เลือกป้ายที่รถจอดอยู่ — เช็กอินได้เฉพาะตั๋วป้ายนี้"
                  >
                    <option value="">— ยังไม่ระบุ —</option>
                    {routeStops.map((rs) => (
                      <option key={rs.route_stop_id} value={rs.route_stop_id}>
                        {rs.order}. {getStopName(rs.stop_id)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="ค้นหาชื่อ, ที่นั่ง, รหัสตั๋ว..."
                      className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-900/10"
                    />
                  </div>
                  <div className="flex items-center gap-0.5 bg-slate-100 p-0.5 rounded-lg text-[11px]">
                    <button
                      onClick={() => setPassengerFilter('all')}
                      className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                        passengerFilter === 'all'
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      ทั้งหมด ({tripBookings.length})
                    </button>
                    <button
                      onClick={() => setPassengerFilter('pending')}
                      className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                        passengerFilter === 'pending'
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      รอขึ้น ({pendingSeats})
                    </button>
                    <button
                      onClick={() => setPassengerFilter('checked')}
                      className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                        passengerFilter === 'checked'
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      ขึ้นแล้ว ({checkedInSeats})
                    </button>
                  </div>
                </div>

                {filteredBookings.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-1.5">
                    <Users className="w-6 h-6 text-slate-300 mx-auto" />
                    <p className="text-xs font-semibold text-slate-600">
                      {tripBookings.length === 0
                        ? 'ยังไม่มีผู้โดยสารจองรอบนี้'
                        : currentRouteStopId == null
                          ? 'กรุณาเลือกป้ายปัจจุบันก่อน จึงจะเห็นรายชื่อผู้โดยสารของป้ายนั้น'
                          : 'ไม่พบรายการที่ตรงเงื่อนไข'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                    {filteredBookings.map((b) => {
                      const passenger = users.find((u) => u.user_id === b.user_id);
                      const ticketStatus = resolveTicketActionStatus(b, activeTrip);
                      const isCheckedIn = ticketStatus === 'เช็กอินแล้ว';
                      const isCompleted = ticketStatus === 'เสร็จสิ้น';
                      const isNoShow = ticketStatus === 'ไม่ได้ขึ้นรถ';
                      const isCancelled = ticketStatus === 'ยกเลิก';
                      const isConfirmed = ticketStatus === 'จองสำเร็จ';

                      return (
                        <div
                          key={b.booking_id}
                          className={`p-3 rounded-xl border transition-all ${
                            isCheckedIn
                              ? 'bg-emerald-50/40 border-emerald-200'
                              : isCompleted
                              ? 'bg-slate-50/60 border-slate-200'
                              : isNoShow
                              ? 'bg-amber-50/40 border-amber-200'
                              : isCancelled
                              ? 'bg-rose-50/30 border-rose-200'
                              : 'bg-white border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="space-y-1 min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-mono text-[11px] font-bold bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded border border-slate-200">
                                  #{b.booking_id}
                                </span>
                                <span className="text-sm font-bold text-slate-900 truncate">
                                  {passenger?.name || 'ผู้โดยสาร'}
                                </span>
                                <span className="text-[10px] text-slate-500">
                                  ({passenger?.user_type})
                                </span>
                                <span className="text-[10px] font-bold bg-white text-slate-800 border border-slate-200 px-1.5 py-0.5 rounded font-mono">
                                  {b.seat_count}
                                </span>
                                <TicketStatusBadge status={ticketStatus} size="sm" />
                              </div>

                              <div className="text-[11px] text-slate-600 flex items-center gap-3 flex-wrap">
                                <span>
                                  รหัส:{' '}
                                  <strong className="text-slate-800 font-mono">
                                    {passenger?.username}
                                  </strong>
                                </span>
                                <span>
                                  โทร:{' '}
                                  <strong className="text-slate-800">{passenger?.phone}</strong>
                                </span>
                                <span>
                                  ขึ้น:{' '}
                                  <strong className="text-emerald-700">
                                    {getStopName(b.pickup_stop_id)}
                                  </strong>
                                </span>
                                <span>
                                  ลง:{' '}
                                  <strong className="text-rose-700">
                                    {getStopName(b.dropoff_stop_id)}
                                  </strong>
                                </span>
                              </div>
                            </div>

                            {/* Action button */}
                            <div className="flex items-center gap-2 shrink-0">
                              {isConfirmed ? (
                                canEdit ? (
                                  <button
                                    onClick={() => checkInBooking(b.booking_id)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[11px] font-bold transition-all"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                    <span>ยืนยันเช็คอิน</span>
                                  </button>
                                ) : (
                                  <span className="text-[10px] text-slate-500 font-semibold bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg">
                                    รอขึ้นรถ
                                  </span>
                                )
                              ) : isCheckedIn ? (
                                <div className="flex items-center gap-1 text-emerald-800 text-[11px] font-bold px-3 py-1.5 rounded-lg bg-emerald-100 border border-emerald-200">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>ขึ้นรถแล้ว</span>
                                </div>
                              ) : isCompleted ? (
                                <span className="text-[10px] text-sky-800 font-semibold bg-sky-50 border border-sky-200 px-2.5 py-1 rounded-lg">
                                  สิ้นสุดรอบ
                                </span>
                              ) : isNoShow ? (
                                <span className="text-[10px] text-amber-900 font-semibold bg-amber-100 border border-amber-300 px-2.5 py-1 rounded-lg">
                                  ไม่ได้ขึ้นรถ
                                </span>
                              ) : (
                                <span className="text-[10px] text-rose-700 font-semibold bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-lg">
                                  ยกเลิกแล้ว
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right: QR Scanner Simulator */}
          <div className="lg:col-span-4 space-y-5">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0">
                  <QrCode className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">สแกน QR Code</h3>
                  <p className="text-[10px] text-slate-500">จำลองกล้องสแกนตั๋วผู้โดยสาร</p>
                </div>
              </div>

              {/* Viewfinder */}
              <div className="relative w-full aspect-square bg-slate-950 rounded-2xl border-2 border-dashed border-slate-700 flex items-center justify-center overflow-hidden">
                <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-lg shadow-emerald-400/50 animate-scanline pointer-events-none" />
                <div className="absolute top-3 left-3 w-5 h-5 border-t-2 border-l-2 border-emerald-400" />
                <div className="absolute top-3 right-3 w-5 h-5 border-t-2 border-r-2 border-emerald-400" />
                <div className="absolute bottom-3 left-3 w-5 h-5 border-b-2 border-l-2 border-emerald-400" />
                <div className="absolute bottom-3 right-3 w-5 h-5 border-b-2 border-r-2 border-emerald-400" />

                <div className="text-center space-y-1.5 z-10">
                  <QrCode className="w-12 h-12 text-slate-600 mx-auto animate-pulse" />
                  <div className="text-[11px] text-slate-400">
                    หันกล้องไปที่ QR Code บนตั๋ว
                  </div>
                </div>
              </div>

              {/* Scan Form */}
              <form onSubmit={handleScanOrSubmit} className="space-y-2.5">
                <div className="text-[11px] text-slate-600 font-semibold">
                  หรือพิมพ์รหัสตั๋ว:
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    placeholder="เช่น 90002"
                    value={scanCodeInput}
                    onChange={(e) => setScanCodeInput(e.target.value)}
                    className="flex-1 bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-900/10 font-mono"
                  />
                  <button
                    type="submit"
                    disabled={!canEdit}
                    className={`px-4 py-2 font-bold rounded-lg text-xs transition-all flex items-center gap-1.5 ${
                      canEdit
                        ? 'bg-slate-900 hover:bg-slate-800 text-white'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>สแกน</span>
                  </button>
                </div>

                {/* Quick test */}
                {tripBookings.length > 0 && (
                  <div className="pt-1">
                    <div className="text-[10px] text-slate-500 mb-1.5">ทดสอบเร็ว:</div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {tripBookings.slice(0, 4).map((b) => {
                        const isDone = b.is_checked_in || b.status === 2 || b.status === 3;
                        return (
                          <button
                            key={b.booking_id}
                            type="button"
                            onClick={() => setScanCodeInput(String(b.booking_id))}
                            disabled={isDone}
                            className={`text-[10px] px-2 py-1 rounded-lg border font-mono transition-all ${
                              isDone
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 cursor-not-allowed'
                                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            #{b.booking_id} {isDone ? '✓' : ''}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </form>

              {/* Feedback */}
              {scanFeedback && (
                <div
                  className={`p-3 rounded-xl text-xs font-semibold ${
                    scanFeedback.includes('✅')
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}
                >
                  {scanFeedback}
                </div>
              )}

              {/* Vehicle info */}
              <div className="pt-3 border-t border-slate-100 space-y-2 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-500">ยานพาหนะ</span>
                  <span className="font-bold text-slate-800">
                    {tripVehicle?.type} · {tripVehicle?.license_plate}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">ความจุ</span>
                  <span className="font-bold text-slate-800">
                    {tripVehicle?.capacity} ที่นั่ง
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">สถานะรถ</span>
                  <span className="text-emerald-700 font-bold">พร้อมบริการ</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============ TRIP SUMMARY MODAL ============ */}
      {tripSummaryResult && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-lg w-full relative shadow-2xl space-y-5">
            <button
              onClick={() => setTripSummaryResult(null)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-full"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">ปิดรอบเรียบร้อย</h3>
                <p className="text-xs text-slate-500">
                  รอบ #{tripSummaryResult.tripId} · {tripRoute?.name}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center">
                <div className="text-[11px] text-emerald-800 font-semibold">ขึ้นรถจริง</div>
                <div className="text-2xl font-bold text-emerald-700 mt-0.5">
                  {tripSummaryResult.totalBoarded} คน
                </div>
              </div>
              <div
                className={`rounded-xl p-3 text-center border ${
                  tripSummaryResult.noShows.length > 0
                    ? 'bg-amber-50 border-amber-200 text-amber-900'
                    : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                <div className="text-[11px] font-semibold">ไม่มา (No-Show)</div>
                <div
                  className={`text-2xl font-bold mt-0.5 ${
                    tripSummaryResult.noShows.length > 0 ? 'text-amber-700' : 'text-slate-600'
                  }`}
                >
                  {tripSummaryResult.noShows.reduce((s, b) => s + b.seat_count, 0)} คน
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  ({tripSummaryResult.noShows.length} รายการ)
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <UserX className="w-4 h-4 text-slate-500" />
                <span>รายชื่อผู้ไม่มา:</span>
              </div>

              {tripSummaryResult.noShows.length === 0 ? (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center text-xs text-emerald-800 font-medium">
                  🎉 ผู้โดยสารมาขึ้นรถครบทุกคน
                </div>
              ) : (
                <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                  {tripSummaryResult.noShows.map((b) => (
                      <div
                        key={b.booking_id}
                        className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-slate-900">
                            #{b.booking_id} {b.passenger_name}
                          </span>
                          <span className="font-mono text-slate-700 font-bold bg-white px-2 py-0.5 rounded border border-slate-200">
                            {b.seat_count} ที่นั่ง
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-600 flex items-center justify-between">
                          <span>จุดขึ้น: <strong>{getStopName(b.pickup_stop_id ?? 0)}</strong></span>
                          <span>โทร: <strong>{b.passenger_phone || '-'}</strong></span>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setTripSummaryResult(null)}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl"
              >
                รับทราบ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
