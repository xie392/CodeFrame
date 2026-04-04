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

// 原生快捷键默认值（Chrome 扩展命令）
export const NATIVE_SHORTCUTS_DEFAULT = {
  captureVisible: 'Alt+Shift+S',
  captureRegion: 'Alt+Shift+R',
  captureFullpage: 'Alt+Shift+F',
  captureDesktop: 'Alt+Shift+D',
} as const;

// 自定义快捷键默认值
export const CUSTOM_SHORTCUTS_DEFAULT = {
  captureVisible: 'Alt+S',
  captureRegion: 'Alt+R',
  captureFullpage: 'Alt+F',
  captureDesktop: 'Alt+D',
} as const;

// 快捷键命令标签
export const SHORTCUT_COMMAND_LABELS: Record<string, string> = {
  captureVisible: '可视区域截图',
  captureRegion: '区域选择截图',
  captureFullpage: '整页截图',
  captureDesktop: '桌面截图',
};

// 系统保留快捷键（不可设置）
export const SYSTEM_RESERVED_SHORTCUTS = [
  // 标签页管理
  'Ctrl+T',
  'Ctrl+W',
  'Ctrl+Shift+T',
  'Ctrl+Tab',
  'Ctrl+Shift+Tab',
  'Ctrl+1',
  'Ctrl+2',
  'Ctrl+3',
  'Ctrl+4',
  'Ctrl+5',
  'Ctrl+6',
  'Ctrl+7',
  'Ctrl+8',
  'Ctrl+9',
  // 页面导航
  'Ctrl+L',
  'Ctrl+D',
  'Ctrl+H',
  'Ctrl+J',
  'Ctrl+K',
  'F6',
  'Alt+Left',
  'Alt+Right',
  'Alt+Home',
  // 刷新和停止
  'F5',
  'Ctrl+R',
  'Ctrl+Shift+R',
  'Escape',
  // 开发工具
  'F12',
  'Ctrl+Shift+I',
  'Ctrl+Shift+J',
  'Ctrl+Shift+C',
  'Ctrl+U',
  // 缩放
  'Ctrl+Plus',
  'Ctrl+Minus',
  'Ctrl+0',
  // 全屏
  'F11',
  // 查找
  'Ctrl+F',
  'Ctrl+G',
  'Ctrl+Shift+G',
  // 打印
  'Ctrl+P',
  // 保存
  'Ctrl+S',
  // 剪贴板
  'Ctrl+C',
  'Ctrl+X',
  'Ctrl+V',
  'Ctrl+A',
  'Ctrl+Z',
  'Ctrl+Y',
  'Ctrl+Shift+Z',
  // 其他
  'Ctrl+Shift+Delete',
  'Ctrl+Shift+M',
  'Alt+F4',
] as const;

// macOS 特殊键映射
export const MAC_KEY_MAPPING: Record<string, string> = {
  Ctrl: '⌘',
  Alt: '⌥',
  Shift: '⇧',
  Meta: '⌘',
};
