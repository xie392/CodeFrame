// useEditorEvents Hook 测试 - 基础测试

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useEditorEvents } from '../useEditorEvents';

// Mock dependencies
vi.mock('../../utils/shape-helpers', () => ({
  isPointNearArrow: vi.fn(() => false),
  isPointInRect: vi.fn(() => false),
  isPointInText: vi.fn(() => false),
  isPointInMosaic: vi.fn(() => false),
  getDragTypeAtPoint: vi.fn(() => null),
  getRectDragTypeAtPoint: vi.fn(() => null),
  getTextDragTypeAtPoint: vi.fn(() => null),
  getMosaicDragTypeAtPoint: vi.fn(() => null),
  getCropDragTypeAtPoint: vi.fn(() => null),
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

describe('useEditorEvents', () => {
  const mockCanvasRef = { current: document.createElement('div') };
  const mockAnnotationCanvasRef = { current: document.createElement('canvas') };

  const mockConfig = {
    canvasRef: mockCanvasRef,
    annotationCanvasRef: mockAnnotationCanvasRef,
    activeTool: 'select',
    imageData: 'test-image',
    editingTextId: null,
    cropArea: null,
    imageNaturalSize: { width: 800, height: 600 },
    imageDisplaySize: { width: 400, height: 300 },
    frameSettings: { background: { color: '#FFFFFF' } },
    arrowsRef: { current: [] },
    rectsRef: { current: [] },
    textsRef: { current: [] },
    mosaicsRef: { current: [] },
    selectedArrowIdsRef: { current: [] },
    selectedRectIdsRef: { current: [] },
    selectedTextIdsRef: { current: [] },
    selectedMosaicIdsRef: { current: [] },
    cropAreaRef: { current: null },
    imageNaturalSizeRef: { current: { width: 800, height: 600 } },
  };

  const mockCallbacks = {
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
    setEditingTextId: vi.fn(),
    setEditingTextValue: vi.fn(),
    defaultArrowStyle: { current: { color: '#EF4444', strokeWidth: 2, headSize: 12, style: 'single' } },
    defaultRectStyle: { current: { color: '#EF4444', strokeWidth: 2, fillOpacity: 0, borderStyle: 'solid' } },
    defaultMosaicStyle: { current: { blockSize: 10, opacity: 100 } },
  };

  const mockHandlers = {
    startDragArrow: vi.fn(),
    startDragRect: vi.fn(),
    startDragText: vi.fn(),
    startDragMosaic: vi.fn(),
    startDragCrop: vi.fn(),
    updateDrag: vi.fn(),
    finishDrag: vi.fn(),
    startMarquee: vi.fn(),
    updateMarquee: vi.fn(),
    finishMarquee: vi.fn(),
    cancelMarquee: vi.fn(),
    startDrawing: vi.fn(),
    updateDrawing: vi.fn(),
    finishDrawing: vi.fn(),
    startEditing: vi.fn(),
    stopEditing: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('应该正常渲染', () => {
    expect(() => {
      renderHook(() =>
        useEditorEvents(mockConfig as any, mockCallbacks as any, mockHandlers as any)
      );
    }).not.toThrow();
  });

  it('应该在 imageData 为 null 时不设置事件监听', () => {
    const configWithoutImage = {
      ...mockConfig,
      imageData: null,
    };

    const { unmount } = renderHook(() =>
      useEditorEvents(configWithoutImage as any, mockCallbacks as any, mockHandlers as any)
    );

    unmount();
    expect(mockCallbacks.renderShapes).not.toHaveBeenCalled();
  });

  it('应该返回 drawingStateRef, dragStateRef, marqueeStateRef', () => {
    const { result } = renderHook(() =>
      useEditorEvents(mockConfig as any, mockCallbacks as any, mockHandlers as any)
    );

    expect(result.current.drawingStateRef).toBeDefined();
    expect(result.current.dragStateRef).toBeDefined();
    expect(result.current.marqueeStateRef).toBeDefined();
  });
});
