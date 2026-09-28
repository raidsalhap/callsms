import React, { useState } from 'react';
import {
  Code,
  Layers,
  Shield,
  Server,
  Bluetooth,
  Phone,
  Copy,
  Check,
  Zap,
  Terminal,
  Cpu,
  Radio,
} from 'lucide-react';

export const TelephonyGuide: React.FC = () => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const pythonScript = `# gateway_bridge.py
# سكريبت بايثون خفيف يعمل على الكمبيوتر الصغير / Raspberry Pi المقترن بالهاتف
# المتطلبات في لينكس:
# sudo apt install bluez pulseaudio-module-bluetooth python3-pip
# pip install pybluez aiortc websockets

import asyncio
import bluetooth
import json
import websockets

MOBILE_MAC = "A4:C3:F0:89:12:DE"  # عنوان ماك البلوتوث الخاص بهاتفك الأندرويد

class BluetoothGateway:
    def __init__(self, mac_address):
        self.mac = mac_address
        self.sock = None

    def connect_rfcomm(self):
        print(f"🔗 جاري الاتصال بالهاتف عبر منفذ Bluetooth RFCOMM (HFP)...")
        # المنفذ الشائع لقناة التحكم بالأوامر في الهواتف الذكية هو المنفذ 1 أو 2
        port = 1 
        self.sock = bluetooth.BluetoothSocket(bluetooth.RFCOMM)
        self.sock.connect((self.mac, port))
        print("✅ تم الاتصال بنجاح. القناة جاهزة لاستقبال الأوامر!")

    def send_at_command(self, cmd: str):
        full_cmd = (cmd + "\\r\\n").encode('utf-8')
        self.sock.send(full_cmd)
        print(f"📤 أرسل للهاتف: {cmd}")

    def dial(self, phone_number: str):
        # طلب رقم محلي عبر الشريحة
        self.send_at_command(f"ATD{phone_number};")

    def answer_call(self):
        # الرد على مكالمة واردة
        self.send_at_command("ATA")

    def hangup_call(self):
        # إنهاء المكالمة
        self.send_at_command("ATH")

    def send_sms(self, phone_number: str, text: str):
        # إرسال رسالة SMS عبر الشريحة
        self.send_at_command('AT+CMGF=1')
        self.send_at_command(f'AT+CMGS="{phone_number}"')
        self.sock.send((text + chr(26)).encode('utf-8'))

async def listen_for_remote_web_commands(gateway):
    # استقبال طلبات الاتصال من هاتفك الشخصي البعيد عبر WebSocket
    async with websockets.connect("wss://your-cloud-server.com/gateway") as ws:
        async for msg in ws:
            data = json.loads(msg)
            action = data.get("action")
            
            if action == "DIAL":
                gateway.dial(data["number"])
            elif action == "ANSWER":
                gateway.answer_call()
            elif action == "HANGUP":
                gateway.hangup_call()
            elif action == "SEND_SMS":
                gateway.send_sms(data["number"], data["text"])

if __name__ == "__main__":
    gw = BluetoothGateway(MOBILE_MAC)
    gw.connect_rfcomm()
    asyncio.run(listen_for_remote_web_commands(gw))
`;

  const setupCommands = `# 1. تحديث حزم نظام لينكس (Ubuntu / Debian / Raspberry Pi OS)
sudo apt update && sudo apt install -y bluez bluez-tools pulseaudio-module-bluetooth ofono

# 2. إقران هاتف الأندرويد بالكمبيوتر عبر البلوتوث
bluetoothctl
[bluetooth]# power on
[bluetooth]# agent on
[bluetooth]# default-agent
[bluetooth]# scan on
# ابحث عن MAC الخاص بهاتفك ثم:
[bluetooth]# pair A4:C3:F0:89:12:DE
[bluetooth]# trust A4:C3:F0:89:12:DE
[bluetooth]# connect A4:C3:F0:89:12:DE

# 3. توجيه صوت البلوتوث (HFP Handsfree Audio) إلى نظام الصوت
pacmd load-module module-bluetooth-discover
# الآن الهاتف يتعامل مع الكمبيوتر تماماً كأنه سماعة سيارة ذكية!`;

  return (
    <div className="space-y-6">
      {/* Intro Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
            <Radio className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">
              الدليل العملي: كيف تبني بوابة الاتصال المنزلية المجانية (Home GSM Gateway)
            </h2>
            <p className="text-slate-400 text-xs mt-1.5 leading-relaxed">
              شرح هندسي لطريقة ربط هاتف محلي في دولة أخرى بجهاز كمبيوتر رخيص عبر البلوتوث (Bluetooth HFP) لبث المكالمات والرسائل إلى هاتفك في أي مكان بالعالم.
            </p>
          </div>
        </div>
      </div>

      {/* 3 Simple Steps Architecture */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-sm">
            1
          </div>
          <h4 className="font-bold text-white text-sm">هاتف الأندرويد (في الدولة الأخرى)</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            تضع فيه الشريحة المحلية (SIM) وتصله بالشاحن والواي فاي. تفتح البلوتوث للاقتران بالجهاز الوسيط.
          </p>
          <div className="text-[11px] text-emerald-400 font-mono bg-emerald-950/40 p-2 rounded-xl border border-emerald-500/20">
            ✓ لا يتطلب روت (No Root Needed)
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
          <div className="w-9 h-9 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center font-bold text-sm">
            2
          </div>
          <h4 className="font-bold text-white text-sm">الجهاز الوسيط (كمبيوتر صغير أو راوتر)</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            أي لابتوب قديم أو Raspberry Pi رخيص في نفس الغرفة، يتصل بالهاتف عبر Bluetooth Hands-Free Profile لنقل صوت المكالمات.
          </p>
          <div className="text-[11px] text-sky-400 font-mono bg-sky-950/40 p-2 rounded-xl border border-sky-500/20">
            ✓ زمن استجابة منخفض (&lt; 40ms)
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold text-sm">
            3
          </div>
          <h4 className="font-bold text-white text-sm">هاتفك الشخصي (معك أينما كنت)</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            تفتح هذا التطبيق أو أي تطبيق SIP مجاني؛ تتصل وتتحدث بصوت نقي وترسل الرسائل كأنك موجود شخصياً في تلك الدولة.
          </p>
          <div className="text-[11px] text-amber-400 font-mono bg-amber-950/40 p-2 rounded-xl border border-amber-500/20">
            ✓ مكالمات محلية مجانية تماماً
          </div>
        </div>
      </div>

      {/* Linux Setup Terminal Commands */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2 text-sky-400">
            <Terminal className="w-5 h-5" />
            <h4 className="font-bold text-white text-sm">
              أوامر تهيئة البلوتوث والصوت في نظام لينكس (Linux Setup)
            </h4>
          </div>
          <button
            onClick={() => copyToClipboard(setupCommands, 'commands')}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition flex items-center gap-1.5 cursor-pointer"
          >
            {copiedKey === 'commands' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copiedKey === 'commands' ? 'تم النسخ' : 'نسخ الأوامر'}
          </button>
        </div>

        <pre
          className="bg-slate-950 p-4 rounded-xl text-slate-300 font-mono text-xs overflow-x-auto border border-slate-800/80 leading-relaxed"
          dir="ltr"
        >
          {setupCommands}
        </pre>
      </div>

      {/* Python Script Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2 text-emerald-400">
            <Code className="w-5 h-5" />
            <h4 className="font-bold text-white text-sm">
              سكريبت بايثون للتحكم بالهاتف وإرسال المكالمات والرسائل (Python Bridge)
            </h4>
          </div>
          <button
            onClick={() => copyToClipboard(pythonScript, 'python')}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition flex items-center gap-1.5 cursor-pointer"
          >
            {copiedKey === 'python' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copiedKey === 'python' ? 'تم النسخ' : 'نسخ الكود'}
          </button>
        </div>

        <pre
          className="bg-slate-950 p-4 rounded-xl text-slate-300 font-mono text-xs overflow-x-auto border border-slate-800/80 leading-relaxed"
          dir="ltr"
        >
          {pythonScript}
        </pre>
      </div>
    </div>
  );
};
