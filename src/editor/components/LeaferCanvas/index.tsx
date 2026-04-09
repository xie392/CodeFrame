/**
 * LeaferCanvas 组件
 * LeaferJS 渲染路径入口
 * 使用 useBackendSync + useRendererBackend
 */

import React, {
  useRef,
  useEffect,
  useCallback,
} from 'react';
import { useEditorStore } from '../../store/editor-store';
import { useRendererBackend } from '../../backends/hooks/useRendererBackend';
import { useBackendSync } from '../../backends/hooks/useBackendSync';
import { FrameContainer } from '../FrameContainer';
import { ZoomControls } from '../ZoomControls';
import { useCrop } from '../../hooks/useCrop';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { useSyncedRef } from '../../hooks/useSyncedRef';
import { CropHint } from '../CropHint';
import { useLeaferExport } from '../../backends/leafer/hooks/useLeaferExport';
import { useLeaferHistory } from '../../backends/leafer/hooks/useLeaferHistory';
import type { EditorState } from '../../types';

export interface LeaferCanvasProps {
  onHistoryActions?: (
    actions: ReturnType<
      typeof useLeaferHistory
    >,
  ) => void;
  onExportHandlers?: (handlers: {
    isExporting: boolean;
    copied: boolean;
    exportError: string | null;
    handleExportImage: () => Promise<void>;
    handleCopyToClipboard: () => Promise<void>;
  }) => void;
  onUndoRedo?: (handlers: {
    handleUndo: () => void;
    handleRedo: () => void;
  }) => void;
}

