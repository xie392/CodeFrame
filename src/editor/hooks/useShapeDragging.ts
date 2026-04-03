/**
 * useShapeDragging - 图形拖拽 Hook
 *
 * 处理图形拖拽和调整大小，使用通用的 applyDragResize 函数。
 */

import { useRef, useCallback } from 'react';
import type { ArrowShape, RectShape, TextShape, MosaicShape, CropArea } from '../types';
import { applyDragResize, type RectLike } from '../utils/drag-resize';
import type { DragType, RectDragType, TextDragType, MosaicDragType, CropDragType } from '../utils/shape-helpers';
import { FONT_SIZE_MIN, FONT_SIZE_MAX } from '../constants';

/**
 * 拖拽状态类型
 */
interface DragState<T, O> {
  type: T;
  id?: string;
  startX: number;
  startY: number;
  orig: O;
}

/**
 * 拖拽回调
 */
interface DraggingCallbacks {
  setArrows: (updater: (prev: ArrowShape[]) => ArrowShape[]) => void;
  setRects: (updater: (prev: RectShape[]) => RectShape[]) => void;
  setTexts: (updater: (prev: TextShape[]) => TextShape[]) => void;
  setMosaics: (updater: (prev: MosaicShape[]) => MosaicShape[]) => void;
  setCropArea: (area: CropArea | null) => void;
  pushHistory: () => void;
  renderShapes: () => void;
}

/**
 * 拖拽配置
 */
interface DraggingConfig {
  activeTool: string;
  imageNaturalSize: { width: number; height: number } | null;
  shapeMinSize: number;
  minCropSize: number;
}

/**
 * 图形拖拽 Hook 返回值
 */
interface UseShapeDraggingReturn {
  // 拖拽状态 Refs
  draggingArrow: React.MutableRefObject<DragState<DragType, { x: number; y: number; endX: number; endY: number }> | null>;
  draggingRect: React.MutableRefObject<DragState<RectDragType, RectLike> | null>;
  draggingText: React.MutableRefObject<DragState<TextDragType, { x: number; y: number; fontSize: number }> | null>;
  draggingMosaic: React.MutableRefObject<DragState<MosaicDragType, RectLike> | null>;
  draggingCrop: React.MutableRefObject<DragState<CropDragType, RectLike> | null>;
  // 方法
  startDragArrow: (arrowId: string, type: DragType, x: number, y: number, arrow: ArrowShape) => void;
  startDragRect: (rectId: string, type: RectDragType, x: number, y: number, rect: RectShape) => void;
  startDragText: (textId: string, type: TextDragType, x: number, y: number, text: TextShape) => void;
  startDragMosaic: (mosaicId: string, type: MosaicDragType, x: number, y: number, mosaic: MosaicShape) => void;
  startDragCrop: (type: CropDragType, x: number, y: number, crop: CropArea) => void;
  updateDrag: (dx: number, dy: number) => void;
  finishDrag: () => void;
}

/**
 * 图形拖拽 Hook
 */
