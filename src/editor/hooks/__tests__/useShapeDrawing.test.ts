// useShapeDrawing Hook 测试

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useShapeDrawing } from '../useShapeDrawing';

describe('useShapeDrawing', () => {
  const mockCallbacks = {
    setArrows: vi.fn((updater) => updater([])),
    setRects: vi.fn((updater) => updater([])),
    setMosaics: vi.fn((updater) => updater([])),
    setCropArea: vi.fn(),
    setSelectedArrowIds: vi.fn(),
    setSelectedRectIds: vi.fn(),
    setSelectedMosaicIds: vi.fn(),
    setActiveTool: vi.fn(),
    pushHistory: vi.fn(),
    renderShapes: vi.fn(),
  };

  const mockDefaultStyles = {
    arrowStyle: {
      current: {
        color: '#EF4444',
        strokeWidth: 2,
        headSize: 12,
        style: 'single' as const,
      },
    },
    rectStyle: {
      current: {
        color: '#EF4444',
        strokeWidth: 2,
        fillOpacity: 0,
        borderStyle: 'solid' as const,
      },
    },
    mosaicStyle: {
      current: {
        blockSize: 10,
        opacity: 100,
      },
    },
  };

  const mockIdGenerators = {
    generateArrowId: vi.fn().mockReturnValue('arrow-1'),
    generateRectId: vi.fn().mockReturnValue('rect-1'),
    generateMosaicId: vi.fn().mockReturnValue('mosaic-1'),
  };

  const mockConfig = {
    imageNaturalSize: { width: 800, height: 600 },
    minCropSize: 10,
    drawMinDistance: 5,
    shapeMinSize: 5,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('应该返回绘制状态和方法', () => {
    const { result } = renderHook(() =>
      useShapeDrawing(mockConfig, mockCallbacks, mockDefaultStyles, mockIdGenerators)
    );

    expect(result.current.drawingArrow).toBeDefined();
    expect(result.current.drawingRect).toBeDefined();
    expect(result.current.drawingMosaic).toBeDefined();
    expect(result.current.drawingCrop).toBeDefined();
    expect(typeof result.current.startDrawing).toBe('function');
    expect(typeof result.current.updateDrawing).toBe('function');
    expect(typeof result.current.finishDrawing).toBe('function');
  });

  describe('startDrawing', () => {
    it('应该初始化箭头绘制状态', () => {
      const { result } = renderHook(() =>
        useShapeDrawing(mockConfig, mockCallbacks, mockDefaultStyles, mockIdGenerators)
      );

      act(() => {
        result.current.startDrawing('arrow', 100, 100);
      });

      expect(result.current.drawingArrow.current.isDrawing).toBe(true);
      expect(result.current.drawingArrow.current.shape).toEqual({
        startX: 100,
        startY: 100,
        endX: 100,
        endY: 100,
      });
    });

    it('应该初始化矩形绘制状态', () => {
      const { result } = renderHook(() =>
        useShapeDrawing(mockConfig, mockCallbacks, mockDefaultStyles, mockIdGenerators)
      );

      act(() => {
        result.current.startDrawing('rect', 100, 100);
      });

      expect(result.current.drawingRect.current.isDrawing).toBe(true);
      expect(result.current.drawingRect.current.shape).toEqual({
        startX: 100,
        startY: 100,
        endX: 100,
        endY: 100,
      });
    });

    it('应该初始化马赛克绘制状态', () => {
      const { result } = renderHook(() =>
        useShapeDrawing(mockConfig, mockCallbacks, mockDefaultStyles, mockIdGenerators)
      );

      act(() => {
        result.current.startDrawing('mosaic', 100, 100);
      });

      expect(result.current.drawingMosaic.current.isDrawing).toBe(true);
      expect(result.current.drawingMosaic.current.shape).toEqual({
        startX: 100,
        startY: 100,
        endX: 100,
        endY: 100,
      });
    });

    it('应该初始化裁剪绘制状态', () => {
      const { result } = renderHook(() =>
        useShapeDrawing(mockConfig, mockCallbacks, mockDefaultStyles, mockIdGenerators)
      );

      act(() => {
        result.current.startDrawing('crop', 100, 100);
      });

      expect(result.current.drawingCrop.current.isDrawing).toBe(true);
      expect(result.current.drawingCrop.current.shape).toEqual({
        startX: 100,
        startY: 100,
        endX: 100,
        endY: 100,
      });
      expect(mockCallbacks.setCropArea).toHaveBeenCalledWith(null);
    });
  });

  describe('updateDrawing', () => {
    it('应该更新箭头绘制终点', () => {
      const { result } = renderHook(() =>
        useShapeDrawing(mockConfig, mockCallbacks, mockDefaultStyles, mockIdGenerators)
      );

      act(() => {
        result.current.startDrawing('arrow', 100, 100);
        result.current.updateDrawing('arrow', 200, 200);
      });

      expect(result.current.drawingArrow.current.shape?.endX).toBe(200);
      expect(result.current.drawingArrow.current.shape?.endY).toBe(200);
      expect(mockCallbacks.renderShapes).toHaveBeenCalled();
    });

    it('应该更新矩形绘制终点', () => {
      const { result } = renderHook(() =>
        useShapeDrawing(mockConfig, mockCallbacks, mockDefaultStyles, mockIdGenerators)
      );

      act(() => {
        result.current.startDrawing('rect', 100, 100);
        result.current.updateDrawing('rect', 200, 200);
      });

      expect(result.current.drawingRect.current.shape?.endX).toBe(200);
      expect(result.current.drawingRect.current.shape?.endY).toBe(200);
    });

    it('应该限制裁剪终点在图片范围内', () => {
      const { result } = renderHook(() =>
        useShapeDrawing(mockConfig, mockCallbacks, mockDefaultStyles, mockIdGenerators)
      );

      act(() => {
        result.current.startDrawing('crop', 100, 100);
        result.current.updateDrawing('crop', 1000, 700);
      });

      expect(result.current.drawingCrop.current.shape?.endX).toBe(800);
      expect(result.current.drawingCrop.current.shape?.endY).toBe(600);
    });

    it('应该限制裁剪终点不小于 0', () => {
      const { result } = renderHook(() =>
        useShapeDrawing(mockConfig, mockCallbacks, mockDefaultStyles, mockIdGenerators)
      );

      act(() => {
        result.current.startDrawing('crop', 100, 100);
        result.current.updateDrawing('crop', -50, -50);
      });

      expect(result.current.drawingCrop.current.shape?.endX).toBe(0);
      expect(result.current.drawingCrop.current.shape?.endY).toBe(0);
    });
  });

  describe('finishDrawing', () => {
    it('应该创建箭头图形', () => {
      const { result } = renderHook(() =>
        useShapeDrawing(mockConfig, mockCallbacks, mockDefaultStyles, mockIdGenerators)
      );

      act(() => {
        result.current.startDrawing('arrow', 100, 100);
        result.current.updateDrawing('arrow', 200, 200);
        result.current.finishDrawing('arrow');
      });

      expect(mockCallbacks.pushHistory).toHaveBeenCalled();
      expect(mockCallbacks.setArrows).toHaveBeenCalled();
      expect(mockCallbacks.setSelectedArrowIds).toHaveBeenCalledWith(['arrow-1']);
      expect(mockCallbacks.setActiveTool).toHaveBeenCalledWith('select');
    });

    it('应该在箭头距离过小时不创建', () => {
      const { result } = renderHook(() =>
        useShapeDrawing(mockConfig, mockCallbacks, mockDefaultStyles, mockIdGenerators)
      );

      act(() => {
        result.current.startDrawing('arrow', 100, 100);
        result.current.updateDrawing('arrow', 102, 102); // 距离 < drawMinDistance
        result.current.finishDrawing('arrow');
      });

      expect(mockCallbacks.pushHistory).not.toHaveBeenCalled();
    });

    it('应该创建矩形图形', () => {
      const { result } = renderHook(() =>
        useShapeDrawing(mockConfig, mockCallbacks, mockDefaultStyles, mockIdGenerators)
      );

      act(() => {
        result.current.startDrawing('rect', 100, 100);
        result.current.updateDrawing('rect', 200, 200);
        result.current.finishDrawing('rect');
      });

      expect(mockCallbacks.pushHistory).toHaveBeenCalled();
      expect(mockCallbacks.setRects).toHaveBeenCalled();
      expect(mockCallbacks.setSelectedRectIds).toHaveBeenCalledWith(['rect-1']);
    });

    it('应该在矩形尺寸过小时不创建', () => {
      const { result } = renderHook(() =>
        useShapeDrawing(mockConfig, mockCallbacks, mockDefaultStyles, mockIdGenerators)
      );

      act(() => {
        result.current.startDrawing('rect', 100, 100);
        result.current.updateDrawing('rect', 103, 103); // 尺寸 < shapeMinSize
        result.current.finishDrawing('rect');
      });

      expect(mockCallbacks.pushHistory).not.toHaveBeenCalled();
    });

    it('应该创建马赛克图形', () => {
      const { result } = renderHook(() =>
        useShapeDrawing(mockConfig, mockCallbacks, mockDefaultStyles, mockIdGenerators)
      );

      act(() => {
        result.current.startDrawing('mosaic', 100, 100);
        result.current.updateDrawing('mosaic', 200, 200);
        result.current.finishDrawing('mosaic');
      });

      expect(mockCallbacks.pushHistory).toHaveBeenCalled();
      expect(mockCallbacks.setMosaics).toHaveBeenCalled();
      expect(mockCallbacks.setSelectedMosaicIds).toHaveBeenCalledWith(['mosaic-1']);
    });

    it('应该创建裁剪区域', () => {
      const { result } = renderHook(() =>
        useShapeDrawing(mockConfig, mockCallbacks, mockDefaultStyles, mockIdGenerators)
      );

      act(() => {
        result.current.startDrawing('crop', 100, 100);
        result.current.updateDrawing('crop', 200, 200);
        result.current.finishDrawing('crop');
      });

      expect(mockCallbacks.setCropArea).toHaveBeenCalledWith({
        x: 100,
        y: 100,
        width: 100,
        height: 100,
      });
    });

    it('应该在裁剪区域过小时不创建有效区域', () => {
      vi.clearAllMocks(); // 清除之前的调用

      const { result } = renderHook(() =>
        useShapeDrawing(mockConfig, mockCallbacks, mockDefaultStyles, mockIdGenerators)
      );

      act(() => {
        result.current.startDrawing('crop', 100, 100);
        result.current.updateDrawing('crop', 105, 105); // 尺寸 < minCropSize
        result.current.finishDrawing('crop');
      });

      // setCropArea 应该只被调用一次（startDrawing 时的 null）
      // 不应该在 finishDrawing 时再次调用设置有效区域
      const calls = mockCallbacks.setCropArea.mock.calls;
      const validCropCalls = calls.filter(call => call[0] !== null);
      expect(validCropCalls).toHaveLength(0);
    });

    it('完成绘制后应该重置绘制状态', () => {
      const { result } = renderHook(() =>
        useShapeDrawing(mockConfig, mockCallbacks, mockDefaultStyles, mockIdGenerators)
      );

      act(() => {
        result.current.startDrawing('arrow', 100, 100);
        result.current.updateDrawing('arrow', 200, 200);
        result.current.finishDrawing('arrow');
      });

      expect(result.current.drawingArrow.current.isDrawing).toBe(false);
      expect(result.current.drawingArrow.current.shape).toBeNull();
    });
  });

  it('没有绘制形状时 finishDrawing 应该安全处理', () => {
    const { result } = renderHook(() =>
      useShapeDrawing(mockConfig, mockCallbacks, mockDefaultStyles, mockIdGenerators)
    );

    expect(() => {
      act(() => {
        result.current.finishDrawing('arrow');
      });
    }).not.toThrow();
  });
});
