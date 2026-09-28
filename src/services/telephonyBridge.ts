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

const DEFAULT_TUNNEL_URL = 'wss://luther-boolean-ground-pockets.trycloudflare.com';

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
    serverUrl: typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_URL) || DEFAULT_TUNNEL_URL : DEFAULT_TUNNEL_URL,
    error: null,
    lastPingMs: 0,
  };

  constructor() {
    if (typeof window !== 'undefined') {
      // Auto connect to the user's active tunnel URL on app startup
      setTimeout(() => {
        const urlToUse = localStorage.getItem(STORAGE_KEY_URL) || DEFAULT_TUNNEL_URL;
        this.connectToHost(urlToUse);
      }, 500);
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
      console.error(e);
    }
  }

  public getSavedCallLogs(): CallLogItem[] {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(STORAGE_KEY_LOGS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public saveCallLogs(logs: CallLogItem[]) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(logs));
    } catch (e) {
      console.error(e);
    }
  }

  // Connect to the Python Agent on Windows 11
  public connectToHost(url: string) {
    if (this.ws) {
      try {
        this.ws.close();
      } catch (e) {
        console.error(e);
      }
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

      this.ws.onerror = (err) => {
        console.error('WS Connection error:', err);
        const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
        let errorMsg = 'تعذر الاتصال بخادم ويندوز 11. تأكد من تشغيل سكريبت windows_agent.py على جهازك.';
        if (isHttps && cleanUrl.startsWith('ws://')) {
          errorMsg = 'تنبيه أمني: المتصفح يحظر اتصالات ws:// غير المشفرة على مواقع HTTPS. يرجى استخدام نفق مشفر wss:// (مثل Cloudflare Tunnel أو ngrok) للربط من خارج الشبكة.';
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
        clearInterval(this.pingInterval);
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
        console.error(e);
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
        console.error(err);
      }
    });
  }
}

export const telephonyBridge = new TelephonyBridgeService();
