// useCrop Hook 测试

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCrop } from '../useCrop';

// Mock canvas - 使用 vi.fn() 模拟 getContext
// 这是测试环境必需的 mock，用于模拟 Canvas 2D 上下文
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(HTMLCanvasElement.prototype.getContext as any) = vi.fn(() => ({
  drawImage: vi.fn(),
}));
HTMLCanvasElement.prototype.toDataURL = vi
  .fn()
  .mockReturnValue('data:image/png;base64,cropped');

describe('useCrop', () => {
  const mockCallbacks = {
    pushHistory: vi.fn(),
    setImageData: vi.fn(),
    setArrows: vi.fn(),
    setRects: vi.fn(),
    setTexts: vi.fn(),
    setMosaics: vi.fn(),
    setSelectedArrowIds: vi.fn(),
    setSelectedRectIds: vi.fn(),
    setSelectedTextIds: vi.fn(),
    setSelectedMosaicIds: vi.fn(),
    setCropArea: vi.fn(),
    setImageNaturalSize: vi.fn(),
    setImageDisplaySize: vi.fn(),
    setActiveTool: vi.fn(),
    setScale: vi.fn(),
    setOffset: vi.fn(),
  };

  const mockConfig = {
    imageData: 'data:image/png;base64,test',
    cropAreaRef: { current: { x: 10, y: 10, width: 100, height: 80 } },
    imageNaturalSizeRef: { current: { width: 800, height: 600 } },
    imageDisplaySizeRef: { current: { width: 400, height: 300 } },
    scaleRef: { current: 1 },
    offsetRef: { current: { x: 0, y: 0 } },
  };

  let originalImage: typeof window.Image;

  beforeEach(() => {
    vi.clearAllMocks();
    originalImage = window.Image;
  });

  afterEach(() => {
    window.Image = originalImage;
  });

  it('应该返回 applyCrop 和 cancelCrop 函数', () => {
    const { result } = renderHook(() => useCrop(mockConfig, mockCallbacks));

    expect(typeof result.current.applyCrop).toBe('function');
    expect(typeof result.current.cancelCrop).toBe('function');
  });

  it('applyCrop 应该在没有裁剪区域时不执行', () => {
    const configWithoutCrop = {
      ...mockConfig,
      cropAreaRef: { current: null },
    };

    const { result } = renderHook(() =>
      useCrop(configWithoutCrop, mockCallbacks)
    );

    act(() => {
      result.current.applyCrop();
    });

    expect(mockCallbacks.pushHistory).not.toHaveBeenCalled();
  });

  it('applyCrop 应该在没有图片数据时不执行', () => {
    const configWithoutImage = {
      ...mockConfig,
      imageData: null,
    };

    const { result } = renderHook(() =>
      useCrop(configWithoutImage, mockCallbacks)
    );

    act(() => {
      result.current.applyCrop();
    });

    expect(mockCallbacks.pushHistory).not.toHaveBeenCalled();
  });

  it('cancelCrop 应该重置裁剪状态', () => {
    const { result } = renderHook(() => useCrop(mockConfig, mockCallbacks));

    act(() => {
      result.current.cancelCrop();
    });

    expect(mockCallbacks.setCropArea).toHaveBeenCalledWith(null);
    expect(mockCallbacks.setActiveTool).toHaveBeenCalledWith('select');
  });

  it('applyCrop 应该处理图片加载成功', async () => {
    // Mock Image 构造函数
    // 这是测试环境必需的 mock，用于模拟浏览器原生 Image 构造函数
    class MockImage {
      onload: (() => void) | null = null;
      src = '';
      constructor() {
        setTimeout(() => {
          if (this.onload) this.onload();
        }, 0);
      }
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    window.Image = MockImage as any;

    const { result } = renderHook(() => useCrop(mockConfig, mockCallbacks));

    act(() => {
      result.current.applyCrop();
    });

    // 等待 setTimeout 完成
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });

    expect(mockCallbacks.pushHistory).toHaveBeenCalled();
    expect(mockCallbacks.setImageData).toHaveBeenCalled();
    expect(mockCallbacks.setArrows).toHaveBeenCalled();
    expect(mockCallbacks.setRects).toHaveBeenCalled();
    expect(mockCallbacks.setTexts).toHaveBeenCalled();
    expect(mockCallbacks.setMosaics).toHaveBeenCalled();
  });

  it('applyCrop 应该在没有自然尺寸时不执行', () => {
    const configWithoutNaturalSize = {
      ...mockConfig,
      imageNaturalSizeRef: { current: null },
    };

    const { result } = renderHook(() =>
      useCrop(configWithoutNaturalSize, mockCallbacks)
    );

    act(() => {
      result.current.applyCrop();
    });

    expect(mockCallbacks.pushHistory).not.toHaveBeenCalled();
  });

  it('applyCrop 应该在没有显示尺寸时不执行', () => {
    const configWithoutDisplaySize = {
      ...mockConfig,
      imageDisplaySizeRef: { current: null },
    };

    const { result } = renderHook(() =>
      useCrop(configWithoutDisplaySize, mockCallbacks)
    );

    act(() => {
      result.current.applyCrop();
    });

    expect(mockCallbacks.pushHistory).not.toHaveBeenCalled();
  });
});
