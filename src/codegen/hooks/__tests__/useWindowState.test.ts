// useWindowState Hook 测试

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWindowState } from '../useWindowState';
import { useCodegenStore } from '../../stores/codegen-store';

// Mock @use-gesture/react
vi.mock('@use-gesture/react', () => ({
  useDrag: vi.fn(() => vi.fn()),
}));

// Mock codegen store
vi.mock('../../stores/codegen-store', () => ({
  useCodegenStore: vi.fn(() => ({
    editor: { code: 'console.log(1)', fontSize: 14 },
    window: { showHeader: true },
    isEditing: false,
    winSize: { width: 600, height: 400 },
    manualResized: false,
    setIsEditing: vi.fn(),
    setWinSize: vi.fn(),
    setManualResized: vi.fn(),
  })),
}));

// Mock layout utils
vi.mock('../../utils/layout', () => ({
  calcAutoHeight: vi.fn(() => 200),
}));

describe('useWindowState', () => {
  const mockSetIsEditing = vi.fn();
  const mockSetWinSize = vi.fn();
  const mockSetManualResized = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useCodegenStore).mockReturnValue({
      editor: { code: 'console.log(1)', fontSize: 14 },
      window: { showHeader: true },
      isEditing: false,
      winSize: { width: 600, height: 400 },
      manualResized: false,
      setIsEditing: mockSetIsEditing,
      setWinSize: mockSetWinSize,
      setManualResized: mockSetManualResized,
    } as unknown as ReturnType<typeof useCodegenStore>);
  });

  it('应该返回窗口状态', () => {
    const { result } = renderHook(() => useWindowState());

    expect(result.current.winSize).toEqual({ width: 600, height: 400 });
    expect(result.current.isEditing).toBe(false);
  });

  it('应该返回 refs', () => {
    const { result } = renderHook(() => useWindowState());

    expect(result.current.isEditingRef).toBeDefined();
    expect(result.current.exitEditRef).toBeDefined();
  });

  it('enterEdit 应该设置编辑状态', () => {
    const { result } = renderHook(() => useWindowState());

    act(() => {
      result.current.enterEdit();
    });

    expect(mockSetIsEditing).toHaveBeenCalledWith(true);
    expect(mockSetManualResized).toHaveBeenCalledWith(false);
  });

  it('exitEdit 应该退出编辑状态并调整高度', () => {
    const { result } = renderHook(() => useWindowState());

    act(() => {
      result.current.exitEdit();
    });

    expect(mockSetIsEditing).toHaveBeenCalledWith(false);
    expect(mockSetWinSize).toHaveBeenCalledWith({
      width: 600,
      height: 200, // 来自 mock calcAutoHeight
    });
  });

  it('getAutoHeight 应该返回计算的高度', () => {
    const { result } = renderHook(() => useWindowState());

    const height = result.current.getAutoHeight();

    expect(height).toBe(200);
  });

  it('应该返回 bindResize 函数', () => {
    const { result } = renderHook(() => useWindowState());

    expect(result.current.bindResize).toBeDefined();
    expect(typeof result.current.bindResize).toBe('function');
  });

  it('手动调整大小后 exitEdit 不应调整高度', () => {
    vi.mocked(useCodegenStore).mockReturnValue({
      editor: { code: 'console.log(1)', fontSize: 14 },
      window: { showHeader: true },
      isEditing: false,
      winSize: { width: 600, height: 400 },
      manualResized: true, // 手动调整过
      setIsEditing: mockSetIsEditing,
      setWinSize: mockSetWinSize,
      setManualResized: mockSetManualResized,
    } as unknown as ReturnType<typeof useCodegenStore>);

    const { result } = renderHook(() => useWindowState());

    act(() => {
      result.current.exitEdit();
    });

    expect(mockSetIsEditing).toHaveBeenCalledWith(false);
    // manualResized 为 true 时不应该调整高度
    expect(mockSetWinSize).not.toHaveBeenCalled();
  });
});
