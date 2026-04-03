// useZoomPan Hook 测试

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useZoomPan } from '../useZoomPan';

// Mock DOM 元素
const createMockContainer = () => {
  const container = document.createElement('div');
  container.getBoundingClientRect = () => ({
    width: 800,
    height: 600,
    top: 0,
    left: 0,
    right: 800,
    bottom: 600,
    x: 0,
    y: 0,
    toJSON: () => '{}',
  });
  return container;
};

describe('useZoomPan', () => {
  let mockContainer: HTMLDivElement;
  const mockContainerRef = { current: null as HTMLDivElement | null };

  beforeEach(() => {
    mockContainer = createMockContainer();
    mockContainerRef.current = mockContainer;
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('应该返回初始缩放和平移值', () => {
    const { result } = renderHook(() =>
      useZoomPan({
        containerRef: mockContainerRef,
        activeTool: 'select',
        imageData: 'test-image',
      })
    );

    expect(result.current.scale).toBe(1);
    expect(result.current.offset).toEqual({ x: 0, y: 0 });
    expect(result.current.zoomPercent).toBe(100);
  });

  it('应该返回 scaleRef 和 offsetRef', () => {
    const { result } = renderHook(() =>
      useZoomPan({
        containerRef: mockContainerRef,
        activeTool: 'select',
        imageData: 'test-image',
      })
    );

    expect(result.current.scaleRef.current).toBe(1);
    expect(result.current.offsetRef.current).toEqual({ x: 0, y: 0 });
  });

  it('setScale 应该更新缩放值', () => {
    const { result } = renderHook(() =>
      useZoomPan({
        containerRef: mockContainerRef,
        activeTool: 'select',
        imageData: 'test-image',
      })
    );

    act(() => {
      result.current.setScale(2);
    });

    expect(result.current.scale).toBe(2);
    expect(result.current.scaleRef.current).toBe(2);
    expect(result.current.zoomPercent).toBe(200);
  });

  it('setOffset 应该更新偏移值', () => {
    const { result } = renderHook(() =>
      useZoomPan({
        containerRef: mockContainerRef,
        activeTool: 'select',
        imageData: 'test-image',
      })
    );

    act(() => {
      result.current.setOffset({ x: 100, y: 50 });
    });

    expect(result.current.offset).toEqual({ x: 100, y: 50 });
    expect(result.current.offsetRef.current).toEqual({ x: 100, y: 50 });
  });

  it('zoomAt 应该在范围内限制缩放值', () => {
    const { result } = renderHook(() =>
      useZoomPan({
        containerRef: mockContainerRef,
        activeTool: 'select',
        imageData: 'test-image',
      })
    );

    // 测试最小缩放限制
    act(() => {
      result.current.zoomAt(0.1, 400, 300);
    });
    expect(result.current.scale).toBe(0.25); // MIN_SCALE

    // 测试最大缩放限制
    act(() => {
      result.current.zoomAt(10, 400, 300);
    });
    expect(result.current.scale).toBe(4); // MAX_SCALE
  });

  it('zoomAt 应该正确计算偏移', () => {
    const { result } = renderHook(() =>
      useZoomPan({
        containerRef: mockContainerRef,
        activeTool: 'select',
        imageData: 'test-image',
      })
    );

    act(() => {
      result.current.zoomAt(2, 400, 300);
    });

    expect(result.current.scale).toBe(2);
    // 偏移计算: anchorX * (1 - ratio) + old.x * ratio
    // 400 * (1 - 2) + 0 * 2 = -400
    // 300 * (1 - 2) + 0 * 2 = -300
    expect(result.current.offset.x).toBe(-400);
    expect(result.current.offset.y).toBe(-300);
  });

  it('resetView 应该重置缩放和偏移', () => {
    const { result } = renderHook(() =>
      useZoomPan({
        containerRef: mockContainerRef,
        activeTool: 'select',
        imageData: 'test-image',
      })
    );

    // 先设置一些值
    act(() => {
      result.current.setScale(2);
      result.current.setOffset({ x: 100, y: 50 });
    });

    expect(result.current.scale).toBe(2);
    expect(result.current.offset).toEqual({ x: 100, y: 50 });

    // 重置
    act(() => {
      result.current.resetView();
    });

    expect(result.current.scale).toBe(1);
    expect(result.current.offset).toEqual({ x: 0, y: 0 });
  });

  it('zoomIn 应该放大缩放', () => {
    const { result } = renderHook(() =>
      useZoomPan({
        containerRef: mockContainerRef,
        activeTool: 'select',
        imageData: 'test-image',
      })
    );

    act(() => {
      result.current.zoomIn();
    });

    // 1 * 1.2 = 1.2
    expect(result.current.scale).toBeCloseTo(1.2, 1);
  });

  it('zoomOut 应该缩小缩放', () => {
    const { result } = renderHook(() =>
      useZoomPan({
        containerRef: mockContainerRef,
        activeTool: 'select',
        imageData: 'test-image',
      })
    );

    act(() => {
      result.current.zoomOut();
    });

    // 1 / 1.2 ≈ 0.833
    expect(result.current.scale).toBeCloseTo(0.833, 2);
  });

  it('handleSlider 应该设置指定的缩放值', () => {
    const { result } = renderHook(() =>
      useZoomPan({
        containerRef: mockContainerRef,
        activeTool: 'select',
        imageData: 'test-image',
      })
    );

    act(() => {
      result.current.handleSlider(1.5);
    });

    expect(result.current.scale).toBe(1.5);
  });

  it('zoomIn 在容器不存在时不应该抛错', () => {
    const emptyRef = { current: null };

    const { result } = renderHook(() =>
      useZoomPan({
        containerRef: emptyRef,
        activeTool: 'select',
        imageData: 'test-image',
      })
    );

    expect(() => {
      act(() => {
        result.current.zoomIn();
      });
    }).not.toThrow();
  });

  it('zoomOut 在容器不存在时不应该抛错', () => {
    const emptyRef = { current: null };

    const { result } = renderHook(() =>
      useZoomPan({
        containerRef: emptyRef,
        activeTool: 'select',
        imageData: 'test-image',
      })
    );

    expect(() => {
      act(() => {
        result.current.zoomOut();
      });
    }).not.toThrow();
  });

  it('handleSlider 在容器不存在时不应该抛错', () => {
    const emptyRef = { current: null };

    const { result } = renderHook(() =>
      useZoomPan({
        containerRef: emptyRef,
        activeTool: 'select',
        imageData: 'test-image',
      })
    );

    expect(() => {
      act(() => {
        result.current.handleSlider(1.5);
      });
    }).not.toThrow();
  });

  it('连续缩放应该正确更新', () => {
    const { result } = renderHook(() =>
      useZoomPan({
        containerRef: mockContainerRef,
        activeTool: 'select',
        imageData: 'test-image',
      })
    );

    act(() => {
      result.current.zoomIn();
    });
    expect(result.current.scale).toBeCloseTo(1.2, 1);

    act(() => {
      result.current.zoomIn();
    });
    // 1.2 * 1.2 = 1.44
    expect(result.current.scale).toBeCloseTo(1.44, 1);

    act(() => {
      result.current.zoomOut();
    });
    // 1.44 / 1.2 = 1.2
    expect(result.current.scale).toBeCloseTo(1.2, 1);
  });

  it('zoomPercent 应该返回四舍五入的百分比', () => {
    const { result } = renderHook(() =>
      useZoomPan({
        containerRef: mockContainerRef,
        activeTool: 'select',
        imageData: 'test-image',
      })
    );

    // 初始 100%
    expect(result.current.zoomPercent).toBe(100);

    act(() => {
      result.current.setScale(1.567);
    });

    // 1.567 * 100 = 156.7, 四舍五入 = 157
    expect(result.current.zoomPercent).toBe(157);
  });
});
