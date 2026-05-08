/**
 * 命中检测工具
 * 用于在绘制模式下检测点击位置是否命中已有图形，
 * 实现"任何工具模式下点击已有图形自动选中"的交互
 */

import type { ShapeType } from '../types';
import { HANDLE_RADIUS } from '../constants';

/** 命中结果 */
export interface HitResult {
  type: ShapeType;
  id: string;
  zIndex: number;
}

/** 图形边界数据（用于命中检测） */
export interface ShapeBounds {
  type: ShapeType;
  id: string;
  zIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
  /** 箭头端点 */
  points?: number[];
}

/**
 * 从 LeaferBackend 的 elementMap/typeMap 构建图形边界列表
 * 供 handleDrawPointerDown 中的命中检测使用
 */
export function buildBoundsList(
  elementMap: Map<string, unknown>,
  typeMap: Map<string, ShapeType>
): ShapeBounds[] {
  const result: ShapeBounds[] = [];

  for (const [id, element] of elementMap) {
    const type = typeMap.get(id);
    if (!type) continue;

    const el = element as {
      x: number;
      y: number;
      width?: number;
      height?: number;
      points?: number[];
      data?: { zIndex?: number };
    };

    // 箭头使用 points 计算边界
    if (type === 'arrow' && el.points) {
      const pts = el.points;
      const ox = el.x ?? 0;
      const oy = el.y ?? 0;
      const x1 = (pts[0] ?? 0) + ox;
      const y1 = (pts[1] ?? 0) + oy;
      const x2 = (pts[2] ?? 0) + ox;
      const y2 = (pts[3] ?? 0) + oy;

      result.push({
        type,
        id,
        zIndex: el.data?.zIndex ?? 0,
        x: Math.min(x1, x2),
        y: Math.min(y1, y2),
        width: Math.abs(x2 - x1),
        height: Math.abs(y2 - y1),
        points: pts,
      });
    } else {
      result.push({
        type,
        id,
        zIndex: el.data?.zIndex ?? 0,
        x: el.x ?? 0,
        y: el.y ?? 0,
        width: el.width ?? 0,
        height: el.height ?? 0,
      });
    }
  }

  return result;
}

/**
 * 在给定点检测命中的图形
 * 按 zIndex 降序检测（最上层优先），返回最上层命中的图形
 */
export function hitTestAtPoint(
  x: number,
  y: number,
  bounds: ShapeBounds[]
): HitResult | null {
  // 按 zIndex 降序排列，最上层优先检测
  const sorted = [...bounds].sort(
    (a, b) => b.zIndex - a.zIndex
  );

  for (const b of sorted) {
    if (isPointInBounds(x, y, b)) {
      return { type: b.type, id: b.id, zIndex: b.zIndex };
    }
  }

  return null;
}

/**
 * 检测点是否在图形边界内
 * 箭头使用点到线段距离检测，其他使用矩形包含检测
 */
function isPointInBounds(
  x: number,
  y: number,
  bounds: ShapeBounds
): boolean {
  if (bounds.type === 'arrow' && bounds.points) {
    return isPointNearArrowBounds(x, y, bounds);
  }

  // 矩形、文字、马赛克使用矩形包含检测
  return (
    x >= bounds.x &&
    x <= bounds.x + bounds.width &&
    y >= bounds.y &&
    y <= bounds.y + bounds.height
  );
}

/**
 * 检测点是否在箭头线段附近
 * 使用点到线段的距离判断
 */
function isPointNearArrowBounds(
  x: number,
  y: number,
  bounds: ShapeBounds
): boolean {
  const pts = bounds.points!;
  const startX = pts[0];
  const startY = pts[1];
  const endX = pts[2];
  const endY = pts[3];

  const dx = endX - startX;
  const dy = endY - startY;
  const lengthSq = dx * dx + dy * dy;

  if (lengthSq === 0) {
    const dist = Math.sqrt(
      (x - startX) ** 2 + (y - startY) ** 2
    );
    return dist < HANDLE_RADIUS * 2;
  }

  const t = Math.max(
    0,
    Math.min(
      1,
      ((x - startX) * dx + (y - startY) * dy) / lengthSq
    )
  );

  const projX = startX + t * dx;
  const projY = startY + t * dy;
  const dist = Math.sqrt(
    (x - projX) ** 2 + (y - projY) ** 2
  );

  return dist < HANDLE_RADIUS * 2;
}
