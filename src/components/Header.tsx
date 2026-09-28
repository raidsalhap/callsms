import React from 'react';
import {
  Phone,
  MessageSquare,
  Server,
  BookOpen,
  Monitor,
  Radio,
  HelpCircle,
  Smartphone,
} from 'lucide-react';

export type MainNavTab = 'dialer' | 'sms' | 'gateway' | 'guide' | 'remotedesk';

interface HeaderProps {
  activeTab: MainNavTab;
  onTabChange: (tab: MainNavTab) => void;
  onOpenHelp?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, onTabChange, onOpenHelp }) => {
  return (
    <header className="sticky top-0 z-50 bg-slate-950/85 backdrop-blur-xl border-b border-slate-800/80 shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 ring-2 ring-emerald-500/30">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-extrabold text-white tracking-wide">
                  Global SIM Relay & VoIP Bridge
                </h1>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-mono font-bold px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Bluetooth HFP Live
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                إجراء واستقبال مكالمات ورسائل الشريحة البعيدة كأنك متواجد محلياً
              </p>
            </div>
          </div>

          {/* Navigation Bar */}
          <nav className="flex items-center gap-1 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800/80 overflow-x-auto">
            <button
              onClick={() => onTabChange('dialer')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shrink-0 ${
                activeTab === 'dialer'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Smartphone className="w-4 h-4 text-emerald-300" />
              <span>هاتفي للاتصال (Dialer)</span>
            </button>

            <button
              onClick={() => onTabChange('sms')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shrink-0 ${
                activeTab === 'sms'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <MessageSquare className="w-4 h-4 text-indigo-400" />
              <span>الرسائل (SMS & OTP)</span>
            </button>

            <button
              onClick={() => onTabChange('gateway')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shrink-0 ${
                activeTab === 'gateway'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Server className="w-4 h-4 text-sky-400" />
              <span>بوابة البلوتوث (Gateway)</span>
            </button>

            <button
              onClick={() => onTabChange('guide')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shrink-0 ${
                activeTab === 'guide'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <BookOpen className="w-4 h-4 text-amber-400" />
              <span>طريقة الإعداد والكود</span>
            </button>

            <div className="h-4 w-px bg-slate-800 mx-1 shrink-0" />

            <button
              onClick={() => onTabChange('remotedesk')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
                activeTab === 'remotedesk'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
              title="نظام التحكم بالشاشات عن بعد"
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>التحكم بالشاشات</span>
            </button>
          </nav>

          {/* Right Status */}
          <div className="hidden lg:flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-300">
              <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>Galaxy S21: متصل 4G</span>
            </div>

            {onOpenHelp && (
              <button
                onClick={onOpenHelp}
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
                title="كيف يعمل هذا النظام؟"
              >
                <HelpCircle className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
