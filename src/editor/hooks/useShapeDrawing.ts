/**
 * useShapeDrawing - 图形绘制 Hook
 *
 * 处理图形绘制状态管理，包括：
 * - 箭头绘制
 * - 矩形绘制
 * - 马赛克绘制
 * - 裁剪框绘制
 */

import { useRef, useCallback } from 'react';
import type { ArrowShape, RectShape, MosaicShape, CropArea, RectBorderStyle } from '../types';

/**
 * 绘制状态类型
 */
interface DrawingState {
  isDrawing: boolean;
  shape: { startX: number; startY: number; endX: number; endY: number } | null;
}

/**
 * 绘制回调
 */
interface DrawingCallbacks {
  setArrows: (updater: (prev: ArrowShape[]) => ArrowShape[]) => void;
  setRects: (updater: (prev: RectShape[]) => RectShape[]) => void;
  setMosaics: (updater: (prev: MosaicShape[]) => MosaicShape[]) => void;
  setCropArea: (area: CropArea | null) => void;
  setSelectedArrowIds: (ids: string[]) => void;
  setSelectedRectIds: (ids: string[]) => void;
  setSelectedMosaicIds: (ids: string[]) => void;
  setActiveTool: (tool: string) => void;
  pushHistory: () => void;
  renderShapes: () => void;
}

/**
 * 默认样式 Refs
 */
interface DefaultStyles {
  arrowStyle: React.MutableRefObject<{
    color: string;
    strokeWidth: number;
    headSize: number;
    style: 'single' | 'double';
  }>;
  rectStyle: React.MutableRefObject<{
    color: string;
    strokeWidth: number;
    fillOpacity: number;
    borderStyle: RectBorderStyle;
  }>;
  mosaicStyle: React.MutableRefObject<{
    blockSize: number;
    opacity: number;
  }>;
}

/**
 * ID 生成函数
 */
interface IdGenerators {
  generateArrowId: () => string;
  generateRectId: () => string;
  generateMosaicId: () => string;
}

/**
 * 绘制配置
 */
interface DrawingConfig {
  imageNaturalSize: { width: number; height: number } | null;
  minCropSize: number;
  drawMinDistance: number;
  shapeMinSize: number;
}

/**
 * 图形绘制 Hook 返回值
 */
interface UseShapeDrawingReturn {
  // 绘制状态 Refs
  drawingArrow: React.MutableRefObject<DrawingState>;
  drawingRect: React.MutableRefObject<DrawingState>;
  drawingMosaic: React.MutableRefObject<DrawingState>;
  drawingCrop: React.MutableRefObject<DrawingState>;
  // 方法
  startDrawing: (tool: string, x: number, y: number) => void;
  updateDrawing: (tool: string, x: number, y: number) => void;
  finishDrawing: (tool: string) => void;
}

/**
 * 图形绘制 Hook
 */
