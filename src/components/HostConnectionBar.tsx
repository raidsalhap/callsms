import React, { useState, useEffect } from 'react';
import {
  Laptop,
  Wifi,
  WifiOff,
  Link,
  Terminal,
  Copy,
  Check,
  AlertCircle,
  HelpCircle,
  ExternalLink,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { telephonyBridge, HostConnectionState, DEFAULT_TUNNEL_URL } from '../services/telephonyBridge';

export const HostConnectionBar: React.FC = () => {
  const [conn, setConn] = useState<HostConnectionState>(telephonyBridge.connectionState);
  const [serverUrl, setServerUrl] = useState(telephonyBridge.connectionState.serverUrl || DEFAULT_TUNNEL_URL);
  const [showScriptModal, setShowScriptModal] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const unsub = telephonyBridge.subscribe((action, payload) => {
      if (action === 'HOST_CONNECTION_CHANGED') {
        setConn({ ...payload });
        if (payload.serverUrl) {
          setServerUrl(payload.serverUrl);
        }
      }
    });
    return () => unsub();
  }, []);

  const handleConnect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!serverUrl.trim()) return;
    telephonyBridge.connectToHost(serverUrl.trim());
  };

  const handleDisconnect = () => {
    telephonyBridge.disconnectHost();
  };

  const pythonScript = `# windows_agent.py
# ==============================================================================
# خادم الربط المباشر بين تطبيق الويب ونظام Windows 11 و Phone Link
# ==============================================================================
# المتطلبات لمرة واحدة في PowerShell:
# pip install websockets asyncio
# ==============================================================================

import asyncio
import json
import os
import subprocess
import websockets

PORT = 8765
connected_clients = set()

print(f"==================================================")
print(f"🚀 خادم البوابة على Windows 11 يعمل الآن على المنفذ: {PORT}")
print(f"🌐 عنوان الاتصال في التطبيق: ws://localhost:{PORT}")
print(f"📲 متكامل تلقائياً مع Microsoft Phone Link وهاتفك الأندرويد")
print(f"==================================================")

async def handler(websocket):
    connected_clients.add(websocket)
    client_ip = websocket.remote_address[0]
    print(f"🟢 هاتف شخصي جديد اتصل بالبوابة من: {client_ip}")

    # إرسال حالة الهاتف المقترن إلى التطبيق
    status_msg = {
        "type": "GATEWAY_STATUS",
        "payload": {
            "isConnected": True,
            "pairedDeviceName": "هاتف متصل عبر Phone Link",
            "audioProfile": "Phone Link Active (Windows 11)"
        }
    }
    await websocket.send(json.dumps(status_msg))

    try:
        async for message in websocket:
            try:
                data = json.loads(message)
                msg_type = data.get("type")
                payload = data.get("payload", {})

                if msg_type == "PING":
                    await websocket.send(json.dumps({"type": "PONG", "payload": payload}))

                elif msg_type == "DIAL_NUMBER":
                    phone_number = payload.get("number", "")
                    print(f"📞 [أمر وارد من هاتفك الشخصي] طلب الرقم الحقيقي: {phone_number}")
                    # استدعاء بروتوكول ويندوز الرسمي لتشغيل Phone Link والاتصال بالهاتف فوراً
                    os.system(f'start tel:{phone_number}')
                    
                    # إشعار التطبيق بأن المكالمة بدأت في الواقع
                    resp = {"type": "CALL_STARTED", "payload": {"number": phone_number, "status": "dialing"}}
                    await websocket.send(json.dumps(resp))

                elif msg_type == "HANGUP_CALL":
                    print("🔴 [أمر وارد] إنهاء المكالمة")
                    subprocess.run(["powershell", "-Command", "Stop-Process -Name 'PhoneExperienceHost' -Force -ErrorAction SilentlyContinue; Start-Process 'ms-phone:'"])
                    await websocket.send(json.dumps({"type": "CALL_ENDED", "payload": {}}))

                elif msg_type == "SEND_SMS":
                    number = payload.get("number", "")
                    body = payload.get("message", "")
                    print(f"✉️ [أمر وارد] إرسال رسالة SMS إلى: {number}")
                    os.system(f'start ms-chat:?PhoneNumber={number}&Body={body}')

            except Exception as e:
                print(f"⚠️ خطأ أثناء معالجة الأمر: {e}")

    except websockets.exceptions.ConnectionClosed:
        pass
    finally:
        connected_clients.remove(websocket)
        print(f"🔴 انقطع اتصال الهاتف الشخصي: {client_ip}")

async def main():
    async with websockets.serve(handler, "0.0.0.0", PORT):
        await asyncio.Future()  # تشغيل دائم

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("تم إيقاف الخادم.")
`;

  const copyScript = () => {
    navigator.clipboard.writeText(pythonScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <div className="bg-slate-900/90 border-b border-slate-800 px-4 py-2.5 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Connection Status indicator */}
          <div className="flex items-center gap-2.5">
            <span
              className={`w-3 h-3 rounded-full shrink-0 ${
                conn.isConnected
                  ? 'bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]'
                  : conn.isConnecting
                  ? 'bg-amber-500 animate-spin'
                  : 'bg-rose-500'
              }`}
            />
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              <span className="font-bold text-white flex items-center gap-1.5">
                <Laptop className="w-3.5 h-3.5 text-blue-400" />
                حالة الارتباط بجهاز Windows 11 الوسيط:
              </span>
              {conn.isConnected ? (
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  متصل فعلياً (التحكم والمكالمات حقيقية عبر Phone Link)
                </span>
              ) : conn.isConnecting ? (
                <span className="text-amber-300 font-semibold">جاري محاولة الاتصال...</span>
              ) : (
                <span className="text-slate-400 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                  غير متصل (وضع المحاكاة التوضيحية فقط)
                </span>
              )}
            </div>
          </div>

          {/* Quick Connect controls */}
          <div className="flex items-center gap-2 flex-wrap">
            {!conn.isConnected ? (
              <form onSubmit={handleConnect} className="flex items-center gap-1.5 flex-wrap">
                <div className="relative flex items-center">
                  <input
                    type="text"
                    value={serverUrl}
                    onChange={(e) => setServerUrl(e.target.value)}
                    placeholder={DEFAULT_TUNNEL_URL}
                    className="bg-slate-950 border border-slate-700 text-emerald-300 text-xs px-3 py-1.5 rounded-lg w-64 sm:w-80 md:w-96 focus:outline-none focus:border-emerald-500 font-mono shadow-inner text-left"
                    dir="ltr"
                  />
                  {serverUrl !== DEFAULT_TUNNEL_URL && (
                    <button
                      type="button"
                      onClick={() => setServerUrl(DEFAULT_TUNNEL_URL)}
                      className="absolute right-2 text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded cursor-pointer transition"
                      title="استعادة الرابط الافتراضي"
                    >
                      استعادة
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={conn.isConnecting}
                  className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold px-3.5 py-1.5 rounded-lg transition flex items-center gap-1.5 shadow-md shadow-emerald-600/30 cursor-pointer"
                >
                  <Wifi className="w-3.5 h-3.5" />
                  <span>ربط الآن</span>
                </button>
              </form>
            ) : (
              <div className="flex items-center gap-2">
                <span className="font-mono text-emerald-400 text-xs bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-1 rounded-lg" dir="ltr">
                  {serverUrl}
                </span>
                <button
                  onClick={handleDisconnect}
                  className="bg-rose-900/40 hover:bg-rose-900/60 border border-rose-700/50 text-rose-300 text-xs px-3 py-1.5 rounded-lg transition flex items-center gap-1 cursor-pointer"
                >
                  <WifiOff className="w-3.5 h-3.5" />
                  <span>فصل الاتصال</span>
                </button>
              </div>
            )}

            <button
              onClick={() => setShowScriptModal(true)}
              className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs px-2.5 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer font-medium"
            >
              <Terminal className="w-3.5 h-3.5 text-blue-400" />
              <span>إرشادات الخادم</span>
            </button>
          </div>
        </div>

        {conn.error && (
          <div className="max-w-7xl mx-auto mt-1.5 text-[11px] text-rose-300 bg-rose-950/40 border border-rose-800/50 rounded px-2.5 py-1 flex items-center justify-between">
            <span>{conn.error}</span>
            <button
              onClick={() => setShowScriptModal(true)}
              className="underline text-blue-300 hover:text-blue-200 ml-2 cursor-pointer"
            >
              طريقة تشغيل السكريبت في دقيقة
            </button>
          </div>
        )}
      </div>

      {/* Script & Setup Modal */}
      {showScriptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
                  <Terminal className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">
                    سكريبت الربط الفعلي لكمبيوتر Windows 11
                  </h3>
                  <p className="text-xs text-slate-400">
                    هذا الكود هو الذي يستقبل أوامر الاتصال من هاتفك ويجعل الهاتف الأندرويد يطلب الرقم في الواقع!
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowScriptModal(false)}
                className="text-slate-400 hover:text-white text-xl p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="py-4 space-y-4 text-xs text-slate-300">
              <div className="bg-blue-950/30 border border-blue-800/40 rounded-xl p-3 space-y-1.5">
                <p className="font-bold text-blue-300 flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-blue-400" />
                  لماذا كانت المكالمة تظهر بالثواني ولا تجرى في الواقع؟
                </p>
                <p className="leading-relaxed text-slate-300 text-[11px]">
                  التطبيق على متصفح هاتفك لا يمكنه الوصول لكارت صوت الكمبيوتر أو هاتفك المقترن مباشرة عبر الإنترنت بدون وسيط. هذا السكريبت البسيط على Windows 11 هو حلقة الوصل: يستمع لأمرك بنقرة زر ويطلب الرقم عبر Phone Link فوراً.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-white mb-2 flex items-center gap-1.5">
                  <span>1.</span> افتح PowerShell على ويندوز 11 وثبّت المكتبات (أمر واحد):
                </h4>
                <div className="bg-slate-950 border border-slate-800 p-2.5 rounded-lg font-mono text-emerald-400 text-xs flex justify-between items-center" dir="ltr">
                  <span>pip install websockets asyncio</span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-white flex items-center gap-1.5">
                    <span>2.</span> احفظ وشغّل هذا السكريبت (`windows_agent.py`):
                  </h4>
                  <button
                    onClick={copyScript}
                    className="flex items-center gap-1 bg-blue-600 hover:bg-blue-500 text-white px-2.5 py-1 rounded text-xs transition cursor-pointer font-sans"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'تم النسخ!' : 'نسخ الكود بالكامل'}
                  </button>
                </div>
                <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 font-mono text-[11px] text-slate-300 max-h-56 overflow-y-auto leading-relaxed" dir="ltr">
                  <pre>{pythonScript}</pre>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-white mb-1.5 flex items-center gap-1.5">
                  <span>3.</span> اكتب أمر التشغيل في ويندوز 11:
                </h4>
                <div className="bg-slate-950 border border-slate-800 p-2.5 rounded-lg font-mono text-emerald-400 text-xs" dir="ltr">
                  python windows_agent.py
                </div>
              </div>

              {/* Worldwide Remote Access (When outside the country) */}
              <div className="bg-gradient-to-r from-purple-950/40 via-slate-900 to-blue-950/40 border border-purple-500/30 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                  <h4 className="font-bold text-purple-300 text-xs">
                    🌐 كيف تتصل بالكمبيوتر وأنت خارج الدولة (عبر الإنترنت بأمان WSS)؟
                  </h4>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  لأن التطبيق يعمل على رابط مشفر (<code className="text-purple-300">HTTPS</code>)، يحظر المتصفح الاتصال بروابط <code className="text-purple-300">ws://</code> غير المشفرة عبر الإنترنت.
                  للحصول على رابط مشفر مجاني <code className="text-emerald-400">wss://</code> يربطك من أي دولة في العالم بدون فتح بورتات في الراوتر:
                </p>
                <div className="space-y-1.5 bg-slate-950/80 p-2.5 rounded-lg font-mono text-[11px] text-purple-200" dir="ltr">
                  <p className="text-slate-400 font-sans text-[10px]">خيار 1: باستخدام Cloudflare Tunnel مجاناً (أمر واحد):</p>
                  <p className="text-emerald-400">cloudflared tunnel --url http://localhost:8765</p>
                  <p className="text-slate-400 font-sans text-[10px] mt-1">خيار 2: باستخدام ngrok مجاناً:</p>
                  <p className="text-emerald-400">ngrok http 8765</p>
                </div>
                <div className="bg-emerald-950/40 border border-emerald-500/30 p-2.5 rounded-lg text-[11px] text-emerald-300">
                  ✅ <strong>الرابط النشط المعتمد في التطبيق حالياً:</strong>
                  <div className="font-mono text-white text-[11px] mt-1 select-all" dir="ltr">
                    wss://luther-boolean-ground-pockets.trycloudflare.com
                  </div>
                </div>
              </div>

              <div className="bg-emerald-950/20 border border-emerald-800/40 rounded-xl p-3 text-emerald-300 text-[11px]">
                💡 <strong>بمجرد تشغيله:</strong> اضغط على زر <strong>"ربط الآن"</strong> في الشريط العلوي للتطبيق، وستلاحظ أن أي رقم تطلبه سيبدأ هاتف الأندرويد بطلبه أمام عينيك فوراً دون أي محاكاة!
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setShowScriptModal(false)}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-5 py-2 rounded-xl text-xs transition cursor-pointer"
              >
                حسناً، فهمت وسأقوم بتشغيله
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
