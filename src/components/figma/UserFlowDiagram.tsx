import React, { useState } from 'react';
import { initialUserFlowNodes } from '../../data/mockDatabase';
import { UserFlowNode } from '../../types/schema';
import {
  ArrowRight,
  GitFork,
  CheckCircle2,
  ExternalLink,
  Shield,
  Bus,
  User,
  Smartphone,
  Layers,
  Database,
} from 'lucide-react';

interface UserFlowDiagramProps {
  onSelectNodeScreen?: (screenCode: string) => void;
}

export const UserFlowDiagram: React.FC<UserFlowDiagramProps> = ({ onSelectNodeScreen }) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string>('flow-search');

  const selectedNode = initialUserFlowNodes.find((n) => n.id === selectedNodeId);

  const getRoleBadge = (role: UserFlowNode['role']) => {
    switch (role) {
      case 'passenger':
        return (
          <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
            <User className="w-3 h-3" />
            <span>ผู้โดยสาร (Passenger)</span>
          </span>
        );
      case 'driver':
        return (
          <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
            <Bus className="w-3 h-3" />
            <span>คนขับรถ (Driver)</span>
          </span>
        );
      case 'admin':
        return (
          <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
            <Shield className="w-3 h-3" />
            <span>ผู้ดูแลระบบ (Admin)</span>
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            <Layers className="w-3 h-3" />
            <span>ระบบอัตโนมัติ (System)</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <GitFork className="w-4 h-4" />
              <span>User Flow & System Architecture</span>
            </div>
            <h2 className="text-xl font-black text-white mt-1">
              ผังการทำงานของระบบจองรถบัส (User Journey & Flow)
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              เชื่อมโยงขั้นตอนการใช้งานกับ Entity ในฐานข้อมูล Miniproject (คลิกที่แต่ละขั้นตอนเพื่อดูรายละเอียดและ Entity ที่เกี่ยวข้อง)
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/20 font-medium">
              ผู้โดยสาร 5 ขั้นตอน
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-300 border border-blue-500/20 font-medium">
              คนขับรถ 1 ขั้นตอน
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-300 border border-purple-500/20 font-medium">
              Admin 3 หน้าจอ
            </span>
          </div>
        </div>
      </div>

      {/* Main Flow Chart Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Visual Graph Area */}
        <div className="lg:col-span-8 bg-slate-950 border border-slate-800 rounded-2xl p-6 relative overflow-x-auto">
          <div className="min-w-[640px] space-y-4">
            {/* Stage Title */}
            <div className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider pb-2 border-b border-slate-800/80 flex items-center justify-between">
              <span>Customer Journey (ขั้นตอนการจองและเช็คอินของผู้โดยสาร & คนขับ)</span>
              <span className="text-slate-500">Interactive Node Graph</span>
            </div>

            {/* Sequence Flow Nodes */}
            <div className="space-y-4 pt-2">
              {initialUserFlowNodes.map((node, index) => {
                const isSelected = node.id === selectedNodeId;

                return (
                  <div key={node.id} className="relative">
                    <button
                      onClick={() => setSelectedNodeId(node.id)}
                      className={`w-full text-left p-4 rounded-xl border transition-all flex items-start justify-between gap-4 ${
                        isSelected
                          ? 'bg-slate-900 border-amber-500 shadow-lg shadow-amber-500/10 scale-[1.01]'
                          : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                      }`}
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="text-sm font-bold text-white">
                            {node.title}
                          </span>
                          {getRoleBadge(node.role)}
                          {node.screenCode && (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                              {node.screenCode}
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-400">
                          {node.description}
                        </p>

                        {/* Entities list badges */}
                        <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                          <Database className="w-3 h-3 text-slate-500" />
                          <span className="text-[10px] text-slate-500">Entity ที่ใช้:</span>
                          {node.entityUsed.map((ent) => (
                            <span
                              key={ent}
                              className="text-[10px] bg-slate-950 text-slate-300 px-2 py-0.5 rounded border border-slate-800 font-mono"
                            >
                              {ent}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-2 pt-1">
                        {onSelectNodeScreen && node.screenCode && (
                          <span className="text-xs text-amber-400 font-semibold flex items-center gap-1 bg-amber-500/10 px-2 py-1 rounded">
                            <span>ดูหน้าจอ</span>
                            <ExternalLink className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                    </button>

                    {/* Connecting arrow down */}
                    {index < initialUserFlowNodes.length - 1 && (
                      <div className="flex justify-center my-1.5">
                        <div className="w-0.5 h-4 bg-gradient-to-b from-amber-500/50 to-slate-800"></div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Selected Step Detail Panel */}
        <div className="lg:col-span-4 space-y-6">
          {selectedNode ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-5 sticky top-20">
              <div>
                <div className="text-[11px] font-mono text-amber-400 font-semibold uppercase">
                  Flow Node Inspector
                </div>
                <h3 className="text-lg font-bold text-white mt-1">
                  {selectedNode.title}
                </h3>
                <div className="mt-2">{getRoleBadge(selectedNode.role)}</div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="text-slate-400 font-semibold">คำอธิบายขั้นตอน:</div>
                <p className="text-slate-300 leading-relaxed bg-slate-950 p-3 rounded-xl border border-slate-800">
                  {selectedNode.description}
                </p>
              </div>

              {/* Data Entities in this step */}
              <div className="space-y-2 text-xs">
                <div className="text-slate-400 font-semibold flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Entity & Attributes ในเอกสาร Miniproject:</span>
                </div>
                <div className="space-y-2">
                  {selectedNode.entityUsed.map((ent) => (
                    <div
                      key={ent}
                      className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1"
                    >
                      <div className="font-bold text-amber-400 flex items-center justify-between">
                        <span>{ent}</span>
                        <span className="text-[10px] text-slate-500 font-mono">Relational Table</span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {ent === 'การจอง' && 'รหัส (PK), วันเวลาจอง, จน.ที่นั่ง, สถานะ, เช็คอิน, ผู้ใช้งานระบบ (FK)'}
                        {ent === 'รอบรถ' && 'รหัส (PK), วันให้บริการ, เวลาออก, สถานะ, เส้นทาง (FK), คนขับ (FK), ยานพาหนะ (FK)'}
                        {ent === 'เส้นทาง' && 'รหัส (PK), ชื่อ, เวลารวม, สถานะ'}
                        {ent === 'จุดจอด' && 'รหัส (PK), ชื่อ, รายละเอียด, สถานะ'}
                        {ent === 'จุดจอดในเส้นทาง' && 'รหัส (PK), เส้นทาง (FK), จุดจอด (FK), ลำดับจุดจอด, นาทีจากจุดก่อนหน้า'}
                        {ent === 'ยานพาหนะ' && 'รหัส (PK), ป้ายทะเบียน, ประเภท, ความจุที่นั่ง, สถานะ'}
                        {ent === 'ผู้ใช้งานระบบ' && 'รหัส (PK), ชื่อ, username, password, ประเภทผู้ใช้งาน, เบอร์โทร'}
                        {ent === 'สิทธิตามตำแหน่ง' && 'รหัสสิทธิ์ (PK), ตำแหน่ง (FK), หน้าจอ (FK), สิทธิการดู, สิทธิการแก้ไข'}
                        {ent === 'พนักงาน' && 'รหัส (PK), ชื่อเต็ม, username, password, phone, email, แผนก (FK), ตำแหน่ง (FK)'}
                        {ent === 'หน้าจอ' && 'รหัส (PK), ชื่อ, โค้ด, กลุ่ม'}
                        {ent === 'รายละเอียดการจอง' && 'รหัส (PK), การจอง (FK), รอบรถ (FK), จุดขึ้น, จุดลง, ดำเนินการ (5 สถานะ)'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              {selectedNode.screenCode && (
                <button
                  onClick={() => {
                    if (onSelectNodeScreen) onSelectNodeScreen(selectedNode.screenCode!);
                  }}
                  className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>เปิดดูหน้าจอนี้ใน Figma Canvas</span>
                </button>
              )}
            </div>
          ) : (
            <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl text-slate-500 text-xs">
              เลือกขั้นตอนบน Flow Chart เพื่อดูรายละเอียด
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
