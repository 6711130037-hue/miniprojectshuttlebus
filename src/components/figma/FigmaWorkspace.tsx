import React, { useState } from 'react';
import { figmaFrames } from '../../data/mockDatabase';
import { FigmaFrameSpec } from '../../types/schema';
import { UserFlowDiagram } from './UserFlowDiagram';
import { useBus } from '../../context/BusContext';
import { QrCodeSvg } from '../common/QrCodeSvg';
import {
  MousePointer,
  Hand,
  Frame,
  Play,
  ZoomIn,
  ZoomOut,
  Maximize2,
  GitFork,
  Layers,
  Sparkles,
  Smartphone,
  Monitor,
  Eye,
  Check,
  ChevronRight,
  Database,
  ArrowRight,
  Bus,
  Clock,
  MapPin,
  Calendar,
  Ticket,
  User,
  Shield,
  Palette,
  RotateCcw,
} from 'lucide-react';

export const FigmaWorkspace: React.FC = () => {
  const { figmaView, setFigmaView, currentUser, currentDriver, trips, routes, vehicles, stops } = useBus();

  const [activeTool, setActiveTool] = useState<'select' | 'hand'>('select');
  const [zoomLevel, setZoomLevel] = useState<number>(85);
  const [showWires, setShowWires] = useState<boolean>(true);
  const [selectedFrameId, setSelectedFrameId] = useState<string>('frame-1');

  // Interactive prototype screen index (for Device Play mode)
  const [protoScreenIndex, setProtoScreenIndex] = useState<number>(0);
  const protoScreens = ['search', 'trips', 'seat', 'ticket', 'driver', 'admin'];

  const selectedFrame = figmaFrames.find((f) => f.id === selectedFrameId) || figmaFrames[0];

  return (
    <div className="flex flex-col h-[calc(100vh-4.5rem)] bg-[#1e1e1e] text-slate-200 overflow-hidden select-none">
      {/* Figma Top Toolbar */}
      <div className="h-12 bg-[#2c2c2c] border-b border-[#3c3c3c] px-4 flex items-center justify-between z-30 shrink-0 text-xs">
        {/* Left: Tools */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1 bg-[#222] p-1 rounded-lg border border-[#3c3c3c]">
            <button
              onClick={() => setActiveTool('select')}
              title="Move Tool (V)"
              className={`p-1.5 rounded ${
                activeTool === 'select' ? 'bg-[#f59e0b] text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              <MousePointer className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setActiveTool('hand')}
              title="Hand Tool (H)"
              className={`p-1.5 rounded ${
                activeTool === 'hand' ? 'bg-[#f59e0b] text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Hand className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-4 w-px bg-[#444] mx-1"></div>

          {/* Figma View Switchers */}
          <div className="flex items-center gap-1 bg-[#222] p-1 rounded-lg border border-[#3c3c3c]">
            <button
              onClick={() => setFigmaView('canvas')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
                figmaView === 'canvas' ? 'bg-[#383838] text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Frame className="w-3 h-3 text-[#f59e0b]" />
              <span>Canvas Artboards (8)</span>
            </button>

            <button
              onClick={() => setFigmaView('flow')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
                figmaView === 'flow' ? 'bg-[#383838] text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              <GitFork className="w-3 h-3 text-emerald-400" />
              <span>User Flow Map</span>
            </button>

            <button
              onClick={() => setFigmaView('prototype')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
                figmaView === 'prototype' ? 'bg-[#383838] text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Smartphone className="w-3 h-3 text-amber-400" />
              <span>Mobile Device Prototype</span>
            </button>

            <button
              onClick={() => setFigmaView('spec')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
                figmaView === 'spec' ? 'bg-[#383838] text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Palette className="w-3 h-3 text-orange-400" />
              <span>Design Specs & Schema</span>
            </button>
          </div>
        </div>

        {/* Center: Document Title */}
        <div className="hidden md:flex items-center gap-2">
          <span className="font-semibold text-white tracking-wide">
            MUT Bus Booking • Figma Design File
          </span>
          <span className="text-[10px] bg-[#3c3c3c] text-slate-300 px-2 py-0.5 rounded font-mono">
            v2.4 (Miniproject Verified)
          </span>
        </div>

        {/* Right: Zoom & Prototype Play Button */}
        <div className="flex items-center gap-2">
          {/* Wire Toggle */}
          <button
            onClick={() => setShowWires(!showWires)}
            className={`hidden sm:flex items-center gap-1 px-2 py-1 rounded text-[11px] border ${
              showWires ? 'bg-[#f59e0b]/20 text-[#fbbf24] border-[#f59e0b]/40' : 'bg-transparent text-slate-400 border-[#444]'
            }`}
          >
            <span>{showWires ? '✓ Wires On' : 'Wires Off'}</span>
          </button>

          {/* Zoom controls */}
          <div className="flex items-center gap-1 bg-[#222] px-2 py-1 rounded border border-[#3c3c3c]">
            <button onClick={() => setZoomLevel(Math.max(40, zoomLevel - 15))} className="p-0.5 text-slate-400 hover:text-white">
              <ZoomOut className="w-3 h-3" />
            </button>
            <span className="font-mono text-[11px] w-8 text-center text-slate-300">{zoomLevel}%</span>
            <button onClick={() => setZoomLevel(Math.min(150, zoomLevel + 15))} className="p-0.5 text-slate-400 hover:text-white">
              <ZoomIn className="w-3 h-3" />
            </button>
          </div>

          {/* Play Prototype Button */}
          <button
            onClick={() => setFigmaView('prototype')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#f59e0b] hover:bg-[#d97706] text-slate-950 font-bold rounded-lg shadow-sm transition-all"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Present</span>
          </button>
        </div>
      </div>

      {/* Main Workspace Body: Left Sidebar + Canvas Area + Right Inspector */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar: Layers & Frames Tree */}
        <div className="w-64 bg-[#252525] border-r border-[#383838] flex flex-col shrink-0 text-xs">
          <div className="p-3 border-b border-[#383838] flex items-center justify-between text-slate-400">
            <span className="font-semibold text-slate-300 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" />
              <span>Frames & Screens ({figmaFrames.length})</span>
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {figmaFrames.map((frame) => {
              const isSelected = frame.id === selectedFrameId;
              return (
                <button
                  key={frame.id}
                  onClick={() => setSelectedFrameId(frame.id)}
                  className={`w-full text-left p-2 rounded-lg flex items-center justify-between gap-2 transition-all ${
                    isSelected
                      ? 'bg-[#f59e0b] text-slate-950 font-bold'
                      : 'text-slate-300 hover:bg-[#303030]'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    {frame.device === 'mobile' ? (
                      <Smartphone className="w-3.5 h-3.5 shrink-0 opacity-75" />
                    ) : (
                      <Monitor className="w-3.5 h-3.5 shrink-0 opacity-75" />
                    )}
                    <span className="truncate">{frame.name}</span>
                  </div>
                  <span className={`text-[9px] font-mono shrink-0 ${isSelected ? 'text-white/80' : 'text-slate-500'}`}>
                    {frame.code}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Quick Flow Hint */}
          <div className="p-3 bg-[#1e1e1e] border-t border-[#383838] text-[11px] text-slate-400 space-y-1">
            <div className="font-semibold text-amber-400">Figma Prototype Hotspots</div>
            <p className="text-[10px] leading-relaxed text-slate-400">
              ทุกเฟรมเชื่อมโยงกันด้วย User Flow ตามหลัก Miniproject สามารถกดปุ่ม Present เพื่อทดสอบเล่นแบบ Interactive Prototype ได้ทันที
            </p>
          </div>
        </div>

        {/* Center: Canvas / Viewport */}
        <div className="flex-1 overflow-auto bg-[#1a1a1a] relative flex flex-col">
          {figmaView === 'canvas' && (
            <div className="p-8 min-w-max">
              {/* Figma Canvas Header Banner */}
              <div className="mb-6 flex items-center justify-between bg-[#242424] p-4 rounded-xl border border-[#383838] max-w-6xl">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Frame className="w-4 h-4 text-[#f59e0b]" />
                    <span>Figma Canvas Artboards Layout</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    จัดวางหน้าจอระบบทั้งหมด 8 เฟรม (Mobile 390x844 & Desktop 1100x720) ครบทุก Entity จากเอกสาร Miniproject
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="px-2.5 py-1 rounded bg-[#333] text-slate-300 font-mono">
                    Scale: {zoomLevel}%
                  </span>
                </div>
              </div>

              {/* Grid of Artboards */}
              <div
                className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10 origin-top-left transition-transform duration-200"
                style={{ transform: `scale(${zoomLevel / 100})` }}
              >
                {/* FRAME 1: Passenger Search */}
                <div
                  id="artboard-frame-1"
                  onClick={() => setSelectedFrameId('frame-1')}
                  className={`bg-[#121212] rounded-3xl border-2 transition-all p-4 w-[390px] shadow-2xl relative ${
                    selectedFrameId === 'frame-1' ? 'border-[#f59e0b] ring-4 ring-[#f59e0b]/20' : 'border-[#333]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3 text-xs text-slate-400">
                    <span className="font-bold text-white">[SCR-01] ค้นหาและจองรอบรถ</span>
                    <span className="font-mono text-[10px]">390 × 844</span>
                  </div>

                  {/* Mockup Mobile UI Inside */}
                  <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 space-y-3 text-xs">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <div className="font-bold text-amber-400 flex items-center gap-1.5">
                        <Bus className="w-3.5 h-3.5" />
                        <span>MUT Bus</span>
                      </div>
                      <span className="text-[10px] text-slate-400">6711130037</span>
                    </div>

                    <div className="space-y-2">
                      <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                        <div className="text-[10px] text-slate-400">เส้นทาง (Route Entity)</div>
                        <div className="font-bold text-white">เส้นทางไปโลตัส มีนบุรี</div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                          <div className="text-[9px] text-emerald-400">จุดขึ้น (Stop Entity)</div>
                          <div className="font-semibold text-white">ม.มหานคร (101)</div>
                        </div>
                        <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                          <div className="text-[9px] text-rose-400">จุดลง (Stop Entity)</div>
                          <div className="font-semibold text-white">โลตัส มีนบุรี (105)</div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-amber-500 text-slate-950 font-bold p-2 text-center rounded-xl">
                      ค้นหารอบรถ
                    </div>
                  </div>

                  {showWires && (
                    <div className="mt-2 text-[10px] text-[#fbbf24] flex items-center gap-1 font-mono">
                      <span>➔ Wires to [SCR-02] เลือกรอบรถ</span>
                    </div>
                  )}
                </div>

                {/* FRAME 2: Trip Listing */}
                <div
                  id="artboard-frame-2"
                  onClick={() => setSelectedFrameId('frame-2')}
                  className={`bg-[#121212] rounded-3xl border-2 transition-all p-4 w-[390px] shadow-2xl relative ${
                    selectedFrameId === 'frame-2' ? 'border-[#f59e0b] ring-4 ring-[#f59e0b]/20' : 'border-[#333]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3 text-xs text-slate-400">
                    <span className="font-bold text-white">[SCR-02] เลือกรอบเวลา & ยานพาหนะ</span>
                    <span className="font-mono text-[10px]">390 × 844</span>
                  </div>

                  <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 space-y-2.5 text-xs">
                    <div className="font-bold text-white">รอบรถประจำวัน (15 ก.ย. 2026)</div>
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                      <div className="flex justify-between font-bold">
                        <span className="text-amber-400 font-mono text-sm">08:00 น.</span>
                        <span className="text-emerald-400">ว่าง 8 ที่</span>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        รอบ #3001 • รถตู้ 1กข 1234 • คนขับ: สมชาย
                      </div>
                      <div className="bg-amber-500/20 text-amber-300 font-bold p-1 text-center rounded-lg mt-1">
                        เลือกเที่ยวนี้ ➔
                      </div>
                    </div>

                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1 opacity-70">
                      <div className="flex justify-between font-bold">
                        <span className="text-amber-400 font-mono text-sm">12:30 น.</span>
                        <span className="text-emerald-400">ว่าง 9 ที่</span>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        รอบ #3002 • รถตู้ 1กข 1234
                      </div>
                    </div>
                  </div>

                  {showWires && (
                    <div className="mt-2 text-[10px] text-[#fbbf24] flex items-center gap-1 font-mono">
                      <span>➔ Wires to [SCR-03] ผังที่นั่ง</span>
                    </div>
                  )}
                </div>

                {/* FRAME 3: Seat Picker */}
                <div
                  id="artboard-frame-3"
                  onClick={() => setSelectedFrameId('frame-3')}
                  className={`bg-[#121212] rounded-3xl border-2 transition-all p-4 w-[390px] shadow-2xl relative ${
                    selectedFrameId === 'frame-3' ? 'border-[#f59e0b] ring-4 ring-[#f59e0b]/20' : 'border-[#333]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3 text-xs text-slate-400">
                    <span className="font-bold text-white">[SCR-03] ผังที่นั่ง & ยืนยันการจอง</span>
                    <span className="font-mono text-[10px]">390 × 844</span>
                  </div>

                  <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 space-y-3 text-xs">
                    <div className="text-center font-bold text-white">
                      ผังที่นั่งรถตู้ 9 ที่นั่ง (001)
                    </div>

                    <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 grid grid-cols-3 gap-2">
                      <div className="p-2 bg-amber-500 text-slate-950 font-bold rounded-lg text-center">A1 ✓</div>
                      <div className="p-2 bg-slate-800 text-slate-300 rounded-lg text-center">A2</div>
                      <div className="p-2 bg-slate-800 text-slate-300 rounded-lg text-center">A3</div>
                      <div className="p-2 bg-slate-800 text-slate-300 rounded-lg text-center">A4</div>
                      <div className="p-2 bg-slate-800 text-slate-300 rounded-lg text-center">A5</div>
                      <div className="p-2 bg-slate-800 text-slate-300 rounded-lg text-center">A6</div>
                    </div>

                    <div className="p-2 bg-slate-950 rounded-xl text-[10px] text-slate-400 flex justify-between">
                      <span>ผู้โดยสาร: พลพิธ</span>
                      <span className="text-amber-400 font-bold">1 ที่นั่ง</span>
                    </div>

                    <div className="bg-emerald-600 text-white font-bold p-2 text-center rounded-xl">
                      ยืนยันการจองตั๋ว ➔
                    </div>
                  </div>

                  {showWires && (
                    <div className="mt-2 text-[10px] text-[#fbbf24] flex items-center gap-1 font-mono">
                      <span>➔ Wires to [SCR-04] ตั๋ว QR</span>
                    </div>
                  )}
                </div>

                {/* FRAME 4: E-Ticket Boarding Pass */}
                <div
                  id="artboard-frame-4"
                  onClick={() => setSelectedFrameId('frame-4')}
                  className={`bg-[#121212] rounded-3xl border-2 transition-all p-4 w-[390px] shadow-2xl relative ${
                    selectedFrameId === 'frame-4' ? 'border-[#f59e0b] ring-4 ring-[#f59e0b]/20' : 'border-[#333]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3 text-xs text-slate-400">
                    <span className="font-bold text-white">[SCR-04] E-Ticket & Boarding Pass</span>
                    <span className="font-mono text-[10px]">390 × 844</span>
                  </div>

                  <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 space-y-3 text-xs">
                    <div className="flex justify-between border-b border-slate-800 pb-2">
                      <span className="font-bold text-amber-400">MUT BOARDING PASS</span>
                      <span className="font-mono text-white">#90002</span>
                    </div>

                    <div className="text-center py-2">
                      <QrCodeSvg value="MUT-PASS-90002-6711130037" size={110} />
                      <div className="text-[9px] text-slate-400 mt-1 font-mono">
                        สแกนเพื่อเช็คอินขึ้นรถ
                      </div>
                    </div>

                    <div className="bg-slate-950 p-2 rounded-xl text-[10px] space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-400">ผู้โดยสาร:</span>
                        <span className="text-white font-bold">พลพิธ (6711130037)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">ที่นั่ง:</span>
                        <span className="text-amber-400 font-bold">A1 (รอบ 08:00 น.)</span>
                      </div>
                    </div>
                  </div>

                  {showWires && (
                    <div className="mt-2 text-[10px] text-[#fbbf24] flex items-center gap-1 font-mono">
                      <span>➔ Wires to [SCR-05] คนขับสแกน</span>
                    </div>
                  )}
                </div>

                {/* FRAME 5: Driver Check-in */}
                <div
                  id="artboard-frame-5"
                  onClick={() => setSelectedFrameId('frame-5')}
                  className={`bg-[#121212] rounded-3xl border-2 transition-all p-4 w-[390px] shadow-2xl relative ${
                    selectedFrameId === 'frame-5' ? 'border-[#f59e0b] ring-4 ring-[#f59e0b]/20' : 'border-[#333]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3 text-xs text-slate-400">
                    <span className="font-bold text-white">[SCR-05] หน้าจอคนขับรถ (Code 8820)</span>
                    <span className="font-mono text-[10px]">390 × 844</span>
                  </div>

                  <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 space-y-3 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-blue-400">คนขับ: สมชาย ใจดี (00001)</span>
                      <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                        พร้อมวิ่ง
                      </span>
                    </div>

                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 space-y-1">
                      <div className="text-[10px] text-slate-400">รอบ #3001 (08:00 น.)</div>
                      <div className="flex justify-between text-xs font-bold text-white">
                        <span>ผู้โดยสาร: 1 คน</span>
                        <span className="text-emerald-400">เช็คอิน: 100%</span>
                      </div>
                    </div>

                    <div className="p-2 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between text-[11px]">
                      <div>
                        <div className="font-bold text-white">พลพิธ (#90002)</div>
                        <div className="text-[9px] text-slate-400">ขึ้น: ม.มหานคร ➔ ที่นั่ง A1</div>
                      </div>
                      <span className="text-[10px] text-emerald-400 font-bold">✓ เช็คอินแล้ว</span>
                    </div>
                  </div>
                </div>

                {/* FRAME 6: Admin Management (Desktop Frame) */}
                <div
                  id="artboard-frame-6"
                  onClick={() => setSelectedFrameId('frame-6')}
                  className={`bg-[#121212] rounded-3xl border-2 transition-all p-4 w-[420px] shadow-2xl relative ${
                    selectedFrameId === 'frame-6' ? 'border-[#f59e0b] ring-4 ring-[#f59e0b]/20' : 'border-[#333]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3 text-xs text-slate-400">
                    <span className="font-bold text-white">[SCR-06] จัดการรอบรถ (หน้าจอ 10 Code 3456)</span>
                    <span className="font-mono text-[10px]">1100 × 720 (Desktop)</span>
                  </div>

                  <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 space-y-2.5 text-xs">
                    <div className="flex justify-between items-center text-purple-400 font-bold">
                      <span>Admin Trip Manager</span>
                      <span className="text-[10px] bg-purple-500/20 px-2 py-0.5 rounded">ฝ่ายบริหาร</span>
                    </div>

                    <div className="space-y-1.5 text-[11px]">
                      <div className="p-2 bg-slate-950 rounded-lg border border-slate-800 flex justify-between">
                        <span>รอบ #3001 (08:00)</span>
                        <span className="text-emerald-400">เปิดจอง (1)</span>
                      </div>
                      <div className="p-2 bg-slate-950 rounded-lg border border-slate-800 flex justify-between">
                        <span>รอบ #4078 (09:00)</span>
                        <span className="text-emerald-400">เปิดจอง (1)</span>
                      </div>
                    </div>

                    <div className="text-[10px] text-slate-500 pt-1">
                      ผูกคนขับ (พนักงาน) + รถ (ยานพาหนะ) + เส้นทาง
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VIEW: USER FLOW MAP */}
          {figmaView === 'flow' && (
            <div className="p-6">
              <UserFlowDiagram
                onSelectNodeScreen={() => {
                  setFigmaView('canvas');
                }}
              />
            </div>
          )}

          {/* VIEW: INTERACTIVE DEVICE PROTOTYPE */}
          {figmaView === 'prototype' && (
            <div className="p-6 flex flex-col items-center justify-center min-h-full">
              <div className="mb-4 flex items-center gap-3">
                <span className="text-xs text-slate-400">
                  สลับหน้าจอใน Prototype:
                </span>
                <div className="flex gap-1 bg-[#282828] p-1 rounded-xl border border-[#3c3c3c] text-xs">
                  {protoScreens.map((s, idx) => (
                    <button
                      key={s}
                      onClick={() => setProtoScreenIndex(idx)}
                      className={`px-3 py-1 rounded-lg capitalize font-medium ${
                        protoScreenIndex === idx ? 'bg-[#f59e0b] text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {idx + 1}. {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* iPhone 15 Frame Bezel */}
              <div className="w-[380px] h-[780px] bg-black rounded-[50px] p-3 border-4 border-slate-700 shadow-2xl relative flex flex-col overflow-hidden">
                {/* Dynamic Island / Notch */}
                <div className="w-28 h-5 bg-black rounded-full mx-auto mb-2 border border-slate-800 flex items-center justify-end px-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-800"></div>
                </div>

                {/* Status Bar */}
                <div className="flex justify-between items-center px-4 text-[11px] font-semibold text-slate-400 mb-2">
                  <span>9:41</span>
                  <span>MUT 5G • 100%</span>
                </div>

                {/* Screen Content based on step */}
                <div className="flex-1 bg-slate-950 rounded-[36px] overflow-y-auto p-4 text-xs space-y-4 text-slate-200">
                  {protoScreenIndex === 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <div className="font-extrabold text-amber-400 text-sm">MUT Bus Booking</div>
                        <span className="text-[10px] text-slate-400">{currentUser.name}</span>
                      </div>
                      <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-2">
                        <div className="text-[10px] text-slate-400">เลือกเส้นทาง</div>
                        <div className="font-bold text-white text-sm">เส้นทางไปโลตัส มีนบุรี</div>
                        <div className="text-[10px] text-slate-400">จุดขึ้น: ม.มหานคร ➔ จุดลง: โลตัส</div>
                      </div>
                      <button
                        onClick={() => setProtoScreenIndex(1)}
                        className="w-full py-2.5 bg-amber-500 text-slate-950 font-bold rounded-xl text-center shadow-md shadow-amber-500/20"
                      >
                        ค้นหาเที่ยวรถ ➔
                      </button>
                    </div>
                  )}

                  {protoScreenIndex === 1 && (
                    <div className="space-y-3">
                      <div className="text-xs font-bold text-white">รอบรถวันที่ 15 ก.ย. 2026</div>
                      <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-2">
                        <div className="flex justify-between font-bold text-amber-400 text-sm">
                          <span>08:00 น.</span>
                          <span className="text-emerald-400 text-xs">ว่าง 8 ที่</span>
                        </div>
                        <div className="text-[10px] text-slate-400">
                          รถตู้ 1กข 1234 • คนขับ: สมชาย ใจดี
                        </div>
                        <button
                          onClick={() => setProtoScreenIndex(2)}
                          className="w-full py-1.5 bg-amber-500 text-slate-950 font-bold rounded-lg text-center"
                        >
                          เลือกรอบนี้ ➔
                        </button>
                      </div>
                    </div>
                  )}

                  {protoScreenIndex === 2 && (
                    <div className="space-y-3 text-center">
                      <div className="font-bold text-white">เลือกที่นั่ง (รถตู้ 9 ที่นั่ง)</div>
                      <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800 grid grid-cols-3 gap-2">
                        <div className="p-2.5 bg-amber-500 text-slate-950 font-bold rounded-lg">A1 ✓</div>
                        <div className="p-2.5 bg-slate-800 text-slate-300 rounded-lg">A2</div>
                        <div className="p-2.5 bg-slate-800 text-slate-300 rounded-lg">A3</div>
                        <div className="p-2.5 bg-slate-800 text-slate-300 rounded-lg">A4</div>
                        <div className="p-2.5 bg-slate-800 text-slate-300 rounded-lg">A5</div>
                        <div className="p-2.5 bg-slate-800 text-slate-300 rounded-lg">A6</div>
                      </div>
                      <button
                        onClick={() => setProtoScreenIndex(3)}
                        className="w-full py-2 bg-emerald-600 text-white font-bold rounded-xl"
                      >
                        ยืนยันการจอง ➔
                      </button>
                    </div>
                  )}

                  {protoScreenIndex === 3 && (
                    <div className="space-y-3 text-center">
                      <div className="text-emerald-400 font-bold">✓ จองสำเร็จเรียบร้อย</div>
                      <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-2">
                        <div className="text-[10px] font-mono text-amber-400">MUT BOARDING PASS #90002</div>
                        <div className="flex justify-center py-2">
                          <QrCodeSvg value="MUT-PASS-90002" size={130} />
                        </div>
                        <div className="text-[11px] text-slate-300">
                          ที่นั่ง A1 • เวลา 08:00 น.
                        </div>
                      </div>
                      <button
                        onClick={() => setProtoScreenIndex(4)}
                        className="w-full py-2 bg-blue-600 text-white font-bold rounded-xl"
                      >
                        จำลองมุมมองคนขับสแกน ➔
                      </button>
                    </div>
                  )}

                  {protoScreenIndex >= 4 && (
                    <div className="space-y-3">
                      <div className="text-xs font-bold text-blue-400">มุมมองพนักงานขับรถ</div>
                      <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1">
                        <div className="font-bold text-white">พลพิธ วัฒนศิลป์ (#90002)</div>
                        <div className="text-[10px] text-slate-400">ที่นั่ง A1 • จุดขึ้น: ม.มหานคร</div>
                        <div className="text-[10px] text-emerald-400 font-bold">✓ เช็คอินขึ้นรถแล้ว</div>
                      </div>
                      <button
                        onClick={() => setProtoScreenIndex(0)}
                        className="w-full py-2 bg-slate-800 text-slate-300 rounded-xl"
                      >
                        เริ่มต้นจองใหม่ ↺
                      </button>
                    </div>
                  )}
                </div>

                {/* Home Indicator Bar */}
                <div className="w-32 h-1 bg-slate-600 rounded-full mx-auto my-2"></div>
              </div>
            </div>
          )}

          {/* VIEW: DESIGN SPECS & DATA BINDING */}
          {figmaView === 'spec' && (
            <div className="p-8 max-w-5xl space-y-6">
              <div className="bg-[#242424] p-5 rounded-2xl border border-[#383838] space-y-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Database className="w-4 h-4 text-cyan-400" />
                  <span>Entity to UI Data-Binding Architecture (Miniproject Verification)</span>
                </h3>
                <p className="text-xs text-slate-400">
                  ตารางเปรียบเทียบการผูกฟิลด์ (Attributes) จากไฟล์ Miniproject 4 หน้า กับองค์ประกอบหน้าจอบน Figma Artboards
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="bg-[#242424] p-4 rounded-xl border border-[#383838] space-y-2">
                  <span className="font-bold text-amber-400">[SCR-01 & SCR-02] หน้าจองรถ</span>
                  <ul className="space-y-1 text-slate-300">
                    <li>• <strong>เส้นทาง:</strong> ชื่อ, เวลารวม, สถานะ</li>
                    <li>• <strong>จุดจอด:</strong> รหัสจุดจอด, ชื่อ, รายละเอียด</li>
                    <li>• <strong>รอบรถ:</strong> รหัสรอบรถ, วันให้บริการ, เวลาออก</li>
                    <li>• <strong>ยานพาหนะ:</strong> ป้ายทะเบียน, ประเภท, ความจุที่นั่ง</li>
                  </ul>
                </div>

                <div className="bg-[#242424] p-4 rounded-xl border border-[#383838] space-y-2">
                  <span className="font-bold text-emerald-400">[SCR-03 & SCR-04] ผังที่นั่ง & ตั๋ว</span>
                  <ul className="space-y-1 text-slate-300">
                    <li>• <strong>การจอง:</strong> รหัส, วันเวลาจอง, จน.ที่นั่ง, สถานะ, เช็คอิน</li>
                    <li>• <strong>ผู้ใช้งานระบบ:</strong> รหัส, ชื่อ, username, ประเภทผู้ใช้งาน</li>
                    <li>• <strong>รายละเอียดการจอง:</strong> รหัสรอบรถ, จุดขึ้น, จุดลง, ดำเนินการ (5 สถานะ)</li>
                  </ul>
                </div>

                <div className="bg-[#242424] p-4 rounded-xl border border-[#383838] space-y-2">
                  <span className="font-bold text-blue-400">[SCR-05] คนขับรถ & เช็คอิน</span>
                  <ul className="space-y-1 text-slate-300">
                    <li>• <strong>พนักงาน:</strong> รหัสพนักงาน, ชื่อเต็ม, phone, แผนก, ตำแหน่ง</li>
                    <li>• <strong>รอบรถ:</strong> รหัสคนขับ (FK), รหัสยานพาหนะ (FK)</li>
                    <li>• <strong>การจอง:</strong> ตรวจสอบฟิลด์ <code>เช็คอิน</code> (true/false)</li>
                  </ul>
                </div>

                <div className="bg-[#242424] p-4 rounded-xl border border-[#383838] space-y-2">
                  <span className="font-bold text-purple-400">[SCR-06, 07, 08] Admin & RBAC</span>
                  <ul className="space-y-1 text-slate-300">
                    <li>• <strong>หน้าจอ:</strong> รหัสหน้าจอ (10, 12, 16), โค้ด (3456, 6794, 9102)</li>
                    <li>• <strong>สิทธิตามตำแหน่ง:</strong> สิทธิการดู, สิทธิการแก้ไข (Associative Table M:N)</li>
                    <li>• <strong>จุดจอดในเส้นทาง:</strong> ลำดับจุดจอด, นาทีจากจุดก่อนหน้า</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Inspector: Frame Property Inspector */}
        <div className="w-72 bg-[#252525] border-l border-[#383838] p-4 flex flex-col shrink-0 text-xs space-y-4">
          <div className="font-bold text-white uppercase tracking-wider text-[10px] text-slate-400 pb-2 border-b border-[#383838]">
            Frame Inspector
          </div>

          <div>
            <div className="text-[10px] text-slate-500 font-mono">Selected Frame</div>
            <div className="font-bold text-white text-sm mt-0.5">{selectedFrame.name}</div>
            <div className="text-[11px] text-amber-400 font-mono mt-0.5">{selectedFrame.code}</div>
          </div>

          <div className="grid grid-cols-2 gap-2 bg-[#1e1e1e] p-2.5 rounded-xl border border-[#383838] font-mono text-[11px]">
            <div>
              <span className="text-slate-500">W: </span>
              <span className="text-white font-bold">{selectedFrame.width}px</span>
            </div>
            <div>
              <span className="text-slate-500">H: </span>
              <span className="text-white font-bold">{selectedFrame.height}px</span>
            </div>
            <div>
              <span className="text-slate-500">Device: </span>
              <span className="text-slate-300 capitalize">{selectedFrame.device}</span>
            </div>
            <div>
              <span className="text-slate-500">Group: </span>
              <span className="text-slate-300 truncate">{selectedFrame.screenGroup}</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="text-[10px] font-semibold text-slate-400">คำอธิบายหน้าจอ:</div>
            <p className="text-[11px] text-slate-300 leading-relaxed bg-[#1e1e1e] p-2.5 rounded-xl border border-[#383838]">
              {selectedFrame.description}
            </p>
          </div>

          <div className="space-y-1.5">
            <div className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
              <Database className="w-3 h-3 text-cyan-400" />
              <span>Entity ที่ผูกกับหน้านี้:</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {selectedFrame.entities.map((ent) => (
                <span
                  key={ent}
                  className="px-2 py-0.5 rounded bg-[#1e1e1e] border border-[#383838] text-[10px] text-amber-300 font-mono"
                >
                  {ent}
                </span>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-[#383838]">
            <button
              onClick={() => setFigmaView('prototype')}
              className="w-full py-2 bg-[#f59e0b] hover:bg-[#d97706] text-slate-950 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-sm"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>รันดูใน Prototype Mode</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
