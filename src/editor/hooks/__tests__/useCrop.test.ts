// useCrop Hook 测试

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCrop } from '../useCrop';

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

  beforeEach(() => {
    vi.clearAllMocks();
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
    
    const { result } = renderHook(() => useCrop(configWithoutCrop, mockCallbacks));
    
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
    
    const { result } = renderHook(() => useCrop(configWithoutImage, mockCallbacks));
    
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
});