export function LeaferCanvas({
  onHistoryActions,
  onExportHandlers,
  onUndoRedo,
}: LeaferCanvasProps): React.ReactElement | null {
  const renderCount = React.useRef(0);
  renderCount.current += 1;
  if (renderCount.current > 5) {
    console.error(
      '[LOOP_DEBUG] LeaferCanvas render #' +
        renderCount.current,
    );
  }

  const leaferContainerRef =
    useRef<HTMLDivElement>(null);

  // Store 状态
  const imageData = useEditorStore(
    (s) => s.imageData,
  );
  const imageDisplaySize = useEditorStore(
    (s) => s.imageDisplaySize,
  );
  const imageNaturalSize = useEditorStore(
    (s) => s.imageNaturalSize,
  );
  const frameSettings = useEditorStore(
    (s) => s.frameSettings,
  );
  const scale = useEditorStore((s) => s.scale);
  const offset = useEditorStore(
    (s) => s.offset,
  );
  const activeTool = useEditorStore(
    (s) => s.activeTool,
  );
  const cropArea = useEditorStore(
    (s) => s.cropArea,
  );
  const arrows = useEditorStore(
    (s) => s.arrows,
  );
  const rects = useEditorStore(
    (s) => s.rects,
  );
  const texts = useEditorStore(
    (s) => s.texts,
  );
  const mosaics = useEditorStore(
    (s) => s.mosaics,
  );
  const selectedArrowIds = useEditorStore(
    (s) => s.selectedArrowIds,
  );
  const selectedRectIds = useEditorStore(
    (s) => s.selectedRectIds,
  );
  const selectedTextIds = useEditorStore(
    (s) => s.selectedTextIds,
  );
  const selectedMosaicIds = useEditorStore(
    (s) => s.selectedMosaicIds,
  );

  const setImageDisplaySize =
    useEditorStore((s) => s.setImageDisplaySize);
  const setImageNaturalSize =
    useEditorStore((s) => s.setImageNaturalSize);
  const setCanUndo = useEditorStore(
    (s) => s.setCanUndo,
  );
  const setCanRedo = useEditorStore(
    (s) => s.setCanRedo,
  );

  // Refs
  const cropAreaRef =
    useSyncedRef(cropArea);
  const imageNaturalSizeRef =
    useSyncedRef(imageNaturalSize);
  const imageDisplaySizeRef =
    useSyncedRef(imageDisplaySize);
  const scaleRef = useSyncedRef(scale);
  const offsetRef = useSyncedRef(offset);

  // Leafer 后端
  const { backend } = useRendererBackend({
    containerRef: leaferContainerRef,
    imageDisplaySize,
  });

  // Store ↔ Backend 同步
  useBackendSync(backend);

  // Leafer 历史记录
  const historyActions =
    useLeaferHistory(backend);

  const updateHistoryButtons =
    useCallback(() => {
      setCanUndo(historyActions.canUndo());
      setCanRedo(historyActions.canRedo());
    }, [
      historyActions,
      setCanUndo,
      setCanRedo,
    ]);

  const pushHistory = useCallback(() => {
    const store =
      useEditorStore.getState();
    const state: EditorState = {
      arrows: structuredClone(store.arrows),
      rects: structuredClone(store.rects),
      texts: structuredClone(store.texts),
      mosaics: structuredClone(store.mosaics),
      imageData: store.imageData,
      view: {
        scale: store.scale,
        offset: { ...store.offset },
      },
      selectedArrowIds: [
        ...store.selectedArrowIds,
      ],
      selectedRectIds: [
        ...store.selectedRectIds,
      ],
      selectedTextIds: [
        ...store.selectedTextIds,
      ],
      selectedMosaicIds: [
        ...store.selectedMosaicIds,
      ],
    };
    historyActions.pushState(state);
    updateHistoryButtons();
  }, [historyActions, updateHistoryButtons]);

  // 回传历史 actions 到 App 层
  useEffect(() => {
    onHistoryActions?.(historyActions);
  }, [historyActions, onHistoryActions]);

  // 回传 undo/redo 到 App 层
  useEffect(() => {
    onUndoRedo?.({
      handleUndo: () => {
        const prev =
          historyActions.undo();
        if (prev) {
          useEditorStore
            .getState()
            .setArrows(prev.arrows);
          useEditorStore
            .getState()
            .setRects(prev.rects);
          useEditorStore
            .getState()
            .setTexts(prev.texts);
          useEditorStore
            .getState()
            .setMosaics(prev.mosaics);
          useEditorStore
            .getState()
            .setScale(prev.view.scale);
          useEditorStore
            .getState()
            .setOffset(prev.view.offset);
          useEditorStore
            .getState()
            .setSelectedArrowIds(
              prev.selectedArrowIds,
            );
          useEditorStore
            .getState()
            .setSelectedRectIds(
              prev.selectedRectIds,
            );
          useEditorStore
            .getState()
            .setSelectedTextIds(
              prev.selectedTextIds,
            );
          useEditorStore
            .getState()
            .setSelectedMosaicIds(
              prev.selectedMosaicIds,
            );
          updateHistoryButtons();
        }
      },
      handleRedo: () => {
        const next =
          historyActions.redo();
        if (next) {
          useEditorStore
            .getState()
            .setArrows(next.arrows);
          useEditorStore
            .getState()
            .setRects(next.rects);
          useEditorStore
            .getState()
            .setTexts(next.texts);
          useEditorStore
            .getState()
            .setMosaics(next.mosaics);
          useEditorStore
            .getState()
            .setScale(next.view.scale);
          useEditorStore
            .getState()
            .setOffset(next.view.offset);
          useEditorStore
            .getState()
            .setSelectedArrowIds(
              next.selectedArrowIds,
            );
          useEditorStore
            .getState()
            .setSelectedRectIds(
              next.selectedRectIds,
            );
          useEditorStore
            .getState()
            .setSelectedTextIds(
              next.selectedTextIds,
            );
          useEditorStore
            .getState()
            .setSelectedMosaicIds(
              next.selectedMosaicIds,
            );
          updateHistoryButtons();
        }
      },
    });
  }, [
    historyActions,
    updateHistoryButtons,
    onUndoRedo,
  ]);

  // 图片尺寸回调
  const handleImageSizeChange = (
    w: number,
    h: number,
  ) => {
    setImageDisplaySize({
      width: w,
      height: h,
    });
  };

  // 导出容器 ref
  const exportContainerRef =
    useRef<HTMLDivElement>(null);

  // Leafer 导出
  const exportResult = useLeaferExport({
    backend,
    exportContainerRef,
    imageDisplaySize,
    frameSettings,
  });

  // 回传导出 handlers 到 App 层
  useEffect(() => {
    onExportHandlers?.(exportResult);
  }, [exportResult, onExportHandlers]);

  // Leafer 容器 resize
  useEffect(() => {
    const container =
      leaferContainerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(
      (entries) => {
        for (const entry of entries) {
          const { width, height } =
            entry.contentRect;
          backend?.resize(width, height);
        }
      },
    );
    observer.observe(container);
    return () => observer.disconnect();
  }, [backend]);

  // ---- Crop ----
  const { applyCrop, cancelCrop } = useCrop(
    {
      imageData,
      cropAreaRef,
      imageNaturalSizeRef,
      imageDisplaySizeRef,
      scaleRef,
      offsetRef,
    },
    {
      pushHistory,
      setImageData:
        useEditorStore.getState().setImageData,
      setArrows:
        useEditorStore.getState().setArrows,
      setRects:
        useEditorStore.getState().setRects,
      setTexts:
        useEditorStore.getState().setTexts,
      setMosaics:
        useEditorStore.getState().setMosaics,
      setSelectedArrowIds:
        useEditorStore.getState()
          .setSelectedArrowIds,
      setSelectedRectIds:
        useEditorStore.getState()
          .setSelectedRectIds,
      setSelectedTextIds:
        useEditorStore.getState()
          .setSelectedTextIds,
      setSelectedMosaicIds:
        useEditorStore.getState()
          .setSelectedMosaicIds,
      setCropArea:
        useEditorStore.getState().setCropArea,
      setImageNaturalSize:
        useEditorStore.getState()
          .setImageNaturalSize,
      setImageDisplaySize:
        useEditorStore.getState()
          .setImageDisplaySize,
      setActiveTool:
        useEditorStore.getState()
          .setActiveTool,
      setScale:
        useEditorStore.getState().setScale,
      setOffset:
        useEditorStore.getState().setOffset,
    },
  );

  // ---- Keyboard Shortcuts ----
  const isMarqueeRef = useRef(false);

  useKeyboardShortcuts(
    {
      activeTool,
      cropArea,
      selection: {
        arrowIds: selectedArrowIds,
        rectIds: selectedRectIds,
        textIds: selectedTextIds,
        mosaicIds: selectedMosaicIds,
      },
      isMarqueeSelecting: isMarqueeRef,
    },
    {
      onUndo: () => {
        const prev =
          historyActions.undo();
        if (prev) {
          const store =
            useEditorStore.getState();
          store.setArrows(prev.arrows);
          store.setRects(prev.rects);
          store.setTexts(prev.texts);
          store.setMosaics(prev.mosaics);
          store.setScale(prev.view.scale);
          store.setOffset(prev.view.offset);
          store.setSelectedArrowIds(
            prev.selectedArrowIds,
          );
          store.setSelectedRectIds(
            prev.selectedRectIds,
          );
          store.setSelectedTextIds(
            prev.selectedTextIds,
          );
          store.setSelectedMosaicIds(
            prev.selectedMosaicIds,
          );
          updateHistoryButtons();
        }
      },
      onRedo: () => {
        const next =
          historyActions.redo();
        if (next) {
          const store =
            useEditorStore.getState();
          store.setArrows(next.arrows);
          store.setRects(next.rects);
          store.setTexts(next.texts);
          store.setMosaics(next.mosaics);
          store.setScale(next.view.scale);
          store.setOffset(next.view.offset);
          store.setSelectedArrowIds(
            next.selectedArrowIds,
          );
          store.setSelectedRectIds(
            next.selectedRectIds,
          );
          store.setSelectedTextIds(
            next.selectedTextIds,
          );
          store.setSelectedMosaicIds(
            next.selectedMosaicIds,
          );
          updateHistoryButtons();
        }
      },
      onSelectAll: () => {
        useEditorStore
          .getState()
          .setSelectedArrowIds(
            arrows.map((a) => a.id),
          );
        useEditorStore
          .getState()
          .setSelectedRectIds(
            rects.map((r) => r.id),
          );
        useEditorStore
          .getState()
          .setSelectedTextIds(
            texts.map((t) => t.id),
          );
        useEditorStore
          .getState()
          .setSelectedMosaicIds(
            mosaics.map((m) => m.id),
          );
      },
      onClearSelection: () => {
        const store =
          useEditorStore.getState();
        store.setSelectedArrowIds([]);
        store.setSelectedRectIds([]);
        store.setSelectedTextIds([]);
        store.setSelectedMosaicIds([]);
      },
      onDelete: () => {
        const store =
          useEditorStore.getState();
        if (selectedArrowIds.length > 0) {
          store.setArrows((prev) =>
            prev.filter(
              (a) =>
                !selectedArrowIds.includes(
                  a.id,
                ),
            ),
          );
          store.setSelectedArrowIds([]);
        }
        if (selectedRectIds.length > 0) {
          store.setRects((prev) =>
            prev.filter(
              (r) =>
                !selectedRectIds.includes(
                  r.id,
                ),
            ),
          );
          store.setSelectedRectIds([]);
        }
        if (selectedTextIds.length > 0) {
          store.setTexts((prev) =>
            prev.filter(
              (t) =>
                !selectedTextIds.includes(
                  t.id,
                ),
            ),
          );
          store.setSelectedTextIds([]);
        }
        if (selectedMosaicIds.length > 0) {
          store.setMosaics((prev) =>
            prev.filter(
              (m) =>
                !selectedMosaicIds.includes(
                  m.id,
                ),
            ),
          );
          store.setSelectedMosaicIds([]);
        }
      },
      onApplyCrop: applyCrop,
      onCancelCrop: cancelCrop,
      pushHistory,
    },
  );

  if (!imageData) return null;

  return (
    <>
      {/* 帧容器（CSS 渲染，底层）
          pointerEvents: none 确保事件
          穿透到 Leafer Canvas 覆盖层 */}
      <div
        className="absolute inset-0"
        style={{
          transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
          transformOrigin: '0 0',
          pointerEvents: 'none',
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
            h: number,
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

      {/* 裁剪提示 */}
      {activeTool === 'crop' && (
        <CropHint cropArea={cropArea} />
      )}

      {/* 缩放控件 */}
      <ZoomControls
        scale={scale}
        zoomPercent={Math.round(scale * 100)}
        onZoomIn={() =>
          useEditorStore
            .getState()
            .setScale(
              Math.min(4, scale * 1.2),
            )
        }
        onZoomOut={() =>
          useEditorStore
            .getState()
            .setScale(
              Math.max(0.25, scale / 1.2),
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
