/**
 * useEditorEvents - 编辑器统一事件处理 Hook
 *
 * 整合所有鼠标事件处理逻辑，包括：
 * - 图形绘制
 * - 图形拖拽
 * - 框选
 * - 光标更新
 */

import { useEffect, useRef } from 'react';
import type { ArrowShape, RectShape, TextShape, MosaicShape, CropArea, ToolId } from '../types';
import {
  isPointNearArrow,
  isPointInRect,
  isPointInText,
  isPointInMosaic,
  getDragTypeAtPoint,
  getRectDragTypeAtPoint,
  getTextDragTypeAtPoint,
  getMosaicDragTypeAtPoint,
  getCropDragTypeAtPoint,
  isArrowInRect,
  isRectInRect,
  isTextInRect,
  isMosaicInRect,
  type RectDragType,
  type MosaicDragType,
  type CropDragType,
} from '../utils/shape-helpers';
import { SHAPE_MIN_SIZE, DRAW_MIN_DISTANCE, FONT_SIZE_MIN, FONT_SIZE_MAX, MIN_CROP_SIZE, RECT_CURSOR_MAP, TEXT_CURSOR_MAP, MOSAIC_CURSOR_MAP, CROP_CURSOR_MAP, SELECT_MIN_SIZE } from '../constants';
import { generateArrowId, generateRectId, generateMosaicId, generateTextId } from '../utils/editor';
import { applyDragResize } from '../utils/drag-resize';

/**
 * 绘制状态
 */
interface DrawingState {
  arrow: { isDrawing: boolean; shape: { startX: number; startY: number; endX: number; endY: number } | null };
  rect: { isDrawing: boolean; shape: { startX: number; startY: number; endX: number; endY: number } | null };
  mosaic: { isDrawing: boolean; shape: { startX: number; startY: number; endX: number; endY: number } | null };
  crop: { isDrawing: boolean; shape: { startX: number; startY: number; endX: number; endY: number } | null };
}

/**
 * 拖拽状态
 */
interface DragState {
  arrow: { type: string; id: string; startX: number; startY: number; origStart: { x: number; y: number }; origEnd: { x: number; y: number } } | null;
  rect: { type: string; id: string; startX: number; startY: number; orig: { x: number; y: number; width: number; height: number } } | null;
  text: { type: string; id: string; startX: number; startY: number; orig: { x: number; y: number; fontSize: number } } | null;
  mosaic: { type: string; id: string; startX: number; startY: number; orig: { x: number; y: number; width: number; height: number } } | null;
  crop: { type: string; startX: number; startY: number; orig: { x: number; y: number; width: number; height: number } } | null;
}

/**
 * 框选状态
 */
interface MarqueeState {
  isSelecting: boolean;
  start: { x: number; y: number } | null;
  end: { x: number; y: number } | null;
}

/**
 * 配置接口
 */
interface EditorEventsConfig {
  canvasRef: React.RefObject<HTMLDivElement | null>;
  annotationCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  activeTool: string;
  imageData: string | null;
  editingTextId: string | null;
  cropArea: CropArea | null;
  imageNaturalSize: { width: number; height: number } | null;
  imageDisplaySize: { width: number; height: number } | null;
  frameSettings: { background: { color: string } };
  arrowsRef: React.MutableRefObject<ArrowShape[]>;
  rectsRef: React.MutableRefObject<RectShape[]>;
  textsRef: React.MutableRefObject<TextShape[]>;
  mosaicsRef: React.MutableRefObject<MosaicShape[]>;
  selectedArrowIdsRef: React.MutableRefObject<string[]>;
  selectedRectIdsRef: React.MutableRefObject<string[]>;
  selectedTextIdsRef: React.MutableRefObject<string[]>;
  selectedMosaicIdsRef: React.MutableRefObject<string[]>;
  cropAreaRef: React.MutableRefObject<CropArea | null>;
  imageNaturalSizeRef: React.MutableRefObject<{ width: number; height: number } | null>;
}

/**
 * 回调接口
 */
