/**
 * CodeGen 布局工具函数
 */

import {
  HEADER_HEIGHT,
  BODY_PADDING_V,
  MIN_CODE_LINES,
  MAX_WIN_H,
  LINE_HEIGHT_OFFSET,
  MAX_FILENAME_LENGTH,
  MAX_WATERMARK_LENGTH,
  FILENAME_INVALID_CHARS,
} from '../constants';

// ---------------------------------------------------------------------------
// 类型定义
// ---------------------------------------------------------------------------

export interface Padding {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

// ---------------------------------------------------------------------------
// 布局计算
// ---------------------------------------------------------------------------

/**
 * 计算代码窗口自适应高度
 */
export function calcAutoHeight(
  codeText: string,
  showHeader: boolean,
  fontSize: number,
): number {
  const lineHeight = fontSize + LINE_HEIGHT_OFFSET;
  const lines = codeText.split('\n').length;
  const headerH = showHeader ? HEADER_HEIGHT : 0;
  const total =
    headerH + BODY_PADDING_V + Math.max(MIN_CODE_LINES, lines) * lineHeight;
  return Math.min(MAX_WIN_H, total);
}

/**
 * 检查是否为统一边距
 */
export function isUniformPadding(p: Padding): boolean {
  return p.top === p.right && p.right === p.bottom && p.bottom === p.left;
}

// ---------------------------------------------------------------------------
// 输入验证
// ---------------------------------------------------------------------------

/**
 * 清理并验证文件名
 */
export function sanitizeFileName(name: string): string {
  return name
    .slice(0, MAX_FILENAME_LENGTH)
    .replace(FILENAME_INVALID_CHARS, '');
}

/**
 * 清理并验证水印文本
 */
export function sanitizeWatermarkText(text: string): string {
  return text.slice(0, MAX_WATERMARK_LENGTH).replace(/[\n\r]/g, '');
}

/**
 * 验证颜色格式是否有效
 */
export function isValidColor(color: string): boolean {
  // 支持 #RRGGBB 格式
  if (/^#[0-9A-Fa-f]{6}$/.test(color)) {
    return true;
  }
  // 支持 rgba() 格式
  if (
    /^rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(,\s*[\d.]+)?\s*\)$/.test(color)
  ) {
    return true;
  }
  return false;
}

/**
 * 安全获取颜色值
 */
export function safeColor(color: string, fallback: string): string {
  return isValidColor(color) ? color : fallback;
}
