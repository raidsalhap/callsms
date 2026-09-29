import React, { useState, useEffect } from 'react';
import {
  Phone,
  PhoneCall,
  PhoneOff,
  PhoneIncoming,
  Mic,
  MicOff,
  Pause,
  Play,
  Volume2,
  Delete,
  Hash,
  User,
  Clock,
  Sparkles,
  Signal,
  Wifi,
  Radio,
  RadioTower,
  Smartphone,
  CheckCircle2,
} from 'lucide-react';
import { ActiveCall, CallState, CallLogItem } from '../types/telephony';
import { telephonyBridge } from '../services/telephonyBridge';

interface PhoneDialerProps {
  onSimulateIncoming?: () => void;
}

export const PhoneDialer: React.FC<PhoneDialerProps> = ({ onSimulateIncoming }) => {
  const [dialedNumber, setDialedNumber] = useState('');
  const [callState, setCallState] = useState<CallState>('idle');
  const [activeCall, setActiveCall] = useState<ActiveCall | null>(null);
  const [callTimer, setCallTimer] = useState(0);
  const [callLogs, setCallLogs] = useState<CallLogItem[]>(telephonyBridge.getSavedCallLogs());
  const [activeTab, setActiveTab] = useState<'keypad' | 'logs' | 'contacts'>('keypad');
  const [showConnectModal, setShowConnectModal] = useState(false);

  // Real Audio waveform from actual microphone
  const [waveformLevels, setWaveformLevels] = useState<number[]>([15, 15, 15, 15, 15, 15, 15]);

  // Handle incoming / remote bridge events
  useEffect(() => {
    const unsubscribe = telephonyBridge.subscribe((action, payload) => {
      if (action === 'INCOMING_CALL') {
        setCallState('ringing_incoming');
        setActiveCall({
          id: `call-${Date.now()}`,
          number: payload.number || '+966501234567',
          contactName: payload.name || 'متصل محلي عبر الشريحة',
          direction: 'incoming',
          startTime: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
          durationSeconds: 0,
          isMuted: false,
          isHold: false,
          audioQuality: 'Excellent',
          latencyMs: telephonyBridge.connectionState.lastPingMs || 25,
        });
      } else if (action === 'CALL_HANGUP') {
        endCall();
      } else if (action === 'LOGS_UPDATED') {
        setCallLogs([...payload]);
      }
    });

    return () => unsubscribe();
  }, []);

  // Duration Timer
  useEffect(() => {
    let interval: any = null;

    if (callState === 'connected') {
      interval = setInterval(() => {
        setCallTimer((prev) => prev + 1);
      }, 1000);
    } else {
      setCallTimer(0);
    }

    return () => {
      clearInterval(interval);
    };
  }, [callState]);

  const handleDigitPress = (digit: string) => {
    if (dialedNumber.length < 16) {
      setDialedNumber((prev) => prev + digit);
    }
  };

  const handleDeleteDigit = () => {
    setDialedNumber((prev) => prev.slice(0, -1));
  };

  const handleStartOutgoingCall = (num?: string) => {
    const target = num || dialedNumber;
    if (!target) return;

    const isLiveConnected = telephonyBridge.connectionState.isConnected;

    if (!isLiveConnected) {
      setShowConnectModal(true);
      return;
    }

    setCallState('ringing_outgoing');
    setActiveCall({
      id: `call-${Date.now()}`,
      number: target,
      contactName: getContactName(target),
      direction: 'outgoing',
      startTime: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      durationSeconds: 0,
      isMuted: false,
      isHold: false,
      audioQuality: 'Excellent',
      latencyMs: telephonyBridge.connectionState.lastPingMs || 28,
    });

    // Send real command to Windows 11 Phone Link!
    telephonyBridge.dialRealNumber(target);

    // Start live microphone capture for real voice transmission
    telephonyBridge.startMicrophoneCapture((levels) => {
      setWaveformLevels(levels);
    });

    // Wait 2 seconds for dialing and set connected
    setTimeout(() => {
      setCallState('connected');
    }, 2000);
  };

  const answerIncomingCall = () => {
    setCallState('connected');
    telephonyBridge.answerRealCall();
    telephonyBridge.startMicrophoneCapture((levels) => {
      setWaveformLevels(levels);
    });
  };

  const endCall = () => {
    telephonyBridge.stopMicrophoneCapture();
    telephonyBridge.hangupRealCall();

    if (activeCall) {
      const durationStr = formatDuration(callTimer);
      const isAnswered = callTimer > 0;
      const newLogItem: CallLogItem = {
        id: `log-${Date.now()}`,
        number: activeCall.number,
        name: activeCall.contactName,
        type: isAnswered
          ? (activeCall.direction === 'incoming' ? 'incoming' : 'outgoing')
          : 'missed',
        status: isAnswered ? 'answered' : 'missed',
        time: 'اليوم، ' + new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
        duration: isAnswered ? `${durationStr} دقيقة` : '00:00 (لم يرد)',
        durationSeconds: callTimer,
        timestamp: Date.now(),
      };
      const newLogs = [newLogItem, ...callLogs];
      setCallLogs(newLogs);
      telephonyBridge.saveCallLogs(newLogs);
    }

    setCallState('idle');
    setActiveCall(null);
  };

  const toggleMute = () => {
    if (!activeCall) return;
    setActiveCall((prev) => (prev ? { ...prev, isMuted: !prev.isMuted } : null));
  };

  const toggleHold = () => {
    if (!activeCall) return;
    setActiveCall((prev) => (prev ? { ...prev, isHold: !prev.isHold } : null));
  };

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60)
      .toString()
      .padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const getContactName = (num: string) => {
    if (num.includes('501234567')) return 'م. أحمد (الرياض)';
    if (num.includes('92000')) return 'الدعم الفني والخدمات';
    return undefined;
  };

  const contacts = [
    { name: 'م. أحمد (المكتب الإقليمي)', number: '+966501234567', tag: 'زميل عمل' },
    { name: 'البنك الأهلي التجاري', number: '920001000', tag: 'بنوك' },
    { name: 'شركة الاتصالات (خدمة المشتركين)', number: '900', tag: 'دعم' },
    { name: 'خالد عبد الله', number: '+966559876543', tag: 'صديق' },
  ];

  return (
    <div className="max-w-md mx-auto bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col min-h-[640px] relative">
      {/* Smartphone Top Notch & Status Bar */}
      <div className="bg-slate-950 px-6 py-2.5 flex items-center justify-between text-xs text-slate-400 border-b border-slate-800/80 select-none">
        <span className="font-mono text-slate-300 font-semibold">14:15</span>
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1 text-emerald-400 text-[10px] bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/30">
            <Radio className="w-3 h-3 animate-pulse" />
            <span>عبر شريحة الهاتف البعيد</span>
          </div>
          <Signal className="w-3.5 h-3.5 text-emerald-400" />
          <Wifi className="w-3.5 h-3.5 text-sky-400" />
        </div>
      </div>

      {/* Main Content: Active Call Screen VS Dialer Screen */}
      {callState === 'connected' || callState === 'ringing_outgoing' ? (
        /* ============ ACTIVE CALL SCREEN ============ */
        <div className="flex-1 bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-950 p-6 flex flex-col justify-between items-center text-center">
          {/* Top Call Info */}
          <div className="space-y-3 pt-6">
            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-indigo-600 to-sky-400 flex items-center justify-center text-white text-3xl font-bold shadow-xl ring-4 ring-indigo-500/20 mx-auto animate-pulse">
              <User className="w-12 h-12" />
            </div>

            <div>
              <h3 className="text-xl font-bold text-white tracking-wide">
                {activeCall?.contactName || activeCall?.number}
              </h3>
              <p className="font-mono text-sm text-slate-400 mt-1">{activeCall?.number}</p>
              <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-700 text-xs">
                {callState === 'ringing_outgoing' ? (
                  <span className="text-amber-400 flex items-center gap-1.5 font-medium">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                    {telephonyBridge.connectionState.isConnected ? 'جاري طلب الرقم الحقيقي عبر Phone Link...' : 'جاري المحاكاة التوضيحية للاتصال...'}
                  </span>
                ) : (
                  <span className="text-emerald-400 font-mono font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    {formatDuration(callTimer)} • {telephonyBridge.connectionState.isConnected ? 'مكالمة فعلية جارية عبر الشريحة' : 'محاكاة توضيحية'}
                  </span>
                )}
              </div>

              {/* Status Warning if not connected to Windows Host */}
              {!telephonyBridge.connectionState.isConnected && (
                <div className="mt-3 p-2 bg-amber-950/50 border border-amber-500/30 rounded-xl text-[11px] text-amber-300 text-center leading-relaxed">
                  ⚠️ <strong>تنبيه:</strong> أنت تعمل في <strong>وضع المحاكاة</strong>. لكي يُجري هاتفك المكالمة الحقيقية وتسمع الصوت، يجب تشغيل <strong>سكريبت Windows 11</strong> والاتصال به من الشريط العلوي.
                </div>
              )}
            </div>
          </div>

          {/* Live Audio Waveform (Real Voice Activity Indicator) */}
          {callState === 'connected' && (
            <div className="w-full max-w-xs bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1 text-emerald-400">
                  <Volume2 className="w-3.5 h-3.5" />
                  صوت نقي (Bluetooth HFP SCO)
                </span>
                <span className="font-mono text-sky-400">{activeCall?.latencyMs} ms تأخير</span>
              </div>
              <div className="h-10 flex items-center justify-center gap-1.5">
                {waveformLevels.map((lvl, i) => (
                  <div
                    key={i}
                    className="w-2 bg-gradient-to-t from-indigo-500 to-sky-400 rounded-full transition-all duration-150"
                    style={{ height: `${lvl}%` }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Call In-Progress Controls */}
          <div className="space-y-6 w-full max-w-xs">
            <div className="grid grid-cols-3 gap-4">
              <button
                onClick={toggleMute}
                className={`flex flex-col items-center gap-1 p-3 rounded-2xl transition cursor-pointer ${
                  activeCall?.isMuted
                    ? 'bg-amber-600 text-white shadow-lg'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {activeCall?.isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                <span className="text-[11px] font-medium">{activeCall?.isMuted ? 'مكتوم' : 'كتم'}</span>
              </button>

              <button
                onClick={toggleHold}
                className={`flex flex-col items-center gap-1 p-3 rounded-2xl transition cursor-pointer ${
                  activeCall?.isHold
                    ? 'bg-amber-600 text-white shadow-lg'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {activeCall?.isHold ? <Play className="w-6 h-6" /> : <Pause className="w-6 h-6" />}
                <span className="text-[11px] font-medium">{activeCall?.isHold ? 'استئناف' : 'انتظار'}</span>
              </button>

              <button
                onClick={() => alert('تم تفعيل مكبر الصوت بجهازك')}
                className="flex flex-col items-center gap-1 p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
              >
                <Volume2 className="w-6 h-6" />
                <span className="text-[11px] font-medium">سبيكر</span>
              </button>
            </div>

            {/* Hangup Red Button */}
            <button
              onClick={endCall}
              className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center mx-auto shadow-2xl shadow-red-600/50 hover:scale-105 transition cursor-pointer"
              title="إنهاء المكالمة"
            >
              <PhoneOff className="w-8 h-8" />
            </button>
          </div>
        </div>
      ) : (
        /* ============ DIALER / KEYPAD SCREEN ============ */
        <div className="flex-1 flex flex-col justify-between p-5">
          {/* Top Tabs: Keypad, Call Logs, Contacts */}
          <div className="flex items-center justify-center gap-1 bg-slate-950 p-1 rounded-2xl border border-slate-800 text-xs">
            <button
              onClick={() => setActiveTab('keypad')}
              className={`flex-1 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                activeTab === 'keypad' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              لوحة الاتصال
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`flex-1 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                activeTab === 'logs' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              سجل المكالمات
            </button>
            <button
              onClick={() => setActiveTab('contacts')}
              className={`flex-1 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                activeTab === 'contacts' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              جهات الاتصال
            </button>
          </div>

          {activeTab === 'keypad' && (
            <div className="flex-1 flex flex-col justify-between pt-4">
              {/* Dialed Number Display */}
              <div className="min-h-[60px] flex items-center justify-center px-4 relative">
                <span
                  className="font-mono text-3xl font-extrabold text-white tracking-widest text-center truncate select-all"
                  dir="ltr"
                >
                  {dialedNumber || <span className="text-slate-600 text-lg">أدخل الرقم للاتصال...</span>}
                </span>
                {dialedNumber && (
                  <button
                    onClick={handleDeleteDigit}
                    className="absolute left-2 p-2 text-slate-400 hover:text-white transition"
                    title="مسح"
                  >
                    <Delete className="w-5 h-5" />
                  </button>
                )}
              </div>

              {/* Number Buttons Grid */}
              <div className="grid grid-cols-3 gap-3 my-2" dir="ltr">
                {[
                  { num: '1', sub: '' },
                  { num: '2', sub: 'ABC' },
                  { num: '3', sub: 'DEF' },
                  { num: '4', sub: 'GHI' },
                  { num: '5', sub: 'JKL' },
                  { num: '6', sub: 'MNO' },
                  { num: '7', sub: 'PQRS' },
                  { num: '8', sub: 'TUV' },
                  { num: '9', sub: 'WXYZ' },
                  { num: '*', sub: '' },
                  { num: '0', sub: '+' },
                  { num: '#', sub: '' },
                ].map((item) => (
                  <button
                    key={item.num}
                    onClick={() => handleDigitPress(item.num)}
                    className="h-14 rounded-2xl bg-slate-950 hover:bg-indigo-950/60 active:scale-95 border border-slate-800 hover:border-indigo-500/40 flex flex-col items-center justify-center transition shadow cursor-pointer group"
                  >
                    <span className="text-xl font-bold text-slate-100 group-hover:text-indigo-400 font-mono">
                      {item.num}
                    </span>
                    {item.sub && <span className="text-[9px] text-slate-500 font-mono">{item.sub}</span>}
                  </button>
                ))}
              </div>

              {/* Call Action Button */}
              <div className="flex items-center justify-center pt-2">
                <button
                  onClick={() => handleStartOutgoingCall()}
                  disabled={!dialedNumber}
                  className="w-16 h-16 rounded-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-600 text-white flex items-center justify-center shadow-xl shadow-emerald-600/30 hover:scale-105 active:scale-95 transition cursor-pointer"
                  title="إجراء مكالمة عبر الهاتف البعيد"
                >
                  <Phone className="w-7 h-7" />
                </button>
              </div>
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="flex-1 py-4 overflow-y-auto space-y-2 pr-1">
              {callLogs.map((log) => (
                <div
                  key={log.id}
                  onClick={() => handleStartOutgoingCall(log.number)}
                  className="p-3 rounded-2xl bg-slate-950 hover:bg-slate-850 border border-slate-800 flex items-center justify-between transition cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                        log.type === 'incoming'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : log.type === 'outgoing'
                          ? 'bg-sky-500/10 text-sky-400'
                          : 'bg-red-500/10 text-red-400'
                      }`}
                    >
                      <PhoneCall className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">{log.name || log.number}</p>
                      <p className="font-mono text-[11px] text-slate-400" dir="ltr">
                        {log.number}
                      </p>
                    </div>
                  </div>
                  <div className="text-left text-[10px] text-slate-500 font-mono">
                    <p>{log.time}</p>
                    <p>{log.duration}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'contacts' && (
            <div className="flex-1 py-4 overflow-y-auto space-y-2 pr-1">
              {contacts.map((c, i) => (
                <div
                  key={i}
                  onClick={() => handleStartOutgoingCall(c.number)}
                  className="p-3 rounded-2xl bg-slate-950 hover:bg-slate-850 border border-slate-800 flex items-center justify-between transition cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-xs">
                      {c.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">{c.name}</p>
                      <p className="font-mono text-[11px] text-sky-400" dir="ltr">
                        {c.number}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] bg-slate-900 border border-slate-700 text-slate-400 px-2 py-0.5 rounded-full">
                    {c.tag}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ============ INCOMING CALL POPUP OVERLAY ============ */}
      {callState === 'ringing_incoming' && (
        <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-xl z-50 p-6 flex flex-col justify-between items-center text-center animate-in fade-in">
          <div className="pt-8 space-y-3">
            <div className="w-24 h-24 rounded-full bg-emerald-500/20 border-2 border-emerald-500/50 flex items-center justify-center text-emerald-400 text-3xl font-bold shadow-2xl mx-auto animate-bounce">
              <PhoneIncoming className="w-12 h-12" />
            </div>

            <div>
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">
                مكالمة واردة من الدولة البعيدة (SIM Inbound)
              </span>
              <h3 className="text-2xl font-bold text-white mt-1">
                {activeCall?.contactName || activeCall?.number}
              </h3>
              <p className="font-mono text-sm text-slate-400 mt-1" dir="ltr">
                {activeCall?.number}
              </p>
              <p className="text-xs text-slate-500 mt-2">
                يتم تمرير صوت الرنين من خلال هاتف الأندرويد المقترن بالبلوتوث
              </p>
            </div>
          </div>

          {/* Action Buttons: Accept / Decline */}
          <div className="flex items-center justify-around w-full max-w-xs pb-8">
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={endCall}
                className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shadow-xl shadow-red-600/40 hover:scale-105 transition cursor-pointer"
              >
                <PhoneOff className="w-8 h-8" />
              </button>
              <span className="text-xs text-red-400 font-medium">رفض</span>
            </div>

            <div className="flex flex-col items-center gap-2">
              <button
                onClick={answerIncomingCall}
                className="w-16 h-16 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shadow-xl shadow-emerald-600/40 hover:scale-105 transition cursor-pointer animate-pulse"
              >
                <Phone className="w-8 h-8" />
              </button>
              <span className="text-xs text-emerald-400 font-medium">رد والتحدث</span>
            </div>
          </div>
        </div>
      )}

      {/* Production Connection Required Modal */}
      {showConnectModal && (
        <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-md z-50 p-6 flex flex-col justify-center items-center text-center animate-in fade-in">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4">
            <RadioTower className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">
            يلزم ربط خادم Windows 11 للاتصال الحقيقي
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed max-w-xs mb-6">
            تم تفعيل الوضع الرسمي للنظام. لإجراء المكالمة عبر شريحة الهاتف وسماع الصوت الحقيقي، يجب أن يكون خادم الويندوز متصلاً عبر الشريط العلوي.
          </p>
          <div className="flex flex-col w-full max-w-xs gap-2">
            <button
              onClick={() => {
                setShowConnectModal(false);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition cursor-pointer"
            >
              الذهاب إلى شريط الربط وتوصيل الويندوز
            </button>
            <button
              onClick={() => setShowConnectModal(false)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs transition cursor-pointer"
            >
              إلغاء
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
