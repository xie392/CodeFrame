// useExport Hook 测试

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useExport } from '../useExport';
import { useSettingsStore } from '@shared/stores/settings-store';
import type {
  ArrowShape,
  RectShape,
  TextShape,
  MosaicShape,
  ImageFrameSettings,
} from '../../types';
import type { UserSettings } from '@shared/types';

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
  useSettingsStore: vi.fn(),
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
HTMLCanvasElement.prototype.toDataURL = vi
  .fn()
  .mockReturnValue('data:image/png;base64,mock');

/**
 * 创建完整类型的 ImageFrameSettings mock
 */
function createMockFrameSettings(): ImageFrameSettings {
  return {
    background: {
      type: 'solid',
      color: '#FFFFFF',
      gradientColors: ['#FFFFFF', '#000000'],
      gradientAngle: 0,
    },
    padding: {
      top: 40,
      right: 40,
      bottom: 40,
      left: 40,
      linked: true,
    },
    borderRadius: {
      unit: 'px',
      topLeft: 0,
      topRight: 0,
      bottomRight: 0,
      bottomLeft: 0,
      linked: true,
    },
    imageRadius: {
      unit: 'px',
      topLeft: 0,
      topRight: 0,
      bottomRight: 0,
      bottomLeft: 0,
      linked: true,
    },
    shadow: {
      enabled: false,
      color: '#000000',
      blur: 0,
      offsetX: 0,
      offsetY: 0,
    },
    imageShadow: {
      enabled: false,
      color: '#000000',
      blur: 0,
      offsetX: 0,
      offsetY: 0,
    },
    aspectRatio: 'auto',
    customAspectRatio: { width: 0, height: 0 },
    windowControl: {
      enabled: false,
      style: 'macos',
    },
    watermark: {
      enabled: false,
      text: '',
      position: 'bottom-right',
      opacity: 50,
      fontSize: 12,
      imageUrl: null,
      imageSize: 32,
    },
  };
}

/**
 * 创建 RefObject mock
 */
function createRefMock<T>(initialValue: T): React.MutableRefObject<T> {
  return { current: initialValue };
}

/**
 * 创建部分 UserSettings mock
 */
function createMockSettings(
  overrides?: Partial<UserSettings>
): Partial<UserSettings> & Pick<UserSettings, 'defaultFormat' | 'quality'> {
  return {
    defaultFormat: 'png',
    quality: '2x',
    language: 'zh-CN',
    saveOperationHistory: true,
    delayTime: 3,
    shortcuts: {
      native: {
        captureVisible: 'Ctrl+Shift+V',
        captureRegion: 'Ctrl+Shift+R',
        captureFullpage: 'Ctrl+Shift+F',
        captureDesktop: 'Ctrl+Shift+D',
      },
      custom: {
        captureVisible: '',
        captureRegion: '',
        captureFullpage: '',
        captureDesktop: '',
      },
      enabled: true,
    },
    ...overrides,
  };
}