interface EditorEventsCallbacks {
  pushHistory: () => void;
  renderShapes: () => void;
  screenToImageCoord: (clientX: number, clientY: number) => { x: number; y: number } | null;
  setArrows: (updater: (prev: ArrowShape[]) => ArrowShape[]) => void;
  setRects: (updater: (prev: RectShape[]) => RectShape[]) => void;
  setTexts: (updater: (prev: TextShape[]) => TextShape[]) => void;
  setMosaics: (updater: (prev: MosaicShape[]) => MosaicShape[]) => void;
  setSelectedArrowIds: (ids: string[] | ((prev: string[]) => string[])) => void;
  setSelectedRectIds: (ids: string[] | ((prev: string[]) => string[])) => void;
  setSelectedTextIds: (ids: string[] | ((prev: string[]) => string[])) => void;
  setSelectedMosaicIds: (ids: string[] | ((prev: string[]) => string[])) => void;
  setCropArea: (area: CropArea | null) => void;
  setActiveTool: (tool: ToolId) => void;
  startEditing: (text: TextShape) => void;
  applyCrop: () => void;
}

/**
 * 返回值接口
 */
interface UseEditorEventsReturn {
  drawingStateRef: React.MutableRefObject<DrawingState>;
  dragStateRef: React.MutableRefObject<DragState>;
  marqueeStateRef: React.MutableRefObject<MarqueeState>;
}

/**
 * 编辑器事件处理 Hook
 */
