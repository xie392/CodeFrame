/**
 * useCanvasTransform Hook
 * 管理画布缩放和平移逻辑
 */

import { useCallback } from 'react';
import { useCodegenStore } from '../stores/codegen-store';
import { useCurrent } from './useCurrent';
import { MIN_SCALE, MAX_SCALE, ZOOM_FACTOR_OUT, ZOOM_FACTOR_IN } from '../constants';

export function useCanvasTransform() {
  const { canvas, setCanvas } = useCodegenStore();
  const { scale, offset } = canvas;

  // 使用 useCurrent 保持事件处理器中获取最新值
  const scaleRef = useCurrent(scale);
  const offsetRef = useCurrent(offset);

  /**
   * 在指定锚点进行缩放
   */
  const zoomAt = useCallback(
    (newScale: number, anchorX: number, anchorY: number) => {
      const clamped = Math.min(MAX_SCALE, Math.max(MIN_SCALE, newScale));
      const oldScale = scaleRef.current;
      const ratio = clamped / oldScale;
      const old = offsetRef.current;

      setCanvas({
        scale: clamped,
        offset: {
          x: anchorX * (1 - ratio) + old.x * ratio,
          y: anchorY * (1 - ratio) + old.y * ratio,
        },
      });
    },
    [setCanvas, scaleRef, offsetRef],
  );

  /**
   * 放大
   */
  const zoomIn = useCallback(
    (containerWidth: number, containerHeight: number) => {
      zoomAt(scaleRef.current * ZOOM_FACTOR_IN, containerWidth / 2, containerHeight / 2);
    },
    [zoomAt, scaleRef],
  );

  /**
   * 缩小
   */
  const zoomOut = useCallback(
    (containerWidth: number, containerHeight: number) => {
      zoomAt(scaleRef.current * ZOOM_FACTOR_OUT, containerWidth / 2, containerHeight / 2);
    },
    [zoomAt, scaleRef],
  );

  /**
   * 重置视图
   */
  const resetView = useCallback(() => {
    setCanvas({
      scale: 1,
      offset: { x: 0, y: 0 },
    });
  }, [setCanvas]);

  /**
   * 滑块控制缩放
   */
  const handleSlider = useCallback(
    (newScale: number, containerWidth: number, containerHeight: number) => {
      zoomAt(newScale, containerWidth / 2, containerHeight / 2);
    },
    [zoomAt],
  );

  return {
    scale,
    offset,
    scaleRef,
    offsetRef,
    zoomAt,
    zoomIn,
    zoomOut,
    resetView,
    handleSlider,
    zoomPercent: Math.round(scale * 100),
  };
}
