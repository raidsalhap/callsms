import React, { useState, useEffect, useRef } from 'react';
import {
  Monitor,
  Terminal,
  Folder,
  Sliders,
  Shield,
  Wifi,
  Activity,
  Maximize2,
  Minimize2,
  MousePointer,
  Keyboard,
  Key,
  Download,
  Upload,
  RefreshCw,
  Power,
  Play,
  Square,
  Lock,
  Search,
  CheckCircle2,
  AlertCircle,
  Copy,
  PenTool,
  Volume2,
  Share2,
  Layers,
  FileCode,
  Sparkles,
  Command,
  ArrowRight,
  HardDrive,
  Cpu,
} from 'lucide-react';
import { DeviceInfo, ClientPermissions, SessionMetrics, RemoteEventMessage } from '../types/remote';
import { signalingBus, INITIAL_DEVICES } from '../services/signaling';
import { SimulatedDesktop } from './SimulatedDesktop';

interface AdminViewProps {
  onSessionStateChange?: (active: boolean) => void;
}

export const AdminView: React.FC<AdminViewProps> = ({ onSessionStateChange }) => {
  // Device selection & connection form
  const [targetId, setTargetId] = useState('849-203-118');
  const [targetPin, setTargetPin] = useState('749210');
  const [deviceList, setDeviceList] = useState<DeviceInfo[]>(INITIAL_DEVICES);
  const [searchQuery, setSearchQuery] = useState('');

  // Session State
  const [connectionStatus, setConnectionStatus] = useState<
    'disconnected' | 'connecting' | 'connected' | 'rejected'
  >('disconnected');
  const [activeDevice, setActiveDevice] = useState<DeviceInfo | null>(null);
  const [sessionDuration, setSessionDuration] = useState(0);

  // Control Tools & Drawers
  const [isControlEnabled, setIsControlEnabled] = useState(true);
  const [activeTool, setActiveTool] = useState<'screen' | 'terminal' | 'files' | 'metrics'>('screen');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLaserPointer, setIsLaserPointer] = useState(false);

  // Live Metrics
  const [metrics, setMetrics] = useState<SessionMetrics>({
    fps: 60,
    latencyMs: 14,
    bitrateKbps: 3450,
    packetLoss: 0.02,
    codec: 'WebRTC (H.264 / Opus)',
    durationSeconds: 0,
  });

  // Remote Terminal State
  const [terminalHistory, setTerminalHistory] = useState<Array<{ cmd: string; res: string; time: string }>>([
    { cmd: 'hostname', res: 'CLIENT-WORKSTATION-01', time: '13:21:05' },
    { cmd: 'systeminfo | findstr /B /C:"OS Name"', res: 'OS Name: Microsoft Windows 11 Pro', time: '13:21:08' },
  ]);
  const [terminalInput, setTerminalInput] = useState('');

  // Remote Files State
  const [remoteFiles, setRemoteFiles] = useState([
    { name: 'backup_database_2026.sql', size: '142 MB', type: 'archive', date: '2026-09-27' },
    { name: 'nginx.conf', size: '3.4 KB', type: 'code', date: '2026-09-25' },
    { name: 'error_log.txt', size: '820 KB', type: 'file', date: '2026-09-28' },
    { name: 'certificate_ssl.pem', size: '1.8 KB', type: 'code', date: '2026-09-10' },
  ]);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  // Screen viewport reference for calculating normalized cursor coordinates (0-100%)
  const viewportRef = useRef<HTMLDivElement>(null);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number }>({ x: 50, y: 50 });

  // Listen to signaling messages from client
  useEffect(() => {
    const unsubscribe = signalingBus.subscribe((msg: RemoteEventMessage) => {
      if (msg.sender === 'admin') return;

      if (msg.type === 'CONNECT_ACCEPT') {
        setConnectionStatus('connected');
        onSessionStateChange?.(true);
      } else if (msg.type === 'CONNECT_REJECT') {
        setConnectionStatus('rejected');
        onSessionStateChange?.(false);
      } else if (msg.type === 'DISCONNECT') {
        handleDisconnect(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Timer & Metrics simulation
  useEffect(() => {
    let interval: any = null;
    if (connectionStatus === 'connected') {
      interval = setInterval(() => {
        setSessionDuration((prev) => prev + 1);
        // Realistic subtle fluctuations in latency & fps
        setMetrics((prev) => ({
          ...prev,
          fps: Math.floor(58 + Math.random() * 4),
          latencyMs: Math.floor(12 + Math.random() * 6),
          bitrateKbps: Math.floor(3200 + Math.random() * 500),
          durationSeconds: prev.durationSeconds + 1,
        }));
      }, 1000);
    } else {
      setSessionDuration(0);
    }
    return () => clearInterval(interval);
  }, [connectionStatus]);

  const handleConnect = (device?: DeviceInfo) => {
    const target = device || deviceList.find((d) => d.id === targetId) || {
      id: targetId,
      name: `جهاز مخصص (${targetId})`,
      ip: '192.168.1.50',
      os: 'windows',
      osVersion: 'Windows 11',
      status: 'online',
      lastSeen: 'الآن',
      resolution: '1920x1080',
      cpuUsage: 22,
      ramUsage: 48,
      unattendedAccess: false,
      pin: targetPin,
    };

    setActiveDevice(target);
    setConnectionStatus('connecting');

    // Send connection request to Client
    signalingBus.emit({
      type: 'CONNECT_REQUEST',
      sender: 'admin',
      payload: {
        targetId: target.id,
        pin: targetPin,
        adminName: 'Admin Operator (Master)',
      },
    });
  };

  const handleDisconnect = (notify = true) => {
    setConnectionStatus('disconnected');
    onSessionStateChange?.(false);
    if (notify) {
      signalingBus.emit({
        type: 'DISCONNECT',
        sender: 'admin',
        payload: { reason: 'تم إنهاء الجلسة من قبل المسؤول' },
      });
    }
  };

  // Mouse move handler on remote screen
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!viewportRef.current || !isControlEnabled || connectionStatus !== 'connected') return;

    const rect = viewportRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));

    setCursorPos({ x, y });

    // Send to signaling bus
    signalingBus.emit({
      type: 'MOUSE_MOVE',
      sender: 'admin',
      payload: { x, y, isLaser: isLaserPointer },
    });
  };

  const handleMouseClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isControlEnabled || connectionStatus !== 'connected') return;
    signalingBus.emit({
      type: 'MOUSE_CLICK',
      sender: 'admin',
      payload: { x: cursorPos.x, y: cursorPos.y, button: e.button },
    });
  };

  const sendKeyShortcut = (keyName: string) => {
    signalingBus.emit({
      type: 'KEY_INPUT',
      sender: 'admin',
      payload: { key: keyName, isShortcut: true },
    });
  };

  const handleTerminalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!terminalInput.trim()) return;

    const cmd = terminalInput.trim();
    const time = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    let res = '';
    if (cmd.toLowerCase() === 'ipconfig' || cmd.toLowerCase() === 'ifconfig') {
      res = 'Ethernet adapter Local: IPv4 192.168.1.45 Mask 255.255.255.0 Gateway 192.168.1.1';
    } else if (cmd.toLowerCase() === 'systeminfo') {
      res = 'Host Name: CLIENT-WORKSTATION | OS: Microsoft Windows 11 Pro 64-bit | RAM: 16,384 MB';
    } else if (cmd.toLowerCase() === 'dir' || cmd.toLowerCase() === 'ls') {
      res = '09/28/2026  12:30 PM    <DIR>          AppData\n09/28/2026  01:10 PM    <DIR>          Desktop\n09/28/2026  09:15 AM        14,248,192 RemoteDeskAgent.exe';
    } else if (cmd.toLowerCase().startsWith('ping')) {
      res = 'Reply from 8.8.8.8: bytes=32 time=9ms TTL=117 (0% loss)';
    } else {
      res = `Remote command "${cmd}" executed successfully on host (Exit code: 0)`;
    }

    setTerminalHistory((prev) => [...prev, { cmd, res, time }]);
    setTerminalInput('');

    signalingBus.emit({
      type: 'TERMINAL_COMMAND',
      sender: 'admin',
      payload: { cmd },
    });
  };

  const simulateFileUpload = () => {
    setUploadProgress(10);
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev === null) return null;
        if (prev >= 100) {
          clearInterval(interval);
          setRemoteFiles((files) => [
            {
              name: 'Support_Diagnostic_Tool.zip',
              size: '18.4 MB',
              type: 'archive',
              date: 'اليوم (الآن)',
            },
            ...files,
          ]);
          setTimeout(() => setUploadProgress(null), 1000);
          return 100;
        }
        return prev + 25;
      });
    }, 400);
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60)
      .toString()
      .padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const filteredDevices = deviceList.filter(
    (d) => d.name.toLowerCase().includes(searchQuery.toLowerCase()) || d.id.includes(searchQuery)
  );

  return (
    <div className="space-y-6">
      {/* Top Bar: Connection Quick Bar & Stats */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Quick Connect Inputs */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400 font-medium">معرف الهدف (ID):</span>
              <input
                type="text"
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                placeholder="مثال: 849-203-118"
                className="bg-transparent border-none outline-none font-mono text-sm text-sky-400 w-32 placeholder:text-slate-600"
              />
            </div>

            <div className="flex items-center gap-2 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400 font-medium">رمز الأمان (PIN):</span>
              <input
                type="password"
                value={targetPin}
                onChange={(e) => setTargetPin(e.target.value)}
                placeholder="6 أرقام"
                className="bg-transparent border-none outline-none font-mono text-sm text-amber-400 w-24 placeholder:text-slate-600"
              />
            </div>

            {connectionStatus === 'connected' ? (
              <button
                onClick={() => handleDisconnect(true)}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl shadow-lg transition flex items-center gap-2 cursor-pointer"
              >
                <Power className="w-4 h-4" />
                إنهاء الجلسة
              </button>
            ) : (
              <button
                onClick={() => handleConnect()}
                disabled={connectionStatus === 'connecting'}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-900 text-white text-xs font-bold rounded-xl shadow-lg transition flex items-center gap-2 cursor-pointer"
              >
                {connectionStatus === 'connecting' ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    جاري طلب الاتصال...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    بدء التحكم عن بعد
                  </>
                )}
              </button>
            )}
          </div>

          {/* Active Session Info Pill */}
          {connectionStatus === 'connected' && activeDevice && (
            <div className="flex items-center gap-4 bg-slate-950/80 px-4 py-2 rounded-xl border border-emerald-500/30">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-bold text-white">{activeDevice.name}</span>
              </div>
              <div className="text-xs text-slate-400 flex items-center gap-3">
                <span className="font-mono text-emerald-400">{formatTimer(sessionDuration)}</span>
                <span>•</span>
                <span className="font-mono text-sky-400">{metrics.latencyMs} ms</span>
                <span>•</span>
                <span className="font-mono text-amber-400">{metrics.fps} FPS</span>
              </div>
            </div>
          )}

          {connectionStatus === 'rejected' && (
            <div className="text-xs text-red-400 bg-red-950/40 border border-red-800 px-3 py-1.5 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              تم رفض طلب الاتصال بواسطة جهاز العميل.
            </div>
          )}
        </div>
      </div>

      {/* Main View Area: When Connected vs Device Fleet Directory */}
      {connectionStatus === 'connected' ? (
        <div className="space-y-4">
          {/* Remote Session Control Bar */}
          <div className="bg-slate-900/90 backdrop-blur border border-slate-800 rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-lg">
            {/* View Mode Tabs */}
            <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800">
              <button
                onClick={() => setActiveTool('screen')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
                  activeTool === 'screen' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                شاشة التحكم المباشر
              </button>

              <button
                onClick={() => setActiveTool('terminal')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
                  activeTool === 'terminal' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Terminal className="w-3.5 h-3.5" />
                الطرفية عن بعد (SSH/Shell)
              </button>

              <button
                onClick={() => setActiveTool('files')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
                  activeTool === 'files' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Folder className="w-3.5 h-3.5" />
                نقل الملفات (File Manager)
              </button>

              <button
                onClick={() => setActiveTool('metrics')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
                  activeTool === 'metrics' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                مؤشرات الاتصال والأداء
              </button>
            </div>

            {/* Quick Action System Keys (Injected to Remote Host) */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400 hidden xl:inline">أوامر سريعة:</span>
              <button
                onClick={() => sendKeyShortcut('Ctrl+Alt+Del')}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded text-xs font-mono transition"
                title="إرسال اختصار الأمان إلى شاشة القفل"
              >
                Ctrl+Alt+Del
              </button>

              <button
                onClick={() => sendKeyShortcut('Alt+Tab')}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded text-xs font-mono transition"
                title="التبديل بين النوافذ"
              >
                Alt+Tab
              </button>

              <button
                onClick={() => sendKeyShortcut('Win+L')}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded text-xs font-mono transition"
                title="قفل شاشة جهاز العميل"
              >
                Lock (Win+L)
              </button>

              <div className="h-4 w-px bg-slate-800 mx-1" />

              {/* Toggle Control / View Only */}
              <button
                onClick={() => setIsControlEnabled(!isControlEnabled)}
                className={`px-2.5 py-1 rounded text-xs font-medium transition flex items-center gap-1.5 cursor-pointer ${
                  isControlEnabled
                    ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40'
                    : 'bg-amber-600/30 text-amber-300 border border-amber-500/40'
                }`}
                title={isControlEnabled ? 'التحكم بالفأرة والكتابة مفعّل' : 'وضع المشاهدة فقط (View Only)'}
              >
                <MousePointer className="w-3.5 h-3.5" />
                {isControlEnabled ? 'تحكم كامل' : 'مشاهدة فقط'}
              </button>

              {/* Laser Pointer */}
              <button
                onClick={() => setIsLaserPointer(!isLaserPointer)}
                className={`p-1.5 rounded transition ${
                  isLaserPointer ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
                title="مؤشر ليزري توجيهي (Laser Pointer)"
              >
                <PenTool className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Tab 1: Live Interactive Screen Viewport */}
          {activeTool === 'screen' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-2xl relative overflow-hidden">
              <div
                ref={viewportRef}
                onMouseMove={handleMouseMove}
                onClick={handleMouseClick}
                className="relative rounded-xl overflow-hidden cursor-crosshair border border-slate-800/80 shadow-inner min-h-[520px]"
              >
                <SimulatedDesktop
                  remoteCursor={null} // local admin already has real cursor
                  isControlling={isControlEnabled}
                  onAction={(name, data) => {
                    console.log('Action performed on remote:', name, data);
                  }}
                />

                {/* Laser Pointer Overlay */}
                {isLaserPointer && (
                  <div
                    className="absolute pointer-events-none w-6 h-6 rounded-full bg-red-500/50 border-2 border-red-400 animate-ping -translate-x-1/2 -translate-y-1/2"
                    style={{ left: `${cursorPos.x}%`, top: `${cursorPos.y}%` }}
                  />
                )}
              </div>

              {/* Bottom Screen Status Footer */}
              <div className="mt-3 flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    WebRTC PeerConnection مشفر بالكامل
                  </span>
                  <span>|</span>
                  <span>دقة البث: 1920x1080 @ 60 FPS</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>إحداثيات المؤشر: ({Math.round(cursorPos.x)}%, {Math.round(cursorPos.y)}%)</span>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Remote Terminal (PowerShell / SSH) */}
          {activeTool === 'terminal' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2 text-emerald-400">
                  <Terminal className="w-5 h-5" />
                  <h3 className="font-bold text-white text-sm">
                    المحطة الطرفية عن بعد (Remote PowerShell / Shell Session)
                  </h3>
                </div>
                <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">
                  host: 192.168.1.45 (Elevated Admin)
                </span>
              </div>

              <div className="bg-slate-950 rounded-xl p-4 font-mono text-xs text-slate-300 min-h-[360px] max-h-[460px] overflow-y-auto space-y-3 border border-slate-800">
                <div className="text-emerald-400/80 pb-2 border-b border-slate-900">
                  Remote Management Shell v3.1.2 - Connected via Secure DataChannel
                  <br />أوامر مقترحة للتجربة: dir, ipconfig, systeminfo, ping 8.8.8.8, whoami
                </div>

                {terminalHistory.map((item, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center gap-2 text-sky-400">
                      <span className="text-slate-600 text-[10px]">{item.time}</span>
                      <span>PS C:\RemoteDesk&gt;</span>
                      <span className="text-white font-semibold">{item.cmd}</span>
                    </div>
                    <pre className="text-slate-300 pl-4 whitespace-pre-wrap font-sans text-xs bg-slate-900/40 p-2 rounded border border-slate-800/40">
                      {item.res}
                    </pre>
                  </div>
                ))}
              </div>

              <form onSubmit={handleTerminalSubmit} className="flex items-center gap-2">
                <div className="flex-1 flex items-center gap-2 bg-slate-950 px-4 py-2.5 rounded-xl border border-slate-800">
                  <span className="text-sky-400 font-mono text-xs">PS&gt;</span>
                  <input
                    type="text"
                    value={terminalInput}
                    onChange={(e) => setTerminalInput(e.target.value)}
                    placeholder="اكتب أمراً لتنفيذه مباشرة على جهاز العميل..."
                    className="flex-1 bg-transparent border-none outline-none font-mono text-xs text-white placeholder:text-slate-600"
                  />
                </div>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  تنفيذ الأمر
                </button>
              </form>
            </div>
          )}

          {/* Tab 3: Remote File Transfer */}
          {activeTool === 'files' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2 text-amber-400">
                  <Folder className="w-5 h-5" />
                  <h3 className="font-bold text-white text-sm">
                    إدارة ونقل الملفات عن بعد (Remote File System Transfer)
                  </h3>
                </div>
                <button
                  onClick={simulateFileUpload}
                  className="px-3.5 py-1.5 bg-amber-600/30 hover:bg-amber-600/40 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  رفع ملف إلى جهاز العميل
                </button>
              </div>

              {uploadProgress !== null && (
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                  <div className="flex justify-between text-xs text-slate-300">
                    <span>جاري رفع ملف Support_Diagnostic_Tool.zip...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-amber-500 h-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Remote Host Files List */}
                <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 space-y-3">
                  <h4 className="text-xs font-bold text-slate-300 flex items-center gap-2">
                    <HardDrive className="w-4 h-4 text-sky-400" />
                    دليل الملفات على جهاز الهدف (C:\RemoteDesk\Data)
                  </h4>
                  <div className="space-y-2">
                    {remoteFiles.map((f, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-800 text-xs transition"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <Folder className="w-4 h-4 text-amber-400 shrink-0" />
                          <span className="text-slate-200 truncate">{f.name}</span>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-[11px] text-slate-500">{f.size}</span>
                          <button
                            onClick={() => alert(`بدء تحميل الملف: ${f.name} إلى حاسوبك`)}
                            className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded"
                            title="تحميل إلى جهازي"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* File Transfer Details & Security Info */}
                <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 space-y-3 text-xs text-slate-400">
                  <h4 className="text-xs font-bold text-slate-300 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-emerald-400" />
                    ميزات أمان نقل الملفات
                  </h4>
                  <ul className="space-y-2 leading-relaxed">
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-400">✓</span>
                      <span>يتم تجزئة الملفات ونقلها عبر WebRTC DataChannels مشفرة بتقنية DTLS.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-400">✓</span>
                      <span>فحص أوتوماتيكي للتجزئة (SHA-256 Checksum) لضمان عدم تلف أو تعديل الملفات.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-400">✓</span>
                      <span>سجل تدقيق كامل يوضح كل ملف تم رفعه أو سحبه واسم المستخدم وتوقيت العملية.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Tab 4: Performance & Network Metrics */}
          {activeTool === 'metrics' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2 text-indigo-400">
                  <Activity className="w-5 h-5" />
                  <h3 className="font-bold text-white text-sm">مؤشرات الأداء وجودة البث الحي (WebRTC Stats)</h3>
                </div>
                <span className="text-xs text-slate-400 font-mono">Real-time Telemetry</span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center space-y-1">
                  <span className="text-xs text-slate-400">زمن التأخير (Latency / RTT)</span>
                  <p className="text-2xl font-bold font-mono text-emerald-400">{metrics.latencyMs} ms</p>
                  <span className="text-[10px] text-slate-500">ممتاز (استجابة فورية)</span>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center space-y-1">
                  <span className="text-xs text-slate-400">معدل الإطارات (FPS)</span>
                  <p className="text-2xl font-bold font-mono text-sky-400">{metrics.fps} FPS</p>
                  <span className="text-[10px] text-slate-500">سلاسة تامة 60Hz</span>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center space-y-1">
                  <span className="text-xs text-slate-400">استهلاك البيانات (Bitrate)</span>
                  <p className="text-2xl font-bold font-mono text-amber-400">
                    {(metrics.bitrateKbps / 1000).toFixed(1)} Mbps
                  </p>
                  <span className="text-[10px] text-slate-500">H.264 Hardware Encoded</span>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center space-y-1">
                  <span className="text-xs text-slate-400">فقدان الحزم (Packet Loss)</span>
                  <p className="text-2xl font-bold font-mono text-purple-400">{metrics.packetLoss}%</p>
                  <span className="text-[10px] text-slate-500">اتصال مستقر جداً</span>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Device Fleet Directory when not in an active session */
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-white">دليل الأجهزة المتصلة والمتاحة للإدارة</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                يمكنك الاتصال مباشرة بأي جهاز عبر النقر على زر "اتصال" أو عبر إدخال المعرف في الشريط العلوي.
              </p>
            </div>

            {/* Search Box */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="بحث باسم الجهاز أو المعرف..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pr-9 pl-4 py-2 text-xs text-white placeholder:text-slate-500 outline-none focus:border-indigo-500 transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredDevices.map((device) => (
              <div
                key={device.id}
                className="bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-5 shadow-xl transition-all flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                        device.status === 'online'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          device.status === 'online' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                        }`}
                      />
                      {device.status === 'online' ? 'متصل' : 'مشغول'}
                    </span>

                    <span className="text-[11px] font-mono text-slate-500 uppercase">{device.os}</span>
                  </div>

                  <div>
                    <h4 className="font-bold text-white text-sm group-hover:text-indigo-400 transition truncate">
                      {device.name}
                    </h4>
                    <p className="font-mono text-xs text-sky-400 mt-0.5">{device.id}</p>
                    <p className="text-[11px] text-slate-400 mt-1">{device.osVersion}</p>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-[11px] text-slate-400">
                    <div>
                      <span>CPU:</span>{' '}
                      <span className="text-slate-200 font-mono font-medium">{device.cpuUsage}%</span>
                    </div>
                    <div>
                      <span>RAM:</span>{' '}
                      <span className="text-slate-200 font-mono font-medium">{device.ramUsage}%</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setTargetId(device.id);
                    setTargetPin(device.pin);
                    handleConnect(device);
                  }}
                  className="w-full py-2 bg-indigo-600/30 hover:bg-indigo-600 text-indigo-200 hover:text-white border border-indigo-500/40 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow"
                >
                  <Monitor className="w-3.5 h-3.5" />
                  دخول وتحكم
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
