import React, { useEffect, useState } from 'react';
import { useBus } from '../../context/BusContext';
import {
  Shield,
  Calendar,
  QrCode,
  Users,
  Eye,
  Sliders,
  BarChart3,
  Briefcase,
  Building2,
  Navigation,
  ChevronDown,
  LayoutGrid,
  Wrench,
  UserCog,
  FileBarChart,
  BusFront,
} from 'lucide-react';
import { TripsManagementView } from './screens/TripsManagementView';
import { RoutesManagementView } from './screens/RoutesManagementView';
import { CheckInScannerView } from './screens/CheckInScannerView';
import { RbacManagementView } from './screens/RbacManagementView';
import { FleetStaffManagementView } from './screens/FleetStaffManagementView';
import { PositionManagementView } from './screens/PositionManagementView';
import { DepartmentManagementView } from './screens/DepartmentManagementView';
import { VehicleTypeManagementView } from './screens/VehicleTypeManagementView';
import { AdminReportsView } from '../reports/AdminReportsView';

type AdminTab =
  | 'trips'
  | 'routes'
  | 'checkin'
  | 'rbac'
  | 'fleet'
  | 'reports'
  | 'positions'
  | 'departments'
  | 'vehicle-types';

type CategoryId = 'operations' | 'personnel' | 'system';

interface SubTab {
  id: AdminTab;
  label: string;
  shortLabel: string;
  icon: React.ElementType;
  badge?: string;
  group: CategoryId;
}

interface Category {
  id: CategoryId;
  label: string;
  shortLabel: string;
  icon: React.ElementType;
}

const CATEGORIES: Category[] = [
  { id: 'operations', label: 'จัดการการเดินรถ', shortLabel: 'เดินรถ', icon: Navigation },
  { id: 'personnel', label: 'จัดการบุคลากร', shortLabel: 'บุคลากร', icon: Users },
  { id: 'system', label: 'รายงาน & ระบบ', shortLabel: 'ระบบ', icon: Wrench },
];

const SCREEN_ID_BY_TAB: Record<AdminTab, number> = {
  trips: 10,
  routes: 12,
  checkin: 14,
  rbac: 16,
  fleet: 20,
  reports: 18,
  positions: 22,
  departments: 24,
  'vehicle-types': 20,
};

