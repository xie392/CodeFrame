/**
 * Text 适配器
 * TextShape ↔ Leafer Text 双向转换
 * 处理 fontWeight(fontVariant)/fontStyle(italic)
 * 映射
 */

import type { IShapeAdapter } from '../../types';
import type { TextShape } from '../../../types';

export class TextAdapter
  implements IShapeAdapter<TextShape>
{
  toCreateParams(
    shape: TextShape
  ): Record<string, unknown> {
    return {
      id: shape.id,
      x: shape.x,
      y: shape.y,
      text: shape.text,
      fill: shape.color,
      fontSize: shape.fontSize,
      fontWeight: shape.fontWeight,
      italic: shape.fontStyle === 'italic',
      dragBounds: 'parent',
      editable: true,
      editInner: '',
    };
  }

  toUpdateParams(
    updates: Partial<TextShape>
  ): Record<string, unknown> {
    const params: Record<string, unknown> = {};

    if ('x' in updates) params.x = updates.x;
    if ('y' in updates) params.y = updates.y;
    if ('text' in updates) params.text = updates.text;
    if ('color' in updates) params.fill = updates.color;
    if ('fontSize' in updates)
      params.fontSize = updates.fontSize;
    if ('fontWeight' in updates)
      params.fontWeight = updates.fontWeight;
    if ('fontStyle' in updates)
      params.italic = updates.fontStyle === 'italic';

    return params;
  }

  toStoreUpdates(
    leaferElement: unknown
  ): Partial<TextShape> {
    const el = leaferElement as {
      x: number;
      y: number;
      text?: string;
    };
    const updates: Partial<TextShape> = {
      x: el.x,
      y: el.y,
    };
    if (el.text !== undefined) {
      updates.text = el.text;
    }
    return updates;
  }
}
