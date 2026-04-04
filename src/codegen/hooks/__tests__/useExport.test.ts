// useExport Hook 测试

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useExport } from '../useExport';
import { useSettingsStore } from '@shared/stores/settings-store';

// Mock dependencies
vi.mock('react-i18next', () => ({
  useTranslation: vi.fn(() => ({
    t: vi.fn((key) => key),
  })),
}));

vi.mock('@zumer/snapdom', () => ({
  snapdom: {
    toBlob: vi.fn().mockResolvedValue(new Blob(['test'], { type: 'image/png' })),
    toPng: vi.fn().mockResolvedValue({ src: 'data:image/png;base64,test' }),
    toWebp: vi.fn().mockResolvedValue({ src: 'data:image/webp;base64,test' }),
  },
}));

vi.mock('@shared/stores/settings-store', () => ({
  useSettingsStore: vi.fn(() => ({
    settings: {
      defaultFormat: 'png',
      quality: '2x',
    },
  })),
}));

describe('useExport', () => {
  let mockExportRef: React.RefObject<HTMLDivElement | null>;
  let mockIsEditingRef: React.MutableRefObject<boolean>;
  let mockExitEditRef: React.MutableRefObject<() => void>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockExportRef = { current: document.createElement('div') };
    mockIsEditingRef = { current: false };
    mockExitEditRef = { current: vi.fn() };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('应该返回初始状态', () => {
    const { result } = renderHook(() =>
      useExport({
        exportRef: mockExportRef,
        isEditingRef: mockIsEditingRef,
        exitEditRef: mockExitEditRef,
      })
    );

    expect(result.current.isExporting).toBe(false);
    expect(result.current.copied).toBe(false);
    expect(typeof result.current.handleExportImage).toBe('function');
    expect(typeof result.current.handleCopyToClipboard).toBe('function');
    expect(typeof result.current.cancel).toBe('function');
  });

  it('handleExportImage 应该在 exportRef.current 为 null 时直接返回', async () => {
    const emptyRef = { current: null };

    const { result } = renderHook(() =>
      useExport({
        exportRef: emptyRef,
        isEditingRef: mockIsEditingRef,
        exitEditRef: mockExitEditRef,
      })
    );

    await act(async () => {
      await result.current.handleExportImage();
    });

    expect(result.current.isExporting).toBe(false);
  });

  it('handleCopyToClipboard 应该在 exportRef.current 为 null 时直接返回', async () => {
    const emptyRef = { current: null };

    const { result } = renderHook(() =>
      useExport({
        exportRef: emptyRef,
        isEditingRef: mockIsEditingRef,
        exitEditRef: mockExitEditRef,
      })
    );

    await act(async () => {
      await result.current.handleCopyToClipboard();
    });

    expect(result.current.copied).toBe(false);
  });

  it('cancel 应该取消操作', async () => {
    const { result } = renderHook(() =>
      useExport({
        exportRef: mockExportRef,
        isEditingRef: mockIsEditingRef,
        exitEditRef: mockExitEditRef,
      })
    );

    // 开始导出
    act(() => {
      result.current.handleExportImage();
    });

    // 立即取消
    act(() => {
      result.current.cancel();
    });

    expect(result.current.isExporting).toBe(false);
    expect(result.current.copied).toBe(false);
  });

  it('handleCopyToClipboard 应该在编辑模式时调用 exitEdit', async () => {
    mockIsEditingRef.current = true;
    const mockExitEdit = vi.fn();
    mockExitEditRef.current = mockExitEdit;

    // Mock clipboard API
    vi.stubGlobal('navigator', {
      clipboard: {
        write: vi.fn().mockResolvedValue(undefined),
      },
    });

    const { result } = renderHook(() =>
      useExport({
        exportRef: mockExportRef,
        isEditingRef: mockIsEditingRef,
        exitEditRef: mockExitEditRef,
      })
    );

    await act(async () => {
      await result.current.handleCopyToClipboard();
    });

    expect(mockExitEdit).toHaveBeenCalled();

    vi.unstubAllGlobals();
  });

  it('handleExportImage 应该在编辑模式时调用 exitEdit', async () => {
    mockIsEditingRef.current = true;
    const mockExitEdit = vi.fn();
    mockExitEditRef.current = mockExitEdit;

    const { result } = renderHook(() =>
      useExport({
        exportRef: mockExportRef,
        isEditingRef: mockIsEditingRef,
        exitEditRef: mockExitEditRef,
      })
    );

    await act(async () => {
      await result.current.handleExportImage();
    });

    expect(mockExitEdit).toHaveBeenCalled();
  });

  it('应该处理不同质量设置', async () => {
    vi.mocked(useSettingsStore).mockReturnValue({
      settings: {
        defaultFormat: 'png',
        quality: '3x',
      },
    } as unknown as ReturnType<typeof useSettingsStore>);

    const { result } = renderHook(() =>
      useExport({
        exportRef: mockExportRef,
        isEditingRef: mockIsEditingRef,
        exitEditRef: mockExitEditRef,
      })
    );

    await act(async () => {
      await result.current.handleExportImage();
    });

    // 测试成功完成
    expect(result.current.isExporting).toBe(false);
  });
});
