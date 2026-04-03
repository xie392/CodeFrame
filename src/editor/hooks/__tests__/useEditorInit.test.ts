// useEditorInit Hook 测试

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useEditorInit } from '../useEditorInit';

// Mock parseSource 和 readFileAsDataUrl
vi.mock('../../utils/editor', () => ({
  parseSource: vi.fn().mockReturnValue(null),
  readFileAsDataUrl: vi.fn().mockResolvedValue('data:image/png;base64,test'),
}));

// Mock validation - 使用实际实现
vi.mock('../../utils/validation', () => ({
  isValidCaptureResult: vi.fn((data) => {
    return data !== null && typeof data === 'object';
  }),
  isValidImageData: vi.fn((data) => {
    return typeof data === 'string' && data.startsWith('data:image');
  }),
}));

describe('useEditorInit', () => {
  const mockCallbacks = {
    setSource: vi.fn(),
    setImageData: vi.fn(),
    setError: vi.fn(),
    resetHistory: vi.fn(),
    updateHistoryButtons: vi.fn(),
  };

  const mockConfig = {
    source: null,
    imageData: null,
    initialized: { current: false },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockConfig.initialized.current = false;
  });

  it('应该在初始化时调用 setSource', () => {
    renderHook(() => useEditorInit(mockConfig, mockCallbacks));

    expect(mockCallbacks.setSource).toHaveBeenCalled();
  });

  it('应该在图片数据加载后初始化历史', async () => {
    const config = {
      ...mockConfig,
      imageData: 'data:image/png;base64,test',
    };

    renderHook(() => useEditorInit(config, mockCallbacks));

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(mockCallbacks.resetHistory).toHaveBeenCalledWith({
      arrows: [],
      rects: [],
      texts: [],
      mosaics: [],
      imageData: 'data:image/png;base64,test',
      view: { scale: 1, offset: { x: 0, y: 0 } },
      selectedArrowIds: [],
      selectedRectIds: [],
      selectedTextIds: [],
      selectedMosaicIds: [],
    });
    expect(mockCallbacks.updateHistoryButtons).toHaveBeenCalled();
  });

  it('应该只初始化历史一次', async () => {
    const config = {
      ...mockConfig,
      imageData: 'data:image/png;base64,test',
    };

    const { rerender } = renderHook(() => useEditorInit(config, mockCallbacks));

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(mockCallbacks.resetHistory).toHaveBeenCalledTimes(1);

    // 重新渲染不应该再次调用
    rerender();

    expect(mockCallbacks.resetHistory).toHaveBeenCalledTimes(1);
  });

  it('应该在 upload 源时监听粘贴事件', async () => {
    const config = {
      ...mockConfig,
      source: 'upload',
    };

    renderHook(() => useEditorInit(config, mockCallbacks));

    // 模拟粘贴事件
    const mockFile = new File(['test'], 'test.png', { type: 'image/png' });
    const clipboardData = {
      items: [
        {
          type: 'image/png',
          getAsFile: () => mockFile,
        },
      ],
    };

    await act(async () => {
      const pasteEvent = new Event('paste');
      Object.defineProperty(pasteEvent, 'clipboardData', { value: clipboardData });
      document.dispatchEvent(pasteEvent);
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(mockCallbacks.setImageData).toHaveBeenCalledWith('data:image/png;base64,test');
  });

  it('应该在非 upload 源时不监听粘贴事件', async () => {
    const config = {
      ...mockConfig,
      source: 'capture',
    };

    renderHook(() => useEditorInit(config, mockCallbacks));

    // 模拟粘贴事件
    const mockFile = new File(['test'], 'test.png', { type: 'image/png' });
    const clipboardData = {
      items: [
        {
          type: 'image/png',
          getAsFile: () => mockFile,
        },
      ],
    };

    await act(async () => {
      const pasteEvent = new Event('paste');
      Object.defineProperty(pasteEvent, 'clipboardData', { value: clipboardData });
      document.dispatchEvent(pasteEvent);
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(mockCallbacks.setImageData).not.toHaveBeenCalled();
  });

  it('应该忽略非图片类型的粘贴', async () => {
    const config = {
      ...mockConfig,
      source: 'upload',
    };

    renderHook(() => useEditorInit(config, mockCallbacks));

    // 模拟非图片粘贴
    const clipboardData = {
      items: [
        {
          type: 'text/plain',
          getAsFile: () => null,
        },
      ],
    };

    await act(async () => {
      const pasteEvent = new Event('paste');
      Object.defineProperty(pasteEvent, 'clipboardData', { value: clipboardData });
      document.dispatchEvent(pasteEvent);
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(mockCallbacks.setImageData).not.toHaveBeenCalled();
  });

  it('应该防止重复初始化', () => {
    const config = {
      ...mockConfig,
      initialized: { current: true }, // 已初始化
    };

    renderHook(() => useEditorInit(config, mockCallbacks));

    expect(mockCallbacks.setSource).not.toHaveBeenCalled();
  });
});
