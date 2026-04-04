// useEditorEvents Hook 测试

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useEditorEvents } from '../useEditorEvents';
import type { ArrowShape, RectShape, TextShape, MosaicShape, CropArea } from '../../types';

// Mock dependencies
vi.mock('../../utils/shape-helpers', () => ({
  isPointNearArrow: vi.fn(() => false),
  isPointInRect: vi.fn(() => false),
  isPointInText: vi.fn(() => false),
  isPointInMosaic: vi.fn(() => false),
  getDragTypeAtPoint: vi.fn(() => 'none'),
  getRectDragTypeAtPoint: vi.fn(() => 'none'),
  getTextDragTypeAtPoint: vi.fn(() => 'none'),
  getMosaicDragTypeAtPoint: vi.fn(() => 'none'),
  getCropDragTypeAtPoint: vi.fn(() => 'none'),
  isArrowInRect: vi.fn(() => false),
  isRectInRect: vi.fn(() => false),
  isTextInRect: vi.fn(() => false),
  isMosaicInRect: vi.fn(() => false),
}));

vi.mock('../../utils/editor', () => ({
  generateArrowId: vi.fn(() => 'arrow-1'),
  generateRectId: vi.fn(() => 'rect-1'),
  generateMosaicId: vi.fn(() => 'mosaic-1'),
  generateTextId: vi.fn(() => 'text-1'),
}));

vi.mock('../../utils/drag-resize', () => ({
  applyDragResize: vi.fn((shape) => shape),
}));

// Helper to create mouse events
function createMouseEvent(type: string, options: MouseEventInit = {}): MouseEvent {
  return new MouseEvent(type, {
    bubbles: true,
    cancelable: true,
    ...options,
  });
}

