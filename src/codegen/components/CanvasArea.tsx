/**
 * CanvasArea 组件
 * 画布区域（包含变换层、代码窗口、缩放控制）
 */

import React, { useRef, useEffect, useCallback } from 'react';
import { useCodegenStore } from '../stores/codegen-store';
import { useCanvasTransform } from '../hooks/useCanvasTransform';
import { CodeWindow } from './CodeWindow';
import { ZoomControls } from './ZoomControls';
import { ZOOM_FACTOR_OUT, ZOOM_FACTOR_IN } from '../constants';

interface CanvasAreaProps {
  onExportRef: React.RefObject<HTMLDivElement>;
  onCodeWindowRef: React.RefObject<HTMLDivElement>;
  isEditing: boolean;
  isEditingRef: React.MutableRefObject<boolean>;
  onExitEdit: () => void;
  onEnterEdit: () => void;
  bindResize: () => Record<string, unknown>;
}

export const CanvasArea: React.FC<CanvasAreaProps> = ({
  onExportRef,
  onCodeWindowRef,
  isEditing,
  isEditingRef,
  onExitEdit,
  onEnterEdit,
  bindResize,
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const { window: windowState, winSize } = useCodegenStore();
  const { scale, offset, zoomAt, zoomIn, zoomOut, resetView, handleSlider, zoomPercent } =
    useCanvasTransform();

  // 鼠标滚轮缩放
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;

    const handler = (e: WheelEvent) => {
      if (isEditingRef.current) return;
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const factor = e.deltaY > 0 ? ZOOM_FACTOR_OUT : ZOOM_FACTOR_IN;
      zoomAt(scale * factor, rect.width / 2, rect.height / 2);
    };

    el.addEventListener('wheel', handler, { passive: false });
    return () => el.removeEventListener('wheel', handler);
  }, [zoomAt, scale, isEditingRef]);

  // 键盘事件
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape' && isEditingRef.current) {
        onExitEdit();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isEditingRef, onExitEdit]);

  // 缩放控制
  const handleZoomIn = useCallback(() => {
    const el = canvasRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    zoomIn(rect.width, rect.height);
  }, [zoomIn]);

  const handleZoomOut = useCallback(() => {
    const el = canvasRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    zoomOut(rect.width, rect.height);
  }, [zoomOut]);

  const handleReset = useCallback(() => {
    resetView();
  }, [resetView]);

  const handleSliderChange = useCallback(
    (newScale: number) => {
      const el = canvasRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      handleSlider(newScale, rect.width, rect.height);
    },
    [handleSlider],
  );

  return (
    <main
      ref={canvasRef}
      className="flex-1 h-full relative overflow-hidden"
      style={{
        backgroundColor: '#E8E8F0',
      }}
    >
      {/* 变换层 */}
      <div
        className="absolute inset-0"
        style={{
          transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
          transformOrigin: '0 0',
        }}
      >
        <CodeWindow
          winSize={winSize}
          isEditing={isEditing}
          padding={windowState.padding}
          onEnterEdit={onEnterEdit}
          onExitEdit={onExitEdit}
          bindResize={bindResize}
          exportRef={onExportRef}
          codeWindowRef={onCodeWindowRef}
        />
      </div>

      {/* 缩放控制 */}
      <ZoomControls
        scale={scale}
        zoomPercent={zoomPercent}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onReset={handleReset}
        onSliderChange={handleSliderChange}
      />
    </main>
  );
};