export function useShapeDragging(
  config: DraggingConfig,
  callbacks: DraggingCallbacks
): UseShapeDraggingReturn {
  const { activeTool, imageNaturalSize, shapeMinSize, minCropSize } = config;

  // 拖拽状态 Refs
  const draggingArrow = useRef<DragState<DragType, { x: number; y: number; endX: number; endY: number }> | null>(null);
  const draggingRect = useRef<DragState<RectDragType, RectLike> | null>(null);
  const draggingText = useRef<DragState<TextDragType, { x: number; y: number; fontSize: number }> | null>(null);
  const draggingMosaic = useRef<DragState<MosaicDragType, RectLike> | null>(null);
  const draggingCrop = useRef<DragState<CropDragType, RectLike> | null>(null);

  // 开始拖拽方法
  const startDragArrow = useCallback(
    (arrowId: string, type: DragType, x: number, y: number, arrow: ArrowShape) => {
      draggingArrow.current = {
        type,
        id: arrowId,
        startX: x,
        startY: y,
        orig: { x: arrow.startX, y: arrow.startY, endX: arrow.endX, endY: arrow.endY },
      };
    },
    []
  );

  const startDragRect = useCallback(
    (rectId: string, type: RectDragType, x: number, y: number, rect: RectShape) => {
      draggingRect.current = {
        type,
        id: rectId,
        startX: x,
        startY: y,
        orig: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
      };
    },
    []
  );

  const startDragText = useCallback(
    (textId: string, type: TextDragType, x: number, y: number, text: TextShape) => {
      draggingText.current = {
        type,
        id: textId,
        startX: x,
        startY: y,
        orig: { x: text.x, y: text.y, fontSize: text.fontSize },
      };
    },
    []
  );

  const startDragMosaic = useCallback(
    (mosaicId: string, type: MosaicDragType, x: number, y: number, mosaic: MosaicShape) => {
      draggingMosaic.current = {
        type,
        id: mosaicId,
        startX: x,
        startY: y,
        orig: { x: mosaic.x, y: mosaic.y, width: mosaic.width, height: mosaic.height },
      };
    },
    []
  );

  const startDragCrop = useCallback(
    (type: CropDragType, x: number, y: number, crop: CropArea) => {
      draggingCrop.current = {
        type,
        startX: x,
        startY: y,
        orig: { x: crop.x, y: crop.y, width: crop.width, height: crop.height },
      };
    },
    []
  );

  /**
   * 更新拖拽
   */
  const updateDrag = useCallback(
    (dx: number, dy: number) => {
      // 矩形拖拽
      if (draggingRect.current && activeTool === 'select') {
        const drag = draggingRect.current;
        callbacks.setRects((prev) =>
          prev.map((r) => {
            if (r.id !== drag.id) return r;
            return applyDragResize(r, drag.type, dx, dy, drag.orig, shapeMinSize);
          })
        );
        callbacks.renderShapes();
        return;
      }

      // 箭头拖拽
      if (draggingArrow.current && activeTool === 'select') {
        const drag = draggingArrow.current;
        callbacks.setArrows((prev) =>
          prev.map((a) => {
            if (a.id !== drag.id) return a;
            switch (drag.type) {
              case 'move':
              case 'middle':
                return {
                  ...a,
                  startX: drag.orig.x + dx,
                  startY: drag.orig.y + dy,
                  endX: drag.orig.endX + dx,
                  endY: drag.orig.endY + dy,
                };
              case 'start':
                return { ...a, startX: drag.orig.x + dx, startY: drag.orig.y + dy };
              case 'end':
                return { ...a, endX: drag.orig.endX + dx, endY: drag.orig.endY + dy };
              default:
                return a;
            }
          })
        );
        callbacks.renderShapes();
        return;
      }

      // 文字拖拽
      if (draggingText.current && activeTool === 'select') {
        const drag = draggingText.current;
        callbacks.setTexts((prev) =>
          prev.map((t) => {
            if (t.id !== drag.id) return t;
            switch (drag.type) {
              case 'move':
                return { ...t, x: drag.orig.x + dx, y: drag.orig.y + dy };
              case 'resize-br': {
                const delta = (dx + dy) / 2;
                return { ...t, fontSize: Math.min(FONT_SIZE_MAX, Math.max(FONT_SIZE_MIN, drag.orig.fontSize + delta * 0.5)) };
              }
              case 'resize-tl': {
                const delta = (-dx - dy) / 2;
                return { ...t, fontSize: Math.min(FONT_SIZE_MAX, Math.max(FONT_SIZE_MIN, drag.orig.fontSize + delta * 0.5)), x: drag.orig.x + dx, y: drag.orig.y + dy };
              }
              case 'resize-tr': {
                const delta = (dx - dy) / 2;
                return { ...t, fontSize: Math.min(FONT_SIZE_MAX, Math.max(FONT_SIZE_MIN, drag.orig.fontSize + delta * 0.5)), y: drag.orig.y + dy };
              }
              case 'resize-bl': {
                const delta = (-dx + dy) / 2;
                return { ...t, fontSize: Math.min(FONT_SIZE_MAX, Math.max(FONT_SIZE_MIN, drag.orig.fontSize + delta * 0.5)), x: drag.orig.x + dx };
              }
              default:
                return t;
            }
          })
        );
        callbacks.renderShapes();
        return;
      }

      // 马赛克拖拽
      if (draggingMosaic.current && activeTool === 'select') {
        const drag = draggingMosaic.current;
        callbacks.setMosaics((prev) =>
          prev.map((m) => {
            if (m.id !== drag.id) return m;
            return applyDragResize(m, drag.type, dx, dy, drag.orig, shapeMinSize);
          })
        );
        callbacks.renderShapes();
        return;
      }

      // 裁剪框拖拽
      if (draggingCrop.current && activeTool === 'crop' && imageNaturalSize) {
        const drag = draggingCrop.current;
        const bounds = {
          minX: 0,
          minY: 0,
          maxX: imageNaturalSize.width,
          maxY: imageNaturalSize.height,
        };
        const newCrop = applyDragResize(
          { x: drag.orig.x, y: drag.orig.y, width: drag.orig.width, height: drag.orig.height },
          drag.type,
          dx,
          dy,
          drag.orig,
          minCropSize,
          bounds
        );
        callbacks.setCropArea(newCrop);
        callbacks.renderShapes();
        return;
      }
    },
    [activeTool, callbacks, imageNaturalSize, shapeMinSize, minCropSize]
  );

  /**
   * 完成拖拽
   */
  const finishDrag = useCallback(() => {
    const wasDragging =
      draggingArrow.current ||
      draggingRect.current ||
      draggingText.current ||
      draggingMosaic.current ||
      draggingCrop.current;

    if (wasDragging) {
      callbacks.pushHistory();
    }

    draggingArrow.current = null;
    draggingRect.current = null;
    draggingText.current = null;
    draggingMosaic.current = null;
    draggingCrop.current = null;

    callbacks.renderShapes();
  }, [callbacks]);

  return {
    draggingArrow,
    draggingRect,
    draggingText,
    draggingMosaic,
    draggingCrop,
    startDragArrow,
    startDragRect,
    startDragText,
    startDragMosaic,
    startDragCrop,
    updateDrag,
    finishDrag,
  };
}

export default useShapeDragging;