describe('useExport', () => {
  const createMockContainer = () => {
    const container = document.createElement('div');
    Object.defineProperty(container, 'appendChild', {
      value: vi.fn(),
      writable: true,
    });
    return container;
  };

  // 使用正确类型的 mock 对象
  let mockExportContainerRef: React.MutableRefObject<HTMLDivElement | null>;
  const mockImageDisplaySizeRef = createRefMock<{ width: number; height: number }>({
    width: 800,
    height: 600,
  });
  const mockArrowsRef = createRefMock<ArrowShape[]>([]);
  const mockRectsRef = createRefMock<RectShape[]>([]);
  const mockTextsRef = createRefMock<TextShape[]>([]);
  const mockMosaicsRef = createRefMock<MosaicShape[]>([]);

  const mockFrameSettings = createMockFrameSettings();

  beforeEach(() => {
    vi.clearAllMocks();
    mockExportContainerRef = createRefMock<HTMLDivElement | null>(null);
    mockExportContainerRef.current = createMockContainer();
    // 设置默认 mock 返回值
    vi.mocked(useSettingsStore).mockReturnValue({
      settings: createMockSettings() as UserSettings,
      operationHistory: {},
      isLoading: false,
      updateSettings: vi.fn(),
      updateSettingsBatch: vi.fn(),
      resetSettings: vi.fn(),
      updateShortcut: vi.fn(),
      toggleShortcutsEnabled: vi.fn(),
      resetShortcuts: vi.fn(),
      updateOperationHistory: vi.fn(),
      clearOperationHistory: vi.fn(),
      setLoading: vi.fn(),
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('应该返回初始状态', () => {
    const { result } = renderHook(() =>
      useExport({
        exportContainerRef: mockExportContainerRef,
        imageData: 'data:image/png;base64,test',
        frameSettings: mockFrameSettings,
        imageDisplaySizeRef: mockImageDisplaySizeRef,
        arrowsRef: mockArrowsRef,
        rectsRef: mockRectsRef,
        textsRef: mockTextsRef,
        mosaicsRef: mockMosaicsRef,
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
        frameSettings: mockFrameSettings,
        imageDisplaySizeRef: mockImageDisplaySizeRef,
        arrowsRef: mockArrowsRef,
        rectsRef: mockRectsRef,
        textsRef: mockTextsRef,
        mosaicsRef: mockMosaicsRef,
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
        frameSettings: mockFrameSettings,
        imageDisplaySizeRef: mockImageDisplaySizeRef,
        arrowsRef: mockArrowsRef,
        rectsRef: mockRectsRef,
        textsRef: mockTextsRef,
        mosaicsRef: mockMosaicsRef,
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
        frameSettings: mockFrameSettings,
        imageDisplaySizeRef: mockImageDisplaySizeRef,
        arrowsRef: mockArrowsRef,
        rectsRef: mockRectsRef,
        textsRef: mockTextsRef,
        mosaicsRef: mockMosaicsRef,
      })
    );

    act(() => {
      result.current.setCopied(true);
    });

    expect(result.current.copied).toBe(true);
  });

  it('handleExportImage 在没有容器时不应该执行', async () => {
    const emptyRef = createRefMock<HTMLDivElement | null>(null);

    const { result } = renderHook(() =>
      useExport({
        exportContainerRef: emptyRef,
        imageData: 'data:image/png;base64,test',
        frameSettings: mockFrameSettings,
        imageDisplaySizeRef: mockImageDisplaySizeRef,
        arrowsRef: mockArrowsRef,
        rectsRef: mockRectsRef,
        textsRef: mockTextsRef,
        mosaicsRef: mockMosaicsRef,
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
        frameSettings: mockFrameSettings,
        imageDisplaySizeRef: mockImageDisplaySizeRef,
        arrowsRef: mockArrowsRef,
        rectsRef: mockRectsRef,
        textsRef: mockTextsRef,
        mosaicsRef: mockMosaicsRef,
      })
    );

    await act(async () => {
      await result.current.handleExportImage();
    });

    const { snapdom } = await import('@zumer/snapdom');
    expect(snapdom.toPng).not.toHaveBeenCalled();
  });

  it('handleCopyToClipboard 在没有容器时不应该执行', async () => {
    const emptyRef = createRefMock<HTMLDivElement | null>(null);

    const { result } = renderHook(() =>
      useExport({
        exportContainerRef: emptyRef,
        imageData: 'data:image/png;base64,test',
        frameSettings: mockFrameSettings,
        imageDisplaySizeRef: mockImageDisplaySizeRef,
        arrowsRef: mockArrowsRef,
        rectsRef: mockRectsRef,
        textsRef: mockTextsRef,
        mosaicsRef: mockMosaicsRef,
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
        frameSettings: mockFrameSettings,
        imageDisplaySizeRef: mockImageDisplaySizeRef,
        arrowsRef: mockArrowsRef,
        rectsRef: mockRectsRef,
        textsRef: mockTextsRef,
        mosaicsRef: mockMosaicsRef,
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
        frameSettings: mockFrameSettings,
        imageDisplaySizeRef: mockImageDisplaySizeRef,
        arrowsRef: mockArrowsRef,
        rectsRef: mockRectsRef,
        textsRef: mockTextsRef,
        mosaicsRef: mockMosaicsRef,
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
        frameSettings: mockFrameSettings,
        imageDisplaySizeRef: mockImageDisplaySizeRef,
        arrowsRef: mockArrowsRef,
        rectsRef: mockRectsRef,
        textsRef: mockTextsRef,
        mosaicsRef: mockMosaicsRef,
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
      settings: createMockSettings({ defaultFormat: 'webp' }) as UserSettings,
      operationHistory: {},
      isLoading: false,
      updateSettings: vi.fn(),
      updateSettingsBatch: vi.fn(),
      resetSettings: vi.fn(),
      updateShortcut: vi.fn(),
      toggleShortcutsEnabled: vi.fn(),
      resetShortcuts: vi.fn(),
      updateOperationHistory: vi.fn(),
      clearOperationHistory: vi.fn(),
      setLoading: vi.fn(),
    });

    const { result } = renderHook(() =>
      useExport({
        exportContainerRef: mockExportContainerRef,
        imageData: 'data:image/png;base64,test',
        frameSettings: mockFrameSettings,
        imageDisplaySizeRef: mockImageDisplaySizeRef,
        arrowsRef: mockArrowsRef,
        rectsRef: mockRectsRef,
        textsRef: mockTextsRef,
        mosaicsRef: mockMosaicsRef,
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
      settings: createMockSettings({ defaultFormat: 'jpg' }) as UserSettings,
      operationHistory: {},
      isLoading: false,
      updateSettings: vi.fn(),
      updateSettingsBatch: vi.fn(),
      resetSettings: vi.fn(),
      updateShortcut: vi.fn(),
      toggleShortcutsEnabled: vi.fn(),
      resetShortcuts: vi.fn(),
      updateOperationHistory: vi.fn(),
      clearOperationHistory: vi.fn(),
      setLoading: vi.fn(),
    });

    const { result } = renderHook(() =>
      useExport({
        exportContainerRef: mockExportContainerRef,
        imageData: 'data:image/png;base64,test',
        frameSettings: mockFrameSettings,
        imageDisplaySizeRef: mockImageDisplaySizeRef,
        arrowsRef: mockArrowsRef,
        rectsRef: mockRectsRef,
        textsRef: mockTextsRef,
        mosaicsRef: mockMosaicsRef,
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
        frameSettings: mockFrameSettings,
        imageDisplaySizeRef: mockImageDisplaySizeRef,
        arrowsRef: mockArrowsRef,
        rectsRef: mockRectsRef,
        textsRef: mockTextsRef,
        mosaicsRef: mockMosaicsRef,
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
        frameSettings: mockFrameSettings,
        imageDisplaySizeRef: mockImageDisplaySizeRef,
        arrowsRef: mockArrowsRef,
        rectsRef: mockRectsRef,
        textsRef: mockTextsRef,
        mosaicsRef: mockMosaicsRef,
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
