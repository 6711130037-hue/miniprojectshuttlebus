import React, { useMemo, useState } from 'react';
import { BusFront, Plus, Search, X, AlertCircle } from 'lucide-react';
import { useBus } from '../../../context/BusContext';
import { VehicleType } from '../../../types/schema';

interface VehicleTypeManagementViewProps {
  canEdit?: boolean;
}

export const VehicleTypeManagementView: React.FC<VehicleTypeManagementViewProps> = ({ canEdit = true }) => {
  const { vehicleTypes, addVehicleType, apiCreateVehicleType, apiMode } = useBus();
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [vehicleTypeId, setVehicleTypeId] = useState<number | ''>('');
  const [name, setName] = useState<VehicleType['name'] | ''>('');
  const [error, setError] = useState('');

  const filteredTypes = useMemo(() => vehicleTypes.filter((item) =>
    item.name.toLowerCase().includes(search.trim().toLowerCase()) || String(item.vehicle_type_id).includes(search.trim())
  ), [vehicleTypes, search]);

  const openAdd = () => {
    setError('');
    setVehicleTypeId(vehicleTypes.length ? Math.max(...vehicleTypes.map((item) => item.vehicle_type_id)) + 1 : 1);
    setName('');
    setShowAddModal(true);
  };

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canEdit) return;
    if ((!apiMode && vehicleTypeId === '') || !name) {
      setError(apiMode ? 'กรุณาเลือกชื่อประเภทยานพาหนะ' : 'กรุณากรอกรหัสและเลือกชื่อประเภทยานพาหนะ');
      return;
    }
    setError('');
    try {
      if (apiMode) await apiCreateVehicleType(name);
      else addVehicleType(name, Number(vehicleTypeId));
      setShowAddModal(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'บันทึกประเภทยานพาหนะไม่สำเร็จ');
    }
  };

  return (
    <div className="space-y-5">
      <section className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
            <BusFront className="h-5 w-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-black text-slate-900">จัดการประเภทยานพาหนะ</h2>
              <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-bold text-blue-800">{vehicleTypes.length} ประเภท</span>
            </div>
            <p className="text-xs text-slate-500">กำหนดรหัสและชื่อประเภทรถที่ใช้ในระบบ</p>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="relative min-w-0 flex-1 sm:w-60">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ค้นหาชื่อหรือรหัส..." className="w-full rounded-xl border border-slate-300 bg-slate-50 py-2 pl-9 pr-3 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
          </div>
          {canEdit && (
            <button onClick={openAdd} className="flex shrink-0 items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700">
              <Plus className="h-4 w-4" /> เพิ่มประเภท
            </button>
          )}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filteredTypes.map((item) => (
          <article key={item.vehicle_type_id} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 font-mono text-xs font-bold text-slate-700">#{item.vehicle_type_id}</span>
            <div>
              <h3 className="font-bold text-slate-900">{item.name}</h3>
              <p className="text-[11px] text-slate-500">รหัสประเภทยานพาหนะ: <span className="font-mono">{item.vehicle_type_id}</span></p>
            </div>
          </article>
        ))}
        {filteredTypes.length === 0 && <p className="col-span-full rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">ไม่พบประเภทยานพาหนะ</p>}
      </section>

      {showAddModal && canEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <button onClick={() => setShowAddModal(false)} className="absolute right-4 top-4 text-slate-400 hover:text-slate-700" aria-label="ปิด"><X className="h-5 w-5" /></button>
            <h3 className="mb-4 flex items-center gap-2 text-base font-bold text-slate-900"><Plus className="h-4 w-4 text-blue-600" />เพิ่มประเภทยานพาหนะใหม่</h3>
            {error && <div className="mb-3 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-2.5 text-xs text-red-700"><AlertCircle className="h-4 w-4 shrink-0" />{error}</div>}
            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="mb-1 block font-semibold text-slate-700">รหัสประเภทยานพาหนะ (Vehicle Type ID)</label>
                {apiMode ? (
                  <p className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-slate-600">Oracle จะกำหนดรหัสให้อัตโนมัติเมื่อบันทึก</p>
                ) : (
                  <input type="number" required min={1} value={vehicleTypeId} onChange={(event) => setVehicleTypeId(event.target.value ? Number(event.target.value) : '')} className="w-full rounded-xl border border-slate-300 bg-slate-50 p-2.5 font-mono text-slate-900 focus:bg-white" placeholder="เช่น 2" />
                )}
              </div>
              <div>
                <label className="mb-1 block font-semibold text-slate-700">ชื่อประเภทยานพาหนะ (Name)</label>
                <select required value={name} onChange={(event) => setName(event.target.value as VehicleType['name'] | '')} className="w-full rounded-xl border border-slate-300 bg-slate-50 p-2.5 text-slate-900 focus:bg-white">
                  <option value="" disabled>เลือกประเภทยานพาหนะ</option>
                  <option value="รถตู้" disabled={vehicleTypes.some((item) => item.name === 'รถตู้')}>รถตู้</option>
                  <option value="รถบัส" disabled={vehicleTypes.some((item) => item.name === 'รถบัส')}>รถบัส</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="rounded-xl bg-slate-100 px-4 py-2 font-bold text-slate-700 hover:bg-slate-200">ยกเลิก</button>
                <button type="submit" className="rounded-xl bg-blue-600 px-4 py-2 font-bold text-white shadow-xs hover:bg-blue-700">บันทึกประเภท</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
