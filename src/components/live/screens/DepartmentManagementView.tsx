import React, { useState } from 'react';
import { useBus } from '../../../context/BusContext';
import { Department } from '../../../types/schema';
import {
  Building2,
  Search,
  Plus,
  Edit,
  Trash2,
  X,
  Users,
  Briefcase,
  AlertCircle,
  Network,
} from 'lucide-react';

interface DepartmentManagementViewProps {
  canEdit?: boolean;
}

export const DepartmentManagementView: React.FC<DepartmentManagementViewProps> = ({
  canEdit = true,
}) => {
  const {
    departments,
    positions,
    employees,
    apiMode,
    apiCreateDepartment,
    addDepartment,
    updateDepartment,
    deleteDepartment,
  } = useBus();

  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);

  // New Department state
  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptId, setNewDeptId] = useState<number | ''>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const filteredDepartments = departments.filter((d) =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    String(d.department_id).includes(searchQuery)
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;
    setErrorMsg(null);

    if (!newDeptName.trim()) {
      setErrorMsg('กรุณากรอกชื่อฝ่าย / แผนก');
      return;
    }

    const customId = !apiMode && newDeptId !== '' ? Number(newDeptId) : undefined;
    if (customId && departments.some((d) => d.department_id === customId)) {
      setErrorMsg(`รหัสฝ่าย/แผนก ${customId} มีอยู่ในระบบแล้ว กรุณาใช้รหัสอื่น`);
      return;
    }

    try {
      if (apiMode) await apiCreateDepartment(newDeptName.trim());
      else addDepartment(newDeptName.trim(), customId);
      setNewDeptName('');
      setNewDeptId('');
      setShowAddModal(false);
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : 'เพิ่มฝ่าย/แผนกไม่สำเร็จ');
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit || !editingDept) return;

    if (!editingDept.name.trim()) return;

    try {
      await updateDepartment(editingDept);
      setEditingDept(null);
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : 'บันทึกฝ่าย/แผนกไม่สำเร็จ');
    }
  };

  const handleDelete = async (dept: Department) => {
    if (!canEdit) return;

    const assignedStaff = employees.filter((e) => e.department_id === dept.department_id);
    if (assignedStaff.length > 0) {
      alert(
        `ไม่สามารถลบฝ่าย "${dept.name}" ได้ เนื่องจากมีบุคลากร ${assignedStaff.length} ท่าน สังกัดอยู่ในฝ่ายนี้ กรุณาย้ายบุคลากรก่อน`
      );
      return;
    }

    if (confirm(`คุณต้องการลบฝ่าย "${dept.name}" (รหัส: ${dept.department_id}) หรือไม่?`)) {
      try {
        await deleteDepartment(dept.department_id);
      } catch (error) {
        alert(error instanceof Error ? error.message : 'ซ่อนฝ่าย/แผนกไม่สำเร็จ');
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
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-slate-900">
                  จัดการฝ่าย / แผนก (หน้าจอ 24 - Department Master)
                </h2>
                <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full font-bold">
                  {departments.length} ฝ่าย
                </span>
              </div>
              <p className="text-xs text-slate-500">
                ตารางข้อมูลหลัก Master Data หน้าจอ 24 สำหรับฝ่ายและแผนกในองค์กร เชื่อมโยงกับสังกัดของพนักงาน (Employee)
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="ค้นหาชื่อฝ่าย / รหัส..."
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
                  departments.length > 0
                    ? Math.max(...departments.map((d) => d.department_id)) + 1
                    : 1;
                setNewDeptId(nextId);
                setShowAddModal(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl cursor-pointer shadow-xs transition-colors shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>เพิ่มฝ่าย / แผนก</span>
            </button>
          )}
        </div>
      </div>

      {/* Department Cards / Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDepartments.map((dept) => {
          const assignedStaff = employees.filter((e) => e.department_id === dept.department_id);
          
          // Get unique positions in this department
          const posInDept = Array.from(
            new Set(assignedStaff.map((e) => e.position_id))
          ).map((posId) => positions.find((p) => p.position_id === posId)?.name).filter(Boolean);

          return (
            <div
              key={dept.department_id}
              className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs hover:border-purple-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 font-mono font-bold text-xs flex items-center justify-center border border-purple-200">
                      #{dept.department_id}
                    </span>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900">{dept.name}</h3>
                      <span className="text-[11px] text-slate-500">
                        รหัสฝ่าย: <strong className="font-mono text-purple-700">{dept.department_id}</strong>
                      </span>
                    </div>
                  </div>

                  {canEdit && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setEditingDept(dept)}
                        className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors cursor-pointer"
                        title="แก้ไขชื่อฝ่าย"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                            onClick={() => void handleDelete(dept)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="ลบฝ่าย"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Staff count & summary */}
                <div className="py-3 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600 font-semibold flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>บุคลากรในฝ่าย:</span>
                    </span>
                    <span className="font-mono font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full text-[11px] border border-purple-100">
                      {assignedStaff.length} คน
                    </span>
                  </div>

                  {assignedStaff.length > 0 ? (
                    <div className="space-y-1">
                      <div className="flex flex-wrap gap-1">
                        {assignedStaff.slice(0, 4).map((emp) => {
                          const pos = positions.find((p) => p.position_id === emp.position_id);
                          return (
                            <span
                              key={emp.employee_id}
                              className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium"
                              title={`${emp.fullname} - ${pos?.name}`}
                            >
                              {emp.fullname.split(' ')[0]}
                            </span>
                          );
                        })}
                        {assignedStaff.length > 4 && (
                          <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-md font-mono">
                            +{assignedStaff.length - 4}
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400 italic">ยังไม่มีบุคลากรสังกัดในฝ่ายนี้</p>
                  )}
                </div>

                {/* Associated Positions */}
                <div className="pt-2 border-t border-slate-100 space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <Briefcase className="w-3 h-3 text-purple-500" />
                      <span>ตำแหน่งงานที่พบในฝ่าย:</span>
                    </span>
                    <span className="font-mono font-semibold text-slate-700">
                      {posInDept.length} ตำแหน่ง
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {posInDept.length > 0 ? (
                      posInDept.map((name, idx) => (
                        <span
                          key={idx}
                          className="text-[9px] px-1.5 py-0.5 rounded font-medium bg-slate-100 text-slate-700 border border-slate-200"
                        >
                          {name}
                        </span>
                      ))
                    ) : (
                      <span className="text-[10px] text-slate-400">-</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Department Modal */}
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
              <span>เพิ่มฝ่าย / แผนกใหม่ (Department Master)</span>
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
                  รหัสฝ่าย / แผนก (Department ID)
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={newDeptId}
                  onChange={(e) => setNewDeptId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:bg-white"
                  placeholder="เช่น 4"
                />
              </div>}

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  ชื่อฝ่าย / แผนก (Department Name)
                </label>
                <input
                  type="text"
                  required
                  value={newDeptName}
                  onChange={(e) => setNewDeptName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:bg-white"
                  placeholder="เช่น ฝ่ายความปลอดภัยและตรวจการ, ฝ่ายสื่อสารองค์กร"
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
                  บันทึกฝ่าย / แผนก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Department Modal */}
      {editingDept && canEdit && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full relative shadow-xl">
            <button
              onClick={() => setEditingDept(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Edit className="w-4 h-4 text-purple-600" />
              <span>แก้ไขชื่อฝ่าย / แผนก #{editingDept.department_id}</span>
            </h3>

            <form onSubmit={handleUpdate} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  รหัสฝ่าย / แผนก (Department ID)
                </label>
                <input
                  type="text"
                  disabled
                  value={editingDept.department_id}
                  className="w-full bg-slate-100 border border-slate-200 rounded-xl p-2.5 text-slate-500 font-mono cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  ชื่อฝ่าย / แผนก (Department Name)
                </label>
                <input
                  type="text"
                  required
                  value={editingDept.name}
                  onChange={(e) => setEditingDept({ ...editingDept, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:bg-white"
                />
              </div>

              <div className="pt-2 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setEditingDept(null)}
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
