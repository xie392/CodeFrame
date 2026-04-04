// useExport Hook 测试

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useExport } from '../useExport';
import { useSettingsStore } from '@shared/stores/settings-store';

// Mock snapdom
vi.mock('@zumer/snapdom', () => ({
  snapdom: {
    toBlob: vi.fn().mockResolvedValue(new Blob(['test'], { type: 'image/png' })),
    toPng: vi.fn().mockResolvedValue({ src: 'data:image/png;base64,test' }),
    toWebp: vi.fn().mockResolvedValue({ src: 'data:image/webp;base64,test' }),
  },
}));

// Mock settings store
vi.mock('@shared/stores/settings-store', () => ({
  useSettingsStore: vi.fn(() => ({
    settings: {
      defaultFormat: 'png',
      quality: '2x',
    },
  })),
}));

// Mock clipboard API
const mockClipboardWrite = vi.fn().mockResolvedValue(undefined);

// Mock ClipboardItem
class MockClipboardItem {
  data: Record<string, Blob>;
  constructor(data: Record<string, Blob>) {
    this.data = data;
  }
}

vi.stubGlobal('ClipboardItem', MockClipboardItem);

Object.assign(navigator, {
  clipboard: {
    write: mockClipboardWrite,
  },
});

// Mock requestAnimationFrame
vi.stubGlobal('requestAnimationFrame', (cb: () => void) => {
  setTimeout(cb, 0);
  return 0;
});

// Mock toDataURL
HTMLCanvasElement.prototype.toDataURL = vi.fn().mockReturnValue('data:image/png;base64,mock');

