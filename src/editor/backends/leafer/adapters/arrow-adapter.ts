/**
 * Arrow 适配器
 * ArrowShape ↔ Leafer Arrow 双向转换
 * 使用 @leafer-in/arrow 的 Arrow 元素
 * 处理 points/startX/startY/endX/endY 和
 * style(single/double) 映射
 */

import type { IShapeAdapter } from '../../types';
import type { ArrowShape } from '../../../types';

export class ArrowAdapter
  implements IShapeAdapter<ArrowShape>
{
  toCreateParams(
    shape: ArrowShape
  ): Record<string, unknown> {
    const params: Record<string, unknown> = {
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
      editable: true,
    };

    if (shape.style === 'double') {
      params.startArrow = 'mark';
      params.endArrow = 'mark';
    } else {
      params.endArrow = 'mark';
    }

    return params;
  }

  toUpdateParams(
    updates: Partial<ArrowShape>
  ): Record<string, unknown> {
    const params: Record<string, unknown> = {};

    if ('color' in updates)
      params.stroke = updates.color;
    if ('strokeWidth' in updates)
      params.strokeWidth = updates.strokeWidth;
    if ('style' in updates) {
      if (updates.style === 'double') {
        params.startArrow = 'mark';
        params.endArrow = 'mark';
      } else {
        params.startArrow = undefined;
        params.endArrow = 'mark';
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
