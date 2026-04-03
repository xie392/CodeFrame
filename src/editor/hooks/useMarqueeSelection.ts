/**
 * useMarqueeSelection - 框选功能 Hook
 *
 * 处理框选功能，包括：
 * - 框选状态管理
 * - 检测框选范围内的图形
 * - 多选支持
 */

import { useRef, useCallback } from 'react';
import type { ArrowShape, RectShape, TextShape, MosaicShape } from '../types';
import {
  isArrowInRect,
  isRectInRect,
  isTextInRect,
  isMosaicInRect,
} from '../utils/shape-helpers';
import { SELECT_MIN_SIZE } from '../constants';

/**
 * 框选范围
 */
interface MarqueeRect {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

/**
 * 框选回调
 */
interface MarqueeCallbacks {
  setSelectedArrowIds: (ids: string[] | ((prev: string[]) => string[])) => void;
  setSelectedRectIds: (ids: string[] | ((prev: string[]) => string[])) => void;
  setSelectedTextIds: (ids: string[] | ((prev: string[]) => string[])) => void;
  setSelectedMosaicIds: (ids: string[] | ((prev: string[]) => string[])) => void;
  renderShapes: () => void;
}

/**
 * 框选配置
 */
interface MarqueeConfig {
  arrowsRef: React.MutableRefObject<ArrowShape[]>;
  rectsRef: React.MutableRefObject<RectShape[]>;
  textsRef: React.MutableRefObject<TextShape[]>;
  mosaicsRef: React.MutableRefObject<MosaicShape[]>;
  canvasCtx: CanvasRenderingContext2D | null;
}

/**
 * 框选 Hook 返回值
 */
interface UseMarqueeSelectionReturn {
  isMarqueeSelecting: React.MutableRefObject<boolean>;
  marqueeStart: React.MutableRefObject<{ x: number; y: number } | null>;
  marqueeEnd: React.MutableRefObject<{ x: number; y: number } | null>;
  startMarquee: (x: number, y: number) => void;
  updateMarquee: (x: number, y: number) => void;
  finishMarquee: (shiftKey: boolean) => void;
  cancelMarquee: () => void;
}

/**
 * 框选功能 Hook
 */
export function useMarqueeSelection(
  config: MarqueeConfig,
  callbacks: MarqueeCallbacks
): UseMarqueeSelectionReturn {
  const { arrowsRef, rectsRef, textsRef, mosaicsRef, canvasCtx } = config;

  // 框选状态
  const isMarqueeSelecting = useRef(false);
  const marqueeStart = useRef<{ x: number; y: number } | null>(null);
  const marqueeEnd = useRef<{ x: number; y: number } | null>(null);

  /**
   * 开始框选
   */
  const startMarquee = useCallback((x: number, y: number) => {
    isMarqueeSelecting.current = true;
    marqueeStart.current = { x, y };
    marqueeEnd.current = { x, y };
  }, []);

  /**
   * 更新框选
   */
  const updateMarquee = useCallback(
    (x: number, y: number) => {
      if (marqueeStart.current) {
        marqueeEnd.current = { x, y };
        callbacks.renderShapes();
      }
    },
    [callbacks]
  );

  /**
   * 完成框选
   */
  const finishMarquee = useCallback(
    (shiftKey: boolean) => {
      if (!marqueeStart.current || !marqueeEnd.current) {
        isMarqueeSelecting.current = false;
        return;
      }

      const rect: MarqueeRect = {
        x1: marqueeStart.current.x,
        y1: marqueeStart.current.y,
        x2: marqueeEnd.current.x,
        y2: marqueeEnd.current.y,
      };

      const width = Math.abs(rect.x2 - rect.x1);
      const height = Math.abs(rect.y2 - rect.y1);

      // 检查是否为有效框选
      if (width < SELECT_MIN_SIZE && height < SELECT_MIN_SIZE) {
        // 取消选择
        callbacks.setSelectedArrowIds([]);
        callbacks.setSelectedRectIds([]);
        callbacks.setSelectedTextIds([]);
        callbacks.setSelectedMosaicIds([]);
      } else {
        // 收集框选范围内的图形
        const newSelectedArrowIds: string[] = [];
        const newSelectedRectIds: string[] = [];
        const newSelectedTextIds: string[] = [];
        const newSelectedMosaicIds: string[] = [];

        arrowsRef.current.forEach((arrow) => {
          if (isArrowInRect(arrow, rect)) newSelectedArrowIds.push(arrow.id);
        });

        rectsRef.current.forEach((rectItem) => {
          if (isRectInRect(rectItem, rect)) newSelectedRectIds.push(rectItem.id);
        });

        if (canvasCtx) {
          textsRef.current.forEach((text) => {
            if (isTextInRect(text, rect, canvasCtx)) newSelectedTextIds.push(text.id);
          });
        }

        mosaicsRef.current.forEach((mosaic) => {
          if (isMosaicInRect(mosaic, rect)) newSelectedMosaicIds.push(mosaic.id);
        });

        // 更新选择状态
        if (shiftKey) {
          callbacks.setSelectedArrowIds((prev) => [...new Set([...prev, ...newSelectedArrowIds])]);
          callbacks.setSelectedRectIds((prev) => [...new Set([...prev, ...newSelectedRectIds])]);
          callbacks.setSelectedTextIds((prev) => [...new Set([...prev, ...newSelectedTextIds])]);
          callbacks.setSelectedMosaicIds((prev) => [...new Set([...prev, ...newSelectedMosaicIds])]);
        } else {
          callbacks.setSelectedArrowIds(newSelectedArrowIds);
          callbacks.setSelectedRectIds(newSelectedRectIds);
          callbacks.setSelectedTextIds(newSelectedTextIds);
          callbacks.setSelectedMosaicIds(newSelectedMosaicIds);
        }
      }

      // 重置状态
      isMarqueeSelecting.current = false;
      marqueeStart.current = null;
      marqueeEnd.current = null;
      callbacks.renderShapes();
    },
    [callbacks, arrowsRef, rectsRef, textsRef, mosaicsRef, canvasCtx]
  );

  /**
   * 取消框选
   */
  const cancelMarquee = useCallback(() => {
    isMarqueeSelecting.current = false;
    marqueeStart.current = null;
    marqueeEnd.current = null;
    callbacks.renderShapes();
  }, [callbacks]);

  return {
    isMarqueeSelecting,
    marqueeStart,
    marqueeEnd,
    startMarquee,
    updateMarquee,
    finishMarquee,
    cancelMarquee,
  };
}

export default useMarqueeSelection;
