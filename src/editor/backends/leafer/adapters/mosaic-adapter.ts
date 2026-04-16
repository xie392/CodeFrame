/**
 * Mosaic 适配器
 * MosaicShape ↔ Leafer Image 双向转换
 * 创建应用了 MosaicFilter 的 Leafer Image 元素，
 * 处理 blockSize 和 opacity（0-100，默认 100）映射，
 * 设置 dragBounds: 'parent'
 */

import type { IShapeAdapter } from '../../types';
import type { MosaicShape } from '../../../types';

export class MosaicAdapter
  implements IShapeAdapter<MosaicShape>
{
  toCreateParams(
    shape: MosaicShape,
  ): Record<string, unknown> {
    return {
      id: shape.id,
      x: shape.x,
      y: shape.y,
      width: shape.width,
      height: shape.height,
      // 1x1 透明占位，防止无 url 时渲染黑色背景
      // 真实 url 由 Backend 通过 setMosaicImageUrl 设置
      url: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      filter: {
        type: 'mosaic',
        blockSize: shape.blockSize,
      },
      opacity: shape.opacity / 100,
      dragBounds: 'parent',
      editable: true,
    };
  }

  toUpdateParams(
    updates: Partial<MosaicShape>,
  ): Record<string, unknown> {
    const params: Record<string, unknown> = {};

    if ('x' in updates) params.x = updates.x;
    if ('y' in updates) params.y = updates.y;
    if ('width' in updates)
      params.width = updates.width;
    if ('height' in updates)
      params.height = updates.height;
    if ('blockSize' in updates) {
      params.filter = {
        type: 'mosaic',
        blockSize: updates.blockSize,
      };
    }
    if ('opacity' in updates) {
      params.opacity =
        updates.opacity! / 100;
    }

    return params;
  }

  toStoreUpdates(
    leaferElement: unknown,
  ): Partial<MosaicShape> {
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
