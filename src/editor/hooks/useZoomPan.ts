/**
 * 缩放和平移 Hook
 * 处理画布的缩放、平移逻辑
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { MIN_SCALE, MAX_SCALE } from '../constants';

interface UseZoomPanOptions {
  containerRef: React.RefObject<HTMLDivElement | null>;
  activeTool: string;
  imageData: string | null;
}

interface UseZoomPanReturn {
  scale: number;
  offset: { x: number; y: number };
  scaleRef: React.MutableRefObject<number>;
  offsetRef: React.MutableRefObject<{ x: number; y: number }>;
  setScale: (scale: number) => void;
  setOffset: (offset: { x: number; y: number }) => void;
  zoomAt: (newScale: number, anchorX: number, anchorY: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetView: () => void;
  handleSlider: (newScale: number) => void;
  zoomPercent: number;
}

export function useZoomPan({
  containerRef,
  activeTool,
  imageData,
}: UseZoomPanOptions): UseZoomPanReturn {
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const scaleRef = useRef(scale);
  const offsetRef = useRef(offset);

  // 保持 ref 同步
  useEffect(() => {
    scaleRef.current = scale;
  }, [scale]);

  useEffect(() => {
    offsetRef.current = offset;
  }, [offset]);

  // 锚点缩放
  const zoomAt = useCallback((newScale: number, anchorX: number, anchorY: number) => {
    const clamped = Math.min(MAX_SCALE, Math.max(MIN_SCALE, newScale));
    const oldScale = scaleRef.current;
    const ratio = clamped / oldScale;
    const old = offsetRef.current;
    const newOffset = {
      x: anchorX * (1 - ratio) + old.x * ratio,
      y: anchorY * (1 - ratio) + old.y * ratio,
    };
    scaleRef.current = clamped;
    offsetRef.current = newOffset;
    setScale(clamped);
    setOffset(newOffset);
  }, []);

  // 鼠标滚轮缩放
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handler = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const factor = e.deltaY > 0 ? 0.92 : 1.08;
      zoomAt(scaleRef.current * factor, rect.width / 2, rect.height / 2);
    };

    el.addEventListener('wheel', handler, { passive: false });
    return () => el.removeEventListener('wheel', handler);
  }, [containerRef, zoomAt]);

  // 画布拖拽平移
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0 });
  const panOffsetStart = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onDown = (e: MouseEvent) => {
      if (e.button !== 0 || !imageData || activeTool !== 'move') return;
      isPanning.current = true;
      panStart.current = { x: e.clientX, y: e.clientY };
      panOffsetStart.current = offsetRef.current;
      el.style.cursor = 'grabbing';
    };

    const onMove = (e: MouseEvent) => {
      if (!isPanning.current) return;
      const dx = e.clientX - panStart.current.x;
      const dy = e.clientY - panStart.current.y;
      const newOffset = {
        x: panOffsetStart.current.x + dx,
        y: panOffsetStart.current.y + dy,
      };
      offsetRef.current = newOffset;
      setOffset(newOffset);
    };

    const onUp = () => {
      isPanning.current = false;
      if (activeTool === 'move') {
        el.style.cursor = 'grab';
      }
    };

    el.addEventListener('mousedown', onDown);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);

    return () => {
      el.removeEventListener('mousedown', onDown);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [containerRef, activeTool, imageData]);

  // 缩放控制
  const zoomIn = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    zoomAt(scaleRef.current * 1.2, rect.width / 2, rect.height / 2);
  }, [containerRef, zoomAt]);

  const zoomOut = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    zoomAt(scaleRef.current / 1.2, rect.width / 2, rect.height / 2);
  }, [containerRef, zoomAt]);

  const resetView = useCallback(() => {
    scaleRef.current = 1;
    offsetRef.current = { x: 0, y: 0 };
    setScale(1);
    setOffset({ x: 0, y: 0 });
  }, []);

  const handleSlider = useCallback(
    (newScale: number) => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      zoomAt(newScale, rect.width / 2, rect.height / 2);
    },
    [containerRef, zoomAt]
  );

  const zoomPercent = Math.round(scale * 100);

  return {
    scale,
    offset,
    scaleRef,
    offsetRef,
    setScale,
    setOffset,
    zoomAt,
    zoomIn,
    zoomOut,
    resetView,
    handleSlider,
    zoomPercent,
  };
}
