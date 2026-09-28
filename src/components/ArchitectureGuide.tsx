import React, { useState } from 'react';
import {
  Code,
  Layers,
  Shield,
  Server,
  Cpu,
  Monitor,
  CheckCircle,
  Copy,
  Check,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Terminal,
  Zap,
  Lock,
  Globe,
} from 'lucide-react';

export const ArchitectureGuide: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'architecture' | 'rust' | 'electron' | 'python' | 'security'>('architecture');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const rustCode = `// 1. Rust Client Agent (أفضل خيار للأداء العالي مثل RustDesk / AnyDesk)
// Cargo.toml dependencies:
// scrap = "0.5" (أو dxgi/scrap لالتقاط الإطارات)
// enigo = "0.2" (لحقن أحداث الماوس ولوحة المفاتيح)
// webrtc = "0.10" (لبث الفيديو وقنوات البيانات)
// tokio = { version = "1.0", features = ["full"] }

use enigo::{Enigo, MouseControllable, KeyboardControllable, Key};
use scrap::{Capturer, Display};
use std::io::ErrorKind::WouldBlock;
use std::thread;
use std::time::Duration;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    println!("🚀 بدء تشغيل عميل التحكم عن بعد (Remote Client Host)...");

    // 1. تهيئة التقاط الشاشة عبر Direct Desktop Duplication
    let display = Display::primary().expect("تعذر العثور على الشاشة الرئيسية");
    let mut capturer = Capturer::new(display).expect("فشل تهيئة التقاط الشاشة");
    let (w, h) = (capturer.width(), capturer.height());
    println!("📺 تم رصد الشاشة: {}x{}", w, h);

    // 2. تهيئة محاكي الإدخال (حقن أحداث الفأرة والمفاتيح)
    let mut enigo = Enigo::new();

    // 3. حلقة التقاط الإطارات وضغطها للبث
    thread::spawn(move || {
        let one_frame = Duration::from_millis(1000 / 60); // 60 FPS
        loop {
            match capturer.frame() {
                Ok(frame) => {
                    // هنا يتم تمرير إطار BGRA إلى مشفر الفيديو H.264 (NVENC أو OpenH264)
                    // ثم إرساله عبر WebRTC Video Track
                }
                Err(ref e) if e.kind() == WouldBlock => {
                    thread::sleep(one_frame);
                }
                Err(err) => eprintln!("خطأ في التقاط الإطار: {}", err),
            }
        }
    });

    // 4. دالة استقبال أحداث الماوس القادمة من المسؤول عبر WebRTC DataChannel
    // match event {
    //     RemoteEvent::MouseMove { x, y } => enigo.mouse_move_to(x, y),
    //     RemoteEvent::MouseClick { button } => enigo.mouse_click(button),
    //     RemoteEvent::KeyPress { key } => enigo.key_click(Key::Layout(key)),
    // }

    Ok(())
}`;

  const electronCode = `// 2. تطبيق Electron + Node.js (لإنشاء تطبيق سطح مكتب بـ HTML/JS)
// main.js (في جهاز العميل Client)
const { app, BrowserWindow, desktopCapturer, ipcMain } = require('electron');
const robot = require('@jitsi/robotjs'); // لحقن إدخال الماوس والمفاتيح

// 1. الحصول على مصادر الشاشة المتاحة
ipcMain.handle('GET_SCREEN_SOURCES', async () => {
  const sources = await desktopCapturer.getSources({
    types: ['screen'],
    thumbnailSize: { width: 1920, height: 1080 }
  });
  return sources[0].id; // معرف الشاشة الرئيسية
});

// 2. حقن حركة ونقرات الماوس القادمة من المسؤول
ipcMain.on('REMOTE_MOUSE_MOVE', (event, { xRatio, yRatio }) => {
  const { width, height } = robot.getScreenSize();
  const screenX = Math.round(xRatio * width);
  const screenY = Math.round(yRatio * height);
  robot.moveMouse(screenX, screenY);
});

ipcMain.on('REMOTE_MOUSE_CLICK', (event, { button }) => {
  robot.mouseClick(button || 'left');
});

ipcMain.on('REMOTE_KEY_TAP', (event, { key, modifiers }) => {
  robot.keyTap(key, modifiers || []);
});`;

  const pythonCode = `# 3. كود بلغة Python (للنماذج الأولية السريعة وعمليات الأتمتة)
# pip install pyautogui mss websockets opencv-python aiortc

import asyncio
import json
import pyautogui
import websockets
import mss
import cv2
import numpy as np

# تعطيل توقف PyAutoGUI التلقائي عند زوايا الشاشة
pyautogui.FAILSAFE = False

async def handle_remote_commands(websocket):
    print("✅ تم الاتصال بخادم الإشارات بنجاح")
    screen_w, screen_h = pyautogui.size()

    async for message in websocket:
        data = json.loads(message)
        event_type = data.get("type")

        if event_type == "MOUSE_MOVE":
            # تحويل النسب المئوية (0 - 100%) إلى بكسل الشاشة الفعلي
            target_x = int((data["x"] / 100.0) * screen_w)
            target_y = int((data["y"] / 100.0) * screen_h)
            pyautogui.moveTo(target_x, target_y)

        elif event_type == "MOUSE_CLICK":
            pyautogui.click(button=data.get("button", "left"))

        elif event_type == "KEY_INPUT":
            key = data.get("key")
            pyautogui.press(key)

async def main():
    async with websockets.connect("wss://your-signaling-server.com/client") as ws:
        await handle_remote_commands(ws)

if __name__ == "__main__":
    asyncio.run(main())`;

  const signalingCode = `// 4. خادم الإشارات (Node.js Signaling Server)
// يربط بين تطبيق المسؤول والعميل لتبادل إشارات WebRTC
const WebSocket = require('ws');
const server = new WebSocket.Server({ port: 8080 });

const clients = new Map(); // DeviceID -> WebSocket

server.on('connection', (ws) => {
  ws.on('message', (message) => {
    const data = JSON.parse(message);

    switch(data.type) {
      case 'REGISTER_CLIENT':
        clients.set(data.deviceId, ws);
        break;

      case 'SIGNALING_OFFER':
      case 'SIGNALING_ANSWER':
      case 'ICE_CANDIDATE':
        // إعادة توجيه حزم WebRTC للطرف المقابل
        const targetWs = clients.get(data.targetId);
        if (targetWs && targetWs.readyState === WebSocket.OPEN) {
          targetWs.send(JSON.stringify(data));
        }
        break;
    }
  });

  ws.on('close', () => {
    // تنظيف الجلسة عند انقطاع الاتصال
  });
});`;

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
            <Layers className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">
              الدليل المعماري والتقني: كيف تبني تطبيق تحكم كامل بالشاشات (Admin & Client)
            </h2>
            <p className="text-slate-400 text-sm mt-1 leading-relaxed">
              شرح تفصيلي للمكونات الهندسية، البروتوكولات، اللغات البرمجية، وكيفية تجاوز القيود الأمنية وجدران الحماية للوصول إلى زمن تأخير فائق الصغر (Ultra-Low Latency &lt; 30ms).
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t border-slate-800">
          <button
            onClick={() => setActiveTab('architecture')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'architecture'
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Server className="w-4 h-4" />
            الهيكلية العامة للبرنامج (Architecture)
          </button>

          <button
            onClick={() => setActiveTab('rust')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'rust'
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Zap className="w-4 h-4 text-amber-400" />
            تطبيق بلغة Rust (الأداء الأفضل)
          </button>

          <button
            onClick={() => setActiveTab('electron')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'electron'
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Monitor className="w-4 h-4 text-sky-400" />
            تطبيق Electron + Node.js
          </button>

          <button
            onClick={() => setActiveTab('python')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'python'
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Terminal className="w-4 h-4 text-emerald-400" />
            تطبيق Python (النماذج السريعة)
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'security'
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Shield className="w-4 h-4 text-purple-400" />
            الأمان وتجاوز الـ NAT والخصوصية
          </button>
        </div>
      </div>

      {/* Tab 1: Architecture Breakdown */}
      {activeTab === 'architecture' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Component 1: Client Agent */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
                1
              </div>
              <h3 className="font-bold text-white text-base">عميل الهدف (Host Agent)</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                برنامج خفيف يعمل في خلفية الجهاز الهدف كـ (Windows Service أو Linux Daemon).
              </p>
              <ul className="text-xs text-slate-300 space-y-2 pt-2 border-t border-slate-800">
                <li className="flex items-start gap-1.5">
                  <span className="text-emerald-400">●</span>
                  <span><strong>التقاط الشاشة:</strong> عبر DXGI Desktop Duplication API (ويندوز) أو PipeWire (لينكس) مباشرة من كرت الشاشة (GPU).</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-emerald-400">●</span>
                  <span><strong>ضغط الفيديو:</strong> باستخدام عتاد كرت الشاشة (NVENC / QuickSync) لصيغة H.264 أو AV1 بسرعة 60 إطار بالثانية.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-emerald-400">●</span>
                  <span><strong>حقن الأوامر:</strong> عبر Win32 <code className="text-sky-300">SendInput</code> للتحكم بالفأرة والكتابة حتى في شاشة القفل (UAC).</span>
                </li>
              </ul>
            </div>

            {/* Component 2: Signaling & Relay Server */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold">
                2
              </div>
              <h3 className="font-bold text-white text-base">خادم الإشارات (Signaling & Relay)</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                خادم سحابي مركزي (WebSocket / WebRTC Signaling Server + STUN/TURN).
              </p>
              <ul className="text-xs text-slate-300 space-y-2 pt-2 border-t border-slate-800">
                <li className="flex items-start gap-1.5">
                  <span className="text-indigo-400">●</span>
                  <span><strong>تبادل المفاتيح:</strong> يربط بين معرف العميل (Device ID) وجهاز المسؤول لتبادل حزم SDP Offer/Answer.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-indigo-400">●</span>
                  <span><strong>تجاوز الـ NAT (STUN):</strong> اكتشاف الـ Public IP والمنافذ المفتوحة خلف الراوتر لإنشاء اتصال نظير لنظير (P2P).</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-indigo-400">●</span>
                  <span><strong>خادم الترحيل (TURN):</strong> تمرير حركة المرور المشفرة فقط إذا كان كلا الجهازين خلف جدار حماية صارم (Symmetric NAT).</span>
                </li>
              </ul>
            </div>

            {/* Component 3: Admin Controller */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold">
                3
              </div>
              <h3 className="font-bold text-white text-base">تطبيق المسؤول (Admin Controller)</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                واجهة المشغّل أو المهندس، وتكون تطبيق سطح مكتب أو متصفح ويب متكامل (PWA).
              </p>
              <ul className="text-xs text-slate-300 space-y-2 pt-2 border-t border-slate-800">
                <li className="flex items-start gap-1.5">
                  <span className="text-purple-400">●</span>
                  <span><strong>عرض الفيديو:</strong> فك التشفير عبر WebGL / Hardware Canvas بأقل من 10ms تأخير.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-purple-400">●</span>
                  <span><strong>التقاط الإدخال:</strong> رصد إحداثيات الماوس وضغطات المفاتيح ونقلها فوراً عبر WebRTC DataChannel.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-purple-400">●</span>
                  <span><strong>الأدوات المتقدمة:</strong> نقل الملفات، المحطة الطرفية عن بعد، تسجيل الجلسات، واختصارات النظام (Ctrl+Alt+Del).</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Workflow Diagram Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              مراحل إنشاء جلسة التحكم خطوة بخطوة (Connection Flow)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs space-y-2">
                <span className="font-mono text-sky-400 font-bold">خطوة 1: التسجيل</span>
                <p className="text-slate-300">
                  يبدأ عميل الهدف بالاتصال بخادم الإشارات، ويحصل على معرّف فريد (ID) مثل <code className="text-amber-300 font-mono">849-203-118</code> مع رمز PIN مؤقت.
                </p>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs space-y-2">
                <span className="font-mono text-sky-400 font-bold">خطوة 2: طلب الدخول</span>
                <p className="text-slate-300">
                  يقوم المسؤول بإدخال المعرف ورمز الأمان. يُرسل الخادم إشعاراً لجهاز العميل مع نافذة موافقة منبثقة أو يتحقق من كلمة المرور الثابتة (Unattended Access).
                </p>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs space-y-2">
                <span className="font-mono text-sky-400 font-bold">خطوة 3: مصافحة WebRTC</span>
                <p className="text-slate-300">
                  يتبادل الجهازان مرشحات ICE (عناوين الـ IP والمنافذ المتاحة) ويتم إنشاء اتصال مشفر مباشر P2P عبر DTLS-SRTP بدون مرور البيانات بالخادم.
                </p>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs space-y-2">
                <span className="font-mono text-sky-400 font-bold">خطوة 4: البث والتحكم</span>
                <p className="text-slate-300">
                  يبدأ بث شاشة العميل لمشغل المسؤول عبر تدفق الفيديو، وتتدفق نقرات الماوس وحركات المفاتيح فورياً عبر الـ DataChannel.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Rust */}
      {activeTab === 'rust' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-base">لماذا تعتبر لغة Rust هي المعيار الحديث (مثل RustDesk و AnyDesk)؟</h3>
                <p className="text-xs text-slate-400 mt-1">
                  تتميز Rust باستهلاك ضئيل جداً للذاكرة والـ CPU مع سرعة فائقة في معالجة إطارات الفيديو وحقن الإدخال بدون Garbage Collector.
                </p>
              </div>
              <button
                onClick={() => copyToClipboard(rustCode, 'rust')}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition flex items-center gap-1.5 cursor-pointer"
              >
                {copiedCode === 'rust' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedCode === 'rust' ? 'تم النسخ!' : 'نسخ الكود'}
              </button>
            </div>

            <pre className="bg-slate-950 p-4 rounded-xl text-slate-300 font-mono text-xs overflow-x-auto border border-slate-800/80 leading-relaxed" style={{ direction: 'ltr' }}>
              {rustCode}
            </pre>
          </div>
        </div>
      )}

      {/* Tab 3: Electron */}
      {activeTab === 'electron' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-base">تطبيق سطح مكتب باستخدام Electron و Node.js</h3>
                <p className="text-xs text-slate-400 mt-1">
                  يسمح لك ببناء واجهة مستخدم جميلة باستخدام React و Tailwind CSS، مع كود Node.js في الخلفية لالتقاط الشاشة وحقن الإدخال عبر مكتبة RobotJS.
                </p>
              </div>
              <button
                onClick={() => copyToClipboard(electronCode, 'electron')}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition flex items-center gap-1.5 cursor-pointer"
              >
                {copiedCode === 'electron' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedCode === 'electron' ? 'تم النسخ!' : 'نسخ الكود'}
              </button>
            </div>

            <pre className="bg-slate-950 p-4 rounded-xl text-slate-300 font-mono text-xs overflow-x-auto border border-slate-800/80 leading-relaxed" style={{ direction: 'ltr' }}>
              {electronCode}
            </pre>
          </div>
        </div>
      )}

      {/* Tab 4: Python */}
      {activeTab === 'python' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-base">بناء نموذج أولي سريع بلغة Python</h3>
                <p className="text-xs text-slate-400 mt-1">
                  باستخدام مكتبة PyAutoGUI لمحاكاة الإدخال ومكتبة MSS لالتقاط الإطارات بسرعة مع WebSockets.
                </p>
              </div>
              <button
                onClick={() => copyToClipboard(pythonCode, 'python')}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition flex items-center gap-1.5 cursor-pointer"
              >
                {copiedCode === 'python' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedCode === 'python' ? 'تم النسخ!' : 'نسخ الكود'}
              </button>
            </div>

            <pre className="bg-slate-950 p-4 rounded-xl text-slate-300 font-mono text-xs overflow-x-auto border border-slate-800/80 leading-relaxed" style={{ direction: 'ltr' }}>
              {pythonCode}
            </pre>
          </div>
        </div>
      )}

      {/* Tab 5: Security & NAT Traversal */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
              <div className="flex items-center gap-2 text-purple-400">
                <Lock className="w-5 h-5" />
                <h3 className="font-bold text-white text-sm">التشفير الكامل من طرف لطرف (End-to-End Encryption)</h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                في برامج التحكم عن بعد الآمنة، لا يجب أن يستطيع حتى صاحب خادم الإشارات رؤية شاشات المستخدمين. يتم ذلك عبر:
              </p>
              <ul className="text-xs text-slate-300 space-y-2 pt-1">
                <li className="flex items-start gap-1.5">
                  <span className="text-emerald-400">✓</span>
                  <span><strong>DTLS (Datagram Transport Layer Security):</strong> لتبادل مفاتيح الجلسة وتأمين قنوات البيانات.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-emerald-400">✓</span>
                  <span><strong>SRTP (Secure Real-Time Transport Protocol):</strong> لتشفير تدفقات الفيديو والصوت بتشفير AES-128/256.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-emerald-400">✓</span>
                  <span><strong>المصادقة ثنائية العوامل (2FA):</strong> عند محاولة الدخول غير المراقب (Unattended Access).</span>
                </li>
              </ul>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
              <div className="flex items-center gap-2 text-indigo-400">
                <Globe className="w-5 h-5" />
                <h3 className="font-bold text-white text-sm">تجاوز جدران الحماية والـ NAT (ICE / STUN / TURN)</h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                معظم الأجهزة لا تمتلك عنوان IP عام مباشر، بل تتواجد خلف راوترات وNAT. الحل التقني المعتمد عالمياً:
              </p>
              <ul className="text-xs text-slate-300 space-y-2 pt-1">
                <li className="flex items-start gap-1.5">
                  <span className="text-sky-400">✓</span>
                  <span><strong>STUN Server (مثل coturn):</strong> مجاني وخفيف جداً، يخبر الجهاز بعنوانه الخارجي ليحاول إنشاء اتصال مباشر P2P.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-sky-400">✓</span>
                  <span><strong>TURN Server:</strong> خادم وساطة ينقل الحزم المشفرة في حال فشل الـ P2P بسبب قيود شبكات الشركات والجامعات.</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="font-bold text-white text-sm">خادم الإشارات النموذجي (Signaling Server Code)</h3>
              <button
                onClick={() => copyToClipboard(signalingCode, 'signaling')}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition flex items-center gap-1.5 cursor-pointer"
              >
                {copiedCode === 'signaling' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                {copiedCode === 'signaling' ? 'تم النسخ' : 'نسخ'}
              </button>
            </div>
            <pre className="bg-slate-950 p-4 rounded-xl text-slate-300 font-mono text-xs overflow-x-auto border border-slate-800/80 leading-relaxed" style={{ direction: 'ltr' }}>
              {signalingCode}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
