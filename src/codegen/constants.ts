/**
 * CodeGen 模块常量定义
 */

// ---------------------------------------------------------------------------
// 默认值
// ---------------------------------------------------------------------------

export const DEFAULT_CODE = `const greet = (name) => {
  return \`Hello, \${name}!\`;
};

export default greet;`;

export const DEFAULT_PADDING = {
  top: 40,
  right: 40,
  bottom: 40,
  left: 40,
} as const;

export const DEFAULT_OUTER_BORDER_RADIUS = 16;
export const DEFAULT_INNER_BORDER_RADIUS = 12;

// ---------------------------------------------------------------------------
// 尺寸限制
// ---------------------------------------------------------------------------

export const MIN_SCALE = 0.25;
export const MAX_SCALE = 4;
export const MIN_WIN_W = 320;
export const MAX_WIN_W = 1200;
export const MAX_WIN_H = 800;

export const HEADER_HEIGHT = 40;
export const BODY_PADDING_V = 40;
export const MIN_CODE_LINES = 1;

export const MAX_PADDING_VALUE = 120;
export const MAX_BORDER_RADIUS = 30;

// ---------------------------------------------------------------------------
// 布局计算
// ---------------------------------------------------------------------------

export const LINE_HEIGHT_OFFSET = 7; // 行高 = 字号 + 7px 间距
export const ZOOM_FACTOR_OUT = 0.92;
export const ZOOM_FACTOR_IN = 1.08;
export const DRAG_THRESHOLD_PX = 8; // 拖拽判定阈值
export const COPIED_FEEDBACK_DURATION_MS = 2000; // 复制成功提示持续时间

// ---------------------------------------------------------------------------
// 字体配置
// ---------------------------------------------------------------------------

export const FONT_OPTIONS = [
  {
    id: 'jetbrains',
    label: 'JetBrains Mono',
    family: "'JetBrains Mono', monospace",
  },
  {
    id: 'fira-code',
    label: 'Fira Code',
    family: "'Fira Code', monospace",
  },
  {
    id: 'source-code-pro',
    label: 'Source Code Pro',
    family: "'Source Code Pro', monospace",
  },
  {
    id: 'ibm-plex',
    label: 'IBM Plex Mono',
    family: "'IBM Plex Mono', monospace",
  },
] as const;

export type FontOption = (typeof FONT_OPTIONS)[number];

// ---------------------------------------------------------------------------
// 输入验证
// ---------------------------------------------------------------------------

export const MAX_FILENAME_LENGTH = 50;
export const MAX_WATERMARK_LENGTH = 30;

// 文件名非法字符正则
export const FILENAME_INVALID_CHARS = /[<>:"/\\|?*]/g;

// ---------------------------------------------------------------------------
// 样式常量
// ---------------------------------------------------------------------------

export const MAIN_CONTAINER_STYLE = {
  background:
    'linear-gradient(180deg, #F0F0F8 0%, #EAEAF2 50%, #E0E0EA 100%)',
} as const;

export const PANEL_STYLE = {
  backgroundColor: '#FFFFFF',
  border: '1px solid rgba(0,0,0,0.06)',
} as const;

export const CANVAS_STYLE = {
  backgroundColor: '#E8E8F0',
} as const;
