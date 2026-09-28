import React, { useState } from 'react';
import {
  Download,
  Smartphone,
  Share2,
  PlusSquare,
  CheckCircle2,
  X,
  Laptop,
  Check,
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, isAndroid, install } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);

  // If already installed and running standalone, show a subtle active badge or hide
  if (isInstalled) {
    return (
      <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-[11px] text-emerald-400">
        <CheckCircle2 className="w-3.5 h-3.5" />
        <span>تطبيق مثبت</span>
      </div>
    );
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      const installed = await install();
      if (!installed) {
        setShowGuideModal(true);
      }
    } else {
      setShowGuideModal(true);
    }
  };

  return (
    <>
      <button
        onClick={handleInstallClick}
        className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/25 transition cursor-pointer hover:scale-105 active:scale-95"
        title="تثبيت التطبيق على هاتفك أو كمبيوترك"
      >
        <Download className="w-4 h-4 animate-bounce" />
        <span>تثبيت التطبيق على الهاتف</span>
      </button>

      {/* Comprehensive Install Guide Modal */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full p-6 shadow-2xl flex flex-col space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Smartphone className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">
                    تنزيل وتثبيت التطبيق (PWA)
                  </h3>
                  <p className="text-xs text-slate-400">
                    يعمل كتطبيق مستقل بكامل الشاشة وبدون شريط متصفح
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowGuideModal(false)}
                className="text-slate-400 hover:text-white p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Direct 1-Click install if browser supports it */}
            {isInstallable && (
              <div className="p-4 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl space-y-3">
                <p className="text-xs font-semibold text-emerald-300">
                  متصفحك يدعم التثبيت المباشر بنقرة واحدة:
                </p>
                <button
                  onClick={async () => {
                    await install();
                    setShowGuideModal(false);
                  }}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  اضغط هنا لتثبيت التطبيق فوراً
                </button>
              </div>
            )}

            {/* Platform Guides */}
            <div className="space-y-4 text-xs text-slate-300">
              {/* iPhone / iPad Guide */}
              <div
                className={`p-4 rounded-2xl border transition ${
                  isIOS
                    ? 'bg-indigo-950/40 border-indigo-500/50 ring-1 ring-indigo-500/30'
                    : 'bg-slate-950/70 border-slate-800'
                }`}
              >
                <div className="flex items-center gap-2 mb-2 font-bold text-white">
                  <Smartphone className="w-4 h-4 text-indigo-400" />
                  <span>طريقة التثبيت على هواتف iPhone (متصفح Safari):</span>
                  {isIOS && (
                    <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full mr-auto">
                      جهازك الحالي
                    </span>
                  )}
                </div>
                <ol className="space-y-2 text-[11px] text-slate-300 pr-4 list-decimal leading-relaxed">
                  <li>
                    اضغط على زر <strong>المشاركة (Share)</strong>{' '}
                    <Share2 className="w-3.5 h-3.5 inline mx-1 text-sky-400" /> أسفل شاشة Safari.
                  </li>
                  <li>
                    مرر لأسفل القائمة واضغط على خيار{' '}
                    <strong className="text-emerald-400">"إضافة إلى الصفحة الرئيسية"</strong>{' '}
                    (Add to Home Screen){' '}
                    <PlusSquare className="w-3.5 h-3.5 inline mx-1 text-emerald-400" />.
                  </li>
                  <li>
                    اضغط على <strong>"إضافة" (Add)</strong> في أعلى الزاوية. سيظهر التطبيق فوراً على شاشة هاتفك مثل تطبيقات App Store!
                  </li>
                </ol>
              </div>

              {/* Android Guide */}
              <div
                className={`p-4 rounded-2xl border transition ${
                  isAndroid && !isInstallable
                    ? 'bg-emerald-950/40 border-emerald-500/50 ring-1 ring-emerald-500/30'
                    : 'bg-slate-950/70 border-slate-800'
                }`}
              >
                <div className="flex items-center gap-2 mb-2 font-bold text-white">
                  <Smartphone className="w-4 h-4 text-emerald-400" />
                  <span>طريقة التثبيت على هواتف Android (متصفح Chrome):</span>
                  {isAndroid && (
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full mr-auto">
                      جهازك الحالي
                    </span>
                  )}
                </div>
                <ol className="space-y-2 text-[11px] text-slate-300 pr-4 list-decimal leading-relaxed">
                  <li>اضغط على قائمة الثلاث نقاط (⋮) في أعلى متصفح Chrome.</li>
                  <li>
                    اختر <strong className="text-emerald-400">"تثبيت التطبيق" (Install app)</strong>{' '}
                    أو "إضافة إلى الشاشة الرئيسية".
                  </li>
                  <li>
                    أكّد التثبيت، وسيتم تنزيل الأيقونة الرسمية في قائمة تطبيقاتك فوراً.
                  </li>
                </ol>
              </div>

              {/* Windows / Mac Desktop Guide */}
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                <div className="flex items-center gap-2 mb-2 font-bold text-white">
                  <Laptop className="w-4 h-4 text-sky-400" />
                  <span>طريقة التثبيت على الكمبيوتر (Windows / Mac):</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  في متصفح Chrome أو Microsoft Edge، ستجد أيقونة تثبيت صغيرة (كمبيوتر مع سهم لأسفل) داخل شريط العنوان في أعلى المتصفح، اضغط عليها وسيفتح التطبيق في نافذة مستقلة وسريعة.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-2 flex justify-end border-t border-slate-800">
              <button
                onClick={() => setShowGuideModal(false)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
