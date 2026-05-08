/**
 * Arrow 适配器
 * ArrowShape ↔ Leafer Arrow 双向转换
 * 使用 @leafer-in/arrow 的 Arrow 元素
 * 处理 points/startX/startY/endX/endY 和
 * style(single/double) 映射
 */

import type { IShapeAdapter } from '../../types';
import type { ArrowShape } from '../../../types';

/** headSize 基准值，用于换算 Leafer arrow scale */
const HEAD_SIZE_BASE = 12;

/** 根据 ArrowShape 生成箭头标记参数 */
function toArrowMarker(
  shape: ArrowShape
): Record<string, unknown> {
  const scale = shape.headSize / HEAD_SIZE_BASE;
  if (shape.style === 'double') {
    return {
      startArrow: { type: 'angle', scale },
      endArrow: { type: 'angle', scale },
    };
  }
  return { endArrow: { type: 'angle', scale } };
}

export class ArrowAdapter
  implements IShapeAdapter<ArrowShape>
{
  toCreateParams(
    shape: ArrowShape
  ): Record<string, unknown> {
    return {
      id: shape.id,
      points: [
        shape.startX,
        shape.startY,
        shape.endX,
        shape.endY,
      ],
      stroke: shape.color,
      strokeWidth: shape.strokeWidth,
      hitStroke: 'all',
      dragBounds: 'parent',
      ...toArrowMarker(shape),
    };
  }

  toUpdateParams(
    updates: Partial<ArrowShape>
  ): Record<string, unknown> {
    const params: Record<string, unknown> = {};

    if ('color' in updates)
      params.stroke = updates.color;
    if ('strokeWidth' in updates)
      params.strokeWidth = updates.strokeWidth;
    if (
      'style' in updates ||
      'headSize' in updates
    ) {
      const merged = {
        style:
          updates.style ?? 'single',
        headSize:
          updates.headSize ?? HEAD_SIZE_BASE,
      };
      const scale =
        merged.headSize / HEAD_SIZE_BASE;
      if (merged.style === 'double') {
        params.startArrow = { type: 'angle', scale };
        params.endArrow = { type: 'angle', scale };
      } else {
        params.startArrow = undefined;
        params.endArrow = { type: 'angle', scale };
      }
    }

    // 坐标变更由 Backend 通过
    // arrowNeedsCoordRebuild 检测后
    // 调用 rebuildArrowCoords 处理

    return params;
  }

  toStoreUpdates(
    leaferElement: unknown
  ): Partial<ArrowShape> {
    const el = leaferElement as {
      x: number;
      y: number;
      points?: number[];
    };
    const ox = el.x ?? 0;
    const oy = el.y ?? 0;
    const pts = el.points ?? [0, 0, 0, 0];

    return {
      startX: (pts[0] ?? 0) + ox,
      startY: (pts[1] ?? 0) + oy,
      endX: (pts[2] ?? 0) + ox,
      endY: (pts[3] ?? 0) + oy,
    };
  }
}
