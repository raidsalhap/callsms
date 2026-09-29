import { DeviceInfo, ClientPermissions, RemoteEventMessage, AuditLog } from '../types/remote';

// Unique channel name for this applet
const CHANNEL_NAME = 'remotedesk_signaling_bus';

export class SignalingBus {
  private channel: BroadcastChannel | null = null;
  private listeners: Set<(msg: RemoteEventMessage) => void> = new Set();
  private auditLogListeners: Set<(log: AuditLog) => void> = new Set();

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      this.channel = new BroadcastChannel(CHANNEL_NAME);
      this.channel.onmessage = (event) => {
        this.notifyListeners(event.data);
      };
    }
  }

  public subscribe(callback: (msg: RemoteEventMessage) => void) {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  public subscribeAudit(callback: (log: AuditLog) => void) {
    this.auditLogListeners.add(callback);
    return () => {
      this.auditLogListeners.delete(callback);
    };
  }

  public emit(message: RemoteEventMessage) {
    // Notify local in-memory listeners
    this.notifyListeners(message);

    // Broadcast to other tabs/windows if available
    try {
      if (this.channel) {
        this.channel.postMessage(message);
      }
    } catch (err) {
      console.warn('Signaling broadcast error:', err);
    }
  }

  public emitAudit(log: AuditLog) {
    this.auditLogListeners.forEach((fn) => {
      try {
        fn(log);
      } catch (err) {
        console.warn('Audit listener dispatch notice:', err);
      }
    });
  }

  private notifyListeners(message: RemoteEventMessage) {
    this.listeners.forEach((fn) => {
      try {
        fn(message);
      } catch (err) {
        console.warn('Remote event listener notice:', err);
      }
    });
  }

  public destroy() {
    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }
    this.listeners.clear();
    this.auditLogListeners.clear();
  }
}

export const signalingBus = new SignalingBus();

// Initial Mock Devices for the Admin Fleet
export const INITIAL_DEVICES: DeviceInfo[] = [
  {
    id: '849-203-118',
    name: 'حاسوب العميل التجريبي (هذا الجهاز)',
    ip: '192.168.1.45',
    os: 'windows',
    osVersion: 'Windows 11 Pro 23H2',
    status: 'online',
    lastSeen: 'الآن (متصل)',
    resolution: '1920x1080 @ 60Hz',
    cpuUsage: 28,
    ramUsage: 45,
    unattendedAccess: false,
    pin: '749210',
  },
  {
    id: '412-889-021',
    name: 'خادم قواعد البيانات (الفرع الرئيسي)',
    ip: '10.0.4.15',
    os: 'linux',
    osVersion: 'Ubuntu 24.04 LTS Server',
    status: 'online',
    lastSeen: 'منذ دقيقتين',
    resolution: '1920x1080 (Headless)',
    cpuUsage: 14,
    ramUsage: 62,
    unattendedAccess: true,
    pin: '882194',
  },
  {
    id: '633-104-552',
    name: 'جهاز قسم الحسابات - المحاسب أحمد',
    ip: '192.168.1.112',
    os: 'windows',
    osVersion: 'Windows 10 Enterprise',
    status: 'busy',
    lastSeen: 'في جلسة دعم سابقة',
    resolution: '2560x1440 @ 60Hz',
    cpuUsage: 58,
    ramUsage: 78,
    unattendedAccess: false,
    pin: '109348',
  },
  {
    id: '204-771-399',
    name: 'محطة التصميم والجرافيك (Mac Studio)',
    ip: '192.168.1.80',
    os: 'macos',
    osVersion: 'macOS Sonoma 14.5',
    status: 'online',
    lastSeen: 'منذ 5 دقائق',
    resolution: '3840x2160 (Retina 4K)',
    cpuUsage: 35,
    ramUsage: 54,
    unattendedAccess: true,
    pin: '445912',
  },
];
