// useShapeDragging Hook 测试

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useShapeDragging } from '../useShapeDragging';

// Mock applyDragResize
vi.mock('../../utils/drag-resize', () => ({
  applyDragResize: vi.fn((shape, type, dx, dy, orig, minSize, bounds) => {
    // 简单模拟：移动时调整位置
    if (type === 'move') {
      return { ...shape, x: orig.x + dx, y: orig.y + dy };
    }
    // 调整大小时返回原始形状
    return shape;
  }),
}));

describe('useShapeDragging', () => {
  const mockCallbacks = {
    setArrows: vi.fn((updater) => updater([])),
    setRects: vi.fn((updater) => updater([])),
    setTexts: vi.fn((updater) => updater([])),
    setMosaics: vi.fn((updater) => updater([])),
    setCropArea: vi.fn(),
    pushHistory: vi.fn(),
    renderShapes: vi.fn(),
  };

  const mockConfig = {
    activeTool: 'select',
    imageNaturalSize: { width: 800, height: 600 },
    shapeMinSize: 5,
    minCropSize: 10,
  };

  const mockArrow = {
    id: 'arrow-1',
    startX: 100,
    startY: 100,
    endX: 200,
    endY: 200,
    color: '#EF4444',
    strokeWidth: 2,
    headSize: 12,
    style: 'single' as const,
  };

  const mockRect = {
    id: 'rect-1',
    x: 100,
    y: 100,
    width: 100,
    height: 80,
    color: '#EF4444',
    strokeWidth: 2,
    fillOpacity: 0,
    borderStyle: 'solid' as const,
  };

  const mockText = {
    id: 'text-1',
    x: 100,
    y: 100,
    width: 200,
    height: 30,
    text: 'Hello',
    color: '#EF4444',
    fontSize: 24,
    fontWeight: 'normal' as const,
    fontStyle: 'normal' as const,
  };

  const mockMosaic = {
    id: 'mosaic-1',
    x: 100,
    y: 100,
    width: 100,
    height: 80,
    blockSize: 10,
    opacity: 100,
  };

  const mockCrop = {
    x: 100,
    y: 100,
    width: 200,
    height: 150,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('应该返回拖拽状态和方法', () => {
    const { result } = renderHook(() =>
      useShapeDragging(mockConfig, mockCallbacks)
    );

    expect(result.current.draggingArrow).toBeDefined();
    expect(result.current.draggingRect).toBeDefined();
    expect(result.current.draggingText).toBeDefined();
    expect(result.current.draggingMosaic).toBeDefined();
    expect(result.current.draggingCrop).toBeDefined();
    expect(typeof result.current.startDragArrow).toBe('function');
    expect(typeof result.current.startDragRect).toBe('function');
    expect(typeof result.current.startDragText).toBe('function');
    expect(typeof result.current.startDragMosaic).toBe('function');
    expect(typeof result.current.startDragCrop).toBe('function');
    expect(typeof result.current.updateDrag).toBe('function');
    expect(typeof result.current.finishDrag).toBe('function');
  });

  describe('startDragArrow', () => {
    it('应该初始化箭头拖拽状态', () => {
      const { result } = renderHook(() =>
        useShapeDragging(mockConfig, mockCallbacks)
      );

      act(() => {
        result.current.startDragArrow('arrow-1', 'move', 150, 150, mockArrow);
      });

      expect(result.current.draggingArrow.current).toEqual({
        type: 'move',
        id: 'arrow-1',
        startX: 150,
        startY: 150,
        orig: { x: 100, y: 100, endX: 200, endY: 200 },
      });
    });
  });

  describe('startDragRect', () => {
    it('应该初始化矩形拖拽状态', () => {
      const { result } = renderHook(() =>
        useShapeDragging(mockConfig, mockCallbacks)
      );

      act(() => {
        result.current.startDragRect('rect-1', 'move', 150, 150, mockRect);
      });

      expect(result.current.draggingRect.current).toEqual({
        type: 'move',
        id: 'rect-1',
        startX: 150,
        startY: 150,
        orig: { x: 100, y: 100, width: 100, height: 80 },
      });
    });
  });

  describe('startDragText', () => {
    it('应该初始化文字拖拽状态', () => {
      const { result } = renderHook(() =>
        useShapeDragging(mockConfig, mockCallbacks)
      );

      act(() => {
        result.current.startDragText('text-1', 'move', 150, 150, mockText);
      });

      expect(result.current.draggingText.current).toEqual({
        type: 'move',
        id: 'text-1',
        startX: 150,
        startY: 150,
        orig: { x: 100, y: 100, fontSize: 24 },
      });
    });
  });

  describe('startDragMosaic', () => {
    it('应该初始化马赛克拖拽状态', () => {
      const { result } = renderHook(() =>
        useShapeDragging(mockConfig, mockCallbacks)
      );

      act(() => {
        result.current.startDragMosaic('mosaic-1', 'move', 150, 150, mockMosaic);
      });

      expect(result.current.draggingMosaic.current).toEqual({
        type: 'move',
        id: 'mosaic-1',
        startX: 150,
        startY: 150,
        orig: { x: 100, y: 100, width: 100, height: 80 },
      });
    });
  });

  describe('startDragCrop', () => {
    it('应该初始化裁剪框拖拽状态', () => {
      const { result } = renderHook(() =>
        useShapeDragging(mockConfig, mockCallbacks)
      );

      act(() => {
        result.current.startDragCrop('move', 150, 150, mockCrop);
      });

      expect(result.current.draggingCrop.current).toEqual({
        type: 'move',
        startX: 150,
        startY: 150,
        orig: { x: 100, y: 100, width: 200, height: 150 },
      });
    });
  });

  describe('updateDrag', () => {
    it('应该更新矩形位置', async () => {
      const { result } = renderHook(() =>
        useShapeDragging(mockConfig, mockCallbacks)
      );

      act(() => {
        result.current.startDragRect('rect-1', 'move', 150, 150, mockRect);
      });

      act(() => {
        result.current.updateDrag(20, 30);
      });

      expect(mockCallbacks.setRects).toHaveBeenCalled();
      expect(mockCallbacks.renderShapes).toHaveBeenCalled();
    });

    it('应该更新箭头位置（move 类型）', () => {
      const { result } = renderHook(() =>
        useShapeDragging(mockConfig, mockCallbacks)
      );

      act(() => {
        result.current.startDragArrow('arrow-1', 'move', 150, 150, mockArrow);
      });

      act(() => {
        result.current.updateDrag(20, 30);
      });

      expect(mockCallbacks.setArrows).toHaveBeenCalled();
      expect(mockCallbacks.renderShapes).toHaveBeenCalled();
    });

    it('应该更新箭头起点（start 类型）', () => {
      const { result } = renderHook(() =>
        useShapeDragging(mockConfig, mockCallbacks)
      );

      act(() => {
        result.current.startDragArrow('arrow-1', 'start', 100, 100, mockArrow);
      });

      act(() => {
        result.current.updateDrag(20, 30);
      });

      expect(mockCallbacks.setArrows).toHaveBeenCalled();
    });

    it('应该更新箭头终点（end 类型）', () => {
      const { result } = renderHook(() =>
        useShapeDragging(mockConfig, mockCallbacks)
      );

      act(() => {
        result.current.startDragArrow('arrow-1', 'end', 200, 200, mockArrow);
      });

      act(() => {
        result.current.updateDrag(20, 30);
      });

      expect(mockCallbacks.setArrows).toHaveBeenCalled();
    });

    it('应该更新文字位置（move 类型）', () => {
      const { result } = renderHook(() =>
        useShapeDragging(mockConfig, mockCallbacks)
      );

      act(() => {
        result.current.startDragText('text-1', 'move', 150, 150, mockText);
      });

      act(() => {
        result.current.updateDrag(20, 30);
      });

      expect(mockCallbacks.setTexts).toHaveBeenCalled();
      expect(mockCallbacks.renderShapes).toHaveBeenCalled();
    });

    it('应该更新文字大小（resize-br 类型）', () => {
      const { result } = renderHook(() =>
        useShapeDragging(mockConfig, mockCallbacks)
      );

      act(() => {
        result.current.startDragText('text-1', 'resize-br', 150, 150, mockText);
      });

      act(() => {
        result.current.updateDrag(20, 30);
      });

      expect(mockCallbacks.setTexts).toHaveBeenCalled();
    });

    it('应该更新马赛克位置', () => {
      const { result } = renderHook(() =>
        useShapeDragging(mockConfig, mockCallbacks)
      );

      act(() => {
        result.current.startDragMosaic('mosaic-1', 'move', 150, 150, mockMosaic);
      });

      act(() => {
        result.current.updateDrag(20, 30);
      });

      expect(mockCallbacks.setMosaics).toHaveBeenCalled();
      expect(mockCallbacks.renderShapes).toHaveBeenCalled();
    });

    it('应该更新裁剪框位置', () => {
      const cropConfig = { ...mockConfig, activeTool: 'crop' };
      const { result } = renderHook(() =>
        useShapeDragging(cropConfig, mockCallbacks)
      );

      act(() => {
        result.current.startDragCrop('move', 150, 150, mockCrop);
      });

      act(() => {
        result.current.updateDrag(20, 30);
      });

      expect(mockCallbacks.setCropArea).toHaveBeenCalled();
      expect(mockCallbacks.renderShapes).toHaveBeenCalled();
    });

    it('在非 select 工具时不应更新矩形拖拽', () => {
      const nonSelectConfig = { ...mockConfig, activeTool: 'arrow' };
      const { result } = renderHook(() =>
        useShapeDragging(nonSelectConfig, mockCallbacks)
      );

      act(() => {
        result.current.startDragRect('rect-1', 'move', 150, 150, mockRect);
      });

      act(() => {
        result.current.updateDrag(20, 30);
      });

      // 矩形拖拽需要 select 工具
      expect(mockCallbacks.setRects).not.toHaveBeenCalled();
    });
  });

  describe('finishDrag', () => {
    it('应该在有拖拽时推送历史', () => {
      const { result } = renderHook(() =>
        useShapeDragging(mockConfig, mockCallbacks)
      );

      act(() => {
        result.current.startDragRect('rect-1', 'move', 150, 150, mockRect);
        result.current.finishDrag();
      });

      expect(mockCallbacks.pushHistory).toHaveBeenCalled();
    });

    it('应该在没有拖拽时不推送历史', () => {
      const { result } = renderHook(() =>
        useShapeDragging(mockConfig, mockCallbacks)
      );

      act(() => {
        result.current.finishDrag();
      });

      expect(mockCallbacks.pushHistory).not.toHaveBeenCalled();
    });

    it('应该重置所有拖拽状态', () => {
      const { result } = renderHook(() =>
        useShapeDragging(mockConfig, mockCallbacks)
      );

      act(() => {
        result.current.startDragRect('rect-1', 'move', 150, 150, mockRect);
      });

      expect(result.current.draggingRect.current).not.toBeNull();

      act(() => {
        result.current.finishDrag();
      });

      expect(result.current.draggingArrow.current).toBeNull();
      expect(result.current.draggingRect.current).toBeNull();
      expect(result.current.draggingText.current).toBeNull();
      expect(result.current.draggingMosaic.current).toBeNull();
      expect(result.current.draggingCrop.current).toBeNull();
    });
  });
});
