import { ActiveCall, MobileGatewayStatus, SMSMessage, CallLogItem } from '../types/telephony';

export interface HostConnectionState {
  isConnected: boolean;
  isConnecting: boolean;
  serverUrl: string;
  error: string | null;
  lastPingMs: number;
}

const STORAGE_KEY_URL = 'rd_gateway_server_url';
const STORAGE_KEY_SMS = 'rd_gateway_sms_list';
const STORAGE_KEY_LOGS = 'rd_gateway_call_logs';

export const DEFAULT_TUNNEL_URL = 'wss://luther-boolean-ground-pockets.trycloudflare.com';

const getInitialServerUrl = (): string => {
  if (typeof window === 'undefined') return DEFAULT_TUNNEL_URL;
  try {
    const saved = localStorage.getItem(STORAGE_KEY_URL);
    // If empty or previously pointing to localhost, override with active Cloudflare Tunnel
    if (!saved || saved.includes('localhost') || saved.includes('127.0.0.1')) {
      localStorage.setItem(STORAGE_KEY_URL, DEFAULT_TUNNEL_URL);
      return DEFAULT_TUNNEL_URL;
    }
    return saved;
  } catch {
    return DEFAULT_TUNNEL_URL;
  }
};

const DEFAULT_SAMPLE_LOGS: CallLogItem[] = [
  {
    id: 'log-1',
    number: '+966551234567',
    name: 'م. أحمد الشمري',
    type: 'incoming',
    status: 'answered',
    time: 'اليوم، 01:15 م',
    duration: '03:42 دقيقة',
    durationSeconds: 222,
    timestamp: Date.now() - 3600000,
  },
  {
    id: 'log-2',
    number: '+966509876543',
    name: 'شركة الخدمات التقنية',
    type: 'missed',
    status: 'missed',
    time: 'اليوم، 11:30 ص',
    duration: '00:00 (لم يرد)',
    durationSeconds: 0,
    timestamp: Date.now() - 10800000,
  },
  {
    id: 'log-3',
    number: '+971501122334',
    name: 'مكتب دبي التجاري',
    type: 'outgoing',
    status: 'answered',
    time: 'أمس، 04:20 م',
    duration: '07:15 دقيقة',
    durationSeconds: 435,
    timestamp: Date.now() - 86400000,
  },
  {
    id: 'log-4',
    number: '+966540001122',
    name: 'خالد السالم',
    type: 'outgoing',
    status: 'missed',
    time: 'أمس، 02:10 م',
    duration: '00:00 (لم يرد)',
    durationSeconds: 0,
    timestamp: Date.now() - 93600000,
  },
  {
    id: 'log-5',
    number: '+9668001160000',
    name: 'خدمة عملاء البنك الأهلي',
    type: 'incoming',
    status: 'answered',
    time: '26 سبتمبر، 10:05 ص',
    duration: '05:30 دقيقة',
    durationSeconds: 330,
    timestamp: Date.now() - 172800000,
  },
];

export class TelephonyBridgeService {
  private ws: WebSocket | null = null;
  private listeners: Set<(action: string, payload: any) => void> = new Set();
  private pingInterval: any = null;
  private autoReconnectTimeout: any = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private micStream: MediaStream | null = null;
  private audioProcessor: ScriptProcessorNode | null = null;

  public connectionState: HostConnectionState = {
    isConnected: false,
    isConnecting: false,
    serverUrl: getInitialServerUrl(),
    error: null,
    lastPingMs: 0,
  };

  constructor() {
    if (typeof window !== 'undefined') {
      // Auto connect to the user's active tunnel URL on app startup
      setTimeout(() => {
        const urlToUse = getInitialServerUrl();
        this.connectToHost(urlToUse);
      }, 300);
    }
  }

  public gatewayStatus: MobileGatewayStatus = {
    pairedDeviceName: 'غير متصل (بانتظار خادم ويندوز)',
    bluetoothMac: '--:--:--:--:--:--',
    isConnected: false,
    signalStrength: 0,
    batteryLevel: 0,
    carrierName: 'لا توجد شبكة',
    simStatus: 'no_sim',
    networkType: '4G LTE',
    audioProfile: 'Disconnected',
  };

