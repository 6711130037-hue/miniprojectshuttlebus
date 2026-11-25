import React, { useState } from 'react';
import { useBus } from '../../../context/BusContext';
import { Employee, Vehicle } from '../../../types/schema';
import {
  Users,
  Car,
  Search,
  Plus,
  Edit,
  Trash2,
  X,
  Lock,
  Eye,
  EyeOff,
  KeyRound,
  Bus,
  Fuel,
  User as UserIcon,
  Phone,
  Mail,
  Briefcase,
} from 'lucide-react';

interface FleetStaffManagementViewProps {
  canEdit?: boolean;
}

export const FleetStaffManagementView: React.FC<FleetStaffManagementViewProps> = ({ canEdit = true }) => {
  const {
    vehicles,
    employees,
    positions,
    departments,
    apiMode,
    apiCreateEmployee,
    apiUpdateEmployee,
    apiCreateVehicle,
    apiUpdateVehicle,
    apiSetVehicleStatus,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    addVehicle,
    updateVehicle,
    setVehicleStatus,
  } = useBus();

  const [activeTab, setActiveTab] = useState<'vehicles' | 'employees'>('employees');
  const [empSearchQuery, setEmpSearchQuery] = useState('');
  const [showAddEmpModal, setShowAddEmpModal] = useState(false);
  const [showAddVehicleModal, setShowAddVehicleModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [editingEmp, setEditingEmp] = useState<Employee | null>(null);
  const [showAddPassword, setShowAddPassword] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [editPassword, setEditPassword] = useState('');
  const [employeeUpdateError, setEmployeeUpdateError] = useState('');
  const [isUpdatingEmployee, setIsUpdatingEmployee] = useState(false);

  // New employee state
  const [newEmpName, setNewEmpName] = useState('');
  const [newEmpPosId, setNewEmpPosId] = useState(8);
  const [newEmpDeptId, setNewEmpDeptId] = useState(3);
  const [newEmpPhone, setNewEmpPhone] = useState('081-999-8888');
  const [newEmpEmail, setNewEmpEmail] = useState('driver@mut.ac.th');
  const [newEmpUser, setNewEmpUser] = useState('');
  const [newEmpPassword, setNewEmpPassword] = useState('');
  const [employeeCreateError, setEmployeeCreateError] = useState('');
  const [newVehicleId, setNewVehicleId] = useState('');
  const [newVehiclePlate, setNewVehiclePlate] = useState('');
  const [newVehicleType, setNewVehicleType] = useState<'รถตู้' | 'รถบัส'>('รถตู้');
  const [newVehicleCapacity, setNewVehicleCapacity] = useState(9);
  const [vehicleSearchQuery, setVehicleSearchQuery] = useState('');
  const [vehicleCreateError, setVehicleCreateError] = useState('');
  const [isCreatingVehicle, setIsCreatingVehicle] = useState(false);

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;
    setEmployeeCreateError('');
    const employee = {
      fullname: newEmpName.trim(),
      position_id: newEmpPosId,
      department_id: newEmpDeptId,
      phone: newEmpPhone.trim(),
      email: newEmpEmail.trim(),
      username: newEmpUser.trim() || `user_${Date.now().toString().slice(-4)}`,
      password: newEmpPassword,
    };
    try {
      if (apiMode) await apiCreateEmployee(employee);
      else addEmployee(employee);
      setNewEmpName('');
      setNewEmpUser('');
      setNewEmpPassword('');
      setShowAddEmpModal(false);
    } catch (error) {
      setEmployeeCreateError(error instanceof Error ? error.message : 'เพิ่มพนักงานไม่สำเร็จ');
    }
  };

  const openAddVehicleModal = () => {
    const numericIds = vehicles.map((vehicle) => Number(vehicle.vehicle_id)).filter(Number.isSafeInteger);
    const nextId = (numericIds.length ? Math.max(...numericIds) : 0) + 1;
    setNewVehicleId(String(nextId).padStart(3, '0'));
    setNewVehiclePlate('');
    setNewVehicleType('รถตู้');
    setNewVehicleCapacity(9);
    setEditingVehicle(null);
    setVehicleCreateError('');
    setShowAddVehicleModal(true);
  };

  const handleCreateVehicle = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canEdit || isCreatingVehicle) return;
    if (!newVehicleId.trim() || !newVehiclePlate.trim() || !Number.isInteger(newVehicleCapacity) || newVehicleCapacity < 1 || newVehicleCapacity > 999) {
      setVehicleCreateError('กรุณากรอกรหัส ทะเบียนรถ และความจุให้ถูกต้อง');
      return;
    }
    setVehicleCreateError('');
    setIsCreatingVehicle(true);
    try {
      const vehicle = { vehicle_id: newVehicleId.trim(), license_plate: newVehiclePlate.trim(), type: newVehicleType, capacity: newVehicleCapacity };
      if (editingVehicle) {
        if (apiMode) await apiUpdateVehicle(vehicle);
        else updateVehicle(vehicle);
      } else if (apiMode) await apiCreateVehicle(vehicle);
      else addVehicle({ ...vehicle, status: 1 });
      setShowAddVehicleModal(false);
      setEditingVehicle(null);
    } catch (cause) {
      setVehicleCreateError(cause instanceof Error ? cause.message : 'บันทึกยานพาหนะไม่สำเร็จ');
    } finally {
      setIsCreatingVehicle(false);
    }
  };

  const openEditVehicleModal = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setNewVehicleId(vehicle.vehicle_id);
    setNewVehiclePlate(vehicle.license_plate);
    setNewVehicleType(vehicle.type);
    setNewVehicleCapacity(vehicle.capacity);
    setVehicleCreateError('');
    setShowAddVehicleModal(true);
  };

  const handleVehicleStatusChange = async (vehicle: Vehicle) => {
    const nextStatus: 0 | 1 = vehicle.status === 1 ? 0 : 1;
    const action = nextStatus === 0 ? 'ปิดใช้งาน' : 'เปิดใช้งาน';
    const description = nextStatus === 0
      ? 'ประวัติรถจะยังอยู่ในระบบ และรถที่มีรอบกำลังวิ่งหรือมีผู้โดยสารจองจะปิดไม่ได้'
      : 'รถจะกลับมาเลือกใช้จัดรอบและเปิดจองได้';
    if (!confirm(`${action}รถทะเบียน ${vehicle.license_plate}?\n${description}`)) return;
    try {
      if (apiMode) await apiSetVehicleStatus(vehicle.vehicle_id, nextStatus);
      else await setVehicleStatus(vehicle.vehicle_id, nextStatus);
    } catch (error) {
      alert(error instanceof Error ? error.message : `${action}รถไม่สำเร็จ`);
    }
  };

  const handleUpdateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit || !editingEmp || isUpdatingEmployee) return;
    setEmployeeUpdateError('');
    setIsUpdatingEmployee(true);
    try {
      if (apiMode) await apiUpdateEmployee(editingEmp, editPassword);
      else updateEmployee({ ...editingEmp, ...(editPassword.trim() ? { password: editPassword.trim() } : {}) });
      setEditingEmp(null);
      setEditPassword('');
    } catch (error) {
      setEmployeeUpdateError(error instanceof Error ? error.message : 'บันทึกข้อมูลพนักงานไม่สำเร็จ');
    } finally {
      setIsUpdatingEmployee(false);
    }
  };

  const filteredEmployees = employees.filter((emp) => {
    const q = empSearchQuery.toLowerCase().trim();
    if (!q) return true;
    const pos = positions.find((p) => p.position_id === emp.position_id);
    return (
      emp.employee_id.toLowerCase().includes(q) ||
      emp.fullname.toLowerCase().includes(q) ||
      emp.username.toLowerCase().includes(q) ||
      emp.phone.toLowerCase().includes(q) ||
      emp.email.toLowerCase().includes(q) ||
      (pos?.name && pos.name.toLowerCase().includes(q)) ||
      `ฝ่าย ${emp.department_id}`.toLowerCase().includes(q)
    );
  });

  const filteredVehicles = vehicles.filter((vehicle) => {
    const q = vehicleSearchQuery.toLowerCase().trim();
    if (!q) return true;
    return vehicle.vehicle_id.toLowerCase().includes(q)
      || vehicle.license_plate.toLowerCase().includes(q)
      || vehicle.type.toLowerCase().includes(q)
      || (vehicle.status === 1 ? 'พร้อมให้บริการ active พร้อม' : 'ปิดใช้งาน inactive ไม่พร้อม').includes(q);
  });

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-5 shadow-sm">
      {/* ============ HEADER ============ */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <div className="text-[11px] text-slate-500 font-mono font-semibold flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
              หน้าจอ 20 · Code 1101
            </span>
            {!canEdit && (
              <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[10px]">
                🔒 Read-Only
              </span>
            )}
          </div>
          <h2 className="text-lg font-bold text-slate-900 mt-1 flex items-center gap-2">
            <Users className="w-5 h-5 text-slate-700" />
            <span>พนักงาน & ยานพาหนะ</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            จัดการข้อมูลพนักงาน (Employee) และยานพาหนะ (Vehicle)
          </p>
        </div>

        {canEdit && activeTab === 'employees' && (
          <button
            onClick={() => {
              setEmployeeCreateError('');
              if (apiMode) {
                setNewEmpPosId(positions[0]?.position_id ?? 0);
                setNewEmpDeptId(departments[0]?.department_id ?? 0);
              }
              setShowAddEmpModal(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-sm transition-all shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>เพิ่มพนักงานใหม่</span>
          </button>
        )}
        {canEdit && activeTab === 'vehicles' && (
          <button
            onClick={openAddVehicleModal}
            className="flex shrink-0 items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition-all hover:bg-slate-800"
          >
            <Plus className="h-4 w-4" />
            <span>เพิ่มยานพาหนะใหม่</span>
          </button>
        )}
      </div>

      {/* ============ TAB SWITCHER ============ */}
      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 w-fit">
        <button
          onClick={() => setActiveTab('employees')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'employees'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>พนักงาน</span>
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${
              activeTab === 'employees' ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-600'
            }`}
          >
            {employees.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('vehicles')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'vehicles'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Car className="w-3.5 h-3.5" />
          <span>ยานพาหนะ</span>
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${
              activeTab === 'vehicles' ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-600'
            }`}
          >
            {vehicles.length}
          </span>
        </button>
      </div>

      {/* ============ EMPLOYEES TAB ============ */}
      {activeTab === 'employees' && (
        <>
          {/* Search bar */}
          <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={empSearchQuery}
                onChange={(e) => setEmpSearchQuery(e.target.value)}
                placeholder="ค้นหา: รหัส, ชื่อ, ตำแหน่ง, Username, เบอร์โทร, ฝ่าย..."
                className="w-full pl-9 pr-8 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 text-slate-800 placeholder:text-slate-400"
              />
              {empSearchQuery && (
                <button
                  onClick={() => setEmpSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <div className="text-[11px] text-slate-500 whitespace-nowrap">
              แสดง <strong className="text-slate-700">{filteredEmployees.length}</strong> จาก{' '}
              {employees.length} คน
            </div>
          </div>

          {/* Employee list */}
          {filteredEmployees.length === 0 ? (
            <div className="p-10 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-2">
              <Users className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-sm font-semibold text-slate-600">
                ไม่พบพนักงานที่ตรงกับ "{empSearchQuery}"
              </p>
              <button
                onClick={() => setEmpSearchQuery('')}
                className="text-xs text-slate-700 underline font-semibold"
              >
                ล้างคำค้นหา
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {filteredEmployees.map((emp) => {
                const pos = positions.find((p) => p.position_id === emp.position_id);
                const dept = departments.find((d) => d.department_id === emp.department_id);

                return (
                  <div
                    key={emp.employee_id}
                    className="bg-white border border-slate-200 rounded-xl p-4 hover:border-slate-300 hover:shadow-sm transition-all space-y-3"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-slate-100">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 text-slate-600">
                          <UserIcon className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-bold text-slate-900 truncate">
                            {emp.fullname}
                          </div>
                          <div className="flex items-center gap-1 text-[10px] mt-0.5">
                            <span className="font-mono font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                              #{emp.employee_id}
                            </span>
                          </div>
                        </div>
                      </div>

                      {canEdit && (
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => {
                              setEditingEmp({
                                employee_id: emp.employee_id,
                                fullname: emp.fullname,
                                username: emp.username,
                                phone: emp.phone,
                                email: emp.email,
                                department_id: emp.department_id,
                                position_id: emp.position_id,
                              });
                              setEditPassword('');
                              setEmployeeUpdateError('');
                              setShowEditPassword(false);
                            }}
                            className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                            title="แก้ไข"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          {emp.employee_id !== '00001' && (
                            <button
                              onClick={() => {
                                if (confirm(`ลบพนักงาน ${emp.fullname}?`)) {
                                  void deleteEmployee(emp.employee_id).catch((error) => {
                                    alert(error instanceof Error ? error.message : 'ซ่อนพนักงานไม่สำเร็จ');
                                  });
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="ลบ"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Info rows */}
                    <div className="space-y-1.5 text-[11px]">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">
                          <strong className="text-slate-800">{pos?.name}</strong>
                          <span className="text-slate-400"> · </span>
                          <span>{dept?.name || `ฝ่าย ${emp.department_id}`}</span>
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-slate-600">
                        <KeyRound className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-mono text-slate-700 truncate">{emp.username}</span>
                      </div>

                      <div className="flex items-center gap-2 text-slate-600">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-mono truncate">{emp.phone}</span>
                      </div>

                      <div className="flex items-center gap-2 text-slate-600">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{emp.email}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ============ VEHICLES TAB ============ */}
      {activeTab === 'vehicles' && (
        <>
          <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={vehicleSearchQuery}
                onChange={(event) => setVehicleSearchQuery(event.target.value)}
                placeholder="ค้นหา: รหัสรถ, ทะเบียน, ประเภทรถ, สถานะ..."
                className="w-full pl-9 pr-8 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 text-slate-800 placeholder:text-slate-400"
              />
              {vehicleSearchQuery && (
                <button onClick={() => setVehicleSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5" aria-label="ล้างคำค้นหา">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <div className="text-[11px] text-slate-500 whitespace-nowrap">
              แสดง <strong className="text-slate-700">{filteredVehicles.length}</strong> จาก {vehicles.length} คัน
            </div>
          </div>

          {filteredVehicles.length === 0 ? (
            <div className="p-10 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-2">
              <Car className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-sm font-semibold text-slate-600">ไม่พบยานพาหนะที่ตรงกับ “{vehicleSearchQuery}”</p>
              <button onClick={() => setVehicleSearchQuery('')} className="text-xs text-slate-700 underline font-semibold">ล้างคำค้นหา</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {filteredVehicles.map((v) => (
            <div
              key={v.vehicle_id}
              className="bg-white border border-slate-200 rounded-xl p-4 hover:border-slate-300 hover:shadow-sm transition-all space-y-3"
            >
              <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-slate-100">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                      v.type === 'รถตู้'
                        ? 'bg-slate-100 text-slate-600 border-slate-200'
                        : v.type === 'รถบัส'
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    <Bus className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-slate-900 truncate font-mono">
                      {v.license_plate}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      รหัส: #{v.vehicle_id}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${v.status === 1 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                    {v.status === 1 ? 'พร้อม' : 'ปิดใช้งาน'}
                  </span>
                  {canEdit && (
                    <>
                      <button type="button" onClick={() => openEditVehicleModal(v)} className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg" title="แก้ไขยานพาหนะ" aria-label={`แก้ไข ${v.license_plate}`}>
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button type="button" onClick={() => void handleVehicleStatusChange(v)} className={`p-1.5 rounded-lg ${v.status === 1 ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50' : 'text-slate-400 hover:text-emerald-700 hover:bg-emerald-50'}`} title={v.status === 1 ? 'ปิดใช้งานยานพาหนะ' : 'เปิดใช้งานยานพาหนะ'} aria-label={`${v.status === 1 ? 'ปิดใช้งาน' : 'เปิดใช้งาน'} ${v.license_plate}`}>
                        {v.status === 1 ? <Trash2 className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-1.5 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-500">ประเภทรถ</span>
                  <span className="font-bold text-slate-800">{v.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">ความจุที่นั่ง</span>
                  <span className="font-bold text-slate-800 font-mono">
                    {v.capacity} ที่นั่ง
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">สถานะ</span>
                  <span className={`font-bold ${v.status === 1 ? 'text-emerald-700' : 'text-slate-500'}`}>{v.status === 1 ? 'พร้อมให้บริการ' : 'ปิดใช้งาน'}</span>
                </div>
              </div>
            </div>
          ))}
            </div>
          )}
        </>
      )}

      {/* ============ ADD EMPLOYEE MODAL ============ */}
      {showAddVehicleModal && canEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white">{editingVehicle ? <Edit className="h-4 w-4" /> : <Plus className="h-4 w-4" />}</div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">{editingVehicle ? 'แก้ไขยานพาหนะ' : 'เพิ่มยานพาหนะใหม่'}</h3>
                  <p className="text-[11px] text-slate-500">{editingVehicle ? `แก้ไขข้อมูลรหัส ${editingVehicle.vehicle_id}` : 'กรอกข้อมูลยานพาหนะ (Vehicle Master)'}</p>
                </div>
              </div>
              <button onClick={() => { setShowAddVehicleModal(false); setEditingVehicle(null); }} className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="ปิด"><X className="h-4 w-4" /></button>
            </div>

            {vehicleCreateError && <div className="rounded-xl border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-700">{vehicleCreateError}</div>}
            <form onSubmit={handleCreateVehicle} className="space-y-3.5 text-xs">
              <div>
                <label className="mb-1.5 block font-bold text-slate-700">รหัสยานพาหนะ (Vehicle ID)</label>
                <input required readOnly={Boolean(editingVehicle)} value={newVehicleId} onChange={(event) => setNewVehicleId(event.target.value)} placeholder="เช่น 008" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 font-mono text-slate-900 read-only:cursor-not-allowed read-only:opacity-70 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10" />
              </div>
              <div>
                <label className="mb-1.5 block font-bold text-slate-700">ทะเบียนรถ</label>
                <input required value={newVehiclePlate} onChange={(event) => setNewVehiclePlate(event.target.value)} placeholder="เช่น 1กข 1234" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block font-bold text-slate-700">ประเภทยานพาหนะ</label>
                  <select value={newVehicleType} onChange={(event) => { const type = event.target.value as 'รถตู้' | 'รถบัส'; setNewVehicleType(type); setNewVehicleCapacity(type === 'รถตู้' ? 9 : 20); }} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10">
                    <option value="รถตู้">รถตู้</option>
                    <option value="รถบัส">รถบัส</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block font-bold text-slate-700">ความจุที่นั่ง</label>
                  <input type="number" required min={1} value={newVehicleCapacity} onChange={(event) => setNewVehicleCapacity(Number(event.target.value))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10" />
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
                <button type="button" onClick={() => { setShowAddVehicleModal(false); setEditingVehicle(null); }} className="rounded-xl px-4 py-2.5 font-bold text-slate-600 hover:bg-slate-100">ยกเลิก</button>
                <button type="submit" disabled={isCreatingVehicle} className="rounded-xl bg-slate-900 px-5 py-2.5 font-bold text-white shadow-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60">{isCreatingVehicle ? 'กำลังบันทึก…' : editingVehicle ? 'บันทึกการแก้ไข' : 'บันทึกยานพาหนะ'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddEmpModal && canEdit && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-lg w-full relative shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">เพิ่มพนักงานใหม่</h3>
                  <p className="text-[11px] text-slate-500">กรอกข้อมูลพนักงาน (Master.1 Employee)</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddEmpModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateEmployee} className="space-y-3.5 text-xs">
              {employeeCreateError && <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-rose-700">{employeeCreateError}</div>}
              <div>
                <label className="block text-slate-700 font-bold mb-1.5">ชื่อ-นามสกุล</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น นายเอกชัย ใจมั่น"
                  value={newEmpName}
                  onChange={(e) => setNewEmpName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1.5">ตำแหน่ง</label>
                  <select
                    value={newEmpPosId}
                    onChange={(e) => setNewEmpPosId(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                  >
                    {positions.map((p) => (
                      <option key={p.position_id} value={p.position_id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1.5">ฝ่าย / แผนก</label>
                  <select
                    value={newEmpDeptId}
                    onChange={(e) => setNewEmpDeptId(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                  >
                    {departments.map((d) => (
                      <option key={d.department_id} value={d.department_id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1.5">เบอร์โทร</label>
                  <input
                    type="text"
                    value={newEmpPhone}
                    onChange={(e) => setNewEmpPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1.5">อีเมล</label>
                  <input
                    type="email"
                    value={newEmpEmail}
                    onChange={(e) => setNewEmpEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1.5">Username</label>
                <input
                  type="text"
                  placeholder="เช่น driver_new"
                  value={newEmpUser}
                  onChange={(e) => setNewEmpUser(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-slate-700 font-bold">รหัสผ่าน</label>
                  <span className="text-slate-400 font-normal text-[10px]">อย่างน้อย 8 ตัวอักษร</span>
                </div>
                <div className="relative">
                  <input
                    type={showAddPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={newEmpPassword}
                    onChange={(e) => setNewEmpPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 pr-10 text-slate-900 font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAddPassword(!showAddPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1"
                  >
                    {showAddPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddEmpModal(false)}
                  className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-bold"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold shadow-sm"
                >
                  บันทึกพนักงาน
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============ EDIT EMPLOYEE MODAL ============ */}
      {editingEmp && canEdit && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-lg w-full relative shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center">
                  <Edit className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">แก้ไขข้อมูลพนักงาน</h3>
                  <p className="text-[11px] text-slate-500 font-mono">
                    #{editingEmp.employee_id}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingEmp(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateEmployee} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1.5">ชื่อ-นามสกุล</label>
                <input
                  type="text"
                  required
                  value={editingEmp.fullname}
                  onChange={(e) => setEditingEmp({ ...editingEmp, fullname: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1.5">ตำแหน่ง</label>
                  <select
                    value={editingEmp.position_id}
                    onChange={(e) =>
                      setEditingEmp({ ...editingEmp, position_id: Number(e.target.value) })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                  >
                    {positions.map((p) => (
                      <option key={p.position_id} value={p.position_id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1.5">ฝ่าย / แผนก</label>
                  <select
                    value={editingEmp.department_id}
                    onChange={(e) =>
                      setEditingEmp({ ...editingEmp, department_id: Number(e.target.value) })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                  >
                    {departments.map((d) => (
                      <option key={d.department_id} value={d.department_id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1.5">เบอร์โทร</label>
                  <input
                    type="text"
                    value={editingEmp.phone}
                    onChange={(e) => setEditingEmp({ ...editingEmp, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1.5">อีเมล</label>
                  <input
                    type="email"
                    value={editingEmp.email}
                    onChange={(e) => setEditingEmp({ ...editingEmp, email: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1.5">Username</label>
                <input
                  type="text"
                  value={editingEmp.username}
                  onChange={(e) => setEditingEmp({ ...editingEmp, username: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-slate-700 font-bold">รหัสผ่านใหม่</label>
                  <span className="text-slate-400 font-normal text-[10px]">เว้นว่างหากไม่ต้องการเปลี่ยน</span>
                </div>
                <div className="relative">
                  <input
                    type={showEditPassword ? 'text' : 'password'}
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    autoComplete="new-password"
                    minLength={editPassword ? 8 : undefined}
                    maxLength={128}
                    placeholder="อย่างน้อย 8 ตัวอักษร"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 pr-10 text-slate-900 font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEditPassword(!showEditPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1"
                  >
                    {showEditPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {employeeUpdateError && (
                <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-rose-700">
                  {employeeUpdateError}
                </p>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setEditingEmp(null);
                    setEditPassword('');
                    setEmployeeUpdateError('');
                  }}
                  disabled={isUpdatingEmployee}
                  className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-bold"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingEmployee}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white rounded-xl font-bold shadow-sm"
                >
                  {isUpdatingEmployee ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
