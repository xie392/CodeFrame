/**
 * LeaferCanvas 组件
 * 纯 Leafer 渲染路径：图片+帧+标注全部在 Leafer 内渲染
 */

import React, {
  useRef,
  useEffect,
  useCallback,
  useMemo,
  useState,
  useLayoutEffect,
} from 'react';
import { useEditorStore } from '../../store/editor-store';
import { useRendererBackend } from '../../backends/hooks/useRendererBackend';
import { useBackendSync } from '../../backends/hooks/useBackendSync';
import { ZoomControls } from '../ZoomControls';
import { useCrop } from '../../hooks/useCrop';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { useSyncedRef } from '../../hooks/useSyncedRef';
import { CropHint } from '../CropHint';
import { useLeaferExport } from '../../backends/leafer/hooks/useLeaferExport';
import { useLeaferHistory } from '../../backends/leafer/hooks/useLeaferHistory';
import type { EditorState } from '../../types';
import { MAX_IMG_W, MAX_IMG_H } from '../../constants';
import { useTextEditing } from '../../hooks/useTextEditing';
import { TextEditorInput } from '../TextEditorInput';

export interface LeaferCanvasProps {
  onHistoryActions?: (
    actions: ReturnType<
      typeof useLeaferHistory
    >
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
  const editingTextId = useEditorStore(
    (s) => s.editingTextId,
  );
  const editingTextValue = useEditorStore(
    (s) => s.editingTextValue,
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

  // 文字编辑
  const {
    textInputRef,
    startEditing,
    stopEditing,
    handleTextChange,
  } = useTextEditing(
    { editingTextId, editingTextValue },
    {
      setEditingTextId: useEditorStore.getState().setEditingTextId,
      setEditingTextValue: useEditorStore.getState().setEditingTextValue,
      setTexts: useEditorStore.getState().setTexts,
      setSelectedTextIds: useEditorStore.getState().setSelectedTextIds,
    },
  );

  const editingText = useMemo(
    () =>
      editingTextId
        ? texts.find((t) => t.id === editingTextId) ?? null
        : null,
    [texts, editingTextId],
  );

  // Leafer 后端
  const { backend } = useRendererBackend({
    containerRef: leaferContainerRef,
    imageDisplaySize,
    frameSettings,
    imageUrl: imageData ?? '',
  });

  // Store ↔ Backend 同步
  useBackendSync(backend);

  // 注册双击文字编辑回调
  useEffect(() => {
    if (!backend) return;
    const b = backend as {
      setTextDoubleClickCallback?: (cb: ((id: string) => void) | null) => void;
    };
    b.setTextDoubleClickCallback?.((id: string) => {
      const text = useEditorStore.getState().texts.find((t) => t.id === id);
      if (text) {
        startEditing(text);
      }
    });
    return () => {
      b.setTextDoubleClickCallback?.(null);
    };
  }, [backend, startEditing]);

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

  // ---- 图片尺寸计算（无 DOM，直接用 Image 对象） ----
  useEffect(() => {
    if (!imageData) return;
    const img = new window.Image();
    img.onload = () => {
      const nw = img.naturalWidth;
      const nh = img.naturalHeight;
      setImageNaturalSize({
        width: nw,
        height: nh,
      });

      if (!imageDisplaySize) {
        const maxW = Math.min(MAX_IMG_W, nw);
        const maxH = Math.min(MAX_IMG_H, nh);
        const ratio = Math.min(
          maxW / nw,
          maxH / nh,
        );
        const displayW = nw * ratio;
        const displayH = nh * ratio;
        setImageDisplaySize({
          width: displayW,
          height: displayH,
        });
      }
    };
    img.src = imageData;
  }, [imageData, imageDisplaySize, setImageDisplaySize, setImageNaturalSize]);

  // 导出容器 ref（纯 Leafer 不再需要 DOM 层导出）
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

  // Leafer 容器 resize + 初始居中
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

  // 初始化后居中视口
  useEffect(() => {
    if (!backend) return;
    // 延迟一帧确保 Leafer 布局完成
    const id = requestAnimationFrame(() => {
      (
        backend as {
          centerViewport?: () => void;
        }
      ).centerViewport?.();
    });
    return () => cancelAnimationFrame(id);
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

  // 通过 Leafer CoordTransformer 精确计算文字屏幕坐标
  // imageToScreen 返回相对于 Leafer app.view 元素的坐标
  // 需要在 DOM 更新后用 useLayoutEffect 计算 view 相对于 <main> 的偏移
  const [textEditorPosition, setTextEditorPosition] =
    useState<{ left: number; top: number } | undefined>(undefined);

  useLayoutEffect(() => {
    if (!editingText || !backend) {
      setTextEditorPosition(undefined);
      return;
    }
    const b = backend as {
      getCoordTransformer?: () => {
        imageToScreen: (
          x: number,
          y: number,
        ) => { x: number; y: number };
      };
      getAppResult?: () => {
        app: { view: unknown };
      } | null;
    };
    const transformer = b.getCoordTransformer?.();
    const appResult = b.getAppResult?.();
    if (!transformer || !appResult) {
      setTextEditorPosition(undefined);
      return;
    }
    const screen = transformer.imageToScreen(
      editingText.x,
      editingText.y,
    );

    // imageToScreen 返回相对于 Leafer app.view 的坐标
    // 需要加上 app.view 相对于 <main> 的偏移
    const container = leaferContainerRef.current;
    const viewEl = appResult.app.view as HTMLElement | null;
    let viewOffsetX = 0;
    let viewOffsetY = 0;
    if (container && viewEl) {
      const containerRect = container.getBoundingClientRect();
      const viewRect = viewEl.getBoundingClientRect();
      viewOffsetX = viewRect.left - containerRect.left;
      viewOffsetY = viewRect.top - containerRect.top;
    }

    setTextEditorPosition({
      left: screen.x + viewOffsetX,
      top: screen.y + viewOffsetY,
    });
  }, [editingText, backend, scale, offset]);

  return (
    <>
      {/* 纯 Leafer Canvas 层 — 图片+帧+标注全部在此渲染 */}
      <div
        ref={leaferContainerRef}
        className="absolute inset-0"
        style={{ pointerEvents: 'auto' }}
      />

      {/* 文字编辑输入框 */}
      {editingText && (
        <TextEditorInput
          text={editingText}
          value={editingTextValue}
          scale={scale}
          position={textEditorPosition}
          offset={offset}
          inputRef={textInputRef}
          onChange={handleTextChange}
          onSave={() => stopEditing(true)}
          onCancel={() => stopEditing(false)}
        />
      )}

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
          (
            backend as {
              centerViewport?: () => void;
            }
          ).centerViewport?.();
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