export const AdminPortal: React.FC = () => {
  const {
    currentAdmin,
    setCurrentAdmin,
    employees,
    positions,
    departments,
    vehicleTypes,
    canViewScreen,
    canEditScreen,
    getPermittedScreens,
  } = useBus();

  const [activeTab, setActiveTab] = useState<AdminTab>('trips');
  const [activeCategory, setActiveCategory] = useState<CategoryId>('operations');
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);

  const currentPos = positions.find((p) => p.position_id === currentAdmin.position_id);
  const currentDept = departments.find((d) => d.department_id === currentAdmin.department_id);
  const adminEmployees = employees.filter((employee) => canEditScreen(16, employee.position_id));

  const subTabs: SubTab[] = [
    {
      id: 'trips',
      label: 'จัดการรอบรถ',
      shortLabel: 'รอบรถ',
      icon: Calendar,
      badge: 'จอ 10',
      group: 'operations',
    },
    {
      id: 'routes',
      label: 'จัดการเส้นทาง & จุดจอด',
      shortLabel: 'เส้นทาง/จุดจอด',
      icon: Navigation,
      badge: 'จอ 12',
      group: 'operations',
    },
    {
      id: 'checkin',
      label: 'ตรวจเช็คอิน',
      shortLabel: 'เช็คอิน',
      icon: QrCode,
      badge: 'จอ 14',
      group: 'operations',
    },
    {
      id: 'fleet',
      label: 'พนักงาน & รถ',
      shortLabel: 'พนักงาน&รถ',
      icon: Users,
      badge: 'จอ 20',
      group: 'personnel',
    },
    {
      id: 'positions',
      label: 'ตำแหน่ง',
      shortLabel: 'ตำแหน่ง',
      icon: Briefcase,
      badge: `${positions.length}`,
      group: 'personnel',
    },
    {
      id: 'departments',
      label: 'ฝ่าย / แผนก',
      shortLabel: 'ฝ่าย',
      icon: Building2,
      badge: `${departments.length}`,
      group: 'personnel',
    },
    {
      id: 'vehicle-types',
      label: 'ประเภทยานพาหนะ',
      shortLabel: 'ประเภทรถ',
      icon: BusFront,
      badge: `${vehicleTypes.length}`,
      group: 'personnel',
    },
    {
      id: 'rbac',
      label: 'กำหนดสิทธิ์',
      shortLabel: 'สิทธิ์',
      icon: Shield,
      badge: 'จอ 16',
      group: 'system',
    },
    {
      id: 'reports',
      label: 'รายงานสถิติ',
      shortLabel: 'รายงาน',
      icon: BarChart3,
      badge: 'จอ 18',
      group: 'system',
    },
  ];

  const permittedTabs = subTabs.filter((tab) =>
    canViewScreen(SCREEN_ID_BY_TAB[tab.id], currentAdmin.position_id)
  );
  const visibleTabs = permittedTabs.filter((tab) => tab.group === activeCategory);
  const visibleCategories = CATEGORIES.filter((category) =>
    permittedTabs.some((tab) => tab.group === category.id)
  );

  useEffect(() => {
    if (permittedTabs.some((tab) => tab.id === activeTab)) return;
    const firstPermittedTab = permittedTabs[0];
    if (firstPermittedTab) {
      setActiveTab(firstPermittedTab.id);
      setActiveCategory(firstPermittedTab.group);
    }
  }, [activeTab, permittedTabs]);

  const handleSelectTab = (tabId: AdminTab) => {
    setActiveTab(tabId);
    const tab = subTabs.find((t) => t.id === tabId);
    if (tab) setActiveCategory(tab.group);
  };

  const handleSelectCategory = (catId: CategoryId) => {
    setActiveCategory(catId);
    setCategoryDropdownOpen(false);
    const firstTab = permittedTabs.find((t) => t.group === catId);
    if (firstTab) setActiveTab(firstTab.id);
  };

  const ActiveCategoryIcon = CATEGORIES.find((c) => c.id === activeCategory)?.icon || Navigation;
  const ActiveCategoryLabel = CATEGORIES.find((c) => c.id === activeCategory)?.label || 'จัดการ';

  return (
    <div className="space-y-6">
      {/* ==================== ADMIN HEADER ==================== */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center shrink-0 shadow-sm">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Admin Console
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {currentPos?.name || 'หัวหน้าฝ่าย'} · {currentDept?.name || 'ฝ่ายบริหาร'}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-0.5">
                ศูนย์จัดการระบบขนส่ง
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                {currentAdmin.fullname} · รหัส{' '}
                <span className="font-mono text-slate-700 font-semibold">
                  {currentAdmin.employee_id}
                </span>{' '}
                · {currentAdmin.email}
              </p>
            </div>
          </div>

          {/* Switch between administrator personas only */}
          <div className="flex items-center gap-2 shrink-0">
            <label className="text-xs text-slate-600 font-medium hidden sm:block">สลับผู้ดูแลระบบ:</label>
            <select
              value={currentAdmin.employee_id}
              title="แสดงเฉพาะพนักงานในตำแหน่งที่มีสิทธิ์จัดการ RBAC (Code 9102)"
              onChange={(e) => {
                const emp = adminEmployees.find((x) => x.employee_id === e.target.value);
                if (emp) setCurrentAdmin(emp);
              }}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 cursor-pointer"
            >
              {adminEmployees.map((emp) => {
                const p = positions.find((pos) => pos.position_id === emp.position_id);
                return (
                  <option key={emp.employee_id} value={emp.employee_id}>
                    {emp.fullname} ({p?.name} · #{emp.employee_id})
                  </option>
                );
              })}
            </select>
          </div>
        </div>
      </div>

      {/* ==================== TAB NAVIGATION ==================== */}
      <div className="bg-white border border-slate-200 rounded-2xl p-2 shadow-sm">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2">
          {/* Category dropdown (mobile/small screens) */}
          <div className="relative lg:hidden">
            <button
              onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
              className="w-full flex items-center justify-between gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-semibold text-sm"
            >
              <span className="flex items-center gap-2">
                <ActiveCategoryIcon className="w-4 h-4" />
                {ActiveCategoryLabel}
              </span>
              <ChevronDown
                className={`w-4 h-4 transition-transform ${categoryDropdownOpen ? 'rotate-180' : ''}`}
              />
            </button>
            {categoryDropdownOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setCategoryDropdownOpen(false)} />
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-50">
                  {visibleCategories.map((cat) => {
                    const CatIcon = cat.icon;
                    const isActive = activeCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => handleSelectCategory(cat.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 transition-colors text-left ${
                          isActive
                            ? 'bg-amber-500 text-slate-950'
                            : 'hover:bg-amber-50 text-slate-700'
                        }`}
                      >
                        <CatIcon className="w-4 h-4 shrink-0" />
                        <span className="text-sm font-semibold">{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Category tabs (desktop) */}
          <div className="hidden lg:flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200">
            {visibleCategories.map((cat) => {
              const CatIcon = cat.icon;
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => handleSelectCategory(cat.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <CatIcon className="w-3.5 h-3.5" />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* Sub-tabs for current category */}
          <div className="flex-1 flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
            {visibleTabs.map((tab) => {
              const TabIcon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-semibold text-xs whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-slate-200'
                  }`}
                >
                  <TabIcon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono font-bold ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ==================== PERMISSION SCOPE CARD ==================== */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
            <Shield className="w-4 h-4 text-slate-700" />
            <span>สิทธิการเข้าถึงของผู้ดูแลระบบ</span>
          </div>
          <span className="text-[11px] px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-mono font-semibold border border-slate-200">
            {currentPos?.name}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] leading-relaxed">
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <Eye className="w-3.5 h-3.5 text-slate-500" />
              <span>ดูอะไรได้ (Can View):</span>
            </div>
            <ul className="space-y-1 text-slate-600 list-disc list-inside">
              <li>รอบรถ · เส้นทาง · จุดจอด · ยานพาหนะ</li>
              <li>รายชื่อผู้โดยสาร + สถานะเช็คอิน</li>
              <li>สิทธิตามตำแหน่ง Can View / Can Edit</li>
              <li>ตำแหน่งและฝ่ายในระบบ</li>
            </ul>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <Sliders className="w-3.5 h-3.5 text-slate-500" />
              <span>แก้ไขและจัดการอะไรได้:</span>
            </div>
            <ul className="space-y-1 text-slate-600 list-disc list-inside">
              <li>เพิ่ม/แก้ไขรอบรถ · ตรวจการชนของคิว</li>
              <li>กำหนดสิทธิตามตำแหน่ง (RBAC Matrix)</li>
              <li>จัดการพนักงาน · ตำแหน่ง · ฝ่าย</li>
              <li>ดูรายงานและส่งออกข้อมูล (CSV)</li>
            </ul>
          </div>
        </div>
      </div>

      {/* ==================== TAB CONTENT ==================== */}
      <div>
        {activeTab === 'trips' && canViewScreen(10, currentAdmin.position_id) && (
          <TripsManagementView canEdit={canEditScreen(10, currentAdmin.position_id)} />
        )}

        {activeTab === 'routes' && canViewScreen(12, currentAdmin.position_id) && (
          <RoutesManagementView canEdit={canEditScreen(12, currentAdmin.position_id)} />
        )}

        {activeTab === 'checkin' && canViewScreen(14, currentAdmin.position_id) && (
          <CheckInScannerView canEdit={canEditScreen(14, currentAdmin.position_id)} />
        )}

        {activeTab === 'rbac' && canViewScreen(16, currentAdmin.position_id) && (
          <RbacManagementView canEdit={canEditScreen(16, currentAdmin.position_id)} />
        )}

        {activeTab === 'fleet' && canViewScreen(20, currentAdmin.position_id) && (
          <FleetStaffManagementView canEdit={canEditScreen(20, currentAdmin.position_id)} />
        )}

        {activeTab === 'reports' && canViewScreen(18, currentAdmin.position_id) && <AdminReportsView />}

        {activeTab === 'positions' && canViewScreen(22, currentAdmin.position_id) && (
          <PositionManagementView
            canEdit={canEditScreen(22, currentAdmin.position_id) || currentAdmin.position_id === 1}
          />
        )}

        {activeTab === 'departments' && canViewScreen(24, currentAdmin.position_id) && (
          <DepartmentManagementView
            canEdit={canEditScreen(24, currentAdmin.position_id) || currentAdmin.position_id === 1}
          />
        )}

        {activeTab === 'vehicle-types' && canViewScreen(20, currentAdmin.position_id) && (
          <VehicleTypeManagementView
            canEdit={canEditScreen(20, currentAdmin.position_id) || currentAdmin.position_id === 1}
          />
        )}

        {permittedTabs.length === 0 && (
          <div className="p-10 text-center bg-slate-50 rounded-xl border border-slate-200 text-sm text-slate-600">
            ไม่มีหน้าจอที่ได้รับสิทธิ์ดู กรุณาติดต่อผู้ดูแลระบบ
          </div>
        )}
      </div>
    </div>
  );
};