  public getSavedSMS(): SMSMessage[] {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(STORAGE_KEY_SMS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public saveSMS(messages: SMSMessage[]) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY_SMS, JSON.stringify(messages));
    } catch (e) {
      console.warn('Failed to save SMS to localStorage:', e);
    }
  }

  public getSavedCallLogs(): CallLogItem[] {
    if (typeof window === 'undefined') return DEFAULT_SAMPLE_LOGS;
    try {
      const data = localStorage.getItem(STORAGE_KEY_LOGS);
      if (!data) {
        localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(DEFAULT_SAMPLE_LOGS));
        return DEFAULT_SAMPLE_LOGS;
      }
      return JSON.parse(data);
    } catch {
      return DEFAULT_SAMPLE_LOGS;
    }
  }

  public saveCallLogs(logs: CallLogItem[]) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(logs));
      this.notify('LOGS_UPDATED', logs);
    } catch (e) {
      console.warn('Failed to save call logs to localStorage:', e);
    }
  }

  public addCallLog(log: CallLogItem) {
    const current = this.getSavedCallLogs();
    const updated = [log, ...current];
    this.saveCallLogs(updated);
  }

  public deleteCallLog(id: string) {
    const current = this.getSavedCallLogs();
    const updated = current.filter((l) => l.id !== id);
    this.saveCallLogs(updated);
  }

  public clearCallLogs() {
    this.saveCallLogs([]);
  }

  // Connect to the Python Agent on Windows 11
  public connectToHost(url: string) {
    if (this.ws) {
      try {
        this.ws.onopen = null;
        this.ws.onerror = null;
        this.ws.onclose = null;
        this.ws.onmessage = null;
        this.ws.close();
      } catch (e) {
        console.warn('Previous WS close info:', e);
      }
      this.ws = null;
    }

    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }

    let cleanUrl = url.trim();
    if (cleanUrl.startsWith('https://')) {
      cleanUrl = cleanUrl.replace('https://', 'wss://');
    } else if (cleanUrl.startsWith('http://')) {
      cleanUrl = cleanUrl.replace('http://', 'ws://');
    } else if (!cleanUrl.startsWith('ws://') && !cleanUrl.startsWith('wss://')) {
      if (cleanUrl.includes('trycloudflare.com') || cleanUrl.includes('ngrok')) {
        cleanUrl = `wss://${cleanUrl}`;
      } else {
        cleanUrl = `ws://${cleanUrl}`;
      }
    }

    this.connectionState.isConnecting = true;
    this.connectionState.error = null;
    this.connectionState.serverUrl = cleanUrl;
    
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_URL, cleanUrl);
    }
    
    this.notify('HOST_CONNECTION_CHANGED', { ...this.connectionState });

    try {
      this.ws = new WebSocket(cleanUrl);

      this.ws.onopen = () => {
        this.connectionState.isConnected = true;
        this.connectionState.isConnecting = false;
        this.connectionState.error = null;
        this.gatewayStatus.isConnected = true;
        this.notify('HOST_CONNECTION_CHANGED', { ...this.connectionState });
        this.notify('STATUS_UPDATED', this.gatewayStatus);

        // Handshake
        this.sendToWs('HELLO', { client: 'RemoteDesk-OfficialClient', time: Date.now() });

        // Ping loop to measure real latency
        if (this.pingInterval) clearInterval(this.pingInterval);
        this.pingInterval = setInterval(() => {
          if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.sendToWs('PING', { time: Date.now() });
          }
        }, 4000);
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.handleHostMessage(message);
        } catch (err) {
          console.warn('Raw message received:', event.data);
        }
      };

      this.ws.onerror = () => {
        // Silently mark state as disconnected with friendly message
        console.warn('Telephony Bridge: Host unreachable or disconnected at', cleanUrl);
        const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
        let errorMsg = 'الخادم غير متصل حالياً. تأكد من تشغيل windows_agent.py ونفق Cloudflare.';
        if (isHttps && cleanUrl.startsWith('ws://')) {
          errorMsg = 'تنبيه: المتصفح يحظر اتصالات ws:// غير المشفرة على مواقع HTTPS. يرجى استخدام رابط wss:// المشفر.';
        }
        this.connectionState.error = errorMsg;
        this.connectionState.isConnecting = false;
        this.connectionState.isConnected = false;
        this.gatewayStatus.isConnected = false;
        this.notify('HOST_CONNECTION_CHANGED', { ...this.connectionState });
      };

      this.ws.onclose = () => {
        this.connectionState.isConnected = false;
        this.connectionState.isConnecting = false;
        this.gatewayStatus.isConnected = false;
        if (this.pingInterval) {
          clearInterval(this.pingInterval);
          this.pingInterval = null;
        }
        this.notify('HOST_CONNECTION_CHANGED', { ...this.connectionState });
      };
    } catch (e: any) {
      this.connectionState.error = e.message || 'فشل الاتصال';
      this.connectionState.isConnecting = false;
      this.notify('HOST_CONNECTION_CHANGED', { ...this.connectionState });
    }
  }

  public disconnectHost() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.connectionState.isConnected = false;
    this.connectionState.isConnecting = false;
    this.gatewayStatus.isConnected = false;
    this.notify('HOST_CONNECTION_CHANGED', { ...this.connectionState });
  }

  private handleHostMessage(msg: { type: string; payload: any }) {
    switch (msg.type) {
      case 'PONG':
        this.connectionState.lastPingMs = Date.now() - (msg.payload?.time || Date.now());
        this.notify('HOST_CONNECTION_CHANGED', { ...this.connectionState });
        break;

      case 'INCOMING_CALL':
        this.notify('INCOMING_CALL', {
          number: msg.payload.number,
          name: msg.payload.name || 'متصل محلي عبر الشريحة',
        });
        break;

      case 'CALL_STARTED':
        this.notify('CALL_STARTED', msg.payload);
        break;

      case 'CALL_ENDED':
        this.notify('CALL_HANGUP', msg.payload);
        break;

      case 'SMS_RECEIVED': {
        const current = this.getSavedSMS();
        const updated = [msg.payload, ...current];
        this.saveSMS(updated);
        this.notify('SMS_RECEIVED', msg.payload);
        break;
      }

      case 'GATEWAY_STATUS':
        this.gatewayStatus = { ...this.gatewayStatus, ...msg.payload };
        this.notify('STATUS_UPDATED', this.gatewayStatus);
        break;

      default:
        this.notify(msg.type, msg.payload);
    }
  }

  // Real actions executed on Windows 11 Phone Link
  public dialRealNumber(phoneNumber: string): boolean {
    if (this.connectionState.isConnected && this.ws?.readyState === WebSocket.OPEN) {
      this.sendToWs('DIAL_NUMBER', { number: phoneNumber });
      return true;
    }
    return false;
  }

  public hangupRealCall(): boolean {
    if (this.connectionState.isConnected && this.ws?.readyState === WebSocket.OPEN) {
      this.sendToWs('HANGUP_CALL', {});
      return true;
    }
    return false;
  }

  public answerRealCall(): boolean {
    if (this.connectionState.isConnected && this.ws?.readyState === WebSocket.OPEN) {
      this.sendToWs('ANSWER_CALL', {});
      return true;
    }
    return false;
  }

  public sendRealSMS(phoneNumber: string, message: string): boolean {
    if (this.connectionState.isConnected && this.ws?.readyState === WebSocket.OPEN) {
      this.sendToWs('SEND_SMS', { number: phoneNumber, message });
      return true;
    }
    return false;
  }

  // Real Microphone Audio Capture
  public async startMicrophoneCapture(onLevels?: (levels: number[]) => void): Promise<boolean> {
    try {
      this.micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioCtx();
      const source = this.audioContext.createMediaStreamSource(this.micStream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 32;
      source.connect(this.analyser);

      if (onLevels) {
        const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
        const updateWaveform = () => {
          if (!this.analyser) return;
          this.analyser.getByteFrequencyData(dataArray);
          // Convert to 7 frequency bands
          const levels: number[] = [];
          const step = Math.floor(dataArray.length / 7) || 1;
          for (let i = 0; i < 7; i++) {
            const val = dataArray[i * step] || 0;
            levels.push(Math.max(15, Math.floor((val / 255) * 100)));
          }
          onLevels(levels);
          requestAnimationFrame(updateWaveform);
        };
        requestAnimationFrame(updateWaveform);
      }

      return true;
    } catch (err) {
      console.warn('Microphone access denied or unavailable:', err);
      return false;
    }
  }

  public stopMicrophoneCapture() {
    if (this.micStream) {
      this.micStream.getTracks().forEach((track) => track.stop());
      this.micStream = null;
    }
    if (this.audioContext) {
      try {
        this.audioContext.close();
      } catch (e) {
        console.warn('AudioContext close notice:', e);
      }
      this.audioContext = null;
    }
    this.analyser = null;
  }

  private sendToWs(type: string, payload: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, payload }));
    }
  }

  public subscribe(callback: (action: string, payload: any) => void) {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  public emit(action: string, payload: any) {
    this.notify(action, payload);
  }

  private notify(action: string, payload: any) {
    this.listeners.forEach((fn) => {
      try {
        fn(action, payload);
      } catch (err) {
        console.warn('Listener dispatch notice:', err);
      }
    });
  }
}

export const telephonyBridge = new TelephonyBridgeService();
