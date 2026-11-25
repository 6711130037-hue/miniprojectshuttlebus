import React, { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Calendar,
  Users,
  MapPin,
  Clock,
  Car,
  Download,
  Filter,
  FileSpreadsheet,
  PieChart,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronRight,
  Info,
} from 'lucide-react';
import {
  report1Dataset,
  report2Dataset,
  report3Dataset,
  report4Dataset,
  report5Dataset,
  report6Dataset,
  report7Dataset,
  monthsTh,
} from '../../data/mockDatabase';

export const AdminReportsView: React.FC = () => {
  const [activeReportTab, setActiveReportTab] = useState<number>(1);
  const [selectedYear, setSelectedYear] = useState<string>('2568');
  const [report1StopFilter, setReport1StopFilter] = useState<string>('all');
  const [dateRangeFilter, setDateRangeFilter] = useState<string>('default');

  const exportCSV = (reportNum: number) => {
    let filename = `mut_bus_report_${reportNum}_${new Date().toISOString().slice(0, 10)}.csv`;
    let csvContent = 'data:text/csv;charset=utf-8,\uFEFF';

    if (reportNum === 1) {
      csvContent += 'จุดจอด,ประเภท,' + monthsTh.join(',') + ',รวมทั้งปี\n';
      report1Dataset.forEach((row) => {
        csvContent += `"${row.stopName}",จำนวนขึ้น,${row.monthlyBoarding.join(',')},${row.totalBoarding}\n`;
        csvContent += `"${row.stopName}",จำนวนลง,${row.monthlyAlighting.join(',')},${row.totalAlighting}\n`;
      });
    } else if (reportNum === 2) {
      csvContent += 'เดือน,จำนวนการจอง,ที่นั่งที่จอง,ยกเลิก,Check-in สำเร็จ,No Show\n';
      report2Dataset.forEach((r) => {
        csvContent += `${r.month},${r.bookingCount},${r.bookedSeats},${r.cancelled},${r.checkedIn},${r.noShow}\n`;
      });
    } else if (reportNum === 3) {
      csvContent += 'ผู้ใช้บริการ,การจองทั้งหมด,ขึ้นรถจริง,ยกเลิก,No Show\n';
      report3Dataset.forEach((r) => {
        csvContent += `"${r.userName}",${r.totalBookings},${r.boardedActual},${r.cancelled},${r.noShow}\n`;
      });
    } else if (reportNum === 4) {
      csvContent += 'วัน,เส้นทางที่ 1,เส้นทางที่ 2,เส้นทางที่ 3,รวมทั้งวัน\n';
      report4Dataset.forEach((r) => {
        csvContent += `"${r.dayName}",${r.route1},${r.route2},${r.route3},${r.total}\n`;
      });
    } else if (reportNum === 5) {
      csvContent += 'จุดจอด,เวลา,จำนวนขึ้น,จำนวนลง\n';
      report5Dataset.forEach((r) => {
        csvContent += `"${r.stopName}",${r.time},${r.boardingCount},${r.alightingCount}\n`;
      });
    } else if (reportNum === 6) {
      csvContent += 'คนขับรถ,ก่อน 17:00 น.,หลัง 17:00 น.,รวมทั้งหมด\n';
      report6Dataset.forEach((r) => {
        csvContent += `"${r.driverName}",${r.before1700},${r.after1700},${r.totalTrips}\n`;
      });
    } else if (reportNum === 7) {
      csvContent += 'ประเภทรถ,ทะเบียน,จำนวนรอบ\n';
      report7Dataset.forEach((r) => {
        csvContent += `"${r.category}","${r.plate}",${r.tripCount}\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const reportTabs = [
    { id: 1, title: 'รายงาน 1: ขึ้น-ลง แต่ละจุดจอดรายปี', icon: MapPin, page: 'หน้า 4-5' },
    { id: 2, title: 'รายงาน 2: สถิติการจองรายปี 2568', icon: TrendingUp, page: 'หน้า 6' },
    { id: 3, title: 'รายงาน 3: พฤติกรรมผู้ใช้บริการ', icon: Users, page: 'หน้า 6-7' },
    { id: 4, title: 'รายงาน 4: ยอดผู้ใช้แต่ละเส้นทางรายวัน', icon: Calendar, page: 'หน้า 7-8' },
    { id: 5, title: 'รายงาน 5: การใช้บริการตามรอบเวลา', icon: Clock, page: 'หน้า 8-9' },
    { id: 6, title: 'รายงาน 6: มอบหมายงานคนขับ (ก่อน/หลัง 17น.)', icon: Users, page: 'หน้า 9' },
    { id: 7, title: 'รายงาน 7: การมอบหมายงานแยกตามยานพาหนะ', icon: Car, page: 'หน้า 10' },
  ];

  return (
    <div className="space-y-6">
      {/* Header & Description */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 text-slate-900 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                Data Science & Analytics
              </span>
              <span className="text-xs text-slate-500 font-medium">
                เอกสารความต้องการ Miniproject หน้า 4 - 10
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black mt-1 text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-amber-600" />
              ระบบรายงานสรุปข้อมูลสถิติ (Admin Data Reports)
            </h2>
            <p className="text-sm text-slate-600 mt-1 max-w-3xl leading-relaxed">
              รายงานเชิงวิเคราะห์สำหรับการบริหารจัดการระบบจองรถบัส ม.มหานคร
              รองรับทั้งการแสดงตารางสถิติเชิงลึก กราฟวิเคราะห์เปรียบเทียบ และการ Export ข้อมูลไปใช้งาน
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => exportCSV(activeReportTab)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white shadow-xs text-xs sm:text-sm font-bold transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4 text-amber-400" />
              <span>Export รายงานนี้ (CSV)</span>
            </button>
          </div>
        </div>

        {/* Report Selector Pills */}
        <div className="mt-6 flex gap-2 overflow-x-auto pb-2">
          {reportTabs.map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeReportTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveReportTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 shadow-xs ring-2 ring-amber-500/40'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900 border border-slate-200'
                }`}
              >
                <Icon className={`w-4 h-4 ${isSelected ? 'text-slate-950' : 'text-slate-500'}`} />
                <span>{tab.title}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-medium ${
                    isSelected ? 'bg-amber-600/20 text-slate-950' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {tab.page}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================== */}
      {/* REPORT 1: ขึ้น-ลง แต่ละจุดจอดรายปี 2568 */}
      {/* ========================================== */}
      {activeReportTab === 1 && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                  รายงานที่ 1 (เอกสารหน้า 4-5)
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-1">
                  รายงานการเปรียบเทียบ จำนวนคนขึ้นรถและลงรถในแต่ละจุดจอดเป็นรายปี {selectedYear}
                </h3>
                <p className="text-xs text-slate-500">
                  แสดงสถิติการขึ้นและลงรถของผู้โดยสารใน 6 จุดจอดหลักตลอด 12 เดือน (ม.ค. - ธ.ค.)
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-xs text-slate-600">
                  <Filter className="w-3.5 h-3.5 text-slate-400" />
                  <span>จุดจอด:</span>
                  <select
                    value={report1StopFilter}
                    onChange={(e) => setReport1StopFilter(e.target.value)}
                    className="border border-slate-300 rounded-lg px-2.5 py-1 text-xs bg-slate-50 font-medium focus:ring-1 focus:ring-amber-500"
                  >
                    <option value="all">ทุกจุดจอด (ทั้ง 6 จุดจอด)</option>
                    {report1Dataset.map((s) => (
                      <option key={s.stopName} value={s.stopName}>
                        {s.stopName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Visual Bar Comparison Chart */}
            <div className="my-6 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <BarChart3 className="w-4 h-4 text-amber-500" />
                  กราฟเปรียบเทียบยอดรวม ขึ้นรถ vs ลงรถ ตลอดทั้งปี (คน)
                </h4>
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-sm bg-emerald-500" />
                    <span className="text-slate-600 font-medium">จำนวนขึ้นรถ (Boarding)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-sm bg-blue-500" />
                    <span className="text-slate-600 font-medium">จำนวนลงรถ (Alighting)</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                {report1Dataset
                  .filter((s) => report1StopFilter === 'all' || s.stopName === report1StopFilter)
                  .map((stop) => {
                    const maxVal = 18000;
                    const boardingPct = Math.min(100, (stop.totalBoarding / maxVal) * 100);
                    const alightingPct = Math.min(100, (stop.totalAlighting / maxVal) * 100);

                    return (
                      <div key={stop.stopName} className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold text-slate-800">
                          <span>{stop.stopName}</span>
                          <span className="text-slate-500">
                            ขึ้น: <strong className="text-emerald-600">{stop.totalBoarding.toLocaleString()}</strong> คน | 
                            ลง: <strong className="text-blue-600">{stop.totalAlighting.toLocaleString()}</strong> คน
                          </span>
                        </div>
                        {/* Dual bar */}
                        <div className="grid grid-cols-1 gap-1">
                          <div className="w-full bg-slate-200/70 rounded-full h-3 overflow-hidden flex">
                            <div
                              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                              style={{ width: `${boardingPct}%` }}
                            />
                          </div>
                          <div className="w-full bg-slate-200/70 rounded-full h-3 overflow-hidden flex">
                            <div
                              className="bg-blue-500 h-full rounded-full transition-all duration-500"
                              style={{ width: `${alightingPct}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Detailed Monthly Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <th className="py-2.5 px-3 whitespace-nowrap sticky left-0 bg-slate-100 z-10">
                      จุดจอด
                    </th>
                    <th className="py-2.5 px-3 whitespace-nowrap">ประเภท</th>
                    {monthsTh.map((m) => (
                      <th key={m} className="py-2.5 px-2 text-center whitespace-nowrap">
                        {m}
                      </th>
                    ))}
                    <th className="py-2.5 px-3 text-right whitespace-nowrap font-extrabold bg-slate-200/70">
                      รวมทั้งปี
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {report1Dataset
                    .filter((s) => report1StopFilter === 'all' || s.stopName === report1StopFilter)
                    .map((item, idx) => (
                      <React.Fragment key={item.stopName}>
                        <tr className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                          <td
                            rowSpan={2}
                            className="py-2.5 px-3 font-semibold text-slate-800 border-r border-slate-200 sticky left-0 bg-inherit z-10"
                          >
                            {item.stopName}
                          </td>
                          <td className="py-1.5 px-3 font-medium text-emerald-700 bg-emerald-50/40">
                            ขึ้นรถ
                          </td>
                          {item.monthlyBoarding.map((b, i) => (
                            <td key={i} className="py-1.5 px-2 text-center text-slate-700">
                              {b.toLocaleString()}
                            </td>
                          ))}
                          <td className="py-1.5 px-3 text-right font-bold text-emerald-800 bg-emerald-100/50">
                            {item.totalBoarding.toLocaleString()}
                          </td>
                        </tr>
                        <tr className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                          <td className="py-1.5 px-3 font-medium text-blue-700 bg-blue-50/40 border-b border-slate-200">
                            ลงรถ
                          </td>
                          {item.monthlyAlighting.map((a, i) => (
                            <td key={i} className="py-1.5 px-2 text-center text-slate-700 border-b border-slate-200">
                              {a.toLocaleString()}
                            </td>
                          ))}
                          <td className="py-1.5 px-3 text-right font-bold text-blue-800 bg-blue-100/50 border-b border-slate-200">
                            {item.totalAlighting.toLocaleString()}
                          </td>
                        </tr>
                      </React.Fragment>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* REPORT 2: สถิติการจองรายปี 2568 */}
      {/* ========================================== */}
      {activeReportTab === 2 && (
        <div className="space-y-6">
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-slate-500">ยอดการจองทั้งสิ้น (ปี 2568)</span>
              <p className="text-2xl font-bold text-slate-900 mt-1">4,470 <span className="text-xs text-slate-500 font-normal">รายการ</span></p>
              <span className="text-[11px] text-emerald-600 font-medium">13,290 ที่นั่งโดยสาร</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-slate-500">Check-in ขึ้นรถสำเร็จ</span>
              <p className="text-2xl font-bold text-emerald-600 mt-1">12,650 <span className="text-xs text-slate-500 font-normal">ที่นั่ง</span></p>
              <span className="text-[11px] text-emerald-700 font-medium">95.2% ของที่นั่งที่จอง</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-slate-500">การยกเลิกการจอง</span>
              <p className="text-2xl font-bold text-amber-600 mt-1">343 <span className="text-xs text-slate-500 font-normal">ครั้ง</span></p>
              <span className="text-[11px] text-amber-700 font-medium">ผู้ใช้กดยกเลิกล่วงหน้า</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-slate-500">ไม่มาใช้บริการ (No Show)</span>
              <p className="text-2xl font-bold text-red-600 mt-1">640 <span className="text-xs text-slate-500 font-normal">ที่นั่ง</span></p>
              <span className="text-[11px] text-red-600 font-medium">4.8% สรุปตอนคนขับปิดงาน</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                  รายงานที่ 2 (เอกสารหน้า 6)
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-1">
                  รายงานสถิติการจองรายปี (Check-in สำเร็จ vs ยกเลิก vs No Show)
                </h3>
                <p className="text-xs text-slate-500">
                  สถิติตลอด 12 เดือน แสดงให้เห็นแนวโน้มการใช้งาน การเช็คอิน และอัตรา No Show
                </p>
              </div>
            </div>

            {/* Monthly Clustered Visual Chart */}
            <div className="my-6 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  กราฟแท่งเปรียบเทียบผลการเดินทางในแต่ละเดือน (ที่นั่ง)
                </h4>
                <div className="flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Check-in สำเร็จ
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> ยกเลิก
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500" /> No Show
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-6 sm:grid-cols-12 gap-2 pt-6 pb-2 items-end h-48 border-b border-slate-200">
                {report2Dataset.map((item) => {
                  const maxVal = 1400;
                  const checkInH = Math.round((item.checkedIn / maxVal) * 100);
                  const noShowH = Math.max(8, Math.round((item.noShow / maxVal) * 100));
                  const cancelH = Math.max(6, Math.round((item.cancelled / maxVal) * 100));

                  return (
                    <div key={item.monthShort} className="flex flex-col items-center gap-1.5 h-full justify-end group">
                      <div className="text-[10px] text-slate-500 font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        {item.checkedIn}
                      </div>
                      <div className="flex items-end gap-0.5 w-full justify-center">
                        <div
                          className="w-2.5 sm:w-3.5 bg-emerald-500 rounded-t-sm transition-all"
                          style={{ height: `${checkInH}%` }}
                          title={`Check-in: ${item.checkedIn}`}
                        />
                        <div
                          className="w-1.5 sm:w-2 bg-amber-400 rounded-t-sm transition-all"
                          style={{ height: `${cancelH}%` }}
                          title={`ยกเลิก: ${item.cancelled}`}
                        />
                        <div
                          className="w-1.5 sm:w-2 bg-red-500 rounded-t-sm transition-all"
                          style={{ height: `${noShowH}%` }}
                          title={`No Show: ${item.noShow}`}
                        />
                      </div>
                      <span className="text-[10px] font-semibold text-slate-600 mt-1">
                        {item.monthShort}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">เดือน</th>
                    <th className="py-2.5 px-3 text-right">จำนวนการจอง (ครั้ง)</th>
                    <th className="py-2.5 px-3 text-right">จำนวนที่นั่งที่จอง</th>
                    <th className="py-2.5 px-3 text-right text-amber-700">ยกเลิก (ครั้ง)</th>
                    <th className="py-2.5 px-3 text-right text-emerald-700">Check-in สำเร็จ (คน)</th>
                    <th className="py-2.5 px-3 text-right text-red-700">No Show (คน)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {report2Dataset.map((row) => (
                    <tr key={row.month} className="hover:bg-slate-50/70">
                      <td className="py-2 px-3 font-semibold text-slate-800">{row.month}</td>
                      <td className="py-2 px-3 text-right text-slate-700">{row.bookingCount.toLocaleString()}</td>
                      <td className="py-2 px-3 text-right font-medium text-slate-800">{row.bookedSeats.toLocaleString()}</td>
                      <td className="py-2 px-3 text-right text-amber-700 font-semibold">{row.cancelled}</td>
                      <td className="py-2 px-3 text-right text-emerald-700 font-bold">{row.checkedIn.toLocaleString()}</td>
                      <td className="py-2 px-3 text-right text-red-600 font-semibold">{row.noShow}</td>
                    </tr>
                  ))}
                  <tr className="bg-slate-100/80 font-bold text-slate-900 border-t-2 border-slate-300">
                    <td className="py-2.5 px-3">รวมทั้งสิ้น (Total)</td>
                    <td className="py-2.5 px-3 text-right">4,470</td>
                    <td className="py-2.5 px-3 text-right">13,290</td>
                    <td className="py-2.5 px-3 text-right text-amber-800">343</td>
                    <td className="py-2.5 px-3 text-right text-emerald-800">12,650</td>
                    <td className="py-2.5 px-3 text-right text-red-700">640</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* REPORT 3: รายงานพฤติกรรมของผู้ใช้บริการ */}
      {/* ========================================== */}
      {activeReportTab === 3 && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                  รายงานที่ 3 (เอกสารหน้า 6-7)
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-1">
                  รายงานพฤติกรรมของผู้ใช้บริการภายในช่วงวันที่ 12 เม.ย. 2568 - 15 เม.ย. 2568
                </h3>
                <p className="text-xs text-slate-500">
                  วิเคราะห์อัตราการขึ้นรถจริง, การยกเลิก และการไม่มาตามนัด (No Show) แยกตามรายบุคคล
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="font-semibold text-slate-600">ช่วงวันที่:</span>
                <select
                  value={dateRangeFilter}
                  onChange={(e) => setDateRangeFilter(e.target.value)}
                  className="border border-slate-300 rounded-lg px-2.5 py-1 text-xs bg-slate-50 font-medium"
                >
                  <option value="default">12 เม.ย. 2568 - 15 เม.ย. 2568 (ช่วงสงกรานต์)</option>
                  <option value="current">สัปดาห์ปัจจุบัน (1-7 ก.ย. 2568)</option>
                </select>
              </div>
            </div>

            {/* Visual breakdown cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
              {/* Individual Bar Performance */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-indigo-600" />
                  พฤติกรรมการจองของผู้ใช้แต่ละคน
                </h4>
                <div className="space-y-3">
                  {report3Dataset.map((user) => (
                    <div key={user.userName} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-800">{user.userName}</span>
                        <span className="text-slate-500">
                          จอง {user.totalBookings} | มาจริง <strong className="text-emerald-600">{user.boardedActual}</strong> | 
                          ยกเลิก <strong className="text-amber-600">{user.cancelled}</strong> | 
                          No Show <strong className="text-red-600">{user.noShow}</strong>
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden flex">
                        <div
                          className="bg-emerald-500 h-full"
                          style={{ width: `${(user.boardedActual / user.totalBookings) * 100}%` }}
                          title="ขึ้นรถจริง"
                        />
                        <div
                          className="bg-amber-400 h-full"
                          style={{ width: `${(user.cancelled / user.totalBookings) * 100}%` }}
                          title="ยกเลิก"
                        />
                        <div
                          className="bg-red-500 h-full"
                          style={{ width: `${(user.noShow / user.totalBookings) * 100}%` }}
                          title="No Show"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary Pie Breakdown */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <PieChart className="w-4 h-4 text-amber-500" />
                    สัดส่วนผลลัพธ์รวมทั้งกลุ่มตัวอย่าง (41 รายการ)
                  </h4>
                  <div className="space-y-2.5 text-xs pt-2">
                    <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50 text-emerald-900 border border-emerald-200">
                      <span className="flex items-center gap-2 font-medium">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        ขึ้นรถจริง (Boarded Actual)
                      </span>
                      <span className="font-bold text-sm">36 รายการ (87.8%)</span>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-lg bg-amber-50 text-amber-900 border border-amber-200">
                      <span className="flex items-center gap-2 font-medium">
                        <AlertCircle className="w-4 h-4 text-amber-600" />
                        กดยกเลิกตามเงื่อนไข (Cancelled)
                      </span>
                      <span className="font-bold text-sm">3 รายการ (7.3%)</span>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-lg bg-red-50 text-red-900 border border-red-200">
                      <span className="flex items-center gap-2 font-medium">
                        <XCircle className="w-4 h-4 text-red-600" />
                        ไม่มาใช้บริการ (No Show)
                      </span>
                      <span className="font-bold text-sm">2 รายการ (4.9%)</span>
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 mt-3 p-2 bg-white rounded border border-slate-200">
                  <Info className="w-3.5 h-3.5 inline mr-1 text-slate-400" />
                  สอดคล้องกับเอกสารหน้า 6-7: สรุปยอดจอง 41 รายการ, สำเร็จ 36, ยกเลิก 3, No Show 2
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4">ผู้ใช้บริการ</th>
                    <th className="py-2.5 px-3 text-right">การจองทั้งหมด (ครั้ง)</th>
                    <th className="py-2.5 px-3 text-right text-emerald-700">ขึ้นรถจริง (ครั้ง)</th>
                    <th className="py-2.5 px-3 text-right text-amber-700">ยกเลิก (ครั้ง)</th>
                    <th className="py-2.5 px-3 text-right text-red-700">No Show (ครั้ง)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {report3Dataset.map((row) => (
                    <tr key={row.userName} className="hover:bg-slate-50">
                      <td className="py-2.5 px-4 font-semibold text-slate-800">{row.userName}</td>
                      <td className="py-2.5 px-3 text-right font-medium text-slate-800">{row.totalBookings}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-emerald-700">{row.boardedActual}</td>
                      <td className="py-2.5 px-3 text-right font-semibold text-amber-700">{row.cancelled}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-red-600">{row.noShow}</td>
                    </tr>
                  ))}
                  <tr className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
                    <td className="py-2.5 px-4">รวมทั้งหมด</td>
                    <td className="py-2.5 px-3 text-right">41</td>
                    <td className="py-2.5 px-3 text-right text-emerald-800">36</td>
                    <td className="py-2.5 px-3 text-right text-amber-800">3</td>
                    <td className="py-2.5 px-3 text-right text-red-700">2</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* REPORT 4: ยอดผู้ใช้แต่ละเส้นทางรายวัน */}
      {/* ========================================== */}
      {activeReportTab === 4 && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                  รายงานที่ 4 (เอกสารหน้า 7-8)
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-1">
                  รายงานสรุปยอดผู้ใช้แต่ละเส้นทางรายวัน (1 ก.ย. 2568 - 7 ก.ย. 2568)
                </h3>
                <p className="text-xs text-slate-500">
                  สถิติผู้โดยสารในเส้นทางที่ 1, 2, และ 3 ตลอดทั้งสัปดาห์ (จันทร์ - อาทิตย์)
                </p>
              </div>
            </div>

            {/* Clustered Route Daily Graph */}
            <div className="my-6 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <BarChart3 className="w-4 h-4 text-amber-500" />
                  จำนวนผู้ใช้บริการแยกตามเส้นทางในแต่ละวัน (คน)
                </h4>
                <div className="flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500" /> เส้นทางที่ 1
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" /> เส้นทางที่ 2
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" /> เส้นทางที่ 3
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-2 pt-6 pb-2 items-end h-44 border-b border-slate-200">
                {report4Dataset.map((day) => {
                  const maxVal = 150;
                  const h1 = Math.round((day.route1 / maxVal) * 100);
                  const h2 = Math.round((day.route2 / maxVal) * 100);
                  const h3 = Math.round((day.route3 / maxVal) * 100);

                  return (
                    <div key={day.dayName} className="flex flex-col items-center gap-1 h-full justify-end group">
                      <span className="text-[10px] font-bold text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">
                        รวม {day.total}
                      </span>
                      <div className="flex items-end gap-0.5 sm:gap-1 w-full justify-center">
                        <div
                          className="w-2.5 sm:w-4 bg-indigo-500 rounded-t-sm"
                          style={{ height: `${h1}%` }}
                          title={`เส้นทาง 1: ${day.route1} คน`}
                        />
                        <div
                          className="w-2.5 sm:w-4 bg-emerald-500 rounded-t-sm"
                          style={{ height: `${h2}%` }}
                          title={`เส้นทาง 2: ${day.route2} คน`}
                        />
                        <div
                          className="w-2.5 sm:w-4 bg-amber-500 rounded-t-sm"
                          style={{ height: `${h3}%` }}
                          title={`เส้นทาง 3: ${day.route3} คน`}
                        />
                      </div>
                      <span className="text-[10px] font-semibold text-slate-600 mt-1 truncate max-w-full text-center">
                        {day.dayName.split(' ')[0]}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4">วันเดินทาง</th>
                    <th className="py-2.5 px-3 text-right text-indigo-700">เส้นทางที่ 1 (ม.มหานคร - โลตัส - รพ.)</th>
                    <th className="py-2.5 px-3 text-right text-emerald-700">เส้นทางที่ 2 (ม.มหานคร - สวนหนองจอก)</th>
                    <th className="py-2.5 px-3 text-right text-amber-700">เส้นทางที่ 3 (Big C - ส้มตำป้านาง)</th>
                    <th className="py-2.5 px-4 text-right font-extrabold bg-slate-200/60">รวมทั้งวัน (คน)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {report4Dataset.map((row) => (
                    <tr key={row.dayName} className="hover:bg-slate-50">
                      <td className="py-2.5 px-4 font-semibold text-slate-800">{row.dayName}</td>
                      <td className="py-2.5 px-3 text-right font-medium text-indigo-700">{row.route1}</td>
                      <td className="py-2.5 px-3 text-right font-medium text-emerald-700">{row.route2}</td>
                      <td className="py-2.5 px-3 text-right font-medium text-amber-700">{row.route3}</td>
                      <td className="py-2.5 px-4 text-right font-bold text-slate-900 bg-slate-100/40">
                        {row.total}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
                    <td className="py-2.5 px-4">รวม 7 วัน (สัปดาห์)</td>
                    <td className="py-2.5 px-3 text-right text-indigo-800">765</td>
                    <td className="py-2.5 px-3 text-right text-emerald-800">582</td>
                    <td className="py-2.5 px-3 text-right text-amber-800">518</td>
                    <td className="py-2.5 px-4 text-right text-slate-900 font-extrabold bg-amber-100/50">
                      1,865
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* REPORT 5: การใช้บริการในแต่ละจุดจอดตามรอบเวลา */}
      {/* ========================================== */}
      {activeReportTab === 5 && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                  รายงานที่ 5 (เอกสารหน้า 8-9)
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-1">
                  รายงานการใช้บริการในแต่ละจุดจอดตามรอบเวลา (1 ก.ย. - 9 ก.ย. 2568)
                </h3>
                <p className="text-xs text-slate-500">
                  แสดงปริมาณการขึ้นและลงของผู้โดยสารในแต่ละจุดจอดจำแนกตามเวลาที่รถเริ่มออก
                </p>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl mt-4">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4">จุดจอด</th>
                    <th className="py-2.5 px-3 text-center">รอบเวลา</th>
                    <th className="py-2.5 px-3 text-right text-emerald-700">จำนวนขึ้น (คน)</th>
                    <th className="py-2.5 px-3 text-right text-blue-700">จำนวนลง (คน)</th>
                    <th className="py-2.5 px-3 text-right font-semibold">ยอดสุทธิบนรถ (+/-)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {report5Dataset.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-2.5 px-4 font-semibold text-slate-800">{row.stopName}</td>
                      <td className="py-2.5 px-3 text-center font-mono font-medium text-slate-700 bg-slate-50">
                        {row.time} น.
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-emerald-700">{row.boardingCount}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-blue-700">{row.alightingCount}</td>
                      <td className="py-2.5 px-3 text-right font-semibold text-slate-800">
                        {row.boardingCount - row.alightingCount >= 0
                          ? `+${row.boardingCount - row.alightingCount}`
                          : `${row.boardingCount - row.alightingCount}`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* REPORT 6: สรุปการมอบหมายงานคนขับรถ */}
      {/* ========================================== */}
      {activeReportTab === 6 && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                  รายงานที่ 6 (เอกสารหน้า 9)
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-1">
                  รายงานสรุปการมอบหมายงานให้คนขับรถ (1 - 30 เม.ย. 2568)
                </h3>
                <p className="text-xs text-slate-500">
                  แบ่งตามช่วงเวลาปฏิบัติงาน: ก่อน 17:00 น. (กะปกติ) และ หลัง 17:00 น. (กะค่ำ/OT)
                </p>
              </div>
            </div>

            {/* Visual Shift Bar */}
            <div className="my-6 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-indigo-600" />
                เปรียบเทียบภาระงานของพนักงานขับรถแต่ละคน (รอบ)
              </h4>
              <div className="space-y-3">
                {report6Dataset.map((drv) => (
                  <div key={drv.driverName} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-800">{drv.driverName}</span>
                      <span className="text-slate-500">
                        ก่อน 17น.: <strong className="text-blue-600">{drv.before1700}</strong> รอบ | 
                        หลัง 17น.: <strong className="text-purple-600">{drv.after1700}</strong> รอบ | 
                        รวม <strong>{drv.totalTrips}</strong> รอบ
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden flex">
                      <div
                        className="bg-blue-500 h-full"
                        style={{ width: `${(drv.before1700 / 30) * 100}%` }}
                        title="ก่อน 17:00 น."
                      />
                      <div
                        className="bg-purple-500 h-full"
                        style={{ width: `${(drv.after1700 / 30) * 100}%` }}
                        title="หลัง 17:00 น."
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4">ชื่อ-สกุล พนักงานขับรถ</th>
                    <th className="py-2.5 px-3 text-right text-blue-700">ก่อน 17:00 น. (รอบ)</th>
                    <th className="py-2.5 px-3 text-right text-purple-700">หลัง 17:00 น. (รอบ)</th>
                    <th className="py-2.5 px-4 text-right font-extrabold bg-slate-200/60">รวมทั้งหมด (รอบ)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {report6Dataset.map((row) => (
                    <tr key={row.driverName} className="hover:bg-slate-50">
                      <td className="py-2.5 px-4 font-semibold text-slate-800">{row.driverName}</td>
                      <td className="py-2.5 px-3 text-right font-medium text-blue-700">{row.before1700}</td>
                      <td className="py-2.5 px-3 text-right font-medium text-purple-700">{row.after1700}</td>
                      <td className="py-2.5 px-4 text-right font-bold text-slate-900 bg-slate-100/50">
                        {row.totalTrips}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
                    <td className="py-2.5 px-4">รวมพนักงานขับรถทั้งหมด</td>
                    <td className="py-2.5 px-3 text-right text-blue-800">70</td>
                    <td className="py-2.5 px-3 text-right text-purple-800">30</td>
                    <td className="py-2.5 px-4 text-right font-extrabold text-slate-900 bg-amber-100/50">
                      100
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* REPORT 7: การมอบหมายงานแยกตามยานพาหนะ */}
      {/* ========================================== */}
      {activeReportTab === 7 && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                  รายงานที่ 7 (เอกสารหน้า 10)
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-1">
                  รายงานจำนวนการมอบหมายงานให้รถแต่ละประเภทและแต่ละคัน (1 - 30 เม.ย. 2568)
                </h3>
                <p className="text-xs text-slate-500">
                  สถิติจำนวนรอบวิ่งของรถตู้ 9 ที่นั่ง, รถบัส 20 ที่นั่ง และรถมินิบัส 15 ที่นั่ง
                </p>
              </div>
            </div>

            {/* Vehicle Category Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-6">
              <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200">
                <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">รถตู้ 9 ที่นั่ง</span>
                <p className="text-2xl font-black text-amber-900 mt-1">63 <span className="text-xs font-normal">รอบ</span></p>
                <p className="text-[11px] text-amber-700 mt-1">สย 2591 (28) • สย 2599 (25) • ชย 7788 (10)</p>
              </div>

              <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200">
                <span className="text-xs font-bold text-blue-800 uppercase tracking-wider">รถบัส 20 ที่นั่ง</span>
                <p className="text-2xl font-black text-blue-900 mt-1">37 <span className="text-xs font-normal">รอบ</span></p>
                <p className="text-[11px] text-blue-700 mt-1">บก 1130 (22) • กข 4455 (15)</p>
              </div>

              <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200">
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">รถมินิบัส 15 ที่นั่ง</span>
                <p className="text-2xl font-black text-emerald-900 mt-1">20 <span className="text-xs font-normal">รอบ</span></p>
                <p className="text-[11px] text-emerald-700 mt-1">นน 5566 (12) • นม 8899 (8)</p>
              </div>
            </div>

            {/* Detailed Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4">ประเภทรถ</th>
                    <th className="py-2.5 px-3">ป้ายทะเบียน</th>
                    <th className="py-2.5 px-4 text-right">จำนวนรอบที่วิ่ง (รอบ)</th>
                    <th className="py-2.5 px-4 text-right">สัดส่วน (%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {report7Dataset.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-2.5 px-4 font-semibold text-slate-800">{row.category}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-700 bg-slate-50/60">{row.plate}</td>
                      <td className="py-2.5 px-4 text-right font-bold text-slate-900">{row.tripCount}</td>
                      <td className="py-2.5 px-4 text-right text-slate-500">
                        {((row.tripCount / 240) * 100).toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
                    <td className="py-2.5 px-4" colSpan={2}>
                      รวมทั้งสิ้น (Total)
                    </td>
                    <td className="py-2.5 px-4 text-right text-amber-700 font-black text-sm">
                      240 รอบ
                    </td>
                    <td className="py-2.5 px-4 text-right font-bold">100.0%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
