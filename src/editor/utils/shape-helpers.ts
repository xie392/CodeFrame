/**
 * 图形处理辅助函数
 * 包含点击检测、拖拽类型判断等功能
 */

import type { ArrowShape, RectShape, TextShape, MosaicShape, CropArea } from '../types';
import { HANDLE_RADIUS } from '../constants';

// ---------------------------------------------------------------------------
// 拖拽类型定义
// ---------------------------------------------------------------------------

export type DragType = 'none' | 'move' | 'start' | 'end' | 'middle';
export type RectDragType =
  | 'none'
  | 'move'
  | 'resize-tl'
  | 'resize-tr'
  | 'resize-bl'
  | 'resize-br'
  | 'resize-t'
  | 'resize-r'
  | 'resize-b'
  | 'resize-l';
export type TextDragType = 'none' | 'move' | 'resize-tl' | 'resize-tr' | 'resize-bl' | 'resize-br';
export type MosaicDragType = RectDragType;
export type CropDragType = RectDragType;

// ---------------------------------------------------------------------------
// 箭头相关函数
// ---------------------------------------------------------------------------

/** 检测点是否在箭头附近（用于选择） */
export function isPointNearArrow(x: number, y: number, arrow: ArrowShape): boolean {
  const { startX, startY, endX, endY } = arrow;
  
  // 计算点到线段的距离
  const dx = endX - startX;
  const dy = endY - startY;
  const lengthSq = dx * dx + dy * dy;
  
  if (lengthSq === 0) {
    // 线段退化为点
    const dist = Math.sqrt((x - startX) ** 2 + (y - startY) ** 2);
    return dist < HANDLE_RADIUS * 2;
  }
  
  // 计算投影参数 t
  const t = Math.max(0, Math.min(1, ((x - startX) * dx + (y - startY) * dy) / lengthSq));
  
  // 计算投影点
  const projX = startX + t * dx;
  const projY = startY + t * dy;
  
  // 计算点到投影点的距离
  const dist = Math.sqrt((x - projX) ** 2 + (y - projY) ** 2);
  
  return dist < HANDLE_RADIUS * 2;
}

/** 检测点击位置对应的箭头拖拽类型 */
export function getDragTypeAtPoint(x: number, y: number, arrow: ArrowShape): DragType {
  const { startX, startY, endX, endY } = arrow;
  
  // 检测起点控制点
  const distStart = Math.sqrt((x - startX) ** 2 + (y - startY) ** 2);
  if (distStart <= HANDLE_RADIUS) return 'start';
  
  // 检测终点控制点
  const distEnd = Math.sqrt((x - endX) ** 2 + (y - endY) ** 2);
  if (distEnd <= HANDLE_RADIUS) return 'end';
  
  // 计算箭头长度
  const length = Math.sqrt((endX - startX) ** 2 + (endY - startY) ** 2);
  
  // 检测中点控制点（箭头足够长时）
  if (length >= HANDLE_RADIUS * 4) {
    const midX = (startX + endX) / 2;
    const midY = (startY + endY) / 2;
    const distMid = Math.sqrt((x - midX) ** 2 + (y - midY) ** 2);
    if (distMid <= HANDLE_RADIUS) return 'middle';
  }
  
  // 检测是否在线段上（用于移动）
  if (isPointNearArrow(x, y, arrow)) return 'move';
  
  return 'none';
}

/** 检测箭头是否在矩形框选区域内 */
export function isArrowInRect(arrow: ArrowShape, rect: { x1: number; y1: number; x2: number; y2: number }): boolean {
  const minX = Math.min(rect.x1, rect.x2);
  const maxX = Math.max(rect.x1, rect.x2);
  const minY = Math.min(rect.y1, rect.y2);
  const maxY = Math.max(rect.y1, rect.y2);
  
  // 箭头两端点都在框选区域内
  const startInRect = arrow.startX >= minX && arrow.startX <= maxX && arrow.startY >= minY && arrow.startY <= maxY;
  const endInRect = arrow.endX >= minX && arrow.endX <= maxX && arrow.endY >= minY && arrow.endY <= maxY;
  
  return startInRect && endInRect;
}

