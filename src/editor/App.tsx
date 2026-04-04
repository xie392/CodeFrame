/**
 * Editor 主组件
 * 重构后的精简版本，行数目标 < 500 行
 */

import React, { useEffect, useCallback, useRef, useMemo } from 'react';
import { useSettingsStore } from '@shared/stores/settings-store';
import { useShortcutListener } from '@shared/hooks/useShortcutListener';

// 导入类型
import type { EditorState, ArrowShape, RectShape, TextShape, MosaicShape, ToolId } from './types';

// 导入常量
// MIN_CROP_SIZE, DRAW_MIN_DISTANCE, SHAPE_MIN_SIZE 由 useEditorEvents 内部使用

// 导入 Hooks
import { useSyncedRef } from './hooks/useSyncedRef';
import { useZoomPan } from './hooks/useZoomPan';
import { useEditorHistory } from './hooks/useEditorHistory';
import { useExport } from './hooks/useExport';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useCrop } from './hooks/useCrop';
import { useTextEditing } from './hooks/useTextEditing';
import { useEditorEvents } from './hooks/useEditorEvents';
import { useEditorInit } from './hooks/useEditorInit';

// 导入 Store
import { useEditorStore } from './store/editor-store';

// 导入 Canvas 渲染器
import { CanvasRenderer } from './services/canvas-renderer';

// 导入图形处理辅助函数
import { isPointInText, isPointInCrop } from './utils/shape-helpers';

