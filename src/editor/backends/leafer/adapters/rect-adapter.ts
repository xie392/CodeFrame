/**
 * Rect 适配器
 * RectShape ↔ Leafer Rect 双向转换
 * 处理 color↔stroke、fillOpacity↔fill、
 * borderStyle↔dashPattern 映射
 */

import type { IShapeAdapter } from '../../types';
import type { RectShape } from '../../../types';
import { hexToRgba } from '../utils/color';

export class RectAdapter
  implements IShapeAdapter<RectShape>
{
  toCreateParams(
    shape: RectShape
  ): Record<string, unknown> {
    const params: Record<string, unknown> = {
      id: shape.id,
      x: shape.x,
      y: shape.y,
      width: shape.width,
      height: shape.height,
      stroke: shape.color,
      strokeWidth: shape.strokeWidth,
      dragBounds: 'parent',
      editable: true,
    };

    if (shape.borderStyle === 'dashed') {
      params.dashPattern = [8, 4];
    }

    if (shape.fillOpacity > 0) {
      params.fill = hexToRgba(
        shape.color,
        shape.fillOpacity / 100
      );
    }

    return params;
  }

  toUpdateParams(
    updates: Partial<RectShape>
  ): Record<string, unknown> {
    const params: Record<string, unknown> = {};

    if ('x' in updates) params.x = updates.x;
    if ('y' in updates) params.y = updates.y;
    if ('width' in updates)
      params.width = updates.width;
    if ('height' in updates)
      params.height = updates.height;
    if ('color' in updates)
      params.stroke = updates.color;
    if ('strokeWidth' in updates)
      params.strokeWidth = updates.strokeWidth;
    if ('borderStyle' in updates) {
      params.dashPattern =
        updates.borderStyle === 'dashed'
          ? [8, 4]
          : undefined;
    }
    if ('fillOpacity' in updates) {
      params.fill =
        updates.fillOpacity! > 0
          ? hexToRgba(
              updates.color ?? '#EF4444',
              updates.fillOpacity! / 100
            )
          : undefined;
    }

    return params;
  }

  toStoreUpdates(
    leaferElement: unknown
  ): Partial<RectShape> {
    const el = leaferElement as {
      x: number;
      y: number;
      width: number;
      height: number;
    };
    return {
      x: el.x,
      y: el.y,
      width: el.width,
      height: el.height,
    };
  }
}
