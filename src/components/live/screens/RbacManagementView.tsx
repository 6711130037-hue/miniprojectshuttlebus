import React, { useState } from 'react';
import { useBus } from '../../../context/BusContext';
import { RolePermission } from '../../../types/schema';
import {
  Shield,
  Plus,
  Trash2,
  Check,
  X,
  Lock,
  Eye,
  Sliders,
  AlertTriangle,
  Info,
  Search,
  Filter,
  ChevronDown,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';

interface RbacManagementViewProps {
  canEdit?: boolean;
}

export const RbacManagementView: React.FC<RbacManagementViewProps> = ({ canEdit = true }) => {
  const {
    positions,
    screens,
    permissions,
    addPermission,
    updatePermission,
    deletePermission,
  } = useBus();

  const [permFilterPosId, setPermFilterPosId] = useState<number | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [showAddPermModal, setShowAddPermModal] = useState(false);
  const [deletingPerm, setDeletingPerm] = useState<RolePermission | null>(null);

  // New permission form state
  const [newPermPosId, setNewPermPosId] = useState<number>(1);
  const [newPermScreenId, setNewPermScreenId] = useState<number>(16);
  const [newPermCanView, setNewPermCanView] = useState<boolean>(true);
  const [newPermCanEdit, setNewPermCanEdit] = useState<boolean>(true);

  const handleAddPermissionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;

    try {
      await addPermission(newPermPosId, newPermScreenId, newPermCanView, newPermCanEdit);
      const targetPos = positions.find((p) => p.position_id === newPermPosId);
      const targetScr = screens.find((s) => s.screen_id === newPermScreenId);
      setActionNotice(
        `กำหนดสิทธิ์ให้ "${targetPos?.name}" เข้าถึง "${targetScr?.name}" เรียบร้อยแล้ว`
      );
      setShowAddPermModal(false);
      setTimeout(() => setActionNotice(null), 4000);
    } catch (error) {
      setActionNotice(error instanceof Error ? error.message : 'บันทึกสิทธิ์ไม่สำเร็จ');
    }
  };

  const filteredPermissions = permissions.filter((p) => {
    if (permFilterPosId !== 'all' && p.position_id !== permFilterPosId) return false;
    if (!searchQuery) return true;
    const pos = positions.find((x) => x.position_id === p.position_id);
    const scr = screens.find((x) => x.screen_id === p.screen_id);
    const q = searchQuery.toLowerCase();
    return (
      (pos?.name || '').toLowerCase().includes(q) ||
      (scr?.name || '').toLowerCase().includes(q) ||
      (scr?.code || '').toLowerCase().includes(q)
    );
  });

  const groupedByPosition = positions
    .map((pos) => ({
      position: pos,
      permissions: filteredPermissions.filter((p) => p.position_id === pos.position_id),
    }))
    .filter((g) => g.permissions.length > 0 || permFilterPosId === g.position.position_id);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-5 shadow-sm">
      {/* ============ HEADER ============ */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <div className="text-[11px] text-slate-500 font-mono font-semibold flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
              หน้าจอ 16 · Code 9102
            </span>
            {!canEdit && (
              <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[10px]">
                🔒 Read-Only
              </span>
            )}
          </div>
          <h2 className="text-lg font-bold text-slate-900 mt-1 flex items-center gap-2">
            <Shield className="w-5 h-5 text-slate-700" />
            <span>ตารางสิทธิตามตำแหน่ง</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            ตารางตัวกลาง M:N ระหว่าง <strong className="text-slate-700">ตำแหน่ง</strong> และ{' '}
            <strong className="text-slate-700">หน้าจอ</strong> · ปรับแต่งได้แบบ Dynamic
          </p>
        </div>

        {canEdit ? (
          <button
            onClick={() => setShowAddPermModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-sm transition-all shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>เพิ่มสิทธิ์ใหม่</span>
          </button>
        ) : (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-500 rounded-xl text-xs font-medium border border-slate-200 shrink-0">
            <Lock className="w-3.5 h-3.5" />
            <span>ไม่มีสิทธิ์แก้ไข</span>
          </div>
        )}
      </div>

      {/* ============ NOTICE ============ */}
      {actionNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{actionNotice}</span>
          </div>
          <button
            onClick={() => setActionNotice(null)}
            className="text-emerald-700 hover:text-emerald-900 p-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ============ FILTERS ============ */}
      <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center bg-slate-50 p-2.5 rounded-xl border border-slate-200">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหาตำแหน่ง, หน้าจอ, หรือ Code..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 text-slate-800 placeholder:text-slate-400"
          />
        </div>

        <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg p-1">
          <Filter className="w-3.5 h-3.5 text-slate-500 ml-1.5 shrink-0" />
          <select
            value={permFilterPosId}
            onChange={(e) => {
              const v = e.target.value;
              setPermFilterPosId(v === 'all' ? 'all' : Number(v));
            }}
            className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer pr-1"
          >
            <option value="all">ทุกตำแหน่ง ({permissions.length})</option>
            {positions.map((pos) => {
              const count = permissions.filter((p) => p.position_id === pos.position_id).length;
              return (
                <option key={pos.position_id} value={pos.position_id}>
                  {pos.name} ({count})
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* ============ PERMISSION LIST (Grouped by Position) ============ */}
      {groupedByPosition.length === 0 ? (
        <div className="p-10 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-2">
          <Shield className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="text-sm font-semibold text-slate-600">ไม่พบข้อมูลสิทธิ์</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setPermFilterPosId('all');
            }}
            className="text-xs text-slate-700 underline font-semibold"
          >
            ล้างตัวกรอง
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {groupedByPosition.map(({ position, permissions: posPerms }) => (
            <div key={position.position_id} className="space-y-2.5">
              {/* Position header */}
              <div className="flex items-center justify-between gap-2 px-1">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                    #{position.position_id}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900">{position.name}</div>
                    <div className="text-[10px] text-slate-500">
                      {posPerms.length} สิทธิ์
                    </div>
                  </div>
                </div>
              </div>

              {posPerms.length === 0 ? (
                <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center text-[11px] text-slate-500">
                  ยังไม่ได้กำหนดสิทธิ์ให้ตำแหน่งนี้
                </div>
              ) : (
                <div className="space-y-2">
                  {posPerms.map((perm) => {
                    const scr = screens.find((s) => s.screen_id === perm.screen_id);

                    return (
                      <div
                        key={perm.permission_id}
                        className="bg-white border border-slate-200 rounded-xl p-3 hover:border-slate-300 transition-all"
                      >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                          {/* Screen info */}
                          <div className="flex items-start gap-3 min-w-0 flex-1">
                            <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                              <Sliders className="w-4 h-4 text-slate-600" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-xs font-bold text-slate-900">
                                  {scr?.name}
                                </span>
                                <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">
                                  Code {scr?.code}
                                </span>
                                <span className="text-[10px] font-mono text-slate-400">
                                  #{perm.permission_id}
                                </span>
                              </div>
                              <div className="text-[10px] text-slate-500 mt-0.5">
                                Screen ID: {perm.screen_id}
                              </div>
                            </div>
                          </div>

                          {/* Toggles */}
                          <div className="flex items-center gap-2 shrink-0">
                            {/* Can View */}
                            <button
                              onClick={async () => {
                                if (!canEdit) return;
                                try {
                                  await updatePermission(perm.permission_id, 'can_view', !perm.can_view);
                                  setActionNotice(`อัปเดตสิทธิ์การดูของ ${position.name} เรียบร้อยแล้ว`);
                                  setTimeout(() => setActionNotice(null), 3000);
                                } catch (error) {
                                  alert(error instanceof Error ? error.message : 'บันทึกสิทธิ์ไม่สำเร็จ');
                                }
                              }}
                              disabled={!canEdit}
                              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition-all ${
                                perm.can_view
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-slate-50 text-slate-400 border-slate-200'
                              } ${canEdit ? 'hover:shadow-sm cursor-pointer' : 'cursor-not-allowed opacity-75'}`}
                            >
                              {perm.can_view ? (
                                <ToggleRight className="w-4 h-4" />
                              ) : (
                                <ToggleLeft className="w-4 h-4" />
                              )}
                              <span>ดู</span>
                            </button>

                            {/* Can Edit */}
                            <button
                              onClick={async () => {
                                if (!canEdit) return;
                                try {
                                  await updatePermission(perm.permission_id, 'can_edit', !perm.can_edit);
                                  setActionNotice(`อัปเดตสิทธิ์การแก้ไขของ ${position.name} เรียบร้อยแล้ว`);
                                  setTimeout(() => setActionNotice(null), 3000);
                                } catch (error) {
                                  alert(error instanceof Error ? error.message : 'บันทึกสิทธิ์ไม่สำเร็จ');
                                }
                              }}
                              disabled={!canEdit}
                              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition-all ${
                                perm.can_edit
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-slate-50 text-slate-400 border-slate-200'
                              } ${canEdit ? 'hover:shadow-sm cursor-pointer' : 'cursor-not-allowed opacity-75'}`}
                            >
                              {perm.can_edit ? (
                                <ToggleRight className="w-4 h-4" />
                              ) : (
                                <ToggleLeft className="w-4 h-4" />
                              )}
                              <span>แก้ไข</span>
                            </button>

                            {/* Delete */}
                            {canEdit && (
                              <button
                                onClick={() => setDeletingPerm(perm)}
                                className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors"
                                title="ลบสิทธิ์"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ============ ADD PERMISSION MODAL ============ */}
      {showAddPermModal && canEdit && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">เพิ่มการกำหนดสิทธิ์ใหม่</h3>
                  <p className="text-[11px] text-slate-500">กำหนดสิทธิ์ให้ตำแหน่งเข้าถึงหน้าจอ</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddPermModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddPermissionSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1.5">
                  1. เลือกตำแหน่ง (Position)
                </label>
                <select
                  value={newPermPosId}
                  onChange={(e) => setNewPermPosId(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                >
                  {positions.map((p) => (
                    <option key={p.position_id} value={p.position_id}>
                      {p.name} (รหัส {p.position_id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1.5">
                  2. เลือกหน้าจอ (Screen)
                </label>
                <select
                  value={newPermScreenId}
                  onChange={(e) => setNewPermScreenId(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                >
                  {screens.map((s) => (
                    <option key={s.screen_id} value={s.screen_id}>
                      {s.name} · Code {s.code}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-slate-700 font-bold mb-1.5">สิทธิ์การดู</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setNewPermCanView(true)}
                      className={`flex-1 py-1.5 rounded-lg font-bold border transition-all ${
                        newPermCanView
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      ได้
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewPermCanView(false)}
                      className={`flex-1 py-1.5 rounded-lg font-bold border transition-all ${
                        !newPermCanView
                          ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      ไม่ได้
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1.5">สิทธิ์การแก้ไข</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setNewPermCanEdit(true)}
                      className={`flex-1 py-1.5 rounded-lg font-bold border transition-all ${
                        newPermCanEdit
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      ได้
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewPermCanEdit(false)}
                      className={`flex-1 py-1.5 rounded-lg font-bold border transition-all ${
                        !newPermCanEdit
                          ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      ไม่ได้
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddPermModal(false)}
                  className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-bold"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold shadow-sm"
                >
                  บันทึกสิทธิ์
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============ DELETE CONFIRMATION MODAL ============ */}
      {deletingPerm && canEdit && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">ยืนยันการลบสิทธิ์</h3>
                <p className="text-xs text-slate-500">
                  รหัสสิทธิ์: <strong className="font-mono text-slate-700">#{deletingPerm.permission_id}</strong>
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 border border-slate-200 rounded-xl p-3">
              ต้องการลบสิทธิ์การเข้าถึงหน้าจอ{' '}
              <strong className="text-slate-900">
                {screens.find((s) => s.screen_id === deletingPerm.screen_id)?.name}
              </strong>{' '}
              ของตำแหน่ง{' '}
              <strong className="text-slate-900">
                {positions.find((p) => p.position_id === deletingPerm.position_id)?.name}
              </strong>{' '}
              หรือไม่?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeletingPerm(null)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-bold text-xs"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await deletePermission(deletingPerm.permission_id);
                    setActionNotice(`ซ่อนสิทธิ์ #${deletingPerm.permission_id} เรียบร้อยแล้ว`);
                    setDeletingPerm(null);
                    setTimeout(() => setActionNotice(null), 3000);
                  } catch (error) {
                    alert(error instanceof Error ? error.message : 'ซ่อนสิทธิ์ไม่สำเร็จ');
                  }
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs shadow-sm flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>ยืนยันลบ</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};