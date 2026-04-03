/**
 * 通用拖拽调整大小工具函数
 *
 * 用于处理矩形、马赛克、裁剪框等图形的移动和调整大小逻辑。
 * 消除重复代码，提供统一的拖拽处理接口。
 */

import type { RectDragType, MosaicDragType, CropDragType } from '../utils/shape-helpers';

/**
 * 矩形类图形的通用类型
 */
export interface RectLike {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * 拖拽类型联合
 */
export type ResizeDragType = RectDragType | MosaicDragType | CropDragType;

/**
 * 边界约束选项
 */
export interface BoundsConstraint {
  minX?: number;
  minY?: number;
  maxX?: number;
  maxY?: number;
}

/**
 * 应用拖拽调整到矩形类图形
 *
 * @param shape 原始图形
 * @param type 拖拽类型
 * @param dx X 方向位移
 * @param dy Y 方向位移
 * @param orig 原始位置和尺寸
 * @param minSize 最小尺寸（默认 5）
 * @param bounds 边界约束（可选）
 * @returns 调整后的图形
 *
 * @example
 * ```ts
 * const newRect = applyDragResize(rect, 'resize-br', dx, dy, origRect);
 * ```
 */
export function applyDragResize<T extends RectLike>(
  shape: T,
  type: ResizeDragType,
  dx: number,
  dy: number,
  orig: RectLike,
  minSize: number = 5,
  bounds?: BoundsConstraint
): T {
  let updates: Partial<RectLike> = {};

  switch (type) {
    case 'move':
      updates = applyMove(dx, dy, orig, bounds);
      break;
    case 'resize-tl':
      updates = applyResizeTopLeft(dx, dy, orig, minSize, bounds);
      break;
    case 'resize-tr':
      updates = applyResizeTopRight(dx, dy, orig, minSize, bounds);
      break;
    case 'resize-bl':
      updates = applyResizeBottomLeft(dx, dy, orig, minSize, bounds);
      break;
    case 'resize-br':
      updates = applyResizeBottomRight(dx, dy, orig, minSize, bounds);
      break;
    case 'resize-t':
      updates = applyResizeTop(dy, orig, minSize, bounds);
      break;
    case 'resize-b':
      updates = applyResizeBottom(dy, orig, minSize, bounds);
      break;
    case 'resize-l':
      updates = applyResizeLeft(dx, orig, minSize, bounds);
      break;
    case 'resize-r':
      updates = applyResizeRight(dx, orig, minSize, bounds);
      break;
    default:
      return shape;
  }

  return { ...shape, ...updates };
}

// ---------------------------------------------------------------------------
// 私有辅助函数
// ---------------------------------------------------------------------------

function applyMove(
  dx: number,
  dy: number,
  orig: RectLike,
  bounds?: BoundsConstraint
): Partial<RectLike> {
  let newX = orig.x + dx;
  let newY = orig.y + dy;

  if (bounds) {
    if (bounds.minX !== undefined) newX = Math.max(bounds.minX, newX);
    if (bounds.minY !== undefined) newY = Math.max(bounds.minY, newY);
    if (bounds.maxX !== undefined) newX = Math.min(bounds.maxX - orig.width, newX);
    if (bounds.maxY !== undefined) newY = Math.min(bounds.maxY - orig.height, newY);
  }

  return { x: newX, y: newY };
}

function applyResizeTopLeft(
  dx: number,
  dy: number,
  orig: RectLike,
  minSize: number,
  bounds?: BoundsConstraint
): Partial<RectLike> {
  let newX = orig.x + dx;
  let newY = orig.y + dy;
  let newWidth = Math.max(minSize, orig.width - dx);
  let newHeight = Math.max(minSize, orig.height - dy);

  if (bounds?.minX !== undefined) {
    newX = Math.max(bounds.minX, newX);
  }
  if (bounds?.minY !== undefined) {
    newY = Math.max(bounds.minY, newY);
  }

  return { x: newX, y: newY, width: newWidth, height: newHeight };
}

function applyResizeTopRight(
  dx: number,
  dy: number,
  orig: RectLike,
  minSize: number,
  bounds?: BoundsConstraint
): Partial<RectLike> {
  let newY = orig.y + dy;
  let newWidth = Math.max(minSize, orig.width + dx);
  let newHeight = Math.max(minSize, orig.height - dy);

  if (bounds?.maxX !== undefined) {
    newWidth = Math.min(bounds.maxX - orig.x, newWidth);
  }
  if (bounds?.minY !== undefined) {
    newY = Math.max(bounds.minY, newY);
  }

  return { y: newY, width: newWidth, height: newHeight };
}

function applyResizeBottomLeft(
  dx: number,
  dy: number,
  orig: RectLike,
  minSize: number,
  bounds?: BoundsConstraint
): Partial<RectLike> {
  let newX = orig.x + dx;
  let newWidth = Math.max(minSize, orig.width - dx);
  let newHeight = Math.max(minSize, orig.height + dy);

  if (bounds?.minX !== undefined) {
    newX = Math.max(bounds.minX, newX);
  }
  if (bounds?.maxY !== undefined) {
    newHeight = Math.min(bounds.maxY - orig.y, newHeight);
  }

  return { x: newX, width: newWidth, height: newHeight };
}

function applyResizeBottomRight(
  dx: number,
  dy: number,
  orig: RectLike,
  minSize: number,
  bounds?: BoundsConstraint
): Partial<RectLike> {
  let newWidth = Math.max(minSize, orig.width + dx);
  let newHeight = Math.max(minSize, orig.height + dy);

  if (bounds?.maxX !== undefined) {
    newWidth = Math.min(bounds.maxX - orig.x, newWidth);
  }
  if (bounds?.maxY !== undefined) {
    newHeight = Math.min(bounds.maxY - orig.y, newHeight);
  }

  return { width: newWidth, height: newHeight };
}

function applyResizeTop(
  dy: number,
  orig: RectLike,
  minSize: number,
  bounds?: BoundsConstraint
): Partial<RectLike> {
  let newY = orig.y + dy;
  let newHeight = Math.max(minSize, orig.height - dy);

  if (bounds?.minY !== undefined) {
    newY = Math.max(bounds.minY, newY);
  }

  return { y: newY, height: newHeight };
}

function applyResizeBottom(
  dy: number,
  orig: RectLike,
  minSize: number,
  bounds?: BoundsConstraint
): Partial<RectLike> {
  let newHeight = Math.max(minSize, orig.height + dy);

  if (bounds?.maxY !== undefined) {
    newHeight = Math.min(bounds.maxY - orig.y, newHeight);
  }

  return { height: newHeight };
}

function applyResizeLeft(
  dx: number,
  orig: RectLike,
  minSize: number,
  bounds?: BoundsConstraint
): Partial<RectLike> {
  let newX = orig.x + dx;
  let newWidth = Math.max(minSize, orig.width - dx);

  if (bounds?.minX !== undefined) {
    newX = Math.max(bounds.minX, newX);
  }

  return { x: newX, width: newWidth };
}

function applyResizeRight(
  dx: number,
  orig: RectLike,
  minSize: number,
  bounds?: BoundsConstraint
): Partial<RectLike> {
  let newWidth = Math.max(minSize, orig.width + dx);

  if (bounds?.maxX !== undefined) {
    newWidth = Math.min(bounds.maxX - orig.x, newWidth);
  }

  return { width: newWidth };
}

export default applyDragResize;
