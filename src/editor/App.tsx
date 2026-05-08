/**
 * Editor 主组件
 * 统一使用 Leafer 渲染路径
 */

import React, {
  useEffect,
  useCallback,
  useRef,
  useState,
  useMemo,
} from 'react';
import { useSettingsStore } from '@shared/stores/settings-store';

import type {
  EditorState,
  ArrowShape,
  RectShape,
  TextShape,
  MosaicShape,
  ToolId,
} from './types';

import { useEditorStore } from './store/editor-store';

import { useEditorHistory } from './hooks/useEditorHistory';
import { useEditorInit } from './hooks/useEditorInit';

import { Toolbar } from './components/Toolbar';
import { PropertiesPanel } from './components/PropertiesPanel';
import { UploadPlaceholder } from './components/UploadPlaceholder';
import { LeaferCanvas } from './components/LeaferCanvas';
import { CropToolbar } from './components/CropToolbar';

// ---------------------------------------------------------------------------
// App 组件
// ---------------------------------------------------------------------------
export const App: React.FC = () => {
  // ---------------------------------------------------------------------------
  // Store 状态
  // ---------------------------------------------------------------------------
  const {
    activeTool, setActiveTool,
    imageData, setImageData,
    arrows, setArrows,
    rects, setRects,
    texts, setTexts,
    mosaics, setMosaics,
    selectedArrowIds,
    selectedRectIds,
    selectedTextIds,
    selectedMosaicIds,
    canUndo, setCanUndo,
    canRedo, setCanRedo,
    collapsedSections, setCollapsedSections,
    frameSettings, setFrameSettings,
    lastUsedStyles,
    error,
    source,
    isCropMode, enterCropMode, exitCropMode,
  } = useEditorStore();

  const setError = useEditorStore((s) => s.setError);
  const updateLastUsedStyles = useEditorStore((s) => s.updateLastUsedStyles);

  // 用户设置
  const {
    settings,
    operationHistory,
    updateOperationHistory,
  } = useSettingsStore();
  const historyRestoredRef = useRef(false);

  // ---------------------------------------------------------------------------
  // 历史记录（由 LeaferCanvas 通过回调驱动）
  // ---------------------------------------------------------------------------
  const historyActionsRef = useRef(
    useEditorHistory()
  );

  const updateHistoryButtons = useCallback(() => {
    setCanUndo(
      historyActionsRef.current.canUndo()
    );
    setCanRedo(
      historyActionsRef.current.canRedo()
    );
  }, [setCanUndo, setCanRedo]);

  const pushHistory = useCallback(() => {
    const store = useEditorStore.getState();
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
    historyActionsRef.current.pushState(state);
    updateHistoryButtons();
  }, [updateHistoryButtons]);

  // ---------------------------------------------------------------------------
  // 初始化 Hook（解析 source，显示上传入口等）
  // ---------------------------------------------------------------------------
  const initializedRef = useRef(false);

  useEditorInit(
    {
      source,
      imageData,
      initializedRef,
    },
    {
      setSource: useEditorStore.getState().setSource,
      setImageData,
      setError,
      resetHistory: (state) =>
        historyActionsRef.current.resetToState(
          state as EditorState
        ),
      updateHistoryButtons,
    }
  );

  // Undo/Redo（由 LeaferCanvas 通过回调驱动）
  const undoRedoRef = useRef({
    handleUndo: () => {},
    handleRedo: () => {},
  });

  const handleUndo = useCallback(() => {
    undoRedoRef.current.handleUndo();
  }, []);

  const handleRedo = useCallback(() => {
    undoRedoRef.current.handleRedo();
  }, []);

  // 导出状态（由 LeaferCanvas 通过回调更新）
  const [exportState, setExportState] =
    useState({
      isExporting: false,
      copied: false,
      exportError: null as string | null,
      handleExportImage:
        async () => {},
      handleCopyToClipboard:
        async () => {},
    });

  // ---------------------------------------------------------------------------
  // 操作历史恢复
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (historyRestoredRef.current) return;
    if (
      !settings.saveOperationHistory ||
      !operationHistory.editor
    ) {
      historyRestoredRef.current = true;
      return;
    }
    historyRestoredRef.current = true;
    const saved = operationHistory.editor;
    if (saved.activeTool) {
      setActiveTool(saved.activeTool as ToolId);
    }
    if (saved.collapsedSections) {
      setCollapsedSections(saved.collapsedSections);
    }
    if (saved.frameSettings) {
      setFrameSettings((prev) => ({
        ...prev,
        ...saved.frameSettings,
      }));
    }
    if (saved.lastUsedStyles) {
      const store = useEditorStore.getState();
      if (saved.lastUsedStyles.arrow) {
        store.updateLastUsedStyles(
          'arrow',
          saved.lastUsedStyles.arrow
        );
      }
      if (saved.lastUsedStyles.rect) {
        store.updateLastUsedStyles(
          'rect',
          saved.lastUsedStyles.rect
        );
      }
      if (saved.lastUsedStyles.text) {
        store.updateLastUsedStyles(
          'text',
          saved.lastUsedStyles.text
        );
      }
      if (saved.lastUsedStyles.mosaic) {
        store.updateLastUsedStyles(
          'mosaic',
          saved.lastUsedStyles.mosaic
        );
      }
    }
  }, [
    settings.saveOperationHistory,
    operationHistory.editor,
    setActiveTool,
    setCollapsedSections,
    setFrameSettings,
  ]);

  // ---------------------------------------------------------------------------
  // 操作历史保存
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!historyRestoredRef.current) return;
    if (!settings.saveOperationHistory) return;

    updateOperationHistory('editor', {
      activeTool,
      collapsedSections,
      frameSettings,
      lastUsedStyles,
    });
  }, [
    activeTool,
    collapsedSections,
    frameSettings,
    lastUsedStyles,
    settings.saveOperationHistory,
    updateOperationHistory,
  ]);

  // ---------------------------------------------------------------------------
  // 属性更新函数
  // ---------------------------------------------------------------------------
  const updateArrow = useCallback(
    (updates: Partial<ArrowShape>) => {
      if (selectedArrowIds.length !== 1) return;
      pushHistory();
      setArrows((prev) =>
        prev.map((a) =>
          a.id === selectedArrowIds[0]
            ? { ...a, ...updates }
            : a
        )
      );
      updateLastUsedStyles('arrow', updates);
    },
    [selectedArrowIds, pushHistory, setArrows, updateLastUsedStyles]
  );

  const updateRect = useCallback(
    (updates: Partial<RectShape>) => {
      if (selectedRectIds.length !== 1) return;
      pushHistory();
      setRects((prev) =>
        prev.map((r) =>
          r.id === selectedRectIds[0]
            ? { ...r, ...updates }
            : r
        )
      );
      updateLastUsedStyles('rect', updates);
    },
    [selectedRectIds, pushHistory, setRects, updateLastUsedStyles]
  );

  const updateText = useCallback(
    (updates: Partial<TextShape>) => {
      if (selectedTextIds.length !== 1) return;
      pushHistory();
      setTexts((prev) =>
        prev.map((t) =>
          t.id === selectedTextIds[0]
            ? { ...t, ...updates }
            : t
        )
      );
      updateLastUsedStyles('text', updates);
    },
    [selectedTextIds, pushHistory, setTexts, updateLastUsedStyles]
  );

  const updateMosaic = useCallback(
    (updates: Partial<MosaicShape>) => {
      if (selectedMosaicIds.length !== 1) return;
      pushHistory();
      setMosaics((prev) =>
        prev.map((m) =>
          m.id === selectedMosaicIds[0]
            ? { ...m, ...updates }
            : m
        )
      );
      updateLastUsedStyles('mosaic', updates);
    },
    [selectedMosaicIds, pushHistory, setMosaics, updateLastUsedStyles]
  );

  // ---------------------------------------------------------------------------
  // 选中的对象
  // ---------------------------------------------------------------------------
  const selectedArrow = useMemo(
    () =>
      selectedArrowIds.length === 1
        ? arrows.find(
            (a) => a.id === selectedArrowIds[0]
          ) ?? null
        : null,
    [arrows, selectedArrowIds]
  );
  const selectedRect = useMemo(
    () =>
      selectedRectIds.length === 1
        ? rects.find(
            (r) => r.id === selectedRectIds[0]
          ) ?? null
        : null,
    [rects, selectedRectIds]
  );
  const selectedText = useMemo(
    () =>
      selectedTextIds.length === 1
        ? texts.find(
            (t) => t.id === selectedTextIds[0]
          ) ?? null
        : null,
    [texts, selectedTextIds]
  );
  const selectedMosaic = useMemo(
    () =>
      selectedMosaicIds.length === 1
        ? mosaics.find(
            (m) => m.id === selectedMosaicIds[0]
          ) ?? null
        : null,
    [mosaics, selectedMosaicIds]
  );

  // ---------------------------------------------------------------------------
  // 图片加载回调
  // ---------------------------------------------------------------------------
  const handleImageLoad = useCallback(
    (dataUrl: string) => {
      setImageData(dataUrl);
      setError(null);
    },
    [setImageData, setError]
  );

  // ---------------------------------------------------------------------------
  // 渲染
  // ---------------------------------------------------------------------------
  const showPlaceholder =
    source === 'upload' &&
    !imageData &&
    !error;

  // LeaferCanvas 回调
  const handleHistoryActions = useCallback(
    (
      actions: ReturnType<
        typeof useEditorHistory
      >
    ) => {
      historyActionsRef.current = actions;
    },
    []
  );

  const handleExportHandlers = useCallback(
    (handlers: {
      isExporting: boolean;
      copied: boolean;
      exportError: string | null;
      handleExportImage: () => Promise<void>;
      handleCopyToClipboard: () => Promise<void>;
    }) => {
      setExportState(handlers);
    },
    []
  );

  const handleUndoRedo = useCallback(
    (handlers: {
      handleUndo: () => void;
      handleRedo: () => void;
    }) => {
      undoRedoRef.current = handlers;
    },
    []
  );

  return (
    <div className="editor-container w-screen h-screen flex overflow-hidden">
      <Toolbar
        activeTool={activeTool}
        onSelectTool={setActiveTool}
        isCropMode={isCropMode}
        onEnterCropMode={enterCropMode}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={handleUndo}
        onRedo={handleRedo}
      />
      <main
        className="editor-canvas flex-1 h-full relative overflow-hidden"
        style={{
          cursor: isCropMode
            ? 'crosshair'
            : ['arrow', 'rect', 'text', 'mosaic'].includes(activeTool)
              ? 'crosshair'
              : 'default',
        }}
      >
        {error ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <p className="text-[13px] text-(--color-editor-error) font-body mb-1">
                // capture error
              </p>
              <p className="text-[11px] text-(--color-editor-hint) font-body">
                {error}
              </p>
            </div>
          </div>
        ) : imageData ? (
          <>
            <LeaferCanvas
              onHistoryActions={
                handleHistoryActions
              }
              onExportHandlers={
                handleExportHandlers
              }
              onUndoRedo={handleUndoRedo}
            />
            {isCropMode && (
              <CropToolbar
                onConfirm={() => {
                  // 裁剪确认由 LeaferCanvas 内部处理
                  // 这里只触发退出（实际裁剪逻辑在 backend 中）
                  exitCropMode();
                }}
                onCancel={exitCropMode}
              />
            )}
          </>
        ) : showPlaceholder ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <UploadPlaceholder
              onImageLoad={handleImageLoad}
            />
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-[13px] text-(--color-editor-comment) font-body">
              // editor_canvas
            </p>
          </div>
        )}
      </main>
      <PropertiesPanel
        selectedArrow={selectedArrow}
        onUpdateArrow={updateArrow}
        selectedRect={selectedRect}
        onUpdateRect={updateRect}
        selectedText={selectedText}
        onUpdateText={updateText}
        selectedMosaic={selectedMosaic}
        onUpdateMosaic={updateMosaic}
        onMoveLayerUp={useEditorStore.getState().moveLayerUp}
        onMoveLayerDown={useEditorStore.getState().moveLayerDown}
        frameSettings={frameSettings}
        onUpdateFrameSettings={(updates) =>
          setFrameSettings((prev) => ({
            ...prev,
            ...updates,
          }))
        }
        collapsedSections={collapsedSections}
        onCollapsedChange={setCollapsedSections}
        onExportImage={() =>
          exportState.handleExportImage()
        }
        onCopyToClipboard={() =>
          exportState.handleCopyToClipboard()
        }
        isExporting={exportState.isExporting}
        copied={exportState.copied}
        exportError={exportState.exportError}
      />
    </div>
  );
};

export default App;