// ---------------------------------------------------------------------------
// 矩形相关函数
// ---------------------------------------------------------------------------

/** 检测点是否在矩形内部 */
export function isPointInRect(x: number, y: number, rect: RectShape): boolean {
  return x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height;
}

/** 检测点击位置对应的矩形拖拽类型 */
export function getRectDragTypeAtPoint(x: number, y: number, rect: RectShape): RectDragType {
  const { x: rx, y: ry, width, height } = rect;
  
  // 检测四角
  const corners = [
    { type: 'resize-tl' as const, x: rx, y: ry },
    { type: 'resize-tr' as const, x: rx + width, y: ry },
    { type: 'resize-bl' as const, x: rx, y: ry + height },
    { type: 'resize-br' as const, x: rx + width, y: ry + height },
  ];
  
  for (const corner of corners) {
    const dist = Math.sqrt((x - corner.x) ** 2 + (y - corner.y) ** 2);
    if (dist <= HANDLE_RADIUS) return corner.type;
  }
  
  // 检测四边中点（矩形足够大时）
  if (width >= HANDLE_RADIUS * 4) {
    const topMid = { x: rx + width / 2, y: ry };
    const bottomMid = { x: rx + width / 2, y: ry + height };
    if (Math.sqrt((x - topMid.x) ** 2 + (y - topMid.y) ** 2) <= HANDLE_RADIUS) return 'resize-t';
    if (Math.sqrt((x - bottomMid.x) ** 2 + (y - bottomMid.y) ** 2) <= HANDLE_RADIUS) return 'resize-b';
  }
  
  if (height >= HANDLE_RADIUS * 4) {
    const leftMid = { x: rx, y: ry + height / 2 };
    const rightMid = { x: rx + width, y: ry + height / 2 };
    if (Math.sqrt((x - leftMid.x) ** 2 + (y - leftMid.y) ** 2) <= HANDLE_RADIUS) return 'resize-l';
    if (Math.sqrt((x - rightMid.x) ** 2 + (y - rightMid.y) ** 2) <= HANDLE_RADIUS) return 'resize-r';
  }
  
  // 检测是否在矩形内部（用于移动）
  if (isPointInRect(x, y, rect)) return 'move';
  
  return 'none';
}

/** 检测矩形是否在框选区域内 */
export function isRectInRect(rect: RectShape, selRect: { x1: number; y1: number; x2: number; y2: number }): boolean {
  const minX = Math.min(selRect.x1, selRect.x2);
  const maxX = Math.max(selRect.x1, selRect.x2);
  const minY = Math.min(selRect.y1, selRect.y2);
  const maxY = Math.max(selRect.y1, selRect.y2);
  
  return rect.x >= minX && rect.x + rect.width <= maxX && rect.y >= minY && rect.y + rect.height <= maxY;
}

// ---------------------------------------------------------------------------
// 文字相关函数
// ---------------------------------------------------------------------------

/** 检测点是否在文字区域内 */
export function isPointInText(x: number, y: number, text: TextShape, ctx: CanvasRenderingContext2D): boolean {
  ctx.font = `${text.fontStyle} ${text.fontWeight} ${text.fontSize}px "JetBrains Mono", "IBM Plex Mono", monospace`;
  const metrics = ctx.measureText(text.text);
  const textWidth = metrics.width;
  const textHeight = text.fontSize;
  
  return x >= text.x - 4 && x <= text.x + textWidth + 4 && y >= text.y - 4 && y <= text.y + textHeight + 4;
}

