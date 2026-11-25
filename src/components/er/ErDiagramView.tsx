import React, { useState } from 'react';
import {
  Database,
  Key,
  Link as LinkIcon,
  Table,
  CheckCircle2,
  FileText,
  Search,
  BookOpen,
  ArrowRight,
  Layers,
  Code,
  Copy,
  Check,
  Download,
  Terminal,
  Server,
  FileSpreadsheet,
} from 'lucide-react';
import { COMPLETE_SQL_SCRIPT } from '../../data/databaseSql';

interface SchemaEntity {
  name: string;
  thaiName: string;
  page: number;
  pk: string;
  fks: { name: string; ref: string }[];
  attributes: { name: string; type: string; isPk?: boolean; isFk?: boolean; desc: string; sample: string }[];
  notes?: string;
}

const miniprojectEntities: SchemaEntity[] = [
  {
    name: 'Department',
    thaiName: 'แผนก',
    page: 1,
    pk: 'รหัสแผนก',
    fks: [],
    attributes: [
      { name: 'รหัส', type: 'Int', isPk: true, desc: 'รหัสระบุแผนก (PK)', sample: '1, 2' },
      { name: 'ชื่อ', type: 'Varchar(100)', desc: 'ชื่อแผนก', sample: 'ฝ่ายบริหาร, ฝ่ายเทคนิค' },
    ],
  },
  {
    name: 'Position',
    thaiName: 'ตำแหน่ง',
    page: 1,
    pk: 'รหัสตำแหน่ง',
    fks: [],
    attributes: [
      { name: 'รหัส', type: 'Int', isPk: true, desc: 'รหัสตำแหน่งงาน (PK)', sample: '1, 2, 8' },
      { name: 'ชื่อ', type: 'Varchar(100)', desc: 'ชื่อตำแหน่ง', sample: 'หัวหน้าฝ่าย, รองหัวหน้าฝ่าย, พนักงานขับรถ' },
    ],
  },
  {
    name: 'Employee',
    thaiName: 'พนักงาน',
    page: 1,
    pk: 'รหัสพนักงาน',
    fks: [
      { name: 'แผนก', ref: 'แผนก.รหัส' },
      { name: 'ตำแหน่ง', ref: 'ตำแหน่ง.รหัส' },
    ],
    attributes: [
      { name: 'รหัส', type: 'Varchar(10)', isPk: true, desc: 'รหัสพนักงาน (PK)', sample: '00001, 00128, 00137' },
      { name: 'ชื่อเต็ม', type: 'Varchar(150)', desc: 'ชื่อ-นามสกุลพนักงาน', sample: 'สมชาย ใจดี, สมหญิง ใจร้าย, สมรัก คำสิงห์' },
      { name: 'username', type: 'Varchar(50)', desc: 'ชื่อผู้ใช้งานระบบ', sample: 'somchai, somying, somruck' },
      { name: 'password', type: 'Varchar(100)', desc: 'รหัสผ่านเข้าใช้งาน', sample: '••••••' },
      { name: 'phone', type: 'Varchar(20)', desc: 'เบอร์โทรศัพท์ติดต่อ', sample: '081-234-5678' },
      { name: 'email', type: 'Varchar(100)', desc: 'อีเมลพนักงาน', sample: 'somchai@mut.ac.th' },
      { name: 'แผนก', type: 'Int', isFk: true, desc: 'รหัสแผนกที่สังกัด (FK แผนก.รหัส)', sample: '1, 2' },
      { name: 'ตำแหน่ง', type: 'Int', isFk: true, desc: 'รหัสตำแหน่งงาน (FK ตำแหน่ง.รหัส)', sample: '1, 8' },
    ],
  },
  {
    name: 'RolePermission',
    thaiName: 'สิทธิตามตำแหน่ง',
    page: 1,
    pk: 'รหัสสิทธิ์',
    fks: [
      { name: 'รหัสตำแหน่ง', ref: 'ตำแหน่ง.รหัส' },
      { name: 'รหัสหน้าจอ', ref: 'หน้าจอ.รหัส' },
    ],
    notes: 'Associative Table (ตารางตัวกลาง) เชื่อม 2 Entity แบบ M:N',
    attributes: [
      { name: 'รหัส', type: 'Varchar(10)', isPk: true, desc: 'รหัสสิทธิ์การเข้าถึง (PK)', sample: '001, 010' },
      { name: 'รหัสตำแหน่ง', type: 'Int', isFk: true, desc: 'รหัสตำแหน่งงาน (FK)', sample: '1, 2' },
      { name: 'รหัสหน้าจอ', type: 'Int', isFk: true, desc: 'รหัสหน้าจอที่กำหนดสิทธิ์ (FK)', sample: '10, 12' },
      { name: 'สิทธิการดู', type: 'Boolean', desc: 'สามารถเข้าดูหน้าจอได้หรือไม่', sample: 'ได้, ไม่ได้' },
      { name: 'สิทธิการแก้ไข', type: 'Boolean', desc: 'สามารถแก้ไขข้อมูลในหน้านี้ได้หรือไม่', sample: 'ได้, ไม่ได้' },
    ],
  },
  {
    name: 'Screen',
    thaiName: 'หน้าจอ',
    page: 2,
    pk: 'รหัสหน้าจอ',
    fks: [],
    attributes: [
      { name: 'รหัส', type: 'Int', isPk: true, desc: 'รหัสหน้าจอระบบ (PK)', sample: '10, 12' },
      { name: 'ชื่อ', type: 'Varchar(100)', desc: 'ชื่อหน้าจอการทำงาน', sample: 'จัดการรอบรถ, จัดการเส้นทาง' },
      { name: 'โค้ด', type: 'Varchar(10)', desc: 'รหัสโค้ดของหน้าจอ', sample: '3456, 6794' },
      { name: 'กลุ่ม', type: 'Varchar(100)', desc: 'กลุ่มประเภทของหน้าจอ', sample: 'จัดการรอบรถ' },
    ],
  },
  {
    name: 'BusStop',
    thaiName: 'จุดจอด',
    page: 1,
    pk: 'รหัสจุดจอด',
    fks: [],
    attributes: [
      { name: 'รหัส', type: 'Int', isPk: true, desc: 'รหัสจุดจอดรถ (PK)', sample: '101, 102, 103, 105, 107' },
      { name: 'ชื่อ', type: 'Varchar(100)', desc: 'ชื่อจุดจอดรถ', sample: 'ม.มหานคร, สวนหนองจอก, โลตัส' },
      { name: 'รายละเอียด', type: 'Varchar(255)', desc: 'จุดสังเกตหรือรายละเอียด', sample: 'ป้ายหน้ามหาวิทยาลัย, เซเว่นสวนหนองจอก' },
      { name: 'สถานะ', type: 'Int', desc: 'สถานะเปิดใช้งาน (1=เปิด, 0=ปิด)', sample: '1' },
    ],
  },
  {
    name: 'Route',
    thaiName: 'เส้นทาง',
    page: 2,
    pk: 'รหัสเส้นทาง',
    fks: [],
    attributes: [
      { name: 'รหัส', type: 'Int', isPk: true, desc: 'รหัสเส้นทางเดินรถ (PK)', sample: '1, 2' },
      { name: 'ชื่อ', type: 'Varchar(150)', desc: 'ชื่อเส้นทางเดินรถ', sample: 'เส้นทางไปโลตัส, เส้นทางไป Big C' },
      { name: 'เวลารวม', type: 'Int', desc: 'ระยะเวลาเดินทางโดยประมาณ (นาที)', sample: '30, 45' },
      { name: 'สถานะ', type: 'Int', desc: 'สถานะเปิดให้บริการ (1=เปิด, 0=ปิด)', sample: '1' },
    ],
  },
  {
    name: 'RouteStop',
    thaiName: 'จุดจอดในเส้นทาง',
    page: 1,
    pk: 'รหัส',
    fks: [
      { name: 'รหัสเส้นทาง', ref: 'เส้นทาง.รหัส' },
      { name: 'รหัสจุดจอด', ref: 'จุดจอด.รหัส' },
    ],
    attributes: [
      { name: 'รหัส', type: 'Int', isPk: true, desc: 'รหัสลำดับจุดจอดในเส้นทาง (PK)', sample: '1, 2, 3' },
      { name: 'รหัสเส้นทาง', type: 'Int', isFk: true, desc: 'รหัสเส้นทางที่สังกัด (FK)', sample: '1, 2' },
      { name: 'รหัสจุดจอด', type: 'Int', isFk: true, desc: 'รหัสจุดจอด (FK)', sample: '101, 102' },
      { name: 'ลำดับจุดจอด', type: 'Int', desc: 'ลำดับการจอด (1, 2, 3...)', sample: '1, 2' },
      { name: 'นาทีจากจุดจอดก่อนหน้า', type: 'Int', desc: 'ระยะเวลาเดินทางจากจุดจอดก่อนหน้า (นาที)', sample: '0, 3, 5' },
    ],
  },
  {
    name: 'Vehicle',
    thaiName: 'ยานพาหนะ',
    page: 2,
    pk: 'รหัสยานพาหนะ',
    fks: [],
    attributes: [
      { name: 'รหัส', type: 'Varchar(10)', isPk: true, desc: 'รหัสยานพาหนะ (PK)', sample: '001, 036' },
      { name: 'ป้ายทะเบียน', type: 'Varchar(50)', desc: 'เลขทะเบียนยานพาหนะ', sample: '1กข 1234, ขค 569' },
      { name: 'ประเภท', type: 'Varchar(50)', desc: 'ประเภทของรถ', sample: 'รถตู้, บัส' },
      { name: 'ความจุที่นั่ง', type: 'Int', desc: 'จำนวนที่นั่งผู้โดยสารทั้งหมด', sample: '9, 30' },
      { name: 'สถานะ', type: 'Int', desc: 'สถานะความพร้อม (1=พร้อม, 0=ซ่อม)', sample: '1, 0' },
    ],
  },
  {
    name: 'Trip',
    thaiName: 'รอบรถ',
    page: 2,
    pk: 'รหัสรอบรถ',
    fks: [
      { name: 'รหัสเส้นทาง', ref: 'เส้นทาง.รหัส' },
      { name: 'รหัสคนขับ', ref: 'พนักงาน.รหัส' },
      { name: 'รหัสยานพาหนะ', ref: 'ยานพาหนะ.รหัส' },
    ],
    attributes: [
      { name: 'รหัส', type: 'Int', isPk: true, desc: 'รหัสรอบรถประจำวัน (PK)', sample: '3001, 4078' },
      { name: 'รหัสเส้นทาง', type: 'Int', isFk: true, desc: 'เส้นทางที่วิ่งบริการ (FK)', sample: '1, 2' },
      { name: 'รหัสคนขับ', type: 'Varchar(10)', isFk: true, desc: 'พนักงานขับรถประจำรอบ (FK)', sample: '00001, 00128' },
      { name: 'รหัสยานพาหนะ', type: 'Varchar(10)', isFk: true, desc: 'รถที่ใช้ประจำรอบ (FK)', sample: '001, 036' },
      { name: 'วันให้บริการ', type: 'Date', desc: 'วันที่เปิดให้บริการ', sample: '2026-09-15, 2026-09-16' },
      { name: 'เวลาออก', type: 'Time', desc: 'เวลาที่รถออกเดินทาง', sample: '08:00, 09:00' },
      { name: 'สถานะ', type: 'Int', desc: 'สถานะรอบ (1=เปิดจอง, 2=ออกเดินทาง, 0=ยกเลิก)', sample: '1' },
    ],
  },
  {
    name: 'SystemUser',
    thaiName: 'ผู้ใช้งานระบบ',
    page: 2,
    pk: 'รหัสผู้ใช้งาน',
    fks: [],
    attributes: [
      { name: 'รหัส', type: 'Int', isPk: true, desc: 'รหัสผู้ใช้งานระบบ (PK)', sample: '55541, 10379' },
      { name: 'ชื่อ', type: 'Varchar(150)', desc: 'ชื่อผู้ใช้งาน (นักศึกษา/อาจารย์)', sample: 'พลพิธ, เพ็ญศรี' },
      { name: 'username', type: 'Varchar(50)', desc: 'รหัสนักศึกษาหรือรหัสบุคลากร', sample: '6711130037, 7891056799' },
      { name: 'password', type: 'Varchar(100)', desc: 'รหัสผ่าน', sample: '••••••' },
      { name: 'ประเภทผู้ใช้งาน', type: 'Varchar(50)', desc: 'กลุ่มผู้ใช้งาน', sample: 'นักศึกษา, ครู/อาจารย์' },
      { name: 'เบอร์โทร', type: 'Varchar(20)', desc: 'เบอร์โทรศัพท์ติดต่อ', sample: '089-111-3003' },
    ],
  },
  {
    name: 'Booking',
    thaiName: 'การจอง (Transaction)',
    page: 2,
    pk: 'รหัสการจอง',
    fks: [
      { name: 'รหัสผู้ใช้งานระบบ', ref: 'ผู้ใช้งานระบบ.รหัส' },
      { name: 'รหัสรอบรถ', ref: 'รอบรถ.รหัส' },
      { name: 'รหัสจุดขึ้น', ref: 'จุดจอดในเส้นทาง.รหัส' },
      { name: 'รหัสจุดลง', ref: 'จุดจอดในเส้นทาง.รหัส' },
    ],
    notes: 'หน้า 4 บันทึกว่า: 1. การจอง 1-N รอบรถ 2. เช็คอิน อยู่ในการจอง',
    attributes: [
      { name: 'รหัส', type: 'Int', isPk: true, desc: 'รหัสการจองตั๋ว (PK)', sample: '90002, 70003' },
      { name: 'รหัสผู้ใช้งานระบบ', type: 'Int', isFk: true, desc: 'ผู้จองตั๋ว (FK)', sample: '55541, 10379' },
      { name: 'รหัสรอบรถ', type: 'Int', isFk: true, desc: 'รอบรถที่จอง (FK)', sample: '3001, 4078' },
      { name: 'รหัสจุดขึ้น', type: 'Int', isFk: true, desc: 'จุดที่ผู้โดยสารจะขึ้น (FK)', sample: '101, 103' },
      { name: 'รหัสจุดลง', type: 'Int', isFk: true, desc: 'จุดที่ผู้โดยสารจะลง (FK)', sample: '105, 107' },
      { name: 'จน.ที่นั่ง', type: 'Int', desc: 'จำนวนที่นั่งที่ทำการจอง', sample: '9, 30' },
      { name: 'สถานะ', type: 'Int', desc: 'สถานะการจอง (1=สำเร็จ, 2=เช็คอินแล้ว, 0=ยกเลิก)', sample: '1' },
      { name: 'เช็คอิน', type: 'Boolean/Datetime', desc: 'สถานะและเวลาการเช็คอินขึ้นรถ (จากหน้า 4)', sample: 'true / false' },
      { name: 'วันเวลาจอง', type: 'Datetime', desc: 'วันและเวลาที่ทำรายการจอง', sample: '2026-09-12 08:30' },
    ],
  },
  {
    name: 'BookingDetail',
    thaiName: 'รายละเอียดการจอง',
    page: 4,
    pk: 'รหัสรายละเอียดการจอง',
    fks: [
      { name: 'รหัสการจอง', ref: 'การจอง.รหัส' },
      { name: 'รหัสรอบรถ', ref: 'รอบรถ.รหัส' },
      { name: 'รหัสจุดขึ้น', ref: 'จุดจอดในเส้นทาง.รหัส' },
      { name: 'รหัสจุดลง', ref: 'จุดจอดในเส้นทาง.รหัส' },
    ],
    notes: 'ฟิลด์ "ดำเนินการ" (Action Status) รองรับ 5 สถานะ: จองสำเร็จ, เช็กอินแล้ว, เสร็จสิ้น, ยกเลิก, ไม่ได้ขึ้นรถ',
    attributes: [
      { name: 'รหัส', type: 'Int', isPk: true, desc: 'รหัสรายละเอียดการจอง (PK)', sample: '10001, 10002' },
      { name: 'รหัสการจอง', type: 'Int', isFk: true, desc: 'รหัสการจองหลัก (FK การจอง)', sample: '90001, 90004' },
      { name: 'รหัสรอบรถ', type: 'Int', isFk: true, desc: 'รอบรถที่เดินทาง (FK)', sample: '1001, 1002' },
      { name: 'รหัสจุดขึ้น', type: 'Int', isFk: true, desc: 'จุดจอดที่ขึ้นรถ (FK)', sample: '101, 102' },
      { name: 'รหัสจุดลง', type: 'Int', isFk: true, desc: 'จุดจอดที่ลงรถ (FK)', sample: '104, 106' },
      { name: 'ดำเนินการ', type: 'Enum (5 ค่า)', desc: 'สถานะตั๋ว: จองสำเร็จ | เช็กอินแล้ว | เสร็จสิ้น | ยกเลิก | ไม่ได้ขึ้นรถ', sample: 'จองสำเร็จ, เช็กอินแล้ว, เสร็จสิ้น, ยกเลิก, ไม่ได้ขึ้นรถ' },
    ],
  },
];

