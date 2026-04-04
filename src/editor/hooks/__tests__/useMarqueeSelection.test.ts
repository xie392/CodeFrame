// useMarqueeSelection Hook 测试

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMarqueeSelection } from '../useMarqueeSelection';
import type { ArrowShape, RectShape, TextShape, MosaicShape } from '../../types';

// Mock shape-helpers
vi.mock('../../utils/shape-helpers', () => ({
  isArrowInRect: vi.fn((arrow, rect) => {
    // 简单实现：检查箭头中心点是否在框选范围内
    const minX = Math.min(rect.x1, rect.x2);
    const maxX = Math.max(rect.x1, rect.x2);
    const minY = Math.min(rect.y1, rect.y2);
    const maxY = Math.max(rect.y1, rect.y2);
    const centerX = (arrow.startX + arrow.endX) / 2;
    const centerY = (arrow.startY + arrow.endY) / 2;
    return centerX >= minX && centerX <= maxX && centerY >= minY && centerY <= maxY;
  }),
  isRectInRect: vi.fn((rectItem, rect) => {
    const minX = Math.min(rect.x1, rect.x2);
    const maxX = Math.max(rect.x1, rect.x2);
    const minY = Math.min(rect.y1, rect.y2);
    const maxY = Math.max(rect.y1, rect.y2);
    return rectItem.x >= minX && rectItem.x <= maxX && rectItem.y >= minY && rectItem.y <= maxY;
  }),
  isTextInRect: vi.fn((text, rect) => {
    const minX = Math.min(rect.x1, rect.x2);
    const maxX = Math.max(rect.x1, rect.x2);
    const minY = Math.min(rect.y1, rect.y2);
    const maxY = Math.max(rect.y1, rect.y2);
    return text.x >= minX && text.x <= maxX && text.y >= minY && text.y <= maxY;
  }),
  isMosaicInRect: vi.fn((mosaic, rect) => {
    const minX = Math.min(rect.x1, rect.x2);
    const maxX = Math.max(rect.x1, rect.x2);
    const minY = Math.min(rect.y1, rect.y2);
    const maxY = Math.max(rect.y1, rect.y2);
    return mosaic.x >= minX && mosaic.x <= maxX && mosaic.y >= minY && mosaic.y <= maxY;
  }),
}));

