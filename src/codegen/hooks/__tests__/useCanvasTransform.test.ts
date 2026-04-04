// useCanvasTransform Hook 测试

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCanvasTransform } from '../useCanvasTransform';
import { useCodegenStore } from '../../stores/codegen-store';

// Mock codegen store
vi.mock('../../stores/codegen-store', () => ({
  useCodegenStore: vi.fn(() => ({
    canvas: { scale: 1, offset: { x: 0, y: 0 } },
    setCanvas: vi.fn(),
  })),
}));

describe('useCanvasTransform', () => {
  const mockSetCanvas = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useCodegenStore).mockReturnValue({
      canvas: { scale: 1, offset: { x: 0, y: 0 } },
      setCanvas: mockSetCanvas,
    } as unknown as ReturnType<typeof useCodegenStore>);
  });

  it('应该返回当前缩放和偏移', () => {
    const { result } = renderHook(() => useCanvasTransform());

    expect(result.current.scale).toBe(1);
    expect(result.current.offset).toEqual({ x: 0, y: 0 });
    expect(result.current.zoomPercent).toBe(100);
  });

  it('应该返回缩放相关的 refs', () => {
    const { result } = renderHook(() => useCanvasTransform());

    expect(result.current.scaleRef).toBeDefined();
    expect(result.current.offsetRef).toBeDefined();
  });

  it('zoomAt 应该在指定锚点缩放', () => {
    const { result } = renderHook(() => useCanvasTransform());

    act(() => {
      result.current.zoomAt(2, 100, 100);
    });

    expect(mockSetCanvas).toHaveBeenCalledWith({
      scale: 2,
      offset: { x: -100, y: -100 },
    });
  });

  it('zoomAt 应该限制缩放范围', () => {
    const { result } = renderHook(() => useCanvasTransform());

    act(() => {
      result.current.zoomAt(10, 0, 0); // 超过最大值
    });

    const calls = mockSetCanvas.mock.calls;
    expect(calls[calls.length - 1][0].scale).toBeLessThanOrEqual(5);
  });

  it('zoomIn 应该放大', () => {
    const { result } = renderHook(() => useCanvasTransform());

    act(() => {
      result.current.zoomIn(400, 300);
    });

    expect(mockSetCanvas).toHaveBeenCalled();
    const callArg = mockSetCanvas.mock.calls[0][0];
    expect(callArg.scale).toBeGreaterThan(1);
  });

  it('zoomOut 应该缩小', () => {
    const { result } = renderHook(() => useCanvasTransform());

    act(() => {
      result.current.zoomOut(400, 300);
    });

    expect(mockSetCanvas).toHaveBeenCalled();
    const callArg = mockSetCanvas.mock.calls[0][0];
    expect(callArg.scale).toBeLessThan(1);
  });

  it('resetView 应该重置视图', () => {
    const { result } = renderHook(() => useCanvasTransform());

    act(() => {
      result.current.resetView();
    });

    expect(mockSetCanvas).toHaveBeenCalledWith({
      scale: 1,
      offset: { x: 0, y: 0 },
    });
  });

  it('handleSlider 应该在中心点缩放', () => {
    const { result } = renderHook(() => useCanvasTransform());

    act(() => {
      result.current.handleSlider(1.5, 400, 300);
    });

    expect(mockSetCanvas).toHaveBeenCalledWith({
      scale: 1.5,
      offset: { x: -100, y: -75 },
    });
  });

  it('应该计算正确的 zoomPercent', () => {
    vi.mocked(useCodegenStore).mockReturnValue({
      canvas: { scale: 1.5, offset: { x: 0, y: 0 } },
      setCanvas: mockSetCanvas,
    } as unknown as ReturnType<typeof useCodegenStore>);

    const { result } = renderHook(() => useCanvasTransform());

    expect(result.current.zoomPercent).toBe(150);
  });
});
