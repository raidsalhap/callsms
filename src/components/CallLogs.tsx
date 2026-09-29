import React, { useState, useEffect } from 'react';
import {
  Phone,
  PhoneCall,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  Clock,
  Search,
  Filter,
  Trash2,
  Copy,
  Check,
  RotateCcw,
  Plus,
  MessageSquare,
  Sparkles,
  User,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  HelpCircle,
} from 'lucide-react';
import { CallLogItem } from '../types/telephony';
import { telephonyBridge } from '../services/telephonyBridge';

interface CallLogsProps {
  onCallNumber?: (phoneNumber: string) => void;
  onSendSMS?: (phoneNumber: string) => void;
}

export const CallLogs: React.FC<CallLogsProps> = ({ onCallNumber, onSendSMS }) => {
  const [logs, setLogs] = useState<CallLogItem[]>(telephonyBridge.getSavedCallLogs());
  const [filterType, setFilterType] = useState<'all' | 'incoming' | 'outgoing' | 'answered' | 'missed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // New log form state
  const [newNumber, setNewNumber] = useState('');
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<'incoming' | 'outgoing'>('incoming');
  const [newStatus, setNewStatus] = useState<'answered' | 'missed'>('answered');
  const [newDuration, setNewDuration] = useState('02:15');

  // Real-time synchronization with telephony bridge
  useEffect(() => {
    const unsub = telephonyBridge.subscribe((action, payload) => {
      if (action === 'LOGS_UPDATED') {
        setLogs([...payload]);
      } else if (action === 'CALL_STARTED') {
        // Automatically add log when real call begins
        const newLog: CallLogItem = {
          id: `log-${Date.now()}`,
          number: payload.number || 'رقم غير معروف',
          name: payload.name || 'مكالمة جديدة',
          type: 'outgoing',
          status: 'answered',
          time: 'الآن',
          duration: 'جارية الآن...',
          timestamp: Date.now(),
        };
        telephonyBridge.addCallLog(newLog);
      }
    });

    return () => unsub();
  }, []);

  const handleCopyNumber = (id: string, number: string) => {
    navigator.clipboard.writeText(number);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = (id: string) => {
    telephonyBridge.deleteCallLog(id);
    setLogs(telephonyBridge.getSavedCallLogs());
  };

  const handleClearAll = () => {
    if (confirm('هل أنت متأكد من رغبتك في مسح سجل المكالمات بالكامل؟')) {
      telephonyBridge.clearCallLogs();
      setLogs([]);
    }
  };

  const handleCall = (number: string) => {
    telephonyBridge.dialRealNumber(number);
    if (onCallNumber) {
      onCallNumber(number);
    }
  };

  const handleAddManualLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNumber) return;

    const formattedDuration =
      newStatus === 'missed' ? '00:00 (لم يرد)' : `${newDuration} دقيقة`;

    const item: CallLogItem = {
      id: `log-${Date.now()}`,
      number: newNumber,
      name: newName || undefined,
      type: newStatus === 'missed' ? 'missed' : newType,
      status: newStatus,
      time: 'اليوم، ' + new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      duration: formattedDuration,
      timestamp: Date.now(),
    };

    telephonyBridge.addCallLog(item);
    setLogs(telephonyBridge.getSavedCallLogs());
    setShowAddModal(false);
    setNewNumber('');
    setNewName('');
  };

  // Filtered logs
  const filteredLogs = logs.filter((log) => {
    // Search query
    const matchesSearch =
      log.number.includes(searchQuery) ||
      (log.name && log.name.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    // Type filter
    if (filterType === 'all') return true;
    if (filterType === 'incoming') return log.type === 'incoming';
    if (filterType === 'outgoing') return log.type === 'outgoing';
    if (filterType === 'answered') return log.status === 'answered' || (!log.status && log.type !== 'missed');
    if (filterType === 'missed') return log.status === 'missed' || log.type === 'missed';

    return true;
  });

  // Calculate statistics
  const totalCalls = logs.length;
  const answeredCalls = logs.filter((l) => l.status === 'answered' || (!l.status && l.type !== 'missed')).length;
  const missedCalls = logs.filter((l) => l.status === 'missed' || l.type === 'missed').length;
  const incomingCalls = logs.filter((l) => l.type === 'incoming').length;
  const outgoingCalls = logs.filter((l) => l.type === 'outgoing').length;

  return (
    <div className="space-y-6">
      {/* Top Banner / Notification */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900/90 to-indigo-950/40 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-extrabold text-white">
                سجل المكالمات الصادرة والواردة
              </h2>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                مزامنة حية
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              متابعة جميع المكالمات التي تمت عبر شريحة الهاتف مع توضيح حالة الرد والتوقيت ومدة المحادثة
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 shadow-md shadow-emerald-600/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>تسجيل مكالمة</span>
          </button>

          {logs.length > 0 && (
            <button
              onClick={handleClearAll}
              className="bg-slate-800 hover:bg-rose-950/60 border border-slate-700 hover:border-rose-700 text-slate-300 hover:text-rose-300 text-xs font-bold px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
              title="مسح السجل كاملاً"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>مسح السجل</span>
            </button>
          )}
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Calls */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4 shadow-lg flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">إجمالي المكالمات</p>
            <p className="text-2xl font-black text-white mt-1 font-mono">{totalCalls}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">صادرة وواردة</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-300">
            <Phone className="w-5 h-5" />
          </div>
        </div>

        {/* Answered Calls */}
        <div className="bg-slate-900/80 border border-emerald-900/40 rounded-2xl p-4 shadow-lg flex items-center justify-between">
          <div>
            <p className="text-xs text-emerald-400 font-medium">تم الرد عليها</p>
            <p className="text-2xl font-black text-emerald-300 mt-1 font-mono">{answeredCalls}</p>
            <p className="text-[10px] text-emerald-500/80 mt-0.5">مكالمات ناجحة</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-950/60 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Missed / Unanswered Calls */}
        <div className="bg-slate-900/80 border border-rose-900/40 rounded-2xl p-4 shadow-lg flex items-center justify-between">
          <div>
            <p className="text-xs text-rose-400 font-medium">لم يرد عليها (فائتة)</p>
            <p className="text-2xl font-black text-rose-300 mt-1 font-mono">{missedCalls}</p>
            <p className="text-[10px] text-rose-500/80 mt-0.5">تحتاج إعادة اتصال</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-950/60 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <XCircle className="w-5 h-5" />
          </div>
        </div>

        {/* Incoming vs Outgoing split */}
        <div className="bg-slate-900/80 border border-indigo-900/40 rounded-2xl p-4 shadow-lg flex items-center justify-between">
          <div>
            <p className="text-xs text-indigo-300 font-medium">واردة / صادرة</p>
            <div className="flex items-baseline gap-1 mt-1 font-mono">
              <span className="text-xl font-black text-sky-400">{incomingCalls}</span>
              <span className="text-xs text-slate-500">/</span>
              <span className="text-xl font-black text-indigo-400">{outgoingCalls}</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">توزيع الحركة</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-950/60 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <PhoneCall className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث بالرقم أو اسم جهة الاتصال..."
            className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs pr-9 pl-4 py-2 rounded-xl focus:outline-none focus:border-indigo-500 transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs cursor-pointer"
            >
              مسح
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
              filterType === 'all'
                ? 'bg-slate-700 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            الكل ({logs.length})
          </button>

          <button
            onClick={() => setFilterType('answered')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
              filterType === 'answered'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                : 'text-emerald-400/80 hover:text-emerald-300 hover:bg-emerald-950/40'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>تم الرد ({answeredCalls})</span>
          </button>

          <button
            onClick={() => setFilterType('missed')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
              filterType === 'missed'
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
                : 'text-rose-400/80 hover:text-rose-300 hover:bg-rose-950/40'
            }`}
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>لم يرد ({missedCalls})</span>
          </button>

          <button
            onClick={() => setFilterType('incoming')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
              filterType === 'incoming'
                ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/30'
                : 'text-sky-400/80 hover:text-sky-300 hover:bg-sky-950/40'
            }`}
          >
            <PhoneIncoming className="w-3.5 h-3.5" />
            <span>واردة ({incomingCalls})</span>
          </button>

          <button
            onClick={() => setFilterType('outgoing')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
              filterType === 'outgoing'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-indigo-400/80 hover:text-indigo-300 hover:bg-indigo-950/40'
            }`}
          >
            <PhoneOutgoing className="w-3.5 h-3.5" />
            <span>صادرة ({outgoingCalls})</span>
          </button>
        </div>
      </div>

      {/* Logs List Table / Cards */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-16 h-16 rounded-3xl bg-slate-800/80 mx-auto flex items-center justify-center text-slate-500">
              <PhoneMissed className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-slate-300 text-base">لا توجد مكالمات مطابقة</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchQuery
                ? 'لم يتم العثور على أي مكالمة تطابق كلمة البحث الحالية.'
                : 'سجل المكالمات فارغ حالياً. أي مكالمة تجريها عبر لوحة الاتصال ستظهر هنا تلقائياً.'}
            </p>
            {logs.length === 0 && (
              <button
                onClick={() => {
                  const initial = telephonyBridge.getSavedCallLogs();
                  setLogs([...initial]);
                }}
                className="mt-2 text-xs text-emerald-400 hover:underline inline-flex items-center gap-1 cursor-pointer font-bold"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>استعادة السجلات التجريبية</span>
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {filteredLogs.map((log) => {
              const isAnswered =
                log.status === 'answered' || (!log.status && log.type !== 'missed');
              const isMissed = log.status === 'missed' || log.type === 'missed';

              return (
                <div
                  key={log.id}
                  className="p-4 sm:p-5 hover:bg-slate-800/40 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                >
                  {/* Left info: Icon, Name/Number, Status Badge, Time */}
                  <div className="flex items-center gap-3.5">
                    {/* Call Type Icon */}
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${
                        isMissed
                          ? 'bg-rose-950/50 border-rose-500/40 text-rose-400'
                          : log.type === 'incoming'
                          ? 'bg-sky-950/50 border-sky-500/40 text-sky-400'
                          : 'bg-indigo-950/50 border-indigo-500/40 text-indigo-400'
                      }`}
                    >
                      {isMissed ? (
                        <PhoneMissed className="w-5 h-5" />
                      ) : log.type === 'incoming' ? (
                        <PhoneIncoming className="w-5 h-5" />
                      ) : (
                        <PhoneOutgoing className="w-5 h-5" />
                      )}
                    </div>

                    {/* Details */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-white text-sm">
                          {log.name || 'مكالمة غير مسجلة'}
                        </span>

                        {/* Status Badge: تم الرد / لم يرد */}
                        {isAnswered ? (
                          <span className="text-[10px] bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            <span>تم الرد</span>
                          </span>
                        ) : (
                          <span className="text-[10px] bg-rose-950/80 text-rose-300 border border-rose-500/40 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                            <XCircle className="w-3 h-3" />
                            <span>لم يرد</span>
                          </span>
                        )}

                        {/* Direction badge */}
                        <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md font-medium">
                          {log.type === 'incoming' ? 'واردة' : 'صادرة'}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-400 font-mono flex-wrap">
                        <span className="text-slate-300 select-all" dir="ltr">
                          {log.number}
                        </span>
                        <span className="text-slate-600">•</span>
                        <span className="text-slate-400 font-sans flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-500" />
                          {log.time}
                        </span>
                        <span className="text-slate-600">•</span>
                        <span
                          className={`font-sans font-medium ${
                            isAnswered ? 'text-emerald-400' : 'text-slate-500'
                          }`}
                        >
                          {log.duration}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right actions: Call, SMS, Copy, Delete */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    {/* Call Button */}
                    <button
                      onClick={() => handleCall(log.number)}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-emerald-600/20 cursor-pointer"
                      title="إجراء اتصال فوري عبر شريحة الهاتف"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>اتصال</span>
                    </button>

                    {/* Send SMS Button */}
                    {onSendSMS && (
                      <button
                        onClick={() => onSendSMS(log.number)}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                        title="إرسال رسالة SMS"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Copy Number */}
                    <button
                      onClick={() => handleCopyNumber(log.id, log.number)}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                      title="نسخ الرقم"
                    >
                      {copiedId === log.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {/* Delete item */}
                    <button
                      onClick={() => handleDelete(log.id)}
                      className="p-2 rounded-xl bg-slate-800/80 hover:bg-rose-950/60 hover:text-rose-400 text-slate-400 transition cursor-pointer"
                      title="حذف من السجل"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Manual Add Log Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 shadow-2xl flex flex-col space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <PhoneCall className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-white text-base">تسجيل مكالمة جديدة يدوياً</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddManualLog} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  رقم الهاتف: *
                </label>
                <input
                  type="text"
                  required
                  placeholder="+96650XXXXXXX"
                  value={newNumber}
                  onChange={(e) => setNewNumber(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 font-mono text-left focus:outline-none focus:border-emerald-500"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  اسم المتصل أو الجهة (اختياري):
                </label>
                <input
                  type="text"
                  placeholder="مثال: م. أحمد أو البنك"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    اتجاه المكالمة:
                  </label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="incoming">واردة (Incoming)</option>
                    <option value="outgoing">صادرة (Outgoing)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    حالة المكالمة:
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="answered">تم الرد (Answered)</option>
                    <option value="missed">لم يرد / فائتة (Missed)</option>
                  </select>
                </div>
              </div>

              {newStatus === 'answered' && (
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    مدة المكالمة:
                  </label>
                  <input
                    type="text"
                    placeholder="مثال: 03:20"
                    value={newDuration}
                    onChange={(e) => setNewDuration(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 font-mono text-left focus:outline-none focus:border-emerald-500"
                    dir="ltr"
                  />
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition cursor-pointer shadow-lg shadow-emerald-600/30"
                >
                  حفظ في السجل
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
