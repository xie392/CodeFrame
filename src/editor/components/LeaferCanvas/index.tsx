/**
 * LeaferCanvas 组件
 * LeaferJS 渲染路径入口
 * 使用 useBackendSync + useRendererBackend
 */

import React, { useRef, useEffect } from 'react';
import { useEditorStore } from '../../store/editor-store';
import { useRendererBackend } from '../../backends/hooks/useRendererBackend';
import { useBackendSync } from '../../backends/hooks/useBackendSync';
import { FrameContainer } from '../FrameContainer';
import { ZoomControls } from '../ZoomControls';

export function LeaferCanvas(): React.ReactElement | null {
  const leaferContainerRef =
    useRef<HTMLDivElement>(null);

  // Store 状态
  const imageData = useEditorStore(
    (s) => s.imageData
  );
  const imageDisplaySize = useEditorStore(
    (s) => s.imageDisplaySize
  );
  const frameSettings = useEditorStore(
    (s) => s.frameSettings
  );
  const scale = useEditorStore((s) => s.scale);
  const offset = useEditorStore(
    (s) => s.offset
  );
  const activeTool = useEditorStore(
    (s) => s.activeTool
  );

  const setImageDisplaySize =
    useEditorStore((s) => s.setImageDisplaySize);
  const setImageNaturalSize =
    useEditorStore((s) => s.setImageNaturalSize);

  // Leafer 后端
  const { backend } = useRendererBackend({
    containerRef: leaferContainerRef,
    imageDisplaySize,
  });

  // Store ↔ Backend 同步
  useBackendSync(backend);

  // 图片尺寸回调
  const handleImageSizeChange = (
    w: number,
    h: number
  ) => {
    setImageDisplaySize({
      width: w,
      height: h,
    });
  };

  // 导出容器 ref（Phase 4 实现分层导出）
  const exportContainerRef =
    useRef<HTMLDivElement>(null);

  // Leafer 容器 resize
  useEffect(() => {
    const container = leaferContainerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(
      (entries) => {
        for (const entry of entries) {
          const { width, height } =
            entry.contentRect;
          backend?.resize(width, height);
        }
      }
    );
    observer.observe(container);
    return () => observer.disconnect();
  }, [backend]);

  if (!imageData) return null;

  return (
    <>
      {/* 帧容器（CSS 渲染，底层） */}
      <div
        className="absolute inset-0"
        style={{
          transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
          transformOrigin: '0 0',
        }}
      >
        <FrameContainer
          imageData={imageData}
          imageDisplaySize={imageDisplaySize}
          frameSettings={frameSettings}
          onImageSizeChange={
            handleImageSizeChange
          }
          onNaturalSizeChange={(
            w: number,
            h: number
          ) =>
            setImageNaturalSize({
              width: w,
              height: h,
            })
          }
          exportContainerRef={
            exportContainerRef
          }
        />
      </div>

      {/* Leafer Canvas 覆盖层 */}
      <div
        ref={leaferContainerRef}
        className="absolute inset-0"
        style={{ pointerEvents: 'auto' }}
      />

      {/* 裁剪提示（临时，Phase 3 实现裁剪框 Overlay） */}
      {activeTool === 'crop' && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 text-xs text-[var(--color-editor-hint)] font-body">
          {/* CropHint 在 Leafer 路径下由
              CropOverlay 替代 */}
          crop mode
        </div>
      )}

      {/* 缩放控件 */}
      <ZoomControls
        scale={scale}
        zoomPercent={Math.round(scale * 100)}
        onZoomIn={() =>
          useEditorStore
            .getState()
            .setScale(
              Math.min(4, scale * 1.2)
            )
        }
        onZoomOut={() =>
          useEditorStore
            .getState()
            .setScale(
              Math.max(0.25, scale / 1.2)
            )
        }
        onReset={() => {
          useEditorStore
            .getState()
            .setScale(1);
          useEditorStore
            .getState()
            .setOffset({ x: 0, y: 0 });
        }}
        onSliderChange={(newScale: number) =>
          useEditorStore
            .getState()
            .setScale(newScale)
        }
      />
    </>
  );
}
