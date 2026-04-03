/**
 * Editor 主组件
 * 重构后的精简版本，导入已拆分的模块
 */

import React, {
  useEffect,
  useCallback,
  useRef,
  useMemo,
  type ClipboardEvent,
} from 'react';
import { useTranslation } from 'react-i18next';
import { Minus, Plus, RotateCcw } from 'lucide-react';
import { STORAGE_KEYS } from '@shared/constants';
import { useSettingsStore } from '@shared/stores/settings-store';

// 导入类型
import type {
  EditorState,
  ArrowShape,
  RectShape,
  TextShape,
  MosaicShape,
  CropArea,
  ToolId,
} from './types';

// 导入常量
import {
  MIN_SCALE,
  MAX_SCALE,
  DEFAULT_ARROW_STYLE,
  DEFAULT_RECT_STYLE,
  DEFAULT_TEXT_STYLE,
  DEFAULT_MOSAIC_STYLE,
  MIN_CROP_SIZE,
  RECT_CURSOR_MAP,
  TEXT_CURSOR_MAP,
  MOSAIC_CURSOR_MAP,
  CROP_CURSOR_MAP,
} from './constants';

// 导入工具函数
import {
  parseSource,
  readFileAsDataUrl,
  calculateAspectRatioSize,
  generateArrowId,
  generateRectId,
  generateTextId,
  generateMosaicId,
  getBackgroundStyle,
} from './utils/editor';

// 导入图形处理辅助函数
import {
  isPointNearArrow,
  isPointInRect,
  isPointInText,
  isPointInMosaic,
  isPointInCrop,
  getDragTypeAtPoint,
  getRectDragTypeAtPoint,
  getTextDragTypeAtPoint,
  getMosaicDragTypeAtPoint,
  getCropDragTypeAtPoint,
  isArrowInRect,
  isRectInRect,
  isTextInRect,
  isMosaicInRect,
  drawMarqueeRect,
  type DragType,
  type RectDragType,
  type TextDragType,
  type MosaicDragType,
  type CropDragType,
} from './utils/shape-helpers';

// 导入服务
import { CanvasRenderer } from './services/canvas-renderer';

// 导入 Hooks
import { useEditorHistory } from './hooks/useEditorHistory';
import { useZoomPan } from './hooks/useZoomPan';
import { useExport } from './hooks/useExport';

// 导入 Store
import { useEditorStore } from './store/editor-store';

// 导入组件
import { Toolbar } from './components/Toolbar';
import { PropertiesPanel } from './components/PropertiesPanel';
import { CanvasImage } from './components/CanvasImage';
import { WatermarkRenderer } from './components/WatermarkRenderer';
import { UploadPlaceholder } from './components/UploadPlaceholder';

// ---------------------------------------------------------------------------
// 主组件
// ---------------------------------------------------------------------------

