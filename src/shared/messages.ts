// CodeFrame - 消息类型定义

// 消息类型
export type MessageType =
  | 'CAPTURE_REQUEST'
  | 'CAPTURE_RESULT'
  | 'CAPTURE_REGION'
  | 'CANCEL_CAPTURE'
  | 'START_CAPTURE'
  | 'CAPTURE_FULLPAGE_START'
  | 'CAPTURE_FULLPAGE_RESULT'
  | 'START_DELAYED_CAPTURE'
  | 'CAPTURE_DELAYED_READY'
  | 'CANCEL_DELAYED_CAPTURE'
  | 'EDIT_IMAGE'
  | 'GENERATE_CODE'
  | 'EXPORT_IMAGE'
  | 'SAVE_SETTINGS'
  | 'GET_SETTINGS';

// 基础消息接口
export interface Message<T = unknown> {
  type: MessageType;
  payload: T;
  timestamp: number;
}

// 创建消息工厂函数
export function createMessage<T>(type: MessageType, payload: T): Message<T> {
  return {
    type,
    payload,
    timestamp: Date.now(),
  };
}

// 截图请求消息
export interface CaptureRequestPayload {
  mode: 'region' | 'visible' | 'fullpage' | 'desktop' | 'delayed';
  delay?: number;
  quality?: number;
}

// 截图结果消息
export interface CaptureResultPayload {
  success: boolean;
  imageData?: string;
  error?: string;
}

// 延时截图启动消息
export interface StartDelayedCapturePayload {
  delay: number; // 延时秒数
}

// 区域截图选区坐标（复用 RegionRect）
export type { RegionRect as CaptureRegionPayload } from './types';
