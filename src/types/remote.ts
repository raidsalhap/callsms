export type DeviceStatus = 'online' | 'busy' | 'offline' | 'connecting';

export type OperatingSystem = 'windows' | 'macos' | 'linux';

export interface DeviceInfo {
  id: string;
  name: string;
  ip: string;
  os: OperatingSystem;
  osVersion: string;
  status: DeviceStatus;
  lastSeen: string;
  resolution: string;
  cpuUsage: number;
  ramUsage: number;
  unattendedAccess: boolean;
  pin: string;
}

export interface ClientPermissions {
  allowControl: boolean; // Mouse & Keyboard
  allowClipboard: boolean;
  allowFileTransfer: boolean;
  allowTerminal: boolean;
  allowAudio: boolean;
}

export interface RemoteMousePosition {
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  isDown?: boolean;
  button?: number;
  lastUpdated?: number;
}

export interface SessionMetrics {
  fps: number;
  latencyMs: number;
  bitrateKbps: number;
  packetLoss: number;
  codec: string;
  durationSeconds: number;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  type: 'connect' | 'disconnect' | 'input' | 'file' | 'terminal' | 'security' | 'permission';
  actor: 'admin' | 'client' | 'system';
  message: string;
  severity?: 'info' | 'warning' | 'alert';
}

export interface RemoteFile {
  name: string;
  path: string;
  size: string;
  type: 'folder' | 'file' | 'image' | 'code' | 'archive';
  modified: string;
  content?: string;
}

export interface RemoteEventMessage {
  type:
    | 'CLIENT_REGISTER'
    | 'CONNECT_REQUEST'
    | 'CONNECT_ACCEPT'
    | 'CONNECT_REJECT'
    | 'DISCONNECT'
    | 'MOUSE_MOVE'
    | 'MOUSE_CLICK'
    | 'KEY_INPUT'
    | 'PERMISSIONS_UPDATE'
    | 'TERMINAL_COMMAND'
    | 'TERMINAL_OUTPUT'
    | 'CLIPBOARD_SYNC'
    | 'STREAM_TYPE_UPDATE'
    | 'PING'
    | 'PONG';
  sender: 'admin' | 'client';
  payload?: any;
}
