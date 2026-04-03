/**
 * Editor 模块常量定义
 */

// ---------------------------------------------------------------------------
// 图片类型
// ---------------------------------------------------------------------------

export const ACCEPTED_IMAGE_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
] as const;

// ---------------------------------------------------------------------------
// 缩放与尺寸限制
// ---------------------------------------------------------------------------

export const MIN_SCALE = 0.25;
export const MAX_SCALE = 4;
export const MAX_IMG_W = 800;
export const MAX_IMG_H = 600;

// ---------------------------------------------------------------------------
// 颜色预设
// ---------------------------------------------------------------------------

export const PRESET_COLORS = [
  '#EF4444', // 红
  '#F59E0B', // 橙
  '#EAB308', // 黄
  '#22C55E', // 绿
  '#3B82F6', // 蓝
  '#8B5CF6', // 紫
  '#FFFFFF', // 白
  '#000000', // 黑
] as const;

// ---------------------------------------------------------------------------
// 默认样式
// ---------------------------------------------------------------------------

import type { ArrowStyle, RectBorderStyle, ImageFrameSettings } from './types';

export const DEFAULT_ARROW_STYLE: {
  color: string;
  strokeWidth: number;
  headSize: number;
  style: ArrowStyle;
} = {
  color: '#EF4444',
  strokeWidth: 2,
  headSize: 12,
  style: 'single',
};

export const DEFAULT_RECT_STYLE: {
  color: string;
  strokeWidth: number;
  fillOpacity: number;
  borderStyle: RectBorderStyle;
} = {
  color: '#EF4444',
  strokeWidth: 2,
  fillOpacity: 0,
  borderStyle: 'solid',
};

export const DEFAULT_TEXT_STYLE: {
  color: string;
  fontSize: number;
  fontWeight: 'normal' | 'bold';
  fontStyle: 'normal' | 'italic';
} = {
  color: '#EF4444',
  fontSize: 24,
  fontWeight: 'normal',
  fontStyle: 'normal',
};

export const DEFAULT_MOSAIC_STYLE: {
  blockSize: number;
  opacity: number;
} = {
  blockSize: 10,
  opacity: 100,
};

export const DEFAULT_FRAME_SETTINGS: ImageFrameSettings = {
  background: {
    type: 'linear',
    color: '#FFFFFF',
    gradientColors: ['#E0F7FA', '#E1BEE7'],
    gradientAngle: 135,
  },
  padding: {
    top: 40,
    right: 40,
    bottom: 40,
    left: 40,
    linked: true,
  },
  borderRadius: {
    unit: 'px' as const,
    topLeft: 12,
    topRight: 12,
    bottomRight: 12,
    bottomLeft: 12,
    linked: true,
  },
  imageRadius: {
    unit: 'px' as const,
    topLeft: 0,
    topRight: 0,
    bottomRight: 0,
    bottomLeft: 0,
    linked: true,
  },
  shadow: {
    enabled: true,
    color: '#000000',
    blur: 20,
    offsetX: 0,
    offsetY: 10,
  },
  imageShadow: {
    enabled: false,
    color: '#000000',
    blur: 20,
    offsetX: 0,
    offsetY: 10,
  },
  aspectRatio: 'auto',
  customAspectRatio: { width: 0, height: 0 },
  windowControl: {
    enabled: false,
    style: 'macos',
  },
  watermark: {
    enabled: false,
    text: '',
    position: 'bottom-right',
    opacity: 50,
    fontSize: 14,
    imageUrl: null,
    imageSize: 64,
  },
};

// ---------------------------------------------------------------------------
// 背景预设
// ---------------------------------------------------------------------------

export const BACKGROUND_PRESETS = [
  { name: 'backgroundPreset.transparent', type: 'solid' as const, color: 'transparent' },
  { name: 'backgroundPreset.white', type: 'solid' as const, color: '#FFFFFF' },
  { name: 'backgroundPreset.black', type: 'solid' as const, color: '#000000' },
  {
    name: 'backgroundPreset.sunset',
    type: 'linear' as const,
    gradientColors: ['#FF512F', '#DD2476'] as [string, string],
    gradientAngle: 135,
  },
  {
    name: 'backgroundPreset.ocean',
    type: 'linear' as const,
    gradientColors: ['#2193b0', '#6dd5ed'] as [string, string],
    gradientAngle: 135,
  },
  {
    name: 'backgroundPreset.forest',
    type: 'linear' as const,
    gradientColors: ['#134E5E', '#71B280'] as [string, string],
    gradientAngle: 135,
  },
  {
    name: 'backgroundPreset.purple',
    type: 'linear' as const,
    gradientColors: ['#667eea', '#764ba2'] as [string, string],
    gradientAngle: 135,
  },
  {
    name: 'backgroundPreset.peach',
    type: 'linear' as const,
    gradientColors: ['#FFB88C', '#DE6262'] as [string, string],
    gradientAngle: 135,
  },
];

