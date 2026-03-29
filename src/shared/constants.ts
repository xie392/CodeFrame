// CodeFrame - 全局常量定义

// 扩展名称
export const EXTENSION_NAME = 'CodeFrame';

// 截图模式
export const CAPTURE_MODES = {
  REGION: 'region',
  VISIBLE: 'visible',
  FULLPAGE: 'fullpage',
  DESKTOP: 'desktop',
  DELAYED: 'delayed',
} as const;

// 延迟时间选项（秒）
export const DELAY_OPTIONS = [3, 5, 10] as const;

// 导出格式
export const EXPORT_FORMATS = {
  PNG: 'png',
  JPG: 'jpg',
  WEBP: 'webp',
  SVG: 'svg',
} as const;

// 默认设置
export const DEFAULT_SETTINGS = {
  defaultFormat: 'png',
  defaultQuality: 100,
  language: 'zh-CN',
} as const;

// 存储键名
export const STORAGE_KEYS = {
  SETTINGS: 'codeframe_settings',
  RECENT_CODES: 'codeframe_recent_codes',
  CUSTOM_THEMES: 'codeframe_custom_themes',
  CAPTURE_RESULT: 'codeframe_capture_result',
} as const;
