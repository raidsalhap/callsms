import React, { useState, useEffect, useRef } from 'react';
import {
  Shield,
  Monitor,
  Key,
  Copy,
  Check,
  RefreshCw,
  Power,
  Lock,
  Unlock,
  Radio,
  Sliders,
  AlertTriangle,
  Play,
  Square,
  FileText,
  Terminal,
  Activity,
  UserCheck,
  Eye,
  MousePointer,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';
import { ClientPermissions, DeviceInfo, RemoteEventMessage } from '../types/remote';
import { signalingBus } from '../services/signaling';
import { SimulatedDesktop } from './SimulatedDesktop';

interface ClientViewProps {
  onSessionStateChange?: (active: boolean) => void;
}

export const ClientView: React.FC<ClientViewProps> = ({ onSessionStateChange }) => {
  const [deviceId] = useState('849-203-118');
  const [pin, setPin] = useState('749210');
  const [copiedId, setCopiedId] = useState(false);
  const [copiedPin, setCopiedPin] = useState(false);

  // Connection State
  const [sessionStatus, setSessionStatus] = useState<'idle' | 'requesting' | 'connected'>('idle');
  const [sessionTimer, setSessionTimer] = useState(0);

  // Screen Stream Mode
  const [streamMode, setStreamMode] = useState<'simulated' | 'real_screen'>('simulated');
  const [realMediaStream, setRealMediaStream] = useState<MediaStream | null>(null);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);

  // Client Permissions granted to Admin
  const [permissions, setPermissions] = useState<ClientPermissions>({
    allowControl: true,
    allowClipboard: true,
    allowFileTransfer: true,
    allowTerminal: true,
    allowAudio: false,
  });

  // Remote cursor simulated on this client
  const [remoteCursor, setRemoteCursor] = useState<{ x: number; y: number } | null>(null);
  const [lastActivity, setLastActivity] = useState<string>('الجهاز جاهز بانتظار اتصال المسؤول');

  // Logs for this client
  const [activityLogs, setActivityLogs] = useState<Array<{ time: string; text: string; type: string }>>([
    { time: '13:20:00', text: 'تم بدء تشغيل خدمة العميل RemoteDesk Client Daemon بنجاح', type: 'system' },
    { time: '13:20:02', text: 'تم إنشاء المعرف الثابت 849-203-118 وتوليد رمز أمان مؤقت', type: 'system' },
  ]);

  // Handle incoming signaling messages
  useEffect(() => {
    const unsubscribe = signalingBus.subscribe((msg: RemoteEventMessage) => {
      if (msg.sender === 'client') return; // ignore own messages

      if (msg.type === 'CONNECT_REQUEST') {
        setSessionStatus('requesting');
        addLog('طلب اتصال وارد من وحدة المسؤول (Admin Console)', 'connect');
      } else if (msg.type === 'DISCONNECT') {
        handleEndSession(false);
        addLog('تم إنهاء الجلسة من قبل المسؤول', 'disconnect');
      } else if (msg.type === 'MOUSE_MOVE' && permissions.allowControl) {
        if (msg.payload) {
          setRemoteCursor({ x: msg.payload.x, y: msg.payload.y });
          setLastActivity(`تحريك الفأرة من قِبل المسؤول (${Math.round(msg.payload.x)}%, ${Math.round(msg.payload.y)}%)`);
        }
      } else if (msg.type === 'KEY_INPUT' && permissions.allowControl) {
        setLastActivity(`تم استقبال إدخال لوحة مفاتيح: ${msg.payload?.key || 'مفتاح'}`);
        addLog(`إدخال لوحة مفاتيح من المسؤول: "${msg.payload?.key || ''}"`, 'input');
      } else if (msg.type === 'TERMINAL_COMMAND') {
        addLog(`تنفيذ أمر طرفي بواسطة المسؤول: "${msg.payload?.cmd}"`, 'terminal');
      }
    });

    return () => {
      unsubscribe();
    };
  }, [permissions]);

  // Session duration timer
  useEffect(() => {
    let interval: any = null;
    if (sessionStatus === 'connected') {
      interval = setInterval(() => {
        setSessionTimer((prev) => prev + 1);
      }, 1000);
      onSessionStateChange?.(true);
    } else {
      setSessionTimer(0);
      onSessionStateChange?.(false);
    }
    return () => clearInterval(interval);
  }, [sessionStatus]);

  const addLog = (text: string, type = 'info') => {
    const time = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setActivityLogs((prev) => [{ time, text, type }, ...prev.slice(0, 30)]);
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(deviceId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleCopyPin = () => {
    navigator.clipboard.writeText(pin);
    setCopiedPin(true);
    setTimeout(() => setCopiedPin(false), 2000);
  };

  const handleGenerateNewPin = () => {
    const newPin = Math.floor(100000 + Math.random() * 900000).toString();
    setPin(newPin);
    addLog(`تم تجديد رمز الأمان المؤقت إلى ${newPin}`, 'security');
  };

  const handleAcceptConnection = () => {
    setSessionStatus('connected');
    signalingBus.emit({
      type: 'CONNECT_ACCEPT',
      sender: 'client',
      payload: {
        deviceId,
        permissions,
        streamMode,
      },
    });
    addLog('تم قبول طلب الاتصال وبدء بث الشاشة والصلاحيات', 'connect');
  };

  const handleRejectConnection = () => {
    setSessionStatus('idle');
    signalingBus.emit({
      type: 'CONNECT_REJECT',
      sender: 'client',
      payload: { reason: 'تم رفض الاتصال بواسطة المستخدم' },
    });
    addLog('تم رفض طلب اتصال المسؤول', 'security');
  };

  const handleEndSession = (notifyBus = true) => {
    setSessionStatus('idle');
    setRemoteCursor(null);
    if (notifyBus) {
      signalingBus.emit({
        type: 'DISCONNECT',
        sender: 'client',
        payload: { reason: 'تم قطع الاتصال من جهة العميل' },
      });
      addLog('تم إنهاء الجلسة فورياً بواسطة زر الطوارئ للعميل', 'disconnect');
    }
  };

  const togglePermission = (key: keyof ClientPermissions) => {
    const updated = { ...permissions, [key]: !permissions[key] };
    setPermissions(updated);
    signalingBus.emit({
      type: 'PERMISSIONS_UPDATE',
      sender: 'client',
      payload: updated,
    });
    addLog(`تحديث الصلاحيات: ${key} = ${updated[key]}`, 'security');
  };

  // Real Display Capture via getDisplayMedia
  const startRealScreenCapture = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false,
        });
        setRealMediaStream(stream);
        setStreamMode('real_screen');
        if (videoPreviewRef.current) {
          videoPreviewRef.current.srcObject = stream;
        }
        addLog('تم تفعيل بث الشاشة الحقيقية عبر WebRTC DisplayMedia بنجاح', 'system');

        // Handle user stopping share via browser bar
        stream.getVideoTracks()[0].onended = () => {
          setRealMediaStream(null);
          setStreamMode('simulated');
          addLog('تم إيقاف مشاركة الشاشة الحقيقية والعودة لسطح المكتب الافتراضي', 'system');
        };
      }
    } catch (err: any) {
      console.warn('Real screen capture error/cancelled:', err);
      addLog('تم إلغاء أو تعذر التقاط الشاشة الحقيقية، الاعتماد على سطح المكتب الافتراضي', 'info');
      setStreamMode('simulated');
    }
  };

  const stopRealScreenCapture = () => {
    if (realMediaStream) {
      realMediaStream.getTracks().forEach((track) => track.stop());
      setRealMediaStream(null);
    }
    setStreamMode('simulated');
    addLog('تم إيقاف التقاط الشاشة الحقيقية والتحويل للوضع الافتراضي', 'system');
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60)
      .toString()
      .padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Client Status */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0 shadow-inner">
              <Monitor className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white">تطبيق العميل (Remote Host Agent)</h2>
                <span className="bg-emerald-500/20 text-emerald-400 text-xs px-2.5 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  متصل وجاهز للاستقبال
                </span>
              </div>
              <p className="text-slate-400 text-sm mt-1">
                هذه الشاشة تمثل الجهاز المطلوب الدخول عليه. قم بمشاركة المعرف (ID) ورمز الأمان مع المسؤول للسماح له بالدخول والتحكم.
              </p>
            </div>
          </div>

          {/* Quick ID & PIN Cards */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 flex items-center gap-3">
              <div>
                <span className="text-[10px] text-slate-400 block font-medium">معرف هذا الجهاز (Your ID)</span>
                <span className="text-lg font-mono font-bold text-sky-400 tracking-wider">{deviceId}</span>
              </div>
              <button
                onClick={handleCopyId}
                className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition"
                title="نسخ المعرف"
              >
                {copiedId ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 flex items-center gap-3">
              <div>
                <span className="text-[10px] text-slate-400 block font-medium">رمز الأمان المؤقت (PIN)</span>
                <span className="text-lg font-mono font-bold text-amber-400 tracking-wider">{pin}</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={handleCopyPin}
                  className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition"
                  title="نسخ الرمز"
                >
                  {copiedPin ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
                <button
                  onClick={handleGenerateNewPin}
                  className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition"
                  title="توليد رمز جديد"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Incoming Connection Request Modal / Alert */}
        {sessionStatus === 'requesting' && (
          <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-amber-950/80 to-slate-900 border-2 border-amber-500/80 animate-pulse shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
                <Shield className="w-6 h-6 animate-bounce" />
              </div>
              <div>
                <h4 className="text-white font-bold text-base flex items-center gap-2">
                  طلب تحكم عن بعد وارد! (Incoming Connection Request)
                </h4>
                <p className="text-sm text-amber-200/90 mt-0.5">
                  يطلب مسؤول النظام (Admin Operator) الدخول إلى شاشتك والتحكم بها. هل توافق على منح الصلاحية؟
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <button
                onClick={handleAcceptConnection}
                className="flex-1 md:flex-none px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                قبول وبدء الجلسة
              </button>
              <button
                onClick={handleRejectConnection}
                className="flex-1 md:flex-none px-4 py-2.5 bg-red-900/60 hover:bg-red-800 text-red-200 border border-red-700/50 font-medium rounded-xl transition cursor-pointer"
              >
                رفض الاتصال
              </button>
            </div>
          </div>
        )}

        {/* Active Session Warning Bar */}
        {sessionStatus === 'connected' && (
          <div className="mt-6 p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/50 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <Radio className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h4 className="text-white font-bold text-sm flex items-center gap-2">
                  الجلسة نشطة حالياً: شاشتك مرئية للمسؤول
                  <span className="text-emerald-400 font-mono text-xs bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-700/50">
                    مدة الجلسة: {formatTimer(sessionTimer)}
                  </span>
                </h4>
                <p className="text-xs text-slate-300 mt-0.5">
                  آخر نشاط: <span className="text-amber-300 font-mono">{lastActivity}</span>
                </p>
              </div>
            </div>

            <button
              onClick={() => handleEndSession(true)}
              className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl shadow transition flex items-center gap-2 cursor-pointer shrink-0"
            >
              <Power className="w-4 h-4" />
              قطع الاتصال فوراً (طوارئ)
            </button>
          </div>
        )}
      </div>

      {/* Main Grid: Screen Viewport on Left, Control & Security Settings on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Device Screen Viewport (Simulated Desktop or Real Screen) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
            <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Monitor className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-white text-sm">شاشة جهاز العميل المعروضة للمسؤول</h3>
              </div>

              {/* Stream Mode Switcher */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    stopRealScreenCapture();
                    setStreamMode('simulated');
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
                    streamMode === 'simulated'
                      ? 'bg-indigo-600 text-white shadow'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" />
                  سطح مكتب افتراضي تفاعلي
                </button>

                <button
                  onClick={startRealScreenCapture}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
                    streamMode === 'real_screen'
                      ? 'bg-emerald-600 text-white shadow'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
                  }`}
                  title="مشاركة شاشة جهازك الفعلية عبر WebRTC Display Capture"
                >
                  <Eye className="w-3.5 h-3.5" />
                  بث شاشتي الفعلية (Real Capture)
                </button>
              </div>
            </div>

            {/* Display Canvas Container */}
            <div className="relative rounded-xl overflow-hidden min-h-[480px] bg-slate-950 flex flex-col justify-center items-center">
              {streamMode === 'real_screen' ? (
                <div className="relative w-full h-full min-h-[480px] flex flex-col items-center justify-center bg-black">
                  <video
                    ref={videoPreviewRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full max-h-[540px] object-contain rounded-lg"
                  />
                  <div className="absolute bottom-3 left-3 bg-slate-900/90 backdrop-blur px-3 py-1.5 rounded-lg border border-slate-700 text-xs text-emerald-400 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    بث حي مباشر من شاشتك الفعلية عبر WebRTC getDisplayMedia
                  </div>
                </div>
              ) : (
                <SimulatedDesktop
                  remoteCursor={remoteCursor}
                  isControlling={sessionStatus === 'connected' && permissions.allowControl}
                  onAction={(action, payload) => {
                    addLog(`إجراء محلي على سطح المكتب: ${action}`, 'input');
                  }}
                />
              )}
            </div>
          </div>
        </div>

        {/* Right: Permissions & Security Audit Logs */}
        <div className="lg:col-span-4 space-y-6">
          {/* Permission Controls */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-white text-sm">صلاحيات التحكم الممنوحة</h3>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">Client RBAC</span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              يمكن لمستخدم هذا الجهاز (العميل) تقييد أو سحب أي صلاحية في أي لحظة لحماية خصوصيته:
            </p>

            <div className="space-y-2.5">
              {/* Permission Item: Control */}
              <div
                onClick={() => togglePermission('allowControl')}
                className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                  permissions.allowControl
                    ? 'bg-indigo-950/40 border-indigo-500/40 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      permissions.allowControl ? 'bg-indigo-600/30 text-indigo-400' : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    <MousePointer className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold">التحكم بالفأرة ولوحة المفاتيح</p>
                    <p className="text-[10px] text-slate-400">السماح للمسؤول بالنقرات والكتابة</p>
                  </div>
                </div>
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                    permissions.allowControl ? 'bg-indigo-600 border-indigo-400 text-white' : 'border-slate-700'
                  }`}
                >
                  {permissions.allowControl && <Check className="w-3 h-3" />}
                </div>
              </div>

              {/* Permission Item: Clipboard */}
              <div
                onClick={() => togglePermission('allowClipboard')}
                className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                  permissions.allowClipboard
                    ? 'bg-indigo-950/40 border-indigo-500/40 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      permissions.allowClipboard ? 'bg-indigo-600/30 text-indigo-400' : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    <Copy className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold">مزامنة الحافظة (Clipboard)</p>
                    <p className="text-[10px] text-slate-400">نسخ ولصق النصوص بين الجهازين</p>
                  </div>
                </div>
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                    permissions.allowClipboard ? 'bg-indigo-600 border-indigo-400 text-white' : 'border-slate-700'
                  }`}
                >
                  {permissions.allowClipboard && <Check className="w-3 h-3" />}
                </div>
              </div>

              {/* Permission Item: File Transfer */}
              <div
                onClick={() => togglePermission('allowFileTransfer')}
                className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                  permissions.allowFileTransfer
                    ? 'bg-indigo-950/40 border-indigo-500/40 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      permissions.allowFileTransfer ? 'bg-indigo-600/30 text-indigo-400' : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold">نقل الملفات (File Transfer)</p>
                    <p className="text-[10px] text-slate-400">إرسال وتحميل الملفات</p>
                  </div>
                </div>
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                    permissions.allowFileTransfer ? 'bg-indigo-600 border-indigo-400 text-white' : 'border-slate-700'
                  }`}
                >
                  {permissions.allowFileTransfer && <Check className="w-3 h-3" />}
                </div>
              </div>

              {/* Permission Item: Terminal */}
              <div
                onClick={() => togglePermission('allowTerminal')}
                className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                  permissions.allowTerminal
                    ? 'bg-indigo-950/40 border-indigo-500/40 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      permissions.allowTerminal ? 'bg-indigo-600/30 text-indigo-400' : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    <Terminal className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold">تنفيذ أوامر Terminal / Shell</p>
                    <p className="text-[10px] text-slate-400">إدارة أوامر النظام عن بعد</p>
                  </div>
                </div>
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                    permissions.allowTerminal ? 'bg-indigo-600 border-indigo-400 text-white' : 'border-slate-700'
                  }`}
                >
                  {permissions.allowTerminal && <Check className="w-3 h-3" />}
                </div>
              </div>
            </div>
          </div>

          {/* Activity / Audit Logs */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-white text-sm">سجل الأمان والنشاط الحي</h3>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">Audit Trail</span>
            </div>

            <div className="max-h-56 overflow-y-auto space-y-2 pr-1 text-xs">
              {activityLogs.map((log, index) => (
                <div
                  key={index}
                  className="p-2 rounded-lg bg-slate-950/70 border border-slate-800/80 flex items-start gap-2 text-[11px]"
                >
                  <span className="font-mono text-slate-500 shrink-0">{log.time}</span>
                  <span
                    className={
                      log.type === 'connect'
                        ? 'text-emerald-400'
                        : log.type === 'security'
                        ? 'text-amber-400'
                        : log.type === 'disconnect'
                        ? 'text-red-400'
                        : 'text-slate-300'
                    }
                  >
                    {log.text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