// ---------------------------------------------------------------------------
// 阴影预设
// ---------------------------------------------------------------------------

export const SHADOW_PRESETS = [
  { name: 'shadowPreset.none', enabled: false, blur: 0, offsetX: 0, offsetY: 0 },
  { name: 'shadowPreset.light', enabled: true, blur: 10, offsetX: 0, offsetY: 4 },
  { name: 'shadowPreset.medium', enabled: true, blur: 20, offsetX: 0, offsetY: 10 },
  { name: 'shadowPreset.strong', enabled: true, blur: 40, offsetX: 0, offsetY: 20 },
];

export const IMAGE_SHADOW_PRESETS = [
  { name: 'shadowPreset.none', enabled: false, blur: 0, offsetX: 0, offsetY: 0 },
  { name: 'shadowPreset.light', enabled: true, blur: 10, offsetX: 0, offsetY: 4 },
  { name: 'shadowPreset.medium', enabled: true, blur: 20, offsetX: 0, offsetY: 10 },
  { name: 'shadowPreset.strong', enabled: true, blur: 40, offsetX: 0, offsetY: 20 },
];

// ---------------------------------------------------------------------------
// 比例预设
// ---------------------------------------------------------------------------

export const ASPECT_RATIO_PRESETS = [
  // 原始比例
  { name: 'aspectRatio.auto', value: 'auto' },
  // 基础比例
  { name: '1:1', value: '1:1' },
  { name: '4:3', value: '4:3' },
  { name: '3:2', value: '3:2' },
  { name: '2:3', value: '2:3' },
  { name: '5:4', value: '5:4' },
  { name: '16:9', value: '16:9' },
  { name: '16:10', value: '16:10' },
  { name: '21:9', value: '21:9' },
  // 社交媒体
  { name: '9:16', value: '9:16' },
  { name: '4:5', value: '4:5' },
  { name: '3:4', value: '3:4' },
  { name: '1.91:1', value: '1.91:1' },
  // 设备屏幕
  { name: 'iPhone', value: 'device:9:19.5' },
  { name: 'iPhone SE', value: 'device:16:9' },
  { name: 'aspectRatio.androidFlagship', value: 'device:9:21' },
  { name: 'iPad', value: 'device:3:4' },
  { name: 'aspectRatio.androidTablet', value: 'device:16:10' },
  // 自定义
  { name: 'aspectRatio.custom', value: 'custom' },
];

// ---------------------------------------------------------------------------
// 控制点与光标
// ---------------------------------------------------------------------------

export const HANDLE_RADIUS = 6;
export const MIN_CROP_SIZE = 10;

// 矩形控制点光标映射
export const RECT_CURSOR_MAP: Record<string, string> = {
  none: 'default',
  move: 'move',
  'resize-tl': 'nwse-resize',
  'resize-tr': 'nesw-resize',
  'resize-bl': 'nesw-resize',
  'resize-br': 'nwse-resize',
  'resize-t': 'ns-resize',
  'resize-b': 'ns-resize',
  'resize-l': 'ew-resize',
  'resize-r': 'ew-resize',
};

// 文字控制点光标映射
export const TEXT_CURSOR_MAP: Record<string, string> = {
  none: 'default',
  move: 'move',
  'resize-tl': 'nwse-resize',
  'resize-tr': 'nesw-resize',
  'resize-bl': 'nesw-resize',
  'resize-br': 'nwse-resize',
};

// 马赛克控制点光标映射（与矩形相同）
export const MOSAIC_CURSOR_MAP: Record<string, string> = RECT_CURSOR_MAP;

// 裁剪框光标映射（与矩形相同）
export const CROP_CURSOR_MAP: Record<string, string> = RECT_CURSOR_MAP;
