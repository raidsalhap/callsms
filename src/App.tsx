import React, { useState } from 'react';
import { Header, MainNavTab } from './components/Header';
import { PhoneDialer } from './components/PhoneDialer';
import { SMSMessenger } from './components/SMSMessenger';
import { BluetoothGatewayServer } from './components/BluetoothGatewayServer';
import { TelephonyGuide } from './components/TelephonyGuide';
import { SplitView } from './components/SplitView';
import {
  Phone,
  MessageSquare,
  Server,
  HelpCircle,
  X,
  Sparkles,
  Radio,
  CheckCircle2,
  Smartphone,
  ArrowRight,
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<MainNavTab>('dialer');
  const [showHelpModal, setShowHelpModal] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-['Cairo',sans-serif]">
      {/* Header */}
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenHelp={() => setShowHelpModal(true)}
      />

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dialer' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-emerald-950/40 via-slate-900 to-indigo-950/40 border border-emerald-500/20 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-slate-300">
                  أنت متصل الآن بهاتفك الموجود في الدولة الأخرى عبر تقنية <strong>Bluetooth SCO Audio Bridge</strong>. أي رقم تطلبه سيتم الاتصال به من الشريحة المحلية مباشرة!
                </span>
              </div>
              <button
                onClick={() => setActiveTab('gateway')}
                className="text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 cursor-pointer shrink-0"
              >
                <span>مراقبة حالة السيرفر والبلوتوث</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <PhoneDialer />
          </div>
        )}

        {activeTab === 'sms' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-indigo-950/40 via-slate-900 to-emerald-950/40 border border-indigo-500/20 rounded-2xl p-4 flex items-center justify-between gap-3 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-indigo-400" />
                <span>
                  كل الرسائل الواردة إلى شريحة الهاتف البعيد (رسائل البنوك، أكواد التفعيل OTP، الرسائل الشخصية) تصل هنا فوراً مع ميزة الاستخراج والنسخ التلقائي للأكواد.
                </span>
              </div>
            </div>
            <SMSMessenger />
          </div>
        )}

        {activeTab === 'gateway' && <BluetoothGatewayServer />}
        {activeTab === 'guide' && <TelephonyGuide />}
        {activeTab === 'remotedesk' && <SplitView />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 px-4 sm:px-6 lg:px-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="font-semibold text-slate-300">
              Personal GSM Gateway & Telephony Relay System
            </span>
            <span>—</span>
            <span>بث المكالمات والرسائل عبر Bluetooth HFP و WebRTC</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span>Bluetooth HFP v1.7</span>
            <span>•</span>
            <span>mSBC HD Voice Codec</span>
            <span>•</span>
            <span>GSM AT Commands (RFCOMM)</span>
            <span>•</span>
            <span>WebRTC Encrypted P2P</span>
          </div>
        </div>
      </footer>

      {/* Quick Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative space-y-4">
            <button
              onClick={() => setShowHelpModal(false)}
              className="absolute top-4 left-4 p-1 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">كيف تختبر هذا النظام الآن؟</h3>
                <p className="text-xs text-slate-400">تجربة تفاعلية حية لمحاكاة المكالمات والرسائل</p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold shrink-0 text-xs">
                  1
                </span>
                <p>
                  <strong>إجراء مكالمة صادرة:</strong> في تبويب <strong>"هاتفي للاتصال"</strong>، أدخل أي رقم واضغط زر الاتصال الأخضر؛ ستفتح شاشة المكالمة الحية مع مؤشر الصوت التفاعلي المباشر.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold shrink-0 text-xs">
                  2
                </span>
                <p>
                  <strong>استقبال مكالمة واردة:</strong> اذهب لتبويب <strong>"بوابة البلوتوث"</strong> واضغط على زر <strong>"محاكاة مكالمة واردة"</strong>؛ ستجد هاتفك يرن فوراً مع خيار الرد أو الرفض!
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold shrink-0 text-xs">
                  3
                </span>
                <p>
                  <strong>استقبال كود بنكي (OTP):</strong> اضغط على <strong>"محاكاة رسالة OTP بنكية"</strong> ثم افتح تبويب <strong>"الرسائل"</strong> وستجد كود التحقق وصل مع زر النسخ السريع.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold shrink-0 text-xs">
                  4
                </span>
                <p>
                  <strong>بناء النظام حقيقةً في منزلك:</strong> افتح تبويب <strong>"طريقة الإعداد والكود"</strong> وستجد كود بايثون وأوامر لينكس لربط هاتفك القديم بكمبيوتر وتشغيل المنظومة مجاناً.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowHelpModal(false)}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-lg"
            >
              فهمت، لنبدأ التجربة الآن!
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