export function useEditorEvents(
  config: EditorEventsConfig,
  callbacks: EditorEventsCallbacks
): UseEditorEventsReturn {
  const {
    canvasRef,
    annotationCanvasRef,
    activeTool,
    imageData,
    editingTextId,
    cropArea,
    imageNaturalSize,
    frameSettings,
    arrowsRef,
    rectsRef,
    textsRef,
    mosaicsRef,
    selectedArrowIdsRef,
    selectedRectIdsRef,
    selectedTextIdsRef,
    selectedMosaicIdsRef,
    cropAreaRef,
    imageNaturalSizeRef,
  } = config;

  // 状态 Refs
  const drawingStateRef = useRef<DrawingState>({
    arrow: { isDrawing: false, shape: null },
    rect: { isDrawing: false, shape: null },
    mosaic: { isDrawing: false, shape: null },
    crop: { isDrawing: false, shape: null },
  });

  const dragStateRef = useRef<DragState>({
    arrow: null,
    rect: null,
    text: null,
    mosaic: null,
    crop: null,
  });

  const marqueeStateRef = useRef<MarqueeState>({
    isSelecting: false,
    start: null,
    end: null,
  });

  useEffect(() => {
    const el = canvasRef.current;
    if (!el || !imageData) return;

    const onDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      if (editingTextId) return;

      const coord = callbacks.screenToImageCoord(e.clientX, e.clientY);
      if (!coord) return;

      // 绘制模式
      if (['arrow', 'rect', 'mosaic'].includes(activeTool)) {
        const tool = activeTool as 'arrow' | 'rect' | 'mosaic';
        drawingStateRef.current[tool] = { isDrawing: true, shape: { startX: coord.x, startY: coord.y, endX: coord.x, endY: coord.y } };
        return;
      }

      // 文字工具
      if (activeTool === 'text') {
        callbacks.pushHistory();
        const newText: TextShape = {
          id: generateTextId(),
          x: coord.x,
          y: coord.y,
          text: 'Text',
          color: '#000000',
          fontSize: 16,
          fontWeight: 'normal',
          fontStyle: 'normal',
        };
        callbacks.setTexts((prev) => [...prev, newText]);
        callbacks.setSelectedTextIds([newText.id]);
        callbacks.setSelectedArrowIds([]);
        callbacks.setSelectedRectIds([]);
        callbacks.setSelectedMosaicIds([]);
        callbacks.setActiveTool('select');
        return;
      }

      // 裁剪工具
      if (activeTool === 'crop') {
        const currentCrop = cropAreaRef.current;
        const imgSize = imageNaturalSizeRef.current;

        if (currentCrop && imgSize) {
          const dragType = getCropDragTypeAtPoint(coord.x, coord.y, currentCrop);
          if (dragType !== 'none') {
            dragStateRef.current.crop = {
              type: dragType,
              startX: coord.x,
              startY: coord.y,
              orig: { x: currentCrop.x, y: currentCrop.y, width: currentCrop.width, height: currentCrop.height },
            };
            return;
          }
        }

        drawingStateRef.current.crop = { isDrawing: true, shape: { startX: coord.x, startY: coord.y, endX: coord.x, endY: coord.y } };
        callbacks.setCropArea(null);
        return;
      }

      // 选择工具
      if (activeTool === 'select') {
        const canvas = annotationCanvasRef.current;
        const ctx = canvas?.getContext('2d');

        // 检测已选中对象的控制点
        const checkSelectedShape = () => {
          // 检测文字
          for (const textId of selectedTextIdsRef.current) {
            const text = textsRef.current.find(t => t.id === textId);
            if (text && ctx) {
              const dragType = getTextDragTypeAtPoint(coord.x, coord.y, text, ctx);
              if (dragType !== 'none') {
                callbacks.setSelectedTextIds([textId]);
                callbacks.setSelectedArrowIds([]);
                callbacks.setSelectedRectIds([]);
                callbacks.setSelectedMosaicIds([]);
                dragStateRef.current.text = { type: dragType, id: textId, startX: coord.x, startY: coord.y, orig: { x: text.x, y: text.y, fontSize: text.fontSize } };
                return true;
              }
            }
          }

          // 检测马赛克
          for (const mosaicId of selectedMosaicIdsRef.current) {
            const mosaic = mosaicsRef.current.find(m => m.id === mosaicId);
            if (mosaic) {
              const dragType = getMosaicDragTypeAtPoint(coord.x, coord.y, mosaic);
              if (dragType !== 'none') {
                callbacks.setSelectedMosaicIds([mosaicId]);
                callbacks.setSelectedArrowIds([]);
                callbacks.setSelectedRectIds([]);
                callbacks.setSelectedTextIds([]);
                dragStateRef.current.mosaic = { type: dragType, id: mosaicId, startX: coord.x, startY: coord.y, orig: { x: mosaic.x, y: mosaic.y, width: mosaic.width, height: mosaic.height } };
                return true;
              }
            }
          }

          // 检测矩形
          for (const rectId of selectedRectIdsRef.current) {
            const rect = rectsRef.current.find(r => r.id === rectId);
            if (rect) {
              const dragType = getRectDragTypeAtPoint(coord.x, coord.y, rect);
              if (dragType !== 'none') {
                callbacks.setSelectedRectIds([rectId]);
                callbacks.setSelectedArrowIds([]);
                callbacks.setSelectedTextIds([]);
                callbacks.setSelectedMosaicIds([]);
                dragStateRef.current.rect = { type: dragType, id: rectId, startX: coord.x, startY: coord.y, orig: { x: rect.x, y: rect.y, width: rect.width, height: rect.height } };
                return true;
              }
            }
          }

          // 检测箭头
          for (const arrowId of selectedArrowIdsRef.current) {
            const arrow = arrowsRef.current.find(a => a.id === arrowId);
            if (arrow) {
              const dragType = getDragTypeAtPoint(coord.x, coord.y, arrow);
              if (dragType !== 'none') {
                callbacks.setSelectedArrowIds([arrowId]);
                callbacks.setSelectedRectIds([]);
                callbacks.setSelectedTextIds([]);
                callbacks.setSelectedMosaicIds([]);
                dragStateRef.current.arrow = { type: dragType, id: arrowId, startX: coord.x, startY: coord.y, origStart: { x: arrow.startX, y: arrow.startY }, origEnd: { x: arrow.endX, y: arrow.endY } };
                return true;
              }
            }
          }
          return false;
        };

        if (checkSelectedShape()) return;

        // 检测点击对象
        if (ctx) {
          for (let i = textsRef.current.length - 1; i >= 0; i--) {
            const text = textsRef.current[i];
            if (isPointInText(coord.x, coord.y, text, ctx)) {
              if (e.shiftKey) {
                if (selectedTextIdsRef.current.includes(text.id)) {
                  callbacks.setSelectedTextIds(prev => prev.filter(id => id !== text.id));
                } else {
                  callbacks.setSelectedTextIds(prev => [...prev, text.id]);
                }
              } else {
                if (selectedTextIdsRef.current.includes(text.id)) {
                  dragStateRef.current.text = { type: 'move', id: text.id, startX: coord.x, startY: coord.y, orig: { x: text.x, y: text.y, fontSize: text.fontSize } };
                } else {
                  callbacks.setSelectedTextIds([text.id]);
                  callbacks.setSelectedArrowIds([]);
                  callbacks.setSelectedRectIds([]);
                  callbacks.setSelectedMosaicIds([]);
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
                callbacks.setSelectedMosaicIds(prev => prev.filter(id => id !== mosaic.id));
              } else {
                callbacks.setSelectedMosaicIds(prev => [...prev, mosaic.id]);
              }
            } else {
              if (selectedMosaicIdsRef.current.includes(mosaic.id)) {
                dragStateRef.current.mosaic = { type: 'move', id: mosaic.id, startX: coord.x, startY: coord.y, orig: { x: mosaic.x, y: mosaic.y, width: mosaic.width, height: mosaic.height } };
              } else {
                callbacks.setSelectedMosaicIds([mosaic.id]);
                callbacks.setSelectedArrowIds([]);
                callbacks.setSelectedRectIds([]);
                callbacks.setSelectedTextIds([]);
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
                callbacks.setSelectedRectIds(prev => prev.filter(id => id !== rect.id));
              } else {
                callbacks.setSelectedRectIds(prev => [...prev, rect.id]);
              }
            } else {
              if (selectedRectIdsRef.current.includes(rect.id)) {
                dragStateRef.current.rect = { type: 'move', id: rect.id, startX: coord.x, startY: coord.y, orig: { x: rect.x, y: rect.y, width: rect.width, height: rect.height } };
              } else {
                callbacks.setSelectedRectIds([rect.id]);
                callbacks.setSelectedArrowIds([]);
                callbacks.setSelectedTextIds([]);
                callbacks.setSelectedMosaicIds([]);
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
                callbacks.setSelectedArrowIds(prev => prev.filter(id => id !== arrow.id));
              } else {
                callbacks.setSelectedArrowIds(prev => [...prev, arrow.id]);
              }
            } else {
              if (selectedArrowIdsRef.current.includes(arrow.id)) {
                dragStateRef.current.arrow = { type: 'move', id: arrow.id, startX: coord.x, startY: coord.y, origStart: { x: arrow.startX, y: arrow.startY }, origEnd: { x: arrow.endX, y: arrow.endY } };
              } else {
                callbacks.setSelectedArrowIds([arrow.id]);
                callbacks.setSelectedRectIds([]);
                callbacks.setSelectedTextIds([]);
                callbacks.setSelectedMosaicIds([]);
              }
            }
            return;
          }
        }

        // 开始框选
        marqueeStateRef.current.isSelecting = true;
        marqueeStateRef.current.start = { x: coord.x, y: coord.y };
        marqueeStateRef.current.end = { x: coord.x, y: coord.y };
      }
    };

    const onMove = (e: MouseEvent) => {
      const coord = callbacks.screenToImageCoord(e.clientX, e.clientY);
      if (!coord) return;

      // 框选更新
      if (marqueeStateRef.current.isSelecting && activeTool === 'select') {
        if (marqueeStateRef.current.start) {
          marqueeStateRef.current.end = { x: coord.x, y: coord.y };
          callbacks.renderShapes();
        }
        return;
      }

      // 绘制更新
      const drawingTools = ['arrow', 'rect', 'mosaic', 'crop'] as const;
      for (const tool of drawingTools) {
        if (drawingStateRef.current[tool].isDrawing && drawingStateRef.current[tool].shape) {
          if (tool === 'crop') {
            const imgSize = imageNaturalSizeRef.current;
            if (imgSize) {
              drawingStateRef.current[tool].shape!.endX = Math.max(0, Math.min(imgSize.width, coord.x));
              drawingStateRef.current[tool].shape!.endY = Math.max(0, Math.min(imgSize.height, coord.y));
            }
          } else {
            drawingStateRef.current[tool].shape!.endX = coord.x;
            drawingStateRef.current[tool].shape!.endY = coord.y;
          }
          callbacks.renderShapes();
          return;
        }
      }

      // 拖拽更新
      const updateDrag = () => {
        // 矩形拖拽
        const rectDrag = dragStateRef.current.rect;
        if (rectDrag && activeTool === 'select') {
          const dx = coord.x - rectDrag.startX;
          const dy = coord.y - rectDrag.startY;
          callbacks.setRects((prev) =>
            prev.map((r) => {
              if (r.id !== rectDrag.id) return r;
              return applyDragResize(r, rectDrag.type as RectDragType, dx, dy, rectDrag.orig, SHAPE_MIN_SIZE);
            })
          );
          callbacks.renderShapes();
          return true;
        }

        // 箭头拖拽
        const arrowDrag = dragStateRef.current.arrow;
        if (arrowDrag && activeTool === 'select') {
          const dx = coord.x - arrowDrag.startX;
          const dy = coord.y - arrowDrag.startY;
          callbacks.setArrows((prev) =>
            prev.map((a) => {
              if (a.id !== arrowDrag.id) return a;
              switch (arrowDrag.type) {
                case 'move':
                case 'middle':
                  return { ...a, startX: arrowDrag.origStart.x + dx, startY: arrowDrag.origStart.y + dy, endX: arrowDrag.origEnd.x + dx, endY: arrowDrag.origEnd.y + dy };
                case 'start':
                  return { ...a, startX: arrowDrag.origStart.x + dx, startY: arrowDrag.origStart.y + dy };
                case 'end':
                  return { ...a, endX: arrowDrag.origEnd.x + dx, endY: arrowDrag.origEnd.y + dy };
                default:
                  return a;
              }
            })
          );
          callbacks.renderShapes();
          return true;
        }

        // 文字拖拽
        const textDrag = dragStateRef.current.text;
        if (textDrag && activeTool === 'select') {
          const dx = coord.x - textDrag.startX;
          const dy = coord.y - textDrag.startY;
          callbacks.setTexts((prev) =>
            prev.map((t) => {
              if (t.id !== textDrag.id) return t;
              switch (textDrag.type) {
                case 'move':
                  return { ...t, x: textDrag.orig.x + dx, y: textDrag.orig.y + dy };
                case 'resize-br':
                  return { ...t, fontSize: Math.min(FONT_SIZE_MAX, Math.max(FONT_SIZE_MIN, textDrag.orig.fontSize + (dx + dy) * 0.5)) };
                case 'resize-tl':
                  return { ...t, fontSize: Math.min(FONT_SIZE_MAX, Math.max(FONT_SIZE_MIN, textDrag.orig.fontSize + (-dx - dy) * 0.5)), x: textDrag.orig.x + dx, y: textDrag.orig.y + dy };
                case 'resize-tr':
                  return { ...t, fontSize: Math.min(FONT_SIZE_MAX, Math.max(FONT_SIZE_MIN, textDrag.orig.fontSize + (dx - dy) * 0.5)), y: textDrag.orig.y + dy };
                case 'resize-bl':
                  return { ...t, fontSize: Math.min(FONT_SIZE_MAX, Math.max(FONT_SIZE_MIN, textDrag.orig.fontSize + (-dx + dy) * 0.5)), x: textDrag.orig.x + dx };
                default:
                  return t;
              }
            })
          );
          callbacks.renderShapes();
          return true;
        }

        // 马赛克拖拽
        const mosaicDrag = dragStateRef.current.mosaic;
        if (mosaicDrag && activeTool === 'select') {
          const dx = coord.x - mosaicDrag.startX;
          const dy = coord.y - mosaicDrag.startY;
          callbacks.setMosaics((prev) =>
            prev.map((m) => {
              if (m.id !== mosaicDrag.id) return m;
              return applyDragResize(m, mosaicDrag.type as MosaicDragType, dx, dy, mosaicDrag.orig, SHAPE_MIN_SIZE);
            })
          );
          callbacks.renderShapes();
          return true;
        }

        // 裁剪框拖拽
        const cropDrag = dragStateRef.current.crop;
        if (cropDrag && activeTool === 'crop') {
          const imgSize = imageNaturalSizeRef.current;
          if (!imgSize) return false;
          
          const dx = coord.x - cropDrag.startX;
          const dy = coord.y - cropDrag.startY;
          const bounds = { minX: 0, minY: 0, maxX: imgSize.width, maxY: imgSize.height };
          const newCrop = applyDragResize(
            { x: cropDrag.orig.x, y: cropDrag.orig.y, width: cropDrag.orig.width, height: cropDrag.orig.height },
            cropDrag.type as CropDragType,
            dx, dy,
            cropDrag.orig,
            MIN_CROP_SIZE,
            bounds
          );
          callbacks.setCropArea(newCrop);
          callbacks.renderShapes();
          return true;
        }
        return false;
      };

      if (updateDrag()) return;

      // 光标更新
      if (activeTool === 'select') {
        if (marqueeStateRef.current.isSelecting) {
          el.style.cursor = 'crosshair';
          return;
        }

        const canvas = annotationCanvasRef.current;
        const ctx = canvas?.getContext('2d');

        const updateCursor = () => {
          for (const textId of selectedTextIdsRef.current) {
            const selectedText = textsRef.current.find((t) => t.id === textId);
            if (selectedText && ctx) {
              const dragType = getTextDragTypeAtPoint(coord.x, coord.y, selectedText, ctx);
              if (dragType !== 'none') {
                el.style.cursor = TEXT_CURSOR_MAP[dragType];
                return true;
              }
            }
          }

          for (const mosaicId of selectedMosaicIdsRef.current) {
            const selectedMosaic = mosaicsRef.current.find((m) => m.id === mosaicId);
            if (selectedMosaic) {
              const dragType = getMosaicDragTypeAtPoint(coord.x, coord.y, selectedMosaic);
              if (dragType !== 'none') {
                el.style.cursor = MOSAIC_CURSOR_MAP[dragType];
                return true;
              }
            }
          }

          for (const rectId of selectedRectIdsRef.current) {
            const selectedRect = rectsRef.current.find((r) => r.id === rectId);
            if (selectedRect) {
              const dragType = getRectDragTypeAtPoint(coord.x, coord.y, selectedRect);
              if (dragType !== 'none') {
                el.style.cursor = RECT_CURSOR_MAP[dragType];
                return true;
              }
            }
          }

          for (const arrowId of selectedArrowIdsRef.current) {
            const selectedArrow = arrowsRef.current.find((a) => a.id === arrowId);
            if (selectedArrow) {
              const dragType = getDragTypeAtPoint(coord.x, coord.y, selectedArrow);
              if (dragType !== 'none') {
                el.style.cursor = 'move';
                return true;
              }
            }
          }

          el.style.cursor = 'default';
          return false;
        };

        updateCursor();
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
      if (marqueeStateRef.current.isSelecting && marqueeStateRef.current.start && marqueeStateRef.current.end) {
        const canvas = annotationCanvasRef.current;
        const ctx = canvas?.getContext('2d');
        const rect = {
          x1: marqueeStateRef.current.start.x,
          y1: marqueeStateRef.current.start.y,
          x2: marqueeStateRef.current.end.x,
          y2: marqueeStateRef.current.end.y,
        };

        const width = Math.abs(rect.x2 - rect.x1);
        const height = Math.abs(rect.y2 - rect.y1);

        if (width < SELECT_MIN_SIZE && height < SELECT_MIN_SIZE) {
          callbacks.setSelectedArrowIds([]);
          callbacks.setSelectedRectIds([]);
          callbacks.setSelectedTextIds([]);
          callbacks.setSelectedMosaicIds([]);
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
            callbacks.setSelectedArrowIds(prev => [...new Set([...prev, ...newSelectedArrowIds])]);
            callbacks.setSelectedRectIds(prev => [...new Set([...prev, ...newSelectedRectIds])]);
            callbacks.setSelectedTextIds(prev => [...new Set([...prev, ...newSelectedTextIds])]);
            callbacks.setSelectedMosaicIds(prev => [...new Set([...prev, ...newSelectedMosaicIds])]);
          } else {
            callbacks.setSelectedArrowIds(newSelectedArrowIds);
            callbacks.setSelectedRectIds(newSelectedRectIds);
            callbacks.setSelectedTextIds(newSelectedTextIds);
            callbacks.setSelectedMosaicIds(newSelectedMosaicIds);
          }
        }

        marqueeStateRef.current.isSelecting = false;
        marqueeStateRef.current.start = null;
        marqueeStateRef.current.end = null;
        callbacks.renderShapes();
        return;
      }

      // 结束绘制
      const finishDrawing = (tool: 'arrow' | 'rect' | 'mosaic', generator: () => string) => {
        const shape = drawingStateRef.current[tool].shape;
        if (!shape) return false;

        if (tool === 'arrow') {
          const dist = Math.sqrt((shape.endX - shape.startX) ** 2 + (shape.endY - shape.startY) ** 2);
          if (dist > DRAW_MIN_DISTANCE) {
            callbacks.pushHistory();
            const newShape: ArrowShape = {
              id: generator(),
              startX: shape.startX, startY: shape.startY, endX: shape.endX, endY: shape.endY,
              color: frameSettings.background.color, strokeWidth: 2, headSize: 10, style: 'single',
            };
            callbacks.setArrows((prev) => [...prev, newShape]);
            callbacks.setSelectedArrowIds([newShape.id]);
            callbacks.setActiveTool('select');
          }
        } else {
          const width = Math.abs(shape.endX - shape.startX);
          const height = Math.abs(shape.endY - shape.startY);
          if (width >= SHAPE_MIN_SIZE && height >= SHAPE_MIN_SIZE) {
            callbacks.pushHistory();
            if (tool === 'rect') {
              const newShape: RectShape = {
                id: generator(),
                x: Math.min(shape.startX, shape.endX), y: Math.min(shape.startY, shape.endY),
                width, height, color: frameSettings.background.color, strokeWidth: 2, fillOpacity: 0, borderStyle: 'solid',
              };
              callbacks.setRects((prev) => [...prev, newShape]);
              callbacks.setSelectedRectIds([newShape.id]);
            } else if (tool === 'mosaic') {
              const newShape: MosaicShape = {
                id: generator(),
                x: Math.min(shape.startX, shape.endX), y: Math.min(shape.startY, shape.endY),
                width, height, blockSize: 10, opacity: 1,
              };
              callbacks.setMosaics((prev) => [...prev, newShape]);
              callbacks.setSelectedMosaicIds([newShape.id]);
            }
            callbacks.setActiveTool('select');
          }
        }
        drawingStateRef.current[tool] = { isDrawing: false, shape: null };
        return true;
      };

      finishDrawing('arrow', generateArrowId);
      finishDrawing('rect', generateRectId);
      finishDrawing('mosaic', generateMosaicId);

      // 结束裁剪框绘制
      if (drawingStateRef.current.crop.isDrawing && drawingStateRef.current.crop.shape) {
        const { startX, startY, endX, endY } = drawingStateRef.current.crop.shape;
        const width = Math.abs(endX - startX);
        const height = Math.abs(endY - startY);
        if (width >= MIN_CROP_SIZE && height >= MIN_CROP_SIZE) {
          callbacks.setCropArea({ x: Math.min(startX, endX), y: Math.min(startY, endY), width, height });
        }
      }
      drawingStateRef.current.crop = { isDrawing: false, shape: null };

      // 结束拖拽
      if (dragStateRef.current.arrow || dragStateRef.current.rect || dragStateRef.current.text || dragStateRef.current.mosaic || dragStateRef.current.crop) {
        callbacks.pushHistory();
      }
      dragStateRef.current = { arrow: null, rect: null, text: null, mosaic: null, crop: null };

      callbacks.renderShapes();
    };

    el.addEventListener('mousedown', onDown);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);

    return () => {
      el.removeEventListener('mousedown', onDown);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [activeTool, imageData, editingTextId, cropArea, imageNaturalSize, canvasRef, annotationCanvasRef, frameSettings, arrowsRef, rectsRef, textsRef, mosaicsRef, selectedArrowIdsRef, selectedRectIdsRef, selectedTextIdsRef, selectedMosaicIdsRef, cropAreaRef, imageNaturalSizeRef, callbacks]);

  return { drawingStateRef, dragStateRef, marqueeStateRef };
}

export default useEditorEvents;
