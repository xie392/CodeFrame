// CodeFrame - 全局常量定义

// 扩展名称
export const EXTENSION_NAME = 'CodeFrame';

// 扩展版本
export const EXTENSION_VERSION = '0.1.0';

// 扩展作者
export const EXTENSION_AUTHOR = 'xie392';

// 仓库地址
export const REPOSITORY_URL = 'https://github.com/xie392/CodeFrame';

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
} as const;

// 导出格式中文标签
export const EXPORT_FORMAT_LABELS: Record<string, string> = {
  png: 'PNG',
  jpg: 'JPG',
  webp: 'WEBP',
};

// 截图质量选项
export const QUALITY_OPTIONS = {
  STANDARD: '1x',
  HIGH: '2x',
  ULTRA: '3x',
} as const;

// 截图质量中文标签
export const QUALITY_LABELS: Record<string, string> = {
  '1x': '标准',
  '2x': '高清',
  '3x': '超高清',
};

// 语言选项
export const LANGUAGE_OPTIONS = {
  ZH_CN: 'zh-CN',
  EN_US: 'en-US',
} as const;

// 语言中文标签
export const LANGUAGE_LABELS: Record<string, string> = {
  'zh-CN': '简体中文',
  'en-US': 'English',
};

// 历史保留天数选项
export const HISTORY_RETENTION_OPTIONS = {
  DAYS_7: 7,
  DAYS_30: 30,
  DAYS_90: 90,
  FOREVER: -1,
} as const;

// 历史保留天数中文标签
export const HISTORY_RETENTION_LABELS: Record<string, string> = {
  '7': '7天',
  '30': '30天',
  '90': '90天',
  '-1': '永久保存',
};

// 代码主题选项
export const CODE_THEME_OPTIONS = [
  { value: 'github-dark', label: 'GitHub 暗色' },
  { value: 'one-dark', label: 'One Dark' },
  { value: 'nord', label: 'Nord' },
  { value: 'dracula', label: 'Dracula' },
  { value: 'monokai', label: 'Monokai' },
  { value: 'solarized-dark', label: 'Solarized Dark' },
] as const;

// 默认设置
export const DEFAULT_SETTINGS = {
  // 通用设置
  defaultFormat: 'png',
  quality: '2x',
  language: 'zh-CN',
  
  // 操作历史
  saveOperationHistory: true,
  
  // 截图设置
  delayTime: 3,
  historyRetention: 30,
  
  // 水印设置
  watermarkEnabled: false,
  watermarkText: '',
  watermarkOpacity: 50,
  
  // 代码美化设置
  codeTheme: 'github-dark',
  codeFontSize: 14,
  codeShowLineNumbers: true,
} as const;

// 存储键名
export const STORAGE_KEYS = {
  SETTINGS: 'codeframe_settings',
  OPERATION_HISTORY: 'codeframe_operation_history',
  RECENT_CODES: 'codeframe_recent_codes',
  CUSTOM_THEMES: 'codeframe_custom_themes',
  CAPTURE_RESULT: 'codeframe_capture_result',
} as const;

// 整页截图配置
export const FULLPAGE_CAPTURE = {
  OVERLAP_HEIGHT: 100,
  MAX_HEIGHT: 20000,
  SCROLL_DELAY: 500,
} as const;

// 区域截图配置
export const REGION_CAPTURE = {
  MIN_SELECTION_SIZE: 10,
  OVERLAY_OPACITY: 0.4,
  BORDER_COLOR: '#10B981',
  BORDER_WIDTH: 1,
  CORNER_SIZE: 4,
  LABEL_BG_COLOR: '#1F1F1F',
  LABEL_TEXT_COLOR: '#FAFAFA',
  LABEL_FONT_SIZE: 12,
  LABEL_MIN_WIDTH: 100,
  LABEL_MIN_HEIGHT: 40,
} as const;

// 延时截图配置
export const DELAYED_CAPTURE = {
  RING_SIZE: 80,
  RING_STROKE_WIDTH: 4,
  RING_COLOR: '#10B981',
  RING_WARN_COLOR: '#F59E0B',
  RING_TRACK_COLOR: 'rgba(255, 255, 255, 0.15)',
  OVERLAY_BG: 'rgba(0, 0, 0, 0.6)',
  COUNTDOWN_FONT_SIZE: 36,
  COUNTDOWN_COLOR: '#FAFAFA',
  HINT_TEXT: '取消 (Esc)',
  HINT_FONT_SIZE: 12,
  HINT_COLOR: '#6B7280',
} as const;

// 快捷键配置
export const SHORTCUTS = {
  SCREENSHOT: { key: 's', modifiers: ['Alt', 'Shift'] },
  CODEGEN: { key: 'c', modifiers: ['Alt', 'Shift'] },
} as const;
