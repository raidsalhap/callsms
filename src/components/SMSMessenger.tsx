import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Send,
  User,
  ShieldCheck,
  Copy,
  Check,
  Search,
  Plus,
  RefreshCw,
  Clock,
  Sparkles,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react';
import { SMSMessage } from '../types/telephony';
import { telephonyBridge } from '../services/telephonyBridge';

export const SMSMessenger: React.FC = () => {
  const [messages, setMessages] = useState<SMSMessage[]>(telephonyBridge.initialSMS);
  const [selectedContact, setSelectedContact] = useState<string>('البنك الأهلي');
  const [newRecipient, setNewRecipient] = useState('');
  const [newMessageText, setNewMessageText] = useState('');
  const [copiedOtp, setCopiedOtp] = useState<string | null>(null);
  const [isComposing, setIsComposing] = useState(false);

  // Group messages by contact/sender
  const contacts = Array.from(new Set(messages.map((m) => (m.direction === 'inbound' ? m.sender : m.recipient))));

  // Handle new incoming SMS
  useEffect(() => {
    const unsubscribe = telephonyBridge.subscribe((action, payload) => {
      if (action === 'INCOMING_SMS') {
        const newMsg: SMSMessage = {
          id: `sms-${Date.now()}`,
          sender: payload.sender || '+966500000000',
          recipient: 'جهازي البعيد',
          body: payload.body || 'رسالة جديدة واردة من الشريحة المحلية',
          timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
          direction: 'inbound',
          status: 'received',
        };
        setMessages((prev) => [newMsg, ...prev]);
        setSelectedContact(newMsg.sender);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessageText.trim()) return;

    const recipient = isComposing ? newRecipient.trim() : selectedContact;
    if (!recipient) return;

    const sentMsg: SMSMessage = {
      id: `sms-${Date.now()}`,
      sender: 'جهازي البعيد (SIM)',
      recipient: recipient,
      body: newMessageText.trim(),
      timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      direction: 'outbound',
      status: 'delivered',
    };

    setMessages((prev) => [sentMsg, ...prev]);
    setNewMessageText('');
    setIsComposing(false);
    setSelectedContact(recipient);

    // Send real SMS through Windows 11 Phone Link if connected
    if (telephonyBridge.connectionState.isConnected) {
      telephonyBridge.sendRealSMS(recipient, sentMsg.body);
    } else {
      // In simulation mode
      telephonyBridge.emit('SEND_SMS', { recipient, body: sentMsg.body });
    }
  };

  const activeThread = messages.filter(
    (m) =>
      (m.direction === 'inbound' && m.sender === selectedContact) ||
      (m.direction === 'outbound' && m.recipient === selectedContact)
  );

  const extractOtp = (text: string) => {
    const match = text.match(/\b\d{4,6}\b/);
    return match ? match[0] : null;
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedOtp(code);
    setTimeout(() => setCopiedOtp(null), 2000);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row h-[620px]">
      {/* Sidebar: Threads & Contacts */}
      <div className="w-full md:w-80 border-b md:border-b-0 md:border-l border-slate-800 bg-slate-950/60 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-white text-sm">صندوق الرسائل (SMS)</h3>
          </div>
          <button
            onClick={() => {
              setIsComposing(true);
              setNewRecipient('');
            }}
            className="p-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition cursor-pointer"
            title="إنشاء رسالة جديدة"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Contacts List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
          {contacts.map((contact, i) => {
            const lastMsg = messages.find(
              (m) => m.sender === contact || m.recipient === contact
            );
            const isSelected = selectedContact === contact && !isComposing;

            return (
              <div
                key={i}
                onClick={() => {
                  setSelectedContact(contact);
                  setIsComposing(false);
                }}
                className={`p-3 rounded-2xl flex items-center justify-between transition cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-600/20 border border-indigo-500/40 text-white'
                    : 'hover:bg-slate-900 text-slate-300 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3 truncate">
                  <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center font-bold text-xs text-indigo-300 shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                  <div className="truncate text-right">
                    <p className="font-bold text-xs truncate">{contact}</p>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">{lastMsg?.body}</p>
                  </div>
                </div>
                <span className="text-[10px] text-slate-500 font-mono shrink-0">
                  {lastMsg?.timestamp}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col justify-between bg-slate-900">
        {/* Chat Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">
                {isComposing ? 'رسالة جديدة' : selectedContact}
              </h4>
              <p className="text-[10px] text-slate-400">
                {isComposing ? 'أدخل رقم المستلم بالأسفل' : 'عبر شريحة SIM بالهاتف البعيد'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-medium">
              جاهز للإرسال
            </span>
          </div>
        </div>

        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 flex flex-col-reverse">
          {activeThread.map((msg) => {
            const isMe = msg.direction === 'outbound';
            const otpCode = extractOtp(msg.body);

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-start' : 'items-end'}`}
              >
                <div
                  className={`max-w-[85%] md:max-w-[70%] p-3.5 rounded-2xl text-xs space-y-2 shadow ${
                    isMe
                      ? 'bg-indigo-600 text-white rounded-tr-none'
                      : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-tl-none'
                  }`}
                >
                  <p className="leading-relaxed whitespace-pre-wrap">{msg.body}</p>

                  {/* Automatic OTP Extraction Card */}
                  {otpCode && !isMe && (
                    <div className="p-2.5 rounded-xl bg-slate-900/90 border border-amber-500/40 flex items-center justify-between gap-3 text-amber-300">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-amber-400" />
                        <span className="font-bold">رمز التحقق:</span>
                        <span className="font-mono text-base font-extrabold tracking-widest text-white">
                          {otpCode}
                        </span>
                      </div>
                      <button
                        onClick={() => copyToClipboard(otpCode)}
                        className="px-2 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg font-bold text-[10px] transition flex items-center gap-1 cursor-pointer"
                      >
                        {copiedOtp === otpCode ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        {copiedOtp === otpCode ? 'تم النسخ!' : 'نسخ الرمز'}
                      </button>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[10px] opacity-70 pt-1">
                    <span>{msg.timestamp}</span>
                    <span>{isMe ? 'تم الإرسال عبر الشريحة' : 'وارد عبر GSM'}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-800 bg-slate-950/70 space-y-2">
          {isComposing && (
            <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400 font-medium">إلى (الرقم المحلي):</span>
              <input
                type="text"
                value={newRecipient}
                onChange={(e) => setNewRecipient(e.target.value)}
                placeholder="+9665..."
                className="flex-1 bg-transparent border-none outline-none font-mono text-xs text-white placeholder:text-slate-600"
                dir="ltr"
              />
            </div>
          )}

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newMessageText}
              onChange={(e) => setNewMessageText(e.target.value)}
              placeholder="اكتب نص الرسالة للإرسال من الشريحة..."
              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-slate-500 outline-none focus:border-indigo-500 transition"
            />
            <button
              type="submit"
              disabled={!newMessageText.trim()}
              className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-white transition cursor-pointer shadow-lg"
              title="إرسال عبر الهاتف البعيد"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
