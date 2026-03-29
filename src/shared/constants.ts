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

// 区域截图配置
export const REGION_CAPTURE = {
  MIN_SELECTION_SIZE: 10,    // 最小选区尺寸（CSS 像素）
  OVERLAY_OPACITY: 0.4,      // 遮罩透明度
  BORDER_COLOR: '#10B981',   // 选区边框颜色（设计系统强调色）
  BORDER_WIDTH: 1,           // 选区边框宽度
  CORNER_SIZE: 4,            // 四角控制点尺寸
  LABEL_BG_COLOR: '#1F1F1F', // 尺寸标注背景色
  LABEL_TEXT_COLOR: '#FAFAFA', // 尺寸标注文字颜色
  LABEL_FONT_SIZE: 12,       // 尺寸标注字体大小
  LABEL_MIN_WIDTH: 100,      // 显示标注的最小选区宽度
  LABEL_MIN_HEIGHT: 40,      // 显示标注的最小选区高度
} as const;