const App: React.FC = () => {
  const { t } = useTranslation('editor');

  // ---------------------------------------------------------------------------
  // 从 Store 获取状态和 actions
  // ---------------------------------------------------------------------------
  const {
    // 图片状态
    source,
    imageData,
    error,
    imageNaturalSize,
    imageDisplaySize,
    setSource,
    setImageData,
    setError,
    setImageNaturalSize,
    setImageDisplaySize,

    // 工具状态
    activeTool,
    setActiveTool,

    // 帧设置
    frameSettings,
    collapsedSections,
    setFrameSettings,
    setCollapsedSections,

    // 图形状态
    arrows,
    rects,
    texts,
    mosaics,
    selectedArrowIds,
    selectedRectIds,
    selectedTextIds,
    selectedMosaicIds,
    setArrows,
    setSelectedArrowIds,
    setRects,
    setSelectedRectIds,
    setTexts,
    setSelectedTextIds,
    setMosaics,
    setSelectedMosaicIds,

    // 编辑状态
    editingTextId,
    editingTextValue,
    cropArea,
    setEditingTextId,
    setEditingTextValue,
    setCropArea,

    // 历史状态
    canUndo,
    canRedo,
    setCanUndo,
    setCanRedo,
  } = useEditorStore();

  const initialized = useRef(false);

  // Refs
  const canvasRef = useRef<HTMLDivElement>(null);
  const annotationCanvasRef = useRef<HTMLCanvasElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const exportContainerRef = useRef<HTMLDivElement>(null);
  const textInputRef = useRef<HTMLInputElement>(null);
  const imageCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // 用户设置和历史
  const { settings, operationHistory, updateOperationHistory } = useSettingsStore();
  const historyRestoredRef = useRef(false);

  // ---------------------------------------------------------------------------
  // 缩放和平移 Hook
  // ---------------------------------------------------------------------------
  const {
    scale,
    offset,
    scaleRef,
    offsetRef,
    setScale,
    setOffset,
    zoomIn,
    zoomOut,
    resetView,
    handleSlider,
    zoomPercent,
  } = useZoomPan({
    containerRef: canvasRef,
    activeTool,
    imageData,
  });

  // ---------------------------------------------------------------------------
  // 图形状态 - 已从 Store 获取
  // ---------------------------------------------------------------------------

  // 绘制状态 Refs
  const drawingArrow = useRef<{ startX: number; startY: number; endX: number; endY: number } | null>(null);
  const isDrawingArrow = useRef(false);
  const drawingRect = useRef<{ startX: number; startY: number; endX: number; endY: number } | null>(null);
  const isDrawingRect = useRef(false);
  const drawingMosaic = useRef<{ startX: number; startY: number; endX: number; endY: number } | null>(null);
  const isDrawingMosaic = useRef(false);
  const drawingCrop = useRef<{ startX: number; startY: number; endX: number; endY: number } | null>(null);
  const isDrawingCrop = useRef(false);

  // 拖拽状态 Refs
  const draggingRef = useRef<{
    type: DragType;
    arrowId: string;
    startX: number;
    startY: number;
    arrowStart: { x: number; y: number };
    arrowEnd: { x: number; y: number };
  } | null>(null);
  const draggingRectRef = useRef<{
    type: RectDragType;
    rectId: string;
    startX: number;
    startY: number;
    rectOrig: { x: number; y: number; width: number; height: number };
  } | null>(null);
  const draggingTextRef = useRef<{
    type: TextDragType;
    textId: string;
    startX: number;
    startY: number;
    textOrig: { x: number; y: number; fontSize: number };
  } | null>(null);
  const draggingMosaicRef = useRef<{
    type: MosaicDragType;
    mosaicId: string;
    startX: number;
    startY: number;
    mosaicOrig: { x: number; y: number; width: number; height: number };
  } | null>(null);
  const draggingCropRef = useRef<{
    type: CropDragType;
    startX: number;
    startY: number;
    cropOrig: { x: number; y: number; width: number; height: number };
  } | null>(null);

  // 框选状态
  const isMarqueeSelecting = useRef(false);
  const marqueeStart = useRef<{ x: number; y: number } | null>(null);
  const marqueeEnd = useRef<{ x: number; y: number } | null>(null);

  // 默认样式 Refs
  const arrowStyleRef = useRef(DEFAULT_ARROW_STYLE);
  const rectStyleRef = useRef(DEFAULT_RECT_STYLE);
  const textStyleRef = useRef(DEFAULT_TEXT_STYLE);
  const mosaicStyleRef = useRef(DEFAULT_MOSAIC_STYLE);

  // 数据 Refs（避免闭包问题）
  const arrowsRef = useRef(arrows);
  arrowsRef.current = arrows;
  const rectsRef = useRef(rects);
  rectsRef.current = rects;
  const textsRef = useRef(texts);
  textsRef.current = texts;
  const mosaicsRef = useRef(mosaics);
  mosaicsRef.current = mosaics;

  const selectedArrowIdsRef = useRef(selectedArrowIds);
  selectedArrowIdsRef.current = selectedArrowIds;
  const selectedRectIdsRef = useRef(selectedRectIds);
  selectedRectIdsRef.current = selectedRectIds;
  const selectedTextIdsRef = useRef(selectedTextIds);
  selectedTextIdsRef.current = selectedTextIds;
  const selectedMosaicIdsRef = useRef(selectedMosaicIds);
  selectedMosaicIdsRef.current = selectedMosaicIds;

  const cropAreaRef = useRef(cropArea);
  cropAreaRef.current = cropArea;
  const imageNaturalSizeRef = useRef(imageNaturalSize);
  imageNaturalSizeRef.current = imageNaturalSize;
  const imageDisplaySizeRef = useRef(imageDisplaySize);
  imageDisplaySizeRef.current = imageDisplaySize;

  // ---------------------------------------------------------------------------
  // 历史记录
  // ---------------------------------------------------------------------------
  const historyActions = useEditorHistory();

  const updateHistoryButtons = useCallback(() => {
    setCanUndo(historyActions.canUndo());
    setCanRedo(historyActions.canRedo());
  }, [historyActions]);

  const pushHistory = useCallback(() => {
    const state: EditorState = {
      arrows: JSON.parse(JSON.stringify(arrowsRef.current)),
      rects: JSON.parse(JSON.stringify(rectsRef.current)),
      texts: JSON.parse(JSON.stringify(textsRef.current)),
      mosaics: JSON.parse(JSON.stringify(mosaicsRef.current)),
      imageData: imageData,
      view: {
        scale: scaleRef.current,
        offset: { ...offsetRef.current },
      },
      selectedArrowIds: [...selectedArrowIdsRef.current],
      selectedRectIds: [...selectedRectIdsRef.current],
      selectedTextIds: [...selectedTextIdsRef.current],
      selectedMosaicIds: [...selectedMosaicIdsRef.current],
    };
    historyActions.pushState(state);
    updateHistoryButtons();
  }, [historyActions, imageData, updateHistoryButtons]);

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
      if (prevState.imageData && prevState.imageData !== imageData) {
        setImageData(prevState.imageData);
      }
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
  }, [historyActions, imageData, updateHistoryButtons, setScale, setOffset]);

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
      if (nextState.imageData && nextState.imageData !== imageData) {
        setImageData(nextState.imageData);
      }
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
  }, [historyActions, imageData, updateHistoryButtons, setScale, setOffset]);

  // ---------------------------------------------------------------------------
  // 导出功能
  // ---------------------------------------------------------------------------
  const {
    isExporting,
    copied,
    exportError,
    handleExportImage,
    handleCopyToClipboard,
  } = useExport({
    exportContainerRef,
    imageData,
    frameSettings,
    imageDisplaySizeRef,
    arrowsRef,
    rectsRef,
    textsRef,
    mosaicsRef,
  });

  // ---------------------------------------------------------------------------
  // 操作历史恢复
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (historyRestoredRef.current) return;
    if (!settings.saveOperationHistory || !operationHistory.editor) {
      historyRestoredRef.current = true;
      return;
    }

    historyRestoredRef.current = true;
    const saved = operationHistory.editor;
    if (saved.activeTool) setActiveTool(saved.activeTool as ToolId);
    if (saved.collapsedSections) setCollapsedSections(saved.collapsedSections);
    if (saved.frameSettings) {
      setFrameSettings((prev) => ({
        ...prev,
        ...(saved.frameSettings!.background && { background: saved.frameSettings!.background }),
        ...(saved.frameSettings!.padding && { padding: saved.frameSettings!.padding }),
        ...(saved.frameSettings!.borderRadius && { borderRadius: saved.frameSettings!.borderRadius }),
        ...(saved.frameSettings!.imageRadius && { imageRadius: saved.frameSettings!.imageRadius }),
        ...(saved.frameSettings!.shadow && { shadow: saved.frameSettings!.shadow }),
        ...(saved.frameSettings!.imageShadow && { imageShadow: saved.frameSettings!.imageShadow }),
        ...(saved.frameSettings!.aspectRatio && { aspectRatio: saved.frameSettings!.aspectRatio }),
        ...(saved.frameSettings!.customAspectRatio && { customAspectRatio: saved.frameSettings!.customAspectRatio }),
        ...(saved.frameSettings!.windowControl && { windowControl: saved.frameSettings!.windowControl }),
        ...(saved.frameSettings!.watermark && { watermark: saved.frameSettings!.watermark }),
      }));
    }
  }, [settings.saveOperationHistory, operationHistory.editor]);

  // 保存操作历史
  const prevSavedStateRef = useRef<string>('');
  useEffect(() => {
    if (!settings.saveOperationHistory || !historyRestoredRef.current) return;

    const currentState = JSON.stringify({
      activeTool,
      collapsedSections,
      frameSettings: {
        background: frameSettings.background,
        padding: frameSettings.padding,
        borderRadius: frameSettings.borderRadius,
        imageRadius: frameSettings.imageRadius,
        shadow: frameSettings.shadow,
        imageShadow: frameSettings.imageShadow,
        aspectRatio: frameSettings.aspectRatio,
        customAspectRatio: frameSettings.customAspectRatio,
        windowControl: frameSettings.windowControl,
        watermark: frameSettings.watermark,
      },
    });

    if (currentState === prevSavedStateRef.current) return;
    prevSavedStateRef.current = currentState;

    updateOperationHistory('editor', {
      activeTool,
      collapsedSections,
      frameSettings: {
        background: frameSettings.background,
        padding: frameSettings.padding,
        borderRadius: frameSettings.borderRadius,
        imageRadius: frameSettings.imageRadius,
        shadow: frameSettings.shadow,
        imageShadow: frameSettings.imageShadow,
        aspectRatio: frameSettings.aspectRatio,
        customAspectRatio: frameSettings.customAspectRatio,
        windowControl: frameSettings.windowControl,
        watermark: frameSettings.watermark,
      },
    });
  }, [settings.saveOperationHistory, activeTool, collapsedSections, frameSettings, updateOperationHistory]);

  // ---------------------------------------------------------------------------
  // 图片加载
  // ---------------------------------------------------------------------------
  const handleImageSizeChange = useCallback(
    (w: number, h: number) => {
      setImageDisplaySize({ width: w, height: h });

      const container = canvasRef.current;
      if (!container) return;
      const containerW = container.clientWidth;
      const containerH = container.clientHeight;

      const padW = frameSettings.padding.linked
        ? frameSettings.padding.top * 2
        : frameSettings.padding.left + frameSettings.padding.right;
      const padH = frameSettings.padding.linked
        ? frameSettings.padding.top * 2
        : frameSettings.padding.top + frameSettings.padding.bottom;
      const totalW = w + padW;
      const totalH = h + padH;

      const newOffset = {
        x: (containerW - totalW) / 2,
        y: (containerH - totalH) / 2,
      };
      offsetRef.current = newOffset;
      setOffset(newOffset);
    },
    [frameSettings.padding, setOffset]
  );

  const handleImageNaturalSizeChange = useCallback((w: number, h: number) => {
    setImageNaturalSize({ width: w, height: h });
  }, []);

  const handleImageLoad = useCallback((dataUrl: string) => {
    setImageData(dataUrl);
    setError(null);
  }, []);

  // 比例变化时重新居中
  const prevAspectRatioRef = useRef(frameSettings.aspectRatio);
  const prevCustomRatioRef = useRef(frameSettings.customAspectRatio);

  useEffect(() => {
    if (!imageData || !imageDisplaySize) return;

    const aspectChanged = prevAspectRatioRef.current !== frameSettings.aspectRatio;
    const customChanged =
      prevCustomRatioRef.current.width !== frameSettings.customAspectRatio.width ||
      prevCustomRatioRef.current.height !== frameSettings.customAspectRatio.height;

    if (!aspectChanged && !customChanged) return;

    prevAspectRatioRef.current = frameSettings.aspectRatio;
    prevCustomRatioRef.current = frameSettings.customAspectRatio;

    const container = canvasRef.current;
    if (!container) return;

    const containerW = container.clientWidth;
    const containerH = container.clientHeight;

    const newContainerSize = calculateAspectRatioSize(
      frameSettings.aspectRatio,
      imageDisplaySize.width,
      imageDisplaySize.height,
      frameSettings.customAspectRatio
    );

    const padW = frameSettings.padding.linked
      ? frameSettings.padding.top * 2
      : frameSettings.padding.left + frameSettings.padding.right;
    const padH = frameSettings.padding.linked
      ? frameSettings.padding.top * 2
      : frameSettings.padding.top + frameSettings.padding.bottom;
    const totalW = newContainerSize.width + padW;
    const totalH = newContainerSize.height + padH;

    const newOffset = {
      x: (containerW - totalW) / 2,
      y: (containerH - totalH) / 2,
    };
    offsetRef.current = newOffset;
    setOffset(newOffset);
    scaleRef.current = 1;
    setScale(1);
  }, [frameSettings.aspectRatio, frameSettings.customAspectRatio, frameSettings.padding, imageData, imageDisplaySize, setOffset, setScale]);

  // ---------------------------------------------------------------------------
  // Canvas 渲染
  // ---------------------------------------------------------------------------
  const screenToImageCoord = useCallback(
    (clientX: number, clientY: number): { x: number; y: number } | null => {
      const canvas = annotationCanvasRef.current;
      if (!canvas) return null;

      const rect = canvas.getBoundingClientRect();
      const x = (clientX - rect.left - offsetRef.current.x) / scaleRef.current;
      const y = (clientY - rect.top - offsetRef.current.y) / scaleRef.current;

      return { x, y };
    },
    []
  );

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
    rects.forEach((rect) => {
      renderer.drawRect(rect, selectedRectIds.includes(rect.id));
    });

    if (drawingRect.current && isDrawingRect.current) {
      const { startX, startY, endX, endY } = drawingRect.current;
      renderer.drawRect({
        id: 'temp',
        x: Math.min(startX, endX),
        y: Math.min(startY, endY),
        width: Math.abs(endX - startX),
        height: Math.abs(endY - startY),
        ...rectStyleRef.current,
      }, false);
    }

    // 绘制箭头
    arrows.forEach((arrow) => {
      renderer.drawArrow(arrow, selectedArrowIds.includes(arrow.id));
    });

    if (drawingArrow.current && isDrawingArrow.current) {
      renderer.drawArrow({
        id: 'temp',
        startX: drawingArrow.current.startX,
        startY: drawingArrow.current.startY,
        endX: drawingArrow.current.endX,
        endY: drawingArrow.current.endY,
        ...arrowStyleRef.current,
      }, false);
    }

    // 绘制文字
    texts.forEach((text) => {
      if (editingTextId === text.id) return;
      renderer.drawText(text, selectedTextIds.includes(text.id));
    });

    // 绘制马赛克
    mosaics.forEach((mosaic) => {
      renderer.drawMosaic(mosaic, imageCanvasRef.current, selectedMosaicIds.includes(mosaic.id));
    });

    if (drawingMosaic.current && isDrawingMosaic.current) {
      const { startX, startY, endX, endY } = drawingMosaic.current;
      renderer.drawMosaic({
        id: 'temp',
        x: Math.min(startX, endX),
        y: Math.min(startY, endY),
        width: Math.abs(endX - startX),
        height: Math.abs(endY - startY),
        ...mosaicStyleRef.current,
      }, imageCanvasRef.current, false);
    }

    // 绘制裁剪框
    if (activeTool === 'crop' && imageDisplaySize) {
      if (cropArea) {
        renderer.drawCropBox(cropArea, imageDisplaySize.width, imageDisplaySize.height);
      }
      if (drawingCrop.current && isDrawingCrop.current) {
        const { startX, startY, endX, endY } = drawingCrop.current;
        renderer.drawCropBox({
          x: Math.min(startX, endX),
          y: Math.min(startY, endY),
          width: Math.abs(endX - startX),
          height: Math.abs(endY - startY),
        }, imageDisplaySize.width, imageDisplaySize.height);
      }
    }

    // 绘制框选矩形
    if (isMarqueeSelecting.current && marqueeStart.current && marqueeEnd.current) {
      drawMarqueeRect(ctx, {
        x1: marqueeStart.current.x,
        y1: marqueeStart.current.y,
        x2: marqueeEnd.current.x,
        y2: marqueeEnd.current.y,
      });
    }

    ctx.restore();
  }, [arrows, rects, texts, mosaics, selectedArrowIds, selectedRectIds, selectedTextIds, selectedMosaicIds, editingTextId, cropArea, imageDisplaySize, activeTool]);

  // 创建包含图片数据的 canvas，用于马赛克渲染
  // 注意：使用显示尺寸而非原始尺寸，因为马赛克坐标是基于显示坐标系的
  useEffect(() => {
    if (!imageData || !imageDisplaySize) {
      imageCanvasRef.current = null;
      return;
    }

    const img = new window.Image();
    img.onload = () => {
      const tempCanvas = document.createElement('canvas');
      // 使用显示尺寸，与马赛克坐标系匹配
      tempCanvas.width = imageDisplaySize.width;
      tempCanvas.height = imageDisplaySize.height;
      const tempCtx = tempCanvas.getContext('2d');
      if (tempCtx) {
        // 将图片缩放到显示尺寸
        tempCtx.drawImage(img, 0, 0, imageDisplaySize.width, imageDisplaySize.height);
        imageCanvasRef.current = tempCanvas;
        renderShapes();
      }
    };
    img.src = imageData;
  }, [imageData, imageDisplaySize, renderShapes]);

  // ---------------------------------------------------------------------------
  // 事件处理
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const el = canvasRef.current;
    if (!el || !imageData) return;

    const onDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      if (editingTextId) return;

      const coord = screenToImageCoord(e.clientX, e.clientY);
      if (!coord) return;

      // 箭头绘制
      if (activeTool === 'arrow') {
        isDrawingArrow.current = true;
        drawingArrow.current = { startX: coord.x, startY: coord.y, endX: coord.x, endY: coord.y };
        return;
      }

      // 矩形绘制
      if (activeTool === 'rect') {
        isDrawingRect.current = true;
        drawingRect.current = { startX: coord.x, startY: coord.y, endX: coord.x, endY: coord.y };
        return;
      }

      // 文字工具
      if (activeTool === 'text') {
        pushHistory();
        const newText: TextShape = {
          id: generateTextId(),
          x: coord.x,
          y: coord.y,
          text: 'Text',
          ...textStyleRef.current,
        };
        setTexts((prev) => [...prev, newText]);
        setSelectedTextIds([newText.id]);
        setSelectedArrowIds([]);
        setSelectedRectIds([]);
        setSelectedMosaicIds([]);
        setActiveTool('select');
        return;
      }

      // 马赛克绘制
      if (activeTool === 'mosaic') {
        isDrawingMosaic.current = true;
        drawingMosaic.current = { startX: coord.x, startY: coord.y, endX: coord.x, endY: coord.y };
        return;
      }

      // 裁剪工具
      if (activeTool === 'crop') {
        const currentCrop = cropAreaRef.current;
        const imgSize = imageNaturalSizeRef.current;

        if (currentCrop && imgSize) {
          const dragType = getCropDragTypeAtPoint(coord.x, coord.y, currentCrop);
          if (dragType !== 'none') {
            draggingCropRef.current = {
              type: dragType,
              startX: coord.x,
              startY: coord.y,
              cropOrig: { x: currentCrop.x, y: currentCrop.y, width: currentCrop.width, height: currentCrop.height },
            };
            return;
          }
        }

        isDrawingCrop.current = true;
        drawingCrop.current = { startX: coord.x, startY: coord.y, endX: coord.x, endY: coord.y };
        setCropArea(null);
        return;
      }

      // 选择工具
      if (activeTool === 'select') {
        const canvas = annotationCanvasRef.current;
        const ctx = canvas?.getContext('2d');

        // 检测已选中对象的控制点
        for (const textId of selectedTextIdsRef.current) {
          const text = textsRef.current.find(t => t.id === textId);
          if (text && ctx) {
            const dragType = getTextDragTypeAtPoint(coord.x, coord.y, text, ctx);
            if (dragType !== 'none') {
              setSelectedTextIds([textId]);
              setSelectedArrowIds([]);
              setSelectedRectIds([]);
              setSelectedMosaicIds([]);
              draggingTextRef.current = {
                type: dragType,
                textId,
                startX: coord.x,
                startY: coord.y,
                textOrig: { x: text.x, y: text.y, fontSize: text.fontSize },
              };
              return;
            }
          }
        }

        for (const mosaicId of selectedMosaicIdsRef.current) {
          const mosaic = mosaicsRef.current.find(m => m.id === mosaicId);
          if (mosaic) {
            const dragType = getMosaicDragTypeAtPoint(coord.x, coord.y, mosaic);
            if (dragType !== 'none') {
              setSelectedMosaicIds([mosaicId]);
              setSelectedArrowIds([]);
              setSelectedRectIds([]);
              setSelectedTextIds([]);
              draggingMosaicRef.current = {
                type: dragType,
                mosaicId,
                startX: coord.x,
                startY: coord.y,
                mosaicOrig: { x: mosaic.x, y: mosaic.y, width: mosaic.width, height: mosaic.height },
              };
              return;
            }
          }
        }

        for (const rectId of selectedRectIdsRef.current) {
          const rect = rectsRef.current.find(r => r.id === rectId);
          if (rect) {
            const dragType = getRectDragTypeAtPoint(coord.x, coord.y, rect);
            if (dragType !== 'none') {
              setSelectedRectIds([rectId]);
              setSelectedArrowIds([]);
              setSelectedTextIds([]);
              setSelectedMosaicIds([]);
              draggingRectRef.current = {
                type: dragType,
                rectId,
                startX: coord.x,
                startY: coord.y,
                rectOrig: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
              };
              return;
            }
          }
        }

        for (const arrowId of selectedArrowIdsRef.current) {
          const arrow = arrowsRef.current.find(a => a.id === arrowId);
          if (arrow) {
            const dragType = getDragTypeAtPoint(coord.x, coord.y, arrow);
            if (dragType !== 'none') {
              setSelectedArrowIds([arrowId]);
              setSelectedRectIds([]);
              setSelectedTextIds([]);
              setSelectedMosaicIds([]);
              draggingRef.current = {
                type: dragType,
                arrowId,
                startX: coord.x,
                startY: coord.y,
                arrowStart: { x: arrow.startX, y: arrow.startY },
                arrowEnd: { x: arrow.endX, y: arrow.endY },
              };
              return;
            }
          }
        }

        // 检测点击对象
        if (ctx) {
          for (let i = textsRef.current.length - 1; i >= 0; i--) {
            const text = textsRef.current[i];
            if (isPointInText(coord.x, coord.y, text, ctx)) {
              if (e.shiftKey) {
                if (selectedTextIdsRef.current.includes(text.id)) {
                  setSelectedTextIds(prev => prev.filter(id => id !== text.id));
                } else {
                  setSelectedTextIds(prev => [...prev, text.id]);
                }
              } else {
                if (selectedTextIdsRef.current.includes(text.id)) {
                  draggingTextRef.current = {
                    type: 'move',
                    textId: text.id,
                    startX: coord.x,
                    startY: coord.y,
                    textOrig: { x: text.x, y: text.y, fontSize: text.fontSize },
                  };
                } else {
                  setSelectedTextIds([text.id]);
                  setSelectedArrowIds([]);
                  setSelectedRectIds([]);
                  setSelectedMosaicIds([]);
                }
              }
              return;
            }
          }
        }

        for (let i = mosaicsRef.current.length - 1; i >= 0; i--) {
          const mosaic = mosaicsRef.current[i];
          if (isPointInMosaic(coord.x, coord.y, mosaic)) {
            if (e.shiftKey) {
              if (selectedMosaicIdsRef.current.includes(mosaic.id)) {
                setSelectedMosaicIds(prev => prev.filter(id => id !== mosaic.id));
              } else {
                setSelectedMosaicIds(prev => [...prev, mosaic.id]);
              }
            } else {
              if (selectedMosaicIdsRef.current.includes(mosaic.id)) {
                draggingMosaicRef.current = {
                  type: 'move',
                  mosaicId: mosaic.id,
                  startX: coord.x,
                  startY: coord.y,
                  mosaicOrig: { x: mosaic.x, y: mosaic.y, width: mosaic.width, height: mosaic.height },
                };
              } else {
                setSelectedMosaicIds([mosaic.id]);
                setSelectedArrowIds([]);
                setSelectedRectIds([]);
                setSelectedTextIds([]);
              }
            }
            return;
          }
        }

        for (let i = rectsRef.current.length - 1; i >= 0; i--) {
          const rect = rectsRef.current[i];
          if (isPointInRect(coord.x, coord.y, rect)) {
            if (e.shiftKey) {
              if (selectedRectIdsRef.current.includes(rect.id)) {
                setSelectedRectIds(prev => prev.filter(id => id !== rect.id));
              } else {
                setSelectedRectIds(prev => [...prev, rect.id]);
              }
            } else {
              if (selectedRectIdsRef.current.includes(rect.id)) {
                draggingRectRef.current = {
                  type: 'move',
                  rectId: rect.id,
                  startX: coord.x,
                  startY: coord.y,
                  rectOrig: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
                };
              } else {
                setSelectedRectIds([rect.id]);
                setSelectedArrowIds([]);
                setSelectedTextIds([]);
                setSelectedMosaicIds([]);
              }
            }
            return;
          }
        }

        for (let i = arrowsRef.current.length - 1; i >= 0; i--) {
          const arrow = arrowsRef.current[i];
          if (isPointNearArrow(coord.x, coord.y, arrow)) {
            if (e.shiftKey) {
              if (selectedArrowIdsRef.current.includes(arrow.id)) {
                setSelectedArrowIds(prev => prev.filter(id => id !== arrow.id));
              } else {
                setSelectedArrowIds(prev => [...prev, arrow.id]);
              }
            } else {
              if (selectedArrowIdsRef.current.includes(arrow.id)) {
                draggingRef.current = {
                  type: 'move',
                  arrowId: arrow.id,
                  startX: coord.x,
                  startY: coord.y,
                  arrowStart: { x: arrow.startX, y: arrow.startY },
                  arrowEnd: { x: arrow.endX, y: arrow.endY },
                };
              } else {
                setSelectedArrowIds([arrow.id]);
                setSelectedRectIds([]);
                setSelectedTextIds([]);
                setSelectedMosaicIds([]);
              }
            }
            return;
          }
        }

        // 开始框选
        isMarqueeSelecting.current = true;
        marqueeStart.current = { x: coord.x, y: coord.y };
        marqueeEnd.current = { x: coord.x, y: coord.y };
      }
    };

    const onMove = (e: MouseEvent) => {
      const coord = screenToImageCoord(e.clientX, e.clientY);
      if (!coord) return;

      // 框选
      if (isMarqueeSelecting.current && activeTool === 'select') {
        if (marqueeStart.current) {
          marqueeEnd.current = { x: coord.x, y: coord.y };
          renderShapes();
        }
        return;
      }

      // 箭头绘制
      if (isDrawingArrow.current && activeTool === 'arrow') {
        if (!drawingArrow.current) return;
        drawingArrow.current.endX = coord.x;
        drawingArrow.current.endY = coord.y;
        renderShapes();
        return;
      }

      // 矩形绘制
      if (isDrawingRect.current && activeTool === 'rect') {
        if (!drawingRect.current) return;
        drawingRect.current.endX = coord.x;
        drawingRect.current.endY = coord.y;
        renderShapes();
        return;
      }

      // 矩形拖拽
      if (draggingRectRef.current && activeTool === 'select') {
        const drag = draggingRectRef.current;
        const dx = coord.x - drag.startX;
        const dy = coord.y - drag.startY;
        const orig = drag.rectOrig;

        setRects((prev) =>
          prev.map((r) => {
            if (r.id !== drag.rectId) return r;
            switch (drag.type) {
              case 'move':
                return { ...r, x: orig.x + dx, y: orig.y + dy };
              case 'resize-tl':
                return { ...r, x: orig.x + dx, y: orig.y + dy, width: Math.max(5, orig.width - dx), height: Math.max(5, orig.height - dy) };
              case 'resize-tr':
                return { ...r, y: orig.y + dy, width: Math.max(5, orig.width + dx), height: Math.max(5, orig.height - dy) };
              case 'resize-bl':
                return { ...r, x: orig.x + dx, width: Math.max(5, orig.width - dx), height: Math.max(5, orig.height + dy) };
              case 'resize-br':
                return { ...r, width: Math.max(5, orig.width + dx), height: Math.max(5, orig.height + dy) };
              case 'resize-t':
                return { ...r, y: orig.y + dy, height: Math.max(5, orig.height - dy) };
              case 'resize-b':
                return { ...r, height: Math.max(5, orig.height + dy) };
              case 'resize-l':
                return { ...r, x: orig.x + dx, width: Math.max(5, orig.width - dx) };
              case 'resize-r':
                return { ...r, width: Math.max(5, orig.width + dx) };
              default:
                return r;
            }
          })
        );
        renderShapes();
        return;
      }

      // 箭头拖拽
      if (draggingRef.current && activeTool === 'select') {
        const drag = draggingRef.current;
        const dx = coord.x - drag.startX;
        const dy = coord.y - drag.startY;

        setArrows((prev) =>
          prev.map((a) => {
            if (a.id !== drag.arrowId) return a;
            switch (drag.type) {
              case 'move':
              case 'middle':
                return { ...a, startX: drag.arrowStart.x + dx, startY: drag.arrowStart.y + dy, endX: drag.arrowEnd.x + dx, endY: drag.arrowEnd.y + dy };
              case 'start':
                return { ...a, startX: drag.arrowStart.x + dx, startY: drag.arrowStart.y + dy };
              case 'end':
                return { ...a, endX: drag.arrowEnd.x + dx, endY: drag.arrowEnd.y + dy };
              default:
                return a;
            }
          })
        );
        renderShapes();
        return;
      }

      // 文字拖拽
      if (draggingTextRef.current && activeTool === 'select') {
        const drag = draggingTextRef.current;
        const dx = coord.x - drag.startX;
        const dy = coord.y - drag.startY;
        const orig = drag.textOrig;

        setTexts((prev) =>
          prev.map((t) => {
            if (t.id !== drag.textId) return t;
            const minFontSize = 8;
            const maxFontSize = 120;

            switch (drag.type) {
              case 'move':
                return { ...t, x: orig.x + dx, y: orig.y + dy };
              case 'resize-br': {
                const delta = (dx + dy) / 2;
                return { ...t, fontSize: Math.min(maxFontSize, Math.max(minFontSize, orig.fontSize + delta * 0.5)) };
              }
              case 'resize-tl': {
                const delta = (-dx - dy) / 2;
                return { ...t, fontSize: Math.min(maxFontSize, Math.max(minFontSize, orig.fontSize + delta * 0.5)), x: orig.x + dx, y: orig.y + dy };
              }
              case 'resize-tr': {
                const delta = (dx - dy) / 2;
                return { ...t, fontSize: Math.min(maxFontSize, Math.max(minFontSize, orig.fontSize + delta * 0.5)), y: orig.y + dy };
              }
              case 'resize-bl': {
                const delta = (-dx + dy) / 2;
                return { ...t, fontSize: Math.min(maxFontSize, Math.max(minFontSize, orig.fontSize + delta * 0.5)), x: orig.x + dx };
              }
              default:
                return t;
            }
          })
        );
        renderShapes();
        return;
      }

      // 马赛克绘制
      if (isDrawingMosaic.current && activeTool === 'mosaic') {
        if (!drawingMosaic.current) return;
        drawingMosaic.current.endX = coord.x;
        drawingMosaic.current.endY = coord.y;
        renderShapes();
        return;
      }

      // 马赛克拖拽
      if (draggingMosaicRef.current && activeTool === 'select') {
        const drag = draggingMosaicRef.current;
        const dx = coord.x - drag.startX;
        const dy = coord.y - drag.startY;
        const orig = drag.mosaicOrig;

        setMosaics((prev) =>
          prev.map((m) => {
            if (m.id !== drag.mosaicId) return m;
            switch (drag.type) {
              case 'move':
                return { ...m, x: orig.x + dx, y: orig.y + dy };
              case 'resize-tl':
                return { ...m, x: orig.x + dx, y: orig.y + dy, width: Math.max(5, orig.width - dx), height: Math.max(5, orig.height - dy) };
              case 'resize-tr':
                return { ...m, y: orig.y + dy, width: Math.max(5, orig.width + dx), height: Math.max(5, orig.height - dy) };
              case 'resize-bl':
                return { ...m, x: orig.x + dx, width: Math.max(5, orig.width - dx), height: Math.max(5, orig.height + dy) };
              case 'resize-br':
                return { ...m, width: Math.max(5, orig.width + dx), height: Math.max(5, orig.height + dy) };
              case 'resize-t':
                return { ...m, y: orig.y + dy, height: Math.max(5, orig.height - dy) };
              case 'resize-b':
                return { ...m, height: Math.max(5, orig.height + dy) };
              case 'resize-l':
                return { ...m, x: orig.x + dx, width: Math.max(5, orig.width - dx) };
              case 'resize-r':
                return { ...m, width: Math.max(5, orig.width + dx) };
              default:
                return m;
            }
          })
        );
        renderShapes();
        return;
      }

      // 裁剪框绘制
      if (isDrawingCrop.current && activeTool === 'crop') {
        if (!drawingCrop.current) return;
        const imgSize = imageNaturalSizeRef.current;
        if (!imgSize) return;
        drawingCrop.current.endX = Math.max(0, Math.min(imgSize.width, coord.x));
        drawingCrop.current.endY = Math.max(0, Math.min(imgSize.height, coord.y));
        renderShapes();
        return;
      }

      // 裁剪框拖拽
      if (draggingCropRef.current && activeTool === 'crop') {
        const drag = draggingCropRef.current;
        const dx = coord.x - drag.startX;
        const dy = coord.y - drag.startY;
        const orig = drag.cropOrig;
        const imgSize = imageNaturalSizeRef.current;
        if (!imgSize) return;

        let newCrop: CropArea;
        switch (drag.type) {
          case 'move':
            newCrop = {
              x: Math.max(0, Math.min(imgSize.width - orig.width, orig.x + dx)),
              y: Math.max(0, Math.min(imgSize.height - orig.height, orig.y + dy)),
              width: orig.width,
              height: orig.height,
            };
            break;
          case 'resize-tl':
            newCrop = {
              x: Math.max(0, orig.x + dx),
              y: Math.max(0, orig.y + dy),
              width: Math.max(MIN_CROP_SIZE, orig.width - dx),
              height: Math.max(MIN_CROP_SIZE, orig.height - dy),
            };
            break;
          case 'resize-tr':
            newCrop = {
              x: orig.x,
              y: Math.max(0, orig.y + dy),
              width: Math.min(imgSize.width - orig.x, Math.max(MIN_CROP_SIZE, orig.width + dx)),
              height: Math.max(MIN_CROP_SIZE, orig.height - dy),
            };
            break;
          case 'resize-bl':
            newCrop = {
              x: Math.max(0, orig.x + dx),
              y: orig.y,
              width: Math.max(MIN_CROP_SIZE, orig.width - dx),
              height: Math.min(imgSize.height - orig.y, Math.max(MIN_CROP_SIZE, orig.height + dy)),
            };
            break;
          case 'resize-br':
            newCrop = {
              x: orig.x,
              y: orig.y,
              width: Math.min(imgSize.width - orig.x, Math.max(MIN_CROP_SIZE, orig.width + dx)),
              height: Math.min(imgSize.height - orig.y, Math.max(MIN_CROP_SIZE, orig.height + dy)),
            };
            break;
          case 'resize-t':
            newCrop = {
              x: orig.x,
              y: Math.max(0, orig.y + dy),
              width: orig.width,
              height: Math.max(MIN_CROP_SIZE, orig.height - dy),
            };
            break;
          case 'resize-b':
            newCrop = {
              x: orig.x,
              y: orig.y,
              width: orig.width,
              height: Math.min(imgSize.height - orig.y, Math.max(MIN_CROP_SIZE, orig.height + dy)),
            };
            break;
          case 'resize-l':
            newCrop = {
              x: Math.max(0, orig.x + dx),
              y: orig.y,
              width: Math.max(MIN_CROP_SIZE, orig.width - dx),
              height: orig.height,
            };
            break;
          case 'resize-r':
            newCrop = {
              x: orig.x,
              y: orig.y,
              width: Math.min(imgSize.width - orig.x, Math.max(MIN_CROP_SIZE, orig.width + dx)),
              height: orig.height,
            };
            break;
          default:
            return;
        }
        setCropArea(newCrop);
        renderShapes();
        return;
      }

      // 光标更新
      if (activeTool === 'select') {
        if (isMarqueeSelecting.current) {
          el.style.cursor = 'crosshair';
          return;
        }

        const canvas = annotationCanvasRef.current;
        const ctx = canvas?.getContext('2d');

        for (const textId of selectedTextIdsRef.current) {
          const selectedText = textsRef.current.find((t) => t.id === textId);
          if (selectedText && ctx) {
            const dragType = getTextDragTypeAtPoint(coord.x, coord.y, selectedText, ctx);
            if (dragType !== 'none') {
              el.style.cursor = TEXT_CURSOR_MAP[dragType];
              return;
            }
          }
        }

        for (const mosaicId of selectedMosaicIdsRef.current) {
          const selectedMosaic = mosaicsRef.current.find((m) => m.id === mosaicId);
          if (selectedMosaic) {
            const dragType = getMosaicDragTypeAtPoint(coord.x, coord.y, selectedMosaic);
            if (dragType !== 'none') {
              el.style.cursor = MOSAIC_CURSOR_MAP[dragType];
              return;
            }
          }
        }

        for (const rectId of selectedRectIdsRef.current) {
          const selectedRect = rectsRef.current.find((r) => r.id === rectId);
          if (selectedRect) {
            const dragType = getRectDragTypeAtPoint(coord.x, coord.y, selectedRect);
            if (dragType !== 'none') {
              el.style.cursor = RECT_CURSOR_MAP[dragType];
              return;
            }
          }
        }

        for (const arrowId of selectedArrowIdsRef.current) {
          const selectedArrow = arrowsRef.current.find((a) => a.id === arrowId);
          if (selectedArrow) {
            const dragType = getDragTypeAtPoint(coord.x, coord.y, selectedArrow);
            if (dragType !== 'none') {
              el.style.cursor = 'move';
              return;
            }
          }
        }

        el.style.cursor = 'default';
      }

      if (activeTool === 'crop') {
        const currentCrop = cropAreaRef.current;
        if (currentCrop) {
          const dragType = getCropDragTypeAtPoint(coord.x, coord.y, currentCrop);
          el.style.cursor = CROP_CURSOR_MAP[dragType];
        } else {
          el.style.cursor = 'crosshair';
        }
      }
    };

    const onUp = (e: MouseEvent) => {
      // 结束框选
      if (isMarqueeSelecting.current && marqueeStart.current && marqueeEnd.current) {
        const canvas = annotationCanvasRef.current;
        const ctx = canvas?.getContext('2d');
        const rect = {
          x1: marqueeStart.current.x,
          y1: marqueeStart.current.y,
          x2: marqueeEnd.current.x,
          y2: marqueeEnd.current.y,
        };

        const width = Math.abs(rect.x2 - rect.x1);
        const height = Math.abs(rect.y2 - rect.y1);
        const minSelectSize = 5;

        if (width < minSelectSize && height < minSelectSize) {
          setSelectedArrowIds([]);
          setSelectedRectIds([]);
          setSelectedTextIds([]);
          setSelectedMosaicIds([]);
        } else {
          const newSelectedArrowIds: string[] = [];
          const newSelectedRectIds: string[] = [];
          const newSelectedTextIds: string[] = [];
          const newSelectedMosaicIds: string[] = [];

          arrowsRef.current.forEach(arrow => {
            if (isArrowInRect(arrow, rect)) newSelectedArrowIds.push(arrow.id);
          });
          rectsRef.current.forEach(rectItem => {
            if (isRectInRect(rectItem, rect)) newSelectedRectIds.push(rectItem.id);
          });
          if (ctx) {
            textsRef.current.forEach(text => {
              if (isTextInRect(text, rect, ctx)) newSelectedTextIds.push(text.id);
            });
          }
          mosaicsRef.current.forEach(mosaic => {
            if (isMosaicInRect(mosaic, rect)) newSelectedMosaicIds.push(mosaic.id);
          });

          if (e.shiftKey) {
            setSelectedArrowIds(prev => [...new Set([...prev, ...newSelectedArrowIds])]);
            setSelectedRectIds(prev => [...new Set([...prev, ...newSelectedRectIds])]);
            setSelectedTextIds(prev => [...new Set([...prev, ...newSelectedTextIds])]);
            setSelectedMosaicIds(prev => [...new Set([...prev, ...newSelectedMosaicIds])]);
          } else {
            setSelectedArrowIds(newSelectedArrowIds);
            setSelectedRectIds(newSelectedRectIds);
            setSelectedTextIds(newSelectedTextIds);
            setSelectedMosaicIds(newSelectedMosaicIds);
          }
        }

        isMarqueeSelecting.current = false;
        marqueeStart.current = null;
        marqueeEnd.current = null;
        renderShapes();
        return;
      }

      // 结束箭头绘制
      if (isDrawingArrow.current && drawingArrow.current) {
        const { startX, startY, endX, endY } = drawingArrow.current;
        const dist = Math.sqrt((endX - startX) ** 2 + (endY - startY) ** 2);
        if (dist > 5) {
          pushHistory();
          const newArrow: ArrowShape = {
            id: generateArrowId(),
            startX, startY, endX, endY,
            ...arrowStyleRef.current,
          };
          setArrows((prev) => [...prev, newArrow]);
          setSelectedArrowIds([newArrow.id]);
          setActiveTool('select');
        }
      }
      isDrawingArrow.current = false;
      drawingArrow.current = null;

      // 结束矩形绘制
      if (isDrawingRect.current && drawingRect.current) {
        const { startX, startY, endX, endY } = drawingRect.current;
        const width = Math.abs(endX - startX);
        const height = Math.abs(endY - startY);
        if (width >= 5 && height >= 5) {
          pushHistory();
          const newRect: RectShape = {
            id: generateRectId(),
            x: Math.min(startX, endX),
            y: Math.min(startY, endY),
            width, height,
            ...rectStyleRef.current,
          };
          setRects((prev) => [...prev, newRect]);
          setSelectedRectIds([newRect.id]);
          setActiveTool('select');
        }
      }
      isDrawingRect.current = false;
      drawingRect.current = null;

      // 结束马赛克绘制
      if (isDrawingMosaic.current && drawingMosaic.current) {
        const { startX, startY, endX, endY } = drawingMosaic.current;
        const width = Math.abs(endX - startX);
        const height = Math.abs(endY - startY);
        if (width >= 5 && height >= 5) {
          pushHistory();
          const newMosaic: MosaicShape = {
            id: generateMosaicId(),
            x: Math.min(startX, endX),
            y: Math.min(startY, endY),
            width, height,
            ...mosaicStyleRef.current,
          };
          setMosaics((prev) => [...prev, newMosaic]);
          setSelectedMosaicIds([newMosaic.id]);
          setActiveTool('select');
        }
      }
      isDrawingMosaic.current = false;
      drawingMosaic.current = null;

      // 结束裁剪框绘制
      if (isDrawingCrop.current && drawingCrop.current) {
        const { startX, startY, endX, endY } = drawingCrop.current;
        const width = Math.abs(endX - startX);
        const height = Math.abs(endY - startY);
        if (width >= MIN_CROP_SIZE && height >= MIN_CROP_SIZE) {
          setCropArea({
            x: Math.min(startX, endX),
            y: Math.min(startY, endY),
            width, height,
          });
        }
      }
      isDrawingCrop.current = false;
      drawingCrop.current = null;

      // 结束拖拽
      if (draggingRef.current || draggingRectRef.current || draggingTextRef.current || draggingMosaicRef.current) {
        pushHistory();
      }
      draggingRef.current = null;
      draggingRectRef.current = null;
      draggingTextRef.current = null;
      draggingMosaicRef.current = null;
      draggingCropRef.current = null;

      renderShapes();
    };

    el.addEventListener('mousedown', onDown);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);

    return () => {
      el.removeEventListener('mousedown', onDown);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [activeTool, imageData, selectedArrowIds, selectedRectIds, selectedTextIds, selectedMosaicIds, editingTextId, screenToImageCoord, renderShapes, cropArea, pushHistory]);

  // 标注变化时重新渲染
  useEffect(() => {
    renderShapes();
  }, [arrows, rects, texts, mosaics, selectedArrowIds, selectedRectIds, selectedTextIds, selectedMosaicIds, renderShapes]);

  // 缩放/平移变化时重新渲染
  useEffect(() => {
    renderShapes();
  }, [scale, offset, renderShapes]);

  // Canvas 尺寸调整
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
  // 裁剪操作
  // ---------------------------------------------------------------------------
  const applyCrop = useCallback(() => {
    const currentCropArea = cropAreaRef.current;
    const naturalSize = imageNaturalSizeRef.current;
    const displaySize = imageDisplaySizeRef.current;

    if (!currentCropArea || !imageData || !naturalSize || !displaySize) return;

    pushHistory();

    const scaleX = naturalSize.width / displaySize.width;
    const scaleY = naturalSize.height / displaySize.height;

    const cropX = Math.round(currentCropArea.x * scaleX);
    const cropY = Math.round(currentCropArea.y * scaleY);
    const cropWidth = Math.round(currentCropArea.width * scaleX);
    const cropHeight = Math.round(currentCropArea.height * scaleY);

    const img = new window.Image();
    img.onload = () => {
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = cropWidth;
      tempCanvas.height = cropHeight;
      const tempCtx = tempCanvas.getContext('2d');
      if (!tempCtx) return;

      tempCtx.drawImage(img, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
      const croppedImageData = tempCanvas.toDataURL('image/png');

      setImageData(croppedImageData);
      setArrows([]);
      setRects([]);
      setTexts([]);
      setMosaics([]);
      setSelectedArrowIds([]);
      setSelectedRectIds([]);
      setSelectedTextIds([]);
      setSelectedMosaicIds([]);
      setCropArea(null);
      setImageNaturalSize({ width: cropWidth, height: cropHeight });
      setImageDisplaySize(null);
      setActiveTool('select');
      scaleRef.current = 1;
      offsetRef.current = { x: 0, y: 0 };
      setScale(1);
      setOffset({ x: 0, y: 0 });
    };
    img.src = imageData;
  }, [imageData, pushHistory, setScale, setOffset]);

  const cancelCrop = useCallback(() => {
    setCropArea(null);
    setActiveTool('select');
  }, []);

  // ---------------------------------------------------------------------------
  // 键盘快捷键
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
        e.preventDefault();
        handleUndo();
        return;
      }

      if (((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) || ((e.ctrlKey || e.metaKey) && e.key === 'y')) {
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
        e.preventDefault();
        handleRedo();
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
        e.preventDefault();
        setSelectedArrowIds(arrowsRef.current.map(a => a.id));
        setSelectedRectIds(rectsRef.current.map(r => r.id));
        setSelectedTextIds(textsRef.current.map(t => t.id));
        setSelectedMosaicIds(mosaicsRef.current.map(m => m.id));
        return;
      }

      if (e.key === 'Escape') {
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
        if (isMarqueeSelecting.current) {
          isMarqueeSelecting.current = false;
          marqueeStart.current = null;
          marqueeEnd.current = null;
          renderShapes();
          return;
        }
        setSelectedArrowIds([]);
        setSelectedRectIds([]);
        setSelectedTextIds([]);
        setSelectedMosaicIds([]);
        return;
      }

      if (activeTool === 'crop') {
        if (e.key === 'Enter' && cropArea) {
          e.preventDefault();
          applyCrop();
          return;
        }
        if (e.key === 'Escape') {
          e.preventDefault();
          cancelCrop();
          return;
        }
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

        const hasSelection = selectedArrowIds.length > 0 || selectedRectIds.length > 0 || selectedTextIds.length > 0 || selectedMosaicIds.length > 0;
        if (hasSelection) pushHistory();

        if (selectedArrowIds.length > 0) {
          setArrows((prev) => prev.filter((a) => !selectedArrowIds.includes(a.id)));
          setSelectedArrowIds([]);
        }
        if (selectedRectIds.length > 0) {
          setRects((prev) => prev.filter((r) => !selectedRectIds.includes(r.id)));
          setSelectedRectIds([]);
        }
        if (selectedTextIds.length > 0) {
          setTexts((prev) => prev.filter((t) => !selectedTextIds.includes(t.id)));
          setSelectedTextIds([]);
        }
        if (selectedMosaicIds.length > 0) {
          setMosaics((prev) => prev.filter((m) => !selectedMosaicIds.includes(m.id)));
          setSelectedMosaicIds([]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedArrowIds, selectedRectIds, selectedTextIds, selectedMosaicIds, activeTool, cropArea, applyCrop, cancelCrop, handleUndo, handleRedo, pushHistory, renderShapes]);

  // 双击文字编辑
  useEffect(() => {
    const el = canvasRef.current;
    if (!el || !imageData) return;

    const onDoubleClick = (e: MouseEvent) => {
      const coord = screenToImageCoord(e.clientX, e.clientY);
      if (!coord) return;

      if (activeTool === 'crop' && cropArea) {
        if (isPointInCrop(coord.x, coord.y, cropArea)) {
          applyCrop();
          return;
        }
      }

      if (activeTool !== 'select') return;

      const canvas = annotationCanvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      for (let i = textsRef.current.length - 1; i >= 0; i--) {
        const text = textsRef.current[i];
        if (isPointInText(coord.x, coord.y, text, ctx)) {
          setEditingTextId(text.id);
          setEditingTextValue(text.text);
          setSelectedTextIds([text.id]);
          setTimeout(() => {
            textInputRef.current?.focus();
            textInputRef.current?.select();
          }, 0);
          return;
        }
      }
    };

    el.addEventListener('dblclick', onDoubleClick);
    return () => el.removeEventListener('dblclick', onDoubleClick);
  }, [activeTool, imageData, screenToImageCoord, cropArea, applyCrop]);

  // 工具切换时清除裁剪状态
  useEffect(() => {
    if (activeTool !== 'crop' && cropArea) {
      setCropArea(null);
    }
  }, [activeTool, cropArea]);

  // ---------------------------------------------------------------------------
  // 初始化和粘贴监听
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const src = parseSource();
    setSource(src);

    if (src === 'capture') {
      chrome.storage.local.get(STORAGE_KEYS.CAPTURE_RESULT, (result) => {
        const data = result[STORAGE_KEYS.CAPTURE_RESULT] as { success: boolean; imageData?: string; error?: string } | undefined;
        if (data?.success && data.imageData) {
          setImageData(data.imageData);
        } else if (data?.error) {
          setError(data.error);
        } else {
          setError('未找到截图数据');
        }
      });
    }
  }, []);

  // 粘贴监听
  useEffect(() => {
    if (source !== 'upload') return;

    const handlePaste = (e: Event) => {
      const clipboardEvent = e as unknown as ClipboardEvent;
      const items = clipboardEvent.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          e.preventDefault();
          const file = items[i].getAsFile();
          if (!file) return;
          readFileAsDataUrl(file).then((dataUrl) => {
            setImageData(dataUrl);
          });
          return;
        }
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [source]);

  // 图片加载后初始化历史
  const imageLoadedRef = useRef(false);
  useEffect(() => {
    if (imageData && !imageLoadedRef.current) {
      imageLoadedRef.current = true;
      historyActions.resetToState({
        arrows: [],
        rects: [],
        texts: [],
        mosaics: [],
        imageData,
        view: { scale: 1, offset: { x: 0, y: 0 } },
        selectedArrowIds: [],
        selectedRectIds: [],
        selectedTextIds: [],
        selectedMosaicIds: [],
      });
      updateHistoryButtons();
    }
  }, [imageData, historyActions, updateHistoryButtons]);

  // ---------------------------------------------------------------------------
  // 属性更新函数
  // ---------------------------------------------------------------------------
  const updateArrow = useCallback(
    (updates: Partial<ArrowShape>) => {
      if (selectedArrowIds.length !== 1) return;
      const selectedArrowId = selectedArrowIds[0];
      pushHistory();
      setArrows((prev) => prev.map((a) => (a.id === selectedArrowId ? { ...a, ...updates } : a)));
    },
    [selectedArrowIds, pushHistory]
  );

  const updateRect = useCallback(
    (updates: Partial<RectShape>) => {
      if (selectedRectIds.length !== 1) return;
      const selectedRectId = selectedRectIds[0];
      pushHistory();
      setRects((prev) => prev.map((r) => (r.id === selectedRectId ? { ...r, ...updates } : r)));
    },
    [selectedRectIds, pushHistory]
  );

  const updateText = useCallback(
    (updates: Partial<TextShape>) => {
      if (selectedTextIds.length !== 1) return;
      const selectedTextId = selectedTextIds[0];
      pushHistory();
      setTexts((prev) => prev.map((t) => (t.id === selectedTextId ? { ...t, ...updates } : t)));
    },
    [selectedTextIds, pushHistory]
  );

  const updateMosaic = useCallback(
    (updates: Partial<MosaicShape>) => {
      if (selectedMosaicIds.length !== 1) return;
      const selectedMosaicId = selectedMosaicIds[0];
      pushHistory();
      setMosaics((prev) => prev.map((m) => (m.id === selectedMosaicId ? { ...m, ...updates } : m)));
    },
    [selectedMosaicIds, pushHistory]
  );

  // 选中的对象
  const selectedArrow = useMemo(
    () => (selectedArrowIds.length === 1 ? arrows.find((a) => a.id === selectedArrowIds[0]) || null : null),
    [arrows, selectedArrowIds]
  );
  const selectedRect = useMemo(
    () => (selectedRectIds.length === 1 ? rects.find((r) => r.id === selectedRectIds[0]) || null : null),
    [rects, selectedRectIds]
  );
  const selectedText = useMemo(
    () => (selectedTextIds.length === 1 ? texts.find((t) => t.id === selectedTextIds[0]) || null : null),
    [texts, selectedTextIds]
  );
  const selectedMosaic = useMemo(
    () => (selectedMosaicIds.length === 1 ? mosaics.find((m) => m.id === selectedMosaicIds[0]) || null : null),
    [mosaics, selectedMosaicIds]
  );

  // ---------------------------------------------------------------------------
  // 渲染
  // ---------------------------------------------------------------------------
  const showPlaceholder = source === 'upload' && !imageData && !error;

  return (
    <div className="editor-container w-screen h-screen flex overflow-hidden">
      {/* 左侧工具栏 */}
      <Toolbar
        activeTool={activeTool}
        onSelectTool={setActiveTool}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={handleUndo}
        onRedo={handleRedo}
      />

      {/* 中央画布 */}
      <main
        ref={canvasRef}
        className="editor-canvas flex-1 h-full relative overflow-hidden"
        style={{
          cursor:
            activeTool === 'move'
              ? 'grab'
              : activeTool === 'arrow' || activeTool === 'rect' || activeTool === 'text' || activeTool === 'mosaic' || activeTool === 'crop'
                ? 'crosshair'
                : 'default',
        }}
      >
        {error ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <p className="text-[13px] text-[var(--color-editor-error)] font-body mb-1">// capture error</p>
              <p className="text-[11px] text-[var(--color-editor-hint)] font-body">{error}</p>
            </div>
          </div>
        ) : imageData ? (
          <>
            {/* Transform Layer */}
            <div
              ref={imageContainerRef}
              className="absolute inset-0"
              style={{
                transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
                transformOrigin: '0 0',
              }}
            >
              {(() => {
                const imgDisplaySize = imageDisplaySizeRef.current || imageDisplaySize;

                if (!imgDisplaySize) {
                  return (
                    <div
                      ref={exportContainerRef}
                      style={{
                        ...getBackgroundStyle(frameSettings.background),
                        borderRadius: `${frameSettings.borderRadius.topLeft}${frameSettings.borderRadius.unit} ${frameSettings.borderRadius.topRight}${frameSettings.borderRadius.unit} ${frameSettings.borderRadius.bottomRight}${frameSettings.borderRadius.unit} ${frameSettings.borderRadius.bottomLeft}${frameSettings.borderRadius.unit}`,
                        padding: frameSettings.padding.linked
                          ? frameSettings.padding.top
                          : `${frameSettings.padding.top}px ${frameSettings.padding.right}px ${frameSettings.padding.bottom}px ${frameSettings.padding.left}px`,
                        display: 'inline-block',
                        boxShadow: frameSettings.shadow.enabled
                          ? `0 ${frameSettings.shadow.offsetY}px ${frameSettings.shadow.blur}px ${frameSettings.shadow.color}40`
                          : 'none',
                        overflow: 'hidden',
                        position: 'relative',
                      }}
                    >
                      <div
                        style={{
                          borderRadius: `${frameSettings.imageRadius.topLeft}${frameSettings.imageRadius.unit} ${frameSettings.imageRadius.topRight}${frameSettings.imageRadius.unit} ${frameSettings.imageRadius.bottomRight}${frameSettings.imageRadius.unit} ${frameSettings.imageRadius.bottomLeft}${frameSettings.imageRadius.unit}`,
                          overflow: 'hidden',
                          display: 'inline-block',
                          boxShadow: frameSettings.imageShadow.enabled
                            ? `${frameSettings.imageShadow.offsetX}px ${frameSettings.imageShadow.offsetY}px ${frameSettings.imageShadow.blur}px ${frameSettings.imageShadow.color}40`
                            : 'none',
                        }}
                      >
                        <CanvasImage src={imageData} onSizeChange={handleImageSizeChange} onNaturalSizeChange={handleImageNaturalSizeChange} />
                      </div>
                      <WatermarkRenderer watermark={frameSettings.watermark} bgColor={frameSettings.background} />
                    </div>
                  );
                }

                const containerSize = calculateAspectRatioSize(
                  frameSettings.aspectRatio,
                  imgDisplaySize.width,
                  imgDisplaySize.height,
                  frameSettings.customAspectRatio
                );

                const isAuto = frameSettings.aspectRatio === 'auto';

                return (
                  <div
                    ref={exportContainerRef}
                    style={{
                      ...getBackgroundStyle(frameSettings.background),
                      borderRadius: `${frameSettings.borderRadius.topLeft}${frameSettings.borderRadius.unit} ${frameSettings.borderRadius.topRight}${frameSettings.borderRadius.unit} ${frameSettings.borderRadius.bottomRight}${frameSettings.borderRadius.unit} ${frameSettings.borderRadius.bottomLeft}${frameSettings.borderRadius.unit}`,
                      padding: frameSettings.padding.linked
                        ? frameSettings.padding.top
                        : `${frameSettings.padding.top}px ${frameSettings.padding.right}px ${frameSettings.padding.bottom}px ${frameSettings.padding.left}px`,
                      display: 'inline-block',
                      boxShadow: frameSettings.shadow.enabled
                        ? `0 ${frameSettings.shadow.offsetY}px ${frameSettings.shadow.blur}px ${frameSettings.shadow.color}40`
                        : 'none',
                      overflow: 'hidden',
                      position: 'relative',
                      ...(isAuto ? {} : { width: containerSize.width, height: containerSize.height }),
                    }}
                  >
                    <div
                      style={{
                        position: 'relative',
                        width: isAuto ? 'auto' : '100%',
                        height: isAuto ? 'auto' : '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <div
                        style={{
                          borderRadius: `${frameSettings.imageRadius.topLeft}${frameSettings.imageRadius.unit} ${frameSettings.imageRadius.topRight}${frameSettings.imageRadius.unit} ${frameSettings.imageRadius.bottomRight}${frameSettings.imageRadius.unit} ${frameSettings.imageRadius.bottomLeft}${frameSettings.imageRadius.unit}`,
                          overflow: 'hidden',
                          display: 'inline-block',
                          boxShadow: frameSettings.imageShadow.enabled
                            ? `${frameSettings.imageShadow.offsetX}px ${frameSettings.imageShadow.offsetY}px ${frameSettings.imageShadow.blur}px ${frameSettings.imageShadow.color}40`
                            : 'none',
                        }}
                      >
                        <CanvasImage src={imageData} onSizeChange={handleImageSizeChange} onNaturalSizeChange={handleImageNaturalSizeChange} />
                      </div>
                    </div>
                    <WatermarkRenderer watermark={frameSettings.watermark} bgColor={frameSettings.background} />
                  </div>
                );
              })()}
            </div>

            {/* Annotation Canvas Layer */}
            <canvas ref={annotationCanvasRef} className="absolute inset-0 pointer-events-none" style={{ pointerEvents: 'auto' }} />

            {/* 文字编辑输入框 */}
            {editingTextId &&
              (() => {
                const editingText = texts.find((t) => t.id === editingTextId);
                if (!editingText) return null;

                const containerX = editingText.x * scale + offset.x;
                const containerY = editingText.y * scale + offset.y;

                return (
                  <input
                    ref={textInputRef}
                    type="text"
                    value={editingTextValue}
                    onChange={(e) => setEditingTextValue(e.target.value)}
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        if (editingTextId && editingTextValue.trim()) {
                          setTexts((prev) => prev.map((t) => (t.id === editingTextId ? { ...t, text: editingTextValue } : t)));
                        }
                        setEditingTextId(null);
                        setEditingTextValue('');
                      } else if (e.key === 'Escape') {
                        setEditingTextId(null);
                        setEditingTextValue('');
                      }
                    }}
                    onBlur={() => {
                      if (editingTextId && editingTextValue.trim()) {
                        setTexts((prev) => prev.map((t) => (t.id === editingTextId ? { ...t, text: editingTextValue } : t)));
                      }
                      setEditingTextId(null);
                      setEditingTextValue('');
                    }}
                    style={{
                      position: 'absolute',
                      left: containerX,
                      top: containerY,
                      fontSize: editingText.fontSize * scale,
                      fontWeight: editingText.fontWeight,
                      fontStyle: editingText.fontStyle,
                      color: editingText.color,
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      minWidth: 50,
                      fontFamily: 'sans-serif',
                      padding: 0,
                      margin: 0,
                      zIndex: 1000,
                    }}
                  />
                );
              })()}

            {/* 裁剪操作提示 */}
            {activeTool === 'crop' && (
              <div
                className="absolute top-4 left-1/2 flex items-center gap-3 rounded-lg px-4 py-2"
                style={{
                  backgroundColor: 'rgba(0,0,0,0.75)',
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                  transform: 'translateX(-50%)',
                }}
              >
                <span className="text-[12px] text-white">{cropArea ? t('crop.adjustHint') : t('crop.drawHint')}</span>
                <span className="text-[12px]" style={{ color: '#a5b4fc' }}>Enter</span>
                <span className="text-[12px] text-white">{t('crop.confirm')}</span>
                <span className="text-[12px] text-gray-400 mx-1">|</span>
                <span className="text-[12px] text-amber-400">Esc</span>
                <span className="text-[12px] text-white">{t('crop.cancel')}</span>
              </div>
            )}

            {/* 缩放控制条 */}
            <div
              className="absolute bottom-4 left-1/2 h-8 flex items-center gap-2 rounded-lg px-2"
              style={{
                backgroundColor: 'rgba(255,255,255,0.85)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                border: '1px solid rgba(0,0,0,0.1)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                transform: 'translateX(-50%)',
              }}
            >
              <button onClick={zoomOut} className="w-6 h-6 flex items-center justify-center rounded hover:bg-black/5">
                <Minus size={14} />
              </button>
              <span className="text-[12px] w-10 text-center tabular-nums" style={{ color: '#333' }}>
                {zoomPercent}%
              </span>
              <input
                type="range"
                min={MIN_SCALE}
                max={MAX_SCALE}
                step={0.01}
                value={scale}
                onChange={(e) => handleSlider(parseFloat(e.target.value))}
                className="w-20"
                style={{ accentColor: 'var(--color-field-focus)' }}
              />
              <button onClick={zoomIn} className="w-6 h-6 flex items-center justify-center rounded hover:bg-black/5">
                <Plus size={14} />
              </button>
              <div className="w-px h-4 bg-gray-300" />
              <button onClick={resetView} className="w-6 h-6 flex items-center justify-center rounded hover:bg-black/5">
                <RotateCcw size={14} />
              </button>
            </div>
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

      {/* 右侧属性面板 */}
      <PropertiesPanel
        selectedArrow={selectedArrow}
        onUpdateArrow={updateArrow}
        selectedRect={selectedRect}
        onUpdateRect={updateRect}
        selectedText={selectedText}
        onUpdateText={updateText}
        selectedMosaic={selectedMosaic}
        onUpdateMosaic={updateMosaic}
        frameSettings={frameSettings}
        onUpdateFrameSettings={(updates) => setFrameSettings((prev) => ({ ...prev, ...updates }))}
        collapsedSections={collapsedSections}
        onCollapsedChange={setCollapsedSections}
        onExportImage={handleExportImage}
        onCopyToClipboard={handleCopyToClipboard}
        isExporting={isExporting}
        copied={copied}
        exportError={exportError}
      />
    </div>
  );
};

export default App;
