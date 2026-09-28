import React, { useState, useEffect, useRef } from 'react';
import {
  Monitor,
  Folder,
  Terminal as TerminalIcon,
  FileText,
  Settings,
  HardDrive,
  Globe,
  X,
  Minus,
  Square,
  CheckCircle2,
  Cpu,
  Shield,
  Search,
  Wifi,
  Volume2,
  Calendar,
  MousePointer,
  RotateCcw,
  Sparkles,
  Command,
} from 'lucide-react';
import { RemoteMousePosition } from '../types/remote';

interface SimulatedDesktopProps {
  remoteCursor?: RemoteMousePosition | null;
  isControlling?: boolean;
  onAction?: (actionName: string, details?: any) => void;
  readOnly?: boolean;
}

interface WindowState {
  id: string;
  title: string;
  isOpen: boolean;
  isMinimized: boolean;
  isMaximized: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
}

export const SimulatedDesktop: React.FC<SimulatedDesktopProps> = ({
  remoteCursor,
  isControlling,
  onAction,
  readOnly = false,
}) => {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');
  const [startMenuOpen, setStartMenuOpen] = useState(false);
  
  // Note pad state
  const [noteText, setNoteText] = useState(
    'سجل مهام الدعم الفني:\n- فحص اتصال خادم قاعدة البيانات\n- تحديث ترخيص الحماية EDR\n- تسليم صلاحيات الوصول للمسؤول\n- فحص استهلاك الذاكرة العشوائية'
  );

  // Terminal state
  const [termHistory, setTermHistory] = useState<Array<{ cmd: string; output: string }>>([
    { cmd: 'whoami', output: 'remote-user\\administrator' },
    { cmd: 'ipconfig /all', output: 'IPv4: 192.168.1.45 | Subnet: 255.255.255.0 | Gateway: 192.168.1.1' },
    { cmd: 'service status', output: 'RemoteDesk-Host-Service: RUNNING (PID: 3824, Port: 8443 TLS)' },
  ]);
  const [termInput, setTermInput] = useState('');

  // Windows management
  const [windows, setWindows] = useState<Record<string, WindowState>>({
    terminal: {
      id: 'terminal',
      title: 'PowerShell Terminal (Remote Host)',
      isOpen: true,
      isMinimized: false,
      isMaximized: false,
      x: 60,
      y: 40,
      width: 520,
      height: 330,
    },
    explorer: {
      id: 'explorer',
      title: 'مستكشف الملفات - File Explorer (C:\\RemoteDesk)',
      isOpen: false,
      isMinimized: false,
      isMaximized: false,
      x: 120,
      y: 90,
      width: 560,
      height: 360,
    },
    notes: {
      id: 'notes',
      title: 'المفكرة - Notepad (ملاحظات الدعم.txt)',
      isOpen: true,
      isMinimized: false,
      isMaximized: false,
      x: 280,
      y: 80,
      width: 440,
      height: 300,
    },
    settings: {
      id: 'settings',
      title: 'إعدادات النظام والتحكم عن بعد',
      isOpen: false,
      isMinimized: false,
      isMaximized: false,
      x: 180,
      y: 110,
      width: 500,
      height: 340,
    },
  });

  const [activeWindow, setActiveWindow] = useState<string>('terminal');
  const desktopRef = useRef<HTMLDivElement>(null);

  // Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
      setCurrentDate(
        now.toLocaleDateString('ar-EG', { month: 'short', day: 'numeric', year: 'numeric' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const openWindow = (id: string) => {
    setWindows((prev) => ({
      ...prev,
      [id]: { ...prev[id], isOpen: true, isMinimized: false },
    }));
    setActiveWindow(id);
    setStartMenuOpen(false);
    onAction?.('OPEN_WINDOW', { window: id });
  };

  const closeWindow = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setWindows((prev) => ({
      ...prev,
      [id]: { ...prev[id], isOpen: false },
    }));
    onAction?.('CLOSE_WINDOW', { window: id });
  };

  const toggleMinimize = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setWindows((prev) => ({
      ...prev,
      [id]: { ...prev[id], isMinimized: !prev[id].isMinimized },
    }));
  };

  const toggleMaximize = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setWindows((prev) => ({
      ...prev,
      [id]: { ...prev[id], isMaximized: !prev[id].isMaximized },
    }));
  };

  const handleTerminalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!termInput.trim()) return;

    const cmd = termInput.trim().toLowerCase();
    let output = '';

    if (cmd === 'help') {
      output = 'الأوامر المتاحة: help, status, whoami, ipconfig, ls, dir, ping, top, clear, cls, date';
    } else if (cmd === 'clear' || cmd === 'cls') {
      setTermHistory([]);
      setTermInput('');
      return;
    } else if (cmd === 'status') {
      output = '✅ كل العمليات تعمل بصورة طبيعية (CPU: 24% | RAM: 3.2GB / 16GB | Net: 94 Mbps)';
    } else if (cmd === 'top') {
      output = 'PID 1024 (system): 2.1% | PID 3824 (RemoteDeskAgent): 1.4% | PID 4910 (Explorer): 3.2%';
    } else if (cmd.startsWith('ping')) {
      output = 'PING gateway (192.168.1.1): 64 bytes, time=1.2ms, TTL=64. Packet loss: 0%';
    } else if (cmd === 'ls' || cmd === 'dir') {
      output = 'Documents/   Downloads/   System32/   RemoteDesk/   config.ini   audit_log.db';
    } else if (cmd === 'whoami') {
      output = 'remote-host\\administrator [Elevated Service Account]';
    } else if (cmd === 'date') {
      output = new Date().toISOString();
    } else {
      output = `تم استلام الأمر بنجاح: "${cmd}" - كود الخروج: 0 (OK)`;
    }

    setTermHistory((prev) => [...prev, { cmd: termInput, output }]);
    setTermInput('');
    onAction?.('TERMINAL_COMMAND_EXECUTED', { cmd });
  };

  return (
    <div
      ref={desktopRef}
      className="relative w-full h-full min-h-[520px] bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-950 text-white select-none overflow-hidden font-sans rounded-xl border border-slate-700/60 shadow-2xl flex flex-col justify-between"
      style={{ direction: 'ltr' }} // Keep OS layout conventional desktop style with bilingual elements
    >
      {/* Background Graphic / Wallpaper */}
      <div className="absolute inset-0 pointer-events-none opacity-25">
        <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-blue-500 rounded-full blur-[140px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600 rounded-full blur-[160px]" />
        <div className="absolute inset-0 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:24px_24px] opacity-20" />
      </div>

      {/* Remote Cursor Indicator if Admin is controlling */}
      {remoteCursor && (
        <div
          className="absolute z-50 pointer-events-none transition-all duration-75 ease-out flex items-start gap-1"
          style={{
            left: `${remoteCursor.x}%`,
            top: `${remoteCursor.y}%`,
            transform: 'translate(-2px, -2px)',
          }}
        >
          <div className="relative">
            <MousePointer className="w-5 h-5 text-amber-400 fill-amber-400 drop-shadow-[0_2px_8px_rgba(245,158,11,0.8)]" />
            <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />
          </div>
          <span className="bg-amber-500/90 text-slate-950 font-bold text-[10px] px-1.5 py-0.5 rounded shadow-lg whitespace-nowrap">
            مؤشر المسؤول (Admin)
          </span>
        </div>
      )}

      {/* Remote Host OS Watermark / Header Info */}
      <div className="relative z-10 px-4 py-2 flex items-center justify-between text-xs text-slate-400/80 bg-slate-950/40 backdrop-blur-sm border-b border-slate-800/40">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-emerald-400 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            LIVE HOST DESKTOP
          </span>
          <span className="text-slate-500">|</span>
          <span>Host: Windows 11 Enterprise (192.168.1.45)</span>
          <span className="text-slate-500">|</span>
          <span>Agent v2.4 (Ultra-Low Latency Direct Render)</span>
        </div>
        <div className="flex items-center gap-2">
          {isControlling && (
            <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded text-[11px] font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              التحكم عن بعد نشط بواسطة المسؤول
            </span>
          )}
        </div>
      </div>

      {/* Main Desktop Area */}
      <div className="relative z-10 flex-1 p-6 flex flex-col justify-start">
        {/* Desktop Icons Grid */}
        <div className="grid grid-flow-row auto-rows-max gap-6 w-24">
          <button
            onClick={() => openWindow('terminal')}
            className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-white/10 active:bg-white/20 transition-all text-center group cursor-pointer"
          >
            <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-emerald-400 group-hover:scale-105 shadow-md">
              <TerminalIcon className="w-6 h-6" />
            </div>
            <span className="text-xs text-slate-200 font-medium drop-shadow leading-tight">
              Terminal
            </span>
          </button>

          <button
            onClick={() => openWindow('explorer')}
            className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-white/10 active:bg-white/20 transition-all text-center group cursor-pointer"
          >
            <div className="w-12 h-12 rounded-xl bg-amber-600/30 border border-amber-500/40 flex items-center justify-center text-amber-300 group-hover:scale-105 shadow-md">
              <Folder className="w-6 h-6" />
            </div>
            <span className="text-xs text-slate-200 font-medium drop-shadow leading-tight">
              المستكشف
            </span>
          </button>

          <button
            onClick={() => openWindow('notes')}
            className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-white/10 active:bg-white/20 transition-all text-center group cursor-pointer"
          >
            <div className="w-12 h-12 rounded-xl bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-300 group-hover:scale-105 shadow-md">
              <FileText className="w-6 h-6" />
            </div>
            <span className="text-xs text-slate-200 font-medium drop-shadow leading-tight">
              الملاحظات
            </span>
          </button>

          <button
            onClick={() => openWindow('settings')}
            className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-white/10 active:bg-white/20 transition-all text-center group cursor-pointer"
          >
            <div className="w-12 h-12 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-300 group-hover:scale-105 shadow-md">
              <Settings className="w-6 h-6" />
            </div>
            <span className="text-xs text-slate-200 font-medium drop-shadow leading-tight">
              الإعدادات
            </span>
          </button>
        </div>

        {/* Floating Windows */}

        {/* 1. Terminal Window */}
        {windows.terminal.isOpen && !windows.terminal.isMinimized && (
          <div
            onClick={() => setActiveWindow('terminal')}
            className={`absolute shadow-2xl rounded-xl border overflow-hidden flex flex-col transition-shadow ${
              activeWindow === 'terminal'
                ? 'border-emerald-500/60 ring-2 ring-emerald-500/20 z-30'
                : 'border-slate-700/80 z-20'
            } ${
              windows.terminal.isMaximized
                ? 'inset-3 !w-auto !h-auto'
                : 'w-[480px] max-w-[90%] h-[320px]'
            }`}
            style={{
              left: windows.terminal.isMaximized ? undefined : `${windows.terminal.x}px`,
              top: windows.terminal.isMaximized ? undefined : `${windows.terminal.y}px`,
            }}
          >
            {/* Titlebar */}
            <div className="bg-slate-900 px-3 py-2 flex items-center justify-between border-b border-slate-800 text-xs cursor-default">
              <div className="flex items-center gap-2 text-slate-200 font-mono">
                <TerminalIcon className="w-3.5 h-3.5 text-emerald-400" />
                <span>{windows.terminal.title}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={(e) => toggleMinimize('terminal', e)}
                  className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <button
                  onClick={(e) => toggleMaximize('terminal', e)}
                  className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
                >
                  <Square className="w-3 h-3" />
                </button>
                <button
                  onClick={(e) => closeWindow('terminal', e)}
                  className="p-1 hover:bg-red-500/30 rounded text-slate-400 hover:text-red-400"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Terminal Body */}
            <div className="bg-slate-950/95 flex-1 p-3 font-mono text-xs overflow-y-auto flex flex-col justify-between text-slate-300">
              <div className="space-y-2">
                <div className="text-emerald-400/80 text-[11px] pb-1 border-b border-slate-800">
                  Microsoft Windows Remote Agent [Version 10.0.22631.3007]
                  <br />(c) Microsoft Corporation. All rights reserved. Type "help" for commands.
                </div>
                {termHistory.map((item, idx) => (
                  <div key={idx} className="space-y-0.5">
                    <div className="flex items-center gap-1 text-emerald-300">
                      <span className="text-blue-400">PS C:\RemoteDesk&gt;</span>
                      <span>{item.cmd}</span>
                    </div>
                    <div className="text-slate-300 pl-4 whitespace-pre-wrap">{item.output}</div>
                  </div>
                ))}
              </div>

              {/* Terminal Input */}
              <form onSubmit={handleTerminalSubmit} className="flex items-center gap-1 pt-2 border-t border-slate-900 mt-2">
                <span className="text-blue-400">PS C:\RemoteDesk&gt;</span>
                <input
                  type="text"
                  value={termInput}
                  onChange={(e) => setTermInput(e.target.value)}
                  placeholder="اكتب أمراً هنا (مثال: help, status, whoami, ipconfig)..."
                  disabled={readOnly}
                  className="flex-1 bg-transparent border-none outline-none text-emerald-300 font-mono text-xs placeholder:text-slate-600"
                />
              </form>
            </div>
          </div>
        )}

        {/* 2. Notepad Window */}
        {windows.notes.isOpen && !windows.notes.isMinimized && (
          <div
            onClick={() => setActiveWindow('notes')}
            className={`absolute shadow-2xl rounded-xl border overflow-hidden flex flex-col transition-shadow ${
              activeWindow === 'notes'
                ? 'border-blue-500/60 ring-2 ring-blue-500/20 z-30'
                : 'border-slate-700/80 z-20'
            } ${
              windows.notes.isMaximized
                ? 'inset-3 !w-auto !h-auto'
                : 'w-[420px] max-w-[85%] h-[270px]'
            }`}
            style={{
              left: windows.notes.isMaximized ? undefined : `${windows.notes.x}px`,
              top: windows.notes.isMaximized ? undefined : `${windows.notes.y}px`,
            }}
          >
            {/* Titlebar */}
            <div className="bg-slate-900 px-3 py-2 flex items-center justify-between border-b border-slate-800 text-xs">
              <div className="flex items-center gap-2 text-slate-200">
                <FileText className="w-3.5 h-3.5 text-blue-400" />
                <span>{windows.notes.title}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={(e) => toggleMinimize('notes', e)}
                  className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <button
                  onClick={(e) => toggleMaximize('notes', e)}
                  className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
                >
                  <Square className="w-3 h-3" />
                </button>
                <button
                  onClick={(e) => closeWindow('notes', e)}
                  className="p-1 hover:bg-red-500/30 rounded text-slate-400 hover:text-red-400"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Notepad Editor */}
            <div className="bg-slate-950/90 flex-1 p-3 flex flex-col">
              <textarea
                value={noteText}
                onChange={(e) => {
                  setNoteText(e.target.value);
                  onAction?.('EDIT_NOTE', { length: e.target.value.length });
                }}
                disabled={readOnly}
                className="w-full h-full bg-transparent resize-none outline-none font-mono text-xs text-slate-200 leading-relaxed"
                placeholder="يمكن للمسؤول الكتابة هنا مباشرة من خلال جلسة التحكم..."
              />
              <div className="text-[10px] text-slate-500 flex justify-between pt-1 border-t border-slate-800">
                <span>UTF-8 | Windows (CRLF)</span>
                <span>تزامن مباشر مع الفأرة ولوحة المفاتيح</span>
              </div>
            </div>
          </div>
        )}

        {/* 3. File Explorer Window */}
        {windows.explorer.isOpen && !windows.explorer.isMinimized && (
          <div
            onClick={() => setActiveWindow('explorer')}
            className={`absolute shadow-2xl rounded-xl border overflow-hidden flex flex-col transition-shadow ${
              activeWindow === 'explorer'
                ? 'border-amber-500/60 ring-2 ring-amber-500/20 z-30'
                : 'border-slate-700/80 z-20'
            } ${
              windows.explorer.isMaximized
                ? 'inset-3 !w-auto !h-auto'
                : 'w-[480px] max-w-[90%] h-[300px]'
            }`}
            style={{
              left: windows.explorer.isMaximized ? undefined : `${windows.explorer.x}px`,
              top: windows.explorer.isMaximized ? undefined : `${windows.explorer.y}px`,
            }}
          >
            {/* Titlebar */}
            <div className="bg-slate-900 px-3 py-2 flex items-center justify-between border-b border-slate-800 text-xs">
              <div className="flex items-center gap-2 text-slate-200">
                <Folder className="w-3.5 h-3.5 text-amber-400" />
                <span>{windows.explorer.title}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={(e) => toggleMinimize('explorer', e)}
                  className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <button
                  onClick={(e) => toggleMaximize('explorer', e)}
                  className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
                >
                  <Square className="w-3 h-3" />
                </button>
                <button
                  onClick={(e) => closeWindow('explorer', e)}
                  className="p-1 hover:bg-red-500/30 rounded text-slate-400 hover:text-red-400"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Explorer Body */}
            <div className="bg-slate-950/95 flex-1 p-3 grid grid-cols-3 gap-3 overflow-y-auto">
              {[
                { name: 'SystemLogs', type: 'folder', size: '--' },
                { name: 'Financial_Report.xlsx', type: 'file', size: '1.2 MB' },
                { name: 'backup_2026.sql', type: 'file', size: '48.5 MB' },
                { name: 'RemoteDeskAgent.exe', type: 'file', size: '14.2 MB' },
                { name: 'security_audit.pdf', type: 'file', size: '820 KB' },
                { name: 'config.json', type: 'code', size: '4.8 KB' },
              ].map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => onAction?.('SELECT_FILE', { name: item.name })}
                  className="flex items-center gap-2 p-2 rounded-lg bg-slate-900/60 hover:bg-indigo-600/30 border border-slate-800/80 cursor-pointer transition-all"
                >
                  {item.type === 'folder' ? (
                    <Folder className="w-6 h-6 text-amber-400 shrink-0" />
                  ) : (
                    <FileText className="w-6 h-6 text-blue-400 shrink-0" />
                  )}
                  <div className="truncate">
                    <p className="text-xs text-slate-200 truncate">{item.name}</p>
                    <p className="text-[10px] text-slate-400">{item.size}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. Settings Window */}
        {windows.settings.isOpen && !windows.settings.isMinimized && (
          <div
            onClick={() => setActiveWindow('settings')}
            className={`absolute shadow-2xl rounded-xl border overflow-hidden flex flex-col transition-shadow ${
              activeWindow === 'settings'
                ? 'border-indigo-500/60 ring-2 ring-indigo-500/20 z-30'
                : 'border-slate-700/80 z-20'
            } ${
              windows.settings.isMaximized
                ? 'inset-3 !w-auto !h-auto'
                : 'w-[440px] max-w-[85%] h-[280px]'
            }`}
            style={{
              left: windows.settings.isMaximized ? undefined : `${windows.settings.x}px`,
              top: windows.settings.isMaximized ? undefined : `${windows.settings.y}px`,
            }}
          >
            <div className="bg-slate-900 px-3 py-2 flex items-center justify-between border-b border-slate-800 text-xs">
              <div className="flex items-center gap-2 text-slate-200">
                <Settings className="w-3.5 h-3.5 text-indigo-400" />
                <span>{windows.settings.title}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={(e) => toggleMinimize('settings', e)}
                  className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <button
                  onClick={(e) => closeWindow('settings', e)}
                  className="p-1 hover:bg-red-500/30 rounded text-slate-400 hover:text-red-400"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>

            <div className="bg-slate-950/95 flex-1 p-4 text-xs space-y-3">
              <div className="flex items-center justify-between p-2 rounded bg-slate-900 border border-slate-800">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-400" />
                  <span>تشفير الجلسة (AES-256 + DTLS-SRTP)</span>
                </div>
                <span className="text-emerald-400 font-mono text-[11px]">مفعّل</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-slate-900 border border-slate-800">
                <div className="flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-blue-400" />
                  <span>بروتوكول البث (WebRTC Direct DataChannel)</span>
                </div>
                <span className="text-blue-400 font-mono text-[11px]">30 FPS @ 2.4 Mbps</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-slate-900 border border-slate-800">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-amber-400" />
                  <span>حقن الإدخال المباشر (Direct Input Injection)</span>
                </div>
                <span className="text-amber-400 font-mono text-[11px]">مسموح</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Start Menu Popup */}
      {startMenuOpen && (
        <div className="absolute bottom-12 left-4 w-72 bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl shadow-2xl p-4 z-40 space-y-3">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-sky-400 flex items-center justify-center font-bold text-white shadow">
              RD
            </div>
            <div>
              <p className="text-xs font-semibold text-white">Client Workstation</p>
              <p className="text-[10px] text-emerald-400">Remote Agent Active</p>
            </div>
          </div>

          <div className="space-y-1">
            <button
              onClick={() => openWindow('terminal')}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs hover:bg-slate-800 transition text-left"
            >
              <TerminalIcon className="w-4 h-4 text-emerald-400" />
              <span>PowerShell Terminal</span>
            </button>
            <button
              onClick={() => openWindow('explorer')}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs hover:bg-slate-800 transition text-left"
            >
              <Folder className="w-4 h-4 text-amber-400" />
              <span>مستكشف الملفات</span>
            </button>
            <button
              onClick={() => openWindow('notes')}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs hover:bg-slate-800 transition text-left"
            >
              <FileText className="w-4 h-4 text-blue-400" />
              <span>ملاحظات الدعم</span>
            </button>
            <button
              onClick={() => openWindow('settings')}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs hover:bg-slate-800 transition text-left"
            >
              <Settings className="w-4 h-4 text-indigo-400" />
              <span>إعدادات النظام</span>
            </button>
          </div>
        </div>
      )}

      {/* Taskbar */}
      <div className="relative z-30 h-11 bg-slate-950/90 backdrop-blur-md border-t border-slate-800/80 px-3 flex items-center justify-between">
        {/* Left Side: Start Button & Pinned Apps */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setStartMenuOpen(!startMenuOpen)}
            className={`p-2 rounded-lg transition-all ${
              startMenuOpen ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 text-sky-400'
            }`}
            title="Start Menu"
          >
            <Sparkles className="w-4 h-4" />
          </button>

          <div className="h-4 w-px bg-slate-800 mx-1" />

          <button
            onClick={() => openWindow('terminal')}
            className={`p-1.5 rounded-lg transition ${
              windows.terminal.isOpen ? 'bg-slate-800 text-emerald-400' : 'hover:bg-slate-800/60 text-slate-400'
            }`}
            title="Terminal"
          >
            <TerminalIcon className="w-4 h-4" />
          </button>

          <button
            onClick={() => openWindow('explorer')}
            className={`p-1.5 rounded-lg transition ${
              windows.explorer.isOpen ? 'bg-slate-800 text-amber-400' : 'hover:bg-slate-800/60 text-slate-400'
            }`}
            title="File Explorer"
          >
            <Folder className="w-4 h-4" />
          </button>

          <button
            onClick={() => openWindow('notes')}
            className={`p-1.5 rounded-lg transition ${
              windows.notes.isOpen ? 'bg-slate-800 text-blue-400' : 'hover:bg-slate-800/60 text-slate-400'
            }`}
            title="Notepad"
          >
            <FileText className="w-4 h-4" />
          </button>
        </div>

        {/* Center: Search pill */}
        <div className="hidden sm:flex items-center gap-2 bg-slate-900/80 px-3 py-1 rounded-full border border-slate-800 text-slate-400 text-xs">
          <Search className="w-3 h-3" />
          <span>بحث في ملفات وبرامج الجهاز...</span>
        </div>

        {/* Right Side: System Tray */}
        <div className="flex items-center gap-3 text-xs text-slate-300">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Wifi className="w-3.5 h-3.5 text-emerald-400" />
            <Volume2 className="w-3.5 h-3.5" />
          </div>
          <div className="h-4 w-px bg-slate-800" />
          <div className="text-right leading-none">
            <p className="font-mono text-[11px] text-slate-200">{currentTime || '12:00:00'}</p>
            <p className="text-[9px] text-slate-400">{currentDate || '2026'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
