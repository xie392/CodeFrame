/**
 * 颜色工具函数
 */

/** hex 颜色 (#RRGGBB) 转 rgba 字符串 */
export function hexToRgba(
  hex: string,
  alpha: number
): string {
  if (!hex.startsWith('#') || hex.length < 7) {
    return `rgba(0,0,0,${alpha})`;
  }
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