describe('useMarqueeSelection', () => {
  const mockCallbacks = {
    setSelectedArrowIds: vi.fn(),
    setSelectedRectIds: vi.fn(),
    setSelectedTextIds: vi.fn(),
    setSelectedMosaicIds: vi.fn(),
    renderShapes: vi.fn(),
  };

  const mockArrow: ArrowShape = {
    id: 'arrow-1',
    startX: 50,
    startY: 50,
    endX: 100,
    endY: 100,
    color: '#EF4444',
    strokeWidth: 2,
    headSize: 12,
    style: 'single',
  };

  const mockRect: RectShape = {
    id: 'rect-1',
    x: 100,
    y: 100,
    width: 50,
    height: 50,
    color: '#EF4444',
    strokeWidth: 2,
    fillOpacity: 0,
    borderStyle: 'solid',
  };

  const mockText: TextShape = {
    id: 'text-1',
    x: 150,
    y: 150,
    text: 'test',
    color: '#EF4444',
    fontSize: 16,
    fontWeight: 'normal',
    fontStyle: 'normal',
  };

  const mockMosaic: MosaicShape = {
    id: 'mosaic-1',
    x: 200,
    y: 200,
    width: 50,
    height: 50,
    blockSize: 10,
    opacity: 100,
  };

  const mockConfig = {
    arrowsRef: { current: [mockArrow] },
    rectsRef: { current: [mockRect] },
    textsRef: { current: [mockText] },
    mosaicsRef: { current: [mockMosaic] },
    canvasCtx: {} as CanvasRenderingContext2D,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('应该返回框选状态和函数', () => {
    const { result } = renderHook(() =>
      useMarqueeSelection(mockConfig, mockCallbacks)
    );

    expect(result.current.isMarqueeSelecting).toBeDefined();
    expect(result.current.marqueeStart).toBeDefined();
    expect(result.current.marqueeEnd).toBeDefined();
    expect(typeof result.current.startMarquee).toBe('function');
    expect(typeof result.current.updateMarquee).toBe('function');
    expect(typeof result.current.finishMarquee).toBe('function');
    expect(typeof result.current.cancelMarquee).toBe('function');
  });

  it('startMarquee 应该初始化框选状态', () => {
    const { result } = renderHook(() =>
      useMarqueeSelection(mockConfig, mockCallbacks)
    );

    act(() => {
      result.current.startMarquee(100, 100);
    });

    expect(result.current.isMarqueeSelecting.current).toBe(true);
    expect(result.current.marqueeStart.current).toEqual({ x: 100, y: 100 });
    expect(result.current.marqueeEnd.current).toEqual({ x: 100, y: 100 });
  });

  it('updateMarquee 应该更新框选终点', () => {
    const { result } = renderHook(() =>
      useMarqueeSelection(mockConfig, mockCallbacks)
    );

    act(() => {
      result.current.startMarquee(100, 100);
      result.current.updateMarquee(200, 200);
    });

    expect(result.current.marqueeEnd.current).toEqual({ x: 200, y: 200 });
    expect(mockCallbacks.renderShapes).toHaveBeenCalled();
  });

  it('updateMarquee 在未开始框选时不应更新', () => {
    const { result } = renderHook(() =>
      useMarqueeSelection(mockConfig, mockCallbacks)
    );

    act(() => {
      result.current.updateMarquee(200, 200);
    });

    expect(result.current.marqueeEnd.current).toBeNull();
  });

  it('finishMarquee 应该选择框选范围内的图形', async () => {
    const { result } = renderHook(() =>
      useMarqueeSelection(mockConfig, mockCallbacks)
    );

    act(() => {
      result.current.startMarquee(0, 0);
      result.current.updateMarquee(300, 300);
    });

    act(() => {
      result.current.finishMarquee(false);
    });

    expect(mockCallbacks.setSelectedArrowIds).toHaveBeenCalledWith(['arrow-1']);
    expect(mockCallbacks.setSelectedRectIds).toHaveBeenCalledWith(['rect-1']);
    expect(mockCallbacks.setSelectedTextIds).toHaveBeenCalledWith(['text-1']);
    expect(mockCallbacks.setSelectedMosaicIds).toHaveBeenCalledWith(['mosaic-1']);
  });

  it('finishMarquee 使用 shiftKey 应该追加选择', async () => {
    const { result } = renderHook(() =>
      useMarqueeSelection(mockConfig, mockCallbacks)
    );

    act(() => {
      result.current.startMarquee(0, 0);
      result.current.updateMarquee(300, 300);
    });

    act(() => {
      result.current.finishMarquee(true);
    });

    // 应该使用函数更新方式
    expect(mockCallbacks.setSelectedArrowIds).toHaveBeenCalledWith(expect.any(Function));
  });

  it('finishMarquee 应该在框选范围过小时取消选择', () => {
    const { result } = renderHook(() =>
      useMarqueeSelection(mockConfig, mockCallbacks)
    );

    act(() => {
      result.current.startMarquee(100, 100);
      result.current.updateMarquee(102, 102); // 小于 SELECT_MIN_SIZE (5)
    });

    act(() => {
      result.current.finishMarquee(false);
    });

    expect(mockCallbacks.setSelectedArrowIds).toHaveBeenCalledWith([]);
    expect(mockCallbacks.setSelectedRectIds).toHaveBeenCalledWith([]);
    expect(mockCallbacks.setSelectedTextIds).toHaveBeenCalledWith([]);
    expect(mockCallbacks.setSelectedMosaicIds).toHaveBeenCalledWith([]);
  });

  it('finishMarquee 应该在没有框选起点时返回', () => {
    const { result } = renderHook(() =>
      useMarqueeSelection(mockConfig, mockCallbacks)
    );

    act(() => {
      result.current.finishMarquee(false);
    });

    expect(result.current.isMarqueeSelecting.current).toBe(false);
  });

  it('cancelMarquee 应该重置框选状态', () => {
    const { result } = renderHook(() =>
      useMarqueeSelection(mockConfig, mockCallbacks)
    );

    act(() => {
      result.current.startMarquee(100, 100);
      result.current.cancelMarquee();
    });

    expect(result.current.isMarqueeSelecting.current).toBe(false);
    expect(result.current.marqueeStart.current).toBeNull();
    expect(result.current.marqueeEnd.current).toBeNull();
    expect(mockCallbacks.renderShapes).toHaveBeenCalled();
  });

  it('finishMarquee 应该重置框选状态', () => {
    const { result } = renderHook(() =>
      useMarqueeSelection(mockConfig, mockCallbacks)
    );

    act(() => {
      result.current.startMarquee(0, 0);
      result.current.updateMarquee(300, 300);
    });

    act(() => {
      result.current.finishMarquee(false);
    });

    expect(result.current.isMarqueeSelecting.current).toBe(false);
    expect(result.current.marqueeStart.current).toBeNull();
    expect(result.current.marqueeEnd.current).toBeNull();
  });

  it('在没有 canvasCtx 时应该跳过文字选择', () => {
    const configWithoutCtx = {
      ...mockConfig,
      canvasCtx: null,
    };

    const { result } = renderHook(() =>
      useMarqueeSelection(configWithoutCtx, mockCallbacks)
    );

    act(() => {
      result.current.startMarquee(0, 0);
      result.current.updateMarquee(300, 300);
    });

    act(() => {
      result.current.finishMarquee(false);
    });

    // 箭头和矩形应该被选择，但文字不应被选择
    expect(mockCallbacks.setSelectedArrowIds).toHaveBeenCalledWith(['arrow-1']);
    expect(mockCallbacks.setSelectedRectIds).toHaveBeenCalledWith(['rect-1']);
    // 文字应该为空（因为没有 canvasCtx）
    expect(mockCallbacks.setSelectedTextIds).toHaveBeenCalledWith([]);
  });
});
