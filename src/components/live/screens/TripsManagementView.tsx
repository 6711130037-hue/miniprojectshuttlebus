import React, { useState } from 'react';
import { useBus } from '../../../context/BusContext';
import {
  Calendar,
  Clock,
  Plus,
  AlertCircle,
  CheckCircle,
  XCircle,
  Lock,
  Bus,
  X,
  Search,
  Filter,
  Navigation,
  User,
} from 'lucide-react';

interface TripsManagementViewProps {
  canEdit?: boolean;
}

export const TripsManagementView: React.FC<TripsManagementViewProps> = ({ canEdit = true }) => {
  const {
    trips,
    routes,
    employees,
    vehicles,
    apiMode,
    apiCreateTrips,
    addTrip,
    updateTrip,
    updateTripStatus,
    checkTripConflict,
    getRouteById,
    getEmployeeById,
    getVehicleById,
    canViewScreen,
  } = useBus();

  const [showAddTripModal, setShowAddTripModal] = useState(false);
  const [editingTrip, setEditingTrip] = useState<null | {
    trip_id: number;
    route_id: number;
    service_date: string;
    departure_time: string;
    driver_id: string;
    vehicle_id: string;
  }>(null);
  const [newTripRouteId, setNewTripRouteId] = useState<number>(1);
  const [newTripDate, setNewTripDate] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const [newTripTimes, setNewTripTimes] = useState<string[]>(['07:00', '10:00', '13:00', '16:00', '19:00', '22:00']);
  const [newTripDriverId, setNewTripDriverId] = useState<string>('00002');
  const [newTripVehicleId, setNewTripVehicleId] = useState<string>('001');
  const [formConflictError, setFormConflictError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [isCreatingTrips, setIsCreatingTrips] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'running' | 'done' | 'cancelled'>('all');

  const handleEditTripSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit || !editingTrip) return;

    if (!editingTrip.service_date || !editingTrip.departure_time) {
      setFormConflictError('กรุณาเลือกวันที่และเวลาออกให้ครบ');
      return;
    }
    const conflictResult = checkTripConflict(
      editingTrip.route_id,
      editingTrip.driver_id,
      editingTrip.vehicle_id,
      editingTrip.service_date,
      editingTrip.departure_time,
      editingTrip.trip_id,
    );
    if (conflictResult.hasConflict) {
      setFormConflictError(conflictResult.reason || 'เกิดข้อขัดแย้งในการจัดรอบรถ');
      return;
    }

    try {
      if (apiMode) {
        await updateTrip(editingTrip.trip_id, {
          route_id: editingTrip.route_id,
          service_date: editingTrip.service_date,
          departure_time: editingTrip.departure_time,
          driver_id: editingTrip.driver_id,
          vehicle_id: editingTrip.vehicle_id,
        });
      } else {
        await Promise.resolve(updateTrip(editingTrip.trip_id, {
          route_id: editingTrip.route_id,
          service_date: editingTrip.service_date,
          departure_time: editingTrip.departure_time,
          driver_id: editingTrip.driver_id,
          vehicle_id: editingTrip.vehicle_id,
        }));
      }
      setEditingTrip(null);
      setSuccessNotice(`แก้ไขรอบรถ #${editingTrip.trip_id} สำเร็จ`);
      setTimeout(() => setSuccessNotice(null), 5000);
    } catch (error) {
      setFormConflictError(error instanceof Error ? error.message : 'แก้ไขรอบรถไม่สำเร็จ');
    }
  };

  const handleCreateTripSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit || isCreatingTrips) return;
    const times = newTripTimes.map((time) => time.trim());
    if (!newTripDate || times.length === 0 || times.some((time) => !time)) {
      setFormConflictError('กรุณาเลือกวันที่และเวลาออกให้ครบทุกเที่ยว');
      return;
    }
    if (new Set(times).size !== times.length) {
      setFormConflictError('มีเวลาออกซ้ำกัน กรุณาเลือกเวลาให้แตกต่างกัน');
      return;
    }

    const routeDuration = Math.max(1, routes.find((route) => route.route_id === newTripRouteId)?.total_time ?? 30);
    const sortedTimes = [...times].sort();
    for (let index = 0; index < sortedTimes.length; index++) {
      const time = sortedTimes[index];
      const conflictResult = checkTripConflict(
        newTripRouteId,
        newTripDriverId,
        newTripVehicleId,
        newTripDate,
        time,
      );
      if (conflictResult.hasConflict) {
        setFormConflictError(`${time} น. ${conflictResult.reason || 'เกิดข้อขัดแย้งในการจัดรอบรถ'}`);
        return;
      }
      if (index > 0) {
        const [previousHour, previousMinute] = sortedTimes[index - 1].split(':').map(Number);
        const [currentHour, currentMinute] = time.split(':').map(Number);
        if (currentHour * 60 + currentMinute < previousHour * 60 + previousMinute + routeDuration) {
          setFormConflictError(`รอบ ${sortedTimes[index - 1]} และ ${time} น. ใช้คนขับและรถคันเดียวกันในช่วงเวลาทับซ้อน`);
          return;
        }
      }
    }

    setIsCreatingTrips(true);
    setFormConflictError(null);
    try {
      let createdTrips;
      if (apiMode) {
        createdTrips = await apiCreateTrips({
          route_id: newTripRouteId,
          service_date: newTripDate,
          departure_times: times,
          driver_id: newTripDriverId,
          vehicle_id: newTripVehicleId,
        });
      } else {
        createdTrips = times.map((departure_time) => addTrip({
          route_id: newTripRouteId,
          service_date: newTripDate,
          departure_time,
          driver_id: newTripDriverId,
          vehicle_id: newTripVehicleId,
          status: 1,
        }));
      }
      setShowAddTripModal(false);
      setSuccessNotice(`สร้างรอบรถ ${createdTrips.length} รอบ สำเร็จ (${times.sort().join(', ')} น.)`);
      setTimeout(() => setSuccessNotice(null), 5000);
    } catch (error) {
      setFormConflictError(error instanceof Error ? error.message : 'สร้างรอบรถไม่สำเร็จ');
    } finally {
      setIsCreatingTrips(false);
    }
  };

  const filteredTrips = trips.filter((t) => {
    const r = getRouteById(t.route_id);
    const drv = getEmployeeById(t.driver_id);
    const veh = getVehicleById(t.vehicle_id);
    const q = searchQuery.toLowerCase();

    const matchSearch =
      !q ||
      String(t.trip_id).includes(q) ||
      (r?.name || '').toLowerCase().includes(q) ||
      (drv?.fullname || '').toLowerCase().includes(q) ||
      (veh?.license_plate || '').toLowerCase().includes(q) ||
      t.service_date.includes(q);

    if (!matchSearch) return false;

    if (statusFilter === 'all') return true;
    if (statusFilter === 'open') return t.status === 1;
    if (statusFilter === 'running') return t.status === 2;
    if (statusFilter === 'done') return t.status === 3;
    if (statusFilter === 'cancelled') return t.status === 0;
    return true;
  });

  const getStatusBadge = (status: number) => {
    switch (status) {
      case 1:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle className="w-3 h-3" />
            เปิดให้จอง
          </span>
        );
      case 2:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-900 text-white border border-slate-900">
            <Clock className="w-3 h-3" />
            กำลังเดินทาง
          </span>
        );
      case 3:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
            <CheckCircle className="w-3 h-3" />
            เสร็จสิ้น
          </span>
        );
      case 0:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3 h-3" />
            ยกเลิก
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-5 shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="text-[11px] text-slate-500 font-mono font-semibold flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
              หน้าจอ 10 · Code 3456
            </span>
            {!canEdit && (
              <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[10px]">
                🔒 Read-Only
              </span>
            )}
          </div>
          <h2 className="text-lg font-bold text-slate-900 mt-1 flex items-center gap-2">
            <Bus className="w-5 h-5 text-slate-700" />
            <span>ตารางรอบเวลาเดินรถ</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            จัดการตารางเวลาเดินรถ พร้อมตรวจจับคิวชนกัน (Conflict Detection)
          </p>
        </div>

        {canEdit ? (
          <button
            onClick={() => {
              setFormConflictError(null);
              const activeRoute = routes.find((route) => route.status === 1) ?? routes[0];
              const activeDriver = employees.find((employee) => canViewScreen(14, employee.position_id));
              const activeVehicle = vehicles.find((vehicle) => vehicle.status === 1) ?? vehicles[0];
              if (activeRoute) setNewTripRouteId(activeRoute.route_id);
              if (activeDriver) setNewTripDriverId(activeDriver.employee_id);
              if (activeVehicle) setNewTripVehicleId(activeVehicle.vehicle_id);
              setShowAddTripModal(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-sm transition-all shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>เพิ่มรอบรถใหม่</span>
          </button>
        ) : (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-500 rounded-xl text-xs font-medium border border-slate-200 shrink-0">
            <Lock className="w-3.5 h-3.5" />
            <span>ไม่มีสิทธิ์แก้ไข</span>
          </div>
        )}
      </div>

      {/* Success Notice */}
      {successNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            {successNotice}
          </span>
          <button
            onClick={() => setSuccessNotice(null)}
            className="text-emerald-700 hover:text-emerald-900 font-bold"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-200">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหา: รหัสรอบ, เส้นทาง, คนขับ, ทะเบียนรถ, วันที่..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 text-slate-800 placeholder:text-slate-400"
          />
        </div>
        <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg p-1">
          <Filter className="w-3.5 h-3.5 text-slate-500 ml-1.5" />
          {(
            [
              { v: 'all', label: 'ทั้งหมด' },
              { v: 'open', label: 'เปิดจอง' },
              { v: 'running', label: 'กำลังเดินทาง' },
              { v: 'done', label: 'เสร็จสิ้น' },
              { v: 'cancelled', label: 'ยกเลิก' },
            ] as const
          ).map(({ v, label }) => (
            <button
              key={v}
              onClick={() => setStatusFilter(v)}
              className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all ${
                statusFilter === v
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-left text-xs text-slate-700">
          <thead className="bg-slate-50 text-slate-600 uppercase font-mono text-[10px] border-b border-slate-200">
            <tr>
              <th className="px-3 py-2.5 font-bold tracking-wider">รหัส</th>
              <th className="px-3 py-2.5 font-bold tracking-wider">เส้นทาง</th>
              <th className="px-3 py-2.5 font-bold tracking-wider">วัน-เวลา</th>
              <th className="px-3 py-2.5 font-bold tracking-wider">คนขับ</th>
              <th className="px-3 py-2.5 font-bold tracking-wider">ยานพาหนะ</th>
              <th className="px-3 py-2.5 font-bold tracking-wider">สถานะ</th>
              {canEdit && (
                <th className="px-3 py-2.5 font-bold tracking-wider text-right">การกระทำ</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {filteredTrips.length === 0 ? (
              <tr>
                <td colSpan={canEdit ? 7 : 6} className="p-10 text-center">
                  <div className="space-y-1.5">
                    <Calendar className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="text-sm font-semibold text-slate-600">
                      {searchQuery || statusFilter !== 'all'
                        ? 'ไม่พบรอบรถที่ตรงเงื่อนไข'
                        : 'ยังไม่มีรอบรถในระบบ'}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      ลองแก้ตัวกรอง หรือเพิ่มรอบรถใหม่
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredTrips.map((t, idx) => {
                const r = getRouteById(t.route_id);
                const drv = getEmployeeById(t.driver_id);
                const veh = getVehicleById(t.vehicle_id);

                return (
                  <tr
                    key={t.trip_id}
                    className={`transition-colors hover:bg-slate-50 ${
                      idx % 2 === 1 ? 'bg-slate-50/40' : 'bg-white'
                    }`}
                  >
                    <td className="px-3 py-2.5">
                      <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        #{t.trip_id}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-start gap-1.5">
                        <Navigation className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                        <span className="font-semibold text-slate-800 line-clamp-2">
                          {r?.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex flex-col gap-0.5 text-[11px]">
                        <span className="font-mono font-bold text-slate-900 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {t.departure_time}
                        </span>
                        <span className="text-slate-500 font-mono flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {t.service_date}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-800 truncate">
                            {drv?.fullname}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            ID: {t.driver_id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1.5">
                        <Bus className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-800 truncate">
                            {veh?.license_plate}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {veh?.type} · {veh?.capacity} ที่
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2.5">{getStatusBadge(t.status)}</td>
                    {canEdit && (
                      <td className="px-3 py-2.5 text-right">
                        {t.status === 1 && (
                          <>
                            <button
                              onClick={() => setEditingTrip({
                                trip_id: t.trip_id,
                                route_id: t.route_id,
                                service_date: t.service_date,
                                departure_time: t.departure_time,
                                driver_id: t.driver_id,
                                vehicle_id: t.vehicle_id,
                              })}
                              className="px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors mr-1.5"
                            >
                              แก้ไข
                            </button>
                            <button
                              onClick={() => void updateTripStatus(t.trip_id, 0).catch((error) => alert(error instanceof Error ? error.message : 'ยกเลิกรอบรถไม่สำเร็จ'))}
                              className="px-2.5 py-1 text-[11px] font-semibold text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors"
                            >
                              ยกเลิกรอบ
                            </button>
                          </>
                        )}
                        {t.status === 0 && (
                          <button
                            onClick={() => void updateTripStatus(t.trip_id, 1).catch((error) => alert(error instanceof Error ? error.message : 'เปิดรอบรถไม่สำเร็จ'))}
                            className="px-2.5 py-1 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-50 border border-emerald-200 rounded-lg transition-colors"
                          >
                            เปิดใหม่
                          </button>
                        )}
                        {(t.status === 2 || t.status === 3) && (
                          <span className="text-[10px] text-slate-400 font-mono">—</span>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer count */}
      <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
        <span>
          แสดง <strong className="text-slate-700">{filteredTrips.length}</strong> จากทั้งหมด{' '}
          <strong className="text-slate-700">{trips.length}</strong> รอบ
        </span>
      </div>

      {/* ==================== EDIT TRIP MODAL ==================== */}
      {editingTrip && canEdit && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-lg w-full relative shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">แก้ไขรอบรถ</h3>
                  <p className="text-[11px] text-slate-500">รหัส #{editingTrip.trip_id}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingTrip(null);
                  setFormConflictError(null);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formConflictError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">ตรวจพบตารางเวลาชนกัน:</div>
                  <div className="mt-0.5 leading-relaxed">{formConflictError}</div>
                </div>
              </div>
            )}

            <form onSubmit={handleEditTripSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1.5">เส้นทาง</label>
                <select
                  value={editingTrip.route_id}
                  onChange={(e) => {
                    setEditingTrip((prev) => prev ? { ...prev, route_id: Number(e.target.value) } : prev);
                    setFormConflictError(null);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
                >
                  {routes.filter((route) => route.status === 1).map((r) => (
                    <option key={r.route_id} value={r.route_id}>{r.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block font-bold text-slate-700">วันที่ให้บริการ</label>
                <input
                  type="date"
                  value={editingTrip.service_date}
                  onChange={(e) => {
                    setEditingTrip((prev) => prev ? { ...prev, service_date: e.target.value } : prev);
                    setFormConflictError(null);
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 font-mono font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
                />
              </div>
              <div>
                <label className="mb-1.5 block font-bold text-slate-700">เวลาออก</label>
                <input
                  type="time"
                  value={editingTrip.departure_time}
                  onChange={(e) => {
                    setEditingTrip((prev) => prev ? { ...prev, departure_time: e.target.value } : prev);
                    setFormConflictError(null);
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 font-mono font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1.5">พนักงานขับรถ</label>
                <select
                  value={editingTrip.driver_id}
                  onChange={(e) => {
                    setEditingTrip((prev) => prev ? { ...prev, driver_id: e.target.value } : prev);
                    setFormConflictError(null);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
                >
                  {employees.filter((emp) => canViewScreen(14, emp.position_id)).map((emp) => (
                    <option key={emp.employee_id} value={emp.employee_id}>{emp.fullname} · {emp.employee_id}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1.5">ยานพาหนะ</label>
                <select
                  value={editingTrip.vehicle_id}
                  onChange={(e) => {
                    setEditingTrip((prev) => prev ? { ...prev, vehicle_id: e.target.value } : prev);
                    setFormConflictError(null);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
                >
                  {vehicles.filter((vehicle) => vehicle.status === 1).map((v) => (
                    <option key={v.vehicle_id} value={v.vehicle_id}>{v.license_plate} · {v.type}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setEditingTrip(null);
                    setFormConflictError(null);
                  }}
                  className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-bold transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold shadow-sm transition-all"
                >
                  บันทึกการแก้ไข
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== ADD TRIP MODAL ==================== */}
      {showAddTripModal && canEdit && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-lg w-full relative shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">เพิ่มรอบรถใหม่</h3>
                  <p className="text-[11px] text-slate-500">
                    ระบบจะตรวจการชนของคนขับและรถอัตโนมัติ
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAddTripModal(false);
                  setFormConflictError(null);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formConflictError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">ตรวจพบตารางเวลาชนกัน:</div>
                  <div className="mt-0.5 leading-relaxed">{formConflictError}</div>
                </div>
              </div>
            )}

            <form onSubmit={handleCreateTripSubmit} className="max-h-[75vh] space-y-4 overflow-y-auto pr-1 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1.5">
                  เส้นทาง (Route)
                </label>
                <select
                  value={newTripRouteId}
                  onChange={(e) => {
                    setNewTripRouteId(Number(e.target.value));
                    setFormConflictError(null);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
                >
                  {routes.filter((route) => route.status === 1).map((r) => (
                    <option key={r.route_id} value={r.route_id}>
                      {r.name} · {r.total_time} นาที
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block font-bold text-slate-700">วันที่ให้บริการ</label>
                <input
                  type="date"
                  required
                  value={newTripDate}
                  onChange={(e) => {
                    setNewTripDate(e.target.value);
                    setFormConflictError(null);
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 font-mono font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
                />
              </div>

              <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <label className="block font-bold text-slate-700">เวลาออกหลายรอบ</label>
                    <p className="mt-0.5 text-[10px] text-slate-500">เลือกเวลาได้สูงสุด 20 รอบต่อวัน (ใช้คนขับและรถคันเดียวกัน)</p>
                  </div>
                  <button
                    type="button"
                    disabled={newTripTimes.length >= 20}
                    onClick={() => {
                      const lastTime = newTripTimes[newTripTimes.length - 1] || '08:00';
                      const [hours, minutes] = lastTime.split(':').map(Number);
                      const nextHour = Math.min(23, hours + 1);
                      const suggested = `${String(nextHour).padStart(2, '0')}:${String(minutes || 0).padStart(2, '0')}`;
                      setNewTripTimes((previous) => [...previous, suggested]);
                      setFormConflictError(null);
                    }}
                    className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 font-bold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Plus className="h-3.5 w-3.5" /> เพิ่มเวลา
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {newTripTimes.map((time, index) => (
                    <div key={index} className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white p-1.5">
                      <input
                        type="time"
                        required
                        value={time}
                        onChange={(event) => {
                          const value = event.target.value;
                          setNewTripTimes((previous) => previous.map((item, itemIndex) => itemIndex === index ? value : item));
                          setFormConflictError(null);
                        }}
                        className="min-w-0 flex-1 rounded-md px-1.5 py-1 font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                        aria-label={`เวลาออกเที่ยวที่ ${index + 1}`}
                      />
                      <button
                        type="button"
                        disabled={newTripTimes.length === 1}
                        onClick={() => setNewTripTimes((previous) => previous.filter((_, itemIndex) => itemIndex !== index))}
                        className="rounded-md p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 disabled:invisible"
                        aria-label={`ลบเวลาเที่ยวที่ ${index + 1}`}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1.5">
                  พนักงานขับรถ
                </label>
                <select
                  value={newTripDriverId}
                  onChange={(e) => {
                    setNewTripDriverId(e.target.value);
                    setFormConflictError(null);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
                >
                  {employees
                    .filter((emp) => canViewScreen(14, emp.position_id))
                    .map((emp) => (
                      <option key={emp.employee_id} value={emp.employee_id}>
                        {emp.fullname} · รหัส {emp.employee_id}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1.5">ยานพาหนะ</label>
                <select
                  value={newTripVehicleId}
                  onChange={(e) => {
                    setNewTripVehicleId(e.target.value);
                    setFormConflictError(null);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
                >
                  {vehicles.filter((vehicle) => vehicle.status === 1).map((v) => (
                    <option key={v.vehicle_id} value={v.vehicle_id}>
                      {v.license_plate} · {v.type} ({v.capacity} ที่)
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddTripModal(false);
                    setFormConflictError(null);
                  }}
                  className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-bold transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isCreatingTrips}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold shadow-sm transition-all disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isCreatingTrips ? 'กำลังบันทึก…' : `บันทึก ${newTripTimes.length} รอบรถ`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};