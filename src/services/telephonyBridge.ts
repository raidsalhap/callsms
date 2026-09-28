import { ActiveCall, MobileGatewayStatus, SMSMessage, CallLogItem } from '../types/telephony';

const BRIDGE_CHANNEL = 'telephony_bridge_channel';

export interface HostConnectionState {
  isConnected: boolean;
  isConnecting: boolean;
  serverUrl: string;
  error: string | null;
  mode: 'real' | 'simulation';
  lastPingMs: number;
}

export class TelephonyBridgeService {
  private channel: BroadcastChannel | null = null;
  private ws: WebSocket | null = null;
  private listeners: Set<(action: string, payload: any) => void> = new Set();
  private pingInterval: any = null;
  private mediaStream: MediaStream | null = null;

  public connectionState: HostConnectionState = {
    isConnected: false,
    isConnecting: false,
    serverUrl: 'ws://localhost:8765',
    error: null,
    mode: 'simulation',
    lastPingMs: 0,
  };

  public gatewayStatus: MobileGatewayStatus = {
    pairedDeviceName: 'Galaxy S21 (بوابة الاتصال المحلية)',
    bluetoothMac: 'A4:C3:F0:89:12:DE',
    isConnected: false,
    signalStrength: 85,
    batteryLevel: 92,
    carrierName: 'STC / Vodafone (محلي)',
    simStatus: 'ready',
    networkType: '4G LTE',
    audioProfile: 'HFP (Hands-Free Profile)',
  };

  public initialSMS: SMSMessage[] = [
    {
      id: 'sms-1',
      sender: 'البنك الأهلي',
      recipient: 'جهازي البعيد',
      body: 'رمز التحقق لتسجيل الدخول إلى حسابك هو 849201. صالح لمدة 5 دقائق.',
      timestamp: '14:05',
      direction: 'inbound',
      status: 'received',
    },
    {
      id: 'sms-2',
      sender: '+966501234567',
      recipient: 'جهازي البعيد',
      body: 'السلام عليكم مهندس أيمن، هل الشريحة تعمل بشكل جيد الآن؟',
      timestamp: '13:45',
      direction: 'inbound',
      status: 'received',
    },
  ];

  public initialCallLogs: CallLogItem[] = [
    {
      id: 'log-1',
      number: '+966501234567',
      name: 'م. أحمد (الرياض)',
      type: 'incoming',
      time: '13:40',
      duration: '02:45',
    },
    {
      id: 'log-2',
      number: '920000000',
      name: 'خدمة العملاء',
      type: 'outgoing',
      time: '12:15',
      duration: '01:10',
    },
  ];

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      this.channel = new BroadcastChannel(BRIDGE_CHANNEL);
      this.channel.onmessage = (event) => {
        this.notify(event.data.action, event.data.payload);
      };
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

    this.connectionState.isConnecting = true;
    this.connectionState.error = null;
    this.connectionState.serverUrl = url;
    this.notify('HOST_CONNECTION_CHANGED', { ...this.connectionState });

    try {
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        this.connectionState.isConnected = true;
        this.connectionState.isConnecting = false;
        this.connectionState.mode = 'real';
        this.connectionState.error = null;
        this.gatewayStatus.isConnected = true;
        this.notify('HOST_CONNECTION_CHANGED', { ...this.connectionState });
        this.notify('STATUS_UPDATED', this.gatewayStatus);

        // Send handshake
        this.sendToWs('HELLO', { client: 'RemoteDesk-WebClient', time: Date.now() });

        // Ping loop
        this.pingInterval = setInterval(() => {
          if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            const start = Date.now();
            this.sendToWs('PING', { time: start });
          }
        }, 5000);
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.handleHostMessage(message);
        } catch (err) {
          console.warn('Non-JSON ws message received:', event.data);
        }
      };

      this.ws.onerror = (err) => {
        console.error('WS Connection error:', err);
        this.connectionState.error = 'تعذر الاتصال بسيرفر الويندوز. تأكد من تشغيل السكريبت windows_agent.py على جهازك.';
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
    this.connectionState.mode = 'simulation';
    this.gatewayStatus.isConnected = false;
    this.notify('HOST_CONNECTION_CHANGED', { ...this.connectionState });
  }

  // Handle messages coming from Windows 11 Python Agent
  private handleHostMessage(msg: { type: string; payload: any }) {
    switch (msg.type) {
      case 'PONG':
        this.connectionState.lastPingMs = Date.now() - (msg.payload.time || Date.now());
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

      case 'SMS_RECEIVED':
        this.notify('SMS_RECEIVED', msg.payload);
        break;

      case 'GATEWAY_STATUS':
        this.gatewayStatus = { ...this.gatewayStatus, ...msg.payload };
        this.notify('STATUS_UPDATED', this.gatewayStatus);
        break;

      default:
        this.notify(msg.type, msg.payload);
    }
  }

  // Send an action to Windows 11
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
    try {
      this.channel?.postMessage({ action, payload });
    } catch (e) {
      console.warn('Broadcast error:', e);
    }
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
