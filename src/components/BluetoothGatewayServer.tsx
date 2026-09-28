import React, { useState, useEffect } from 'react';
import {
  Server,
  Radio,
  Bluetooth,
  Battery,
  Signal,
  Smartphone,
  Terminal,
  Activity,
  PhoneIncoming,
  MessageSquare,
  RefreshCw,
  Cpu,
  ShieldCheck,
  CheckCircle2,
  Sliders,
  Sparkles,
} from 'lucide-react';
import { MobileGatewayStatus } from '../types/telephony';
import { telephonyBridge } from '../services/telephonyBridge';

export const BluetoothGatewayServer: React.FC = () => {
  const [gatewayStatus, setGatewayStatus] = useState<MobileGatewayStatus>(
    telephonyBridge.gatewayStatus
  );

  // AT Command Terminal Logs
  const [atLogs, setAtLogs] = useState<Array<{ cmd: string; resp: string; time: string }>>([
    { cmd: 'AT+CGMI', resp: '+CGMI: Samsung Electronics', time: '14:00:10' },
    { cmd: 'AT+COPS?', resp: '+COPS: 0,0,"STC Local GSM",7 (LTE)', time: '14:00:12' },
    { cmd: 'AT+CSQ', resp: '+CSQ: 28,99 (Excellent Signal -57 dBm)', time: '14:00:15' },
    { cmd: 'AT+CBC', resp: '+CBC: 0,92 (Battery: 92% Charged)', time: '14:00:18' },
  ]);

  // Audio stream metrics
  const [audioLatency, setAudioLatency] = useState(32);
  const [packetLoss, setPacketLoss] = useState(0.01);

  // Listen to bridge events
  useEffect(() => {
    const unsubscribe = telephonyBridge.subscribe((action, payload) => {
      const time = new Date().toLocaleTimeString('ar-EG', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });

      if (action === 'DIAL_OUTGOING') {
        setAtLogs((prev) => [
          { cmd: `ATD${payload.number};`, resp: 'OK (CALL INITIATED OVER GSM)', time },
          ...prev,
        ]);
      } else if (action === 'CALL_ANSWERED') {
        setAtLogs((prev) => [
          { cmd: 'ATA', resp: 'CONNECT (VOICE AUDIO ROUTED VIA SCO)', time },
          ...prev,
        ]);
      } else if (action === 'CALL_HANGUP') {
        setAtLogs((prev) => [
          { cmd: 'ATH', resp: 'OK (VOICE CHANNEL RELEASED)', time },
          ...prev,
        ]);
      } else if (action === 'SEND_SMS') {
        setAtLogs((prev) => [
          {
            cmd: `AT+CMGS="${payload.recipient}"`,
            resp: `+CMGS: 142 (DELIVERED TO NETWORK)`,
            time,
          },
          ...prev,
        ]);
      }
    });

    return () => unsubscribe();
  }, []);

  const simulateIncomingCall = () => {
    telephonyBridge.emit('INCOMING_CALL', {
      number: '+966501234567',
      name: 'م. أحمد (الرياض - محلي)',
    });
  };

  const simulateIncomingOtp = () => {
    const randomOtp = Math.floor(100000 + Math.random() * 900000).toString();
    telephonyBridge.emit('INCOMING_SMS', {
      sender: 'مصرف الراجحي',
      body: `رمز التوثيق الخاص بالعملية البنكية هو: ${randomOtp}. لا تشارك هذا الرمز مع أي شخص.`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Bridge Node Overview */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
              <Server className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-white">
                  بوابة الاتصال المحلية (Bluetooth GSM Gateway)
                </h3>
                <span className="bg-emerald-500/20 text-emerald-400 text-xs px-2.5 py-0.5 rounded-full border border-emerald-500/30 font-medium flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  الخدمة نشطة ومتصلة
                </span>
              </div>
              <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                هذا الجهاز (كمبيوتر صغير أو راوتر بالدولة البعيدة) مقترن بالهاتف عبر البلوتوث، ويقوم بتحويل صوت المكالمات ورسائل الشريحة إلى خادم سحابي مشفر يتصل بهاتفك الشخصي.
              </p>
            </div>
          </div>

          {/* Quick Simulation Testing Triggers */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={simulateIncomingCall}
              className="px-4 py-2 bg-emerald-600/30 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow"
              title="اختبار رنين مكالمة واردة على هاتفك الشخصي"
            >
              <PhoneIncoming className="w-4 h-4" />
              محاكاة مكالمة واردة
            </button>

            <button
              onClick={simulateIncomingOtp}
              className="px-4 py-2 bg-amber-600/30 hover:bg-amber-600/40 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow"
              title="اختبار وصول رسالة SMS مع كود OTP"
            >
              <MessageSquare className="w-4 h-4" />
              محاكاة رسالة OTP بنكية
            </button>
          </div>
        </div>
      </div>

      {/* Grid: Phone Telemetry & Live Bluetooth Audio Link */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Paired Mobile Phone Specs */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2 text-indigo-400">
              <Smartphone className="w-5 h-5" />
              <h4 className="font-bold text-white text-sm">الهاتف المقترن (Host Phone)</h4>
            </div>
            <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
              PAIRED
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">اسم الهاتف:</span>
              <span className="text-white font-bold">{gatewayStatus.pairedDeviceName}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400">عنوان البلوتوث (MAC):</span>
              <span className="font-mono text-sky-400">{gatewayStatus.bluetoothMac}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400">الشبكة والشريحة (SIM):</span>
              <span className="text-slate-200">{gatewayStatus.carrierName}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400">نوع التغطية:</span>
              <span className="text-emerald-400 font-bold font-mono">{gatewayStatus.networkType}</span>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <span className="text-slate-400 flex items-center gap-1">
                <Battery className="w-4 h-4 text-emerald-400" />
                شحن البطارية:
              </span>
              <span className="font-mono font-bold text-emerald-400">
                {gatewayStatus.batteryLevel}% (متصل بالشاحن)
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1">
                <Signal className="w-4 h-4 text-sky-400" />
                قوة إشارة البرج:
              </span>
              <span className="font-mono font-bold text-sky-400">
                {gatewayStatus.signalStrength}% (-57 dBm)
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Bluetooth Audio Bridge Profile */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2 text-sky-400">
              <Bluetooth className="w-5 h-5" />
              <h4 className="font-bold text-white text-sm">مسار الصوت (Audio Bridge)</h4>
            </div>
            <span className="text-[11px] font-mono text-sky-400 bg-sky-950/60 px-2 py-0.5 rounded border border-sky-500/30">
              SCO ACTIVE
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">بروفايل البلوتوث:</span>
              <span className="text-white font-medium">{gatewayStatus.audioProfile}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400">ترميز الصوت (Codec):</span>
              <span className="font-mono text-amber-400">mSBC Wideband (16 kHz HD Voice)</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400">زمن تأخير الصوت (RTT):</span>
              <span className="font-mono text-emerald-400 font-bold">{audioLatency} ms (فوري)</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400">فقدان الحزم (Jitter):</span>
              <span className="font-mono text-purple-400">{packetLoss}%</span>
            </div>

            <div className="pt-2 border-t border-slate-800">
              <p className="text-[11px] text-slate-400 leading-relaxed">
                يتم تمرير الصوت ثنائي الاتجاه من مكبر صوت وميكروفون البلوتوث بالهاتف إلى تدفق WebRTC مشفر (DTLS-SRTP) مباشرة لهاتفك الشخصي.
              </p>
            </div>
          </div>
        </div>

        {/* Card 3: Security & Encryption Status */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2 text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
              <h4 className="font-bold text-white text-sm">الأمان والربط السحابي</h4>
            </div>
            <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
              ENCRYPTED
            </span>
          </div>

          <ul className="space-y-2 text-xs text-slate-300">
            <li className="flex items-start gap-2">
              <span className="text-emerald-400">✓</span>
              <span><strong>تشفير الصوت:</strong> محمي بتقنية DTLS-SRTP لنقل الصوت عبر الإنترنت دون إمكانية اعتراضه.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400">✓</span>
              <span><strong>اتصال مباشر P2P:</strong> لا يتم تسجيل أو حفظ أي مكالمة صوتية أو نص رسالة على خوادم خارجية.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400">✓</span>
              <span><strong>المصادقة بمفتاح مسبق (Token):</strong> لا يستطيع أي شخص الوصول للهاتف إلا بتطبيقك المصرّح له.</span>
            </li>
          </ul>
        </div>
      </div>

      {/* GSM Modem AT Command Console */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-3">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2 text-amber-400">
            <Terminal className="w-5 h-5" />
            <h4 className="font-bold text-white text-sm">
              سجل أوامر البلوتوث المباشرة (Bluetooth RFCOMM / AT Commands Log)
            </h4>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">Live Serial Bridge</span>
        </div>

        <div className="bg-slate-950 rounded-xl p-4 font-mono text-xs text-slate-300 max-h-48 overflow-y-auto space-y-2 border border-slate-800/80">
          {atLogs.map((log, index) => (
            <div key={index} className="flex items-start gap-3">
              <span className="text-slate-600 text-[10px] shrink-0">{log.time}</span>
              <span className="text-amber-400 shrink-0 font-bold">&gt;&gt; {log.cmd}</span>
              <span className="text-emerald-400 truncate">&lt;&lt; {log.resp}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
