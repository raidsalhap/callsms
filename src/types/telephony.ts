export type CallState = 'idle' | 'ringing_incoming' | 'ringing_outgoing' | 'connected' | 'ended';

export interface MobileGatewayStatus {
  pairedDeviceName: string;
  bluetoothMac: string;
  isConnected: boolean;
  signalStrength: number; // 0 - 100%
  batteryLevel: number; // 0 - 100%
  carrierName: string;
  simStatus: 'ready' | 'no_sim' | 'locked';
  networkType: '4G LTE' | '5G' | '3G';
  audioProfile: 'HFP (Hands-Free Profile)' | 'A2DP' | 'Disconnected';
}

export interface ActiveCall {
  id: string;
  number: string;
  contactName?: string;
  direction: 'incoming' | 'outgoing';
  startTime: string;
  durationSeconds: number;
  isMuted: boolean;
  isHold: boolean;
  audioQuality: 'Excellent' | 'Good' | 'Fair';
  latencyMs: number;
}

export interface SMSMessage {
  id: string;
  sender: string;
  recipient: string;
  body: string;
  timestamp: string;
  direction: 'inbound' | 'outbound';
  status: 'delivered' | 'sent' | 'received';
}

export interface CallLogItem {
  id: string;
  number: string;
  name?: string;
  type: 'missed' | 'incoming' | 'outgoing';
  status?: 'answered' | 'missed' | 'rejected' | 'busy';
  time: string;
  duration: string;
  durationSeconds?: number;
  timestamp?: number;
}