// 导入组件
import { Toolbar } from './components/Toolbar';
import { PropertiesPanel } from './components/PropertiesPanel';
import { UploadPlaceholder } from './components/UploadPlaceholder';
import { FrameContainer } from './components/FrameContainer';
import { TextEditorInput } from './components/TextEditorInput';
import { CropHint } from './components/CropHint';
import { ZoomControls } from './components/ZoomControls';

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
    imageNaturalSize, setImageNaturalSize,
    imageDisplaySize, setImageDisplaySize,
    arrows, setArrows,
    rects, setRects,
    texts, setTexts,
    mosaics, setMosaics,
    selectedArrowIds, setSelectedArrowIds,
    selectedRectIds, setSelectedRectIds,
    selectedTextIds, setSelectedTextIds,
    selectedMosaicIds, setSelectedMosaicIds,
    cropArea, setCropArea,
    editingTextId, setEditingTextId,
    editingTextValue, setEditingTextValue,
    canUndo, setCanUndo,
    canRedo, setCanRedo,
    collapsedSections, setCollapsedSections,
    frameSettings, setFrameSettings,
    error, setError,
    source, setSource,
  } = useEditorStore();

  // Refs
  const canvasRef = useRef<HTMLDivElement>(null);
  const annotationCanvasRef = useRef<HTMLCanvasElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const exportContainerRef = useRef<HTMLDivElement>(null);
  const textInputRef = useRef<HTMLInputElement>(null);
  const imageCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const initialized = useRef(false);

  // 用户设置
  const { settings, operationHistory, updateOperationHistory } = useSettingsStore();
  const historyRestoredRef = useRef(false);

  // ---------------------------------------------------------------------------
  // 缩放和平移 Hook
  // ---------------------------------------------------------------------------
  const {
    scale, offset, scaleRef, offsetRef, setScale, setOffset,
    zoomIn, zoomOut, resetView, handleSlider, zoomPercent,
  } = useZoomPan({ containerRef: canvasRef, activeTool, imageData });

  // ---------------------------------------------------------------------------
  // 数据 Refs
  // ---------------------------------------------------------------------------
  const arrowsRef = useSyncedRef(arrows);
  const rectsRef = useSyncedRef(rects);
  const textsRef = useSyncedRef(texts);
  const mosaicsRef = useSyncedRef(mosaics);
  const selectedArrowIdsRef = useSyncedRef(selectedArrowIds);
  const selectedRectIdsRef = useSyncedRef(selectedRectIds);
  const selectedTextIdsRef = useSyncedRef(selectedTextIds);
  const selectedMosaicIdsRef = useSyncedRef(selectedMosaicIds);
  const cropAreaRef = useSyncedRef(cropArea);
  const imageNaturalSizeRef = useSyncedRef(imageNaturalSize);
  const imageDisplaySizeRef = useSyncedRef(imageDisplaySize);

  // ---------------------------------------------------------------------------
  // 历史记录
  // ---------------------------------------------------------------------------
  const historyActions = useEditorHistory();

  const updateHistoryButtons = useCallback(() => {
    setCanUndo(historyActions.canUndo());
    setCanRedo(historyActions.canRedo());
  }, [historyActions, setCanUndo, setCanRedo]);

  const pushHistory = useCallback(() => {
    const state: EditorState = {
      arrows: structuredClone(arrowsRef.current),
      rects: structuredClone(rectsRef.current),
      texts: structuredClone(textsRef.current),
      mosaics: structuredClone(mosaicsRef.current),
      imageData,
      view: { scale: scaleRef.current, offset: { ...offsetRef.current } },
      selectedArrowIds: [...selectedArrowIdsRef.current],
      selectedRectIds: [...selectedRectIdsRef.current],
      selectedTextIds: [...selectedTextIdsRef.current],
      selectedMosaicIds: [...selectedMosaicIdsRef.current],
    };
    historyActions.pushState(state);
    updateHistoryButtons();
  }, [historyActions, imageData, updateHistoryButtons, arrowsRef, rectsRef, textsRef, mosaicsRef, scaleRef, offsetRef, selectedArrowIdsRef, selectedRectIdsRef, selectedTextIdsRef, selectedMosaicIdsRef]);

  const handleUndo = useCallback(() => {
    const prevState = historyActions.undo();
    if (prevState) {
      setArrows(prevState.arrows);
      setRects(prevState.rects);
      setTexts(prevState.texts);
      setMosaics(prevState.mosaics);
      arrowsRef.current = prevState.arrows;
      rectsRef.current = prevState.rects;
      textsRef.current = prevState.texts;
      mosaicsRef.current = prevState.mosaics;
      if (prevState.imageData && prevState.imageData !== imageData) setImageData(prevState.imageData);
      setScale(prevState.view.scale);
      setOffset(prevState.view.offset);
      scaleRef.current = prevState.view.scale;
      offsetRef.current = prevState.view.offset;
      setSelectedArrowIds(prevState.selectedArrowIds);
      setSelectedRectIds(prevState.selectedRectIds);
      setSelectedTextIds(prevState.selectedTextIds);
      setSelectedMosaicIds(prevState.selectedMosaicIds);
    }
    updateHistoryButtons();
  }, [historyActions, imageData, updateHistoryButtons, setScale, setOffset, setArrows, setRects, setTexts, setMosaics, setSelectedArrowIds, setSelectedRectIds, setSelectedTextIds, setSelectedMosaicIds, setImageData, arrowsRef, rectsRef, textsRef, mosaicsRef, scaleRef, offsetRef]);

  const handleRedo = useCallback(() => {
    const nextState = historyActions.redo();
    if (nextState) {
      setArrows(nextState.arrows);
      setRects(nextState.rects);
      setTexts(nextState.texts);
      setMosaics(nextState.mosaics);
      arrowsRef.current = nextState.arrows;
      rectsRef.current = nextState.rects;
      textsRef.current = nextState.texts;
      mosaicsRef.current = nextState.mosaics;
      if (nextState.imageData && nextState.imageData !== imageData) setImageData(nextState.imageData);
      setScale(nextState.view.scale);
      setOffset(nextState.view.offset);
      scaleRef.current = nextState.view.scale;
      offsetRef.current = nextState.view.offset;
      setSelectedArrowIds(nextState.selectedArrowIds);
      setSelectedRectIds(nextState.selectedRectIds);
      setSelectedTextIds(nextState.selectedTextIds);
      setSelectedMosaicIds(nextState.selectedMosaicIds);
    }
    updateHistoryButtons();
  }, [historyActions, imageData, updateHistoryButtons, setScale, setOffset, setArrows, setRects, setTexts, setMosaics, setSelectedArrowIds, setSelectedRectIds, setSelectedTextIds, setSelectedMosaicIds, setImageData, arrowsRef, rectsRef, textsRef, mosaicsRef, scaleRef, offsetRef]);

  // ---------------------------------------------------------------------------
  // Canvas 渲染
  // ---------------------------------------------------------------------------
  const screenToImageCoord = useCallback((clientX: number, clientY: number): { x: number; y: number } | null => {
    const canvas = annotationCanvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return {
      x: (clientX - rect.left - offsetRef.current.x) / scaleRef.current,
      y: (clientY - rect.top - offsetRef.current.y) / scaleRef.current,
    };
  }, [offsetRef, scaleRef]);

  const renderShapes = useCallback(() => {
    const canvas = annotationCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(offsetRef.current.x, offsetRef.current.y);
    ctx.scale(scaleRef.current, scaleRef.current);

    const renderer = new CanvasRenderer(ctx);

    // 绘制矩形
    rects.forEach((rect) => renderer.drawRect(rect, selectedRectIds.includes(rect.id)));

    // 绘制箭头
    arrows.forEach((arrow) => renderer.drawArrow(arrow, selectedArrowIds.includes(arrow.id)));

    // 绘制文字
    texts.forEach((text) => {
      if (editingTextId === text.id) return;
      renderer.drawText(text, selectedTextIds.includes(text.id));
    });

    // 绘制马赛克
    mosaics.forEach((mosaic) => renderer.drawMosaic(mosaic, imageCanvasRef.current, selectedMosaicIds.includes(mosaic.id)));

    // 绘制裁剪框
    if (activeTool === 'crop' && imageDisplaySize && cropArea) {
      renderer.drawCropBox(cropArea, imageDisplaySize.width, imageDisplaySize.height);
    }

    ctx.restore();
  }, [arrows, rects, texts, mosaics, selectedArrowIds, selectedRectIds, selectedTextIds, selectedMosaicIds, editingTextId, cropArea, imageDisplaySize, activeTool, offsetRef, scaleRef]);

  // ---------------------------------------------------------------------------
  // 裁剪 Hook
  // ---------------------------------------------------------------------------
  const { applyCrop, cancelCrop } = useCrop(
    { imageData, cropAreaRef, imageNaturalSizeRef, imageDisplaySizeRef, scaleRef, offsetRef },
    { pushHistory, setImageData, setArrows, setRects, setTexts, setMosaics, setSelectedArrowIds, setSelectedRectIds, setSelectedTextIds, setSelectedMosaicIds, setCropArea, setImageNaturalSize, setImageDisplaySize, setActiveTool, setScale, setOffset }
  );

  // ---------------------------------------------------------------------------
  // 文字编辑 Hook
  // ---------------------------------------------------------------------------
  const { startEditing, stopEditing, handleTextChange } = useTextEditing(
    { editingTextId, editingTextValue },
    { setEditingTextId, setEditingTextValue, setTexts, setSelectedTextIds }
  );

  // ---------------------------------------------------------------------------
  // 键盘快捷键 Hook
  // ---------------------------------------------------------------------------
  useKeyboardShortcuts(
    { activeTool, cropArea, selection: { arrowIds: selectedArrowIds, rectIds: selectedRectIds, textIds: selectedTextIds, mosaicIds: selectedMosaicIds }, isMarqueeSelecting: { current: false } as React.MutableRefObject<boolean> },
    {
      onUndo: handleUndo,
      onRedo: handleRedo,
      onSelectAll: () => { setSelectedArrowIds(arrowsRef.current.map(a => a.id)); setSelectedRectIds(rectsRef.current.map(r => r.id)); setSelectedTextIds(textsRef.current.map(t => t.id)); setSelectedMosaicIds(mosaicsRef.current.map(m => m.id)); },
      onClearSelection: () => { setSelectedArrowIds([]); setSelectedRectIds([]); setSelectedTextIds([]); setSelectedMosaicIds([]); },
      onDelete: () => {
        if (selectedArrowIds.length > 0) { setArrows((prev) => prev.filter((a) => !selectedArrowIds.includes(a.id))); setSelectedArrowIds([]); }
        if (selectedRectIds.length > 0) { setRects((prev) => prev.filter((r) => !selectedRectIds.includes(r.id))); setSelectedRectIds([]); }
        if (selectedTextIds.length > 0) { setTexts((prev) => prev.filter((t) => !selectedTextIds.includes(t.id))); setSelectedTextIds([]); }
        if (selectedMosaicIds.length > 0) { setMosaics((prev) => prev.filter((m) => !selectedMosaicIds.includes(m.id))); setSelectedMosaicIds([]); }
      },
      onApplyCrop: applyCrop,
      onCancelCrop: cancelCrop,
      onCancelMarquee: () => { renderShapes(); },
      pushHistory,
    }
  );

  // ---------------------------------------------------------------------------
  // 页面快捷键监听（截图快捷键）
  // ---------------------------------------------------------------------------
  useShortcutListener({
    captureVisible: () => {
      // 触发可视区域截图
      chrome.runtime.sendMessage({ type: 'CAPTURE_REQUEST', payload: { mode: 'visible' } });
    },
    captureRegion: () => {
      // 触发区域截图
      chrome.runtime.sendMessage({ type: 'CAPTURE_REQUEST', payload: { mode: 'region' } });
    },
    captureFullpage: () => {
      // 触发整页截图
      chrome.runtime.sendMessage({ type: 'CAPTURE_REQUEST', payload: { mode: 'fullpage' } });
    },
    captureDesktop: () => {
      // 触发桌面截图
      chrome.runtime.sendMessage({ type: 'CAPTURE_REQUEST', payload: { mode: 'desktop' } });
    },
  });

  // ---------------------------------------------------------------------------
  // 事件处理 Hook
  // ---------------------------------------------------------------------------
  useEditorEvents(
    {
      canvasRef, annotationCanvasRef, activeTool, imageData, editingTextId, cropArea,
      imageNaturalSize, imageDisplaySize, frameSettings,
      arrowsRef, rectsRef, textsRef, mosaicsRef,
      selectedArrowIdsRef, selectedRectIdsRef, selectedTextIdsRef, selectedMosaicIdsRef,
      cropAreaRef, imageNaturalSizeRef,
    },
    {
      pushHistory, renderShapes, screenToImageCoord,
      setArrows, setRects, setTexts, setMosaics,
      setSelectedArrowIds, setSelectedRectIds, setSelectedTextIds, setSelectedMosaicIds,
      setCropArea, setActiveTool, startEditing, applyCrop,
    }
  );

  // ---------------------------------------------------------------------------
  // 导出功能
  // ---------------------------------------------------------------------------
  const { isExporting, copied, exportError, handleExportImage, handleCopyToClipboard } = useExport({
    exportContainerRef, imageData, frameSettings, imageDisplaySizeRef, arrowsRef, rectsRef, textsRef, mosaicsRef,
  });

  // ---------------------------------------------------------------------------
  // 初始化 Hook
  // ---------------------------------------------------------------------------
  useEditorInit(
    { source, imageData, initialized },
    {
      setSource, setImageData, setError,
      resetHistory: (state) => historyActions.resetToState(state as EditorState),
      updateHistoryButtons,
    }
  );

  // ---------------------------------------------------------------------------
  // 图片加载回调
  // ---------------------------------------------------------------------------
  const handleImageSizeChange = useCallback((w: number, h: number) => {
    setImageDisplaySize({ width: w, height: h });
    const container = canvasRef.current;
    if (!container) return;
    const padW = frameSettings.padding.linked ? frameSettings.padding.top * 2 : frameSettings.padding.left + frameSettings.padding.right;
    const padH = frameSettings.padding.linked ? frameSettings.padding.top * 2 : frameSettings.padding.top + frameSettings.padding.bottom;
    const newOffset = { x: (container.clientWidth - w - padW) / 2, y: (container.clientHeight - h - padH) / 2 };
    offsetRef.current = newOffset;
    setOffset(newOffset);
  }, [frameSettings.padding, setOffset, setImageDisplaySize, offsetRef]);

  const handleImageNaturalSizeChange = useCallback((w: number, h: number) => {
    setImageNaturalSize({ width: w, height: h });
  }, [setImageNaturalSize]);

  const handleImageLoad = useCallback((dataUrl: string) => {
    setImageData(dataUrl);
    setError(null);
  }, [setImageData, setError]);

  // ---------------------------------------------------------------------------
  // 操作历史恢复
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (historyRestoredRef.current) return;
    if (!settings.saveOperationHistory || !operationHistory.editor) { historyRestoredRef.current = true; return; }
    historyRestoredRef.current = true;
    const saved = operationHistory.editor;
    if (saved.activeTool) setActiveTool(saved.activeTool as ToolId);
    if (saved.collapsedSections) setCollapsedSections(saved.collapsedSections);
    if (saved.frameSettings) setFrameSettings((prev) => ({ ...prev, ...saved.frameSettings }));
  }, [settings.saveOperationHistory, operationHistory.editor, setActiveTool, setCollapsedSections, setFrameSettings]);

  // ---------------------------------------------------------------------------
  // 操作历史保存
  // ---------------------------------------------------------------------------
  useEffect(() => {
    // 等待恢复完成后再保存
    if (!historyRestoredRef.current) return;
    // 只有开启保存操作历史才保存
    if (!settings.saveOperationHistory) return;

    updateOperationHistory('editor', {
      activeTool,
      collapsedSections,
      frameSettings,
    });
  }, [activeTool, collapsedSections, frameSettings, settings.saveOperationHistory, updateOperationHistory]);

  // ---------------------------------------------------------------------------
  // 马赛克图片 Canvas
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!imageData || !imageDisplaySize) { imageCanvasRef.current = null; return; }
    const img = new window.Image();
    img.onload = () => {
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = imageDisplaySize.width;
      tempCanvas.height = imageDisplaySize.height;
      const tempCtx = tempCanvas.getContext('2d');
      if (tempCtx) { tempCtx.drawImage(img, 0, 0, imageDisplaySize.width, imageDisplaySize.height); imageCanvasRef.current = tempCanvas; renderShapes(); }
    };
    img.src = imageData;
  }, [imageData, imageDisplaySize, renderShapes]);

  // ---------------------------------------------------------------------------
  // 渲染副作用
  // ---------------------------------------------------------------------------
  useEffect(() => { renderShapes(); }, [arrows, rects, texts, mosaics, selectedArrowIds, selectedRectIds, selectedTextIds, selectedMosaicIds, renderShapes]);
  useEffect(() => { renderShapes(); }, [scale, offset, renderShapes]);
  useEffect(() => {
    const resizeCanvas = () => {
      const canvas = annotationCanvasRef.current;
      const container = canvasRef.current;
      if (!canvas || !container) return;
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      renderShapes();
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [renderShapes]);

  // ---------------------------------------------------------------------------
  // 双击文字编辑
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const el = canvasRef.current;
    if (!el || !imageData) return;
    const onDoubleClick = (e: MouseEvent) => {
      const coord = screenToImageCoord(e.clientX, e.clientY);
      if (!coord) return;
      if (activeTool === 'crop' && cropArea && isPointInCrop(coord.x, coord.y, cropArea)) { applyCrop(); return; }
      if (activeTool !== 'select') return;
      const canvas = annotationCanvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!ctx) return;
      for (let i = textsRef.current.length - 1; i >= 0; i--) {
        const text = textsRef.current[i];
        if (isPointInText(coord.x, coord.y, text, ctx)) { startEditing(text); return; }
      }
    };
    el.addEventListener('dblclick', onDoubleClick);
    return () => el.removeEventListener('dblclick', onDoubleClick);
  }, [activeTool, imageData, screenToImageCoord, cropArea, applyCrop, startEditing, textsRef]);

  // 工具切换时清除裁剪状态
  useEffect(() => { if (activeTool !== 'crop' && cropArea) setCropArea(null); }, [activeTool, cropArea, setCropArea]);

  // ---------------------------------------------------------------------------
  // 属性更新函数
  // ---------------------------------------------------------------------------
  const updateArrow = useCallback((updates: Partial<ArrowShape>) => {
    if (selectedArrowIds.length !== 1) return;
    pushHistory();
    setArrows((prev) => prev.map((a) => (a.id === selectedArrowIds[0] ? { ...a, ...updates } : a)));
  }, [selectedArrowIds, pushHistory, setArrows]);

  const updateRect = useCallback((updates: Partial<RectShape>) => {
    if (selectedRectIds.length !== 1) return;
    pushHistory();
    setRects((prev) => prev.map((r) => (r.id === selectedRectIds[0] ? { ...r, ...updates } : r)));
  }, [selectedRectIds, pushHistory, setRects]);

  const updateText = useCallback((updates: Partial<TextShape>) => {
    if (selectedTextIds.length !== 1) return;
    pushHistory();
    setTexts((prev) => prev.map((t) => (t.id === selectedTextIds[0] ? { ...t, ...updates } : t)));
  }, [selectedTextIds, pushHistory, setTexts]);

  const updateMosaic = useCallback((updates: Partial<MosaicShape>) => {
    if (selectedMosaicIds.length !== 1) return;
    pushHistory();
    setMosaics((prev) => prev.map((m) => (m.id === selectedMosaicIds[0] ? { ...m, ...updates } : m)));
  }, [selectedMosaicIds, pushHistory, setMosaics]);

  // 选中的对象
  const selectedArrow = useMemo(() => (selectedArrowIds.length === 1 ? arrows.find((a) => a.id === selectedArrowIds[0]) || null : null), [arrows, selectedArrowIds]);
  const selectedRect = useMemo(() => (selectedRectIds.length === 1 ? rects.find((r) => r.id === selectedRectIds[0]) || null : null), [rects, selectedRectIds]);
  const selectedText = useMemo(() => (selectedTextIds.length === 1 ? texts.find((t) => t.id === selectedTextIds[0]) || null : null), [texts, selectedTextIds]);
  const selectedMosaic = useMemo(() => (selectedMosaicIds.length === 1 ? mosaics.find((m) => m.id === selectedMosaicIds[0]) || null : null), [mosaics, selectedMosaicIds]);
  const editingText = useMemo(() => (editingTextId ? texts.find((t) => t.id === editingTextId) || null : null), [texts, editingTextId]);

  // ---------------------------------------------------------------------------
  // 渲染
  // ---------------------------------------------------------------------------
  const showPlaceholder = source === 'upload' && !imageData && !error;

  return (
    <div className="editor-container w-screen h-screen flex overflow-hidden">
      <Toolbar activeTool={activeTool} onSelectTool={setActiveTool} canUndo={canUndo} canRedo={canRedo} onUndo={handleUndo} onRedo={handleRedo} />
      <main ref={canvasRef} className="editor-canvas flex-1 h-full relative overflow-hidden" style={{ cursor: activeTool === 'move' ? 'grab' : ['arrow', 'rect', 'text', 'mosaic', 'crop'].includes(activeTool) ? 'crosshair' : 'default' }}>
        {error ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <p className="text-[13px] text-[var(--color-editor-error)] font-body mb-1">// capture error</p>
              <p className="text-[11px] text-[var(--color-editor-hint)] font-body">{error}</p>
            </div>
          </div>
        ) : imageData ? (
          <>
            <div ref={imageContainerRef} className="absolute inset-0" style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`, transformOrigin: '0 0' }}>
              <FrameContainer imageData={imageData} imageDisplaySize={imageDisplaySize} frameSettings={frameSettings} onImageSizeChange={handleImageSizeChange} onNaturalSizeChange={handleImageNaturalSizeChange} exportContainerRef={exportContainerRef} />
            </div>
            <canvas ref={annotationCanvasRef} className="absolute inset-0 pointer-events-none" style={{ pointerEvents: 'auto' }} />
            {editingText && <TextEditorInput text={editingText} value={editingTextValue} scale={scale} offset={offset} inputRef={textInputRef} onChange={handleTextChange} onSave={() => stopEditing(true)} onCancel={() => stopEditing(false)} />}
            {activeTool === 'crop' && <CropHint cropArea={cropArea} />}
            <ZoomControls scale={scale} zoomPercent={zoomPercent} onZoomIn={zoomIn} onZoomOut={zoomOut} onReset={resetView} onSliderChange={handleSlider} />
          </>
        ) : showPlaceholder ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <UploadPlaceholder onImageLoad={handleImageLoad} />
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-[13px] text-[var(--color-editor-comment)] font-body">// editor_canvas</p>
          </div>
        )}
      </main>
      <PropertiesPanel
        selectedArrow={selectedArrow} onUpdateArrow={updateArrow}
        selectedRect={selectedRect} onUpdateRect={updateRect}
        selectedText={selectedText} onUpdateText={updateText}
        selectedMosaic={selectedMosaic} onUpdateMosaic={updateMosaic}
        frameSettings={frameSettings} onUpdateFrameSettings={(updates) => setFrameSettings((prev) => ({ ...prev, ...updates }))}
        collapsedSections={collapsedSections} onCollapsedChange={setCollapsedSections}
        onExportImage={handleExportImage} onCopyToClipboard={handleCopyToClipboard}
        isExporting={isExporting} copied={copied} exportError={exportError}
      />
    </div>
  );
};

export default App;