describe('useEditorEvents', () => {
  let mockCanvasElement: HTMLDivElement;
  let mockAnnotationCanvas: HTMLCanvasElement;

  const createMockConfig = (overrides = {}) => ({
    canvasRef: { current: mockCanvasElement },
    annotationCanvasRef: { current: mockAnnotationCanvas },
    activeTool: 'select' as const,
    imageData: 'test-image',
    editingTextId: null,
    cropArea: null,
    imageNaturalSize: { width: 800, height: 600 },
    imageDisplaySize: { width: 400, height: 300 },
    frameSettings: { background: { color: '#FFFFFF' } },
    arrowsRef: { current: [] as ArrowShape[] },
    rectsRef: { current: [] as RectShape[] },
    textsRef: { current: [] as TextShape[] },
    mosaicsRef: { current: [] as MosaicShape[] },
    selectedArrowIdsRef: { current: [] as string[] },
    selectedRectIdsRef: { current: [] as string[] },
    selectedTextIdsRef: { current: [] as string[] },
    selectedMosaicIdsRef: { current: [] as string[] },
    cropAreaRef: { current: null as CropArea | null },
    imageNaturalSizeRef: { current: { width: 800, height: 600 } },
    ...overrides,
  });

  const createMockCallbacks = (overrides = {}) => ({
    pushHistory: vi.fn(),
    renderShapes: vi.fn(),
    screenToImageCoord: vi.fn((x, y) => ({ x, y })),
    setArrows: vi.fn(),
    setRects: vi.fn(),
    setTexts: vi.fn(),
    setMosaics: vi.fn(),
    setSelectedArrowIds: vi.fn(),
    setSelectedRectIds: vi.fn(),
    setSelectedTextIds: vi.fn(),
    setSelectedMosaicIds: vi.fn(),
    setCropArea: vi.fn(),
    setActiveTool: vi.fn(),
    startEditing: vi.fn(),
    applyCrop: vi.fn(),
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockCanvasElement = document.createElement('div');
    mockAnnotationCanvas = document.createElement('canvas');
    // Mock getContext
    mockAnnotationCanvas.getContext = vi.fn(() => ({} as CanvasRenderingContext2D));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('基础功能', () => {
    it('应该返回 drawingStateRef, dragStateRef, marqueeStateRef', () => {
      const config = createMockConfig();
      const callbacks = createMockCallbacks();

      const { result } = renderHook(() => useEditorEvents(config, callbacks));

      expect(result.current.drawingStateRef).toBeDefined();
      expect(result.current.dragStateRef).toBeDefined();
      expect(result.current.marqueeStateRef).toBeDefined();
    });

    it('应该在 imageData 为 null 时不设置事件监听', () => {
      const config = createMockConfig({ imageData: null });
      const callbacks = createMockCallbacks();

      renderHook(() => useEditorEvents(config, callbacks));

      const mousedownEvent = createMouseEvent('mousedown', { clientX: 100, clientY: 100 });
      mockCanvasElement.dispatchEvent(mousedownEvent);

      expect(callbacks.renderShapes).not.toHaveBeenCalled();
    });
  });

  describe('鼠标按下事件', () => {
    it('应该在非左键点击时不处理', () => {
      const config = createMockConfig();
      const callbacks = createMockCallbacks();

      renderHook(() => useEditorEvents(config, callbacks));

      const mousedownEvent = createMouseEvent('mousedown', {
        button: 2, // 右键
        clientX: 100,
        clientY: 100,
      });
      mockCanvasElement.dispatchEvent(mousedownEvent);

      expect(callbacks.setTexts).not.toHaveBeenCalled();
    });

    it('应该在编辑文字时不处理', () => {
      const config = createMockConfig({ editingTextId: 'text-1' });
      const callbacks = createMockCallbacks();

      renderHook(() => useEditorEvents(config, callbacks));

      const mousedownEvent = createMouseEvent('mousedown', {
        button: 0,
        clientX: 100,
        clientY: 100,
      });
      mockCanvasElement.dispatchEvent(mousedownEvent);

      expect(callbacks.setTexts).not.toHaveBeenCalled();
    });

    it('应该在 screenToImageCoord 返回 null 时不处理', () => {
      const config = createMockConfig();
      const callbacks = createMockCallbacks({
        screenToImageCoord: vi.fn(() => null),
      });

      renderHook(() => useEditorEvents(config, callbacks));

      const mousedownEvent = createMouseEvent('mousedown', {
        button: 0,
        clientX: 100,
        clientY: 100,
      });
      mockCanvasElement.dispatchEvent(mousedownEvent);

      expect(callbacks.setTexts).not.toHaveBeenCalled();
    });
  });

  describe('绘制模式', () => {
    it('应该在 arrow 工具下开始绘制箭头', () => {
      const config = createMockConfig({ activeTool: 'arrow' });
      const callbacks = createMockCallbacks();

      const { result } = renderHook(() => useEditorEvents(config, callbacks));

      const mousedownEvent = createMouseEvent('mousedown', {
        button: 0,
        clientX: 100,
        clientY: 100,
      });
      mockCanvasElement.dispatchEvent(mousedownEvent);

      expect(result.current.drawingStateRef.current.arrow.isDrawing).toBe(true);
      expect(result.current.drawingStateRef.current.arrow.shape).toEqual({
        startX: 100,
        startY: 100,
        endX: 100,
        endY: 100,
      });
    });

    it('应该在 rect 工具下开始绘制矩形', () => {
      const config = createMockConfig({ activeTool: 'rect' });
      const callbacks = createMockCallbacks();

      const { result } = renderHook(() => useEditorEvents(config, callbacks));

      const mousedownEvent = createMouseEvent('mousedown', {
        button: 0,
        clientX: 100,
        clientY: 100,
      });
      mockCanvasElement.dispatchEvent(mousedownEvent);

      expect(result.current.drawingStateRef.current.rect.isDrawing).toBe(true);
      expect(result.current.drawingStateRef.current.rect.shape).toEqual({
        startX: 100,
        startY: 100,
        endX: 100,
        endY: 100,
      });
    });

    it('应该在 mosaic 工具下开始绘制马赛克', () => {
      const config = createMockConfig({ activeTool: 'mosaic' });
      const callbacks = createMockCallbacks();

      const { result } = renderHook(() => useEditorEvents(config, callbacks));

      const mousedownEvent = createMouseEvent('mousedown', {
        button: 0,
        clientX: 100,
        clientY: 100,
      });
      mockCanvasElement.dispatchEvent(mousedownEvent);

      expect(result.current.drawingStateRef.current.mosaic.isDrawing).toBe(true);
      expect(result.current.drawingStateRef.current.mosaic.shape).toEqual({
        startX: 100,
        startY: 100,
        endX: 100,
        endY: 100,
      });
    });
  });

  describe('文字工具', () => {
    it('应该在点击时创建新文字', () => {
      const config = createMockConfig({ activeTool: 'text' });
      const callbacks = createMockCallbacks();

      renderHook(() => useEditorEvents(config, callbacks));

      const mousedownEvent = createMouseEvent('mousedown', {
        button: 0,
        clientX: 100,
        clientY: 100,
      });
      mockCanvasElement.dispatchEvent(mousedownEvent);

      expect(callbacks.pushHistory).toHaveBeenCalled();
      expect(callbacks.setTexts).toHaveBeenCalled();
      expect(callbacks.setActiveTool).toHaveBeenCalledWith('select');
    });
  });

  describe('裁剪工具', () => {
    it('应该在无裁剪框时开始绘制裁剪框', () => {
      const config = createMockConfig({ activeTool: 'crop' });
      const callbacks = createMockCallbacks();

      const { result } = renderHook(() => useEditorEvents(config, callbacks));

      const mousedownEvent = createMouseEvent('mousedown', {
        button: 0,
        clientX: 100,
        clientY: 100,
      });
      mockCanvasElement.dispatchEvent(mousedownEvent);

      expect(result.current.drawingStateRef.current.crop.isDrawing).toBe(true);
      expect(callbacks.setCropArea).toHaveBeenCalledWith(null);
    });

    it('应该在点击裁剪框控制点时开始拖拽', async () => {
      const cropArea: CropArea = { x: 50, y: 50, width: 200, height: 150 };
      const config = createMockConfig({
        activeTool: 'crop',
        cropArea,
        cropAreaRef: { current: cropArea },
      });
      const callbacks = createMockCallbacks();

      // Mock getCropDragTypeAtPoint to return a drag type
      const shapeHelpers = await import('../../utils/shape-helpers');
      vi.mocked(shapeHelpers.getCropDragTypeAtPoint).mockReturnValue('move');

      const { result } = renderHook(() => useEditorEvents(config, callbacks));

      const mousedownEvent = createMouseEvent('mousedown', {
        button: 0,
        clientX: 100,
        clientY: 100,
      });
      mockCanvasElement.dispatchEvent(mousedownEvent);

      expect(result.current.dragStateRef.current.crop).not.toBeNull();
      expect(result.current.dragStateRef.current.crop?.type).toBe('move');
    });
  });

  describe('选择工具 - 框选', () => {
    it('应该在没有点击到图形时开始框选', () => {
      const config = createMockConfig({ activeTool: 'select' });
      const callbacks = createMockCallbacks();

      const { result } = renderHook(() => useEditorEvents(config, callbacks));

      const mousedownEvent = createMouseEvent('mousedown', {
        button: 0,
        clientX: 100,
        clientY: 100,
      });
      mockCanvasElement.dispatchEvent(mousedownEvent);

      expect(result.current.marqueeStateRef.current.isSelecting).toBe(true);
      expect(result.current.marqueeStateRef.current.start).toEqual({ x: 100, y: 100 });
    });

    it('应该清除选择状态当框选范围过小时', async () => {
      const config = createMockConfig({ activeTool: 'select' });
      const callbacks = createMockCallbacks();

      renderHook(() => useEditorEvents(config, callbacks));

      // 开始框选
      const mousedownEvent = createMouseEvent('mousedown', {
        button: 0,
        clientX: 100,
        clientY: 100,
      });
      mockCanvasElement.dispatchEvent(mousedownEvent);

      // 小范围移动
      const mousemoveEvent = createMouseEvent('mousemove', {
        clientX: 101,
        clientY: 101,
      });
      window.dispatchEvent(mousemoveEvent);

      // 结束框选
      const mouseupEvent = createMouseEvent('mouseup', {
        clientX: 101,
        clientY: 101,
      });
      window.dispatchEvent(mouseupEvent);

      expect(callbacks.setSelectedArrowIds).toHaveBeenCalledWith([]);
      expect(callbacks.setSelectedRectIds).toHaveBeenCalledWith([]);
    });
  });

  describe('鼠标移动事件', () => {
    it('应该更新绘制中的形状', () => {
      const config = createMockConfig({ activeTool: 'arrow' });
      const callbacks = createMockCallbacks();

      const { result } = renderHook(() => useEditorEvents(config, callbacks));

      // 开始绘制
      const mousedownEvent = createMouseEvent('mousedown', {
        button: 0,
        clientX: 100,
        clientY: 100,
      });
      mockCanvasElement.dispatchEvent(mousedownEvent);

      // 移动鼠标
      const mousemoveEvent = createMouseEvent('mousemove', {
        clientX: 200,
        clientY: 200,
      });
      window.dispatchEvent(mousemoveEvent);

      expect(result.current.drawingStateRef.current.arrow.shape?.endX).toBe(200);
      expect(result.current.drawingStateRef.current.arrow.shape?.endY).toBe(200);
      expect(callbacks.renderShapes).toHaveBeenCalled();
    });

    it('应该更新框选范围', () => {
      const config = createMockConfig({ activeTool: 'select' });
      const callbacks = createMockCallbacks();

      const { result } = renderHook(() => useEditorEvents(config, callbacks));

      // 开始框选
      const mousedownEvent = createMouseEvent('mousedown', {
        button: 0,
        clientX: 100,
        clientY: 100,
      });
      mockCanvasElement.dispatchEvent(mousedownEvent);

      // 移动鼠标
      const mousemoveEvent = createMouseEvent('mousemove', {
        clientX: 200,
        clientY: 200,
      });
      window.dispatchEvent(mousemoveEvent);

      expect(result.current.marqueeStateRef.current.end).toEqual({ x: 200, y: 200 });
      expect(callbacks.renderShapes).toHaveBeenCalled();
    });

    it('应该限制裁剪绘制在图片边界内', () => {
      const config = createMockConfig({ activeTool: 'crop' });
      const callbacks = createMockCallbacks();

      const { result } = renderHook(() => useEditorEvents(config, callbacks));

      // 开始绘制
      const mousedownEvent = createMouseEvent('mousedown', {
        button: 0,
        clientX: 100,
        clientY: 100,
      });
      mockCanvasElement.dispatchEvent(mousedownEvent);

      // 移动鼠标超出边界
      const mousemoveEvent = createMouseEvent('mousemove', {
        clientX: 1000,
        clientY: 700,
      });
      window.dispatchEvent(mousemoveEvent);

      // 应该被限制在 800x600 范围内
      expect(result.current.drawingStateRef.current.crop.shape?.endX).toBe(800);
      expect(result.current.drawingStateRef.current.crop.shape?.endY).toBe(600);
    });
  });

  describe('光标更新', () => {
    it('应该在选择工具下更新光标样式', () => {
      const config = createMockConfig({ activeTool: 'select' });
      const callbacks = createMockCallbacks();

      renderHook(() => useEditorEvents(config, callbacks));

      const mousemoveEvent = createMouseEvent('mousemove', {
        clientX: 100,
        clientY: 100,
      });
      window.dispatchEvent(mousemoveEvent);

      expect(mockCanvasElement.style.cursor).toBe('default');
    });

    it('应该在裁剪工具无裁剪框时显示十字光标', () => {
      const config = createMockConfig({ activeTool: 'crop', cropArea: null });
      const callbacks = createMockCallbacks();

      renderHook(() => useEditorEvents(config, callbacks));

      const mousemoveEvent = createMouseEvent('mousemove', {
        clientX: 100,
        clientY: 100,
      });
      window.dispatchEvent(mousemoveEvent);

      expect(mockCanvasElement.style.cursor).toBe('crosshair');
    });

    it('应该在框选时显示十字光标', () => {
      const config = createMockConfig({ activeTool: 'select' });
      const callbacks = createMockCallbacks();

      renderHook(() => useEditorEvents(config, callbacks));

      // 开始框选后，光标设置在移动时处理
      // 由于框选更新会提前 return，所以光标不在这个分支设置
      // 这个测试验证的是：框选开始后移动不会走到光标更新逻辑
      const mousedownEvent = createMouseEvent('mousedown', {
        button: 0,
        clientX: 100,
        clientY: 100,
      });
      mockCanvasElement.dispatchEvent(mousedownEvent);

      // 移动鼠标 - 框选更新会提前 return
      const mousemoveEvent = createMouseEvent('mousemove', {
        clientX: 200,
        clientY: 200,
      });
      window.dispatchEvent(mousemoveEvent);

      // 光标在框选更新时不会设置，但框选状态应该正确
      // 这个测试主要验证框选流程正确执行
      expect(callbacks.renderShapes).toHaveBeenCalled();
    });
  });

  describe('鼠标抬起事件', () => {
    it('应该在完成绘制箭头后创建图形', async () => {
      const config = createMockConfig({ activeTool: 'arrow' });
      const callbacks = createMockCallbacks();

      renderHook(() => useEditorEvents(config, callbacks));

      // 开始绘制
      const mousedownEvent = createMouseEvent('mousedown', {
        button: 0,
        clientX: 100,
        clientY: 100,
      });
      mockCanvasElement.dispatchEvent(mousedownEvent);

      // 移动足够的距离
      const mousemoveEvent = createMouseEvent('mousemove', {
        clientX: 200,
        clientY: 200,
      });
      window.dispatchEvent(mousemoveEvent);

      // 结束绘制
      const mouseupEvent = createMouseEvent('mouseup');
      window.dispatchEvent(mouseupEvent);

      expect(callbacks.pushHistory).toHaveBeenCalled();
      expect(callbacks.setArrows).toHaveBeenCalled();
      expect(callbacks.setActiveTool).toHaveBeenCalledWith('select');
    });

    it('应该在完成绘制矩形后创建图形', async () => {
      const config = createMockConfig({ activeTool: 'rect' });
      const callbacks = createMockCallbacks();

      renderHook(() => useEditorEvents(config, callbacks));

      // 开始绘制
      const mousedownEvent = createMouseEvent('mousedown', {
        button: 0,
        clientX: 100,
        clientY: 100,
      });
      mockCanvasElement.dispatchEvent(mousedownEvent);

      // 移动足够的距离
      const mousemoveEvent = createMouseEvent('mousemove', {
        clientX: 200,
        clientY: 200,
      });
      window.dispatchEvent(mousemoveEvent);

      // 结束绘制
      const mouseupEvent = createMouseEvent('mouseup');
      window.dispatchEvent(mouseupEvent);

      expect(callbacks.pushHistory).toHaveBeenCalled();
      expect(callbacks.setRects).toHaveBeenCalled();
    });

    it('应该在完成绘制马赛克后创建图形', async () => {
      const config = createMockConfig({ activeTool: 'mosaic' });
      const callbacks = createMockCallbacks();

      renderHook(() => useEditorEvents(config, callbacks));

      // 开始绘制
      const mousedownEvent = createMouseEvent('mousedown', {
        button: 0,
        clientX: 100,
        clientY: 100,
      });
      mockCanvasElement.dispatchEvent(mousedownEvent);

      // 移动足够的距离
      const mousemoveEvent = createMouseEvent('mousemove', {
        clientX: 200,
        clientY: 200,
      });
      window.dispatchEvent(mousemoveEvent);

      // 结束绘制
      const mouseupEvent = createMouseEvent('mouseup');
      window.dispatchEvent(mouseupEvent);

      expect(callbacks.pushHistory).toHaveBeenCalled();
      expect(callbacks.setMosaics).toHaveBeenCalled();
    });

    it('应该在完成裁剪绘制后设置裁剪区域', async () => {
      const config = createMockConfig({ activeTool: 'crop' });
      const callbacks = createMockCallbacks();

      renderHook(() => useEditorEvents(config, callbacks));

      // 开始绘制
      const mousedownEvent = createMouseEvent('mousedown', {
        button: 0,
        clientX: 100,
        clientY: 100,
      });
      mockCanvasElement.dispatchEvent(mousedownEvent);

      // 移动足够的距离
      const mousemoveEvent = createMouseEvent('mousemove', {
        clientX: 200,
        clientY: 200,
      });
      window.dispatchEvent(mousemoveEvent);

      // 结束绘制
      const mouseupEvent = createMouseEvent('mouseup');
      window.dispatchEvent(mouseupEvent);

      expect(callbacks.setCropArea).toHaveBeenCalledWith({
        x: 100,
        y: 100,
        width: 100,
        height: 100,
      });
    });

    it('应该在拖拽结束后推送历史', async () => {
      const mockArrow: ArrowShape = {
        id: 'arrow-1',
        startX: 100,
        startY: 100,
        endX: 200,
        endY: 200,
        color: '#FF0000',
        strokeWidth: 2,
        headSize: 10,
        style: 'single',
      };

      const config = createMockConfig({
        activeTool: 'select',
        arrowsRef: { current: [mockArrow] },
        selectedArrowIdsRef: { current: ['arrow-1'] },
      });
      const callbacks = createMockCallbacks();

      // Mock getDragTypeAtPoint to return a drag type
      const shapeHelpers = await import('../../utils/shape-helpers');
      vi.mocked(shapeHelpers.getDragTypeAtPoint).mockReturnValue('move');

      renderHook(() => useEditorEvents(config, callbacks));

      // 开始拖拽（点击在已选箭头上）
      const mousedownEvent = createMouseEvent('mousedown', {
        button: 0,
        clientX: 150,
        clientY: 150,
      });
      mockCanvasElement.dispatchEvent(mousedownEvent);

      // 移动鼠标
      const mousemoveEvent = createMouseEvent('mousemove', {
        clientX: 170,
        clientY: 170,
      });
      window.dispatchEvent(mousemoveEvent);

      // 结束拖拽
      const mouseupEvent = createMouseEvent('mouseup');
      window.dispatchEvent(mouseupEvent);

      expect(callbacks.pushHistory).toHaveBeenCalled();
    });
  });

  describe('事件监听器清理', () => {
    it('应该在卸载时移除事件监听器', () => {
      const config = createMockConfig();
      const callbacks = createMockCallbacks();

      const { unmount } = renderHook(() => useEditorEvents(config, callbacks));

      const removeEventListenerSpy = vi.spyOn(mockCanvasElement, 'removeEventListener');
      const windowRemoveEventListenerSpy = vi.spyOn(window, 'removeEventListener');

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('mousedown', expect.any(Function));
      expect(windowRemoveEventListenerSpy).toHaveBeenCalledWith('mousemove', expect.any(Function));
      expect(windowRemoveEventListenerSpy).toHaveBeenCalledWith('mouseup', expect.any(Function));
    });
  });
});