export const ErDiagramView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dictionary' | 'sql'>('sql');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEntityName, setSelectedEntityName] = useState<string>('Booking');
  const [sqlSection, setSqlSection] = useState<'all' | 'ddl' | 'dml' | 'views'>('all');
  const [copied, setCopied] = useState(false);

  const filteredEntities = miniprojectEntities.filter(
    (e) =>
      e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.thaiName.includes(searchTerm) ||
      e.attributes.some((a) => a.name.includes(searchTerm) || a.desc.includes(searchTerm))
  );

  const activeEntity = miniprojectEntities.find((e) => e.name === selectedEntityName) || miniprojectEntities[0];

  const handleCopySql = () => {
    navigator.clipboard.writeText(getDisplaySql());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadSql = () => {
    const blob = new Blob([COMPLETE_SQL_SCRIPT], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'mut_bus_database.sql';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getDisplaySql = () => {
    if (sqlSection === 'all') return COMPLETE_SQL_SCRIPT;
    if (sqlSection === 'ddl') {
      const start = COMPLETE_SQL_SCRIPT.indexOf('-- PART 1: DDL');
      const end = COMPLETE_SQL_SCRIPT.indexOf('-- PART 2: DML');
      return COMPLETE_SQL_SCRIPT.substring(start, end).trim();
    }
    if (sqlSection === 'dml') {
      const start = COMPLETE_SQL_SCRIPT.indexOf('-- PART 2: DML');
      const end = COMPLETE_SQL_SCRIPT.indexOf('-- PART 3: VIEWS');
      return COMPLETE_SQL_SCRIPT.substring(start, end).trim();
    }
    if (sqlSection === 'views') {
      const start = COMPLETE_SQL_SCRIPT.indexOf('-- PART 3: VIEWS');
      return COMPLETE_SQL_SCRIPT.substring(start).trim();
    }
    return COMPLETE_SQL_SCRIPT;
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-semibold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
              <Database className="w-4 h-4" />
              <span>ER Diagram, Relational Schema & Full SQL Database</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white mt-1">
              โครงสร้างฐานข้อมูล & โค้ดคำสั่ง SQL ของระบบนี้ทั้งหมด
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              สร้างตามเอกสาร Miniproject ครบทุก Entity, Primary Key, Foreign Key และข้อมูลจำลองตั้งต้น (Seed Data)
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveTab('sql')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${
                activeTab === 'sql'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-emerald-500/20'
                  : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
              }`}
            >
              <Terminal className="w-4 h-4" />
              <span>โค้ด SQL ทั้งหมด</span>
              <span className="bg-emerald-500/20 text-emerald-300 text-[10px] px-1.5 py-0.5 rounded font-mono">
                Full Script
              </span>
            </button>

            <button
              onClick={() => setActiveTab('dictionary')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${
                activeTab === 'dictionary'
                  ? 'bg-cyan-600 text-white shadow-cyan-500/20'
                  : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
              }`}
            >
              <Table className="w-4 h-4" />
              <span>พจนานุกรมตาราง (Data Dictionary)</span>
            </button>
          </div>
        </div>
      </div>

      {/* SQL Script View Tab */}
      {activeTab === 'sql' && (
        <div className="space-y-4">
          {/* Quick Info & Action Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-slate-400 mr-2">ส่วนของโค้ด:</span>
              <button
                onClick={() => setSqlSection('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  sqlSection === 'all'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                }`}
              >
                ทั้งหมด (Full Script)
              </button>
              <button
                onClick={() => setSqlSection('ddl')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  sqlSection === 'ddl'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                }`}
              >
                1. โครงสร้างตาราง (DDL: 13 Tables)
              </button>
              <button
                onClick={() => setSqlSection('dml')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  sqlSection === 'dml'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                }`}
              >
                2. ข้อมูลตั้งต้น (DML: Seed Data)
              </button>
              <button
                onClick={() => setSqlSection('views')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  sqlSection === 'views'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                }`}
              >
                3. รายงานและมุมมอง (Views)
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopySql}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'คัดลอกเรียบร้อยแล้ว!' : 'คัดลอกโค้ด SQL'}</span>
              </button>
              <button
                onClick={handleDownloadSql}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold shadow-sm transition-all"
                title="ดาวน์โหลดไฟล์ .sql ไปรันบน MySQL / PostgreSQL / MariaDB ได้ทันที"
              >
                <Download className="w-3.5 h-3.5" />
                <span>ดาวน์โหลด mut_bus_database.sql</span>
              </button>
            </div>
          </div>

          {/* Database Specs Highlights */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Database className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] text-slate-500 uppercase font-mono">จำนวนตาราง</div>
                <div className="font-bold text-white text-sm">13 Entities (3NF)</div>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Key className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] text-slate-500 uppercase font-mono">ความสัมพันธ์ (FK)</div>
                <div className="font-bold text-white text-sm">ครบ 100% Constraints</div>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] text-slate-500 uppercase font-mono">มุมมองวิเคราะห์</div>
                <div className="font-bold text-white text-sm">4 Analytics Views</div>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <Server className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] text-slate-500 uppercase font-mono">รองรับระบบฐานข้อมูล</div>
                <div className="font-bold text-white text-sm">MySQL / PostgreSQL</div>
              </div>
            </div>
          </div>

          {/* SQL Code Block */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="bg-slate-900/80 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2 font-mono text-xs text-slate-400">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span>mut_bus_database.sql</span>
                <span className="text-slate-600">|</span>
                <span className="text-slate-500">UTF-8 Standard SQL</span>
              </div>
              <button
                onClick={handleCopySql}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-mono flex items-center gap-1 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy Code'}</span>
              </button>
            </div>
            <pre className="p-5 text-xs font-mono text-emerald-300/90 overflow-x-auto max-h-[650px] leading-relaxed selection:bg-emerald-900 selection:text-white">
              <code>{getDisplaySql()}</code>
            </pre>
          </div>
        </div>
      )}

      {/* Data Dictionary View Tab */}
      {activeTab === 'dictionary' && (
        <div className="space-y-6">
          {/* 4 Notes from Page 4 Callout */}
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 sm:p-5 text-xs space-y-2">
            <div className="font-bold text-amber-400 flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              <span>ข้อกำหนดพิเศษและหมายเหตุจากเอกสาร Miniproject (หน้า 4):</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-slate-300">
              <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                <strong>1. การจอง 1 - N รอบรถ:</strong> หนึ่งรอบรถสามารถมีรายการจองได้หลายใบจอง
              </div>
              <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                <strong>2. เช็คอิน อยู่ในการจอง:</strong> เพิ่มฟิลด์สถานะและเวลาเช็คอินใน Entity การจอง
              </div>
              <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                <strong>3. ไม่มีเส้นปะใต้ Att:</strong> กำหนดเฉพาะ PK ขีดเส้นทึบ และ FK อ้างอิงชัดเจน
              </div>
              <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                <strong>4. ย้ายจุดขึ้นลงไปอยู่ในจุดจอด:</strong> อ้างอิงจุดขึ้น-ลงจากจุดจอดในเส้นทาง
              </div>
            </div>
          </div>

          {/* Main Content Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Entities Explorer */}
            <div className="lg:col-span-4 space-y-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Table className="w-4 h-4 text-cyan-400" />
                    <span>รายชื่อ Entity ทั้งหมด ({miniprojectEntities.length})</span>
                  </h3>
                </div>

                {/* Search filter */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="ค้นหาชื่อ Entity หรือ Attribute..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="space-y-1.5 max-h-[540px] overflow-y-auto pr-1">
                  {filteredEntities.map((ent) => {
                    const isSelected = ent.name === selectedEntityName;

                    return (
                      <button
                        key={ent.name}
                        onClick={() => setSelectedEntityName(ent.name)}
                        className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-cyan-950/40 border-cyan-500 text-white shadow-sm'
                            : 'bg-slate-950 border-slate-800/80 hover:border-slate-700 text-slate-300'
                        }`}
                      >
                        <div>
                          <div className="font-bold text-xs flex items-center gap-2">
                            <span>{ent.thaiName}</span>
                            <span className="text-[10px] font-mono text-slate-400 font-normal">({ent.name})</span>
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            PK: <span className="text-amber-400 font-mono underline">{ent.pk}</span> • หน้า {ent.page}
                          </div>
                        </div>

                        <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-mono">
                          {ent.attributes.length} atts
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right: Detailed Entity & Attribute Specification */}
            <div className="lg:col-span-8 space-y-6">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-5">
                {/* Entity Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                  <div>
                    <div className="text-xs font-mono text-cyan-400">
                      Relational Table Definition • หน้า {activeEntity.page} ในไฟล์ Miniproject
                    </div>
                    <h2 className="text-xl font-black text-white mt-0.5 flex items-center gap-2">
                      <span>{activeEntity.thaiName}</span>
                      <span className="text-sm font-mono text-slate-400 font-normal">
                        ({activeEntity.name})
                      </span>
                    </h2>
                    {activeEntity.notes && (
                      <div className="mt-1 text-xs text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded-lg inline-block">
                        ★ {activeEntity.notes}
                      </div>
                    )}
                  </div>

                  {/* Primary & Foreign Keys Badges */}
                  <div className="flex flex-wrap gap-2 text-xs">
                    <div className="bg-amber-500/20 text-amber-300 border border-amber-500/40 px-3 py-1 rounded-xl font-mono flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5" />
                      <span>PK = {activeEntity.pk}</span>
                    </div>
                    {activeEntity.fks.map((fk) => (
                      <div
                        key={fk.name}
                        className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-2.5 py-1 rounded-xl font-mono flex items-center gap-1"
                      >
                        <LinkIcon className="w-3 h-3" />
                        <span>FK: {fk.name} ➔ {fk.ref}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Attributes Data Table */}
                <div className="overflow-x-auto rounded-xl border border-slate-800">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[11px] border-b border-slate-800">
                      <tr>
                        <th className="p-3">Attribute Name (ชื่อ)</th>
                        <th className="p-3">Type</th>
                        <th className="p-3">Key</th>
                        <th className="p-3">คำอธิบาย</th>
                        <th className="p-3 font-mono">ตัวอย่างข้อมูลจริงในเอกสาร</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 bg-slate-900/50 font-sans">
                      {activeEntity.attributes.map((att) => (
                        <tr key={att.name} className="hover:bg-slate-800/40 transition-colors">
                          <td className="p-3 font-bold text-white">
                            <span className={att.isPk ? 'text-amber-400 underline decoration-amber-400 decoration-2' : ''}>
                              {att.name}
                            </span>
                          </td>
                          <td className="p-3 font-mono text-slate-400 text-[11px]">{att.type}</td>
                          <td className="p-3">
                            {att.isPk ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                PK
                              </span>
                            ) : att.isFk ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                                FK
                              </span>
                            ) : (
                              <span className="text-slate-500 text-[10px] font-mono">-</span>
                            )}
                          </td>
                          <td className="p-3 text-slate-300">{att.desc}</td>
                          <td className="p-3 font-mono text-emerald-400 text-[11px]">{att.sample}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
