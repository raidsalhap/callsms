import { ActiveCall, MobileGatewayStatus, SMSMessage, CallLogItem } from '../types/telephony';

const BRIDGE_CHANNEL = 'telephony_bridge_channel';

export class TelephonyBridgeService {
  private channel: BroadcastChannel | null = null;
  private listeners: Set<(action: string, payload: any) => void> = new Set();

  public gatewayStatus: MobileGatewayStatus = {
    pairedDeviceName: 'Galaxy S21 (بوابة الاتصال المحلية)',
    bluetoothMac: 'A4:C3:F0:89:12:DE',
    isConnected: true,
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
    {
      id: 'log-3',
      number: '+966559876543',
      name: 'رقم غير معروف',
      type: 'missed',
      time: '10:30',
      duration: '00:00',
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
