import React, { useState } from 'react';
import { useBus } from '../../../context/BusContext';
import {
  MapPin,
  Navigation,
  Clock,
  Search,
  ChevronDown,
  ChevronRight,
  Flag,
  CircleDot,
  Route as RouteIcon,
  Info,
  Plus,
  Pencil,
  Trash2,
  X,
} from 'lucide-react';

interface RoutesManagementViewProps {
  canEdit?: boolean;
}

export const RoutesManagementView: React.FC<RoutesManagementViewProps> = ({ canEdit = true }) => {
  const {
    routes,
    stops,
    getStopsForRoute,
    addRoute,
    updateRoute,
    deleteRoute,
    addStop,
    updateStop,
    addRouteStop,
    deleteRouteStop,
  } = useBus();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedRoutes, setExpandedRoutes] = useState<number[]>(routes.map((r) => r.route_id));
  const [showStopModal, setShowStopModal] = useState(false);
  const [stopForm, setStopForm] = useState<{
    routeId: number;
    stopId?: number;
    name: string;
    detail: string;
  } | null>(null);

  const toggleRoute = (routeId: number) => {
    setExpandedRoutes((prev) =>
      prev.includes(routeId) ? prev.filter((id) => id !== routeId) : [...prev, routeId]
    );
  };

  const expandAll = () => setExpandedRoutes(routes.map((r) => r.route_id));
  const collapseAll = () => setExpandedRoutes([]);

  const handleAddRoute = async () => {
    if (!canEdit) return;
    const rawValue = window.prompt('ชื่อเส้นทางใหม่');
    const name = rawValue?.trim();
    if (!name) return;
    try {
      await addRoute(name, undefined);
      setExpandedRoutes((prev) => [...prev, routes.length + 1]);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'ไม่สามารถเพิ่มเส้นทางได้');
    }
  };

  const handleEditRoute = async (routeId: number) => {
    if (!canEdit) return;
    const route = routes.find((item) => item.route_id === routeId);
    if (!route) return;
    const nextName = window.prompt('แก้ไขชื่อเส้นทาง', route.name)?.trim();
    if (!nextName) return;
    try {
      await updateRoute({ ...route, name: nextName });
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'ไม่สามารถแก้ไขเส้นทางได้');
    }
  };

  const handleDeleteRoute = async (routeId: number) => {
    if (!canEdit) return;
    const route = routes.find((item) => item.route_id === routeId);
    if (!route) return;
    const confirmed = window.confirm(`ลบเส้นทาง "${route.name}" และจุดจอดที่ผูกอยู่จริงหรือไม่?`);
    if (!confirmed) return;
    try {
      await deleteRoute(routeId);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'ไม่สามารถลบเส้นทางได้');
    }
  };

  const handleAddStopToRoute = async (routeId: number) => {
    if (!canEdit) return;
    setStopForm({ routeId, name: '', detail: `จุดจอดในเส้นทาง #${routeId}` });
    setShowStopModal(true);
  };

  const handleEditStop = async (routeId: number, stop: { stop_id: number; name: string; detail: string }) => {
    if (!canEdit) return;
    setStopForm({ routeId, stopId: stop.stop_id, name: stop.name, detail: stop.detail ?? '' });
    setShowStopModal(true);
  };

  const handleStopSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit || !stopForm) return;

    const nextName = stopForm.name.trim();
    if (!nextName) {
      window.alert('ชื่อจุดจอดต้องไม่ว่าง');
      return;
    }

    try {
      if (stopForm.stopId) {
        const existingStop = stops.find((item) => item.stop_id === stopForm.stopId);
        if (!existingStop) throw new Error('ไม่พบจุดจอดที่ต้องการแก้ไข');
        await updateStop({ ...existingStop, name: nextName, detail: stopForm.detail.trim() });
      } else {
        const existing = getStopsForRoute(stopForm.routeId);
        const createdStop = await addStop(nextName, stopForm.detail.trim() || `จุดจอดในเส้นทาง #${stopForm.routeId}`);
        await addRouteStop(stopForm.routeId, createdStop.stop_id, existing.length + 1, 0);
      }
      setShowStopModal(false);
      setStopForm(null);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'ไม่สามารถบันทึกจุดจอดได้');
    }
  };

  const handleDeleteStopFromRoute = async (routeId: number, routeStopId: number) => {
    if (!canEdit) return;
    const confirmed = window.confirm('ลบจุดจอดนี้ออกจากเส้นทางหรือไม่?');
    if (!confirmed) return;
    try {
      await deleteRouteStop(routeId, routeStopId);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'ไม่สามารถลบจุดจอดจากเส้นทางได้');
    }
  };

  const filteredRoutes = routes.filter((r) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const stopsForRoute = getStopsForRoute(r.route_id);
    return (
      r.name.toLowerCase().includes(q) ||
      String(r.route_id).includes(q) ||
      stopsForRoute.some((s) => s.name.toLowerCase().includes(q))
    );
  });

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <div className="text-[11px] text-slate-500 font-mono font-semibold flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
              หน้าจอ 12 · Code 6794
            </span>
            {!canEdit && (
              <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[10px]">
                🔒 Read-Only
              </span>
            )}
          </div>
          <h2 className="text-lg font-bold text-slate-900 mt-1 flex items-center gap-2">
            <Navigation className="w-5 h-5 text-slate-700" />
            <span>จัดการเส้นทาง & จุดจอด</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            โครงสร้าง: <strong className="text-slate-700">เส้นทาง</strong> 1:N{' '}
            <strong className="text-slate-700">จุดจอดในเส้นทาง</strong> N:1{' '}
            <strong className="text-slate-700">จุดจอด</strong>
          </p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
          <button
            onClick={handleAddRoute}
            disabled={!canEdit}
            className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-white bg-slate-900 hover:bg-slate-700 disabled:bg-slate-300 px-2.5 py-1.5 rounded-lg border border-slate-900 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            เพิ่มเส้นทาง
          </button>
          <button
            onClick={expandAll}
            className="text-[11px] font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-lg border border-slate-200 transition-colors"
          >
            ขยายทั้งหมด
          </button>
          <button
            onClick={collapseAll}
            className="text-[11px] font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 px-2.5 py-1.5 rounded-lg border border-slate-200 transition-colors"
          >
            ย่อทั้งหมด
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหาเส้นทาง หรือจุดจอด..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 text-slate-800 placeholder:text-slate-400"
          />
        </div>
        <div className="text-[11px] text-slate-500 whitespace-nowrap">
          <strong className="text-slate-700">{filteredRoutes.length}</strong> / {routes.length} เส้นทาง
        </div>
      </div>

      {showStopModal && stopForm && canEdit && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-lg w-full relative shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {stopForm.stopId ? 'แก้ไขจุดจอด' : 'เพิ่มจุดจอดใหม่'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {stopForm.stopId ? 'เปลี่ยนข้อมูลชื่อและรายละเอียดของจุดจอด' : 'เพิ่มจุดจอดลงในเส้นทางนี้'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowStopModal(false);
                  setStopForm(null);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleStopSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1.5">ชื่อจุดจอด</label>
                <input
                  type="text"
                  value={stopForm.name}
                  onChange={(e) => setStopForm((prev) => prev ? { ...prev, name: e.target.value } : prev)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
                  placeholder="เช่น มหาวิทยาลัยเทคโนโลยีมหานคร"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1.5">รายละเอียด</label>
                <textarea
                  value={stopForm.detail}
                  onChange={(e) => setStopForm((prev) => prev ? { ...prev, detail: e.target.value } : prev)}
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 resize-none"
                  placeholder="รายละเอียดจุดจอดเพิ่มเติม"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowStopModal(false);
                    setStopForm(null);
                  }}
                  className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-bold transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold shadow-sm transition-all"
                >
                  {stopForm.stopId ? 'บันทึกการแก้ไข' : 'เพิ่มจุดจอด'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {filteredRoutes.length === 0 ? (
        <div className="p-10 text-center bg-slate-50 rounded-xl border border-slate-200 space-y-2">
          <RouteIcon className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="text-sm font-semibold text-slate-600">ไม่พบเส้นทางที่ตรงเงื่อนไข</p>
          <button
            onClick={() => setSearchQuery('')}
            className="text-xs text-slate-700 underline font-semibold"
          >
            ล้างคำค้นหา
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRoutes.map((route) => {
            const rStops = getStopsForRoute(route.route_id);
            const isExpanded = expandedRoutes.includes(route.route_id);

            return (
              <div
                key={route.route_id}
                className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:border-slate-300 transition-all"
              >
                <div className="w-full text-left p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between hover:bg-slate-50 transition-colors">
                  <button onClick={() => toggleRoute(route.route_id)} className="flex-1 text-left flex items-start gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0">
                      <RouteIcon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                          Route #{route.route_id}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          เปิดใช้งาน
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 mt-1 leading-snug">
                        {route.name}
                      </h3>
                      <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-500 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <strong className="text-slate-700">{route.total_time}</strong> นาที
                        </span>
                        <span className="text-slate-300">·</span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <strong className="text-slate-700">{rStops.length}</strong> จุดจอด
                        </span>
                      </div>
                    </div>
                  </button>

                  <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                    <button
                      onClick={() => handleAddStopToRoute(route.route_id)}
                      disabled={!canEdit}
                      className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-700 bg-white hover:bg-slate-100 disabled:bg-slate-200 px-2 py-1.5 rounded-lg border border-slate-200 transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                      เพิ่มจุดจอด
                    </button>
                    <button
                      onClick={() => handleEditRoute(route.route_id)}
                      disabled={!canEdit}
                      className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-700 bg-white hover:bg-slate-100 disabled:bg-slate-200 px-2 py-1.5 rounded-lg border border-slate-200 transition-colors"
                    >
                      <Pencil className="w-3 h-3" />
                      แก้ไข
                    </button>
                    <button
                      onClick={() => handleDeleteRoute(route.route_id)}
                      disabled={!canEdit}
                      className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 disabled:bg-slate-200 px-2 py-1.5 rounded-lg border border-rose-200 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                      ลบ
                    </button>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${
                        isExpanded ? 'rotate-180' : ''
                      }`}
                    />
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-slate-100 p-4 bg-slate-50/50">
                    <div className="relative">
                      <div className="absolute left-[19px] top-3 bottom-3 w-0.5 bg-gradient-to-b from-emerald-400 via-slate-300 to-rose-400" />

                      <div className="space-y-3">
                        {rStops.map((st, idx) => {
                          const isFirst = idx === 0;
                          const isLast = idx === rStops.length - 1;
                          const dotColor = isFirst
                            ? 'bg-emerald-500 ring-emerald-100'
                            : isLast
                            ? 'bg-rose-500 ring-rose-100'
                            : 'bg-slate-400 ring-slate-100';

                          return (
                            <div key={`${route.route_id}-${st.stop_id}-${idx}`} className="flex items-start gap-3">
                              <div
                                className={`relative z-10 w-10 h-10 rounded-full ${dotColor} ring-4 flex items-center justify-center shrink-0 shadow-sm`}
                              >
                                <span className="text-[11px] font-bold text-white font-mono">
                                  {st.order}
                                </span>
                              </div>

                              <div className="flex-1 bg-white border border-slate-200 rounded-xl p-3 min-w-0 hover:shadow-sm transition-all">
                                <div className="flex items-center justify-between gap-2 flex-wrap">
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    {isFirst && (
                                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                                        <CircleDot className="w-2.5 h-2.5" />
                                        ต้นทาง
                                      </span>
                                    )}
                                    {isLast && (
                                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded">
                                        <Flag className="w-2.5 h-2.5" />
                                        ปลายทาง
                                      </span>
                                    )}
                                    <span className="text-[10px] font-mono text-slate-500">
                                      ID: {st.stop_id}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-mono font-bold text-slate-600 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded">
                                      {st.minutesFromPrev === 0 ? '0 นาที' : `+${st.minutesFromPrev} นาที`}
                                    </span>
                                    <button
                                      onClick={() => handleEditStop(route.route_id, { stop_id: st.stop_id, name: st.name, detail: st.detail })}
                                      disabled={!canEdit}
                                      className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-700 bg-white hover:bg-slate-100 disabled:bg-slate-200 px-1.5 py-1 rounded border border-slate-200 transition-colors"
                                    >
                                      <Pencil className="w-3 h-3" />
                                      แก้ไข
                                    </button>
                                    <button
                                      onClick={() => handleDeleteStopFromRoute(route.route_id, st.route_stop_id ?? 0)}
                                      disabled={!canEdit || !st.route_stop_id}
                                      className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 disabled:bg-slate-200 px-1.5 py-1 rounded border border-rose-200 transition-colors"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                      ลบ
                                    </button>
                                  </div>
                                </div>

                                <h4 className="text-sm font-bold text-slate-900 mt-1.5 truncate">
                                  {st.name}
                                </h4>
                                {st.detail && (
                                  <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                                    {st.detail}
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="mt-4 p-3 bg-white border border-slate-200 rounded-xl flex items-center gap-3 flex-wrap text-[11px]">
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <Info className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          รวมระยะเวลา: <strong className="text-slate-900 font-mono">{route.total_time} นาที</strong>
                        </span>
                      </div>
                      <span className="text-slate-300">·</span>
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <span className="text-emerald-700 font-semibold">เริ่ม:</span>
                        <span className="truncate">{rStops[0]?.name}</span>
                      </div>
                      <ChevronRight className="w-3 h-3 text-slate-300" />
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <span className="text-rose-700 font-semibold">สิ้นสุด:</span>
                        <span className="truncate">{rStops[rStops.length - 1]?.name}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};