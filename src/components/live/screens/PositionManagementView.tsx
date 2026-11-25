import React, { useState } from 'react';
import { useBus } from '../../../context/BusContext';
import { Position } from '../../../types/schema';
import {
  Briefcase,
  Search,
  Plus,
  Edit,
  Trash2,
  X,
  Users,
  Shield,
  Layers,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

interface PositionManagementViewProps {
  canEdit?: boolean;
}

export const PositionManagementView: React.FC<PositionManagementViewProps> = ({
  canEdit = true,
}) => {
  const {
    positions,
    employees,
    permissions,
    screens,
    apiMode,
    apiCreatePosition,
    addPosition,
    updatePosition,
    deletePosition,
  } = useBus();

  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPos, setEditingPos] = useState<Position | null>(null);

  // New Position state
  const [newPosName, setNewPosName] = useState('');
  const [newPosId, setNewPosId] = useState<number | ''>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const filteredPositions = positions.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    String(p.position_id).includes(searchQuery)
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;
    setErrorMsg(null);

    if (!newPosName.trim()) {
      setErrorMsg('กรุณากรอกชื่อตำแหน่ง');
      return;
    }

    const customId = !apiMode && newPosId !== '' ? Number(newPosId) : undefined;
    if (customId && positions.some((p) => p.position_id === customId)) {
      setErrorMsg(`รหัสตำแหน่ง ${customId} มีอยู่ในระบบแล้ว กรุณาใช้รหัสอื่น`);
      return;
    }

    try {
      if (apiMode) await apiCreatePosition(newPosName.trim());
      else addPosition(newPosName.trim(), customId);
      setNewPosName('');
      setNewPosId('');
      setShowAddModal(false);
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : 'เพิ่มตำแหน่งไม่สำเร็จ');
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit || !editingPos) return;

    if (!editingPos.name.trim()) return;

    try {
      await updatePosition(editingPos);
      setEditingPos(null);
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : 'บันทึกตำแหน่งไม่สำเร็จ');
    }
  };

  const handleDelete = async (pos: Position) => {
    if (!canEdit) return;

    const assignedStaff = employees.filter((e) => e.position_id === pos.position_id);
    if (assignedStaff.length > 0) {
      alert(
        `ไม่สามารถลบตำแหน่ง "${pos.name}" ได้ เนื่องจากมีพนักงาน ${assignedStaff.length} ท่าน กำลังผูกกับตำแหน่งนี้ กรุณาย้ายพนักงานก่อน`
      );
      return;
    }

    if (confirm(`คุณต้องการลบตำแหน่ง "${pos.name}" (รหัส: ${pos.position_id}) หรือไม่?`)) {
      try {
        await deletePosition(pos.position_id);
      } catch (error) {
        alert(error instanceof Error ? error.message : 'ซ่อนตำแหน่งไม่สำเร็จ');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-slate-900">
                  จัดการตำแหน่งงาน (หน้าจอ 22 - Position Master)
                </h2>
                <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full font-bold">
                  {positions.length} ตำแหน่ง
                </span>
              </div>
              <p className="text-xs text-slate-500">
                ตารางข้อมูลหลัก Master Data หน้าจอ 22 สำหรับจัดการตำแหน่งงาน เชื่อมโยงกับสิทธิ์ Dynamic RBAC และรายชื่อพนักงาน
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="ค้นหาชื่อตำแหน่ง / รหัส..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 w-48 sm:w-64"
            />
          </div>

          {canEdit && (
            <button
              onClick={() => {
                setErrorMsg(null);
                const nextId =
                  positions.length > 0
                    ? Math.max(...positions.map((p) => p.position_id)) + 1
                    : 1;
                setNewPosId(nextId);
                setShowAddModal(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl cursor-pointer shadow-xs transition-colors shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>เพิ่มตำแหน่งใหม่</span>
            </button>
          )}
        </div>
      </div>

      {/* Position Cards / Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPositions.map((pos) => {
          const assignedStaff = employees.filter((e) => e.position_id === pos.position_id);
          const posPerms = permissions.filter(
            (p) => p.position_id === pos.position_id && (p.can_view || p.can_edit)
          );

          return (
            <div
              key={pos.position_id}
              className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs hover:border-purple-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 font-mono font-bold text-xs flex items-center justify-center border border-slate-200">
                      #{pos.position_id}
                    </span>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900">{pos.name}</h3>
                      <span className="text-[11px] text-slate-500">
                        รหัสตำแหน่ง: <strong className="font-mono text-purple-700">{pos.position_id}</strong>
                      </span>
                    </div>
                  </div>

                  {canEdit && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setEditingPos(pos)}
                        className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors cursor-pointer"
                        title="แก้ไขชื่อตำแหน่ง"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                            onClick={() => void handleDelete(pos)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="ลบตำแหน่ง"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Assigned Employees */}
                <div className="py-3 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600 font-semibold flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>บุคลากรในตำแหน่งนี้:</span>
                    </span>
                    <span className="font-mono font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full text-[11px] border border-purple-100">
                      {assignedStaff.length} คน
                    </span>
                  </div>

                  {assignedStaff.length > 0 ? (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {assignedStaff.slice(0, 3).map((emp) => (
                        <span
                          key={emp.employee_id}
                          className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium"
                        >
                          {emp.fullname.split(' ')[0]} ({emp.username})
                        </span>
                      ))}
                      {assignedStaff.length > 3 && (
                        <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-md font-mono">
                          +{assignedStaff.length - 3}
                        </span>
                      )}
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400 italic">ยังไม่มีพนักงานในตำแหน่งนี้</p>
                  )}
                </div>

                {/* Permitted Screens Scope */}
                <div className="pt-2 border-t border-slate-100 space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <Shield className="w-3 h-3 text-purple-500" />
                      <span>สิทธิ์เข้าถึงหน้าจอ (RBAC):</span>
                    </span>
                    <span className="font-mono font-semibold text-slate-700">
                      {posPerms.length} หน้าจอ
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {posPerms.length > 0 ? (
                      posPerms.map((perm) => {
                        const scr = screens.find((s) => s.screen_id === perm.screen_id);
                        return (
                          <span
                            key={perm.permission_id}
                            className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold ${
                              perm.can_edit
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : 'bg-blue-100 text-blue-800 border border-blue-200'
                            }`}
                            title={`หน้าจอ ${perm.screen_id}: ${scr?.name}`}
                          >
                            จอ {perm.screen_id} {perm.can_edit ? '(Edit)' : '(View)'}
                          </span>
                        );
                      })
                    ) : (
                      <span className="text-[10px] text-slate-400">ยังไม่ได้กำหนดสิทธิ์</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Position Modal */}
      {showAddModal && canEdit && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full relative shadow-xl">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Plus className="w-4 h-4 text-purple-600" />
              <span>เพิ่มตำแหน่งงานใหม่ (Position Master)</span>
            </h3>

            {errorMsg && (
              <div className="mb-3 p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              {!apiMode && <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  รหัสตำแหน่ง (Position ID)
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={newPosId}
                  onChange={(e) => setNewPosId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:bg-white"
                  placeholder="เช่น 9"
                />
              </div>}

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  ชื่อตำแหน่งงาน (Position Name)
                </label>
                <input
                  type="text"
                  required
                  value={newPosName}
                  onChange={(e) => setNewPosName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:bg-white"
                  placeholder="เช่น เจ้าหน้าที่วิเคราะห์ข้อมูล, พนักงานซ่อมบำรุง"
                />
              </div>

              <div className="pt-2 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl cursor-pointer shadow-xs"
                >
                  บันทึกตำแหน่ง
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Position Modal */}
      {editingPos && canEdit && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full relative shadow-xl">
            <button
              onClick={() => setEditingPos(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Edit className="w-4 h-4 text-purple-600" />
              <span>แก้ไขชื่อตำแหน่ง #{editingPos.position_id}</span>
            </h3>

            <form onSubmit={handleUpdate} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  รหัสตำแหน่ง (Position ID)
                </label>
                <input
                  type="text"
                  disabled
                  value={editingPos.position_id}
                  className="w-full bg-slate-100 border border-slate-200 rounded-xl p-2.5 text-slate-500 font-mono cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  ชื่อตำแหน่ง (Position Name)
                </label>
                <input
                  type="text"
                  required
                  value={editingPos.name}
                  onChange={(e) => setEditingPos({ ...editingPos, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:bg-white"
                />
              </div>

              <div className="pt-2 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setEditingPos(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl cursor-pointer shadow-xs"
                >
                  บันทึกการแก้ไข
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