describe('useExport', () => {
  const createMockContainer = () => {
    const container = document.createElement('div');
    Object.defineProperty(container, 'appendChild', {
      value: vi.fn(),
      writable: true,
    });
    return container;
  };

  const mockExportContainerRef = { current: null as HTMLDivElement | null };
  const mockImageDisplaySizeRef = { current: { width: 800, height: 600 } };
  const mockArrowsRef = { current: [] };
  const mockRectsRef = { current: [] };
  const mockTextsRef = { current: [] };
  const mockMosaicsRef = { current: [] };

  const mockFrameSettings = {
    padding: {
      top: 40,
      right: 40,
      bottom: 40,
      left: 40,
      linked: true,
    },
    aspectRatio: 'auto',
    customAspectRatio: { width: 0, height: 0 },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockExportContainerRef.current = createMockContainer();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('应该返回初始状态', () => {
    const { result } = renderHook(() =>
      useExport({
        exportContainerRef: mockExportContainerRef,
        imageData: 'data:image/png;base64,test',
        frameSettings: mockFrameSettings as any,
        imageDisplaySizeRef: mockImageDisplaySizeRef,
        arrowsRef: mockArrowsRef as any,
        rectsRef: mockRectsRef as any,
        textsRef: mockTextsRef as any,
        mosaicsRef: mockMosaicsRef as any,
      })
    );

    expect(result.current.isExporting).toBe(false);
    expect(result.current.copied).toBe(false);
    expect(result.current.exportError).toBe(null);
  });

  it('应该返回所有导出函数', () => {
    const { result } = renderHook(() =>
      useExport({
        exportContainerRef: mockExportContainerRef,
        imageData: 'data:image/png;base64,test',
        frameSettings: mockFrameSettings as any,
        imageDisplaySizeRef: mockImageDisplaySizeRef,
        arrowsRef: mockArrowsRef as any,
        rectsRef: mockRectsRef as any,
        textsRef: mockTextsRef as any,
        mosaicsRef: mockMosaicsRef as any,
      })
    );

    expect(typeof result.current.setIsExporting).toBe('function');
    expect(typeof result.current.setCopied).toBe('function');
    expect(typeof result.current.handleExportImage).toBe('function');
    expect(typeof result.current.handleCopyToClipboard).toBe('function');
  });

  it('setIsExporting 应该更新导出状态', () => {
    const { result } = renderHook(() =>
      useExport({
        exportContainerRef: mockExportContainerRef,
        imageData: 'data:image/png;base64,test',
        frameSettings: mockFrameSettings as any,
        imageDisplaySizeRef: mockImageDisplaySizeRef,
        arrowsRef: mockArrowsRef as any,
        rectsRef: mockRectsRef as any,
        textsRef: mockTextsRef as any,
        mosaicsRef: mockMosaicsRef as any,
      })
    );

    act(() => {
      result.current.setIsExporting(true);
    });

    expect(result.current.isExporting).toBe(true);
  });

  it('setCopied 应该更新复制状态', () => {
    const { result } = renderHook(() =>
      useExport({
        exportContainerRef: mockExportContainerRef,
        imageData: 'data:image/png;base64,test',
        frameSettings: mockFrameSettings as any,
        imageDisplaySizeRef: mockImageDisplaySizeRef,
        arrowsRef: mockArrowsRef as any,
        rectsRef: mockRectsRef as any,
        textsRef: mockTextsRef as any,
        mosaicsRef: mockMosaicsRef as any,
      })
    );

    act(() => {
      result.current.setCopied(true);
    });

    expect(result.current.copied).toBe(true);
  });

  it('handleExportImage 在没有容器时不应该执行', async () => {
    const emptyRef = { current: null };

    const { result } = renderHook(() =>
      useExport({
        exportContainerRef: emptyRef,
        imageData: 'data:image/png;base64,test',
        frameSettings: mockFrameSettings as any,
        imageDisplaySizeRef: mockImageDisplaySizeRef,
        arrowsRef: mockArrowsRef as any,
        rectsRef: mockRectsRef as any,
        textsRef: mockTextsRef as any,
        mosaicsRef: mockMosaicsRef as any,
      })
    );

    await act(async () => {
      await result.current.handleExportImage();
    });

    const { snapdom } = await import('@zumer/snapdom');
    expect(snapdom.toPng).not.toHaveBeenCalled();
  });

  it('handleExportImage 在没有图片数据时不应该执行', async () => {
    const { result } = renderHook(() =>
      useExport({
        exportContainerRef: mockExportContainerRef,
        imageData: null,
        frameSettings: mockFrameSettings as any,
        imageDisplaySizeRef: mockImageDisplaySizeRef,
        arrowsRef: mockArrowsRef as any,
        rectsRef: mockRectsRef as any,
        textsRef: mockTextsRef as any,
        mosaicsRef: mockMosaicsRef as any,
      })
    );

    await act(async () => {
      await result.current.handleExportImage();
    });

    const { snapdom } = await import('@zumer/snapdom');
    expect(snapdom.toPng).not.toHaveBeenCalled();
  });

  it('handleCopyToClipboard 在没有容器时不应该执行', async () => {
    const emptyRef = { current: null };

    const { result } = renderHook(() =>
      useExport({
        exportContainerRef: emptyRef,
        imageData: 'data:image/png;base64,test',
        frameSettings: mockFrameSettings as any,
        imageDisplaySizeRef: mockImageDisplaySizeRef,
        arrowsRef: mockArrowsRef as any,
        rectsRef: mockRectsRef as any,
        textsRef: mockTextsRef as any,
        mosaicsRef: mockMosaicsRef as any,
      })
    );

    await act(async () => {
      await result.current.handleCopyToClipboard();
    });

    expect(mockClipboardWrite).not.toHaveBeenCalled();
  });

  it('handleCopyToClipboard 在剪贴板不支持时应该设置错误', async () => {
    // 临时移除 clipboard API
    const originalClipboard = navigator.clipboard;
    Object.defineProperty(navigator, 'clipboard', {
      value: undefined,
      writable: true,
      configurable: true,
    });

    const { result } = renderHook(() =>
      useExport({
        exportContainerRef: mockExportContainerRef,
        imageData: 'data:image/png;base64,test',
        frameSettings: mockFrameSettings as any,
        imageDisplaySizeRef: mockImageDisplaySizeRef,
        arrowsRef: mockArrowsRef as any,
        rectsRef: mockRectsRef as any,
        textsRef: mockTextsRef as any,
        mosaicsRef: mockMosaicsRef as any,
      })
    );

    await act(async () => {
      await result.current.handleCopyToClipboard();
    });

    expect(result.current.exportError).toBe('当前浏览器不支持复制图片到剪贴板');

    // 恢复 clipboard API
    Object.defineProperty(navigator, 'clipboard', {
      value: originalClipboard,
      writable: true,
      configurable: true,
    });
  });

  it('handleCopyToClipboard 应该调用剪贴板 API', async () => {
    const { result } = renderHook(() =>
      useExport({
        exportContainerRef: mockExportContainerRef,
        imageData: 'data:image/png;base64,test',
        frameSettings: mockFrameSettings as any,
        imageDisplaySizeRef: mockImageDisplaySizeRef,
        arrowsRef: mockArrowsRef as any,
        rectsRef: mockRectsRef as any,
        textsRef: mockTextsRef as any,
        mosaicsRef: mockMosaicsRef as any,
      })
    );

    await act(async () => {
      await result.current.handleCopyToClipboard();
    });

    expect(mockClipboardWrite).toHaveBeenCalled();
  });

  it('handleExportImage 应该导出 PNG 格式', async () => {
    const { result } = renderHook(() =>
      useExport({
        exportContainerRef: mockExportContainerRef,
        imageData: 'data:image/png;base64,test',
        frameSettings: mockFrameSettings as any,
        imageDisplaySizeRef: mockImageDisplaySizeRef,
        arrowsRef: mockArrowsRef as any,
        rectsRef: mockRectsRef as any,
        textsRef: mockTextsRef as any,
        mosaicsRef: mockMosaicsRef as any,
      })
    );

    await act(async () => {
      await result.current.handleExportImage();
    });

    const { snapdom } = await import('@zumer/snapdom');
    expect(snapdom.toPng).toHaveBeenCalled();
  });

  it('handleExportImage 应该导出 WebP 格式', async () => {
    vi.mocked(useSettingsStore).mockReturnValue({
      settings: {
        defaultFormat: 'webp',
        quality: '2x',
      },
    } as any);

    const { result } = renderHook(() =>
      useExport({
        exportContainerRef: mockExportContainerRef,
        imageData: 'data:image/png;base64,test',
        frameSettings: mockFrameSettings as any,
        imageDisplaySizeRef: mockImageDisplaySizeRef,
        arrowsRef: mockArrowsRef as any,
        rectsRef: mockRectsRef as any,
        textsRef: mockTextsRef as any,
        mosaicsRef: mockMosaicsRef as any,
      })
    );

    await act(async () => {
      await result.current.handleExportImage();
    });

    const { snapdom } = await import('@zumer/snapdom');
    expect(snapdom.toWebp).toHaveBeenCalled();
  });

  it('handleExportImage 应该导出 JPG 格式', async () => {
    vi.mocked(useSettingsStore).mockReturnValue({
      settings: {
        defaultFormat: 'jpg',
        quality: '2x',
      },
    } as any);

    const { result } = renderHook(() =>
      useExport({
        exportContainerRef: mockExportContainerRef,
        imageData: 'data:image/png;base64,test',
        frameSettings: mockFrameSettings as any,
        imageDisplaySizeRef: mockImageDisplaySizeRef,
        arrowsRef: mockArrowsRef as any,
        rectsRef: mockRectsRef as any,
        textsRef: mockTextsRef as any,
        mosaicsRef: mockMosaicsRef as any,
      })
    );

    await act(async () => {
      await result.current.handleExportImage();
    });

    const { snapdom } = await import('@zumer/snapdom');
    expect(snapdom.toBlob).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ type: 'jpeg' })
    );
  });

  // TODO: 修复 vitest 4.x mock 兼容性问题
  it.skip('handleExportImage 应该处理导出错误', async () => {
    // 使用 mockImplementationOnce 确保错误被正确抛出
    const { snapdom: mockSnapdom } = await import('@zumer/snapdom');
    vi.mocked(mockSnapdom.toPng).mockImplementationOnce(() => 
      Promise.reject(new Error('Export failed'))
    );

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { result } = renderHook(() =>
      useExport({
        exportContainerRef: mockExportContainerRef,
        imageData: 'data:image/png;base64,test',
        frameSettings: mockFrameSettings as any,
        imageDisplaySizeRef: mockImageDisplaySizeRef,
        arrowsRef: mockArrowsRef as any,
        rectsRef: mockRectsRef as any,
        textsRef: mockTextsRef as any,
        mosaicsRef: mockMosaicsRef as any,
      })
    );

    await act(async () => {
      await result.current.handleExportImage();
    });

    expect(consoleSpy).toHaveBeenCalled();
    expect(result.current.exportError).toBe('导出失败，请重试');

    consoleSpy.mockRestore();
  });

  it('handleCopyToClipboard 应该处理复制错误', async () => {
    mockClipboardWrite.mockRejectedValueOnce(new Error('Copy failed'));

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { result } = renderHook(() =>
      useExport({
        exportContainerRef: mockExportContainerRef,
        imageData: 'data:image/png;base64,test',
        frameSettings: mockFrameSettings as any,
        imageDisplaySizeRef: mockImageDisplaySizeRef,
        arrowsRef: mockArrowsRef as any,
        rectsRef: mockRectsRef as any,
        textsRef: mockTextsRef as any,
        mosaicsRef: mockMosaicsRef as any,
      })
    );

    await act(async () => {
      await result.current.handleCopyToClipboard();
    });

    expect(consoleSpy).toHaveBeenCalled();
    expect(result.current.exportError).toBe('复制失败，请重试');

    consoleSpy.mockRestore();
  });
});
