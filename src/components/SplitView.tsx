import React, { useState } from 'react';
import { AdminView } from './AdminView';
import { ClientView } from './ClientView';
import { Monitor, Shield, ArrowLeftRight, Sparkles, ExternalLink } from 'lucide-react';

export const SplitView: React.FC = () => {
  const [activeSession, setActiveSession] = useState(false);

  return (
    <div className="space-y-6">
      {/* Intro info box */}
      <div className="bg-gradient-to-r from-indigo-950/60 via-slate-900 to-purple-950/60 border border-indigo-500/30 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0">
              <ArrowLeftRight className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                وضع المحاكاة المزدوج التفاعلي (Live Split-Screen Simulation)
                <span className="bg-indigo-500/20 text-indigo-300 text-xs px-2.5 py-0.5 rounded-full border border-indigo-500/30">
                  Admin ⟷ Client
                </span>
              </h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                في هذا الوضع، يمكنك تجربة المنظومة بالكامل على شاشة واحدة: انقر على <strong>"بدء التحكم عن بعد"</strong> في قسم المسؤول (يمين)، ولاحظ ظهور طلب الموافقة في قسم العميل (يسار) للموافقة الفورية والتحكم المباشر!
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Side-by-Side Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
        {/* Left Column: Admin Controller */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-indigo-500" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                1. تطبيق المسؤول (Admin Controller)
              </h2>
            </div>
            <span className="text-xs text-slate-400 font-mono">Control Station</span>
          </div>

          <div className="bg-slate-950/50 p-2 rounded-2xl border border-slate-800">
            <AdminView onSessionStateChange={setActiveSession} />
          </div>
        </div>

        {/* Right Column: Client Host Agent */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                2. تطبيق العميل (Target Client Agent)
              </h2>
            </div>
            <span className="text-xs text-slate-400 font-mono">Target Host</span>
          </div>

          <div className="bg-slate-950/50 p-2 rounded-2xl border border-slate-800">
            <ClientView onSessionStateChange={setActiveSession} />
          </div>
        </div>
      </div>
    </div>
  );
};