export function useShapeDrawing(
  config: DrawingConfig,
  callbacks: DrawingCallbacks,
  defaultStyles: DefaultStyles,
  idGenerators: IdGenerators
): UseShapeDrawingReturn {
  const { imageNaturalSize, minCropSize, drawMinDistance, shapeMinSize } = config;

  // 绘制状态 Refs
  const drawingArrow = useRef<DrawingState>({ isDrawing: false, shape: null });
  const drawingRect = useRef<DrawingState>({ isDrawing: false, shape: null });
  const drawingMosaic = useRef<DrawingState>({ isDrawing: false, shape: null });
  const drawingCrop = useRef<DrawingState>({ isDrawing: false, shape: null });

  /**
   * 开始绘制
   */
  const startDrawing = useCallback(
    (tool: string, x: number, y: number) => {
      switch (tool) {
        case 'arrow':
          drawingArrow.current = { isDrawing: true, shape: { startX: x, startY: y, endX: x, endY: y } };
          break;
        case 'rect':
          drawingRect.current = { isDrawing: true, shape: { startX: x, startY: y, endX: x, endY: y } };
          break;
        case 'mosaic':
          drawingMosaic.current = { isDrawing: true, shape: { startX: x, startY: y, endX: x, endY: y } };
          break;
        case 'crop':
          drawingCrop.current = { isDrawing: true, shape: { startX: x, startY: y, endX: x, endY: y } };
          callbacks.setCropArea(null);
          break;
      }
    },
    [callbacks]
  );

  /**
   * 更新绘制
   */
  const updateDrawing = useCallback(
    (tool: string, x: number, y: number) => {
      switch (tool) {
        case 'arrow':
          if (drawingArrow.current.shape) {
            drawingArrow.current.shape.endX = x;
            drawingArrow.current.shape.endY = y;
          }
          break;
        case 'rect':
          if (drawingRect.current.shape) {
            drawingRect.current.shape.endX = x;
            drawingRect.current.shape.endY = y;
          }
          break;
        case 'mosaic':
          if (drawingMosaic.current.shape) {
            drawingMosaic.current.shape.endX = x;
            drawingMosaic.current.shape.endY = y;
          }
          break;
        case 'crop':
          if (drawingCrop.current.shape && imageNaturalSize) {
            drawingCrop.current.shape.endX = Math.max(0, Math.min(imageNaturalSize.width, x));
            drawingCrop.current.shape.endY = Math.max(0, Math.min(imageNaturalSize.height, y));
          }
          break;
      }
      callbacks.renderShapes();
    },
    [callbacks, imageNaturalSize]
  );

  /**
   * 完成绘制
   */
  const finishDrawing = useCallback(
    (tool: string) => {
      switch (tool) {
        case 'arrow': {
          const shape = drawingArrow.current.shape;
          if (shape) {
            const dist = Math.sqrt(
              (shape.endX - shape.startX) ** 2 + (shape.endY - shape.startY) ** 2
            );
            if (dist > drawMinDistance) {
              callbacks.pushHistory();
              const newArrow: ArrowShape = {
                id: idGenerators.generateArrowId(),
                startX: shape.startX,
                startY: shape.startY,
                endX: shape.endX,
                endY: shape.endY,
                ...defaultStyles.arrowStyle.current,
              };
              callbacks.setArrows((prev) => [...prev, newArrow]);
              callbacks.setSelectedArrowIds([newArrow.id]);
              callbacks.setActiveTool('select');
            }
          }
          drawingArrow.current = { isDrawing: false, shape: null };
          break;
        }
        case 'rect': {
          const shape = drawingRect.current.shape;
          if (shape) {
            const width = Math.abs(shape.endX - shape.startX);
            const height = Math.abs(shape.endY - shape.startY);
            if (width >= shapeMinSize && height >= shapeMinSize) {
              callbacks.pushHistory();
              const newRect: RectShape = {
                id: idGenerators.generateRectId(),
                x: Math.min(shape.startX, shape.endX),
                y: Math.min(shape.startY, shape.endY),
                width,
                height,
                ...defaultStyles.rectStyle.current,
              };
              callbacks.setRects((prev) => [...prev, newRect]);
              callbacks.setSelectedRectIds([newRect.id]);
              callbacks.setActiveTool('select');
            }
          }
          drawingRect.current = { isDrawing: false, shape: null };
          break;
        }
        case 'mosaic': {
          const shape = drawingMosaic.current.shape;
          if (shape) {
            const width = Math.abs(shape.endX - shape.startX);
            const height = Math.abs(shape.endY - shape.startY);
            if (width >= shapeMinSize && height >= shapeMinSize) {
              callbacks.pushHistory();
              const newMosaic: MosaicShape = {
                id: idGenerators.generateMosaicId(),
                x: Math.min(shape.startX, shape.endX),
                y: Math.min(shape.startY, shape.endY),
                width,
                height,
                ...defaultStyles.mosaicStyle.current,
              };
              callbacks.setMosaics((prev) => [...prev, newMosaic]);
              callbacks.setSelectedMosaicIds([newMosaic.id]);
              callbacks.setActiveTool('select');
            }
          }
          drawingMosaic.current = { isDrawing: false, shape: null };
          break;
        }
        case 'crop': {
          const shape = drawingCrop.current.shape;
          if (shape) {
            const width = Math.abs(shape.endX - shape.startX);
            const height = Math.abs(shape.endY - shape.startY);
            if (width >= minCropSize && height >= minCropSize) {
              callbacks.setCropArea({
                x: Math.min(shape.startX, shape.endX),
                y: Math.min(shape.startY, shape.endY),
                width,
                height,
              });
            }
          }
          drawingCrop.current = { isDrawing: false, shape: null };
          break;
        }
      }
      callbacks.renderShapes();
    },
    [callbacks, defaultStyles, idGenerators, drawMinDistance, shapeMinSize, minCropSize]
  );

  return {
    drawingArrow,
    drawingRect,
    drawingMosaic,
    drawingCrop,
    startDrawing,
    updateDrawing,
    finishDrawing,
  };
}

export default useShapeDrawing;