/** 检测点击位置对应的文字拖拽类型 */
export function getTextDragTypeAtPoint(x: number, y: number, text: TextShape, ctx: CanvasRenderingContext2D): TextDragType {
  ctx.font = `${text.fontStyle} ${text.fontWeight} ${text.fontSize}px "JetBrains Mono", "IBM Plex Mono", monospace`;
  const metrics = ctx.measureText(text.text);
  const textWidth = metrics.width;
  const textHeight = text.fontSize;
  
  const tx = text.x - 4;
  const ty = text.y - 4;
  const tw = textWidth + 8;
  const th = textHeight + 8;
  
  // 检测四角
  const corners = [
    { type: 'resize-tl' as const, x: tx, y: ty },
    { type: 'resize-tr' as const, x: tx + tw, y: ty },
    { type: 'resize-bl' as const, x: tx, y: ty + th },
    { type: 'resize-br' as const, x: tx + tw, y: ty + th },
  ];
  
  for (const corner of corners) {
    const dist = Math.sqrt((x - corner.x) ** 2 + (y - corner.y) ** 2);
    if (dist <= HANDLE_RADIUS) return corner.type;
  }
  
  // 检测是否在文字区域内（用于移动）
  if (isPointInText(x, y, text, ctx)) return 'move';
  
  return 'none';
}

/** 检测文字是否在框选区域内 */
export function isTextInRect(text: TextShape, rect: { x1: number; y1: number; x2: number; y2: number }, ctx: CanvasRenderingContext2D): boolean {
  ctx.font = `${text.fontStyle} ${text.fontWeight} ${text.fontSize}px "JetBrains Mono", "IBM Plex Mono", monospace`;
  const metrics = ctx.measureText(text.text);
  const textWidth = metrics.width;
  const textHeight = text.fontSize;
  
  const minX = Math.min(rect.x1, rect.x2);
  const maxX = Math.max(rect.x1, rect.x2);
  const minY = Math.min(rect.y1, rect.y2);
  const maxY = Math.max(rect.y1, rect.y2);
  
  return text.x >= minX && text.x + textWidth <= maxX && text.y >= minY && text.y + textHeight <= maxY;
}

// ---------------------------------------------------------------------------
// 马赛克相关函数
// ---------------------------------------------------------------------------

/** 检测点是否在马赛克内部 */
export function isPointInMosaic(x: number, y: number, mosaic: MosaicShape): boolean {
  return x >= mosaic.x && x <= mosaic.x + mosaic.width && y >= mosaic.y && y <= mosaic.y + mosaic.height;
}

/** 检测点击位置对应的马赛克拖拽类型 */
export function getMosaicDragTypeAtPoint(x: number, y: number, mosaic: MosaicShape): MosaicDragType {
  return getRectDragTypeAtPoint(x, y, {
    x: mosaic.x,
    y: mosaic.y,
    width: mosaic.width,
    height: mosaic.height,
  } as RectShape);
}

/** 检测马赛克是否在框选区域内 */
export function isMosaicInRect(mosaic: MosaicShape, rect: { x1: number; y1: number; x2: number; y2: number }): boolean {
  return isRectInRect({
    x: mosaic.x,
    y: mosaic.y,
    width: mosaic.width,
    height: mosaic.height,
  } as RectShape, rect);
}

// ---------------------------------------------------------------------------
// 裁剪框相关函数
// ---------------------------------------------------------------------------

/** 检测点是否在裁剪框内部 */
export function isPointInCrop(x: number, y: number, crop: CropArea): boolean {
  return x >= crop.x && x <= crop.x + crop.width && y >= crop.y && y <= crop.y + crop.height;
}

/** 检测点击位置对应的裁剪框拖拽类型 */
export function getCropDragTypeAtPoint(x: number, y: number, crop: CropArea): CropDragType {
  return getRectDragTypeAtPoint(x, y, {
    x: crop.x,
    y: crop.y,
    width: crop.width,
    height: crop.height,
  } as RectShape);
}

// ---------------------------------------------------------------------------
// 框选矩形绘制
// ---------------------------------------------------------------------------

/** 绘制框选矩形 */
export function drawMarqueeRect(ctx: CanvasRenderingContext2D, rect: { x1: number; y1: number; x2: number; y2: number }): void {
  const x = Math.min(rect.x1, rect.x2);
  const y = Math.min(rect.y1, rect.y2);
  const w = Math.abs(rect.x2 - rect.x1);
  const h = Math.abs(rect.y2 - rect.y1);

  ctx.save();
  ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = 'rgba(59, 130, 246, 0.5)';
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, w, h);
  ctx.restore();
}
